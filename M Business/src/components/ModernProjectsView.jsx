import React, { useState, useMemo } from 'react';
import './ModernProjectsPage.css';

const THEMES = {
  teal: {
    name: 'Teal',
    primary: 'var(--teal)',
    primary2: 'var(--teal2)',
    light: 'var(--teal-light)',
    lighter: 'var(--teal-lighter)',
    bg: '#F5FAFA',
    surface: '#FFFFFF',
    border: '#E0EEF0'
  },
  blue: {
    name: 'Blue',
    primary: '#2563EB',
    primary2: '#1D4ED8',
    light: '#EFF4FF',
    lighter: '#F5F8FF',
    bg: '#F5F8FF',
    surface: '#FFFFFF',
    border: '#E2E8F0'
  },
  purple: {
    name: 'Purple',
    primary: '#7C5CFC',
    primary2: '#6D28D9',
    light: '#EEE9FF',
    lighter: '#F5F3FF',
    bg: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB'
  },
  green: {
    name: 'Green',
    primary: '#26C281',
    primary2: '#059669',
    light: '#E8FAF3',
    lighter: '#ECFDF5',
    bg: '#F6FDF9',
    surface: '#FFFFFF',
    border: '#D1FAE5'
  }
};

function getInitials(name) {
  if (!name) return 'PR';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  return 'PR';
}

function getColor(name) {
  const c = ['teal', 'blue', 'purple', 'green'];
  if (!name) return c[0];
  return c[name.length % c.length];
}

