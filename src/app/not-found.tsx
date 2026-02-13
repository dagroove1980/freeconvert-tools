import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-20 text-center">
        <FileQuestion size={48} className="mx-auto text-tertiary mb-4" />
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-sm text-secondary mb-6">
          The converter you&apos;re looking for doesn&apos;t exist yet.
        </p>
        <Link
          href="/"
          className="inline-flex px-5 py-2.5 rounded-[var(--radius-button)] bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Browse all converters
        </Link>
      </main>
      <Footer />
    </>
  );
}
