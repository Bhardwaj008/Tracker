import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { formatElapsed } from '../utils/format';

// Play/stop timer button with a genuinely live mm:ss / hh:mm:ss display.
//
// There is no live backend yet, so the api.startTimer/stopTimer calls below
// are real (wired against the contract's routes) but expected to fail over
// the network right now — we catch that and keep driving the display from
// local state so the UI interaction still works end-to-end. Once a real API
// is running, `onChange` receives the server's authoritative task and the
// parent can reconcile timeSpentSeconds/timerStartedAt from there.
export default function TimerButton({ task, onChange }) {
  const [running, setRunning] = useState(Boolean(task.timerStartedAt));
  const [startedAt, setStartedAt] = useState(
    task.timerStartedAt ? new Date(task.timerStartedAt).getTime() : null,
  );
  const [baseSeconds, setBaseSeconds] = useState(task.timeSpentSeconds || 0);
  const [displaySeconds, setDisplaySeconds] = useState(task.timeSpentSeconds || 0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        const elapsedSinceStart = startedAt ? (Date.now() - startedAt) / 1000 : 0;
        setDisplaySeconds(baseSeconds + elapsedSinceStart);
      }, 250);
    } else {
      setDisplaySeconds(baseSeconds);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, startedAt, baseSeconds]);

  async function handleStart(e) {
    e.stopPropagation();
    const now = Date.now();
    setStartedAt(now);
    setRunning(true);
    try {
      const updated = await api.startTimer(task._id || task.id);
      onChange?.(updated);
    } catch (err) {
      console.warn('startTimer request failed (expected without a live API):', err.message);
    }
  }

  async function handleStop(e) {
    e.stopPropagation();
    const elapsedSinceStart = startedAt ? (Date.now() - startedAt) / 1000 : 0;
    const newBase = baseSeconds + elapsedSinceStart;
    setRunning(false);
    setStartedAt(null);
    setBaseSeconds(newBase);
    setDisplaySeconds(newBase);
    try {
      const updated = await api.stopTimer(task._id || task.id);
      onChange?.(updated);
    } catch (err) {
      console.warn('stopTimer request failed (expected without a live API):', err.message);
    }
  }

  return (
    <button
      type="button"
      className={`timer-btn ${running ? 'timer-btn-running' : ''}`}
      onClick={running ? handleStop : handleStart}
      aria-label={running ? 'Stop timer' : 'Start timer'}
    >
      <span className="timer-icon">{running ? '⏸' : '▶'}</span>
      <span className="timer-display">{formatElapsed(displaySeconds)}</span>
    </button>
  );
}
