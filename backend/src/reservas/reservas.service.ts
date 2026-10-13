import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { EstadoReserva, Rol } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ComerciosService } from '../comercios/comercios.service.js';
import { buscarReservasQueBloquean, ESTADOS_QUE_BLOQUEAN } from './disponibilidad.service.js';
import { CreateReservaDto, ListarReservasQuery } from './dto/reserva.dto.js';
import { RecursosService } from './recursos.service.js';
import { diferenciaMinutos, minutosDelDiaLocal, sumarMinutos } from './tiempo.util.js';

// Todo lo que el frontend necesita para mostrar una reserva: recurso, sucursal (con su teléfono) y cliente.
const reservaSelect = {
  id: true,
  recursoId: true,
  horaInicio: true,
  horaFin: true,
  estado: true,
  clienteId: true,
  nombreContacto: true,
  telefonoContacto: true,
  canceladaDentroDePlazo: true,
  createdAt: true,
  updatedAt: true,
  recurso: {
    select: {
      id: true,
      nombre: true,
      anticipacionMinCancelacionHoras: true,
      sucursal: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
          telefono: true,
          comercio: { select: { id: true, nombre: true, slug: true } },
        },
      },
    },
  },
  cliente: { select: { id: true, nombre: true, apellido: true, email: true, telefono: true } },
} as const;

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recursos: RecursosService,
    private readonly comercios: ComerciosService,
  ) {}

  // ───────────────────────────── Crear ─────────────────────────────

  async crear(user: JwtPayload, dto: CreateReservaDto) {
    const recurso = await this.recursos.obtenerReservable(dto.recursoId);

    // 1) ¿Para quién es la reserva?
    const destinatario = await this.resolverDestinatario(user, dto, recurso.comercianteId);

    // 2) ¿El horario pedido es válido para este recurso? (grilla y duración)
    const inicio = new Date(dto.horaInicio);
    const fin = new Date(dto.horaFin);
    const duracion = diferenciaMinutos(fin, inicio);
    if (!(duracion > 0)) throw new BadRequestException('horaFin debe ser posterior a horaInicio');
    if (inicio < new Date()) throw new BadRequestException('No se puede reservar en el pasado');

    const { minutos, exacto } = minutosDelDiaLocal(inicio);
    if (!exacto || minutos % recurso.duracionBaseMin !== 0) {
      throw new BadRequestException(`horaInicio debe caer en la grilla de ${recurso.duracionBaseMin} minutos`);
    }
    if (duracion % recurso.duracionBaseMin !== 0) {
      throw new BadRequestException(`La duración debe ser múltiplo de ${recurso.duracionBaseMin} minutos`);
    }
    if (duracion < recurso.duracionMinMin || duracion > recurso.duracionMaxMin) {
      throw new BadRequestException(
        `La duración debe estar entre ${recurso.duracionMinMin} y ${recurso.duracionMaxMin} minutos`,
      );
    }
    // (El horario de atención de la sucursal es texto libre por ahora: no se valida contra él.)

    // 3) Chequeo de disponibilidad + alta, de forma ATÓMICA.
    //
    // El problema: "revisar si está libre" y "guardar" son dos pasos. Si dos personas reservan el mismo
    // horario en el mismo instante, ambas pueden pasar la revisión antes de que cualquiera guarde, y quedaría
    // una doble reserva. La solución: una transacción que primero toma un candado (advisory lock) por
    // sucursal. Las unidades pertenecen a una sola sucursal, así que los conflictos solo pueden darse dentro
    // de ella. La segunda transacción espera en el candado hasta que la primera termine, y entonces su
    // revisión ya ve la reserva recién creada. (En .NET sería un lock/SemaphoreSlim, pero entre procesos y
    // a nivel base de datos, por eso funciona aunque haya varias instancias del servidor.)
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${recurso.sucursalId}::bigint)`;

      const choques = await buscarReservasQueBloquean(tx, recurso.unidadIds, inicio, fin);
      if (choques.length > 0) throw new ConflictException('El horario ya no está disponible');

      return tx.reserva.create({
        data: {
          recursoId: recurso.id,
          horaInicio: inicio,
          horaFin: fin,
          // requiereAprobacion=true -> espera la decisión del dueño; false -> confirmada directo.
          estado: recurso.requiereAprobacion ? EstadoReserva.PENDIENTE : EstadoReserva.CONFIRMADA,
          ...destinatario,
        },
        select: reservaSelect,
      });
    });
  }

  // Devuelve los campos de cliente/contacto que corresponde guardar según quién reserva.
  private async resolverDestinatario(user: JwtPayload, dto: CreateReservaDto, comercianteDuenoId: number) {
    const tieneCliente = dto.clienteId !== undefined;
    const tieneContacto = dto.nombreContacto !== undefined || dto.telefonoContacto !== undefined;

    if (user.rol === Rol.CLIENTE) {
      // El cliente reserva para sí mismo: su id sale del token y no puede indicar a nadie más.
      if (tieneCliente || tieneContacto) {
        throw new BadRequestException('Un cliente reserva siempre para sí mismo: no envíes clienteId ni datos de contacto');
      }
      return { clienteId: user.sub, nombreContacto: null, telefonoContacto: null };
    }

    // COMERCIANTE (el guard de roles ya descartó a cualquier otro): debe ser el dueño del recurso.
    if (comercianteDuenoId !== user.sub) throw new ForbiddenException('Este recurso no te pertenece');
    if (tieneCliente === tieneContacto) {
      throw new BadRequestException('Indicá exactamente una opción: clienteId, o nombreContacto + telefonoContacto');
    }
    if (tieneCliente) {
      const cliente = await this.prisma.usuario.findUnique({ where: { id: dto.clienteId }, select: { rol: true } });
      if (!cliente || cliente.rol !== Rol.CLIENTE) throw new BadRequestException('clienteId no corresponde a un cliente');
      return { clienteId: dto.clienteId!, nombreContacto: null, telefonoContacto: null };
    }
    if (!dto.nombreContacto || !dto.telefonoContacto) {
      throw new BadRequestException('nombreContacto y telefonoContacto son obligatorios juntos');
    }
    return { clienteId: null, nombreContacto: dto.nombreContacto, telefonoContacto: dto.telefonoContacto };
  }

  // ───────────────────── Aprobar / Rechazar / Cancelar ─────────────────────

  aprobar(id: number, user: JwtPayload) {
    return this.resolverPendiente(id, user, EstadoReserva.CONFIRMADA, 'aprobar');
  }

  rechazar(id: number, user: JwtPayload) {
    return this.resolverPendiente(id, user, EstadoReserva.RECHAZADA, 'rechazar');
  }

  private async resolverPendiente(id: number, user: JwtPayload, nuevoEstado: EstadoReserva, verbo: string) {
    const reserva = await this.cargar(id);
    this.exigirDuenoOAdmin(reserva.recurso.sucursal.comercio.comercianteId, user);

    // updateMany con el estado en el WHERE = "cambiá el estado SOLO SI sigue PENDIENTE": si otra persona la
    // resolvió un instante antes, no se pisa su decisión (count = 0 -> 409).
    const { count } = await this.prisma.reserva.updateMany({
      where: { id, estado: EstadoReserva.PENDIENTE },
      data: { estado: nuevoEstado },
    });
    if (count === 0) throw new ConflictException(`Solo se puede ${verbo} una reserva PENDIENTE`);
    return this.obtenerPorId(id);
  }

  async cancelar(id: number, user: JwtPayload) {
    const reserva = await this.cargar(id);

    if (user.rol === Rol.CLIENTE) {
      // Un cliente solo cancela las suyas (las cargadas "sin cuenta" tienen clienteId null y no matchean).
      if (reserva.clienteId !== user.sub) throw new ForbiddenException('Esta reserva no es tuya');
    } else {
      this.exigirDuenoOAdmin(reserva.recurso.sucursal.comercio.comercianteId, user);
    }

    // ¿Se cancela "a tiempo"? Límite = inicio - anticipación del recurso. En el límite exacto todavía vale.
    const limite = sumarMinutos(reserva.horaInicio, -reserva.recurso.anticipacionMinCancelacionHoras * 60);
    const dentroDePlazo = new Date() <= limite;

    // Pasar a CANCELADA libera el horario al instante: buscarReservasQueBloquean ignora ese estado.
    // Se cancela solo si sigue PENDIENTE/CONFIRMADA (si ya estaba cancelada o rechazada, 409).
    const { count } = await this.prisma.reserva.updateMany({
      where: { id, estado: { in: ESTADOS_QUE_BLOQUEAN } },
      data: { estado: EstadoReserva.CANCELADA, canceladaDentroDePlazo: dentroDePlazo },
    });
    if (count === 0) throw new ConflictException('Solo se puede cancelar una reserva PENDIENTE o CONFIRMADA');
    return this.obtenerPorId(id);
  }

  // ───────────────────────────── Listados ─────────────────────────────

  listarMias(user: JwtPayload) {
    return this.prisma.reserva.findMany({
      where: { clienteId: user.sub },
      select: reservaSelect,
      orderBy: { horaInicio: 'desc' },
    });
  }

  async listar(user: JwtPayload, filtros: ListarReservasQuery) {
    // Si piden un recurso o comercio concreto, se valida que sea suyo (403) en vez de devolver una lista vacía engañosa.
    if (filtros.comercioId !== undefined) await this.comercios.verificarAcceso(filtros.comercioId, user);
    if (filtros.recursoId !== undefined) {
      const recurso = await this.prisma.recursoReservable.findUnique({
        where: { id: filtros.recursoId },
        select: { sucursal: { select: { comercio: { select: { comercianteId: true } } } } },
      });
      if (!recurso) throw new NotFoundException('Recurso no encontrado');
      this.exigirDuenoOAdmin(recurso.sucursal.comercio.comercianteId, user);
    }

    return this.prisma.reserva.findMany({
      where: {
        ...(filtros.recursoId !== undefined && { recursoId: filtros.recursoId }),
        recurso: {
          sucursal: {
            comercio: {
              ...(filtros.comercioId !== undefined && { id: filtros.comercioId }),
              // El admin ve todo; el comerciante, solo reservas de recursos de sus comercios.
              ...(user.rol !== Rol.ADMINISTRADOR && { comercianteId: user.sub }),
            },
          },
        },
      },
      select: reservaSelect,
      orderBy: { horaInicio: 'desc' },
    });
  }

  // ───────────────────────────── Auxiliares ─────────────────────────────

  private async cargar(id: number) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      select: {
        id: true,
        clienteId: true,
        horaInicio: true,
        recurso: {
          select: {
            anticipacionMinCancelacionHoras: true,
            sucursal: { select: { comercio: { select: { comercianteId: true } } } },
          },
        },
      },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    return reserva;
  }

  private exigirDuenoOAdmin(comercianteId: number, user: JwtPayload) {
    if (user.rol !== Rol.ADMINISTRADOR && comercianteId !== user.sub) {
      throw new ForbiddenException('Esta reserva pertenece a un comercio que no es tuyo');
    }
  }

  private obtenerPorId(id: number) {
    return this.prisma.reserva.findUniqueOrThrow({ where: { id }, select: reservaSelect });
  }
}
