import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoSucursal } from '../generated/prisma/client.js';

export const sucursalSelect = {
  id: true,
  comercioId: true,
  nombre: true,
  direccion: true,
  telefono: true,
  horarioTexto: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class SucursalResponse {
  @ApiProperty() id: number;
  @ApiProperty() comercioId: number;
  @ApiProperty() nombre: string;
  @ApiProperty() direccion: string;
  @ApiPropertyOptional({ nullable: true, type: String }) telefono: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) horarioTexto: string | null;
  @ApiProperty({ enum: EstadoSucursal }) estado: EstadoSucursal;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
