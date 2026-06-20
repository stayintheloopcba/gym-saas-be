/**
 * Convierte un texto libre en un slug URL-safe: minúsculas, sin diacríticos,
 * separado por guiones y sin caracteres no alfanuméricos.
 *
 * Ej.: "Acme  Inc. — Ñandú" → "acme-inc-nandu".
 */
export function slugify(input: string): string {
  const hyphenated = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos/diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-'); // cualquier carácter no alfanumérico → guion

  // Recorta guiones de los extremos con operaciones de string (evita un regex
  // anclado con cuantificador ilimitado, marcado como riesgo de ReDoS).
  let start = 0;
  let end = hyphenated.length;
  while (start < end && hyphenated[start] === '-') start += 1;
  while (end > start && hyphenated[end - 1] === '-') end -= 1;
  return hyphenated.slice(start, end);
}
