## ADDED Requirements

### Requirement: User aggregate
The system SHALL provide a `User` aggregate that extends the base entity (UUID identifier, audit fields, soft delete). A `User` MUST hold a unique email, an optional password hash, an optional Google identifier, a display name, and an authentication provider marker (`LOCAL` or `GOOGLE`).

#### Scenario: User has base entity fields
- **WHEN** a `User` is persisted
- **THEN** it has a generated UUID `id`, `createdAt`, `updatedAt`, `deletedAt` (null), `createdBy`, and `updatedBy`

#### Scenario: Email is unique
- **WHEN** a second `User` is created with an email already used by a non-deleted user
- **THEN** the system rejects it with a conflict error and does not persist the duplicate

### Requirement: Email normalization
The system SHALL normalize email addresses to lowercase and trim surrounding whitespace before persisting or comparing them.

#### Scenario: Mixed-case email
- **WHEN** a user is created with email `  John@Example.COM `
- **THEN** the stored email is `john@example.com`

### Requirement: User creation
The system SHALL expose a use case to create a `User` from an email, display name, authentication provider, and either a password hash (LOCAL) or a Google id (GOOGLE).

#### Scenario: Create local user
- **WHEN** the create use case runs with provider `LOCAL`, a valid email, a name, and a password hash
- **THEN** a `User` is persisted with `provider = LOCAL` and the given password hash

#### Scenario: Create Google user without password
- **WHEN** the create use case runs with provider `GOOGLE`, an email, a name, and a Google id
- **THEN** a `User` is persisted with `provider = GOOGLE`, a `googleId`, and a null password hash

### Requirement: User lookup
The system SHALL expose use cases to find a non-deleted `User` by id, by email, and by Google id.

#### Scenario: Find existing user by email
- **WHEN** a lookup by email runs for an existing non-deleted user
- **THEN** the matching `User` is returned

#### Scenario: Lookup excludes soft-deleted users
- **WHEN** a lookup by email or id runs for a user whose `deletedAt` is set
- **THEN** no user is returned

### Requirement: Repository port
The `User` persistence SHALL be accessed through a repository port (interface) defined in the domain layer; the TypeORM implementation lives in the infrastructure layer and is bound by dependency injection.

#### Scenario: Application depends on the port
- **WHEN** an application use case needs to read or write a `User`
- **THEN** it depends on the repository port interface, not on TypeORM types directly
