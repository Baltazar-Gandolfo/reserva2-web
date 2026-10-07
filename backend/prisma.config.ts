// Configuración del CLI de Prisma (migraciones, generate, etc.).
// Es como el "appsettings.json" que usan las herramientas de EF Core (dotnet ef) para saber a qué base conectarse.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // "?? ''" permite correr `prisma generate` sin .env; migrate/db sí necesitan la URL real.
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
