import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

// @Controller('health') = [Route("health")] en un controller de ASP.NET.
// Junto con el prefijo global "api/v1" (ver main.ts), la ruta final es GET /api/v1/health.
@Public()
@Controller('health')
export class HealthController {
  // Inyección por constructor, igual que en .NET.
  constructor(private readonly prisma: PrismaService) {}

  @Get() // = [HttpGet]
  async check() {
    // Cuenta usuarios: si esto responde, la conexión a Postgres funciona de punta a punta.
    const usuarios = await this.prisma.usuario.count();
    return { status: 'ok', db: 'conectada', usuarios, timestamp: new Date().toISOString() };
  }
}
