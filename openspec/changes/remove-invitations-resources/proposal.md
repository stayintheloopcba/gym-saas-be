## Why

`gym-saas-be` still carries two generic SaaS concepts that do not belong to the gym MVP business model:

- `invitations`: an email-token onboarding flow for staff users.
- `resources`: a template CRUD used as an example module.

The product direction is to keep staff membership management explicit and owner/admin controlled, then build the real gym domain (`members`, `plans`, `subscriptions`, `payments`, `access`) on top of the platform. Keeping invitations and resources makes the API, permissions, OpenAPI docs, Postman collection, frontend mockups, and role catalog look broader than the product actually is.

## What Changes

- **BREAKING** - Remove the `invitations` module end to end: entity, repository, unit of work, use cases, controller, DTOs, view model, tests, enum, OpenAPI models, Postman folder, and active OpenSpec capability.
- **BREAKING** - Remove all invitation endpoints:
  - `POST /organizations/:id/invitations`
  - `GET /organizations/:id/invitations`
  - `GET /invitations/mine`
  - `DELETE /invitations/:id`
  - `POST /invitations/accept`
  - `POST /invitations/decline`
- **BREAKING** - Remove the `resources` example module end to end: entity, repository, ownership registrar, use cases, controller, DTOs, view model, tests, OpenAPI models, Postman folder, and app module registration.
- **BREAKING** - Remove all resource endpoints under `/resources`.
- Remove permission codes that only exist for those removed flows: `members:invite`, `resources:read`, `resources:create`, `resources:update`, `resources:delete`.
- Update role seed data so `owner`, `admin`, `receptionist`, and `instructor` no longer reference removed permission codes.
- Simplify onboarding status so it no longer returns or depends on pending invitations.
- Keep direct member creation/removal and role change flows as the staff-management mechanism.

## Capabilities

### Removed Capabilities

- `invitations`: staff invitation lifecycle is removed from the platform.

### New Capabilities

- `platform-scope`: documents that the reusable platform excludes generic invitation and resource business flows.

### Modified Capabilities

- `membership-management`: staff is managed through memberships directly; no invitation-based membership creation.
- `role-catalog` / `permission-evaluation`: catalogs and effective permissions must not expose removed permission codes.
- `organization-management`: onboarding responses no longer include pending invitations.

## Impact

- **Backend code**: `src/modules/invitations/**`, `src/modules/resources/**`, `InvitationStatus`, `InvitationsModule`, `ResourcesModule`, resource ownership registration, invitation UoW, and affected tests are deleted.
- **API contract**: OpenAPI and Postman remove Invitations and Resources folders/models/variables. Clients must stop calling those endpoints.
- **Database**: with `DB_SYNCHRONIZE=true`, removed entities drop from the dev schema. If any local dev data matters, export it before accepting this change.
- **Frontend coordination**: `gym-saas-fe` must remove invitation API types/actions/mockups and resources screens/navigation.
- **Docs/diagrams**: platform diagrams must show only reusable base modules plus real gym-domain modules, not the generic template CRUD or invitation workflow.

