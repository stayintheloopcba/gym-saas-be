## Context

The backend (`generic-saas-be`, NestJS + TypeORM + PostgreSQL) finished Phase 1: global `ValidationPipe`, `AllExceptionsFilter`, CORS with `credentials: true`, TypeORM wiring, base entities (`BaseEntity` UUID + `BaseAuditEntity` soft delete + audit), a request-scoped `authContextStorage` (`AsyncLocalStorage`), and a health module. No domain entities or auth exist yet.

This change implements Phase 2 (Auth) and, because it is the first feature module, sets the **DDD layering reference** that later modules (organizations, memberships, roles, resources) will copy. Constraints from CLAUDE.md: code in English, UUIDs, soft delete, DTOs + class-validator, httpOnly cookies for tokens, Postman (not Swagger), multi-tenant *by design*.

## Goals / Non-Goals

**Goals:**
- A `User` aggregate with email/password and OAuth provider support.
- Email/password register + login with bcrypt; Google OAuth sign-in.
- JWT access + refresh tokens in `httpOnly` cookies, never exposed to JS.
- `JwtAuthGuard` + `@CurrentUser()` that populate `authContextStorage` so auditing works.
- A clean, repeatable DDD layout (domain / application / infrastructure / interfaces) decoupling business logic from NestJS/TypeORM via ports.

**Non-Goals:**
- Organizations, memberships, roles, permissions (Phase 3+). `User` stays tenant-agnostic.
- Password reset, email verification, account lockout, rate limiting (MVP exclusions).
- Refresh-token rotation/denylist persistence (documented as a known trade-off below).

## Decisions

### 1. DDD layering per module
Each module is split into four layers:
```
modules/<feature>/
  domain/          # entities (pure), value objects, repository PORTS (interfaces), domain errors
  application/     # use cases (services), DTOs, application-level ports (TokenService, PasswordHasher)
  infrastructure/  # TypeORM entity mapping + repository adapters, bcrypt/JWT/Google adapters, module wiring
  interfaces/      # NestJS controllers, guards, decorators, cookie helpers
```
- Domain depends on nothing framework-specific. Application depends on domain ports only. Infrastructure implements ports and is bound via Nest DI tokens (`provide: USER_REPOSITORY, useClass: TypeOrmUserRepository`).
- **Pragmatic concession:** the TypeORM `@Entity` decorators live in `infrastructure` on a persistence model that maps to/from the domain `User`. To avoid over-engineering this first module, the domain `User` and the TypeORM entity may be the **same class** if the team prefers — but ports/use-cases are mandatory. *Recommended:* keep a separate persistence entity to honor the layering; revisit if it adds friction.
- *Alternative considered:* classic Nest layout (`service` + `repository` + `entity` flat). Rejected because the user explicitly asked for DDD and it's the reference for future modules.

### 2. Two modules: `users` and `auth`
- `users` owns the `User` aggregate and persistence (`user-management` capability). It exposes use cases like `CreateUser`, `FindUserByEmail`, `FindUserById`.
- `auth` owns credentials verification, token issuance, cookies, guard, Google flow (`authentication` + `google-oauth`). It depends on `users` use cases / the `UserRepository` port — not on TypeORM directly.
- *Rationale:* separation lets Phase 3 reuse `users` without dragging auth concerns.

### 3. Tokens in httpOnly cookies
- Access token (`JWT_ACCESS_*`, ~15m) in cookie `access_token`; refresh token (`JWT_REFRESH_*`, ~7d) in cookie `refresh_token`, scoped `path=/auth/refresh` so it's only sent where needed.
- Cookie flags: `httpOnly: true`, `secure: COOKIE_SECURE`, `sameSite: 'lax'`, `domain: COOKIE_DOMAIN`. `lax` works for the Google redirect callback while still protecting against CSRF on cross-site POSTs.
- `cookie-parser` added in `main.ts`. Passport JWT strategy reads the token from the cookie via a custom extractor (not `Authorization` header).
- *Alternative considered:* bearer tokens in JS-accessible storage. Rejected by CLAUDE.md (no token exposure to frontend JS).

### 4. Passport strategies
- `passport-jwt` (cookie extractor) for `JwtAuthGuard`. `passport-google-oauth20` for the Google flow. `@nestjs/passport` + `@nestjs/jwt`.
- The JWT strategy's `validate()` loads the user via `FindUserById` and returns the domain user, which Nest attaches to `req.user` for guarded routes.

