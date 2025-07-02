import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
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
interface EducationalTrail {
  id?: string;
  title: string;
  description: string;
  category: 'climate' | 'disaster_prevention' | 'sustainability' | 'first_aid';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // em minutos
  modules: TrailModule[];
  isActive: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  completionRequirements: {
    minScore: number; // Pontuação mínima para aprovação
    requiredModules: string[]; // IDs dos módulos obrigatórios
  };
  rewards: {
    points: number;
    badge?: string;
    certificateTemplate?: string;
  };
}

interface TrailModule {
  id: string;
  title: string;
  content: string;
  type: 'reading' | 'video' | 'quiz' | 'interactive';
  order: number;
  isRequired: boolean;
  quiz?: {
    questions: QuizQuestion[];
    passingScore: number;
  };
  videoUrl?: string;
  duration?: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface UserProgress {
  id?: string;
  uid: string;
  trailId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'certified';
  startedAt: any;
  completedAt?: any;
  currentModule: string;
  completedModules: string[];
  moduleScores: Record<string, number>;
  totalScore: number;
  timeSpent: number; // em minutos
  certificateId?: string;
  lastAccessedAt: any;
}

interface Certificate {
  id?: string;
  uid: string;
  trailId: string;
  trailTitle: string;
  completedAt: any;
  score: number;
  issuedAt: any;
  certificateNumber: string;
  isValid: boolean;
}

interface OfficialAlert {
  id?: string;
  title: string;
  message: string;
  alertType: 'weather' | 'flood' | 'fire' | 'earthquake' | 'health' | 'security' | 'general';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  issuedBy: string;
  issuedAt: any;
  expiresAt: any; // RN11: Data de expiração obrigatória
  targetAreas: {
    municipalities: string[];
    states: string[];
    coordinates?: {
      latitude: number;
      longitude: number;
      radius: number; // em km
    }[];
  };
  instructions: string[];
  status: 'active' | 'expired' | 'cancelled';
  updatedAt: any;
  readBy: string[]; // IDs dos usuários que leram
}

const db = getFirestore();

// ===== TRILHAS EDUCACIONAIS =====

/**
 * RN03: Criar trilha educacional (apenas admins)
 */
export const createEducationalTrail = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é admin
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Apenas administradores podem criar trilhas');
  }

  const {
    title,
    description,
    category,
    difficulty = 'beginner',
    modules,
    completionRequirements,
    rewards
  } = request.data;

  // Validar dados
  if (!title || !description || !modules || modules.length === 0) {
    throw new HttpsError('invalid-argument', 'Dados obrigatórios não fornecidos');
  }

  const trail: Omit<EducationalTrail, 'id'> = {
    title,
    description,
    category,
    difficulty,
    estimatedDuration: modules.reduce((total: number, module: any) => total + (module.duration ?? 10), 0),
    modules: modules.map((module: any, index: number) => ({
      ...module,
      id: `module_${index + 1}`,
      order: index + 1
    })),
    isActive: true,
    createdBy: uid,
    createdAt: new Date(),
    updatedAt: new Date(),
    completionRequirements: {
      minScore: completionRequirements?.minScore ?? 70,
      requiredModules: completionRequirements?.requiredModules ?? modules.map((_: any, i: number) => `module_${i + 1}`)
    },
    rewards: {
      points: rewards?.points ?? 100,
      badge: rewards?.badge,
      certificateTemplate: rewards?.certificateTemplate
    }
  };

  const docRef = await db.collection('educationalTrails').add(trail);

  logger.info(`Educational trail created: ${docRef.id}`, {
    creatorId: uid,
    trailId: docRef.id,
    title,
    modulesCount: modules.length,
  });

  return { success: true, trailId: docRef.id };
});

/**
 * RN04: Iniciar trilha educacional (apenas usuários autenticados)
 */
