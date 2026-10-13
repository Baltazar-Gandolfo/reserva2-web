import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { Recurso, Unidad } from '../api';
import { useAuth } from '../auth/AuthContext';
import { duracionTexto } from '../format';

const recursoVacio = {
  nombre: '',
  duracionBaseMin: 30,
  duracionMinMin: 60,
  duracionMaxMin: 60,
  requiereAprobacion: false,
  anticipacionMinCancelacionHoras: 0,
};

// Gestión de la sucursal: sus unidades base (piezas físicas) y los recursos reservables que las combinan.
export function SucursalDetalle() {
  const { id } = useParams();
  const { state } = useLocation() as { state: { nombre?: string; comercioId?: number } | null };
  const { authRequest } = useAuth();
  const [unidades, setUnidades] = useState<Unidad[] | null>(null);
  const [recursos, setRecursos] = useState<Recurso[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombreUnidad, setNombreUnidad] = useState('');
  const [errorUnidad, setErrorUnidad] = useState<string | null>(null);
  const [form, setForm] = useState(recursoVacio);
  const [elegidas, setElegidas] = useState<number[]>([]);
  const [errorRecurso, setErrorRecurso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([
        authRequest<Unidad[]>(`/sucursales/${id}/unidades`),
        authRequest<Recurso[]>(`/sucursales/${id}/recursos`),
      ]);
      setUnidades(u);
      setRecursos(r);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [authRequest, id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function crearUnidad(e: FormEvent) {
    e.preventDefault();
    setErrorUnidad(null);
    try {
      await authRequest(`/sucursales/${id}/unidades`, { method: 'POST', body: { nombre: nombreUnidad } });
      setNombreUnidad('');
      await cargar();
    } catch (err) {
      setErrorUnidad((err as Error).message);
    }
  }

  async function crearRecurso(e: FormEvent) {
    e.preventDefault();
    setErrorRecurso(null);
    try {
      await authRequest(`/sucursales/${id}/recursos`, { method: 'POST', body: { ...form, unidadIds: elegidas } });
      setForm(recursoVacio);
      setElegidas([]);
      await cargar();
    } catch (err) {
      setErrorRecurso((err as Error).message);
    }
  }

  async function cambiarEstado(r: Recurso) {
    try {
      await authRequest(`/recursos/${r.id}`, { method: 'PATCH', body: { estado: r.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } });
      await cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const num = (campo: 'duracionBaseMin' | 'duracionMinMin' | 'duracionMaxMin' | 'anticipacionMinCancelacionHoras') => ({
    type: 'number' as const,
    value: form[campo],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [campo]: Number(e.target.value) }),
  });

  if (error) return <><p><Link to="/comercios">← Comercios</Link></p><p className="error">{error}</p></>;
  if (!unidades || !recursos) return <p>Cargando…</p>;

  const nombreDe = (uid: number) => unidades.find((u) => u.id === uid)?.nombre ?? `#${uid}`;

  return (
    <>
      <h1>{state?.nombre ?? `Sucursal #${id}`}</h1>
      <p>
        <Link to={state?.comercioId ? `/comercios/${state.comercioId}` : '/comercios'}>← Volver al comercio</Link>
        {state?.comercioId && <> · <Link to={`/comercios/${state.comercioId}/reservas`}>Ver reservas</Link></>}
      </p>

      <h2>Unidades base</h2>
      <p><small>La pieza física indivisible (ej: "Tercio A" de una cancha de 11). Los recursos se arman combinando unidades.</small></p>
      {unidades.length === 0 ? <p>Todavía no hay unidades.</p> : <p>{unidades.map((u) => u.nombre).join(' · ')}</p>}
      <form onSubmit={crearUnidad} className="en-linea">
        <input placeholder="Nombre de la unidad" value={nombreUnidad} onChange={(e) => setNombreUnidad(e.target.value)} required maxLength={100} />
        <button>Agregar unidad</button>
      </form>
      {errorUnidad && <p className="error">{errorUnidad}</p>}

      <h2>Recursos reservables</h2>
      {recursos.length === 0 ? (
        <p>Todavía no hay recursos.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Nombre</th><th>Unidades</th><th>Grilla</th><th>Duración</th><th>Aprobación</th><th>Cancelar hasta</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {recursos.map((r) => (
              <tr key={r.id}>
                <td>{r.nombre}</td>
                <td>{r.unidadIds.map(nombreDe).join(', ')}</td>
                <td>{r.duracionBaseMin} min</td>
                <td>{r.duracionMinMin === r.duracionMaxMin ? duracionTexto(r.duracionMinMin) : `${duracionTexto(r.duracionMinMin)} a ${duracionTexto(r.duracionMaxMin)}`}</td>
                <td>{r.requiereAprobacion ? 'Sí' : 'No'}</td>
                <td>{r.anticipacionMinCancelacionHoras} h antes</td>
                <td>{r.estado}</td>
                <td><button onClick={() => cambiarEstado(r)}>{r.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Nuevo recurso</h3>
      {unidades.length === 0 ? (
        <p>Creá al menos una unidad para poder armar un recurso.</p>
      ) : (
        <form onSubmit={crearRecurso}>
          <label>Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required maxLength={100} /></label>
          <fieldset>
            <legend>Unidades que ocupa</legend>
            {unidades.map((u) => (
              <label key={u.id} className="check">
                <input
                  type="checkbox"
                  checked={elegidas.includes(u.id)}
                  onChange={(e) => setElegidas(e.target.checked ? [...elegidas, u.id] : elegidas.filter((x) => x !== u.id))}
                />
                {u.nombre}
              </label>
            ))}
          </fieldset>
          <label>Bloque base (min) — la grilla de horarios<input {...num('duracionBaseMin')} min={5} required /></label>
          <label>Duración mínima (min)<input {...num('duracionMinMin')} min={5} required /></label>
          <label>Duración máxima (min) — igual a la mínima si no varía<input {...num('duracionMaxMin')} min={5} required /></label>
          <label className="check">
            <input type="checkbox" checked={form.requiereAprobacion} onChange={(e) => setForm({ ...form, requiereAprobacion: e.target.checked })} />
            Requiere aprobación (las reservas nacen pendientes)
          </label>
          <label>Cancelación sin cargo hasta (horas antes del inicio)<input {...num('anticipacionMinCancelacionHoras')} min={0} required /></label>
          {errorRecurso && <p className="error">{errorRecurso}</p>}
          <button disabled={elegidas.length === 0}>Crear recurso</button>
        </form>
      )}
    </>
  );
}
