import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function SettingsSheet({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setError('');
    setExporting(true);
    try {
      const data = await api.getExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `momentum-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  function handleLogout() {
    logout();
    onClose?.();
    navigate('/login', { replace: true });
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>Settings</h2>
        </div>
        <div className="sheet-body">
          <div className="settings-row">
            <div>
              <div className="settings-label">Logged in as</div>
              <div className="settings-email">{user?.email}</div>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Backup</div>
              <div className="settings-email">Export everything as JSON</div>
            </div>
            <button type="button" className="btn btn-subtle btn-sm" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
