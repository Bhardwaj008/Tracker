// Shared S/M/L/XL weight-tier breakdown. Rendered as a row of small stat
// cards (Today screen) or a stack of horizontal bars (Stats screen), per the
// approved v2 mockup. Colors match the tiered weight-badge coding
// (S=pine, M=amber, L=ember, XL=rust) defined in styles/global.css.
const TIERS = [
  { key: 'S', color: 'pine' },
  { key: 'M', color: 'amber' },
  { key: 'L', color: 'ember' },
  { key: 'XL', color: 'rust' },
];

export default function WeightBreakdown({ counts = {}, variant = 'cards' }) {
  if (variant === 'bars') {
    return (
      <div className="weight-bar-list">
        {TIERS.map(({ key, color }) => {
          const c = counts[key] || { done: 0, total: 0 };
          const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
          return (
            <div className="weight-bar-row" key={key}>
              <span className={`weight-badge weight-${key}`}>{key}</span>
              <div className="progress-track" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: `var(--${color})` }} />
              </div>
              <span className="weight-bar-count mono">
                {c.done}/{c.total}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="tier-stat-row">
      {TIERS.map(({ key, color }) => {
        const c = counts[key] || { done: 0, total: 0 };
        return (
          <div className="tier-stat-card" key={key}>
            <div className={`tier-stat-value mono tier-${color}`}>
              {c.done}/{c.total}
            </div>
            <div className="tier-stat-label">{key}</div>
          </div>
        );
      })}
    </div>
  );
}
