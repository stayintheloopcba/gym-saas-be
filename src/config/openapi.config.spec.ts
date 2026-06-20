import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SwaggerModule } from '@nestjs/swagger';
import { ACCESS_TOKEN_SECURITY, buildOpenApiConfig } from './openapi.config';

@Controller('openapi-test')
class OpenApiTestController {
  @Get()
  check(): { ok: true } {
    return { ok: true };
  }
}

describe('OpenAPI configuration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OpenApiTestController],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('generates a document with the API metadata, route and cookie security schemes', () => {
    const document = SwaggerModule.createDocument(app, buildOpenApiConfig());

    expect(document.info.title).toBe('Generic SaaS API');
    expect(document.paths).toHaveProperty('/openapi-test');
    expect(document.components?.securitySchemes).toHaveProperty(ACCESS_TOKEN_SECURITY);
    expect(document.components?.securitySchemes).toHaveProperty('refresh-token');
    expect(document.components?.securitySchemes).toHaveProperty('active-organization');
  });
});
