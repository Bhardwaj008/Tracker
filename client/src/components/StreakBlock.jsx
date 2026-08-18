// Duolingo-style streak block: a hand-drawn SVG flame (no emoji), the
// current day count in the ember accent color, and a small best-streak line.
export default function StreakBlock({ streak = 0, bestStreak = 0 }) {
  return (
    <div className="streak-block">
      <svg className="flame-icon" width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21C7.6 21 4 17.6 4 13.4C4 10.1 5.8 7.5 7.4 5.2C7.6 7.3 8.4 8.7 9.5 8.7C9.9 6.4 10.6 4.3 12 2.5C11.5 4.8 12 6.5 13.3 8.1C15.3 10.5 17 12.7 17 15.5C17 18.8 14.8 21 12 21Z"
          fill="var(--ember)"
        />
      </svg>
      <div className="streak-block-main">
        <div className="streak-count mono">{streak}</div>
        <div className="streak-label">Day streak</div>
        <div className="streak-best">
          Best streak: {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
        </div>
      </div>
    </div>
  );
}
