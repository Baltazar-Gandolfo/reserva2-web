import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoComercio } from '../../generated/prisma/client.js';
import { CreateComercioDto } from './create-comercio.dto.js';

// PartialType (de @nestjs/swagger) copia el DTO de creación haciendo todos sus campos opcionales,
// conservando validaciones y docs de Swagger: no hay que duplicar nada (≈ heredar y relajar [Required]).
export class UpdateComercioDto extends PartialType(CreateComercioDto) {
  @ApiPropertyOptional({
    enum: EstadoComercio,
    description: '"Eliminar" un comercio = pasarlo a INACTIVO (no hay DELETE físico)',
  })
  @IsOptional()
  @IsEnum(EstadoComercio)
  estado?: EstadoComercio;
}
