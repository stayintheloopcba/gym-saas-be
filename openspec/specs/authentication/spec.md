# authentication Specification

## Purpose

Email/password and session authentication for the SaaS platform: registration, login, httpOnly token cookies, route protection, audit context, current session, refresh, and logout.

## Requirements

### Requirement: Email/password registration
The system SHALL expose `POST /auth/register` that creates a `LOCAL` user from email, password, and name. The password MUST be hashed with bcrypt using `BCRYPT_SALT_ROUNDS` before persistence and MUST never be stored or returned in plain text.

#### Scenario: Successful registration
- **WHEN** a client posts a valid, unused email with a password and name
- **THEN** a `LOCAL` user is created, session cookies are set, and the response returns the user's public profile without the password hash

#### Scenario: Duplicate email registration
- **WHEN** a client registers with an email that already belongs to a non-deleted user
- **THEN** the system responds with a conflict error and creates no user

#### Scenario: Invalid payload
- **WHEN** a client posts a missing or malformed email or password
- **THEN** the global validation pipe rejects the request with a validation error

### Requirement: Email/password login
The system SHALL expose `POST /auth/login` that verifies credentials against a `LOCAL` user's bcrypt hash and, on success, issues session cookies.

#### Scenario: Successful login
- **WHEN** a client posts the correct email and password for a `LOCAL` user
- **THEN** access and refresh cookies are set and the user's public profile is returned

#### Scenario: Wrong password
- **WHEN** a client posts an existing email with an incorrect password
- **THEN** the system responds with an unauthorized error and sets no cookies

#### Scenario: Login attempt on a Google-only account
- **WHEN** a client attempts password login for a user whose provider is `GOOGLE` with no password hash
- **THEN** the system responds with an unauthorized error

### Requirement: httpOnly token cookies
The system SHALL deliver the JWT access and refresh tokens exclusively via `httpOnly` cookies and SHALL NOT expose token values in response bodies. Cookies MUST set `httpOnly`, `sameSite=lax`, and honor `COOKIE_SECURE` and `COOKIE_DOMAIN`. The refresh cookie SHALL be scoped to `/auth` so it is available only to refresh and logout routes.

#### Scenario: Cookies are httpOnly
- **WHEN** any endpoint issues session cookies
- **THEN** the `access_token` and `refresh_token` cookies carry the `HttpOnly` flag and no token appears in the JSON body

### Requirement: Authenticated session guard
The system SHALL provide a `JwtAuthGuard` that authenticates requests by validating the access token read from the `access_token` cookie, and a `@CurrentUser()` decorator that exposes the authenticated user to handlers.

#### Scenario: Valid access cookie
- **WHEN** a request to a protected route carries a valid, unexpired `access_token` cookie
- **THEN** the guard allows the request and `@CurrentUser()` resolves to the authenticated user

#### Scenario: Missing or invalid access cookie
- **WHEN** a request to a protected route has no valid `access_token` cookie
- **THEN** the guard rejects it with an unauthorized error

### Requirement: Audit context population
On every authenticated request the system SHALL populate `authContextStorage` with the authenticated user's id so that `BaseAuditEntity` records `createdBy` and `updatedBy` automatically.

#### Scenario: Audited write while authenticated
- **WHEN** an authenticated user performs an operation that persists an audited entity
- **THEN** the entity's `createdBy` (and on update `updatedBy`) equals the authenticated user's id, not `UNKNOWN`

### Requirement: Current session endpoint
The system SHALL expose `GET /auth/me`, protected by the guard, returning the authenticated user's public profile.

#### Scenario: Get current user
- **WHEN** an authenticated client calls `GET /auth/me`
- **THEN** the response returns the current user's public profile without the password hash

### Requirement: Token refresh
The system SHALL expose `POST /auth/refresh` that validates the `refresh_token` cookie and issues a new access cookie (and refresh cookie).

#### Scenario: Valid refresh token
- **WHEN** a client calls `POST /auth/refresh` with a valid `refresh_token` cookie
- **THEN** a new `access_token` cookie is issued

#### Scenario: Invalid or expired refresh token
- **WHEN** a client calls `POST /auth/refresh` without a valid `refresh_token` cookie
- **THEN** the system responds with an unauthorized error and issues no new cookie

### Requirement: Logout
The system SHALL expose `POST /auth/logout` that clears the access and refresh cookies.

#### Scenario: Logout clears cookies
- **WHEN** a client calls `POST /auth/logout`
- **THEN** the `access_token` and `refresh_token` cookies are cleared

### Requirement: Persisted sessions
Every successful registration, local login, or Google login SHALL create a persisted session containing the user, refresh-token hash, expiration, client user agent, and client IP address.

#### Scenario: A user authenticates successfully
- **WHEN** authentication succeeds
- **THEN** the system stores only a SHA-256 hash of the refresh token and associates both JWTs with the session id

### Requirement: Refresh token rotation
The system SHALL rotate refresh tokens as a single persisted-session operation.

#### Scenario: A valid refresh token is used
- **WHEN** the refresh token matches an active, unexpired persisted session
- **THEN** the current session is revoked, a replacement session in the same family is created, and a new token pair is issued

#### Scenario: A rotated refresh token is reused
- **WHEN** a refresh token for an already-revoked session is presented again
- **THEN** every active session in that rotation family is revoked and the request returns 401

### Requirement: Session revocation
Protected endpoints SHALL reject access tokens whose persisted session is revoked or expired.

#### Scenario: The user logs out
- **WHEN** `POST /auth/logout` receives the current refresh cookie
- **THEN** the persisted session is revoked and the authentication cookies are cleared

### Requirement: Session management
The system SHALL expose authenticated session management under `/me/sessions`.

#### Scenario: List sessions
- **WHEN** the user calls `GET /me/sessions`
- **THEN** the system returns only that user's active sessions and marks the current session

#### Scenario: Revoke one session
- **WHEN** the user calls `DELETE /me/sessions/:sessionId` for a session they own
- **THEN** that session is revoked, and cookies are cleared when it is the current session

#### Scenario: Revoke other sessions
- **WHEN** the user calls `DELETE /me/sessions`
- **THEN** every active session except the current one is revoked
