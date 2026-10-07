import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Rol } from '../generated/prisma/client.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { UsuarioResponse } from './usuario.response.js';
import { UsuariosService } from './usuarios.service.js';

// No lleva @Public(): el JwtAuthGuard global exige token. @ApiBearerAuth muestra el candado en Swagger.
@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @Roles(Rol.ADMINISTRADOR) // ≈ [Authorize(Roles = "ADMINISTRADOR")]
  @ApiOperation({ summary: 'Listar todos los usuarios (solo ADMINISTRADOR)' })
  @ApiOkResponse({ type: [UsuarioResponse] })
  @ApiForbiddenResponse({ description: 'El rol no es ADMINISTRADOR' })
  listar() {
    return this.usuarios.listar();
  }

  // Cualquier usuario logueado. Va ANTES de ':id' para que "me" no se interprete como un id.
  @Get('me')
  @ApiOperation({ summary: 'Datos del usuario autenticado' })
  @ApiOkResponse({ type: UsuarioResponse })
  me(@CurrentUser() user: JwtPayload) {
    return this.usuarios.obtener(user.sub);
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Editar un usuario (solo ADMINISTRADOR). Es la única vía para cambiar el username',
  })
  @ApiOkResponse({ type: UsuarioResponse })
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuarios.actualizar(id, dto);
  }
}
