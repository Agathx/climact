import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Função utilitária para calcular distância entre coordenadas (fórmula de Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Tipos locais
interface DonationRequest {
  id?: string;
  createdBy: string; // UID do usuário que criou
  organizationName: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  requestType: 'need' | 'offer';
  category: 'food' | 'clothing' | 'medicine' | 'shelter' | 'transportation' | 'money' | 'other';
  items: DonationItem[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
  };
  description: string;
  status: 'active' | 'partially_fulfilled' | 'fulfilled' | 'expired' | 'cancelled';
  createdAt: any;
  updatedAt: any;
  expiresAt: any;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  matches: string[]; // IDs de requests correspondentes
}

interface DonationItem {
  name: string;
  quantity: number;
  unit: string;
  description?: string;
  fulfilled: number; // Quantidade já atendida
}

interface DataExportRequest {
  id?: string;
  uid: string;
  requestType: 'export' | 'deletion' | 'portability';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: any;
  completedAt?: any;
  downloadUrl?: string;
  expiresAt?: any; // Para downloads temporários
  reason?: string; // Para solicitações de exclusão
}

const db = getFirestore();

// ===== RN06: SISTEMA DE DOAÇÕES =====

/**
 * RN06: Criar solicitação de doação (apenas ONGs e usuários validados)
 */
export const createDonationRequest = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // RN06: Verificar se é ONG ou usuário validado
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const userData = userDoc.data();
  const allowedRoles = ['ong', 'defesa_civil', 'admin'];
  const isValidVolunteer = userData?.role === 'voluntario' && userData?.status === 'active';
  
  if (!allowedRoles.includes(userData?.role) && !isValidVolunteer) {
    throw new HttpsError('permission-denied', 'Apenas ONGs e usuários validados podem criar solicitações de doação');
  }

  const {
    organizationName,
    contactInfo,
    requestType,
    category,
    items,
    urgency = 'medium',
    location,
    description,
    expiresAt
  } = request.data;

  // Validar dados obrigatórios
  if (!organizationName || !contactInfo || !requestType || !category || !items || !location || !description) {
    throw new HttpsError('invalid-argument', 'Dados obrigatórios não fornecidos');
  }

  if (!['need', 'offer'].includes(requestType)) {
    throw new HttpsError('invalid-argument', 'Tipo de solicitação inválido');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Lista de itens é obrigatória');
  }

  // Validar data de expiração
  const expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias padrão
  if (expirationDate <= new Date()) {
    throw new HttpsError('invalid-argument', 'Data de expiração deve ser futura');
  }

  const donationRequest: Omit<DonationRequest, 'id'> = {
    createdBy: uid,
    organizationName,
    contactInfo,
    requestType,
    category,
    items: items.map((item: any) => ({
      ...item,
      fulfilled: 0
    })),
    urgency,
    location,
    description,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: expirationDate,
    verificationStatus: userData?.role === 'ong' ? 'verified' : 'pending', // ONGs já são verificadas
    matches: []
  };

  const docRef = await db.collection('donationRequests').add(donationRequest);

  // Buscar matches automáticos
  await findDonationMatches(docRef.id, donationRequest);

  logger.info(`Donation request created: ${docRef.id}`, {
    userId: uid,
    requestId: docRef.id,
    requestType,
    category,
    urgency,
  });

  return { success: true, requestId: docRef.id };
});

/**
 * RN06: Buscar solicitações de doação com filtros
 */
export const searchDonationRequests = onCall(async (request) => {
  const {
    requestType,
    category,
    urgency,
    radius = 50, // km
    status = 'active',
    limit = 20
  } = request.data ?? {};

  let query = db.collection('donationRequests')
    .where('status', '==', status)
    .where('verificationStatus', '==', 'verified')
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (requestType) {
    query = query.where('requestType', '==', requestType) as any;
  }

  if (category) {
    query = query.where('category', '==', category) as any;
  }

  if (urgency) {
    query = query.where('urgency', '==', urgency) as any;
  }

  const snapshot = await query.get();
  let requests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Implementar filtro geográfico por distância
  if (request.data?.location && radius) {
    const userLat = request.data.location.latitude;
    const userLng = request.data.location.longitude;
    
    requests = requests.filter((req: any) => {
      if (!req.location) return true; // Incluir requisições sem localização
      
      const distance = calculateDistance(
        userLat, userLng,
        req.location.latitude, req.location.longitude
      );
      return distance <= radius;
    });
  }

  return { requests };
});

