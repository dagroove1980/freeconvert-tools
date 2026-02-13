# freeconvert.tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a free, SEO-optimized file converter platform where all conversions run client-side in the browser.

**Architecture:** Next.js 15 SSG with lazy-loaded WASM/Canvas/JS conversion engines. Every `/convert/[from]-to-[to]` page is pre-rendered at build time. The converter UI loads only when a user interacts with it. All processing happens in Web Workers to keep the UI responsive.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, lucide-react, @vercel/og, ffmpeg.wasm, react-dropzone, jsPDF, PapaParse, marked, browser-image-compression

**Reference project:** `/Users/david.scebat/Documents/smoothiebar-cards/` — follow all patterns from this project.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `.gitignore`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`

**Step 1: Create package.json**

```json
{
  "name": "freeconvert-tools",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.469.0",
    "@vercel/og": "^0.6.0",
    "@ffmpeg/ffmpeg": "^0.12.10",
    "@ffmpeg/util": "^0.12.1",
    "react-dropzone": "^14.3.5",
    "jspdf": "^2.5.2",
    "papaparse": "^5.4.1",
    "marked": "^12.0.2",
    "browser-image-compression": "^2.0.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/papaparse": "^5.3.0"
  }
}
```

**Step 2: Create tsconfig.json**

Copy exact same structure from smoothiebar-cards:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create next.config.ts**

Important: Must include COOP/COEP headers for ffmpeg.wasm SharedArrayBuffer support.

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Step 4: Create postcss.config.mjs**

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Step 5: Create .gitignore**

```
node_modules/
.next/
out/
.env*
*.tsbuildinfo
next-env.d.ts
```

**Step 6: Create src/app/globals.css**

```css
@import "tailwindcss";

@theme inline {
  --color-background: #F7F9FC;
  --color-foreground: #1A1F36;
  --color-secondary: #6B7280;
  --color-tertiary: #D1D5DB;
  --color-accent: #3B82F6;
  --color-card: #FFFFFF;
  --color-border: #E5E7EB;
  --color-border-footer: #D1D5DB;
  --color-page-bg: #F7F9FC;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  --color-image: #8B5CF6;
  --color-image-bg: #F3F0FF;
  --color-audio: #EC4899;
  --color-audio-bg: #FDF2F8;
  --color-video: #F97316;
  --color-video-bg: #FFF7ED;
  --color-document: #06B6D4;
  --color-document-bg: #ECFEFF;

  --font-heading: var(--font-inter);
  --font-body: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);

  --radius-card: 16px;
  --radius-pill: 20px;
  --radius-button: 12px;
  --radius-dropzone: 16px;

  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.03);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.06), 0 20px 48px rgba(0, 0, 0, 0.06);
  --shadow-dropzone: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

body {
  background-color: var(--color-page-bg);
  color: var(--color-foreground);
  font-family: var(--font-body), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), system-ui, sans-serif;
  letter-spacing: -0.02em;
}

.file-meta {
  font-family: var(--font-mono), monospace;
  font-variant-numeric: tabular-nums;
}
```

**Step 7: Create src/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: 'FreeConvert.tools — Free Online File Converter',
    template: '%s | freeconvert.tools',
  },
  description:
    'Convert files for free, directly in your browser. Image, audio, video, and document conversions — no uploads, no limits, 100% private.',
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://freeconvert.tools'
  ),
  openGraph: {
    siteName: 'freeconvert.tools',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3452665186406442"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

**Step 8: Install dependencies and verify build**

Run: `cd /Users/david.scebat/Documents/freeconvert-tools && npm install`
Run: `npm run build`
Expected: Build succeeds (no pages yet, just layout)

**Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: project scaffolding — Next.js 15, Tailwind v4, COOP/COEP headers"
```

---

## Task 2: Types & Data Model

**Files:**
- Create: `src/types/conversion.ts`

**Step 1: Create types file**

```ts
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
```

**Step 2: Commit**

```bash
git add src/types/conversion.ts
git commit -m "feat: add ConversionPair type definition"
```

---

## Task 3: Constants & Label Maps

**Files:**
- Create: `src/lib/constants.ts`

**Step 1: Create constants file**

```ts
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
```

**Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add constants with category labels, icons, and SEO copy"
```

---

## Task 4: Color System

**Files:**
- Create: `src/lib/colors.ts`

**Step 1: Create colors file**

```ts
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
```

**Step 2: Commit**

```bash
git add src/lib/colors.ts
git commit -m "feat: add category color system"
```

---

## Task 5: Icon Map

**Files:**
- Create: `src/lib/icons.ts`

**Step 1: Create icons file**

Follow smoothiebar-cards pattern: explicit named imports, string-to-component map, Sparkles fallback.

```ts
import {
  Image, Music, Video, FileText, ArrowRightLeft,
  Download, Upload, Shield, Zap, FileImage,
  FileAudio, FileVideo, FileCode, FileType,
  Sparkles, Globe, Lock, Gauge, Files,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  image: Image,
  music: Music,
  video: Video,
  'file-text': FileText,
  'arrow-right-left': ArrowRightLeft,
  download: Download,
  upload: Upload,
  shield: Shield,
  zap: Zap,
  'file-image': FileImage,
  'file-audio': FileAudio,
  'file-video': FileVideo,
  'file-code': FileCode,
  'file-type': FileType,
  sparkles: Sparkles,
  globe: Globe,
  lock: Lock,
  gauge: Gauge,
  files: Files,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Sparkles;
}
```

**Step 2: Commit**

```bash
git add src/lib/icons.ts
git commit -m "feat: add icon map with Sparkles fallback"
```

---

## Task 6: Conversion Data (conversions.json)

**Files:**
- Create: `data/conversions.json`

**Step 1: Generate the conversion catalog**

This file contains all 38 conversion pairs. Generate using a parallel agent batch (following SEOSITE playbook — batches of 20).

Each entry must follow the `ConversionPair` interface exactly. Here is the complete JSON to write:

```json
[
  {
    "id": "jpg-to-png",
    "from": "JPG",
    "fromExt": "jpg",
    "to": "PNG",
    "toExt": "png",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free JPG to PNG Converter Online",
    "description": "Convert JPG images to PNG format instantly in your browser. Lossless quality, transparent background support, no file size limits. Your files never leave your device.",
    "tagline": "Convert JPG to PNG with transparent background support",
    "features": ["Lossless quality", "Transparency support", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 100
  },
  {
    "id": "png-to-jpg",
    "from": "PNG",
    "fromExt": "png",
    "to": "JPG",
    "toExt": "jpg",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free PNG to JPG Converter Online",
    "description": "Convert PNG images to JPG format for smaller file sizes. Adjustable quality, fast browser-based conversion, no uploads required.",
    "tagline": "Convert PNG to JPG for smaller, shareable images",
    "features": ["Adjustable quality", "Smaller file size", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 100
  },
  {
    "id": "jpg-to-webp",
    "from": "JPG",
    "fromExt": "jpg",
    "to": "WebP",
    "toExt": "webp",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free JPG to WebP Converter Online",
    "description": "Convert JPG to WebP for 25-35% smaller files with the same visual quality. Perfect for web optimization. All conversion happens in your browser.",
    "tagline": "Convert JPG to WebP for optimized web images",
    "features": ["25-35% smaller files", "Web optimized", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 100
  },
  {
    "id": "webp-to-jpg",
    "from": "WebP",
    "fromExt": "webp",
    "to": "JPG",
    "toExt": "jpg",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free WebP to JPG Converter Online",
    "description": "Convert WebP images to universally compatible JPG format. Perfect for sharing on platforms that don't support WebP. Fast, free, and private.",
    "tagline": "Convert WebP to JPG for universal compatibility",
    "features": ["Universal compatibility", "Adjustable quality", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 100
  },
  {
    "id": "png-to-webp",
    "from": "PNG",
    "fromExt": "png",
    "to": "WebP",
    "toExt": "webp",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free PNG to WebP Converter Online",
    "description": "Convert PNG to WebP for dramatically smaller files. WebP supports both lossy and lossless compression with transparency. Browser-based, no upload needed.",
    "tagline": "Convert PNG to WebP with transparency preserved",
    "features": ["Transparency preserved", "Much smaller files", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 100
  },
  {
    "id": "webp-to-png",
    "from": "WebP",
    "fromExt": "webp",
    "to": "PNG",
    "toExt": "png",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free WebP to PNG Converter Online",
    "description": "Convert WebP images to PNG format with lossless quality. Preserves transparency and full color depth. All processing happens locally in your browser.",
    "tagline": "Convert WebP to PNG with lossless quality",
    "features": ["Lossless quality", "Transparency preserved", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 100
  },
  {
    "id": "png-to-avif",
    "from": "PNG",
    "fromExt": "png",
    "to": "AVIF",
    "toExt": "avif",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free PNG to AVIF Converter Online",
    "description": "Convert PNG to AVIF — the next-generation image format with up to 50% better compression than WebP. Browser-based, private, and free.",
    "tagline": "Convert PNG to AVIF for next-gen compression",
    "features": ["50% better than WebP", "Next-gen format", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 100
  },
  {
    "id": "avif-to-png",
    "from": "AVIF",
    "fromExt": "avif",
    "to": "PNG",
    "toExt": "png",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free AVIF to PNG Converter Online",
    "description": "Convert AVIF images to widely compatible PNG format. Lossless conversion preserves full quality. No server upload — all processing in your browser.",
    "tagline": "Convert AVIF to PNG for wide compatibility",
    "features": ["Lossless quality", "Wide compatibility", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 100
  },
  {
    "id": "webp-to-avif",
    "from": "WebP",
    "fromExt": "webp",
    "to": "AVIF",
    "toExt": "avif",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free WebP to AVIF Converter Online",
    "description": "Upgrade WebP images to AVIF for even better compression. AVIF offers superior quality at smaller file sizes. Converted locally in your browser.",
    "tagline": "Upgrade WebP to AVIF for even smaller files",
    "features": ["Better compression", "Next-gen format", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 100
  },
  {
    "id": "avif-to-webp",
    "from": "AVIF",
    "fromExt": "avif",
    "to": "WebP",
    "toExt": "webp",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free AVIF to WebP Converter Online",
    "description": "Convert AVIF to WebP for broader browser support. WebP is supported by all modern browsers. Fast, free, and completely private.",
    "tagline": "Convert AVIF to WebP for broader support",
    "features": ["Broad browser support", "Good compression", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 100
  },
  {
    "id": "svg-to-png",
    "from": "SVG",
    "fromExt": "svg",
    "to": "PNG",
    "toExt": "png",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free SVG to PNG Converter Online",
    "description": "Convert SVG vector graphics to PNG raster images. Choose your output resolution. Perfect for social media, presentations, and web graphics.",
    "tagline": "Convert SVG vectors to PNG at any resolution",
    "features": ["Custom resolution", "Transparency support", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 50
  },
  {
    "id": "png-to-ico",
    "from": "PNG",
    "fromExt": "png",
    "to": "ICO",
    "toExt": "ico",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free PNG to ICO Converter Online",
    "description": "Convert PNG images to ICO favicon format for websites. Generates multi-size ICO files (16x16, 32x32, 48x48). Browser-based and free.",
    "tagline": "Create ICO favicons from PNG images",
    "features": ["Multi-size output", "Favicon ready", "No file limit", "Instant conversion"],
    "popular": true,
    "maxFileSizeMB": 20
  },
  {
    "id": "bmp-to-png",
    "from": "BMP",
    "fromExt": "bmp",
    "to": "PNG",
    "toExt": "png",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free BMP to PNG Converter Online",
    "description": "Convert BMP bitmap images to compressed PNG format. Dramatically reduce file size while maintaining quality. All processing in your browser.",
    "tagline": "Convert bulky BMP files to compact PNG",
    "features": ["Massive size reduction", "Lossless quality", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 200
  },
  {
    "id": "jpg-to-avif",
    "from": "JPG",
    "fromExt": "jpg",
    "to": "AVIF",
    "toExt": "avif",
    "category": "image",
    "icon": "file-image",
    "color": "#8B5CF6",
    "engine": "canvas",
    "title": "Free JPG to AVIF Converter Online",
    "description": "Convert JPG images to AVIF for the best compression ratio available. Up to 50% smaller than JPG at similar quality. Free and private.",
    "tagline": "Convert JPG to AVIF for maximum compression",
    "features": ["50% smaller files", "Next-gen format", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 100
  },
  {
    "id": "mp4-to-mp3",
    "from": "MP4",
    "fromExt": "mp4",
    "to": "MP3",
    "toExt": "mp3",
    "category": "audio",
    "icon": "file-audio",
    "color": "#EC4899",
    "engine": "ffmpeg",
    "title": "Free MP4 to MP3 Converter Online",
    "description": "Extract audio from MP4 video files as MP3. Perfect for saving music from videos, extracting podcast audio, or creating ringtones. No upload needed.",
    "tagline": "Extract MP3 audio from any MP4 video",
    "features": ["Audio extraction", "Adjustable bitrate", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 500
  },
  {
    "id": "wav-to-mp3",
    "from": "WAV",
    "fromExt": "wav",
    "to": "MP3",
    "toExt": "mp3",
    "category": "audio",
    "icon": "file-audio",
    "color": "#EC4899",
    "engine": "ffmpeg",
    "title": "Free WAV to MP3 Converter Online",
    "description": "Convert WAV audio to compressed MP3 format. Reduce file size by up to 90% while maintaining great audio quality. Browser-based and private.",
    "tagline": "Compress WAV to MP3 with great quality",
    "features": ["90% size reduction", "Adjustable bitrate", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 500
  },
  {
    "id": "m4a-to-wav",
    "from": "M4A",
    "fromExt": "m4a",
    "to": "WAV",
    "toExt": "wav",
    "category": "audio",
    "icon": "file-audio",
    "color": "#EC4899",
    "engine": "ffmpeg",
    "title": "Free M4A to WAV Converter Online",
    "description": "Convert M4A (Apple audio) to uncompressed WAV format. Perfect for audio editing, music production, and professional workflows. No server upload.",
    "tagline": "Convert M4A to lossless WAV for editing",
    "features": ["Lossless output", "Studio quality", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "m4a-to-mp3",
    "from": "M4A",
    "fromExt": "m4a",
    "to": "MP3",
    "toExt": "mp3",
    "category": "audio",
    "icon": "file-audio",
    "color": "#EC4899",
    "engine": "ffmpeg",
    "title": "Free M4A to MP3 Converter Online",
    "description": "Convert Apple M4A audio files to universally compatible MP3. Works with iPhone voice memos, Apple Music downloads, and iTunes files. Free and private.",
    "tagline": "Convert Apple M4A audio to universal MP3",
    "features": ["Universal compatibility", "Adjustable bitrate", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 500
  },
  {
    "id": "ogg-to-mp3",
    "from": "OGG",
    "fromExt": "ogg",
    "to": "MP3",
    "toExt": "mp3",
    "category": "audio",
    "icon": "file-audio",
    "color": "#EC4899",
    "engine": "ffmpeg",
    "title": "Free OGG to MP3 Converter Online",
    "description": "Convert OGG Vorbis audio to widely supported MP3 format. Great for converting game audio, Discord recordings, and Linux media files.",
    "tagline": "Convert OGG Vorbis to universal MP3",
    "features": ["Universal playback", "Adjustable bitrate", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "mp3-to-wav",
    "from": "MP3",
    "fromExt": "mp3",
    "to": "WAV",
    "toExt": "wav",
    "category": "audio",
    "icon": "file-audio",
    "color": "#EC4899",
    "engine": "ffmpeg",
    "title": "Free MP3 to WAV Converter Online",
    "description": "Convert MP3 to uncompressed WAV for audio editing and production. Recover full waveform data for use in DAWs and professional audio tools.",
    "tagline": "Convert MP3 to WAV for audio editing",
    "features": ["Uncompressed output", "DAW compatible", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "flac-to-mp3",
    "from": "FLAC",
    "fromExt": "flac",
    "to": "MP3",
    "toExt": "mp3",
    "category": "audio",
    "icon": "file-audio",
    "color": "#EC4899",
    "engine": "ffmpeg",
    "title": "Free FLAC to MP3 Converter Online",
    "description": "Convert lossless FLAC audio to compressed MP3 for portable devices and streaming. Reduce file size by 80%+ while keeping excellent audio quality.",
    "tagline": "Compress FLAC to MP3 for portable listening",
    "features": ["80%+ size reduction", "Adjustable bitrate", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "webm-to-mp3",
    "from": "WebM",
    "fromExt": "webm",
    "to": "MP3",
    "toExt": "mp3",
    "category": "audio",
    "icon": "file-audio",
    "color": "#EC4899",
    "engine": "ffmpeg",
    "title": "Free WebM to MP3 Converter Online",
    "description": "Extract MP3 audio from WebM video files. Perfect for saving audio from web videos, YouTube downloads, and screen recordings. All in your browser.",
    "tagline": "Extract MP3 audio from WebM videos",
    "features": ["Audio extraction", "Adjustable bitrate", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "mp4-to-webm",
    "from": "MP4",
    "fromExt": "mp4",
    "to": "WebM",
    "toExt": "webm",
    "category": "video",
    "icon": "file-video",
    "color": "#F97316",
    "engine": "ffmpeg",
    "title": "Free MP4 to WebM Converter Online",
    "description": "Convert MP4 video to open WebM format for web embedding. WebM is royalty-free and optimized for HTML5 video. All processing in your browser.",
    "tagline": "Convert MP4 to WebM for web embedding",
    "features": ["Web optimized", "HTML5 compatible", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 500
  },
  {
    "id": "mov-to-mp4",
    "from": "MOV",
    "fromExt": "mov",
    "to": "MP4",
    "toExt": "mp4",
    "category": "video",
    "icon": "file-video",
    "color": "#F97316",
    "engine": "ffmpeg",
    "title": "Free MOV to MP4 Converter Online",
    "description": "Convert Apple MOV videos to universally compatible MP4. Perfect for iPhone and Mac videos that need to play everywhere. No upload, free, and private.",
    "tagline": "Convert Apple MOV videos to universal MP4",
    "features": ["Universal playback", "Smaller file size", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 500
  },
  {
    "id": "webm-to-mp4",
    "from": "WebM",
    "fromExt": "webm",
    "to": "MP4",
    "toExt": "mp4",
    "category": "video",
    "icon": "file-video",
    "color": "#F97316",
    "engine": "ffmpeg",
    "title": "Free WebM to MP4 Converter Online",
    "description": "Convert WebM videos to universally playable MP4 format. Essential for sharing web recordings on mobile devices and social media platforms.",
    "tagline": "Convert WebM to MP4 for universal playback",
    "features": ["Universal playback", "Mobile compatible", "No file limit", "Batch convert"],
    "popular": true,
    "maxFileSizeMB": 500
  },
  {
    "id": "avi-to-mp4",
    "from": "AVI",
    "fromExt": "avi",
    "to": "MP4",
    "toExt": "mp4",
    "category": "video",
    "icon": "file-video",
    "color": "#F97316",
    "engine": "ffmpeg",
    "title": "Free AVI to MP4 Converter Online",
    "description": "Convert legacy AVI videos to modern MP4 format. Dramatically reduce file size while improving compatibility with all devices and platforms.",
    "tagline": "Modernize AVI videos to compact MP4",
    "features": ["Massive size reduction", "Modern format", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "mp4-to-gif",
    "from": "MP4",
    "fromExt": "mp4",
    "to": "GIF",
    "toExt": "gif",
    "category": "video",
    "icon": "file-video",
    "color": "#F97316",
    "engine": "ffmpeg",
    "title": "Free MP4 to GIF Converter Online",
    "description": "Convert MP4 video clips to animated GIF images. Perfect for memes, reactions, tutorials, and social media. Adjustable frame rate and quality.",
    "tagline": "Turn MP4 clips into animated GIFs",
    "features": ["Custom frame rate", "Adjustable size", "No file limit", "Trim support"],
    "popular": true,
    "maxFileSizeMB": 200
  },
  {
    "id": "mov-to-webm",
    "from": "MOV",
    "fromExt": "mov",
    "to": "WebM",
    "toExt": "webm",
    "category": "video",
    "icon": "file-video",
    "color": "#F97316",
    "engine": "ffmpeg",
    "title": "Free MOV to WebM Converter Online",
    "description": "Convert Apple MOV videos to web-optimized WebM format. Ideal for embedding iPhone and Mac videos on websites and HTML5 applications.",
    "tagline": "Convert MOV to WebM for web embedding",
    "features": ["Web optimized", "Open format", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "mkv-to-mp4",
    "from": "MKV",
    "fromExt": "mkv",
    "to": "MP4",
    "toExt": "mp4",
    "category": "video",
    "icon": "file-video",
    "color": "#F97316",
    "engine": "ffmpeg",
    "title": "Free MKV to MP4 Converter Online",
    "description": "Convert MKV videos to widely compatible MP4 format. Perfect for playing MKV files on TVs, phones, and media players that don't support MKV.",
    "tagline": "Convert MKV to MP4 for device compatibility",
    "features": ["Wide compatibility", "Preserves quality", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "mp4-to-mov",
    "from": "MP4",
    "fromExt": "mp4",
    "to": "MOV",
    "toExt": "mov",
    "category": "video",
    "icon": "file-video",
    "color": "#F97316",
    "engine": "ffmpeg",
    "title": "Free MP4 to MOV Converter Online",
    "description": "Convert MP4 videos to Apple MOV format for Final Cut Pro, iMovie, and other Apple workflows. High quality conversion in your browser.",
    "tagline": "Convert MP4 to MOV for Apple workflows",
    "features": ["Apple compatible", "High quality", "No file limit", "Batch convert"],
    "popular": false,
    "maxFileSizeMB": 500
  },
  {
    "id": "json-to-csv",
    "from": "JSON",
    "fromExt": "json",
    "to": "CSV",
    "toExt": "csv",
    "category": "document",
    "icon": "file-code",
    "color": "#06B6D4",
    "engine": "papaparse",
    "title": "Free JSON to CSV Converter Online",
    "description": "Convert JSON data to CSV spreadsheet format instantly. Handles nested objects, arrays, and complex data structures. Perfect for data analysis in Excel.",
    "tagline": "Convert JSON data to CSV spreadsheets",
    "features": ["Handles nested data", "Excel compatible", "No file limit", "Instant conversion"],
    "popular": true,
    "maxFileSizeMB": 50
  },
  {
    "id": "csv-to-json",
    "from": "CSV",
    "fromExt": "csv",
    "to": "JSON",
    "toExt": "json",
    "category": "document",
    "icon": "file-code",
    "color": "#06B6D4",
    "engine": "papaparse",
    "title": "Free CSV to JSON Converter Online",
    "description": "Convert CSV spreadsheet data to structured JSON. Auto-detects headers, data types, and delimiters. Perfect for API development and data processing.",
    "tagline": "Convert CSV spreadsheets to structured JSON",
    "features": ["Auto-detect headers", "Type inference", "No file limit", "Instant conversion"],
    "popular": true,
    "maxFileSizeMB": 50
  },
  {
    "id": "markdown-to-html",
    "from": "Markdown",
    "fromExt": "md",
    "to": "HTML",
    "toExt": "html",
    "category": "document",
    "icon": "file-text",
    "color": "#06B6D4",
    "engine": "marked",
    "title": "Free Markdown to HTML Converter Online",
    "description": "Convert Markdown files to clean HTML. Supports GitHub Flavored Markdown including tables, code blocks, and task lists. Instant browser-based conversion.",
    "tagline": "Convert Markdown to clean, semantic HTML",
    "features": ["GFM support", "Clean output", "No file limit", "Instant conversion"],
    "popular": true,
    "maxFileSizeMB": 20
  },
  {
    "id": "html-to-markdown",
    "from": "HTML",
    "fromExt": "html",
    "to": "Markdown",
    "toExt": "md",
    "category": "document",
    "icon": "file-text",
    "color": "#06B6D4",
    "engine": "marked",
    "title": "Free HTML to Markdown Converter Online",
    "description": "Convert HTML pages to clean Markdown text. Strips styling while preserving structure, links, images, and headings. Great for documentation and note-taking.",
    "tagline": "Convert HTML to clean Markdown text",
    "features": ["Preserves structure", "Clean output", "No file limit", "Instant conversion"],
    "popular": false,
    "maxFileSizeMB": 20
  },
  {
    "id": "txt-to-pdf",
    "from": "TXT",
    "fromExt": "txt",
    "to": "PDF",
    "toExt": "pdf",
    "category": "document",
    "icon": "file-type",
    "color": "#06B6D4",
    "engine": "jspdf",
    "title": "Free TXT to PDF Converter Online",
    "description": "Convert plain text files to formatted PDF documents. Clean typography, automatic pagination, and professional layout. No server upload required.",
    "tagline": "Convert plain text to professional PDFs",
    "features": ["Clean typography", "Auto pagination", "No file limit", "Instant conversion"],
    "popular": true,
    "maxFileSizeMB": 20
  },
  {
    "id": "csv-to-pdf",
    "from": "CSV",
    "fromExt": "csv",
    "to": "PDF",
    "toExt": "pdf",
    "category": "document",
    "icon": "file-type",
    "color": "#06B6D4",
    "engine": "jspdf",
    "title": "Free CSV to PDF Converter Online",
    "description": "Convert CSV data to formatted PDF tables. Auto-detects columns, applies clean table styling, and handles large datasets. Browser-based and free.",
    "tagline": "Convert CSV data to formatted PDF tables",
    "features": ["Table formatting", "Auto columns", "No file limit", "Instant conversion"],
    "popular": false,
    "maxFileSizeMB": 50
  },
  {
    "id": "json-to-pdf",
    "from": "JSON",
    "fromExt": "json",
    "to": "PDF",
    "toExt": "pdf",
    "category": "document",
    "icon": "file-type",
    "color": "#06B6D4",
    "engine": "jspdf",
    "title": "Free JSON to PDF Converter Online",
    "description": "Convert JSON data to readable, formatted PDF documents. Handles nested objects with proper indentation and syntax highlighting. Free and private.",
    "tagline": "Convert JSON data to readable PDFs",
    "features": ["Formatted output", "Syntax highlighting", "No file limit", "Instant conversion"],
    "popular": false,
    "maxFileSizeMB": 50
  },
  {
    "id": "markdown-to-pdf",
    "from": "Markdown",
    "fromExt": "md",
    "to": "PDF",
    "toExt": "pdf",
    "category": "document",
    "icon": "file-type",
    "color": "#06B6D4",
    "engine": "jspdf",
    "title": "Free Markdown to PDF Converter Online",
    "description": "Convert Markdown documents to beautifully formatted PDFs. Supports headers, lists, code blocks, tables, and images. Perfect for documentation and reports.",
    "tagline": "Convert Markdown docs to beautiful PDFs",
    "features": ["Full MD support", "Clean typography", "No file limit", "Instant conversion"],
    "popular": true,
    "maxFileSizeMB": 20
  }
]
```

**Step 2: Commit**

```bash
git add data/conversions.json
git commit -m "feat: add 38 conversion pairs across image, audio, video, document"
```

---

## Task 7: Data Access Layer

**Files:**
- Create: `src/lib/conversions.ts`

**Step 1: Create data access functions**

```ts
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
```

**Step 2: Commit**

```bash
git add src/lib/conversions.ts
git commit -m "feat: add data access layer with filtering and related conversions"
```

---

## Task 8: SEO Helpers

**Files:**
- Create: `src/lib/seo.ts`

**Step 1: Create SEO utilities**

```ts
import type { ConversionPair } from '@/types/conversion';
import { SITE_URL, categoryLabels } from './constants';

export function conversionMetaTitle(conversion: ConversionPair): string {
  return conversion.title;
}

export function conversionMetaDescription(conversion: ConversionPair): string {
  return conversion.description;
}

export function conversionStructuredData(conversion: ConversionPair) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: conversion.title,
    description: conversion.description,
    url: `${SITE_URL}/convert/${conversion.id}`,
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: conversion.features.join(', '),
  };
}

export function collectionStructuredData(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: `${SITE_URL}${url}`,
  };
}

export function breadcrumbStructuredData(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/seo.ts
git commit -m "feat: add SEO helpers — structured data, meta generators, breadcrumbs"
```

---

## Task 9: Server Components — Header, Footer, Breadcrumbs

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`
- Create: `src/components/Breadcrumbs.tsx`

**Step 1: Create Header**

Follow smoothiebar-cards Header.tsx pattern but with 4 category dropdowns.

```tsx
import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import { ALL_CATEGORIES, categoryLabels } from '@/lib/constants';
import { getPopularByCategory } from '@/lib/conversions';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-1.5">
            <ArrowRightLeft size={20} className="text-accent" />
            <span className="font-heading text-lg font-bold text-foreground">freeconvert</span>
            <span className="font-heading text-lg font-bold text-accent">.tools</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-secondary">
            {ALL_CATEGORIES.map((category) => {
              const popular = getPopularByCategory(category);
              return (
                <div key={category} className="group relative">
                  <Link
                    href={`/category/${category}`}
                    className="cursor-pointer hover:text-foreground transition-colors"
                  >
                    {categoryLabels[category]}
                  </Link>
                  <div className="absolute top-full left-0 pt-2 hidden group-hover:block z-50">
                    <div className="bg-card rounded-xl shadow-card-hover border border-border p-3 min-w-[220px]">
                      {popular.map((c) => (
                        <Link
                          key={c.id}
                          href={`/convert/${c.id}`}
                          className="block px-3 py-1.5 text-sm text-secondary hover:text-foreground hover:bg-background rounded-lg transition-colors"
                        >
                          {c.from} → {c.to}
                        </Link>
                      ))}
                      <Link
                        href={`/category/${category}`}
                        className="block px-3 py-1.5 text-sm text-accent hover:text-accent/80 rounded-lg transition-colors mt-1 border-t border-border pt-2"
                      >
                        View all →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/#categories"
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              All Tools
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Create Footer**

```tsx
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { ALL_CATEGORIES, categoryLabels } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t border-border-footer bg-card">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {ALL_CATEGORIES.map((category) => (
            <div key={category}>
              <h3 className="font-heading text-sm font-bold text-foreground mb-3">
                {categoryLabels[category]}
              </h3>
              <Link
                href={`/category/${category}`}
                className="text-sm text-secondary hover:text-foreground transition-colors"
              >
                All {categoryLabels[category]} converters →
              </Link>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-secondary mb-6">
          <Shield size={16} className="text-success" />
          <span>Files never leave your device. All conversions happen locally in your browser.</span>
        </div>

        <div className="text-xs text-tertiary">
          © {new Date().getFullYear()} freeconvert.tools. Free online file converter — no uploads, no limits, 100% private.
        </div>
      </div>
    </footer>
  );
}
```

**Step 3: Create Breadcrumbs**

```tsx
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-secondary mb-6">
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home size={14} />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-tertiary" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/Header.tsx src/components/Footer.tsx src/components/Breadcrumbs.tsx
git commit -m "feat: add Header, Footer, and Breadcrumbs components"
```

---

## Task 10: Server Components — ConversionCard, ConversionGrid, CategoryCard

**Files:**
- Create: `src/components/ConversionCard.tsx`
- Create: `src/components/ConversionGrid.tsx`
- Create: `src/components/CategoryCard.tsx`
- Create: `src/components/FeatureBadge.tsx`
- Create: `src/components/AdSlot.tsx`

**Step 1: Create ConversionCard**

```tsx
import Link from 'next/link';
import type { ConversionPair } from '@/types/conversion';
import { categoryColors } from '@/lib/colors';
import { categoryLabels } from '@/lib/constants';
import { ArrowRight } from 'lucide-react';

interface ConversionCardProps {
  conversion: ConversionPair;
}

export default function ConversionCard({ conversion }: ConversionCardProps) {
  const colors = categoryColors[conversion.category];

  return (
    <Link
      href={`/convert/${conversion.id}`}
      className="group block bg-card rounded-[var(--radius-card)] border border-border p-5 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center justify-center shrink-0 rounded-xl"
          style={{ width: 44, height: 44, backgroundColor: colors.bg }}
        >
          <span className="font-mono text-xs font-bold uppercase" style={{ color: colors.text }}>
            {conversion.fromExt}
          </span>
        </div>
        <ArrowRight size={16} className="text-tertiary shrink-0" />
        <div
          className="flex items-center justify-center shrink-0 rounded-xl"
          style={{ width: 44, height: 44, backgroundColor: colors.bg }}
        >
          <span className="font-mono text-xs font-bold uppercase" style={{ color: colors.text }}>
            {conversion.toExt}
          </span>
        </div>
      </div>

      <h3 className="font-heading text-sm font-semibold text-foreground leading-tight group-hover:text-accent transition-colors mb-1">
        {conversion.from} to {conversion.to}
      </h3>
      <p className="text-xs text-secondary line-clamp-2 mb-3">
        {conversion.tagline}
      </p>

      <div className="flex items-center gap-2">
        <span
          className="inline-block rounded-full text-[10px] px-2.5 py-0.5 font-medium"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {categoryLabels[conversion.category]}
        </span>
      </div>
    </Link>
  );
}
```

**Step 2: Create ConversionGrid**

```tsx
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
```

**Step 3: Create CategoryCard**

```tsx
import Link from 'next/link';
import type { Category } from '@/types/conversion';
import { categoryColors } from '@/lib/colors';
import { categoryLabels, categoryDescriptions, categoryIcons } from '@/lib/constants';
import { getIcon } from '@/lib/icons';
import { getPopularByCategory } from '@/lib/conversions';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const colors = categoryColors[category];
  const Icon = getIcon(categoryIcons[category]);
  const popular = getPopularByCategory(category);

  return (
    <div className="bg-card rounded-[var(--radius-card)] border border-border p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center shrink-0 rounded-xl"
          style={{ width: 44, height: 44, backgroundColor: colors.bg }}
        >
          <Icon size={22} style={{ color: colors.text }} />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            {categoryLabels[category]}
          </h3>
          <p className="text-xs text-secondary">{categoryDescriptions[category]}</p>
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {popular.slice(0, 4).map((c) => (
          <li key={c.id}>
            <Link
              href={`/convert/${c.id}`}
              className="flex items-center gap-2 text-sm text-secondary hover:text-foreground transition-colors"
            >
              <ArrowRight size={14} className="text-tertiary" />
              {c.from} to {c.to}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/category/${category}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
      >
        All {categoryLabels[category].toLowerCase()} converters
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
```

**Step 4: Create FeatureBadge**

```tsx
interface FeatureBadgeProps {
  label: string;
}

export default function FeatureBadge({ label }: FeatureBadgeProps) {
  return (
    <span className="inline-block rounded-full text-[11px] px-3 py-1 font-medium bg-background border border-border text-secondary">
      {label}
    </span>
  );
}
```

**Step 5: Create AdSlot**

```tsx
interface AdSlotProps {
  position: 'homepage-leaderboard' | 'in-grid' | 'converter-page' | 'category-page';
}

const adSizes: Record<string, string> = {
  'homepage-leaderboard': 'min-h-[90px] max-w-[728px]',
  'in-grid': 'min-h-[250px]',
  'converter-page': 'min-h-[90px] max-w-[728px]',
  'category-page': 'min-h-[90px] max-w-[728px]',
};

export default function AdSlot({ position }: AdSlotProps) {
  return (
    <div className={`mx-auto w-full ${adSizes[position]}`}>
      <div
        className="w-full h-full"
        data-ad-slot={position}
        aria-hidden="true"
      />
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add src/components/ConversionCard.tsx src/components/ConversionGrid.tsx src/components/CategoryCard.tsx src/components/FeatureBadge.tsx src/components/AdSlot.tsx
git commit -m "feat: add ConversionCard, ConversionGrid, CategoryCard, FeatureBadge, AdSlot"
```

---

## Task 11: Server Component — RelatedConversions

**Files:**
- Create: `src/components/RelatedConversions.tsx`

**Step 1: Create component**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/components/RelatedConversions.tsx
git commit -m "feat: add RelatedConversions component"
```

---

## Task 12: Client Component — ConverterEngine (Core UI)

**Files:**
- Create: `src/components/ConverterEngine.tsx`

This is the main client-side converter interface — drag & drop, progress bar, download. It lazy-loads the conversion logic and delegates to Web Workers.

**Step 1: Create ConverterEngine**

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, Shield, X, FileIcon } from 'lucide-react';
import type { ConversionPair } from '@/types/conversion';

interface FileItem {
  file: File;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  output?: Blob;
  outputName?: string;
  error?: string;
}

interface ConverterEngineProps {
  conversion: ConversionPair;
}

export default function ConverterEngine({ conversion }: ConverterEngineProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileItem[] = acceptedFiles.map((file) => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [`*/*`]: [`.${conversion.fromExt}`] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const convertFiles = async () => {
    setIsConverting(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'converting' as const, progress: 10 } : f
        )
      );

      try {
        const { convertFile } = await import('@/lib/converter');
        const result = await convertFile(
          files[i].file,
          conversion,
          (progress) => {
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, progress } : f
              )
            );
          }
        );

        const outputName = files[i].file.name.replace(
          /\.[^.]+$/,
          `.${conversion.toExt}`
        );

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'done' as const, progress: 100, output: result, outputName }
              : f
          )
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'error' as const, error: err instanceof Error ? err.message : 'Conversion failed' }
              : f
          )
        );
      }
    }

    setIsConverting(false);
  };

  const downloadFile = (item: FileItem) => {
    if (!item.output || !item.outputName) return;
    const url = URL.createObjectURL(item.output);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.outputName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    files.filter((f) => f.status === 'done').forEach(downloadFile);
  };

  const hasFiles = files.length > 0;
  const hasDone = files.some((f) => f.status === 'done');
  const hasPending = files.some((f) => f.status === 'pending');

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="bg-card rounded-[var(--radius-card)] border border-border p-6 shadow-card">
      {/* Privacy badge */}
      <div className="flex items-center gap-2 text-xs text-success mb-4">
        <Shield size={14} />
        <span>Files never leave your device. Conversion happens locally in your browser.</span>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-[var(--radius-dropzone)] p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-accent bg-accent/5 shadow-dropzone' : 'border-border hover:border-accent/50 hover:bg-background'}
        `}
      >
        <input {...getInputProps()} />
        <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-accent' : 'text-tertiary'}`} />
        <p className="text-sm font-medium text-foreground mb-1">
          {isDragActive ? 'Drop files here...' : `Drop .${conversion.fromExt} files here, or click to browse`}
        </p>
        <p className="text-xs text-secondary">
          No file size limit — all processing happens in your browser
        </p>
      </div>

      {/* File list */}
      {hasFiles && (
        <div className="mt-4 space-y-2">
          {files.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border"
            >
              <FileIcon size={18} className="text-secondary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.file.name}
                </p>
                <p className="file-meta text-xs text-secondary">
                  {formatSize(item.file.size)}
                </p>
              </div>

              {item.status === 'converting' && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="file-meta text-xs text-secondary w-8">{item.progress}%</span>
                </div>
              )}

              {item.status === 'done' && (
                <button
                  onClick={() => downloadFile(item)}
                  className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors shrink-0"
                >
                  <Download size={14} />
                  Download
                </button>
              )}

              {item.status === 'done' && (
                <CheckCircle2 size={18} className="text-success shrink-0" />
              )}

              {item.status === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-error shrink-0">
                  <AlertCircle size={14} />
                  {item.error}
                </div>
              )}

              {item.status === 'pending' && (
                <button
                  onClick={() => removeFile(i)}
                  className="text-tertiary hover:text-secondary transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {hasFiles && (
        <div className="flex items-center gap-3 mt-4">
          {hasPending && (
            <button
              onClick={convertFiles}
              disabled={isConverting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)] bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isConverting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Converting...
                </>
              ) : (
                <>Convert {files.filter((f) => f.status === 'pending').length} file{files.filter((f) => f.status === 'pending').length !== 1 ? 's' : ''}</>
              )}
            </button>
          )}

          {hasDone && files.filter((f) => f.status === 'done').length > 1 && (
            <button
              onClick={downloadAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)] bg-success text-white text-sm font-medium hover:bg-success/90 transition-colors"
            >
              <Download size={16} />
              Download All
            </button>
          )}
        </div>
      )}
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ConverterEngine.tsx
git commit -m "feat: add ConverterEngine client component — dropzone, progress, batch"
```

---

## Task 13: Conversion Logic — Converter Library

**Files:**
- Create: `src/lib/converter.ts`

This is the main conversion dispatch module. It dynamically imports the right engine based on the conversion's `engine` field.

**Step 1: Create converter.ts**

```ts
import type { ConversionPair } from '@/types/conversion';

type ProgressCallback = (progress: number) => void;

export async function convertFile(
  file: File,
  conversion: ConversionPair,
  onProgress: ProgressCallback
): Promise<Blob> {
  switch (conversion.engine) {
    case 'canvas':
      return convertWithCanvas(file, conversion, onProgress);
    case 'ffmpeg':
      return convertWithFFmpeg(file, conversion, onProgress);
    case 'jspdf':
      return convertWithJsPDF(file, conversion, onProgress);
    case 'papaparse':
      return convertWithPapaParse(file, conversion, onProgress);
    case 'marked':
      return convertWithMarked(file, conversion, onProgress);
    default:
      throw new Error(`Unsupported engine: ${conversion.engine}`);
  }
}

async function convertWithCanvas(
  file: File,
  conversion: ConversionPair,
  onProgress: ProgressCallback
): Promise<Blob> {
  onProgress(20);

  // Handle SVG to PNG separately
  if (conversion.fromExt === 'svg') {
    return svgToPng(file, onProgress);
  }

  // Handle PNG to ICO separately
  if (conversion.toExt === 'ico') {
    return pngToIco(file, onProgress);
  }

  // Standard image conversion via canvas
  const bitmap = await createImageBitmap(file);
  onProgress(40);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  onProgress(60);

  const mimeType = getMimeType(conversion.toExt);
  const quality = conversion.toExt === 'jpg' || conversion.toExt === 'webp' ? 0.92 : undefined;

  const blob = await canvas.convertToBlob({ type: mimeType, quality });
  onProgress(90);

  return blob;
}

async function svgToPng(file: File, onProgress: ProgressCallback): Promise<Blob> {
  const svgText = await file.text();
  onProgress(30);

  const img = new Image();
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1024;
      canvas.height = img.naturalHeight || 1024;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      onProgress(70);

      canvas.toBlob((blob) => {
        if (blob) {
          onProgress(90);
          resolve(blob);
        } else {
          reject(new Error('Failed to convert SVG'));
        }
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    img.src = url;
  });
}

async function pngToIco(file: File, onProgress: ProgressCallback): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  onProgress(30);

  const sizes = [16, 32, 48];
  const images: ArrayBuffer[] = [];

  for (const size of sizes) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, size, size);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    images.push(await blob.arrayBuffer());
  }
  onProgress(60);

  // Build ICO file
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffset = headerSize + dirEntrySize * images.length;

  let totalSize = dataOffset;
  for (const img of images) totalSize += img.byteLength;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // ICO header
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, images.length, true); // count

  let offset = dataOffset;
  for (let i = 0; i < images.length; i++) {
    const size = sizes[i];
    const entryOffset = headerSize + i * dirEntrySize;
    view.setUint8(entryOffset, size === 256 ? 0 : size); // width
    view.setUint8(entryOffset + 1, size === 256 ? 0 : size); // height
    view.setUint8(entryOffset + 2, 0); // palette
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, images[i].byteLength, true); // size
    view.setUint32(entryOffset + 12, offset, true); // offset

    new Uint8Array(buffer, offset).set(new Uint8Array(images[i]));
    offset += images[i].byteLength;
  }

  onProgress(90);
  return new Blob([buffer], { type: 'image/x-icon' });
}

async function convertWithFFmpeg(
  file: File,
  conversion: ConversionPair,
  onProgress: ProgressCallback
): Promise<Blob> {
  onProgress(10);

  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile } = await import('@ffmpeg/util');
  onProgress(20);

  const ffmpeg = new FFmpeg();
  ffmpeg.on('progress', ({ progress }) => {
    onProgress(20 + Math.round(progress * 70));
  });

  await ffmpeg.load();
  onProgress(30);

  const inputName = `input.${conversion.fromExt}`;
  const outputName = `output.${conversion.toExt}`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  onProgress(40);

  // Build ffmpeg command based on conversion
  const args = buildFFmpegArgs(inputName, outputName, conversion);
  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputName);
  onProgress(95);

  const mimeType = getMimeType(conversion.toExt);
  return new Blob([data], { type: mimeType });
}

function buildFFmpegArgs(input: string, output: string, conversion: ConversionPair): string[] {
  // Audio extraction from video
  if (conversion.category === 'audio' && ['mp4', 'webm'].includes(conversion.fromExt)) {
    return ['-i', input, '-vn', '-ab', '192k', output];
  }

  // Audio to audio
  if (conversion.category === 'audio') {
    return ['-i', input, '-ab', '192k', output];
  }

  // Video to GIF
  if (conversion.toExt === 'gif') {
    return ['-i', input, '-vf', 'fps=15,scale=480:-1:flags=lanczos', '-t', '10', output];
  }

  // Video to video
  return ['-i', input, output];
}

async function convertWithJsPDF(
  file: File,
  conversion: ConversionPair,
  onProgress: ProgressCallback
): Promise<Blob> {
  onProgress(20);

  const { default: jsPDF } = await import('jspdf');
  const text = await file.text();
  onProgress(40);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  if (conversion.fromExt === 'csv') {
    // Parse CSV and render as table
    const { default: Papa } = await import('papaparse');
    const parsed = Papa.parse(text, { header: true });
    const headers = parsed.meta.fields || [];
    const rows = parsed.data as Record<string, string>[];

    doc.setFontSize(10);
    let y = margin;
    const colWidth = maxWidth / Math.max(headers.length, 1);

    // Header row
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => {
      doc.text(h, margin + i * colWidth, y, { maxWidth: colWidth - 2 });
    });
    y += 8;
    doc.setFont('helvetica', 'normal');

    // Data rows
    for (const row of rows) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      headers.forEach((h, i) => {
        doc.text(String(row[h] || ''), margin + i * colWidth, y, { maxWidth: colWidth - 2 });
      });
      y += 6;
    }
  } else if (conversion.fromExt === 'json') {
    // Pretty-print JSON
    const formatted = JSON.stringify(JSON.parse(text), null, 2);
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    const lines = doc.splitTextToSize(formatted, maxWidth);
    let y = margin;
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    }
  } else if (conversion.fromExt === 'md') {
    // Render markdown as formatted text
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, maxWidth);
    let y = margin;
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }
  } else {
    // Plain text
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, maxWidth);
    let y = margin;
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }
  }

  onProgress(80);
  const blob = doc.output('blob');
  onProgress(95);
  return blob;
}

