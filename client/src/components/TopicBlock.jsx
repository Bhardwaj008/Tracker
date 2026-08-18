import { useState } from 'react';
import ProgressRing from './ProgressRing';
import SubtopicBlock from './SubtopicBlock';

function findNextIncompleteTask(topic) {
  for (const subtopic of topic.subtopics || []) {
    for (const task of subtopic.tasks || []) {
      if (!task.completed) return task;
    }
  }
  return null;
}

// Renamed from MilestoneBlock. Renders a Topic accordion: a ring header
// (replacing the old flat progress bar row), a primary "Continue" button
// that scrolls to/highlights the next incomplete Task anywhere under this
// Topic, and a list of Subtopic blocks (the new level between Topic and
// Task) instead of Tasks directly.
export default function TopicBlock({
  topic,
  onEdit,
  onDelete,
  onAddSubtopic,
  onEditSubtopic,
  onDeleteSubtopic,
  onAddTask,
  taskHandlers,
}) {
  const [open, setOpen] = useState(true);
  const subtopics = topic.subtopics || [];
  const nextTask = findNextIncompleteTask(topic);

  function handleContinue(e) {
    e.stopPropagation();
    if (!nextTask) return;
    const el = document.getElementById(`task-${nextTask._id || nextTask.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('task-row-highlight');
    setTimeout(() => el.classList.remove('task-row-highlight'), 1600);
  }

  return (
    <div className="topic-block">
      <button type="button" className="topic-header" onClick={() => setOpen((v) => !v)}>
        <span className={`topic-chevron ${open ? 'open' : ''}`}>▶</span>
        <div className="topic-header-main">
          <div className="topic-title">{topic.title}</div>
          <div className="topic-meta">
            {subtopics.length} subtopic{subtopics.length === 1 ? '' : 's'}
          </div>
        </div>
        <ProgressRing progress={topic.progress} size={44} strokeWidth={5} />
      </button>

      {open && (
        <>
          <div className="topic-body">
            <button
              type="button"
              className="btn btn-primary btn-continue"
              onClick={handleContinue}
              disabled={!nextTask}
            >
              {nextTask ? 'Continue →' : 'All done ✓'}
            </button>

            {subtopics.length === 0 && <p className="empty-state">No subtopics yet.</p>}
            {subtopics.map((subtopic) => (
              <SubtopicBlock
                key={subtopic._id || subtopic.id}
                subtopic={subtopic}
                onEdit={onEditSubtopic}
                onDelete={onDeleteSubtopic}
                onAddTask={() => onAddTask(subtopic._id || subtopic.id)}
                taskHandlers={taskHandlers}
              />
            ))}
          </div>
          <div className="topic-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAddSubtopic(topic)}>
              + Subtopic
            </button>
            <button type="button" className="btn btn-subtle btn-sm" onClick={() => onEdit(topic)}>
              Edit
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(topic)}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
