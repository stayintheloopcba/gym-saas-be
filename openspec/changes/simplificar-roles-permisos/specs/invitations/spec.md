## MODIFIED Requirements

### Requirement: Invitation aggregate

The system SHALL provide an `Invitation` aggregate extending `BaseEntity` with the target `organization`, invitee `email`, a target `roleId` referencing a role of the global catalog, an opaque `token`, a `status` (`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`), and an `expiresAt` timestamp.

#### Scenario: Invitation carries an opaque token and expiry

- **WHEN** an invitation is created
- **THEN** it has a hard-to-guess opaque `token`, `status` `PENDING`, and an `expiresAt` of now plus the configured TTL

### Requirement: Create invitation

A member holding the `members:invite` permission SHALL be able to invite a person by email with a target catalog `roleId`. The `owner` role SHALL NOT be invitable. Re-inviting an email that already has a pending invitation in the organization SHALL return the existing pending invitation rather than creating a duplicate.

#### Scenario: Privileged member invites a new email

- **WHEN** a member with `members:invite` sends `POST /organizations/:id/invitations` with an `email` and a valid catalog `roleId`
- **THEN** the system creates a `PENDING` invitation and returns it (including its token)

#### Scenario: Owner role cannot be invited

- **WHEN** an invitation is created with the `roleId` of the catalog role with key `owner`
- **THEN** the system responds `409` and creates no invitation

#### Scenario: Unknown role is rejected

- **WHEN** the `roleId` matches no role in the catalog
- **THEN** the system rejects the request and creates no invitation

#### Scenario: Re-inviting a pending email is idempotent

- **WHEN** an invitation is created for an email that already has a `PENDING` invitation in the same organization
- **THEN** the system returns the existing pending invitation and does not create a second one

#### Scenario: Cannot invite an existing member

- **WHEN** the invited email belongs to a user who already has an active membership in the organization
- **THEN** the system responds `409` and creates no invitation

#### Scenario: Member without privilege cannot invite

- **WHEN** a member whose role lacks `members:invite` attempts to create an invitation
- **THEN** the system responds `403`

### Requirement: List pending invitations

A member holding the `members:read` permission SHALL be able to list the pending invitations of an organization.

#### Scenario: Privileged member lists pending invitations

- **WHEN** a member with `members:read` sends `GET /organizations/:id/invitations`
- **THEN** the system returns the organization's `PENDING` invitations with each invitation's catalog role

### Requirement: Revoke invitation

A member holding the `members:invite` permission SHALL be able to revoke a pending invitation.

#### Scenario: Privileged member revokes a pending invitation

- **WHEN** a member with `members:invite` sends `DELETE /invitations/:id` for a `PENDING` invitation of their organization
- **THEN** the invitation status becomes `REVOKED` and it can no longer be accepted

### Requirement: Accept invitation

An authenticated user whose email matches a `PENDING`, non-expired invitation SHALL be able to accept it, which creates their membership in the organization with the invitation's `roleId`.

#### Scenario: Successful accept creates membership

- **WHEN** the user whose email matches the invitation sends `POST /invitations/accept` with the token
- **THEN** the system creates a membership with the invitation's `roleId`, marks the invitation `ACCEPTED`, and the user becomes a member

#### Scenario: Email mismatch is rejected

- **WHEN** an authenticated user whose email does not match the invitation tries to accept it
- **THEN** the system responds `403` and creates no membership

#### Scenario: Expired invitation cannot be accepted

- **WHEN** a user tries to accept an invitation whose `expiresAt` is in the past
- **THEN** the system responds `410` (or rejects as expired) and creates no membership

#### Scenario: Already-resolved invitation cannot be accepted

- **WHEN** a user tries to accept an invitation whose status is `ACCEPTED`, `REVOKED`, or `EXPIRED`
- **THEN** the system rejects the request and creates no membership
