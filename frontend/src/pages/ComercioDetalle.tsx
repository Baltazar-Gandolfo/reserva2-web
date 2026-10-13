import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Comercio, Sucursal } from '../api';
import { useAuth } from '../auth/AuthContext';

const vacio = { nombre: '', direccion: '', telefono: '', horarioTexto: '' };

// Detalle de un comercio + sus sucursales y alta de una nueva.
export function ComercioDetalle() {
  const { id } = useParams(); // parámetro de la URL (/comercios/:id), siempre string
  const { authRequest } = useAuth();
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[] | null>(null);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([
        authRequest<Comercio>(`/comercios/${id}`),
        authRequest<Sucursal[]>(`/comercios/${id}/sucursales`),
      ]);
      setComercio(c);
      setSucursales(s);
    } catch (e) {
      setError((e as Error).message); // ej: 403 "Este comercio no te pertenece"
    }
  }, [authRequest, id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorForm(null);
    setCargando(true);
    try {
      const { telefono, horarioTexto, ...obligatorios } = form;
      await authRequest(`/comercios/${id}/sucursales`, {
        method: 'POST',
        body: { ...obligatorios, ...(telefono && { telefono }), ...(horarioTexto && { horarioTexto }) },
      });
      setForm(vacio);
      await cargar();
    } catch (err) {
      setErrorForm((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(s: Sucursal) {
    const estado = s.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA'; // "eliminar" = desactivar
    try {
      await authRequest(`/sucursales/${s.id}`, { method: 'PATCH', body: { estado } });
      await cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const campo = (name: keyof typeof vacio) => ({
    value: form[name],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [name]: e.target.value }),
  });

  if (error) return <><p><Link to="/comercios">← Mis comercios</Link></p><p className="error">{error}</p></>;
  if (!comercio || !sucursales) return <p>Cargando…</p>;

  return (
    <>
      <h1>{comercio.nombre}</h1>
      <p><Link to="/comercios">← Mis comercios</Link></p>
      <p>
        <Link to={`/c/${comercio.slug}`}>/c/{comercio.slug}</Link> · {comercio.estado} · <Link to={`/comercios/${comercio.id}/reservas`}>Ver reservas</Link>
        {comercio.descripcion && <><br />{comercio.descripcion}</>}
      </p>

      <h2>Sucursales</h2>
      {sucursales.length === 0 ? (
        <p>Este comercio todavía no tiene sucursales.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Nombre</th><th>Dirección</th><th>Teléfono</th><th>Horario</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {sucursales.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.nombre}<br />
                  <Link to={`/sucursales/${s.id}`} state={{ nombre: s.nombre, comercioId: comercio.id }}>Unidades y recursos</Link>
                </td>
                <td>{s.direccion}</td><td>{s.telefono ?? '—'}</td>
                <td>{s.horarioTexto ?? '—'}</td><td>{s.estado}</td>
                <td><button onClick={() => cambiarEstado(s)}>{s.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Nueva sucursal</h3>
      <form onSubmit={onSubmit}>
        <label>Nombre<input {...campo('nombre')} required maxLength={100} /></label>
        <label>Dirección<input {...campo('direccion')} required maxLength={200} /></label>
        <label>Teléfono (opcional)<input {...campo('telefono')} maxLength={30} /></label>
        <label>Horario (texto libre, opcional)<input {...campo('horarioTexto')} maxLength={200} placeholder="Lun a Vie 9-22, Sáb-Dom 9-20" /></label>
        {errorForm && <p className="error">{errorForm}</p>}
        <button disabled={cargando}>{cargando ? 'Guardando…' : 'Agregar sucursal'}</button>
      </form>
    </>
  );
}
