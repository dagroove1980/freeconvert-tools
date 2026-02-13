export type Category = 'image' | 'audio' | 'video' | 'document';

export type Engine = 'canvas' | 'ffmpeg' | 'jspdf' | 'papaparse' | 'marked';

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
}
