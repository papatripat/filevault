import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Clock, Star, HardDrive, Copy,
  ChevronLeft, ChevronRight, Vault,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard, section: 'Main' },
  { label: 'File Explorer', path: '/explorer', icon: FolderOpen, section: 'Main' },
  { label: 'Recent Files', path: '/recent', icon: Clock, section: 'Tools' },
  { label: 'Favorites', path: '/favorites', icon: Star, section: 'Tools' },
  { label: 'Large Files', path: '/large-files', icon: HardDrive, section: 'Tools' },
  { label: 'Duplicates', path: '/duplicates', icon: Copy, section: 'Tools' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const sections = [...new Set(navItems.map(i => i.section))];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Vault size={18} />
        </div>
        <span className="sidebar-title">FileVault</span>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section-title">{section}</div>
            {navItems.filter(i => i.section === section).map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
              >
                <item.icon size={20} />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-storage">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sidebar</span>
          <button className="btn-icon" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
