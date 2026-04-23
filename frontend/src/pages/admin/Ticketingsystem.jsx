import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./Ticketingsystem.scss";

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Recognition Failure", "Hardware", "AI Model", "Enrollment", "Access Control"];
const PRIORITIES  = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES    = ["Open", "In Progress", "Pending", "Resolved", "Closed"];

const PRI_COLOR = { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" };
const STA_COLOR = { "Open": "#f97316", "In Progress": "#3b82f6", "Pending": "#a855f7", "Resolved": "#22c55e", "Closed": "#94a3b8" };

export default function TicketingSystem() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [tickets, setTickets]       = useState([]);
  const [filterCat, setFilterCat]   = useState("All");
  const [filterPri, setFilterPri]   = useState("All");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [comment, setComment]       = useState("");
  const [form, setForm] = useState({
    title: "", userEmail: "",
    priority: "Medium", category: "Recognition Failure", description: "",
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets/admin/all");
      setTickets(res.data.tickets || res.data || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      toast.error("Failed to load tickets");
    }
  };

  // Stats
  const stats = [
    { label: "Total Tickets", value: tickets.length },
    { label: "Open",          value: tickets.filter(t => t.status === "Open").length },
    { label: "Resolved",      value: tickets.filter(t => t.status === "Resolved").length },
    { label: "Critical",      value: tickets.filter(t => t.priority === "Critical").length },
  ];

  // Filtered rows
  const filtered = (tickets || []).filter(t => {
    const s = search.toLowerCase();
    const tid = (t.ticketId || "").toLowerCase();
    const title = (t.title || "").toLowerCase();
    const req = (t.requester || "").toLowerCase();
    
    return (
      (tid.includes(s) || title.includes(s) || req.includes(s)) &&
      (filterCat === "All" || t.category === filterCat) &&
      (filterPri === "All" || t.priority === filterPri)
    );
  });

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/admin/${id}/status`, { status });
      // Update local state instead of refetching for immediate UI feedback
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status } : t));
      if (selected?._id === id) setSelected(s => ({ ...s, status }));
      toast.success("Status updated");
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.userEmail.trim()) return;
    try {
      const res = await api.post("/tickets/admin", form);
      // Prepend to top of local state immediately
      setTickets(prev => [res.data.ticket, ...prev]);
      setForm({ title: "", requester: "", userEmail: "", priority: "Medium", category: "Recognition Failure", description: "" });
      setShowCreate(false);
      toast.success("Ticket created successfully");
    } catch (err) {
      console.error("Failed to create ticket:", err);
      toast.error(err.response?.data?.error || "Failed to create ticket");
    }
  };


  return (
    <>
        {/* Topbar */}
        <div className="admin__topbar ts-topbar-row">
          <div>
            <h3>Support Tickets</h3>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Manage all student requests</p>
          </div>
          <button className="ts-btn-primary" onClick={() => setShowCreate(true)}>+ New Ticket</button>
        </div>

        {/* Stats */}
        <div className="admin__cards">
          {stats.map(s => (
            <div className="card" key={s.label}>
              <h4>{s.label}</h4>
              <p>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="ts-filters">
          <input
            className="ts-search"
            placeholder="Search by ID, title, name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="ts-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="ts-select" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Table — same structure as Students List */}
        <div className="admin__table">
          <h3>Tickets List</h3>
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title</th>
                <th>Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No tickets found</td></tr>
              ) : filtered.map(t => (
                <tr key={t._id} style={{ cursor: "pointer" }} onClick={() => setSelected(t)}>
                  <td style={{ color: "#3b82f6", fontWeight: 600 }}>{t.ticketId}</td>
                  <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</td>
                  <td>{t.requester}</td>
                  <td>{t.email}</td>
                  <td>{t.category}</td>
                  <td style={{ color: PRI_COLOR[t.priority], fontWeight: 600 }}>{t.priority}</td>
                  <td
                    className={
                      t.status === "Resolved" ? "approved" :
                      t.status === "Closed"   ? "approved" : "pending"
                    }
                    style={{ color: STA_COLOR[t.status], fontWeight: 600 }}
                  >
                    {t.status}
                  </td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select
                      className="ts-inline-select"
                      value={t.status}
                      onChange={e => changeStatus(t._id, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* ── Ticket Detail Panel ── */}
      {selected && (
        <div className="ts-overlay" onClick={() => setSelected(null)}>
          <div className="ts-panel" onClick={e => e.stopPropagation()}>

            <div className="ts-panel-header">
              <div>
                <span className="ts-panel-id">{selected.ticketId}</span>
                <h3 className="ts-panel-title">{selected.title}</h3>
              </div>
              <button className="ts-close-btn" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="ts-panel-grid">
              {[
                ["Name",     selected.requester],
                ["Email",    selected.email || "N/A"],
                ["Category", selected.category],
                ["Agent",    selected.agent || "Unassigned"],
                ["Created",  new Date(selected.createdAt).toLocaleDateString()],
              ].map(([k, v]) => (
                <div className="ts-pfield" key={k}>
                  <div className="ts-pfield-label">{k}</div>
                  <div className="ts-pfield-val">{v}</div>
                </div>
              ))}
              <div className="ts-pfield">
                <div className="ts-pfield-label">Priority</div>
                <span style={{ color: PRI_COLOR[selected.priority], fontWeight: 700 }}>{selected.priority}</span>
              </div>
              <div className="ts-pfield">
                <div className="ts-pfield-label">Status</div>
                <select
                  className="ts-inline-select"
                  value={selected.status}
                  onChange={e => changeStatus(selected._id, e.target.value)}
                >
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="ts-panel-section">
              <div className="ts-section-label">Description</div>
              <p className="ts-panel-desc">
                {selected.description || (
                  <>
                  Issue reported by <strong>{selected.requester}</strong> regarding: <em>{selected.title}</em>.
                  Category: {selected.category}. Please investigate and update the status accordingly.
                  </>
                )}
              </p>
            </div>

            <div className="ts-panel-section">
              <div className="ts-section-label">Activity Log</div>
              {[
                `Ticket created by ${selected.requester} on ${selected.created}`,
                `Assigned to ${selected.agent || "Unassigned"}`,
                `Current status: ${selected.status}`,
              ].map((a, i) => (
                <div className="ts-activity" key={i}>
                  <span className="ts-activity-dot" />
                  <span>{a}</span>
                </div>
              ))}
            </div>

            <div className="ts-panel-section">
              <div className="ts-section-label">Add Comment</div>
              <textarea
                className="ts-textarea"
                rows={3}
                placeholder="Write a comment or update..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <button className="ts-btn-primary" onClick={() => setComment("")}>Send Reply</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Create Ticket Modal ── */}
      {showCreate && (
        <div className="ts-overlay" onClick={() => setShowCreate(false)}>
          <div className="ts-modal" onClick={e => e.stopPropagation()}>

            <div className="ts-panel-header">
              <h3 className="ts-panel-title">Create New Ticket</h3>
              <button className="ts-close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <div className="ts-form-grid">
              {[
                { label: "Title *",        key: "title",     ph: "e.g. Face not detected at gate" },
                { label: "Student Email *", key: "userEmail", ph: "e.g. test@guni.com" },
              ].map(f => (
                <div className="ts-form-field" key={f.key}>
                  <label className="ts-form-label">{f.label}</label>
                  <input
                    className="ts-form-input"
                    placeholder={f.ph}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}

              <div className="ts-form-field">
                <label className="ts-form-label">Priority</label>
                <select className="ts-form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {["Critical", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="ts-form-field ts-form-full">
                <label className="ts-form-label">Category</label>
                <select className="ts-form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="ts-form-field ts-form-full">
                <label className="ts-form-label">Description</label>
                <textarea
                  className="ts-form-input ts-textarea"
                  rows={3}
                  placeholder="Describe the issue..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="ts-modal-actions">
              <button className="ts-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="ts-btn-primary" onClick={handleCreate}>Create Ticket</button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}