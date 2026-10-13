import { useEffect, useState } from 'react';
import type { Disponibilidad } from '../api';
import { useAuth } from '../auth/AuthContext';
import { duracionTexto, hoy } from '../format';

export type Seleccion = { horaInicio: string; horaFin: string } | null;

// Elige fecha → horario libre → duración, usando GET /recursos/:id/disponibilidad.
// Es un "componente controlado hacia arriba": avisa la selección con onChange y el padre decide qué hacer (reservar).
export function SelectorHorario({ recursoId, onChange }: { recursoId: number; onChange: (s: Seleccion) => void }) {
  const { authRequest } = useAuth();
  const [fecha, setFecha] = useState(hoy());
  const [disp, setDisp] = useState<Disponibilidad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inicio, setInicio] = useState<string | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);

  useEffect(() => {
    let vigente = true; // evita que una respuesta vieja pise a una más nueva si cambian recurso/fecha rápido
    setDisp(null);
    setError(null);
    setInicio(null);
    setDuracion(null);
    onChange(null);
    authRequest<Disponibilidad>(`/recursos/${recursoId}/disponibilidad?fecha=${fecha}`)
      .then((d) => vigente && setDisp(d))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
    // onChange no entra en las dependencias a propósito: es una función nueva en cada render del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recursoId, fecha, authRequest]);

  const horario = disp?.horarios.find((h) => h.inicio === inicio);

  function elegirInicio(h: Disponibilidad['horarios'][number]) {
    setInicio(h.inicio);
    const d = h.duracionesDisponiblesMin[0]; // por defecto, la duración más corta
    setDuracion(d);
    emitir(h.inicio, d);
  }

  function elegirDuracion(d: number) {
    setDuracion(d);
    if (inicio) emitir(inicio, d);
  }

  function emitir(ini: string, d: number) {
    onChange({ horaInicio: ini, horaFin: new Date(new Date(ini).getTime() + d * 60000).toISOString() });
  }

  const futuros = disp?.horarios.filter((h) => h.motivo !== 'PASADO') ?? [];

  return (
    <div>
      <label>
        Fecha
        <input type="date" value={fecha} min={hoy()} onChange={(e) => e.target.value && setFecha(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      {!disp && !error && <p>Cargando horarios…</p>}
      {disp && futuros.length === 0 && <p>No quedan horarios para este día.</p>}
      <div className="horarios">
        {futuros.map((h) => (
          <button
            type="button"
            key={h.inicio}
            disabled={!h.libre}
            className={h.inicio === inicio ? 'sel' : ''}
            onClick={() => elegirInicio(h)}
            title={h.libre ? 'Libre' : 'Ocupado'}
          >
            {h.hora}
          </button>
        ))}
      </div>
      {horario && horario.duracionesDisponiblesMin.length > 1 && (
        <label>
          Duración
          <select value={duracion ?? ''} onChange={(e) => elegirDuracion(Number(e.target.value))}>
            {horario.duracionesDisponiblesMin.map((d) => (
              <option key={d} value={d}>{duracionTexto(d)}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
