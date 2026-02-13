import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryCard from '@/components/CategoryCard';
import ConversionGrid from '@/components/ConversionGrid';
import { ALL_CATEGORIES } from '@/lib/constants';
import { getPopularConversions, getAllConversions } from '@/lib/conversions';
import { Upload, Zap, Download, Shield, Globe, Lock, MonitorSmartphone, Infinity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FreeConvert.tools — Free Online File Converter',
  description:
    'Convert images, audio, video, and documents for free — directly in your browser. No file uploads, no size limits, no registration. 100% private, works on any device.',
};

export default function HomePage() {
  const popular = getPopularConversions();
  const allConversions = getAllConversions();

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
          <p className="text-base text-secondary max-w-xl mx-auto mb-6">
            No uploads, no limits, no accounts. All conversions happen directly in your browser — your files never leave your device. Convert images, audio, video, and documents in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-secondary">
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-success" /> 100% Private</span>
            <span className="flex items-center gap-1.5"><Infinity size={14} className="text-accent" /> No File Limits</span>
            <span className="flex items-center gap-1.5"><Globe size={14} className="text-accent" /> Works Offline</span>
            <span className="flex items-center gap-1.5"><MonitorSmartphone size={14} className="text-accent" /> Any Device</span>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-14">
          <h2 className="font-heading text-xl font-bold text-foreground mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 mx-auto mb-3">
                <Upload size={22} className="text-accent" />
              </div>
              <h3 className="font-heading text-sm font-bold text-foreground mb-1">1. Choose Your File</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Drag and drop your file or click to browse. We accept all major image, audio, video, and document formats.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 mx-auto mb-3">
                <Zap size={22} className="text-accent" />
              </div>
              <h3 className="font-heading text-sm font-bold text-foreground mb-1">2. Convert Instantly</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Your file is processed right in your browser using WebAssembly technology. No server upload needed — conversion starts immediately.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 mx-auto mb-3">
                <Download size={22} className="text-accent" />
              </div>
              <h3 className="font-heading text-sm font-bold text-foreground mb-1">3. Download Result</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Download your converted file instantly. Convert multiple files at once with batch processing — no waiting, no queues.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-14 p-6 rounded-[var(--radius-card)] bg-card border border-border shadow-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="font-heading text-2xl font-bold text-accent">{allConversions.length}+</p>
              <p className="text-xs text-secondary">Conversion Types</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-accent">4</p>
              <p className="text-xs text-secondary">File Categories</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-accent">0</p>
              <p className="text-xs text-secondary">Files Uploaded</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-accent">100%</p>
              <p className="text-xs text-secondary">Browser-Based</p>
            </div>
          </div>
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

        {/* Why FreeConvert */}
        <section className="mb-14">
          <h2 className="font-heading text-xl font-bold text-foreground mb-6 text-center">Why FreeConvert.tools?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-[var(--radius-card)] bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Lock size={18} className="text-success" />
                <h3 className="font-heading text-sm font-bold text-foreground">Complete Privacy</h3>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Your files never leave your device. Unlike other converters that upload your files to their servers, we process everything locally in your browser. No data collection, no tracking, no risk.
              </p>
            </div>
            <div className="p-5 rounded-[var(--radius-card)] bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Zap size={18} className="text-warning" />
                <h3 className="font-heading text-sm font-bold text-foreground">Lightning Fast</h3>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                No upload wait times, no server queues. Conversion starts the moment you drop your file. Small files convert in under a second. Even large video files process quickly with WebAssembly.
              </p>
            </div>
            <div className="p-5 rounded-[var(--radius-card)] bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Infinity size={18} className="text-accent" />
                <h3 className="font-heading text-sm font-bold text-foreground">No Limits, Ever</h3>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                No file size limits, no daily conversion caps, no watermarks. Convert as many files as you want, as large as you want, as often as you want. Completely free, forever.
              </p>
            </div>
            <div className="p-5 rounded-[var(--radius-card)] bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <MonitorSmartphone size={18} className="text-image" />
                <h3 className="font-heading text-sm font-bold text-foreground">Works Everywhere</h3>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Use FreeConvert.tools on any device with a modern browser — Windows, Mac, Linux, iPhone, Android, Chromebook. No app downloads, no plugins, no Java required.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
