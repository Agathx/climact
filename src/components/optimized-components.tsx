'use client';

import { memo, forwardRef, HTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLazyImage } from '@/hooks/use-performance';

// Imagem otimizada com lazy loading
interface OptimizedImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export const OptimizedImage = memo(forwardRef<HTMLDivElement, OptimizedImageProps>(
  ({ src, alt, fallback = '/placeholder.svg', aspectRatio = 'auto', className, ...props }, ref) => {
    const [imageSrc, setImageRef] = useLazyImage(src);

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          aspectRatio === 'square' && 'aspect-square',
          aspectRatio === 'video' && 'aspect-video',
          className
        )}
        {...props}
      >
        <img
          ref={setImageRef}
          src={imageSrc || fallback}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallback;
          }}
        />
        {!imageSrc && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-sm">Carregando...</span>
          </div>
        )}
      </div>
    );
  }
));

OptimizedImage.displayName = 'OptimizedImage';

// Lista virtualizada para grandes datasets
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      style={{ height: containerHeight }}
      className="overflow-auto"
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de erro otimizado
interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback = memo(({ error, resetError }: ErrorBoundaryFallbackProps) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
    <div className="text-red-600 mb-4">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
      Algo deu errado
    </h3>
    <p className="text-sm text-red-700 dark:text-red-200 text-center mb-4">
      {error.message}
    </p>
    <button
      onClick={resetError}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
    >
      Tentar novamente
    </button>
  </div>
));

ErrorFallback.displayName = 'ErrorFallback';

// Skeleton loader otimizado
interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave';
}

export const Skeleton = memo(forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', animation = 'pulse', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-gray-200 dark:bg-gray-700',
          animation === 'pulse' && 'animate-pulse',
          animation === 'wave' && 'animate-bounce',
          variant === 'text' && 'h-4 rounded',
          variant === 'rectangular' && 'rounded-md',
          variant === 'circular' && 'rounded-full',
          className
        )}
        {...props}
      />
    );
  }
));

Skeleton.displayName = 'Skeleton';
