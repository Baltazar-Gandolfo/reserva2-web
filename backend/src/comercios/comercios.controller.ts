import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
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
import { ComercioResponse } from './comercio.response.js';
import { ComerciosService } from './comercios.service.js';
import { CreateComercioDto } from './dto/create-comercio.dto.js';
import { UpdateComercioDto } from './dto/update-comercio.dto.js';

@ApiTags('comercios')
@ApiBearerAuth()
@Controller('comercios')
export class ComerciosController {
  constructor(private readonly comercios: ComerciosService) {}

  @Post()
  @Roles(Rol.COMERCIANTE)
  @ApiOperation({ summary: 'Crear un comercio propio (solo COMERCIANTE). El slug es opcional: se genera del nombre' })
  @ApiCreatedResponse({ type: ComercioResponse })
  @ApiConflictResponse({ description: 'El slug indicado ya existe' })
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CreateComercioDto) {
    return this.comercios.crear(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis comercios (el ADMINISTRADOR ve todos)' })
  @ApiOkResponse({ type: [ComercioResponse] })
  listar(@CurrentUser() user: JwtPayload) {
    return this.comercios.listarPropios(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un comercio (dueño o ADMINISTRADOR)' })
  @ApiOkResponse({ type: ComercioResponse })
  @ApiForbiddenResponse({ description: 'El comercio es de otro comerciante' })
  obtener(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.comercios.obtener(id, user);
  }

  // No existe DELETE físico: "eliminar" = PATCH con estado INACTIVO (soft delete).
  // En fases futuras habrá reservas asociadas; borrar la fila de verdad las dejaría huérfanas
  // y perderíamos el historial. Desactivar conserva los datos y es reversible.
  @Patch(':id')
  @ApiOperation({ summary: 'Editar un comercio o desactivarlo con estado=INACTIVO (dueño o ADMINISTRADOR)' })
  @ApiOkResponse({ type: ComercioResponse })
  @ApiForbiddenResponse({ description: 'El comercio es de otro comerciante' })
  @ApiConflictResponse({ description: 'El slug indicado ya existe' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateComercioDto,
  ) {
    return this.comercios.actualizar(id, user, dto);
  }
}
