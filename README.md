# Reserva2

Plataforma web de gestión de turnos. Especificación completa en [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md).

Monorepo:
- `backend/` — NestJS + Prisma + PostgreSQL (API REST en `http://localhost:3000/api/v1`)
- `frontend/` — React + Vite (`http://localhost:5173`)

## Requisitos
Node 20+ y una base Postgres (se usa Neon).

## Levantar todo

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env      # en Windows PowerShell: Copy-Item .env.example .env
# editar .env y pegar tu DATABASE_URL
npx prisma migrate dev    # crea las tablas
npm run dev
```
Probar: http://localhost:3000/api/v1/health

**2. Frontend** (otra terminal)
```bash
cd frontend
npm install
cp .env.example .env      # opcional: ya apunta a localhost:3000 por defecto
npm run dev
```
Abrir http://localhost:5173 — debe mostrar la respuesta del `/health`.

## Usuarios de prueba y documentación de API

```bash
cd backend
npm run seed     # crea el admin inicial (idempotente)
```
Admin de desarrollo (⚠️ cambiar `ADMIN_*` en producción): usuario `admin` / email `admin@reserva2.local` / password `Admin1234!`
(se definen en `backend/.env`).

Swagger (documentación interactiva): http://localhost:3000/api/docs — usar "Authorize" con el `accessToken` del login.

## Comercios y sucursales (Fase 2)

- Privado (con token): `/comercios`, `/comercios/:id`, `/comercios/:id/sucursales`, `/sucursales/:id`.
  Un COMERCIANTE solo ve y edita lo suyo; el ADMINISTRADOR ve todo. No hay DELETE: se desactiva con `estado`.
- Público (sin token): `GET /api/v1/public/comercios` y `GET /api/v1/public/comercios/:slug`.
- Frontend: ingresar como comerciante → Panel → Comercios.

## Reservas (Fase 3)

- **Unidad base**: pieza física indivisible. **Recurso**: lo que se reserva; se compone de una o más unidades.
  Dos reservas chocan si comparten al menos una unidad y se superponen en el tiempo (PENDIENTE/CONFIRMADA).
- `GET /api/v1/recursos/:id/disponibilidad?fecha=YYYY-MM-DD[&desde=HH:mm&hasta=HH:mm]`
- `POST /api/v1/reservas`, `GET /reservas/mias`, `GET /reservas?recursoId=&comercioId=`,
  `PATCH /reservas/:id/aprobar | rechazar | cancelar`
- Zona horaria del negocio: `APP_TIMEZONE` (por defecto `America/Argentina/Buenos_Aires`).
- Frontend: página pública `/c/:slug` (reservar), `/reservas/mias`, y para el comerciante
  `/sucursales/:id` (unidades y recursos) y `/comercios/:id/reservas`.

## Scripts útiles (backend)
- `npm run seed` — carga el admin inicial
- `npm run dev` — arranca con recarga automática
- `npm run prisma:migrate` — crea/aplica migraciones
- `npm run prisma:generate` — regenera el cliente de Prisma
