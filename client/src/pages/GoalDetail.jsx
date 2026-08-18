import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import ProgressBar from '../components/ProgressBar';
import { StatusChip, ProgressChip, DaysChip } from '../components/Chip';
import MilestoneBlock from '../components/MilestoneBlock';
import GoalForm from '../components/forms/GoalForm';
import MilestoneForm from '../components/forms/MilestoneForm';
import TaskForm from '../components/forms/TaskForm';
import SubtaskForm from '../components/forms/SubtaskForm';

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // sheet: { kind: 'goal' | 'milestone' | 'task' | 'subtask', initial, context }
  const [sheet, setSheet] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .getGoal(id)
      .then((res) => {
        setGoal(res.goal);
        setMilestones(res.milestones || []);
      })
      .catch((err) => setError(err.message || 'Could not load goal.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function closeSheet() {
    setSheet(null);
  }

  // --- Goal actions ---
  async function handleEditGoal(payload) {
    await api.updateGoal(id, payload);
    await load();
  }

  async function handleArchiveGoal() {
    const wasArchived = goal.archived;
    await api.updateGoal(id, { archived: !wasArchived });
    if (!wasArchived) {
      navigate('/goals');
    } else {
      await load();
    }
  }

  async function handleDeleteGoal() {
    if (!window.confirm('Delete this goal and everything under it?')) return;
    await api.deleteGoal(id);
    navigate('/goals');
  }

  // --- Milestone actions ---
  async function handleCreateMilestone(payload) {
    await api.createMilestone(id, payload);
    await load();
  }
  async function handleUpdateMilestone(milestoneId, payload) {
    await api.updateMilestone(milestoneId, payload);
    await load();
  }
  async function handleDeleteMilestone(milestone) {
    if (!window.confirm(`Delete milestone "${milestone.title}" and its tasks?`)) return;
    await api.deleteMilestone(milestone._id || milestone.id);
    await load();
  }

  // --- Task actions ---
  async function handleCreateTask(milestoneId, payload) {
    await api.createTask(milestoneId, payload);
    await load();
  }
  async function handleUpdateTask(taskId, payload) {
    await api.updateTask(taskId, payload);
    await load();
  }
  async function handleToggleTask(task) {
    try {
      await api.updateTask(task._id || task.id, { completed: !task.completed });
      await load();
    } catch (err) {
      setError(err.message || 'Could not update task.');
    }
  }
  async function handleDeleteTask(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    await api.deleteTask(task._id || task.id);
    await load();
  }

  // --- Subtask actions ---
  async function handleCreateSubtask(taskId, payload) {
    await api.createSubtask(taskId, payload);
    await load();
  }
  async function handleUpdateSubtask(subtaskId, payload) {
    await api.updateSubtask(subtaskId, payload);
    await load();
  }
  async function handleToggleSubtask(subtask) {
    try {
      await api.updateSubtask(subtask._id || subtask.id, { completed: !subtask.completed });
      await load();
    } catch (err) {
      setError(err.message || 'Could not update subtask.');
    }
  }
  async function handleDeleteSubtask(subtask) {
    if (!window.confirm(`Delete subtask "${subtask.title}"?`)) return;
    await api.deleteSubtask(subtask._id || subtask.id);
    await load();
  }

  if (loading) return <p className="loading-state">Loading…</p>;

  if (error && !goal) {
    return (
      <div>
        <p className="banner-error">{error}</p>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/goals')}>
          Back to Goals
        </button>
      </div>
    );
  }

  if (!goal) return null;

  const taskHandlers = {
    onToggleComplete: handleToggleTask,
    onEdit: (task) => setSheet({ kind: 'task', initial: task }),
    onDelete: handleDeleteTask,
    onTimerChange: () => {}, // no live API yet — local timer display already works genuinely
    onAddSubtask: (task) => setSheet({ kind: 'subtask', initial: null, context: task._id || task.id }),
    onToggleSubtask: handleToggleSubtask,
    onEditSubtask: (subtask) => setSheet({ kind: 'subtask', initial: subtask }),
    onDeleteSubtask: handleDeleteSubtask,
  };

  return (
    <div>
      {error && <p className="banner-error">{error}</p>}

      <div className="goal-detail-header">
        <h1 className="page-title">{goal.title}</h1>
        {goal.description && <p className="goal-detail-desc">{goal.description}</p>}
        <div style={{ marginTop: '0.85rem' }}>
          <ProgressBar progress={goal.progress} status={goal.status} />
        </div>
        <div className="chip-row">
          <ProgressChip progress={goal.progress} />
          <StatusChip status={goal.status} />
          <DaysChip daysRemaining={goal.daysRemaining} dailyTargetPct={goal.dailyTargetPct} />
        </div>
        <div className="goal-detail-actions">
          <button
            type="button"
            className="btn btn-subtle btn-sm"
            onClick={() => setSheet({ kind: 'goal', initial: goal })}
          >
            Edit
          </button>
          <button type="button" className="btn btn-subtle btn-sm" onClick={handleArchiveGoal}>
            {goal.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteGoal}>
            Delete
          </button>
        </div>
      </div>

      <div className="section-heading-row">
        <span className="section-title" style={{ marginBottom: 0 }}>
          Milestones
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setSheet({ kind: 'milestone', initial: null })}
        >
          + Milestone
        </button>
      </div>

      {milestones.length === 0 && <p className="empty-state">No milestones yet.</p>}

      {milestones.map((milestone) => (
        <MilestoneBlock
          key={milestone._id || milestone.id}
          milestone={milestone}
          onEdit={(m) => setSheet({ kind: 'milestone', initial: m })}
          onDelete={handleDeleteMilestone}
          onAddTask={(m) => setSheet({ kind: 'task', initial: null, context: m._id || m.id })}
          taskHandlers={taskHandlers}
        />
      ))}

      {sheet?.kind === 'goal' && (
        <GoalForm initial={sheet.initial} onClose={closeSheet} onSubmit={handleEditGoal} />
      )}

      {sheet?.kind === 'milestone' && (
        <MilestoneForm
          initial={sheet.initial}
          onClose={closeSheet}
          onSubmit={(payload) =>
            sheet.initial
              ? handleUpdateMilestone(sheet.initial._id || sheet.initial.id, payload)
              : handleCreateMilestone(payload)
          }
        />
      )}

      {sheet?.kind === 'task' && (
        <TaskForm
          initial={sheet.initial}
          onClose={closeSheet}
          onSubmit={(payload) =>
            sheet.initial
              ? handleUpdateTask(sheet.initial._id || sheet.initial.id, payload)
              : handleCreateTask(sheet.context, payload)
          }
        />
      )}

      {sheet?.kind === 'subtask' && (
        <SubtaskForm
          initial={sheet.initial}
          onClose={closeSheet}
          onSubmit={(payload) =>
            sheet.initial
              ? handleUpdateSubtask(sheet.initial._id || sheet.initial.id, payload)
              : handleCreateSubtask(sheet.context, payload)
          }
        />
      )}
    </div>
  );
}
