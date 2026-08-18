export function StatusChip({ status }) {
  const isOntrack = status === 'ontrack';
  return (
    <span className={`chip ${isOntrack ? 'chip-ontrack' : 'chip-behind'}`}>
      {isOntrack ? 'On track' : 'Behind'}
    </span>
  );
}

export function ProgressChip({ progress = 0 }) {
  return <span className="chip chip-mono">{Math.round(progress)}%</span>;
}

export function DaysChip({ daysRemaining, dailyTargetPct }) {
  const target = typeof dailyTargetPct === 'number' ? dailyTargetPct.toFixed(1) : '0.0';
  return (
    <span className="chip chip-mono chip-ember">
      {daysRemaining}d left · {target}%/day
    </span>
  );
}
