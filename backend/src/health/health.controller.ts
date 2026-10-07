import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

// @Controller('health') = [Route("health")] en un controller de ASP.NET.
// Junto con el prefijo global "api/v1" (ver main.ts), la ruta final es GET /api/v1/health.
// Es público a propósito (lo usan monitores y el front), por eso no expone ningún dato del negocio.
@Public()
@Controller('health')
export class HealthController {
  // Inyección por constructor, igual que en .NET.
  constructor(private readonly prisma: PrismaService) {}

  @Get() // = [HttpGet]
  async check() {
    // SELECT 1: si la base no responde, lanza y Nest devuelve 500; si responde, la conexión funciona.
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
