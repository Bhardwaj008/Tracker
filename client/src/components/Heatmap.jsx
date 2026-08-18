import { countToLevel, formatDate } from '../utils/format';

// Renders the 70-day activity heatmap as 7 rows (one per weekday) x 10
// columns (one per week), oldest day top-left, most recent bottom-right —
// the classic GitHub-contributions layout. Count -> level bucketing lives in
// utils/format.js (countToLevel) per the contract's "client maps count to
// level" note.
export default function Heatmap({ data = [] }) {
  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="heatmap-card">
      <div className="heatmap-title">Last 70 days</div>
      <div className="heatmap-grid">
        {sorted.map((entry) => (
          <div
            key={entry.date}
            className="heatmap-cell"
            data-level={countToLevel(entry.count)}
            title={`${formatDate(entry.date)} · ${entry.count} completed`}
          />
        ))}
      </div>
    </div>
  );
}
