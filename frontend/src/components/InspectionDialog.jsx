import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../api/client';
import { severities, defects, today, dateLabel } from '../constants';
import { Badge, Field, ErrorBox } from './ui';
export default function InspectionDialog({ inspection, close, saved }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [form, setForm] = useState({
    inspectionDate: today(),
    machineLineId: '',
    defectType: '',
    severity: 'Major',
    remarks: '',
  });
  const isNew = !inspection;
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (isNew && !form.machineLineId.trim())
      return setError('Enter a machine or line ID.');
    if (!isNew && !note.trim())
      return setError(
        'Enter a resolution note before resolving this inspection.',
      );
    setBusy(true);
    try {
      if (isNew) await api.create(form);
      else await api.resolve(inspection.id, note.trim());
      saved(
        isNew
          ? 'Inspection logged successfully.'
          : 'Inspection resolved successfully.',
      );
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-heading">
        <div>
          <p className="eyebrow">
            {isNew ? 'CAPTURE A FINDING' : 'INSPECTION RECORD'}
          </p>
          <h2 id="dialog-title">
            {isNew ? 'Log an inspection' : 'Inspection details'}
          </h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={submit}>
        {isNew ? (
          <>
            <p className="muted">
              Record a fabric defect. New inspections are marked open.
            </p>
            <div className="form-grid">
              <Field label="Inspection date *">
                <input
                  required
                  type="date"
                  name="inspectionDate"
                  value={form.inspectionDate}
                  onChange={update}
                />
              </Field>
              <Field label="Machine / line ID *">
                <input
                  required
                  maxLength={120}
                  name="machineLineId"
                  placeholder="e.g. Loom 04 / Line B"
                  value={form.machineLineId}
                  onChange={update}
                />
              </Field>
              <Field label="Defect type *">
                <select
                  required
                  name="defectType"
                  value={form.defectType}
                  onChange={update}
                >
                  <option value="">Select defect type</option>
                  {defects.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Severity *">
                <select name="severity" value={form.severity} onChange={update}>
                  {severities.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Remarks (optional)">
              <textarea
                rows={3}
                maxLength={5000}
                name="remarks"
                placeholder="Describe what you observed…"
                value={form.remarks}
                onChange={update}
              />
            </Field>
          </>
        ) : (
          <>
            <div className="detail-badges">
              <Badge>{inspection.severity}</Badge>
              <Badge>{inspection.status}</Badge>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>Machine / line</dt>
                <dd>{inspection.machineLineId}</dd>
              </div>
              <div>
                <dt>Inspection date</dt>
                <dd>{dateLabel(inspection.inspectionDate)}</dd>
              </div>
              <div>
                <dt>Defect type</dt>
                <dd>{inspection.defectType}</dd>
              </div>
              <div>
                <dt>Logged</dt>
                <dd>{new Date(inspection.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
            <div className="note">
              <span className="eyebrow">OBSERVATION</span>
              <p>{inspection.remarks || 'No remarks added.'}</p>
            </div>
            {inspection.status === 'Open' ? (
              <Field label="Resolution note *">
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  placeholder="What was done to correct this defect?"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <small>
                  A note is required. Resolved inspections cannot be reopened.
                </small>
              </Field>
            ) : (
              <div className="note resolution">
                <span className="eyebrow">RESOLUTION NOTE</span>
                <p>{inspection.resolutionNote}</p>
              </div>
            )}
          </>
        )}
        <ErrorBox message={error} />
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary"
            onClick={close}
            disabled={busy}
          >
            {inspection?.status === 'Resolved' ? 'Close' : 'Cancel'}
          </button>
          {(isNew || inspection.status === 'Open') && (
            <button className="primary" disabled={busy}>
              {busy
                ? 'Saving…'
                : isNew
                  ? 'Save inspection'
                  : 'Resolve inspection'}
              <Check size={17} />
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
