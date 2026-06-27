import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Folder, File } from 'lucide-react';
import { api } from '../utils/api';
import { getFileIcon } from '../utils/fileIcons';

export default function TopBar({ breadcrumbs, onBreadcrumbClick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch(value) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) { setResults([]); setShowResults(false); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.search(value);
        setResults(data.slice(0, 10));
        setShowResults(true);
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
  }

  function handleResultClick(item) {
    setShowResults(false);
    setQuery('');
    if (item.isDirectory) {
      navigate(`/explorer?path=${encodeURIComponent(item.path)}`);
    } else {
      const dir = item.path.substring(0, item.path.lastIndexOf('\\'));
      navigate(`/explorer?path=${encodeURIComponent(dir)}`);
    }
  }

  return (
    <div className="topbar">
      {breadcrumbs && (
        <div className="topbar-breadcrumb">
          {breadcrumbs.map((b, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span className="breadcrumb-sep">/</span>}
              <button
                className={`breadcrumb-item ${i === breadcrumbs.length - 1 ? 'active' : ''}`}
                onClick={() => onBreadcrumbClick?.(b.path)}
              >
                {b.label}
              </button>
            </span>
          ))}
        </div>
      )}
      {!breadcrumbs && <div style={{ flex: 1 }} />}

      <div className="search-container" ref={searchRef}>
        <Search size={16} className="search-icon" />
        <input
          className="search-input"
          placeholder="Search files..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {query && (
          <button
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
            className="btn-icon"
            onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
          >
            <X size={14} />
          </button>
        )}
        {showResults && (
          <div className="search-results-dropdown">
            {searching && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Searching...</div>}
            {!searching && results.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No results found</div>}
            {results.map((item, i) => {
              const iconInfo = getFileIcon(item.category);
              const Icon = iconInfo.icon;
              return (
                <div key={i} className="search-result-item" onClick={() => handleResultClick(item)}>
                  <Icon size={16} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.path}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
