export default function SubtaskRow({ subtask, onToggle, onEdit, onDelete }) {
  return (
    <div className="subtask-row">
      <button
        type="button"
        className={`subtask-checkbox ${subtask.completed ? 'checked' : ''}`}
        aria-label={subtask.completed ? 'Mark incomplete' : 'Mark complete'}
        onClick={() => onToggle(subtask)}
      >
        {subtask.completed ? '✓' : ''}
      </button>
      <span className={`subtask-title ${subtask.completed ? 'completed' : ''}`}>{subtask.title}</span>
      <button type="button" className="inline-icon-btn" aria-label="Edit subtask" onClick={() => onEdit(subtask)}>
        ✎
      </button>
      <button type="button" className="inline-icon-btn" aria-label="Delete subtask" onClick={() => onDelete(subtask)}>
        ✕
      </button>
    </div>
  );
}
