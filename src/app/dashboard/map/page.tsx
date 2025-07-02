'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SosDialog } from './sos-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  HeartPulse,
  Siren,
  ShieldAlert,
  Filter,
  Home,
  AlertTriangle,
  Building,
  Rss,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';
import type { MapItem } from '@/components/interactive-map';
import { MapDisplay } from './map-display';
import { cemadenService, type AlertaCemaden } from '@/services/cemadenService';
import { useToast } from '@/hooks/use-toast';

const getCriticalityBadge = (criticality?: 'Low' | 'Medium' | 'High') => {
    switch (criticality) {
        case 'High': return <Badge variant="destructive">ALTO RISCO</Badge>;
        case 'Medium': return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">MÉDIO RISCO</Badge>;
        case 'Low': return <Badge variant="secondary" className="bg-blue-400 text-blue-900">BAIXO RISCO</Badge>;
        default: return null;
    }
}

export default function MapPage() {
  const router = useRouter();
  const [showReports, setShowReports] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showSos, setShowSos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
  const [cemadenAlerts, setCemadenAlerts] = useState<AlertaCemaden[]>([]);
  const { toast } = useToast();

  // Carregar dados reais da Defesa Civil
  useEffect(() => {
    let isMounted = true;
    
    const loadMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar alertas da Defesa Civil para SP (com fallback seguro)
        const alertas = await cemadenService.getAlertas('SP', 'São Paulo');
        
        if (!isMounted) return;
        
        setCemadenAlerts(alertas);

        // Converter alertas da Defesa Civil para formato do mapa
        const alertItems: MapItem[] = alertas.map(alerta => {
          // Definir cor baseada na severidade
          const getAlertColor = (severidade: string) => {
            switch (severidade) {
              case 'muito_alta': return '#cc0000'; // Vermelho escuro
              case 'alta': return '#ff3333'; // Vermelho
              case 'media': return '#ff9900'; // Laranja
              case 'baixa': return '#ffcc00'; // Amarelo
              default: return '#999999'; // Cinza
            }
          };

          // Definir raio baseado na severidade (em metros)
          const getAlertRadius = (severidade: string) => {
            switch (severidade) {
              case 'muito_alta': return 10000; // 10km
              case 'alta': return 7500; // 7.5km
              case 'media': return 5000; // 5km
              case 'baixa': return 2500; // 2.5km
              default: return 3000; // 3km
            }
          };

          return {
            id: `cemaden-${alerta.id}`,
            type: 'alert',
            title: alerta.titulo,
            description: alerta.descricao,
            position: {
              lat: alerta.coordenadas?.latitude || -23.5505,
              lng: alerta.coordenadas?.longitude || -46.6333
            },
            criticality: alerta.severidade === 'muito_alta' ? 'High' : 
                         alerta.severidade === 'alta' ? 'High' :
                         alerta.severidade === 'media' ? 'Medium' : 'Low',
            source: alerta.fonte,
            status: alerta.status === 'ativo' ? 'validated' : 'pending',
            // Adicionar área de alerta (usar área da Defesa Civil se disponível, senão criar baseada na severidade)
            alertArea: alerta.area || {
              type: 'circle',
              radius: getAlertRadius(alerta.severidade),
              color: getAlertColor(alerta.severidade),
              fillOpacity: 0.15
            }
          };
        });

        // Buscar incidentes públicos do Firebase (inclui relatórios aprovados, abrigos, etc.)
        const { getPublicIncidents, getOfficialAlerts } = await import('@/services/incidentService');
        
        const [publicIncidents, officialAlerts] = await Promise.all([
          getPublicIncidents({
            location: { latitude: -23.555, longitude: -46.64 },
            radius: 50, // 50km radius
            limit: 50
          }),
          getOfficialAlerts()
        ]);

        // Combinar incidentes e alertas
        const firebaseItems = [...publicIncidents, ...officialAlerts];

        const userLocation: MapItem = {
          id: 'user', 
          type: 'user', 
          title: 'Sua Localização', 
          position: { lat: -23.555, lng: -46.64 }
        };

        // Combinar todos os itens
        const allItems = [
          userLocation,
          ...firebaseItems,
          ...alertItems
        ];

        if (!isMounted) return;
        setMapItems(allItems);

      } catch (err: any) {
        if (!isMounted) return;
        
        console.error('Erro ao carregar dados do mapa:', err);
        setError(err.message || 'Erro ao carregar dados do mapa');
        toast({
          title: "Erro ao carregar mapa",
          description: "Não foi possível carregar os dados. Usando dados offline.",
          variant: "destructive",
        });

        // Usar dados fallback em caso de erro - apenas localização do usuário
        const fallbackData = [
          { id: 'user', type: 'user' as const, title: 'Sua Localização', position: { lat: -23.555, lng: -46.64 } }
        ];
        setMapItems(fallbackData);

      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMapData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Filtrar itens baseado nas opções selecionadas
  const filteredItems = mapItems.filter(item => {
    if (item.type === 'report' && !showReports) return false;
    if (item.type === 'alert' && !showAlerts) return false;
    if (item.type === 'shelter' && !showShelters) return false;
    return true;
  });

  const reportCount = mapItems.filter(item => item.type === 'report').length;
  const alertCount = mapItems.filter(item => item.type === 'alert').length;
  const shelterCount = mapItems.filter(item => item.type === 'shelter').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando dados do mapa...</span>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      {/* Sidebar with filters and info */}
      <div className="space-y-6">
        {/* SOS Button */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <HeartPulse className="h-5 w-5" />
              Emergência
            </CardTitle>
            <CardDescription className="text-red-600">
              Precisa de ajuda imediata?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowSos(true)}
              size="lg" 
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Siren className="h-4 w-4 mr-2" />
              SOLICITAR SOCORRO
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros do Mapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reports" 
                checked={showReports} 
                onCheckedChange={(checked) => setShowReports(checked === true)}
              />
              <Label htmlFor="reports" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Relatórios ({reportCount})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="alerts" 
                checked={showAlerts} 
                onCheckedChange={(checked) => setShowAlerts(checked === true)}
              />
              <Label htmlFor="alerts" className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-red-500" />
                Alertas ({alertCount})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="shelters" 
                checked={showShelters} 
                onCheckedChange={(checked) => setShowShelters(checked === true)}
              />
              <Label htmlFor="shelters" className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-blue-500" />
                Abrigos ({shelterCount})
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Defesa Civil Alerts Info */}
        {cemadenAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rss className="h-5 w-5 text-green-600" />
                Alertas Defesa Civil
              </CardTitle>
              <CardDescription>
                Dados oficiais em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {cemadenAlerts.slice(0, 5).map((alerta) => (
                    <div key={alerta.id} className="border-l-4 border-l-green-500 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">{alerta.titulo}</h4>
                        {getCriticalityBadge(
                          alerta.severidade === 'muito_alta' ? 'High' : 
                          alerta.severidade === 'alta' ? 'High' :
                          alerta.severidade === 'media' ? 'Medium' : 'Low'
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                      <p className="text-xs text-green-600 font-medium">{alerta.municipio.nome}, {alerta.municipio.uf}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => {
                // Get current location and save as home
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    localStorage.setItem('homeLocation', JSON.stringify({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    }));
                    toast({
                      title: "Casa definida",
                      description: "Sua localização atual foi salva como casa",
                    });
                  });
                }
              }}
            >
              <Home className="h-4 w-4 mr-2" />
              Definir como Casa
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/report')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reportar Incidente
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="h-[600px]">
        <CardContent className="p-0 h-full">
          <MapDisplay items={filteredItems} />
        </CardContent>
      </Card>

      {/* SOS Dialog */}
      <SosDialog 
        open={showSos}
        onOpenChange={setShowSos}
      />
    </div>
  );
}
