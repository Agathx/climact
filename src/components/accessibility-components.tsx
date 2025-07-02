import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Type, 
  Eye, 
  Zap,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Componente para configurações de acessibilidade
export function AccessibilitySettings({
  highContrast = false,
  fontSize = 'normal',
  soundEnabled = true,
  animations = true,
  darkMode = false,
  onToggleHighContrast,
  onFontSizeChange,
  onToggleSound,
  onToggleAnimations,
  onToggleDarkMode
}: {
  highContrast?: boolean;
  fontSize?: 'small' | 'normal' | 'large';
  soundEnabled?: boolean;
  animations?: boolean;
  darkMode?: boolean;
  onToggleHighContrast?: (enabled: boolean) => void;
  onFontSizeChange?: (size: 'small' | 'normal' | 'large') => void;
  onToggleSound?: (enabled: boolean) => void;
  onToggleAnimations?: (enabled: boolean) => void;
  onToggleDarkMode?: (enabled: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Configurações de Acessibilidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modo Escuro */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {darkMode ? 'Modo Escuro' : 'Modo Claro'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Alterna entre tema claro e escuro
            </p>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={(checked) => onToggleDarkMode?.(checked === true)}
            aria-label="Alternar modo escuro"
          />
        </div>

        {/* Alto Contraste */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Alto Contraste</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Aumenta o contraste para melhor visibilidade
            </p>
          </div>
          <Switch
            checked={highContrast}
            onCheckedChange={(checked) => onToggleHighContrast?.(checked === true)}
            aria-label="Alternar alto contraste"
          />
        </div>

        {/* Tamanho da Fonte */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <span className="text-sm font-medium">Tamanho da Fonte</span>
          </div>
          <div className="flex space-x-2">
            {(['small', 'normal', 'large'] as const).map((size) => (
              <Button
                key={size}
                className={cn(
                  "text-xs h-8 px-3",
                  fontSize === size
                    ? "bg-primary text-primary-foreground"
                    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => onFontSizeChange?.(size)}
                aria-label={`Definir fonte ${size === 'small' ? 'pequena' : size === 'normal' ? 'normal' : 'grande'}`}
              >
                {size === 'small' ? 'A' : size === 'normal' ? 'A' : 'A'}
              </Button>
            ))}
          </div>
        </div>

        {/* Som */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="text-sm font-medium">Sons do Sistema</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Reproduz sons para alertas e notificações
            </p>
          </div>
          <Switch
            checked={soundEnabled}
            onCheckedChange={onToggleSound}
            aria-label="Alternar sons do sistema"
          />
        </div>

        {/* Animações */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Animações</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Habilita transições e animações da interface
            </p>
          </div>
          <Switch
            checked={animations}
            onCheckedChange={onToggleAnimations}
            aria-label="Alternar animações"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para informações de compatibilidade PWA
export function PWAFeatures({
  isInstalled = false,
  isOnline = true,
  platform = 'web',
  onInstall
}: {
  isInstalled?: boolean;
  isOnline?: boolean;
  platform?: 'web' | 'mobile' | 'desktop';
  onInstall?: () => void;
}) {
  const features = [
    {
      title: 'Acesso Offline',
      description: 'Use o ClimACT mesmo sem conexão com a internet',
      available: true,
      status: isOnline ? 'online' : 'offline'
    },
    {
      title: 'Notificações Push',
      description: 'Receba alertas importantes diretamente no seu dispositivo',
      available: true,
      status: 'enabled'
    },
    {
      title: 'Instalação Local',
      description: 'Instale o ClimACT na tela inicial do seu dispositivo',
      available: !isInstalled,
      status: isInstalled ? 'installed' : 'available'
    },
    {
      title: 'Sincronização Automática',
      description: 'Seus dados são sincronizados automaticamente quando online',
      available: true,
      status: isOnline ? 'synced' : 'pending'
    }
  ];

  const platformIcon = {
    web: Globe,
    mobile: Smartphone,
    desktop: Monitor
  };

  const PlatformIcon = platformIcon[platform];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlatformIcon className="h-5 w-5" />
          Recursos PWA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de Conectividade */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-3 w-3 rounded-full",
              isOnline ? "bg-green-500" : "bg-red-500"
            )} />
            <div>
              <div className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isOnline 
                  ? 'Todos os recursos disponíveis' 
                  : 'Modo offline ativo - funcionalidade limitada'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Recursos */}
        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium">{feature.title}</div>
                <div className="text-xs text-muted-foreground">{feature.description}</div>
              </div>
              <div className="ml-3">
                {feature.available ? (
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Disponível
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Instalado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botão de Instalação */}
        {!isInstalled && onInstall && (
          <div className="pt-3 border-t">
            <Button 
              className="w-full"
              onClick={onInstall}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Instalar ClimACT
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Adicione o ClimACT à sua tela inicial para acesso rápido
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para resumo de performance do sistema
export function SystemPerformance({
  loadTime = 1.2,
  cacheUsage = 65,
  dataUsage = '2.1 MB',
  batteryOptimized = true
}: {
  loadTime?: number;
  cacheUsage?: number;
  dataUsage?: string;
  batteryOptimized?: boolean;
}) {
  const performance = {
    excellent: loadTime < 2,
    good: loadTime >= 2 && loadTime < 3,
    poor: loadTime >= 3
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tempo de Carregamento */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Tempo de Carregamento</div>
            <div className="text-xs text-muted-foreground">Velocidade da aplicação</div>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-sm font-medium",
              performance.excellent ? "text-green-600" : 
              performance.good ? "text-yellow-600" : "text-red-600"
            )}>
              {loadTime}s
            </div>
            <div className="text-xs text-muted-foreground">
              {performance.excellent ? 'Excelente' : 
               performance.good ? 'Bom' : 'Pode melhorar'}
            </div>
          </div>
        </div>

        {/* Uso do Cache */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Cache do Sistema</div>
            <div className="text-xs text-muted-foreground">Dados armazenados localmente</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{cacheUsage}%</div>
            <div className="text-xs text-muted-foreground">Utilizado</div>
          </div>
        </div>

        {/* Uso de Dados */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Consumo de Dados</div>
            <div className="text-xs text-muted-foreground">Tráfego de rede desta sessão</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{dataUsage}</div>
            <div className="text-xs text-green-600">Otimizado</div>
          </div>
        </div>

        {/* Otimização de Bateria */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Economia de Bateria</div>
            <div className="text-xs text-muted-foreground">Recursos otimizados</div>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-sm font-medium",
              batteryOptimized ? "text-green-600" : "text-yellow-600"
            )}>
              {batteryOptimized ? 'Ativa' : 'Desabilitada'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
