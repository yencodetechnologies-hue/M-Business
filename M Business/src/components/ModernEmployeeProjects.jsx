import React, { useState } from 'react';

const primary = ' var(--app-accent, #00BCD4)';
const primaryDark = '#0097A7';
const primaryLight = 'var(--teal-light, #E0F7FA)';
const primaryMid = '#B2EBF2';
const textDark = '#1A2332';
const textMid = '#4A5568';
const textLight = '#718096';
const bg = '#F0F4F8';
const white = '#FFFFFF';
const border = '#E2E8F0';
const green = '#26C281';
const greenLight = '#D1FAE5';
const orange = '#F59E0B';
const orangeLight = '#FEF3C7';
const red = '#FF6B6B';
const purple = '#8B5CF6';
const purpleLight = '#EDE9FE';
const radius = '14px';
const shadow = '0 2px 12px rgba(0,188,212,.08)';
const shadowLg = '0 8px 32px rgba(0,188,212,.14)';

const css = [
  '.mep-root { font-family:Nunito,sans-serif; min-height:100vh; }',
  '.mep-root * { box-sizing:border-box; }',
  '.mep-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-family:Nunito,sans-serif; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }',
  '.mep-btn-outline { background:transparent; border:1.5px solid ' + border + '; color:' + textMid + '; }',
  '.mep-btn-outline:hover { border-color:' + primary + '; color:' + primary + '; background:' + primaryLight + '; }',
  '.mep-btn-active { background:' + primary + '; border:1.5px solid ' + primary + '; color:#fff; }',
  '.mep-status-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }',
  '.mep-status-badge::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }',
  '.mep-badge-active { background:' + greenLight + '; color:#065F46; }',
  '.mep-badge-hold { background:' + orangeLight + '; color:#92400E; }',
  '.mep-badge-completed { background:#DBEAFE; color:#1E40AF; }',
  '.mep-progress-bg { background:' + bg + '; border-radius:20px; height:8px; overflow:hidden; }',
  '.mep-progress-fill { height:100%; border-radius:20px; background:linear-gradient(90deg,' + primary + ',' + primaryDark + '); }',
  '.mep-progress-fill.g { background:linear-gradient(90deg,' + green + ',#059669); }',
  '.mep-progress-fill.p { background:linear-gradient(90deg,' + purple + ',#7C3AED); }',
  '.mep-welcome { background:linear-gradient(135deg,' + primary + ',' + primaryDark + '); border-radius:' + radius + '; padding:22px 26px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; }',
  '.mep-welcome h2 { font-size:19px; font-weight:900; color:#fff; margin:0; }',
  '.mep-welcome p { font-size:13px; color:rgba(255,255,255,.8); margin:3px 0 0; }',
  '.mep-ws { text-align:center; }',
  '.mep-ws .mep-n { font-size:22px; font-weight:900; color:#fff; }',
  '.mep-ws .mep-l { font-size:11px; color:rgba(255,255,255,.75); font-weight:600; }',
  '.mep-epc { background:' + white + '; border-radius:' + radius + '; box-shadow:' + shadow + '; overflow:hidden; cursor:pointer; transition:all .2s; border:2px solid transparent; margin-bottom:16px; }',
  '.mep-epc:hover { transform:translateY(-2px); box-shadow:' + shadowLg + '; border-color:' + primaryMid + '; }',
  '.mep-epc-stripe { height:4px; }',
  '.mep-epc-body { padding:18px 20px; }',
  '.mep-epc-row1 { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }',
  '.mep-epc-title { font-size:15px; font-weight:800; color:' + textDark + '; flex:1; margin-right:10px; }',
  '.mep-epc-client { font-size:12px; color:' + textLight + '; display:flex; align-items:center; gap:5px; margin-bottom:12px; }',
  '.mep-epc-client i { color:' + primary + '; font-size:13px; }',
  '.mep-tasks-lbl { font-size:10px; font-weight:800; color:' + textLight + '; text-transform:uppercase; letter-spacing:.7px; margin-bottom:8px; }',
  '.mep-mt-row { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid ' + bg + '; }',
  '.mep-mt-row:last-child { border-bottom:none; }',
  '.mep-mt-chk { width:17px; height:17px; border-radius:5px; border:2px solid ' + border + '; flex-shrink:0; }',
  '.mep-mt-chk.ip { border-color:' + primary + '; }',
  '.mep-mt-chk.done { background:' + green + '; border-color:' + green + '; }',
  '.mep-mt-name { flex:1; font-size:12px; font-weight:700; color:' + textDark + '; }',
  '.mep-mt-name.done { text-decoration:line-through; color:' + textLight + '; }',
  '.mep-mt-due { font-size:11px; font-weight:600; color:' + textLight + '; }',
  '.mep-mt-due.late { color:' + red + '; }',
  '.mep-epc-foot { background:' + bg + '; padding:11px 20px; display:flex; align-items:center; justify-content:space-between; }',
  '.mep-ep-pbar { flex:1; margin-right:14px; }',
  '.mep-ep-pbar-row { display:flex; justify-content:space-between; margin-bottom:5px; }',
  '.mep-ep-pbar-lbl { font-size:11px; color:' + textLight + '; font-weight:600; }',
  '.mep-ep-pbar-pct { font-size:12px; font-weight:800; color:' + textDark + '; }',
  '.mep-ep-deadline { text-align:right; }',
  '.mep-ep-dl-lbl { font-size:10px; color:' + textLight + '; font-weight:600; text-transform:uppercase; }',
  '.mep-ep-dl-val { font-size:12px; font-weight:700; color:' + textDark + '; }',
].join('\n');

