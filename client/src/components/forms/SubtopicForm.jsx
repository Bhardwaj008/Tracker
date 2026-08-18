import { useState } from 'react';
import BottomSheet from '../BottomSheet';

// New: create/edit form for the Subtopic level, matching TopicForm/
// MilestoneForm's shape exactly (title + order only).
export default function SubtopicForm({ initial, onClose, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(initial);

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), order: initial?.order ?? 0 });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save subtopic.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      title={isEdit ? 'Edit Subtopic' : 'New Subtopic'}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={saving ? 'Saving…' : 'Save'}
      saveDisabled={saving}
    >
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Arrays & Strings" autoFocus />
      </label>
      {error && <p className="form-error">{error}</p>}
    </BottomSheet>
  );
}
