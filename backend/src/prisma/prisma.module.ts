import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global() hace que PrismaService esté disponible en TODOS los módulos sin tener que importar PrismaModule cada vez.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
