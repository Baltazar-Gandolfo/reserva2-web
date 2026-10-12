import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Comercio } from '../api';
import { useAuth } from '../auth/AuthContext';

export function ComerciosLista() {
  const { usuario, authRequest } = useAuth();
  const [comercios, setComercios] = useState<Comercio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const puedeCrear = usuario?.rol === 'COMERCIANTE'; // el backend también lo exige

  useEffect(() => {
    authRequest<Comercio[]>('/comercios').then(setComercios).catch((e: Error) => setError(e.message));
  }, [authRequest]);

  return (
    <>
      <h1>{usuario?.rol === 'ADMINISTRADOR' ? 'Todos los comercios' : 'Mis comercios'}</h1>
      <p>
        <Link to="/panel">← Panel</Link>
        {puedeCrear && comercios && comercios.length > 0 && (
          <> · <Link to="/comercios/nuevo">Nuevo comercio</Link></>
        )}
      </p>
      {error && <p className="error">{error}</p>}
      {!comercios && !error && <p>Cargando…</p>}
      {comercios && comercios.length === 0 && (
        <>
          <p>Todavía no tenés ningún comercio.</p>
          {puedeCrear && (
            <Link to="/comercios/nuevo"><button>Crear mi primer comercio</button></Link>
          )}
        </>
      )}
      {comercios && comercios.length > 0 && (
        <table>
          <thead>
            <tr><th>Nombre</th><th>Slug</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {comercios.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/comercios/${c.id}`}>{c.nombre}</Link></td>
                <td>{c.slug}</td>
                <td>{c.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
