// Cliente HTTP mínimo sobre fetch (en .NET sería un HttpClient tipado).
// import.meta.env = variables de entorno de Vite (solo las que empiezan con VITE_).
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: string; body?: unknown; token?: string | null };

export async function request<T>(path: string, { method = 'GET', body, token }: Options = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // El backend devuelve `message` como texto, o como lista cuando fallan varias validaciones.
    const msg = Array.isArray(data?.message) ? data.message.join('. ') : (data?.message ?? `Error ${res.status}`);
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export type Rol = 'ADMINISTRADOR' | 'COMERCIANTE' | 'CLIENTE';

export type Comercio = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
  comercianteId: number;
};

export type Sucursal = {
  id: number;
  comercioId: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  horarioTexto: string | null;
  estado: 'ACTIVA' | 'INACTIVA';
};

export type Unidad = { id: number; sucursalId: number; nombre: string };

export type Recurso = {
  id: number;
  sucursalId: number;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
  duracionBaseMin: number;
  duracionMinMin: number;
  duracionMaxMin: number;
  requiereAprobacion: boolean;
  anticipacionMinCancelacionHoras: number;
  unidadIds: number[];
};

// Lo que expone la ruta pública (sin unidades ni estado).
export type RecursoPublico = Omit<Recurso, 'sucursalId' | 'estado' | 'unidadIds'>;

export type SucursalPublica = {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  horarioTexto: string | null;
  recursos: RecursoPublico[];
};

export type ComercioPublico = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  sucursales: SucursalPublica[];
};

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA';

export type Reserva = {
  id: number;
  recursoId: number;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReserva;
  clienteId: number | null;
  nombreContacto: string | null;
  telefonoContacto: string | null;
  canceladaDentroDePlazo: boolean | null;
  recurso: {
    id: number;
    nombre: string;
    anticipacionMinCancelacionHoras: number;
    sucursal: {
      id: number;
      nombre: string;
      direccion: string;
      telefono: string | null;
      comercio: { id: number; nombre: string; slug: string };
    };
  };
  cliente: { id: number; nombre: string; apellido: string; email: string; telefono: string | null } | null;
};

export type Horario = {
  inicio: string;
  hora: string;
  libre: boolean;
  motivo?: 'OCUPADO' | 'PASADO';
  duracionesDisponiblesMin: number[];
};

export type Disponibilidad = {
  recursoId: number;
  fecha: string;
  horarios: Horario[];
};

export type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  username: string | null;
  telefono: string | null;
  rol: Rol;
  estado: 'ACTIVO' | 'BLOQUEADO';
};
