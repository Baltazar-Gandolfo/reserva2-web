import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, request, type Usuario } from '../api';

type Tokens = { accessToken: string; refreshToken: string };

type AuthContextValue = {
  usuario: Usuario | null;
  login: (identificador: string, password: string) => Promise<void>;
  logout: () => void;
  // fetch autenticado: agrega el access token y, si vence (401), lo renueva una vez con el refresh token.
  authRequest: <T>(path: string, options?: { method?: string; body?: unknown }) => Promise<T>;
};

// Context = estado global accesible desde cualquier componente sin pasarlo por props
// (parecido a un servicio singleton inyectado). Los tokens viven SOLO en memoria: al recargar la página
// se pierde la sesión. Es intencional por ahora (no usamos localStorage).
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const tokens = useRef<Tokens | null>(null); // useRef: valor mutable que no dispara re-render

  const logout = useCallback(() => {
    tokens.current = null;
    setUsuario(null);
  }, []);

  const login = useCallback(async (identificador: string, password: string) => {
    const res = await request<Tokens & { usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: { identificador, password },
    });
    tokens.current = { accessToken: res.accessToken, refreshToken: res.refreshToken };
    setUsuario(res.usuario);
  }, []);

  const authRequest = useCallback(
    async <T,>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> => {
      try {
        return await request<T>(path, { ...options, token: tokens.current?.accessToken });
      } catch (e) {
        if (!(e instanceof ApiError) || e.status !== 401 || !tokens.current) throw e;
        try {
          tokens.current = await request<Tokens>('/auth/refresh', {
            method: 'POST',
            body: { refreshToken: tokens.current.refreshToken },
          });
        } catch {
          logout(); // el refresh también venció: hay que loguearse de nuevo
          throw e;
        }
        return request<T>(path, { ...options, token: tokens.current.accessToken });
      }
    },
    [logout],
  );

  const value = useMemo(() => ({ usuario, login, logout, authRequest }), [usuario, login, logout, authRequest]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook propio: los componentes hacen `const { usuario } = useAuth()`.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
