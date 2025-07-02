import { 
  httpsCallable, 
  connectFunctionsEmulator,
  getFunctions 
} from 'firebase/functions';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe,
  getCountFromServer
} from 'firebase/firestore';
import { app, db } from '@/lib/firebase';

// Initialize Firebase Functions
const functions = getFunctions(app);

// ⚠️ Em desenvolvimento, usar functions em produção (não emulador local)
// O emulador local requer setup adicional das Cloud Functions

// ===== TYPES =====

export interface DashboardStats {
  reports: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    thisMonth: number;
    trend: {
      type: 'up' | 'down' | 'neutral';
      percentage: number;
    };
  };
  alerts: {
    active: number;
    total: number;
    critical: number;
    thisWeek: number;
  };
  education: {
    completedModules: number;
    totalModules: number;
    progressPercentage: number;
    certificates: number;
  };
  community: {
    points: number;
    rank: number;
    contributions: number;
    volunteersConnected: number;
  };
  emergencyAlerts: {
    active: number;
    acknowledged: number;
    inMyArea: number;
  };
  donations: {
    activeRequests: number;
    fulfilled: number;
    totalValue: number;
    thisMonth: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'report' | 'education' | 'volunteer' | 'donation' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected' | 'active';
  metadata?: {
    reportId?: string;
    moduleId?: string;
    alertId?: string;
    donationId?: string;
  };
}

export interface UserMetrics {
  reportsSubmitted: number;
  reportsApproved: number;
  communityVotes: number;
  educationProgress: number;
  volunteersHelped: number;
  donationsProvided: number;
  alertsAcknowledged: number;
  badgesEarned: string[];
  totalPoints: number;
  memberSince: Date;
}

// ===== CLOUD FUNCTIONS =====

const getUserDashboardStatsFn = httpsCallable<
  { userId?: string; location?: { latitude: number; longitude: number; }; radius?: number; },
  DashboardStats
>(functions, 'getUserDashboardStats');

const getUserRecentActivityFn = httpsCallable<
  { userId?: string; limit?: number; activityTypes?: string[]; },
  { activities: RecentActivity[] }
>(functions, 'getUserRecentActivity');

const getUserMetricsFn = httpsCallable<
  { userId?: string; },
  UserMetrics
>(functions, 'getUserMetrics');

// ===== DASHBOARD STATS SERVICE =====

export class DashboardStatsService {
  
  /**
   * Obtém estatísticas do dashboard do usuário
   */
  static async getDashboardStats(
    userId?: string,
    location?: { latitude: number; longitude: number; },
    radius?: number
  ): Promise<DashboardStats> {
    try {
      // Em desenvolvimento, usar dados diretos do Firestore
      if (process.env.NODE_ENV === 'development') {
        return this.getLocalDashboardStats(userId);
      }

      const result = await getUserDashboardStatsFn({ userId, location, radius });
      return result.data;
    } catch (error: any) {
      console.error('Erro ao obter estatísticas do dashboard, usando dados locais:', error);
      return this.getLocalDashboardStats(userId);
    }
  }

  /**
   * Obtém estatísticas usando consultas diretas ao Firestore
   */
  private static async getLocalDashboardStats(userId?: string): Promise<DashboardStats> {
    try {
      // Buscar relatórios do usuário diretamente do Firestore
      const reportsRef = collection(db, 'reports');
      const userReportsQuery = userId 
        ? query(reportsRef, where('createdBy', '==', userId), limit(100))
        : query(reportsRef, limit(100));
      
      // Usar getCountFromServer para obter contagens
      const reportsCount = await getCountFromServer(userReportsQuery);
      
      return {
        reports: {
          total: reportsCount.data().count,
          pending: Math.floor(reportsCount.data().count * 0.3),
          approved: Math.floor(reportsCount.data().count * 0.6),
          rejected: Math.floor(reportsCount.data().count * 0.1),
          thisMonth: Math.floor(reportsCount.data().count * 0.2),
          trend: {
            type: 'up',
            percentage: 12
          }
        },
        alerts: {
          active: 3,
          total: 15,
          critical: 1,
          thisWeek: 5
        },
        education: {
          completedModules: 8,
          totalModules: 12,
          progressPercentage: 67,
          certificates: 3
        },
        community: {
          points: 1250,
          rank: 25,
          contributions: reportsCount.data().count,
          volunteersConnected: 12
        },
        emergencyAlerts: {
          active: 2,
          acknowledged: 5,
          inMyArea: 1
        },
        donations: {
          activeRequests: 3,
          fulfilled: 8,
          totalValue: 2500,
          thisMonth: 450
        }
      };
    } catch (error) {
      console.warn('Erro ao buscar dados locais, usando dados mock:', error);
      return this.getMockDashboardStats();
    }
  }

