import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Un DTO es una clase que describe el cuerpo de la request. Los decoradores de class-validator son
// como los DataAnnotations de .NET ([Required], [EmailAddress], [MinLength]); los de @nestjs/swagger
// (@ApiProperty) documentan el campo en /api/docs. El ValidationPipe global ejecuta las validaciones.
export class RegistroClienteDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  apellido: string;

  @ApiProperty({ example: 'juan@mail.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+54 11 5555 1234' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  // Máximo 72: BCrypt ignora todo lo que pase de 72 bytes.
  @ApiProperty({ example: 'Secreta123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
