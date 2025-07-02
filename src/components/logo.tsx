import { Leaf } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={`flex items-center gap-2 ${className}`} aria-label="ClimACT Home">
      <div className="p-2 bg-primary/10 rounded-full">
        <Leaf className="h-6 w-6 text-primary" />
      </div>
      <span className="text-2xl font-bold text-foreground font-headline hidden sm:inline-block group-data-[collapsible=icon]:hidden">
        ClimACT
      </span>
    </Link>
  );
}
