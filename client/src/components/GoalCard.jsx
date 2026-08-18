import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { StatusChip, ProgressChip, DaysChip } from './Chip';

export default function GoalCard({ goal, onUnarchive }) {
  const navigate = useNavigate();
  const id = goal._id || goal.id;

  return (
    <div className="goal-card">
      <button type="button" className="goal-card-title" onClick={() => navigate(`/goals/${id}`)}>
        {goal.title}
      </button>
      <ProgressBar progress={goal.progress} status={goal.status} />
      <div className="chip-row">
        <ProgressChip progress={goal.progress} />
        <StatusChip status={goal.status} />
        <DaysChip daysRemaining={goal.daysRemaining} dailyTargetPct={goal.dailyTargetPct} />
      </div>
      {onUnarchive && (
        <div className="goal-card-actions">
          <button type="button" className="btn btn-subtle btn-sm" onClick={() => onUnarchive(id)}>
            Unarchive
          </button>
        </div>
      )}
    </div>
  );
}
