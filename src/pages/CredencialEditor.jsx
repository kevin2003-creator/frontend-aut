import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { FaDownload, FaArrowLeft, FaSmile, FaFilter, FaQrcode, FaExclamationTriangle, FaCheck, FaTimes, FaPalette, FaStar, FaHeart, FaBriefcase, FaGraduationCap, FaTrophy } from "react-icons/fa";
import credencialBg from "../assets/Credencial_Lexion.png";
import "./Credencial.css";

function CredencialEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData;
  const credencialRef = useRef(null);
  const [filter, setFilter] = useState("none");
  const [sticker, setSticker] = useState(null);
  const [stickerSize, setStickerSize] = useState("medium");
  const [stickerPosition, setStickerPosition] = useState("top-right");
  const [borderStyle, setBorderStyle] = useState("none");
  const [photoRotation, setPhotoRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [activeTab, setActiveTab] = useState("filters");
  const [compatibleQR, setCompatibleQR] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [qrDebug, setQrDebug] = useState("");
  const [qrStatus, setQrStatus] = useState("pending");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // 🎨 CATEGORÍAS DE STICKERS EXPANDIDAS
  const stickerCategories = {
    emociones: {
      name: "😊 Emociones",
      icon: <FaSmile />,
      items: ["😎", "😊", "🤗", "😁", "🥳", "😇", "🤓", "🤩", "😏", "🙂", "😋", "😌"]
    },
    profesional: {
      name: "💼 Profesional",
      icon: <FaBriefcase />,
      items: ["💼", "👔", "📊", "💻", "📱", "🖥️", "⌨️", "🖱️", "📈", "📉", "💡", "🔧"]
    },
    educacion: {
      name: "🎓 Educación",
      icon: <FaGraduationCap />,
      items: ["🎓", "📚", "✏️", "📝", "📖", "🏫", "🎒", "📐", "🔬", "🧪", "🧬", "🔭"]
    },
    logros: {
      name: "🏆 Logros",
      icon: <FaTrophy />,
      items: ["🏆", "🥇", "🥈", "🥉", "👑", "⭐", "🌟", "✨", "💫", "🎖️", "🏅", "🎯"]
    },
    simbolos: {
      name: "💎 Símbolos",
      icon: <FaStar />,
      items: ["💎", "🔥", "⚡", "💪", "👍", "✌️", "🤝", "👏", "🙌", "💯", "✅", "🎉"]
    },
    naturaleza: {
      name: "🌿 Naturaleza",
      icon: <FaHeart />,
      items: ["🌿", "🌱", "🌳", "🌺", "🌸", "🌼", "🌻", "🌹", "🍀", "🌾", "🌵", "🪴"]
    },
    tecnologia: {
      name: "🤖 Tech",
      icon: <FaPalette />,
      items: ["🤖", "🚀", "🛸", "🌐", "💾", "📡", "🔋", "⚙️", "🔌", "🖲️", "🎮", "🕹️"]
    },
    deportes: {
      name: "⚽ Deportes",
      icon: <FaTrophy />,
      items: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸", "🥊", "⛳", "🎳", "🏹"]
    }
  };

  // 🎨 FILTROS PROFESIONALES EXPANDIDOS
  const filterOptions = [
    { name: "Normal", value: "none", preview: "🔲" },
    { name: "B&W", value: "grayscale(100%)", preview: "⬜" },
    { name: "Vintage", value: "sepia(90%) contrast(110%)", preview: "📜" },
    { name: "Brillante", value: "contrast(120%) brightness(110%) saturate(120%)", preview: "✨" },
    { name: "Desenfocar", value: "blur(2px)", preview: "🌫️" },
    { name: "Cálido", value: "sepia(40%) saturate(120%)", preview: "🔥" },
    { name: "Frío", value: "hue-rotate(180deg) saturate(120%)", preview: "❄️" },
    { name: "Neón", value: "contrast(150%) brightness(120%) saturate(200%)", preview: "💫" },
    { name: "Dramático", value: "contrast(150%) grayscale(50%)", preview: "🎭" },
    { name: "Suave", value: "contrast(90%) brightness(105%) blur(0.5px)", preview: "☁️" },
    { name: "Nostalgia", value: "sepia(70%) contrast(90%) brightness(95%)", preview: "📷" },
    { name: "Intenso", value: "contrast(140%) saturate(150%)", preview: "⚡" }
  ];

  // 🖼️ ESTILOS DE BORDE
  const borderStyles = [
    { name: "Sin borde", value: "none" },
    { name: "Verde", value: "3px solid #2e7d32" },
    { name: "Dorado", value: "3px solid #ffd700" },
    { name: "Plateado", value: "3px solid #c0c0c0" },
    { name: "Azul", value: "3px solid #2196f3" },
    { name: "Rojo", value: "3px solid #f44336" },
    { name: "Degradado", value: "3px solid transparent" },
    { name: "Doble", value: "4px double #2e7d32" },
    { name: "Punteado", value: "3px dotted #2e7d32" }
  ];

  // 📍 POSICIONES DEL STICKER
  const stickerPositions = [
    { name: "Arriba Derecha", value: "top-right" },
    { name: "Arriba Izquierda", value: "top-left" },
    { name: "Abajo Derecha", value: "bottom-right" },
    { name: "Abajo Izquierda", value: "bottom-left" },
    { name: "Centro", value: "center" }
  ];

  // 📏 TAMAÑOS DEL STICKER
  const stickerSizes = [
    { name: "Pequeño", value: "small", size: "1.2rem" },
    { name: "Mediano", value: "medium", size: "2rem" },
    { name: "Grande", value: "large", size: "3rem" }
  ];

  // 🔍 Generar QR con el formato EXACTO que espera el backend
  useEffect(() => {
    if (userData) {
      console.log("🔍 DATOS COMPLETOS DEL USER:", userData);
      generateValidQR();
    }
  }, [userData]);

  // 📡 Generar QR válido llamando al backend
  const generateValidQR = async () => {
    try {
      setQrStatus("testing");
      setQrDebug("🔄 Generando QR válido con el backend...");

      const response = await axios.post(`${API_URL}/auth/generate-qr`, {
        usuario_id: userData.id || userData.email,
        email: userData.email
      });

      const qrData = response.data.qr_data;
      setCompatibleQR(qrData);
      setQrStatus("success");
      setQrDebug(`✅ QR VÁLIDO GENERADO POR EL BACKEND`);

      console.log("✅ QR válido generado:", qrData);

    } catch (error) {
      console.error("❌ Error generando QR válido:", error);
      setQrStatus("error");
      setQrDebug(`❌ NO SE PUDO GENERAR UN QR VÁLIDO`);

      const fallbackQR = JSON.stringify({
        usuario_id: userData.id || userData.email,
        token: "temp_token",
        timestamp: new Date().toISOString(),
        expira: new Date(Date.now() + 3600000).toISOString(),
        tipo: "login"
      });
      setCompatibleQR(fallbackQR);
    }
  };

  if (!userData) {
    return (
      <div className="login-container">
        <div className="login-card shadow text-center p-4">
          <h3>⚠️ No se encontraron datos del usuario</h3>
          <p>Por favor, regístrate antes de personalizar tu credencial.</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/registerfacial")}
          >
            Volver al registro
          </button>
        </div>
      </div>
    );
  }

  // 📄 Generar PDF y enviar al backend
  const handleSendPDF = async () => {
    setSendingEmail(true);
    try {
      console.log("📧 Iniciando envío de credencial...");
      
      const canvas = await html2canvas(credencialRef.current, { 
        useCORS: true, 
        scale: 2,
        backgroundColor: null
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("landscape", "pt", "a6");
      pdf.addImage(imgData, "PNG", 0, 0, 420, 300);
      const pdfBlob = pdf.output("blob");

      const pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const payload = {
        email: userData.email,
        nombre_usuario: userData.nombre,
        pdf_base64: pdfBase64,
      };

      const res = await axios.post(
        `${API_URL}/credencial/enviar`,
        payload,
        { 
          headers: { "Content-Type": "application/json" },
          timeout: 30000
        }
      );
      
      console.log("✅ PDF enviado correctamente:", res.data);
      alert("✅ Credencial enviada a tu correo exitosamente!");

    } catch (error) {
      console.error("❌ Error en handleSendPDF:", error);
      let errorMessage = "Error al enviar la credencial";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "⏰ Tiempo de espera agotado. Intenta nuevamente.";
      } else if (error.response?.data?.detail) {
        errorMessage = `❌ ${error.response.data.detail}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  // 🔍 Probar el QR actual
  const testQR = async () => {
    if (!compatibleQR) return;
    
    setQrStatus("testing");
    setQrDebug("🔍 Probando QR con endpoint /auth/qr-login...");

    try {
      const response = await axios.post(`${API_URL}/auth/qr-login`, {
        qr_data: compatibleQR
      });
      
      setQrStatus("success");
      setQrDebug("🎉 ✅ ¡QR FUNCIONA CORRECTAMENTE!");
      alert("🎉 ¡QR COMPATIBLE! El escaneo funcionará correctamente.");
      
    } catch (error) {
      setQrStatus("error");
      const errorDetail = error.response?.data?.detail || error.message;
      setQrDebug(`❌ Error: ${errorDetail}`);
      alert(`❌ QR no funciona: ${errorDetail}`);
    }
  };

  const handleStickerSelect = (emoji) => {
    setSticker(sticker === emoji ? null : emoji);
  };

  // 🎨 Obtener estilo del sticker según posición y tamaño
  const getStickerStyle = () => {
    const positions = {
      "top-right": { top: "5px", right: "5px" },
      "top-left": { top: "5px", left: "5px" },
      "bottom-right": { bottom: "5px", right: "5px" },
      "bottom-left": { bottom: "5px", left: "5px" },
      "center": { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    };

    const sizes = {
      small: "1.2rem",
      medium: "2rem",
      large: "3rem"
    };

    return {
      ...positions[stickerPosition],
      fontSize: sizes[stickerSize]
    };
  };

  // 🖼️ Obtener estilo de la foto
  const getPhotoStyle = () => {
    return {
      filter: `${filter} brightness(${brightness}%)`,
      transform: `rotate(${photoRotation}deg)`,
      border: borderStyle !== "none" ? borderStyle : undefined,
      borderImage: borderStyle === "3px solid transparent" 
        ? "linear-gradient(45deg, #2e7d32, #ffd700, #2e7d32) 1" 
        : undefined
    };
  };

  return (
    <div className="login-container">
      <div className="login-card shadow" style={{ maxWidth: "900px" }}>
        <div className="login-header">
          <h2>🎨 Personaliza tu Credencial</h2>
          <p>Crea una credencial única con filtros, stickers y estilos profesionales</p>
        </div>

        <div className="login-body text-center">
          {/* 🪪 Credencial centrada */}
          <div className="credencial-preview" ref={credencialRef}>
            <img src={credencialBg} alt="Credencial Base" className="credencial-bg" />

            <div className="foto-container">
              <img
                src={userData.foto}
                alt="Usuario"
                className="credencial-foto"
                style={getPhotoStyle()}
              />
              {sticker && (
                <span 
                  className="sticker-overlay" 
                  style={getStickerStyle()}
                >
                  {sticker}
                </span>
              )}
            </div>

            <div className="credencial-datos">
              <h3>{userData.nombre}</h3>
              <p>📧 {userData.email}</p>
              <p>📱 {userData.telefono}</p>
              <p>👤 Rol: Analista</p>
            </div>

            {/* QR Code */}
            <div className="credencial-qr">
              {compatibleQR ? (
                <>
                  <QRCodeCanvas value={compatibleQR} size={80} />
                  <div className="qr-status-badge">
                    {qrStatus === 'success' && '✅'}
                    {qrStatus === 'testing' && '🔄'}
                    {qrStatus === 'error' && '❌'}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* 🎛️ PANEL DE CONTROL CON PESTAÑAS */}
          <div className="editor-tabs mt-4">
            <div className="tabs-header">
              <button 
                className={`tab-button ${activeTab === 'filters' ? 'active' : ''}`}
                onClick={() => setActiveTab('filters')}
              >
                <FaFilter /> Filtros
              </button>
              <button 
                className={`tab-button ${activeTab === 'stickers' ? 'active' : ''}`}
                onClick={() => setActiveTab('stickers')}
              >
                <FaSmile /> Stickers
              </button>
              <button 
                className={`tab-button ${activeTab === 'styles' ? 'active' : ''}`}
                onClick={() => setActiveTab('styles')}
              >
                <FaPalette /> Estilos
              </button>
            </div>

            <div className="tabs-content">
              {/* 🎨 PESTAÑA DE FILTROS */}
              {activeTab === 'filters' && (
                <div className="tab-panel">
                  <h5>Efectos Fotográficos</h5>
                  <div className="filter-grid">
                    {filterOptions.map((f) => (
                      <button
                        key={f.name}
                        className={`filter-btn ${filter === f.value ? 'active' : ''}`}
                        onClick={() => setFilter(f.value)}
                      >
                        <span className="filter-preview">{f.preview}</span>
                        <span className="filter-name">{f.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Control de brillo */}
                  <div className="brightness-control mt-3">
                    <label>💡 Brillo: {brightness}%</label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                      className="brightness-slider"
                    />
                  </div>

                  {/* Control de rotación */}
                  <div className="rotation-control mt-3">
                    <label>🔄 Rotación: {photoRotation}°</label>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      value={photoRotation}
                      onChange={(e) => setPhotoRotation(e.target.value)}
                      className="rotation-slider"
                    />
                  </div>
                </div>
              )}

              {/* 😎 PESTAÑA DE STICKERS */}
              {activeTab === 'stickers' && (
                <div className="tab-panel">
                  {Object.entries(stickerCategories).map(([key, category]) => (
                    <div key={key} className="sticker-category">
                      <h6>{category.name}</h6>
                      <div className="stickers-grid">
                        {category.items.map((emoji) => (
                          <button
                            key={emoji}
                            className={`sticker-btn ${sticker === emoji ? 'active' : ''}`}
                            onClick={() => handleStickerSelect(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Configuración del sticker */}
                  {sticker && (
                    <div className="sticker-config mt-3">
                      <div className="config-group">
                        <label>📏 Tamaño:</label>
                        <div className="btn-group-sm">
                          {stickerSizes.map((s) => (
                            <button
                              key={s.value}
                              className={`btn-config ${stickerSize === s.value ? 'active' : ''}`}
                              onClick={() => setStickerSize(s.value)}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="config-group mt-2">
                        <label>📍 Posición:</label>
                        <div className="btn-group-sm">
                          {stickerPositions.map((p) => (
                            <button
                              key={p.value}
                              className={`btn-config ${stickerPosition === p.value ? 'active' : ''}`}
                              onClick={() => setStickerPosition(p.value)}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 🎨 PESTAÑA DE ESTILOS */}
              {activeTab === 'styles' && (
                <div className="tab-panel">
                  <h5>🖼️ Borde de la Foto</h5>
                  <div className="border-grid">
                    {borderStyles.map((b) => (
                      <button
                        key={b.name}
                        className={`border-btn ${borderStyle === b.value ? 'active' : ''}`}
                        onClick={() => setBorderStyle(b.value)}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🧪 Sección de prueba QR (compacta) */}
          <div className="qr-test-compact mt-3">
            <button 
              className={`btn btn-sm qr-test-btn ${qrStatus === 'success' ? 'btn-success' : qrStatus === 'error' ? 'btn-danger' : 'btn-info'}`}
              onClick={testQR}
              disabled={sendingEmail || !compatibleQR || qrStatus === 'testing'}
            >
              <FaQrcode className="me-2" /> 
              {qrStatus === 'success' ? '✅ QR Verificado' : 
               qrStatus === 'testing' ? '🔄 Verificando...' : 
               qrStatus === 'error' ? '❌ Error en QR' : '🔍 Verificar QR'}
            </button>
          </div>

          {/* 🔘 Botones principales */}
          <div className="action-buttons mt-4">
            <button 
              className="btn btn-success btn-lg" 
              onClick={handleSendPDF}
              disabled={sendingEmail}
            >
              <FaDownload className="me-2" /> 
              {sendingEmail ? "Enviando..." : "Enviar Credencial"}
            </button>

            <button
              className="btn btn-outline-secondary btn-lg"
              onClick={() => navigate("/login")}
              disabled={sendingEmail}
            >
              <FaArrowLeft className="me-2" /> Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CredencialEditor;