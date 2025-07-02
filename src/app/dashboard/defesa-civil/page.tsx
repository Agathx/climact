'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  BarChart3,
  Radio,
  Calendar,
  Phone,
  Megaphone
} from 'lucide-react';

interface EmergencyReport {
  id: string;
  type: 'flood' | 'fire' | 'landslide' | 'storm' | 'earthquake' | 'pollution' | 'other';
  title: string;
  description: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending_review' | 'investigating' | 'confirmed' | 'resolved' | 'false_alarm';
  reportedAt: string;
  reportedBy: string;
  aiConfidence: number;
  communityVotes: {
    positive: number;
    negative: number;
  };
  mediaUrls: string[];
  priority: number;
}

interface DefesaCivilStats {
  totalReports: number;
  pendingReports: number;
  confirmedIncidents: number;
  activeAlerts: number;
  citizensProtected: number;
  responseTimeAvg: number; // em minutos
  teamMembers: number;
  jurisdiction: string[];
}

interface EmergencyAlert {
  id: string;
  title: string;
  type: 'evacuation' | 'shelter' | 'weather_warning' | 'health_alert' | 'security';
  severity: 'info' | 'warning' | 'severe' | 'critical';
  status: 'active' | 'expired' | 'cancelled';
  affectedAreas: string[];
  estimatedPeople: number;
  issuedAt: string;
  expiresAt?: string;
  instructions: string[];
}

