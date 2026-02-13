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
