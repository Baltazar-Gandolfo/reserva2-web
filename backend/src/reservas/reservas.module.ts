import { Module } from '@nestjs/common';
import { ComerciosModule } from '../comercios/comercios.module.js';
import { SucursalesModule } from '../sucursales/sucursales.module.js';
import { DisponibilidadService } from './disponibilidad.service.js';
import { RecursosController } from './recursos.controller.js';
import { RecursosService } from './recursos.service.js';
import { ReservasController } from './reservas.controller.js';
import { ReservasService } from './reservas.service.js';
import { UnidadesController } from './unidades.controller.js';
import { UnidadesService } from './unidades.service.js';

// Un solo módulo para todo el motor de reservas: unidades, recursos, disponibilidad y reservas
// se usan entre sí constantemente (si se separaran habría dependencias circulares).
@Module({
  imports: [ComerciosModule, SucursalesModule],
  controllers: [UnidadesController, RecursosController, ReservasController],
  providers: [UnidadesService, RecursosService, DisponibilidadService, ReservasService],
})
export class ReservasModule {}
