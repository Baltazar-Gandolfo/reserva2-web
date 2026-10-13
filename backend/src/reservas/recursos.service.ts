import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { EstadoComercio, EstadoRecurso, EstadoReserva, EstadoSucursal } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SucursalesService } from '../sucursales/sucursales.service.js';
import { CreateRecursoDto, UpdateRecursoDto } from './dto/recurso.dto.js';

const recursoSelect = {
  id: true,
  sucursalId: true,
  nombre: true,
  estado: true,
  duracionBaseMin: true,
  duracionMinMin: true,
  duracionMaxMin: true,
  requiereAprobacion: true,
  anticipacionMinCancelacionHoras: true,
  createdAt: true,
  updatedAt: true,
  unidades: { select: { unidadId: true }, orderBy: { unidadId: 'asc' } },
} as const;

// Aplana la tabla puente: [{unidadId: 1}, {unidadId: 2}] -> unidadIds: [1, 2]
function aRespuesta<T extends { unidades: { unidadId: number }[] }>({ unidades, ...resto }: T) {
  return { ...resto, unidadIds: unidades.map((u) => u.unidadId) };
}

// Reglas de duración del recurso (el CHECK de la base las repite como última defensa).
function validarDuraciones(base: number, min: number, max: number) {
  if (min > max) throw new BadRequestException('duracionMinMin no puede ser mayor que duracionMaxMin');
  if (min % base !== 0 || max % base !== 0) {
    throw new BadRequestException('duracionMinMin y duracionMaxMin deben ser múltiplos de duracionBaseMin');
  }
}

@Injectable()
export class RecursosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sucursales: SucursalesService,
  ) {}

  async crear(sucursalId: number, user: JwtPayload, dto: CreateRecursoDto) {
    await this.sucursales.verificarAcceso(sucursalId, user);
    validarDuraciones(dto.duracionBaseMin, dto.duracionMinMin, dto.duracionMaxMin);
    await this.validarUnidades(sucursalId, dto.unidadIds);

    const { unidadIds, ...datos } = dto;
    const creado = await this.prisma.recursoReservable.create({
      data: { ...datos, sucursalId, unidades: { create: unidadIds.map((unidadId) => ({ unidadId })) } },
      select: recursoSelect,
    });
    return aRespuesta(creado);
  }

  async listar(sucursalId: number, user: JwtPayload) {
    await this.sucursales.verificarAcceso(sucursalId, user);
    const recursos = await this.prisma.recursoReservable.findMany({
      where: { sucursalId },
      select: recursoSelect,
      orderBy: { id: 'asc' },
    });
    return recursos.map(aRespuesta);
  }

  async obtener(id: number, user: JwtPayload) {
    const recurso = await this.prisma.recursoReservable.findUnique({ where: { id }, select: recursoSelect });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    await this.sucursales.verificarAcceso(recurso.sucursalId, user);
    return aRespuesta(recurso);
  }

  async actualizar(id: number, user: JwtPayload, dto: UpdateRecursoDto) {
    const actual = await this.prisma.recursoReservable.findUnique({ where: { id }, select: recursoSelect });
    if (!actual) throw new NotFoundException('Recurso no encontrado');
    await this.sucursales.verificarAcceso(actual.sucursalId, user);

    // Se valida la configuración RESULTANTE (lo que ya había + lo que cambia), no solo lo recibido.
    validarDuraciones(
      dto.duracionBaseMin ?? actual.duracionBaseMin,
      dto.duracionMinMin ?? actual.duracionMinMin,
      dto.duracionMaxMin ?? actual.duracionMaxMin,
    );

    const { unidadIds, ...datos } = dto;
    if (unidadIds) {
      await this.validarUnidades(actual.sucursalId, unidadIds);
      const cambia =
        unidadIds.length !== actual.unidades.length ||
        unidadIds.some((u) => !actual.unidades.some((a) => a.unidadId === u));
      if (cambia) await this.exigirSinReservasFuturas(id);
    }

    const actualizado = await this.prisma.recursoReservable.update({
      where: { id },
      data: {
        ...datos,
        // deleteMany + create dentro del mismo update = se reemplaza el conjunto de unidades de forma atómica.
        ...(unidadIds && { unidades: { deleteMany: {}, create: unidadIds.map((unidadId) => ({ unidadId })) } }),
      },
      select: recursoSelect,
    });
    return aRespuesta(actualizado);
  }

  // Para reservar / consultar disponibilidad: el recurso, su sucursal y su comercio deben estar activos.
  // Devuelve lo necesario para validar la reserva (incluidas las unidades que ocupa).
  async obtenerReservable(id: number) {
    const recurso = await this.prisma.recursoReservable.findUnique({
      where: { id },
      select: {
        id: true,
        sucursalId: true,
        nombre: true,
        estado: true,
        duracionBaseMin: true,
        duracionMinMin: true,
        duracionMaxMin: true,
        requiereAprobacion: true,
        anticipacionMinCancelacionHoras: true,
        unidades: { select: { unidadId: true } },
        sucursal: { select: { estado: true, comercio: { select: { comercianteId: true, estado: true } } } },
      },
    });
    const disponible =
      recurso &&
      recurso.estado === EstadoRecurso.ACTIVO &&
      recurso.sucursal.estado === EstadoSucursal.ACTIVA &&
      recurso.sucursal.comercio.estado === EstadoComercio.ACTIVO;
    // Mismo 404 si no existe o está inactivo: no se filtra información.
    if (!disponible) throw new NotFoundException('Recurso no disponible');
    return {
      ...recurso,
      unidadIds: recurso.unidades.map((u) => u.unidadId),
      comercianteId: recurso.sucursal.comercio.comercianteId,
    };
  }

  // Todas las unidades indicadas deben existir Y ser de esa sucursal (si no, 400).
  private async validarUnidades(sucursalId: number, unidadIds: number[]) {
    const validas = await this.prisma.unidadBase.count({ where: { id: { in: unidadIds }, sucursalId } });
    if (validas !== new Set(unidadIds).size) {
      throw new BadRequestException('Alguna unidad no existe o no pertenece a esta sucursal');
    }
  }

  // Cambiar de qué unidades se compone un recurso con reservas vigentes podría dejar dos reservas
  // superpuestas sin que nadie se entere: se prohíbe hasta que esas reservas se cancelen o terminen.
  private async exigirSinReservasFuturas(recursoId: number) {
    const vigentes = await this.prisma.reserva.count({
      where: {
        recursoId,
        estado: { in: [EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA] },
        horaFin: { gt: new Date() },
      },
    });
    if (vigentes > 0) {
      throw new ConflictException(
        'No se pueden cambiar las unidades: el recurso tiene reservas vigentes. Cancelalas primero.',
      );
    }
  }
}
