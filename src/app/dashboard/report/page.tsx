'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  MapPin, 
  AlertTriangle, 
  Upload, 
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/use-session';

interface ReportForm {
  type: 'flooding' | 'landslide' | 'storm' | 'other';
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  images: File[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  contactName: string;
  contactPhone: string;
}

export default function ReportIncidentPage() {
  const { user } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [form, setForm] = useState<ReportForm>({
    type: 'other',
    description: '',
    location: null,
    images: [],
    urgency: 'medium',
    contactName: user?.name ?? '',
    contactPhone: '',
  });

  const incidentTypes = [
    { 
      id: 'flooding', 
      label: 'Alagamento', 
      description: 'Água acumulada nas ruas, rios transbordando',
      icon: '🌊' 
    },
    { 
      id: 'landslide', 
      label: 'Deslizamento', 
      description: 'Terra ou pedras se movendo, rachaduras no solo',
      icon: '⛰️' 
    },
    { 
      id: 'storm', 
      label: 'Temporal', 
      description: 'Ventos fortes, chuva intensa, granizo',
      icon: '⛈️' 
    },
    { 
      id: 'other', 
      label: 'Outro', 
      description: 'Outro tipo de risco climático',
      icon: '⚠️' 
    },
  ];

  const urgencyLevels = [
    { 
      id: 'low', 
      label: 'Baixa', 
      description: 'Situação sob controle',
      color: 'bg-green-100 text-green-800' 
    },
    { 
      id: 'medium', 
      label: 'Média', 
      description: 'Requer atenção',
      color: 'bg-yellow-100 text-yellow-800' 
    },
    { 
      id: 'high', 
      label: 'Alta', 
      description: 'Situação preocupante',
      color: 'bg-orange-100 text-orange-800' 
    },
    { 
      id: 'critical', 
      label: 'Crítica', 
      description: 'Perigo iminente',
      color: 'bg-red-100 text-red-800' 
    },
  ];

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Simular endereço (em produção, usar serviço de geocoding)
          const address = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          
          setForm(prev => ({
            ...prev,
            location: { lat, lng, address }
          }));
          setGettingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização. Por favor, verifique as permissões.');
          setGettingLocation(false);
        }
      );
    } else {
      alert('Geolocalização não é suportada neste navegador.');
      setGettingLocation(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + form.images.length > 3) {
      alert('Máximo de 3 imagens permitidas.');
      return;
    }
    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.description.trim()) {
      alert('Por favor, descreva o que está acontecendo.');
      return;
    }
    
    if (!form.location) {
      alert('Por favor, adicione sua localização.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simular envio do relatório
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitted(true);
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      alert('Erro ao enviar relatório. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Relatório Enviado!</h1>
            <p className="text-muted-foreground mb-4">
              Seu relatório foi recebido pela Defesa Civil. Você será notificado sobre atualizações.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Próximos passos:</strong> Nossa IA está analisando seu relatório. 
                A Defesa Civil será notificada e pode emitir um alerta para sua região.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reportar Incidente</h1>
        <p className="text-muted-foreground">
          Relate situações de risco em sua área para proteger sua comunidade.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tipo de Incidente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Tipo de Incidente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incidentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`w-full p-4 border rounded-lg transition-colors text-left ${
                    form.type === type.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setForm(prev => ({ ...prev, type: type.id as any }))}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Nível de Urgência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Nível de Urgência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgencyLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className={`w-full p-3 border rounded-lg transition-colors text-left ${
                    form.urgency === level.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setForm(prev => ({ ...prev, urgency: level.id as any }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-muted-foreground">{level.description}</div>
                    </div>
                    <Badge className={level.color}>{level.label}</Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Descrição */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição do Problema</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Descreva o que você está vendo... Por exemplo: 'O rio perto da minha casa está subindo rapidamente após a chuva forte.'"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            {form.location ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium">Localização capturada</div>
                  <div className="text-sm text-muted-foreground">{form.location.address}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(prev => ({ ...prev, location: null }))}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {gettingLocation ? 'Obtendo localização...' : 'Usar minha localização atual'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Fotos (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {form.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {form.images.map((image, index) => (
                    <div key={`${image.name}-${image.size}-${index}`} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {form.images.length < 3 && (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium">Clique para adicionar fotos</p>
                    <p className="text-xs text-muted-foreground">
                      Máximo 3 imagens (JPG, PNG)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Nome</Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => setForm(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Telefone</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(e) => setForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Relatório'}
          </Button>
        </div>
      </form>
    </div>
  );
}
