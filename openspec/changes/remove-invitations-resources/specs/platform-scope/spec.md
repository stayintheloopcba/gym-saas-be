## ADDED Requirements

### Requirement: Platform excludes generic resource CRUD

The backend platform SHALL NOT expose the generic `resources` example CRUD module in `gym-saas-be`.

#### Scenario: Resource module is not registered

- **WHEN** the application starts
- **THEN** no `ResourcesModule`, resource entity, resource repository, resource ownership registrar, or resource controller is registered

#### Scenario: Resource endpoints are absent

- **WHEN** a client calls any `/resources` endpoint
- **THEN** no generic resource CRUD behavior is available

### Requirement: Platform excludes invitation-based staff onboarding

The backend platform SHALL NOT expose invitation-based staff onboarding.

#### Scenario: Invitation permissions are absent

- **WHEN** the permission catalog is seeded
- **THEN** `members:invite` is not inserted
- **AND** no role references it

### Requirement: Permission catalog excludes removed resource actions

The permission catalog SHALL NOT include generic resource action codes.

#### Scenario: Resource permissions are absent

- **WHEN** the permission catalog is seeded
- **THEN** `resources:read`, `resources:create`, `resources:update`, and `resources:delete` are not inserted
- **AND** no role references them

