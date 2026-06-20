## 1. Bootstrap & shared pieces

- [x] 1.1 Add a `MembershipRole` enum (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) under `src/common/enums/`.
- [x] 1.2 Add an `InvitationStatus` enum (`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`) under `src/common/enums/`.
- [x] 1.3 Add `ACTIVE_ORG_COOKIE` (default `active_org`) and `INVITATION_TTL` (default `7d`) to `.env.example`.
- [x] 1.4 Add a `slugify` helper (lowercase, trim, strip diacritics, hyphenate) under `src/common/lib/` (or reuse if present).

## 2. Organizations module — domain layer

- [x] 2.1 `modules/organizations/domain/organization.entity.ts`: `Organization extends BaseEntity` with `name` and unique `slug` (`@Index unique`, partial on `deleted_at IS NULL` semantics documented). `@Entity('organizations')`.
- [x] 2.2 `OrganizationRepository` port (`findById`, `findBySlug`, `save`, `softDelete`) with DI token `ORGANIZATION_REPOSITORY`.
- [x] 2.3 Domain errors: `OrganizationNotFoundError`, `SlugTakenError`.

## 3. Memberships module — domain layer

- [x] 3.1 `modules/memberships/domain/membership.entity.ts`: `Membership extends BaseEntity` with `userId`, `organizationId`, `role: MembershipRole`. Unique index on `(user_id, organization_id)` for non-deleted rows. `@Entity('memberships')`.
- [x] 3.2 `MembershipRepository` port (`findByUserAndOrg`, `findByUser`, `findByOrg`, `countOwners`, `save`, `softDelete`) with DI token `MEMBERSHIP_REPOSITORY`.
- [x] 3.3 Domain errors: `DuplicateMembershipError`, `MembershipNotFoundError`, `SoleOwnerError`, `InsufficientRoleError`.
- [x] 3.4 Define a `MembershipContextPort` interface + token in `src/common/context/` (method `isActiveMember(userId, orgId): Promise<boolean>`) so `common` can validate the active org without depending on TypeORM.

## 4. Invitations module — domain layer

- [x] 4.1 `modules/invitations/domain/invitation.entity.ts`: `Invitation extends BaseEntity` with `organizationId`, `email`, `role`, `token` (indexed unique), `status`, `expiresAt`. `@Entity('invitations')`, index `(organization_id, email)`.
- [x] 4.2 `InvitationRepository` port (`findByToken`, `findPendingByOrgAndEmail`, `findPendingByOrg`, `findPendingByEmail`, `save`) with DI token `INVITATION_REPOSITORY`.
- [x] 4.3 Domain errors: `InvitationNotFoundError`, `InvitationNotPendingError`, `InvitationExpiredError`, `InvitationEmailMismatchError`, `AlreadyMemberError`.

## 5. Organizations module — application

