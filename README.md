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

## Scripts útiles (backend)
- `npm run dev` — arranca con recarga automática
- `npm run prisma:migrate` — crea/aplica migraciones
- `npm run prisma:generate` — regenera el cliente de Prisma
