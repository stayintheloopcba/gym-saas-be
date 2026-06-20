## Why

The backend has finished Phase 1 (base setup) but has no way to identify or authenticate users — there is no `User` entity and no auth flow. Every business capability on the roadmap (organizations, memberships, roles, CRUDs) depends on knowing *who* is acting, and the existing `auth-context.store` / `BaseAuditEntity` auditing is inert until a guard populates the authenticated account. Phase 2 (Auth) unblocks the rest of the product.

This change also establishes the **DDD layering** (domain / application / infrastructure / interfaces) that subsequent feature modules will follow, so the auth module doubles as the reference architecture.

## What Changes

- Introduce a `User` aggregate (`extends BaseEntity`: UUID, soft delete, audit fields) with unique email, password hash, name, and an auth-provider marker (LOCAL / GOOGLE).
- Add **email/password registration and login** with bcrypt hashing (`BCRYPT_SALT_ROUNDS`).
- Issue **JWT access + refresh tokens** delivered exclusively via `httpOnly` cookies — tokens are never exposed to frontend JS.
- Add endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
- Add **Google OAuth**: `GET /auth/google`, `GET /auth/google/callback` (provisions or links a `User`).
- Add a `JwtAuthGuard` (plus a `@CurrentUser()` decorator) that validates the access cookie and **populates `authContextStorage`** so audit columns (`createdBy`/`updatedBy`) fill automatically.
- Organize both modules in **DDD layers**: `domain` (entities, value objects, repository ports), `application` (use cases, DTOs), `infrastructure` (TypeORM repositories, bcrypt + JWT + Google adapters), `interfaces` (controllers, guards, decorators).
- Extend the Postman collection with the auth endpoints.

Out of scope (per CLAUDE.md MVP exclusions): password reset, email verification, organizations/memberships (Phase 3). Multi-tenancy is *designed for* but not enforced here — the `User` is tenant-agnostic; org scoping arrives in Phase 3.

## Capabilities

### New Capabilities
- `user-management`: the `User` aggregate and its persistence — identity, credentials, profile, auth provider, lifecycle (create, lookup by email/id, soft delete).
- `authentication`: registration, login, logout, token issuance/refresh via httpOnly cookies, the current-session endpoint (`/auth/me`), the JWT guard, and request-scoped auth context population.
- `google-oauth`: the Google sign-in flow that authenticates and provisions/links a `User`, then issues the same session cookies.

### Modified Capabilities
<!-- None — no existing specs to modify. -->

## Impact

- **New code:** `src/modules/users/**`, `src/modules/auth/**` (each split into `domain`/`application`/`infrastructure`/`interfaces`), wired into `app.module.ts`.
- **Touched code:** `app.module.ts` (register `UsersModule`, `AuthModule`); reuses existing `auth-context.store.ts`, `BaseEntity`, `DefaultBy`.
- **Config / env:** consumes already-present `.env.example` vars (`JWT_*`, `COOKIE_*`, `BCRYPT_SALT_ROUNDS`, `GOOGLE_*`).
- **New dependencies:** `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `passport-google-oauth20`, `bcrypt`, `cookie-parser` (+ `@types/*`).
- **Cross-cutting:** `main.ts` needs `cookie-parser` middleware; auth cookies rely on the existing `credentials: true` CORS config.
- **Docs:** `ROADMAP.md` (to create) and the Postman collection.
