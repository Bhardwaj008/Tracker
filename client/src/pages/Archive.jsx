import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import GoalCard from '../components/GoalCard';

export default function Archive() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .getGoals(true)
      .then((res) => setGoals(res))
      .catch((err) => setError(err.message || 'Could not load archived goals.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnarchive(id) {
    await api.updateGoal(id, { archived: false });
    await load();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Archive</h1>
      </div>

      {error && <p className="banner-error">{error}</p>}
      {loading && <p className="loading-state">Loading…</p>}

      {!loading && !error && goals.length === 0 && (
        <p className="empty-state">No archived goals.</p>
      )}

      <div className="goal-grid">
        {goals.map((goal) => (
          <GoalCard key={goal._id || goal.id} goal={goal} onUnarchive={handleUnarchive} />
        ))}
      </div>
    </div>
  );
}
