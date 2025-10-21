import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Profile.css";
import { FaCamera, FaTimes } from "react-icons/fa";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const videoRef = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [stream, setStream] = useState(null);

  // ✅ Cargar datos del usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("📸 Datos del usuario:", res.data);
        setUser(res.data);
      } catch (err) {
        console.error("Error cargando usuario:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [API_URL]);

  // ✅ Inicializar cámara cuando se abre el modal
  useEffect(() => {
    if (showPhotoModal) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [showPhotoModal]);

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
        setStream(userStream);
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setSnapshot(null);
  };

  // ✅ Capturar foto
  const tomarFoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(
      (blob) => {
        setSnapshot(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  // ✅ Cambiar foto de perfil - ÚNICA FUNCIÓN (ELIMINAR LA DUPLICADA)
  const handlePhotoChange = async () => {
    if (!snapshot) {
      alert("Debes capturar una foto primero 📸");
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("foto_perfil", snapshot, "rostro.jpg");

      const res = await axios.put(`${API_URL}/usuarios/me/foto`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      // ✅ Actualizar la foto en el estado
      setUser((prev) => ({ 
        ...prev, 
        foto_perfil: res.data.rostro_segmentado_b64
      }));
      
      alert("Foto actualizada correctamente ✅");
      setShowPhotoModal(false);
      setSnapshot(null);
    } catch (err) {
      console.error("Error al subir la foto:", err);
      alert("Error al subir la foto ❌");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Editar información general
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    
    const formData = new URLSearchParams();
    formData.append('nombre_completo', e.target.nombre_completo.value);
    formData.append('telefono', e.target.telefono.value);
    formData.append('email', e.target.email.value);

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/usuarios/me`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
      });

      alert("Información actualizada correctamente ✅");
      setUser((prev) => ({
        ...prev,
        nombre_completo: e.target.nombre_completo.value,
        telefono: e.target.telefono.value,
        email: e.target.email.value,
      }));
      setShowEditInfo(false);
    } catch (err) {
      console.error("Error al actualizar la información:", err);
      alert("Error al actualizar la información ❌");
    }
  };

  // ✅ Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    const newPassword = e.target.new_password.value;
    const confirm = e.target.confirm_password.value;

    if (newPassword !== confirm) {
      alert("Las contraseñas no coinciden ❌");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const formData = new URLSearchParams();
      formData.append('old_password', e.target.old_password.value);
      formData.append('new_password', newPassword);

      await axios.put(`${API_URL}/usuarios/me/password`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
      });
      alert("Contraseña cambiada correctamente 🔒");
      setShowPasswordModal(false);
      e.target.reset();
    } catch (err) {
      console.error("Error al cambiar la contraseña:", err);
      
      if (err.response?.status === 401) {
        alert("Contraseña actual incorrecta ❌");
      } else {
        alert("Error al cambiar la contraseña ❌");
      }
    }
  };

  if (loading) return <p className="profile-loading">Cargando perfil...</p>;

  return (
    <div className="profile-flat">
      {/* 🌿 Encabezado */}
      <div className="profile-header">
        <h1>¡Hola!</h1>
        <p>Soy {user?.rol?.toLowerCase() || "usuario"} activo de LexionAU 🌿</p>
      </div>

      {/* 🌿 Contenido principal */}
      <div className="profile-layout">
        {/* 📸 Imagen de perfil */}
        <div className="profile-left">
          <img
            src={user?.foto_perfil ? `data:image/jpeg;base64,${user.foto_perfil}` : "/default_avatar.png"}
            alt="Foto de perfil"
            className="profile-flat-photo"
          />
          <button
            className="btn-flat-edit"
            onClick={() => setShowPhotoModal(true)}
            disabled={uploading}
          >
            {uploading ? "Subiendo..." : "Editar foto"}
          </button>
        </div>

        {/* 🧾 Información del usuario */}
        <div className="profile-right">
          <div className="profile-info-header">
            <h2>{user?.nombre_completo || "Usuario"}</h2>
            <button className="btn-edit-info" onClick={() => setShowEditInfo(true)}>
              Editar información
            </button>
          </div>

          <div className="profile-info-details">
            <p>
              <strong>Email:</strong> {user?.email || "No especificado"}
            </p>
            <p>
              <strong>Teléfono:</strong> {user?.telefono || "No especificado"}
            </p>
            <p>
              <strong>Rol:</strong> {user?.rol || "Usuario"}
            </p>
            <p>
              <strong>Registrado:</strong>{" "}
              {user?.fecha_creacion
                ? new Date(user.fecha_creacion).toLocaleDateString()
                : "No disponible"}
            </p>
          </div>

          <button className="btn-change-password" onClick={() => setShowPasswordModal(true)}>
            Cambiar contraseña
          </button>
        </div>
      </div>

      {/* 📸 Modal para cambiar foto */}
      {showPhotoModal && (
        <div className="modal-overlay">
          <div className="modal-box photo-modal">
            <div className="modal-header">
              <h3>Actualizar Foto de Perfil</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSnapshot(null);
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="camera-container">
              {!snapshot ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    className="camera-preview"
                  ></video>
                  <button 
                    className="btn-capture"
                    onClick={tomarFoto}
                  >
                    <FaCamera /> Capturar Foto
                  </button>
                </>
              ) : (
                <>
                  <img 
                    src={URL.createObjectURL(snapshot)} 
                    alt="Foto capturada" 
                    className="photo-preview"
                  />
                  <div className="photo-actions">
                    <button 
                      className="btn-confirm"
                      onClick={handlePhotoChange}
                      disabled={uploading}
                    >
                      {uploading ? "Procesando..." : "✅ Usar esta foto"}
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => setSnapshot(null)}
                    >
                      🔁 Tomar otra
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSnapshot(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Modal editar información */}
      {showEditInfo && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Editar información</h3>
            <form onSubmit={handleUpdateInfo}>
              <input
                type="text"
                name="nombre_completo"
                placeholder="Nombre completo"
                defaultValue={user?.nombre_completo}
                required
              />
              <input
                type="text"
                name="telefono"
                placeholder="Teléfono"
                defaultValue={user?.telefono}
              />
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                defaultValue={user?.email}
                required
              />
              <div className="modal-actions">
                <button type="submit" className="btn-confirm">Guardar cambios</button>
                <button type="button" className="btn-cancel" onClick={() => setShowEditInfo(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 Modal cambiar contraseña */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Cambiar contraseña</h3>
            <form onSubmit={handleChangePassword}>
              <input type="password" name="old_password" placeholder="Contraseña actual" required />
              <input type="password" name="new_password" placeholder="Nueva contraseña" required />
              <input type="password" name="confirm_password" placeholder="Confirmar contraseña" required />
              <div className="modal-actions">
                <button type="submit" className="btn-confirm">Actualizar</button>
                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;