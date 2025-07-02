'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Shield, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Calendar
} from 'lucide-react';

interface AnonymousReportStatus {
  id: string;
  trackingCode: string;
  status: 'submitted' | 'under_review' | 'investigating' | 'resolved' | 'closed';
  submittedAt: string;
  lastUpdate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  updates: StatusUpdate[];
  canProvideMoreInfo: boolean;
}

interface StatusUpdate {
  date: string;
  status: string;
  description: string;
  updatedBy: 'system' | 'admin' | 'defesa_civil';
}

const statusInfo = {
  submitted: {
    name: 'Enviado',
    description: 'Relatório recebido e aguardando análise inicial',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: FileText
  },
  under_review: {
    name: 'Em Análise',
    description: 'Relatório sendo analisado pela equipe competente',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: Eye
  },
  investigating: {
    name: 'Investigando',
    description: 'Investigação em andamento no local reportado',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    icon: Search
  },
  resolved: {
    name: 'Resolvido',
    description: 'Problema foi resolvido ou ação foi tomada',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CheckCircle
  },
  closed: {
    name: 'Fechado',
    description: 'Caso foi fechado (sem ação necessária ou duplicado)',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    icon: AlertTriangle
  }
};

const priorityColors = {
  low: 'text-gray-600 bg-gray-50',
  medium: 'text-blue-600 bg-blue-50',
  high: 'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50'
};

export default function AnonymousReportStatusPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [reportStatus, setReportStatus] = useState<AnonymousReportStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!trackingCode.trim()) {
      setError('Por favor, insira um código de acompanhamento válido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get report status from Firebase
      // TODO: Implementar integração real com AnonymousReportsService
      setError('Código de rastreamento não encontrado. Funcionalidade em desenvolvimento.');
    } catch (error: any) {
      console.error('Erro ao buscar relatório:', error);
      setError('Erro ao buscar status do relatório. Tente novamente.');
      setReportStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUpdatedByLabel = (updatedBy: string) => {
    switch (updatedBy) {
      case 'system': return 'Sistema';
      case 'admin': return 'Administrador';
      case 'defesa_civil': return 'Defesa Civil';
      default: return updatedBy;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Shield className="inline-block w-8 h-8 mr-3 text-green-600" />
            Status de Denúncia Anônima
          </h1>
          <p className="text-gray-600">
            Acompanhe o andamento da sua denúncia anônima usando o código fornecido
          </p>
        </div>

        {/* Formulário de Busca */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Consultar Status</CardTitle>
            <CardDescription>
              Digite o código de acompanhamento que você recebeu ao fazer a denúncia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Ex: ANON123456"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  className="font-mono"
                  maxLength={10}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Consultar
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Resultado da Busca */}
        {reportStatus && (
          <div className="space-y-6">
            {/* Status Atual */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Código: {reportStatus.trackingCode}</CardTitle>
                    <CardDescription>
                      Categoria: {reportStatus.category}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge className={priorityColors[reportStatus.priority]}>
                      Prioridade: {reportStatus.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${statusInfo[reportStatus.status].color}`}>
                      {(() => {
                        const Icon = statusInfo[reportStatus.status].icon;
                        return <Icon className="w-5 h-5 mr-2" />;
                      })()}
                      <span className="font-semibold">
                        {statusInfo[reportStatus.status].name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {statusInfo[reportStatus.status].description}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-semibold">Enviado em</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(reportStatus.submittedAt)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-semibold">Última atualização</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(reportStatus.lastUpdate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atualizações</CardTitle>
                <CardDescription>
                  Acompanhe todas as atualizações do seu relatório
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportStatus.updates.map((update, index) => (
                    <div key={`update-${update.date}-${index}`} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900">{update.status}</h4>
                          <span className="text-xs text-gray-500">
                            {formatDate(update.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{update.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {getUpdatedByLabel(update.updatedBy)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ações Disponíveis */}
            {reportStatus.canProvideMoreInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Fornecer Mais Informações</CardTitle>
                  <CardDescription>
                    Você pode fornecer informações adicionais para ajudar na investigação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Adicionar Informações
                    </Button>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Anexar Evidências
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Códigos de Exemplo para Teste */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">💡 Para Testar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">
              Use estes códigos para testar o sistema:
            </p>
            <div className="space-y-1 text-sm">
              <p><code className="bg-white px-2 py-1 rounded">ANON123456</code> - Caso em investigação</p>
              <p><code className="bg-white px-2 py-1 rounded">ANON789012</code> - Caso resolvido</p>
            </div>
          </CardContent>
        </Card>

        {/* Informações Importantes */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            ℹ️ Informações Importantes
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Guarde seu código de acompanhamento em local seguro</li>
            <li>• O processamento de denúncias pode levar de 2 a 7 dias úteis</li>
            <li>• Casos urgentes são priorizados automaticamente</li>
            <li>• Sua identidade permanece anônima durante todo o processo</li>
            <li>• Você pode fornecer informações adicionais quando solicitado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
