import { NavLink } from 'react-router-dom';

// Notion-style side nav. Slides in from the left as an overlay (dim
// backdrop, same interaction pattern as BottomSheet) below the ~900px
// breakpoint used elsewhere in this codebase's CSS; becomes a persistent
// fixed sidebar at/above it. Replaces the old bottom-nav bar per user
// feedback that it "didn't look good" on mobile.
const NAV_ITEMS = [
  { to: '/', label: 'Today', end: true },
  { to: '/goals', label: 'Topics' },
  { to: '/stats', label: 'Stats' },
  { to: '/archive', label: 'Archive' },
];

export default function SidePanel({ open, onClose, onOpenSettings }) {
  return (
    <>
      {open && <div className="nav-backdrop" onClick={onClose} />}
      <aside className={`side-panel ${open ? 'open' : ''}`}>
        <div className="side-panel-brand">
          <span className="brand-mark">◆</span> Momentum
        </div>
        <nav className="side-panel-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `side-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="side-nav-dot" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="side-nav-item side-nav-settings"
          onClick={() => {
            onClose?.();
            onOpenSettings?.();
          }}
        >
          <span className="side-nav-dot" />
          Settings
        </button>
      </aside>
    </>
  );
}
