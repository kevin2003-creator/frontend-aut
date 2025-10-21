import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import "./Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(["", "", "", "", "", ""]); // 👈 CAMBIADO A ARRAY
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL = import.meta.env.VITE_API_URL;

  const handleTokenChange = (index, value) => {
    // Solo permitir números y máximo 1 carácter
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newToken = [...token];
      newToken[index] = value;
      setToken(newToken);
      
      // Auto-navegación
      if (value && index < 5) {
        setTimeout(() => {
          const nextInput = document.getElementById(`token-${index + 1}`);
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }, 10);
      }
    }
  };

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new URLSearchParams();
      formData.append('email', email);

      const response = await axios.post(
        `${API_URL}/usuarios/forgot-password`, 
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );
      
      setMessage({
        type: "success",
        text: response.data.mensaje
      });
      
      setStep(2);
    } catch (error) {
      console.error("Error completo:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      setMessage({
        type: "error",
        text: error.response?.data?.detail || "Error al solicitar recuperación. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e) => {
  e.preventDefault();
  
  // Verificar que todos los dígitos estén completos
  const todosCompletos = token.every(digit => digit !== "" && digit.length === 1);
  if (!todosCompletos) {
    setMessage({ type: "error", text: "Completa todos los dígitos del código" });
    return;
  }

  setLoading(true);
  setMessage({ type: "", text: "" });

  try {
    const tokenCompleto = token.join('');
    console.log("🔐 Token completo:", tokenCompleto);
    
    // ✅ NUEVO: Verificar el token con el backend antes de pasar al siguiente paso
    const verifyData = new URLSearchParams();
    verifyData.append('email', email);
    verifyData.append('token', tokenCompleto);

    const response = await axios.post(
      `${API_URL}/usuarios/verify-token`, 
      verifyData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    if (response.data.ok) {
      setStep(3);
      setMessage({ type: "success", text: "✅ Código verificado correctamente" });
    } else {
      setMessage({
        type: "error", 
        text: response.data.detail || "Código de verificación incorrecto"
      });
    }
    
  } catch (error) {
    console.error("Error verificando token:", error);
    
    // Manejar diferentes tipos de error
    if (error.response?.status === 400) {
      setMessage({
        type: "error",
        text: error.response?.data?.detail || "Código de verificación incorrecto"
      });
    } else if (error.response?.status === 404) {
      setMessage({
        type: "error",
        text: "El código ha expirado. Solicita uno nuevo."
      });
    } else {
      setMessage({
        type: "error",
        text: "Error al verificar el código. Intenta nuevamente."
      });
    }
  } finally {
    setLoading(false);
  }
};

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const tokenCompleto = token.join('');
      const formData = new URLSearchParams();
      formData.append('token', tokenCompleto);
      formData.append('email', email);
      formData.append('new_password', newPassword);

      const response = await axios.post(`${API_URL}/usuarios/reset-password`, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
      });

      setMessage({
        type: "success",
        text: "✅ " + (response.data.mensaje || "Contraseña restablecida correctamente. Redirigiendo al login...")
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);

    } catch (error) {
      console.error("Error completo reset:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      setMessage({
        type: "error",
        text: error.response?.data?.detail || "Error al restablecer contraseña"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <motion.div
          className="auth-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button 
            className="back-btn"
            onClick={() => window.history.back()}
          >
            <FaArrowLeft /> Volver
          </button>
          <h2>Recuperar Contraseña</h2>
          <p>Sigue los pasos para restablecer tu acceso</p>
        </motion.div>

        {message.text && (
          <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
            {message.text}
          </div>
        )}

        <div className="auth-steps">
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? "active" : ""}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>2</div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? "active" : ""}`}>3</div>
          </div>
          <div className="step-labels">
            <span>Email</span>
            <span>Token</span>
            <span>Nueva Contraseña</span>
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Paso 1: Ingresar email */}
          {step === 1 && (
            <form onSubmit={handleRequestToken} className="auth-form">
              <div className="form-group">
                <label>Correo Electrónico</label>
                <div className="input-wrapper">
                  <FaEnvelope className="icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-btn primary" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Instrucciones"}
              </button>
            </form>
          )}

                    {/* Paso 2: Ingresar token */}
          {step === 2 && (
            <form onSubmit={handleVerifyToken} className="auth-form">
              <div className="form-group">
                <label>Código de 6 Dígitos</label>
                <div className="token-inputs">
                  {token.map((digit, index) => (
                    <input
                      key={index}
                      id={`token-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleTokenChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digit && index > 0) {
                          document.getElementById(`token-${index - 1}`)?.focus();
                        }
                      }}
                      className="token-input"
                      required
                      disabled={loading} // 👈 Deshabilitar inputs durante la verificación
                    />
                  ))}
                </div>
                <small className="help-text">
                  Revisa tu correo electrónico. Te enviamos un código de 6 dígitos.
                </small>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="auth-btn secondary"
                  onClick={() => {
                    setStep(1);
                    setToken(["", "", "", "", "", ""]);
                    setMessage({ type: "", text: "" });
                  }}
                  disabled={loading}
                >
                  Volver
                </button>
                <button 
                  type="submit" 
                  className="auth-btn primary"
                  disabled={token.some(digit => digit === "") || loading}
                >
                  {loading ? "Verificando..." : "Verificar Código"}
                </button>
              </div>
            </form>
          )}

          {/* Paso 3: Nueva contraseña */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <div className="input-wrapper">
                  <FaLock className="icon" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nueva contraseña"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirmar Contraseña</label>
                <div className="input-wrapper">
                  <FaLock className="icon" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="auth-btn secondary"
                  onClick={() => setStep(2)}
                >
                  Volver
                </button>
                <button 
                  type="submit" 
                  className="auth-btn primary" 
                  disabled={loading}
                >
                  {loading ? "Restableciendo..." : "Restablecer Contraseña"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPassword;