-- CreateEnum
CREATE TYPE "EstadoRecurso" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "UnidadBase" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnidadBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecursoReservable" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "EstadoRecurso" NOT NULL DEFAULT 'ACTIVO',
    "duracionBaseMin" INTEGER NOT NULL,
    "duracionMinMin" INTEGER NOT NULL,
    "duracionMaxMin" INTEGER NOT NULL,
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT false,
    "anticipacionMinCancelacionHoras" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoReservable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecursoUnidad" (
    "recursoId" INTEGER NOT NULL,
    "unidadId" INTEGER NOT NULL,

    CONSTRAINT "RecursoUnidad_pkey" PRIMARY KEY ("recursoId","unidadId")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoReserva" NOT NULL,
    "clienteId" INTEGER,
    "nombreContacto" TEXT,
    "telefonoContacto" TEXT,
    "canceladaDentroDePlazo" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnidadBase_sucursalId_idx" ON "UnidadBase"("sucursalId");

-- CreateIndex
CREATE INDEX "RecursoReservable_sucursalId_idx" ON "RecursoReservable"("sucursalId");

-- CreateIndex
CREATE INDEX "RecursoUnidad_unidadId_idx" ON "RecursoUnidad"("unidadId");

-- CreateIndex
CREATE INDEX "Reserva_recursoId_horaInicio_idx" ON "Reserva"("recursoId", "horaInicio");

-- CreateIndex
CREATE INDEX "Reserva_clienteId_idx" ON "Reserva"("clienteId");

-- AddForeignKey
ALTER TABLE "UnidadBase" ADD CONSTRAINT "UnidadBase_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoReservable" ADD CONSTRAINT "RecursoReservable_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoUnidad" ADD CONSTRAINT "RecursoUnidad_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoReservable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoUnidad" ADD CONSTRAINT "RecursoUnidad_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "UnidadBase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoReservable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
