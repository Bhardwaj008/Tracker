import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import GoalCard from '../components/GoalCard';
import GoalForm from '../components/forms/GoalForm';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .getGoals(false)
      .then((res) => setGoals(res))
      .catch((err) => setError(err.message || 'Could not load goals.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload) {
    await api.createGoal(payload);
    await load();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Goals</h1>
        <button type="button" className="fab" onClick={() => setShowForm(true)}>
          + Goal
        </button>
      </div>

      {error && <p className="banner-error">{error}</p>}
      {loading && <p className="loading-state">Loading…</p>}

      {!loading && !error && goals.length === 0 && (
        <p className="empty-state">No goals yet. Tap "+ Goal" to start tracking one.</p>
      )}

      <div className="goal-grid">
        {goals.map((goal) => (
          <GoalCard key={goal._id || goal.id} goal={goal} />
        ))}
      </div>

      {showForm && <GoalForm onClose={() => setShowForm(false)} onSubmit={handleCreate} />}
    </div>
  );
}
