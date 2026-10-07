import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { EstadoUsuario } from '../../generated/prisma/client.js';

const aMinusculas = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// Todos los campos son opcionales (PATCH = actualización parcial). Solo un ADMINISTRADOR llega acá.
export class UpdateUsuarioDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(80) nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(80) apellido?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(aMinusculas)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Solo para ADMINISTRADOR y COMERCIANTE; un CLIENTE no tiene username' })
  @IsOptional()
  @Transform(aMinusculas)
  @Matches(/^[a-z0-9_.-]{3,30}$/, {
    message: 'username debe tener 3-30 caracteres: letras, números, "_", "." o "-"',
  })
  username?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) telefono?: string;

  @ApiPropertyOptional({ enum: EstadoUsuario, description: 'BLOQUEADO impide login y refresh' })
  @IsOptional()
  @IsEnum(EstadoUsuario)
  estado?: EstadoUsuario;
}
