// Zona horaria del negocio (la misma que APP_TIMEZONE del backend). Las horas se muestran siempre en esta zona.
export const ZONA = 'America/Argentina/Buenos_Aires';

const fmt = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short', timeZone: ZONA });

export const fechaHora = (iso: string) => fmt.format(new Date(iso));

// Fecha de hoy como "YYYY-MM-DD" en la zona del negocio ("sv-SE" formatea justo así).
export const hoy = () => new Date().toLocaleDateString('sv-SE', { timeZone: ZONA });

export const duracionTexto = (min: number) =>
  min % 60 === 0 ? `${min / 60} h` : min > 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
