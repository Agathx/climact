import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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
interface Report {
  id?: string;
  uid: string;
  incidentType: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  severity: string;
  status: 'pendente_ia' | 'pendente_comunidade' | 'aprovado' | 'rejeitado_defesa_civil';
  mediaUrls: string[];
  submittedAt: any;
  aiAnalysis?: {
    score: number;
    recommendation: string;
    reasons: string[];
    processedAt: any;
  };
  communityValidation?: {
    upvotes: number;
    downvotes: number;
    validators: string[];
    validatedAt: any;
  };
  finalReview?: {
    reviewedBy: string;
    decision: string;
    reason?: string;
    reviewedAt: any;
  };
}

interface AILog {
  id?: string;
  type: 'report_analysis' | 'chat_moderation' | 'content_filter';
  entityId: string;
  aiDecision: string;
  confidence: number;
  reasoning: string[];
  inputData: any;
  outputData: any;
  processedAt: any;
  reviewedBy?: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
}

const db = getFirestore();

/**
 * RN02: Submeter novo relatório com análise IA inicial
 */
export const submitReport = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // RN04: Verificar se usuário está autenticado
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const {
    incidentType,
    description,
    location,
    severity,
    mediaUrls = []
  } = request.data;

  // Validar dados obrigatórios
  if (!incidentType || !description || !location) {
    throw new HttpsError('invalid-argument', 'Dados obrigatórios não fornecidos');
  }

  // Criar relatório inicial
  const report: Omit<Report, 'id'> = {
    uid,
    incidentType,
    description,
    location,
    severity: severity ?? 'media',
    status: 'pendente_ia',
    mediaUrls,
    submittedAt: new Date(),
  };

  const docRef = await db.collection('reports').add(report);

  logger.info(`Report submitted: ${docRef.id}`, {
    userId: uid,
    reportId: docRef.id,
    incidentType,
    severity,
  });

  return { success: true, reportId: docRef.id };
});

/**
 * RN02: Análise automática de relatório por IA (trigger)
 */
export const analyzeReportWithAI = onDocumentCreated('reports/{reportId}', async (event) => {
  const reportData = event.data?.data() as Report;
  const reportId = event.params.reportId;

  if (!reportData || reportData.status !== 'pendente_ia') {
    return;
  }

  try {
    // Analisar conteúdo com IA
    const analysisResult = await analyzeContentWithAI(reportData.description, reportData.incidentType);
    
    // RN09: Registrar decisão da IA em logs
    const aiLog: Omit<AILog, 'id'> = {
      type: 'report_analysis',
      entityId: reportId,
      aiDecision: analysisResult.recommendation,
      confidence: analysisResult.score,
      reasoning: analysisResult.reasons,
      inputData: {
        description: reportData.description,
        incidentType: reportData.incidentType,
        severity: reportData.severity
      },
      outputData: analysisResult,
      processedAt: new Date(),
      reviewStatus: 'pending'
    };

    await db.collection('aiLogs').add(aiLog);

    // Atualizar relatório com análise da IA
    const updateData: Partial<Report> = {
      aiAnalysis: {
        score: analysisResult.score,
        recommendation: analysisResult.recommendation,
        reasons: analysisResult.reasons,
        processedAt: new Date(),
      }
    };

    // RN02: Determinar próximo status baseado na análise da IA
    if (analysisResult.score >= 0.8 && analysisResult.recommendation === 'approve') {
      // Aprovação automática para relatórios de alta confiança
      updateData.status = 'aprovado';
    } else if (analysisResult.score <= 0.3 && analysisResult.recommendation === 'reject') {
      // Rejeição automática para relatórios de baixa confiança
      updateData.status = 'rejeitado_defesa_civil';
    } else {
      // Enviar para validação comunitária
      updateData.status = 'pendente_comunidade';
      updateData.communityValidation = {
        upvotes: 0,
        downvotes: 0,
        validators: [],
        validatedAt: new Date(),
      };
    }

    await db.collection('reports').doc(reportId).update(updateData);

    logger.info(`Report analyzed by AI: ${reportId}`, {
      reportId,
      aiScore: analysisResult.score,
      recommendation: analysisResult.recommendation,
      newStatus: updateData.status,
    });

  } catch (error) {
    logger.error(`Error analyzing report with AI: ${reportId}`, error);
    
    // Em caso de erro, enviar para validação comunitária
    await db.collection('reports').doc(reportId).update({
      status: 'pendente_comunidade',
      communityValidation: {
        upvotes: 0,
        downvotes: 0,
        validators: [],
        validatedAt: new Date(),
      }
    });
  }
});

