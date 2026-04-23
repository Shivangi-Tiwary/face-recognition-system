import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import "./Register.scss";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    role: "student",
    name: "",
    email: "",
    password: "",
    enrollment: "",
    department: "",
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
        "/auth/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          enrollment: formData.enrollment,
          department: formData.department,
        }
      );

      if (res.data.mfaPending) {
        localStorage.setItem("pendingToken", res.data.pendingToken);
        toast.success("Registration successful! Verify OTP sent to your email.");
        navigate("/verify-otp");
      } else {
        login(res.data.token, res.data.user);
        toast.success("Account created successfully!");
        navigate(formData.role === "admin" ? "/admin" : "/camera");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Registration failed. Please check all fields.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-card" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        <div className="input-group">
          <label>Register As</label>
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
          <label>Name</label>
          <input
            name="name"
            placeholder="John Doe"
            onChange={handleChange}
            required
            autoComplete="name"
          />
        </div>

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="john@example.com"
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            placeholder="Min 8 characters"
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>
        
        {formData.role === "student" && (
          <>
            <div className="input-group">
              <label>Enrollment Number</label>
              <input
                name="enrollment"
                placeholder="e.g. 19002011"
                value={formData.enrollment}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label>Department</label>
              <select 
                name="department" 
                value={formData.department} 
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Proceed to Enrollment"}
        </button>

        <p style={{ marginTop: "10px" }}>
          Already have an account?{" "}
          <span
            style={{ color: "#667eea", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;