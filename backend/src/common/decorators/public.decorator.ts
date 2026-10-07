import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Equivalente a [AllowAnonymous]. Como el JwtAuthGuard es global (todo exige login por defecto),
// los endpoints abiertos (login, registro, health) se marcan con @Public().
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
