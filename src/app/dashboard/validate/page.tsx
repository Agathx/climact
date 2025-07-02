'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Users, 
  Phone,
  User,
  FileText,
  Megaphone,
  Shield,
  Eye,
  X
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Report {
  id: string;
  type: 'flooding' | 'landslide' | 'storm' | 'other';
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'validated' | 'investigating' | 'resolved' | 'false_alarm';
  submittedBy: {
    name: string;
    phone: string;
  };
  submittedAt: Date;
  aiAnalysis: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    category: string;
    suggestedActions: string[];
  };
  images: string[];
  confirmations: number;
  validatedBy?: string;
  validatedAt?: Date;
  publicAlert?: {
    id: string;
    message: string;
    issuedAt: Date;
  };
}

// Interface para integração com Firebase
import { useEffect } from 'react';
import { getReports, validateReportCommunity, reviewReportDefesaCivil } from '@/services/reportService';
import type { Report as FirebaseReport } from '@/types/report';
import { useToast } from '@/hooks/use-toast';

// Converter tipo Firebase para tipo da interface local
const convertFirebaseReport = (firebaseReport: FirebaseReport): Report => ({
  id: firebaseReport.id,
  type: firebaseReport.incidentType as Report['type'],
  description: firebaseReport.description,
  location: {
    lat: firebaseReport.location.latitude,
    lng: firebaseReport.location.longitude,
    address: firebaseReport.location.address || 'Endereço não especificado'
  },
  urgency: firebaseReport.severity === 'critica' ? 'critical' :
           firebaseReport.severity === 'alta' ? 'high' :
           firebaseReport.severity === 'media' ? 'medium' : 'low',
  status: firebaseReport.status === 'aprovado' ? 'validated' :
         firebaseReport.status === 'rejeitado_defesa_civil' ? 'false_alarm' :
         firebaseReport.status === 'pendente_comunidade' ? 'pending' : 'investigating',
  submittedBy: {
    name: firebaseReport.isAnonymous ? 'Relatório Anônimo' : 'Usuário',
    phone: 'Não disponível'
  },
  submittedAt: firebaseReport.createdAt.toDate(),
  aiAnalysis: {
    severity: firebaseReport.severity === 'critica' ? 'critical' :
              firebaseReport.severity === 'alta' ? 'high' :
              firebaseReport.severity === 'media' ? 'medium' : 'low',
    confidence: firebaseReport.aiAnalysis?.confidence || 0,
    category: firebaseReport.incidentType,
    suggestedActions: firebaseReport.aiAnalysis?.keywords || []
  },
  images: firebaseReport.mediaUrls || [],
  confirmations: firebaseReport.communityValidations.filter(v => v.isValid).length,
  validatedBy: firebaseReport.defesaCivilValidation?.validatorId,
  validatedAt: firebaseReport.defesaCivilValidation?.timestamp?.toDate(),
  publicAlert: undefined
});

