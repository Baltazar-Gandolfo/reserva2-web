import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ComercioDetalle } from './pages/ComercioDetalle';
import { ComercioNuevo } from './pages/ComercioNuevo';
import { ComerciosLista } from './pages/ComerciosLista';
import { Inicio } from './pages/Inicio';
import { Login } from './pages/Login';
import { Panel } from './pages/Panel';
import { Registro } from './pages/Registro';

// Tabla de rutas (como el routing de MVC, pero en el navegador: cambia la pantalla sin recargar la página).
function App() {
  return (
    <main className="contenedor">
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro/cliente" element={<Registro tipo="cliente" />} />
        <Route path="/registro/comerciante" element={<Registro tipo="comerciante" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/panel" element={<Panel />} />
          <Route path="/comercios" element={<ComerciosLista />} />
          <Route path="/comercios/nuevo" element={<ComercioNuevo />} />
          <Route path="/comercios/:id" element={<ComercioDetalle />} />
        </Route>
      </Routes>
    </main>
  );
}

export default App;
