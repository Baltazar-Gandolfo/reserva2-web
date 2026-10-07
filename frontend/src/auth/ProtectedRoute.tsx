import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Ruta protegida: si no hay usuario logueado, redirige al login. <Outlet/> renderiza la ruta hija.
// Es el equivalente en el front de [Authorize]; la seguridad real igual la impone el backend.
export function ProtectedRoute() {
  const { usuario } = useAuth();
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}
