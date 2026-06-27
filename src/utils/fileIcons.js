import {
  Folder, FileText, Image, Film, Music, Code2, Archive, Cog,
  File, HardDrive,
} from 'lucide-react';

const iconMap = {
  folder: { icon: Folder, className: 'folder' },
  image: { icon: Image, className: 'image' },
  video: { icon: Film, className: 'video' },
  audio: { icon: Music, className: 'audio' },
  document: { icon: FileText, className: 'document' },
  code: { icon: Code2, className: 'code' },
  archive: { icon: Archive, className: 'archive' },
  executable: { icon: Cog, className: 'executable' },
  other: { icon: File, className: 'other' },
  drive: { icon: HardDrive, className: 'other' },
};

export function getFileIcon(category) {
  return iconMap[category] || iconMap.other;
}
