"use client";

import dynamic from "next/dynamic";

// ✅ Importação dinâmica única e mais defensiva
const sharedImport = () => import('react-leaflet').catch(err => {
  console.error('Erro ao carregar react-leaflet:', err);
  throw err;
});

// Componente de loading padrão
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Componente de erro padrão
const ErrorComponent = () => (
  <div className="flex items-center justify-center h-full w-full text-red-500">
    Erro ao carregar componente do mapa
  </div>
);

export const MapContainer = dynamic(
  () => sharedImport().then(m => m.MapContainer), 
  { 
    ssr: false,
    loading: LoadingComponent,
    onError: (err) => console.error('Erro no MapContainer:', err)
  }
);

export const TileLayer = dynamic(
  () => sharedImport().then(m => m.TileLayer), 
  { 
    ssr: false,
    loading: LoadingComponent,
    onError: (err) => console.error('Erro no TileLayer:', err)
  }
);

export const Marker = dynamic(
  () => sharedImport().then(m => m.Marker), 
  { 
    ssr: false,
    loading: LoadingComponent,
    onError: (err) => console.error('Erro no Marker:', err)
  }
);

export const Popup = dynamic(
  () => sharedImport().then(m => m.Popup), 
  { 
    ssr: false,
    loading: LoadingComponent,
    onError: (err) => console.error('Erro no Popup:', err)
  }
);

export const Circle = dynamic(
  () => sharedImport().then(m => m.Circle), 
  { 
    ssr: false,
    loading: LoadingComponent,
    onError: (err) => console.error('Erro no Circle:', err)
  }
);

export const Polygon = dynamic(
  () => sharedImport().then(m => m.Polygon), 
  { 
    ssr: false,
    loading: LoadingComponent,
    onError: (err) => console.error('Erro no Polygon:', err)
  }
);

// Cache da importação para evitar múltiplas importações
let importCache: Promise<any> | null = null;

export const preloadLeaflet = () => {
  if (!importCache) {
    importCache = sharedImport();
  }
  return importCache;
};

// Para debug - verificar se há duplicação do react-leaflet
if (typeof window !== 'undefined') {
  console.log('🗺️ react-leaflet carregado via dynamic único');
  
  // Limpa o cache em caso de hot reload durante desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    (window as any).__leaflet_cache_cleared = true;
  }
}