import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Obter estatísticas do dashboard do usuário
 */
export const getUserDashboardStats = onCall({
  cors: true,
}, async (request) => {
  try {
    const { data, auth } = request;
    
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const { userId } = data;
    const uid = userId || auth.uid;

    logger.info('Buscando estatísticas do dashboard para usuário:', uid);

    // === OBTER ESTATÍSTICAS REAIS DO FIRESTORE ===

    // 1. Estatísticas de Relatórios
    const reportsRef = db.collection('reports');
    const userReportsQuery = reportsRef.where('createdBy', '==', uid);
    const userReportsSnapshot = await userReportsQuery.get();
    
    const userReports = userReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalReports = userReports.length;
    const pendingReports = userReports.filter((r: any) => r.status === 'pending').length;
    const approvedReports = userReports.filter((r: any) => r.status === 'approved').length;
    const rejectedReports = userReports.filter((r: any) => r.status === 'rejected').length;
    
    // Relatórios deste mês
    const now = new Date();
    const thisMonthReports = userReports.filter((r: any) => {
      const created = r.createdAt?.toDate?.() || new Date(r.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    // 2. Estatísticas de Alertas
    const alertsRef = db.collection('emergencyAlerts');
    const activeAlertsQuery = alertsRef.where('isActive', '==', true);
    const activeAlertsSnapshot = await activeAlertsQuery.get();
    
    const activeAlerts = activeAlertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const criticalAlerts = activeAlerts.filter((a: any) => a.severity === 'critical').length;
    
    // Alertas desta semana
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekAlerts = activeAlerts.filter((a: any) => {
      const created = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return created >= weekAgo;
    }).length;

    // 3. Progresso Educacional
    const userProfileRef = db.collection('users').doc(uid);
    const userProfileDoc = await userProfileRef.get();
    const userProfile = userProfileDoc.data() || {};
    
    const completedModules = userProfile.education?.completedModules?.length || 0;
    const certificates = userProfile.education?.certificates?.length || 0;
    const totalModules = 20; // Total de módulos disponíveis
    const progressPercentage = Math.round((completedModules / totalModules) * 100);

    // 4. Dados da Comunidade
    const communityPoints = userProfile.community?.points || 0;
    const rank = userProfile.community?.rank || 0;
    const contributions = userProfile.community?.contributions || 0;
    const volunteersConnected = userProfile.community?.volunteersConnected || 0;

    // 5. Doações
    const donationsRef = db.collection('donationRequests');
    const activeDonationsQuery = donationsRef.where('status', '==', 'active');
    const activeDonationsSnapshot = await activeDonationsQuery.get();
    const activeDonations = activeDonationsSnapshot.size;

    const fulfilledDonationsQuery = donationsRef.where('status', '==', 'fulfilled');
    const fulfilledDonationsSnapshot = await fulfilledDonationsQuery.get();
    const fulfilledDonations = fulfilledDonationsSnapshot.size;

    // Construir resposta no formato esperado
    const dashboardStats = {
      reports: {
        total: totalReports,
        pending: pendingReports,
        approved: approvedReports,
        rejected: rejectedReports,
        thisMonth: thisMonthReports,
        trend: {
          type: 'neutral' as const,
          percentage: 0
        }
      },
      alerts: {
        active: activeAlerts.length,
        total: activeAlerts.length,
        critical: criticalAlerts,
        thisWeek: thisWeekAlerts
      },
      education: {
        completedModules,
        totalModules,
        progressPercentage,
        certificates
      },
      community: {
        points: communityPoints,
        rank,
        contributions,
        volunteersConnected
      },
      emergencyAlerts: {
        active: activeAlerts.length,
        acknowledged: userProfile.alerts?.acknowledged?.length || 0,
        inMyArea: activeAlerts.length // Simplificado por enquanto
      },
      donations: {
        activeRequests: activeDonations,
        fulfilled: fulfilledDonations,
        totalValue: 0, // Seria necessário somar valores
        thisMonth: 0   // Seria necessário filtrar por mês
      }
    };

    logger.info('Estatísticas calculadas:', dashboardStats);

    return dashboardStats;

  } catch (error: any) {
    logger.error('Erro ao obter estatísticas do dashboard:', error);
    throw new HttpsError('internal', error.message || 'Erro interno do servidor');
  }
});

/**
 * Obter atividades recentes do usuário
 */
export const getUserRecentActivity = onCall({
  cors: true,
}, async (request) => {
  try {
    const { data, auth } = request;
    
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const { userId, limit = 10, activityTypes } = data;
    const uid = userId || auth.uid;

    logger.info('Buscando atividades recentes para usuário:', uid);

    // Buscar atividades da collection userActivities
    const activitiesRef = db.collection('userActivities');
    let query = activitiesRef
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (activityTypes && activityTypes.length > 0) {
      query = query.where('type', 'in', activityTypes);
    }

    const activitiesSnapshot = await query.get();
    
    const activities = activitiesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        title: data.title,
        description: data.description,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date(data.timestamp).toISOString(),
        location: data.location,
        status: data.status,
        metadata: data.metadata
      };
    });

    return { activities };

  } catch (error: any) {
    logger.error('Erro ao obter atividades recentes:', error);
    throw new HttpsError('internal', error.message || 'Erro interno do servidor');
  }
});
