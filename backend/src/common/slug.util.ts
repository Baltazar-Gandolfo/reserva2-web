// Formato válido de un slug: minúsculas/números separados por guiones simples ("padel-norte-2").
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX = 60;

// "Pádel Norte & Cía!" -> "padel-norte-cia"
export function slugify(texto: string): string {
  const slug = texto
    .normalize('NFD') // separa la letra de su tilde: "á" -> "a" + "´"
    .replace(/[̀-ͯ]/g, '') // borra las tildes sueltas
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // todo lo que no es letra/número pasa a guion
    .replace(/^-+|-+$/g, '') // sin guiones al principio ni al final
    .slice(0, SLUG_MAX - 5) // deja lugar para un sufijo "-123"
    .replace(/-+$/g, '');
  return slug || 'comercio'; // si el nombre era solo símbolos
}

// Devuelve el primer slug libre: base, base-2, base-3...
// `ocupados` son los slugs existentes que empiezan con `base` (una sola consulta a la base).
export function primerSlugLibre(base: string, ocupados: Iterable<string>): string {
  const usados = new Set(ocupados);
  if (!usados.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidato = `${base}-${n}`;
    if (!usados.has(candidato)) return candidato;
  }
}
