import { getFileIcon } from '../utils/fileIcons';
import { formatBytes, formatDate } from '../utils/formatters';

export default function FileCard({ file, view = 'grid', selected, onClick, onDoubleClick, onContextMenu }) {
  const iconInfo = getFileIcon(file.category || (file.isDirectory ? 'folder' : 'other'));
  const Icon = iconInfo.icon;

  if (view === 'list') {
    return (
      <tr
        className={selected ? 'selected' : ''}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        <td>
          <div className="file-name-cell">
            <Icon size={18} className={iconInfo.className} />
            <span>{file.name}</span>
          </div>
        </td>
        <td style={{ color: 'var(--text-muted)' }}>{file.isDirectory ? 'Folder' : file.extension || '—'}</td>
        <td style={{ color: 'var(--text-muted)' }}>{file.isDirectory ? '—' : (file.sizeFormatted || formatBytes(file.size))}</td>
        <td style={{ color: 'var(--text-muted)' }}>{formatDate(file.modified)}</td>
      </tr>
    );
  }

  return (
    <div
      className={`file-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className={`file-card-icon ${iconInfo.className}`}>
        <Icon size={24} />
      </div>
      <div className="file-card-name" title={file.name}>{file.name}</div>
      <div className="file-card-meta">
        {file.isDirectory ? 'Folder' : (file.sizeFormatted || formatBytes(file.size))}
      </div>
    </div>
  );
}
