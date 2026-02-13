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
  const bytes = data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(data);
  return new Blob([bytes], { type: mimeType });
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
    md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n\n');
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
