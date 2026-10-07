import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

// main.ts = tu Program.cs: construye la app y la pone a escuchar.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1'); // todas las rutas empiezan con /api/v1
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }); // permite que el front (otro puerto) llame al back

  // ValidationPipe global: valida TODOS los DTOs de entrada (como el [ApiController] que valida el ModelState solo).
  // whitelist descarta campos que el DTO no declara; forbidNonWhitelisted los rechaza con 400;
  // transform ejecuta los @Transform (ej: email en minúsculas) y convierte tipos.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Swagger UI en /api/docs (Swashbuckle en .NET). Fuera del prefijo /api/v1 a propósito.
  const docConfig = new DocumentBuilder()
    .setTitle('Reserva2 API')
    .setDescription('API de gestión de turnos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, docConfig));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
