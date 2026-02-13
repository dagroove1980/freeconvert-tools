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
