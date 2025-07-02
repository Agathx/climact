'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Shield, 
  Heart, 
  Flame,
  Search,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  type: 'fire' | 'police' | 'medical' | 'civil_defense' | 'environmental' | 'general';
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  region: string;
  available24h: boolean;
  description?: string;
  priority: 'high' | 'medium' | 'low';
}

const emergencyTypes = {
  fire: { name: 'Bombeiros', icon: Flame, color: 'text-red-600 bg-red-50' },
  police: { name: 'Polícia', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  medical: { name: 'Médico/SAMU', icon: Heart, color: 'text-green-600 bg-green-50' },
  civil_defense: { name: 'Defesa Civil', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
  environmental: { name: 'Ambiental', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
  general: { name: 'Geral', icon: Phone, color: 'text-gray-600 bg-gray-50' }
};

export default function EmergencyContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Load emergency contacts from Firebase
  useEffect(() => {
    const loadEmergencyContacts = async () => {
      try {
        setLoading(true);
        const { getEmergencyContacts } = await import('@/services/emergencyService');
        const contactsData = await getEmergencyContacts();
        setContacts(contactsData || []);
      } catch (error) {
        console.error('Erro ao carregar contatos de emergência:', error);
        // Fallback to national emergency numbers if Firebase fails
        setContacts([
          {
            id: '1',
            name: 'Bombeiros',
            type: 'fire',
            phone: '193',
            city: 'Nacional',
            state: 'BR',
            region: 'Nacional',
            available24h: true,
            description: 'Emergências de incêndio, resgate e primeiros socorros',
            priority: 'high'
          },
          {
            id: '2',
            name: 'SAMU',
            type: 'medical',
            phone: '192',
            city: 'Nacional',
            state: 'BR',
            region: 'Nacional',
            available24h: true,
            description: 'Atendimento médico de urgência e emergência',
            priority: 'high'
          },
          {
            id: '3',
            name: 'Polícia Militar',
            type: 'police',
            phone: '190',
            city: 'Nacional',
            state: 'BR',
            region: 'Nacional',
            available24h: true,
            description: 'Emergências policiais e segurança pública',
            priority: 'high'
          },
          {
            id: '4',
            name: 'Defesa Civil',
            type: 'civil_defense',
            phone: '199',
            city: 'Nacional',
            state: 'BR',
            region: 'Nacional',
            available24h: true,
            description: 'Emergências relacionadas a desastres naturais',
            priority: 'high'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadEmergencyContacts();
  }, []);

  const regions = ['all', ...Array.from(new Set(contacts.map(c => c.region)))];

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || contact.type === selectedType;
    const matchesRegion = selectedRegion === 'all' || contact.region === selectedRegion;
    
    return matchesSearch && matchesType && matchesRegion;
  });

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar número:', error);
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Phone className="inline-block w-8 h-8 mr-3 text-red-600" />
          Contatos de Emergência
        </h1>
        <p className="text-gray-600">
          Acesso rápido aos principais serviços de emergência e socorro
        </p>
      </div>

      {/* Contatos Principais - Destaque */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-red-600">🚨 Emergências Principais</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contacts
            .filter(c => c.priority === 'high' && ['193', '192', '190', '199'].includes(c.phone))
            .map((contact) => {
              const typeInfo = emergencyTypes[contact.type];
              const Icon = typeInfo.icon;
              
              return (
                <Card key={contact.id} className="hover:shadow-md transition-shadow border-2 border-red-100">
                  <CardContent className="p-4 text-center">
                    <Icon className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <h3 className="font-bold text-lg mb-1">{contact.phone}</h3>
                    <p className="text-sm text-gray-600 mb-3">{typeInfo.name}</p>
                    <Button 
                      onClick={() => handleCall(contact.phone)}
                      className="w-full bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Ligar Agora
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Filtros */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            {Object.entries(emergencyTypes).map(([key, type]) => (
              <option key={key} value={key}>{type.name}</option>
            ))}
          </select>
          
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as regiões</option>
            {regions.filter(r => r !== 'all').map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Contatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => {
          const typeInfo = emergencyTypes[contact.type];
          const Icon = typeInfo.icon;
          
          return (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contact.name}</CardTitle>
                      <Badge className={typeInfo.color}>
                        {typeInfo.name}
                      </Badge>
                    </div>
                  </div>
                  {contact.available24h && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Clock className="w-3 h-3 mr-1" />
                      24h
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {contact.description && (
                  <p className="text-sm text-gray-600">{contact.description}</p>
                )}
                
                <div className="space-y-2">
                  {/* Telefone Principal */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono font-semibold">{contact.phone}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyPhone(contact.phone)}
                      >
                        {copiedPhone === contact.phone ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCall(contact.phone)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* WhatsApp */}
                  {contact.whatsapp && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">WhatsApp: {contact.whatsapp}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600"
                        onClick={() => handleWhatsApp(contact.whatsapp!)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Email */}
                  {contact.email && (
                    <div className="text-sm text-gray-600">
                      <strong>Email:</strong> {contact.email}
                    </div>
                  )}
                  
                  {/* Endereço */}
                  {contact.address && (
                    <div className="text-sm text-gray-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {contact.address}, {contact.city} - {contact.state}
                    </div>
                  )}
                  
                  {/* Localização */}
                  <div className="text-sm text-gray-500">
                    <strong>Região:</strong> {contact.region} | {contact.city} - {contact.state}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhum contato encontrado
          </h3>
          <p className="text-gray-500">
            Tente ajustar os filtros ou termo de busca
          </p>
        </div>
      )}

      {/* Informações Importantes */}
      <div className="mt-12 p-6 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-3">
          ⚠️ Informações Importantes
        </h3>
        <ul className="space-y-2 text-sm text-red-700">
          <li>• Em casos de emergência, sempre ligue primeiro para os números principais (193, 192, 190)</li>
          <li>• Mantenha sempre atualizado seu endereço no perfil para atendimento mais rápido</li>
          <li>• Alguns serviços podem ter horários específicos de funcionamento</li>
          <li>• Use o WhatsApp para situações menos urgentes ou follow-up</li>
          <li>• Em caso de emergência climática, priorize a Defesa Civil (199)</li>
        </ul>
      </div>
    </div>
  );
}
