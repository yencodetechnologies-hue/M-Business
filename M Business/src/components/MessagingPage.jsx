import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { T } from "../index";
import { BASE_URL } from "../config";

const QUICK_EMOJIS = ["😀", "😂", "😍", "👍", "🙏", "🎉", "🔥", "❤️", "😢", "😮", "👏", "✅"];

export default function MessagingPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachUploading, setAttachUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  const sendMessage = async (attachment = null) => {
    if (!content.trim() && !attachment) return;
    if (!selectedUser) return;
    setSending(true);
    try {
      const messageContent = content.trim() || (attachment ? `Sent a file: ${attachment.name}` : "");
      const payload = {
        senderId: user.id || user._id,
        senderName: user.name || user.email.split("@")[0],
        receiverId: selectedUser._id,
        receiverName: selectedUser.name,
        content: messageContent,
        attachmentUrl: attachment?.url || "",
        attachmentName: attachment?.name || "",
        companyId
      };
      const res = await axios.post(`${BASE_URL}/api/messages`, payload);
      setMessages([res.data, ...messages]);
      setContent("");
      setShowEmojiPicker(false);
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedUser) return;
    setAttachUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${BASE_URL}/api/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await sendMessage({ url: res.data.url, name: res.data.name || file.name });
    } catch (err) {
      console.error("Failed to upload attachment", err);
      alert("Failed to upload file. Please try again.");
    }
    setAttachUploading(false);
  };

  const handleEmojiClick = (emoji) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const filteredMessages = messages.filter(m =>
    (m.senderId === (user.id || user._id) && m.receiverId === selectedUser?._id) ||
    (m.receiverId === (user.id || user._id) && m.senderId === selectedUser?._id)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="chat-app" style={{ fontFamily: "var(--font, 'Nunito', sans-serif)", background: "var(--bg, #F5FAFA)" }}>
      {/* CONVERSATIONS PANEL */}
      <div className="conv-panel show" id="convPanel">
        <div className="conv-header">
          <div className="conv-title-row">
            <div className="conv-title">Messages</div>
            <div className="conv-actions">
              <div className="icon-btn"><i className="ti ti-edit"></i></div>
              <div className="icon-btn"><i className="ti ti-dots-vertical"></i></div>
            </div>
          </div>
          <div className="conv-search">
            <i className="ti ti-search"></i>
            <input type="text" placeholder="Search conversations…" />
          </div>
        </div>

        <div className="conv-tabs">
          <button className="ctab active">All <span style={{ background: "var(--teal)", color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 20, marginLeft: 4 }}>{users.length}</span></button>
          <button className="ctab">Internal</button>
          <button className="ctab">Clients</button>
          <button className="ctab">Groups</button>
        </div>

        <div className="conv-list">
          {users.map(u => {
            const init = u.name ? u.name.substring(0, 2).toUpperCase() : "U";
            const lastMsg = messages.filter(m =>
              (m.senderId === (user.id || user._id) && m.receiverId === u._id) ||
              (m.receiverId === (user.id || user._id) && m.senderId === u._id)
            ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

            return (
              <div key={u._id} className={`conv-item ${selectedUser?._id === u._id ? "active" : ""}`} onClick={() => setSelectedUser(u)}>
                <div className="ci-avatar" style={{ background: "linear-gradient(135deg,var(--teal),#006E7F)" }}>
                  {init}
                  <div className="online-dot"></div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <div className="ci-name">{u.name || "Unknown"}</div>
                    <span className="ci-tag internal">{u.role || "Internal"}</span>
                  </div>
                  <div className="ci-preview">{lastMsg ? lastMsg.content : "No messages yet"}</div>
                </div>
                {lastMsg && (
                  <div className="ci-right">
                    <div className="ci-time">{new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAT MAIN */}
      <div className="chat-main show" id="chatMain">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="ch-avatar" style={{ background: "linear-gradient(135deg,var(--teal),#006E7F)" }}>
                {selectedUser.name ? selectedUser.name.substring(0, 2).toUpperCase() : "U"}
                <div className="online-dot" style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "var(--green)", border: "2px solid #fff" }}></div>
              </div>
              <div>
                <div className="ch-name">{selectedUser.name}</div>
                <div className="ch-status">Online</div>
              </div>
              <div className="ch-actions">
                <span className="ch-tag internal">{selectedUser.role || "Internal"}</span>
                <div className="icon-btn"><i className="ti ti-phone"></i></div>
                <div className="icon-btn"><i className="ti ti-video"></i></div>
                <div className="icon-btn" onClick={() => {
                  const p = document.getElementById('infoPanel');
                  if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none';
                }}><i className="ti ti-info-circle"></i></div>
              </div>
            </div>

            <div className="chat-messages" id="chatMessages">
              {filteredMessages.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13, fontStyle: "italic" }}>
                  No messages yet. Say hi!
                </div>
              ) : (
                filteredMessages.map((m, i) => {
                  const isMe = m.senderId === (user.id || user._id);
                  return (
                    <div key={i} className={`msg-row ${isMe ? "mine" : ""}`}>
                      <div className="msg-avatar" style={{ background: isMe ? "linear-gradient(135deg,var(--teal),#006E7F)" : "linear-gradient(135deg,var(--amber),#D4880A)" }}>
                        {isMe ? (user.name ? user.name.substring(0, 1).toUpperCase() : "U") : (selectedUser.name ? selectedUser.name.substring(0, 2).toUpperCase() : "U")}
                      </div>
                      <div className="msg-group">
                        {!isMe && <div className="msg-sender">{selectedUser.name}</div>}
                        <div className={`msg-bubble ${isMe ? "mine" : "them"}`}>
                          {m.attachmentUrl ? (
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "underline" }}
                            >
                              <i className="ti ti-paperclip"></i>
                              {m.attachmentName || m.content || "Attachment"}
                            </a>
                          ) : m.content}
                        </div>
                        <div className="msg-time">
                          {isMe && <i className="ti ti-checks msg-read" style={{ color: "rgba(255,255,255,.9)" }}></i>}
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area" style={{ position: "relative" }}>
              {showEmojiPicker && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 10,
                    marginBottom: 8,
                    background: "#fff",
                    border: "1px solid var(--border, #E2E8F0)",
                    borderRadius: 10,
                    padding: 8,
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: 4,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    zIndex: 20,
                  }}
                >
                  {QUICK_EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleEmojiClick(em)}
                      style={{ fontSize: 20, border: "none", background: "transparent", cursor: "pointer", padding: 4, borderRadius: 6 }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
              <div className="input-toolbar">
                <label className="toolbar-btn" title="Attach file" style={{ cursor: attachUploading ? "wait" : "pointer", opacity: attachUploading ? 0.5 : 1 }}>
                  <i className="ti ti-paperclip"></i>
                  <input type="file" style={{ display: "none" }} onChange={handleFileSelected} disabled={attachUploading} />
                </label>
               
                <div className="toolbar-divider"></div>
                <div className="toolbar-btn" title="Emoji" onClick={() => setShowEmojiPicker(v => !v)}>
                  <i className="ti ti-mood-smile"></i>
                </div>
              </div>
              <div className="input-row">
                <textarea
                  className="msg-input"
                  id="msgInput"
                  placeholder={attachUploading ? "Uploading file…" : `Message ${selectedUser.name}…`}
                  rows={1}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onFocus={() => setShowEmojiPicker(false)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                ></textarea>
                <button className="send-btn" onClick={() => sendMessage()} disabled={sending || attachUploading || !content.trim()}>
                  <i className="ti ti-send"></i>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text3)", padding: 40, textAlign: "center", background: "var(--bg)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Your Messages</h3>
            <p style={{ fontSize: 13, maxWidth: 300, margin: "8px 0 0" }}>Select a conversation from the left to start messaging.</p>
          </div>
        )}
      </div>

      {/* INFO PANEL */}
      {selectedUser && (
        <div className="info-panel" id="infoPanel" style={{ display: "flex" }}>
          <div className="ip-header">
            <div className="ip-title">Conversation Info</div>
            <i className="ti ti-x ip-close" onClick={() => document.getElementById('infoPanel').style.display = 'none'}></i>
          </div>
          <div className="ip-profile">
            <div className="ip-avatar" style={{ background: "linear-gradient(135deg,var(--teal),#006E7F)" }}>
              {selectedUser.name ? selectedUser.name.substring(0, 2).toUpperCase() : "U"}
            </div>
            <div className="ip-name">{selectedUser.name}</div>
            <div className="ip-meta">{selectedUser.role || "Internal"}</div>
            <div className="ip-status online">Online now</div>
            <div className="ip-actions">
              <div className="ip-action-btn"><i className="ti ti-phone"></i><span>Call</span></div>
              <div className="ip-action-btn"><i className="ti ti-video"></i><span>Video</span></div>
              <div className="ip-action-btn"><i className="ti ti-mail"></i><span>Email</span></div>
            </div>
          </div>
          <div className="ip-section">
            <div className="ip-sec-title">Participants</div>
            <div className="member-item">
              <div className="mem-av" style={{ background: "linear-gradient(135deg,var(--teal),#006E7F)" }}>
                {user.name ? user.name.substring(0, 1).toUpperCase() : "U"}
              </div>
              <div><div className="mem-name">{user.name || "You"}</div><div className="mem-role">You</div></div>
              <div className="mem-online on"></div>
            </div>
            <div className="member-item">
              <div className="mem-av" style={{ background: "linear-gradient(135deg,var(--teal),#006E7F)" }}>
                {selectedUser.name ? selectedUser.name.substring(0, 2).toUpperCase() : "U"}
              </div>
              <div><div className="mem-name">{selectedUser.name}</div><div className="mem-role">{selectedUser.role || "Internal"}</div></div>
              <div className="mem-online on"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
