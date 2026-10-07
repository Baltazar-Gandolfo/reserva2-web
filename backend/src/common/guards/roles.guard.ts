import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../../generated/prisma/client.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { JwtPayload } from '../decorators/current-user.decorator.js';

// Corre DESPUÉS del JwtAuthGuard (el orden de los APP_GUARD en AppModule importa):
// lee el rol del usuario ya autenticado y lo compara con los roles que pide el endpoint vía @Roles().
// Si el endpoint no tiene @Roles, alcanza con estar logueado.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requeridos || requeridos.length === 0) return true;

    const user: JwtPayload | undefined = context.switchToHttp().getRequest().user;
    if (!user || !requeridos.includes(user.rol)) {
      throw new ForbiddenException('No tenés permisos para esta acción');
    }
    return true;
  }
}
