'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Capturar evento de instalação PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt após 30 segundos se não foi instalado
      setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          setShowInstallPrompt(true);
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Monitorar status da conexão
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      // Esconder mensagem offline após 5 segundos
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar se está rodando como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running as PWA');
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Função separada para registrar Service Worker
  const registerServiceWorker = async () => {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered: ', registration);
        
        // Verificar atualizações
        registration.addEventListener('updatefound', handleUpdateFound(registration));
        
      } catch (error) {
        console.log('SW registration failed: ', error);
      }
    });
  };

  // Função separada para lidar com atualizações
  const handleUpdateFound = (registration: ServiceWorkerRegistration) => () => {
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', handleWorkerStateChange(newWorker));
    }
  };

  // Função separada para mudanças de estado do worker
  const handleWorkerStateChange = (newWorker: ServiceWorker) => () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // Nova versão disponível
      if (confirm('Nova versão disponível! Deseja atualizar?')) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    // Não mostrar novamente por 7 dias
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Verificar se foi dispensado recentemente
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  return (
    <>
      {children}
      
      {/* Prompt de Instalação PWA */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Instalar ClimACT
                    </h3>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-200 mb-3">
                    Instale o ClimACT no seu dispositivo para acesso rápido e funcionalidades offline!
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleInstallClick}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Instalar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDismissInstall}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      Agora não
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismissInstall}
                  className="text-green-600 hover:bg-green-100 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Indicador de Status da Conexão */}
      <div className="fixed top-4 right-4 z-40">
        {showOfflineMessage && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-200">
                  Sem conexão - Modo offline ativo
                </span>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!isOnline && !showOfflineMessage && (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" title="Offline" />
        )}
        
        {isOnline && (
          <div className="w-3 h-3 bg-green-500 rounded-full" title="Online" />
        )}
      </div>
    </>
  );
}
