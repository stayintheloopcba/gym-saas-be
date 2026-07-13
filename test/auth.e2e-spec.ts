import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { AppModule } from './../src/app.module';
import { GoogleAuthUseCase } from './../src/modules/auth/application/google-auth.use-case';

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
    expect(res.body).toMatchObject({ code: 'EMAIL_ALREADY_REGISTERED' });
    expect(JSON.stringify(res.body)).not.toContain(email);
  });

  it('logs in and reaches /auth/me with the session cookie', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    const accessCookie = (login.headers['set-cookie'] as unknown as string[]).find((cookie) =>
      cookie.startsWith('access_token='),
    );

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', accessCookie as string)
      .expect(200);
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

  it('rotates refresh cookies and rejects reuse of a rotated refresh token', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    const initialRefresh = (login.headers['set-cookie'] as unknown as string[]).find((cookie) =>
      cookie.startsWith('refresh_token='),
    );
    expect(initialRefresh).toBeDefined();

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', initialRefresh as string)
      .expect(200);
    const cookies = refreshed.headers['set-cookie'] as unknown as string[];
    expect(cookies.find((cookie) => cookie.startsWith('access_token='))?.toLowerCase()).toContain('httponly');
    expect(cookies.find((cookie) => cookie.startsWith('refresh_token='))?.toLowerCase()).toContain('path=/auth');

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', initialRefresh as string)
      .expect(401);
  });

  it('logs out idempotently, clearing session and active-gym cookies', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    const loginCookies = login.headers['set-cookie'] as unknown as string[];
    const accessCookie = loginCookies.find((cookie) => cookie.startsWith('access_token='));
    const refreshCookie = loginCookies.find((cookie) => cookie.startsWith('refresh_token='));

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', refreshCookie as string)
      .expect(200);
    expect(logout.body).toEqual({ success: true });
    const clearedCookies = logout.headers['set-cookie'] as unknown as string[];
    expect(clearedCookies.some((cookie) => cookie.startsWith('access_token='))).toBe(true);
    expect(clearedCookies.some((cookie) => cookie.startsWith('refresh_token='))).toBe(true);
    expect(clearedCookies.some((cookie) => cookie.startsWith('active_gym='))).toBe(true);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', accessCookie as string)
      .expect(401);
    await request(app.getHttpServer()).post('/auth/logout').expect(200);
  });

  it('reports onboarding for new and returning Google users and links a local account by email', async () => {
    const google = app.get(GoogleAuthUseCase);
    const googleEmail = `google_${Date.now()}@example.com`;
    const firstGoogleLogin = await google.execute({
      googleId: `google-${Date.now()}`,
      email: googleEmail,
      name: 'Google User',
    });
    const onboarding = await request(app.getHttpServer())
      .get('/onboarding/status')
      .set('Cookie', `access_token=${firstGoogleLogin.tokens.accessToken}`)
      .expect(200);
    expect(onboarding.body).toMatchObject({
      needsOnboarding: true,
      gymsCount: 0,
      hasActiveGym: false,
      activeGymId: null,
    });

    const returningGoogleId = `returning-${Date.now()}`;
    const returningGoogleEmail = `returning_${Date.now()}@example.com`;
    const returningGoogleLogin = await google.execute({
      googleId: returningGoogleId,
      email: returningGoogleEmail,
      name: 'Returning User',
    });
    const sameGoogleLogin = await google.execute({
      googleId: returningGoogleId,
      email: returningGoogleEmail,
      name: 'Returning User',
    });
    expect(sameGoogleLogin.user.id).toBe(returningGoogleLogin.user.id);

    const localEmail = `linked_${Date.now()}@example.com`;
    const local = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: localEmail, password, name: 'Linked Local', gymName: 'Linked Gym' })
      .expect(201);
    const linked = await google.execute({ googleId: `linked-${Date.now()}`, email: localEmail, name: 'Linked Local' });
    expect(linked.user.id).toBe(local.body.id);
  });
});
