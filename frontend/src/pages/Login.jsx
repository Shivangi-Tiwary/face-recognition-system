import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import "./Register.scss";

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const role = user.role?.toLowerCase();
      if (role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    role: "student",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(
        "/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (res.data.mfaPending) {
        localStorage.setItem("pendingToken", res.data.pendingToken);
        toast.success("Correct credentials! Redirecting for OTP verification...");
        navigate("/verify-otp");
      } else {
        // Use the context login function
        login(res.data.token, res.data.user);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        
        // Robust Redirection
        const role = res.data.user.role?.toLowerCase();
        console.log("Logged in user role:", role);
        
        if (role === "admin") {
          navigate("/admin");
        } else {
          if (!res.data.user.faceEnrolled) {
            navigate("/camera");
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Login failed. Please check your credentials.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-card" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <div className="input-group">
          <label>Login As</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="********"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ marginTop: "10px" }}>
          Don’t have an account?{" "}
          <span
            style={{ color: "#667eea", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/register")}
          >
            Register Now
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;