import type { Category } from '@/types/conversion';

interface CategoryColor {
  bg: string;
  text: string;
  border: string;
}

export const categoryColors: Record<Category, CategoryColor> = {
  image: { bg: '#F3F0FF', text: '#7C3AED', border: '#DDD6FE' },
  audio: { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' },
  video: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  document: { bg: '#ECFEFF', text: '#0891B2', border: '#A5F3FC' },
};

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
