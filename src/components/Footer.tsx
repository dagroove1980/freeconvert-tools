import Link from 'next/link';
import { Shield } from 'lucide-react';
import { ALL_CATEGORIES, categoryLabels } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t border-border-footer bg-card">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {ALL_CATEGORIES.map((category) => (
            <div key={category}>
              <h3 className="font-heading text-sm font-bold text-foreground mb-3">
                {categoryLabels[category]}
              </h3>
              <Link
                href={`/category/${category}`}
                className="text-sm text-secondary hover:text-foreground transition-colors"
              >
                All {categoryLabels[category]} converters →
              </Link>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-secondary mb-6">
          <Shield size={16} className="text-success" />
          <span>Files never leave your device. All conversions happen locally in your browser.</span>
        </div>

        <div className="text-xs text-tertiary">
          © {new Date().getFullYear()} freeconvert.tools. Free online file converter — no uploads, no limits, 100% private.
        </div>
      </div>
    </footer>
  );
}
