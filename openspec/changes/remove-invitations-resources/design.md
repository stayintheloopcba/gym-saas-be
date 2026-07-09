## Context

The current backend is still close to `generic-saas-be-template`. `invitations` and `resources` are useful in a generic SaaS starter, but they are not gym-domain concepts and now create misleading product surface:

- `InvitationsModule` is imported by `AppModule` and by `OrganizationsModule` for onboarding status.
- `ResourcesModule` is imported by `AppModule` and registers an ownership validator for a resource type that will disappear.
- The role catalog seed still grants `members:invite` and `resources:*` to gym staff roles.
- `gym-saas-fe` mockups and API helpers still present invitation and resources workflows.

## Goals / Non-Goals

**Goals:**

- Delete all runtime code and API surface for invitations and generic resources.
- Remove invitation/resource permission codes from the catalog and role seed.
- Keep staff management through existing memberships and role changes.
- Keep platform essentials: auth, users, organizations, memberships, roles, permissions, sessions, storage, platform-admin, health.
- Update backend/frontend architecture diagrams to reflect the target shape.

**Non-Goals:**

- Replace invitations with another self-service staff onboarding flow.
- Implement the gym-domain MVP modules in this change.
- Remove storage; it remains needed for organization branding, avatars, and future member photos.
- Remove role catalog or platform admin flows.

## Decisions

### 1. Staff onboarding is direct membership management

No token-based invitation lifecycle remains. An authorized staff-management flow can add, remove, or change staff memberships directly. If a future product needs email onboarding, it should be proposed as a gym-specific staff onboarding feature instead of reviving the generic invitation aggregate.

### 2. `members:invite` is deleted

With invitations gone, `members:invite` has no action to protect. Member/staff administration should use existing or future membership permissions such as `members:read`, `members:update`, or a dedicated staff-management permission if needed by a later change.

### 3. Generic `resources` is deleted, ownership infrastructure stays

The `resources` module and its ownership registrar are removed. The generic ownership framework under `permissions/ownership` stays because future domain modules may use it for `SELF` scoped access.

### 4. Permission seed becomes gym-platform only

Remove `resources:*` and `members:invite` from `PERMISSIONS`, the permission catalog seeder, tests, role seed defaults, Postman examples, and any frontend seed/demo data.

Initial role intent after removal:

| key | intent after removal |
| --- | --- |
| `owner` | all remaining organization permission codes |
| `admin` | all remaining organization permission codes except destructive owner-only actions |
| `receptionist` | organization/member read and operational gym-domain permissions as they are added |
| `instructor` | self-scoped read/update access to relevant gym-domain records as they are added |

### 5. Onboarding status stops listing invitations

`GetOnboardingStatusUseCase` should return only organization and membership-related status. Remove `pendingInvitations` from its output and remove the dependency on `ListMyInvitationsUseCase`.

### 6. OpenSpec cleanup

The active `invitations` capability should be archived/removed when this change is applied. There is no active `resources` spec, so the removal is captured in `platform-scope` and implementation tasks.

## Risks / Trade-offs

- **Existing frontend mockups break**: acceptable because the paired frontend proposal removes those routes and demos.
- **No invite-by-email workflow**: deliberate product simplification. Staff access becomes an admin operation instead of a self-service invitation lifecycle.
- **Role seed drift**: remove deleted codes before seeding roles, otherwise role-permission FK insertion will fail.
- **Dev DB churn**: with synchronize enabled, local tables may be dropped. This is acceptable for the current non-production state.

## Open Questions

- Should the eventual direct staff-add flow create a user record by email, or only attach existing users? This is out of scope for this removal proposal.

