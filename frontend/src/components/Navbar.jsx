import "../styles/navbar.scss";

const Navbar = () => {
  return (
    <div className="navbar">
      <h3>Dashboard</h3>
      <div className="profile">
        <span>Admin</span>
        <button>Logout</button>
      </div>
    </div>
  );
};

export default Navbar;
