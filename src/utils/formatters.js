export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function formatFullDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getDateGroup(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This Week';
  if (days < 30) return 'This Month';
  if (days < 365) return 'This Year';
  return 'Older';
}

export function getFileCategory(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = {
    image: ['jpg','jpeg','png','gif','bmp','svg','webp','ico','tiff','tif'],
    video: ['mp4','avi','mkv','mov','wmv','flv','webm','m4v','3gp'],
    audio: ['mp3','wav','flac','aac','ogg','wma','m4a','opus'],
    document: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','rtf','odt','csv'],
    code: ['js','jsx','ts','tsx','py','java','cpp','c','cs','html','css','json','xml','php','rb','go','rs','swift','kt','sql','md','yml','yaml','sh','bat'],
    archive: ['zip','rar','7z','tar','gz','bz2','xz','iso'],
    executable: ['exe','msi','app','dmg','deb','rpm'],
  };
  for (const [cat, exts] of Object.entries(map)) {
    if (exts.includes(ext)) return cat;
  }
  return 'other';
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toLocaleString() || '0';
}
