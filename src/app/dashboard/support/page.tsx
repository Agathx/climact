'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Phone, 
  MapPin, 
  Users, 
  Clock, 
  AlertTriangle, 
  Heart, 
  Home, 
  Car,
  Utensils,
  Shield,
  Navigation,
  Send,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/use-session';

interface HelpRequest {
  id: string;
  type: 'rescue' | 'medical' | 'shelter' | 'food' | 'water' | 'transportation' | 'security' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  affectedPeople: number;
  contactInfo: {
    phone: string;
    alternativePhone?: string;
  };
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  estimatedResponse?: Date;
  assignedVolunteers?: string[];
}

// Dados mock para demonstração
const mockRequests: HelpRequest[] = [
  {
    id: '1',
    type: 'medical',
    urgency: 'critical',
    title: 'Emergência Médica',
    description: 'Pessoa idosa com dificuldades respiratórias',
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Rua das Flores, 123 - Centro, São Paulo'
    },
    affectedPeople: 1,
    contactInfo: {
      phone: '(11) 99999-9999'
    },
    status: 'assigned',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    estimatedResponse: new Date(Date.now() + 15 * 60 * 1000),
    assignedVolunteers: ['vol001', 'vol002']
  },
  {
    id: '2',
    type: 'food',
    urgency: 'medium',
    title: 'Necessidade de Alimentos',
    description: 'Família com crianças pequenas sem alimentos',
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Av. Paulista, 456 - Bela Vista, São Paulo'
    },
    affectedPeople: 5,
    contactInfo: {
      phone: '(11) 88888-8888'
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
];

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(mockRequests);
  const { user } = useSession();
  const { toast } = useToast();

  // Estados do formulário
  const [formData, setFormData] = useState({
    type: '',
    urgency: '',
    title: '',
    description: '',
    address: '',
    affectedPeople: 1,
    phone: '',
    alternativePhone: ''
  });

  const helpTypes = [
    { value: 'rescue', label: 'Resgate/Salvamento', icon: Shield, color: 'text-red-600' },
    { value: 'medical', label: 'Emergência Médica', icon: Heart, color: 'text-red-500' },
    { value: 'shelter', label: 'Abrigo/Moradia', icon: Home, color: 'text-blue-600' },
    { value: 'food', label: 'Alimentos', icon: Utensils, color: 'text-green-600' },
    { value: 'water', label: 'Água Potável', icon: Users, color: 'text-blue-500' },
    { value: 'transportation', label: 'Transporte', icon: Car, color: 'text-purple-600' },
    { value: 'security', label: 'Segurança', icon: Shield, color: 'text-orange-600' },
    { value: 'other', label: 'Outros', icon: AlertTriangle, color: 'text-gray-600' }
  ];

  const urgencyLevels = [
    { value: 'critical', label: 'Crítico', color: 'bg-red-500 text-white', description: 'Risco de vida' },
    { value: 'high', label: 'Alto', color: 'bg-orange-500 text-white', description: 'Urgente' },
    { value: 'medium', label: 'Médio', color: 'bg-yellow-500 text-black', description: 'Importante' },
    { value: 'low', label: 'Baixo', color: 'bg-green-500 text-white', description: 'Não urgente' }
  ];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Aqui você faria reverse geocoding para obter o endereço
          setFormData(prev => ({
            ...prev,
            address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
          }));
          toast({
            title: 'Localização capturada',
            description: 'Sua localização foi adicionada automaticamente',
          });
        },
        (error) => {
          toast({
            title: 'Erro de localização',
            description: 'Não foi possível obter sua localização',
            variant: 'destructive',
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.urgency || !formData.title || !formData.description) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simular envio da solicitação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newRequest: HelpRequest = {
        id: Date.now().toString(),
        type: formData.type as any,
        urgency: formData.urgency as any,
        title: formData.title,
        description: formData.description,
        location: {
          latitude: -23.5505, // Seria obtido da API de geocoding
          longitude: -46.6333,
          address: formData.address
        },
        affectedPeople: formData.affectedPeople,
        contactInfo: {
          phone: formData.phone,
          alternativePhone: formData.alternativePhone || undefined
        },
        status: 'pending',
        createdAt: new Date()
      };
      
      setHelpRequests(prev => [newRequest, ...prev]);
      
      // Resetar formulário
      setFormData({
        type: '',
        urgency: '',
        title: '',
        description: '',
        address: '',
        affectedPeople: 1,
        phone: '',
        alternativePhone: ''
      });
      
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação foi registrada e voluntários serão notificados',
      });
      
      setActiveTab('history');
      
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'in_progress': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'assigned': return 'Atribuído';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    const helpType = helpTypes.find(t => t.value === type);
    return helpType ? helpType.icon : AlertTriangle;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda</h1>
          <p className="text-muted-foreground">
            Solicite ajuda em situações de emergência ou acompanhe suas solicitações
          </p>
        </div>

        {/* Alerta de Emergência */}
        <Alert className="border-red-200 bg-red-50">
          <Phone className="h-4 w-4" />
          <AlertDescription>
            <strong>Em caso de emergência extrema:</strong> Ligue imediatamente para 190 (Polícia), 
            192 (SAMU) ou 193 (Bombeiros). Use esta plataforma para situações que não são de risco iminente.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'request' ? 'default' : 'outline'}
            onClick={() => setActiveTab('request')}
            className="flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            Nova Solicitação
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            Minhas Solicitações
          </Button>
        </div>

        {/* Formulário de Nova Solicitação */}
        {activeTab === 'request' && (
          <Card>
            <CardHeader>
              <CardTitle>Solicitar Ajuda</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo de Ajuda */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tipo de Ajuda Necessária *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {helpTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Card
                          key={type.value}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            formData.type === type.value ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <Icon className={`w-8 h-8 mx-auto mb-2 ${type.color}`} />
                            <p className="text-sm font-medium">{type.label}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Nível de Urgência */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Nível de Urgência *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {urgencyLevels.map((level) => (
                      <Card
                        key={level.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          formData.urgency === level.value ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, urgency: level.value }))}
                      >
                        <CardContent className="p-4 text-center">
                          <Badge className={`${level.color} mb-2`}>
                            {level.label}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{level.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Título e Descrição */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Título da Solicitação *
                    </label>
                    <Input
                      placeholder="Ex: Família necessita de alimentos"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Pessoas Afetadas
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.affectedPeople}
                      onChange={(e) => setFormData(prev => ({ ...prev, affectedPeople: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Descrição Detalhada *
                  </label>
                  <Textarea
                    placeholder="Descreva a situação com detalhes que possam ajudar os voluntários"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Localização */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Localização *
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Endereço completo ou ponto de referência"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Localização Atual
                    </Button>
                  </div>
                </div>

                {/* Contatos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Telefone Principal *
                    </label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Telefone Alternativo
                    </label>
                    <Input
                      placeholder="(11) 88888-8888"
                      value={formData.alternativePhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, alternativePhone: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Solicitações */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {helpRequests.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2" />
                    <p>Nenhuma solicitação encontrada</p>
                    <p className="text-sm">Suas solicitações aparecerão aqui</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              helpRequests.map((request) => {
                const Icon = getTypeIcon(request.type);
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Icon className="w-6 h-6 mt-1 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusLabel(request.status)}
                              </Badge>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(request.createdAt).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <p className="text-sm">{request.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          {request.location.address}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          {request.affectedPeople} pessoa(s) afetada(s)
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                          {request.contactInfo.phone}
                        </div>
                        {request.estimatedResponse && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                            Previsão: {new Date(request.estimatedResponse).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>

                      {request.assignedVolunteers && request.assignedVolunteers.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium">
                            {request.assignedVolunteers.length} voluntário(s) designado(s)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
