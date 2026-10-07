import { SetMetadata } from '@nestjs/common';
import { Rol } from '../../generated/prisma/client.js';

export const ROLES_KEY = 'roles';

// Decorador custom = atributo custom de C#. SetMetadata "pega" datos al endpoint (como los valores
// de un atributo), y el RolesGuard los lee después con Reflector (como leer atributos por reflexión en .NET).
// Uso: @Roles(Rol.ADMINISTRADOR)  ≈  [Authorize(Roles = "ADMINISTRADOR")]
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
