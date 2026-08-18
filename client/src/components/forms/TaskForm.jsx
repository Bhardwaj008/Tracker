import { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { toInputDate } from '../../utils/format';

const WEIGHTS = ['S', 'M', 'L', 'XL'];

export default function TaskForm({ initial, onClose, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [weight, setWeight] = useState(initial?.weight || 'M');
  const [dueDate, setDueDate] = useState(toInputDate(initial?.dueDate) || '');
  const [notes, setNotes] = useState(initial?.notes || '');
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
      await onSubmit({ title: title.trim(), weight, dueDate: dueDate || null, notes });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save task.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      title={isEdit ? 'Edit Task' : 'New Task'}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={saving ? 'Saving…' : 'Save'}
      saveDisabled={saving}
    >
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Solve 5 array problems" autoFocus />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Weight</span>
          <select value={weight} onChange={(e) => setWeight(e.target.value)}>
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Due date</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Notes</span>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
      </label>
      {error && <p className="form-error">{error}</p>}
    </BottomSheet>
  );
}
