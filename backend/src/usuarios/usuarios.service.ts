import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Rol } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { usuarioSelect } from './usuario.response.js';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.usuario.findMany({ select: usuarioSelect, orderBy: { id: 'asc' } });
  }

  async obtener(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id }, select: usuarioSelect });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async actualizar(id: number, dto: UpdateUsuarioDto) {
    const actual = await this.obtener(id);

    if (dto.username !== undefined && actual.rol === Rol.CLIENTE) {
      throw new BadRequestException('Un CLIENTE no tiene username');
    }

    // Unicidad: se chequea solo lo que realmente cambia.
    const choques = [
      dto.email && dto.email !== actual.email ? { email: dto.email } : null,
      dto.username && dto.username !== actual.username ? { username: dto.username } : null,
    ].filter((c) => c !== null);
    if (choques.length > 0) {
      const duplicado = await this.prisma.usuario.findFirst({
        where: { OR: choques, NOT: { id } },
        select: { email: true },
      });
      if (duplicado) {
        throw new ConflictException(
          duplicado.email === dto.email ? 'El email ya está registrado' : 'El username ya está en uso',
        );
      }
    }

    return this.prisma.usuario.update({ where: { id }, data: dto, select: usuarioSelect });
  }
}
