import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Spinner } from "react-bootstrap";
import "./Analizador.css";

function Analizador() {
  const [user, setUser] = useState(null);
  const [idioma, setIdioma] = useState("español");
  const [archivo, setArchivo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [analisisTemp, setAnalisisTemp] = useState(null);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const asArray = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);
  const safeJoin = (v, sep = ", ") =>
    Array.isArray(v) ? v.join(sep) : typeof v === "string" ? v : "—";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${API_URL}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error obteniendo usuario:", err);
      }
    };
    fetchUser();
  }, [API_URL]);

  const handleProcesar = async () => {
    if (!archivo) return alert("Selecciona un archivo .txt");
    try {
      const formData = new FormData();
      formData.append("idioma", idioma);
      formData.append("archivo", archivo);
      const res = await axios.post(`${API_URL}/analizador/procesar`, formData);
      setAnalisisTemp(res.data);
      setShowModal(true);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Error procesando archivo");
    }
  };

  const handleEnviarCorreo = async (enviar) => {
    setShowModal(false);
    if (!analisisTemp) return;
    if (enviar && user?.email) {
      try {
        setEnviandoCorreo(true);
        const formData = new FormData();
        formData.append("idioma", idioma);
        formData.append("archivo", archivo);
        formData.append("enviar_pdf", "sí");
        formData.append("correo", user.email);
        const res = await axios.post(`${API_URL}/analizador/procesar`, formData);
        setResultado(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || "Error enviando el correo");
      } finally {
        setEnviandoCorreo(false);
      }
    } else {
      setResultado(analisisTemp);
    }
  };

  const r = resultado || {};
  const otras = r.otras_categorias || {};

  return (
    <>
      <div className="container py-5 analizador-container">
        <div className="text-center mb-4">
          <h2 className="fw-bold titulo-principal">🌐 Análisis Léxico Multilingüe</h2>
          <p className="subtitulo">
            Carga un archivo .txt y analiza su contenido léxico en segundos.
          </p>
        </div>

        {/* 🌍 Selector de idioma */}
        <div className="idioma-selector">
          <h5 className="idioma-titulo">🌍 Seleccione el Idioma del Texto</h5>
          <div className="idioma-grid">
            {[
              { id: "español", nombre: "Español", pais: "Latinoamérica", icono: "🇪🇸" },
              { id: "ingles", nombre: "Inglés", pais: "Estados Unidos", icono: "🇺🇸" },
              { id: "ruso", nombre: "Ruso", pais: "Rusia", icono: "🇷🇺" },
            ].map((lang) => (
              <div
                key={lang.id}
                className={`idioma-card ${idioma === lang.id ? "activo" : ""}`}
                onClick={() => setIdioma(lang.id)}
              >
                <div className="idioma-icono">{lang.icono}</div>
                <h6>{lang.nombre}</h6>
                <p>{lang.pais}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 📂 Subida de archivo */}
        <div className="card shadow border-0 mb-5 rounded-4 card-analizador">
          <div className="card-header text-white fw-semibold fs-5 rounded-top-4 card-header-analizador">
            📂 Cargar archivo
          </div>
          <div className="card-body p-4 card-body-fondo-verde">
            <div className="mb-3 text-center">
              <label className="form-label fw-semibold texto-verde-oscuro">
                📄 Archivo .txt:
              </label>
              <input
                type="file"
                className="form-control border-success form-file-analizador"
                accept=".txt"
                onChange={(e) => setArchivo(e.target.files[0])}
              />
            </div>

            <div className="d-grid">
              <button
                className="btn btn-lg text-white fw-semibold btn-analizador"
                onClick={handleProcesar}
                disabled={enviandoCorreo}
              >
                {enviandoCorreo ? (
                  <>
                    <Spinner animation="border" size="sm" /> Procesando...
                  </>
                ) : (
                  <>⚙️ Procesar texto</>
                )}
              </button>
            </div>
            {error && <p className="text-danger mt-3 text-center">{error}</p>}
          </div>
        </div>

        {/* 📊 Resultados */}
        {resultado && (
          <>
            <div className="alert text-center shadow-sm rounded-4 mb-5 text-dark alert-analizador">
              📊 <b>{r.total_palabras}</b> palabras analizadas en{" "}
              <b>{r.idioma?.toUpperCase()}</b> — Se identificaron{" "}
              <b>{asArray(r.sustantivos).length}</b> sustantivos,{" "}
              <b>{asArray(r.verbos).length}</b> verbos y{" "}
              <b>{asArray(r.adjetivos).length}</b> adjetivos.
            </div>

            <div className="card shadow-lg border-0 rounded-4 bg-light card-analizador">
              <div className="card-header bg-white text-center fw-bold fs-5 border-bottom texto-verde-oscuro">
                📋 Resultados del Análisis Léxico
              </div>

              <div className="card-body p-4">
                {/* 🔹 Métricas */}
                <div className="row text-center mb-4">
                  {[
                    ["🧮 Total Palabras", r.total_palabras ?? 0],
                    ["🗣️ Idioma", r.idioma?.toUpperCase() || "—"],
                    ["📘 Sustantivos", asArray(r.sustantivos).length],
                    ["📗 Verbos", asArray(r.verbos).length],
                  ].map(([titulo, valor], i) => (
                    <div key={i} className="col-6 col-md-3 mb-3">
                      <div className="card border-0 shadow-sm rounded-4 p-3 metrica-card">
                        <h6 className="text-muted">{titulo}</h6>
                        <h2 className="fw-bold valor-metrica">{valor}</h2>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 🔹 Categorías */}
                <div className="categorias-compactas">
                  <div className="p-3 rounded-4 shadow-sm categoria-card categoria-pronombres">
                    <h5 className="fw-bold text-success categoria-titulo">🧍 Pronombres</h5>
                    <p className="small">{safeJoin(r.pronombres_personales)}</p>
                  </div>

                  <div className="p-3 rounded-4 shadow-sm categoria-card categoria-nombres">
                    <h5 className="fw-bold text-danger categoria-titulo">👤 Nombres</h5>
                    <p className="small">{safeJoin(r.nombres_personas)}</p>
                  </div>

                  <div className="p-3 rounded-4 shadow-sm categoria-card categoria-adjetivos">
                    <h5 className="fw-bold text-warning categoria-titulo">💬 Adjetivos</h5>
                    <p className="small">{safeJoin(r.adjetivos)}</p>
                  </div>

                  <div className="p-3 rounded-4 shadow-sm categoria-card categoria-otras">
                    <h5 className="fw-bold text-info categoria-titulo">🧩 Otras categorías</h5>
                    <ul className="small mb-0">
                      <li>Adverbios: <b>{asArray(otras.adverbios).length}</b></li>
                      <li>Números: <b>{asArray(otras.numeros).length}</b></li>
                      <li>Interjecciones: <b>{asArray(otras.interjecciones).length}</b></li>
                      <li>Propios: <b>{asArray(otras.propios_sin_per).length}</b></li>
                    </ul>
                  </div>
                </div>

                {/* 🔹 Sustantivos y Verbos */}
                <div className="row g-4 mt-3">
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-header text-white fw-semibold card-header-analizador">
                        📘 Sustantivos
                      </div>
                      <div className="card-body lista-sustantivos">
                        <p className="small text-muted mb-0">{safeJoin(r.sustantivos)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-header text-white fw-semibold card-header-analizador">
                        📗 Verbos
                      </div>
                      <div className="card-body lista-verbos">
                        <p className="small text-muted mb-0">{safeJoin(r.verbos)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {r.email_status && (
                  <div className="alert alert-success text-center mt-4 rounded-4 shadow-sm alert-success-analizador">
                    {r.email_status}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>


      <Modal show={showModal} onHide={() => handleEnviarCorreo(false)} centered>
        <Modal.Header closeButton className="modal-header-analizador">
          <Modal.Title>📩 Enviar reporte por correo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {user?.nombre_completo
              ? `Hola ${user.nombre_completo.split(" ")[0]},`
              : "Hola,"}{" "}
            ¿Deseas recibir un correo con el reporte en PDF?
            <br />
            <small className="text-muted">
              Se enviará a <b>{user?.email || "tu correo registrado"}</b>.
            </small>
          </p>
        </Modal.Body>
        <Modal.Footer className="modal-footer-analizador">
          <Button variant="secondary" onClick={() => handleEnviarCorreo(false)}>
            No, solo mostrar
          </Button>
          <Button className="btn-analizador" onClick={() => handleEnviarCorreo(true)}>
            Sí, enviar correo
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Analizador;
