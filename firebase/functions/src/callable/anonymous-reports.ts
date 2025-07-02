import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { randomBytes } from 'crypto';

// Tipos locais
interface AnonymousReport {
  id?: string;
  protocol: string; // Protocolo único para acompanhamento
  reportType: 'safety' | 'fraud' | 'abuse' | 'content' | 'other';
  description: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  evidenceUrls?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'received' | 'under_review' | 'investigating' | 'resolved' | 'closed';
  submittedAt: any;
  updatedAt: any;
  // RN07: Nenhum dado do denunciante é armazenado
  response?: {
    message: string;
    respondedBy: string;
    respondedAt: any;
  };
  escalatedTo?: string; // ID do órgão responsável
}

interface AnonymousReportStatus {
  protocol: string;
  status: string;
  lastUpdate: any;
  responseMessage?: string;
  canReceiveUpdates: boolean;
}

const db = getFirestore();

/**
 * RN07: Submeter denúncia anônima
 * Não armazena nenhum dado identificador do denunciante
 */
export const submitAnonymousReport = onCall(async (request) => {
  // RN07: Não requer autenticação para garantir anonimato
  const {
    reportType,
    description,
    location,
    evidenceUrls = [],
    severity = 'medium'
  } = request.data;

  // Validar dados obrigatórios
  if (!reportType || !description) {
    throw new HttpsError('invalid-argument', 'Tipo e descrição da denúncia são obrigatórios');
  }

  if (description.length < 20) {
    throw new HttpsError('invalid-argument', 'Descrição deve ter pelo menos 20 caracteres');
  }

  if (description.length > 2000) {
    throw new HttpsError('invalid-argument', 'Descrição não pode exceder 2000 caracteres');
  }

  // Gerar protocolo único e anônimo
  const protocol = generateAnonymousProtocol();

  // RN07: Criar denúncia sem qualquer vínculo com usuário
  const anonymousReport: Omit<AnonymousReport, 'id'> = {
    protocol,
    reportType,
    description: description.trim(),
    location: location ?? null,
    evidenceUrls,
    severity,
    status: 'received',
    submittedAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await db.collection('anonymousReports').add(anonymousReport);

  // Criar entrada para consulta de status (sem dados sensíveis)
  const statusEntry: AnonymousReportStatus = {
    protocol,
    status: 'received',
    lastUpdate: new Date(),
    canReceiveUpdates: true,
  };

  await db.collection('anonymousReportStatus').doc(protocol).set(statusEntry);

  // Notificar moderadores/administradores
  await notifyModeratorsAnonymousReport(docRef.id, reportType, severity);

  logger.info(`Anonymous report submitted: ${protocol}`, {
    reportId: docRef.id,
    protocol,
    reportType,
    severity,
    hasLocation: !!location,
    evidenceCount: evidenceUrls.length,
  });

  return {
    success: true,
    protocol, // Retorna apenas o protocolo para acompanhamento
    message: 'Denúncia recebida com sucesso. Guarde o protocolo para acompanhar o status.'
  };
});

/**
 * RN07: Consultar status de denúncia anônima por protocolo
 */
export const getAnonymousReportStatus = onCall(async (request) => {
  const { protocol } = request.data;

  if (!protocol || typeof protocol !== 'string') {
    throw new HttpsError('invalid-argument', 'Protocolo é obrigatório');
  }

  // Buscar status da denúncia
  const statusDoc = await db.collection('anonymousReportStatus').doc(protocol).get();
  
  if (!statusDoc.exists) {
    throw new HttpsError('not-found', 'Protocolo não encontrado');
  }

  const statusData = statusDoc.data() as AnonymousReportStatus;

  logger.info(`Anonymous report status checked: ${protocol}`, {
    protocol,
    status: statusData.status,
  });

  return {
    protocol: statusData.protocol,
    status: statusData.status,
    lastUpdate: statusData.lastUpdate,
    responseMessage: statusData.responseMessage ?? null,
    canReceiveUpdates: statusData.canReceiveUpdates,
  };
});

/**
 * Listar denúncias anônimas (apenas moderadores/admins)
 */
export const listAnonymousReports = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é moderador/admin
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const userData = userDoc.data();
  if (!['admin', 'defesa_civil'].includes(userData?.role)) {
    throw new HttpsError('permission-denied', 'Apenas administradores podem visualizar denúncias');
  }

  const {
    status,
    reportType,
    severity,
    limit = 50,
    startAfter
  } = request.data ?? {};

  let query = db.collection('anonymousReports').orderBy('submittedAt', 'desc');

  // Filtros
  if (status) {
    query = query.where('status', '==', status) as any;
  }
  if (reportType) {
    query = query.where('reportType', '==', reportType) as any;
  }
  if (severity) {
    query = query.where('severity', '==', severity) as any;
  }

  query = query.limit(limit) as any;

  if (startAfter) {
    const startAfterDoc = await db.collection('anonymousReports').doc(startAfter).get();
    query = query.startAfter(startAfterDoc) as any;
  }

  const snapshot = await query.get();
  const reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { reports };
});

/**
 * Atualizar status de denúncia anônima (apenas moderadores/admins)
 */
