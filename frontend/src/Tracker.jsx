import { useInspectionFeed } from './hooks/useInspectionFeed';
import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  ListFilter,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from './api/client';
import { defaults, severities, dateLabel } from './constants';
import { Badge, Field, ErrorBox } from './components/ui';
import InspectionDialog from './components/InspectionDialog';
import './App.css';
export default function App() {
  const [view, setView] = useState('overview');
  const [filters, setFilters] = useState(defaults);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [revision, setRevision] = useState(0);
  const [opening, setOpening] = useState(null);
  const refresh = () => {
    setError('');
    setRevision((value) => value + 1);
  };
  const invalidRange =
    filters.startDate && filters.endDate && filters.startDate > filters.endDate;
  const {
    rows,
    summary,
    loading,
    loadingMore,
    error: feedError,
    pageError,
    hasMore,
    sentinel,
    retryPage,
  } = useInspectionFeed(filters, view, revision, invalidRange);
  const totals = summary?.reduce(
    (acc, item) => ({
      open: acc.open + item.open,
      resolved: acc.resolved + item.resolved,
    }),
    { open: 0, resolved: 0 },
  );
  const filterCount = ['severity', 'status', 'startDate', 'endDate'].filter(
    (key) => filters[key],
  ).length;
  function changeFilter(event) {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }
  async function openInspection(id) {
    setOpening(id);
    setError('');
    try {
      setModal({ inspection: await api.get(id) });
    } catch (err) {
      setError(err.message);
    } finally {
      setOpening(null);
    }
  }
  function saved(message) {
    setModal(null);
    setNotice(message);
    refresh();
  }
  const visibleRows = view === 'overview' ? rows.slice(0, 6) : rows;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            setView('overview');
          }}
        >
          <span className="brand-mark">
            <ShieldCheck size={25} />
          </span>
          <span>
            Threadline<small>QUALITY TRACKER</small>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">F</span>
          <div>
            Factory workspace<small>Fabric inspection</small>
          </div>
          <span className="live-dot" />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <button
            className={view === 'overview' ? 'active' : ''}
            onClick={() => setView('overview')}
          >
            <LayoutDashboard size={19} />
            Overview
          </button>
          <button
            className={view === 'inspections' ? 'active' : ''}
            onClick={() => setView('inspections')}
          >
            <ClipboardCheck size={19} />
            Inspections
            {totals && (
              <span className="nav-count">{totals.open + totals.resolved}</span>
            )}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={22} />
          <p>
            Quality in every thread.<small>Spot it. Log it. Resolve it.</small>
          </p>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{' '}
            <strong>{view === 'overview' ? 'Overview' : 'Inspections'}</strong>
          </span>
          <span className="top-date">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="avatar" aria-label="Quality control workspace">
            QC
          </span>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <p className="eyebrow">THE QUALITY PICTURE</p>
              <h1>
                {view === 'overview'
                  ? 'Quality overview'
                  : 'Inspection register'}
              </h1>
              <p className="muted">
                {view === 'overview'
                  ? 'Keep a pulse on fabric quality. Turn findings into action.'
                  : 'Every finding, from first observation to resolution.'}
              </p>
            </div>
            <button
              className="primary"
              onClick={() => {
                setNotice('');
                setModal({ inspection: null });
              }}
            >
              <Plus size={19} />
              Log inspection
            </button>
          </div>
          {notice && (
            <div className="success" role="status">
              <CheckCircle2 size={18} />
              {notice}
              <button
                aria-label="Dismiss notification"
                className="icon-button"
                onClick={() => setNotice('')}
              >
                <X size={17} />
              </button>
            </div>
          )}
          <ErrorBox message={error || feedError} />
          {(error || feedError) && (
            <button className="secondary retry" onClick={refresh}>
              Retry connection
            </button>
          )}
          <section
            className="stats-grid"
            aria-label="Global inspection summary"
            aria-busy={loading}
          >
            {[
              {
                label: 'Total inspections',
                value: totals && totals.open + totals.resolved,
                icon: ClipboardCheck,
                description: 'All recorded findings',
                color: 'neutral',
              },
              {
                label: 'Open inspections',
                value: totals?.open,
                icon: Activity,
                description: 'Awaiting corrective action',
                color: 'amber',
              },
              {
                label: 'Critical & open',
                value: summary?.find((item) => item.severity === 'Critical')
                  ?.open,
                icon: ShieldCheck,
                description: 'Priority attention required',
                color: 'red',
              },
              {
                label: 'Resolved',
                value: totals?.resolved,
                icon: CheckCircle2,
                description: 'Corrective action completed',
                color: 'green',
              },
            ].map(({ label, value, icon: Icon, description, color }) => (
              <article className="stat-card" key={label}>
                <div className="stat-top">
                  <span>{label}</span>
                  <span className={`stat-icon ${color}`}>
                    <Icon size={18} />
                  </span>
                </div>
                <strong>{value ?? '—'}</strong>
                <p>{description}</p>
              </article>
            ))}
          </section>
          {view === 'overview' && (
            <section className="severity-panel">
              <div className="section-heading">
                <div>
                  <h2>Severity breakdown</h2>
                  <p className="muted">Global counts across all inspections</p>
                </div>
                <span className="legend">
                  <i />
                  Open <i />
                  Resolved
                </span>
              </div>
              <div className="severity-grid">
                {severities.map((severity) => {
                  const item = summary?.find(
                    (row) => row.severity === severity,
                  );
                  const total = item ? item.open + item.resolved : 0;
                  return (
                    <div className="severity-item" key={severity}>
                      <div>
                        <Badge>{severity}</Badge>
                        <span>
                          {item ? total : '—'} <small>total</small>
                        </span>
                      </div>
                      <div className="progress" aria-hidden="true">
                        <span
                          style={{
                            width: `${total ? (item.open / total) * 100 : 0}%`,
                          }}
                        />
                        <span
                          style={{
                            width: `${total ? (item.resolved / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p>
                        <span>{item?.open ?? '—'} open</span>
                        <span>{item?.resolved ?? '—'} resolved</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          <section className="register">
            <div className="section-heading">
              <div>
                <h2>
                  {view === 'overview'
                    ? 'Recent inspections'
                    : 'All inspections'}
                  <span className="count">
                    {loading || feedError ? '—' : rows.length}
                  </span>
                </h2>
                <p className="muted">
                  {view === 'overview'
                    ? 'The latest findings from your shop floor'
                    : 'Filter findings and track corrective action'}
                </p>
              </div>
              {view === 'overview' ? (
                <button
                  className="text-button"
                  onClick={() => setView('inspections')}
                >
                  View all
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="icon-button"
                  aria-label="Refresh inspections"
                  onClick={refresh}
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
            {view === 'inspections' && (
              <div className="filters">
                <div className="filter-title">
                  <ListFilter size={16} />
                  <strong>Filters</strong>
                  {filterCount > 0 && (
                    <button
                      className="text-button"
                      onClick={() => setFilters(defaults)}
                    >
                      Clear ({filterCount})
                    </button>
                  )}
                </div>
                <div className="filter-grid">
                  <Field label="Severity">
                    <select
                      name="severity"
                      value={filters.severity}
                      onChange={changeFilter}
                    >
                      <option value="">All severities</option>
                      {severities.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      name="status"
                      value={filters.status}
                      onChange={changeFilter}
                    >
                      <option value="">All statuses</option>
                      <option>Open</option>
                      <option>Resolved</option>
                    </select>
                  </Field>
                  <Field label="From date">
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={changeFilter}
                    />
                  </Field>
                  <Field label="To date">
                    <input
                      type="date"
                      name="endDate"
                      min={filters.startDate || undefined}
                      value={filters.endDate}
                      onChange={changeFilter}
                    />
                  </Field>
                  <Field label="Date order">
                    <select
                      name="order"
                      value={filters.order}
                      onChange={changeFilter}
                    >
                      <option value="desc">Newest first</option>
                      <option value="asc">Oldest first</option>
                    </select>
                  </Field>
                </div>
                {invalidRange && (
                  <ErrorBox message="End date must be on or after start date." />
                )}
              </div>
            )}
            {invalidRange && view === 'inspections' ? (
              <div className="empty">
                <h3>Check your date range</h3>
                <p>Choose an end date on or after the start date.</p>
              </div>
            ) : loading ? (
              <div className="empty" role="status">
                <RefreshCw className="spin" />
                <h3>Loading inspections…</h3>
                <p>Fetching the latest quality data.</p>
              </div>
            ) : feedError ? (
              <div className="empty">
                <Activity />
                <h3>Unable to load inspections</h3>
                <p>Check the API connection, then retry.</p>
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="empty">
                <ClipboardCheck size={32} />
                <h3>
                  {filterCount && view === 'inspections'
                    ? 'No matching inspections'
                    : 'A fresh start for quality'}
                </h3>
                <p>
                  {filterCount && view === 'inspections'
                    ? 'Try adjusting your filters to see more findings.'
                    : 'Log your first inspection to start tracking fabric quality.'}
                </p>
                <button
                  className="secondary"
                  onClick={() =>
                    filterCount && view === 'inspections'
                      ? setFilters(defaults)
                      : setModal({ inspection: null })
                  }
                >
                  {filterCount && view === 'inspections'
                    ? 'Clear filters'
                    : 'Log first inspection'}
                </button>
              </div>
            ) : (
              <div className="inspection-table">
                <div className="table-heading">
                  <span>MACHINE / LINE</span>
                  <span>DEFECT TYPE</span>
                  <span>SEVERITY</span>
                  <span>STATUS</span>
                  <span>DATE</span>
                  <span />
                </div>
                {visibleRows.map((row) => (
                  <button
                    className="inspection-row"
                    key={row.id}
                    onClick={() => openInspection(row.id)}
                    disabled={opening === row.id}
                    aria-label={`View inspection, ${row.machineLineId}`}
                  >
                    <span className="machine">
                      <strong>{row.machineLineId}</strong>
                    </span>
                    <span className="defect-cell">{row.defectType}</span>
                    <span>
                      <Badge>{row.severity}</Badge>
                    </span>
                    <span>
                      <Badge>{row.status}</Badge>
                    </span>
                    <span className="row-date">
                      {dateLabel(row.inspectionDate)}
                    </span>
                    <ArrowRight size={17} className="row-arrow" />
                  </button>
                ))}
              </div>
            )}
            <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />
            {view === 'inspections' &&
              !loading &&
              !feedError &&
              !invalidRange && (
                <div className="feed-status">
                  {loadingMore ? (
                    <p role="status">Loading more inspections…</p>
                  ) : pageError ? (
                    <>
                      <ErrorBox message={pageError} />
                      <button className="secondary" onClick={retryPage}>
                        Retry loading more
                      </button>
                    </>
                  ) : hasMore ? (
                    <button className="secondary" onClick={retryPage}>
                      Load more inspections
                    </button>
                  ) : rows.length > 0 ? (
                    <p>All {rows.length} inspections loaded</p>
                  ) : null}
                </div>
              )}
            <div className="register-footer">
              <span>
                {view === 'overview'
                  ? 'Showing up to 6 recent inspections'
                  : 'Dates include both start and end boundaries'}
              </span>
              <span>
                <ShieldCheck size={14} />
                Built for the shop floor
              </span>
            </div>
          </section>
          <footer className="page-footer">
            THREADLINE <span>·</span> Quality inspection tracker
            <span>Global summary is independent of filters.</span>
          </footer>
        </main>
      </div>
      {modal && (
        <InspectionDialog
          inspection={modal.inspection}
          close={() => setModal(null)}
          saved={saved}
        />
      )}
    </div>
  );
}
