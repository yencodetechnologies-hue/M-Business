import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from "../config";

export default function EmployeeDetail({ emp, onBack, onEdit, onDelete, onDeactivate, onChangeRole, empDocs, empDocsLoading, projects = [], tasks = [], onViewProject }) {
  if (!emp) return null;

  const [taskTab, setTaskTab] = useState('all');

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const empId = emp.employeeId || emp._id?.substring(0, 6).toUpperCase() || "—";

  // Tenure calculation
  const joinedDate = emp.joiningDate ? new Date(emp.joiningDate) : (emp.createdAt ? new Date(emp.createdAt) : null);
  const now = new Date();
  let tenure = "—";
  if (joinedDate) {
    const diffDays = Math.ceil(Math.abs(now - joinedDate) / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    tenure = years > 0 ? `${years} yr ${months} mo` : `${months} mo`;
  }

  // Projects state — filtered to only this employee's assigned projects
  const [staticProjects, setStaticProjects] = useState([]);

  useEffect(() => {
    if (!emp) return;
    const empName = (emp.name || '').toLowerCase().trim();
    const empId = emp._id || emp.employeeId || '';
    const filtered = (projects || []).filter(p => {
      const assigned = p.assignedTo || p.team || '';
      if (Array.isArray(assigned)) {
        return assigned.some(a =>
          (typeof a === 'string' && (a.toLowerCase().includes(empName) || a === empId)) ||
          (a?._id && a._id === empId) ||
          (a?.name && a.name.toLowerCase().includes(empName))
        );
      }
      if (typeof assigned === 'string') {
        return assigned.toLowerCase().includes(empName) || assigned.includes(empId);
      }
      return false;
    });
    setStaticProjects(filtered);
  }, [emp, projects]);

  const activeProjects = staticProjects.filter(p => (p.status || '').toLowerCase() !== 'completed');
  const totalWorkload = staticProjects.length > 0
    ? Math.round(staticProjects.reduce((sum, p) => sum + (p.progress || p.percentage || 0), 0) / staticProjects.length)
    : 0;

  const projIcons = ['ti-world', 'ti-device-mobile', 'ti-chart-bar', 'ti-code', 'ti-building', 'ti-rocket'];
  const projColors = [
    { bg: '#F0FDFE', color: '#00BCD4' },
    { bg: '#EEF2FF', color: '#6366F1' },
    { bg: '#ECFDF5', color: '#10B981' },
    { bg: '#FFF7ED', color: '#F59E0B' },
    { bg: '#FDF4FF', color: '#A855F7' },
    { bg: '#FFF1F2', color: '#EF4444' },
  ];

  // Tasks state
  const [staticTasks, setStaticTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const loadTasks = async () => {
    if (!emp?.name) return;
    setTasksLoading(true);
    try {
      const companyId = emp.companyId || "";
      const headers = {};
      if (companyId) headers['x-company-id'] = companyId;
      const res = await axios.get(`${BASE_URL}/api/employee-dashboard/tasks/${encodeURIComponent(emp.name)}`, { headers });
      const mapped = (res.data || []).map(t => {
        const isDone = t.checked || t.completed || t.done || (t.status || '').toLowerCase() === 'completed';
        return {
          ...t,
          title: t.title || t.taskName || "",
          priority: t.priority || "Medium",
          status: isDone ? "Completed" : "Pending",
          completed: isDone,
          done: isDone,
          dueDate: t.date || t.dueDate || ""
        };
      });
      setStaticTasks(mapped);
    } catch (err) {
      console.error("Failed to load employee tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [emp?.name]);

  const pendingTasks = staticTasks.filter(t => (t.status || '').toLowerCase() === 'pending' || (!t.completed && !t.done && t.status !== 'completed'));
  const completedTasks = staticTasks.filter(t => t.completed || t.done || (t.status || '').toLowerCase() === 'completed');
  const filteredTasks = taskTab === 'all' ? staticTasks : taskTab === 'pending' ? pendingTasks : completedTasks;

  // Documents state
  const [requestedDocs, setRequestedDocs] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);

  useEffect(() => {
    const fetchEmpNotifications = async () => {
      const empId = emp?._id || emp?.employeeId;
      if (!empId) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/notifications/${empId}`);
        setDbNotifications(res.data || []);
      } catch (err) {
        console.error("Failed to fetch employee notifications:", err);
      }
    };
    fetchEmpNotifications();
  }, [emp]);

  // Modals state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showRequestDocModal, setShowRequestDocModal] = useState(false);

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Offer Letter");

  // Interactions
  const handleToggleTask = async (taskId) => {
    // Optimistic UI update
    setStaticTasks(prev => prev.map(t => {
      if (t._id === taskId) {
        const done = t.completed || t.done || (t.status || '').toLowerCase() === 'completed';
        return {
          ...t,
          status: done ? "Pending" : "Completed",
          completed: !done,
          done: !done
        };
      }
      return t;
    }));

    try {
      await axios.patch(`${BASE_URL}/api/tasks/${taskId}/toggle`);
    } catch (err) {
      console.error("Failed to toggle task status:", err);
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    // Optimistic UI update
    setStaticTasks(prev => prev.filter(t => t._id !== taskId));
    try {
      await axios.delete(`${BASE_URL}/api/tasks/${taskId}`);
    } catch (err) {
      console.error("Failed to delete task:", err);
      loadTasks();
    }
  };

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      // 1. Fetch board columns/groups to find a valid groupId
      const boardRes = await axios.get(`${BASE_URL}/api/tasks/board${emp?.name ? `?employeeName=${encodeURIComponent(emp.name)}` : ""}`);
      let groupId = "";
      if (boardRes.data && boardRes.data.length > 0) {
        groupId = boardRes.data[0]._id || boardRes.data[0].id;
      } else {
        // Create a default Tasks group
        const groupRes = await axios.post(`${BASE_URL}/api/groups`, {
          label: "Tasks",
          color: "#6366F1",
          companyId: emp?.companyId || ""
        });
        groupId = groupRes.data._id || groupRes.data.id;
      }

      if (!groupId) {
        alert("Failed to find or create a task group. Please make sure task groups exist.");
        return;
      }

      // 2. Post new task
      const payload = {
        title: newTaskTitle,
        priority: newTaskPriority,
        status: "Pending",
        date: newTaskDueDate || new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10),
        assignTo: emp.name,
        groupId
      };

      const res = await axios.post(`${BASE_URL}/api/tasks`, payload);
      if (res.data) {
        const newTask = {
          ...res.data,
          title: res.data.title,
          priority: res.data.priority,
          status: res.data.status,
          dueDate: res.data.date || res.data.dueDate || ""
        };
        setStaticTasks(prev => [newTask, ...prev]);
      }
      setShowAddTaskModal(false);
      setNewTaskTitle("");
      setNewTaskPriority("Medium");
      setNewTaskDueDate("");
    } catch (err) {
      console.error("Failed to assign task:", err);
      alert("Failed to assign task: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRequestDocSubmit = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    try {
      // Create a database notification for the employee requesting the document
      await axios.post(`${BASE_URL}/api/notifications`, {
        userId: emp._id || emp.employeeId,
        text: `Please upload your ${newDocName} (${newDocType})`,
        type: "warning",
        icon: "Folder",
        companyId: emp.companyId || ""
      });

      const newDoc = {
        _id: "doc_" + Date.now(),
        name: newDocName,
        type: newDocType,
        uploadedAt: new Date().toISOString(),
        url: "#"
      };
      setRequestedDocs(prev => [...prev, newDoc]);
      setShowRequestDocModal(false);
      setNewDocName("");
      setNewDocType("Offer Letter");
    } catch (err) {
      console.error("Failed to request document:", err);
      alert("Failed to request document: " + (err.response?.data?.message || err.message));
    }
  };

  const getPriorityStyle = (priority = '') => {
    const p = priority.toLowerCase();
    if (p === 'high') return { background: '#FEF2F2', color: '#EF4444' };
    if (p === 'low') return { background: '#ECFDF5', color: '#10B981' };
    return { background: '#FFFBEB', color: '#F59E0B' }; // mid/medium
  };

  const formatDue = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const isOverdue = (date) => date && new Date(date) < now;

  // Documents helpers
  const docIcons = {
    offer: { icon: 'ti-file-text', bg: '#EEF2FF', color: '#6366F1' },
    id: { icon: 'ti-id', bg: '#E0F2FE', color: '#0ea5e9' },
    contract: { icon: 'ti-file-certificate', bg: '#FFFBEB', color: '#f59e0b' },
    degree: { icon: 'ti-certificate', bg: '#F5F3FF', color: '#8b5cf6' },
    resume: { icon: 'ti-file-description', bg: '#FEF2F2', color: '#ef4444' },
    default: { icon: 'ti-file', bg: '#F1F5F9', color: '#64748B' },
  };

  const getDocStyle = (doc) => {
    const name = (doc.name || doc.documentName || doc.type || '').toLowerCase();
    if (name.includes('offer')) return docIcons.offer;
    if (name.includes('aadhar') || name.includes('id') || name.includes('pan')) return docIcons.id;
    if (name.includes('contract')) return docIcons.contract;
    if (name.includes('degree') || name.includes('education') || name.includes('cert')) return docIcons.degree;
    if (name.includes('resume') || name.includes('cv')) return docIcons.resume;
    return docIcons.default;
  };

  const apiDocs = Array.isArray(empDocs) ? empDocs : (empDocs ? Object.values(empDocs) : []);

  // Filter pending document request notifications (unread warnings or texts with upload/document)
  const dbRequested = dbNotifications
    .filter(n => !n.isRead && (n.type === "warning" || n.text?.toLowerCase().includes("upload") || n.icon === "Folder"))
    .map(n => {
      let name = "";
      const match = n.text.match(/Please upload your (.+?) \((.+?)\)/);
      if (match) {
        name = match[1];
      } else {
        name = n.text.replace("Please upload your ", "");
      }
      return {
        _id: n._id,
        name: name,
        type: "Requested",
        uploadedAt: n.createdAt,
        url: "#"
      };
    });

  // Filter out any dbRequested docs that have already been uploaded in apiDocs
  const pendingDbRequested = dbRequested.filter(d =>
    !apiDocs.some(ad => (ad.docType || ad.documentType || "").toLowerCase() === d.name.toLowerCase() || (ad.name || "").toLowerCase() === d.name.toLowerCase())
  );

  const docsToShow = [
    ...apiDocs,
    ...pendingDbRequested,
    ...requestedDocs.filter(rd => !apiDocs.some(ad => (ad.name || "").toLowerCase() === rd.name.toLowerCase()))
  ];

  return (
    <div style={{
      "--teal": "#00BCD4",
      "--bg": "#F5F7FA",
      "--card": "#FFFFFF",
      "--text": "#1A2E35",
      "--text-muted": "#64748B",
      "--border": "#E2E8F0",
      "--danger": "#EF4444",
      "--warning": "#F59E0B",
      "--success": "#10B981",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "'Nunito', sans-serif",
      height: "100%",
      overflowY: "auto",
      padding: "24px 32px"
    }}>
      <style>{`
        .ed-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .ed-title-area { display: flex; align-items: center; gap: 16px; }
        .ed-back-btn { width: 40px; height: 40px; border-radius: 12px; background: #E0F2FE; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--teal); font-size: 18px; border: none; transition: all 0.2s; }
        .ed-back-btn:hover { background: #BAE6FD; }
        .ed-title { font-size: 20px; font-weight: 900; line-height: 1.2; color: #0F172A; }
        .ed-subtitle { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .ed-actions { display: flex; gap: 12px; }
        .ed-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; border: 1px solid var(--border); background: var(--card); color: var(--text); display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .ed-btn:hover { border-color: var(--text-muted); }
        .ed-btn.danger { color: var(--danger); border-color: transparent; background: #FEE2E2; }
        .ed-btn.danger:hover { background: #FECACA; }
        .ed-btn.warning { color: #D97706; border-color: #FDE68A; background: #FEF3C7; }

        .ed-hero { background: var(--card); border-radius: 16px; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-top: 4px solid #00E5FF; border-bottom: none; border-left: none; border-right: none; }
        .ed-hero-left { display: flex; align-items: center; gap: 24px; }
        .ed-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--teal); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28px; font-weight: 800; flex-shrink: 0; }
        .ed-name { font-size: 22px; font-weight: 900; color: #0F172A; margin-bottom: 6px; }
        .ed-roles { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; margin-bottom: 12px; }
        .ed-badge { background: #F1F5F9; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; color: #475569; }
        .ed-contacts { display: flex; gap: 20px; font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .ed-contacts span { display: flex; align-items: center; gap: 6px; }
        .ed-contacts i { color: var(--teal); font-size: 14px; }
        .ed-hero-right { text-align: right; display: flex; flexDirection: column; gap: 16px; align-items: flex-end; }
        .ed-status { display: inline-flex; align-items: center; gap: 6px; background: #DCFCE7; color: #16A34A; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; }
        .ed-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .ed-tenure { font-size: 14px; font-weight: 900; color: #0F172A; }
        .ed-tenure span { display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 2px; }

        .ed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .ed-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .ed-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ed-card-title { font-size: 14px; font-weight: 900; color: #0F172A; display: flex; align-items: center; gap: 8px; }
        .ed-card-title i { color: var(--teal); font-size: 18px; }
        
        .ed-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ed-info-item .lbl { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .ed-info-item .val { font-size: 13px; font-weight: 800; color: #0F172A; word-break: break-all; }

        .ed-progress-group { margin-bottom: 16px; }
        .ed-progress-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 8px; color: #475569; }
        .ed-progress-bar { height: 6px; background: #E2E8F0; border-radius: 10px; overflow: hidden; }
        .ed-progress-fill { height: 100%; border-radius: 10px; }

        .ed-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .ed-table th { text-align: left; padding: 8px 0; font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .ed-table td { padding: 12px 0; font-size: 12px; font-weight: 700; color: #334155; border-bottom: 1px solid #F1F5F9; }
        .ed-table tr:last-child td { border-bottom: none; }

        .ed-proj-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; cursor: pointer; }
        .ed-proj-item:last-child { border-bottom: none; }
        .ed-proj-item:hover { background: #FAFAFA; }
        .ed-proj-info { display: flex; align-items: center; gap: 12px; }
        .ed-proj-icon { width: 36px; height: 36px; border-radius: 8px; background: #F0FDFE; color: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .ed-proj-name { font-size: 13px; font-weight: 800; color: #0F172A; }
        .ed-proj-role { font-size: 11px; font-weight: 600; color: #64748B; }
        .ed-proj-stat { text-align: right; }
        .ed-proj-perc { font-size: 13px; font-weight: 900; color: var(--teal); }
        .ed-proj-lbl { font-size: 11px; font-weight: 600; color: #64748B; }

        .ed-task-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
        .ed-task-item:last-child { border-bottom: none; }
        .ed-task-cb { width: 16px; height: 16px; border-radius: 4px; border: 2px solid var(--teal); display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; flex-shrink: 0; }
        .ed-task-cb.done { background: var(--teal); }
        .ed-task-content { flex: 1; }
        .ed-task-title { font-size: 12px; font-weight: 800; margin-bottom: 2px; color: #0F172A; }
        .ed-task-title.done { text-decoration: line-through; color: #94A3B8; }
        .ed-task-due { font-size: 10px; font-weight: 700; color: #64748B; }
        .ed-task-tag { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; flex-shrink: 0; }

        .ed-docs-list { display: flex; flex-direction: column; gap: 0; }
        .ed-doc-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #F1F5F9; }
        .ed-doc-row:last-child { border-bottom: none; }
        .ed-doc-icon { width: 36px; height: 36px; border-radius: 8px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .ed-doc-info { flex: 1; }
        .ed-doc-name { font-size: 13px; font-weight: 800; color: #0F172A; }
        .ed-doc-meta { font-size: 10px; font-weight: 600; color: #64748B; }
        .ed-doc-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .ed-doc-btn { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; border: none; display: flex; align-items: center; gap: 5px; transition: all 0.2s; }
        .ed-doc-btn.view { background: #E0F2FE; color: #0284C7; }
        .ed-doc-btn.view:hover { background: #BAE6FD; }
        .ed-doc-btn.download { background: var(--teal); color: #fff; }
        .ed-doc-btn.download:hover { background: #0097A7; }
        .ed-docs-sub { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .ed-docs-sub span { background: var(--teal); color: #fff; border-radius: 10px; padding: 1px 7px; font-size: 10px; }
        .ed-empty { text-align: center; padding: 24px 0; color: #94A3B8; font-size: 12px; font-weight: 600; }
        .ed-tab { font-size: 12px; font-weight: 700; padding-bottom: 8px; cursor: pointer; color: var(--text-muted); }
        .ed-tab.active { color: var(--teal); border-bottom: 2px solid var(--teal); }
      `}</style>

      {/* HEADER */}
      <div className="ed-header">
        <div className="ed-title-area">
          <button className="ed-back-btn" onClick={onBack}><i className="ti ti-arrow-left"></i></button>
          <div>
            <div className="ed-title">{emp.name}</div>
            <div className="ed-subtitle">Employees / {empId}</div>
          </div>
        </div>
        <div className="ed-actions">
          <button className="ed-btn" onClick={onEdit}><i className="ti ti-edit"></i> Edit Details</button>
          <button className="ed-btn warning" onClick={onChangeRole}><i className="ti ti-shield"></i> Change Role</button>
          <button className="ed-btn danger" onClick={onDeactivate}><i className="ti ti-user-x"></i> Deactivate</button>
        </div>
      </div>

      {/* HERO */}
      <div className="ed-hero">
        <div className="ed-hero-left">
          <div className="ed-avatar">{getInitials(emp.name)}</div>
          <div>
            <div className="ed-name">{emp.name}</div>
            <div className="ed-roles">
              <span>{emp.role || "Employee"}</span> · <span style={{ color: "var(--teal)" }}>{emp.department || "General"}</span>
              <span className="ed-badge">{empId}</span>
            </div>
            <div className="ed-contacts">
              {emp.email && <span><i className="ti ti-mail"></i> {emp.email}</span>}
              {emp.phone && <span><i className="ti ti-phone"></i> {emp.phone}</span>}
              {emp.address && <span><i className="ti ti-map-pin"></i> {emp.address}</span>}
            </div>
          </div>
        </div>
        <div className="ed-hero-right">
          <div className="ed-status" style={
            (emp.status || 'active').toLowerCase() === 'inactive'
              ? { background: '#FEE2E2', color: '#DC2626' }
              : { background: '#DCFCE7', color: '#16A34A' }
          }>
            <div className="ed-status-dot"></div> {(emp.status || "Active").toUpperCase()}
          </div>
          <div style={{ display: "flex", gap: "32px", marginTop: "8px" }}>
            {joinedDate && (
              <div className="ed-tenure">
                {joinedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                <span>Date Joined</span>
              </div>
            )}
            <div className="ed-tenure">
              {tenure}
              <span>Tenure</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP GRID: Personal Info + Leave/Info */}
      <div className="ed-grid">
        {/* PERSONAL INFO */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-user-square"></i> Personal Information</div>
            <button className="ed-btn" style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "8px" }} onClick={onEdit}><i className="ti ti-pencil"></i> Edit</button>
          </div>
          <div className="ed-info-grid">
            <div className="ed-info-item"><div className="lbl">Full Name</div><div className="val">{emp.name || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Employee ID</div><div className="val" style={{ color: "var(--teal)" }}>{empId}</div></div>
            <div className="ed-info-item"><div className="lbl">Role</div><div className="val">{emp.role || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Department</div><div className="val">{emp.department || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Email</div><div className="val">{emp.email || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Phone</div><div className="val">{emp.phone || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Date Joined</div><div className="val">{joinedDate ? joinedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Employment Type</div><div className="val">{emp.employmentType || emp.type || "Full-Time"}</div></div>
            {emp.salary && <div className="ed-info-item"><div className="lbl">Salary</div><div className="val">₹{Number(emp.salary).toLocaleString()}</div></div>}
            {emp.address && <div className="ed-info-item"><div className="lbl">Address</div><div className="val">{emp.address}</div></div>}
            {emp.dateOfBirth && <div className="ed-info-item"><div className="lbl">Date of Birth</div><div className="val">{new Date(emp.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>}
            {emp.maritalStatus && <div className="ed-info-item"><div className="lbl">Marital Status</div><div className="val">{emp.maritalStatus}</div></div>}
            {(emp.bankName || emp.bankDetails?.bankName) && <div className="ed-info-item"><div className="lbl">Bank Name</div><div className="val">{emp.bankName || emp.bankDetails?.bankName}</div></div>}
            {(emp.accountNumber || emp.bankDetails?.accountNumber) && <div className="ed-info-item"><div className="lbl">Account Number</div><div className="val">{emp.accountNumber || emp.bankDetails?.accountNumber}</div></div>}
            {(emp.ifscCode || emp.bankDetails?.ifscCode) && <div className="ed-info-item"><div className="lbl">IFSC Code</div><div className="val">{emp.ifscCode || emp.bankDetails?.ifscCode}</div></div>}
          </div>
        </div>

        {/* LEAVE REQUESTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-calendar-event"></i> Leave Requests</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
                {(emp.leaveRequests || []).filter(l => l.status === 'pending').length} pending
              </span>
              <button
                className="ed-btn"
                style={{ padding: "5px 12px", fontSize: "11px", borderRadius: "8px", background: "var(--teal)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
                onClick={() => {
                  const type = prompt("Leave type (e.g. Sick, Casual, Annual):");
                  if (!type) return;
                  const startDate = prompt("Start date (YYYY-MM-DD):");
                  if (!startDate) return;
                  const endDate = prompt("End date (YYYY-MM-DD, or same as start):") || startDate;
                  const newLeave = { type, startDate, endDate, status: "pending" };
                  const updated = [...(emp.leaveRequests || []), newLeave];
                  if (typeof onEdit === "function") {
                    onEdit({ ...emp, leaveRequests: updated });
                  }
                }}
              >
                <i className="ti ti-plus" style={{ fontSize: 12 }}></i> Add Leave
              </button>
            </div>
          </div>
          {(emp.leaveRequests || []).length === 0 ? (
            <div className="ed-empty"><i className="ti ti-calendar-off" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i>No leave requests</div>
          ) : (
            <table className="ed-table">
              <thead><tr><th>Type</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {(emp.leaveRequests || []).map((leave, i) => (
                  <tr key={i}>
                    <td>{leave.type || leave.leaveType || "Leave"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                      {leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ""}
                      {leave.endDate && leave.endDate !== leave.startDate ? ` – ${new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ""}
                    </td>
                    <td>
                      <span style={{
                        background: leave.status === 'approved' ? '#ECFDF5' : leave.status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                        color: leave.status === 'approved' ? 'var(--success)' : leave.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                        padding: "4px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "800", textTransform: "capitalize"
                      }}>{leave.status || "Pending"}</span>
                    </td>
                    <td>
                      {(!leave.status || leave.status === 'pending') ? (
                        <>
                          <button className="ed-btn" style={{ padding: "4px 8px", fontSize: "10px", background: "#ECFDF5", color: "var(--success)", borderColor: "#D1FAE5" }}>Approve</button>
                          <button className="ed-btn" style={{ padding: "4px 8px", fontSize: "10px", background: "#FEF2F2", color: "var(--danger)", borderColor: "#FEE2E2", marginLeft: "4px" }}>Reject</button>
                        </>
                      ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* BOTTOM GRID: Projects | Tasks | Documents */}
      <div className="ed-grid" style={{ gridTemplateColumns: "1fr 1fr 1.2fr" }}>

        {/* ASSIGNED PROJECTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-briefcase"></i> Assigned Projects</div>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--teal)" }}>{activeProjects.length} active</span>
          </div>
          {staticProjects.length === 0 ? (
            <div className="ed-empty"><i className="ti ti-briefcase-off" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i>No projects assigned</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {staticProjects.map((proj, i) => {
                const pc = projColors[i % projColors.length];
                const ic = projIcons[i % projIcons.length];
                const perc = proj.progress || proj.percentage || proj.completion || 0;
                const status = proj.status || (perc === 100 ? 'Completed' : 'In Progress');
                return (
                  <div key={proj._id || i} className="ed-proj-item" onClick={() => onViewProject && onViewProject(proj)}>
                    <div className="ed-proj-info">
                      <div className="ed-proj-icon" style={{ background: pc.bg, color: pc.color }}><i className={`ti ${ic}`}></i></div>
                      <div>
                        <div className="ed-proj-name">{proj.name || proj.projectName || "Project"}</div>
                        <div className="ed-proj-role">{proj.role || proj.memberRole || "Member"}</div>
                      </div>
                    </div>
                    <div className="ed-proj-stat">
                      <div className="ed-proj-perc" style={{ color: pc.color }}>{perc}%</div>
                      <div className="ed-proj-lbl">{status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {staticProjects.length > 0 && (
            <div className="ed-progress-group" style={{ marginTop: "16px", marginBottom: 0 }}>
              <div className="ed-progress-header"><span>Overall Workload</span><span>{totalWorkload}%</span></div>
              <div className="ed-progress-bar"><div className="ed-progress-fill" style={{ width: `${totalWorkload}%`, background: "var(--teal)" }}></div></div>
            </div>
          )}
        </div>

        {/* TASKS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-checkbox"></i> Tasks</div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
              {pendingTasks.length} pending &nbsp;
              <button className="ed-btn" onClick={() => setShowAddTaskModal(true)} style={{ padding: "6px 12px", background: "var(--teal)", color: "#fff", border: "none", fontSize: "11px", borderRadius: "8px" }}>
                <i className="ti ti-plus"></i> Assign Task
              </button>
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px", borderBottom: "1.5px solid var(--border)" }}>
            <div className={`ed-tab ${taskTab === 'all' ? 'active' : ''}`} onClick={() => setTaskTab('all')}>All</div>
            <div className={`ed-tab ${taskTab === 'pending' ? 'active' : ''}`} onClick={() => setTaskTab('pending')}>Pending</div>
            <div className={`ed-tab ${taskTab === 'completed' ? 'active' : ''}`} onClick={() => setTaskTab('completed')}>Completed</div>
          </div>
          {filteredTasks.length === 0 ? (
            <div className="ed-empty"><i className="ti ti-checkbox" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i>No tasks</div>
          ) : (
            <div>
              {filteredTasks.map((task, i) => {
                const done = task.completed || task.done || task.status === 'completed';
                const overdue = !done && isOverdue(task.dueDate || task.due);
                const priority = task.priority || task.tag || 'mid';
                const tagStyle = getPriorityStyle(priority);
                return (
                  <div key={task._id || i} className="ed-task-item">
                    <div className={`ed-task-cb ${done ? 'done' : ''}`} onClick={() => handleToggleTask(task._id)} style={{ cursor: "pointer" }}>
                      {done && <i className="ti ti-check" style={{ fontSize: 12 }}></i>}
                    </div>
                    <div className="ed-task-content" onClick={() => handleToggleTask(task._id)} style={{ cursor: "pointer" }}>
                      <div className={`ed-task-title ${done ? 'done' : ''}`}>{task.title || task.taskName || "Task"}</div>
                      <div className="ed-task-due" style={{ color: overdue ? 'var(--danger)' : '#64748B' }}>
                        {overdue ? 'Overdue - ' : 'Due: '}
                        {formatDue(task.dueDate || task.due)}
                      </div>
                    </div>
                    <div className="ed-task-tag" style={tagStyle}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</div>
                    <i className="ti ti-x" onClick={() => handleDeleteTask(task._id)} style={{ color: "var(--text-muted)", cursor: "pointer" }}></i>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DOCUMENTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-folder"></i> Documents</div>
            <button className="ed-btn" onClick={() => setShowRequestDocModal(true)} style={{ padding: "6px 14px", fontSize: "11px", borderRadius: "8px", background: "var(--teal)", color: "#fff", border: "none" }}>
              <i className="ti ti-download"></i> Request Document
            </button>
          </div>
          <div className="ed-docs-sub">
            Uploaded Documents <span>{docsToShow.length}</span>
          </div>
          {empDocsLoading ? (
            <div className="ed-empty"><i className="ti ti-loader-2" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i>Loading documents...</div>
          ) : docsToShow.length === 0 ? (
            <div className="ed-empty"><i className="ti ti-folder-off" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i>No documents uploaded</div>
          ) : (
            <div className="ed-docs-list">
              {docsToShow.map((doc, i) => {
                const ds = getDocStyle(doc);
                const docName = doc.name || doc.documentName || doc.fileName || "Document";
                const docMeta = doc.type || doc.documentType || doc.category || "";
                const uploadDate = doc.uploadedAt || doc.createdAt;
                const metaStr = [uploadDate ? new Date(uploadDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "", docMeta, "PDF"].filter(Boolean).join(' · ');
                return (
                  <div key={doc._id || i} className="ed-doc-row">
                    <div className="ed-doc-icon" style={{ background: ds.bg, color: ds.color }}><i className={`ti ${ds.icon}`}></i></div>
                    <div className="ed-doc-info">
                      <div className="ed-doc-name">{docName}</div>
                      <div className="ed-doc-meta">{metaStr}</div>
                    </div>
                    <div className="ed-doc-actions">
                      {doc.url && doc.url !== "#" ? (
                        <>
                          <button className="ed-doc-btn view" onClick={() => window.open(doc.url, '_blank')}><i className="ti ti-eye" style={{ fontSize: 12 }}></i> View</button>
                          <button className="ed-doc-btn download" onClick={() => { const a = document.createElement('a'); a.href = doc.url; a.download = docName; a.click(); }}><i className="ti ti-download" style={{ fontSize: 12 }}></i> Download</button>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", background: "#F1F5F9", padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>Sent</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>{/* END BOTTOM GRID */}

      {/* DANGER ZONE */}
      <div style={{ background: "#FFF5F5", border: "1px solid #FFE4E4", borderRadius: "10px", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
        <div>
          <div style={{ color: "#DC2626", fontWeight: "800", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: "14px" }}></i> Danger Zone
          </div>
          <div style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: "500" }}>
            Deactivating revokes all access. Deletion is permanent and cannot be undone.
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="ed-btn" style={{ background: "#FEF9EC", color: "#D97706", border: "1px solid #FDE68A", fontSize: "12px", padding: "6px 14px" }} onClick={onDeactivate}><i className="ti ti-user-x"></i> Deactivate</button>
          <button className="ed-btn" style={{ background: "#FFF1F1", color: "#DC2626", border: "1px solid #FECACA", fontSize: "12px", padding: "6px 14px" }} onClick={onDelete}><i className="ti ti-trash"></i> Delete Employee</button>
        </div>
      </div>


      {/* ADD TASK MODAL */}
      {showAddTaskModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,28,46,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 450, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid var(--border)", fontFamily: "'Nunito', sans-serif" }}>
            <div style={{ display: "flex", justifySpaceBetween: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>Assign New Task</div>
              <button onClick={() => setShowAddTaskModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)" }}><i className="ti ti-x"></i></button>
            </div>
            <form onSubmit={handleAddTaskSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: 6 }}>Task Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  required
                  placeholder="e.g. Design Landing Page Layout"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", outline: "none", fontSize: 13, fontWeight: 700 }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: 6 }}>Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", outline: "none", fontSize: 13, fontWeight: 700, background: "#fff" }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: 6 }}>Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", outline: "none", fontSize: 13, fontWeight: 700 }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddTaskModal(false)} style={{ background: "#f1f5f9", color: "var(--text-muted)", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: "var(--teal)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST DOCUMENT MODAL */}
      {showRequestDocModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,28,46,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 450, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid var(--border)", fontFamily: "'Nunito', sans-serif" }}>
            <div style={{ display: "flex", justifySpaceBetween: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>Request Document</div>
              <button onClick={() => setShowRequestDocModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)" }}><i className="ti ti-x"></i></button>
            </div>
            <form onSubmit={handleRequestDocSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: 6 }}>Document Name</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  required
                  placeholder="e.g. Aadhar Card"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", outline: "none", fontSize: 13, fontWeight: 700 }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: 6 }}>Document Type</label>
                <select
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", outline: "none", fontSize: 13, fontWeight: 700, background: "#fff" }}
                >
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="ID Proof">ID Proof</option>
                  <option value="Contract">Contract</option>
                  <option value="Degree Certificate">Degree Certificate</option>
                  <option value="Resume/CV">Resume/CV</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowRequestDocModal(false)} style={{ background: "#f1f5f9", color: "var(--text-muted)", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: "var(--teal)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Request Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}