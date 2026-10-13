import { Injectable, NotFoundException } from '@nestjs/common';
import { type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SucursalesService } from '../sucursales/sucursales.service.js';
import { CreateUnidadDto, UpdateUnidadDto } from './dto/unidad.dto.js';

const unidadSelect = { id: true, sucursalId: true, nombre: true, createdAt: true, updatedAt: true } as const;

@Injectable()
export class UnidadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sucursales: SucursalesService,
  ) {}

  async crear(sucursalId: number, user: JwtPayload, dto: CreateUnidadDto) {
    await this.sucursales.verificarAcceso(sucursalId, user);
    return this.prisma.unidadBase.create({ data: { sucursalId, nombre: dto.nombre }, select: unidadSelect });
  }

  async listar(sucursalId: number, user: JwtPayload) {
    await this.sucursales.verificarAcceso(sucursalId, user);
    return this.prisma.unidadBase.findMany({ where: { sucursalId }, select: unidadSelect, orderBy: { id: 'asc' } });
  }

  async actualizar(id: number, user: JwtPayload, dto: UpdateUnidadDto) {
    const unidad = await this.prisma.unidadBase.findUnique({ where: { id }, select: { sucursalId: true } });
    if (!unidad) throw new NotFoundException('Unidad no encontrada');
    await this.sucursales.verificarAcceso(unidad.sucursalId, user);
    return this.prisma.unidadBase.update({ where: { id }, data: { nombre: dto.nombre }, select: unidadSelect });
  }
}
