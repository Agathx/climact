'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Bell, 
  BellOff,
  Eye,
  Share2,
  Phone,
  Navigation,
  CheckCircle
} from 'lucide-react';
import { AdditionalFeaturesService, EmergencyAlert } from '@/services/additionalFeaturesService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'severe' | 'warning' | 'info'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      // Buscar alertas reais do Firebase
      const alertsData = await AdditionalFeaturesService.getActiveEmergencyAlerts({});
      setAlerts(alertsData.alerts);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os alertas',
        variant: 'destructive',
      });
      setAlerts([]); // Limpar alertas em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await AdditionalFeaturesService.acknowledgeEmergencyAlert(alertId, true);
      toast({
        title: 'Sucesso',
        description: 'Alerta confirmado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao confirmar alerta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar o alerta',
        variant: 'destructive',
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'severe': return 'bg-orange-500 text-white';
      case 'warning': return 'bg-yellow-500 text-black';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Crítico';
      case 'severe': return 'Severo';
      case 'warning': return 'Atenção';
      case 'info': return 'Informativo';
      default: return severity;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'weather': return '🌧️';
      case 'fire': return '🔥';
      case 'flood': return '🌊';
      case 'earthquake': return '🌍';
      case 'pollution': return '💨';
      case 'evacuation': return '🚨';
      default: return '⚠️';
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.severity === filter
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando alertas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alertas de Emergência</h1>
            <p className="text-muted-foreground">
              Acompanhe alertas oficiais e orientações de segurança para sua região
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Configurar Notificações
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'critical', label: 'Críticos' },
            { key: 'severe', label: 'Severos' },
            { key: 'warning', label: 'Atenção' },
            { key: 'info', label: 'Informativos' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Lista de Alertas */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>Nenhum alerta ativo no momento</p>
                  <p className="text-sm">Sua região está segura</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getAlertTypeIcon(alert.alertType)}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{alert.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {getSeverityLabel(alert.severity)}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(alert.startTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Eye className="w-4 h-4 mr-1" />
                            {alert.viewCount.toLocaleString()} visualizações
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Navigation className="w-4 h-4 mr-2" />
                        Ver no Mapa
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {alert.message}
                    </AlertDescription>
                  </Alert>

                  {/* Área Afetada */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Área Afetada
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Cidades:</strong> {alert.affectedArea.cities.join(', ')}</p>
                      <p><strong>Estados:</strong> {alert.affectedArea.states.join(', ')}</p>
                      <p><strong>Raio:</strong> {(alert.affectedArea.radius / 1000).toFixed(1)} km</p>
                    </div>
                  </div>

                  {/* Instruções */}
                  <div>
                    <h4 className="font-semibold mb-2">Instruções de Segurança</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {alert.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Contatos de Emergência */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Contatos de Emergência
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {alert.emergencyContacts.map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {contact.available24h ? '24h disponível' : 'Horário comercial'}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Phone className="w-4 h-4 mr-1" />
                            {contact.phone}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {alert.endTime && (
                        <p>Expira em: {format(alert.endTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => acknowledgeAlert(alert.id!)}
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Recebimento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
