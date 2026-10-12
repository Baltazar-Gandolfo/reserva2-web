import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Comercio } from '../api';
import { useAuth } from '../auth/AuthContext';
import { slugify } from '../slug';

export function ComercioNuevo() {
  const { authRequest } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [slugManual, setSlugManual] = useState<string | null>(null); // null = el usuario no lo tocó
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Mientras no lo edite a mano, el slug se deriva del nombre en cada render (estado derivado, sin useEffect).
  const slug = slugManual ?? slugify(nombre);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const creado = await authRequest<Comercio>('/comercios', {
        method: 'POST',
        // Solo se manda el slug si el usuario lo editó: si no, el backend lo genera y agrega -2, -3... si ya existe.
        body: { nombre, ...(slugManual !== null && slugManual !== '' && { slug: slugManual }), ...(descripcion && { descripcion }) },
      });
      navigate(`/comercios/${creado.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <h1>Nuevo comercio</h1>
      <p><Link to="/comercios">← Mis comercios</Link></p>
      <form onSubmit={onSubmit}>
        <label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} /></label>
        <label>
          Slug (URL pública)
          <input
            value={slug}
            onChange={(e) => setSlugManual(e.target.value.toLowerCase())}
            maxLength={60}
            placeholder="se genera del nombre"
          />
        </label>
        <small>
          Quedaría: <code>{window.location.origin}/c/{slug || '…'}</code>
          {slugManual === null && ' (si ya existe, se agrega un número al final)'}
        </small>
        <label>Descripción (opcional)<textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={500} /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={cargando}>{cargando ? 'Creando…' : 'Crear comercio'}</button>
      </form>
    </>
  );
}
