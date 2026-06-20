# invitations Specification

## Purpose
TBD - created by archiving change add-organizations-onboarding. Update Purpose after archive.
## Requirements
### Requirement: Invitation aggregate

The system SHALL provide an `Invitation` aggregate extending `BaseEntity` with the target `organization`, invitee `email`, target `role`, an opaque `token`, a `status` (`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`), and an `expiresAt` timestamp.

#### Scenario: Invitation carries an opaque token and expiry

- **WHEN** an invitation is created
- **THEN** it has a hard-to-guess opaque `token`, `status` `PENDING`, and an `expiresAt` of now plus the configured TTL

### Requirement: Create invitation

A member with role `OWNER` or `ADMIN` SHALL be able to invite a person by email with a target role. Re-inviting an email that already has a pending invitation in the organization SHALL return the existing pending invitation rather than creating a duplicate.

#### Scenario: Admin invites a new email

- **WHEN** an `ADMIN` sends `POST /organizations/:id/invitations` with an `email` and `role`
- **THEN** the system creates a `PENDING` invitation and returns it (including its token)

#### Scenario: Re-inviting a pending email is idempotent

- **WHEN** an invitation is created for an email that already has a `PENDING` invitation in the same organization
- **THEN** the system returns the existing pending invitation and does not create a second one

#### Scenario: Cannot invite an existing member

- **WHEN** the invited email belongs to a user who already has an active membership in the organization
- **THEN** the system responds `409` and creates no invitation

#### Scenario: Member without privilege cannot invite

- **WHEN** a `MEMBER` or `VIEWER` attempts to create an invitation
- **THEN** the system responds `403`

### Requirement: List pending invitations

A member with role `OWNER` or `ADMIN` SHALL be able to list the pending invitations of an organization.

#### Scenario: Admin lists pending invitations

- **WHEN** an `ADMIN` sends `GET /organizations/:id/invitations`
- **THEN** the system returns the organization's `PENDING` invitations

### Requirement: List my invitations

An authenticated user SHALL be able to list pending invitations addressed to their email.

#### Scenario: User sees invitations for their email

- **WHEN** an authenticated user sends `GET /invitations/mine`
- **THEN** the system returns the `PENDING`, non-expired invitations whose email matches the user's email

### Requirement: Revoke invitation

A member with role `OWNER` or `ADMIN` SHALL be able to revoke a pending invitation.

#### Scenario: Admin revokes a pending invitation

- **WHEN** an `ADMIN` sends `DELETE /invitations/:id` for a `PENDING` invitation of their organization
- **THEN** the invitation status becomes `REVOKED` and it can no longer be accepted

### Requirement: Accept invitation

An authenticated user whose email matches a `PENDING`, non-expired invitation SHALL be able to accept it, which creates their membership in the organization with the invitation's role.

#### Scenario: Successful accept creates membership

- **WHEN** the user whose email matches the invitation sends `POST /invitations/accept` with the token
- **THEN** the system creates a membership with the invitation's role, marks the invitation `ACCEPTED`, and the user becomes a member

#### Scenario: Email mismatch is rejected

- **WHEN** an authenticated user whose email does not match the invitation tries to accept it
- **THEN** the system responds `403` and creates no membership

#### Scenario: Expired invitation cannot be accepted

- **WHEN** a user tries to accept an invitation whose `expiresAt` is in the past
- **THEN** the system responds `410` (or rejects as expired) and creates no membership

#### Scenario: Already-resolved invitation cannot be accepted

- **WHEN** a user tries to accept an invitation whose status is `ACCEPTED`, `REVOKED`, or `EXPIRED`
- **THEN** the system rejects the request and creates no membership

### Requirement: Decline invitation

An authenticated user whose email matches a `PENDING` invitation SHALL be able to decline it without creating a membership.

#### Scenario: User declines

- **WHEN** the invited user sends `POST /invitations/decline` with the token
- **THEN** the invitation is no longer pending for them and no membership is created

