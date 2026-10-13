import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EstadoRecurso } from '../../generated/prisma/client.js';

export class CreateRecursoDto {
  @ApiProperty({ example: 'Cancha 11 completa' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 30, description: 'Bloque mínimo en minutos: la grilla de horarios' })
  @IsInt()
  @Min(5)
  @Max(1440)
  duracionBaseMin: number;

  @ApiProperty({ example: 60, description: 'Duración mínima de una reserva (múltiplo de la base)' })
  @IsInt()
  @Min(5)
  @Max(1440)
  duracionMinMin: number;

  @ApiProperty({ example: 120, description: 'Duración máxima (múltiplo de la base). Si no varía, igual a la mínima' })
  @IsInt()
  @Min(5)
  @Max(1440)
  duracionMaxMin: number;

  @ApiPropertyOptional({ default: false, description: 'Si es true, las reservas nacen PENDIENTE hasta que el dueño las apruebe' })
  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean;

  @ApiPropertyOptional({ default: 0, description: 'Horas antes del inicio hasta las que se puede cancelar "a tiempo"' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  anticipacionMinCancelacionHoras?: number;

  @ApiProperty({ type: [Number], example: [1, 2, 3], description: 'Ids de las UnidadBase que componen el recurso (de la misma sucursal)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  unidadIds: number[];
}

export class UpdateRecursoDto extends PartialType(CreateRecursoDto) {
  @ApiPropertyOptional({ enum: EstadoRecurso, description: '"Eliminar" un recurso = pasarlo a INACTIVO' })
  @IsOptional()
  @IsEnum(EstadoRecurso)
  estado?: EstadoRecurso;
}

export class RecursoResponse {
  @ApiProperty() id: number;
  @ApiProperty() sucursalId: number;
  @ApiProperty() nombre: string;
  @ApiProperty({ enum: EstadoRecurso }) estado: EstadoRecurso;
  @ApiProperty() duracionBaseMin: number;
  @ApiProperty() duracionMinMin: number;
  @ApiProperty() duracionMaxMin: number;
  @ApiProperty() requiereAprobacion: boolean;
  @ApiProperty() anticipacionMinCancelacionHoras: number;
  @ApiProperty({ type: [Number] }) unidadIds: number[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
