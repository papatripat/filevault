import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';
import { formatBytes } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import Modal from '../components/Modal';

export default function Duplicates() {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanPath, setScanPath] = useState('');
  const [expanded, setExpanded] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    api.getDuplicates(scanPath || undefined)
      .then(data => { setDuplicates(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function toggleExpand(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await api.deleteFile(deleteModal.path);
      setDeleteModal(null);
      // Remove from list
      setDuplicates(prev => prev.map(group => ({
        ...group,
        files: group.files.filter(f => f.path !== deleteModal.path),
        count: group.files.filter(f => f.path !== deleteModal.path).length,
      })).filter(g => g.files.length > 1));
    } catch (err) { alert('Delete failed: ' + err.message); }
  }

  const totalWasted = duplicates.reduce((sum, g) => sum + g.size * (g.count - 1), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Duplicate Files</h1>
          <p className="page-subtitle">Find and remove duplicate files to free up space</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <input className="path-input" style={{ width: 400 }} value={scanPath} onChange={e => setScanPath(e.target.value)} placeholder="Scan path (leave empty for user folder)" />
        <button className="btn btn-primary" onClick={load}>Scan</button>
      </div>

      {duplicates.length > 0 && (
        <div className="stat-card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
          <div>
            <div style={{ fontWeight: 600 }}>Found {duplicates.length} duplicate groups</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Potential space savings: {formatBytes(totalWasted)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container"><div className="spinner" /><div className="loading-text">Scanning for duplicates...</div></div>
      ) : duplicates.length === 0 ? (
        <div className="empty-state"><Copy size={48} /><div className="empty-state-title">No duplicates found</div><div className="empty-state-text">Your files look clean!</div></div>
      ) : (
        duplicates.map((group) => {
          const isExpanded = expanded[group.key] !== false; // default expanded
          const iconInfo = getFileIcon(group.files[0]?.category || 'other');
          const Icon = iconInfo.icon;
          return (
            <div key={group.key} className="duplicate-group">
              <div className="duplicate-group-header" onClick={() => toggleExpand(group.key)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Icon size={18} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{group.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{group.count} copies • {group.sizeFormatted} each</div>
                  </div>
                </div>
                <span className="badge badge-danger">Wasted: {formatBytes(group.size * (group.count - 1))}</span>
              </div>
              {isExpanded && (
                <div className="duplicate-group-files">
                  {group.files.map((file, i) => (
                    <div key={i} className="duplicate-file-item">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                          onClick={() => { const dir = file.path.substring(0, file.path.lastIndexOf('\\')); navigate(`/explorer?path=${encodeURIComponent(dir)}`); }}
                          title={file.path}>
                          {file.path}
                        </div>
                      </div>
                      {i > 0 && (
                        <button className="btn-icon" onClick={() => setDeleteModal(file)} style={{ color: 'var(--danger)' }} title="Delete duplicate">
                          <Trash2 size={14} />
                        </button>
                      )}
                      {i === 0 && <span className="badge badge-success" style={{ fontSize: 10 }}>Original</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {deleteModal && (
        <Modal title="Delete Duplicate" onClose={() => setDeleteModal(null)}>
          <p className="modal-text">Delete this duplicate? It will be moved to Recycle Bin.</p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 20, wordBreak: 'break-all' }}>{deleteModal.path}</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
