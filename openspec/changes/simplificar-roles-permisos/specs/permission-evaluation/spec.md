## ADDED Requirements

### Requirement: Direct lookup resolution

The system SHALL resolve a member's effective permissions in an organization as exactly the `role_permissions` rows of their membership's catalog role. There SHALL be no per-user overrides, no deny entries, and no precedence or conflict resolution.

#### Scenario: Role grants the permission

- **WHEN** a permission check runs for a member whose role has a `role_permissions` row for the requested code
- **THEN** the check passes

#### Scenario: Role lacks the permission

- **WHEN** a permission check runs for a member whose role has no row for the requested code
- **THEN** the check fails with a permission-denied outcome (`403` at the API surface)

#### Scenario: Non-member is denied

- **WHEN** a permission check runs for a user with no active membership in the organization
- **THEN** the check fails regardless of the requested codes

### Requirement: OR semantics over multiple codes

When a check receives multiple permission codes, the system SHALL pass the check if the member's role grants at least one of them.

#### Scenario: One of several codes suffices

- **WHEN** a check runs for codes `[a, b]` and the member's role grants only `b`
- **THEN** the check passes

### Requirement: Effective permissions endpoint

The system SHALL expose the caller's effective permissions in the active organization, returning their catalog role (`id`, `key`, `name`), the role's `hierarchyLevel`, and the list of granted permission codes.

#### Scenario: Frontend reads effective permissions

- **WHEN** a member requests their effective permissions for the active organization
- **THEN** the response contains their role (`id`, `key`, `name`), its `hierarchyLevel`, and exactly the permission codes granted by that role

#### Scenario: Non-member gets no permission context

- **WHEN** a user requests effective permissions for an organization they do not belong to
- **THEN** the system returns no permission context for it (error or empty result, without disclosing organization data)

### Requirement: Role hierarchy level defines data scope

The `hierarchyLevel` of a member's role SHALL define the data scope of their access within the organization: `SELF` limits reads/writes to records they created; `ORGANIZATION` covers all records of the organization.

#### Scenario: SELF-scoped member sees only own records

- **WHEN** a member whose role has `hierarchyLevel = SELF` lists scoped business records
- **THEN** only records they created are returned

### Requirement: Catalog changes take effect for members

When a platform admin changes a role or its permissions in the catalog, the system SHALL apply the new permissions to every member holding that role — immediately, or within the bounded lifetime of any in-memory cache.

#### Scenario: Permission removal propagates

- **WHEN** a platform admin removes a permission from a role and a member holding that role triggers a new permission check for it
- **THEN** the check fails
