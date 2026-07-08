## Why

Today authorization runs **two role systems at once**: 4 hardcoded system roles (`MembershipRole` enum + in-memory `DEFAULT_ROLE_PERMISSIONS` baseline) and per-organization custom roles with persisted allow/deny grants, per-user overrides, and a precedence-based conflict engine (`OrganizationPermissionService.resolve`). That atomicity has no user: a gym never invents its own roles or tunes permissions per person — staff positions (owner, admin, receptionist, instructor) are the same in every gym. The dual model taxes every feature that touches authorization and multiplies test surface for behavior nobody exercises.

## What Changes

- **BREAKING** — Roles become a **single global catalog** shared by all organizations. `roles` loses `organizationId`, `systemKey`, and `isSystem`; it keeps `hierarchyLevel` (data scope) and gains a stable unique `key` (e.g. `owner`) so code can reference well-known roles without an enum.
- **BREAKING** — `permission_assignments` (role-XOR-user subject, allow/deny `value`, `precedence`) is replaced by **`role_permissions`** (`roleId` + `permissionCode`; row presence = grant). No per-user overrides, no explicit deny, no conflict resolution.
- **BREAKING** — `memberships.role` (enum) is removed; `memberships.roleId` becomes a `NOT NULL` FK to the global catalog. The `MembershipRole` enum, `DEFAULT_ROLE_PERMISSIONS`, `SYSTEM_ROLE_HIERARCHY`, and `MEMBERSHIP_ROLE_RANK` disappear.
- **BREAKING** — `invitations.role` (enum) becomes `invitations.roleId` (FK to the catalog); accepting an invitation creates the membership with that `roleId`.
- New **platform admin (SUPER_ADMIN)** user category: `users.isPlatformAdmin` flag, seeded system users that belong to no organization, with full platform access. Only platform admins manage the role catalog.
- Role management moves from `/organizations/:id/roles` (org permission guards) to **`/admin/roles`** behind a new `PlatformAdminGuard`. Organizations keep a **read-only** role listing to assign roles to members and invitations.
- `OrganizationPermissionService` is rewritten as a direct lookup — `membership.roleId` → `role_permissions` — small, stable, and cacheable in memory. The conflict engine, per-member permission override endpoints, and custom-role hierarchy gating are deleted.
- Seed the initial catalog (owner, admin, receptionist, instructor) with their permission sets, and backfill existing memberships/invitations from the old enum values.

## Capabilities

### New Capabilities
- `role-catalog`: the global role catalog and its permissions — `roles` (global, keyed) + `role_permissions`; platform-admin-only CRUD under `/admin/roles`; protected well-known roles; seed of the initial catalog; read-only listing for organizations.
- `platform-admin`: the SUPER_ADMIN system-user category — `users.isPlatformAdmin` flag, `PlatformAdminGuard`, seeding of initial platform admins, and their independence from memberships/organizations.
- `permission-evaluation`: how effective permissions resolve — direct role→permissions lookup, the permission guard contract, the effective-permissions endpoint for the frontend, and `hierarchyLevel` as data scope.

### Modified Capabilities
- `membership-management`: a membership references a catalog role via `roleId` (`NOT NULL`) instead of the `MembershipRole` enum; the single-owner invariant and owner-on-creation are expressed via the catalog `owner` role; changing a member's role takes a `roleId`; privilege wording moves from enum names to permissions.
- `invitations`: the invitation's target role becomes a `roleId` into the global catalog; accept provisions the membership with that `roleId`; privilege wording moves from enum names to permissions.
- `organization-management`: rename/delete requirements reworded from enum role names (`OWNER`/`ADMIN`) to the permissions that guard them (`organization:update`, `organization:delete`).

## Impact

- **Entities / DB**: `roles` altered (drop `organization_id`, `system_key`, `is_system`; add unique `key`); new `role_permissions` table; drop `permission_assignments`; `memberships` drops `role` enum and makes `role_id` `NOT NULL`; `invitations.role` → `role_id`; `users` gains `is_platform_admin`. No migration infra exists yet (dev runs `DB_SYNCHRONIZE=true`), so the change ships a seed/backfill script instead of formal migrations; enum→catalog mapping is defined in design.
- **Removed code**: `membership-role.enum.ts`, `DEFAULT_ROLE_PERMISSIONS` / `SYSTEM_ROLE_HIERARCHY`, `PermissionAssignment` entity + repositories, `PermissionAssignmentService`, conflict resolution in `OrganizationPermissionService`, custom-role hierarchy guards, per-member permission endpoints in `MembersController`, role CRUD in `organizations/:id/roles`.
- **Touched code**: `src/modules/permissions/**` (lookup service, matrix), `src/modules/roles/**` (admin controller + use cases), `src/modules/memberships/**`, `src/modules/invitations/**`, `src/modules/organizations/**` (views exposing roles), `src/common/` (guards, enums, `api-models.ts`), seeders, and the affected specs/tests.
- **API**: `/admin/roles*` (new, platform-admin only); `PATCH /organizations/:id/members/:userId/role` body changes to `roleId`; `POST /organizations/:id/invitations` takes `roleId`; member/organization views expose the catalog role (id, key, name) instead of the enum; permission-override and custom-role endpoints are removed.
- **Docs**: Postman collection, `ROADMAP.md`, `docs/propuesta-roles-simplificados.md` (mark as accepted/implemented).