async function convertWithPapaParse(
  file: File,
  conversion: ConversionPair,
  onProgress: ProgressCallback
): Promise<Blob> {
  onProgress(20);

  const text = await file.text();
  onProgress(40);

  if (conversion.fromExt === 'json' && conversion.toExt === 'csv') {
    const { default: Papa } = await import('papaparse');
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : [data];
    const csv = Papa.unparse(arr);
    onProgress(90);
    return new Blob([csv], { type: 'text/csv' });
  }

  if (conversion.fromExt === 'csv' && conversion.toExt === 'json') {
    const { default: Papa } = await import('papaparse');
    const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
    const json = JSON.stringify(parsed.data, null, 2);
    onProgress(90);
    return new Blob([json], { type: 'application/json' });
  }

  throw new Error('Unsupported PapaParse conversion');
}

async function convertWithMarked(
  file: File,
  conversion: ConversionPair,
  onProgress: ProgressCallback
): Promise<Blob> {
  onProgress(20);

  const text = await file.text();
  onProgress(40);

  if (conversion.fromExt === 'md' && conversion.toExt === 'html') {
    const { marked } = await import('marked');
    const html = await marked(text);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Converted Document</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#1a1a1a}pre{background:#f5f5f5;padding:1rem;border-radius:4px;overflow-x:auto}code{background:#f5f5f5;padding:0.2em 0.4em;border-radius:3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:0.5rem;text-align:left}</style>
</head>
<body>${html}</body></html>`;
    onProgress(90);
    return new Blob([fullHtml], { type: 'text/html' });
  }

  if (conversion.fromExt === 'html' && conversion.toExt === 'md') {
    // Basic HTML to Markdown conversion
    let md = text;
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n\n');
    md = md.replace(/<[^>]+>/g, ''); // Strip remaining tags
    md = md.replace(/\n{3,}/g, '\n\n'); // Collapse extra newlines
    onProgress(90);
    return new Blob([md.trim()], { type: 'text/markdown' });
  }

  throw new Error('Unsupported Marked conversion');
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    json: 'application/json',
    csv: 'text/csv',
    html: 'text/html',
    md: 'text/markdown',
    txt: 'text/plain',
    pdf: 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
```

**Step 2: Commit**

```bash
git add src/lib/converter.ts
git commit -m "feat: add converter library — canvas, ffmpeg, jspdf, papaparse, marked engines"
```

---

## Task 14: Homepage

**Files:**
- Create: `src/app/page.tsx`

**Step 1: Create homepage**

```tsx
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryCard from '@/components/CategoryCard';
import ConversionGrid from '@/components/ConversionGrid';
import { ALL_CATEGORIES } from '@/lib/constants';
import { getPopularConversions } from '@/lib/conversions';

export const metadata: Metadata = {
  title: 'FreeConvert.tools — Free Online File Converter',
  description:
    'Convert files for free, directly in your browser. Image, audio, video, and document conversions — no uploads, no limits, 100% private.',
};

export default function HomePage() {
  const popular = getPopularConversions();

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-10 pb-20">
        {/* Hero */}
        <section className="text-center mb-14">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Convert files<br />
            <span className="text-accent">free & private.</span>
          </h1>
          <p className="text-base text-secondary max-w-xl mx-auto">
            No uploads, no limits, no accounts. All conversions happen directly in your browser — your files never leave your device.
          </p>
        </section>

        {/* Categories */}
        <section className="mb-14" id="categories">
          <h2 className="font-heading text-xl font-bold text-foreground mb-5">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_CATEGORIES.map((category) => (
              <CategoryCard key={category} category={category} />
            ))}
          </div>
        </section>

        {/* Popular */}
        <section className="mb-14">
          <h2 className="font-heading text-xl font-bold text-foreground mb-5">Popular Conversions</h2>
          <ConversionGrid conversions={popular} />
        </section>
      </main>
      <Footer />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add homepage with hero, category cards, popular conversions"
```

---

## Task 15: Converter Page (Dynamic Route)

**Files:**
- Create: `src/app/convert/[slug]/page.tsx`

**Step 1: Create converter page**

```tsx
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import FeatureBadge from '@/components/FeatureBadge';
import RelatedConversions from '@/components/RelatedConversions';
import { getAllConversions, getConversionById, getRelatedConversions } from '@/lib/conversions';
import { categoryLabels } from '@/lib/constants';
import { categoryColors } from '@/lib/colors';
import {
  conversionMetaTitle,
  conversionMetaDescription,
  conversionStructuredData,
  breadcrumbStructuredData,
} from '@/lib/seo';

const ConverterEngine = dynamic(() => import('@/components/ConverterEngine'), {
  ssr: false,
  loading: () => (
    <div className="bg-card rounded-[var(--radius-card)] border border-border p-6 shadow-card animate-pulse">
      <div className="h-40 bg-background rounded-[var(--radius-dropzone)]" />
    </div>
  ),
});

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
            <span className="text-2xl text-tertiary">→</span>
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
          <ConverterEngine conversion={conversion} />
        </div>

        {/* Related conversions */}
        <RelatedConversions conversions={related} />
      </main>
      <Footer />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/convert/[slug]/page.tsx
git commit -m "feat: add converter page with lazy-loaded ConverterEngine"
```

---

## Task 16: Category Page (Dynamic Route)

**Files:**
- Create: `src/app/category/[category]/page.tsx`

**Step 1: Create category page**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/app/category/[category]/page.tsx
git commit -m "feat: add category browse pages with SEO"
```

---

## Task 17: SEO Files — Sitemap, Robots, 404

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/not-found.tsx`

**Step 1: Create sitemap**

```ts
import type { MetadataRoute } from 'next';
import { getAllConversions } from '@/lib/conversions';
import { ALL_CATEGORIES } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://freeconvert.tools';

  const conversions = getAllConversions();

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
  ];

  const categoryPages = ALL_CATEGORIES.map((category) => ({
    url: `${baseUrl}/category/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const conversionPages = conversions.map((c) => ({
    url: `${baseUrl}/convert/${c.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...conversionPages];
}
```

**Step 2: Create robots**

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://freeconvert.tools';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

**Step 3: Create 404 page**

```tsx
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-20 text-center">
        <FileQuestion size={48} className="mx-auto text-tertiary mb-4" />
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-sm text-secondary mb-6">
          The converter you&apos;re looking for doesn&apos;t exist yet.
        </p>
        <Link
          href="/"
          className="inline-flex px-5 py-2.5 rounded-[var(--radius-button)] bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Browse all converters
        </Link>
      </main>
      <Footer />
    </>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts src/app/not-found.tsx
git commit -m "feat: add sitemap, robots.txt, and custom 404 page"
```

---

## Task 18: Google & Deploy Setup

**Files:**
- Create: `public/google27900233ff0bc69b.html`
- Create: `public/ads.txt`

**Step 1: Create Google Search Console verification**

```
google-site-verification: google27900233ff0bc69b.html
```

**Step 2: Create ads.txt**

```
google.com, pub-3452665186406442, DIRECT, f08c47fec0942fa0
```

**Step 3: Commit**

```bash
git add public/google27900233ff0bc69b.html public/ads.txt
git commit -m "feat: add Google Search Console verification and AdSense ads.txt"
```

---

## Task 19: Build Verification & Fix

**Step 1: Install dependencies**

Run: `cd /Users/david.scebat/Documents/freeconvert-tools && npm install`

**Step 2: Build**

Run: `npm run build`

Expected: All 38 converter pages + 4 category pages + homepage + sitemap + robots generate successfully.

**Step 3: Fix any build errors**

Common issues to watch for:
- Missing icon imports in `src/lib/icons.ts`
- Type mismatches in `conversions.json`
- COOP/COEP headers in `next.config.ts` format
- `params` not awaited in page components (Next.js 15)

Fix any issues, then re-run `npm run build` until clean.

**Step 4: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve build errors"
```

---

## Task 20: Git Repo & Vercel Deploy

**Step 1: Create GitHub repo**

Run: `cd /Users/david.scebat/Documents/freeconvert-tools && gh repo create dagroove1980/freeconvert-tools --public --source=. --push`

**Step 2: Verify on Vercel**

- Connect repo to Vercel dashboard (auto-detects Next.js)
- No environment variables needed (uses VERCEL_PROJECT_PRODUCTION_URL)
- Wait for first deployment

**Step 3: Add custom domain**

- Add `freeconvert.tools` custom domain in Vercel dashboard
- Update DNS records as instructed

**Step 4: Submit sitemap**

- Submit `https://freeconvert.tools/sitemap.xml` to Google Search Console
- Verify AdSense in Google AdSense dashboard

---

## Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Project scaffolding | None |
| 2 | Types & data model | 1 |
| 3 | Constants & labels | 2 |
| 4 | Color system | 2 |
| 5 | Icon map | None |
| 6 | Conversion data (JSON) | 2 |
| 7 | Data access layer | 2, 6 |
| 8 | SEO helpers | 2, 3 |
| 9 | Header, Footer, Breadcrumbs | 3, 4, 5, 7 |
| 10 | ConversionCard, Grid, CategoryCard, etc. | 3, 4, 5, 7 |
| 11 | RelatedConversions | 10 |
| 12 | ConverterEngine (client) | 2 |
| 13 | Converter library (engines) | 2 |
| 14 | Homepage | 9, 10, 7 |
| 15 | Converter page | 9, 10, 11, 12, 13, 8 |
| 16 | Category page | 9, 10, 7, 8 |
| 17 | Sitemap, robots, 404 | 7, 9 |
| 18 | Google & deploy setup | None |
| 19 | Build verification | 1-18 |
| 20 | Git repo & deploy | 19 |
