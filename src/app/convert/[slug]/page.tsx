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
  faqStructuredData,
  howToStructuredData,
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

      {/* FAQ structured data */}
      {conversion.faq && conversion.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqStructuredData(conversion.faq)),
          }}
        />
      )}
      {/* HowTo structured data */}
      {conversion.howTo && conversion.howTo.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              howToStructuredData(
                `How to Convert ${conversion.from} to ${conversion.to}`,
                conversion.howTo
              )
            ),
          }}
        />
      )}

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

        {/* How To section */}
        {conversion.howTo && conversion.howTo.length > 0 && (
          <section className="mb-10">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">
              How to Convert {conversion.from} to {conversion.to}
            </h2>
            <ol className="space-y-3">
              {conversion.howTo.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex items-center justify-center shrink-0 w-7 h-7 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: colors.text }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-secondary leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Converter Engine (lazy-loaded client component) */}
        <div className="mb-12">
          <ConverterEngineLoader conversion={conversion} />
        </div>

        {/* Format Comparison Table */}
        {conversion.comparison && conversion.comparison.length > 0 && (
          <section className="mb-10">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">
              {conversion.from} vs {conversion.to} — Format Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 text-secondary font-medium">Feature</th>
                    <th className="text-left py-2.5 px-3 font-medium" style={{ color: colors.text }}>{conversion.from}</th>
                    <th className="text-left py-2.5 px-3 font-medium" style={{ color: colors.text }}>{conversion.to}</th>
                  </tr>
                </thead>
                <tbody>
                  {conversion.comparison.map((row, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2.5 px-3 text-foreground font-medium">{row.feature}</td>
                      <td className="py-2.5 px-3 text-secondary">{row.from}</td>
                      <td className="py-2.5 px-3 text-secondary">{row.to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Use Cases */}
        {conversion.useCases && conversion.useCases.length > 0 && (
          <section className="mb-10">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">
              When to Convert {conversion.from} to {conversion.to}
            </h2>
            <ul className="space-y-2">
              {conversion.useCases.map((useCase, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                  <span className="text-accent mt-0.5">&#8226;</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ Section */}
        {conversion.faq && conversion.faq.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {conversion.faq.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-heading text-sm font-bold text-foreground mb-1.5">
                    {item.question}
                  </h3>
                  <p className="text-sm text-secondary leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related conversions */}
        <RelatedConversions conversions={related} />
      </main>
      <Footer />
    </>
  );
}