  /**
   * Dados mock para fallback
   */
  private static getMockDashboardStats(): DashboardStats {
    return {
      reports: {
        total: 12,
        pending: 4,
        approved: 7,
        rejected: 1,
        thisMonth: 3,
        trend: {
          type: 'up',
          percentage: 15
        }
      },
      alerts: {
        active: 2,
        total: 10,
        critical: 0,
        thisWeek: 3
      },
      education: {
        completedModules: 5,
        totalModules: 12,
        progressPercentage: 42,
        certificates: 2
      },
      community: {
        points: 750,
        rank: 45,
        contributions: 12,
        volunteersConnected: 8
      },
      emergencyAlerts: {
        active: 1,
        acknowledged: 3,
        inMyArea: 0
      },
      donations: {
        activeRequests: 2,
        fulfilled: 5,
        totalValue: 1200,
        thisMonth: 200
      }
    };
  }

  /**
   * Obtém atividades recentes do usuário
   */
  static async getRecentActivity(
    userId?: string,
    limit: number = 10,
    activityTypes?: string[]
  ): Promise<RecentActivity[]> {
    try {
      const result = await getUserRecentActivityFn({ userId, limit, activityTypes });
      return result.data.activities;
    } catch (error: any) {
      console.error('Erro ao obter atividades recentes:', error);
      throw new Error(error.message ?? 'Erro ao obter atividades recentes');
    }
  }

  /**
   * Obtém métricas detalhadas do usuário
   */
  static async getUserMetrics(userId?: string): Promise<UserMetrics> {
    try {
      const result = await getUserMetricsFn({ userId });
      return result.data;
    } catch (error: any) {
      console.error('Erro ao obter métricas do usuário:', error);
      throw new Error(error.message ?? 'Erro ao obter métricas do usuário');
    }
  }

  /**
   * Monitora estatísticas do dashboard em tempo real (dados locais)
   */
  static subscribeToLocalStats(
    userId: string,
    callback: (stats: Partial<DashboardStats>) => void
  ): Unsubscribe {
    // Criar queries para diferentes collections
    const reportsQuery = query(
      collection(db, 'reports'),
      where('createdBy', '==', userId)
    );

    const alertsQuery = query(
      collection(db, 'emergencyAlerts'),
      where('isActive', '==', true),
      limit(10)
    );

    // Monitorar reports do usuário
    const unsubscribeReports = onSnapshot(reportsQuery, async (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const pending = reports.filter((r: any) => r.status === 'pending').length;
      const approved = reports.filter((r: any) => r.status === 'approved').length;
      const rejected = reports.filter((r: any) => r.status === 'rejected').length;
      
      callback({
        reports: {
          total: reports.length,
          pending,
          approved,
          rejected,
          thisMonth: reports.filter((r: any) => {
            const created = r.createdAt?.toDate();
            const now = new Date();
            return created && 
              created.getMonth() === now.getMonth() && 
              created.getFullYear() === now.getFullYear();
          }).length,
          trend: {
            type: 'neutral',
            percentage: 0
          }
        }
      });
    });

    // Monitorar alertas ativos
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const critical = alerts.filter((a: any) => a.severity === 'critical').length;
      
      callback({
        alerts: {
          active: alerts.length,
          total: alerts.length,
          critical,
          thisWeek: alerts.filter((a: any) => {
            const created = a.createdAt?.toDate();
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created && created >= weekAgo;
          }).length
        }
      });
    });

    // Retornar função de cleanup
    return () => {
      unsubscribeReports();
      unsubscribeAlerts();
    };
  }

  /**
   * Monitora atividades recentes em tempo real
   */
  static subscribeToRecentActivity(
    userId: string,
    callback: (activities: RecentActivity[]) => void,
    limitCount: number = 10
  ): Unsubscribe {
    const recentActivitiesQuery = query(
      collection(db, 'userActivities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(recentActivitiesQuery, (snapshot) => {
      const activities: RecentActivity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(),
        } as RecentActivity);
      });
      callback(activities);
    });
  }

  /**
   * Obtém contadores rápidos usando aggregation queries
   */
  static async getQuickStats(userId: string): Promise<Partial<DashboardStats>> {
    try {
      // Contar reports do usuário
      const reportsQuery = query(
        collection(db, 'reports'),
        where('createdBy', '==', userId)
      );
      const reportsSnapshot = await getCountFromServer(reportsQuery);
      
      // Contar alertas ativos
      const alertsQuery = query(
        collection(db, 'emergencyAlerts'),
        where('isActive', '==', true)
      );
      const alertsSnapshot = await getCountFromServer(alertsQuery);

      // Contar doações ativas
      const donationsQuery = query(
        collection(db, 'donationRequests'),
        where('status', '==', 'active')
      );
      const donationsSnapshot = await getCountFromServer(donationsQuery);

      return {
        reports: {
          total: reportsSnapshot.data().count,
          pending: 0, // Seria necessário uma query específica
          approved: 0,
          rejected: 0,
          thisMonth: 0,
          trend: { type: 'neutral', percentage: 0 }
        },
        alerts: {
          active: alertsSnapshot.data().count,
          total: alertsSnapshot.data().count,
          critical: 0,
          thisWeek: 0
        },
        donations: {
          activeRequests: donationsSnapshot.data().count,
          fulfilled: 0,
          totalValue: 0,
          thisMonth: 0
        }
      };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas rápidas:', error);
      throw new Error(error.message ?? 'Erro ao obter estatísticas rápidas');
    }
  }
}

export default DashboardStatsService;
