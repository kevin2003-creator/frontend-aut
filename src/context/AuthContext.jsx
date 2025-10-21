// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // 🧠 Cargar usuario si ya hay token guardado - VERSIÓN MEJORADA
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        console.log("🔐 AuthContext - Cargando usuario con token:", token.substring(0, 50) + "...");
        
        const res = await axios.get(`${API_URL}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log("✅ AuthContext - Usuario cargado:", res.data);
        setUser(res.data);
      } catch (err) {
        console.error("❌ AuthContext - Error cargando usuario:", err.response?.status, err.response?.data);
        
        // Si es error 401 (token inválido), hacer logout
        if (err.response?.status === 401) {
          console.log("🔐 AuthContext - Token inválido, haciendo logout...");
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [token]);

  // 🔑 Iniciar sesión - VERSIÓN MEJORADA
  const login = (token, userData) => {
    console.log("🔐 AuthContext - Login con token:", token.substring(0, 50) + "...");
    console.log("🔐 AuthContext - Login con userData:", userData);
    
    // Guardar token primero
    localStorage.setItem("token", token);
    setToken(token);
    
    // 🔥 IMPORTANTE: Establecer usuario inmediatamente con los datos recibidos
    // No esperar a que el useEffect cargue desde /usuarios/me
    setUser(userData);
    
    console.log("✅ AuthContext - Login completado");
  };

  // 🚪 Cerrar sesión
  const logout = () => {
    console.log("🔐 AuthContext - Haciendo logout");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  // ✅ Helper para verificar si está autenticado
  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated, // 👈 Agregar esta propiedad
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};