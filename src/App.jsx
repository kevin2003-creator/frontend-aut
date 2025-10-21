import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/auth/Login';
import Register from './Components/auth/RegisterFacial';
import DashboardApp from './Components/common/DashboardApp';
import ProtectedRoute from './utils/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import RegisterFacial from './Components/auth/RegisterFacial';
import CredencialEditor from './pages/CredencialEditor';
import ForgotPassword from './Components/auth/ForgotPassword';
import QrScanner from "../src/Components/auth/QrScanner";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Redirección inicial */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Páginas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registerfacial" element={<RegisterFacial />} />
          <Route path="/credencial" element={<CredencialEditor />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/qr-scan" element={<QrScanner />} />
          
          {/* 🔥 CORRECCIÓN: Solo DashboardApp dentro de ProtectedRoute */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardApp /> {/* 👈 DashboardApp ya incluye el layout */}
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;