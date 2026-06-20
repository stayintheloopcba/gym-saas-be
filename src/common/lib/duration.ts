/**
 * Convierte una duración tipo `"7d"`, `"48h"`, `"30m"`, `"15s"` o `"1000ms"` a
 * milisegundos. Un número sin unidad se interpreta como milisegundos.
 *
 * Se usa para `INVITATION_TTL` (TTL de invitaciones) sin sumar una dependencia.
 * Lanza si el formato es inválido para fallar temprano en el arranque/uso.
 */
const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationMs(input: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration: "${input}"`);
  }
  const value = Number(match[1]);
  const unit = match[2] ?? 'ms';
  return value * UNIT_MS[unit];
}
