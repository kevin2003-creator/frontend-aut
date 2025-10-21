import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import { FaQrcode, FaCamera, FaCheckCircle, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import "./QrScanner.css";

function QrScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [lastScanned, setLastScanned] = useState("");
  const [cameraError, setCameraError] = useState("");

  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Función para validar el QR esperado (JSON completo)
  const validateExpectedQR = (qrData) => {
    console.log("🔍 QR escaneado:", qrData);
    setLastScanned(qrData);

    try {
      // Intentar parsear como JSON
      const parsed = JSON.parse(qrData);
      console.log("✅ QR parseado como JSON:", parsed);

      // Verificar estructura esperada
      const required = ["usuario_id", "token", "timestamp", "expira", "tipo"];
      const missing = required.filter(field => !(field in parsed));
      
      if (missing.length > 0) {
        throw new Error(`Estructura incorrecta. Faltan: ${missing.join(", ")}`);
      }

      // Verificar expiración
      const expira = new Date(parsed.expira);
      const ahora = new Date();
      
      if (ahora > expira) {
        throw new Error("QR expirado. Genera uno nuevo.");
      }

      console.log("🎯 QR VÁLIDO - Estructura correcta");
      return parsed;

    } catch (error) {
      console.error("❌ Error validando QR:", error.message);
      
      // Si es un número, probablemente es el QR incorrecto
      if (/^\d+$/.test(qrData)) {
        throw new Error(
          `QR numérico detectado: "${qrData}". Este parece ser un ID, no el QR de acceso. Usa el QR JSON de tu credencial PDF.`
        );
      }
      
      throw new Error(`QR inválido: ${error.message}`);
    }
  };

  // Verificar permisos de cámara
  const checkCameraPermissions = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tu navegador no soporta acceso a la cámara");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }
      });
      
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("❌ Error de permisos de cámara:", error);
      setCameraError("Error al acceder a la cámara. Verifica los permisos.");
      return false;
    }
  };

  // Iniciar escaneo
  const startScanner = async () => {
    if (isScanning || loading) return;

    setLoading(true);
    setMessage("");
    setLastScanned("");
    setCameraError("");

    try {
      // Verificar que el elemento exista
      if (!document.getElementById("qr-reader")) {
        throw new Error("Elemento del escáner no encontrado");
      }

      // 1. Verificar permisos primero
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        return;
      }

      // 2. Inicializar escáner
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      // 3. Iniciar escaneo
      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, 
        { fps: 5, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          console.log("✅ QR detectado:", decodedText);
          await handleScan(decodedText);
        },
        (error) => {
          if (error && !error.message.includes("NotFoundException")) {
            console.log("📹 Escaneando...", error);
          }
        }
      );

      setIsScanning(true);
      setMessage("🔄 Escaneando... Apunta al QR de tu credencial PDF");
      
    } catch (err) {
      console.error("❌ Error iniciando escáner:", err);
      setMessage(`❌ Error al iniciar el escáner: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Detener escaneo
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      }
      setIsScanning(false);
      setMessage("");
    } catch (err) {
      console.warn("⚠️ Error al detener el escáner:", err);
    }
  };

  // Manejar QR leído - VERSIÓN CORREGIDA
  const handleScan = async (qrData) => {
    console.log("🎯 Procesando QR escaneado...");
    console.log("🔍 QR RAW DATA:", qrData);
    console.log("🔍 QR TYPE:", typeof qrData);
    console.log("🔍 QR LENGTH:", qrData.length);

    // Intentar parsear para ver si es JSON válido
    try {
      const parsed = JSON.parse(qrData);
      console.log("✅ QR PARSEADO CORRECTAMENTE:", parsed);
    } catch (e) {
      console.log("❌ QR NO ES JSON VÁLIDO:", e.message);
    }
    
    await stopScanner();
    setLoading(true);
    setMessage("🔍 Validando QR...");

    try {
      // 1. Validar que sea el QR correcto (JSON)
      const qrValidado = validateExpectedQR(qrData);
      
      setMessage("✅ QR válido. Conectando con servidor...");

      // 2. Enviar al backend
      console.log("🚀 Enviando QR al backend...");
      const response = await axios.post(`${API_URL}/auth/qr-login`, {
        qr_data: qrData
      });

      console.log("✅ Respuesta del backend:", response.data);

      // 3. Éxito - guardar token y redirigir
      setScanResult(response.data);
      setMessage(`✅ Bienvenido ${response.data.usuario.nombre_completo}`);
      
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.usuario));
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);

    } catch (error) {
      console.error("❌ Error en el proceso:", error);
      
      // DEBUG DETALLADO
      console.log("🔴 DEBUG - Error completo:", error);
      console.log("🔴 DEBUG - Response data:", error.response?.data);
      console.log("🔴 DEBUG - Response status:", error.response?.status);
      console.log("🔴 DEBUG - QR enviado:", qrData);
      
      let errorMessage = "Error al validar el QR";
      
      if (error.response) {
        // Error del servidor
        const serverError = error.response.data;
        console.log("🔴 Error del servidor COMPLETO:", serverError);
        
        // Mostrar TODO el objeto de error para debugging
        if (serverError && typeof serverError === 'object') {
          errorMessage = JSON.stringify(serverError, null, 2);
        } else if (typeof serverError === 'string') {
          errorMessage = serverError;
        } else {
          errorMessage = `Error ${error.response.status}: ${JSON.stringify(serverError)}`;
        }
      } else if (error.request) {
        // Error de conexión
        errorMessage = "🌐 No se pudo conectar con el servidor";
      } else {
        // Error de validación local
        errorMessage = error.message;
      }
      
      setMessage(String(errorMessage));
      
      // Reintentar después de mostrar el error
      setTimeout(() => {
        setMessage("🔄 Reintentando escaneo...");
        setTimeout(() => {
          setMessage("");
          startScanner();
        }, 1000);
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar al desmontar - CORREGIDO: fuera de handleScan
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="qr-wrapper">
      <div className="qr-card">
        <div className="qr-header">
          <FaQrcode size={40} color="#2e7d32" />
          <h2>Acceso con Código QR</h2>
          <p>Escanea el <strong>QR JSON</strong> de tu credencial PDF</p>
        </div>

        {cameraError && (
          <div className="camera-error">
            <FaExclamationTriangle />
            <div>
              <strong>Error de Cámara:</strong>
              <p>{cameraError}</p>
              <button 
                className="retry-btn"
                onClick={() => {
                  setCameraError("");
                  startScanner();
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`qr-message ${message.includes("✅") ? "success" : "error"}`}>
            {message.includes("❌") || message.includes("Error") ? <FaExclamationTriangle /> : ""}
            <span>{message}</span>
          </div>
        )}

        {lastScanned && lastScanned.length < 20 && (
          <div className="qr-warning">
            <FaExclamationTriangle />
            <div>
              <strong>QR detectado:</strong> "{lastScanned}"
              <br />
              <small>Este parece ser un ID numérico, no el QR de acceso.</small>
            </div>
          </div>
        )}

        <div id="qr-reader" ref={qrRef} className="qr-reader">
          {!isScanning && !loading && !cameraError && (
            <div className="qr-placeholder">
              <p>Haz click en "Iniciar Escáner" para comenzar</p>
            </div>
          )}
        </div>

        <div className="qr-buttons">
          {isScanning ? (
            <button className="stop-btn" onClick={stopScanner} disabled={loading}>
              <FaTimes /> {loading ? "Procesando..." : "Detener Escáner"}
            </button>
          ) : (
            <button 
              className="start-btn" 
              onClick={startScanner} 
              disabled={loading || !!cameraError}
            >
              <FaCamera /> {loading ? "Iniciando..." : "Iniciar Escáner"}
            </button>
          )}
        </div>

        {scanResult && (
          <div className="qr-success">
            <FaCheckCircle size={50} color="#2e7d32" />
            <h3>¡Acceso Concedido!</h3>
            <p>{scanResult.usuario.nombre_completo}</p>
            <small>{scanResult.usuario.email}</small>
            <div className="redirect-message">Redirigiendo al dashboard...</div>
          </div>
        )}

        <div className="qr-footer">
          <button 
            className="back-btn"
            onClick={() => window.location.href = "/login"}
          >
            ← Volver al Login Normal
          </button>
        </div>
      </div>
    </div>
  );
}

export default QrScanner;