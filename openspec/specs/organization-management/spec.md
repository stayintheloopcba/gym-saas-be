# organization-management Specification

## Purpose
TBD - created by archiving change add-organizations-onboarding. Update Purpose after archive.
## Requirements
### Requirement: Organization aggregate

The system SHALL provide an `Organization` aggregate extending `BaseEntity` (UUID id, soft delete, audit fields) with a human-readable `name` and a unique `slug`. All lookups SHALL exclude soft-deleted organizations.

#### Scenario: Organization has the base fields

- **WHEN** an organization is persisted
- **THEN** it has a UUID `id`, `createdAt`, `createdBy`, and a `deletedAt` that is `null` while active

### Requirement: Create organization

An authenticated user SHALL be able to create an organization by providing a `name`. The system SHALL derive a unique `slug` from the name and create the organization owned by the caller.

#### Scenario: Successful creation

- **WHEN** an authenticated user sends `POST /organizations` with a valid `name`
- **THEN** the system creates the organization with a unique slug and returns `201` with the organization

#### Scenario: Slug collision is resolved

- **WHEN** the derived slug already belongs to a non-deleted organization
- **THEN** the system appends a disambiguating suffix so the new slug is unique

#### Scenario: Reject empty name

- **WHEN** the request body has a missing or blank `name`
- **THEN** the system responds `400` and creates nothing

### Requirement: Read organization

An authenticated member SHALL be able to fetch an organization by id.

#### Scenario: Member fetches the organization

- **WHEN** a member sends `GET /organizations/:id`
- **THEN** the system returns the organization

#### Scenario: Unknown organization

- **WHEN** the id matches no non-deleted organization
- **THEN** the system responds `404`

#### Scenario: Non-member cannot read

- **WHEN** an authenticated user who is not a member requests `GET /organizations/:id`
- **THEN** the system responds `403` or `404` and does not disclose the organization

### Requirement: Rename organization

A member with role `OWNER` or `ADMIN` SHALL be able to change the organization `name`.

#### Scenario: Owner renames

- **WHEN** an `OWNER` sends `PATCH /organizations/:id` with a new `name`
- **THEN** the system updates the name and returns the organization

#### Scenario: Member without privilege cannot rename

- **WHEN** a `MEMBER` or `VIEWER` attempts `PATCH /organizations/:id`
- **THEN** the system responds `403` and leaves the organization unchanged

### Requirement: Soft delete organization

A member with role `OWNER` SHALL be able to soft-delete the organization. The slug SHALL become reusable after deletion.

#### Scenario: Owner deletes the organization

- **WHEN** an `OWNER` sends `DELETE /organizations/:id`
- **THEN** the organization's `deletedAt` is set and it no longer appears in lookups

#### Scenario: Deleted slug can be reused

- **WHEN** a new organization is created with a name whose slug matches a previously deleted organization's slug
- **THEN** the new organization is created with that slug

