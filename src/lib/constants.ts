import type { Category } from '@/types/conversion';

export const SITE_NAME = 'freeconvert.tools';
export const SITE_URL = 'https://freeconvert.tools';
export const SITE_DESCRIPTION =
  'Convert files for free, directly in your browser. Image, audio, video, and document conversions — no uploads, no limits, 100% private.';

export const ALL_CATEGORIES: Category[] = ['image', 'audio', 'video', 'document'];

export const categoryLabels: Record<Category, string> = {
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  document: 'Document',
};

export const categoryIcons: Record<Category, string> = {
  image: 'image',
  audio: 'music',
  video: 'video',
  document: 'file-text',
};

export const categoryDescriptions: Record<Category, string> = {
  image: 'Convert between image formats like JPG, PNG, WebP, AVIF, SVG, ICO, and BMP.',
  audio: 'Convert audio files between MP3, WAV, M4A, OGG, FLAC, and more.',
  video: 'Convert video files between MP4, WebM, MOV, AVI, MKV, and GIF.',
  document: 'Convert documents between JSON, CSV, Markdown, HTML, TXT, and PDF.',
};

export const categoryPageTitles: Record<Category, string> = {
  image: 'Free Image Converters — JPG, PNG, WebP, AVIF & More',
  audio: 'Free Audio Converters — MP3, WAV, FLAC & More',
  video: 'Free Video Converters — MP4, WebM, MOV & More',
  document: 'Free Document Converters — JSON, CSV, PDF & More',
};

export const categoryPageIntros: Record<Category, string> = {
  image:
    'Convert images between all major formats instantly in your browser. No file size limits, no uploads to external servers — your files stay on your device. Support for JPG, PNG, WebP, AVIF, SVG, ICO, and BMP with lossless quality options.',
  audio:
    'Extract audio from video, convert between audio formats, and compress audio files — all in your browser using ffmpeg.wasm. No server processing, no file limits. Convert MP3, WAV, M4A, OGG, FLAC, and WebM audio.',
  video:
    'Convert video files between popular formats directly in your browser. Powered by ffmpeg.wasm for professional-grade conversions without uploading your files anywhere. Support for MP4, WebM, MOV, AVI, MKV, and GIF.',
  document:
    'Transform documents between data formats instantly. Convert JSON to CSV, Markdown to HTML, and generate PDFs from text files — all processed locally in your browser with zero server involvement.',
};