export default function ValidateReportsPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [alertMessage, setAlertMessage] = useState('');
  const [isIssuingAlert, setIsIssuingAlert] = useState(false);

  // Carregar relatórios do Firebase
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const { reports: firebaseReports } = await getReports({});
        const convertedReports = firebaseReports.map(convertFirebaseReport);
        setReports(convertedReports);
      } catch (error: any) {
        console.error('Erro ao carregar relatórios:', error);
        toast({
          title: "Erro ao carregar relatórios",
          description: error.message || "Tente novamente",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'defesa_civil' || user?.role === 'admin') {
      loadReports();
    }
  }, [user, toast]);

  // Verificar se o usuário tem permissão
  if (!user || (user.role !== 'defesa_civil' && user.role !== 'admin')) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground">
          Esta área é exclusiva para membros da Defesa Civil.
        </p>
      </div>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'validated': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_alarm': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flooding': return '🌊';
      case 'landslide': return '⛰️';
      case 'storm': return '⛈️';
      default: return '⚠️';
    }
  };

  const validateReport = async (reportId: string, newStatus: Report['status']) => {
    try {
      // Para validação comunitária
      if (newStatus === 'validated') {
        await validateReportCommunity({ reportId, vote: 'up' });
      }
      
      // Para decisão da Defesa Civil
      if (newStatus === 'resolved' || newStatus === 'false_alarm') {
        await reviewReportDefesaCivil({ 
          reportId, 
          decision: newStatus === 'resolved' ? 'approve' : 'reject',
          reason: newStatus === 'false_alarm' ? 'Relatório considerado falso alarme' : undefined
        });
      }

      // Atualizar estado local
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: newStatus,
              validatedBy: user?.name ?? 'Defesa Civil',
              validatedAt: new Date()
            }
          : report
      ));

      toast({
        title: "Relatório atualizado",
        description: `Status alterado para ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Erro ao validar relatório:', error);
      toast({
        title: "Erro ao validar relatório",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
    
    if (selectedReport?.id === reportId) {
      setSelectedReport(prev => prev ? {
        ...prev,
        status: newStatus,
        validatedBy: user?.name ?? 'Defesa Civil',
        validatedAt: new Date()
      } : null);
    }
  };

  const issuePublicAlert = async () => {
    if (!selectedReport || !alertMessage.trim()) return;

    setIsIssuingAlert(true);
    
    try {
      // Simular envio do alerta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAlert = {
        id: `ALT${Date.now()}`,
        message: alertMessage,
        issuedAt: new Date()
      };

      setReports(prev => prev.map(report => 
        report.id === selectedReport.id 
          ? { ...report, publicAlert: newAlert }
          : report
      ));

      setSelectedReport(prev => prev ? { ...prev, publicAlert: newAlert } : null);
      setAlertMessage('');
      
      alert('Alerta público emitido com sucesso!');
    } catch (error) {
      console.error('Erro ao emitir alerta:', error);
      alert('Erro ao emitir alerta. Tente novamente.');
    } finally {
      setIsIssuingAlert(false);
    }
  };

  const filteredReports = reports.filter(report => {
    switch (activeTab) {
      case 'pending': return report.status === 'pending';
      case 'validated': return report.status === 'validated';
      case 'investigating': return report.status === 'investigating';
      case 'all': return true;
      default: return report.status === 'pending';
    }
  });

  // Helper functions para evitar operações ternárias aninhadas
  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return 'Desconhecido';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'validated': return 'Validado';
      case 'investigating': return 'Em Análise';
      case 'resolved': return 'Resolvido';
      case 'false_alarm': return 'Falso Alarme';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Relatórios</h1>
        <p className="text-muted-foreground">
          Valide relatórios, emita alertas oficiais e coordene a resposta a emergências.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Relatórios */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Relatórios
                </span>
                <Badge variant="outline">
                  {filteredReports.length} item(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending">Pendentes</TabsTrigger>
                  <TabsTrigger value="validated">Validados</TabsTrigger>
                  <TabsTrigger value="investigating">Em Análise</TabsTrigger>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 mt-6">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum relatório encontrado nesta categoria.
                      </p>
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <Card 
                        key={report.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedReport?.id === report.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getTypeIcon(report.type)}</span>
                              <div>
                                <h3 className="font-semibold text-sm">
                                  {report.id} - {report.submittedBy.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {report.submittedAt.toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getUrgencyColor(report.urgency)}>
                                {getUrgencyLabel(report.urgency)}
                              </Badge>
                              <Badge className={getStatusColor(report.status)}>
                                {getStatusLabel(report.status)}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {report.description}
                          </p>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {report.location.address.split(',')[0]}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {report.confirmations} confirmações
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>IA:</span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(report.aiAnalysis.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Relatório */}
        <div>
          {selectedReport ? (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Detalhes
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReport(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedReport.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Localização</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedReport.location.address}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Contato</h3>
                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {selectedReport.submittedBy.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedReport.submittedBy.phone}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Análise da IA</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Categoria:</strong> {selectedReport.aiAnalysis.category}
                      </p>
                      <p className="text-sm">
                        <strong>Confiança:</strong> {Math.round(selectedReport.aiAnalysis.confidence * 100)}%
                      </p>
                      <div>
                        <strong className="text-sm">Ações Sugeridas:</strong>
                        <ul className="text-sm text-muted-foreground mt-1 ml-4">
                          {selectedReport.aiAnalysis.suggestedActions.map((action) => (
                            <li key={`action-${action.replace(/\s+/g, '-').toLowerCase()}`} className="list-disc">{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ações de Validação */}
              {selectedReport.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Validação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => validateReport(selectedReport.id, 'validated')}
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validar Relatório
                    </Button>
                    <Button
                      onClick={() => validateReport(selectedReport.id, 'investigating')}
                      variant="outline"
                      className="w-full"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Marcar como Em Análise
                    </Button>
                    <Button
                      onClick={() => validateReport(selectedReport.id, 'false_alarm')}
                      variant="secondary"
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Marcar como Falso Alarme
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Emitir Alerta Público */}
              {selectedReport.status === 'validated' && !selectedReport.publicAlert && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5" />
                      Alerta Público
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="alertMessage">Mensagem do Alerta</Label>
                      <Textarea
                        id="alertMessage"
                        placeholder="Digite a mensagem do alerta público..."
                        value={alertMessage}
                        onChange={(e) => setAlertMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={issuePublicAlert}
                      disabled={!alertMessage.trim() || isIssuingAlert}
                      className="w-full"
                    >
                      <Megaphone className="w-4 h-4 mr-2" />
                      {isIssuingAlert ? 'Emitindo...' : 'Emitir Alerta'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Alerta Emitido */}
              {selectedReport.publicAlert && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-green-600" />
                      Alerta Emitido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 mb-2">
                        {selectedReport.publicAlert.message}
                      </p>
                      <p className="text-xs text-green-600">
                        Emitido em: {selectedReport.publicAlert.issuedAt.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Selecione um Relatório</h3>
                <p className="text-sm text-muted-foreground">
                  Clique em um relatório na lista para ver os detalhes e ações disponíveis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
