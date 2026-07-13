# Gym SaaS Backend

## Purpose

`gym-saas-be` is the NestJS API for the Gym SaaS platform. It owns the HTTP
contract, authentication and authorization, tenant/gym context, PostgreSQL
data model, and file storage integration. The React frontend consumes this API
through `VITE_API_BASE_URL` with credentialed, cookie-based requests.

Main technologies:

- NestJS + TypeScript
- TypeORM + PostgreSQL
- Cookie-based access and refresh sessions
- MinIO for development file storage
- Swagger/OpenAPI at `http://localhost:3000/docs`

Do not invent frontend endpoints here: coordinate contract changes with
`gym-saas-fe` and the cross-app specification in `gym-saas-knowledge-base`.

## Local setup

Requirements:

- Node.js 22
- Docker Engine
- npm dependencies installed with `npm install`

1. Create your local environment file from `.env.example` and set local-only
   JWT secrets. Never commit `.env` or real provider credentials.
2. Start infrastructure:

   ```powershell
   docker compose up -d
   ```

   This starts PostgreSQL on port `5432`, MinIO on ports `9000` and `9001`, and
   Adminer on port `8080`.
3. Start the API in watch mode:

   ```powershell
   npm run start:dev
   ```

   The API listens on `http://localhost:3000`; Swagger is available at
   `http://localhost:3000/docs`.

To stop only this stack:

```powershell
docker compose down
```

Use `docker compose down -v` only when you intentionally want to remove local
PostgreSQL and MinIO data.

## Validation

Run commands from this repository:

```powershell
npm run lint
npm run test
npm run test:e2e
npm run build
```

E2E tests require PostgreSQL and local JWT configuration. When several e2e
suites share a database with `DB_SYNCHRONIZE=true`, run Jest in series to avoid
concurrent schema synchronization:

```powershell
npx jest --config ./test/jest-e2e.json --runInBand
```

## Working conventions

- Keep tokens out of response bodies and logs; sessions travel in HttpOnly cookies.
- Treat Swagger/OpenAPI annotations and frontend DTOs as part of the API contract.
- Keep changes scoped to this repository unless the feature changes the frontend contract.
- For backend + frontend work, update the matching cross-spec mirror under
  `cross-specs/` and the source spec in `gym-saas-knowledge-base`.
