/** Token de inyección para el port `TokenService`. */
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

/** Payload que viaja en los JWT. `sub` es el id del usuario. */
export interface TokenPayload {
  sub: string;
  email: string;
  sessionId: string;
}

/** Par de tokens emitido en cada autenticación exitosa. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Port de emisión/verificación de tokens. La implementación (JWT) vive en
 * infraestructura, con secretos y TTLs distintos para access y refresh.
 */
export interface TokenService {
  issueTokens(payload: TokenPayload): Promise<TokenPair>;
  verifyAccess(token: string): Promise<TokenPayload>;
  verifyRefresh(token: string): Promise<TokenPayload>;
}
