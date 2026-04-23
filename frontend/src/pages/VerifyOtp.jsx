import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const pendingToken = localStorage.getItem("pendingToken");
    if (!pendingToken) {
      toast.error("No pending verification found. Please login again.");
      navigate("/");
    }
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying code...");

    try {
      const pendingToken = localStorage.getItem("pendingToken");
      const { data } = await api.post("/auth/verify-otp", { pendingToken, otp });
      
      localStorage.removeItem("pendingToken");
      login(data.token, data.user);
      toast.success(`Verification successful! Welcome, ${data.user.name}`, { id: toastId });
      
      // Robust Redirection
      const userRole = data.user.role?.toLowerCase();
      console.log("Verified user role:", userRole);

      if (userRole === "admin") {
        navigate("/admin");
      } else {
        if (!data.user.faceEnrolled) {
          navigate("/camera");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Invalid conversion or expired OTP. Try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    const toastId = toast.loading("Resending code...");
    try {
      const pendingToken = localStorage.getItem("pendingToken");
      const { data } = await api.post("/auth/resend-otp", { pendingToken });
      localStorage.setItem("pendingToken", data.pendingToken);
      toast.success("A new verification code has been sent to your email.", { id: toastId });
    } catch (err) {
      toast.error("Failed to resend code. Please try logging in again.", { id: toastId });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Verify Your Email 📧</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
          We've sent a 6-digit security code to your registered email address.
        </p>

        <form onSubmit={handleVerify}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter 6-digit Code"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              style={{ textAlign: "center", letterSpacing: "8px", fontSize: "20px", fontWeight: "bold" }}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Checking..." : "Confirm & Login"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Didn't get the code?{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "#6c63ff",
                cursor: "pointer",
                fontWeight: "600",
                textDecoration: "underline",
                padding: 0
              }}
            >
              {resending ? "Sending..." : "Resend Code"}
            </button>
          </p>
          <button
            onClick={() => navigate("/")}
            style={{ marginTop: "15px", background: "none", border: "none", color: "#888", cursor: "pointer" }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}