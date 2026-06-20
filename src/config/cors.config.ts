const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

/**
 * Parses the explicit CORS allowlist. `FRONTEND_URL` remains the canonical
 * browser redirect target, while `CORS_ORIGINS` may include additional local
 * origins such as a fallback Vite port.
 */
export function resolveCorsOrigins(corsOrigins?: string, frontendUrl?: string): string[] {
  const configuredOrigins = corsOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return [...new Set(configuredOrigins)];
  }

  return [frontendUrl?.trim() || DEFAULT_FRONTEND_URL];
}
