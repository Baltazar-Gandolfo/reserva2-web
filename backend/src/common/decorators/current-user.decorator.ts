import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Rol } from '../../generated/prisma/client.js';

// Lo que viaja dentro del JWT. "sub" (subject) es el nombre estándar del claim con el id del usuario.
export interface JwtPayload {
  sub: number;
  rol: Rol;
}

// Decorador de parámetro: te da el usuario autenticado en el controller.
// Equivale a leer HttpContext.User / User.FindFirst(...) en ASP.NET.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload => {
  return ctx.switchToHttp().getRequest().user;
});
