import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { UsuarioResponse } from '../usuarios/usuario.response.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegistroClienteDto } from './dto/registro-cliente.dto.js';
import { RegistroComercianteDto } from './dto/registro-comerciante.dto.js';

// Todo el controller es público: es la puerta de entrada, todavía no hay token.
// @ApiTags agrupa los endpoints en Swagger.
@ApiTags('auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('registro/cliente')
  @ApiOperation({ summary: 'Registrar un cliente (rol CLIENTE, sin username)' })
  @ApiCreatedResponse({ type: UsuarioResponse })
  @ApiConflictResponse({ description: 'Email ya registrado' })
  registrarCliente(@Body() dto: RegistroClienteDto) {
    return this.auth.registrarCliente(dto);
  }

  @Post('registro/comerciante')
  @ApiOperation({ summary: 'Registrar un comerciante (rol COMERCIANTE, con username)' })
  @ApiCreatedResponse({ type: UsuarioResponse })
  @ApiConflictResponse({ description: 'Email o username ya registrado' })
  registrarComerciante(@Body() dto: RegistroComercianteDto) {
    return this.auth.registrarComerciante(dto);
  }

  @Post('login')
  @HttpCode(200) // por defecto un POST devuelve 201; un login no "crea" nada, así que 200
  @ApiOperation({ summary: 'Login con email o username. Devuelve access y refresh token' })
  @ApiOkResponse({ description: '{ accessToken, refreshToken, usuario }' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renueva el par de tokens usando un refresh token válido' })
  @ApiOkResponse({ description: '{ accessToken, refreshToken }' })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido o vencido' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }
}
