'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Heart, 
  MapPin, 
  Clock,
  Award,
  MessageCircle,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface VolunteerActivity {
  id: string;
  type: 'help_request' | 'community_service' | 'education' | 'emergency_response';
  title: string;
  description: string;
  location: string;
  date: string;
  status: 'available' | 'assigned' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requiredSkills: string[];
  estimatedHours: number;
  points: number;
}

interface VolunteerStats {
  totalHours: number;
  activitiesCompleted: number;
  peopleHelped: number;
  communityPoints: number;
  rank: string;
  badges: string[];
  nextLevelProgress: number;
}

export default function VolunteerPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [selectedTab, setSelectedTab] = useState('available');
  const [loading, setLoading] = useState(true);

  // Mock data - em produção viria dos services
  useEffect(() => {
    const mockStats: VolunteerStats = {
      totalHours: 148,
      activitiesCompleted: 23,
      peopleHelped: 67,
      communityPoints: 1820,
      rank: 'Voluntário Ouro',
      badges: ['Primeiro Socorro', 'Educador Ambiental', 'Resposta Rápida', 'Mentor Comunitário'],
      nextLevelProgress: 75
    };

    const mockActivities: VolunteerActivity[] = [
      {
        id: '1',
        type: 'emergency_response',
        title: 'Apoio em Alagamento - Zona Sul',
        description: 'Assistência emergencial para famílias afetadas por alagamento',
        location: 'Vila Madalena, São Paulo',
        date: '2025-06-28',
        status: 'available',
        urgency: 'critical',
        requiredSkills: ['Primeiro Socorro', 'Resgate'],
        estimatedHours: 8,
        points: 120
      },
      {
        id: '2',
        type: 'education',
        title: 'Workshop de Sustentabilidade',
        description: 'Ensinar práticas sustentáveis para jovens da comunidade',
        location: 'Centro Comunitário - Osasco',
        date: '2025-06-30',
        status: 'available',
        urgency: 'medium',
        requiredSkills: ['Educação Ambiental'],
        estimatedHours: 4,
        points: 60
      },
      {
        id: '3',
        type: 'community_service',
        title: 'Limpeza do Rio Tietê',
        description: 'Mutirão de limpeza e conscientização ambiental',
        location: 'Marginal Tietê',
        date: '2025-07-05',
        status: 'assigned',
        urgency: 'medium',
        requiredSkills: ['Trabalho em Equipe'],
        estimatedHours: 6,
        points: 80
      },
      {
        id: '4',
        type: 'help_request',
        title: 'Assistência a Idosos',
        description: 'Apoio e companhia para idosos em situação de vulnerabilidade',
        location: 'Lar São Vicente - Carapicuíba',
        date: '2025-06-27',
        status: 'completed',
        urgency: 'low',
        requiredSkills: ['Cuidados Básicos', 'Comunicação'],
        estimatedHours: 3,
        points: 45
      }
    ];

    setStats(mockStats);
    setActivities(mockActivities);
    setLoading(false);
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-500';
      case 'assigned': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleJoinActivity = (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, status: 'assigned' as const }
          : activity
      )
    );
  };

  const filteredActivities = activities.filter(activity => {
    if (selectedTab === 'available') return activity.status === 'available';
    if (selectedTab === 'assigned') return activity.status === 'assigned';
    if (selectedTab === 'completed') return activity.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Área do Voluntário</h1>
          <p className="text-muted-foreground">
            Faça a diferença na sua comunidade
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/volunteer/network')}>
          <Users className="w-4 h-4 mr-2" />
          Conectar com Outros Voluntários
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalHours}h</p>
                  <p className="text-sm text-muted-foreground">Horas Voluntárias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activitiesCompleted}</p>
                  <p className="text-sm text-muted-foreground">Atividades Concluídas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.peopleHelped}</p>
                  <p className="text-sm text-muted-foreground">Pessoas Ajudadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.communityPoints}</p>
                  <p className="text-sm text-muted-foreground">Pontos da Comunidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress and Rank */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Progresso do Nível</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stats.rank}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.nextLevelProgress}% para Voluntário Platina
                  </span>
                </div>
                <Progress value={stats.nextLevelProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Complete mais 5 atividades para alcançar o próximo nível
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Conquistas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.badges.map((badge, index) => (
                  <Badge key={`badge-${badge}`} variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Oportunidades de Voluntariado</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="available">Disponíveis</TabsTrigger>
              <TabsTrigger value="assigned">Minhas</TabsTrigger>
              <TabsTrigger value="completed">Concluídas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <Card key={activity.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{activity.title}</h3>
                          <Badge 
                            className={`text-white ${getUrgencyColor(activity.urgency)}`}
                          >
                            {activity.urgency}
                          </Badge>
                          <Badge 
                            className={`text-white ${getStatusColor(activity.status)}`}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground">{activity.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{activity.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(activity.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{activity.estimatedHours}h</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {activity.requiredSkills.map((skill, index) => (
                            <Badge key={`skill-${skill}`} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            +{activity.points} pontos
                          </p>
                        </div>
                        
                        {activity.status === 'available' && (
                          <Button 
                            onClick={() => handleJoinActivity(activity.id)}
                            size="sm"
                          >
                            Participar
                          </Button>
                        )}
                        
                        {activity.status === 'assigned' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/dashboard/chat?activity=${activity.id}`)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Conversar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                
                {filteredActivities.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma atividade encontrada para esta categoria.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
