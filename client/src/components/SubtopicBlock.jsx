import { useState } from 'react';
import TaskRow from './TaskRow';
import ProgressRing from './ProgressRing';

// New level between Topic and Task. Same accordion pattern as TopicBlock
// (and the old MilestoneBlock it nests under), just visually indented one
// step and with a smaller, unlabeled ring.
export default function SubtopicBlock({ subtopic, onEdit, onDelete, onAddTask, taskHandlers }) {
  const [open, setOpen] = useState(true);
  const tasks = subtopic.tasks || [];

  return (
    <div className="subtopic-block">
      <button type="button" className="subtopic-header" onClick={() => setOpen((v) => !v)}>
        <span className={`topic-chevron ${open ? 'open' : ''}`}>▶</span>
        <div className="subtopic-header-main">
          <div className="subtopic-title">{subtopic.title}</div>
        </div>
        <ProgressRing progress={subtopic.progress} size={30} strokeWidth={4} showLabel={false} />
      </button>

      {open && (
        <>
          <div className="subtopic-body">
            {tasks.length === 0 && <p className="empty-state">No tasks yet.</p>}
            {tasks.map((task) => (
              <TaskRow key={task._id || task.id} task={task} {...taskHandlers} />
            ))}
          </div>
          <div className="subtopic-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onAddTask}>
              + Task
            </button>
            <button type="button" className="btn btn-subtle btn-sm" onClick={() => onEdit(subtopic)}>
              Edit
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(subtopic)}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
