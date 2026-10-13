import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { request, type ComercioPublico, type Reserva } from '../api';
import { useAuth } from '../auth/AuthContext';
import { SelectorHorario, type Seleccion } from '../components/SelectorHorario';
import { duracionTexto, fechaHora } from '../format';

// Página pública de un comercio (/c/:slug): se puede ver sin login; para reservar hace falta una cuenta de cliente.
export function PublicComercio() {
  const { slug } = useParams();
  const { usuario, authRequest } = useAuth();
  const location = useLocation();
  const [comercio, setComercio] = useState<ComercioPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recursoId, setRecursoId] = useState<number | null>(null);
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const [creada, setCreada] = useState<Reserva | null>(null);

  useEffect(() => {
    request<ComercioPublico>(`/public/comercios/${slug}`).then(setComercio).catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) return <><p><Link to="/">← Inicio</Link></p><p className="error">{error}</p></>;
  if (!comercio) return <p>Cargando…</p>;

  const recursos = comercio.sucursales.flatMap((s) => s.recursos.map((r) => ({ ...r, sucursal: s })));
  const elegido = recursos.find((r) => r.id === recursoId);

  async function reservar(e: FormEvent) {
    e.preventDefault();
    if (!seleccion || !recursoId) return;
    setErrorReserva(null);
    try {
      setCreada(await authRequest<Reserva>('/reservas', { method: 'POST', body: { recursoId, ...seleccion } }));
      setSeleccion(null);
      setRecursoId(null);
    } catch (err) {
      setErrorReserva((err as Error).message);
    }
  }

  return (
    <>
      <p><Link to="/">← Inicio</Link></p>
      <h1>{comercio.nombre}</h1>
      {comercio.descripcion && <p>{comercio.descripcion}</p>}

      {creada && (
        <div className="aviso">
          <strong>{creada.estado === 'PENDIENTE' ? 'Solicitud enviada: queda pendiente de aprobación.' : '¡Reserva confirmada!'}</strong>
          <br />
          {creada.recurso.nombre} — {fechaHora(creada.horaInicio)} a {fechaHora(creada.horaFin).split(', ')[1]}
          <br /><Link to="/reservas/mias">Ver mis reservas</Link>
        </div>
      )}

      {comercio.sucursales.length === 0 && <p>Este comercio todavía no tiene sucursales.</p>}
      {comercio.sucursales.map((s) => (
        <section key={s.id}>
          <h2>{s.nombre}</h2>
          <p>
            {s.direccion}
            {s.telefono && <> · Tel. {s.telefono}</>}
            {s.horarioTexto && <><br />Horario: {s.horarioTexto}</>}
          </p>
          {s.recursos.length === 0 ? (
            <p><small>Sin recursos reservables.</small></p>
          ) : (
            <ul>
              {s.recursos.map((r) => (
                <li key={r.id}>
                  <button className={r.id === recursoId ? 'sel' : ''} onClick={() => { setRecursoId(r.id); setSeleccion(null); setCreada(null); }}>
                    {r.nombre}
                  </button>{' '}
                  <small>
                    {r.duracionMinMin === r.duracionMaxMin ? duracionTexto(r.duracionMinMin) : `${duracionTexto(r.duracionMinMin)} a ${duracionTexto(r.duracionMaxMin)}`}
                    {r.requiereAprobacion && ' · requiere aprobación'}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {elegido && (
        <>
          <h2>Reservar: {elegido.nombre}</h2>
          {!usuario && (
            <p>
              Para ver horarios y reservar, <Link to="/login" state={{ from: location.pathname }}>ingresá</Link> o{' '}
              <Link to="/registro/cliente">creá una cuenta de cliente</Link>.
            </p>
          )}
          {usuario && usuario.rol !== 'CLIENTE' && <p>Ingresaste como {usuario.rol.toLowerCase()}: para reservar usá una cuenta de cliente.</p>}
          {usuario?.rol === 'CLIENTE' && (
            <form onSubmit={reservar}>
              <SelectorHorario key={elegido.id} recursoId={elegido.id} onChange={setSeleccion} />
              {elegido.requiereAprobacion && <small>Este recurso requiere aprobación: tu reserva quedará pendiente.</small>}
              {elegido.anticipacionMinCancelacionHoras > 0 && (
                <small>Podés cancelar sin cargo hasta {elegido.anticipacionMinCancelacionHoras} h antes del inicio.</small>
              )}
              {errorReserva && <p className="error">{errorReserva}</p>}
              <button disabled={!seleccion}>Reservar</button>
            </form>
          )}
        </>
      )}
    </>
  );
}
