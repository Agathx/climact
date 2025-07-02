import { lazy } from 'react';

// Lazy load de páginas pesadas para melhor performance
export const ChatPageLazy = lazy(() => import('@/app/dashboard/chat/page'));
export const DonationsPageLazy = lazy(() => import('@/app/dashboard/donations/page'));
export const ValidatePageLazy = lazy(() => import('@/app/dashboard/validate/page'));
export const AlertsPageLazy = lazy(() => import('@/app/dashboard/alerts/page'));

// Componente de loading genérico
export const ComponentLoader = ({ message = "Carregando..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Loading específico para mapa
export const MapLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-pulse flex space-x-1">
        <div className="rounded-full bg-green-600 h-3 w-3"></div>
        <div className="rounded-full bg-green-400 h-3 w-3"></div>
        <div className="rounded-full bg-green-200 h-3 w-3"></div>
      </div>
      <p className="text-sm text-muted-foreground">Carregando mapa interativo...</p>
    </div>
  </div>
);

// Loading para chat
export const ChatLoader = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
      <p className="text-sm text-muted-foreground">Conectando ao chat...</p>
    </div>
  </div>
);
