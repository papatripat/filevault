import { useState } from 'react';
import { getFileIcon } from '../utils/fileIcons';
import { formatFullDate, formatBytes } from '../utils/formatters';
import { X, ExternalLink, Star, Trash2, Copy, Sparkles, Loader2 } from 'lucide-react';

export default function FilePreview({ file, previewData, onClose, onOpen, onFavorite, onDelete }) {
  const [summary, setSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  if (!file) return null;
  const iconInfo = getFileIcon(file.category || 'other');
  const Icon = iconInfo.icon;

  const handleGenerateSummary = async () => {
    if (!previewData?.content) return;
    setIsLoadingSummary(true);
    setSummaryError('');
    try {
      const res = await fetch('http://localhost:3001/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: previewData.content, fileName: file.name })
      });
      if (!res.ok) throw new Error('Failed to summarize');
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <span style={{ fontSize: 14, fontWeight: 600 }}>Details</span>
        <button className="btn-icon" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="detail-panel-preview">
        {previewData?.type === 'text' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {!summary && !isLoadingSummary && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}
                onClick={handleGenerateSummary}
              >
                <Sparkles size={16} /> Generate AI Summary
              </button>
            )}
            {isLoadingSummary && (
              <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                <Loader2 size={14} className="spin" /> Generating summary...
              </div>
            )}
            {summaryError && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{summaryError}</div>}
            {summary && (
              <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
                  <Sparkles size={14} /> AI Summary
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {summary}
                </div>
              </div>
            )}
            <pre style={{
              fontSize: 11, color: 'var(--text-secondary)',
              fontFamily: "'JetBrains Mono', monospace",
              maxHeight: 200, overflow: 'auto', width: '100%',
              background: 'var(--bg-primary)', borderRadius: 8, padding: 12,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {previewData.content?.substring(0, 2000)}
            </pre>
          </div>
        ) : file.category === 'image' ? (
          <img
            src={`/api/files/preview?path=${encodeURIComponent(file.path)}`}
            alt={file.name}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Icon size={64} style={{ color: 'var(--text-dim)' }} />
        )}
      </div>

      <div className="detail-panel-info">
        <div className="detail-info-row">
          <span className="detail-info-label">Name</span>
          <span className="detail-info-value" title={file.name}>{file.name}</span>
        </div>
        <div className="detail-info-row">
          <span className="detail-info-label">Type</span>
          <span className="detail-info-value">{file.isDirectory ? 'Folder' : (file.extension || 'Unknown')}</span>
        </div>
        {!file.isDirectory && (
          <div className="detail-info-row">
            <span className="detail-info-label">Size</span>
            <span className="detail-info-value">{file.sizeFormatted || formatBytes(file.size)}</span>
          </div>
        )}
        <div className="detail-info-row">
          <span className="detail-info-label">Modified</span>
          <span className="detail-info-value">{formatFullDate(file.modified)}</span>
        </div>
        <div className="detail-info-row">
          <span className="detail-info-label">Location</span>
          <span className="detail-info-value" title={file.path}>{file.path}</span>
        </div>
      </div>

      <div className="detail-panel-actions">
        <button className="btn btn-secondary" onClick={() => onOpen?.(file)} style={{ width: '100%' }}>
          <ExternalLink size={14} /> Open File
        </button>
        <button className="btn btn-secondary" onClick={() => onFavorite?.(file)} style={{ width: '100%' }}>
          <Star size={14} /> Add to Favorites
        </button>
        <button className="btn btn-danger" onClick={() => onDelete?.(file)} style={{ width: '100%' }}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
