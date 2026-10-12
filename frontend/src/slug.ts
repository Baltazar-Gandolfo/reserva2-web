// Misma regla que el backend (backend/src/common/slug.util.ts), solo para mostrar la vista previa en vivo.
// El backend sigue siendo quien decide el slug final (agrega -2, -3... si ya existe).
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 55)
    .replace(/-+$/g, '');
}
