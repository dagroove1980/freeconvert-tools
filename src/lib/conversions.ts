import type { ConversionPair, Category } from '@/types/conversion';
import conversionsData from '../../data/conversions.json';

const conversions: ConversionPair[] = conversionsData as ConversionPair[];

export function getAllConversions(): ConversionPair[] {
  return conversions;
}

export function getConversionById(id: string): ConversionPair | undefined {
  return conversions.find((c) => c.id === id);
}

export function getConversionsByCategory(category: Category): ConversionPair[] {
  return conversions.filter((c) => c.category === category);
}

export function getPopularConversions(): ConversionPair[] {
  return conversions.filter((c) => c.popular);
}

export function getPopularByCategory(category: Category): ConversionPair[] {
  return conversions.filter((c) => c.category === category && c.popular);
}

export function getRelatedConversions(conversion: ConversionPair, count: number = 4): ConversionPair[] {
  return conversions
    .filter((c) => c.id !== conversion.id)
    .map((c) => {
      let score = 0;
      if (c.category === conversion.category) score += 3;
      if (c.fromExt === conversion.fromExt || c.toExt === conversion.fromExt) score += 2;
      if (c.fromExt === conversion.toExt || c.toExt === conversion.toExt) score += 2;
      if (c.engine === conversion.engine) score += 1;
      return { conversion: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((r) => r.conversion);
}
