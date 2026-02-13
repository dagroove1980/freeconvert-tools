import type { ConversionPair } from '@/types/conversion';
import ConversionCard from './ConversionCard';

interface ConversionGridProps {
  conversions: ConversionPair[];
}

export default function ConversionGrid({ conversions }: ConversionGridProps) {
  if (conversions.length === 0) {
    return (
      <div className="text-center py-12 text-secondary">
        <p className="text-sm">No conversions found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {conversions.map((conversion) => (
        <ConversionCard key={conversion.id} conversion={conversion} />
      ))}
    </div>
  );
}
