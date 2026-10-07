import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

// AppModule es el módulo raíz: algo así como el Program.cs/Startup donde registrás servicios.
// En Nest cada "módulo" agrupa controllers + providers (services) y declara qué importa/exporta.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // lee el archivo .env (como IConfiguration)
    JwtModule.register({ global: true }), // JwtService disponible en todos lados (los secretos se pasan por llamada)
    PrismaModule,
    AuthModule,
    UsuariosModule,
  ],
  controllers: [HealthController],
  providers: [
    // APP_GUARD = registrar un filtro/guard global (como agregar un AuthorizeFilter a MvcOptions.Filters).
    // Se ejecutan en este orden: primero autentica (JWT), después autoriza (rol).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