export const startEducationalTrail = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { trailId } = request.data;

  // Verificar se trilha existe
  const trailDoc = await db.collection('educationalTrails').doc(trailId).get();
  if (!trailDoc.exists || !trailDoc.data()?.isActive) {
    throw new HttpsError('not-found', 'Trilha não encontrada ou inativa');
  }

  const trailData = trailDoc.data() as EducationalTrail;

  // Verificar se usuário já iniciou esta trilha
  const existingProgress = await db
    .collection('userProgress')
    .where('uid', '==', uid)
    .where('trailId', '==', trailId)
    .get();

  if (!existingProgress.empty) {
    const progressData = existingProgress.docs[0].data() as UserProgress;
    if (progressData.status === 'completed' || progressData.status === 'certified') {
      throw new HttpsError('already-exists', 'Trilha já foi concluída');
    }
    
    // Atualizar último acesso
    await existingProgress.docs[0].ref.update({
      lastAccessedAt: new Date()
    });
    
    return { success: true, progressId: existingProgress.docs[0].id, alreadyStarted: true };
  }

  // Criar novo progresso
  const progress: Omit<UserProgress, 'id'> = {
    uid,
    trailId,
    status: 'in_progress',
    startedAt: new Date(),
    currentModule: trailData.modules[0].id,
    completedModules: [],
    moduleScores: {},
    totalScore: 0,
    timeSpent: 0,
    lastAccessedAt: new Date(),
  };

  const progressRef = await db.collection('userProgress').add(progress);

  logger.info(`Educational trail started: ${trailId}`, {
    userId: uid,
    trailId,
    progressId: progressRef.id,
  });

  return { success: true, progressId: progressRef.id };
});

/**
 * RN03: Completar módulo e atualizar progresso
 */
export const completeModule = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { progressId, moduleId, quizAnswers, timeSpent = 0 } = request.data;

  // Buscar progresso do usuário
  const progressDoc = await db.collection('userProgress').doc(progressId).get();
  if (!progressDoc.exists) {
    throw new HttpsError('not-found', 'Progresso não encontrado');
  }

  const progressData = progressDoc.data() as UserProgress;
  
  if (progressData.uid !== uid) {
    throw new HttpsError('permission-denied', 'Progresso não pertence ao usuário');
  }

  if (progressData.completedModules.includes(moduleId)) {
    throw new HttpsError('already-exists', 'Módulo já foi completado');
  }

  // Buscar trilha
  const trailDoc = await db.collection('educationalTrails').doc(progressData.trailId).get();
  const trailData = trailDoc.data() as EducationalTrail;
  
  const module = trailData.modules.find(m => m.id === moduleId);
  if (!module) {
    throw new HttpsError('not-found', 'Módulo não encontrado');
  }

  let moduleScore = 100; // Score padrão para módulos sem quiz

  // Avaliar quiz se existir
  if (module.quiz && quizAnswers) {
    moduleScore = calculateQuizScore(module.quiz, quizAnswers);
  }

  // Atualizar progresso
  const updateData: any = {
    completedModules: FieldValue.arrayUnion(moduleId),
    [`moduleScores.${moduleId}`]: moduleScore,
    timeSpent: FieldValue.increment(timeSpent),
    lastAccessedAt: new Date(),
  };

  // Determinar próximo módulo
  const nextModule = trailData.modules.find(m => 
    m.order > module.order && !progressData.completedModules.includes(m.id)
  );
  
  if (nextModule) {
    updateData.currentModule = nextModule.id;
  }

  // Verificar se trilha foi completada
  const newCompletedModules = [...progressData.completedModules, moduleId];
  const requiredCompleted = trailData.completionRequirements.requiredModules.every(
    reqModule => newCompletedModules.includes(reqModule)
  );

  if (requiredCompleted) {
    // Calcular score total
    const scores = {...progressData.moduleScores, [moduleId]: moduleScore};
    const totalScore = Object.values(scores)
      .reduce((sum: number, score) => sum + (score as number), 0) / newCompletedModules.length;

    updateData.totalScore = totalScore;
    updateData.completedAt = new Date();

    // RN03: Verificar se atende aos requisitos para certificação
    if (totalScore >= trailData.completionRequirements.minScore) {
      updateData.status = 'completed';
      
      // Gerar certificado automaticamente
      await generateCertificate(uid, progressData.trailId, totalScore);
      updateData.status = 'certified';
    } else {
      updateData.status = 'completed';
    }
  }

  await db.collection('userProgress').doc(progressId).update(updateData);

  logger.info(`Module completed: ${moduleId}`, {
    userId: uid,
    progressId,
    moduleId,
    moduleScore,
    isTrailCompleted: !!updateData.completedAt,
  });

  return {
    success: true,
    moduleScore,
    isTrailCompleted: !!updateData.completedAt,
    isCertified: updateData.status === 'certified'
  };
});

