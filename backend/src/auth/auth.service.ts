import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { EstadoUsuario, Rol } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { usuarioSelect } from '../usuarios/usuario.response.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroClienteDto } from './dto/registro-cliente.dto.js';
import { RegistroComercianteDto } from './dto/registro-comerciante.dto.js';

const BCRYPT_ROUNDS = 10;
// Hash de relleno para que el login tarde parecido exista o no el usuario (evita enumerar usuarios por tiempo).
const HASH_FALSO = bcrypt.hashSync('relleno-anti-timing', BCRYPT_ROUNDS);

// Un Service = la capa BLL de tu arquitectura de 4 capas: acá vive la lógica; el controller solo delega.
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  registrarCliente(dto: RegistroClienteDto) {
    return this.crearUsuario(dto, Rol.CLIENTE, null);
  }

  registrarComerciante(dto: RegistroComercianteDto) {
    return this.crearUsuario(dto, Rol.COMERCIANTE, dto.username);
  }

  private async crearUsuario(dto: RegistroClienteDto, rol: Rol, username: string | null) {
    const existente = await this.prisma.usuario.findFirst({
      where: { OR: [{ email: dto.email }, ...(username ? [{ username }] : [])] },
      select: { email: true },
    });
    if (existente) {
      throw new ConflictException(
        existente.email === dto.email ? 'El email ya está registrado' : 'El username ya está en uso',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        telefono: dto.telefono,
        username,
        passwordHash,
        rol,
      },
      select: usuarioSelect,
    });
  }

  async login(dto: LoginDto) {
    // El identificador puede ser email O username (ambos se guardan en minúsculas).
    const usuario = await this.prisma.usuario.findFirst({
      where: { OR: [{ email: dto.identificador }, { username: dto.identificador }] },
    });

    const passwordOk = await bcrypt.compare(dto.password, usuario?.passwordHash ?? HASH_FALSO);
    if (!usuario || !passwordOk) throw new UnauthorizedException('Credenciales inválidas');
    if (usuario.estado === EstadoUsuario.BLOQUEADO) throw new ForbiddenException('Usuario bloqueado');

    const { passwordHash: _omitido, ...publico } = usuario;
    return { ...(await this.emitirTokens(usuario.id, usuario.rol)), usuario: publico };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o vencido');
    }

    // Se relee el usuario: si lo bloquearon o cambió de rol desde el login, no se renueva con datos viejos.
    const usuario = await this.prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!usuario || usuario.estado === EstadoUsuario.BLOQUEADO) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    return this.emitirTokens(usuario.id, usuario.rol);
  }

  // Access y refresh se firman con secretos distintos: un refresh token nunca sirve como access token.
  private async emitirTokens(id: number, rol: Rol) {
    const payload: JwtPayload = { sub: id, rol };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES') ?? '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES') ?? '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
