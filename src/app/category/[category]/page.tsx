import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import ConversionGrid from '@/components/ConversionGrid';
import {
  ALL_CATEGORIES,
  categoryLabels,
  categoryPageTitles,
  categoryPageIntros,
} from '@/lib/constants';
import { getConversionsByCategory } from '@/lib/conversions';
import { collectionStructuredData, breadcrumbStructuredData } from '@/lib/seo';
import type { Category } from '@/types/conversion';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return ALL_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  if (!ALL_CATEGORIES.includes(category as Category)) return {};

  return {
    title: categoryPageTitles[category as Category],
    description: categoryPageIntros[category as Category].slice(0, 155),
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;

  if (!ALL_CATEGORIES.includes(category as Category)) notFound();

  const cat = category as Category;
  const conversions = getConversionsByCategory(cat);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            collectionStructuredData(
              categoryPageTitles[cat],
              categoryPageIntros[cat].slice(0, 155),
              `/category/${cat}`
            )
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbStructuredData([
              { name: 'Home', url: '/' },
              { name: categoryLabels[cat], url: `/category/${cat}` },
            ])
          ),
        }}
      />

      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-20">
        <Breadcrumbs
          items={[{ label: categoryLabels[cat] }]}
        />

        <section className="mb-10">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3">
            Free Online {categoryLabels[cat]} Converters
          </h1>
          <p className="text-base text-secondary leading-relaxed max-w-2xl">
            {categoryPageIntros[cat]}
          </p>
        </section>

        <ConversionGrid conversions={conversions} />
      </main>
      <Footer />
    </>
  );
}