/**
 * RN03: Gerar certificado automaticamente
 */
async function generateCertificate(uid: string, trailId: string, score: number) {
  const trailDoc = await db.collection('educationalTrails').doc(trailId).get();
  const trailData = trailDoc.data() as EducationalTrail;

  const certificateNumber = `CERT-${Date.now()}-${uid.substring(0, 8).toUpperCase()}`;

  const certificate: Omit<Certificate, 'id'> = {
    uid,
    trailId,
    trailTitle: trailData.title,
    completedAt: new Date(),
    score,
    issuedAt: new Date(),
    certificateNumber,
    isValid: true,
  };

  const certRef = await db.collection('certificates').add(certificate);

  // Atualizar progresso com ID do certificado
  const progressQuery = await db
    .collection('userProgress')
    .where('uid', '==', uid)
    .where('trailId', '==', trailId)
    .get();

  if (!progressQuery.empty) {
    await progressQuery.docs[0].ref.update({
      certificateId: certRef.id
    });
  }

  // Adicionar pontos ao usuário
  await db.collection('users').doc(uid).update({
    'gamification.totalPoints': FieldValue.increment(trailData.rewards.points),
    'gamification.certificates': FieldValue.arrayUnion(certRef.id),
    updatedAt: new Date(),
  });

  logger.info(`Certificate generated: ${certRef.id}`, {
    userId: uid,
    trailId,
    certificateNumber,
    score,
  });
}

// ===== ALERTAS OFICIAIS =====

/**
 * RN11: Criar alerta oficial (apenas Defesa Civil e Admins)
 */
export const createOfficialAlert = onCall(async (request) => {
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
    throw new HttpsError('permission-denied', 'Apenas Defesa Civil e Admins podem criar alertas oficiais');
  }

  const {
    title,
    message,
    alertType,
    severity,
    expiresAt,
    targetAreas,
    instructions = []
  } = request.data;

  // Validar dados obrigatórios
  if (!title || !message || !alertType || !severity || !expiresAt) {
    throw new HttpsError('invalid-argument', 'Dados obrigatórios não fornecidos');
  }

  // RN11: Validar data de expiração
  const expirationDate = new Date(expiresAt);
  if (expirationDate <= new Date()) {
    throw new HttpsError('invalid-argument', 'Data de expiração deve ser futura');
  }

  const alert: Omit<OfficialAlert, 'id'> = {
    title,
    message,
    alertType,
    severity,
    issuedBy: uid,
    issuedAt: new Date(),
    expiresAt: expirationDate,
    targetAreas: targetAreas ?? { municipalities: [], states: [] },
    instructions,
    status: 'active',
    updatedAt: new Date(),
    readBy: [],
  };

  const docRef = await db.collection('officialAlerts').add(alert);

  // Notificar usuários na área afetada
  await notifyUsersInTargetAreas(docRef.id, targetAreas, severity);

  logger.info(`Official alert created: ${docRef.id}`, {
    issuerId: uid,
    alertId: docRef.id,
    alertType,
    severity,
    expiresAt: expirationDate,
  });

  return { success: true, alertId: docRef.id };
});

/**
 * RN11: Listar alertas oficiais ativos
 */
