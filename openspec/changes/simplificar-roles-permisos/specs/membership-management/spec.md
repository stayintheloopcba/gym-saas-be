## MODIFIED Requirements

### Requirement: Membership aggregate

The system SHALL provide a `Membership` aggregate extending `BaseEntity` that links one `User` to one `Organization` with a `roleId` (`NOT NULL`) referencing a role in the global catalog. There SHALL be at most one non-deleted membership per `(user, organization)` pair.

#### Scenario: Duplicate membership rejected

- **WHEN** a membership is created for a `(user, organization)` pair that already has a non-deleted membership
- **THEN** the system rejects it and does not create a second membership

#### Scenario: Membership requires a catalog role

- **WHEN** a membership is created
- **THEN** its `roleId` references an existing role of the global catalog and is never null

### Requirement: Owner membership on organization creation

When an organization is created, the system SHALL create a membership with the catalog role `owner` for the creator atomically with the organization.

#### Scenario: Creator becomes owner

- **WHEN** a user creates an organization
- **THEN** a `Membership` whose role is the catalog role with key `owner` links that user to the organization

#### Scenario: No orphan organization on failure

- **WHEN** creating the owner membership fails
- **THEN** the organization is not persisted either (the operation is atomic)

### Requirement: Single owner invariant

An organization SHALL always have exactly one membership with the catalog role `owner`. The sole owner SHALL NOT be removed or demoted while no other owner exists, and the `owner` role SHALL NOT be assignable through member role changes or invitations — it is only granted automatically at organization creation.

#### Scenario: Cannot remove the sole owner

- **WHEN** a request attempts to remove the only `owner` membership of an organization
- **THEN** the system responds `409` and the membership remains

#### Scenario: Owner role cannot be assigned

- **WHEN** a member role change requests the catalog role with key `owner` for any member
- **THEN** the system responds `409` and no role changes

### Requirement: List organization members

A member SHALL be able to list the members of an organization they belong to.

#### Scenario: Member lists members

- **WHEN** a member sends `GET /organizations/:id/members`
- **THEN** the system returns the active memberships with each member's public profile and their catalog role (`id`, `key`, `name`)

### Requirement: List my organizations

An authenticated user SHALL be able to list the organizations they are a member of.

#### Scenario: User lists own organizations

- **WHEN** an authenticated user sends `GET /organizations`
- **THEN** the system returns only the organizations where the user has an active membership, with the user's catalog role in each

### Requirement: Remove a member

A member holding the `members:remove` permission SHALL be able to remove another member from the organization.

#### Scenario: Privileged member removes a member

- **WHEN** a member with `members:remove` sends `DELETE /organizations/:id/members/:userId` for a non-owner member
- **THEN** that membership is soft-deleted and the user no longer appears in the member list

#### Scenario: Member without privilege cannot remove

- **WHEN** a member whose role lacks `members:remove` attempts to remove another member
- **THEN** the system responds `403` and nothing changes

## ADDED Requirements

### Requirement: Change a member's role

A member holding the `members:update_role` permission SHALL be able to change another member's role to any catalog role except `owner`, via `PATCH /organizations/:id/members/:userId/role` with a `roleId` body.

#### Scenario: Privileged member changes a role

- **WHEN** a member with `members:update_role` sends `PATCH /organizations/:id/members/:userId/role` with a valid catalog `roleId` (not `owner`) for a non-owner member
- **THEN** the target membership's `roleId` is updated and the response includes the new catalog role

#### Scenario: Unknown role is rejected

- **WHEN** the `roleId` in the request matches no role in the catalog
- **THEN** the system responds `404` (or rejects the request) and no role changes

#### Scenario: Member without privilege cannot change roles

- **WHEN** a member whose role lacks `members:update_role` attempts to change another member's role
- **THEN** the system responds `403` and nothing changes
