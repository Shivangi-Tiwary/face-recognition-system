import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import api from "../../api/axios";
import toast from "react-hot-toast";

const AttendanceRecorder = ({ type, onSuccess, onClose }) => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanStatus, setScanStatus] = useState("Initializing camera...");

  const capture = async () => {
    if (loading || !cameraReady) return;
    
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setLoading(true);
    setScanStatus("Scanning face...");

    try {
      const fetchRes = await fetch(imageSrc);
      const blob = await fetchRes.blob();
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("faceImage", file);
      formData.append("location", "Dashboard Auto-Scanner");

      const endpoint = type === "check-in" ? "/attendance/check-in" : "/attendance/check-out";
      const res = await api.post(endpoint, formData);

      if (res.data.success) {
        toast.success(res.data.message || `${type} successful!`);
        onSuccess(res.data.attendance);
      }
    } catch (err) {
      console.error("Auto-scan error:", err.response?.data?.error);
      setScanStatus("Face not recognized. Keep looking at the camera...");
      // Wait a bit before next attempt
      setTimeout(() => setLoading(false), 2000);
    }
  };

  useEffect(() => {
    if (cameraReady) setScanStatus("Ready to scan. Please center your face.");
  }, [cameraReady]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", padding: "40px 32px", borderRadius: 24, width: "100%", maxWidth: 480,
        textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
      }}>
        <h2 style={{ marginBottom: 12, fontSize: 26, fontWeight: 800, color: "#1a202c" }}>
          {type === "check-in" ? "Automatic Check-In" : "Automatic Check-Out"}
        </h2>
        <p style={{ color: "#718096", marginBottom: 28, fontSize: 15 }}>
          The system will automatically detect your face and mark your attendance.
        </p>

        <div style={{
          width: "100%", aspectRatio: "1", background: "#000", borderRadius: 20,
          overflow: "hidden", marginBottom: 28, position: "relative",
          border: `4px solid ${loading ? "#4299e1" : "#e2e8f0"}`,
          transition: "border-color 0.3s ease"
        }}>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            mirrored={true}
            onUserMedia={() => setCameraReady(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          
          {/* Scanning Animation */}
          {cameraReady && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "2px",
              background: "rgba(66, 153, 225, 0.6)",
              boxShadow: "0 0 15px 5px rgba(66, 153, 225, 0.4)",
              animation: "scanLine 2s linear infinite",
              zIndex: 10
            }} />
          )}

          {/* Face Overlay Guideline */}
          <div style={{
             position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
             width: "65%", height: "75%", border: "2px solid rgba(255,255,255,0.3)",
             borderRadius: "50% 50% 45% 45%", pointerEvents: "none"
          }} />
        </div>

        <div style={{ 
          background: "#f7fafc", padding: "12px 20px", borderRadius: 12, 
          marginBottom: 32, border: "1px solid #edf2f7"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading && <div className="mini-spinner" />}
            <span style={{ 
              fontSize: 14, fontWeight: 600, 
              color: loading ? "#2b6cb0" : "#4a5568" 
            }}>
              {scanStatus}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0",
              background: "#fff", color: "#4a5568", fontWeight: 700, cursor: "pointer",
              fontSize: 15, transition: "all 0.2s"
            }}
          >
            Cancel
          </button>
          <button
            onClick={capture}
            disabled={loading || !cameraReady}
            style={{
              flex: 2, padding: "14px", borderRadius: "14px", border: "none",
              background: loading || !cameraReady ? "#cbd5e1" : "#4f8ef7", color: "#fff", 
              fontWeight: 700, cursor: loading || !cameraReady ? "not-allowed" : "pointer",
              fontSize: 15, transition: "all 0.2s",
              boxShadow: "0 4px 6px -1px rgba(79, 142, 247, 0.4)"
            }}
          >
            {loading ? "Scanning..." : "Capture & Mark"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .mini-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top-color: #4299e1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AttendanceRecorder;
