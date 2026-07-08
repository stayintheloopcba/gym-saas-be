## 1. Data model & enum removal

- [x] 1.1 Rework `Role` entity: drop `organizationId`, `systemKey`, `isSystem`; add unique immutable `key`; keep `hierarchyLevel`; replace the org-scoped unique index with a global one on `key`
- [x] 1.2 Create `RolePermission` entity (`role_permissions`: `roleId` + `permissionCode`, unique pair, FKs) and delete the `PermissionAssignment` entity
- [x] 1.3 Update `Membership` (drop `role` enum column; `roleId` becomes `NOT NULL`) and `Invitation` (`role` enum → `roleId` uuid FK)
- [x] 1.4 Add `users.isPlatformAdmin` (boolean, default `false`) to the `User` entity
- [x] 1.5 Delete `membership-role.enum.ts` (`MembershipRole`, `MEMBERSHIP_ROLE_RANK`) and `SYSTEM_ROLE_HIERARCHY` from `hierarchy-level.enum.ts`; remove `DEFAULT_ROLE_PERMISSIONS` and drop `roles:create`, `roles:update`, `roles:delete`, `permissions:manage` from `PERMISSIONS` in `permission-key.ts`; update the permission-catalog seeder accordingly

## 2. Permission evaluation rewrite

- [x] 2.1 Add a `RolePermission` repository port + TypeORM adapter (find codes by `roleId`); delete `permission-assignment.repository` (port + adapter) and `PermissionAssignmentService`
- [x] 2.2 Rewrite `OrganizationPermissionService` as a direct lookup (`membership.roleId` → role permission codes), preserving OR semantics for multi-code checks and the `checkPermission`/`requirePermission` contracts used by guards and use cases
- [x] 2.3 Change `EffectivePermissions` to `{ role: { id, key, name }, hierarchyLevel, permissions }` (drop `customRoleId` and the enum) and update `my-permissions.controller`, view models, and `api-models.ts`
- [x] 2.4 Rewrite `organization-permission.service.spec.ts` for the lookup semantics (grant by presence, non-member denied, OR semantics, no overrides)

## 3. Platform admin (SUPER_ADMIN)

- [x] 3.1 Implement `PlatformAdminGuard` (after `JwtAuthGuard`; reads `isPlatformAdmin` fresh from DB; `403` otherwise) with unit tests
- [x] 3.2 Add `PLATFORM_ADMIN_EMAILS` to config + `.env.example`, and an idempotent bootstrap seeder that flags matching users
- [x] 3.3 Verify org-scoped endpoints stay membership-gated for platform admins (no bypass) — cover with a test

## 4. Global role catalog & admin API

- [x] 4.1 Confirm the initial catalog with the team (names, `hierarchyLevel`, permission sets — see design Decision 7, esp. `receptionist` + `members:invite`)
- [x] 4.2 Implement `/admin/roles` use cases + controller: list, create (unique `key`), update (`key` immutable), delete (reject `owner` and roles referenced by active memberships or pending invitations) — guarded by `PlatformAdminGuard`
- [x] 4.3 Implement `PUT /admin/roles/:roleId/permissions` (replace full set) and `GET /admin/permissions` (code catalog)
- [x] 4.4 Remove org-scoped role management: role CRUD use cases/endpoints under `/organizations/:id/roles`, custom-role member assignment (`PUT .../roles/:roleId/members/:userId`, `DELETE .../roles/assignments/:userId`), bulk/single role-permission endpoints, and `assertWithinCallerHierarchy`-style guards; keep `GET /organizations/:id/roles` as read-only catalog listing (requires `roles:read`)
- [x] 4.5 Implement the idempotent role-catalog seeder (creates `owner`/`admin`/`receptionist`/`instructor` + permission rows only when the `key` is missing; never touches existing roles)

## 5. Memberships, invitations & organizations

- [x] 5.1 Update org creation flow to assign the catalog `owner` role to the creator (lookup by `key`, atomic with the organization)
- [x] 5.2 Rewrite `change-member-role` use case: accept `roleId`, validate it exists, reject assigning `owner` (`409`), keep sole-owner protection; update `UpdateMemberRoleDto` and the members controller
- [x] 5.3 Remove per-member permission override endpoints (`POST/DELETE /organizations/:id/members/:userId/permissions`) and their service methods
- [x] 5.4 Update invitations: `CreateInvitationDto` takes `roleId` (validate exists, reject `owner`), accept-invitation creates the membership with the invitation's `roleId`, invitation views expose the catalog role
- [x] 5.5 Update member/organization list views (`OrganizationMember`, `organization.view`, `api-models.ts`) to expose the catalog role (`id`, `key`, `name`) instead of the enum
- [x] 5.6 Update all affected unit tests (memberships, invitations, organizations, roles, guards)

## 6. Cleanup, verification & docs

- [x] 6.1 Sweep the codebase for remaining `MembershipRole` / `DEFAULT_ROLE_PERMISSIONS` / `permission_assignments` references and delete dead code (DTOs, views, matrix service remnants)
- [x] 6.2 Reset dev DB (or apply the manual mapping in design Decision 8), boot with `DB_SYNCHRONIZE=true`, verify seeders (permissions, roles, platform admins) and exercise the main flows end-to-end
- [x] 6.3 Run lint + full test suite green
- [x] 6.4 Update Postman collection, `ROADMAP.md`, and mark `docs/propuesta-roles-simplificados.md` as accepted/implemented
