'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { NewsCard } from "@/components/news-card";
import { StatusAlert } from "@/components/dashboard-components";
import { WeatherWidget } from "@/components/weather-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Cloud, 
  Droplets, 
  Thermometer,
  Bell,
  Clock,
  RefreshCw,
  Loader2
} from "lucide-react";
import { newsService, type ProcessedNews } from "@/services/newsService";
import { useWeather, useClimateRisks } from "@/hooks/use-weather";


export default function NewsPage() {
  const [news, setNews] = useState<ProcessedNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Integração com dados reais do clima usando coordenadas de São Paulo
  const saoPauloCoords: [number, number] = [-23.5505, -46.6333];
  const { weather: weatherData, error: weatherError } = useWeather(saoPauloCoords);
  const { risks: climateRisks, loading: risksLoading } = useClimateRisks(saoPauloCoords);

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const climateNews = await newsService.getClimateNews(12);
      setNews(climateNews);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Erro ao carregar notícias. Tente novamente.');
      console.error('Erro ao carregar notícias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const urgentNews = useMemo(() => news.filter(article => article.urgent), [news]);
  const totalNews = news.length;
  
  // Verificamos se a API está configurada baseado no primeiro item de notícias
  const isApiConfigured = useMemo(() => 
    news.length === 0 || !news[0]?.title?.includes('API de Notícias não configurada'),
    [news]
  );

  // Transforma os riscos climáticos em alertas para exibição
  const weatherAlerts = useMemo(() => {
    if (!climateRisks) return [];
    
    const alerts = [];
    
    if (climateRisks.floodRisk > 0.7) {
      alerts.push({
        id: 'flood-risk',
        type: 'weather' as const,
        severity: 'high' as const,
        title: 'Risco de Enchente',
        description: 'Alto risco de enchentes baseado nas condições meteorológicas atuais',
        location: 'São Paulo, SP',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
        icon: Droplets
      });
    }
    
    if (climateRisks.heatRisk > 0.6) {
      alerts.push({
        id: 'heat-risk',
        type: 'temperature' as const,
        severity: 'medium' as const,
        title: 'Risco de Calor Extremo',
        description: 'Temperaturas elevadas podem causar desconforto e riscos à saúde',
        location: 'São Paulo, SP',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
        icon: Thermometer
      });
    }
    
    if (climateRisks.stormRisk > 0.5) {
      alerts.push({
        id: 'storm-risk',
        type: 'weather' as const,
        severity: 'medium' as const,
        title: 'Risco de Tempestade',
        description: 'Condições favoráveis para formação de tempestades',
        location: 'São Paulo, SP',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
        icon: Cloud
      });
    }
    
    return alerts;
  }, [climateRisks]);

  // Usa apenas alertas reais baseados em dados meteorológicos
  const allAlerts = useMemo(() => weatherAlerts, [weatherAlerts]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Notícias e Alertas
        </h1>
        <p className="text-muted-foreground">
          Mantenha-se informado sobre os últimos acontecimentos climáticos no Brasil.
        </p>
      </div>

      {/* Aviso de Configuração da API */}
      {!isApiConfigured && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Bell className="w-5 h-5" />
              Configuração de Notícias
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700">
            <p className="mb-2">
              Para exibir notícias reais, configure a API de notícias:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Acesse <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" className="underline">newsapi.org</a> e crie uma conta gratuita</li>
              <li>Obtenha sua API key</li>
              <li>Adicione no arquivo .env: <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_NEWS_API_KEY=sua_chave_aqui</code></li>
              <li>Reinicie o servidor de desenvolvimento</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Alertas Ativos */}
      {allAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alertas Ativos na Sua Região
            {risksLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            )}
          </h2>
          
          {allAlerts.map((alert) => {
            let alertType: 'danger' | 'warning' | 'info' = 'info';
            if (alert.severity === 'high') {
              alertType = 'danger';
            } else if (alert.severity === 'medium') {
              alertType = 'warning';
            }
            
            return (
              <StatusAlert
                key={alert.id}
                type={alertType}
                title={alert.title}
                message={`${alert.description} • ${alert.location} • Válido até ${alert.validUntil}`}
                action={{
                  label: 'Ver Detalhes',
                  href: `/dashboard/alerts/${alert.id}`
                }}
              />
            );
          })}
        </div>
      )}

      {/* Widget de Clima com Dados Reais */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-600" />
          Condições Climáticas Atuais
        </h2>
        
        {weatherError && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                API do Clima não Configurada
              </CardTitle>
            </CardHeader>
            <CardContent className="text-amber-700">
              <p className="mb-2">
                Para exibir dados reais do clima, configure a API OpenWeather:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Acesse <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="underline">openweathermap.org/api</a> e crie uma conta gratuita</li>
                <li>Obtenha sua API key</li>
                <li>Adicione no arquivo .env: <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_OPENWEATHER_API_KEY=sua_chave_aqui</code></li>
                <li>Reinicie o servidor de desenvolvimento</li>
              </ol>
            </CardContent>
          </Card>
        )}
        
        <WeatherWidget coordinates={saoPauloCoords} showForecast={true} showAlerts={true} />
      </div>

      {/* Configurações de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Suas Preferências de Alerta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-secondary text-secondary-foreground">Chuva Forte</Badge>
            <Badge className="bg-secondary text-secondary-foreground">Enchentes</Badge>
            <Badge className="bg-secondary text-secondary-foreground">Deslizamentos</Badge>
            <Badge className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">Ventos Fortes</Badge>
            <Badge className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">Granizo</Badge>
            <Button className="text-xs ml-2 h-8 px-3">
              Gerenciar Alertas
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Você receberá notificações sobre esses tipos de eventos na sua região.
          </p>
        </CardContent>
      </Card>

      {/* Grid de Notícias */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Últimas Notícias</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={loadNews}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Atualizar
            </Button>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-secondary text-secondary-foreground text-xs">
              {urgentNews.length} Urgentes
            </Badge>
            <Badge className="border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs">
              {totalNews} Total
            </Badge>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Última atualização: {lastUpdated.toLocaleString('pt-BR')}
          </p>
        )}

        {error && (
          <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Card key={`loading-skeleton-${index}`} className="animate-pulse">
                <CardHeader>
                  <div className="aspect-video w-full bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mt-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((article, index) => (
              <div key={`${article.source}-${article.date}-${index}`} className="relative">
                {article.urgent && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-red-600 text-white">Urgente</Badge>
                  </div>
                )}
                <NewsCard {...article} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
