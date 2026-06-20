## ADDED Requirements

### Requirement: Select active organization

An authenticated user SHALL be able to set one of their organizations as the active organization for subsequent requests. The selection SHALL be stored in a dedicated `httpOnly` cookie.

#### Scenario: Member selects an organization

- **WHEN** a member sends `POST /organizations/:id/select`
- **THEN** the system sets the active-organization cookie (`httpOnly`) to that organization and confirms the selection

#### Scenario: Cannot select an organization the user does not belong to

- **WHEN** a user sends `POST /organizations/:id/select` for an organization where they have no active membership
- **THEN** the system responds `403` and does not set the cookie

#### Scenario: Clear active organization

- **WHEN** an authenticated user sends `POST /organizations/select/clear`
- **THEN** the system clears the active-organization cookie

### Requirement: Active organization in request context

The system SHALL expose the validated active organization request-scoped via `AuthContext.activeOrganizationId` and `AuthContextService.getActiveOrganizationId()`. The active-organization cookie SHALL be trusted only after confirming the caller has an active membership in that organization.

#### Scenario: Valid active org is available to business code

- **WHEN** a request arrives with a valid access token and an active-organization cookie for which the user has an active membership
- **THEN** `AuthContextService.getActiveOrganizationId()` returns that organization id within the request

#### Scenario: Forged or stale active-org cookie is ignored

- **WHEN** a request carries an active-organization cookie for an organization where the user has no active membership (e.g. removed member, deleted org, forged value)
- **THEN** the request context exposes no active organization

### Requirement: Active organization guard for business routes

The system SHALL provide an `ActiveOrgGuard` that rejects requests lacking a valid active organization. Business routes SHALL compose it with the JWT guard; onboarding and account routes SHALL NOT require it.

#### Scenario: Business route without active org is rejected

- **WHEN** an authenticated user with no valid active organization calls a route protected by `ActiveOrgGuard`
- **THEN** the system responds `403`

#### Scenario: Path organization must match active organization

- **WHEN** an authenticated user calls an org-scoped business route whose `:id` differs from their active organization
- **THEN** the system responds `403`

### Requirement: Onboarding status

The system SHALL expose an endpoint that reports whether the authenticated user needs onboarding, based on their memberships and pending invitations and current active organization.

#### Scenario: New user needs onboarding

- **WHEN** a user with no memberships requests `GET /onboarding/status`
- **THEN** the response indicates the user has no organizations and lists any pending invitations addressed to their email

#### Scenario: Onboarded user with an active organization

- **WHEN** a user with at least one membership and a valid active organization requests `GET /onboarding/status`
- **THEN** the response indicates onboarding is complete and reports the active organization
