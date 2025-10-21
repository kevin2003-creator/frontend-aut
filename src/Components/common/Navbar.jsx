import { useState } from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { 
  FaHome, 
  FaUserAlt, 
  FaSignOutAlt, 
  FaChartPie,
  FaBars,
  FaTimes,
  FaUserCircle 
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

const getProfileImage = () => {
  if (user?.foto_perfil) {  // ✅ MISMO campo que Profile
    return `data:image/jpeg;base64,${user.foto_perfil}`; // ✅ MISMO formato
  }
  return null;
};

  const profileImage = getProfileImage();

  return (
    <>
      <nav className="navbar-container">
        <div className="navbar-content">
          {/* Logo y marca */}
          <div className="navbar-brand">
            <span className="navbar-logo-icon">🧠</span>
            <span className="navbar-logo-text">LexicoAU</span>
          </div>

          {/* Menú para desktop */}
          <div className="navbar-menu-desktop">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `nav-link ${isActive ? "active" : ""}`
              }
              end
            >
              <FaHome className="nav-icon" />
              <span>Inicio</span>
            </NavLink>
            
            <NavLink 
              to="/dashboard/analizador" 
              className={({ isActive }) => 
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <FaChartPie className="nav-icon" />
              <span>Analizador</span>
            </NavLink>
            
            <NavLink 
              to="/dashboard/profile" 
              className={({ isActive }) => 
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <FaUserAlt className="nav-icon" />
              <span>Perfil</span>
            </NavLink>
          </div>

          {/* Información del usuario y logout */}
          <div className="navbar-user-section">
            <div className="user-profile">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={`${user?.nombre_completo || 'Usuario'}`}
                  className="user-avatar"
                  onError={(e) => {
                    // Si falla la imagen, mostrar placeholder
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="user-avatar-placeholder">
                  <FaUserCircle />
                </div>
              )}
              <span className="user-info">
                👋 Hola, <strong>{user?.nombre_completo?.split(' ')[0] || 'Usuario'}</strong>
              </span>
            </div>
            <button 
              className="logout-btn-desktop"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <FaSignOutAlt />
              <span>Cerrar sesión</span>
            </button>
          </div>

          {/* Botón hamburguesa para móvil */}
          <button 
            className="navbar-toggle"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Menú para móvil */}
        <div className={`navbar-menu-mobile ${isMenuOpen ? "open" : ""}`}>
          <div className="mobile-menu-header">
            <div className="user-profile-mobile">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={`${user?.nombre_completo || 'Usuario'}`}
                  className="user-avatar-mobile"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="user-avatar-placeholder-mobile">
                  <FaUserCircle />
                </div>
              )}
              <div className="user-info-mobile">
                <span className="user-name">{user?.nombre_completo || 'Usuario'}</span>
                <span className="user-email">{user?.email || ''}</span>
              </div>
            </div>
          </div>

          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `nav-link-mobile ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
            end
          >
            <FaHome className="nav-icon" />
            <span>Inicio</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard/analizador" 
            className={({ isActive }) => 
              `nav-link-mobile ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            <FaChartPie className="nav-icon" />
            <span>Analizador</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard/profile" 
            className={({ isActive }) => 
              `nav-link-mobile ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            <FaUserAlt className="nav-icon" />
            <span>Perfil</span>
          </NavLink>

          <button 
            className="logout-btn-mobile"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="nav-icon" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>

      {/* Overlay para móvil */}
      {isMenuOpen && (
        <div 
          className="navbar-overlay"
          onClick={closeMenu}
        />
      )}
    </>
  );
}

export default Navbar;