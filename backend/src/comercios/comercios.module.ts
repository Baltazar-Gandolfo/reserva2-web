import { Module } from '@nestjs/common';
import { ComerciosController } from './comercios.controller.js';
import { ComerciosService } from './comercios.service.js';
import { PublicComerciosController } from './public-comercios.controller.js';

// exports = lo que otros módulos pueden inyectar (SucursalesModule reutiliza ComerciosService para validar pertenencia).
@Module({
  controllers: [ComerciosController, PublicComerciosController],
  providers: [ComerciosService],
  exports: [ComerciosService],
})
export class ComerciosModule {}
