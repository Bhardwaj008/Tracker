import TimerButton from './TimerButton';
import SubtaskRow from './SubtaskRow';
import { formatDate } from '../utils/format';

export default function TaskRow({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onTimerChange,
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
}) {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div className="task-row">
      <div className="task-row-top">
        <button
          type="button"
          className={`checkbox ${task.completed ? 'checked' : ''}`}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          onClick={() => onToggleComplete(task)}
        >
          {task.completed ? '✓' : ''}
        </button>
        <div className="task-row-main">
          <div className={`task-title ${task.completed ? 'completed' : ''}`}>{task.title}</div>
          <div className="task-meta-row">
            <span className={`weight-badge weight-${task.weight}`}>{task.weight}</span>
            {task.dueDate && (
              <span className={`due-chip ${isOverdue ? 'overdue' : ''}`}>{formatDate(task.dueDate)}</span>
            )}
          </div>
          {task.notes && <div className="task-notes">{task.notes}</div>}
        </div>
      </div>

      <div className="task-row-actions">
        <TimerButton task={task} onChange={onTimerChange} />
        <button type="button" className="btn btn-subtle btn-sm" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(task)}>
          Delete
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAddSubtask(task)}>
          + Subtask
        </button>
      </div>

      {task.subtasks?.length > 0 && (
        <div className="subtask-list">
          {task.subtasks.map((subtask) => (
            <SubtaskRow
              key={subtask._id || subtask.id}
              subtask={subtask}
              onToggle={onToggleSubtask}
              onEdit={onEditSubtask}
              onDelete={onDeleteSubtask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
