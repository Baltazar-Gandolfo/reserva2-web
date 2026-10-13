-- Reglas que el schema de Prisma no puede expresar: la base las impone aunque el código falle.

-- Una reserva es de un cliente con cuenta O de un contacto sin cuenta (nunca ambos, nunca ninguno).
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_cliente_o_contacto_check" CHECK (
  ("clienteId" IS NOT NULL AND "nombreContacto" IS NULL AND "telefonoContacto" IS NULL)
  OR
  ("clienteId" IS NULL AND "nombreContacto" IS NOT NULL AND "telefonoContacto" IS NOT NULL)
);

ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_rango_check" CHECK ("horaFin" > "horaInicio");

ALTER TABLE "RecursoReservable" ADD CONSTRAINT "RecursoReservable_duraciones_check" CHECK (
  "duracionBaseMin" > 0
  AND "duracionMinMin" > 0
  AND "duracionMinMin" <= "duracionMaxMin"
  AND "duracionMinMin" % "duracionBaseMin" = 0
  AND "duracionMaxMin" % "duracionBaseMin" = 0
  AND "anticipacionMinCancelacionHoras" >= 0
);