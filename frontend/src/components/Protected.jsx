import { Navigate } from "react-router-dom";

const Protected = ({ children, role }) => {

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // If not logged in
  if (!token) {
    return <Navigate to="/" />;
  }

  // If role doesn't match
  if (role && user?.role?.toLowerCase() !== role.toLowerCase()) {
    console.log("Protection check failed. Expected:", role, "Got:", user?.role);
    return <Navigate to="/" />;
  }

  return children;
};

export default Protected;