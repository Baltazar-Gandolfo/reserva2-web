import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { DisponibilidadService } from './disponibilidad.service.js';
import { CreateRecursoDto, RecursoResponse, UpdateRecursoDto } from './dto/recurso.dto.js';
import { RecursosService } from './recursos.service.js';

class DisponibilidadQuery {
  @ApiProperty({ example: '2026-10-20', description: 'Día a consultar (YYYY-MM-DD, en la zona horaria del negocio)' })
  @IsString()
  fecha: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Inicio de la franja (HH:mm). Por defecto 00:00' })
  @IsOptional()
  @IsString()
  desde?: string;

  @ApiPropertyOptional({ example: '24:00', description: 'Fin de la franja (HH:mm, admite 24:00). Por defecto 24:00' })
  @IsOptional()
  @IsString()
  hasta?: string;
}

@ApiTags('recursos')
@ApiBearerAuth()
@Controller()
export class RecursosController {
  constructor(
    private readonly recursos: RecursosService,
    private readonly disponibilidad: DisponibilidadService,
  ) {}

  @Post('sucursales/:sucursalId/recursos')
  @ApiOperation({ summary: 'Crear un recurso reservable compuesto por una o más unidades de la sucursal' })
  @ApiCreatedResponse({ type: RecursoResponse })
  @ApiForbiddenResponse({ description: 'La sucursal es de otro comerciante' })
  crear(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRecursoDto,
  ) {
    return this.recursos.crear(sucursalId, user, dto);
  }

  @Get('sucursales/:sucursalId/recursos')
  @ApiOperation({ summary: 'Listar los recursos de una sucursal propia (activos e inactivos)' })
  @ApiOkResponse({ type: [RecursoResponse] })
  listar(@Param('sucursalId', ParseIntPipe) sucursalId: number, @CurrentUser() user: JwtPayload) {
    return this.recursos.listar(sucursalId, user);
  }

  @Get('recursos/:id')
  @ApiOperation({ summary: 'Ver un recurso propio' })
  @ApiOkResponse({ type: RecursoResponse })
  obtener(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.recursos.obtener(id, user);
  }

  // Sin DELETE físico: "eliminar" = estado INACTIVO (las reservas pasadas siguen apuntando al recurso).
  @Patch('recursos/:id')
  @ApiOperation({ summary: 'Editar un recurso o desactivarlo (estado=INACTIVO)' })
  @ApiOkResponse({ type: RecursoResponse })
  actualizar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload, @Body() dto: UpdateRecursoDto) {
    return this.recursos.actualizar(id, user, dto);
  }

  // Cualquier usuario autenticado puede consultar la disponibilidad de un recurso ACTIVO.
  @Get('recursos/:id/disponibilidad')
  @ApiOperation({
    summary: 'Horarios de inicio de un día con su estado libre/ocupado',
    description:
      'Una reserva ocupa un horario si comparte al menos una unidad base con el recurso consultado y se superpone en el tiempo. ' +
      'Cada horario incluye las duraciones (en minutos) que entran sin chocar.',
  })
  @ApiOkResponse({ description: '{ recursoId, fecha, zonaHoraria, duracionBaseMin, duracionMinMin, duracionMaxMin, horarios[] }' })
  consultarDisponibilidad(@Param('id', ParseIntPipe) id: number, @Query() query: DisponibilidadQuery) {
    return this.disponibilidad.consultar(id, query.fecha, query.desde, query.hasta);
  }
}
