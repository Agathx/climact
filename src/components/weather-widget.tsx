'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudSnow, 
  Wind, 
  Eye, 
  Thermometer, 
  Droplets,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock
} from 'lucide-react';
import { useWeather, useClimateRisks } from '@/hooks/use-weather';

interface WeatherWidgetProps {
  coordinates?: [number, number];
  cityName?: string;
  compact?: boolean;
  showAlerts?: boolean;
  showForecast?: boolean;
  className?: string;
}

export function WeatherWidget({ 
  coordinates, 
  cityName, 
  compact = false, 
  showAlerts = true, 
  showForecast = true,
  className = '' 
}: WeatherWidgetProps) {
  const { weather, loading, error, refreshWeather, lastUpdated } = useWeather(coordinates);
  const { risks, loading: risksLoading } = useClimateRisks(coordinates);

  const getWeatherIcon = (condition: string, icon: string) => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('chuva') || lowerCondition.includes('rain')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    }
    if (lowerCondition.includes('tempestade') || lowerCondition.includes('thunder')) {
      return <CloudRain className="w-8 h-8 text-purple-600" />;
    }
    if (lowerCondition.includes('neve') || lowerCondition.includes('snow')) {
      return <CloudSnow className="w-8 h-8 text-blue-200" />;
    }
    if (lowerCondition.includes('nublado') || lowerCondition.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    }
    if (lowerCondition.includes('limpo') || lowerCondition.includes('clear') || lowerCondition.includes('sol')) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    }
    
    return <Cloud className="w-8 h-8 text-gray-500" />;
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 8) return 'text-red-600 bg-red-50';
    if (risk >= 6) return 'text-orange-600 bg-orange-50';
    if (risk >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{error || 'Dados meteorológicos indisponíveis'}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshWeather}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={`${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getWeatherIcon(weather.current.condition, weather.current.icon)}
              <div>
                <div className="text-2xl font-bold">{weather.current.temperature}°C</div>
                <div className="text-sm text-muted-foreground">{weather.current.condition}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {weather.location.name}
              </div>
              {weather.alerts.length > 0 && (
                <Badge className="mt-1 bg-red-500 text-white">
                  {weather.alerts.length} alerta{weather.alerts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {weather.location.name}, {weather.location.country}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshWeather}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Condições Atuais */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {getWeatherIcon(weather.current.condition, weather.current.icon)}
            <div>
              <div className="text-4xl font-bold">{weather.current.temperature}°C</div>
              <div className="text-lg text-muted-foreground">{weather.current.condition}</div>
              <div className="text-sm text-muted-foreground">
                Sensação térmica: {weather.current.feelsLike}°C
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-sm text-muted-foreground">Umidade</div>
              <div className="font-semibold">{weather.current.humidity}%</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-sm text-muted-foreground">Vento</div>
              <div className="font-semibold">{weather.current.windSpeed} km/h</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-red-500" />
            <div>
              <div className="text-sm text-muted-foreground">Pressão</div>
              <div className="font-semibold">{weather.current.pressure} hPa</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-500" />
            <div>
              <div className="text-sm text-muted-foreground">Visibilidade</div>
              <div className="font-semibold">{weather.current.visibility} km</div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {showAlerts && weather.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Alertas Meteorológicos
            </h4>
            <div className="space-y-2">
              {weather.alerts.map((alert) => (
                <div key={alert.id} className="p-3 rounded-lg border-l-4 border-orange-500 bg-orange-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-orange-800">{alert.title}</div>
                      <div className="text-sm text-orange-700 mt-1">{alert.description}</div>
                    </div>
                    <Badge className={getAlertSeverityColor(alert.severity)}>
                      {alert.severity === 'extreme' ? 'Extremo' :
                       alert.severity === 'high' ? 'Alto' :
                       alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Análise de Riscos */}
        {risks && !risksLoading && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Análise de Riscos Climáticos</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-lg ${getRiskColor(risks.floodRisk)}`}>
                <div className="text-sm font-medium">Enchente</div>
                <div className="text-lg font-bold">{risks.floodRisk}/10</div>
              </div>
              <div className={`p-3 rounded-lg ${getRiskColor(risks.stormRisk)}`}>
                <div className="text-sm font-medium">Tempestade</div>
                <div className="text-lg font-bold">{risks.stormRisk}/10</div>
              </div>
              <div className={`p-3 rounded-lg ${getRiskColor(risks.heatRisk)}`}>
                <div className="text-sm font-medium">Calor Extremo</div>
                <div className="text-lg font-bold">{risks.heatRisk}/10</div>
              </div>
            </div>
            {risks.recommendations.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Recomendações:</div>
                <ul className="text-sm space-y-1">
                  {risks.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Previsão */}
        {showForecast && weather.forecast.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Previsão para as Próximas Horas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weather.forecast.slice(0, 4).map((forecast, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-xs text-muted-foreground mb-1">
                    {forecast.datetime.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="mb-2">
                    {getWeatherIcon(forecast.condition, forecast.icon)}
                  </div>
                  <div className="text-sm font-semibold">{forecast.temperature.current}°C</div>
                  <div className="text-xs text-muted-foreground">{forecast.condition}</div>
                  {forecast.precipitation.probability > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      {forecast.precipitation.probability}% chuva
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Última Atualização */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Atualizado em: {lastUpdated?.toLocaleString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
}
