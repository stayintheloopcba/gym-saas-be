# membership-management Specification

## Purpose
TBD - created by archiving change add-organizations-onboarding. Update Purpose after archive.
## Requirements
### Requirement: Membership aggregate

The system SHALL provide a `Membership` aggregate extending `BaseEntity` that links one `User` to one `Organization` with a `role` of `OWNER`, `ADMIN`, `MEMBER`, or `VIEWER`. There SHALL be at most one non-deleted membership per `(user, organization)` pair.

#### Scenario: Duplicate membership rejected

- **WHEN** a membership is created for a `(user, organization)` pair that already has a non-deleted membership
- **THEN** the system rejects it and does not create a second membership

### Requirement: Owner membership on organization creation

When an organization is created, the system SHALL create an `OWNER` membership for the creator atomically with the organization.

#### Scenario: Creator becomes owner

- **WHEN** a user creates an organization
- **THEN** a `Membership` with role `OWNER` linking that user to the organization exists

#### Scenario: No orphan organization on failure

- **WHEN** creating the owner membership fails
- **THEN** the organization is not persisted either (the operation is atomic)

### Requirement: Single owner invariant

An organization SHALL always have exactly one `OWNER`. The sole owner SHALL NOT be removed or demoted while no other owner exists.

#### Scenario: Cannot remove the sole owner

- **WHEN** a request attempts to remove the only `OWNER` membership of an organization
- **THEN** the system responds `409` and the membership remains

### Requirement: List organization members

A member SHALL be able to list the members of an organization they belong to.

#### Scenario: Member lists members

- **WHEN** a member sends `GET /organizations/:id/members`
- **THEN** the system returns the active memberships with each member's public profile and role

### Requirement: List my organizations

An authenticated user SHALL be able to list the organizations they are a member of.

#### Scenario: User lists own organizations

- **WHEN** an authenticated user sends `GET /organizations`
- **THEN** the system returns only the organizations where the user has an active membership, with the user's role in each

### Requirement: Remove a member

A member with role `OWNER` or `ADMIN` SHALL be able to remove another member from the organization.

#### Scenario: Admin removes a member

- **WHEN** an `ADMIN` sends `DELETE /organizations/:id/members/:userId` for a non-owner member
- **THEN** that membership is soft-deleted and the user no longer appears in the member list

#### Scenario: Member without privilege cannot remove

- **WHEN** a `MEMBER` or `VIEWER` attempts to remove another member
- **THEN** the system responds `403` and nothing changes

