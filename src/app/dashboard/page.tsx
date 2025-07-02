'use client'

import { useState, useEffect } from 'react';
import { 
  StatsCard, 
  StatusAlert, 
  ActivityProgress, 
  RecentActivity 
} from '@/components/dashboard-components';
import { CommunityImpactCard } from '@/components/feedback-components';
import { WeatherWidget } from '@/components/weather-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  TrendingUp,
  FileText,
  Clock,
  Loader2,
  ArrowRight,
  Cloud
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/hooks/use-session';
import { useUserNavigation } from '@/hooks/use-user-navigation';
import { DashboardStatsService, type DashboardStats, type RecentActivity as RecentActivityType } from '@/services/dashboardStatsService';

export default function DashboardPage() {
  const { user } = useSession();
  const { getWelcomeMessage, getPrimaryActions } = useUserNavigation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar estatísticas
        const dashboardStats = await DashboardStatsService.getDashboardStats(user.uid);
        setStats(dashboardStats);

        // Carregar atividades recentes
        const activities = await DashboardStatsService.getRecentActivity(user.uid, 5);
        setRecentActivities(activities);

      } catch (err: any) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError(err.message ?? 'Erro ao carregar dados do dashboard');
        
        // Usar dados de fallback em caso de erro
        setStats({
          reports: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            thisMonth: 0,
            trend: { type: 'neutral', percentage: 0 }
          },
          alerts: { active: 0, total: 0, critical: 0, thisWeek: 0 },
          education: { completedModules: 0, totalModules: 20, progressPercentage: 0, certificates: 0 },
          community: { points: 0, rank: 0, contributions: 0, volunteersConnected: 0 },
          emergencyAlerts: { active: 0, acknowledged: 0, inMyArea: 0 },
          donations: { activeRequests: 0, fulfilled: 0, totalValue: 0, thisMonth: 0 }
        });
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Configurar listeners para dados em tempo real
    const unsubscribeStats = DashboardStatsService.subscribeToLocalStats(user.uid, (partialStats) => {
      setStats(prevStats => prevStats ? { ...prevStats, ...partialStats } : null);
    });

    const unsubscribeActivities = DashboardStatsService.subscribeToRecentActivity(user.uid, setRecentActivities, 5);

    return () => {
      unsubscribeStats();
      unsubscribeActivities();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-600">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Erro: {error}</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-600">
        <span>Nenhum dado disponível</span>
      </div>
    );
  }

  const achievements = [
    {
      id: 'eco-iniciante',
      name: 'Eco-Iniciante',
      iconName: 'Award',
      earned: true
    },
    {
      id: 'relator-consciente',
      name: 'Relator Consciente',
      iconName: 'FileText',
      earned: true
    },
    {
      id: 'agente-climatico',
      name: 'Agente Climático',
      iconName: 'MapPin',
      earned: false
    }
  ];

  // Converter atividades para o formato esperado pelo componente
  const formattedActivities = recentActivities.map(activity => {
    let mappedType: 'report' | 'education' | 'community' | 'alert';
    if (activity.type === 'volunteer' || activity.type === 'donation') {
      mappedType = 'community';
    } else {
      mappedType = activity.type;
    }

    let mappedStatus: 'pending' | 'completed' | 'in_progress' | undefined;
    if (activity.status === 'approved' || activity.status === 'active') {
      mappedStatus = 'completed';
    } else if (activity.status === 'rejected') {
      mappedStatus = 'pending';
    } else {
      mappedStatus = activity.status;
    }

    return {
      id: activity.id,
      type: mappedType,
      title: activity.title,
      description: activity.description,
      timestamp: activity.timestamp,
      location: activity.location,
      status: mappedStatus
    };
  }).filter(activity => 
    ['report', 'education', 'community', 'alert'].includes(activity.type)
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Dashboard */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Painel de Controle ClimACT
        </h1>
        <p className="text-muted-foreground">
          {getWelcomeMessage()}
        </p>
      </div>

      {/* Ações Primárias baseadas no papel do usuário */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getPrimaryActions().map((action, index) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <action.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {action.label}
                    </h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Alerta de Status (se houver alertas ativos) */}
      {stats.alerts.active > 0 && (
        <StatusAlert
          type="warning"
          title="Alertas Ativos na Sua Região"
          message={`Existem ${stats.alerts.active} alertas meteorológicos ativos para sua localização. Mantenha-se informado e tome as precauções necessárias.`}
          action={{
            label: 'Ver Alertas',
            href: '/dashboard/map'
          }}
        />
      )}

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Relatórios Enviados"
          value={stats.reports.total}
          description="Total da comunidade"
          icon={FileText}
          trend={{
            type: stats.reports.trend.type,
            value: `${stats.reports.trend.percentage}%`,
            label: 'este mês'
          }}
          color="success"
        />
        
        <StatsCard
          title="Alertas Ativos"
          value={stats.alerts.active}
          description="Na sua região"
          icon={AlertTriangle}
          color={stats.alerts.active > 0 ? 'warning' : 'success'}
        />
        
        <StatsCard
          title="Módulos Concluídos"
          value={stats.education.completedModules}
          description="Seus estudos"
          icon={BookOpen}
          trend={{
            type: 'up',
            value: `${stats.education.progressPercentage}%`,
            label: 'progresso'
          }}
          color="success"
        />
        
        <StatsCard
          title="Pontos da Comunidade"
          value={stats.community.points}
          description="Sua contribuição"
          icon={Users}
          trend={{
            type: 'up',
            value: `#${stats.community.rank}`,
            label: 'posição'
          }}
          color="success"
        />
      </div>

      {/* Widget de Clima */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-600" />
          Condições Climáticas na Sua Região
        </h2>
        <WeatherWidget coordinates={[-23.5505, -46.6333]} compact={true} />
      </div>

      {/* Layout em Grid para Seções Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Progresso de Atividades */}
        <div className="lg:col-span-1">
          <ActivityProgress
            title="Seu Progresso"
            current={stats.community.points}
            total={2000}
            unit="pontos"
            level={3}
            nextLevelAt={2000}
            achievements={achievements}
          />
        </div>

        {/* Atividade Recente */}
        <div className="lg:col-span-2">
          <RecentActivity activities={formattedActivities} />
        </div>
      </div>

      {/* Impacto da Comunidade */}
      <CommunityImpactCard
        title="Impacto da Comunidade ClimACT"
        metrics={[
          {
            label: "Relatórios Enviados",
            value: "1.247",
            change: {
              type: 'increase',
              value: "+23%",
              period: "este mês"
            },
            iconName: "FileText"
          },
          {
            label: "Árvores Plantadas",
            value: "856",
            change: {
              type: 'increase',
              value: "+12",
              period: "esta semana"
            },
            iconName: "Leaf"
          },
          {
            label: "Litros Economizados",
            value: "34.520",
            change: {
              type: 'increase',
              value: "+8%",
              period: "este mês"
            },
            iconName: "Droplets"
          },
          {
            label: "Materiais Reciclados",
            value: "2.1 ton",
            change: {
              type: 'increase',
              value: "+15%",
              period: "este mês"
            },
            iconName: "Recycle"
          }
        ]}
      />

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/report" className="inline-flex">
              <Button className="h-auto flex-col space-y-2 p-4 w-full">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">Reportar Incidente</span>
                <span className="text-xs text-muted-foreground">
                  Comunique problemas ambientais
                </span>
              </Button>
            </Link>
            
            <Link href="/dashboard/map" className="inline-flex">
              <Button className="h-auto flex-col space-y-2 p-4 w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                <MapPin className="h-6 w-6" />
                <span className="text-sm font-medium">Ver Mapa</span>
                <span className="text-xs text-muted-foreground">
                  Explore incidentes próximos
                </span>
              </Button>
            </Link>
            
            <Link href="/dashboard/education" className="inline-flex">
              <Button className="h-auto flex-col space-y-2 p-4 w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                <BookOpen className="h-6 w-6" />
                <span className="text-sm font-medium">Estudar</span>
                <span className="text-xs text-muted-foreground">
                  Continue sua trilha de aprendizado
                </span>
              </Button>
            </Link>
            
            <Link href="/dashboard/news" className="inline-flex">
              <Button className="h-auto flex-col space-y-2 p-4 w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                <Clock className="h-6 w-6" />
                <span className="text-sm font-medium">Notícias</span>
                <span className="text-xs text-muted-foreground">
                  Fique por dentro dos alertas
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
