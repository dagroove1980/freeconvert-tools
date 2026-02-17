import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import { ALL_CATEGORIES, categoryLabels } from '@/lib/constants';
import { getPopularByCategory } from '@/lib/conversions';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-1.5">
            <ArrowRightLeft size={20} className="text-accent" />
            <span className="font-heading text-lg font-bold text-foreground">FreeConvert</span>
            <span className="font-heading text-lg font-bold text-accent">Tool</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-secondary">
            {ALL_CATEGORIES.map((category) => {
              const popular = getPopularByCategory(category);
              return (
                <div key={category} className="group relative">
                  <Link
                    href={`/category/${category}`}
                    className="cursor-pointer hover:text-foreground transition-colors"
                  >
                    {categoryLabels[category]}
                  </Link>
                  <div className="absolute top-full left-0 pt-2 hidden group-hover:block z-50">
                    <div className="bg-card rounded-xl shadow-card-hover border border-border p-3 min-w-[220px]">
                      {popular.map((c) => (
                        <Link
                          key={c.id}
                          href={`/convert/${c.id}`}
                          className="block px-3 py-1.5 text-sm text-secondary hover:text-foreground hover:bg-background rounded-lg transition-colors"
                        >
                          {c.from} → {c.to}
                        </Link>
                      ))}
                      <Link
                        href={`/category/${category}`}
                        className="block px-3 py-1.5 text-sm text-accent hover:text-accent/80 rounded-lg transition-colors mt-1 border-t border-border pt-2"
                      >
                        View all →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/#categories"
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              All Tools
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
