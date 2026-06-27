import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FolderOpen } from 'lucide-react';
import { api } from '../utils/api';
import { formatBytes, formatDate, getDateGroup } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';

export default function RecentFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getRecent().then(data => { setFiles(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /><div className="loading-text">Scanning recent files...</div></div>;

  const groups = {};
  files.forEach(f => {
    const group = getDateGroup(f.modified);
    if (!groups[group]) groups[group] = [];
    groups[group].push(f);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recent Files</h1>
          <p className="page-subtitle">Files recently modified on your system</p>
        </div>
      </div>

      {Object.keys(groups).length === 0 ? (
        <div className="empty-state"><Clock size={48} /><div className="empty-state-title">No recent files</div></div>
      ) : (
        Object.entries(groups).map(([group, groupFiles]) => (
          <div key={group} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{group}</div>
            <table className="file-table">
              <thead>
                <tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th></tr>
              </thead>
              <tbody>
                {groupFiles.map((file, i) => {
                  const iconInfo = getFileIcon(file.category);
                  const Icon = iconInfo.icon;
                  return (
                    <tr key={i} onClick={() => {
                      const dir = file.path.substring(0, file.path.lastIndexOf('\\'));
                      navigate(`/explorer?path=${encodeURIComponent(dir)}`);
                    }}>
                      <td><div className="file-name-cell"><Icon size={16} /><span>{file.name}</span></div></td>
                      <td style={{ color: 'var(--text-muted)' }}>{file.extension || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{file.sizeFormatted || formatBytes(file.size)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(file.modified)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