### 5. Auth-context population — global middleware (mirrors `saas-backend`)
We adopt the proven pattern from the sibling `saas-backend` project rather than an interceptor. An `AuthContextMiddleware` is registered globally (`forRoutes('*')`) and:
- **Verifies the JWT itself** instead of relying on `req.user`. It reads the token from the `access_token` **cookie** (our transport; `saas-backend` reads the `Authorization` header) and verifies it with `JWT_ACCESS_SECRET` via `JwtService`. On failure it calls `next()` with no context (audit falls back to `UNKNOWN`).
- Wraps the rest of the request in `authContextStorage.run({ accountId }, () => next())`, so the entire downstream chain (guards, interceptors, controllers, services, `repo.save()`) inherits the request-isolated context with no manual cleanup.
- *Why middleware over interceptor:* because the middleware decodes the token on its own, it does not depend on guard ordering and works uniformly on every route — including non-guarded routes that still carry a session cookie. This is exactly why `saas-backend`'s middleware works despite middleware running before guards.
- *Alternatives considered:* interceptor + `run()` (cleaner separation but couples to guard having populated `req.user`); guard `.run()` (not viable — a guard can't wrap the downstream handler); `enterWith()` (works but Node flags it "use with caution"). All rejected in favor of consistency with `saas-backend`.

### 6. Auth-context access seam — `AuthContextService` (mirrors `saas-backend`)
Business code never touches `authContextStorage` directly. An injectable `AuthContextService` (exposing `getAccountId()`) is the single read seam, registered in a `@Global` common module so any module can inject it without explicit import. If the storage mechanism ever changes (ALS → `nestjs-cls` → request-scoped providers), only this service changes. The sole exception is `BaseAuditEntity`, which reads the store directly because entities cannot receive DI — this is already the case in our codebase.

The `AuthContext` interface stays minimal (`{ accountId }`) but extensible; `saas-backend` additionally carries an `ownershipContext` for permission scoping, which we will add in Phase 4 (roles & permissions).

### 7. Auth provider on User
- `User.provider: AuthProvider (LOCAL | GOOGLE)` + nullable `passwordHash` (null for pure-Google users) + nullable `googleId`. Login with password requires `provider === LOCAL` and a hash present.
- Google callback: find by `googleId` → else by `email` (link) → else create. Issues the same cookies as local login.

## Risks / Trade-offs

- **No refresh-token rotation/denylist** → a stolen refresh token is valid until expiry. Mitigation: short access TTL, `httpOnly`+`secure` cookies, narrow refresh cookie path; rotation deferred to a later hardening pass (note in ROADMAP).
- **Domain/persistence same-class shortcut** → risks leaking TypeORM into the domain. Mitigation: keep ports + use cases regardless; separate the entity later if coupling bites.
- **`authContextStorage` not populated correctly** → audit columns fall back to `UNKNOWN`. Mitigation: integration test asserting `createdBy` is set on an authenticated write.
- **Google `sameSite` / redirect** → callback must land cookies; `lax` chosen deliberately. Mitigation: manual Postman/browser verification of the callback.
- **New dependencies** (`bcrypt` native build on Windows) → may need build tools. Mitigation: fallback to `bcryptjs` if native install fails.

## Migration Plan

Additive only — no existing data or endpoints change. `synchronize: true` in dev creates the `users` table from the new entity. Deploy = install deps, set `JWT_*`/`GOOGLE_*` env, restart. Rollback = remove the two modules' imports from `app.module.ts` (table can stay; it's unused). Production will later need a migration instead of `synchronize` (already noted in `database.config.ts`).

## Open Questions

- ~~Exact mechanism to populate `authContextStorage`.~~ **Resolved:** global `AuthContextMiddleware` that verifies the token from the `access_token` cookie and wraps `next()` in `authContextStorage.run(...)`, plus an `AuthContextService` access seam — mirroring the `saas-backend` project (see Decisions 5 & 6).
- Whether to keep a separate persistence entity vs. single annotated domain class — leaning separate, but acceptable to merge for this first module.
- Logout with stateless JWT only clears cookies (no server-side invalidation) — acceptable for MVP given no denylist.
