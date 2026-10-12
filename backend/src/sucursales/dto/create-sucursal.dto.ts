import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// El comercio padre va en la URL (/comercios/:id/sucursales), no en el body.
export class CreateSucursalDto {
  @ApiProperty({ example: 'Sede Villa Urquiza' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Av. Triunvirato 4500, CABA' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  direccion: string;

  @ApiPropertyOptional({ example: '+54 11 5555 1234' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'Lun a Vie 9-22, Sáb-Dom 9-20', description: 'Texto libre' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  horarioTexto?: string;
}
