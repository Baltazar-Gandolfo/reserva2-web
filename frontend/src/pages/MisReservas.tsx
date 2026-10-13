import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Reserva } from '../api';
import { useAuth } from '../auth/AuthContext';
import { fechaHora } from '../format';

// ¿Cancelar ahora sería "dentro de plazo"? Misma regla que el backend: ahora <= inicio - anticipación.
// Es solo una ayuda visual: el backend es quien decide y guarda el valor real.
const dentroDePlazo = (r: Reserva) =>
  Date.now() <= new Date(r.horaInicio).getTime() - r.recurso.anticipacionMinCancelacionHoras * 3600000;

export function MisReservas() {
  const { authRequest } = useAuth();
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Reserva | null>(null); // la última reserva cancelada, para mostrar el aviso

  const cargar = useCallback(async () => {
    try {
      setReservas(await authRequest<Reserva[]>('/reservas/mias'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [authRequest]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function cancelar(r: Reserva) {
    const tel = r.recurso.sucursal.telefono;
    const aviso = dentroDePlazo(r)
      ? `Estás cancelando DENTRO del plazo (hasta ${r.recurso.anticipacionMinCancelacionHoras} h antes). ` +
        `Si habías pagado una seña, reclamá la devolución a la sucursal${tel ? ` (tel. ${tel})` : ''}.`
      : `Estás cancelando FUERA del plazo (se pedía ${r.recurso.anticipacionMinCancelacionHoras} h de anticipación): no corresponde devolución.`;
    if (!window.confirm(`${aviso}\n\n¿Cancelar la reserva?`)) return;
    setError(null);
    try {
      setResultado(await authRequest<Reserva>(`/reservas/${r.id}/cancelar`, { method: 'PATCH' }));
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <h1>Mis reservas</h1>
      <p><Link to="/panel">← Panel</Link></p>
      {error && <p className="error">{error}</p>}

      {resultado && (
        <div className="aviso">
          <strong>Reserva cancelada.</strong> El horario ya quedó libre.
          <br />
          {resultado.canceladaDentroDePlazo ? (
            <>
              Cancelaste dentro del plazo: si corresponde una devolución, reclamala a{' '}
              <strong>{resultado.recurso.sucursal.nombre}</strong>
              {resultado.recurso.sucursal.telefono ? <> al <strong>{resultado.recurso.sucursal.telefono}</strong>.</> : ' (la sucursal no cargó un teléfono).'}
            </>
          ) : (
            'Cancelaste fuera del plazo: no corresponde devolución.'
          )}
        </div>
      )}

      {!reservas && !error && <p>Cargando…</p>}
      {reservas && reservas.length === 0 && <p>Todavía no tenés reservas.</p>}
      {reservas && reservas.length > 0 && (
        <table>
          <thead>
            <tr><th>Cuándo</th><th>Dónde</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r.id}>
                <td>{fechaHora(r.horaInicio)} → {fechaHora(r.horaFin).split(', ')[1]}</td>
                <td>
                  <Link to={`/c/${r.recurso.sucursal.comercio.slug}`}>{r.recurso.sucursal.comercio.nombre}</Link>
                  <br /><small>{r.recurso.nombre} · {r.recurso.sucursal.nombre}</small>
                </td>
                <td>{r.estado}</td>
                <td>
                  {(r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && (
                    <button onClick={() => cancelar(r)}>Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
