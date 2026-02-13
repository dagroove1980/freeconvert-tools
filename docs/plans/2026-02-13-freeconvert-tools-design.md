# freeconvert.tools — Design Document

**Date:** 2026-02-13
**Domain:** freeconvert.tools
**Architecture:** Static Catalog + Lazy WASM (Client-Side Processing)
**Reference:** smoothiebar-cards (same architecture pattern)

## Overview

SEO-driven file conversion platform. All conversions happen client-side in the browser via WASM/Canvas/JS libraries. Zero server costs. ~38 conversion pairs across 4 categories at launch.

## Architecture

- **Framework:** Next.js 15 (App Router, SSG via `generateStaticParams`)
- **Styling:** Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline`)
- **Icons:** lucide-react (explicit imports, string-to-component map)
- **OG Images:** @vercel/og
- **Conversion Engines:**
  - `canvas` — Image conversions (JPG, PNG, WebP, AVIF, SVG, ICO, BMP)
  - `ffmpeg` — ffmpeg.wasm for Audio/Video conversions
  - `jspdf` — Text/CSV/JSON/Markdown to PDF
  - `papaparse` — JSON↔CSV
  - `marked` — Markdown↔HTML
- **Deployment:** Vercel Hobby Tier (free forever)

## Data Model

```typescript
type Category = 'image' | 'audio' | 'video' | 'document';
type Engine = 'canvas' | 'ffmpeg' | 'jspdf' | 'papaparse' | 'marked';

interface ConversionPair {
  id: string;              // "webp-to-jpg"
  from: string;            // "WebP"
  fromExt: string;         // "webp"
  to: string;              // "JPG"
  toExt: string;           // "jpg"
  category: Category;
  icon: string;            // lucide icon name
  color: string;           // hex color
  engine: Engine;
  title: string;           // SEO title
  description: string;     // 155-char meta description
  tagline: string;         // Short UI text
  features: string[];      // ["Lossless", "Batch support"]
  popular: boolean;
  maxFileSizeMB: number;
}
```

All conversion data lives in `/data/conversions.json`.

## Conversion Catalog (~38 pairs)

### Image (14)
JPG→PNG, PNG→JPG, JPG→WebP, WebP→JPG, PNG→WebP, WebP→PNG, PNG→AVIF, AVIF→PNG, WebP→AVIF, AVIF→WebP, SVG→PNG, PNG→ICO, BMP→PNG, JPG→AVIF

### Audio (8)
MP4→MP3, WAV→MP3, M4A→WAV, M4A→MP3, OGG→MP3, MP3→WAV, FLAC→MP3, WebM→MP3

### Video (8)
MP4→WebM, MOV→MP4, WebM→MP4, AVI→MP4, MP4→GIF, MOV→WebM, MKV→MP4, MP4→MOV

### Document (8)
JSON→CSV, CSV→JSON, Markdown→HTML, HTML→Markdown, TXT→PDF, CSV→PDF, JSON→PDF, Markdown→PDF

## Route Structure

```
/                              — Homepage (hero + 4 category cards + popular grid)
/convert/[from]-to-[to]       — Converter page (SSG, 38 pages)
/category/[category]           — Category browse (SSG, 4 pages)
/sitemap.ts                    — Dynamic sitemap
/robots.ts                     — Allow all
/not-found.tsx                 — Custom 404
```

## SEO Strategy

### Per Conversion Page
- **Title:** "Free {From} to {To} Converter Online | freeconvert.tools"
- **H1:** "Convert {From} to {To} — Free, Fast & Private"
- **Meta description:** Unique 155-char from conversions.json
- **Structured data:** WebApplication schema
- **Breadcrumbs:** Home > {Category} > {From} to {To}

### Per Category Page
- **Title:** "Free {Category} Converters | freeconvert.tools"
- **H1:** "Free Online {Category} Converters"
- **Grid of all conversions in category**

### Sitemap Priorities
- Home: 1.0 (weekly)
- Category pages: 0.8 (weekly)
- Conversion pages: 0.7 (monthly)

## Component Architecture

### Server Components (SSG)
- `Header.tsx` — Sticky nav with category dropdowns
- `Footer.tsx` — Privacy statement, links, copyright
- `Breadcrumbs.tsx` — Home > Category > Conversion
- `ConversionCard.tsx` — Card with from→to, icon, category badge
- `ConversionGrid.tsx` — Responsive grid (3/2/1 cols)
- `CategoryCard.tsx` — Homepage category card with popular conversions
- `FeatureBadge.tsx` — Tags: "Lossless", "Batch", "No limit"
- `AdSlot.tsx` — Ad placement positions
- `RelatedConversions.tsx` — "You might also need..." grid

### Client Components ('use client')
- `ConverterEngine.tsx` — Main converter UI (lazy-loaded):
  - Drag & drop zone (react-dropzone)
  - File list with sizes
  - Convert button
  - Real-time progress bar (0-100%)
  - Download button(s)
  - Batch support (multiple files)
  - "Files never leave your device" privacy badge
- Web Worker for conversion logic (keeps UI responsive)

### UX Flow
1. User lands on `/convert/webp-to-jpg` (static page, fast LCP)
2. Sees SEO content: H1, description, features, related conversions
3. Scrolls to converter tool (lazy-loaded ConverterEngine)
4. Drops file(s) → engine loads appropriate WASM/library
5. Progress bar during conversion
6. Download button when complete
7. Below: related conversions grid

## Design System

```css
/* Core palette — clean blue-gray utility */
--color-background: #F7F9FC;
--color-foreground: #1A1F36;
--color-secondary: #6B7280;
--color-tertiary: #D1D5DB;
--color-accent: #3B82F6;       /* blue primary action */
--color-card: #FFFFFF;
--color-border: #E5E7EB;
--color-success: #10B981;      /* conversion complete */
--color-warning: #F59E0B;      /* file size warnings */

/* Category colors */
--color-image: #8B5CF6;        /* purple */
--color-audio: #EC4899;        /* pink */
--color-video: #F97316;        /* orange */
--color-document: #06B6D4;     /* cyan */

/* Typography — single font for utility feel */
--font-heading: 'Inter';
--font-body: 'Inter';
--font-mono: 'JetBrains Mono';

/* Spacing */
--radius-card: 16px;
--radius-pill: 20px;
--radius-button: 12px;

/* Shadows */
--shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.06);
--shadow-dropzone: 0 0 0 3px rgba(59,130,246,0.3);
```

## Technical Requirements

### COOP/COEP Headers (for ffmpeg.wasm SharedArrayBuffer)
```js
// next.config.ts
headers: [
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
]
```

### Web Worker Pattern
All heavy conversion runs in a Web Worker to keep the UI thread responsive. The worker posts progress updates back to the main thread for the progress bar.

### Privacy
- No file data ever sent to server
- All processing in browser
- Prominent "Files never leave your device" messaging

## Google Setup
- AdSense pub ID: ca-pub-3452665186406442
- Google Search Console verification file
- ads.txt in /public/
- AdSense script server-rendered in <head>

## Dependencies
```json
{
  "next": "^15.1.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "lucide-react": "^0.469.0",
  "@vercel/og": "^0.6.0",
  "@ffmpeg/ffmpeg": "^0.12.0",
  "@ffmpeg/util": "^0.12.0",
  "react-dropzone": "^14.0.0",
  "jspdf": "^2.5.0",
  "papaparse": "^5.4.0",
  "marked": "^12.0.0",
  "browser-image-compression": "^2.0.0"
}
```
