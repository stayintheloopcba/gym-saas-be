import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { AppModule } from './../src/app.module';

/**
 * Flujo de auth de punta a punta: register → login → /auth/me con cookie jar.
 *
 * Requiere Postgres corriendo (`docker compose up -d`) y las variables JWT_*
 * definidas en el entorno (.env). Mirrorea la configuración de `main.ts`.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const email = `e2e_${Date.now()}@example.com`;
  const password = 'plain12345';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user, setting httpOnly cookies and no token in the body', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'E2E', gymName: 'E2E Gym' })
      .expect(201);

    expect(res.body.email).toBe(email);
    expect(res.body.passwordHash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('eyJ'); // ningún JWT en el body

    const cookies = res.headers['set-cookie'] as unknown as string[];
    const access = cookies.find((c) => c.startsWith('access_token='));
    expect(access).toBeDefined();
    expect(access?.toLowerCase()).toContain('httponly');
  });

  it('rejects a duplicate registration with 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'E2E', gymName: 'E2E Gym' });
    expect(res.status).toBe(409);
  });

  it('logs in and reaches /auth/me with the session cookie', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/login').send({ email, password }).expect(200);

    const me = await agent.get('/auth/me').expect(200);
    expect(me.body.email).toBe(email);
  });

  it('rejects /auth/me without a session', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects login with a wrong password', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'wrongpass' });
    expect(res.status).toBe(401);
  });
});
