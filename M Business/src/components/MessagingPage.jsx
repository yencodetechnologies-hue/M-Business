import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { T } from "../index";
import { BASE_URL } from "../config";



export default function MessagingPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const companyId = user?.companyId || user?._id || "";

  useEffect(() => {
    fetchUsers();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [companyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/messages/users?companyId=${companyId}`);
      // Filter out self
      setUsers(res.data.filter(u => u._id !== (user.id || user._id)));
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/messages?companyId=${companyId}`);
      setMessages(res.data);
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!content.trim() || !selectedUser) return;
    setSending(true);
    try {
      const payload = {
        senderId: user.id || user._id,
        senderName: user.name || user.email.split("@")[0],
        receiverId: selectedUser._id,
        receiverName: selectedUser.name,
        content: content.trim(),
        companyId
      };
      const res = await axios.post(`${BASE_URL}/api/messages`, payload);
      setMessages([res.data, ...messages]);
      setContent("");
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const filteredMessages = messages.filter(m => 
    (m.senderId === (user.id || user._id) && m.receiverId === selectedUser?._id) ||
    (m.receiverId === (user.id || user._id) && m.senderId === selectedUser?._id)
  ).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div style={{ display: "flex", gap: 16, height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Users List */}
      <div style={{ width: 280, background: "var(--app-card)", borderRadius: 16, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--app-shadow)" }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text }}>Members</h3>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {users.map(u => (
            <div 
              key={u._id} 
              onClick={() => setSelectedUser(u)}
              style={{ 
                padding: "10px 12px", 
                borderRadius: 12, 
                cursor: "pointer", 
                marginBottom: 4,
                background: selectedUser?._id === u._id ? "rgba(var(--app-accent-rgb, 124, 58, 237),0.1)" : "transparent",
                border: `1px solid ${selectedUser?._id === u._id ? T.primary : "transparent"}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.2s"
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {u.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>{u.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, background: "var(--app-card)", borderRadius: 16, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--app-shadow)" }}>
        {selectedUser ? (
          <>
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>
                {selectedUser.name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{selectedUser.name}</div>
                <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 700 }}>● Online</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12, background: "var(--app-surface)" }}>
              {filteredMessages.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13, fontStyle: "italic" }}>
                  No messages yet. Say hi! 👋
                </div>
              ) : (
                filteredMessages.map((m, i) => {
                  const isMe = m.senderId === (user.id || user._id);
                  return (
                    <div key={i} style={{ 
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start"
                    }}>
                      <div style={{ 
                        background: isMe ? "var(--app-accent-gradient, var(--app-accent))" : "var(--app-surface)",
                        color: isMe ? "#fff" : T.text,
                        padding: "10px 14px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        fontSize: 13,
                        fontWeight: 500,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        border: isMe ? "none" : `1px solid ${T.border}`
                      }}>
                        {m.content}
                      </div>
                      <div style={{ fontSize: 9, color: T.muted, marginTop: 4, fontWeight: 600 }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, background: "var(--app-card)", display: "flex", gap: 10 }}>
              <input 
                placeholder="Type a message..." 
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                style={{ 
                  flex: 1, 
                  padding: "12px 16px", 
                  borderRadius: 12, 
                  border: `1.5px solid ${T.border}`, 
                  background: "var(--app-bg)", 
                  fontSize: 13, 
                  outline: "none", 
                  fontFamily: "inherit" 
                }} 
              />
              <button 
                onClick={sendMessage}
                disabled={sending || !content.trim()}
                style={{ 
                  background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 12, 
                  padding: "0 20px", 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: "pointer",
                  opacity: (sending || !content.trim()) ? 0.6 : 1
                }}
              >
                {sending ? "..." : "Send →"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.muted, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>Your Messages</h3>
            <p style={{ fontSize: 13, maxWidth: 300, margin: "8px 0 0" }}>Select a member from the left to start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}


