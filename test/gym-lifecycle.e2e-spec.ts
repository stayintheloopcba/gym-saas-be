import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { AppModule } from './../src/app.module';

/**
 * Jar de cookies manual: `supertest`/`superagent` respetan el atributo
 * `Domain` de las cookies (acá `COOKIE_DOMAIN=localhost`), pero las
 * requests in-process de `supertest` viajan como `127.0.0.1`, así que
 * `request.agent()` nunca reenvía las cookies de sesión (mismatch de
 * dominio). Se maneja el header `Cookie` a mano en su lugar.
 */
class CookieJar {
  private readonly cookies = new Map<string, string>();

  capture(res: request.Response): void {
    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    for (const raw of setCookie ?? []) {
      const [pair] = raw.split(';');
      const [name, value] = pair.split('=');
      this.cookies.set(name, value);
    }
  }

  header(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

/**
 * Flujo completo de punta a punta de la feature `data-model-migration`
 * (tarea 23): register (owner + gym) → branch/plan setup → registrar member
 * → otorgar acceso al portal → suscribir → pagar → check-in → asignar rutina
 * → registrar progreso. Un solo actor (el owner, con `ALL_PERMISSIONS`) para
 * mantenerlo enfocado en el contrato HTTP; las reglas de RBAC por rol ya
 * están cubiertas por los tests unitarios de cada use case.
 *
 * Requiere Postgres corriendo (`docker compose up -d`) y las variables JWT_*
 * definidas en el entorno (.env).
 */
describe('Gym lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let jar: CookieJar;

  const req = () => request(app.getHttpServer());
  const authed = (fn: (r: ReturnType<typeof req>) => request.Test) => fn(req()).set('Cookie', jar.header());

  const ownerEmail = `e2e_owner_${Date.now()}@example.com`;
  const studentEmail = `e2e_student_${Date.now()}@example.com`;

  let gymId: string;
  let studentRoleId: string;
  let branchId: string;
  let disciplineId: string;
  let planId: string;
  let memberId: string;
  let subscriptionId: string;
  let routineId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    jar = new CookieJar();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers the owner, creating their gym in the same step', async () => {
    const res = await req()
      .post('/auth/register')
      .send({ email: ownerEmail, password: 'plain12345', name: 'Owner E2E', gymName: `E2E Gym ${Date.now()}` })
      .expect(201);
    jar.capture(res);

    expect(res.body.email).toBe(ownerEmail);

    const gyms = await authed((r) => r.get('/gyms')).expect(200);
    expect(gyms.body).toHaveLength(1);
    gymId = gyms.body[0].id;
    expect(gyms.body[0].role.key).toBe('owner');
  });

  it('resolves the seeded student role', async () => {
    const res = await authed((r) => r.get(`/gyms/${gymId}/roles`)).expect(200);
    const student = res.body.find((role: { key: string }) => role.key === 'student');
    expect(student).toBeDefined();
    studentRoleId = student.id;
  });

  it('creates a branch and offers a discipline there', async () => {
    const branch = await authed((r) => r.post(`/gyms/${gymId}/branches`).send({ name: 'Main branch' })).expect(201);
    branchId = branch.body.id;

    const disciplines = await authed((r) => r.get('/disciplines')).expect(200);
    expect(disciplines.body.length).toBeGreaterThan(0);
    disciplineId = disciplines.body[0].id;

    await authed((r) =>
      r.put(`/gyms/${gymId}/branches/${branchId}/disciplines`).send({ disciplineIds: [disciplineId] }),
    ).expect(200);
  });

  it('creates a plan scoped to that branch and discipline', async () => {
    const plan = await authed((r) =>
      r.post(`/gyms/${gymId}/plans`).send({
        name: 'Full access',
        price: 15000,
        currency: 'ARS',
        periodicity: 'MONTHLY',
        branchIds: [branchId],
        disciplineIds: [disciplineId],
      }),
    ).expect(201);

    planId = plan.body.id;
    expect(plan.body.branchIds).toEqual([branchId]);
  });

  it('registers a member without a login', async () => {
    const res = await authed((r) =>
      r.post(`/gyms/${gymId}/members`).send({ roleId: studentRoleId, firstName: 'Ada', lastName: 'Lovelace' }),
    ).expect(201);

    memberId = res.body.id;
    expect(res.body.status).toBe('ACTIVE');
  });

  it('grants portal access to the member', async () => {
    const res = await authed((r) => r.post(`/gyms/${gymId}/members/${memberId}/user`).send({ email: studentEmail }));

    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBe(memberId);
  });

  it('subscribes the member to the plan', async () => {
    const res = await authed((r) => r.post(`/gyms/${gymId}/subscriptions`).send({ memberId, planId })).expect(201);

    subscriptionId = res.body.id;
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.paidUntil).toBeNull();
  });

  it('records a payment, extending the paid-up-to date', async () => {
    const periodStart = new Date().toISOString().slice(0, 10);
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const res = await authed((r) =>
      r
        .post(`/gyms/${gymId}/payments`)
        .send({ memberId, subscriptionId, amount: 15000, method: 'CASH', periodStart, periodEnd }),
    ).expect(201);

    expect(res.body.status).toBe('PAID');

    const subscription = await authed((r) => r.get(`/gyms/${gymId}/subscriptions`)).expect(200);
    const updated = subscription.body.find((s: { id: string }) => s.id === subscriptionId);
    expect(updated.paidUntil).toBe(periodEnd);
  });

  it('checks the member in and is granted (paid, not overdue)', async () => {
    const res = await authed((r) => r.post(`/gyms/${gymId}/access-logs/check-in`).send({ memberId, branchId })).expect(
      201,
    );

    expect(res.body.result).toBe('GRANTED');
    expect(res.body.reason).toBeNull();
  });

  it('creates a template routine and assigns it to the member', async () => {
    const routine = await authed((r) =>
      r.post(`/gyms/${gymId}/routines`).send({
        scope: 'TEMPLATE',
        name: 'Beginner strength',
        items: [{ exerciseName: 'Back squat', sets: 4, reps: '8-12', order: 0 }],
      }),
    ).expect(201);

    routineId = routine.body.id;

    const assignment = await authed((r) =>
      r.post(`/gyms/${gymId}/routines/${routineId}/assignments`).send({ memberId }),
    ).expect(201);

    expect(assignment.body.routineId).toBe(routineId);
    expect(assignment.body.memberId).toBe(memberId);
    expect(assignment.body.unassignedAt).toBeNull();

    const memberRoutines = await authed((r) => r.get(`/gyms/${gymId}/members/${memberId}/routines`)).expect(200);
    expect(memberRoutines.body).toHaveLength(1);
    expect(memberRoutines.body[0].routine.id).toBe(routineId);
  });

  it('rejects assigning the same routine to the member twice while active', async () => {
    const res = await authed((r) => r.post(`/gyms/${gymId}/routines/${routineId}/assignments`).send({ memberId }));
    expect(res.status).toBe(409);
  });

  it("records the member's training progress against a routine item", async () => {
    const routine = await authed((r) => r.get(`/gyms/${gymId}/routines/${routineId}`)).expect(200);
    const routineItemId = routine.body.items[0].id;

    const res = await authed((r) =>
      r.post(`/gyms/${gymId}/members/${memberId}/progress`).send({ routineItemId, value: 82.5, reps: 10 }),
    ).expect(201);

    expect(res.body.memberId).toBe(memberId);
    expect(res.body.value).toBe(82.5);

    const progress = await authed((r) => r.get(`/gyms/${gymId}/members/${memberId}/progress`)).expect(200);
    expect(progress.body).toHaveLength(1);
  });
});
