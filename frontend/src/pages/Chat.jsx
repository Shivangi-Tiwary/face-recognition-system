import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import "../styles/Chat.css";

let socket;

export default function Chat({ embedded = false }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token }
    });
   socket.on("connect", () => console.log("🟢 Socket connected"));
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));
    return () => socket.disconnect();
  }, [token]);

  const handleLeaveGroup = (roomId) => {
    if (activeRoom?._id === roomId) setActiveRoom(null);
  };

  // ── EMBEDDED inside /user/chat — no own header, no logout ──
 if (embedded) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        onSelectRoom={setActiveRoom}
        activeRoomId={activeRoom?._id}
        socket={socket}
        embedded={true}
        onBackToDashboard={() => navigate("/user")} // ← passes back button to sidebar
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeRoom
          ? <ChatWindow room={activeRoom} socket={socket} onLeaveGroup={handleLeaveGroup} />
          : (
            <div className="no-chat">
              <h3>👈 Select a chat to start messaging</h3>
              <p>Choose a user or group from the sidebar</p>
            </div>
          )
        }
      </div>
    </div>
  );
}
  // ── STANDALONE at /chat — show full sidebar with back button ──
  return (
    <div className="chat-layout">
      <Sidebar
        onSelectRoom={setActiveRoom}
        activeRoomId={activeRoom?._id}
        socket={socket}
        embedded={false}
        onBackToDashboard={() => navigate("/user")}
      />
      {activeRoom
        ? <ChatWindow room={activeRoom} socket={socket} onLeaveGroup={handleLeaveGroup} />
        : (
          <div className="no-chat">
            <h3>👈 Select a chat to start messaging</h3>
            <p>Choose a user or group from the sidebar</p>
          </div>
        )
      }
    </div>
  );
}