import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import api from "../api/axios";
import toast from "react-hot-toast";

const Camera = () => {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [captured, setCaptured] = useState(false); // show preview after capture

  const captureFace = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error("Camera not ready. Please wait.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Generating face embedding...");

    try {
      // Convert base64 screenshot to File
      const fetchRes = await fetch(imageSrc);
      const blob = await fetchRes.blob();
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("faceImage", file);

      // POST to /auth/enroll-face
      // Backend will:
      //   1. Call FastAPI to extract embedding → store in MongoDB (User.faceEmbedding)
      //   2. Upload image to Supabase → store URL (User.faceImageUrl)
      //   3. Set User.faceEnrolled = true
      const res = await api.post("/auth/enroll-face", formData);

      toast.success("Face enrolled successfully! Redirecting to dashboard...", { id: toastId });
      setCaptured(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Face enrollment failed. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      padding: "20px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 24,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 480,
        boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        textAlign: "center",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f1117" }}>
            Face Enrollment
          </h2>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14, lineHeight: 1.5 }}>
            Position your face clearly in the frame, then click <strong>Capture & Enroll</strong>.<br />
            Your face will be saved securely to your account.
          </p>
        </div>

        {/* Webcam */}
        <div style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `3px solid ${cameraReady ? "#4f8ef7" : "#e2e8f0"}`,
          marginBottom: 20,
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
            onUserMediaError={() => toast.error("Camera access denied. Please allow camera permissions.")}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />

          {/* Face oval guide overlay */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "55%",
            height: "75%",
            border: "2px dashed rgba(79, 142, 247, 0.6)",
            borderRadius: "50% 50% 45% 45%",
            pointerEvents: "none",
          }} />

          {/* Status dot */}
          {cameraReady && (
            <div style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "#22c55e",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 20,
            }}>
              ● LIVE
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: "#f8faff",
          border: "1px solid #e0e7ff",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 13,
          color: "#4a5568",
          textAlign: "left",
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "#3b5bdb" }}>Tips for best results:</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
            <li>Face the camera directly</li>
            <li>Ensure good lighting (avoid backlight)</li>
            <li>Keep your face within the oval guide</li>
            <li>Remove glasses or hat if possible</li>
          </ul>
        </div>

        {/* Capture Button */}
        <button
          onClick={captureFace}
          disabled={loading || !cameraReady || captured}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: captured ? "#22c55e" : (loading || !cameraReady ? "#cbd5e1" : "#4f8ef7"),
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            cursor: loading || !cameraReady || captured ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: loading || !cameraReady || captured ? "none" : "0 4px 12px rgba(79,142,247,0.4)",
          }}
        >
          {captured ? "✅ Enrolled! Redirecting..." : loading ? "Processing..." : cameraReady ? "Capture & Enroll" : "Starting Camera..."}
        </button>

        <p style={{ marginTop: 16, fontSize: 12, color: "#aaa" }}>
          🔒 Your face data is encrypted and used only for attendance verification.
        </p>
      </div>
    </div>
  );
};

export default Camera;