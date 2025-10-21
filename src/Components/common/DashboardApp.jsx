import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Analizador from '../../pages/Analizador';
import Profile from "../../pages/Profile";
import Home from "../../pages/Home";
import Navbar from '../common/Navbar'; // 👈 Cambiamos Sidebar por Navbar
import './DashboardApp.css';

function DashboardApp() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("🚫 DashboardApp - No autenticado");
    return null;
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-main-content">
        <Routes>
          <Route index element={<Home />} />
          <Route path="analizador" element={<Analizador />} />
          <Route path="profile" element={<Profile />} />
        </Routes>
      </div>
    
      <footer className="text-center text-muted mt-5 py-3 border-top bg-white shadow-sm footer-analizador">
        LexicoAU © 2025 — Sistema de Análisis Léxico Multilingüe
      </footer>
    </div>
  );
}

export default DashboardApp;