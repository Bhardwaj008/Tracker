import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidePanel from './SidePanel';
import SettingsSheet from './SettingsSheet';

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app-shell">
      <SidePanel
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="app-content">
        <header className="app-header">
          <div className="app-header-left">
            <button
              type="button"
              className="icon-btn nav-toggle"
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
            >
              ☰
            </button>
            <div className="brand">
              <span className="brand-mark">◆</span> Momentum
            </div>
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
      </div>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
