import type { ConversionPair } from '@/types/conversion';
import ConversionGrid from './ConversionGrid';

interface RelatedConversionsProps {
  conversions: ConversionPair[];
}

export default function RelatedConversions({ conversions }: RelatedConversionsProps) {
  if (conversions.length === 0) return null;

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-foreground mb-5">
        You might also need
      </h2>
      <ConversionGrid conversions={conversions} />
    </section>
  );
}
