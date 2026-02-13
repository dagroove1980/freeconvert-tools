import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import FeatureBadge from '@/components/FeatureBadge';
import RelatedConversions from '@/components/RelatedConversions';
import ConverterEngineLoader from '@/components/ConverterEngineLoader';
import { getAllConversions, getConversionById, getRelatedConversions } from '@/lib/conversions';
import { categoryLabels } from '@/lib/constants';
import { categoryColors } from '@/lib/colors';
import {
  conversionMetaTitle,
  conversionMetaDescription,
  conversionStructuredData,
  breadcrumbStructuredData,
} from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllConversions().map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const conversion = getConversionById(slug);
  if (!conversion) return {};

  return {
    title: conversionMetaTitle(conversion),
    description: conversionMetaDescription(conversion),
  };
}

export default async function ConvertPage({ params }: PageProps) {
  const { slug } = await params;
  const conversion = getConversionById(slug);
  if (!conversion) notFound();

  const related = getRelatedConversions(conversion, 4);
  const colors = categoryColors[conversion.category];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(conversionStructuredData(conversion)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbStructuredData([
              { name: 'Home', url: '/' },
              { name: categoryLabels[conversion.category], url: `/category/${conversion.category}` },
              { name: `${conversion.from} to ${conversion.to}`, url: `/convert/${conversion.id}` },
            ])
          ),
        }}
      />

      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-8 pb-20">
        <Breadcrumbs
          items={[
            { label: categoryLabels[conversion.category], href: `/category/${conversion.category}` },
            { label: `${conversion.from} to ${conversion.to}` },
          ]}
        />

        {/* Hero */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, backgroundColor: colors.bg }}
            >
              <span className="font-mono text-sm font-bold uppercase" style={{ color: colors.text }}>
                {conversion.fromExt}
              </span>
            </div>
            <span className="text-2xl text-tertiary">&#8594;</span>
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, backgroundColor: colors.bg }}
            >
              <span className="font-mono text-sm font-bold uppercase" style={{ color: colors.text }}>
                {conversion.toExt}
              </span>
            </div>
          </div>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground leading-tight mb-2">
            Convert {conversion.from} to {conversion.to} — Free, Fast & Private
          </h1>
          <p className="text-base text-secondary leading-relaxed">
            {conversion.description}
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-8">
          {conversion.features.map((feature) => (
            <FeatureBadge key={feature} label={feature} />
          ))}
        </div>

        {/* Converter Engine (lazy-loaded client component) */}
        <div className="mb-12">
          <ConverterEngineLoader conversion={conversion} />
        </div>

        {/* Related conversions */}
        <RelatedConversions conversions={related} />
      </main>
      <Footer />
    </>
  );
}
