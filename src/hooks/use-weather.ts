import { useState, useEffect, useCallback, useRef } from 'react';
import { weatherService, type ProcessedWeatherData } from '@/services/weatherService';

interface UseWeatherOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // em minutos
  minUpdateInterval?: number; // em segundos para rate limiting
}

export function useWeather(
  coordinates?: [number, number] | null,
  options: UseWeatherOptions = {}
) {
  const [weather, setWeather] = useState<ProcessedWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { autoRefresh = true, refreshInterval = 10, minUpdateInterval = 60 } = options;
  const lastFetchRef = useRef<number>(0);

  const fetchWeather = useCallback(async (force = false) => {
    if (!coordinates) return;

    // Rate limiting: prevent too frequent requests
    const now = Date.now();
    const timeSinceLastFetch = (now - lastFetchRef.current) / 1000;
    if (!force && timeSinceLastFetch < minUpdateInterval) {
      console.log(`Weather fetch rate limited. Last fetch was ${timeSinceLastFetch}s ago`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      lastFetchRef.current = now;
      const weatherData = await weatherService.getCurrentWeather(coordinates[0], coordinates[1]);
      setWeather(weatherData);
    } catch (err) {
      setError('Erro ao carregar dados meteorológicos');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [coordinates, minUpdateInterval]);

  const refreshWeather = useCallback(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    if (coordinates) {
      fetchWeather(true); // Force initial fetch
    }
  }, [coordinates, fetchWeather]);

  useEffect(() => {
    if (!autoRefresh || !coordinates) return;

    const interval = setInterval(() => {
      fetchWeather(false); // Respect rate limiting for auto-refresh
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, coordinates, fetchWeather]);

  return {
    weather,
    loading,
    error,
    refreshWeather,
    lastUpdated: weather?.lastUpdated
  };
}

export function useWeatherByCity(cityName: string, options: UseWeatherOptions = {}) {
  const [weather, setWeather] = useState<ProcessedWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { autoRefresh = true, refreshInterval = 10 } = options;

  const fetchWeather = useCallback(async () => {
    if (!cityName) return;

    try {
      setLoading(true);
      setError(null);
      const weatherData = await weatherService.getWeatherByCity(cityName);
      setWeather(weatherData);
    } catch (err) {
      setError('Erro ao carregar dados meteorológicos');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [cityName]);

  const refreshWeather = useCallback(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    if (cityName) {
      fetchWeather();
    }
  }, [cityName, fetchWeather]);

  useEffect(() => {
    if (!autoRefresh || !cityName) return;

    const interval = setInterval(() => {
      fetchWeather();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, cityName, fetchWeather]);

  return {
    weather,
    loading,
    error,
    refreshWeather,
    lastUpdated: weather?.lastUpdated
  };
}

export function useClimateRisks(coordinates?: [number, number] | null) {
  const [risks, setRisks] = useState<{
    floodRisk: number;
    stormRisk: number;
    heatRisk: number;
    overallRisk: number;
    recommendations: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeRisks = useCallback(async () => {
    if (!coordinates) return;

    try {
      setLoading(true);
      setError(null);
      const riskData = await weatherService.analyzeClimateRisks(coordinates[0], coordinates[1]);
      setRisks(riskData);
    } catch (err) {
      setError('Erro ao analisar riscos climáticos');
      console.error('Risk analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [coordinates]);

  useEffect(() => {
    if (coordinates) {
      analyzeRisks();
    }
  }, [coordinates, analyzeRisks]);

  return {
    risks,
    loading,
    error,
    analyzeRisks
  };
}
