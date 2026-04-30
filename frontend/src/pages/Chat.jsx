import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import "../styles/Chat.css";

export default function Chat({ embedded = false }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const newSocket = io("http://localhost:5000", {
      auth: { token },
      // Auto-reconnect settings so if server restarts it reconnects by itself
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => console.log("🟢 Socket connected:", newSocket.id));
    newSocket.on("disconnect", (reason) => console.log("🔴 Socket disconnected:", reason));
    newSocket.on("connect_error", (err) => console.error("❌ Socket error:", err.message));
    newSocket.on("reconnect", (attempt) => console.log("🔁 Reconnected after", attempt, "attempts"));

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  const handleLeaveGroup = (roomId) => {
    if (activeRoom?._id === roomId) setActiveRoom(null);
  };

  // ── EMBEDDED inside /user/chat ──
  if (embedded) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar
          onSelectRoom={setActiveRoom}
          activeRoomId={activeRoom?._id}
          socket={socket}
          embedded={true}
          onBackToDashboard={() => navigate("/user")}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {activeRoom ? (
            <ChatWindow room={activeRoom} socket={socket} onLeaveGroup={handleLeaveGroup} />
          ) : (
            <div className="no-chat">
              <h3>👈 Select a chat to start messaging</h3>
              <p>Choose a user or group from the sidebar</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── STANDALONE at /chat ──
  return (
    <div className="chat-layout">
      <Sidebar
        onSelectRoom={setActiveRoom}
        activeRoomId={activeRoom?._id}
        socket={socket}
        embedded={false}
        onBackToDashboard={() => navigate("/user")}
      />
      {activeRoom ? (
        <ChatWindow room={activeRoom} socket={socket} onLeaveGroup={handleLeaveGroup} />
      ) : (
        <div className="no-chat">
          <h3>👈 Select a chat to start messaging</h3>
          <p>Choose a user or group from the sidebar</p>
        </div>
      )}
    </div>
  );
}