import React, { useState, useMemo } from 'react';

// ── Colour palette (matches M Business design system) ----------
const P = {
  primary: ' var(--app-accent, var(--app-accent, #00BCD4))',
  primaryDark: '#0097A7',
  primaryLight: 'var(--teal-light, var(--teal-light, #E0F7FA))',
  primaryMid: '#B2EBF2',
  textDark: '#1A2332',
  textMid: '#4A5568',
  textLight: '#718096',
  bg: '#F0F4F8',
  white: '#FFFFFF',
  border: '#E2E8F0',
  green: '#26C281',
  greenLight: '#D1FAE5',
  orange: '#F59E0B',
  orangeLight: '#FEF3C7',
  red: '#FF6B6B',
  redLight: '#FEE2E2',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
};

// Avatar colour palette
const AV_COLORS = [' var(--app-accent, var(--app-accent, #00BCD4))', '#8B5CF6', '#F59E0B', '#26C281', '#EC4899', '#3B82F6', '#EF4444', '#10B981'];

function getAvColor(name, idx) {
  if (!name) return AV_COLORS[idx % AV_COLORS.length];
  return AV_COLORS[(name.charCodeAt(0) + idx) % AV_COLORS.length];
}

function getInitials2(name) {
  if (!name) return '??';
  const p = name.trim().split(' ').filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// Normalise backend status  display label + badge class
function normaliseStatus(raw) {
  const s = (raw || '').toLowerCase().replace(/[\s_-]/g, '');
  if (['active', 'inprogress', 'inreview', 'started'].includes(s)) return { label: 'Active', cls: 'active' };
  if (['onhold', 'hold', 'paused', 'suspended'].includes(s)) return { label: 'On Hold', cls: 'hold' };
  if (['completed', 'done', 'delivered', 'closed'].includes(s)) return { label: 'Completed', cls: 'completed' };
  if (['overdue', 'late'].includes(s)) return { label: 'Overdue', cls: 'overdue' };
  return { label: raw || 'Pending', cls: 'hold' };
}

// Progress bar colour
function progColor(statusCls) {
  if (statusCls === 'completed') return `linear-gradient(90deg,${P.green},#059669)`;
  if (statusCls === 'overdue') return `linear-gradient(90deg,${P.red},#DC2626)`;
  if (statusCls === 'hold') return `linear-gradient(90deg,${P.purple},#7C3AED)`;
  return `linear-gradient(90deg,${P.primary},${P.primaryDark})`;
}

// Deadline colour
function deadlineColor(dateStr, statusCls) {
  if (statusCls === 'overdue' || statusCls === 'completed') return statusCls === 'completed' ? '#059669' : P.red;
  if (!dateStr) return P.textMid;
  const d = new Date(dateStr);
  const diff = (d - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return P.red;
  if (diff < 14) return P.orange;
  return P.textDark;
}

function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Inline CSS -------------------------------------------------
const CSS = `
.mpv-root { font-family:'Nunito',sans-serif; }
.mpv-root * { box-sizing:border-box; }

/* KPI */
.mpv-kpi-grid {
  display:grid;
  grid-template-columns:repeat(6,minmax(0,1fr));
  gap:14px;
  margin-bottom:22px;
}
.mpv-kpi { background:#fff; border-radius:14px; padding:16px 18px; box-shadow:0 2px 12px rgba(0,188,212,.08);
  display:flex; align-items:center; gap:12px; cursor:pointer; transition:all .18s;
  border:2px solid transparent; }
.mpv-kpi:hover,.mpv-kpi.active { border-color:${P.primary}; transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,188,212,.14); }
.mpv-kpi-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.mpv-kpi-icon i { font-size:20px; }
.mpv-kpi-num { font-size:22px; font-weight:900; color:${P.textDark}; line-height:1; }
.mpv-kpi-lbl { font-size:11px; color:${P.textLight}; font-weight:600; margin-top:2px; }

/* Toolbar */
.mpv-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.mpv-search { display:flex; align-items:center; gap:8px; background:#fff; border:1.5px solid ${P.border};
  border-radius:10px; padding:9px 14px; flex:1; min-width:200px; max-width:340px; transition:border .15s; }
.mpv-search:focus-within { border-color:${P.border}; }
.mpv-search i { color:${P.textLight}; font-size:17px; }
.mpv-search input { border:none; outline:none; box-shadow:none; background:#fff; -webkit-appearance:none; appearance:none; font-family:'Nunito',sans-serif; font-size:14px; width:100%; color:${P.textDark}; }
.mpv-search input:focus { border:none; outline:none; box-shadow:none; background:#fff; }
.mpv-search input:-webkit-autofill { -webkit-box-shadow:0 0 0 30px #fff inset !important; box-shadow:0 0 0 30px #fff inset !important; }
.mpv-sel { padding:9px 14px; border:1.5px solid ${P.border}; border-radius:10px; font-family:'Nunito',sans-serif;
  font-size:13px; font-weight:600; color:${P.textMid}; background:#fff; outline:none; cursor:pointer; }
.mpv-sel:focus { border-color:${P.primary}; }
.mpv-view-btns { display:flex; border:1.5px solid ${P.border}; border-radius:10px; overflow:hidden; background:#fff; }
.mpv-vb { padding:8px 11px; cursor:pointer; background:transparent; border:none; font-size:17px; color:${P.textLight}; transition:all .15s; }
.mpv-vb.on,.mpv-vb:hover { background:${P.primaryLight}; color:${P.primary}; }

/* Grid */
.mpv-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
  overflow:visible;
}
.mpv-grid.list { grid-template-columns:1fr; }

/* Project Card */
.mpv-card {
  background:#fff;
  border-radius:14px;
  box-shadow:0 2px 12px rgba(0,188,212,.08);
  overflow:visible;
  position:relative;
  cursor:pointer;
  border:2px solid transparent;
  transition:all .2s;
}
.mpv-card:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,188,212,.14); border-color:${P.primaryMid}; }
.mpv-card-top { padding:18px 18px 0; }
.mpv-card-row1 { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.mpv-card-title { font-size:15px; font-weight:800; color:${P.textDark}; margin-bottom:5px; line-height:1.3; }
.mpv-card-client { font-size:12px; color:${P.textLight}; display:flex; align-items:center; gap:5px; margin-bottom:12px; }
.mpv-card-client i { color:${P.primary}; font-size:13px; }
.mpv-prog-row { display:flex; justify-content:space-between; margin-bottom:5px; }
.mpv-pct { font-size:13px; font-weight:800; color:${P.textDark}; }
.mpv-pct-lbl { font-size:11px; color:${P.textLight}; font-weight:600; }
.mpv-prog-bg { background:${P.bg}; border-radius:20px; height:8px; overflow:hidden; margin-bottom:0; }
.mpv-prog-fill { height:100%; border-radius:20px; }
.mpv-divider { height:1px; background:${P.bg}; margin:0 18px; }
.mpv-card-bottom { padding:12px 18px; display:flex; align-items:center; justify-content:space-between; }
.mpv-team-stack { display:flex; }
.mpv-team-stack .mpv-av { border:2px solid #fff; margin-right:-8px; }
.mpv-av-extra { width:26px; height:26px; border-radius:50%; border:2px solid #fff;
  background:${P.bg}; font-size:9px; font-weight:800; color:${P.textMid};
  display:flex; align-items:center; justify-content:center; }
.mpv-deadline { text-align:right; }
.mpv-dl-lbl { font-size:10px; color:${P.textLight}; font-weight:600; text-transform:uppercase; }
.mpv-dl-val { font-size:12px; font-weight:700; }
.mpv-tasks { font-size:11px; color:${P.textLight}; display:flex; align-items:center; gap:4px; margin-top:5px; }
.mpv-tasks i { color:${P.primary}; font-size:13px; }

/* Status badges */
.mpv-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }
.mpv-badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; }
.mpv-badge.active { background:${P.greenLight}; color:#065F46; }
.mpv-badge.hold { background:${P.orangeLight}; color:#92400E; }
.mpv-badge.completed { background:#DBEAFE; color:#1E40AF; }
.mpv-badge.overdue { background:${P.redLight}; color:#991B1B; }

/* Priority badges */
.mpv-prio { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.mpv-prio.high { background:${P.redLight}; color:#DC2626; }
.mpv-prio.medium { background:${P.orangeLight}; color:#D97706; }
.mpv-prio.low { background:${P.greenLight}; color:#059669; }

/* Avatar */
.mpv-av { width:26px; height:26px; border-radius:50%; display:flex; align-items:center;
  justify-content:center; font-size:9px; font-weight:800; color:#fff; flex-shrink:0; }

/* Action menu */
.mpv-more-btn { background:none; border:none; cursor:pointer; color:${P.textLight}; font-size:18px;
  padding:2px 6px; border-radius:6px; transition:all .15s; line-height:1; }
.mpv-more-btn:hover { background:${P.bg}; color:${P.primary}; }
.mpv-menu {
  position:absolute;
  right:0;
  top:35px;
  background:#fff;
  border:1.5px solid ${P.border};
  border-radius:10px;
  box-shadow:0 8px 24px rgba(0,0,0,.1);
  z-index:9999;
  min-width:140px;
  overflow:hidden;
}
.mpv-menu-item { padding:9px 14px; font-size:13px; font-weight:600; cursor:pointer; color:${P.textMid};
  display:flex; align-items:center; gap:8px; transition:all .12s; border-bottom:1px solid ${P.bg}; }
.mpv-menu-item:last-child { border-bottom:none; }
.mpv-menu-item:hover { background:${P.primaryLight}; color:${P.primary}; }
.mpv-menu-item.danger { color:${P.red}; }
.mpv-menu-item.danger:hover { background:${P.redLight}; }

/* List view overrides */
.mpv-grid.list .mpv-card { display:grid; grid-template-columns:1fr auto; }
.mpv-grid.list .mpv-card-top { display:flex; align-items:center; gap:20px; padding:14px 18px; }
.mpv-grid.list .mpv-card-title { margin-bottom:2px; font-size:14px; }
.mpv-grid.list .mpv-card-client { margin-bottom:0; }
.mpv-grid.list .mpv-card-info { flex:1; }
.mpv-grid.list .mpv-card-prog { min-width:200px; }
.mpv-grid.list .mpv-divider { display:none; }
.mpv-grid.list .mpv-card-bottom { flex-direction:column; align-items:flex-end; gap:6px; padding:14px 18px; border-left:1px solid ${P.border}; }

/* Empty */
.mpv-empty { display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:12px; padding:60px 20px; color:${P.textLight}; }
.mpv-empty i { font-size:48px; color:${P.primaryMid}; }
.mpv-empty-title { font-size:16px; font-weight:800; color:${P.textMid}; }
.mpv-empty-sub { font-size:13px; }

@media(max-width:900px){
  .mpv-kpi-grid { grid-template-columns:repeat(3,1fr); }
  .mpv-grid { grid-template-columns:repeat(2,1fr); }
}
@media(max-width:600px){
  .mpv-kpi-grid { grid-template-columns:repeat(2,1fr); }
  .mpv-grid { grid-template-columns:1fr; }
}
`;
export default function ModernProjectsView({
  projects = [],
  onViewTasks,
  onClickProject,
  onEdit,
  onDelete,
  onAssign,
  onNewInvoice,
  onAddProject,
  searchQuery = '',
}) {
  const [search, setSearch] = useState(searchQuery);
  const [statusFilter, setStatus] = useState('all');
  const [sortBy, setSort] = useState('newest');
  const [view, setView] = useState('grid');
  const [openMenu, setOpenMenu] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Closemenu on outside click
  React.useEffect(() => {
    const close = () => setOpenMenu(null);

    document.addEventListener('mousedown', close);

    return () => {
      document.removeEventListener('mousedown', close);
    };
  }, []);

  // Inject CSS once on mount
  React.useEffect(() => {
    const id = 'mpv-style';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }
  }, []);

  // KPI counts
  const counts = useMemo(() => {
    const all = projects.length;
    let active = 0, hold = 0, completed = 0, overdue = 0;
    const budgetByCurrency = {};
    projects.forEach(p => {
      const { cls } = normaliseStatus(p.status);
      if (cls === 'active') active++;
      else if (cls === 'hold') hold++;
      else if (cls === 'completed') completed++;
      else if (cls === 'overdue') overdue++;
      const curr = p.currency || '₹';
      budgetByCurrency[curr] = (budgetByCurrency[curr] || 0) + (Number(p.budget) || 0);
    });
    return { all, active, hold, completed, overdue, budgetByCurrency };
  }, [projects]);

  // Filter + Sort
  const displayed = useMemo(() => {
    let list = projects.filter(p => {
      const q = search.toLowerCase();
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const clientMatch = (p.client || '').toLowerCase().includes(q);
      if (!nameMatch && !clientMatch) return false;
      if (statusFilter === 'all') return true;
      return normaliseStatus(p.status).cls === statusFilter;
    });

    if (sortBy === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'deadline') {
      list = [...list].sort((a, b) => new Date(a.end || a.deadline || '9999') - new Date(b.end || b.deadline || '9999'));
    } else if (sortBy === 'progress') {
      list = [...list].sort((a, b) => (b.progress || 0) - (a.progress || 0));
    }
    return list;
  }, [projects, search, statusFilter, sortBy]);

  // Reset page on filter/search change
  React.useEffect(() => { setPage(1); }, [search, statusFilter, sortBy]);

  const totalPages = Math.ceil(displayed.length / perPage);
  const paginated = displayed.slice((page - 1) * perPage, page * perPage);

  const KPI_ITEMS = [
    { key: 'all', label: 'All Projects', count: counts.all, icon: 'ti-layout-kanban', iconBg: P.primaryLight, iconColor: P.primary },
    { key: 'active', label: 'Active', count: counts.active, icon: 'ti-player-play', iconBg: P.greenLight, iconColor: P.green },
    { key: 'hold', label: 'On Hold', count: counts.hold, icon: 'ti-player-pause', iconBg: P.orangeLight, iconColor: P.orange },
    { key: 'completed', label: 'Completed', count: counts.completed, icon: 'ti-circle-check', iconBg: '#DBEAFE', iconColor: '#2563EB' },
    { key: 'overdue', label: 'Overdue', count: counts.overdue, icon: 'ti-alert-triangle', iconBg: P.redLight, iconColor: P.red },
    { key: 'budget', label: 'Overall Value', budgetByCurrency: counts.budgetByCurrency, icon: 'ti-currency-rupee', iconBg: P.purpleLight, iconColor: P.purple, isCurrency: true },
  ];

  return (
    <div className="mpv-root">
      {/* CSS injected once via useEffect above */}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        <div className="mpv-kpi-grid">
          {KPI_ITEMS.map(k => (
            <div
              key={k.key}
              className={`mpv-kpi${statusFilter === k.key ? ' active' : ''}`}
              onClick={() => k.key !== 'budget' && setStatus(k.key)}
              style={{ cursor: k.key === 'budget' ? 'default' : 'pointer' }}
            >
              <div className="mpv-kpi-icon" style={{ background: k.iconBg }}>
                <i className={`ti ${k.icon}`} style={{ color: k.iconColor }} />
              </div>
              {k.isCurrency ? (
                <div>
                  {Object.entries(k.budgetByCurrency || {}).map(([currency, amount]) => (
                    <div key={currency} className="mpv-kpi-num" style={{ fontSize: 18, lineHeight: 1.3 }}>
                      {`${currency}${amount >= 10000000
                        ? (amount / 10000000).toFixed(1) + 'Cr'
                        : amount >= 100000
                          ? (amount / 100000).toFixed(1) + 'L'
                          : amount.toLocaleString('en-IN')}`}
                    </div>
                  ))}
                  <div className="mpv-kpi-lbl">{k.label}</div>
                </div>
              ) : (
                <div>
                  <div className="mpv-kpi-num">{k.count}</div>
                  <div className="mpv-kpi-lbl">{k.label}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="mpv-toolbar">
        <div className="mpv-search">
          <i className="ti ti-search" />
          <input
            placeholder="Search projects or clients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="mpv-sel" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>

        <select className="mpv-sel" value={sortBy} onChange={e => setSort(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="deadline">By Deadline</option>
          <option value="progress">By Progress</option>
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: P.textLight, fontWeight: 600 }}>
            {paginated.length} of {displayed.length} projects
          </span>
          <div className="mpv-view-btns">
            <button
              className={`mpv-vb${view === 'grid' ? ' on' : ''}`}
              onClick={() => setView('grid')}
              title="Grid view"
            >
              <i className="ti ti-layout-grid" />
            </button>
            <button
              className={`mpv-vb${view === 'list' ? ' on' : ''}`}
              onClick={() => setView('list')}
              title="List view"
            >
              <i className="ti ti-list" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Project Cards ── */}
      {displayed.length === 0 ? (
        <div className="mpv-empty">
          <div style={{ fontSize: 14, fontWeight: 700, color: '#718096' }}>No projects found</div>
        </div>
      ) : (
        <div className={`mpv-grid${view === 'list' ? ' list' : ''}`}>
          {paginated.map(p => {
            const { label: statusLabel, cls: statusCls } = normaliseStatus(p.status);
            const pct = Math.min(100, Math.max(0, p.progress || 0));
            const deadline = p.end || p.deadline;
            const dlColor = deadlineColor(deadline, statusCls);
            const team = Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : []);
            const prio = (p.priority || 'medium').toLowerCase();
            const prioLabel = prio.charAt(0).toUpperCase() + prio.slice(1);
            const isMenuOpen = openMenu === (p._id || p.id);

            // Task count from tasks prop (passed via parent if available)
            const taskText = p.taskCount != null
              ? `${p.doneCount || 0}/${p.taskCount} tasks`
              : (p.tasks || '');

            return (
              <div
                key={p._id || p.id || Math.random()}
                className="mpv-card"
                style={{
                  zIndex: isMenuOpen ? 9999 : 1
                }}
                onClick={() => onClickProject ? onClickProject(p) : (onViewTasks && onViewTasks(p))}
              >
                <div className="mpv-card-top">
                  {/* Row 1: status badge + priority + action menu */}
                  <div className="mpv-card-row1">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`mpv-badge ${statusCls}`}>{statusLabel}</span>
                      {p.category && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: P.primary, background: P.primaryLight, padding: '3px 8px', borderRadius: 20 }}>
                          {p.category}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`mpv-prio ${prio}`}>{prioLabel}</span>
                      {(onEdit || onDelete || onAssign || onNewInvoice) && (
                        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                          <button
                            className="mpv-more-btn"
                            onClick={() => setOpenMenu(isMenuOpen ? null : (p._id || p.id))}
                          >
                            <i className="ti ti-dots-vertical" />
                          </button>
                          {isMenuOpen && (
                            <div className="mpv-menu" onMouseDown={e => e.stopPropagation()}>
                              {onEdit && (
                                <div className="mpv-menu-item" onClick={() => { setOpenMenu(null); onEdit(p); }}>
                                  <i className="ti ti-edit" /> Edit Project
                                </div>
                              )}
                              {onAssign && (
                                <div className="mpv-menu-item" onClick={() => { setOpenMenu(null); onAssign(p); }}>
                                  <i className="ti ti-user-plus" /> Assign Team
                                </div>
                              )}
                              {onViewTasks && (
                                <div className="mpv-menu-item" onClick={() => { setOpenMenu(null); onViewTasks(p); }}>
                                  <i className="ti ti-checklist" /> View Tasks
                                </div>
                              )}

                              <div className="mpv-menu-item danger" onClick={() => {
                                setOpenMenu(null);
                                if (onDelete) {
                                  onDelete(p);
                                } else {
                                  if (window.confirm(`Delete project "${p.name}"?`)) {
                                    alert('Please pass an onDelete prop to ModernProjectsView to handle deletion.');
                                  }
                                }
                              }}>
                                <i className="ti ti-trash" /> Delete Project
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project name + client */}
                  {view === 'list' ? (
                    <div className="mpv-card-info">
                      <div className="mpv-card-title">{p.name}</div>
                      <div className="mpv-card-client"><i className="ti ti-building" />{p.client || 'Internal'}</div>
                      {p.description && (
                        <div style={{ fontSize: 11, color: P.textLight, marginTop: 3, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                          {p.description}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mpv-card-title">{p.name}</div>
                      <div className="mpv-card-client"><i className="ti ti-building" />{p.client || 'Internal'}</div>
                      {p.description && (
                        <div style={{ fontSize: 11.5, color: P.textLight, marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {p.description}
                        </div>
                      )}
                    </>
                  )}

                  {/* Progress bar */}
                  <div className={view === 'list' ? 'mpv-card-prog' : ''}>
                    <div className="mpv-prog-row">
                      <span className="mpv-pct-lbl">Progress</span>
                      <span className="mpv-pct">{pct}%</span>
                    </div>
                    <div className="mpv-prog-bg">
                      <div
                        className="mpv-prog-fill"
                        style={{ width: `${pct}%`, background: progColor(statusCls) }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mpv-divider" />

                {/* Bottom row: team avatars + dates + budget + deadline */}
                <div className="mpv-card-bottom">
                  <div>
                    <div className="mpv-team-stack">
                      {team.length === 0 && (
                        <span style={{ fontSize: 11, color: P.textLight }}>Unassigned</span>
                      )}
                      {team.slice(0, 3).map((name, i) => (
                        <div
                          key={i}
                          className="mpv-av"
                          style={{ background: getAvColor(name, i) }}
                          title={name}
                        >
                          {getInitials2(name).charAt(0)}
                        </div>
                      ))}
                      {team.length > 3 && (
                        <div className="mpv-av-extra">+{team.length - 3}</div>
                      )}
                    </div>
                    {taskText && (
                      <div className="mpv-tasks">
                        <i className="ti ti-checklist" />
                        {taskText}
                      </div>
                    )}
                    {/* Start Date */}
                    {p.start && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11, color: P.textLight, fontWeight: 600 }}>
                        <i className="ti ti-calendar-event" style={{ color: P.primary, fontSize: 12 }} />
                        Start: {fmtDate(p.start)}
                      </div>
                    )}
                    {/* Budget */}
                    {p.budget && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: '#059669', fontWeight: 700 }}>

                        Budget: {p.currency || '₹'}{Number(p.budget).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div className="mpv-deadline">
                    <div className="mpv-dl-lbl">
                      {statusCls === 'completed' ? 'Delivered' : 'Deadline'}
                    </div>
                    <div className="mpv-dl-val" style={{ color: dlColor }}>
                      {fmtDate(deadline)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingBottom: 12 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${P.border}`, background: page === 1 ? P.bg : '#fff', color: page === 1 ? P.textLight : P.textDark, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Nunito',sans-serif" }}
          > Prev</button>
          <span style={{ fontSize: 12, color: P.textLight, fontWeight: 700 }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${P.border}`, background: page === totalPages ? P.bg : '#fff', color: page === totalPages ? P.textLight : P.textDark, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Nunito',sans-serif" }}
          >Next </button>
        </div>
      )}
    </div>
  );
}
