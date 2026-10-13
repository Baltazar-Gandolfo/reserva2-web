import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { EstadoReserva } from '../../generated/prisma/client.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
// Exige zona horaria explícita ("Z" o "+hh:mm"): "2026-10-20T18:00" sin zona sería ambiguo.
const CON_ZONA = /(Z|[+-]\d{2}:\d{2})$/;

export class CreateReservaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  recursoId: number;

  @ApiProperty({ example: '2026-10-20T21:00:00.000Z', description: 'ISO 8601 con zona horaria. Debe caer en la grilla del recurso' })
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(CON_ZONA, { message: 'horaInicio debe incluir zona horaria (ej: 2026-10-20T21:00:00Z)' })
  horaInicio: string;

  @ApiProperty({ example: '2026-10-20T22:30:00.000Z' })
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(CON_ZONA, { message: 'horaFin debe incluir zona horaria (ej: 2026-10-20T22:30:00Z)' })
  horaFin: string;

  // Los tres campos siguientes SOLO los puede mandar el COMERCIANTE. Si quien reserva es un CLIENTE, se rechazan
  // (el cliente siempre reserva para sí mismo: su id sale del token).
  @ApiPropertyOptional({ description: 'Solo COMERCIANTE: id de un cliente con cuenta. Excluyente con nombreContacto/telefonoContacto' })
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number;

  @ApiPropertyOptional({ description: 'Solo COMERCIANTE: para alguien sin cuenta (junto con telefonoContacto)' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombreContacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  telefonoContacto?: string;
}

export class ListarReservasQuery {
  @ApiPropertyOptional({ description: 'Filtrar por recurso' })
  @IsOptional()
  @Type(() => Number) // los query params llegan como texto: se convierten a número antes de validar
  @IsInt()
  @Min(1)
  recursoId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por comercio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  comercioId?: number;
}

class ReservaSucursalResponse {
  @ApiProperty() id: number;
  @ApiProperty() nombre: string;
  @ApiProperty() direccion: string;
  @ApiPropertyOptional({ nullable: true, type: String, description: 'A quién reclamar una devolución' }) telefono: string | null;
  @ApiProperty() comercio: { id: number; nombre: string; slug: string };
}

class ReservaRecursoResponse {
  @ApiProperty() id: number;
  @ApiProperty() nombre: string;
  @ApiProperty() anticipacionMinCancelacionHoras: number;
  @ApiProperty({ type: ReservaSucursalResponse }) sucursal: ReservaSucursalResponse;
}

export class ReservaResponse {
  @ApiProperty() id: number;
  @ApiProperty() recursoId: number;
  @ApiProperty() horaInicio: Date;
  @ApiProperty() horaFin: Date;
  @ApiProperty({ enum: EstadoReserva }) estado: EstadoReserva;
  @ApiPropertyOptional({ nullable: true, type: Number }) clienteId: number | null;
  @ApiPropertyOptional({ nullable: true, type: String }) nombreContacto: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) telefonoContacto: string | null;
  @ApiPropertyOptional({ nullable: true, type: Boolean, description: 'Se completa al cancelar: true si fue dentro del plazo' })
  canceladaDentroDePlazo: boolean | null;
  @ApiProperty({ type: ReservaRecursoResponse }) recurso: ReservaRecursoResponse;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
