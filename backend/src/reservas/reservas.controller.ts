import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Rol } from '../generated/prisma/client.js';
import { CreateReservaDto, ListarReservasQuery, ReservaResponse } from './dto/reserva.dto.js';
import { ReservasService } from './reservas.service.js';

@ApiTags('reservas')
@ApiBearerAuth()
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  @Post()
  @Roles(Rol.CLIENTE, Rol.COMERCIANTE)
  @ApiOperation({
    summary: 'Crear una reserva (CLIENTE para sí mismo, o COMERCIANTE dueño del recurso)',
    description:
      'Nace CONFIRMADA, o PENDIENTE si el recurso requiere aprobación. El COMERCIANTE debe indicar exactamente una opción: ' +
      'clienteId, o nombreContacto + telefonoContacto.',
  })
  @ApiCreatedResponse({ type: ReservaResponse })
  @ApiConflictResponse({ description: 'El horario ya está ocupado' })
  @ApiForbiddenResponse({ description: 'El recurso es de otro comerciante' })
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CreateReservaDto) {
    return this.reservas.crear(user, dto);
  }

  // OJO con el orden: 'mias' se declara antes que cualquier ruta con ':id' para que no se interprete como un id.
  @Get('mias')
  @Roles(Rol.CLIENTE)
  @ApiOperation({ summary: 'Mis reservas (CLIENTE)' })
  @ApiOkResponse({ type: [ReservaResponse] })
  mias(@CurrentUser() user: JwtPayload) {
    return this.reservas.listarMias(user);
  }

  @Get()
  @Roles(Rol.COMERCIANTE, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Reservas de mis recursos, con filtros opcionales (el ADMINISTRADOR ve todas)' })
  @ApiOkResponse({ type: [ReservaResponse] })
  listar(@CurrentUser() user: JwtPayload, @Query() filtros: ListarReservasQuery) {
    return this.reservas.listar(user, filtros);
  }

  @Patch(':id/aprobar')
  @Roles(Rol.COMERCIANTE, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Aprobar una reserva PENDIENTE (dueño del recurso o ADMINISTRADOR)' })
  @ApiOkResponse({ type: ReservaResponse })
  @ApiConflictResponse({ description: 'La reserva no está PENDIENTE' })
  aprobar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.reservas.aprobar(id, user);
  }

  @Patch(':id/rechazar')
  @Roles(Rol.COMERCIANTE, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Rechazar una reserva PENDIENTE (dueño del recurso o ADMINISTRADOR). Libera el horario' })
  @ApiOkResponse({ type: ReservaResponse })
  @ApiConflictResponse({ description: 'La reserva no está PENDIENTE' })
  rechazar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.reservas.rechazar(id, user);
  }

  @Patch(':id/cancelar')
  @Roles(Rol.CLIENTE, Rol.COMERCIANTE, Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Cancelar una reserva PENDIENTE o CONFIRMADA (el cliente dueño, o el dueño del recurso)',
    description: 'El horario queda libre al instante. Se registra canceladaDentroDePlazo según la anticipación mínima del recurso.',
  })
  @ApiOkResponse({ type: ReservaResponse })
  @ApiConflictResponse({ description: 'La reserva ya estaba cancelada o rechazada' })
  cancelar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.reservas.cancelar(id, user);
  }
}
