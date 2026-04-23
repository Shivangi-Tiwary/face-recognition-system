import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../styles/Sidebar.css";

export default function Sidebar({
  onSelectRoom,
  activeRoomId,
  socket,
  embedded = false,
  onBackToDashboard = null,
}) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("online_users", (userIds) => setOnlineUsers(userIds));
    socket.on("new_message", (msg) => {
      if (msg.roomId !== activeRoomId) {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.roomId]: (prev[msg.roomId] || 0) + 1
        }));
      }
      fetchRooms();
    });
    return () => {
      socket.off("online_users");
      socket.off("new_message");
    };
  }, [socket, activeRoomId]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/chat/users");
      setUsers(data.users);
    } catch {}
  };

  const fetchRooms = async () => {
    try {
      const { data } = await api.get("/chat/rooms");
      setRooms(data.rooms);
    } catch {}
  };

  const handleUserClick = async (userId) => {
    try {
      const { data } = await api.get(`/chat/dm/${userId}`);
      onSelectRoom(data.room);
      setUnreadCounts(prev => ({ ...prev, [data.room._id]: 0 }));
      fetchRooms();
    } catch {}
  };

  const handleRoomClick = (room) => {
    onSelectRoom(room);
    setUnreadCounts(prev => ({ ...prev, [room._id]: 0 }));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const { data } = await api.post("/chat/group", {
        name: groupName,
        memberIds: selectedMembers
      });
      onSelectRoom(data.room);
      setShowModal(false);
      setGroupName("");
      setSelectedMembers([]);
      fetchRooms();
    } catch {}
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getInitial = (name) => name?.charAt(0).toUpperCase();

  const getRoomName = (room) => {
    if (room.type === "group") return room.name;
    const other = room.members?.find(m => m._id !== user?._id);
    return other?.name || "Unknown";
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRooms = rooms.filter(r =>
    getRoomName(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">

      {/* ── STANDALONE header — only at /chat ── */}
      {!embedded && (
        <div className="sidebar-header">
          <div>
            <h2>💬 Chat</h2>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              Hi, {user?.name}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                style={{
                  background: "#4f8ef7", color: "#fff", border: "none",
                  borderRadius: 6, padding: "5px 10px", fontSize: 12,
                  fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                ← Dashboard
              </button>
            )}
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
      )}

      {/* ── EMBEDDED label — inside /user/chat ── */}
      {embedded && (
        <div style={{
          padding: "14px 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: 1,
          }}>
            Messages
          </span>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              style={{
                background: "#4f8ef7", color: "#fff", border: "none",
                borderRadius: 6, padding: "4px 10px", fontSize: 11,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              ← Dashboard
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="sidebar-search">
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={tab === "users" ? "active" : ""}
          onClick={() => setTab("users")}
        >
          Users
        </button>
        <button
          className={tab === "rooms" ? "active" : ""}
          onClick={() => setTab("rooms")}
        >
          Chats
        </button>
      </div>

      {/* List */}
      <div className="sidebar-list">
        {tab === "users" && filteredUsers.map(u => (
          <div
            key={u._id}
            className="sidebar-item"
            onClick={() => handleUserClick(u._id)}
          >
            <div className="avatar">
              {u.faceImageUrl
                ? <img src={u.faceImageUrl} alt={u.name} />
                : getInitial(u.name)
              }
              {onlineUsers.includes(u._id) && <span className="online-dot" />}
            </div>
            <div className="sidebar-item-info">
              <h4>{u.name}</h4>
              <p>{u.email}</p>
            </div>
          </div>
        ))}

        {tab === "rooms" && filteredRooms.map(r => (
          <div
            key={r._id}
            className={`sidebar-item ${activeRoomId === r._id ? "active" : ""}`}
            onClick={() => handleRoomClick(r)}
          >
            <div className="avatar">
              {r.type === "group" ? "👥" : getInitial(getRoomName(r))}
            </div>
            <div className="sidebar-item-info">
              <h4>{getRoomName(r)}</h4>
              <p>{r.type === "group" ? "Group chat" : "Direct message"}</p>
            </div>
            {unreadCounts[r._id] > 0 && (
              <span className="unread-badge">{unreadCounts[r._id]}</span>
            )}
          </div>
        ))}
      </div>

      {/* Create Group */}
      <button className="create-group-btn" onClick={() => setShowModal(true)}>
        + Create Group
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create Group</h3>
            <input
              placeholder="Group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
              Select members:
            </p>
            {users.map(u => (
              <div
                key={u._id}
                onClick={() => toggleMember(u._id)}
                style={{
                  padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                  background: selectedMembers.includes(u._id) ? "#eef3fe" : "transparent",
                  marginBottom: "4px", fontSize: "14px",
                  display: "flex", alignItems: "center", gap: "8px",
                  color: "#333",
                }}
              >
                <span>{selectedMembers.includes(u._id) ? "✅" : "⬜"}</span>
                {u.name}
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-create" onClick={handleCreateGroup}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}