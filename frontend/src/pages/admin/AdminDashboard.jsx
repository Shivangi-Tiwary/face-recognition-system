import React from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import AdminOverview from "./AdminOverview";
import TicketingSystem from "./Ticketingsystem";
import "./AdminDashboard.scss";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activePage = location.pathname.includes("/admin/tickets") ? "Tickets" : "Dashboard";

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  const navItems = ["Dashboard", "Tickets"];

  return (
    <div className="admin">
      {/* Sidebar */}
      <aside className="admin__sidebar">
        <h2 className="admin__logo">Admin Panel</h2>
        <ul>
          {navItems.map((item) => (
            <li
              key={item}
              className={activePage === item ? "active" : ""}
              onClick={() => navigate(item === "Tickets" ? "/admin/tickets" : "/admin")}
            >
              {item}
            </li>
          ))}
          <li className="logout" onClick={handleLogout}>Logout</li>
        </ul>
      </aside>

      {/* Main */}
      <main className="admin__main">
        {/* Topbar */}
        <div className="admin__topbar">
          <h3>Welcome, {user?.name || "Admin"}</h3>
        </div>

        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="tickets" element={<TicketingSystem />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;