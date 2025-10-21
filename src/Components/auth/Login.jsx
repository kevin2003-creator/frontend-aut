import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import "./Login.css";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaCamera,
  FaQrcode,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import logo from "../../assets/LOGOUMG.png";
import { motion, AnimatePresence } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = "6Lcxhu4rAAAAAJ642cPS_pVBgScnHnHIINiOE6Xe";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modoFacial, setModoFacial] = useState(false);
  const [mensajeFacial, setMensajeFacial] = useState("");
  const [facialStatus, setFacialStatus] = useState("idle"); // idle, capturing, processing, success, error
  const [facialProgress, setFacialProgress] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false); // 🔥 Nuevo flag para cancelación
  const videoRef = useRef(null);
  const streamRef = useRef(null); // 🔥 Guardar referencia del stream
  const navigate = useNavigate();
  const location = useLocation();

  const { login, token: contextToken, user: contextUser, isAuthenticated } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  // ============================================================
  // 🔹 LOGIN CON CORREO Y CONTRASEÑA
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!captchaToken) {
      setError("Por favor completa el reCAPTCHA");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        recaptcha_token: captchaToken,
      });

      login(response.data.access_token, {
        id: response.data.usuario_id,
        nombre: response.data.nombre_completo,
        email: response.data.email,
      });

      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.mensaje ||
        "❌ No se pudo iniciar sesión. Verifica tus credenciales.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 🔹 DETENER CÁMARA Y CANCELAR PROCESO
  // ============================================================
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCancelFacial = () => {
    setIsCancelled(true); // 🔥 Activar flag de cancelación
    stopCamera();
    setModoFacial(false);
    setFacialStatus("idle");
    setMensajeFacial("");
    setError("");
    setFacialProgress(0);
    console.log("🚫 Login facial cancelado por el usuario");
  };

  // ============================================================
  // 🔹 LOGIN FACIAL MEJORADO
  // ============================================================
