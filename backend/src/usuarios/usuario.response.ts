import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoUsuario, Rol } from '../generated/prisma/client.js';

// Campos que se devuelven al exterior: NUNCA incluye passwordHash.
// Se usa como `select` en las consultas de Prisma (≈ proyectar a un DTO con Select() en LINQ).
export const usuarioSelect = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  username: true,
  telefono: true,
  rol: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Clase solo para documentar la forma de la respuesta en Swagger.
export class UsuarioResponse {
  @ApiProperty() id: number;
  @ApiProperty() nombre: string;
  @ApiProperty() apellido: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional({ nullable: true, type: String }) username: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) telefono: string | null;
  @ApiProperty({ enum: Rol }) rol: Rol;
  @ApiProperty({ enum: EstadoUsuario }) estado: EstadoUsuario;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
