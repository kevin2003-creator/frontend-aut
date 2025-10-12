import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  // 👇 Espera a que AuthContext termine de cargar localStorage
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h3>Cargando sesión...</h3>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
