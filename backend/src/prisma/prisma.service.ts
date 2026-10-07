import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// @Injectable() = registrar esta clase en el contenedor de inyección de dependencias (como services.AddScoped<>() en .NET).
// PrismaService es tu "DbContext": las demás clases lo reciben por constructor y lo usan para consultar la base.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  // Hooks del ciclo de vida: Nest los llama al arrancar / apagar la app.
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
