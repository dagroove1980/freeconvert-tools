export type Category = 'image' | 'audio' | 'video' | 'document';

export type Engine = 'canvas' | 'ffmpeg' | 'jspdf' | 'papaparse' | 'marked';

export interface FAQ {
  question: string;
  answer: string;
}

export interface FormatComparison {
  feature: string;
  from: string;
  to: string;
}

export interface ConversionPair {
  id: string;
  from: string;
  fromExt: string;
  to: string;
  toExt: string;
  category: Category;
  icon: string;
  color: string;
  engine: Engine;
  title: string;
  description: string;
  tagline: string;
  features: string[];
  popular: boolean;
  maxFileSizeMB: number;
  howTo?: string[];
  faq?: FAQ[];
  comparison?: FormatComparison[];
  useCases?: string[];
}
