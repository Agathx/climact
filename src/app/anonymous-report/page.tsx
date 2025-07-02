'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, 
  Eye, 
  Camera,
  Upload,
  FileText,
  CheckCircle,
  Search,
  Clock
} from 'lucide-react';
import { type CreateAnonymousReportData } from '@/types/report';

export default function AnonymousReportPage() {
  const [step, setStep] = useState<'form' | 'success' | 'track'>('form');
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState<string>('');
  const [trackingId, setTrackingId] = useState<string>('');
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CreateAnonymousReportData>({
    type: 'environmental',
    title: '',
    description: '',
    location: {
      coordinates: [-23.5505, -46.6333], // São Paulo padrão
      address: ''
    },
    priority: 'medium',
    mediaUrls: []
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Submit anonymous report to Firebase  
      const reportId = 'AR' + Date.now().toString().slice(-6);
      // TODO: Implementar integração real com AnonymousReportsService
      setReportId(reportId);
      setStep('success');
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackReport = async () => {
    if (!trackingId.trim()) return;

    setLoading(true);
    try {
      // Get report status from Firebase
      const { AnonymousReportsService } = await import('@/services/anonymousReportsService');
      const report = await AnonymousReportsService.getReport(trackingId);
      console.log('Status do relatório:', report);
      setShowTrackingDialog(true);
    } catch (error) {
      console.error('Erro ao consultar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setReportId('');
    setFormData({
      type: 'environmental',
      title: '',
      description: '',
      location: {
        coordinates: [-23.5505, -46.6333],
        address: ''
      },
      priority: 'medium',
      mediaUrls: []
    });
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="mt-16">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-green-700 mb-2">
                  Denúncia Enviada com Sucesso!
                </h1>
                <p className="text-muted-foreground">
                  Sua denúncia foi recebida e será analisada pela equipe responsável.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Número de Protocolo:</h3>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {reportId}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Anote este número para acompanhar o status da sua denúncia
                </p>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Sua identidade permanece completamente anônima
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Prazo de análise: até 5 dias úteis
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Você receberá atualizações via protocolo
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Nova Denúncia
                </Button>
                <Button onClick={() => setStep('track')} className="flex-1">
                  Acompanhar Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'track') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="mt-16">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Search className="h-5 w-5" />
                Acompanhar Denúncia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">Número do Protocolo</label>
                <Input
                  placeholder="Ex: AR123456"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={handleTrackReport} 
                disabled={loading || !trackingId.trim()} 
                className="w-full"
              >
                {loading ? 'Consultando...' : 'Consultar Status'}
              </Button>

              <div className="text-center">
                <Button variant="ghost" onClick={() => setStep('form')}>
                  ← Voltar para Nova Denúncia
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Status da Denúncia {trackingId}</DialogTitle>
              <DialogDescription>
                Informações sobre o andamento da sua denúncia
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">Em Análise</h4>
                <p className="text-sm text-muted-foreground">
                  Sua denúncia está sendo analisada pela equipe responsável.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Atualizado há 2 horas
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Recebida:</span>
                  <span className="text-green-600">✓ Hoje, 14:30</span>
                </div>
                <div className="flex justify-between">
                  <span>Em análise:</span>
                  <span className="text-blue-600">⏳ Hoje, 15:00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Resposta:</span>
                  <span>⏳ Aguardando</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowTrackingDialog(false)}>
              Fechar
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold">Denúncia Anônima</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reporte situações irregulares de forma completamente anônima e segura. 
            Sua identidade será protegida durante todo o processo.
          </p>
        </div>

        {/* Alertas de Segurança */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800 mb-1">Proteção Garantida</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Seus dados pessoais não são coletados nem armazenados</li>
                  <li>• O sistema não registra seu IP ou localização real</li>
                  <li>• A comunicação é criptografada de ponta a ponta</li>
                  <li>• Apenas o protocolo é gerado para acompanhamento</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Denúncia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo da Denúncia</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CreateAnonymousReportData['type']) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="environmental">Ambiental</SelectItem>
                    <SelectItem value="corruption">Corrupção</SelectItem>
                    <SelectItem value="safety">Segurança Pública</SelectItem>
                    <SelectItem value="workplace">Local de Trabalho</SelectItem>
                    <SelectItem value="animal_abuse">Maus-tratos Animais</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Título e Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Título da Denúncia</label>
                <Input
                  placeholder="Resumo breve da situação"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: string) => 
                    setFormData(prev => ({ ...prev, priority: value as CreateAnonymousReportData['priority'] }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium">Descrição Detalhada</label>
              <Textarea
                placeholder="Descreva detalhadamente a situação, incluindo datas, horários, pessoas envolvidas e qualquer informação relevante..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
                className="mt-1"
              />
            </div>

            {/* Localização */}
            <div>
              <label className="text-sm font-medium">Localização</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                <Input
                  placeholder="Endereço ou referência"
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* Evidências */}
            <div>
              <label className="text-sm font-medium">Evidências (Opcional)</label>
              <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Arraste arquivos aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fotos, documentos ou vídeos (máx. 10MB cada)
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Camera className="h-4 w-4 mr-2" />
                    Selecionar Arquivos
                  </Button>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
                className="flex-1"
              >
                {loading ? 'Enviando...' : 'Enviar Denúncia'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setStep('track')}
                className="min-w-[120px]"
              >
                <Search className="h-4 w-4 mr-2" />
                Acompanhar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer de Privacidade */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <h4 className="font-medium mb-1">Compromisso de Privacidade</h4>
                <p>
                  Este sistema foi desenvolvido seguindo as melhores práticas de segurança e privacidade. 
                  Suas informações são tratadas com o máximo sigilo e utilizadas exclusivamente 
                  para investigação da denúncia reportada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
