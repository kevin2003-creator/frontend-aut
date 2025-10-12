import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../../pages/Home';


function DashboardApp() {
  return (
    <div className="dashboard-content">
      <Routes>
        {/* Ruta principal del dashboard */}
        <Route index element={<Home />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default DashboardApp;
