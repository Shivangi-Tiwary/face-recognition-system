import { useRef, useState } from "react";
import Webcam from "react-webcam";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./FaceLogin.scss";

const FaceLogin = () => {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Webcam not ready. Please try again.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Analyzing face...");

    try {
      const fetchRes = await fetch(imageSrc);
      const blob = await fetchRes.blob();
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("faceImage", file);

      const res = await api.post(
        "/auth/login-with-face",
        formData
      );

      if (res.data.mfaPending) {
        localStorage.setItem("pendingToken", res.data.pendingToken);
        toast.success("Face recognized! Check your email for OTP.", { id: toastId });
        navigate("/verify-otp");
      } else {
        // Use context login
        login(res.data.token, res.data.user);
        toast.success(`Welcome, ${res.data.user.name}`, { id: toastId });
        
        // Robust Redirection
        const role = res.data.user.role?.toLowerCase();
        console.log("Face login successful. User role:", role);

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Face not recognized. Position yourself better.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="face-login-container">
      <div className="face-login-card">
        <h2>Face Login</h2>
        <p>Position your face in the center of the frame</p>

        <div className="webcam-wrapper">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            mirrored={true}
          />
        </div>

        <button onClick={capture} disabled={loading} className="capture-btn">
          {loading ? "Verifying..." : "Authenticate"}
        </button>
        
        <button onClick={() => navigate("/")} className="back-btn">
          Back to Password Login
        </button>
      </div>
    </div>
  );
};

export default FaceLogin;