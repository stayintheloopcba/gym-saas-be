## REMOVED Requirements

### Requirement: Invitation aggregate

The system SHALL no longer provide an `Invitation` aggregate.

#### Scenario: Invitation entity is absent

- **WHEN** the application starts
- **THEN** no invitation entity, repository, module, or controller is registered

### Requirement: Create invitation

The system SHALL no longer allow staff invitations to be created.

#### Scenario: Invitation creation endpoint is absent

- **WHEN** a client calls `POST /organizations/:id/invitations`
- **THEN** no invitation workflow exists for the request

### Requirement: List pending invitations

The system SHALL no longer list pending organization invitations.

#### Scenario: Organization invitation list endpoint is absent

- **WHEN** a client calls `GET /organizations/:id/invitations`
- **THEN** no pending-invitation response is available

### Requirement: List my invitations

The system SHALL no longer list invitations addressed to the current user.

#### Scenario: My invitations endpoint is absent

- **WHEN** a client calls `GET /invitations/mine`
- **THEN** no invitation inbox response is available

### Requirement: Revoke invitation

The system SHALL no longer revoke invitations.

#### Scenario: Invitation revoke endpoint is absent

- **WHEN** a client calls `DELETE /invitations/:id`
- **THEN** no invitation can be revoked

### Requirement: Accept invitation

The system SHALL no longer accept invitation tokens to create memberships.

#### Scenario: Invitation accept endpoint is absent

- **WHEN** a client calls `POST /invitations/accept`
- **THEN** no membership is created from an invitation token

### Requirement: Decline invitation

The system SHALL no longer decline invitations.

#### Scenario: Invitation decline endpoint is absent

- **WHEN** a client calls `POST /invitations/decline`
- **THEN** no invitation status is changed

