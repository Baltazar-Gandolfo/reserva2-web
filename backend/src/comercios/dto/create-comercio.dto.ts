import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { SLUG_MAX, SLUG_REGEX } from '../../common/slug.util.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// OJO: acá NO hay comercianteId. El dueño siempre sale del JWT; si el cliente lo manda,
// el ValidationPipe (forbidNonWhitelisted) rechaza la request con 400.
export class CreateComercioDto {
  @ApiProperty({ example: 'Pádel Norte' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    example: 'padel-norte',
    description: 'Si no viene, se genera a partir del nombre. Si viene, debe ser único (409 si ya existe).',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @MaxLength(SLUG_MAX)
  @Matches(SLUG_REGEX, { message: 'slug solo admite minúsculas, números y guiones simples (ej: padel-norte)' })
  slug?: string;

  @ApiPropertyOptional({ example: 'Canchas de pádel techadas' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
