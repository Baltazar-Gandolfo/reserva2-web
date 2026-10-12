import { Module } from '@nestjs/common';
import { ComerciosModule } from '../comercios/comercios.module.js';
import { SucursalesController } from './sucursales.controller.js';
import { SucursalesService } from './sucursales.service.js';

@Module({
  imports: [ComerciosModule], // para poder inyectar ComerciosService
  controllers: [SucursalesController],
  providers: [SucursalesService],
})
export class SucursalesModule {}
