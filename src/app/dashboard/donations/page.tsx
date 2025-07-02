'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, 
  MapPin, 
  Clock, 
  Phone,
  Mail,
  Plus,
  Search,
  Truck,
  Home,
  Utensils,
  Shirt,
  DollarSign,
  CheckCircle,
  Users
} from 'lucide-react';
import { type DonationRequest, type DonationItem } from '@/services/additionalFeaturesService';
import { useSession } from '@/hooks/use-session';

export default function DonationsPage() {
  const { user } = useSession();
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationRequest | null>(null);

  // Form data para criar nova solicitação
  const [formData, setFormData] = useState({
    organizationName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    requestType: 'need' as 'need' | 'offer',
    category: 'food' as DonationRequest['category'],
    items: [] as DonationItem[],
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'São Paulo, SP'
    },
    urgency: 'medium' as DonationRequest['urgency'],
    description: '',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
  });

  // Form data para item
  const [newItem, setNewItem] = useState<DonationItem>({
    name: '',
    quantity: 1,
    unit: 'unidade',
    description: '',
    condition: 'new'
  });

  // Mock data - em produção viria do AdditionalFeaturesService
  const mockDonations: DonationRequest[] = [
    {
      id: '1',
      createdBy: 'user1',
      organizationName: 'Associação Bairro Unido',
      contactInfo: {
        email: 'contato@bairrounido.org',
        phone: '(11) 98765-4321',
        address: 'Rua das Flores, 123 - Centro'
      },
      requestType: 'need',
      category: 'food',
      items: [
        { name: 'Cestas Básicas', quantity: 50, unit: 'unidades', description: 'Para famílias em vulnerabilidade' },
        { name: 'Água Potável', quantity: 100, unit: 'litros', description: 'Garrafas de 5L' }
      ],
      location: {
        latitude: -23.5505,
        longitude: -46.6333,
        address: 'Centro, São Paulo - SP'
      },
      urgency: 'high',
      description: 'Necessitamos de alimentos para distribuir para 50 famílias afetadas pelas chuvas.',
      status: 'active',
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      fulfillmentHistory: [],
      verificationStatus: 'verified',
      verifiedBy: 'admin1'
    },
    {
      id: '2',
      createdBy: 'user2',
      organizationName: 'ONG Mãos Solidárias',
      contactInfo: {
        email: 'doacao@maossolidarias.org',
        phone: '(11) 91234-5678',
        address: 'Av. Principal, 456 - Zona Sul'
      },
      requestType: 'offer',
      category: 'clothing',
      items: [
        { name: 'Roupas de Inverno', quantity: 200, unit: 'peças', condition: 'used_good', description: 'Casacos, cobertores' },
        { name: 'Calçados', quantity: 50, unit: 'pares', condition: 'used_good', description: 'Diversos tamanhos' }
      ],
      location: {
        latitude: -23.5755,
        longitude: -46.6083,
        address: 'Zona Sul, São Paulo - SP'
      },
      urgency: 'medium',
      description: 'Temos roupas de inverno para doar. Interessados podem agendar retirada.',
      status: 'active',
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      fulfillmentHistory: [],
      verificationStatus: 'verified',
      verifiedBy: 'admin2'
    },
    {
      id: '3',
      createdBy: 'user3',
      organizationName: 'Defesa Civil - Região Norte',
      contactInfo: {
        email: 'emergencia@defesacivil.gov.br',
        phone: '199',
        address: 'Centro de Operações - Zona Norte'
      },
      requestType: 'need',
      category: 'medicine',
      items: [
        { name: 'Medicamentos Básicos', quantity: 20, unit: 'kits', description: 'Analgésicos, antibióticos' },
        { name: 'Material de Primeiros Socorros', quantity: 10, unit: 'kits', description: 'Bandagens, antissépticos' }
      ],
      location: {
        latitude: -23.5205,
        longitude: -46.6383,
        address: 'Zona Norte, São Paulo - SP'
      },
      urgency: 'critical',
      description: 'URGENTE: Medicamentos para atender vítimas de deslizamento.',
      status: 'partially_fulfilled',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      updatedAt: new Date(),
      fulfillmentHistory: [
        {
          fulfilledBy: 'pharmacy1',
          fulfillerName: 'Farmácia São José',
          items: [{ name: 'Medicamentos Básicos', quantity: 10, unit: 'kits', description: 'Primeiros 10 kits' }],
          contactInfo: { email: 'contato@farmaciasaojose.com', phone: '(11) 99887-7665' },
          status: 'completed',
          fulfillmentDate: new Date(Date.now() - 1 * 60 * 60 * 1000)
        }
      ],
      verificationStatus: 'verified',
      verifiedBy: 'defesa_civil'
    }
  ];

  useEffect(() => {
    setDonations(mockDonations);
  }, []);

  const getCategoryIcon = (category: DonationRequest['category']) => {
    switch (category) {
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'clothing': return <Shirt className="h-4 w-4" />;
      case 'medicine': return <Plus className="h-4 w-4" />;  // Usando Plus como substituto
      case 'shelter': return <Home className="h-4 w-4" />;
      case 'transportation': return <Truck className="h-4 w-4" />;
      case 'money': return <DollarSign className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: DonationRequest['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  const getStatusBadge = (status: DonationRequest['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'partially_fulfilled':
        return <Badge variant="secondary">Parcialmente Atendido</Badge>;
      case 'fulfilled':
        return <Badge variant="outline" className="text-green-600">Completo</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
    }
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || donation.category === categoryFilter;
    const matchesType = typeFilter === 'all' || donation.requestType === typeFilter;
    const matchesUrgency = urgencyFilter === 'all' || donation.urgency === urgencyFilter;
    
    return matchesSearch && matchesCategory && matchesType && matchesUrgency;
  });

  const addItem = () => {
    if (newItem.name.trim()) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem }]
      }));
      setNewItem({
        name: '',
        quantity: 1,
        unit: 'unidade',
        description: '',
        condition: 'new'
      });
    }
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateDonation = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Em produção usaria: const donationId = await AdditionalFeaturesService.createDonationRequest(formData);
      console.log('Nova solicitação criada:', formData);
      setShowCreateDialog(false);
      // Reset form
      setFormData({
        organizationName: '',
        contactEmail: '',
        contactPhone: '',
        contactAddress: '',
        requestType: 'need',
        category: 'food',
        items: [],
        location: { latitude: -23.5505, longitude: -46.6333, address: 'São Paulo, SP' },
        urgency: 'medium',
        description: '',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillDonation = async () => {
    if (!selectedDonation || !user) return;

    setLoading(true);
    try {
      // Em produção usaria: await AdditionalFeaturesService.fulfillDonationRequest(...)
      console.log('Solicitação atendida:', selectedDonation.id);
      setShowFulfillDialog(false);
      setSelectedDonation(null);
    } catch (error) {
      console.error('Erro ao atender solicitação:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} dias restantes`;
    if (hours > 0) return `${hours} horas restantes`;
    return 'Expira em breve';
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Doações</h1>
          <p className="text-muted-foreground">
            Conecte necessidades com disponibilidade na sua comunidade
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Doação</DialogTitle>
              <DialogDescription>
                Crie uma solicitação para oferecer ou solicitar doações
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Organização</label>
                  <Input
                    value={formData.organizationName}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                    placeholder="Nome da organização"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    value={formData.requestType}
                    onValueChange={(value: 'need' | 'offer') => 
                      setFormData(prev => ({ ...prev, requestType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="need">Preciso de doação</SelectItem>
                      <SelectItem value="offer">Quero doar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: DonationRequest['category']) => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Alimentos</SelectItem>
                      <SelectItem value="clothing">Roupas</SelectItem>
                      <SelectItem value="medicine">Medicamentos</SelectItem>
                      <SelectItem value="shelter">Abrigo</SelectItem>
                      <SelectItem value="transportation">Transporte</SelectItem>
                      <SelectItem value="money">Dinheiro</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Urgência</label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value: DonationRequest['urgency']) => 
                      setFormData(prev => ({ ...prev, urgency: value }))
                    }
                  >
                    <SelectTrigger>
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

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva detalhadamente a solicitação..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Itens</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="Nome do item"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Quantidade"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                    <Input
                      placeholder="Unidade"
                      value={newItem.unit}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    />
                    <Button type="button" onClick={addItem} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.items.length > 0 && (
                    <div className="space-y-1">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">
                            {item.quantity} {item.unit} de {item.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="contato@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Endereço</label>
                  <Input
                    value={formData.contactAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactAddress: e.target.value }))}
                    placeholder="Endereço completo"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateDonation} disabled={loading} className="flex-1">
                  {loading ? 'Criando...' : 'Criar Solicitação'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar organizações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="food">Alimentos</SelectItem>
                <SelectItem value="clothing">Roupas</SelectItem>
                <SelectItem value="medicine">Medicamentos</SelectItem>
                <SelectItem value="shelter">Abrigo</SelectItem>
                <SelectItem value="transportation">Transporte</SelectItem>
                <SelectItem value="money">Dinheiro</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="need">Precisam de doação</SelectItem>
                <SelectItem value="offer">Querem doar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as urgências</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Doações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDonations.map((donation) => (
          <Card key={donation.id} className="relative">
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l ${getUrgencyColor(donation.urgency)}`} />
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(donation.category)}
                  <CardTitle className="text-lg">{donation.organizationName}</CardTitle>
                </div>
                {getStatusBadge(donation.status)}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant={donation.requestType === 'need' ? 'destructive' : 'default'}>
                  {donation.requestType === 'need' ? 'Precisa' : 'Oferece'}
                </Badge>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {donation.location.address}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm">{donation.description}</p>
              
              {/* Itens */}
              <div>
                <h4 className="font-medium text-sm mb-2">Itens:</h4>
                <div className="space-y-1">
                  {donation.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-sm bg-muted p-2 rounded">
                      <span className="font-medium">{item.quantity} {item.unit}</span> de {item.name}
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                  ))}
                  {donation.items.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{donation.items.length - 3} itens adicionais
                    </p>
                  )}
                </div>
              </div>

              {/* Contato e Tempo */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatTimeLeft(donation.expiresAt)}
                </div>
                <div className="flex items-center gap-1">
                  {donation.verificationStatus === 'verified' && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  Verificado
                </div>
              </div>

              {/* Progresso (se parcialmente atendido) */}
              {donation.fulfillmentHistory.length > 0 && (
                <div className="text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    {donation.fulfillmentHistory.length} contribuição(ões)
                  </div>
                  <div className="space-y-1">
                    {donation.fulfillmentHistory.slice(0, 2).map((fulfillment, index) => (
                      <div key={index} className="text-xs bg-green-50 p-1 rounded">
                        {fulfillment.fulfillerName}: {fulfillment.items[0]?.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedDonation(donation);
                    setShowFulfillDialog(true);
                  }}
                >
                  {donation.requestType === 'need' ? 'Contribuir' : 'Interesse'}
                </Button>
                <Button size="sm" variant="ghost" className="p-2">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="p-2">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDonations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma solicitação encontrada</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou criar uma nova solicitação
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para Atender/Contribuir */}
      <Dialog open={showFulfillDialog} onOpenChange={setShowFulfillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDonation?.requestType === 'need' ? 'Contribuir com Doação' : 'Demonstrar Interesse'}
            </DialogTitle>
            <DialogDescription>
              Entre em contato com {selectedDonation?.organizationName} para coordenar a doação
            </DialogDescription>
          </DialogHeader>
          
          {selectedDonation && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Informações de Contato:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedDonation.contactInfo.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedDonation.contactInfo.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {selectedDonation.contactInfo.address}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleFulfillDonation} disabled={loading} className="flex-1">
                  {loading ? 'Processando...' : 'Confirmar Contato'}
                </Button>
                <Button variant="outline" onClick={() => setShowFulfillDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