export default function DefesaCivilPage() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [stats, setStats] = useState<DefesaCivilStats | null>(null);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Mock data - em produção viria dos services
  useEffect(() => {
    const mockStats: DefesaCivilStats = {
      totalReports: 1247,
      pendingReports: 23,
      confirmedIncidents: 89,
      activeAlerts: 3,
      citizensProtected: 15430,
      responseTimeAvg: 18,
      teamMembers: 34,
      jurisdiction: ['São Paulo', 'Carapicuíba', 'Osasco', 'Barueri']
    };

    const mockReports: EmergencyReport[] = [
      {
        id: '1',
        type: 'flood',
        title: 'Alagamento na Av. Paulista',
        description: 'Água acumulada causando dificuldades no trânsito e risco para pedestres',
        location: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
        coordinates: { latitude: -23.5615, longitude: -46.6560 },
        severity: 'high',
        status: 'pending_review',
        reportedAt: '2025-06-27T14:30:00Z',
        reportedBy: 'Cidadão Anônimo',
        aiConfidence: 0.89,
        communityVotes: { positive: 15, negative: 2 },
        mediaUrls: ['https://example.com/flood1.jpg'],
        priority: 1
      },
      {
        id: '2',
        type: 'landslide',
        title: 'Deslizamento em Área Residencial',
        description: 'Movimento de terra ameaça residências na encosta',
        location: 'Rua das Pedras, 450 - Vila Madalena, São Paulo',
        coordinates: { latitude: -23.5505, longitude: -46.6889 },
        severity: 'critical',
        status: 'investigating',
        reportedAt: '2025-06-27T09:15:00Z',
        reportedBy: 'Maria Silva',
        aiConfidence: 0.95,
        communityVotes: { positive: 28, negative: 1 },
        mediaUrls: ['https://example.com/landslide1.jpg', 'https://example.com/landslide2.jpg'],
        priority: 1
      },
      {
        id: '3',
        type: 'fire',
        title: 'Incêndio em Vegetação',
        description: 'Foco de incêndio em área de mata próxima a residências',
        location: 'Parque do Ibirapuera - Vila Mariana, São Paulo',
        coordinates: { latitude: -23.5873, longitude: -46.6575 },
        severity: 'medium',
        status: 'resolved',
        reportedAt: '2025-06-26T16:45:00Z',
        reportedBy: 'João Santos',
        aiConfidence: 0.76,
        communityVotes: { positive: 12, negative: 0 },
        mediaUrls: [],
        priority: 2
      }
    ];

    const mockAlerts: EmergencyAlert[] = [
      {
        id: '1',
        title: 'Alerta de Chuva Forte',
        type: 'weather_warning',
        severity: 'warning',
        status: 'active',
        affectedAreas: ['Zona Sul', 'Centro', 'Zona Oeste'],
        estimatedPeople: 2500000,
        issuedAt: '2025-06-27T12:00:00Z',
        expiresAt: '2025-06-28T06:00:00Z',
        instructions: [
          'Evite áreas sujeitas a alagamento',
          'Mantenha-se em locais seguros',
          'Acompanhe atualizações oficiais',
          'Em caso de emergência, ligue 193'
        ]
      },
      {
        id: '2',
        title: 'Evacuação Preventiva - Vila Madalena',
        type: 'evacuation',
        severity: 'severe',
        status: 'active',
        affectedAreas: ['Vila Madalena - Rua das Pedras'],
        estimatedPeople: 150,
        issuedAt: '2025-06-27T09:30:00Z',
        instructions: [
          'Evacue imediatamente a área indicada',
          'Dirija-se ao abrigo na Escola Municipal João Silva',
          'Leve apenas o essencial: documentos, remédios, água',
          'Aguarde autorização para retornar'
        ]
      }
    ];

    setStats(mockStats);
    setReports(mockReports);
    setAlerts(mockAlerts);
    setLoading(false);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-blue-500';
      case 'investigating': return 'bg-purple-500';
      case 'confirmed': return 'bg-orange-500';
      case 'resolved': return 'bg-green-500';
      case 'false_alarm': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'severe': return 'border-orange-500 bg-orange-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const handleReportAction = (reportId: string, action: 'approve' | 'reject' | 'investigate') => {
    const getNewStatus = (action: string) => {
      if (action === 'approve') return 'confirmed';
      if (action === 'reject') return 'false_alarm';
      return 'investigating';
    };

    setReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, status: getNewStatus(action) }
          : report
      )
    );
  };

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
          <h1 className="text-3xl font-bold">Central da Defesa Civil</h1>
          <p className="text-muted-foreground">
            Monitoramento e resposta a emergências
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="destructive">
            <Megaphone className="w-4 h-4 mr-2" />
            Emitir Alerta
          </Button>
          <Button>
            <Radio className="w-4 h-4 mr-2" />
            Central de Comando
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.filter(a => a.status === 'active').length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-600">🚨 Alertas Ativos</h2>
          {alerts.filter(a => a.status === 'active').map((alert) => (
            <Card key={alert.id} className={`${getAlertSeverityColor(alert.severity)} border-2`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{alert.title}</h3>
                      <Badge className={`text-white ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Áreas afetadas: {alert.affectedAreas.join(', ')}
                    </p>
                    <p className="text-sm mb-3">
                      Pessoas estimadas: {alert.estimatedPeople.toLocaleString()}
                    </p>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">Instruções:</p>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {alert.instructions.map((instruction) => (
                          <li key={`instruction-${instruction.slice(0, 20)}`}>{instruction}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button size="sm" variant="outline">Editar</Button>
                    <Button size="sm" variant="destructive">Cancelar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingReports}</p>
                  <p className="text-sm text-muted-foreground">Relatórios Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.confirmedIncidents}</p>
                  <p className="text-sm text-muted-foreground">Incidentes Confirmados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.citizensProtected.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Cidadãos Protegidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.responseTimeAvg}min</p>
                  <p className="text-sm text-muted-foreground">Tempo Médio Resposta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jurisdiction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Área de Atuação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.jurisdiction.map((area) => (
                    <div key={`area-${area}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{area}</span>
                      <Badge variant="outline">Ativo</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Equipe</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Membros Ativos</span>
                    <span className="font-bold">{stats?.teamMembers}</span>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="w-4 h-4 mr-2" />
                      Contatos de Emergência
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Escalas de Plantão
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">{report.title}</h3>
                        <Badge className={`text-white ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </Badge>
                        <Badge className={`text-white ${getStatusColor(report.status)}`}>
                          {report.status}
                        </Badge>
                        <Badge variant="outline">
                          Prioridade {report.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground">{report.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Local</p>
                          <p className="text-muted-foreground">{report.location}</p>
                        </div>
                        <div>
                          <p className="font-medium">Reportado por</p>
                          <p className="text-muted-foreground">{report.reportedBy}</p>
                        </div>
                        <div>
                          <p className="font-medium">Confiança IA</p>
                          <p className="text-muted-foreground">{Math.round(report.aiConfidence * 100)}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Votos Comunidade</p>
                          <p className="text-muted-foreground">
                            👍 {report.communityVotes.positive} | 👎 {report.communityVotes.negative}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(report.reportedAt).toLocaleString('pt-BR')}</span>
                        </div>
                        {report.mediaUrls.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{report.mediaUrls.length} anexo(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {report.status === 'pending_review' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleReportAction(report.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReportAction(report.id, 'investigate')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Investigar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReportAction(report.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contatar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gerenciar Alertas</h3>
              <Button>
                <Megaphone className="w-4 h-4 mr-2" />
                Novo Alerta
              </Button>
            </div>
            
            {alerts.map((alert) => (
              <Card key={alert.id} className={alert.status === 'active' ? 'border-orange-500' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge className={`text-white ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </Badge>
                        <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                          {alert.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Áreas Afetadas</p>
                          <p className="text-muted-foreground">{alert.affectedAreas.join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-medium">Pessoas Estimadas</p>
                          <p className="text-muted-foreground">{alert.estimatedPeople.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm" variant="outline">Editar</Button>
                      {alert.status === 'active' && (
                        <Button size="sm" variant="destructive">Cancelar</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Estatísticas do Período</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total de Relatórios</span>
                  <span className="font-bold">{stats?.totalReports}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taxa de Confirmação</span>
                  <span className="font-bold">
                    {stats ? Math.round((stats.confirmedIncidents / stats.totalReports) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tempo Médio de Resposta</span>
                  <span className="font-bold">{stats?.responseTimeAvg} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Alertas Emitidos (mês)</span>
                  <span className="font-bold">12</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance da Equipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Eficiência de Resposta</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Precisão de Avaliação</span>
                    <span>94%</span>
                  </div>
                  <Progress value={94} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Satisfação da Comunidade</span>
                    <span>91%</span>
                  </div>
                  <Progress value={91} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
