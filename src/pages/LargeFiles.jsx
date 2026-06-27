import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardDrive, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import Modal from '../components/Modal';

export default function LargeFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minSize, setMinSize] = useState(100);
  const [scanPath, setScanPath] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    api.getLargeFiles(scanPath || undefined, minSize)
      .then(data => { setFiles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await api.deleteFile(deleteModal.path);
      setDeleteModal(null);
      setFiles(prev => prev.filter(f => f.path !== deleteModal.path));
    } catch (err) { alert('Delete failed: ' + err.message); }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Large Files</h1>
          <p className="page-subtitle">Find and clean up large files taking up space</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Min size (MB):</label>
          <input type="number" className="modal-input" style={{ width: 100, margin: 0, height: 36 }} value={minSize} onChange={e => setMinSize(parseInt(e.target.value) || 1)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Scan path:</label>
          <input className="path-input" style={{ width: 300 }} value={scanPath} onChange={e => setScanPath(e.target.value)} placeholder="Leave empty for user folder" />
        </div>
        <button className="btn btn-primary" onClick={load}>Scan</button>
      </div>

      {files.length > 0 && (
        <div className="stat-card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
          <div>
            <div style={{ fontWeight: 600 }}>Found {files.length} large files</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total size: {formatBytes(totalSize)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container"><div className="spinner" /><div className="loading-text">Scanning for large files...</div></div>
      ) : files.length === 0 ? (
        <div className="empty-state"><HardDrive size={48} /><div className="empty-state-title">No large files found</div><div className="empty-state-text">No files larger than {minSize}MB were found</div></div>
      ) : (
        <table className="file-table">
          <thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Modified</th><th style={{ width: 60 }}></th></tr></thead>
          <tbody>
            {files.map((file, i) => {
              const iconInfo = getFileIcon(file.category);
              const Icon = iconInfo.icon;
              return (
                <tr key={i}>
                  <td><div className="file-name-cell" style={{ cursor: 'pointer' }} onClick={() => { const dir = file.path.substring(0, file.path.lastIndexOf('\\')); navigate(`/explorer?path=${encodeURIComponent(dir)}`); }}><Icon size={16} /><span>{file.name}</span></div></td>
                  <td><span className="badge badge-danger">{file.sizeFormatted || formatBytes(file.size)}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{file.extension || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDate(file.modified)}</td>
                  <td><button className="btn-icon" onClick={() => setDeleteModal(file)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {deleteModal && (
        <Modal title="Delete Large File" onClose={() => setDeleteModal(null)}>
          <p className="modal-text">Delete "{deleteModal.name}" ({formatBytes(deleteModal.size)})? It will be moved to Recycle Bin.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
