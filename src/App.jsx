import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import RecentFiles from './pages/RecentFiles';
import Favorites from './pages/Favorites';
import LargeFiles from './pages/LargeFiles';
import Duplicates from './pages/Duplicates';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={
              <>
                <TopBar />
                <div className="page-content"><Dashboard /></div>
              </>
            } />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/recent" element={
              <>
                <TopBar />
                <div className="page-content"><RecentFiles /></div>
              </>
            } />
            <Route path="/favorites" element={
              <>
                <TopBar />
                <div className="page-content"><Favorites /></div>
              </>
            } />
            <Route path="/large-files" element={
              <>
                <TopBar />
                <div className="page-content"><LargeFiles /></div>
              </>
            } />
            <Route path="/duplicates" element={
              <>
                <TopBar />
                <div className="page-content"><Duplicates /></div>
              </>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
