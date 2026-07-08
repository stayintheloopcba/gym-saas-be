## Context

Authorization currently combines two systems (see `docs/propuesta-roles-simplificados.md`):

- **System roles**: `MembershipRole` enum (`OWNER`/`ADMIN`/`MEMBER`/`VIEWER`) on `memberships.role` and `invitations.role`, with in-memory baselines (`DEFAULT_ROLE_PERMISSIONS`, `SYSTEM_ROLE_HIERARCHY`, `MEMBERSHIP_ROLE_RANK`).
- **Custom roles per organization**: `roles` (with `organizationId`, `systemKey`, `isSystem`) + `permission_assignments` (subject = role XOR user, allow/deny `value`, `precedence`), resolved by a conflict engine in `OrganizationPermissionService` (highest precedence → user beats role → deny beats allow).

The target model is a **global role catalog** managed only by platform admins (SUPER_ADMIN), a plain `role_permissions` grant table, and `memberships.roleId NOT NULL`. Relevant constraints:

- The project has **no migration infrastructure**: dev runs TypeORM `DB_SYNCHRONIZE=true` (`src/config/database.config.ts`), there is no production deployment yet (repo is at its initial commit).
- `PermissionGuard` + `RequirePermissions` decorate all business routes and `requirePermission` is called inside use cases; their call sites should survive unchanged — only the resolution engine behind them changes.
- The frontend consumes `GET .../me/permissions` (`EffectivePermissions`) and the member/organization views that today expose the enum role.

## Goals / Non-Goals

**Goals:**

- One global role catalog, identical for every organization; only platform admins mutate it.
- Permission resolution becomes a direct lookup (`membership.roleId` → `role_permissions`) with no overrides, no deny, no precedence.
- SUPER_ADMIN as a user category (`users.isPlatformAdmin`) fully decoupled from memberships and organizations.
- Delete the enum role system and everything hanging off it.

**Non-Goals:**

- Per-organization role customization or per-user permission overrides (removed on purpose; revisit only if a large customer demands it).
- Ownership transfer flow (assigning the `owner` role to someone else) — future change.
- Platform-admin access to org-scoped business endpoints (cross-org impersonation/support tooling) — future change; `/admin/*` is their only surface for now.
- Formal migration tooling; the project stays on `DB_SYNCHRONIZE` for dev.

## Decisions

### 1. Catalog roles get a stable `key` (replaces `systemKey`/`isSystem`)

`roles` drops `organizationId`, `systemKey` (enum) and `isSystem`, and gains `key`: a unique, immutable kebab-case slug (`owner`, `admin`, `receptionist`, `instructor`). Code references well-known roles by `key` — the single-owner invariant and owner-on-org-creation need a stable handle to the `owner` role that survives display renames.

- *Alternative — look roles up by `name`*: rejected; names are display data and renameable by SUPER_ADMIN.
- *Alternative — keep a TS enum of role ids*: rejected; reintroduces the hardcoding this change removes. Only `owner` is special-cased in code (invariants); other roles are plain catalog data.

