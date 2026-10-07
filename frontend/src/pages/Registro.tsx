import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../api';
import { useAuth } from '../auth/AuthContext';

// Un solo formulario para los dos registros: el comerciante suma el campo username.
export function Registro({ tipo }: { tipo: 'cliente' | 'comerciante' }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', username: '', telefono: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const esComerciante = tipo === 'comerciante';

  const campo = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [name]: e.target.value }),
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { username, telefono, ...resto } = form;
      await request(`/auth/registro/${tipo}`, {
        method: 'POST',
        body: { ...resto, ...(telefono && { telefono }), ...(esComerciante && { username }) },
      });
      await login(esComerciante ? username : form.email, form.password); // entra directo tras registrarse
      navigate('/panel');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <h1>Registro de {tipo}</h1>
      <form onSubmit={onSubmit}>
        <label>Nombre<input {...campo('nombre')} required /></label>
        <label>Apellido<input {...campo('apellido')} required /></label>
        <label>Email<input type="email" {...campo('email')} required /></label>
        {esComerciante && (
          <label>Username<input {...campo('username')} required minLength={3} maxLength={30} /></label>
        )}
        <label>Teléfono (opcional)<input {...campo('telefono')} /></label>
        <label>Contraseña (mín. 8)<input type="password" {...campo('password')} required minLength={8} /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={cargando}>{cargando ? 'Creando…' : 'Crear cuenta'}</button>
      </form>
      <p>
        ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
      </p>
    </>
  );
}
