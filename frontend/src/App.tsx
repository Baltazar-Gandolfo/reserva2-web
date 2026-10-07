import { useEffect, useState } from 'react';

// import.meta.env = variables de entorno de Vite (las que empiezan con VITE_ vienen del archivo .env del frontend).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

type HealthResponse = { status: string; db: string; usuarios: number; timestamp: string };

// Un componente React es una función que devuelve "JSX" (HTML dentro de TypeScript).
// useState guarda estado; useEffect corre código al montarse el componente (acá: llamar a la API).
function App() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '3rem auto' }}>
      <h1>Reserva2</h1>
      <h2>Estado del backend</h2>
      {error && <p style={{ color: 'crimson' }}>No se pudo conectar: {error}</p>}
      {!error && !data && <p>Consultando…</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </main>
  );
}

export default App;