const STRIPES = [
  { bg: 'linear-gradient(90deg, var(--app-accent, #00BCD4),#0097A7)', cls: '' },
  { bg: 'linear-gradient(90deg,#8B5CF6,#7C3AED)', cls: 'p' },
  { bg: 'linear-gradient(90deg,#26C281,#059669)', cls: 'g' },
];

function badgeProps(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('hold')) return { cls: 'mep-badge-hold', txt: 'On Hold' };
  if (s === 'done' || s === 'completed') return { cls: 'mep-badge-completed', txt: 'Completed' };
  return { cls: 'mep-badge-active', txt: 'Active' };
}

function calcPct(p, pTasks) {
  const s = (p.status || '').toLowerCase();
  if (s === 'done' || s === 'completed') return 100;
  if (pTasks.length > 0) {
    const done = pTasks.filter(t => ['done', 'completed'].includes((t.status || '').toLowerCase())).length;
    return Math.round((done / pTasks.length) * 100);
  }
  if (s === 'in progress') return 50;
  if (s === 'on hold') return 30;
  return p.progress || 0;
}

export default function ModernEmployeeProjects({ projects, tasks, user, onViewProject }) {
  const [filter, setFilter] = useState('active');

  const isDoneStatus = s => ['done', 'completed'].includes((s || '').toLowerCase());

  const activeCount = projects.filter(p => !isDoneStatus(p.status)).length;
  const completedCount = projects.filter(p => isDoneStatus(p.status)).length;
  const pendingTasks = tasks.filter(t => !isDoneStatus(t.status)).length;
  const loggedHours = projects.reduce((a, p) => a + (p.loggedHours || 0), 0);

  const firstName = (user?.name || 'Employee').split(' ')[0];

  const list = projects.filter(p => {
    if (filter === 'active') return !isDoneStatus(p.status);
    if (filter === 'completed') return isDoneStatus(p.status);
    return true;
  });

  return (
    <div className="mep-root">
      <style>{css}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: textDark, margin: 0 }}>My Projects</h1>
      </div>

      <div className="mep-welcome">
        <div>
          <h2>Good morning, {firstName}! </h2>
          <p>{activeCount} active projects · {pendingTasks} tasks due</p>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div className="mep-ws"><div className="mep-n">{activeCount}</div><div className="mep-l">Projects</div></div>
          <div className="mep-ws"><div className="mep-n">{pendingTasks}</div><div className="mep-l">My Tasks</div></div>
          <div className="mep-ws"><div className="mep-n">{loggedHours}h</div><div className="mep-l">This Month</div></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[
          { key: 'active', label: 'Active (' + activeCount + ')' },
          { key: 'all', label: 'All Projects' },
          { key: 'completed', label: 'Completed (' + completedCount + ')' },
        ].map(btn => (
          <button
            key={btn.key}
            className={'mep-btn ' + (filter === btn.key ? 'mep-btn-active' : 'mep-btn-outline')}
            onClick={() => setFilter(btn.key)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div>
        {list.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: textLight, fontSize: 14 }}>
            No projects found.
          </div>
        ) : (
          list.map((p, idx) => {
            const stripe = STRIPES[idx % STRIPES.length];
            const badge = badgeProps(p.status);
            const pTasks = tasks.filter(t => t.project === p.name || t.projectId === p._id || t.projectId === p.id);
            const pct = calcPct(p, pTasks);
            const show = pTasks.slice(0, 3);

            return (
              <div key={p._id || idx} className="mep-epc" onClick={() => onViewProject && onViewProject(p)}>
                <div className="mep-epc-stripe" style={{ background: stripe.bg }}></div>
                <div className="mep-epc-body">
                  <div className="mep-epc-row1">
                    <div className="mep-epc-title">{p.name}</div>
                    <span className={'mep-status-badge ' + badge.cls}>{badge.txt}</span>
                  </div>
                  <div className="mep-epc-client">
                    <i className="ti ti-building"></i>
                    {p.client || 'Internal Project'}
                  </div>

                  {show.length > 0 && (
                    <>
                      <div className="mep-tasks-lbl">My Tasks</div>
                      {show.map((t, i) => {
                        const done = isDoneStatus(t.status);
                        const ip = (t.status || '').toLowerCase() === 'in progress';
                        return (
                          <div key={i} className="mep-mt-row">
                            <div className={'mep-mt-chk' + (done ? ' done' : ip ? ' ip' : '')}></div>
                            <div className={'mep-mt-name' + (done ? ' done' : '')}>{t.name || t.title}</div>
                            <div className={'mep-mt-due' + (done ? '' : '')} style={done ? { color: green } : {}}>
                              {done ? 'Done' : (t.due || t.dueDate || '—')}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                <div className="mep-epc-foot">
                  <div className="mep-ep-pbar">
                    <div className="mep-ep-pbar-row">
                      <span className="mep-ep-pbar-lbl">Progress</span>
                      <span className="mep-ep-pbar-pct">{pct}%</span>
                    </div>
                    <div className="mep-progress-bg">
                      <div className={'mep-progress-fill ' + stripe.cls} style={{ width: pct + '%' }}></div>
                    </div>
                  </div>
                  <div className="mep-ep-deadline">
                    <div className="mep-ep-dl-lbl">Deadline</div>
                    <div className="mep-ep-dl-val">{p.deadline || p.end || '—'}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
