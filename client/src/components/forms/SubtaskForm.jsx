import { useState } from 'react';
import BottomSheet from '../BottomSheet';

export default function SubtaskForm({ initial, onClose, onSubmit }) {
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
      await onSubmit({ title: title.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save subtask.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      title={isEdit ? 'Edit Subtask' : 'New Subtask'}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={saving ? 'Saving…' : 'Save'}
      saveDisabled={saving}
    >
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Write test cases" autoFocus />
      </label>
      {error && <p className="form-error">{error}</p>}
    </BottomSheet>
  );
}
