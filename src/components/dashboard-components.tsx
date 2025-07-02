'use client';

import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Users,
  MapPin,
  Calendar,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Componente para cartões de estatísticas do dashboard
export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  color = 'default'
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: any;
  trend?: {
    type: 'up' | 'down' | 'neutral';
    value: string;
    label: string;
  };
  color?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colorClasses[color])}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center space-x-1 text-xs mt-2">
            {trend.type === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trend.type === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
            {trend.type === 'neutral' && <Activity className="h-3 w-3 text-gray-500" />}
            <span className={cn(
              trend.type === 'up' && 'text-green-600',
              trend.type === 'down' && 'text-red-600',
              trend.type === 'neutral' && 'text-gray-600'
            )}>
              {trend.value}
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para alertas de status do sistema
export function StatusAlert({
  type,
  title,
  message,
  action,
  dismissible = false,
  onDismiss
}: {
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
}) {
  const config = {
    info: {
      icon: Info,
      bgClass: 'bg-blue-50 border-blue-200',
      iconClass: 'text-blue-600',
      titleClass: 'text-blue-800',
      messageClass: 'text-blue-700'
    },
    success: {
      icon: CheckCircle,
      bgClass: 'bg-green-50 border-green-200',
      iconClass: 'text-green-600',
      titleClass: 'text-green-800',
      messageClass: 'text-green-700'
    },
    warning: {
      icon: AlertTriangle,
      bgClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-600',
      titleClass: 'text-yellow-800',
      messageClass: 'text-yellow-700'
    },
    danger: {
      icon: AlertTriangle,
      bgClass: 'bg-red-50 border-red-200',
      iconClass: 'text-red-600',
      titleClass: 'text-red-800',
      messageClass: 'text-red-700'
    }
  };

  const { icon: Icon, bgClass, iconClass, titleClass, messageClass } = config[type];

  return (
    <div className={cn("border rounded-lg p-4", bgClass)} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={cn("h-5 w-5", iconClass)} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={cn("text-sm font-medium", titleClass)}>
            {title}
          </h3>
          <div className={cn("mt-2 text-sm", messageClass)}>
            <p>{message}</p>
          </div>
          {action && (
            <div className="mt-3">
              {action.href ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-sm"
                >
                  <a href={action.href}>{action.label}</a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={action.onClick}
                  className="text-sm"
                >
                  {action.label}
                </Button>
              )}
            </div>
          )}
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
              aria-label="Fechar alerta"
            >
              ×
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para progresso de atividades/gamificação
export function ActivityProgress({
  title,
  current,
  total,
  unit = 'pontos',
  level,
  nextLevelAt,
  achievements = []
}: {
  title: string;
  current: number;
  total: number;
  unit?: string;
  level?: number;
  nextLevelAt?: number;
  achievements?: Array<{
    id: string;
    name: string;
    iconName?: string;
    earned: boolean;
  }>;
}) {
  const percentage = Math.min((current / total) * 100, 100);

  // Mapear nomes de ícones para componentes
  const getIcon = (iconName?: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Award,
      FileText: Activity,
      MapPin
    };
    return iconName && icons[iconName] ? icons[iconName] : Award;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {level && (
            <Badge variant="secondary" className="ml-2">
              Nível {level}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{current} {unit}</span>
            <span>{total} {unit}</span>
          </div>
          <Progress value={percentage} aria-label={`${percentage.toFixed(0)}% completo`} />
        </div>

        {nextLevelAt && (
          <div className="text-xs text-muted-foreground">
            <span>{nextLevelAt - current} {unit} para o próximo nível</span>
          </div>
        )}

        {achievements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Conquistas Recentes</h4>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 4).map((achievement) => {
                const IconComponent = getIcon(achievement.iconName);
                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                      achievement.earned
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span>{achievement.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para atividades recentes
export function RecentActivity({
  activities
}: {
  activities: Array<{
    id: string;
    type: 'report' | 'education' | 'community' | 'alert';
    title: string;
    description: string;
    timestamp: string;
    location?: string;
    status?: 'pending' | 'completed' | 'in_progress';
  }>;
}) {
  const typeConfig = {
    report: {
      icon: MapPin,
      label: 'Relatório',
      color: 'text-blue-600'
    },
    education: {
      icon: Award,
      label: 'Educação',
      color: 'text-green-600'
    },
    community: {
      icon: Users,
      label: 'Comunidade',
      color: 'text-purple-600'
    },
    alert: {
      icon: AlertTriangle,
      label: 'Alerta',
      color: 'text-orange-600'
    }
  };

  const statusConfig = {
    pending: {
      label: 'Pendente',
      color: 'bg-yellow-100 text-yellow-800'
    },
    completed: {
      label: 'Concluído',
      color: 'bg-green-100 text-green-800'
    },
    in_progress: {
      label: 'Em andamento',
      color: 'bg-blue-100 text-blue-800'
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma atividade recente encontrada.
            </p>
          ) : (
            activities.map((activity) => {
              const typeConf = typeConfig[activity.type];
              const StatusIcon = typeConf.icon;

              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={cn("mt-1", typeConf.color)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      {activity.status && (
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", statusConfig[activity.status].color)}
                        >
                          {statusConfig[activity.status].label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{activity.timestamp}</span>
                      {activity.location && (
                        <>
                          <span>•</span>
                          <span>{activity.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