- [x] 5.1 `CreateOrganizationUseCase`: derive unique slug (collision suffix via `findBySlug`), create org + `OWNER` membership atomically in a `DataSource.transaction`, return the org. (Inject membership repo or a transactional unit-of-work port; keep the application layer persistence-agnostic.)
- [x] 5.2 `GetOrganizationUseCase` (404 if not found / caller not a member).
- [x] 5.3 `RenameOrganizationUseCase` (requires caller role `OWNER`/`ADMIN`).
- [x] 5.4 `DeleteOrganizationUseCase` (requires `OWNER`; soft delete).
- [x] 5.5 `ListMyOrganizationsUseCase` (orgs where caller has active membership, with the caller's role).

## 6. Memberships module — application

- [x] 6.1 `ListOrganizationMembersUseCase` (returns memberships joined to each member's public profile + role).
- [x] 6.2 `RemoveMemberUseCase` (requires `OWNER`/`ADMIN`; rejects removing the sole `OWNER` → `SoleOwnerError`; soft delete).
- [x] 6.3 A small `OrganizationRoleService` (or shared helper) that loads the caller's membership and enforces a minimum role, throwing `InsufficientRoleError`; reused by org/membership/invitation use cases.

## 7. Invitations module — application

- [x] 7.1 `CreateInvitationUseCase`: requires caller `OWNER`/`ADMIN`; reject if email already an active member (`AlreadyMemberError`); idempotent on existing pending invite; opaque token via `crypto.randomBytes`; `expiresAt = now + INVITATION_TTL`.
- [x] 7.2 `ListPendingInvitationsUseCase` (org-scoped, requires `OWNER`/`ADMIN`).
- [x] 7.3 `ListMyInvitationsUseCase` (pending, non-expired, matching the caller's email).
- [x] 7.4 `RevokeInvitationUseCase` (requires `OWNER`/`ADMIN`; sets `REVOKED`).
- [x] 7.5 `AcceptInvitationUseCase`: validate token, `PENDING`, not expired, email matches caller, not already a member; create membership with the invite role + mark `ACCEPTED`, atomically.
- [x] 7.6 `DeclineInvitationUseCase`: validate token + email match; mark declined (no membership).

## 8. Infrastructure & module wiring

- [x] 8.1 `TypeOrmOrganizationRepository`, `TypeOrmMembershipRepository`, `TypeOrmInvitationRepository` implementing their ports.
- [x] 8.2 `TypeOrmMembershipContextAdapter` implementing `MembershipContextPort` (single indexed lookup) — bound in `MembershipsModule` and exported.
- [x] 8.3 `OrganizationsModule`, `MembershipsModule`, `InvitationsModule` (`TypeOrmModule.forFeature`, bind ports→adapters, export what other modules consume). Memberships exports `MembershipContextPort` + member-lookup use cases; organizations imports memberships; invitations imports memberships.
- [x] 8.4 Register the three modules in `app.module.ts`.

## 9. Active-organization context

- [x] 9.1 Extend `AuthContext` with optional `activeOrganizationId`; add `AuthContextService.getActiveOrganizationId()`.
- [x] 9.2 In `AuthContextMiddleware`, after verifying the access token read the `active_org` cookie and call `MembershipContextPort.isActiveMember`; only put `activeOrganizationId` in the store when valid. Wire the port into `CommonModule` (provided by `MembershipsModule`; resolve the circular-import risk by keeping the port interface in `common`).
- [x] 9.3 `ActiveOrgGuard` (interfaces/common): throws `403` when `getActiveOrganizationId()` is absent; for org-scoped routes, assert path `:id` equals the active org.

## 10. Interfaces (controllers, DTOs, cookies)

- [x] 10.1 Active-org cookie helper: set/clear `active_org` (`httpOnly`, `sameSite=lax`, `secure=COOKIE_SECURE`, `domain=COOKIE_DOMAIN`, path `/`).
- [x] 10.2 DTOs (class-validator): `CreateOrganizationDto`, `RenameOrganizationDto`, `CreateInvitationDto` (email + role), `AcceptInvitationDto`/`DeclineInvitationDto` (token).
- [x] 10.3 `OrganizationsController` (JWT guarded): `POST /organizations`, `GET /organizations`, `GET /organizations/:id`, `PATCH /organizations/:id`, `DELETE /organizations/:id`, `POST /organizations/:id/select`, `POST /organizations/select/clear`.
- [x] 10.4 `MembersController`: `GET /organizations/:id/members`, `DELETE /organizations/:id/members/:userId` (JWT + `ActiveOrgGuard` matching `:id`).
- [x] 10.5 `InvitationsController`: `POST /organizations/:id/invitations`, `GET /organizations/:id/invitations` (org-scoped, guarded); `DELETE /invitations/:id`, `POST /invitations/accept`, `POST /invitations/decline`, `GET /invitations/mine` (JWT only).
- [x] 10.6 `OnboardingController`: `GET /onboarding/status` (JWT only) — reports memberships count, active org, pending invitations for the caller's email.
- [x] 10.7 Map domain errors to HTTP via a `DomainExceptionFilter` (reuse/extend the auth one): not-found→404, duplicate/sole-owner/already-member→409, expired→410, role/email-mismatch→403.

## 11. Tests

- [x] 11.1 Unit: `CreateOrganizationUseCase` (slug collision suffix; owner membership created; atomicity).
- [x] 11.2 Unit: `RemoveMemberUseCase` (sole-owner rejected; admin removes member; member without privilege rejected).
- [x] 11.3 Unit: `AcceptInvitationUseCase` (email-mismatch, expired, already-resolved, already-member branches; happy path creates membership).
- [x] 11.4 Unit: `CreateInvitationUseCase` (idempotent pending; existing-member rejected; role check).
- [x] 11.5 Unit: active-org validation — middleware/service drops a forged/stale active-org cookie (no active membership ⇒ no active org).

## 12. Docs

- [x] 12.1 Add the organizations / members / invitations / onboarding endpoints to the Postman collection.
- [x] 12.2 Update `ROADMAP.md`: Phase 3 → in progress/done, record decisions (active-org cookie not in JWT, coarse RBAC via `MembershipRole`, atomic owner-membership, opaque invitation tokens) and MVP exclusions (no mailer, granular permissions in Phase 4).
- [x] 12.3 Run `npm run lint` and `npm run test`; ensure green.
