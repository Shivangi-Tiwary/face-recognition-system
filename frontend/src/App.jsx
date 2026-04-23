import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Camera from "./pages/Camera";
import FaceLogin from "./pages/facelogin/FaceLogin";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TicketingSystem from "./pages/admin/Ticketingsystem";

// Components
import Protected from "./components/Protected";
import Chatbot from "./pages/chatbot/Chatbot";

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/facelogin" element={<FaceLogin />} />

        {/* Student/User Protected Routes */}
        <Route
          path="/dashboard/*"
          element={
            <Protected role="user">
              <UserDashboard />
            </Protected>
          }
        />
        
        {/* Onboarding Enrollment (Requires Login) */}
        <Route
          path="/camera"
          element={
            <Protected>
              <Camera />
            </Protected>
          }
        />

        <Route
          path="/admin/*"
          element={
            <Protected role="admin">
              <AdminDashboard />
            </Protected>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Persistent Components */}
      <Chatbot />
    </>
  );
}

export default App;