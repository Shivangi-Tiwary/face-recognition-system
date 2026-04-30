import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../styles/Chat.css";

export default function ChatWindow({ room, socket, onLeaveGroup }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const bottomRef = useRef();
  const typingTimeout = useRef();
  const fileInputRef = useRef();
  const roomIdRef = useRef(room?._id);

  useEffect(() => {
    roomIdRef.current = room?._id;
  }, [room?._id]);

  // ── Load messages from DB (source of truth) ──────────────────────────────
  const fetchMessages = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/chat/messages/${id}`);
      setMessages(data.messages ?? []);
    } catch (err) {
      console.error("fetchMessages failed:", err);
    }
  }, []);

  // ── When room changes: clear + reload ────────────────────────────────────
  useEffect(() => {
    if (!room?._id) return;
    setMessages([]);
    fetchMessages(room._id);
    if (socket) {
      socket.emit("join_room", room._id);
      socket.emit("mark_read", { roomId: room._id });
    }
  }, [room?._id, socket, fetchMessages]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      // roomId on the populated msg may be an object or a string — handle both
      const msgRoomId = msg.roomId?._id?.toString() || msg.roomId?.toString();
      const currentRoomId = roomIdRef.current?.toString();
      if (msgRoomId !== currentRoomId) return;

      setMessages((prev) => {
        // Deduplicate by _id
        if (prev.find((m) => m._id?.toString() === msg._id?.toString())) return prev;
        return [...prev, msg];
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id?.toString() === messageId?.toString() ? { ...m, deletedAt: new Date() } : m
        )
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("user_typing", () => setTyping("Someone is typing…"));
    socket.on("user_stop_typing", () => setTyping(""));

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [socket]);

  // ── Auto scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── File picker ───────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setFilePreview(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : null);
  };

  // ── SEND ──────────────────────────────────────────────────────────────────
  // Flow:
  //   1. Emit via socket  →  server saves to DB  →  broadcasts new_message to room
  //   2. handleNewMessage above picks it up and appends to state for BOTH users
  //   3. No re-fetch needed — socket echo IS the message
  const sendMessage = async () => {
    if (sending) return;
    const trimmed = input.trim();
    if (!trimmed && !file) return;

    setSending(true);
    const currentRoomId = room._id;

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomId", currentRoomId);
        const { data } = await api.post("/chat/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        socket.emit("send_message", {
          roomId: currentRoomId,
          content: data.url,
          type: file.type.startsWith("image/") ? "image" : "file",
          fileName: file.name,
        });
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setInput(""); // clear immediately for snappiness
        socket.emit("stop_typing", { roomId: currentRoomId });
        // Socket handler on backend saves to DB + broadcasts new_message back
        // to everyone in the room INCLUDING the sender — so it appears for both
        socket.emit("send_message", { roomId: currentRoomId, content: trimmed });
      }
    } catch (err) {
      console.error("Send failed:", err);
      if (!file) setInput(trimmed); // restore on error
    } finally {
      setSending(false);
    }
  };

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setInput(e.target.value);
    socket?.emit("typing", { roomId: room._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("stop_typing", { roomId: room._id });
    }, 1500);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (messageId) => {
    socket?.emit("delete_message", { messageId, roomId: room._id });
  };

  // ── Leave group ───────────────────────────────────────────────────────────
  const handleLeave = async () => {
    try {
      await api.post(`/chat/room/${room._id}/leave`);
      setShowLeaveModal(false);
      onLeaveGroup(room._id);
    } catch (err) {
      console.error("Leave failed:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoomName = () => {
    if (room.type === "group") return room.name;
    const other = room.members?.find((m) => m._id !== user?._id);
    return other?.name || "Chat";
  };

  const getInitial = (name = "") => (name.charAt(0) || "?").toUpperCase();

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!room) return null;

  return (
    <div className="cw-root">
      {/* ── HEADER ── */}
      <div className="cw-header">
        <div className="cw-avatar cw-avatar--lg">
          {room.type === "group" ? "👥" : getInitial(getRoomName())}
        </div>
        <div className="cw-header-info">
          <span className="cw-header-name">{getRoomName()}</span>
          <span className="cw-header-sub">
            {room.type === "group"
              ? `${room.members?.length} members`
              : "Direct message"}
          </span>
        </div>
        {room.type === "group" && (
          <button className="cw-leave-btn" onClick={() => setShowLeaveModal(true)}>
            Leave Group
          </button>
        )}
      </div>

      {/* ── MESSAGES ── */}
      <div className="cw-messages">
        {messages.length === 0 && (
          <div className="cw-empty">
            <span className="cw-empty-icon">💬</span>
            <p>No messages yet — say hello!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender?._id?.toString() === user?._id?.toString();
          return (
            <div
              key={msg._id}
              className={`cw-msg-row ${isMine ? "cw-msg-row--mine" : "cw-msg-row--theirs"}`}
            >
              {!isMine && (
                <div className="cw-avatar cw-avatar--sm">
                  {getInitial(msg.sender?.name)}
                </div>
              )}

              <div className="cw-msg-col">
                {!isMine && room.type === "group" && (
                  <span className="cw-sender-name">{msg.sender?.name}</span>
                )}
                <div className={`cw-bubble ${isMine ? "cw-bubble--mine" : "cw-bubble--theirs"}`}>
                  {msg.deletedAt ? (
                    <span className="cw-deleted">🚫 Message deleted</span>
                  ) : msg.type === "image" ? (
                    <img className="cw-media-img" src={msg.content} alt="sent" />
                  ) : msg.type === "file" ? (
                    <a className="cw-file-link" href={msg.content} target="_blank" rel="noreferrer">
                      📎 {msg.fileName || "Download file"}
                    </a>
                  ) : (
                    msg.content
                  )}
                </div>
                <span className={`cw-time ${isMine ? "cw-time--right" : ""}`}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>

              {isMine && !msg.deletedAt && (
                <button
                  className="cw-del-btn"
                  onClick={() => handleDelete(msg._id)}
                  title="Delete message"
                >
                  🗑
                </button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── TYPING ── */}
      {typing && <div className="cw-typing">{typing}</div>}

      {/* ── FILE PREVIEW ── */}
      {file && (
        <div className="cw-file-preview">
          {filePreview ? (
            <img src={filePreview} alt="preview" className="cw-file-thumb" />
          ) : (
            <span>📎 {file.name}</span>
          )}
          <button
            className="cw-file-remove"
            onClick={() => {
              setFile(null);
              setFilePreview(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div className="cw-input-bar">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          className="cw-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          📎
        </button>
        <input
          className="cw-text-input"
          placeholder="Type a message…"
          value={input}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          className="cw-send-btn"
          onClick={sendMessage}
          disabled={sending || (!input.trim() && !file)}
        >
          {sending ? "…" : "Send"}
        </button>
      </div>

      {/* ── LEAVE MODAL ── */}
      {showLeaveModal && (
        <div className="cw-modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="cw-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="cw-modal-title">Leave Group?</h3>
            <p className="cw-modal-body">
              Are you sure you want to leave <strong>"{room.name}"</strong>?
              You won't receive new messages.
            </p>
            <div className="cw-modal-actions">
              <button className="cw-btn-cancel" onClick={() => setShowLeaveModal(false)}>
                Cancel
              </button>
              <button className="cw-btn-leave" onClick={handleLeave}>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}