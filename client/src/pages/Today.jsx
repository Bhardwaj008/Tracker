import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Heatmap from '../components/Heatmap';
import ProgressRing from '../components/ProgressRing';
import StreakBlock from '../components/StreakBlock';
import WeightBreakdown from '../components/WeightBreakdown';
import { formatDate } from '../utils/format';
import {
  bestStreakFromHeatmap,
  emptyWeightCounts,
  loadActiveGoalDetails,
  weightCountsForToday,
} from '../utils/aggregate';

function TaskItemRow({ item }) {
  const navigate = useNavigate();
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date(new Date().toDateString());

  return (
    <button
      type="button"
      className={`item-row ${isOverdue ? 'overdue' : ''}`}
      onClick={() => navigate(`/goals/${item.goalId}`)}
    >
      <div className="item-row-main">
        <div className="item-row-title">{item.title}</div>
        <div className="item-row-sub">
          {item.goalTitle}
          {item.topicTitle ? ` · ${item.topicTitle}` : ''}
          {item.subtopicTitle ? ` · ${item.subtopicTitle}` : ''}
        </div>
      </div>
      {item.dueDate && <div className="item-row-due mono">{formatDate(item.dueDate)}</div>}
    </button>
  );
}

function ItemSection({ title, items }) {
  return (
    <div className="section">
      <div className="section-title">
        <span>{title}</span>
        <span className="count-badge mono">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="empty-state">Nothing here.</p>
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <TaskItemRow key={item._id || item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Today() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [weightCounts, setWeightCounts] = useState(emptyWeightCounts());

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getToday()
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load today.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    // Best-effort enhancement: GET /api/today doesn't return a per-weight
    // "done today" breakdown, so derive it from goal-detail data we already
    // have an endpoint for (see utils/aggregate.js). Failure here shouldn't
    // block the rest of the Today screen.
    loadActiveGoalDetails(api)
      .then((details) => {
        if (active) setWeightCounts(weightCountsForToday(details));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const todayPct = data && data.totalToday ? (data.doneToday / data.totalToday) * 100 : 0;
  const bestStreak = data ? bestStreakFromHeatmap(data.heatmap, data.streak) : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Today</h1>
      </div>

      {error && <p className="banner-error">{error}</p>}
      {loading && <p className="loading-state">Loading…</p>}

      {data && (
        <>
          <div className="today-hero">
            <ProgressRing progress={todayPct} size={84} strokeWidth={9} label={`${Math.round(todayPct)}%`} />
            <StreakBlock streak={data.streak ?? 0} bestStreak={bestStreak} />
          </div>

          <WeightBreakdown counts={weightCounts} variant="cards" />

          <Heatmap data={data.heatmap || []} />

          <ItemSection title="Overdue" items={data.overdue || []} />
          <ItemSection title="Due Today" items={data.dueToday || []} />
          <ItemSection title="Upcoming" items={data.upcoming || []} />
        </>
      )}
    </div>
  );
}
