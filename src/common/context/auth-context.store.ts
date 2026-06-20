import { AsyncLocalStorage } from 'async_hooks';

export interface AuthContext {
  /** Identificador de correlación único para el request actual. */
  requestId: string;

  /** Identificador del usuario autenticado en el request actual. */
  accountId?: string;

  /** Identificador de la sesión persistida asociada al access token. */
  sessionId?: string;

  /**
   * Organización activa del request. Solo se setea cuando el middleware confirmó
   * que el usuario tiene una membresía activa en ella (la cookie `active_org`
   * nunca se confía por sí sola). Ausente = sin organización activa.
   */
  activeOrganizationId?: string;
}

/**
 * Almacenamiento de contexto de autenticación por request.
 *
 * Usa AsyncLocalStorage de Node.js para garantizar aislamiento total entre
 * requests concurrentes (evita race conditions de variables globales).
 *
 * Lo puebla el middleware/guard de auth (Fase 2). `BaseAuditEntity` lo lee
 * directamente porque las entidades no pueden recibir inyección de dependencias.
 */
export const authContextStorage = new AsyncLocalStorage<AuthContext>();
