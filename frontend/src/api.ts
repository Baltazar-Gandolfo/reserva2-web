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
