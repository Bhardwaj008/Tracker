import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Heatmap from '../components/Heatmap';
import { formatDate } from '../utils/format';

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
          {item.milestoneTitle ? ` · ${item.milestoneTitle}` : ''}
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Today</h1>
      </div>

      {error && <p className="banner-error">{error}</p>}
      {loading && <p className="loading-state">Loading…</p>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value mono">{data.streak ?? 0}</div>
              <div className="stat-label">Day streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-value mono">
                {data.doneToday ?? 0}/{data.totalToday ?? 0}
              </div>
              <div className="stat-label">Done today</div>
            </div>
          </div>

          <Heatmap data={data.heatmap || []} />

          <ItemSection title="Overdue" items={data.overdue || []} />
          <ItemSection title="Due Today" items={data.dueToday || []} />
          <ItemSection title="Upcoming" items={data.upcoming || []} />
        </>
      )}
    </div>
  );
}
