import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  // Si venimos de otra pantalla (ej: la página pública de un comercio), se vuelve ahí después de ingresar.
  const destino = (useLocation().state as { from?: string } | null)?.from ?? '/panel';
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (usuario) return <Navigate to={destino} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(identificador, password);
      navigate(destino);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <h1>Ingresar</h1>
      <form onSubmit={onSubmit}>
        <label>
          Usuario o email
          <input value={identificador} onChange={(e) => setIdentificador(e.target.value)} required autoFocus />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
      <p>
        ¿No tenés cuenta? <Link to="/registro/cliente">Registrate como cliente</Link> o{' '}
        <Link to="/registro/comerciante">como comerciante</Link>.
      </p>
    </>
  );
}
