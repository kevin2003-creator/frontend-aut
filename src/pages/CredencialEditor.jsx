import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { FaDownload, FaArrowLeft, FaSmile, FaFilter } from "react-icons/fa";
import credencialBg from "../assets/Credencial_Lexion.png";
import "./Credencial.css";

function CredencialEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData;
  const credencialRef = useRef(null);
  const [filter, setFilter] = useState("none");
  const [sticker, setSticker] = useState(null);

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
  try {
    // 🧩 Capturar la vista como imagen
    const canvas = await html2canvas(credencialRef.current, { useCORS: true, scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // 🧩 Crear PDF
    const pdf = new jsPDF("landscape", "pt", "a6");
    pdf.addImage(imgData, "PNG", 0, 0, 420, 300);
    const pdfBlob = pdf.output("blob");

    // 🧠 Convertir a Base64 (en texto)
    const reader = new FileReader();
    reader.onloadend = async () => {
      const pdfBase64 = reader.result.split(",")[1]; // solo el contenido Base64

      // 🧾 Enviar como JSON (no multipart)
      const payload = {
        email: userData.email,
        nombre_usuario: userData.nombre,
        pdf_base64: pdfBase64,
      };

      try {
        const res = await axios.post(
          "http://localhost:8000/credencial/enviar",
          payload,
          { headers: { "Content-Type": "application/json" } } // 👈 clave
        );
        console.log("✅ PDF enviado correctamente:", res.data);
      } catch (err) {
        console.error("❌ Error al enviar:", err.response?.data || err.message);
      }
    };
    reader.readAsDataURL(pdfBlob);
  } catch (error) {
    console.error("⚠️ Error generando PDF:", error);
  }
};



  const handleStickerSelect = (emoji) => {
    setSticker(sticker === emoji ? null : emoji);
  };

  return (
    <div className="login-container">
      <div className="login-card shadow" style={{ maxWidth: "800px" }}>
        <div className="login-header">
          <h2>🎨 Personaliza tu Credencial</h2>
          <p>Agrega filtros o detalles antes de generar tu PDF</p>
        </div>

        <div className="login-body text-center">
          {/* 🪪 Credencial centrada */}
          <div className="credencial-preview" ref={credencialRef}>
            <img
              src={credencialBg}
              alt="Credencial Base"
              className="credencial-bg"
            />

            <div className="foto-container">
              <img
                src={userData.foto}
                alt="Usuario"
                className="credencial-foto"
                style={{ filter }}
              />
              {sticker && <span className="sticker-overlay">{sticker}</span>}
            </div>

            <div className="credencial-datos">
              <h3>{userData.nombre}</h3>
              <p>📧 {userData.email}</p>
              <p>📱 {userData.telefono}</p>
              <p>👤 Rol: Analista</p>
            </div>

            {userData.qr_url && (
              <div className="credencial-qr">
                <QRCodeCanvas value={userData.qr_url} size={80} />
              </div>
            )}
          </div>

          {/* 🎨 Barra de filtros */}
          <div className="filter-section mt-4">
            <h5>
              <FaFilter className="me-2" />
              Filtros
            </h5>
            <div className="btn-group flex-wrap justify-content-center">
              <button className="btn btn-outline-dark m-1" onClick={() => setFilter("none")}>Normal</button>
              <button className="btn btn-outline-dark m-1" onClick={() => setFilter("grayscale(100%)")}>Gris</button>
              <button className="btn btn-outline-dark m-1" onClick={() => setFilter("sepia(90%)")}>Vintage</button>
              <button className="btn btn-outline-dark m-1" onClick={() => setFilter("contrast(120%) brightness(110%)")}>Brillante</button>
              <button className="btn btn-outline-dark m-1" onClick={() => setFilter("blur(2px)")}>Desenfocar</button>
            </div>
          </div>

          {/* 😎 Stickers */}
          <div className="stickers-section mt-3">
            <h5>
              <FaSmile className="me-2" />
              Stickers
            </h5>
            <div className="btn-group flex-wrap justify-content-center">
              {["😎", "🎓", "🔥", "⭐", "👑", "💻"].map((emoji) => (
                <button
                  key={emoji}
                  className={`btn btn-outline-dark m-1 ${sticker === emoji ? "active" : ""}`}
                  onClick={() => handleStickerSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 🔘 Botones */}
          <div className="d-flex justify-content-center gap-2 mt-4">
                <button className="btn btn-success" onClick={handleSendPDF}>
                  <FaDownload className="me-2" /> Enviar Credencial al Correo
                </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/login")}
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

