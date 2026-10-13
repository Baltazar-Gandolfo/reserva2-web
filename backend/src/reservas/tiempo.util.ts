// Utilidades de fecha/hora para reservas, sin librerías externas.
//
// Las fechas se guardan en la base como instantes UTC (DateTime = DateTimeOffset en .NET, siempre en UTC).
// Pero "las 18:00" y "el día 2026-10-20" son conceptos LOCALES del negocio, así que hace falta una zona
// horaria de referencia. Se configura con APP_TIMEZONE (por defecto Argentina, UTC-3 sin horario de verano).
export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'America/Argentina/Buenos_Aires';

const MIN_MS = 60_000;
const DIA_MS = 86_400_000;

// Diferencia (en minutos) entre la hora local de la zona y UTC en ese instante. Argentina: -180.
function offsetMinutos(instante: Date, tz = APP_TIMEZONE): number {
  const t = Math.floor(instante.getTime() / 1000) * 1000; // sin milisegundos
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(t));
  const n = (tipo: string) => Number(partes.find((p) => p.type === tipo)!.value);
  // "Reloj de pared" local leído como si fuera UTC; la diferencia contra el instante real es el offset.
  const comoUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  return Math.round((comoUtc - t) / MIN_MS);
}

// ¿Es "YYYY-MM-DD" una fecha real? (rechaza 2026-02-31)
export function fechaValida(fecha: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(Date.UTC(y, mo - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === mo - 1 && f.getUTCDate() === d;
}

// Instante UTC en el que empieza ese día local (00:00 en la zona del negocio).
export function inicioDelDia(fecha: string, tz = APP_TIMEZONE): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  const medianocheComoUtc = Date.UTC(y, m - 1, d);
  // Dos pasadas: la segunda corrige el caso de que el offset cambie entre el cálculo inicial y el real.
  const off1 = offsetMinutos(new Date(medianocheComoUtc), tz);
  const off2 = offsetMinutos(new Date(medianocheComoUtc - off1 * MIN_MS), tz);
  return new Date(medianocheComoUtc - off2 * MIN_MS);
}

// Minutos transcurridos desde las 00:00 locales (0..1439) y si el instante cae justo en un minuto exacto.
export function minutosDelDiaLocal(instante: Date, tz = APP_TIMEZONE): { minutos: number; exacto: boolean } {
  const local = instante.getTime() + offsetMinutos(instante, tz) * MIN_MS;
  const enElDia = ((local % DIA_MS) + DIA_MS) % DIA_MS; // módulo positivo (el % de JS puede dar negativo)
  return { minutos: Math.floor(enElDia / MIN_MS), exacto: enElDia % MIN_MS === 0 };
}

// "HH:mm" -> minutos (acepta "24:00" como fin del día). null si el formato es inválido.
export function parseHoraMinutos(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const total = Number(m[1]) * 60 + Number(m[2]);
  return Number(m[2]) < 60 && total <= 1440 ? total : null;
}

export function formatoHora(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

export const sumarMinutos = (fecha: Date, minutos: number) => new Date(fecha.getTime() + minutos * MIN_MS);
export const diferenciaMinutos = (a: Date, b: Date) => (a.getTime() - b.getTime()) / MIN_MS;
