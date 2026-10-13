import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUnidadDto {
  @ApiProperty({ example: 'Tercio A' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}

// La unidad solo tiene nombre: no hace falta un DTO distinto para editar.
export class UpdateUnidadDto extends CreateUnidadDto {}

export class UnidadResponse {
  @ApiProperty() id: number;
  @ApiProperty() sucursalId: number;
  @ApiProperty() nombre: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
