import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { CreateUnidadDto, UnidadResponse, UpdateUnidadDto } from './dto/unidad.dto.js';
import { UnidadesService } from './unidades.service.js';

@ApiTags('unidades')
@ApiBearerAuth()
@Controller()
export class UnidadesController {
  constructor(private readonly unidades: UnidadesService) {}

  @Post('sucursales/:sucursalId/unidades')
  @ApiOperation({ summary: 'Crear una unidad base (pieza física indivisible) en una sucursal propia' })
  @ApiCreatedResponse({ type: UnidadResponse })
  @ApiForbiddenResponse({ description: 'La sucursal es de otro comerciante' })
  crear(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateUnidadDto,
  ) {
    return this.unidades.crear(sucursalId, user, dto);
  }

  @Get('sucursales/:sucursalId/unidades')
  @ApiOperation({ summary: 'Listar las unidades base de una sucursal propia' })
  @ApiOkResponse({ type: [UnidadResponse] })
  listar(@Param('sucursalId', ParseIntPipe) sucursalId: number, @CurrentUser() user: JwtPayload) {
    return this.unidades.listar(sucursalId, user);
  }

  @Patch('unidades/:id')
  @ApiOperation({ summary: 'Renombrar una unidad base' })
  @ApiOkResponse({ type: UnidadResponse })
  actualizar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload, @Body() dto: UpdateUnidadDto) {
    return this.unidades.actualizar(id, user, dto);
  }
}
