import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { type JwtPayload } from '../common/decorators/current-user.decorator.js';
import { primerSlugLibre, slugify } from '../common/slug.util.js';
import { EstadoComercio, EstadoRecurso, EstadoSucursal, Rol } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { comercioPublicoSelect, comercioSelect, recursoPublicoSelect, sucursalPublicaSelect } from './comercio.response.js';
import { CreateComercioDto } from './dto/create-comercio.dto.js';
import { UpdateComercioDto } from './dto/update-comercio.dto.js';

// P2002 = código de Prisma para "violación de índice único" (como un DbUpdateException por UNIQUE en EF Core).
const esViolacionUnica = (e: unknown) => (e as { code?: string })?.code === 'P2002';

@Injectable()
export class ComerciosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(user: JwtPayload, dto: CreateComercioDto) {
    const slug = dto.slug ? await this.validarSlugLibre(dto.slug) : await this.generarSlug(dto.nombre);
    try {
      return await this.prisma.comercio.create({
        data: {
          nombre: dto.nombre,
          slug,
          descripcion: dto.descripcion,
          comercianteId: user.sub, // SIEMPRE del token, nunca del body
        },
        select: comercioSelect,
      });
    } catch (e) {
      // Dos requests simultáneas pueden elegir el mismo slug: la restricción UNIQUE de la base es la última defensa.
      if (esViolacionUnica(e)) throw new ConflictException('El slug ya está en uso, probá de nuevo');
      throw e;
    }
  }

  listarPropios(user: JwtPayload) {
    return this.prisma.comercio.findMany({
      // El admin ve todos; el comerciante, solo donde es dueño.
      where: user.rol === Rol.ADMINISTRADOR ? {} : { comercianteId: user.sub },
      select: comercioSelect,
      orderBy: { id: 'asc' },
    });
  }

  async obtener(id: number, user: JwtPayload) {
    await this.verificarAcceso(id, user);
    return this.prisma.comercio.findUniqueOrThrow({ where: { id }, select: comercioSelect });
  }

  async actualizar(id: number, user: JwtPayload, dto: UpdateComercioDto) {
    const actual = await this.verificarAcceso(id, user);
    if (dto.slug && dto.slug !== actual.slug) await this.validarSlugLibre(dto.slug);
    try {
      return await this.prisma.comercio.update({ where: { id }, data: dto, select: comercioSelect });
    } catch (e) {
      if (esViolacionUnica(e)) throw new ConflictException('El slug ya está en uso');
      throw e;
    }
  }

  // Chequeo de pertenencia, reutilizado también por SucursalesService.
  // 404 si no existe, 403 si existe pero no es tuyo (ni sos admin). Devuelve el comercio para no volver a consultarlo.
  async verificarAcceso(comercioId: number, user: JwtPayload) {
    const comercio = await this.prisma.comercio.findUnique({
      where: { id: comercioId },
      select: { id: true, slug: true, comercianteId: true },
    });
    if (!comercio) throw new NotFoundException('Comercio no encontrado');
    if (user.rol !== Rol.ADMINISTRADOR && comercio.comercianteId !== user.sub) {
      throw new ForbiddenException('Este comercio no te pertenece');
    }
    return comercio;
  }

  // ---- Público (sin login): solo lo ACTIVO ----

  listarPublicos() {
    return this.prisma.comercio.findMany({
      where: { estado: EstadoComercio.ACTIVO },
      select: comercioPublicoSelect,
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerPublicoPorSlug(slug: string) {
    const comercio = await this.prisma.comercio.findFirst({
      where: { slug, estado: EstadoComercio.ACTIVO },
      select: {
        ...comercioPublicoSelect,
        sucursales: {
          where: { estado: EstadoSucursal.ACTIVA },
          select: {
            ...sucursalPublicaSelect,
            // Lo que el cliente necesita para elegir y reservar. No se exponen unidades ni configuración interna.
            recursos: { where: { estado: EstadoRecurso.ACTIVO }, select: recursoPublicoSelect, orderBy: { id: 'asc' } },
          },
          orderBy: { id: 'asc' },
        },
      },
    });
    // Mismo 404 para "no existe" e "inactivo": no se filtra que ese slug alguna vez existió.
    if (!comercio) throw new NotFoundException('Comercio no encontrado');
    return comercio;
  }

  // ---- Slugs ----

  private async validarSlugLibre(slug: string) {
    const existe = await this.prisma.comercio.findUnique({ where: { slug }, select: { id: true } });
    if (existe) throw new ConflictException(`El slug "${slug}" ya está en uso`);
    return slug;
  }

  private async generarSlug(nombre: string) {
    const base = slugify(nombre);
    const parecidos = await this.prisma.comercio.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    return primerSlugLibre(base, parecidos.map((c) => c.slug));
  }
}