/**
 * Verifica se o usuário pode votar no relatório
 */
async function canUserVoteOnReport(reportId: string, uid: string): Promise<Report> {
  const reportDoc = await db.collection('reports').doc(reportId).get();
  if (!reportDoc.exists) {
    throw new HttpsError('not-found', 'Relatório não encontrado');
  }

  const report = reportDoc.data() as Report;
  
  if (report.status !== 'pendente_comunidade') {
    throw new HttpsError('failed-precondition', 'Relatório não está em validação comunitária');
  }

  const communityValidation = report.communityValidation || {
    upvotes: 0,
    downvotes: 0,
    validators: [],
    validatedAt: new Date(),
  };

  if (communityValidation.validators.includes(uid)) {
    throw new HttpsError('already-exists', 'Usuário já votou neste relatório');
  }

  return report;
}

/**
 * Aplica o voto e verifica se deve aprovar automaticamente
 */
async function applyVoteAndCheckApproval(reportId: string, vote: string, communityValidation: any, uid: string) {
  const updateData: any = {
    'communityValidation.validators': FieldValue.arrayUnion(uid)
  };

  if (vote === 'up') {
    updateData['communityValidation.upvotes'] = FieldValue.increment(1);
  } else if (vote === 'down') {
    updateData['communityValidation.downvotes'] = FieldValue.increment(1);
  } else {
    throw new HttpsError('invalid-argument', 'Voto inválido');
  }

  await db.collection('reports').doc(reportId).update(updateData);

  // Verificar se já tem votos suficientes para decisão automática
  const totalVotes = (communityValidation.upvotes + (vote === 'up' ? 1 : 0)) + 
                    (communityValidation.downvotes + (vote === 'down' ? 1 : 0));
  
  if (totalVotes >= 5) { // Mínimo 5 votos para decisão
    const upvotes = communityValidation.upvotes + (vote === 'up' ? 1 : 0);
    const downvotes = communityValidation.downvotes + (vote === 'down' ? 1 : 0);
    
    if (upvotes > downvotes && upvotes >= 3) {
      // Maioria aprova - publicar automaticamente
      await db.collection('reports').doc(reportId).update({
        status: 'aprovado',
        'communityValidation.validatedAt': new Date(),
      });
    }
    // Nota: downvotes mantém status para revisão manual da Defesa Civil
  }
}

/**
 * RN02: Validação comunitária de relatórios
 */
export const validateReportCommunity = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { reportId, vote } = request.data; // vote: 'up' | 'down'

  const report = await canUserVoteOnReport(reportId, uid);
  const communityValidation = report.communityValidation || {
    upvotes: 0,
    downvotes: 0,
    validators: [],
    validatedAt: new Date(),
  };

  await applyVoteAndCheckApproval(reportId, vote, communityValidation, uid);

  logger.info(`Community vote on report: ${reportId}`, {
    userId: uid,
    reportId,
    vote,
  });

  return { success: true };
});

/**
 * RN02: Revisão final pela Defesa Civil
 */
