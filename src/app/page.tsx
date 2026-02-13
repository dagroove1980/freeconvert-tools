import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryCard from '@/components/CategoryCard';
import ConversionGrid from '@/components/ConversionGrid';
import { ALL_CATEGORIES } from '@/lib/constants';
import { getPopularConversions } from '@/lib/conversions';

export const metadata: Metadata = {
  title: 'FreeConvert.tools — Free Online File Converter',
  description:
    'Convert files for free, directly in your browser. Image, audio, video, and document conversions — no uploads, no limits, 100% private.',
};

export default function HomePage() {
  const popular = getPopularConversions();

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-10 pb-20">
        {/* Hero */}
        <section className="text-center mb-14">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Convert files<br />
            <span className="text-accent">free & private.</span>
          </h1>
          <p className="text-base text-secondary max-w-xl mx-auto">
            No uploads, no limits, no accounts. All conversions happen directly in your browser — your files never leave your device.
          </p>
        </section>

        {/* Categories */}
        <section className="mb-14" id="categories">
          <h2 className="font-heading text-xl font-bold text-foreground mb-5">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_CATEGORIES.map((category) => (
              <CategoryCard key={category} category={category} />
            ))}
          </div>
        </section>

        {/* Popular */}
        <section className="mb-14">
          <h2 className="font-heading text-xl font-bold text-foreground mb-5">Popular Conversions</h2>
          <ConversionGrid conversions={popular} />
        </section>
      </main>
      <Footer />
    </>
  );
}
