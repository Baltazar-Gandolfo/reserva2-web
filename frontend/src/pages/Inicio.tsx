import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../api';

type Health = { status: string };

export function Inicio() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<Health>('/health').then(setHealth).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Reserva2</h1>
      <p>
        <Link to="/login">Ingresar</Link> · <Link to="/registro/cliente">Soy cliente</Link> ·{' '}
        <Link to="/registro/comerciante">Soy comerciante</Link> · <Link to="/panel">Ir al panel</Link>
      </p>
      <h2>Estado del backend</h2>
      {error && <p className="error">No se pudo conectar: {error}</p>}
      {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
    </>
  );
}
