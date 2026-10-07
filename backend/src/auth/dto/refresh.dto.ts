import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token recibido en el login' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
