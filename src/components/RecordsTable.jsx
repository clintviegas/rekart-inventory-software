import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { fetchRecords, removeRecord, createRecord } from '../api/zohoApi';
import { FIELD_SCHEMA, ZOHO_META_FIELDS, SECTION_LABELS } from '../schema';
import { RefreshCw, Download, Upload, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── CSV helpers ──────────────────────────────────────────────── */
function escapeCSV(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCSV(text) {
  const lines = [];
  let cur = '', inQ = false, row = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(cur.trim()); cur = ''; }
      else if (c === '\n' || (c === '\r' && text[i + 1] === '\n')) {
        if (c === '\r') i++;
        row.push(cur.trim()); lines.push(row); row = []; cur = '';
      } else cur += c;
    }
  }
  if (cur || row.length) { row.push(cur.trim()); lines.push(row); }
  return lines;
}

function downloadCSV(filename, headers, rows) {
  const head = headers.map(escapeCSV).join(',');
  const body = rows.map(r => headers.map(h => escapeCSV(r[h])).join(',')).join('\n');
  const blob = new Blob([head + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ─────────────────────────────────────────────────────────────── */

const RecordsTable = forwardRef(function RecordsTable({ section, onEdit }, ref) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInput = useRef(null);

  const fields = FIELD_SCHEMA[section] || [];
  const label = SECTION_LABELS[section] || section;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecords(section);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ reload: load }), [section]);

  useEffect(() => { load(); }, [section]);

  /* ── Delete ──────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record from Zoho Creator? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await removeRecord(section, id);
      setRecords(prev => prev.filter(r => r.ID !== id));
      toast.success('Record deleted from Zoho Creator.');
    } catch (e) {
      toast.error('Delete failed: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  /* ── Export CSV ──────────────────────────────────────────── */
  const handleExport = () => {
    const headers = fields.map(f => f.name);
    downloadCSV(`rekart_${section}_${new Date().toISOString().slice(0, 10)}.csv`, headers, records);
    toast.success(`${records.length} records exported.`);
  };

  /* ── Import CSV ──────────────────────────────────────────── */
  const handleImportClick = () => fileInput.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    try {
      const text = await file.text();
      const lines = parseCSV(text);
      if (lines.length < 2) { toast.error('CSV file is empty or has no data rows.'); setImporting(false); return; }

      const headers = lines[0];
      const dataRows = lines.slice(1).filter(r => r.some(c => c));
      let success = 0, failed = 0;

      for (const row of dataRows) {
        const obj = {};
        headers.forEach((h, i) => {
          const val = row[i];
          if (val && !ZOHO_META_FIELDS.includes(h)) obj[h] = val;
        });
        if (Object.keys(obj).length === 0) continue;
        try {
          await createRecord(section, obj);
          success++;
        } catch {
          failed++;
        }
      }

      await load();
      if (failed === 0) toast.success(`Imported ${success} records to Zoho Creator.`);
      else toast.error(`${success} imported, ${failed} failed.`);
    } catch (err) {
      toast.error('Import error: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="records-panel">
      {/* Header bar */}
      <div className="records-header">
        <div className="records-header-left">
          <span className="records-count">
            {loading ? 'Syncing with Zoho Creator…' : `${records.length} record${records.length !== 1 ? 's' : ''} — ${label}`}
          </span>
          <span className="records-sync-note">Live from Zoho Creator</span>
        </div>
        <div className="records-actions">
          <button className="btn-icon" onClick={handleExport} disabled={loading || records.length === 0} title="Export CSV">
            <Download size={13} /> Export
          </button>
          <button className="btn-icon" onClick={handleImportClick} disabled={loading || importing} title="Import CSV">
            <Upload size={13} /> {importing ? 'Importing…' : 'Import'}
          </button>
          <input ref={fileInput} type="file" accept=".csv" onChange={handleImportFile} hidden />
          <button className="btn-icon" onClick={load} disabled={loading} title="Sync with Zoho Creator">
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Sync
          </button>
        </div>
      </div>

      {error && <p className="records-error"><AlertTriangle size={13} /> {error}</p>}

      {!loading && !error && records.length === 0 && (
        <div className="records-empty">
          <p>No records found in Zoho Creator for this section.</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>Use the Form tab to add records, or Import a CSV file.</p>
        </div>
      )}

      {records.length > 0 && (
        <div className="records-scroll">
          <table className="records-table">
            <thead>
              <tr>
                <th className="col-sticky col-actions">Actions</th>
                <th className="col-sticky col-num" style={{ left: 72 }}>#</th>
                {fields.map(f => <th key={f.name}>{f.label}</th>)}
                <th>Added</th>
                <th>Modified</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, i) => (
                <tr key={row.ID} className={deleting === row.ID ? 'row-deleting' : ''}>
                  <td className="col-sticky col-actions">
                    <button className="tbl-btn tbl-edit" onClick={() => onEdit(row)} title="Edit">
                      <Pencil size={12} />
                    </button>
                    <button
                      className="tbl-btn tbl-del"
                      onClick={() => handleDelete(row.ID)}
                      disabled={!!deleting}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                  <td className="col-sticky col-num" style={{ left: 72 }}>{i + 1}</td>
                  {fields.map(f => (
                    <td key={f.name} title={row[f.name] || ''}>
                      {row[f.name] || <span className="cell-empty">—</span>}
                    </td>
                  ))}
                  <td className="col-meta">{row.Added_Time || '—'}</td>
                  <td className="col-meta">{row.Modified_Time || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default RecordsTable;