export const updateAnonymousReportStatus = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar permissões
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const userData = userDoc.data();
  if (!['admin', 'defesa_civil'].includes(userData?.role)) {
    throw new HttpsError('permission-denied', 'Apenas administradores podem atualizar denúncias');
  }

  const {
    reportId,
    status,
    responseMessage,
    escalatedTo
  } = request.data;

  // Buscar denúncia
  const reportDoc = await db.collection('anonymousReports').doc(reportId).get();
  if (!reportDoc.exists) {
    throw new HttpsError('not-found', 'Denúncia não encontrada');
  }

  const reportData = reportDoc.data() as AnonymousReport;

  // Atualizar denúncia
  const updateData: Partial<AnonymousReport> = {
    status,
    updatedAt: new Date(),
  };

  if (responseMessage) {
    updateData.response = {
      message: responseMessage,
      respondedBy: uid,
      respondedAt: new Date(),
    };
  }

  if (escalatedTo) {
    updateData.escalatedTo = escalatedTo;
  }

  await db.collection('anonymousReports').doc(reportId).update(updateData);

  // Atualizar status público
  const statusUpdate: Partial<AnonymousReportStatus> = {
    status,
    lastUpdate: new Date(),
  };

  if (responseMessage) {
    statusUpdate.responseMessage = responseMessage;
  }

  await db.collection('anonymousReportStatus').doc(reportData.protocol).update(statusUpdate);

  logger.info(`Anonymous report updated: ${reportData.protocol}`, {
    reportId,
    protocol: reportData.protocol,
    newStatus: status,
    updatedBy: uid,
    hasResponse: !!responseMessage,
  });

  return { success: true };
});

/**
 * Responder à denúncia anônima
 */
export const respondToAnonymousReport = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar permissões
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const userData = userDoc.data();
  if (!['admin', 'defesa_civil'].includes(userData?.role)) {
    throw new HttpsError('permission-denied', 'Apenas administradores podem responder denúncias');
  }

  const { reportId, responseMessage } = request.data;

  if (!responseMessage || responseMessage.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Mensagem de resposta é obrigatória');
  }

  // Buscar denúncia
  const reportDoc = await db.collection('anonymousReports').doc(reportId).get();
  if (!reportDoc.exists) {
    throw new HttpsError('not-found', 'Denúncia não encontrada');
  }

  const reportData = reportDoc.data() as AnonymousReport;

  // Atualizar com resposta
  await db.collection('anonymousReports').doc(reportId).update({
    response: {
      message: responseMessage.trim(),
      respondedBy: uid,
      respondedAt: new Date(),
    },
    updatedAt: new Date(),
  });

  // Atualizar status público
  await db.collection('anonymousReportStatus').doc(reportData.protocol).update({
    responseMessage: responseMessage.trim(),
    lastUpdate: new Date(),
  });

  logger.info(`Anonymous report response added: ${reportData.protocol}`, {
    reportId,
    protocol: reportData.protocol,
    respondedBy: uid,
  });

  return { success: true };
});

/**
 * Obter estatísticas de denúncias anônimas (apenas admins)
 */
export const getAnonymousReportsStats = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é admin
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Apenas administradores podem visualizar estatísticas');
  }

  // Buscar estatísticas básicas
  const totalSnapshot = await db.collection('anonymousReports').count().get();
  const pendingSnapshot = await db.collection('anonymousReports')
    .where('status', 'in', ['received', 'under_review', 'investigating'])
    .count().get();
  
  const resolvedSnapshot = await db.collection('anonymousReports')
    .where('status', '==', 'resolved')
    .count().get();

  // Estatísticas por tipo
  const typeStats = await getStatsByField('reportType');
  const severityStats = await getStatsByField('severity');
  const statusStats = await getStatsByField('status');

  return {
    total: totalSnapshot.data().count,
    pending: pendingSnapshot.data().count,
    resolved: resolvedSnapshot.data().count,
    byType: typeStats,
    bySeverity: severityStats,
    byStatus: statusStats,
  };
});

// Funções auxiliares

/**
 * Gerar protocolo anônimo único
 */
function generateAnonymousProtocol(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `ANON-${timestamp}-${random}`;
}

/**
 * Notificar moderadores sobre nova denúncia anônima
 */
async function notifyModeratorsAnonymousReport(reportId: string, reportType: string, severity: string) {
  try {
    // Determinar prioridade baseada na severidade
    let priority: string;
    if (severity === 'critical') {
      priority = 'high';
    } else if (severity === 'high') {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    const notification = {
      type: 'anonymous_report_received',
      title: 'Nova denúncia anônima recebida',
      message: `Denúncia do tipo "${reportType}" com severidade "${severity}" foi recebida`,
      targetRoles: ['admin', 'defesa_civil'],
      data: {
        reportId,
        reportType,
        severity
      },
      createdAt: new Date(),
      isRead: false,
      priority,
    };

    await db.collection('notifications').add(notification);

    logger.info(`Moderators notified of anonymous report: ${reportId}`, {
      reportId,
      reportType,
      severity,
    });
  } catch (error) {
    logger.error(`Error notifying moderators of anonymous report: ${reportId}`, error);
  }
}

/**
 * Obter estatísticas por campo
 */
async function getStatsByField(fieldName: string): Promise<Record<string, number>> {
  const snapshot = await db.collection('anonymousReports').get();
  const stats: Record<string, number> = {};
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const value = data[fieldName];
    if (value) {
      stats[value] = (stats[value] || 0) + 1;
    }
  });
  
  return stats;
}
