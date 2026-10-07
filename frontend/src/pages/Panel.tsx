import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Usuario } from '../api';
import { useAuth } from '../auth/AuthContext';

// Ruta protegida de ejemplo: pide /usuarios/me con el token. Si sos ADMINISTRADOR, además lista
// todos los usuarios (endpoint que solo admite ese rol) para probar el RolesGuard del backend.
export function Panel() {
  const { usuario, logout, authRequest } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authRequest<Usuario>('/usuarios/me').then(setMe).catch((e: Error) => setError(e.message));
    if (usuario?.rol === 'ADMINISTRADOR') {
      authRequest<Usuario[]>('/usuarios').then(setUsuarios).catch((e: Error) => setError(e.message));
    }
  }, [authRequest, usuario?.rol]);

  return (
    <>
      <h1>Panel</h1>
      <p>
        <Link to="/">Inicio</Link> ·{' '}
        <button onClick={() => { logout(); navigate('/login'); }}>Salir</button>
      </p>
      {error && <p className="error">{error}</p>}
      <h2>Mi sesión (GET /usuarios/me)</h2>
      {me && <pre>{JSON.stringify(me, null, 2)}</pre>}
      {usuarios && (
        <>
          <h2>Usuarios (GET /usuarios, solo ADMINISTRADOR)</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Username</th><th>Rol</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td><td>{u.nombre} {u.apellido}</td><td>{u.email}</td>
                  <td>{u.username ?? '—'}</td><td>{u.rol}</td><td>{u.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
