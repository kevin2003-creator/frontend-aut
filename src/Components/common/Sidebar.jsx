import { NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaHome, FaUserAlt, FaSignOutAlt, FaChartPie } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

function Sidebar({ isOpen, setIsOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      {/* Botón de toggle para móviles */}
      <button 
        className="mobile-toggle-btn d-md-none"
        onClick={toggleSidebar}
      >
        <FaBars />
      </button>

      <div className={`sidebar-container ${isOpen ? "open" : "collapsed"}`}>
        {/* HEADER */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🧠</span>
            <span className={`logo-text ${!isOpen && "hidden"}`}>LexicoAU</span>
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <FaBars />
          </button>
        </div>

        {/* NAVIGATION */}
        <ul className="sidebar-nav">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `nav-item ${isActive ? "active" : ""}`
              }
              end
            >
              <FaHome className="nav-icon" />
              <span className={`nav-text ${!isOpen && "hidden"}`}>Inicio</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/dashboard/analizador" 
              className={({ isActive }) => 
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <FaChartPie className="nav-icon" />
              <span className={`nav-text ${!isOpen && "hidden"}`}>Analizador</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/dashboard/profile" 
              className={({ isActive }) => 
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <FaUserAlt className="nav-icon" />
              <span className={`nav-text ${!isOpen && "hidden"}`}>Perfil</span>
            </NavLink>
          </li>
        </ul>

        {/* FOOTER */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="logout-icon" />
            <span className={`logout-text ${!isOpen && "hidden"}`}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;