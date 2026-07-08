## ADDED Requirements

### Requirement: Global role catalog

The system SHALL provide a `Role` aggregate extending `BaseEntity` with a unique, immutable kebab-case `key`, a display `name`, an optional `description`, and a `hierarchyLevel` (data scope: SELF / ORGANIZATION / GLOBAL). Roles SHALL NOT belong to any organization: every organization sees and uses exactly the same catalog.

#### Scenario: Catalog is identical across organizations

- **WHEN** members of two different organizations list the available roles
- **THEN** both receive exactly the same set of roles

#### Scenario: Role key is immutable

- **WHEN** a platform admin attempts to change the `key` of an existing role
- **THEN** the system rejects the update; only `name`, `description`, and `hierarchyLevel` are editable

### Requirement: Role permissions by presence

The system SHALL store role permissions in a `role_permissions` table associating a `roleId` with a `permissionCode`, unique per pair. The presence of a row SHALL mean the role grants that permission; there SHALL be no deny entries, per-user entries, or precedence values.

#### Scenario: Row present grants the permission

- **WHEN** `role_permissions` contains a row `(roleId, permissionCode)`
- **THEN** every member holding that role has that permission

#### Scenario: Row absent denies the permission

- **WHEN** `role_permissions` contains no row for a role and permission code
- **THEN** members holding that role do not have that permission

### Requirement: Platform-admin-only catalog management

Only platform admins SHALL create, update, or delete roles and their permissions, via `/admin/roles` endpoints: `GET /admin/roles`, `POST /admin/roles`, `PATCH /admin/roles/:roleId`, `DELETE /admin/roles/:roleId`, and `PUT /admin/roles/:roleId/permissions` (replaces the role's full permission set). A `GET /admin/permissions` endpoint SHALL list the permission-code catalog. Organization members SHALL NOT be able to mutate the catalog regardless of their permissions.

#### Scenario: Platform admin creates a role

- **WHEN** a platform admin sends `POST /admin/roles` with a unique `key`, `name`, and `hierarchyLevel`
- **THEN** the system creates the role and returns `201`

#### Scenario: Platform admin replaces a role's permission set

- **WHEN** a platform admin sends `PUT /admin/roles/:roleId/permissions` with a list of permission codes
- **THEN** the role's `role_permissions` rows match exactly that list afterwards

#### Scenario: Organization member cannot manage the catalog

- **WHEN** an authenticated user without the platform-admin flag calls any `/admin/roles` endpoint
- **THEN** the system responds `403`, even if the user holds every organization permission

### Requirement: Protected and in-use roles cannot be deleted

The system SHALL reject deleting the `owner` role, and SHALL reject deleting any role that is referenced by an active membership or a pending invitation.

#### Scenario: Owner role cannot be deleted

- **WHEN** a platform admin sends `DELETE /admin/roles/:roleId` for the role with key `owner`
- **THEN** the system responds `409` and the role remains

#### Scenario: Role in use cannot be deleted

- **WHEN** a platform admin attempts to delete a role that at least one active membership references
- **THEN** the system responds `409` and the role remains

### Requirement: Initial catalog seed

The system SHALL seed the role catalog idempotently at bootstrap with the initial roles (`owner`, `admin`, `receptionist`, `instructor`) and their permission sets. The seeder SHALL create a role and its permission rows only when no role with that `key` exists; roles already present (and their permission rows) SHALL be left untouched, so platform-admin edits survive restarts.

#### Scenario: Fresh database gets the initial catalog

- **WHEN** the application boots against an empty database
- **THEN** the four initial roles exist with their seeded permission sets

#### Scenario: Seeder preserves admin edits

- **WHEN** a platform admin has removed a permission from a seeded role and the application reboots
- **THEN** the removed permission is not re-inserted, because the role's `key` already exists

#### Scenario: Re-running the seed creates no duplicates

- **WHEN** the application boots repeatedly against the same database
- **THEN** each role `key` and each `(roleId, permissionCode)` pair exists at most once

### Requirement: Organizations read the catalog

A member holding the `roles:read` permission SHALL be able to list the role catalog via `GET /organizations/:id/roles` in order to assign roles to members and invitations.

#### Scenario: Member lists the catalog

- **WHEN** a member with `roles:read` sends `GET /organizations/:id/roles`
- **THEN** the system returns the global catalog (id, key, name, description, hierarchyLevel per role)
