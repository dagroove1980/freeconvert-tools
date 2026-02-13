import Link from 'next/link';
import type { ConversionPair } from '@/types/conversion';
import { categoryColors } from '@/lib/colors';
import { categoryLabels } from '@/lib/constants';
import { ArrowRight } from 'lucide-react';

interface ConversionCardProps {
  conversion: ConversionPair;
}

export default function ConversionCard({ conversion }: ConversionCardProps) {
  const colors = categoryColors[conversion.category];

  return (
    <Link
      href={`/convert/${conversion.id}`}
      className="group block bg-card rounded-[var(--radius-card)] border border-border p-5 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center justify-center shrink-0 rounded-xl"
          style={{ width: 44, height: 44, backgroundColor: colors.bg }}
        >
          <span className="font-mono text-xs font-bold uppercase" style={{ color: colors.text }}>
            {conversion.fromExt}
          </span>
        </div>
        <ArrowRight size={16} className="text-tertiary shrink-0" />
        <div
          className="flex items-center justify-center shrink-0 rounded-xl"
          style={{ width: 44, height: 44, backgroundColor: colors.bg }}
        >
          <span className="font-mono text-xs font-bold uppercase" style={{ color: colors.text }}>
            {conversion.toExt}
          </span>
        </div>
      </div>

      <h3 className="font-heading text-sm font-semibold text-foreground leading-tight group-hover:text-accent transition-colors mb-1">
        {conversion.from} to {conversion.to}
      </h3>
      <p className="text-xs text-secondary line-clamp-2 mb-3">
        {conversion.tagline}
      </p>

      <div className="flex items-center gap-2">
        <span
          className="inline-block rounded-full text-[10px] px-2.5 py-0.5 font-medium"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {categoryLabels[conversion.category]}
        </span>
      </div>
    </Link>
  );
}
