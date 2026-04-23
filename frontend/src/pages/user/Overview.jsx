import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { PageHeader, StatCard } from "../UserDashboard";

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(null); // null | 'check-in' | 'check-out'
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []); 

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/dashboard");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceSuccess = () => {
    setShowScanner(null);
    fetchDashboard(); // Refresh dashboard data
  };

  if (loading) return <LoadingScreen />;

  const { user, today, monthStats, recentAttendance } = data || {};
  const pct = parseFloat(monthStats?.attendancePercentage || 0);

  return (
    <div style={{ padding: "32px 32px 48px" }}>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "User"} 👋`}
        subtitle={new Date().toLocaleDateString("en-IN", {
          weekday: "long", year: "numeric", month: "long", day: "numeric"
        })}
        action={
          <button
            onClick={() => navigate("/dashboard/tickets/new")}
            style={{
              background: "#4f8ef7", color: "#fff", border: "none",
              padding: "10px 20px", borderRadius: 8, fontSize: 13.5,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            + Raise a Ticket
          </button>
        }
      />

      {/* Today's Status Banner */}
      <TodayBanner
        today={today}
        onAction={(type) => setShowScanner(type)}
      />

      {/* Face Scanner Modal for Attendance */}
      {showScanner && (
        <FaceScannerModal
          type={showScanner}
          user={user}
          onSuccess={handleAttendanceSuccess}
          onClose={() => setShowScanner(null)}
        />
      )}

      {/* Monthly Stats */}
      <h2 style={{
        fontSize: 14, fontWeight: 600, color: "#555",
        margin: "28px 0 12px", textTransform: "uppercase", letterSpacing: 0.5
      }}>
        This Month
      </h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Working Days" value={monthStats?.workingDays ?? "—"} />
        <StatCard label="Present" value={monthStats?.presentDays ?? "—"} color="#22c55e" />
        <StatCard label="Absent" value={monthStats?.absentDays ?? "—"} color="#ef4444" />
        <StatCard label="On Time" value={monthStats?.onTime ?? "—"} color="#4f8ef7" />
        <StatCard label="Late" value={monthStats?.late ?? "—"} color="#f59e0b" />
        <StatCard label="Half Day" value={monthStats?.halfDay ?? "—"} color="#8b5cf6" />
      </div>

      {/* Attendance Percentage Bar */}
      <AttendanceBar pct={pct} />

      {/* Recent Attendance Table */}
      <div style={{
        background: "#fff", borderRadius: 12,
        border: "1px solid #e8eaed", marginTop: 28
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #f0f0f0",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#0f1117" }}>Recent Attendance</span>
          <button
            onClick={() => navigate("/dashboard/attendance")}
            style={{
              background: "none", border: "none", color: "#4f8ef7",
              fontSize: 13, cursor: "pointer", fontWeight: 500
            }}
          >
            View All →
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              {["Date", "Check In", "Check Out", "Duration", "Status"].map((h) => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 12, color: "#888", fontWeight: 600,
                  borderBottom: "1px solid #f0f0f0"
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentAttendance || []).map((row, i) => {
              const dur = row.checkOut ? calcDuration(row.checkIn, row.checkOut) : "—";
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f8f8f8" }}>
                  <td style={td}>{formatDate(row.date)}</td>
                  <td style={td}>{row.checkIn ? formatTime(row.checkIn) : "—"}</td>
                  <td style={td}>{row.checkOut ? formatTime(row.checkOut) : "—"}</td>
                  <td style={td}>{dur}</td>
                  <td style={td}><AttendanceStatusBadge status={row.status} /></td>
                </tr>
              );
            })}
            {(!recentAttendance || recentAttendance.length === 0) && (
              <tr>
                <td colSpan={5} style={{
                  padding: 24, textAlign: "center", color: "#aaa", fontSize: 13
                }}>
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Face not enrolled warning */}
      {!user?.faceEnrolled && (
        <div style={{
          background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 12,
          padding: "16px 20px", marginTop: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#e65100" }}>Face not enrolled</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
              Please go to <span
                onClick={() => navigate("/camera")}
                style={{ color: "#4f8ef7", cursor: "pointer", fontWeight: 600 }}
              >Enroll Face</span> to enable face attendance.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Face Scanner Modal for Attendance ── */
function FaceScannerModal({ type, user, onSuccess, onClose }) {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error("Camera not ready. Please wait.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Scanning face...");

    try {
      const fetchRes = await fetch(imageSrc);
      const blob = await fetchRes.blob();
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("faceImage", file);
      formData.append("location", "Dashboard");
      if (user?._id) {
        formData.append("userId", user._id);
      }

      // Use the attendance check-in/check-out endpoint
      // Backend will: 
      //   1. Compare captured face embedding against all enrolled users (stored in MongoDB)
      //   2. If match confidence > 0.55 → identify user
      //   3. Create/update Attendance record
      const endpoint = type === "check-in" ? "/attendance/check-in" : "/attendance/check-out";
      const res = await api.post(endpoint, formData);

      if (res.data.success) {
        toast.success(res.data.message || `${type === "check-in" ? "Check-in" : "Check-out"} successful!`, { id: toastId });
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Face not recognized. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 24,
        padding: "36px 32px",
        width: "100%",
        maxWidth: 460,
        textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
      }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0f1117" }}>
          {type === "check-in" ? "Face Check-In 🟢" : "Face Check-Out 🔴"}
        </h2>
        <p style={{ color: "#666", fontSize: 13.5, margin: "0 0 20px" }}>
          Position your face in the frame and click <strong>Scan Now</strong>.
          <br />Your face will be matched against your registered profile.
        </p>

        {/* Webcam */}
        <div style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `3px solid ${cameraReady ? (type === "check-in" ? "#22c55e" : "#ef4444") : "#e2e8f0"}`,
          marginBottom: 16,
          position: "relative",
          background: "#000",
          aspectRatio: "4/3",
          transition: "border-color 0.3s",
        }}>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            mirrored={true}
            onUserMedia={() => setCameraReady(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />

          {/* Face oval guide */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "55%", height: "75%",
            border: `2px dashed ${type === "check-in" ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)"}`,
            borderRadius: "50% 50% 45% 45%",
            pointerEvents: "none",
          }} />

          {cameraReady && (
            <div style={{
              position: "absolute", top: 10, right: 10,
              background: "#22c55e", color: "#fff",
              fontSize: 11, fontWeight: 700,
              padding: "3px 8px", borderRadius: 20,
            }}>
              ● LIVE
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "13px", borderRadius: 12,
              border: "1px solid #e2e8f0", background: "#fff",
              color: "#555", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={capture}
            disabled={loading || !cameraReady}
            style={{
              flex: 2, padding: "13px", borderRadius: 12, border: "none",
              background: loading || !cameraReady
                ? "#cbd5e1"
                : type === "check-in" ? "#22c55e" : "#ef4444",
              color: "#fff", fontWeight: 700, cursor: loading || !cameraReady ? "not-allowed" : "pointer",
              fontSize: 14,
              boxShadow: loading || !cameraReady ? "none" : "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {loading ? "Scanning..." : cameraReady ? "Scan Now" : "Starting Camera..."}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Today Banner ── */
function TodayBanner({ today, onAction }) {
  if (!today) {
    return (
      <div style={{
        background: "#f8f9ff", border: "1px dashed #c7d3f0", borderRadius: 12,
        padding: "18px 24px", display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ fontSize: 28 }}>🕐</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#444", fontSize: 15 }}>
            Not checked in yet today
          </div>
          <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
            Click the button to scan your face and mark attendance.
          </div>
        </div>
        <button
          onClick={() => onAction("check-in")}
          style={{
            padding: "10px 22px",
            background: "#22c55e",
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          Mark Attendance
        </button>
      </div>
    );
  }

  const statusColors = {
    "on-time": "#22c55e",
    "late": "#f59e0b",
    "half-day": "#8b5cf6",
    "absent": "#ef4444"
  };
  const statusEmoji = {
    "on-time": "✅",
    "late": "⏰",
    "half-day": "⚡",
    "absent": "❌"
  };

  return (
    <div style={{
      background: "#fff", border: "1px solid #e8eaed", borderRadius: 12,
      padding: "18px 24px", display: "flex", gap: 32,
      flexWrap: "wrap", alignItems: "center",
      borderLeft: `4px solid ${statusColors[today.status] || "#4f8ef7"}`,
    }}>
      <div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>TODAY'S STATUS</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{statusEmoji[today.status]}</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: statusColors[today.status] }}>
            {today.status?.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>CHECK IN</div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {today.checkIn ? formatTime(today.checkIn) : "—"}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>CHECK OUT</div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {today.checkOut ? formatTime(today.checkOut) : "Pending"}
        </div>
      </div>

      {today.checkIn && today.checkOut && (
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>DURATION</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {calcDuration(today.checkIn, today.checkOut)}
          </div>
        </div>
      )}

      {today.confidence !== undefined && (
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>FACE CONFIDENCE</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {(today.confidence * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {/* Check Out button — only if checked in but not yet checked out */}
      {today.checkIn && !today.checkOut && (
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => onAction("check-out")}
            style={{
              padding: "10px 22px",
              background: "#ef4444",
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Check Out
          </button>
        </div>
      )}

      {/* Checked out confirmation */}
      {today.checkIn && today.checkOut && (
        <div style={{ marginLeft: "auto" }}>
          <span style={{
            background: "#e8f5e9", color: "#2e7d32",
            fontSize: 13, fontWeight: 600, padding: "8px 16px",
            borderRadius: 8, display: "inline-block",
          }}>
            ✓ Checked Out
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Attendance Bar ── */
function AttendanceBar({ pct }) {
  const color = pct >= 90 ? "#22c55e" : pct >= 75 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: "1px solid #e8eaed", padding: "20px 24px"
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 10
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f1117" }}>Attendance Rate</span>
        <span style={{ fontSize: 18, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ background: "#f0f0f0", borderRadius: 8, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color, borderRadius: 8,
          transition: "width 0.8s ease",
        }} />
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        {[
          { label: "Excellent", range: "≥90%", active: pct >= 90 },
          { label: "Good", range: "75–89%", active: pct >= 75 && pct < 90 },
          { label: "Needs Improvement", range: "<75%", active: pct < 75 },
        ].map((item) => (
          <div key={item.label} style={{
            fontSize: 11.5,
            color: item.active ? color : "#ccc",
            fontWeight: item.active ? 600 : 400,
          }}>
            {item.label} ({item.range})
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Attendance Status Badge ── */
function AttendanceStatusBadge({ status }) {
  const map = {
    "on-time": { bg: "#e8f5e9", color: "#2e7d32", label: "On Time" },
    "late": { bg: "#fff8e1", color: "#f57f17", label: "Late" },
    "half-day": { bg: "#f3e5f5", color: "#6a1b9a", label: "Half Day" },
    "absent": { bg: "#fce4ec", color: "#c62828", label: "Absent" },
  };
  const s = map[status] || { bg: "#f5f5f5", color: "#555", label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11.5, fontWeight: 600,
      padding: "3px 10px", borderRadius: 20
    }}>
      {s.label}
    </span>
  );
}

/* ── Loading Screen ── */
function LoadingScreen() {
  return (
    <div style={{ padding: 32 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: "#f0f0f0", borderRadius: 12,
          height: 80, marginBottom: 16,
        }} />
      ))}
    </div>
  );
}

/* ── Helpers ── */
const td = { padding: "12px 16px", fontSize: 13.5, color: "#333" };

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit"
  });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function calcDuration(checkIn, checkOut) {
  const diff = (new Date(checkOut) - new Date(checkIn)) / 1000 / 60;
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return `${h}h ${m}m`;
}