import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// main.ts = tu Program.cs: construye la app y la pone a escuchar.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1'); // todas las rutas empiezan con /api/v1
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }); // permite que el front (otro puerto) llame al back
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
