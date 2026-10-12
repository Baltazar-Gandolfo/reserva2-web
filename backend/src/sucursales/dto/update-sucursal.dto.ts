import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoSucursal } from '../../generated/prisma/client.js';
import { CreateSucursalDto } from './create-sucursal.dto.js';

export class UpdateSucursalDto extends PartialType(CreateSucursalDto) {
  @ApiPropertyOptional({
    enum: EstadoSucursal,
    description: '"Eliminar" una sucursal = pasarla a INACTIVA (no hay DELETE físico)',
  })
  @IsOptional()
  @IsEnum(EstadoSucursal)
  estado?: EstadoSucursal;
}
