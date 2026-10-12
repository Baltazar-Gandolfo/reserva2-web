-- CreateEnum
CREATE TYPE "EstadoComercio" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoSucursal" AS ENUM ('ACTIVA', 'INACTIVA');

-- CreateTable
CREATE TABLE "Comercio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoComercio" NOT NULL DEFAULT 'ACTIVO',
    "comercianteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comercio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "horarioTexto" TEXT,
    "estado" "EstadoSucursal" NOT NULL DEFAULT 'ACTIVA',
    "comercioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Comercio_slug_key" ON "Comercio"("slug");

-- CreateIndex
CREATE INDEX "Comercio_comercianteId_idx" ON "Comercio"("comercianteId");

-- CreateIndex
CREATE INDEX "Sucursal_comercioId_idx" ON "Sucursal"("comercioId");

-- AddForeignKey
ALTER TABLE "Comercio" ADD CONSTRAINT "Comercio_comercianteId_fkey" FOREIGN KEY ("comercianteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
