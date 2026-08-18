import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import SettingsSheet from './SettingsSheet';

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">◆</span> Momentum
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Today
        </NavLink>
        <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Goals
        </NavLink>
        <NavLink to="/archive" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Archive
        </NavLink>
      </nav>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
