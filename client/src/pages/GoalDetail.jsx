import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import ProgressRing from '../components/ProgressRing';
import { StatusChip, ProgressChip, DaysChip } from '../components/Chip';
import TopicBlock from '../components/TopicBlock';
import GoalForm from '../components/forms/GoalForm';
import TopicForm from '../components/forms/TopicForm';
import SubtopicForm from '../components/forms/SubtopicForm';
import TaskForm from '../components/forms/TaskForm';
import SubtaskForm from '../components/forms/SubtaskForm';

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // sheet: { kind: 'goal' | 'topic' | 'subtopic' | 'task' | 'subtask', initial, context }
  const [sheet, setSheet] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .getGoal(id)
      .then((res) => {
        setGoal(res.goal);
        setTopics(res.topics || []);
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

  // --- Topic actions ---
  async function handleCreateTopic(payload) {
    await api.createTopic(id, payload);
    await load();
  }
  async function handleUpdateTopic(topicId, payload) {
    await api.updateTopic(topicId, payload);
    await load();
  }
  async function handleDeleteTopic(topic) {
    if (!window.confirm(`Delete topic "${topic.title}" and everything under it?`)) return;
    await api.deleteTopic(topic._id || topic.id);
    await load();
  }

  // --- Subtopic actions ---
  async function handleCreateSubtopic(topicId, payload) {
    await api.createSubtopic(topicId, payload);
    await load();
  }
  async function handleUpdateSubtopic(subtopicId, payload) {
    await api.updateSubtopic(subtopicId, payload);
    await load();
  }
  async function handleDeleteSubtopic(subtopic) {
    if (!window.confirm(`Delete subtopic "${subtopic.title}" and its tasks?`)) return;
    await api.deleteSubtopic(subtopic._id || subtopic.id);
    await load();
  }

  // --- Task actions ---
  async function handleCreateTask(subtopicId, payload) {
    await api.createTask(subtopicId, payload);
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
        <div className="goal-detail-header-top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="page-title">{goal.title}</h1>
            {goal.description && <p className="goal-detail-desc">{goal.description}</p>}
          </div>
          <ProgressRing progress={goal.progress} status={goal.status} size={64} strokeWidth={7} />
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
          Topics
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setSheet({ kind: 'topic', initial: null })}
        >
          + Topic
        </button>
      </div>

      {topics.length === 0 && <p className="empty-state">No topics yet.</p>}

      {topics.map((topic) => (
        <TopicBlock
          key={topic._id || topic.id}
          topic={topic}
          onEdit={(t) => setSheet({ kind: 'topic', initial: t })}
          onDelete={handleDeleteTopic}
          onAddSubtopic={(t) => setSheet({ kind: 'subtopic', initial: null, context: t._id || t.id })}
          onEditSubtopic={(s) => setSheet({ kind: 'subtopic', initial: s })}
          onDeleteSubtopic={handleDeleteSubtopic}
          onAddTask={(subtopicId) => setSheet({ kind: 'task', initial: null, context: subtopicId })}
          taskHandlers={taskHandlers}
        />
      ))}

      {sheet?.kind === 'goal' && (
        <GoalForm initial={sheet.initial} onClose={closeSheet} onSubmit={handleEditGoal} />
      )}

      {sheet?.kind === 'topic' && (
        <TopicForm
          initial={sheet.initial}
          onClose={closeSheet}
          onSubmit={(payload) =>
            sheet.initial
              ? handleUpdateTopic(sheet.initial._id || sheet.initial.id, payload)
              : handleCreateTopic(payload)
          }
        />
      )}

      {sheet?.kind === 'subtopic' && (
        <SubtopicForm
          initial={sheet.initial}
          onClose={closeSheet}
          onSubmit={(payload) =>
            sheet.initial
              ? handleUpdateSubtopic(sheet.initial._id || sheet.initial.id, payload)
              : handleCreateSubtopic(sheet.context, payload)
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