export const getActiveOfficialAlerts = onCall(async (request) => {
  const { limit = 20 } = request.data ?? {};

  const now = new Date();
  
  let query = db.collection('officialAlerts')
    .where('status', '==', 'active')
    .where('expiresAt', '>', now)
    .orderBy('expiresAt', 'asc')
    .orderBy('issuedAt', 'desc')
    .limit(limit);

  const snapshot = await query.get();
  let alerts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Filtrar por localização se fornecida (filtro em memória)
  if (request.data?.userLocation) {
    const userLat = request.data.userLocation.latitude;
    const userLng = request.data.userLocation.longitude;
    
    alerts = alerts.filter((alert: any) => {
      if (!alert.targetAreas || alert.targetAreas.length === 0) return true; // Alertas globais
      
      return alert.targetAreas.some((area: any) => {
        if (area.type === 'circle' && area.center) {
          const distance = calculateDistance(
            userLat, userLng,
            area.center.latitude, area.center.longitude
          );
          return distance <= (area.radius ?? 50); // Default 50km
        }
        return true; // Outros tipos de área sempre incluídos
      });
    });
  }

  return { alerts };
});

/**
 * RN11: Marcar alerta como lido
 */
export const markAlertAsRead = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { alertId } = request.data;

  const alertDoc = await db.collection('officialAlerts').doc(alertId).get();
  if (!alertDoc.exists) {
    throw new HttpsError('not-found', 'Alerta não encontrado');
  }

  const alertData = alertDoc.data() as OfficialAlert;
  
  if (!alertData.readBy.includes(uid)) {
    await db.collection('officialAlerts').doc(alertId).update({
      readBy: FieldValue.arrayUnion(uid)
    });
  }

  return { success: true };
});

/**
 * RN11: Trigger para expirar alertas automaticamente
 */
export const expireOfficialAlerts = onDocumentUpdated('officialAlerts/{alertId}', async (event) => {
  const alertData = event.data?.after.data() as OfficialAlert;
  const alertId = event.params.alertId;

  if (!alertData || alertData.status !== 'active') return;

  const now = new Date();
  const expiresAt = alertData.expiresAt.toDate();

  // RN11: Verificar se alerta expirou
  if (expiresAt <= now && alertData.status === 'active') {
    await db.collection('officialAlerts').doc(alertId).update({
      status: 'expired',
      updatedAt: new Date(),
    });

    logger.info(`Official alert expired: ${alertId}`, {
      alertId,
      expiresAt,
    });
  }
});

// ===== EDUCATIONAL CONTENT FUNCTIONS =====

/**
 * Get educational content with filters
 */