/**
 * RN06: Responder a solicitação de doação
 */
export const respondToDonationRequest = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { requestId, message, offeredItems } = request.data;

  const requestDoc = await db.collection('donationRequests').doc(requestId).get();
  if (!requestDoc.exists) {
    throw new HttpsError('not-found', 'Solicitação não encontrada');
  }

  const requestData = requestDoc.data() as DonationRequest;
  
  if (requestData.status !== 'active') {
    throw new HttpsError('failed-precondition', 'Solicitação não está ativa');
  }

  // Criar resposta
  const response = {
    requestId,
    respondedBy: uid,
    message,
    offeredItems: offeredItems ?? [],
    respondedAt: new Date(),
    status: 'pending_contact'
  };

  await db.collection('donationResponses').add(response);

  // Notificar criador da solicitação
  await createNotification({
    type: 'donation_response',
    title: 'Nova resposta à sua solicitação',
    message: `Alguém respondeu à sua solicitação de ${requestData.category}`,
    targetUsers: [requestData.createdBy],
    data: { requestId, responseId: response }
  });

  logger.info(`Donation request response created: ${requestId}`, {
    requestId,
    responderId: uid,
  });

  return { success: true };
});

// ===== RN08 e RN12: GESTÃO DE DADOS PESSOAIS (LGPD) =====

/**
 * RN08/RN12: Solicitar exportação de dados pessoais
 */
export const requestDataExport = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { requestType = 'export', reason } = request.data;

  if (!['export', 'deletion', 'portability'].includes(requestType)) {
    throw new HttpsError('invalid-argument', 'Tipo de solicitação inválido');
  }

  // Verificar se já existe uma solicitação pendente
  const existingRequest = await db
    .collection('dataExportRequests')
    .where('uid', '==', uid)
    .where('status', 'in', ['pending', 'processing'])
    .get();

  if (!existingRequest.empty) {
    throw new HttpsError('already-exists', 'Já existe uma solicitação pendente');
  }

  const exportRequest: Omit<DataExportRequest, 'id'> = {
    uid,
    requestType,
    status: 'pending',
    requestedAt: new Date(),
    reason: requestType === 'deletion' ? reason : undefined
  };

  const docRef = await db.collection('dataExportRequests').add(exportRequest);

  // Notificar administradores para processamento manual
  await createNotification({
    type: 'data_export_request',
    title: 'Nova solicitação LGPD',
    message: `Usuário solicitou ${requestType} de dados pessoais`,
    targetRoles: ['admin'],
    data: { requestId: docRef.id, requestType, userId: uid }
  });

  logger.info(`Data export request created: ${docRef.id}`, {
    userId: uid,
    requestId: docRef.id,
    requestType,
  });

  return {
    success: true,
    requestId: docRef.id,
    message: 'Solicitação registrada. Você será notificado quando estiver pronta.'
  };
});

/**
 * RN08/RN12: Verificar status da solicitação de dados
 */
export const getDataExportStatus = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const userRequests = await db
    .collection('dataExportRequests')
    .where('uid', '==', uid)
    .orderBy('requestedAt', 'desc')
    .limit(10)
    .get();

  const requests = userRequests.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { requests };
});

/**
 * RN12: Obter histórico completo do usuário
 */
export const getUserHistory = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  try {
    // Buscar dados em todas as coleções relevantes
    const [
      userProfile,
      reports,
      chatMessages,
      progress,
      certificates,
      donationRequests,
      donationResponses
    ] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('reports').where('uid', '==', uid).get(),
      db.collection('chatMessages').where('uid', '==', uid).get(),
      db.collection('userProgress').where('uid', '==', uid).get(),
      db.collection('certificates').where('uid', '==', uid).get(),
      db.collection('donationRequests').where('createdBy', '==', uid).get(),
      db.collection('donationResponses').where('respondedBy', '==', uid).get()
    ]);

    const history = {
      profile: userProfile.exists ? userProfile.data() : null,
      reports: reports.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      chatMessages: chatMessages.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      educationalProgress: progress.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      certificates: certificates.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      donationRequests: donationRequests.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      donationResponses: donationResponses.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      generatedAt: new Date(),
    };

    return { history };

  } catch (error) {
    logger.error(`Error getting user history: ${uid}`, error);
    throw new HttpsError('internal', 'Erro ao buscar histórico do usuário');
  }
});

