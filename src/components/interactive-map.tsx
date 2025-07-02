'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Home, ShieldAlert, AlertTriangle, Siren, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { renderToStaticMarkup } from 'react-dom/server';
import { validateReportCommunity } from '@/services/reportService';
import { useToast } from '@/hooks/use-toast';
import { MapErrorBoundary } from '@/components/error/MapErrorBoundary';

// ✅ IMPORTAÇÕES CENTRALIZADAS DO LEAFLET
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
} from '@/components/leaflet';

// 🔥 LEAFLET CARREGADO APENAS NO CLIENTE
let L: any = null;
let iconsFixed = false;
let leafletLoading = false;
let leafletReady = false;

const loadLeaflet = async () => {
  if (leafletReady || typeof window === 'undefined') return;
  if (leafletLoading) {
    while (leafletLoading && !leafletReady) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return;
  }
  
  leafletLoading = true;
  
  try {
    const leaflet = await import('leaflet');
    L = leaflet.default || leaflet;
    
    const [iconRetinaUrl, iconUrl, shadowUrl] = await Promise.all([
      import('leaflet/dist/images/marker-icon-2x.png'),
      import('leaflet/dist/images/marker-icon.png'), 
      import('leaflet/dist/images/marker-shadow.png')
    ]);
    
    if (!iconsFixed && L) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: iconRetinaUrl.default,
        iconUrl: iconUrl.default,
        shadowUrl: shadowUrl.default,
      });
      iconsFixed = true;
    }
    
    leafletReady = true;
  } catch (error) {
    console.error('Erro ao carregar Leaflet:', error);
  } finally {
    leafletLoading = false;
  }
};

if (typeof window !== 'undefined') {
  loadLeaflet();
}

export interface MapItem {
  id: string;
  type: 'shelter' | 'report' | 'user' | 'alert';
  position: { lat: number; lng: number };
  title: string;
  description?: string;
  criticality?: 'Low' | 'Medium' | 'High';
  source?: string;
  status?: 'pending' | 'validated' | 'rejected';
  votes?: {
    up: number;
    down: number;
  };
  canValidate?: boolean;
  alertArea?: {
    type: 'circle' | 'polygon';
    radius?: number;
    coordinates?: [number, number][];
    color?: string;
    fillOpacity?: number;
  };
}

interface InteractiveMapProps {
  items?: MapItem[];
}

