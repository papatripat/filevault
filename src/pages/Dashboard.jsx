import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Files, HardDrive, Image, FileText, Film, Music, Code2, Archive,
  Clock, TrendingUp,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { api } from '../utils/api';
import { formatBytes, formatDate } from '../utils/formatters';
import StatCard from '../components/StatCard';
import { getFileIcon } from '../utils/fileIcons';

const COLORS = ['#e4e4e7', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b', '#09090b'];

const categoryIcons = {
  image: Image, video: Film, audio: Music,
  document: FileText, code: Code2, archive: Archive,
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [drives, setDrives] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [statsData, recent] = await Promise.all([
          api.getStats(),
          api.getRecent(),
        ]);
        setStats(statsData.stats);
        setDrives(statsData.drives);
        setRecentFiles(recent.slice(0, 8));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Analyzing your files...</div>
      </div>
    );
  }

  const distData = stats ? Object.entries(stats.categories)
    .filter(([, v]) => v.count > 0)
    .map(([key, val]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: val.count,
      size: val.size,
    }))
    .sort((a, b) => b.value - a.value) : [];

  const driveData = drives.map(d => ({
    name: d.letter,
    used: Math.round(d.usedSpace / (1024 ** 3)),
    free: Math.round(d.freeSpace / (1024 ** 3)),
    total: Math.round(d.totalSize / (1024 ** 3)),
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13,
      }}>
        <div style={{ fontWeight: 600 }}>{d.name}</div>
        <div style={{ color: 'var(--text-muted)' }}>{d.value} files • {formatBytes(d.size)}</div>
      </div>
    );
  };

  const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13,
      }}>
        <div style={{ fontWeight: 600 }}>Drive {label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: 'var(--text-muted)' }}>{p.name}: {p.value} GB</div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your file system</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={Files} value={stats?.totalFiles || 0} label="Total Files" />
        <StatCard icon={HardDrive} value={Math.round((stats?.totalSize || 0) / (1024 ** 2))} label="Storage Scanned" suffix=" MB" />
        <StatCard icon={Image} value={stats?.categories?.image?.count || 0} label="Images" />
        <StatCard icon={FileText} value={stats?.categories?.document?.count || 0} label="Documents" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">File Distribution</div>
          {distData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={distData} cx="50%" cy="50%"
                  innerRadius={65} outerRadius={100}
                  dataKey="value" stroke="none"
                  paddingAngle={2}
                >
                  {distData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No data available
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 8 }}>
            {distData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                <span style={{ fontWeight: 600 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">Drive Usage (GB)</div>
          {driveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={driveData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="used" name="Used" fill="#71717a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="free" name="Free" fill="#27272a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No drives detected
            </div>
          )}
        </div>
      </div>

      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="chart-card-title" style={{ margin: 0 }}>Recent Files</div>
          <button className="btn btn-secondary" onClick={() => navigate('/recent')} style={{ fontSize: 12, padding: '6px 12px' }}>
            <Clock size={14} /> View All
          </button>
        </div>
        {recentFiles.length > 0 ? (
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Modified</th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map((file, i) => {
                const iconInfo = getFileIcon(file.category);
                const Icon = iconInfo.icon;
                return (
                  <tr key={i} onClick={() => {
                    const dir = file.path.substring(0, file.path.lastIndexOf('\\'));
                    navigate(`/explorer?path=${encodeURIComponent(dir)}`);
                  }}>
                    <td>
                      <div className="file-name-cell">
                        <Icon size={16} />
                        <span>{file.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{file.extension || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{file.sizeFormatted || formatBytes(file.size)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(file.modified)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>No recent files</div>
        )}
      </div>
    </div>
  );
}