const handleLoginFacial = async () => {
  setIsCancelled(false);
  setFacialStatus("capturing");
  setMensajeFacial("Iniciando cámara...");
  setError("");
  setIsLoading(true);
  setFacialProgress(10);

  try {
    // 🚀 Iniciar cámara
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 }
      } 
    });
    
    streamRef.current = stream;
    const video = videoRef.current;
    video.srcObject = stream;
    await video.play();
    
    setFacialProgress(40);
    setMensajeFacial("Posiciónate frente a la cámara...");
    
    setFacialProgress(60);
    setMensajeFacial("📸 Capturando rostro...");
    
    // Capturar imagen
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.7)
    );

    setFacialProgress(80);
    setFacialStatus("processing");
    setMensajeFacial("🔍 Verificando identidad...");

    // 🚨 ELIMINAR TIMEOUT - dejar que el backend tome el tiempo que necesite
    const formData = new FormData();
    formData.append("file", imageBlob);

    const res = await axios.post(`${API_URL}/rostro/login`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      // ❌ QUITAR EL TIMEOUT para que no cancele por tiempo
      // timeout: 15000 // 👈 COMENTAR O ELIMINAR ESTA LÍNEA
    });

    // 🔥 Verificar cancelación
    if (isCancelled) {
      console.log("🚫 Proceso cancelado");
      stopCamera();
      return;
    }

    const data = res.data;
    setFacialProgress(100);

    if (data.coincide) {
      setFacialStatus("success");
      setMensajeFacial(`✅ Bienvenido ${data.nombre}`);
      
      if (!data.access_token) {
        throw new Error("No se recibió token de autenticación");
      }
      
      const userData = {
        id: data.usuario_id,
        nombre_completo: data.nombre,
        email: data.email,
        usuario: data.usuario
      };
      
      localStorage.setItem("token", data.access_token);
      login(data.access_token, userData);
      
      stopCamera();
      
      // Navegar inmediatamente
      if (!isCancelled) {
        console.log("✅ Navegando al dashboard");
        navigate("/dashboard", { 
          replace: true,
          state: { fromFacial: true }
        });
      }
      
    } else {
      setFacialStatus("error");
      setMensajeFacial("❌ No se reconoció el rostro");
      setError(`Score: ${data.score?.toFixed(3) || 'desconocido'}`);
      setFacialProgress(0);
      stopCamera();
    }

  } catch (err) {
    console.error("⚠️ Error en login facial:", err);
    setFacialStatus("error");
    
    // 🚨 MENSAJE MÁS GENÉRICO SIN MENCIONAR TIMEOUT
    if (err.code === 'ECONNABORTED') {
      setMensajeFacial("⚠️ El proceso tardó más de lo esperado");
      setError("Por favor, intenta nuevamente");
    } else if (err.response?.status === 500) {
      setMensajeFacial("⚠️ Error del servidor");
      setError("Intenta más tarde o usa otro método de login");
    } else {
      setMensajeFacial("⚠️ Error al procesar reconocimiento");
      setError(err.response?.data?.detail || err.message || "Error de conexión");
    }
    
    setFacialProgress(0);
    stopCamera();
  } finally {
    setIsLoading(false);
  }
};
  // ============================================================
  // 🧠 AUTOEJECUCIÓN FACIAL
  // ============================================================
  useEffect(() => {
    if (modoFacial && !isCancelled) {
      const timer = setTimeout(() => {
        handleLoginFacial();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [modoFacial]);

  // Limpiar al desmontar componente
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ============================================================
  // 💅 Interfaz
  // ============================================================
  return (
    <div className="lexion-login-container">
      <div className="lexion-login-card shadow">
        {/* 🔹 Panel Izquierdo */}
        <div className="lexion-left">
          <div className="lexion-left-content">
            <img src={logo} alt="Lexion Logo" className="lexion-logo" />
            <h2>WELCOME TO</h2>
            <h1>LEXION</h1>
            <p>
              Tu espacio inteligente de bienestar, productividad y tecnología verde 🌱
            </p>
            <button className="lexion-learn-btn">Learn More</button>
          </div>
        </div>

        {/* 🔹 Panel Derecho */}
        <div className="lexion-right">
          <div className="lexion-form-wrapper">
            <AnimatePresence mode="wait">
              {!modoFacial ? (
                <motion.div
                  key="modoNormal"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <h2 className="welcome-title">Welcome Back!</h2>
                  <p className="welcome-sub">Sign in to continue</p>

                  {error && (
                    <div className="alert alert-danger text-center">
                      {typeof error === "string"
                        ? error
                        : JSON.stringify(error, null, 2)}
                    </div>
                  )}

                  <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                      <label className="form-label fw-semibold">
                        <FaEnvelope className="me-2" /> Correo electrónico
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Ingresa tu correo"
                      />
                    </div>

                    <div className="form-group mb-4">
                      <label className="form-label fw-semibold">
                        <FaLock className="me-2" /> Contraseña
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Ingresa tu contraseña"
                      />
                    </div>

                    <div className="form-group2 mb-4">
                      <ReCAPTCHA sitekey={SITE_KEY} onChange={setCaptchaToken} />
                    </div>

                    <button
                      type="submit"
                      className="lexion-login-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        "Cargando..."
                      ) : (
                        <>
                          <FaSignInAlt className="me-2" /> Ingresar
                        </>
                      )}
                    </button>
                  </form>

                  <button
                    className="login-alt-btn mt-3"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!captchaToken) {
                        setError("⚠️ Completa el reCAPTCHA antes de continuar");
                        return;
                      }
                      setModoFacial(true);
                    }}
                  >
                    <FaCamera className="me-2" /> Ingresar con Rostro
                  </button>

                  <button
                    className="login-alt-btn mt-2"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!captchaToken) {
                        setError("⚠️ Completa el reCAPTCHA antes de continuar");
                        return;
                      }
                      navigate("/qr-scan");
                    }}
                  >
                    <FaQrcode className="me-2" /> Ingresar con QR
                  </button>

                  <div className="register-text mt-4">
                    ¿No tienes cuenta?{" "}
                    <button
                      className="btn btn-link p-0"
                      style={{
                        color: "#2e7d32",
                        textDecoration: "underline",
                        background: "none",
                        border: "none",
                      }}
                      onClick={() => navigate("/registerfacial")}
                    >
                      Crear cuenta
                    </button>

                    <p className="auth-link">
                      <a href="/forgot-password">¿Olvidaste tu contraseña? Haz Clic Aqui</a>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="modoFacial"
                  className="facial-login-improved"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <h2 className="welcome-title mb-3">Reconocimiento Facial</h2>
                  
                  {/* Video con overlay de guía */}
                  <div className="facial-video-container">
                    <video
                      ref={videoRef}
                      className="facial-video"
                      autoPlay
                      playsInline
                      muted
                    />
                    
                    {/* Guía facial */}
                    {facialStatus === "capturing" && (
                      <div className="facial-guide-overlay">
                        <div className="facial-guide-circle"></div>
                      </div>
                    )}
                    
                    {/* Status indicator */}
                    <div className={`facial-status-badge ${facialStatus}`}>
                      {facialStatus === "capturing" && <FaCamera />}
                      {facialStatus === "processing" && (
                        <div className="spinner-border spinner-border-sm"></div>
                      )}
                      {facialStatus === "success" && <FaCheckCircle />}
                      {facialStatus === "error" && <FaTimesCircle />}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {facialProgress > 0 && facialStatus !== "error" && (
                    <div className="facial-progress-container">
                      <div 
                        className="facial-progress-bar" 
                        style={{ width: `${facialProgress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Mensaje de estado */}
                  {mensajeFacial && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`facial-message ${facialStatus}`}
                    >
                      {mensajeFacial}
                    </motion.div>
                  )}

                  {/* Error adicional */}
                  {error && facialStatus === "error" && (
                    <div className="alert alert-danger mt-2 text-center">
                      {error}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="facial-actions mt-4">
                    {/* Solo mostrar cancelar durante captura, no durante verificación */}
                    {(facialStatus === "capturing" || facialStatus === "error") && (
                      <motion.button
                        className="login-alt-btn w-100"
                        onClick={handleCancelFacial}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaArrowLeft className="me-2" /> 
                        {facialStatus === "error" ? "Reintentar" : "Cancelar"}
                      </motion.button>
                    )}
                    
                    {/* Mensaje informativo durante verificación */}
                    {facialStatus === "processing" && (
                      <div className="text-center text-muted">
                        <small>⏳ Verificando identidad, por favor espera...</small>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;