const createDivIcon = (icon: React.ReactElement, className: string) => {
  if (!L || !leafletReady) return null;
  
  return L.divIcon({
    html: renderToStaticMarkup(icon),
    className: `bg-transparent border-none ${className}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function getMarker(item: MapItem) {
    const baseClasses = "relative p-1 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-110";
    
    switch(item.type) {
      case 'shelter': 
        return {
          icon: createDivIcon(<ShieldAlert className="h-6 w-6 text-white" />, `${baseClasses} bg-blue-500`),
        };
      case 'report': {
        let reportColor = 'bg-yellow-500';
        if (item.criticality === 'High') reportColor = 'bg-orange-600';
        if (item.criticality === 'Low') reportColor = 'bg-gray-500';
        return {
           icon: createDivIcon(<AlertTriangle className="h-6 w-6 text-white" />, `${baseClasses} ${reportColor}`),
        };
      }
      case 'alert': 
        return {
          icon: createDivIcon(<Siren className="h-6 w-6 text-white" />, `${baseClasses} bg-red-600 animate-pulse`),
        };
      case 'user': 
        return {
          icon: createDivIcon(<Home className="h-6 w-6 text-white" />, `${baseClasses} bg-primary`),
        };
      default:
        return null;
    }
}

function InteractiveMap({ items = [] }: Readonly<InteractiveMapProps>) {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(leafletReady);
  const [isClient, setIsClient] = useState(false);
  
  // ✅ REFERÊNCIAS PARA CONTROLE DE INICIALIZAÇÃO
  const mapRef = useRef<any>(null);
  const isInitializing = useRef(false);
  const mapId = useRef(`map-${Math.random().toString(36).substring(2, 11)}`);
  
  // ✅ DETECTA SE ESTÁ NO CLIENTE (evita SSR issues)
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // ✅ AGUARDA LEAFLET ESTAR PRONTO
  useEffect(() => {
    if (!isClient) return;
    
    const checkLeafletReady = async () => {
      if (!leafletReady) {
        await loadLeaflet();
      }
      setIsLeafletReady(leafletReady);
    };
    
    checkLeafletReady();
  }, [isClient]);
  
  // 🔥 LIMPEZA STRICTMODE-SAFE
  const cleanupMap = useCallback(() => {
    if (mapRef.current) {
      try {
        const map = mapRef.current;
        const container = map.getContainer();
        
        console.log('🧹 Limpando mapa:', mapId.current);
        
        // Remove todos os event listeners
        map.off();
        
        // Remove o mapa completamente
        map.remove();
        
        // Limpa todas as propriedades do Leaflet no container
        if (container) {
          delete (container as any)._leaflet_id;
          delete (container as any)._leaflet;
          delete (container as any)._leaflet_pos;
          // Remove atributos data relacionados ao Leaflet
          container.removeAttribute('data-leaflet');
          // Limpa classes do Leaflet
          container.className = container.className.replace(/leaflet-[^\s]*/g, '').trim();
        }
        
        mapRef.current = null;
        isInitializing.current = false;
      } catch (error) {
        console.error('Erro na limpeza do mapa:', error);
        mapRef.current = null;
        isInitializing.current = false;
      }
    }
  }, []);
  
  // 🔥 CLEANUP NO UNMOUNT
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, [cleanupMap]);
  

  // 🔥 CÁLCULO DE CENTRO DO MAPA
  const center: [number, number] = useMemo(() => {
    const userLocation = items.find(item => item.type === 'user');
    if (userLocation) {
      return [userLocation.position.lat, userLocation.position.lng];
    } else if (items.length > 0) {
      return [items[0].position.lat, items[0].position.lng];
    } else {
      return [-23.55052, -46.633308];
    }
  }, [items]);
  
  // 🔥 EFEITO PARA GERENCIAR MARKERS E ÁREAS
  useEffect(() => {
    if (!mapRef.current || !items.length) return;
    
    const map = mapRef.current;
    const markersLayer = L.layerGroup().addTo(map);
    
    items.forEach(item => {
      const marker = getMarker(item);
      if (!marker || !marker.icon) return;
      
      // Cria marker com Leaflet nativo
      const leafletMarker = L.marker([item.position.lat, item.position.lng], {
        icon: marker.icon
      });
      
      // Cria popup content
      const popupContent = createPopupContent(item);
      leafletMarker.bindPopup(popupContent, {
        minWidth: 200,
        className: 'custom-popup'
      });
      
      markersLayer.addLayer(leafletMarker);
      
      // Adiciona áreas de alerta se existirem
      if (item.alertArea) {
        const areaProps = {
          color: item.alertArea.color || '#ff0000',
          fillOpacity: item.alertArea.fillOpacity || 0.2,
          weight: 2,
        };
        
        let areaLayer;
        if (item.alertArea.type === 'circle' && item.alertArea.radius) {
          areaLayer = L.circle([item.position.lat, item.position.lng], {
            radius: item.alertArea.radius,
            ...areaProps
          });
        } else if (item.alertArea.type === 'polygon' && item.alertArea.coordinates) {
          areaLayer = L.polygon(item.alertArea.coordinates, areaProps);
        }
        
        if (areaLayer) {
          markersLayer.addLayer(areaLayer);
        }
      }
    });
    
    // Cleanup
    return () => {
      if (markersLayer) {
        markersLayer.clearLayers();
        map.removeLayer(markersLayer);
      }
    };
  }, [items, mapRef.current]);
  
  const handleValidateReport = async (reportId: string, vote: 'up' | 'down') => {
    setIsValidating(reportId);
    try {
      await validateReportCommunity({ reportId, vote });
      toast({
        title: "Validação enviada",
        description: `Seu voto ${vote === 'up' ? 'positivo' : 'negativo'} foi registrado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na validação",
        description: error.message ?? "Erro ao enviar validação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(null);
    }
  };
  
  const createPopupContent = (item: MapItem): string => {
    const validationButtons = item.type === 'report' && item.canValidate && item.status === 'pending' ? `
      <div style="margin-top: 12px;">
        <p style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 8px;">Validação comunitária:</p>
        <div style="display: flex; gap: 8px;">
          <button 
            onclick="handleValidation('${item.id}', 'up')"
            style="flex: 1; padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer;"
            ${isValidating === item.id ? 'disabled' : ''}
          >
            ὄd ${item.votes?.up ?? 0}
          </button>
          <button 
            onclick="handleValidation('${item.id}', 'down')"
            style="flex: 1; padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer;"
            ${isValidating === item.id ? 'disabled' : ''}
          >
            ὄe ${item.votes?.down ?? 0}
          </button>
        </div>
      </div>
    ` : '';
    
    const statusBadge = item.type === 'report' && item.status && item.status !== 'pending' ? `
      <div style="margin-top: 8px;">
        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; background-color: ${
          item.status === 'validated' ? '#10b981' : '#ef4444'
        };">
          ${item.status === 'validated' ? 'Validado pela comunidade' : 'Rejeitado pela comunidade'}
        </span>
      </div>
    ` : '';
    
    return `
      <div style="min-width: 200px;">
        <div>
          <p style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${item.title}</p>
          ${item.description ? `<p style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${item.description}</p>` : ''}
          ${item.criticality ? `<p style="font-size: 12px; font-weight: 600;">Criticidade: ${item.criticality}</p>` : ''}
          ${item.source ? `<p style="font-size: 12px; color: #6b7280;">Fonte: ${item.source}</p>` : ''}
        </div>
        ${validationButtons}
        ${statusBadge}
      </div>
    `;
  };

  // 🔥 FUNÇÃO PARA RECRIAR O MAPA EM CASO DE ERRO
  const recreateMap = useCallback(() => {
    cleanupMap();
    setMapError(null);
    // Gera novo ID único
    mapId.current = `map-${Math.random().toString(36).substring(2, 11)}`;
    setIsLeafletReady(false);
    // Força recarregamento do Leaflet
    leafletReady = false;
    loadLeaflet().then(() => setIsLeafletReady(true));
  }, [cleanupMap]);
  
  // 🔥 EXPOR FUNÇÃO DE VALIDAÇÃO GLOBALMENTE PARA POPUPS
  useEffect(() => {
    (window as any).handleValidation = (reportId: string, vote: 'up' | 'down') => {
      handleValidateReport(reportId, vote);
    };
    
    return () => {
      delete (window as any).handleValidation;
    };
  }, []);

  // 🔥 AGUARDA CLIENTE E LEAFLET ESTAREM PRONTOS
  if (!isClient || !isLeafletReady) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50 rounded-lg border-2 border-gray-200">
        <div className="flex flex-col items-center space-y-2 text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Carregando mapa...</p>
        </div>
      </div>
    );
  }
  
  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-red-50 rounded-lg border-2 border-red-200">
        <div className="flex flex-col items-center space-y-2 text-red-600">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">Erro ao carregar o mapa</p>
          <Button size="sm" variant="outline" onClick={recreateMap}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <div className="w-full h-full">
        <div 
          id={mapId.current}
          className="w-full h-full z-0"
          style={{ height: "100%", width: "100%" }}
          ref={(containerDiv) => {
            if (!containerDiv || !isClient || !isLeafletReady) return;
            
            // Verifica se o container já tem um mapa inicializado
            if ((containerDiv as any)._leaflet_id || mapRef.current) {
              console.log('🚫 Container já inicializado, pulando...', mapId.current);
              return;
            }
            
            // Verifica se estamos no processo de inicialização
            if (isInitializing.current) {
              console.log('🚫 Já inicializando, pulando...', mapId.current);
              return;
            }
            
            isInitializing.current = true;
            
            try {
              console.log('🗺️ Inicializando mapa:', mapId.current);
              
              // Cria o mapa diretamente com Leaflet
              const map = L.map(containerDiv, {
                preferCanvas: true,
                zoomControl: true,
                attributionControl: true
              }).setView(center, 13);
              
              // Adiciona tile layer
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(map);
              
              // Configura scroll wheel zoom
              if (map.scrollWheelZoom) {
                map.scrollWheelZoom.enable();
              }
              
              mapRef.current = map;
              containerDiv.setAttribute('data-map-id', mapId.current);
              
              console.log('✅ Mapa inicializado com sucesso:', mapId.current);
              
            } catch (error) {
              console.error('❌ Erro ao inicializar mapa:', error);
              isInitializing.current = false;
              setMapError('Erro ao inicializar o mapa');
            }
          }}
        />
      </div>
    </MapErrorBoundary>
  );
}

export default InteractiveMap;