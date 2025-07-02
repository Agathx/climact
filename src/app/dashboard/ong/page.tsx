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
  DollarSign, 
  Target,
  Heart,
  FileText,
  CheckCircle,
  Award
} from 'lucide-react';

interface OngProject {
  id: string;
  title: string;
  description: string;
  category: 'environmental' | 'social' | 'emergency' | 'education';
  status: 'planning' | 'active' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  budget: number;
  raised: number;
  volunteersNeeded: number;
  volunteersAssigned: number;
  beneficiaries: number;
  location: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface OngStats {
  totalProjects: number;
  activeProjects: number;
  totalBeneficiaries: number;
  totalVolunteers: number;
  totalFunding: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  impactScore: number;
  communityRating: number;
}

interface DonationRequest {
  id: string;
  title: string;
  description: string;
  category: 'food' | 'clothing' | 'medicine' | 'equipment' | 'money';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  quantityNeeded: number;
  quantityReceived: number;
  targetDate: string;
  status: 'active' | 'fulfilled' | 'expired';
}

export default function OngPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<OngProject[]>([]);
  const [stats, setStats] = useState<OngStats | null>(null);
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Mock data - em produção viria dos services
  useEffect(() => {
    const mockStats: OngStats = {
      totalProjects: 15,
      activeProjects: 8,
      totalBeneficiaries: 2340,
      totalVolunteers: 67,
      totalFunding: 125000,
      verificationStatus: 'verified',
      impactScore: 8.7,
      communityRating: 4.8
    };

    const mockProjects: OngProject[] = [
      {
        id: '1',
        title: 'Reflorestamento Urbano SP',
        description: 'Plantio de árvores nativas em áreas degradadas da cidade',
        category: 'environmental',
        status: 'active',
        startDate: '2025-01-15',
        endDate: '2025-12-15',
        budget: 45000,
        raised: 32000,
        volunteersNeeded: 25,
        volunteersAssigned: 18,
        beneficiaries: 5000,
        location: 'São Paulo, SP',
        urgency: 'medium'
      },
      {
        id: '2',
        title: 'Cesta Básica Emergencial',
        description: 'Distribuição de alimentos para famílias em vulnerabilidade',
        category: 'social',
        status: 'active',
        startDate: '2025-06-01',
        budget: 20000,
        raised: 18500,
        volunteersNeeded: 15,
        volunteersAssigned: 12,
        beneficiaries: 200,
        location: 'Carapicuíba, SP',
        urgency: 'high'
      },
      {
        id: '3',
        title: 'Curso de Sustentabilidade',
        description: 'Capacitação em práticas sustentáveis para jovens',
        category: 'education',
        status: 'planning',
        startDate: '2025-08-01',
        endDate: '2025-11-30',
        budget: 15000,
        raised: 8500,
        volunteersNeeded: 8,
        volunteersAssigned: 3,
        beneficiaries: 120,
        location: 'Osasco, SP',
        urgency: 'low'
      }
    ];

    const mockDonations: DonationRequest[] = [
      {
        id: '1',
        title: 'Equipamentos de Jardinagem',
        description: 'Ferramentas para o projeto de reflorestamento',
        category: 'equipment',
        urgency: 'medium',
        quantityNeeded: 50,
        quantityReceived: 32,
        targetDate: '2025-07-15',
        status: 'active'
      },
      {
        id: '2',
        title: 'Alimentos Não Perecíveis',
        description: 'Doações para montagem de cestas básicas',
        category: 'food',
        urgency: 'high',
        quantityNeeded: 500,
        quantityReceived: 380,
        targetDate: '2025-07-01',
        status: 'active'
      }
    ];

    setStats(mockStats);
    setProjects(mockProjects);
    setDonations(mockDonations);
    setLoading(false);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'bg-green-500';
      case 'social': return 'bg-blue-500';
      case 'emergency': return 'bg-red-500';
      case 'education': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'planning': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
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
          <h1 className="text-3xl font-bold">Painel da ONG</h1>
          <p className="text-muted-foreground">
            Gerencie seus projetos e impacto social
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => {
              // Generate and download report
              const reportData = {
                projects: projects.length,
                beneficiaries: stats?.totalBeneficiaries || 0,
                volunteers: stats?.totalVolunteers || 0,
                funding: stats?.totalFunding || 0,
                generatedAt: new Date().toISOString()
              };
              const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'relatorio-ong.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button onClick={() => router.push('/dashboard/ong/new-project')}>
            <Target className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Verification Status */}
      {stats?.verificationStatus === 'verified' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                Organização Verificada
              </span>
              <Badge className="bg-green-600 text-white">
                Selo de Confiança
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                  <p className="text-sm text-muted-foreground">Projetos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalBeneficiaries.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Beneficiários</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalVolunteers}</p>
                  <p className="text-sm text-muted-foreground">Voluntários</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">R$ {stats.totalFunding.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Arrecadado</p>
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
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="donations">Doações</TabsTrigger>
          <TabsTrigger value="impact">Impacto</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Impact Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Pontuação de Impacto</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{stats?.impactScore}/10</span>
                    <span className="text-sm text-muted-foreground">
                      Avaliação da Comunidade: {stats?.communityRating}/5 ⭐
                    </span>
                  </div>
                  <Progress value={stats?.impactScore ? stats.impactScore * 10 : 0} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Target className="w-4 h-4 mr-2" />
                  Criar Novo Projeto
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="w-4 h-4 mr-2" />
                  Solicitar Doação
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Buscar Voluntários
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        <Badge className={`text-white ${getCategoryColor(project.category)}`}>
                          {project.category}
                        </Badge>
                        <Badge className={`text-white ${getStatusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        <Badge className={`text-white ${getUrgencyColor(project.urgency)}`}>
                          {project.urgency}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground">{project.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Orçamento</p>
                          <p className="text-muted-foreground">R$ {project.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Arrecadado</p>
                          <p className="text-green-600">R$ {project.raised.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Voluntários</p>
                          <p className="text-muted-foreground">
                            {project.volunteersAssigned}/{project.volunteersNeeded}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Beneficiários</p>
                          <p className="text-muted-foreground">{project.beneficiaries.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso Financeiro</span>
                          <span>{Math.round((project.raised / project.budget) * 100)}%</span>
                        </div>
                        <Progress value={(project.raised / project.budget) * 100} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Relatório</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="donations" className="mt-6">
          <div className="space-y-4">
            {donations.map((donation) => (
              <Card key={donation.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{donation.title}</h3>
                        <Badge className={`text-white ${getUrgencyColor(donation.urgency)}`}>
                          {donation.urgency}
                        </Badge>
                        <Badge variant={donation.status === 'active' ? 'default' : 'secondary'}>
                          {donation.status}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground">{donation.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Necessário</p>
                          <p className="text-muted-foreground">{donation.quantityNeeded} unidades</p>
                        </div>
                        <div>
                          <p className="font-medium">Recebido</p>
                          <p className="text-green-600">{donation.quantityReceived} unidades</p>
                        </div>
                        <div>
                          <p className="font-medium">Data Limite</p>
                          <p className="text-muted-foreground">
                            {new Date(donation.targetDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{Math.round((donation.quantityReceived / donation.quantityNeeded) * 100)}%</span>
                        </div>
                        <Progress value={(donation.quantityReceived / donation.quantityNeeded) * 100} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Compartilhar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="impact" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Impacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Pessoas Beneficiadas</span>
                  <span className="font-bold">{stats?.totalBeneficiaries.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Projetos Concluídos</span>
                  <span className="font-bold">{stats ? stats.totalProjects - stats.activeProjects : 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Voluntários Envolvidos</span>
                  <span className="font-bold">{stats?.totalVolunteers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Recursos Mobilizados</span>
                  <span className="font-bold">R$ {stats?.totalFunding.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reconhecimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Award className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
                  <p className="font-semibold">ONG Destaque 2025</p>
                  <p className="text-sm text-muted-foreground">
                    Reconhecida pelo impacto ambiental
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    Transparência Certificada
                  </Badge>
                  <Badge variant="secondary" className="w-full justify-center">
                    Gestão Eficiente
                  </Badge>
                  <Badge variant="secondary" className="w-full justify-center">
                    Impacto Comprovado
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
