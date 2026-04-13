import { useState } from 'react';
import { patchRecord } from '../api/zohoApi';
import { FIELD_SCHEMA, SECTION_LABELS } from '../schema';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditRecordModal({ section, record, onClose, onSaved }) {
  const fields = FIELD_SCHEMA[section] || [];
  const [formData, setFormData] = useState(() => {
    const init = {};
    fields.forEach(f => { init[f.name] = record[f.name] ?? ''; });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const set = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    // Build diff — only send changed fields
    const diff = {};
    fields.forEach(f => {
      const old = record[f.name] ?? '';
      const cur = formData[f.name] ?? '';
      if (String(cur) !== String(old)) diff[f.name] = cur;
    });

    if (Object.keys(diff).length === 0) {
      toast('No changes to save.'); onClose(); return;
    }

    setSaving(true);
    try {
      await patchRecord(section, record.ID, diff);
      toast.success('Record updated in Zoho Creator!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Update failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-header">
          <h3>Edit — {SECTION_LABELS[section]}</h3>
          <span className="modal-id">ID: {record.ID}</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            {fields.map(f => (
              <div key={f.name} className="modal-field">
                <label htmlFor={`edit-${f.name}`}>{f.label}</label>
                {f.options ? (
                  <select id={`edit-${f.name}`} name={f.name} value={formData[f.name]} onChange={set}>
                    <option value="">— Select —</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea id={`edit-${f.name}`} name={f.name} value={formData[f.name]} onChange={set} rows={2} />
                ) : (
                  <input id={`edit-${f.name}`} name={f.name} type={f.type} value={formData[f.name]} onChange={set} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <span className="modal-meta">
            Added: {record.Added_Time || '—'} &nbsp;|&nbsp; Modified: {record.Modified_Time || '—'}
          </span>
          <div className="modal-btns">
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
