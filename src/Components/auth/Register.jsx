// pages/Register.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { FaUserPlus, FaUser, FaLock, FaEnvelope, FaPhone } from 'react-icons/fa';

function Register() {
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
    email: '',
    nombre_completo: '',
    telefono: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validación simple del teléfono (8 dígitos exactos)
    if (!/^\d{8}$/.test(formData.telefono)) {
      setError('El número de teléfono debe contener exactamente 8 dígitos.');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:8000/register', formData);
      setSuccess('✅ Registro exitoso. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Error al registrar:', err);
      setError(
        err.response?.data?.detail ||
        'Error al registrar usuario. Verifica los datos ingresados.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Crear cuenta</h2>
          <p>Completa los datos para registrarte</p>
        </div>

        <div className="login-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Usuario */}
            <div className="form-group">
              <label className="form-label">
                <FaUser className="me-2" /> Usuario
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

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                <FaEnvelope className="me-2" /> Correo
              </label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Correo electrónico"
              />
            </div>

            {/* Nombre completo */}
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

            {/* Teléfono */}
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

            {/* Contraseña */}
            <div className="form-group">
              <label className="form-label">
                <FaLock className="me-2" /> Contraseña
              </label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Crea una contraseña"
              />
            </div>

            <button type="submit" className="btn btn-success w-100" disabled={isLoading}>
              {isLoading ? 'Registrando...' : (
                <>
                  <FaUserPlus className="me-2" /> Registrar
                </>
              )}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <button
              className="btn btn-link p-0"
              style={{
                color: '#0d6efd',
                textDecoration: 'underline',
                background: 'none',
                border: 'none'
              }}
              onClick={() => navigate('/login')}
            >
              Inicia sesión
            </button>

          </p>
          <p>
                        <button
              className="btn btn-link p-0"
              style={{
                color: '#0d6efd',
                textDecoration: 'underline',
                background: 'none',
                border: 'none'
              }}
              onClick={() => navigate('/registerfacial')}
            >
              Registro Facial
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
