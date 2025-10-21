import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaUser,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
} from "react-icons/fa";
import "./Login.css";
import logo from "../../assets/LOGOUMG.png";
import { motion, AnimatePresence } from "framer-motion";

function RegisterFacial() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Estados base
  const [snapshot, setSnapshot] = useState(null);
  const [snapshotPreview, setSnapshotPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    usuario: "",
    password: "",
    confirmPassword: "",
    email: "",
    nombre_completo: "",
    telefono: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [step, setStep] = useState(1);
  const [cameraActive, setCameraActive] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // ===== Inicializar cámara =====
  useEffect(() => {
    let stream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        setAlert({
          type: "danger",
          message: "No se pudo acceder a la cámara. Verifica los permisos.",
        });
      }
    };
    startCamera();

    return () => {
      const currentVideo = videoRef.current;
      if (currentVideo?.srcObject) {
        currentVideo.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // ===== Capturar foto con preview =====
  const tomarFoto = () => {
    if (!videoRef.current) return;
    
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    // Dibujar imagen del video
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convertir a blob
    canvas.toBlob(
      (blob) => {
        setSnapshot(blob);
        setSnapshotPreview(URL.createObjectURL(blob));
        // NO mostramos alerta de éxito aquí
      },
      "image/jpeg",
      0.9
    );
  };

  // ===== Retomar foto =====
  const retakerFoto = () => {
    // Limpiar el preview
    if (snapshotPreview) {
      URL.revokeObjectURL(snapshotPreview);
    }
    
    setSnapshot(null);
    setSnapshotPreview(null);
    setAlert({ type: "", message: "" });
    
    // Reiniciar la cámara si no está activa
    if (!cameraActive && videoRef.current) {
      const restartCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        } catch (err) {
          console.error("Error al reiniciar cámara:", err);
          setAlert({
            type: "danger",
            message: "Error al reiniciar la cámara",
          });
        }
      };
      restartCamera();
    }
  };

  // ===== Manejar cambios =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ===== Validar paso 1 =====
  const canGoToStep2 = () => {
    return (
      formData.usuario.trim() &&
      formData.email.trim() &&
      formData.nombre_completo.trim() &&
      formData.telefono.trim() &&
      snapshot
    );
  };

  // ===== Enviar formulario =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert({ type: "", message: "" });

    // Validaciones
    if (!snapshot) {
      setAlert({
        type: "danger",
        message: "Debes capturar una foto antes de registrarte.",
      });
      setIsLoading(false);
      return;
    }

    if (!/^\d{8}$/.test(formData.telefono)) {
      setAlert({
        type: "danger",
        message: "El número de teléfono debe contener exactamente 8 dígitos.",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlert({
        type: "danger",
        message: "Las contraseñas no coinciden.",
      });
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAlert({
        type: "danger",
        message: "Por favor ingresa un correo electrónico válido.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const formToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "confirmPassword") formToSend.append(key, value);
      });
      formToSend.append("rostro", snapshot, "rostro.jpg");

      const response = await axios.post(`${API_URL}/register-facial/`, formToSend);
      const data = response.data;

      setAlert({
        type: "success",
        message: "✅ Registro facial exitoso. Redirigiendo...",
      });

      const userData = {
        id: data.usuario_id,
        email: formData.email,
        telefono: formData.telefono,
        nombre: formData.nombre_completo,
        nickname: formData.usuario,
        foto: `data:image/jpeg;base64,${data.rostro_segmentado_b64}`,
        qr_url: data.qr_url,
      };

      setTimeout(() => navigate("/credencial", { state: { userData } }), 1500);
    } catch (err) {
      console.error("Error al registrar:", err?.response?.data || err);
      setAlert({
        type: "danger",
        message:
          err?.response?.data?.detail ||
          err?.response?.data?.mensaje ||
          "Error al registrar usuario. Verifica los datos ingresados.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Validaciones auxiliares =====
  const passwordsFilled = formData.password && formData.confirmPassword;
  const passwordsMatch = formData.password === formData.confirmPassword;
  const canSubmit = passwordsFilled && passwordsMatch;

  return (
    <div className="lexion-login-container">
      <div className="lexion-login-card shadow">
        {/* 🔹 Panel Izquierdo */}
        <motion.div
          className="lexion-left"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="lexion-left-content">
            <motion.img
              src={logo}
              alt="Lexion Logo"
              className="lexion-logo"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
            <h2>FACE ID REGISTRATION</h2>
            <h1>LEXION</h1>
            <p>
              Regístrate con reconocimiento facial para acceder fácilmente a tu
              cuenta inteligente 🌿
            </p>
            
            {/* Indicador de progreso */}
            <div className="progress-indicator mb-3">
              <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>1</div>
              <div className="step-line"></div>
              <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
            </div>
            <p className="step-text">
              {step === 1 ? "Datos y Rostro" : "Contraseña"}
            </p>

            <motion.button
              className="lexion-learn-btn mt-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
            >
              Ir a Login
            </motion.button>
          </div>
        </motion.div>

        {/* 🔹 Panel Derecho */}
        <motion.div
          className="lexion-right"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="lexion-form-wrapper">
            <h2 className="welcome-title">Registro Facial</h2>
            <p className="welcome-sub">
              {step === 1 
                ? "Completa tus datos y captura tu rostro" 
                : "Crea tu contraseña segura"}
            </p>

            {alert.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`alert text-center ${
                  alert.type === "success" ? "alert-success" : "alert-danger"
                }`}
              >
                {alert.message}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Cámara con guía facial */}
                  <div className="camera-container mb-4">
                    <div className="camera-wrapper">
                      {/* Video siempre visible pero con overlay cuando hay snapshot */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="camera-video"
                        style={{ display: snapshotPreview ? 'none' : 'block' }}
                      />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                      
                      {!snapshotPreview ? (
                        <>
                          {/* Guía de rostro */}
                          <div className="face-guide">
                            <div className="face-oval"></div>
                          </div>
                          
                          {cameraActive && (
                            <div className="camera-instructions">
                              <p>Centra tu rostro en el óvalo</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="snapshot-preview">
                          <img src={snapshotPreview} alt="Captura" />
                          <div className="snapshot-badge">
                            <FaCheckCircle /> Capturado
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="camera-controls mt-3">
                      {!snapshotPreview ? (
                        <motion.button
                          type="button"
                          className="lexion-login-btn"
                          onClick={tomarFoto}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={!cameraActive}
                        >
                          <FaCamera className="me-2" /> Capturar Rostro
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          className="login-alt-btn"
                          onClick={retakerFoto}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaRedo className="me-2" /> Tomar otra foto
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Formulario paso 1 */}
                  <div className="login-form">
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="form-group">
                          <label>Usuario / Apodo</label>
                          <div className="input-wrapper">
                            <FaUser className="icon" />
                            <input
                              type="text"
                              name="usuario"
                              value={formData.usuario}
                              onChange={handleChange}
                              required
                              placeholder="Nombre de usuario"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="form-group">
                          <label>Correo electrónico</label>
                          <div className="input-wrapper">
                            <FaEnvelope className="icon" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              placeholder="correo@ejemplo.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="form-group">
                          <label>Nombre completo</label>
                          <div className="input-wrapper">
                            <FaUser className="icon" />
                            <input
                              type="text"
                              name="nombre_completo"
                              value={formData.nombre_completo}
                              onChange={handleChange}
                              required
                              placeholder="Juan Pérez"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="form-group">
                          <label>Teléfono</label>
                          <div className="input-wrapper">
                            <FaPhone className="icon" />
                            <input
                              type="tel"
                              name="telefono"
                              value={formData.telefono}
                              onChange={handleChange}
                              required
                              placeholder="12345678"
                              maxLength="8"
                              pattern="\d{8}"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      className="lexion-login-btn w-100 mt-4"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (canGoToStep2()) {
                          setStep(2);
                        } else {
                          setAlert({
                            type: "danger",
                            message: "Completa todos los campos y captura tu rostro",
                          });
                        }
                      }}
                      disabled={!canGoToStep2()}
                    >
                      Siguiente ➜
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="login-form">
                    <div className="form-group">
                      <label>
                        <FaLock className="me-2" /> Contraseña
                      </label>
                      <div className="password-input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={8}
                          placeholder="Mínimo 8 caracteres"
                          className="form-control-password"
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <small className="password-hint">
                        Usa al menos 8 caracteres
                      </small>
                    </div>

                    <div className="form-group mt-3">
                      <label>
                        <FaLock className="me-2" /> Confirmar contraseña
                      </label>
                      <div className="password-input-group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          placeholder="Repite tu contraseña"
                          className={`form-control-password ${
                            passwordsFilled && !passwordsMatch ? "is-invalid" : ""
                          } ${passwordsFilled && passwordsMatch ? "is-valid" : ""}`}
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordsFilled && (
                        <small className={passwordsMatch ? "text-success" : "text-danger"}>
                          {passwordsMatch ? (
                            <><FaCheckCircle /> Las contraseñas coinciden</>
                          ) : (
                            <><FaTimesCircle /> Las contraseñas no coinciden</>
                          )}
                        </small>
                      )}
                    </div>

                    <div className="row g-2 mt-4">
                      <div className="col-6">
                        <motion.button
                          type="button"
                          className="login-alt-btn w-100"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setStep(1)}
                        >
                          ← Atrás
                        </motion.button>
                      </div>

                      <div className="col-6">
                        <motion.button
                          type="button"
                          className="lexion-login-btn w-100"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={isLoading || !canSubmit}
                          onClick={handleSubmit}
                        >
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Registrando...
                            </>
                          ) : (
                            "Finalizar ✓"
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default RegisterFacial;