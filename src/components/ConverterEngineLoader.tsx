'use client';

import dynamic from 'next/dynamic';
import type { ConversionPair } from '@/types/conversion';

const ConverterEngine = dynamic(() => import('@/components/ConverterEngine'), {
  ssr: false,
  loading: () => (
    <div className="bg-card rounded-[var(--radius-card)] border border-border p-6 shadow-card animate-pulse">
      <div className="h-40 bg-background rounded-[var(--radius-dropzone)]" />
    </div>
  ),
});

interface ConverterEngineLoaderProps {
  conversion: ConversionPair;
}

export default function ConverterEngineLoader({ conversion }: ConverterEngineLoaderProps) {
  return <ConverterEngine conversion={conversion} />;
}
