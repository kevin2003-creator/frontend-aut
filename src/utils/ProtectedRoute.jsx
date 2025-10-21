// frontend\src\utils\ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { token, isAuthenticated, loading, user } = useAuth();

  console.log("🔐 ProtectedRoute - Estado:", {
    loading,
    token: token ? "SÍ" : "NO",
    isAuthenticated,
    user: user ? "SÍ" : "NO"
  });

  // 👇 Espera a que AuthContext termine de cargar
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <h3 className="mt-2">Cargando sesión...</h3>
      </div>
    );
  }

  // 👇 Verificar autenticación COMPLETA (token + usuario)
  if (!token || !isAuthenticated) {
    console.log("🚫 ProtectedRoute - Redirigiendo al login. Token:", token ? "SÍ" : "NO", "Auth:", isAuthenticated);
    return <Navigate to="/login" replace />;
  }

  console.log("✅ ProtectedRoute - Acceso permitido");
  return children;
}

export default ProtectedRoute;