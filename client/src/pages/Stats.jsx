import { useEffect, useState } from 'react';
import { api } from '../api';
import ProgressRing from '../components/ProgressRing';
import WeightBreakdown from '../components/WeightBreakdown';
import { formatElapsed } from '../utils/format';
import {
  bestStreakFromHeatmap,
  countActiveTopics,
  countCompletedTasks,
  emptyWeightCounts,
  loadActiveGoalDetails,
  sumTimeSpent,
  topicBreakdown,
  weightCountsAllTime,
} from '../utils/aggregate';

// New Stats screen (route: /stats), a third bottom-nav-turned-side-panel
// item alongside Today/Topics. All figures are computed client-side from
// GET /api/goals + GET /api/goals/:id — see utils/aggregate.js for why.
export default function Stats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weightCounts, setWeightCounts] = useState(emptyWeightCounts());
  const [topics, setTopics] = useState([]);
  const [summary, setSummary] = useState({ done: 0, timeSpent: 0, activeTopics: 0 });
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([loadActiveGoalDetails(api), api.getToday().catch(() => null)])
      .then(([details, today]) => {
        if (!active) return;
        setWeightCounts(weightCountsAllTime(details));
        setTopics(topicBreakdown(details));
        setSummary({
          done: countCompletedTasks(details),
          timeSpent: sumTimeSpent(details),
          activeTopics: countActiveTopics(details),
        });
        if (today) setBestStreak(bestStreakFromHeatmap(today.heatmap, today.streak));
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load stats.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stats</h1>
      </div>

      {error && <p className="banner-error">{error}</p>}
      {loading && <p className="loading-state">Loading…</p>}

      {!loading && !error && (
        <>
          <div className="section">
            <div className="section-title">By weight</div>
            <WeightBreakdown counts={weightCounts} variant="bars" />
          </div>

          <div className="stat-grid stats-summary-grid">
            <div className="stat-card">
              <div className="stat-value mono">{summary.done}</div>
              <div className="stat-label">Tasks done</div>
            </div>
            <div className="stat-card">
              <div className="stat-value mono">{bestStreak}</div>
              <div className="stat-label">Best streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-value mono">{formatElapsed(summary.timeSpent)}</div>
              <div className="stat-label">Time tracked</div>
            </div>
            <div className="stat-card">
              <div className="stat-value mono">{summary.activeTopics}</div>
              <div className="stat-label">Active topics</div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Topics ranked</div>
            {topics.length === 0 && <p className="empty-state">No topics yet.</p>}
            {topics.length > 0 && (
              <div className="topic-rank-list">
                {topics.map((topic) => (
                  <div key={topic.id} className="topic-rank-row">
                    <ProgressRing progress={topic.progress} size={36} strokeWidth={4} showLabel={false} />
                    <div className="topic-rank-main">
                      <div className="topic-rank-title">{topic.title}</div>
                      <div className="topic-rank-frac mono">
                        {topic.done}/{topic.total}
                      </div>
                    </div>
                    <div className="topic-rank-pct mono">{Math.round(topic.progress)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
