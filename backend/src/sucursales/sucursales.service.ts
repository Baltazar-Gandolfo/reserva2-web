import { Injectable, NotFoundException } from '@nestjs/common';
import { type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { ComerciosService } from '../comercios/comercios.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSucursalDto } from './dto/create-sucursal.dto.js';
import { UpdateSucursalDto } from './dto/update-sucursal.dto.js';
import { sucursalSelect } from './sucursal.response.js';

@Injectable()
export class SucursalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comercios: ComerciosService, // inyectado desde otro módulo (gracias al export)
  ) {}

  async crear(comercioId: number, user: JwtPayload, dto: CreateSucursalDto) {
    await this.comercios.verificarAcceso(comercioId, user); // misma regla de pertenencia que el comercio padre
    return this.prisma.sucursal.create({ data: { ...dto, comercioId }, select: sucursalSelect });
  }

  async listar(comercioId: number, user: JwtPayload) {
    await this.comercios.verificarAcceso(comercioId, user);
    return this.prisma.sucursal.findMany({ where: { comercioId }, select: sucursalSelect, orderBy: { id: 'asc' } });
  }

  async actualizar(id: number, user: JwtPayload, dto: UpdateSucursalDto) {
    const sucursal = await this.prisma.sucursal.findUnique({ where: { id }, select: { comercioId: true } });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    // El permiso se decide por el dueño del comercio padre.
    await this.comercios.verificarAcceso(sucursal.comercioId, user);
    return this.prisma.sucursal.update({ where: { id }, data: dto, select: sucursalSelect });
  }
}
