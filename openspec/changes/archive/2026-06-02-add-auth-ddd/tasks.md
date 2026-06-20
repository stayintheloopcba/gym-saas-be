## 1. Dependencies & bootstrap

- [x] 1.1 Add deps: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `passport-google-oauth20`, `bcrypt`, `cookie-parser` (+ `@types/passport-jwt`, `@types/passport-google-oauth20`, `@types/bcrypt`, `@types/cookie-parser`). Fall back to `bcryptjs` if native bcrypt fails to build on Windows.
- [x] 1.2 Register `cookie-parser` middleware in `src/main.ts`.
- [x] 1.3 Add an `AuthProvider` enum (`LOCAL`, `GOOGLE`) under `src/common/enums/`.

## 2. Users module — domain layer

- [x] 2.1 Create `modules/users/domain/user.entity.ts` (domain `User` extending `BaseEntity`: `email`, `name`, `passwordHash?`, `googleId?`, `provider`). Annotate as TypeORM `@Entity('users')` with unique index on `email` (single-class approach per design).
- [x] 2.2 Add an `Email` value object (or normalization helper) that lowercases + trims; enforce normalization at creation.
- [x] 2.3 Define `UserRepository` port interface in `domain/user.repository.ts` (`findById`, `findByEmail`, `findByGoogleId`, `save`) with a DI token (`USER_REPOSITORY`).
- [x] 2.4 Add domain errors (`DuplicateEmailError`, `UserNotFoundError`).

## 3. Users module — application layer

- [x] 3.1 Create DTOs / commands for user creation (`CreateUserCommand`) — internal, not HTTP DTOs.
- [x] 3.2 Implement `CreateUserUseCase` (rejects duplicate email → `DuplicateEmailError`, normalizes email, supports LOCAL with hash and GOOGLE with googleId/null hash).
- [x] 3.3 Implement `FindUserByEmailUseCase`, `FindUserByIdUseCase`, `FindUserByGoogleIdUseCase` (all exclude soft-deleted).
- [x] 3.4 Add a `toPublicProfile` mapper that strips `passwordHash`.

## 4. Users module — infrastructure & wiring

- [x] 4.1 Implement `TypeOrmUserRepository` (infrastructure) satisfying the `UserRepository` port via `Repository<User>`.
- [x] 4.2 Create `UsersModule` binding `USER_REPOSITORY → TypeOrmUserRepository`, `TypeOrmModule.forFeature([User])`, exporting use cases + the port for `AuthModule`.
- [x] 4.3 Import `UsersModule` in `app.module.ts`.

## 5. Auth module — application ports & adapters

- [x] 5.1 Define application ports: `PasswordHasher` (hash/compare) and `TokenService` (sign/verify access & refresh) with DI tokens.
- [x] 5.2 Implement `BcryptPasswordHasher` (infrastructure) using `BCRYPT_SALT_ROUNDS`.
- [x] 5.3 Implement `JwtTokenService` (infrastructure) using `@nestjs/jwt` with separate access/refresh secrets and TTLs from env.

## 6. Auth module — use cases

- [x] 6.1 `RegisterUseCase`: create LOCAL user (hash password), return public profile + token pair.
- [x] 6.2 `LoginUseCase`: find by email, reject if provider≠LOCAL or no hash, compare password, return public profile + token pair; throw unauthorized on mismatch.
- [x] 6.3 `RefreshTokenUseCase`: verify refresh token, issue new token pair.
- [x] 6.4 `GoogleAuthUseCase`: given a Google profile, find by googleId → else by email (link googleId) → else create GOOGLE user; return public profile + token pair.

## 7. Auth module — interfaces (controllers, guard, cookies)

- [x] 7.1 HTTP DTOs with class-validator: `RegisterDto`, `LoginDto`.
- [x] 7.2 Cookie helper: set/clear `access_token` and `refresh_token` with `httpOnly`, `sameSite=lax`, `secure=COOKIE_SECURE`, `domain=COOKIE_DOMAIN`; refresh cookie scoped to `/auth/refresh`.
- [x] 7.3 `JwtStrategy` (passport-jwt) with a cookie extractor reading `access_token`; `validate()` loads user via `FindUserByIdUseCase`.
- [x] 7.4 `JwtAuthGuard` + `@CurrentUser()` decorator.
- [x] 7.5 `AuthController`: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` (guarded). Responses set/clear cookies, never return tokens in the body.

## 7b. Auth-context (mirror `saas-backend` pattern)

- [x] 7b.1 `AuthContextMiddleware` (`src/common/context/`): verify the JWT from the `access_token` cookie with `JwtService` + `JWT_ACCESS_SECRET`; on success wrap `next()` in `authContextStorage.run({ accountId }, () => next())`, else call `next()` with no context. Register globally via `AppModule implements NestModule` → `consumer.apply(AuthContextMiddleware).forRoutes('*')`.
- [x] 7b.2 `AuthContextService` (`src/common/context/auth-context.service.ts`): injectable seam exposing `getAccountId()`; the only read access point for business code (`BaseAuditEntity` stays the direct-read exception).
- [x] 7b.3 Create a `@Global` common module (e.g. `CommonModule`) that provides + exports `AuthContextService`; import it in `AppModule`. Keep `AuthContext` interface as `{ accountId }` (extensible; `ownershipContext` deferred to Phase 4).

## 8. Auth module — Google OAuth

- [x] 8.1 `GoogleStrategy` (passport-google-oauth20) using `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL`, email+profile scopes.
- [x] 8.2 `GET /auth/google` (initiate) and `GET /auth/google/callback` (calls `GoogleAuthUseCase`, sets cookies, redirects to `FRONTEND_URL`).
- [x] 8.3 Create `AuthModule` wiring ports→adapters, strategies, guard, importing `UsersModule`; import in `app.module.ts`.

## 9. Tests

- [x] 9.1 Unit: `RegisterUseCase` (duplicate email rejected, password hashed), `LoginUseCase` (wrong password + Google-only account → unauthorized).
- [x] 9.2 Unit: `GoogleAuthUseCase` link/create/return branches.
- [x] 9.3 Integration (e2e): register→login→/auth/me with cookie jar; assert cookies are `HttpOnly` and no token in body. (`test/auth.e2e-spec.ts`, verificado con Postgres por el usuario.)
- [x] 9.4 Integration: an authenticated audited write sets `createdBy` to the user id (not `UNKNOWN`). (`src/common/context/auth-context.integration.spec.ts`, sin DB.)

## 10. Docs

- [x] 10.1 Add auth endpoints to the Postman collection (register, login, refresh, logout, me, google).
- [x] 10.2 Create/update `ROADMAP.md`: mark Phase 2 in progress, record decisions (httpOnly cookies, DDD layering, no refresh rotation yet) and MVP exclusions.
- [x] 10.3 Run `npm run lint` and `npm run test`; ensure green. (lint clean; 24/24 unit tests pass. e2e 9.3 pendiente de DB.)