export const reviewReportDefesaCivil = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é Defesa Civil ou Admin
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const userData = userDoc.data();
  if (!['defesa_civil', 'admin'].includes(userData?.role)) {
    throw new HttpsError('permission-denied', 'Apenas Defesa Civil e Admins podem revisar relatórios');
  }

  const { reportId, decision, reason } = request.data;

  const reportDoc = await db.collection('reports').doc(reportId).get();
  if (!reportDoc.exists) {
    throw new HttpsError('not-found', 'Relatório não encontrado');
  }

  const finalStatus = decision === 'approve' ? 'aprovado' : 'rejeitado_defesa_civil';

  await db.collection('reports').doc(reportId).update({
    status: finalStatus,
    finalReview: {
      reviewedBy: uid,
      decision,
      reason: reason ?? null,
      reviewedAt: new Date(),
    }
  });

  logger.info(`Report reviewed by Defesa Civil: ${reportId}`, {
    reviewerId: uid,
    reportId,
    decision,
    finalStatus,
  });

  return { success: true };
});

/**
 * Obter relatórios com filtros
 */
export const getReports = onCall(async (request) => {
  const {
    status,
    radius = 10, // km
    limit = 20,
    startAfter
  } = request.data ?? {};

  let query = db.collection('reports').orderBy('submittedAt', 'desc');

  // Filtrar por status
  if (status) {
    query = query.where('status', '==', status) as any;
  }

  // Aplicar limite
  query = query.limit(limit) as any;

  // Paginação
  if (startAfter) {
    const startAfterDoc = await db.collection('reports').doc(startAfter).get();
    query = query.startAfter(startAfterDoc) as any;
  }

  const snapshot = await query.get();
  let reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Filtro por localização geográfica em memória (para múltiplos pontos)
  // Em produção, usar GeoHash ou índices geoespaciais do Firestore
  if (request.data?.location && radius) {
    const userLat = request.data.location.latitude;
    const userLng = request.data.location.longitude;
    
    reports = reports.filter((report: any) => {
      if (!report.location) return true; // Incluir relatórios sem localização
      
      const distance = calculateDistance(
        userLat, userLng,
        report.location.latitude, report.location.longitude
      );
      return distance <= radius;
    });
  }
  
  return { reports };
});

/**
 * Análise de conteúdo com IA (função auxiliar)
 */
async function analyzeContentWithAI(description: string, incidentType: string): Promise<{
  score: number;
  recommendation: string;
  reasons: string[];
}> {
  // Esta é uma implementação simplificada
  // Em produção, usaria Google AI ou outro serviço de ML
  
  const reasons: string[] = [];
  let score = 0.5;
  
  // Palavras-chave que indicam emergência real
  const emergencyKeywords = ['urgente', 'emergência', 'perigo', 'socorro', 'evacuação', 'ferido', 'morto'];
  const suspiciousKeywords = ['teste', 'brincadeira', 'fake', 'mentira'];
  
  const lowerDescription = description.toLowerCase();
  
  // Analisar palavras-chave de emergência
  const emergencyCount = emergencyKeywords.filter(keyword => lowerDescription.includes(keyword)).length;
  if (emergencyCount > 0) {
    score += 0.3;
    reasons.push(`Contém ${emergencyCount} palavra(s) de emergência`);
  }
  
  // Analisar palavras suspeitas
  const suspiciousCount = suspiciousKeywords.filter(keyword => lowerDescription.includes(keyword)).length;
  if (suspiciousCount > 0) {
    score -= 0.4;
    reasons.push(`Contém ${suspiciousCount} palavra(s) suspeita(s)`);
  }
  
  // Analisar tamanho da descrição
  if (description.length > 50) {
    score += 0.1;
    reasons.push('Descrição detalhada');
  } else {
    score -= 0.1;
    reasons.push('Descrição muito curta');
  }
  
  // Analisar tipo de incidente
  const criticalIncidents = ['enchente', 'deslizamento', 'incendio'];
  if (criticalIncidents.includes(incidentType)) {
    score += 0.2;
    reasons.push('Tipo de incidente crítico');
  }
  
  // Limitar score entre 0 e 1
  score = Math.max(0, Math.min(1, score));
  
  let recommendation = 'review';
  if (score >= 0.8) recommendation = 'approve';
  else if (score <= 0.3) recommendation = 'reject';
  
  return {
    score,
    recommendation,
    reasons
  };
}
