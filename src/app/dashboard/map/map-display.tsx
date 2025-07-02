'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { MapItem } from '@/components/interactive-map';

// Dynamic import for the map component
const InteractiveMap = dynamic(
  () => import('@/components/interactive-map'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

interface MapDisplayProps {
  items: MapItem[];
}

export function MapDisplay({ items }: MapDisplayProps) {
  return <InteractiveMap items={items} />;
}
