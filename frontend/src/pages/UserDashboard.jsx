import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

import Overview from "./user/Overview";
import Tickets from "./user/Tickets";
import CreateTicket from "./user/CreateTicket";
import TicketDetail from "./user/TicketDetail";
import AttendanceHistory from "./user/AttendanceHistory";
import Profile from "./user/Profile";
import Chat from "./Chat";

/* ─── Shared Utilities & Components ─── */
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

export function PriorityBadge({ priority }) {
  const map = {
    "Low": { bg: "#e8f5e9", color: "#2e7d32" },
    "Medium": { bg: "#fff3e0", color: "#e65100" },
    "High": { bg: "#fce4ec", color: "#c62828" },
    "Urgent": { bg: "#f3e5f5", color: "#6a1b9a" },
  };
  const s = map[priority] || { bg: "#f5f5f5", color: "#555" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11.5, fontWeight: 600, padding: "3px 10px",
      borderRadius: 20, display: "inline-block",
    }}>
      {priority}
    </span>
  );
}

const NAV = [
  { to: "/dashboard", label: "Overview", icon: <GridIcon />, end: true },
  { to: "/dashboard/tickets", label: "My Tickets", icon: <TicketIcon /> },
  { to: "/dashboard/tickets/new", label: "Raise a Ticket", icon: <PlusIcon /> },
  { to: "/dashboard/attendance", label: "Attendance", icon: <CalendarIcon /> },
  { to: "/dashboard/chat", label: "Chat", icon: <ChatIcon /> },
  { to: "/dashboard/profile", label: "Profile", icon: <UserIcon /> },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user: authUser } = useAuth();

  const isChatPage = location.pathname === "/dashboard/chat";

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out!");
      navigate("/");
    } catch (err) {
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f5f7", fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar */}
      {!isChatPage && (
        <aside style={{
          width: 240,
          background: "#0f1117",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
        }}>
          <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>
              Face<span style={{ color: "#4f8ef7" }}>Attend</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>User Portal</div>
          </div>

          <nav style={{ flex: 1, padding: "12px 0" }}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 20px",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  background: isActive ? "rgba(79,142,247,0.15)" : "transparent",
                  borderLeft: isActive ? "3px solid #4f8ef7" : "3px solid transparent",
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s",
                })}
              >
                <span style={{ opacity: 0.85, display: "flex" }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {authUser && (
              <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                {authUser.faceImageUrl ? (
                  <img src={authUser.faceImageUrl} alt="Profile" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#4f8ef7", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13,
                  }}>
                    {authUser.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{authUser.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{authUser.email}</div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 20px",
                background: "none", border: "none", cursor: "pointer",
                color: "#e05252", fontSize: 13.5, fontWeight: 500,
              }}
            >
              <LogoutIcon /> Logout
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main style={{
        marginLeft: isChatPage ? 0 : 240,
        flex: 1,
        minHeight: "100vh",
        padding: isChatPage ? 0 : 24,
      }}>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/new" element={<CreateTicket />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="attendance" element={<AttendanceHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="chat" element={<ChatWrapper />} />
        </Routes>
      </main>
    </div>
  );
}

function ChatWrapper() {
  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <Chat embedded={true} />
    </div>
  );
}

/* ─── Shared UI Helpers ─── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f1117" }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13.5 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}


export function StatCard({ label, value, color = "#4f8ef7", sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e8eaed",
      padding: "20px 24px", flex: 1, minWidth: 120, boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    "Open": { bg: "#fff3e0", color: "#e65100" },
    "In Progress": { bg: "#e3f2fd", color: "#1565c0" },
    "Resolved": { bg: "#e8f5e9", color: "#2e7d32" },
    "Pending": { bg: "#f3e5f5", color: "#6a1b9a" },
  };
  const s = map[status] || { bg: "#f5f5f5", color: "#555" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11.5, fontWeight: 600, padding: "3px 10px",
      borderRadius: 20, display: "inline-block",
    }}>
      {status}
    </span>
  );
}

/* ─── Icons ─── */
function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function TicketIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>; }
function PlusIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>; }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function ChatIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function UserIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function LogoutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }