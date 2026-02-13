import Link from 'next/link';
import type { Category } from '@/types/conversion';
import { categoryColors } from '@/lib/colors';
import { categoryLabels, categoryDescriptions, categoryIcons } from '@/lib/constants';
import { getIcon } from '@/lib/icons';
import { getPopularByCategory } from '@/lib/conversions';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const colors = categoryColors[category];
  const Icon = getIcon(categoryIcons[category]);
  const popular = getPopularByCategory(category);

  return (
    <div className="bg-card rounded-[var(--radius-card)] border border-border p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center shrink-0 rounded-xl"
          style={{ width: 44, height: 44, backgroundColor: colors.bg }}
        >
          <Icon size={22} style={{ color: colors.text }} />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            {categoryLabels[category]}
          </h3>
          <p className="text-xs text-secondary">{categoryDescriptions[category]}</p>
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {popular.slice(0, 4).map((c) => (
          <li key={c.id}>
            <Link
              href={`/convert/${c.id}`}
              className="flex items-center gap-2 text-sm text-secondary hover:text-foreground transition-colors"
            >
              <ArrowRight size={14} className="text-tertiary" />
              {c.from} to {c.to}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/category/${category}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
      >
        All {categoryLabels[category].toLowerCase()} converters
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
