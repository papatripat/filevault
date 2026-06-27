import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Grid3X3, List, ArrowUp, FolderPlus, ChevronUp,
  ExternalLink, Edit3, Copy, Move, Star, Trash2, FolderOpen,
} from 'lucide-react';
import { api } from '../utils/api';
import FileCard from '../components/FileCard';
import ContextMenu from '../components/ContextMenu';
import FilePreview from '../components/FilePreview';
import Modal from '../components/Modal';
import TopBar from '../components/TopBar';

export default function Explorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentPath = searchParams.get('path') || '';

  const [files, setFiles] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Modals
  const [renameModal, setRenameModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newName, setNewName] = useState('');

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setSelectedFile(null);
    setShowPreview(false);
    try {
      if (!currentPath) {
        const drivesData = await api.getDrives();
        setDrives(drivesData);
        setFiles([]);
      } else {
        const data = await api.listFiles(currentPath);
        setFiles(data.files);
        setDrives([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [currentPath]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  function navigateTo(path) {
    setSearchParams({ path });
  }

  function goUp() {
    if (!currentPath) return;
    const parent = currentPath.substring(0, currentPath.lastIndexOf('\\'));
    if (parent && parent !== currentPath) navigateTo(parent);
    else setSearchParams({});
  }

  function handleDoubleClick(file) {
    if (file.isDirectory) {
      navigateTo(file.path);
    } else {
      api.openFile(file.path).catch(console.error);
    }
  }

  async function handleSelect(file) {
    setSelectedFile(file);
    setShowPreview(true);
    if (!file.isDirectory) {
      try {
        const data = await api.preview(file.path);
        setPreviewData(data);
      } catch { setPreviewData(null); }
    } else {
      setPreviewData(null);
    }
  }

  function handleContextMenu(e, file) {
    e.preventDefault();
    setSelectedFile(file);
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 300),
      file,
    });
  }

  async function handleRename() {
    if (!renameModal || !newName.trim()) return;
    try {
      await api.rename(renameModal.path, newName);
      setRenameModal(null);
      setNewName('');
      loadFiles();
    } catch (err) { alert('Rename failed: ' + err.message); }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await api.deleteFile(deleteModal.path);
      setDeleteModal(null);
      setSelectedFile(null);
      setShowPreview(false);
      loadFiles();
    } catch (err) { alert('Delete failed: ' + err.message); }
  }

  async function handleNewFolder() {
    if (!newName.trim()) return;
    try {
      await api.createFolder(currentPath, newName);
      setNewFolderModal(false);
      setNewName('');
      loadFiles();
    } catch (err) { alert('Failed: ' + err.message); }
  }

  async function handleFavorite(file) {
    try {
      await api.addFavorite(file.path);
    } catch (err) { console.error(err); }
  }

  const sortedFiles = [...files].sort((a, b) => {
    // Folders always first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    let cmp = 0;
    switch (sortBy) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'size': cmp = (a.size || 0) - (b.size || 0); break;
      case 'modified': cmp = new Date(a.modified) - new Date(b.modified); break;
      case 'type': cmp = (a.extension || '').localeCompare(b.extension || ''); break;
      default: cmp = 0;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Build breadcrumbs
  const breadcrumbs = [{ label: 'Drives', path: '' }];
  if (currentPath) {
    const parts = currentPath.split('\\').filter(Boolean);
    let accumulated = '';
    parts.forEach((part, i) => {
      accumulated += (i === 0 ? '' : '\\') + part;
      if (i === 0 && part.endsWith(':')) accumulated += '\\';
      breadcrumbs.push({ label: part, path: accumulated });
    });
  }

  const contextMenuItems = contextMenu ? [
    { label: 'Open', icon: ExternalLink, onClick: () => handleDoubleClick(contextMenu.file) },
    ...(contextMenu.file.isDirectory ? [{ label: 'Open in Explorer', icon: FolderOpen, onClick: () => navigateTo(contextMenu.file.path) }] : []),
    { divider: true },
    { label: 'Rename', icon: Edit3, onClick: () => { setRenameModal(contextMenu.file); setNewName(contextMenu.file.name); } },
    { label: 'Add to Favorites', icon: Star, onClick: () => handleFavorite(contextMenu.file) },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteModal(contextMenu.file) },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar breadcrumbs={breadcrumbs} onBreadcrumbClick={(p) => p === '' ? setSearchParams({}) : navigateTo(p)} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }} onClick={() => { setContextMenu(null); }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {currentPath && (
                <button className="btn btn-secondary" onClick={goUp} style={{ padding: '6px 12px' }}>
                  <ChevronUp size={16} /> Up
                </button>
              )}
              {currentPath && (
                <button className="btn btn-secondary" onClick={() => { setNewFolderModal(true); setNewName(''); }} style={{ padding: '6px 12px' }}>
                  <FolderPlus size={16} /> New Folder
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="modified">Modified</option>
                <option value="type">Type</option>
              </select>
              <button className="btn-icon" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                <ArrowUp size={16} style={{ transform: sortDir === 'desc' ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              <div className="view-controls">
                <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}><Grid3X3 size={18} /></button>
                <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><List size={18} /></button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner" /><div className="loading-text">Loading files...</div></div>
          ) : !currentPath && drives.length > 0 ? (
            <div className="files-grid">
              {drives.map(drive => (
                <div
                  key={drive.letter}
                  className="file-card"
                  onClick={() => navigateTo(drive.path)}
                  onDoubleClick={() => navigateTo(drive.path)}
                >
                  <div className="file-card-icon other">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
                    </svg>
                  </div>
                  <div className="file-card-name">{drive.name || drive.letter}</div>
                  <div className="file-card-meta">{drive.usedFormatted} / {drive.totalFormatted}</div>
                  <div style={{ marginTop: 8 }}>
                    <div className="storage-bar-bg">
                      <div className="storage-bar-fill" style={{ width: `${drive.usagePercent}%` }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textAlign: 'center' }}>{drive.usagePercent}% used</div>
                  </div>
                </div>
              ))}
            </div>
          ) : view === 'grid' ? (
            <div className="files-grid">
              {sortedFiles.map((file, i) => (
                <FileCard
                  key={file.path}
                  file={file}
                  view="grid"
                  selected={selectedFile?.path === file.path}
                  onClick={() => handleSelect(file)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                />
              ))}
              {sortedFiles.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <FolderOpen size={48} />
                  <div className="empty-state-title">Empty folder</div>
                  <div className="empty-state-text">This folder doesn't contain any files</div>
                </div>
              )}
            </div>
          ) : (
            <table className="file-table">
              <thead>
                <tr>
                  <th onClick={() => { setSortBy('name'); setSortDir(d => sortBy === 'name' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}>Name</th>
                  <th onClick={() => { setSortBy('type'); setSortDir(d => sortBy === 'type' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}>Type</th>
                  <th onClick={() => { setSortBy('size'); setSortDir(d => sortBy === 'size' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}>Size</th>
                  <th onClick={() => { setSortBy('modified'); setSortDir(d => sortBy === 'modified' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }}>Modified</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiles.map((file) => (
                  <FileCard
                    key={file.path}
                    file={file}
                    view="list"
                    selected={selectedFile?.path === file.path}
                    onClick={() => handleSelect(file)}
                    onDoubleClick={() => handleDoubleClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showPreview && selectedFile && (
          <FilePreview
            file={selectedFile}
            previewData={previewData}
            onClose={() => { setShowPreview(false); setSelectedFile(null); }}
            onOpen={(f) => api.openFile(f.path)}
            onFavorite={handleFavorite}
            onDelete={(f) => setDeleteModal(f)}
          />
        )}
      </div>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenuItems} onClose={() => setContextMenu(null)} />}

      {renameModal && (
        <Modal title="Rename" onClose={() => setRenameModal(null)}>
          <p className="modal-text">Enter new name for "{renameModal.name}"</p>
          <input className="modal-input" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} autoFocus />
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setRenameModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleRename}>Rename</button>
          </div>
        </Modal>
      )}

      {deleteModal && (
        <Modal title="Delete" onClose={() => setDeleteModal(null)}>
          <p className="modal-text">Are you sure you want to delete "{deleteModal.name}"? It will be moved to the Recycle Bin.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}

      {newFolderModal && (
        <Modal title="New Folder" onClose={() => setNewFolderModal(false)}>
          <p className="modal-text">Enter a name for the new folder</p>
          <input className="modal-input" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNewFolder()} autoFocus placeholder="Folder name" />
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setNewFolderModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleNewFolder}>Create</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
