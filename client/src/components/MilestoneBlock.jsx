import { useState } from 'react';
import TaskRow from './TaskRow';

export default function MilestoneBlock({
  milestone,
  onEdit,
  onDelete,
  onAddTask,
  taskHandlers,
}) {
  const [open, setOpen] = useState(true);
  const tasks = milestone.tasks || [];

  return (
    <div className="milestone-block">
      <button type="button" className="milestone-header" onClick={() => setOpen((v) => !v)}>
        <span className={`milestone-chevron ${open ? 'open' : ''}`}>▶</span>
        <div className="milestone-header-main">
          <div className="milestone-title">{milestone.title}</div>
          <div className="milestone-progress-row">
            <span className="milestone-progress-pct mono">{Math.round(milestone.progress || 0)}%</span>
            <div className="progress-track" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, milestone.progress || 0))}%` }} />
            </div>
          </div>
        </div>
      </button>

      {open && (
        <>
          <div className="milestone-body">
            {tasks.length === 0 && <p className="empty-state">No tasks yet.</p>}
            {tasks.map((task) => (
              <TaskRow key={task._id || task.id} task={task} {...taskHandlers} />
            ))}
          </div>
          <div className="milestone-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAddTask(milestone)}>
              + Task
            </button>
            <button type="button" className="btn btn-subtle btn-sm" onClick={() => onEdit(milestone)}>
              Edit
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(milestone)}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
