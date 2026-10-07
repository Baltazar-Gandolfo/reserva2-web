import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

// JwtService viene del JwtModule global registrado en AppModule.
@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
