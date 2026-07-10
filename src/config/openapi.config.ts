import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const ACCESS_TOKEN_SECURITY = 'access-token';
export const REFRESH_TOKEN_SECURITY = 'refresh-token';
export const ACTIVE_GYM_SECURITY = 'active-gym';

export function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Generic SaaS API')
    .setDescription('Reusable multi-gym SaaS backend API.')
    .setVersion('1.0')
    .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie' }, ACCESS_TOKEN_SECURITY)
    .addCookieAuth('refresh_token', { type: 'apiKey', in: 'cookie' }, REFRESH_TOKEN_SECURITY)
    .addCookieAuth('active_gym', { type: 'apiKey', in: 'cookie' }, ACTIVE_GYM_SECURITY)
    .build();
}

export function setupOpenApi(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, buildOpenApiConfig());
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    customSiteTitle: 'Generic SaaS API',
  });
}