`hierarchyLevel` stays as an integer on the role using the existing `HierarchyLevel` values (SELF=1 / ORGANIZATION=5 / GLOBAL=10). `GLOBAL` remains reserved (platform admins don't use org permission checks at all).

### 2. `role_permissions`: presence = grant

New table `role_permissions` (`roleId` FK → `roles`, `permissionCode` FK → `permissions.code`, unique pair). No `userId`, no `value`, no `precedence`. `PermissionAssignment`, its repositories, `PermissionAssignmentService`, and the conflict engine are deleted. The permission-code catalog (`permissions` table + `PERMISSions` const) stays as-is, minus codes that no longer exist as org-level actions: `roles:create`, `roles:update`, `roles:delete`, `permissions:manage` are removed (catalog management is guarded by the platform-admin flag, not by org permissions). `roles:read` stays so org members can list the catalog when assigning roles.

### 3. `memberships.roleId NOT NULL`; enum column and `MembershipRole` deleted

A member has exactly one catalog role. `invitations.role` (enum) becomes `invitations.roleId` (uuid FK). Role deletion is rejected while any membership or pending invitation references it (checked in the delete use case; roles are soft-deleted like every `BaseEntity`).

**Owner handling without ranks:** the old `MEMBERSHIP_ROLE_RANK` gating disappears. To keep the single-owner invariant airtight with no rank system: the `owner` role is **not assignable** through change-member-role or invitations — it is only granted automatically at organization creation. Demoting or removing the sole owner stays rejected (`409`), as today.

- *Alternative — keep a rank column for gating*: rejected; with a fixed catalog and no role management inside orgs, the only dangerous assignment is `owner`, which one rule covers.

### 4. SUPER_ADMIN = `users.isPlatformAdmin` flag

Boolean column `users.is_platform_admin` (default `false`). Chosen over a separate table: one seldom-written flag, no join, trivially seeded.

- `PlatformAdminGuard` (after `JwtAuthGuard`) loads the current user and requires the flag — read fresh from DB each request so revocation is immediate (not embedded in the JWT).
- Seeding: `PLATFORM_ADMIN_EMAILS` env var (comma-separated); an idempotent seeder flags matching users at bootstrap (the two founders initially).
- Platform admins need no `Membership`. Org-scoped endpoints keep requiring membership (`ActiveOrgGuard`); the flag grants nothing there (Non-Goal).

### 5. `OrganizationPermissionService` becomes a lookup

`checkPermission(userId, orgId, code | codes)` → find active membership → load the role's permission codes → OR-semantics over the requested codes (unchanged contract for `PermissionGuard`, `RequirePermissions`, and every use-case call site). `getEffectivePermissions` now returns `{ role: { id, key, name }, hierarchyLevel, permissions }` — `role` stops being the enum, `customRoleId` disappears (frontend-visible change).

Role→permissions is cached in memory (per `roleId`), invalidated on catalog writes from `/admin/roles` — the catalog is tiny and changes rarely. Cache is a nice-to-have, not a correctness requirement: start with the plain query, add the cache in the same module if profiling ever demands it.

### 6. Admin API surface

- `GET/POST /admin/roles`, `PATCH/DELETE /admin/roles/:roleId` — catalog CRUD.
- `PUT /admin/roles/:roleId/permissions` — replace the role's full permission set (bulk, idempotent; the single-assign/unassign endpoints are not carried over).
- `GET /admin/permissions` — permission-code catalog for the admin UI.
- All behind `JwtAuthGuard + PlatformAdminGuard`; **not** behind `ActiveOrgGuard`/`PermissionGuard`.
- Org side keeps read-only `GET /organizations/:id/roles` (requires `roles:read`) so admins of a gym can pick roles for members/invitations. `PATCH /organizations/:id/members/:userId/role` body changes from `{ role }` to `{ roleId }`. The custom-role assignment endpoints (`PUT .../roles/:roleId/members/:userId`, `DELETE .../roles/assignments/:userId`) and member permission-override endpoints (`POST/DELETE .../members/:userId/permissions`) are removed.

### 7. Initial catalog seed (proposed — confirm before implementing)

| key | name | hierarchyLevel | permissions |
|---|---|---|---|
| `owner` | Dueño | ORGANIZATION | all org permission codes |
| `admin` | Administrador | ORGANIZATION | all minus `organization:delete` |
| `receptionist` | Recepcionista | ORGANIZATION | `organization:read`, `members:read`, `members:invite`, `resources:*`, `settings:read`, `roles:read`, `users:read` |
| `instructor` | Instructor | SELF | `organization:read`, `members:read`, `resources:read`, `resources:create`, `resources:update`, `settings:read` |

Seeder (extending the existing `permission-catalog.seeder` pattern) is idempotent with a simple rule: it creates a role **and** its permission rows only when no role with that `key` exists; existing roles are left entirely untouched. This is what makes SUPER_ADMIN edits survive restarts (reconciling missing rows would silently undo an admin's permission removal).

### 8. Data transition without migrations

`DB_SYNCHRONIZE` will add/drop columns on entity change, destroying old enum data in dev databases. Accepted: there is no production data (initial commit). Enum→catalog mapping for anyone who wants to preserve a dev DB (manual SQL before pulling): `OWNER→owner`, `ADMIN→admin`, `MEMBER→instructor`, `VIEWER→receptionist` (approximation — VIEWER gains invite rights; irrelevant for dev data). Otherwise: drop the dev DB and let synchronize + seeders rebuild it.

## Risks / Trade-offs

- **[Loss of flexibility] a gym cannot tailor roles** → deliberate (see proposal); the escape hatch is SUPER_ADMIN adding a role to the global catalog, visible to everyone. If a customer ever needs private roles, the catalog design (FK-based, keyed) can grow an `organizationId` column back without touching memberships.
- **[Owner not assignable] no ownership transfer path** → acceptable now; a dedicated transfer flow (atomic swap of two memberships' roles) is a small future change on top of this model.
- **[Frontend break] `EffectivePermissions.role` changes shape and member views expose `roleId`/`role.key` instead of the enum** → coordinate with `gym-saas-fe`; the `/me/permissions` payload documents the new shape; Postman collection updated in this change.
- **[Seeder drift] SUPER_ADMIN edits vs. idempotent seed** → seeder only inserts missing rows (roles by `key`, permission rows by pair); it never updates or deletes existing rows, so admin edits survive restarts.
- **[Dev data loss] synchronize drops the enum columns** → documented mapping for manual backfill; team is two people, both aware.

## Open Questions

- Confirm the initial catalog (names, `hierarchyLevel`, permission sets in Decision 7) before the seed task — especially whether `receptionist` should hold `members:invite`.
- Should `GET /organizations/:id/roles` eventually move to a plain `GET /roles` (catalog is no longer org-scoped)? Kept org-scoped for now to avoid a second frontend break.
