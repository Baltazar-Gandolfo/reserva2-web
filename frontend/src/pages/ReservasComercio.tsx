import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Recurso, Reserva, Sucursal } from '../api';
import { useAuth } from '../auth/AuthContext';
import { SelectorHorario, type Seleccion } from '../components/SelectorHorario';
import { fechaHora } from '../format';

// Vista del comerciante: todas las reservas de un comercio + acciones + alta manual.
export function ReservasComercio() {
  const { id } = useParams();
  const { authRequest, usuario } = useAuth();
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState<string | null>(null);

  // formulario manual
  const [recursoId, setRecursoId] = useState('');
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const [modo, setModo] = useState<'sinCuenta' | 'cliente'>('sinCuenta');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const puedeCargar = usuario?.rol === 'COMERCIANTE';

  const cargar = useCallback(async () => {
    try {
      const [rs, sucursales] = await Promise.all([
        authRequest<Reserva[]>(`/reservas?comercioId=${id}${filtro ? `&recursoId=${filtro}` : ''}`),
        authRequest<Sucursal[]>(`/comercios/${id}/sucursales`),
      ]);
      const porSucursal = await Promise.all(sucursales.map((s) => authRequest<Recurso[]>(`/sucursales/${s.id}/recursos`)));
      setReservas(rs);
      setRecursos(porSucursal.flat().filter((r) => r.estado === 'ACTIVO'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [authRequest, id, filtro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function accion(r: Reserva, tipo: 'aprobar' | 'rechazar' | 'cancelar') {
    if (tipo === 'cancelar' && !window.confirm('¿Cancelar esta reserva? El horario queda libre al instante.')) return;
    setError(null);
    try {
      await authRequest(`/reservas/${r.id}/${tipo}`, { method: 'PATCH' });
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function crearManual(e: FormEvent) {
    e.preventDefault();
    if (!seleccion) return;
    setErrorForm(null);
    setOk(null);
    try {
      await authRequest('/reservas', {
        method: 'POST',
        body: {
          recursoId: Number(recursoId),
          ...seleccion,
          ...(modo === 'cliente' ? { clienteId: Number(clienteId) } : { nombreContacto: nombre, telefonoContacto: telefono }),
        },
      });
      setOk('Reserva cargada.');
      setNombre('');
      setTelefono('');
      setClienteId('');
      await cargar();
    } catch (err) {
      setErrorForm((err as Error).message);
    }
  }

  if (!reservas) return error ? <p className="error">{error}</p> : <p>Cargando…</p>;

  return (
    <>
      <h1>Reservas</h1>
      <p><Link to={`/comercios/${id}`}>← Comercio</Link></p>
      {error && <p className="error">{error}</p>}

      <label>
        Filtrar por recurso
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos</option>
          {recursos.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </label>

      {reservas.length === 0 ? (
        <p>No hay reservas.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Cuándo</th><th>Recurso</th><th>Quién</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r.id}>
                <td>{fechaHora(r.horaInicio)} → {fechaHora(r.horaFin).split(', ')[1]}</td>
                <td>{r.recurso.nombre}<br /><small>{r.recurso.sucursal.nombre}</small></td>
                <td>
                  {r.cliente
                    ? <>{r.cliente.nombre} {r.cliente.apellido}<br /><small>{r.cliente.email}</small></>
                    : <>{r.nombreContacto}<br /><small>{r.telefonoContacto} (sin cuenta)</small></>}
                </td>
                <td>
                  {r.estado}
                  {r.estado === 'CANCELADA' && <><br /><small>{r.canceladaDentroDePlazo ? 'dentro de plazo' : 'fuera de plazo'}</small></>}
                </td>
                <td className="acciones">
                  {r.estado === 'PENDIENTE' && (
                    <>
                      <button onClick={() => accion(r, 'aprobar')}>Aprobar</button>
                      <button onClick={() => accion(r, 'rechazar')}>Rechazar</button>
                    </>
                  )}
                  {(r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && (
                    <button onClick={() => accion(r, 'cancelar')}>Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {puedeCargar && (
        <>
          <h2>Cargar una reserva manual</h2>
          {recursos.length === 0 ? (
            <p>Primero creá un recurso en alguna sucursal.</p>
          ) : (
            <form onSubmit={crearManual}>
              <label>
                Recurso
                <select value={recursoId} onChange={(e) => setRecursoId(e.target.value)} required>
                  <option value="">Elegí un recurso…</option>
                  {recursos.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </label>
              {recursoId && <SelectorHorario recursoId={Number(recursoId)} onChange={setSeleccion} />}

              <fieldset>
                <legend>¿Para quién?</legend>
                <label className="check">
                  <input type="radio" checked={modo === 'sinCuenta'} onChange={() => setModo('sinCuenta')} /> Alguien sin cuenta
                </label>
                <label className="check">
                  <input type="radio" checked={modo === 'cliente'} onChange={() => setModo('cliente')} /> Cliente con cuenta (por ID)
                </label>
              </fieldset>
              {modo === 'sinCuenta' ? (
                <>
                  <label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} /></label>
                  <label>Teléfono<input value={telefono} onChange={(e) => setTelefono(e.target.value)} required maxLength={30} /></label>
                </>
              ) : (
                <label>ID del cliente<input type="number" min={1} value={clienteId} onChange={(e) => setClienteId(e.target.value)} required /></label>
              )}
              {errorForm && <p className="error">{errorForm}</p>}
              {ok && <p>{ok}</p>}
              <button disabled={!seleccion}>Cargar reserva</button>
            </form>
          )}
        </>
      )}
    </>
  );
}
