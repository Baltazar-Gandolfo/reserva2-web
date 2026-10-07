import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { RegistroClienteDto } from './registro-cliente.dto.js';

// Hereda todos los campos del cliente (herencia de clases, como en C#) y suma el username.
export class RegistroComercianteDto extends RegistroClienteDto {
  @ApiProperty({ example: 'padel_norte', description: '3-30 caracteres: letras, números, "_", "." o "-"' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @Matches(/^[a-z0-9_.-]{3,30}$/, {
    message: 'username debe tener 3-30 caracteres: letras, números, "_", "." o "-"',
  })
  username: string;
}
