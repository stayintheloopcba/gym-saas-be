## ADDED Requirements

### Requirement: Platform admin flag

The system SHALL mark platform admins (SUPER_ADMIN) with a boolean `isPlatformAdmin` on `User`, defaulting to `false`. Platform-admin status SHALL be fully decoupled from organizations: it SHALL NOT require or imply any `Membership` or catalog role.

#### Scenario: Platform admin needs no membership

- **WHEN** a user with `isPlatformAdmin = true` and zero memberships authenticates
- **THEN** they can access `/admin/*` endpoints

#### Scenario: Regular users default to non-admin

- **WHEN** a user registers through any auth flow
- **THEN** their `isPlatformAdmin` is `false`

### Requirement: Platform admin guard

The system SHALL protect every `/admin/*` route with a guard that requires an authenticated user whose `isPlatformAdmin` flag is `true`, read from the database on each request (not from the JWT), so revocation takes effect immediately. Organization permissions SHALL NOT grant access to `/admin/*`.

#### Scenario: Non-admin is rejected

- **WHEN** an authenticated user with `isPlatformAdmin = false` calls an `/admin/*` endpoint
- **THEN** the system responds `403`, even if the user holds every organization permission

#### Scenario: Revocation is immediate

- **WHEN** a user's `isPlatformAdmin` is set to `false` while they hold a valid access token
- **THEN** their next `/admin/*` request responds `403` without waiting for token expiry

### Requirement: Platform admin does not bypass organization scoping

Platform-admin status SHALL grant access only to the `/admin/*` surface. Organization-scoped endpoints SHALL keep requiring an active membership; the flag SHALL NOT substitute for one.

#### Scenario: Platform admin without membership cannot use org endpoints

- **WHEN** a platform admin with no membership in an organization calls one of its org-scoped endpoints
- **THEN** the system rejects the request exactly as it would for any non-member

### Requirement: Platform admin seeding

The system SHALL seed initial platform admins idempotently at bootstrap from the `PLATFORM_ADMIN_EMAILS` configuration (comma-separated emails), setting `isPlatformAdmin = true` on matching users.

#### Scenario: Configured email is flagged

- **WHEN** the application boots and a user exists whose email is listed in `PLATFORM_ADMIN_EMAILS`
- **THEN** that user's `isPlatformAdmin` becomes `true`

#### Scenario: Seeding is idempotent

- **WHEN** the application boots repeatedly with the same configuration
- **THEN** the flagged users are the same and no error occurs
