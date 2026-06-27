import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, ExternalLink } from 'lucide-react';
import { api } from '../utils/api';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getFavorites().then(data => { setFavorites(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function removeFav(filePath) {
    try {
      const updated = await api.removeFavorite(filePath);
      setFavorites(updated);
    } catch (err) { console.error(err); }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /><div className="loading-text">Loading favorites...</div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Favorites</h1>
          <p className="page-subtitle">Your bookmarked files and folders</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <Star size={48} />
          <div className="empty-state-title">No favorites yet</div>
          <div className="empty-state-text">Right-click on any file in the Explorer and select "Add to Favorites"</div>
        </div>
      ) : (
        <table className="file-table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Size</th><th>Location</th><th style={{ width: 80 }}>Actions</th></tr>
          </thead>
          <tbody>
            {favorites.map((file, i) => {
              const iconInfo = getFileIcon(file.category);
              const Icon = iconInfo.icon;
              return (
                <tr key={i}>
                  <td>
                    <div className="file-name-cell" style={{ cursor: 'pointer' }} onClick={() => {
                      if (file.isDirectory) navigate(`/explorer?path=${encodeURIComponent(file.path)}`);
                      else { const dir = file.path.substring(0, file.path.lastIndexOf('\\')); navigate(`/explorer?path=${encodeURIComponent(dir)}`); }
                    }}>
                      <Icon size={16} /><span>{file.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{file.isDirectory ? 'Folder' : (file.extension || '—')}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{file.isDirectory ? '—' : (file.sizeFormatted || formatBytes(file.size))}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.path}>{file.path}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title="Open" onClick={() => api.openFile(file.path)}><ExternalLink size={14} /></button>
                      <button className="btn-icon" title="Remove" onClick={() => removeFav(file.path)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
