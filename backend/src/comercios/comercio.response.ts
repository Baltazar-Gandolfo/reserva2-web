import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoComercio } from '../generated/prisma/client.js';

// Vista privada (panel): incluye estado y dueño.
export const comercioSelect = {
  id: true,
  nombre: true,
  slug: true,
  descripcion: true,
  estado: true,
  comercianteId: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Vista pública: solo lo que cualquiera puede ver (sin comercianteId ni estado interno).
export const sucursalPublicaSelect = {
  id: true,
  nombre: true,
  direccion: true,
  telefono: true,
  horarioTexto: true,
} as const;

export const recursoPublicoSelect = {
  id: true,
  nombre: true,
  duracionBaseMin: true,
  duracionMinMin: true,
  duracionMaxMin: true,
  requiereAprobacion: true,
  anticipacionMinCancelacionHoras: true,
} as const;

export const comercioPublicoSelect = {
  id: true,
  nombre: true,
  slug: true,
  descripcion: true,
} as const;

export class ComercioResponse {
  @ApiProperty() id: number;
  @ApiProperty() nombre: string;
  @ApiProperty() slug: string;
  @ApiPropertyOptional({ nullable: true, type: String }) descripcion: string | null;
  @ApiProperty({ enum: EstadoComercio }) estado: EstadoComercio;
  @ApiProperty() comercianteId: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class RecursoPublicoResponse {
  @ApiProperty() id: number;
  @ApiProperty() nombre: string;
  @ApiProperty() duracionBaseMin: number;
  @ApiProperty() duracionMinMin: number;
  @ApiProperty() duracionMaxMin: number;
  @ApiProperty() requiereAprobacion: boolean;
  @ApiProperty() anticipacionMinCancelacionHoras: number;
}

export class SucursalPublicaResponse {
  @ApiProperty() id: number;
  @ApiProperty() nombre: string;
  @ApiProperty() direccion: string;
  @ApiPropertyOptional({ nullable: true, type: String }) telefono: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) horarioTexto: string | null;
  @ApiProperty({ type: [RecursoPublicoResponse], description: 'Solo recursos ACTIVOS' })
  recursos: RecursoPublicoResponse[];
}

export class ComercioPublicoResponse {
  @ApiProperty() id: number;
  @ApiProperty() nombre: string;
  @ApiProperty() slug: string;
  @ApiPropertyOptional({ nullable: true, type: String }) descripcion: string | null;
}

export class ComercioPublicoDetalleResponse extends ComercioPublicoResponse {
  @ApiProperty({ type: [SucursalPublicaResponse], description: 'Solo sucursales ACTIVAS' })
  sucursales: SucursalPublicaResponse[];
}
