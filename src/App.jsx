import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/auth/Login';
import Register from './Components/auth/RegisterFacial';
import DashboardApp from './Components/common/DashboardApp';
import ProtectedRoute from './utils/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './Components/common/Sidebar';
import RegisterFacial from './Components/auth/RegisterFacial';

import CredencialEditor from './pages/CredencialEditor';


function App() {
  return (
    <Router>
      <AuthProvider> {/* ✅ Ahora dentro del Router */}
        <Routes>
          {/* Redirección inicial */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Páginas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registerfacial" element={<RegisterFacial />} />
          <Route path="/credencial" element={<CredencialEditor />} />

          {/* Sección protegida */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <Sidebar />
                  <main style={{ flex: 1, padding: '2rem', background: '#f9f9f9' }}>
                    <DashboardApp />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        
        </Routes>
        </AuthProvider>
    </Router>
  );
}

export default App;
