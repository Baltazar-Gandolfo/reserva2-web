import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { CreateSucursalDto } from './dto/create-sucursal.dto.js';
import { UpdateSucursalDto } from './dto/update-sucursal.dto.js';
import { SucursalResponse } from './sucursal.response.js';
import { SucursalesService } from './sucursales.service.js';

// Un controller sin @Controller('prefijo') fijo: las rutas se declaran completas en cada método,
// porque mezclan dos "raíces" (/comercios/:id/sucursales y /sucursales/:id).
@ApiTags('sucursales')
@ApiBearerAuth()
@Controller()
export class SucursalesController {
  constructor(private readonly sucursales: SucursalesService) {}

  @Post('comercios/:comercioId/sucursales')
  @ApiOperation({ summary: 'Crear una sucursal en un comercio propio (dueño o ADMINISTRADOR)' })
  @ApiCreatedResponse({ type: SucursalResponse })
  @ApiForbiddenResponse({ description: 'El comercio es de otro comerciante' })
  crear(
    @Param('comercioId', ParseIntPipe) comercioId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSucursalDto,
  ) {
    return this.sucursales.crear(comercioId, user, dto);
  }

  @Get('comercios/:comercioId/sucursales')
  @ApiOperation({ summary: 'Listar las sucursales de un comercio (dueño o ADMINISTRADOR), activas e inactivas' })
  @ApiOkResponse({ type: [SucursalResponse] })
  @ApiForbiddenResponse({ description: 'El comercio es de otro comerciante' })
  listar(@Param('comercioId', ParseIntPipe) comercioId: number, @CurrentUser() user: JwtPayload) {
    return this.sucursales.listar(comercioId, user);
  }

  // Sin DELETE físico: "eliminar" = estado INACTIVA (ver el comentario en ComerciosController).
  @Patch('sucursales/:id')
  @ApiOperation({ summary: 'Editar una sucursal o desactivarla con estado=INACTIVA (dueño del comercio o ADMINISTRADOR)' })
  @ApiOkResponse({ type: SucursalResponse })
  @ApiForbiddenResponse({ description: 'La sucursal pertenece a un comercio de otro comerciante' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSucursalDto,
  ) {
    return this.sucursales.actualizar(id, user, dto);
  }
}
