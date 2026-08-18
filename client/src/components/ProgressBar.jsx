export default function ProgressBar({ progress = 0, status }) {
  const pct = Math.max(0, Math.min(100, progress));
  const behind = status === 'behind';
  return (
    <div className="progress-track">
      <div
        className={`progress-fill ${behind ? 'behind' : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
