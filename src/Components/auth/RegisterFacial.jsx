import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaUserPlus, FaUser, FaLock, FaEnvelope, FaPhone, FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";


function RegisterFacial() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [snapshot, setSnapshot] = useState(null);
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
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ===== Inicializar cámara =====
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        setError("No se pudo acceder a la cámara.");
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // ===== Capturar foto =====
  const tomarFoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      setSnapshot(blob);
      setSuccess("📸 Foto capturada correctamente.");
      setError("");
    }, "image/jpeg");
  };

  // ===== Manejar cambios =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ===== Enviar formulario =====
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");
  setSuccess("");

  // Validaciones previas
  if (!snapshot) {
    setError("Debes capturar una foto antes de registrarte.");
    setIsLoading(false);
    return;
  }

  if (!/^\d{8}$/.test(formData.telefono)) {
    setError("El número de teléfono debe contener exactamente 8 dígitos.");
    setIsLoading(false);
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Las contraseñas no coinciden.");
    setIsLoading(false);
    return;
  }

  // Solo correos Gmail
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(formData.email)) {
    setError("Solo se permiten correos @gmail.com");
    setIsLoading(false);
    return;
  }

  try {
    const formToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "confirmPassword") formToSend.append(key, value);
    });
    formToSend.append("rostro", snapshot, "rostro.jpg");

    // ✅ SIN headers manuales
    const response = await axios.post("http://localhost:8000/register-facial/", formToSend);
    const data = response.data;
    setSuccess("✅ Registro facial exitoso. Redirigiendo...");

    // (Opcional) Navega al editor de credenciales
    const userData = {
      id: response.data.usuario_id,
      email: formData.email,
      telefono: formData.telefono,
      nombre: formData.nombre_completo,
      nickname: formData.usuario,
      foto: `data:image/jpeg;base64,${data.rostro_segmentado_b64}`, // ✅ usar la segmentada,
      qr_url: response.data.qr_url,
    };
    navigate("/credencial", { state: { userData } });

  } catch (err) {
    console.error("Error al registrar:", err?.response?.data || err);
    setError(
      err?.response?.data?.detail ||
      err?.response?.data?.mensaje ||
      "Error al registrar usuario. Verifica los datos ingresados."
    );
  } finally {
    setIsLoading(false);
  }
};



  // ===== Validaciones de contraseña =====
  const passwordsFilled = formData.password && formData.confirmPassword;
  const passwordsMatch = formData.password === formData.confirmPassword;
  const canSubmit = passwordsFilled && passwordsMatch;

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: "900px" }}>
        <div className="login-header">
          <h2>Registro con Reconocimiento Facial</h2>
          <p>Completa tus datos y captura tu rostro</p>
        </div>

        <div className="login-body">
          <div className="row align-items-center">
            {/* 📸 Cámara */}
            <div className="col-md-6 text-center mb-4">
              <video
                ref={videoRef}
                autoPlay
                className="border rounded w-100"
                style={{ maxHeight: "280px" }}
              ></video>
              <button
                type="button"
                className="btn btn-success mt-3"
                onClick={tomarFoto}
              >
                <FaCamera className="me-2" /> Capturar Rostro
              </button>
              {snapshot && (
                <div className="mt-3">
                  <p className="text-success">✅ Rostro capturado</p>
                </div>
              )}
            </div>

            {/* 📝 Formulario */}
            <div className="col-md-6">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    <FaUser className="me-2" /> Usuario/Apodo
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    required
                    placeholder="Nombre de usuario"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FaEnvelope className="me-2" /> Correo electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="correo electronico"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FaUser className="me-2" /> Nombre completo
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    required
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FaPhone className="me-2" /> Teléfono
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    placeholder="Número de teléfono (8 dígitos)"
                    maxLength="8"
                  />
                </div>

                {/* 🔒 Contraseña */}
                <div className="form-group">
                  <label className="form-label">
                    <FaLock className="me-2" /> Contraseña
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Crea una contraseña"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <small className="form-text text-muted">
                    Mínimo 8 caracteres.
                  </small>
                </div>

                {/* 🔐 Confirmar contraseña */}
                <div className="form-group mt-3">
                  <label className="form-label">
                    <FaLock className="me-2" /> Confirmar contraseña
                  </label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-control ${
                        passwordsFilled && !passwordsMatch ? "is-invalid" : ""
                      }`}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                      placeholder="Vuelve a escribir la contraseña"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <div className="invalid-feedback">
                      Las contraseñas no coinciden.
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 mt-4"
                  disabled={isLoading || !canSubmit}
                >
                  {isLoading ? "Registrando..." : (
                    <>
                      <FaUserPlus className="me-2" /> Registrar con Rostro
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>
            ¿Ya tienes cuenta?{" "}
            <button
              className="btn btn-link p-0"
              style={{
                color: "#0d6efd",
                textDecoration: "underline",
                background: "none",
                border: "none",
              }}
              onClick={() => navigate("/login")}
            >
              Inicia sesión
            </button>
            </p>
          <p>
            validar credencial{" "}
            <button
              className="btn btn-link p-0"
              style={{
                color: "#0d6efd",
                textDecoration: "underline",
                background: "none",
                border: "none",
              }}
              onClick={() => navigate("/credencial")}
            >
              redireccion 
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterFacial;
