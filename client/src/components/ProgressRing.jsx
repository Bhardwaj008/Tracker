// Reusable SVG circular progress ring. Mirrors ProgressBar's progress/status
// props (a 'behind' status tints the ring rust, same as the flat bar did)
// but renders as a ring with an optional centered percentage label, per the
// approved v2 mockup — used on goal cards and Topic/Subtopic headers.
export default function ProgressRing({
  progress = 0,
  size = 56,
  strokeWidth = 6,
  color,
  status,
  trackColor = 'var(--surface-2)',
  showLabel = true,
  label,
}) {
  const pct = Math.max(0, Math.min(100, progress || 0));
  const resolvedColor = color || (status === 'behind' ? 'var(--rust)' : 'var(--ember)');
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <div className="progress-ring-label mono" style={{ fontSize: size * 0.26 }}>
          {label ?? `${Math.round(pct)}%`}
        </div>
      )}
    </div>
  );
}
