import { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { toInputDate } from '../../utils/format';

export default function GoalForm({ initial, onClose, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [startDate, setStartDate] = useState(toInputDate(initial?.startDate) || '');
  const [dueDate, setDueDate] = useState(toInputDate(initial?.dueDate) || '');
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
      await onSubmit({ title: title.trim(), description, startDate, dueDate });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save goal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      title={isEdit ? 'Edit Goal' : 'New Goal'}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={saving ? 'Saving…' : 'Save'}
      saveDisabled={saving}
    >
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SigmaX — Full Stack + DSA" autoFocus />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does success look like?" />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Start date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Due date</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
    </BottomSheet>
  );
}
