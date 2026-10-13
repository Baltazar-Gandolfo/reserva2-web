import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadoReserva } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecursosService } from './recursos.service.js';
import {
  APP_TIMEZONE,
  fechaValida,
  formatoHora,
  inicioDelDia,
  parseHoraMinutos,
  sumarMinutos,
} from './tiempo.util.js';

// Solo estas reservas "ocupan" lugar. Una CANCELADA o RECHAZADA no bloquea nada: el horario queda libre al instante.
export const ESTADOS_QUE_BLOQUEAN: EstadoReserva[] = [EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA];

// Lo único que necesita la consulta de choques: sirve tanto con `prisma` como con el `tx` de una transacción.
type ConReservas = Pick<PrismaService, 'reserva'>;

export interface Rango {
  horaInicio: Date;
  horaFin: Date;
}

// Dos rangos semiabiertos [inicio, fin) se superponen si cada uno empieza ANTES de que termine el otro.
// Semiabierto = el fin NO cuenta: una reserva 18:00-19:00 y otra 19:00-20:00 NO chocan (son contiguas).
export const seSuperponen = (a: Rango, b: Rango) => a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;

/**
 * LA consulta de disponibilidad. Devuelve las reservas que bloquean un rango para un conjunto de unidades.
 *
 *   "una reserva choca si comparte AL MENOS UNA unidad  Y  sus rangos se superponen  Y  está PENDIENTE/CONFIRMADA"
 *
 * Cómo se lee la consulta (en SQL sería un EXISTS sobre la tabla puente):
 *   reserva  →  su recurso  →  las unidades de ese recurso (RecursoUnidad)  →  alguna está en `unidadIds`
 *
 * Ejemplo: "Cancha 11" = unidades {A, B, C}; "Cancha 5 - A" = {A}.
 *   Reservar "Cancha 5 - A" a las 18:00 ocupa la unidad A, así que consultar "Cancha 11" (A, B, C) la
 *   encuentra por la unidad A y la cancha completa aparece ocupada. Y al revés. Es la MISMA consulta para
 *   todos los recursos: no hay ningún caso especial para "recurso de una sola unidad".
 *
 * Es el equivalente a un LINQ: db.Reservas.Where(r => estados.Contains(r.Estado)
 *   && r.HoraInicio < hasta && r.HoraFin > desde
 *   && r.Recurso.Unidades.Any(u => unidadIds.Contains(u.UnidadId)))
 */
export function buscarReservasQueBloquean(db: ConReservas, unidadIds: number[], desde: Date, hasta: Date) {
  return db.reserva.findMany({
    where: {
      estado: { in: ESTADOS_QUE_BLOQUEAN },
      horaInicio: { lt: hasta }, // empieza antes de que termine el rango pedido...
      horaFin: { gt: desde }, //    ...y termina después de que empiece
      recurso: { unidades: { some: { unidadId: { in: unidadIds } } } },
    },
    select: { id: true, horaInicio: true, horaFin: true },
  });
}

export type MotivoNoDisponible = 'OCUPADO' | 'PASADO';

export interface HorarioDisponible {
  inicio: string; // ISO UTC, es lo que se manda de vuelta al reservar
  hora: string; // "18:30" en la zona del negocio, para mostrar
  libre: boolean;
  motivo?: MotivoNoDisponible;
  duracionesDisponiblesMin: number[]; // duraciones (min) que entran sin chocar desde ese inicio
}

@Injectable()
export class DisponibilidadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recursos: RecursosService,
  ) {}

  /**
   * Horarios de inicio posibles de un día para un recurso, con su estado libre/ocupado.
   * `desde`/`hasta` ("HH:mm") acotan la franja; si no vienen, se usa el día completo (todavía no hay
   * horarios de atención estructurados: cuando existan, este es el lugar donde se aplican).
   */
  async consultar(recursoId: number, fecha: string, desde?: string, hasta?: string) {
    if (!fechaValida(fecha)) throw new BadRequestException('fecha debe tener formato YYYY-MM-DD');
    const desdeMin = desde === undefined ? 0 : parseHoraMinutos(desde);
    const hastaMin = hasta === undefined ? 1440 : parseHoraMinutos(hasta);
    if (desdeMin === null || hastaMin === null) throw new BadRequestException('desde/hasta deben tener formato HH:mm');
    if (desdeMin >= hastaMin) throw new BadRequestException('desde debe ser anterior a hasta');

    const recurso = await this.recursos.obtenerReservable(recursoId);
    const { duracionBaseMin: base, duracionMinMin: min, duracionMaxMin: max } = recurso;

    const inicioDia = inicioDelDia(fecha);
    const ventanaDesde = sumarMinutos(inicioDia, desdeMin);
    const ventanaHasta = sumarMinutos(inicioDia, hastaMin);

    // UNA sola consulta para toda la franja; después cada horario se evalúa en memoria con la misma regla (seSuperponen).
    const bloqueantes = await buscarReservasQueBloquean(
      this.prisma,
      recurso.unidadIds,
      ventanaDesde,
      sumarMinutos(ventanaHasta, max),
    );

    const ahora = new Date();
    const horarios: HorarioDisponible[] = [];
    // Grilla: múltiplos de la duración base contados desde las 00:00 locales.
    for (let m = Math.ceil(desdeMin / base) * base; m + min <= hastaMin; m += base) {
      const inicio = sumarMinutos(inicioDia, m);

      // Duraciones que entran: se prueba min, min+base, ... hasta max y se corta en la primera que choca
      // (si 90 min choca, 120 también: cada duración contiene a la anterior).
      const duraciones: number[] = [];
      if (inicio >= ahora) {
        for (let d = min; d <= max; d += base) {
          const candidato: Rango = { horaInicio: inicio, horaFin: sumarMinutos(inicio, d) };
          if (bloqueantes.some((r) => seSuperponen(candidato, r))) break;
          duraciones.push(d);
        }
      }

      const libre = duraciones.length > 0;
      horarios.push({
        inicio: inicio.toISOString(),
        hora: formatoHora(m),
        libre,
        ...(!libre && { motivo: (inicio < ahora ? 'PASADO' : 'OCUPADO') as MotivoNoDisponible }),
        duracionesDisponiblesMin: duraciones,
      });
    }

    return {
      recursoId,
      fecha,
      zonaHoraria: APP_TIMEZONE,
      duracionBaseMin: base,
      duracionMinMin: min,
      duracionMaxMin: max,
      horarios,
    };
  }
}