export const getEducationalContent = onCall<{
  contentId?: string;
  category?: string;
  difficulty?: string;
  featured?: boolean;
  limit?: number;
}>({
  cors: true,
}, async (request) => {
  try {
    const { contentId, category, difficulty, featured, limit = 20 } = request.data || {};
    
    // Mock educational content for now
    const mockContent = [
      {
        id: '1',
        title: 'Mudanças Climáticas: O Básico',
        description: 'Introdução às mudanças climáticas e seus impactos',
        content: 'Conteúdo educacional sobre mudanças climáticas...',
        type: 'article' as const,
        category: 'climate_change' as const,
        difficulty: 'beginner' as const,
        tags: ['clima', 'aquecimento global', 'básico'],
        duration: 15,
        readingTime: 10,
        published: true,
        featured: true,
        views: 1250,
        likes: 89,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        authorId: 'admin',
        authorName: 'Equipe ClimACT'
      },
      {
        id: '2',
        title: 'Como Preparar um Kit de Emergência',
        description: 'Guia prático para montar seu kit de emergência',
        content: 'Conteúdo sobre preparação para emergências...',
        type: 'article' as const,
        category: 'emergency_response' as const,
        difficulty: 'beginner' as const,
        tags: ['emergência', 'preparação', 'kit'],
        duration: 20,
        readingTime: 15,
        published: true,
        featured: true,
        views: 890,
        likes: 67,
        createdAt: '2025-01-02',
        updatedAt: '2025-01-16',
        authorId: 'admin',
        authorName: 'Equipe ClimACT'
      },
      {
        id: '3',
        title: 'Práticas Sustentáveis no Dia a Dia',
        description: 'Dicas simples para um estilo de vida mais sustentável',
        content: 'Conteúdo sobre sustentabilidade...',
        type: 'infographic' as const,
        category: 'sustainability' as const,
        difficulty: 'beginner' as const,
        tags: ['sustentabilidade', 'ecologia', 'dicas'],
        duration: 10,
        readingTime: 8,
        published: true,
        featured: false,
        views: 654,
        likes: 45,
        createdAt: '2025-01-03',
        updatedAt: '2025-01-17',
        authorId: 'admin',
        authorName: 'Equipe ClimACT'
      }
    ];

    let filteredContent = mockContent;

    // Apply filters
    if (contentId) {
      filteredContent = filteredContent.filter(content => content.id === contentId);
    }
    
    if (category) {
      filteredContent = filteredContent.filter(content => content.category === category);
    }
    
    if (difficulty) {
      filteredContent = filteredContent.filter(content => content.difficulty === difficulty);
    }
    
    if (featured !== undefined) {
      filteredContent = filteredContent.filter(content => content.featured === featured);
    }

    // Apply limit
    if (limit && limit > 0) {
      filteredContent = filteredContent.slice(0, limit);
    }

    return {
      content: filteredContent
    };
  } catch (error) {
    logger.error('Error getting educational content:', error);
    throw new HttpsError('internal', 'Failed to get educational content');
  }
});

// Funções auxiliares

/**
 * Calcular score do quiz
 */
function calculateQuizScore(quiz: any, answers: Record<string, number>): number {
  const questions = quiz.questions;
  let correctAnswers = 0;

  questions.forEach((question: any) => {
    if (answers[question.id] === question.correctAnswer) {
      correctAnswers++;
    }
  });

  return Math.round((correctAnswers / questions.length) * 100);
}

/**
 * Notificar usuários nas áreas afetadas
 */
async function notifyUsersInTargetAreas(alertId: string, targetAreas: any, severity: string) {
  try {
    // Determinar prioridade baseada na severidade
    let priority: string;
    if (severity === 'emergency') {
      priority = 'critical';
    } else if (severity === 'critical') {
      priority = 'high';
    } else {
      priority = 'medium';
    }

    const notification = {
      type: 'official_alert',
      title: 'Novo Alerta Oficial',
      message: `Novo alerta de ${severity} foi emitido para sua região`,
      data: {
        alertId,
        severity,
        targetAreas
      },
      createdAt: new Date(),
      isRead: false,
      priority,
    };

    // Implementar filtro básico por localização dos usuários
    // Buscar usuários que tenham localização definida no perfil
    const usersQuery = await db.collection('users')
      .where('isActive', '==', true)
      .get();

    const notificationPromises = [];
    
    for (const userDoc of usersQuery.docs) {
      const userData = userDoc.data();
      let shouldNotify = true;

      // Se há áreas alvo definidas, verificar se usuário está na área
      if (targetAreas && targetAreas.length > 0 && userData.location) {
        shouldNotify = targetAreas.some((area: any) => {
          if (area.type === 'circle' && area.center) {
            const distance = calculateDistance(
              userData.location.latitude, userData.location.longitude,
              area.center.latitude, area.center.longitude
            );
            return distance <= (area.radius ?? 50); // Default 50km
          }
          return true; // Outros tipos de área sempre incluídos
        });
      }

      if (shouldNotify) {
        notificationPromises.push(
          db.collection('notifications').add({
            ...notification,
            uid: userDoc.id,
            targetRole: userData.role
          })
        );
      }
    }

    await Promise.all(notificationPromises);

    logger.info(`Users notified of official alert: ${alertId}`, {
      alertId,
      severity,
      targetAreas,
    });
  } catch (error) {
    logger.error(`Error notifying users of official alert: ${alertId}`, error);
  }
}
