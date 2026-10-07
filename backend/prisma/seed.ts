// Seed = script que carga datos iniciales. Se corre con `npm run seed` (≈ un DbInitializer/HasData de EF Core).
// Crea el ADMINISTRADOR inicial, ya que no existe registro público de administradores.
// Es idempotente: si el admin ya existe, no lo toca (se puede correr muchas veces).
//
// ⚠️ Las credenciales por defecto son SOLO DESARROLLO: cambiar ADMIN_* en el entorno de producción.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, Rol } from '../src/generated/prisma/client.js';

const email = (process.env.ADMIN_EMAIL ?? 'admin@reserva2.local').toLowerCase();
const username = (process.env.ADMIN_USERNAME ?? 'admin').toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!'; // ⚠️ cambiar en producción

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  const existente = await prisma.usuario.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existente) {
    console.log(`Admin ya existente (${existente.email}), no se modifica.`);
  } else {
    await prisma.usuario.create({
      data: {
        nombre: 'Admin',
        apellido: 'Reserva2',
        email,
        username,
        passwordHash: await bcrypt.hash(password, 10),
        rol: Rol.ADMINISTRADOR,
      },
    });
    console.log(`Admin creado: usuario "${username}" / email "${email}".`);
  }
} finally {
  await prisma.$disconnect();
}
