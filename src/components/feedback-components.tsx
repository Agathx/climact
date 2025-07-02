'use client'

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X, 
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Lightbulb,
  Target,
  TrendingUp,
  FileText,
  Leaf,
  Droplets,
  Recycle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Componente para notificações em tempo real
export function LiveNotification({
  type,
  title,
  message,
  timestamp,
  location,
  actionable = false,
  onAction,
  onDismiss,
  priority = 'normal'
}: {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  location?: string;
  actionable?: boolean;
  onAction?: () => void;
  onDismiss?: () => void;
  priority?: 'high' | 'normal' | 'low';
}) {
  const config = {
    success: {
      icon: CheckCircle2,
      bgClass: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      iconClass: 'text-green-600 dark:text-green-400',
      titleClass: 'text-green-800 dark:text-green-300'
    },
    warning: {
      icon: AlertTriangle,
      bgClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      iconClass: 'text-yellow-600 dark:text-yellow-400',
      titleClass: 'text-yellow-800 dark:text-yellow-300'
    },
    error: {
      icon: AlertTriangle,
      bgClass: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      iconClass: 'text-red-600 dark:text-red-400',
      titleClass: 'text-red-800 dark:text-red-300'
    },
    info: {
      icon: Info,
      bgClass: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      iconClass: 'text-blue-600 dark:text-blue-400',
      titleClass: 'text-blue-800 dark:text-blue-300'
    }
  };

  const { icon: Icon, bgClass, iconClass, titleClass } = config[type];

  return (
    <div 
      className={cn(
        "border rounded-lg p-4 transition-all duration-200 hover:shadow-md",
        bgClass,
        priority === 'high' && "ring-2 ring-primary animate-pulse"
      )}
      role="alert"
      aria-live={priority === 'high' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start space-x-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconClass)} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={cn("text-sm font-medium", titleClass)}>
              {title}
            </h4>
            {priority === 'high' && (
              <Badge className="bg-red-600 text-white text-xs">Urgente</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {message}
          </p>
          
          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{timestamp}</span>
            </div>
            {location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
              </div>
            )}
          </div>
          
          {actionable && onAction && (
            <div className="mt-3">
              <Button 
                className="text-xs h-7 px-3"
                onClick={onAction}
              >
                Visualizar <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
        
        {onDismiss && (
          <Button
            className="h-6 w-6 p-0"
            onClick={onDismiss}
            aria-label="Fechar notificação"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Componente para onboarding e dicas do sistema
export function OnboardingTip({
  step,
  totalSteps,
  title,
  description,
  actionLabel = "Próximo",
  skipLabel = "Pular",
  onNext,
  onSkip,
  position = 'bottom',
  highlight = false
}: {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  actionLabel?: string;
  skipLabel?: string;
  onNext: () => void;
  onSkip?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}) {
  const progress = (step / totalSteps) * 100;

  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm",
        highlight && "ring-2 ring-primary"
      )}
      role="dialog"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 id="onboarding-title" className="text-sm font-medium text-foreground">
            {title}
          </h3>
          <p id="onboarding-description" className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
          
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Passo {step} de {totalSteps}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
          
          <div className="flex items-center space-x-2 mt-3">
            <Button 
              className="text-xs h-7 px-3 flex-1"
              onClick={onNext}
            >
              {actionLabel}
            </Button>
            {onSkip && (
              <Button 
                className="text-xs h-7 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                onClick={onSkip}
              >
                {skipLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para metas e conquistas do usuário
export function AchievementCard({
  title,
  description,
  progress,
  total,
  icon: Icon,
  unlocked = false,
  rarity = 'common',
  reward,
  earnedAt
}: {
  title: string;
  description: string;
  progress: number;
  total: number;
  icon: React.ComponentType<{ className?: string }>;
  unlocked?: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  reward?: string;
  earnedAt?: string;
}) {
  const percentage = Math.min((progress / total) * 100, 100);
  
  const rarityConfig = {
    common: {
      bgClass: 'bg-gray-50 border-gray-200',
      badgeClass: 'bg-gray-100 text-gray-700',
      iconClass: 'text-gray-600'
    },
    rare: {
      bgClass: 'bg-blue-50 border-blue-200',
      badgeClass: 'bg-blue-100 text-blue-700',
      iconClass: 'text-blue-600'
    },
    epic: {
      bgClass: 'bg-purple-50 border-purple-200',
      badgeClass: 'bg-purple-100 text-purple-700',
      iconClass: 'text-purple-600'
    },
    legendary: {
      bgClass: 'bg-yellow-50 border-yellow-200',
      badgeClass: 'bg-yellow-100 text-yellow-700',
      iconClass: 'text-yellow-600'
    }
  };

  const config = rarityConfig[rarity];

  return (
    <div 
      className={cn(
        "border rounded-lg p-4 transition-all duration-200",
        unlocked ? config.bgClass : "bg-muted/50 border-muted",
        unlocked && "hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            unlocked ? "bg-primary/10" : "bg-muted",
            unlocked && config.iconClass
          )}>
            <Icon className={cn(
              "h-5 w-5",
              unlocked ? config.iconClass : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className={cn(
              "text-sm font-medium",
              unlocked ? "text-foreground" : "text-muted-foreground"
            )}>
              {title}
            </h3>
            {unlocked && (
              <Badge className={cn("text-xs mt-1", config.badgeClass)}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Badge>
            )}
          </div>
        </div>
        
        {unlocked && earnedAt && (
          <div className="text-xs text-muted-foreground">
            {earnedAt}
          </div>
        )}
      </div>
      
      <p className={cn(
        "text-xs mb-3",
        unlocked ? "text-muted-foreground" : "text-muted-foreground/60"
      )}>
        {description}
      </p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className={unlocked ? "text-foreground" : "text-muted-foreground"}>
            Progresso
          </span>
          <span className={unlocked ? "text-foreground" : "text-muted-foreground"}>
            {progress}/{total}
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            !unlocked && "opacity-50"
          )}
        />
        
        {reward && unlocked && (
          <div className="text-xs text-primary font-medium mt-2">
            🎁 Recompensa: {reward}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para métricas de impacto da comunidade
export function CommunityImpactCard({
  title,
  metrics
}: {
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    change?: {
      type: 'increase' | 'decrease';
      value: string;
      period: string;
    };
    iconName: string;
  }>;
}) {
  // Mapear nomes de ícones para componentes
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      FileText,
      Leaf,
      Droplets,
      Recycle,
      Target,
      TrendingUp
    };
    return icons[iconName] || Target;
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const IconComponent = getIcon(metric.iconName);
          return (
            <div key={metric.label} className="text-center">
              <div className="flex justify-center mb-2">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {metric.label}
              </div>
              {metric.change && (
                <div className={cn(
                  "text-xs flex items-center justify-center space-x-1",
                  metric.change.type === 'increase' ? "text-green-600" : "text-red-600"
                )}>
                  <TrendingUp className={cn(
                    "h-3 w-3",
                    metric.change.type === 'decrease' && "rotate-180"
                  )} />
                  <span>{metric.change.value} {metric.change.period}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
