## MODIFIED Requirements

### Requirement: Rename organization

A member holding the `organization:update` permission SHALL be able to change the organization `name`.

#### Scenario: Privileged member renames

- **WHEN** a member with `organization:update` sends `PATCH /organizations/:id` with a new `name`
- **THEN** the system updates the name and returns the organization

#### Scenario: Member without privilege cannot rename

- **WHEN** a member whose role lacks `organization:update` attempts `PATCH /organizations/:id`
- **THEN** the system responds `403` and leaves the organization unchanged

### Requirement: Soft delete organization

A member holding the `organization:delete` permission SHALL be able to soft-delete the organization. The slug SHALL become reusable after deletion.

#### Scenario: Privileged member deletes the organization

- **WHEN** a member with `organization:delete` sends `DELETE /organizations/:id`
- **THEN** the organization's `deletedAt` is set and it no longer appears in lookups

#### Scenario: Deleted slug can be reused

- **WHEN** a new organization is created with a name whose slug matches a previously deleted organization's slug
- **THEN** the new organization is created with that slug