export default function ModernProjectsView({ 
  projects = [], 
  onViewTasks, 
  onEdit, 
  onDelete, 
  onAssign, 
  onCreate,
  searchQuery = "",
  compact = false,
  onBack
}) {
  const [themeKey, setThemeKey] = useState('teal');
  const [activeTab, setActiveTab] = useState('All Projects');
  
  const theme = THEMES[themeKey];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const pName = (p.name || '').toLowerCase();
      const pClient = (p.client || p.company || '').toLowerCase();
      const matchesSearch = pName.includes(searchQuery.toLowerCase()) || pClient.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      const st = p.status || 'Pending';
      if (activeTab === 'All Projects') return true;
      if (activeTab === 'In Progress' && (st === 'In Progress' || st === 'Active' || st === 'In Review')) return true;
      if (activeTab === 'Completed' && st === 'Completed') return true;
      if (activeTab === 'On Hold' && (st === 'On Hold' || st === 'Pending')) return true;
      return false;
    });
  }, [projects, activeTab, searchQuery]);

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => ['In Progress', 'Active', 'In Review'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'Completed').length,
    onHold: projects.filter(p => ['On Hold', 'Pending'].includes(p.status)).length
  };

  const cssVars = {
    '--theme-primary': theme.primary,
    '--theme-primary2': theme.primary2,
    '--theme-light': theme.light,
    '--theme-lighter': theme.lighter,
    '--theme-bg': theme.bg,
    '--theme-surface': theme.surface,
    '--theme-border': theme.border,
  };

  return (
    <div className="modern-app" style={{ ...cssVars, background: 'transparent' }}>
      <div className="m-content" style={{ padding: '0', background: 'transparent', width: '100%' }}>
        
        {onBack && !compact && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={onBack} style={{ padding: "8px", background: "#E0F2FE", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 20, color: "var(--teal)", display: "flex", alignItems: "center", transition: "all 0.2s" }} title="Back to Dashboard" onMouseEnter={e => e.currentTarget.style.background = "#BAE6FD"} onMouseLeave={e => e.currentTarget.style.background = "#E0F2FE"}>
              <i className="ti ti-arrow-left"></i>
            </button>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Projects</div>
          </div>
        )}

        {/* STATS */}
        {!compact && (
          <div className="m-stats-row">
            <div className="m-stat-card" onClick={() => setActiveTab('All Projects')}>
              <div className="m-stat-icon" style={{background: 'var(--theme-light)', color: 'var(--theme-primary)'}}><i className="ti ti-briefcase"></i></div>
              <div>
                <div className="m-stat-num">{stats.total}</div>
                <div className="m-stat-label">Total Projects</div>
              </div>
            </div>
            <div className="m-stat-card" onClick={() => setActiveTab('In Progress')}>
              <div className="m-stat-icon" style={{background: 'var(--amber-bg)', color: 'var(--amber)'}}><i className="ti ti-loader"></i></div>
              <div>
                <div className="m-stat-num">{stats.inProgress}</div>
                <div className="m-stat-label">In Progress</div>
              </div>
            </div>
            <div className="m-stat-card" onClick={() => setActiveTab('Completed')}>
              <div className="m-stat-icon" style={{background: 'var(--green-bg)', color: 'var(--green)'}}><i className="ti ti-circle-check"></i></div>
              <div>
                <div className="m-stat-num">{stats.completed}</div>
                <div className="m-stat-label">Completed</div>
              </div>
            </div>
            <div className="m-stat-card" onClick={() => setActiveTab('On Hold')}>
              <div className="m-stat-icon" style={{background: 'var(--red-bg)', color: 'var(--red)'}}><i className="ti ti-clock-pause"></i></div>
              <div>
                <div className="m-stat-num">{stats.onHold}</div>
                <div className="m-stat-label">On Hold / Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* TABS */}
        {!compact && (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <div className="m-tabs">
              {['All Projects', 'In Progress', 'Completed', 'On Hold'].map(tab => (
                <button 
                  key={tab} 
                  className={`m-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{fontSize: '12px', color: 'var(--text3)', fontWeight: 600}}>
              Showing {filteredProjects.length} of {projects.length} projects
            </div>
          </div>
        )}

        {/* PROJECTS GRID */}
        <div className="m-projects-grid">
          {filteredProjects.map(p => {
            const color = getColor(p.name);
            const initials = getInitials(p.name);
            const status = p.status || 'Pending';
            let statusClass = status.toLowerCase().replace(' ', '');
            if (statusClass === 'pending') statusClass = 'onhold'; // reuse on hold color for pending
            
            const progress = p.progress || 0;
            const avatars = Array.isArray(p.assignedTo) ? p.assignedTo.map(a => (a[0]||'A').toUpperCase()).slice(0, 3) : [];
            const deadline = p.end || p.deadline || 'No Deadline';

            return (
              <div 
                key={p._id || Math.random()} 
                className={`m-project-card c-${color}`}
                onClick={() => onViewTasks && onViewTasks(p)}
                style={{ cursor: onViewTasks ? 'pointer' : 'default' }}
              >
                <div className="m-pc-top">
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div className="m-pc-icon">{initials}</div>
                    <div>
                      <div className="m-pc-name">{p.name}</div>
                      <div className="m-pc-company"><i className="ti ti-building" style={{fontSize: '11px'}}></i> {p.client || 'Internal'}</div>
                    </div>
                  </div>
                  
                  {(onEdit || onDelete || onAssign) && (
                    <div className="dropdown-wrapper" style={{position: 'relative'}} onClick={e => e.stopPropagation()}>
                      <i className="ti ti-dots-vertical m-pc-more" onClick={(e) => {
                         // A simple hack to show/hide a custom dropdown menu for actions
                         const menu = e.currentTarget.nextElementSibling;
                         if(menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                      }}></i>
                      <div className="m-action-menu" style={{display: 'none', position: 'absolute', right: 0, top: 20, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 6, zIndex: 100, minWidth: 120, overflow: 'hidden'}}>
                         {onEdit && <div style={{padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f0f0f0'}} onClick={(e) => { e.currentTarget.parentElement.style.display='none'; onEdit(p); }}>Edit Project</div>}
                         {onAssign && <div style={{padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f0f0f0'}} onClick={(e) => { e.currentTarget.parentElement.style.display='none'; onAssign(p); }}>Assign Team</div>}
                         {onDelete && <div style={{padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: 'red'}} onClick={(e) => { e.currentTarget.parentElement.style.display='none'; onDelete(p); }}>Delete</div>}
                      </div>
                    </div>
                  )}
                </div>
                
                <span className={`m-status-badge ${statusClass}`}>
                  {status}
                </span>
                
                <div className="m-pc-desc">{p.description || p.purpose || 'No description provided.'}</div>
                
                <div className="m-pc-progress-label">
                  <span className="m-pc-progress-text">Progress</span>
                  <span className="m-pc-progress-pct" style={{color: `var(--${color})`}}>{progress}%</span>
                </div>
                
                <div className="m-pc-bar">
                  <div className={`m-pc-fill ${color}`} style={{width: `${progress}%`}}></div>
                </div>
                
                <div className="m-pc-footer">
                  <div className="m-pc-avatars">
                    {avatars.length > 0 ? avatars.map((av, idx) => (
                      <div key={idx} className="m-pc-av">{av}</div>
                    )) : (
                      <span style={{fontSize: 11, color: 'var(--text3)'}}>Unassigned</span>
                    )}
                  </div>
                  <div className="m-pc-deadline">
                    {status === 'Completed' ? 
                      <><i className="ti ti-circle-check" style={{fontSize: '11px', color: 'var(--green)'}}></i> {deadline}</> : 
                      <><i className="ti ti-calendar" style={{fontSize: '11px'}}></i> {deadline}</>
                    }
                  </div>
                </div>
              </div>
            );
          })}

          {/* ADD NEW CARD */}
          {onCreate && !compact && (
            <div className="m-add-project-card" onClick={onCreate}>
              <div className="m-add-icon"><i className="ti ti-plus"></i></div>
              <div className="m-add-text">Add New Project</div>
              <div className="m-add-sub">Click to create a new project</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
