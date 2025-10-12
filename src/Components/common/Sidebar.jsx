import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaHome, FaUserAlt, FaCog, FaSignOutAlt, FaChartPie, FaBox } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext"; // ✅ usamos el contexto directamente
import "./Sidebar.css";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className={`sidebar-container ${isOpen ? "open" : "collapsed"}`}>
      {/* ======= HEADER ======= */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className={`logo-text ${!isOpen && "hidden"}`}>Lexion</span>
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
      </div>

      {/* ======= NAVIGATION ======= */}
      <ul className="sidebar-nav">
        <li>
          <NavLink to="/dashboard" className="nav-item">
            <FaHome className="nav-icon" />
            <span className={`nav-text ${!isOpen && "hidden"}`}>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/users" className="nav-item">
            <FaUserAlt className="nav-icon" />
            <span className={`nav-text ${!isOpen && "hidden"}`}>Users</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/analytics" className="nav-item">
            <FaChartPie className="nav-icon" />
            <span className={`nav-text ${!isOpen && "hidden"}`}>Analytics</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/settings" className="nav-item">
            <FaCog className="nav-icon" />
            <span className={`nav-text ${!isOpen && "hidden"}`}>Settings</span>
          </NavLink>
        </li>
      </ul>

      {/* ======= FOOTER ======= */}
      <div className="sidebar-footer">
        <FaSignOutAlt
          className="nav-icon logout-icon"
          onClick={handleLogout}
          title="Cerrar sesión"
        />
         <span className={`logo-text ${!isOpen && "hidden"}`}>Cerrar sesion</span>
      </div>
    </div>
  );
}

export default Sidebar;
