import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

// AppModule es el módulo raíz: algo así como el Program.cs/Startup donde registrás servicios.
// En Nest cada "módulo" agrupa controllers + providers (services) y declara qué importa/exporta.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // lee el archivo .env (como IConfiguration)
    PrismaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
