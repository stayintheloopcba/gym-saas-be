import { Injectable } from '@nestjs/common';
import { authContextStorage } from './auth-context.store';

/**
 * Costura (seam) de acceso al contexto de autenticación del request actual.
 *
 * Es el único punto de acceso al contexto para servicios, guards y controladores
 * inyectables. Si en el futuro cambia el mecanismo de almacenamiento
 * (AsyncLocalStorage → nestjs-cls → request-scoped providers), solo cambia este
 * servicio; ningún consumidor se entera.
 *
 * Excepción: `BaseAuditEntity` lee el store directamente porque las entidades no
 * pueden recibir inyección de dependencias.
 */
@Injectable()
export class AuthContextService {
  getRequestId(): string | undefined {
    return authContextStorage.getStore()?.requestId;
  }

  getAccountId(): string | undefined {
    return authContextStorage.getStore()?.accountId;
  }

  getSessionId(): string | undefined {
    return authContextStorage.getStore()?.sessionId;
  }

  /**
   * Organización activa validada del request, o `undefined` si no hay ninguna
   * (usuario sin org seleccionada, o cookie inválida/obsoleta que el middleware
   * descartó). El código de negocio scopea sus queries a este valor.
   */
  getActiveOrganizationId(): string | undefined {
    return authContextStorage.getStore()?.activeOrganizationId;
  }
}
