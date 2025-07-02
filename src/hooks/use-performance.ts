import { useEffect, useState, useCallback, useMemo } from 'react';

// Hook para debounce (otimizar pesquisas e inputs)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para lazy loading de imagens
export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    
    if (imageRef && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(imageRef);
    }

    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src]);

  return [imageSrc, setImageRef] as const;
}

// Hook para otimizar re-renders com dados grandes
export function useOptimizedData<T>(data: T[], dependencies: any[] = []) {
  return useMemo(() => data, dependencies);
}

// Hook para throttle (útil para scroll, resize, etc.)
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastRan, setLastRan] = useState(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan >= limit) {
        setThrottledValue(value);
        setLastRan(Date.now());
      }
    }, limit - (Date.now() - lastRan));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit, lastRan]);

  return throttledValue;
}

// Hook para cache simples
export function useCache<T>(key: string, fetcher: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    const cached = localStorage.getItem(`cache_${key}`);
    const cacheTime = localStorage.getItem(`cache_time_${key}`);
    
    // Cache válido por 5 minutos
    const CACHE_DURATION = 5 * 60 * 1000;
    const isValidCache = cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION;
    
    if (cached && isValidCache) {
      try {
        setData(JSON.parse(cached));
        return;
      } catch {
        // Cache corrompido, continuar com fetch
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      setData(result);
      
      // Salvar no cache
      localStorage.setItem(`cache_${key}`, JSON.stringify(result));
      localStorage.setItem(`cache_time_${key}`, Date.now().toString());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(`cache_${key}`);
    localStorage.removeItem(`cache_time_${key}`);
  }, [key]);

  return { data, loading, error, refetch: fetchData, clearCache };
}

// Hook para preload de rotas
export function usePreloadRoute(routePath: string) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Preload da rota após 2 segundos de inatividade
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = routePath;
      document.head.appendChild(link);
    }, 2000);

    return () => clearTimeout(timer);
  }, [routePath]);
}

// Hook para detectar conexão lenta
export function useConnectionSpeed() {
  const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow' | 'offline'>('fast');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // @ts-ignore - Navigator connection não está tipado
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    const updateConnection = () => {
      if (!navigator.onLine) {
        setConnectionSpeed('offline');
        return;
      }

      if (connection) {
        // Considerar 2G/slow-2g como lento
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          setConnectionSpeed('slow');
        } else {
          setConnectionSpeed('fast');
        }
      }
    };

    updateConnection();

    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    
    if (connection) {
      connection.addEventListener('change', updateConnection);
    }

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      if (connection) {
        connection.removeEventListener('change', updateConnection);
      }
    };
  }, []);

  return connectionSpeed;
}
