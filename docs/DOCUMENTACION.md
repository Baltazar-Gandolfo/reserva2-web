# Reserva2 — Documentación Maestra del Sistema (versión web)

> Documento de diseño para la reconstrucción de Reserva2 como plataforma web SaaS.
> Autor: Baltazar Gandolfo · Versión 2.0 (web) · Fecha: 2026-10-07
> Destino: servir de especificación para desarrollar con Claude Code, y de hoja de ruta de aprendizaje.

---

## 0. Cómo usar este documento

Este documento reemplaza la lógica de la versión de escritorio (C# / WinForms) que se hizo para la facultad. **Conserva el dominio del negocio** (que estaba bien pensado) y **descarta el andamiaje académico** que no aplica a una web moderna (ver sección 13).

No se desarrolla todo de una vez. El sistema se construye por **fases con entregables semanales** (sección 12). Cada fase deja algo funcionando y entendido, no solo código pegado.

---

## 1. Visión y propósito

Reserva2 es una plataforma de **gestión de turnos/reservas** para comercios que hoy manejan sus turnos por WhatsApp o papel (canchas de pádel, peluquerías, gimnasios, consultorios, salones). Resuelve el ciclo completo: disponibilidad → reserva → pago → confirmación → cancelación/reembolso → estadísticas.

Cada comercio opera de forma aislada (**multi-tenant**) y tiene **páginas públicas de reserva** (estilo Calendly/Fresha): cualquier persona entra por un link, ve la disponibilidad y reserva; se registra/loguea solo para confirmar.

**Objetivo del proyecto:** aprender desarrollo web/móvil real de punta a punta, con la plataforma pensada para poder lanzarse en serio cuando madure (desarrollo en fases).

---

## 2. Glosario y nombres

| Término | Definición |
|---|---|
| **Administrador** | Dueño de la plataforma Reserva2. Ve todo, supervisa comercios y usuarios, puede suspender. |
| **Comerciante** | Usuario dueño de uno o más comercios. Gestiona sus comercios, sucursales, elementos, disponibilidad, reglas, reservas y pagos. (reemplaza al "Owner") |
| **Cliente** | Usuario final que reserva. |
| **Comercio** | La "marca" o negocio de un comerciante (ej: "Pádel Norte"). Agrupa sucursales. |
| **Sucursal** | Ubicación física de un comercio (ej: "Pádel Norte - Villa Urquiza"). Tiene su propia página pública de reserva, elementos y disponibilidad. |
| **Elemento reservable** | Unidad que se reserva dentro de una sucursal (una cancha, una silla, un consultorio). |
| **Disponibilidad** | Regla horaria de un elemento (día, hora inicio/fin, duración de turno). Genera slots. |
| **Slot** | Franja horaria concreta de un elemento, con estado (Libre / Reservado / Bloqueado). |
| **Reserva** | Reserva de un cliente sobre un slot, con estado (Pendiente / Confirmada / Cancelada / Expirada). |
| **Reserva temporaria** | Mientras el cliente paga, el slot queda bloqueado un tiempo configurable; si no paga, expira. |
| **Seña** | Pago parcial anticipado (porcentaje del total). |
| **Lista de espera** | Cola para un slot ocupado; al liberarse se notifica al primero. |
| **Regla de negocio** | Parámetro configurable por sucursal (minutos de expiración, máx. reservas/semana, % de seña, horas de cancelación gratis). |

---

## 3. Jerarquía del dominio

```
Administrador (plataforma)
│
└── Comerciante (usuario)
     └── Comercio (1..N por comerciante)
          └── Sucursal (1..N por comercio)   ← página pública de reserva
               └── Elemento reservable (1..N por sucursal)
                    └── Disponibilidad (reglas horarias)
                         └── Slot (franjas concretas)
                              └── Reserva ── Pago
                                   └── Lista de espera
```

Diseño **100% adaptativo, sin límites artificiales**: un comerciante puede tener N comercios, un comercio N sucursales, una sucursal N elementos.

---

## 4. Actores y roles

- **Administrador** — supervisión global: lista/suspende comercios y usuarios, ve reservas/pagos/estadísticas globales, consulta auditoría.
- **Comerciante** — autogestión de su negocio completo (comercios, sucursales, elementos, disponibilidad, reglas, reservas, pagos, estadísticas).
- **Cliente** — navega páginas públicas, reserva, paga, cancela, se anota en lista de espera, gestiona su cuenta.
- **Sistema** (jobs automáticos, no es un usuario) — expira reservas, notifica lista de espera, calcula estadísticas, genera slots.

*(Rol futuro posible: **Empleado** de una sucursal, con permisos acotados. No entra en el MVP.)*

---

## 5. Modelo de datos

Base **PostgreSQL**, ORM **Prisma**. Una sola base, migraciones versionadas. Nombres de tablas en español, en singular.

### Entidades principales

**Usuario**
`id`, `nombre`, `apellido`, `email` (único), `passwordHash`, `telefono`, `rol` (`ADMINISTRADOR` | `COMERCIANTE` | `CLIENTE`), `estado` (`ACTIVO` | `BLOQUEADO`), `createdAt`, `updatedAt`.

**Comercio**
`id`, `comercianteId` → Usuario, `nombre`, `slug` (único), `rubro`, `descripcion`, `estado` (`ACTIVO` | `INACTIVO`), `createdAt`.

**Sucursal**
`id`, `comercioId` → Comercio, `nombre`, `slug` (único, para la URL pública), `direccion`, `telefono`, `latitud?`, `longitud?`, `estado`, `publicada` (bool), `createdAt`.

**ElementoReservable**
`id`, `sucursalId` → Sucursal, `nombre`, `tipo`, `descripcion`, `precioBase`, `estado` (`ACTIVO` | `INACTIVO`).

**ReglaDisponibilidad**
`id`, `elementoId` → ElementoReservable, `diaSemana` (0-6), `horaInicio`, `horaFin`, `duracionSlotMin`, `precioOverride?`, `estado`.

**Slot**
`id`, `elementoId` → ElementoReservable, `inicio` (datetime), `fin` (datetime), `precio`, `estado` (`LIBRE` | `RESERVADO` | `BLOQUEADO`).
*(Se generan automáticamente a partir de las reglas de disponibilidad.)*

**Reserva**
`id`, `slotId` → Slot, `clienteId` → Usuario, `estado` (`PENDIENTE` | `CONFIRMADA` | `CANCELADA` | `EXPIRADA`), `expiraEn` (datetime), `monto`, `motivoCancelacion?`, `createdAt`.

**Pago**
`id`, `reservaId` → Reserva, `estado` (`INICIADO` | `APROBADO` | `RECHAZADO` | `REEMBOLSADO`), `monto`, `montoSena?`, `metodo`, `mpPreferenceId?`, `mpPaymentId?`, `createdAt`.

**ListaEspera**
`id`, `slotId` → Slot, `clienteId` → Usuario, `estado` (`ESPERANDO` | `NOTIFICADO` | `VENCIDO`), `posicion`, `createdAt`.

**ReglaNegocio**
`id`, `sucursalId` → Sucursal, `clave` (`minutos_expiracion` | `max_reservas_semana` | `porcentaje_sena` | `cancelacion_gratis_hs`), `valor`.
*(Scope por sucursal. Valores por defecto a nivel comercio heredables.)*

**EstadisticaDiaria**
`id`, `sucursalId`, `elementoId`, `fecha`, `reservasPorEstado` (jsonb), `ingresos`, `ocupacionPct`.

**LogAuditoria**
`id`, `usuarioId?`, `accion`, `entidad`, `entidadId`, `detalle`, `valorAnterior?` (jsonb), `valorNuevo?` (jsonb), `origen`, `createdAt`.

**CuentaMercadoPago** (datos de cobro del comercio)
`id`, `comercioId`, `mpAccessToken` (cifrado), `mpUserId`, `estado`. *(Reemplaza al "CBU" de la versión facu.)*

### Permisos (RBAC simple)

En vez del Composite con TreeView, un modelo **RBAC**: cada `rol` tiene un conjunto de permisos (acciones). Se puede modelar con tablas `Permiso` y `RolPermiso`, o empezar con permisos por rol fijos en código y migrar a tablas cuando haga falta. Para el MVP alcanza con los tres roles y guards por rol.

---

## 6. Arquitectura técnica

### Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Backend | **NestJS + TypeScript** | Mismos conceptos que .NET (módulos, inyección de dependencias, capas). Tu conocimiento de arquitectura transfiere casi 1:1. |
| Base de datos | **PostgreSQL** | Estándar en producción, gratis, excelente con Node. |
| ORM | **Prisma** | Amigable para aprender, migraciones claras, tipado fuerte. |
| Frontend | **React + TypeScript (Vite)** | Lo que pediste aprender. Un solo lenguaje en todo el stack. |
| Auth | **JWT** (access + refresh) | Estándar para APIs REST. |
| Pagos | **MercadoPago** (sandbox primero) | Checkout Pro + webhooks. |
| Jobs | **@nestjs/schedule** (y BullMQ si hace falta) | Reemplaza al "Timer" de WinForms. |
| Deploy | **Railway/Render** (back+DB) + **Vercel** (front) | Simple y gratis para empezar. |

### Cómo mapea tu arquitectura de 4 capas a NestJS

| Versión facu (C#) | Versión web (NestJS) |
|---|---|
| `Reserva2.UI` (WinForms) | **Frontend React** (separado) |
| `Reserva2.BLL` (lógica) | **Services** de cada módulo |
| `Reserva2.DAL` (EF Core) | **Repositories / Prisma** |
| `Reserva2.BE` (entidades) | **Entities + DTOs** |
| API (nueva capa) | **Controllers** (exponen REST) |

**Respuesta a "¿MVC o 4 capas?":** en una app web con API + SPA, el patrón es **arquitectura por capas en el backend** (Controller → Service → Repository → Domain) más un **frontend de componentes**. No es el MVC clásico de WinForms; es la evolución natural de tus 4 capas. NestJS la impone por diseño.

### Estructura de carpetas (monorepo)

```
reserva2/
├── backend/                 (NestJS)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── usuarios/
│   │   │   ├── comercios/
│   │   │   ├── sucursales/
│   │   │   ├── elementos/
│   │   │   ├── disponibilidad/
│   │   │   ├── reservas/
│   │   │   ├── pagos/
│   │   │   ├── lista-espera/
│   │   │   ├── reglas-negocio/
│   │   │   ├── estadisticas/
│   │   │   └── auditoria/
│   │   ├── common/          (guards, interceptors, filtros de error)
│   │   └── prisma/
│   └── prisma/schema.prisma
├── frontend/                (React + Vite)
│   ├── src/
│   │   ├── pages/           (públicas + panel)
│   │   ├── components/
│   │   ├── features/        (uno por dominio)
│   │   ├── api/             (cliente HTTP)
│   │   └── hooks/
└── docs/                    (este documento y decisiones)
```

Cada módulo del backend sigue el mismo esqueleto: `*.controller.ts`, `*.service.ts`, `*.repository.ts` (o Prisma directo), `dto/`, `entities/`.

---

## 7. Módulos y endpoints principales (REST)

API base: `/api/v1`. Autenticación por JWT salvo los endpoints públicos marcados.

- **auth** — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/reset-password`.
- **usuarios** — `GET /usuarios` (admin), `GET /usuarios/me`, `PATCH /usuarios/me`, `PATCH /usuarios/:id/bloquear` (admin).
- **comercios** — CRUD bajo el comerciante dueño. `GET /comercios` (los míos), `POST`, `PATCH /:id`, `PATCH /:id/estado`.
- **sucursales** — CRUD por comercio. Incluye `PATCH /:id/publicar`.
- **elementos** — CRUD por sucursal.
- **disponibilidad** — CRUD de reglas + `POST /elementos/:id/generar-slots`.
- **slots** — `GET /publico/sucursales/:slug/slots` (**público**, para la página de reserva), `PATCH /slots/:id/bloquear`, `/desbloquear`.
- **reservas** — `POST /reservas` (cliente, crea en Pendiente y bloquea slot), `GET /reservas/mias`, `GET /comercios/:id/reservas`, `PATCH /reservas/:id/cancelar`.
- **pagos** — `POST /pagos/preferencia` (genera preferencia MP), `POST /pagos/webhook` (**público**, recibe notificación MP), `GET /pagos`.
- **lista-espera** — `POST /lista-espera`, `GET /lista-espera/mias`, `DELETE /lista-espera/:id`.
- **reglas-negocio** — `GET/PUT /sucursales/:id/reglas`.
- **estadisticas** — `GET /sucursales/:id/estadisticas`, `GET /admin/estadisticas`.
- **auditoria** — `GET /auditoria` (admin, con filtros).

---

## 8. Reglas de negocio clave

1. **Reserva temporaria + expiración.** Al reservar, el slot pasa a `RESERVADO` y la reserva queda `PENDIENTE` con `expiraEn = ahora + minutos_expiracion`. Un **job** (cada minuto) busca reservas pendientes vencidas, las marca `EXPIRADA`, libera el slot y dispara la lista de espera.
2. **Pago y confirmación.** El cliente paga vía MercadoPago. El **webhook** marca el pago `APROBADO` y la reserva `CONFIRMADA`. Si el pago se rechaza, la reserva se cancela y el slot se libera.
3. **Seña parcial.** Si la sucursal tiene `porcentaje_sena`, el monto a cobrar es `precio * porcentaje`. Si no, se cobra el total.
4. **Cancelación y reembolso.** Si el cliente cancela dentro de `cancelacion_gratis_hs`, se procesa reembolso total vía MP; fuera de plazo, se retiene. Al cancelar se libera el slot y se notifica la lista de espera.
5. **Lista de espera.** Al liberarse un slot, se notifica al primero (`NOTIFICADO`); tiene una ventana para reservar; si vence, pasa al siguiente.
6. **Límite de reservas.** Se valida `max_reservas_semana` por cliente antes de crear la reserva.
7. **Estadísticas diarias.** Un **job nocturno** calcula por sucursal/elemento: reservas por estado, ingresos, % de ocupación, y las guarda en `EstadisticaDiaria`.
8. **Generación de slots.** A partir de las reglas de disponibilidad se generan slots para los próximos N días (ej: 30), respetando duración y precio override.

---

## 9. Seguridad

- **Contraseñas:** hash con **BCrypt** o **Argon2**. Nunca MD5, nunca texto plano.
- **Auth:** JWT con access token corto + refresh token. Guards de NestJS por rol.
- **Autorización:** un comerciante solo accede a SUS comercios/sucursales (validación de pertenencia en cada endpoint, no solo por rol).
- **Datos sensibles:** el access token de MercadoPago se guarda cifrado (AES) o en un secreto del entorno.
- **Validación:** DTOs con `class-validator` en todos los inputs. Nada entra a la lógica sin validar.
- **Auditoría:** las operaciones sensibles (altas/bajas/cambios de estado, pagos, cancelaciones) escriben en `LogAuditoria`.
- **Errores:** filtro global de excepciones que loguea y devuelve mensajes genéricos al cliente (sin stack traces).

---

## 10. Integración de pagos (MercadoPago)

Fase de aprendizaje y pruebas: **sandbox** (credenciales de prueba, sin plata real). Flujo:

1. Cliente confirma reserva → backend crea una **preferencia** en MP (`POST /pagos/preferencia`) con el monto (total o seña) y URLs de retorno.
2. Cliente paga en el checkout de MP.
3. MP notifica al **webhook** (`POST /pagos/webhook`) → backend verifica el pago contra la API de MP, marca el pago y confirma/cancela la reserva.
4. Reembolsos vía API de MP al cancelar dentro de plazo.

Para producción (fase de lanzamiento): credenciales reales + conexión de la cuenta MP de cada comercio (OAuth / Marketplace).

---

## 11. Frontend

Dos grandes zonas:

- **Público (sin login para navegar):** página de la sucursal por slug (`/s/:slug`) con disponibilidad y flujo de reserva. Login/registro solo al confirmar.
- **Panel (con login):** paneles diferenciados por rol.
  - *Comerciante:* dashboard, comercios, sucursales, elementos, disponibilidad/calendario, reservas, pagos, reglas, estadísticas, configuración.
  - *Administrador:* dashboard global, comercios, usuarios, reservas/pagos globales, auditoría.
  - *Cliente:* mis reservas, lista de espera, mi cuenta.

Stack de front sugerido: **React Router** (ruteo), **React Query** (datos del server), **React Hook Form + Zod** (formularios), y una librería de UI (ej: shadcn/ui o Mantine) para no pelear con CSS al principio. Diseño/UX se trabaja en Figma (ya lo usás) antes de maquetar.

---

## 12. Plan de entregables por fases

Ritmo estimado: **5-10 hs/semana**. Cada fase = un hito con algo funcionando. Los tiempos son orientativos.

| Fase | Entregable | Aprendés | Semanas aprox. |
|---|---|---|---|
| **0. Setup** | Repo, monorepo back+front, NestJS y React corriendo, Postgres conectada, "hola mundo" end-to-end. | Entorno, Git, estructura, Prisma. | 1-2 |
| **1. Auth + usuarios** | Registro/login con JWT, roles, guards, CRUD de usuarios. | NestJS módulos, JWT, hashing, DTOs. | 2-3 |
| **2. Comercios y sucursales** | CRUD de comercios y sucursales + panel React del comerciante. | Relaciones, validación de pertenencia, React Query. | 2-3 |
| **3. Elementos + disponibilidad** | CRUD de elementos, reglas de disponibilidad, generación de slots, calendario. | Lógica de dominio, fechas, jobs. | 2-3 |
| **4. Reserva pública** | Página pública por slug, flujo de reserva, expiración por job. | Endpoints públicos, estados, scheduling. | 2-3 |
| **5. Pagos (sandbox)** | Preferencia MP + webhook + seña. | Integración externa, webhooks. | 2 |
| **6. Lista de espera + cancelación** | Cola, notificación, cancelación con reembolso. | Colas, reembolsos, reglas. | 1-2 |
| **7. Estadísticas + reportes** | Job nocturno, dashboards, export PDF. | Agregaciones, visualización. | 2 |
| **8. Pulido + testing + deploy** | Tests, manejo de errores, deploy en Railway+Vercel. | Testing, CI, deploy. | 2 |
| **9. Móvil (lanzamiento)** | App React Native reusando lógica, publicación en tiendas. | Mobile, stores. | futuro |

**Primer hito "demostrable" (MVP real):** fin de la Fase 5 — un comerciante arma sucursal, elementos y disponibilidad, y un cliente reserva y paga (sandbox) desde la página pública. Eso ya es un producto.

Gestión de tareas: Trello o Jira, una columna por fase, cada CU o endpoint como tarjeta.

---

## 13. Qué se descarta de la versión facu y por qué

| Se descarta | Motivo | Reemplazo |
|---|---|---|
| DVH / DVV (dígitos verificadores) | Requisito académico; en una DB administrada no aporta. | Constraints, transacciones, log de auditoría. |
| MD5 para contraseñas | Inseguro. | BCrypt / Argon2. |
| Dos bases + capa Services ADO.NET | Complejidad innecesaria. | Una base Postgres + Prisma. |
| Permisos Composite + TreeView | UI de escritorio; sobredimensionado. | RBAC simple por rol. |
| Multi-idioma con Observer casero | Resuelto por el ecosistema. | i18n (react-i18next) cuando se necesite. |
| Backup por comandos SQL desde la app | Lo hace el hosting. | Backups automáticos de la DB administrada. |
| Instalador Inno Setup | No hay instalación: es web. | Deploy continuo. |
| CBU manual | No sirve para cobrar online. | Conexión de cuenta MercadoPago. |

Lo que **sí se conserva** del trabajo de facultad: todo el modelo de dominio, los estados de reserva/slot/pago, las reglas de negocio, los procesos, y la mentalidad de arquitectura por capas.

---

## 14. Decisiones abiertas / a revisar más adelante

- Nombres finales de roles (Comerciante vs Dueño vs Prestador).
- Scope de las reglas de negocio: por sucursal (actual) vs heredables desde comercio.
- Rol futuro "Empleado" de sucursal.
- Notificaciones: email (fase lanzamiento) y/o push en la app móvil.
- Estrategia de la app móvil: React Native vs PWA.

---

*Fin del documento. Próximo paso sugerido: Fase 0 — armar el repo y el esqueleto del monorepo.*
