// Reusable bottom-sheet-style modal: slides up from the bottom on mobile,
// centered on wider viewports. Used for every create/edit form (goal,
// milestone, task, subtask) so the interaction pattern stays consistent.
export default function BottomSheet({
  title,
  onClose,
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  children,
}) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>{title}</h2>
        </div>
        <div className="sheet-body">{children}</div>
        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saveDisabled}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
