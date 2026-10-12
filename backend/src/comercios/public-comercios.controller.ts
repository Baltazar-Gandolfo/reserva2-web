import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { ComercioPublicoDetalleResponse, ComercioPublicoResponse } from './comercio.response.js';
import { ComerciosService } from './comercios.service.js';

// Prefijo "public" y tag propio: en Swagger se distinguen de las rutas privadas
// (las privadas muestran candado por @ApiBearerAuth; estas no).
@ApiTags('public')
@Public()
@Controller('public/comercios')
export class PublicComerciosController {
  constructor(private readonly comercios: ComerciosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar comercios ACTIVOS (sin autenticación)' })
  @ApiOkResponse({ type: [ComercioPublicoResponse] })
  listar() {
    return this.comercios.listarPublicos();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalle de un comercio ACTIVO por slug, con sus sucursales ACTIVAS (sin autenticación)' })
  @ApiOkResponse({ type: ComercioPublicoDetalleResponse })
  @ApiNotFoundResponse({ description: 'No existe o está inactivo' })
  obtener(@Param('slug') slug: string) {
    return this.comercios.obtenerPublicoPorSlug(slug);
  }
}
