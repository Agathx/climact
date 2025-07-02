'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  Settings, 

  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  pendingReports: number;
  activeAlerts: number;
  pendingUpgrades: number;
}

interface PendingUpgrade {
  id: string;
  userName: string;
  currentRole: string;
  requestedRole: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingReports: 0,
    activeAlerts: 0,
    pendingUpgrades: 0
  });

  const [pendingUpgrades, setPendingUpgrades] = useState<PendingUpgrade[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Simular carregamento de dados admin
      // Em produção, estes dados viriam das Cloud Functions admin
      
      setStats({
        totalUsers: 1247,
        pendingReports: 23,
        activeAlerts: 5,
        pendingUpgrades: 8
      });

      setPendingUpgrades([
        {
          id: '1',
          userName: 'João Silva',
          currentRole: 'cidadao',
          requestedRole: 'voluntario',
          submittedAt: '2025-06-26',
          status: 'pending'
        },
        {
          id: '2',
          userName: 'Maria Santos',
          currentRole: 'cidadao',
          requestedRole: 'ong',
          submittedAt: '2025-06-25',
          status: 'pending'
        },
        {
          id: '3',
          userName: 'Pedro Costa',
          currentRole: 'voluntario',
          requestedRole: 'defesa_civil',
          submittedAt: '2025-06-24',
          status: 'pending'
        }
      ]);

      setSystemMetrics([
        {
          name: 'Database Performance',
          value: '98.5%',
          status: 'healthy',
          lastUpdated: '2025-06-27 10:30'
        },
        {
          name: 'Cloud Functions',
          value: '99.2%',
          status: 'healthy',
          lastUpdated: '2025-06-27 10:30'
        },
        {
          name: 'Storage Usage',
          value: '67%',
          status: 'warning',
          lastUpdated: '2025-06-27 10:25'
        },
        {
          name: 'API Response Time',
          value: '234ms',
          status: 'healthy',
          lastUpdated: '2025-06-27 10:28'
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeReview = async (upgradeId: string, approved: boolean) => {
    try {
      // Implementar aprovação/rejeição via Cloud Function
      console.log(`${approved ? 'Aprovando' : 'Rejeitando'} upgrade ${upgradeId}`);
      
      setPendingUpgrades(prev => 
        prev.map(upgrade => 
          upgrade.id === upgradeId 
            ? { ...upgrade, status: approved ? 'approved' : 'rejected' }
            : upgrade
        )
      );
    } catch (error) {
      console.error('Erro ao revisar upgrade:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-blue-600 bg-blue-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'cidadao': 'Cidadão',
      'voluntario': 'Voluntário',
      'ong': 'ONG',
      'defesa_civil': 'Defesa Civil',
      'admin': 'Administrador'
    };
    return labels[role] || role;
  };

  const filteredUpgrades = pendingUpgrades.filter(upgrade =>
    upgrade.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upgrade.requestedRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Shield className="inline-block w-8 h-8 mr-3 text-red-600" />
          Painel Administrativo
        </h1>
        <p className="text-gray-600">
          Gerencie usuários, relatórios e configurações do sistema ClimACT
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              Requer revisão da Defesa Civil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Monitoramento em tempo real
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upgrades Pendentes</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingUpgrades}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upgrades" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upgrades">Upgrades de Perfil</TabsTrigger>
          <TabsTrigger value="system">Métricas do Sistema</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="upgrades">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Upgrade de Perfil</CardTitle>
              <CardDescription>
                Revise e aprove/rejeite solicitações de evolução de perfil de usuários
              </CardDescription>
              
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou perfil..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUpgrades.map((upgrade) => (
                  <div key={upgrade.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{upgrade.userName}</h4>
                      <p className="text-sm text-gray-600">
                        {getRoleLabel(upgrade.currentRole)} → {getRoleLabel(upgrade.requestedRole)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Solicitado em: {new Date(upgrade.submittedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(upgrade.status)}>
                        {upgrade.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {upgrade.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {upgrade.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {(() => {
                          if (upgrade.status === 'pending') return 'Pendente';
                          if (upgrade.status === 'approved') return 'Aprovado';
                          return 'Rejeitado';
                        })()}
                      </Badge>
                      
                      {upgrade.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpgradeReview(upgrade.id, false)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpgradeReview(upgrade.id, true)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                        </div>
                      )}
                      
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Métricas do Sistema</CardTitle>
              <CardDescription>
                Monitoramento em tempo real da saúde e performance do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {systemMetrics.map((metric, index) => (
                  <div key={`metric-${metric.name.replace(/\s/g, '-')}`} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{metric.name}</h4>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">{metric.value}</div>
                    <p className="text-xs text-gray-500">
                      Última atualização: {metric.lastUpdated}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Gerencie configurações globais e parâmetros do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="alert-threshold">Limite de Alertas Críticos</Label>
                  <Input
                    id="alert-threshold"
                    type="number"
                    defaultValue="10"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="community-threshold">Limite para Validação Comunitária</Label>
                  <Input
                    id="community-threshold"
                    type="number"
                    defaultValue="5"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ai-threshold">Threshold IA para Auto-aprovação</Label>
                  <Input
                    id="ai-threshold"
                    type="number"
                    step="0.1"
                    defaultValue="0.8"
                    className="mt-1"
                  />
                </div>
                
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
