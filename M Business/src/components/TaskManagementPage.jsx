import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

const API = `${BASE_URL}/api`;

const P = {
  accent:  "#9333ea",
  mid:     "#7c3aed",
  dark:    "#1e0a3c",
  light:   "#f5f3ff",
  border:  "#ede9fe",
  text:    "#1e0a3c",
  muted:   "#a78bfa",
  hover:   "#faf5ff",
};

const INTEGRATIONS = [
  { id: "gmail", name: "Gmail", icon: "📧", description: "Email notifications on status change" },
  { id: "slack", name: "Slack", icon: "💬", description: "Post updates to Slack channels" },
  { id: "googleCalendar", name: "Google Calendar", icon: "📅", description: "Sync due dates with your calendar" },
  { id: "github", name: "GitHub", icon: "🐙", description: "Link commits and PRs to tasks" },
  { id: "zapier", name: "Zapier", icon: "🔗", description: "Connect to 5000+ apps via Zapier" }
];

function TaskManagementPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [filterPerson, setFilterPerson] = useState("");
  const [members, setMembers] = useState({ assigned: [], invited: [] });
  const [integrations, setIntegrations] = useState({
    gmail: false,
    slack: false,
    googleCalendar: false,
    github: false,
    zapier: false
  });
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchTaskMembers = async (taskId) => {
    try {
      const response = await axios.get(`${API}/tasks/${taskId}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMembers(response.data);
    } catch (error) {
      console.error("Error fetching task members:", error);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !selectedTask) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/tasks/invite`, 
        { taskId: selectedTask._id, email: inviteEmail },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setInviteEmail("");
      setShowInviteModal(false);
      fetchTaskMembers(selectedTask._id);
      fetchTasks();
      alert("Invitation sent successfully!");
    } catch (error) {
      alert("Error sending invitation: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async (taskId) => {
    try {
      await axios.patch(`${API}/tasks/${taskId}/auto-assign`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchTasks();
      if (selectedTask?._id === taskId) {
        fetchTaskMembers(taskId);
      }
      alert("Task auto-assigned successfully!");
    } catch (error) {
      alert("Error auto-assigning task: " + (error.response?.data?.message || error.message));
    }
  };

  const handleIntegrationToggle = async (integrationId) => {
    const newIntegrations = { ...integrations, [integrationId]: !integrations[integrationId] };
    setIntegrations(newIntegrations);
    
    if (selectedTask) {
      try {
        await axios.patch(`${API}/tasks/${selectedTask._id}/integrations`, 
          { integrations: newIntegrations },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        fetchTasks();
      } catch (error) {
        alert("Error updating integrations: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    fetchTaskMembers(task._id);
    setIntegrations(task.integrations || {});
  };

  const filteredTasks = filterPerson 
    ? tasks.filter(task => 
        task.assignedTo?.some(member => member.email === filterPerson) ||
        task.invitedMembers?.some(invite => invite.email === filterPerson)
      )
    : tasks;

  return (
    <div style={{ padding: "20px", backgroundColor: P.light, minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ color: P.dark, marginBottom: "30px" }}>Task Management</h1>
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: P.dark, marginBottom: "15px" }}>Tasks</h3>
            
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Filter by person (email)"
                value={filterPerson}
                onChange={(e) => setFilterPerson(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${P.border}`,
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ 
              display: "grid", 
              gap: "15px", 
              maxHeight: "600px", 
              overflowY: "auto",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              {filteredTasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => handleTaskSelect(task)}
                  style={{
                    padding: "15px",
                    border: `2px solid ${selectedTask?._id === task._id ? P.accent : P.border}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: selectedTask?._id === task._id ? P.light : "white",
                    transition: "all 0.2s"
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0", color: P.dark }}>{task.title}</h4>
                  <p style={{ margin: "0 0 8px 0", color: P.muted, fontSize: "14px" }}>
                    {task.description}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ 
                      backgroundColor: P.accent, 
                      color: "white", 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px" 
                    }}>
                      {task.status}
                    </span>
                    <span style={{ fontSize: "12px", color: P.muted }}>
                      {task.assignedTo?.length || 0} assigned
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {selectedTask ? (
              <div style={{ 
                backgroundColor: "white", 
                padding: "20px", 
                borderRadius: "12px", 
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)" 
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ color: P.dark, margin: 0 }}>{selectedTask.title}</h3>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      style={{
                        backgroundColor: P.accent,
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      ✨ Invite Member
                    </button>
                    <button
                      onClick={() => handleAutoAssign(selectedTask._id)}
                      style={{
                        backgroundColor: P.mid,
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      🎲 Auto-Assign
                    </button>
                    <button
                      onClick={() => setShowIntegrationsModal(true)}
                      style={{
                        backgroundColor: P.dark,
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      🔗 Integrations
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: P.dark, marginBottom: "10px" }}>👤 Members</h4>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <h5 style={{ color: P.muted, fontSize: "14px", marginBottom: "8px" }}>Assigned ({members.assigned?.length || 0})</h5>
                    {members.assigned?.map(member => (
                      <div key={member._id} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px", 
                        padding: "8px", 
                        backgroundColor: P.light, 
                        borderRadius: "6px", 
                        marginBottom: "8px" 
                      }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "50%", 
                          backgroundColor: P.accent, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          color: "white", 
                          fontSize: "12px", 
                          fontWeight: "bold" 
                        }}>
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "500" }}>{member.name}</div>
                          <div style={{ fontSize: "12px", color: P.muted }}>{member.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h5 style={{ color: P.muted, fontSize: "14px", marginBottom: "8px" }}>Invited ({members.invited?.length || 0})</h5>
                    {members.invited?.map((invite, index) => (
                      <div key={index} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px", 
                        padding: "8px", 
                        backgroundColor: P.light, 
                        borderRadius: "6px", 
                        marginBottom: "8px" 
                      }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "50%", 
                          backgroundColor: P.muted, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          color: "white", 
                          fontSize: "12px", 
                          fontWeight: "bold" 
                        }}>
                          {invite.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "500" }}>{invite.email}</div>
                          <div style={{ fontSize: "12px", color: P.muted }}>
                            {invite.status} • {new Date(invite.invitedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ color: P.dark, marginBottom: "10px" }}>📋 Details</h4>
                  <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                    <p><strong>Status:</strong> {selectedTask.status}</p>
                    <p><strong>Priority:</strong> {selectedTask.priority}</p>
                    <p><strong>Description:</strong> {selectedTask.description}</p>
                    {selectedTask.date && <p><strong>Due Date:</strong> {selectedTask.date}</p>}
                    {selectedTask.estimatedTime && <p><strong>Estimated Time:</strong> {selectedTask.estimatedTime}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                backgroundColor: "white", 
                padding: "40px", 
                borderRadius: "12px", 
                textAlign: "center", 
                color: P.muted,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                Select a task to view details
              </div>
            )}
          </div>
        </div>

        {showInviteModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "12px",
              width: "400px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            }}>
              <h3 style={{ color: P.dark, marginBottom: "20px" }}>Invite Member</h3>
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${P.border}`,
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "14px"
                }}
              />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    backgroundColor: P.border,
                    color: P.text,
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={loading || !inviteEmail}
                  style={{
                    backgroundColor: P.accent,
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: loading || !inviteEmail ? "not-allowed" : "pointer",
                    opacity: loading || !inviteEmail ? 0.6 : 1
                  }}
                >
                  {loading ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showIntegrationsModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "12px",
              width: "500px",
              maxHeight: "600px",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            }}>
              <h3 style={{ color: P.dark, marginBottom: "20px" }}>🔗 Integrations</h3>
              <div style={{ display: "grid", gap: "15px" }}>
                {INTEGRATIONS.map(integration => (
                  <div key={integration.id} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "15px",
                    border: `1px solid ${P.border}`,
                    borderRadius: "8px",
                    backgroundColor: P.light
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>{integration.icon}</span>
                      <div>
                        <div style={{ fontWeight: "500", color: P.dark }}>{integration.name}</div>
                        <div style={{ fontSize: "12px", color: P.muted }}>{integration.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIntegrationToggle(integration.id)}
                      style={{
                        backgroundColor: integrations[integration.id] ? P.accent : P.border,
                        color: integrations[integration.id] ? "white" : P.text,
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      {integrations[integration.id] ? "Connected" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  onClick={() => setShowIntegrationsModal(false)}
                  style={{
                    backgroundColor: P.accent,
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskManagementPage;
