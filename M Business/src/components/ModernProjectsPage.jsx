import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ModernProjectDetails from './ModernProjectDetails';
import InvoiceCreator from './InvoiceCreator';
import { BASE_URL } from '../config';
import './ModernProjectsPage.css';
// ─── Avatar helpers ────────────────────────────────────────────
const AV_COLORS = ['#00BCD4', '#8B5CF6', '#F59E0B', '#26C281', '#EC4899', '#3B82F6', '#EF4444', '#10B981'];
function avColor(name, i = 0) {
  if (!name) return AV_COLORS[i % AV_COLORS.length];
  return AV_COLORS[(name.charCodeAt(0) + i) % AV_COLORS.length];
}
function initials(name) {
  if (!name) return '?';
  const p = name.trim().split(' ').filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

// ─── Status normalise ────────────────────────────────────────────
function normStatus(raw) {
  const s = (raw || '').toLowerCase().replace(/[\s_-]/g, '');
  if (['active', 'inprogress', 'inreview', 'started'].includes(s)) return { label: 'Active', cls: 'active' };
  if (['onhold', 'hold', 'paused', 'suspended'].includes(s)) return { label: 'On Hold', cls: 'onhold' };
  if (['completed', 'done', 'delivered', 'closed'].includes(s)) return { label: 'Completed', cls: 'completed' };
  if (['overdue', 'late'].includes(s)) return { label: 'Overdue', cls: 'overdue' };
  return { label: raw || 'Pending', cls: 'onhold' };
}

function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Color for progress bar ────────────────────────────────────
function progGradient(cls) {
  if (cls === 'completed') return 'linear-gradient(90deg,#26C281,#059669)';
  if (cls === 'overdue') return 'linear-gradient(90deg,#FF6B6B,#DC2626)';
  if (cls === 'onhold') return 'linear-gradient(90deg,#8B5CF6,#7C3AED)';
  return 'linear-gradient(90deg,#00BCD4,#0097A7)';
}

// ─── Empty form state ──────────────────────────────────────────
const EMPTY_FORM = {
  name: '', client: '', purpose: '', description: '',
  start: '', end: '', budget: '', currency: 'INR',
  status: 'In Progress', priority: 'medium',
  assignedTo: '', manager: '', progress: 0,
  contactPersonName: '', contactPersonNo: '',
};

// ─── Log Time empty ────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];
const EMPTY_LOG = { date: todayStr(), hours: '', task: 'General / Other', notes: '' };

export default function ModernProjectsPage({ user }) {
  // ── Data ──────────────────────────────────────────────────────
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Invoice ───────────────────────────────────────────────────
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
  const [invoicePrefill, setInvoicePrefill] = useState(null);
  const [prevActiveBeforeInvoice, setPrevActiveBeforeInvoice] = useState("dashboard");
  // ── UI state ──────────────────────────────────────────────────
  const [selectedProject, setSelectedProject] = useState(() => {
    const saved = sessionStorage.getItem('selectedProjectId');
    return saved ? { _id: saved } : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // ── Modals ────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);  // create / edit
  const [editProject, setEditProject] = useState(null); // null = create
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [showLogTime, setShowLogTime] = useState(false);
  const [logTimeProject, setLogTimeProject] = useState(null);
  const [logForm, setLogForm] = useState(EMPTY_LOG);
  const [logSaving, setLogSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, tRes, cRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/projects`),
        axios.get(`${BASE_URL}/api/tasks`),
        axios.get(`${BASE_URL}/api/clients`).catch(() => ({ data: [] })),
      ]);
      const freshProjects = Array.isArray(pRes.data) ? pRes.data : [];
      setProjects(freshProjects);
      setTasks(Array.isArray(tRes.data) ? tRes.data : []);
      setClients(Array.isArray(cRes.data) ? cRes.data : []);
      // Keep selectedProject in sync with latest backend data
      setSelectedProject(prev => {
        if (!prev) return prev;
        const updated = freshProjects.find(p => p._id === prev._id);
        if (updated) {
          sessionStorage.setItem('selectedProjectId', updated._id);
          return updated;
        }
        // If not found yet, keep prev so page doesn't reset
        return prev;
      });
    } catch (err) {
      setError('Failed to load projects. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Auto-select project from URL param ───────────────────────
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = projects.find(p => p._id === projectId);
      if (found) setSelectedProject(found);
    }
  }, [projectId, projects]);

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    all: projects.length,
    active: projects.filter(p => ['active', 'inprogress', 'inreview', 'started'].includes((p.status || '').toLowerCase().replace(/[\s_-]/g, ''))).length,
    completed: projects.filter(p => ['completed', 'done', 'delivered', 'closed'].includes((p.status || '').toLowerCase().replace(/[\s_-]/g, ''))).length,
    onhold: projects.filter(p => ['onhold', 'hold', 'paused', 'suspended'].includes((p.status || '').toLowerCase().replace(/[\s_-]/g, ''))).length,
  }), [projects]);

  // ── Filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || (p.name || '').toLowerCase().includes(q) || (p.client || '').toLowerCase().includes(q);
      if (!matchQ) return false;
      if (activeTab === 'All') return true;
      const { cls } = normStatus(p.status);
      if (activeTab === 'Active') return cls === 'active';
      if (activeTab === 'Completed') return cls === 'completed';
      if (activeTab === 'On Hold') return cls === 'onhold';
      return true;
    });
  }, [projects, searchQuery, activeTab]);

  // ── Task counts per project ───────────────────────────────────
  function tasksForProject(proj) {
    return tasks.filter(t => t.projectId === proj._id || t.project === proj.name);
  }

  // ── Open create form ──────────────────────────────────────────
  function openCreate() {
    setEditProject(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  // ── Open edit form ────────────────────────────────────────────
  function openEdit(p, e) {
    e && e.stopPropagation();
    setEditProject(p);
    setForm({
      name: p.name || '',
      client: p.client || '',
      purpose: p.purpose || '',
      description: p.description || '',
      start: p.start || '',
      end: p.end || p.deadline || '',
      budget: p.budget || '',
      currency: p.currency || '₹',
      status: p.status || 'In Progress',
      priority: p.priority || 'medium',
      assignedTo: Array.isArray(p.assignedTo) ? p.assignedTo.join(', ') : (p.assignedTo || ''),
      manager: p.manager || '',
      progress: p.progress || 0,
      contactPersonName: p.contactPersonName || '',
      contactPersonNo: p.contactPersonNo || '',
    });
    setShowForm(true);
  }

  // ── Save project ──────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo.split(',').map(s => s.trim()).filter(Boolean),
        progress: Number(form.progress) || 0,
      };
      if (editProject) {
        await axios.put(`${BASE_URL}/api/projects/${editProject._id}`, payload);
      } else {
        await axios.post(`${BASE_URL}/api/projects/add`, payload);
      }
      setShowForm(false);
      await fetchAll();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.msg || err.message));
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/api/projects/${deleteTarget._id}`);
      setDeleteTarget(null);
      if (selectedProject?._id === deleteTarget._id) { sessionStorage.removeItem('selectedProjectId'); setSelectedProject(null); navigate('/modern-projects'); }
      fetchAll();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.msg || err.message));
    } finally {
      setDeleting(false);
    }
  }

  // ── Log Work Time ─────────────────────────────────────────────
  function openLogTime(p, e) {
    e && e.stopPropagation();
    setLogTimeProject(p);
    setLogForm({ ...EMPTY_LOG, date: todayStr() });
    setShowLogTime(true);
  }

  async function handleSaveLog(e) {
    e.preventDefault();
    if (!logForm.hours) return;
    setLogSaving(true);
    try {
      const hrs = Number(logForm.hours);
      const newHours = (Number(logTimeProject.loggedHours) || 0) + hrs;
      await axios.put(`${BASE_URL}/api/projects/${logTimeProject._id}`, { loggedHours: newHours });
      setShowLogTime(false);
      // Re-fetch fresh data then sync selectedProject from updated list
      const pRes = await axios.get(`${BASE_URL}/api/projects`);
      const fresh = Array.isArray(pRes.data) ? pRes.data : [];
      setProjects(fresh);
      if (selectedProject?._id === logTimeProject._id) {
        const updated = fresh.find(p => p._id === logTimeProject._id);
        if (updated) setSelectedProject(updated);
      }
    } catch (err) {
      alert('Log failed: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLogSaving(false);
    }
  }

  // ─── Map backend project → ModernProjectDetails shape ─────────
  function toDetailShape(p) {
    const pt = tasksForProject(p);
    return {
      ...p,
      description: p.description || '',
      purpose: p.purpose || '',
      client: p.client || 'N/A',
      category: p.category || p.purpose || 'General',
      priority: p.priority || 'medium',
      manager: p.manager || '',
      contactPersonName: p.contactPersonName || '',
      contactPersonNo: p.contactPersonNo || '',
      assignedTo: Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : []),
      budget: Number(p.budget) || 0,
      currency: p.currency || 'INR',
      billed: p.billed || 0,
      received: p.received || 0,
      pending: p.pending || 0,
      spent: p.spent || 0,
      loggedHours: p.loggedHours || 0,
      milestones: p.milestones || [],
      portalSettings: p.portalSettings || {},
      _tasks: pt,
    };
  }

  // ─── RENDER: Detail view ──────────────────────────────────────
  if (selectedProject) {
    return (
      <div className="modern-app">
        <aside className="m-sidebar">
          <div className="m-logo"><span className="m-logo-mark">MBusiness</span><span className="m-logo-badge">+</span></div>
          <div className="m-profile-area">
            <div className="m-profile-avatar">{initials(user?.name || 'P')}</div>
            <div>
              <div className="m-profile-name">{user?.name || 'Admin'}</div>
              <div className="m-profile-logout" onClick={() => window.location.href = '/'}>Back Home →</div>
            </div>
          </div>
          <nav className="m-nav">
            <div className="m-nav-item"><i className="ti ti-layout-dashboard"></i>Dashboard</div>
            <div className="m-nav-label">Management</div>
            <div className="m-nav-item active" onClick={() => { sessionStorage.removeItem('selectedProjectId'); setSelectedProject(null); navigate('/modern-projects'); }} style={{ cursor: 'pointer' }}>
              <i className="ti ti-briefcase"></i>Projects<span className="m-nav-badge">{stats.all}</span>
            </div>
            <div className="m-nav-item"><i className="ti ti-users"></i>Clients</div>
            <div className="m-nav-item"><i className="ti ti-building"></i>Team</div>
            <div className="m-nav-label">Finance</div>
            <div className="m-nav-item"><i className="ti ti-receipt"></i>Invoices</div>
            <div className="m-nav-item"><i className="ti ti-settings"></i>Settings</div>
          </nav>
          <div className="m-sidebar-bottom">
            <button className="m-upload-btn" onClick={openCreate}><i className="ti ti-plus" style={{ fontSize: '15px' }}></i> New Project</button>
          </div>
        </aside>
        <div className="m-main">
          <div className="m-topbar">
            <div className="m-search-wrap"><i className="ti ti-search"></i><input type="text" placeholder="Search projects…" /></div>
            <div className="m-topbar-right">
              <div className="m-topbar-icon"><i className="ti ti-bell"></i><span className="m-notif-dot"></span></div>
              <button className="m-create-btn" onClick={openCreate}><i className="ti ti-plus" style={{ fontSize: '15px' }}></i> New Project</button>
            </div>
          </div>
          <div className="m-content">
            <ModernProjectDetails
              project={toDetailShape(selectedProject)}
              onBack={() => { sessionStorage.removeItem('selectedProjectId'); setSelectedProject(null); }}
              tasks={tasksForProject(selectedProject)}
              onUpdate={fetchAll}
              fetchProjects={fetchAll}
              onEdit={() => openEdit(selectedProject)}
              onDelete={() => setDeleteTarget(selectedProject)}
              onLogTime={(e) => openLogTime(selectedProject, e)}
              onNewInvoice={(proj, editInv, editIdx) => {
                setInvoicePrefill({ client: proj.client || '', project: proj.name || '', _t: Date.now(), ...(editInv ? { editData: editInv, editIndex: editIdx, projectId: proj._id } : {}) });
                setShowInvoiceCreator(true);
              }} />
          </div>
        </div>
        {/* Modals rendered on top */}
        {showForm && <ProjectFormModal form={form} setForm={setForm} onSave={handleSave} onClose={() => setShowForm(false)} saving={saving} isEdit={!!editProject} />}
        {deleteTarget && <DeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deleting} />}
        {showLogTime && <LogTimeModal form={logForm} setForm={setLogForm} onSave={handleSaveLog} onClose={() => setShowLogTime(false)} saving={logSaving} projectName={logTimeProject?.name} />}

        {/* ── NEW INVOICE OVERLAY ── */}
        {showInvoiceCreator && (
          <div style={{ position: 'fixed', inset: 0, background: '#F4F7FB', zIndex: 9999, overflowY: 'auto' }}>
            <InvoiceCreator
              user={user}
              clients={clients}
              projects={projects}
              newInvoicePrefill={invoicePrefill}
              onBack={() => setShowInvoiceCreator(false)}
            />
          </div>
        )}
      </div>
    );
  }
  // ─── RENDER: Projects list ─────────────────────────────────────
  return (
    <div className="modern-app">
      {/* SIDEBAR */}
      <aside className="m-sidebar">
        <div className="m-logo"><span className="m-logo-mark">MBusiness</span><span className="m-logo-badge">+</span></div>
        <div className="m-profile-area">
          <div className="m-profile-avatar">{initials(user?.name || 'P')}</div>
          <div>
            <div className="m-profile-name">{user?.name || 'Admin'}</div>
            <div className="m-profile-logout" onClick={() => window.location.href = '/'}>Back Home →</div>
          </div>
        </div>
        <nav className="m-nav">
          <div className="m-nav-item"><i className="ti ti-layout-dashboard"></i>Dashboard</div>
          <div className="m-nav-label">Management</div>
          <div className="m-nav-item active"><i className="ti ti-briefcase"></i>Projects<span className="m-nav-badge">{stats.all}</span></div>
          <div className="m-nav-item"><i className="ti ti-users"></i>Clients</div>
          <div className="m-nav-item"><i className="ti ti-building"></i>Team</div>
          <div className="m-nav-label">Finance</div>
          <div className="m-nav-item"><i className="ti ti-receipt"></i>Invoices</div>
          <div className="m-nav-item"><i className="ti ti-settings"></i>Settings</div>
        </nav>
        <div className="m-sidebar-bottom">
          <button className="m-upload-btn" onClick={openCreate}><i className="ti ti-plus" style={{ fontSize: '15px' }}></i> New Project</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="m-main">
        <div className="m-topbar">
          <div className="m-search-wrap">
            <i className="ti ti-search"></i>
            <input type="text" placeholder="Search projects…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="m-topbar-right">
            <div className="m-topbar-icon"><i className="ti ti-bell"></i><span className="m-notif-dot"></span></div>
            <button className="m-create-btn" onClick={openCreate}><i className="ti ti-plus" style={{ fontSize: '15px' }}></i> New Project</button>
          </div>
        </div>

        <div className="m-content">
          {/* Header */}
          <div className="m-page-header">
            <div>
              <div className="m-page-title">Projects</div>
              <div className="m-page-sub">Manage and track all your projects</div>
            </div>
            <div className="m-header-actions">
              <button className="m-filter-btn" onClick={fetchAll}><i className="ti ti-refresh" style={{ fontSize: '14px' }}></i> Refresh</button>
              <button className="m-create-btn" onClick={() => { setInvoicePrefill(null); setShowInvoiceCreator(true); }}><i className="ti ti-plus" style={{ fontSize: '15px' }}></i> New Invoice</button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 18px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
              <i className="ti ti-alert-circle"></i> {error}
              <button onClick={fetchAll} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
            </div>
          )}

          {/* Stats */}
          <div className="m-stats-row">
            {[
              { label: 'Total Projects', value: stats.all, icon: 'ti-briefcase', bg: '#E0F7FA', color: '#00BCD4', tab: 'All' },
              { label: 'Active', value: stats.active, icon: 'ti-loader', bg: '#FEF3C7', color: '#F59E0B', tab: 'Active' },
              { label: 'Completed', value: stats.completed, icon: 'ti-circle-check', bg: '#D1FAE5', color: '#26C281', tab: 'Completed' },
              { label: 'On Hold', value: stats.onhold, icon: 'ti-clock-pause', bg: '#FEE2E2', color: '#FF6B6B', tab: 'On Hold' },
            ].map(s => (
              <div key={s.tab} className="m-stat-card" onClick={() => setActiveTab(s.tab)} style={{ cursor: 'pointer' }}>
                <div className="m-stat-icon" style={{ background: s.bg, color: s.color }}><i className={`ti ${s.icon}`}></i></div>
                <div>
                  <div className="m-stat-num">{loading ? '…' : s.value}</div>
                  <div className="m-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="m-tabs">
              {['All', 'Active', 'Completed', 'On Hold'].map(tab => (
                <button key={tab} className={`m-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 600 }}>
              Showing {filtered.length} of {projects.length} projects
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E0F7FA', borderTopColor: '#00BCD4', animation: 'spin 0.8s linear infinite' }}></div>
              <div style={{ color: '#718096', fontSize: 13, fontWeight: 600 }}>Loading projects…</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <div className="m-projects-grid">
              {filtered.map((p, idx) => {
                const { label: statusLabel, cls } = normStatus(p.status);
                const pt = tasksForProject(p);
                const doneTasks = pt.filter(t => ['done', 'completed'].includes((t.status || '').toLowerCase())).length;
                const pct = pt.length > 0
                  ? Math.round((doneTasks / pt.length) * 100)
                  : Math.min(100, Math.max(0, p.progress || 0));
                const team = Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : []);
                const deadline = p.end || p.deadline;
                const days = daysLeft(deadline);
                const colorMap = { active: 'teal', completed: 'green', onhold: 'purple', overdue: 'red' };
                const cardColor = colorMap[cls] || 'teal';

                return (
                  <div
                    key={p._id}
                    className={`m-project-card c-${cardColor}`}
                    onClick={() => { sessionStorage.setItem('selectedProjectId', p._id); setSelectedProject(p); }}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    {/* Card actions */}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, zIndex: 2 }} onClick={e => e.stopPropagation()}>
                      <button
                        title="Log Time"
                        onClick={e => openLogTime(p, e)}
                        style={{ background: 'rgba(0,188,212,.1)', border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#00BCD4' }}
                      ><i className="ti ti-clock" style={{ fontSize: 13 }}></i></button>
                      <button
                        title="Edit"
                        onClick={e => openEdit(p, e)}
                        style={{ background: 'rgba(0,188,212,.1)', border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#00BCD4' }}
                      ><i className="ti ti-edit" style={{ fontSize: 13 }}></i></button>
                      <button
                        title="Delete"
                        onClick={e => { e.stopPropagation(); setDeleteTarget(p); }}
                        style={{ background: 'rgba(255,107,107,.1)', border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FF6B6B' }}
                      ><i className="ti ti-trash" style={{ fontSize: 13 }}></i></button>
                    </div>

                    <div className="m-pc-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="m-pc-icon" style={{ background: avColor(p.name, idx) }}>{initials(p.name)}</div>
                        <div>
                          <div className="m-pc-name">{p.name}</div>
                          <div className="m-pc-company"><i className="ti ti-building" style={{ fontSize: '11px' }}></i> {p.client || 'Internal'}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span className={`m-status-badge ${statusLabel.toLowerCase().replace(' ', '')}`}>{statusLabel}</span>
                      {p.priority && <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.priority === 'high' ? '#FEE2E2' : p.priority === 'low' ? '#D1FAE5' : '#FEF3C7', color: p.priority === 'high' ? '#DC2626' : p.priority === 'low' ? '#059669' : '#D97706' }}>{p.priority.charAt(0).toUpperCase() + p.priority.slice(1)}</span>}
                      {p.category && <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#E0F7FA', color: '#0097A7' }}>{p.category}</span>}
                    </div>

                    <div className="m-pc-desc">{p.description || p.purpose || 'No description.'}</div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                      {p.start && <span style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-calendar-event" style={{ fontSize: 12 }}></i> Start: <strong style={{ color: '#4A5568' }}>{new Date(p.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>}
                      {p.budget && <span style={{ fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-wallet" style={{ fontSize: 12 }}></i> Budget: <strong style={{ color: '#4A5568' }}>{p.currency || '₹'}{Number(p.budget).toLocaleString()}</strong></span>}
                    </div>

                    <div className="m-pc-progress-label">
                      <span className="m-pc-progress-text">Progress</span>
                      <span className="m-pc-progress-pct">{pct}%</span>
                    </div>
                    <div className="m-pc-bar">
                      <div className="m-pc-fill" style={{ width: `${pct}%`, background: progGradient(cls) }}></div>
                    </div>

                    <div className="m-pc-footer">
                      <div className="m-pc-avatars">
                        {team.length === 0
                          ? <span style={{ fontSize: 11, color: '#718096' }}>Unassigned</span>
                          : team.slice(0, 3).map((name, i) => (
                            <div key={i} className="m-pc-av" style={{ background: avColor(name, i) }} title={name}>{name.charAt(0).toUpperCase()}</div>
                          ))
                        }
                        {team.length > 3 && <div className="m-pc-av" style={{ background: '#E2E8F0', color: '#4A5568', fontSize: 9 }}>+{team.length - 3}</div>}
                      </div>
                      <div className="m-pc-deadline">
                        {deadline
                          ? <>
                            <i className="ti ti-calendar" style={{ fontSize: '11px' }}></i>
                            <span style={{ color: days !== null && days < 0 ? '#FF6B6B' : days !== null && days < 7 ? '#F59E0B' : undefined }}>
                              {fmtDate(deadline)}
                              {days !== null && days >= 0 ? ` (${days}d)` : days !== null && days < 0 ? ' Overdue' : ''}
                            </span>
                          </>
                          : <><i className="ti ti-calendar" style={{ fontSize: '11px' }}></i> TBD</>
                        }
                      </div>
                    </div>

                    {pt.length > 0 && (
                      <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(0,0,0,.06)', fontSize: 11, color: '#718096', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-checklist" style={{ fontSize: 13, color: '#00BCD4' }}></i>
                        {pt.filter(t => ['done', 'completed'].includes(t.status)).length}/{pt.length} tasks done
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add new card */}
              <div className="m-add-project-card" onClick={openCreate}>
                <div className="m-add-icon"><i className="ti ti-plus"></i></div>
                <div className="m-add-text">Add New Project</div>
                <div className="m-add-sub">Click to create a new project</div>
              </div>

              {/* Empty state */}
              {filtered.length === 0 && !loading && (
                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: '#718096' }}>
                  <i className="ti ti-layout-kanban" style={{ fontSize: 48, color: '#B2EBF2' }}></i>

                  <button className="m-create-btn" onClick={openCreate} style={{ marginTop: 8 }}><i className="ti ti-plus"></i> New Project</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {/* ── MODALS ── */}
      {showForm && <ProjectFormModal form={form} setForm={setForm} onSave={handleSave} onClose={() => setShowForm(false)} saving={saving} isEdit={!!editProject} />}
      {deleteTarget && <DeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deleting} />}
      {showLogTime && <LogTimeModal form={logForm} setForm={setLogForm} onSave={handleSaveLog} onClose={() => setShowLogTime(false)} saving={logSaving} projectName={logTimeProject?.name} />}

      {/* ── NEW INVOICE OVERLAY ── */}
      {showInvoiceCreator && (
        <div style={{ position: 'fixed', inset: 0, background: '#F4F7FB', zIndex: 9999, overflowY: 'auto' }}>
          <InvoiceCreator
            user={user}
            clients={clients}
            projects={projects}
            newInvoicePrefill={invoicePrefill}
            onBack={() => setShowInvoiceCreator(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Project Form Modal ────────────────────────────────────────
function ProjectFormModal({ form, setForm, onSave, onClose, saving, isEdit }) {
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL, maxWidth: 560 }}>
        <div style={MODAL_HDR}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}><i className="ti ti-briefcase" style={{ marginRight: 8, color: '#00BCD4' }}></i>{isEdit ? 'Edit Project' : 'New Project'}</h3>
          <button onClick={onClose} style={CLOSE_BTN}><i className="ti ti-x"></i></button>
        </div>
        <form onSubmit={onSave} style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={LBL}>Project Name *</label>
              <input style={INP} required value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. M Business v2" />
            </div>
            <div>
              <label style={LBL}>Client / Company *</label>
              <input style={INP} required value={form.client} onChange={e => f('client', e.target.value)} placeholder="e.g. YENCODE" />
            </div>
            <div>
              <label style={LBL}>Category / Purpose</label>
              <input style={INP} value={form.purpose} onChange={e => f('purpose', e.target.value)} placeholder="e.g. Web Development" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={LBL}>Description</label>
              <textarea style={{ ...INP, height: 72, resize: 'vertical' }} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Brief project description…" />
            </div>
            <div>
              <label style={LBL}>Start Date</label>
              <input style={INP} type="date" value={form.start} onChange={e => f('start', e.target.value)} />
            </div>
            <div>
              <label style={LBL}>Deadline</label>
              <input style={INP} type="date" value={form.end} onChange={e => f('end', e.target.value)} />
            </div>
            <div>
              <label style={LBL}>Budget (₹)</label>
              <input style={INP} type="number" min="0" value={form.budget} onChange={e => f('budget', e.target.value)} placeholder="e.g. 500000" />
            </div>
            <div>
              <label style={LBL}>Progress (%)</label>
              <input style={INP} type="number" min="0" max="100" value={form.progress} onChange={e => f('progress', e.target.value)} />
            </div>
            <div>
              <label style={LBL}>Status</label>
              <select style={INP} value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="In Progress">In Progress</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label style={LBL}>Priority</label>
              <select style={INP} value={form.priority} onChange={e => f('priority', e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={LBL}>Assigned To (comma-separated)</label>
              <input style={INP} value={form.assignedTo} onChange={e => f('assignedTo', e.target.value)} placeholder="e.g. Prabhu R, Yuvan S" />
            </div>
            <div>
              <label style={LBL}>Manager</label>
              <input style={INP} value={form.manager} onChange={e => f('manager', e.target.value)} placeholder="Manager name" />
            </div>
            <div>
              <label style={LBL}>Contact Person Name</label>
              <input style={INP} value={form.contactPersonName} onChange={e => f('contactPersonName', e.target.value)} placeholder="e.g. Ravi Kumar" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={LBL}>Contact Person Phone No</label>
              <input style={INP} value={form.contactPersonNo} onChange={e => f('contactPersonNo', e.target.value)} placeholder="e.g. +91 98765 43210" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={BTN_OUTLINE}>Cancel</button>
            <button type="submit" disabled={saving} style={BTN_PRIMARY}>
              {saving ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: 6 }}></i>Saving…</> : <><i className="ti ti-check"></i> {isEdit ? 'Update' : 'Create'} Project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, deleting }) {
  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL, maxWidth: 400, textAlign: 'center' }}>
        <div style={{ padding: '32px 28px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="ti ti-trash" style={{ fontSize: 26, color: '#DC2626' }}></i>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1A2332', marginBottom: 8 }}>Delete Project?</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 24 }}>Are you sure you want to delete <strong>"{name}"</strong>? This cannot be undone.</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={onCancel} style={BTN_OUTLINE}>Cancel</button>
            <button onClick={onConfirm} disabled={deleting} style={{ ...BTN_PRIMARY, background: '#DC2626', boxShadow: '0 4px 12px rgba(220,38,38,.2)' }}>
              {deleting ? 'Deleting…' : <><i className="ti ti-trash"></i> Delete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Log Work Time Modal ───────────────────────────────────────
function LogTimeModal({ form, setForm, onSave, onClose, saving, projectName }) {
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  return (
    <div style={OVERLAY}>
      <div style={{ ...MODAL, maxWidth: 460 }}>
        <div style={MODAL_HDR}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-clock" style={{ color: '#00BCD4' }}></i> Log Work Time
          </h3>
          <button onClick={onClose} style={CLOSE_BTN}><i className="ti ti-x"></i></button>
        </div>
        <form onSubmit={onSave} style={{ padding: '20px 24px' }}>
          {projectName && <div style={{ fontSize: 13, color: '#718096', marginBottom: 16, fontWeight: 600 }}>Project: <span style={{ color: '#1A2332' }}>{projectName}</span></div>}
          <div style={{ marginBottom: 14 }}>
            <label style={LBL}>DATE</label>
            <input style={INP} type="date" required value={form.date} onChange={e => f('date', e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={LBL}>HOURS</label>
            <input style={INP} type="number" min="0.5" max="24" step="0.5" required value={form.hours} onChange={e => f('hours', e.target.value)} placeholder="e.g. 3.5" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={LBL}>TASK</label>
            <select style={INP} value={form.task} onChange={e => f('task', e.target.value)}>
              {['General / Other', 'Design', 'Development', 'Testing', 'Meeting', 'Documentation', 'Deployment', 'Bug Fix'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={LBL}>NOTES</label>
            <input style={INP} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Brief note on work done…" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={BTN_OUTLINE}>Cancel</button>
            <button type="submit" disabled={saving} style={BTN_PRIMARY}>
              {saving ? 'Saving…' : <><i className="ti ti-check"></i> Save Log</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────
const OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
};
const MODAL = {
  background: '#fff', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,.18)',
  width: '100%', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Nunito,sans-serif',
};
const MODAL_HDR = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
};
const CLOSE_BTN = {
  background: '#F0F4F8', border: 'none', borderRadius: 8, width: 32, height: 32,
  cursor: 'pointer', fontSize: 16, color: '#4A5568', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const LBL = { display: 'block', fontSize: 10, fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 };
const INP = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0',
  fontSize: 14, fontFamily: 'Nunito,sans-serif', color: '#1A2332', outline: 'none', boxSizing: 'border-box',
  background: '#F7FAFC', transition: 'border .15s',
};
const BTN_PRIMARY = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
  background: '#00BCD4', color: '#fff', fontFamily: 'Nunito,sans-serif',
  fontSize: 13, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,188,212,.2)',
};
const BTN_OUTLINE = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
  background: 'transparent', border: '1.5px solid #E2E8F0',
  color: '#4A5568', fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 700,
};