// ===== RN09: LOGS DE IA E AUDITORIA =====

/**
 * RN09: Listar logs de IA (apenas admins)
 */
export const getAILogs = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é admin
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Apenas administradores podem visualizar logs de IA');
  }

  const {
    type,
    entityId,
    startDate,
    endDate,
    reviewStatus,
    limit = 50
  } = request.data ?? {};

  let query = db.collection('aiLogs').orderBy('processedAt', 'desc').limit(limit);

  if (type) {
    query = query.where('type', '==', type) as any;
  }

  if (entityId) {
    query = query.where('entityId', '==', entityId) as any;
  }

  if (reviewStatus) {
    query = query.where('reviewStatus', '==', reviewStatus) as any;
  }

  if (startDate) {
    query = query.where('processedAt', '>=', new Date(startDate)) as any;
  }

  if (endDate) {
    query = query.where('processedAt', '<=', new Date(endDate)) as any;
  }

  const snapshot = await query.get();
  const logs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { logs };
});

/**
 * RN09: Revisar decisão da IA
 */
export const reviewAIDecision = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é admin
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || !['admin', 'defesa_civil'].includes(userDoc.data()?.role)) {
    throw new HttpsError('permission-denied', 'Apenas administradores podem revisar decisões da IA');
  }

  const { logId, reviewDecision, reviewNotes } = request.data;

  if (!['approved', 'rejected', 'needs_revision'].includes(reviewDecision)) {
    throw new HttpsError('invalid-argument', 'Decisão de revisão inválida');
  }

  await db.collection('aiLogs').doc(logId).update({
    reviewStatus: reviewDecision,
    reviewedBy: uid,
    reviewedAt: new Date(),
    reviewNotes: reviewNotes ?? null
  });

  logger.info(`AI decision reviewed: ${logId}`, {
    logId,
    reviewerId: uid,
    reviewDecision,
  });

  return { success: true };
});

// Funções auxiliares

/**
 * Buscar correspondências para doações
 */
async function findDonationMatches(requestId: string, donationRequest: DonationRequest) {
  try {
    const oppositeType = donationRequest.requestType === 'need' ? 'offer' : 'need';
    
    const potentialMatches = await db
      .collection('donationRequests')
      .where('requestType', '==', oppositeType)
      .where('category', '==', donationRequest.category)
      .where('status', '==', 'active')
      .where('verificationStatus', '==', 'verified')
      .get();

    const matches: string[] = [];

    potentialMatches.docs.forEach(doc => {
      const matchData = doc.data() as DonationRequest;
      
      // Verificar se há itens compatíveis
      const hasCompatibleItems = donationRequest.items.some(requestItem =>
        matchData.items.some(matchItem =>
          matchItem.name.toLowerCase().includes(requestItem.name.toLowerCase()) ||
          requestItem.name.toLowerCase().includes(matchItem.name.toLowerCase())
        )
      );

      if (hasCompatibleItems) {
        matches.push(doc.id);
      }
    });

    if (matches.length > 0) {
      await db.collection('donationRequests').doc(requestId).update({
        matches: matches
      });

      // Notificar sobre matches encontrados
      await createNotification({
        type: 'donation_match',
        title: 'Correspondências encontradas!',
        message: `Encontramos ${matches.length} solicitação(ões) compatível(eis) com sua doação`,
        targetUsers: [donationRequest.createdBy],
        data: { requestId, matches }
      });
    }

  } catch (error) {
    logger.error(`Error finding donation matches: ${requestId}`, error);
  }
}

/**
 * Criar notificação
 */
async function createNotification(notification: any) {
  try {
    await db.collection('notifications').add({
      ...notification,
      createdAt: new Date(),
      isRead: false
    });
  } catch (error) {
    logger.error('Error creating notification', error);
  }
}
