## Why

Phase 2 gave us authenticated users, but the product is **multi-tenant from day one** and a `User` today is tenant-agnostic: there is no organization, no membership, and no way to scope business data to a tenant. Until a user can belong to (and act within) an organization, the dashboard and every future business capability (roles, CRUDs) have nothing to scope to. Phase 3 introduces organizations, the membership that links users to them, the invitation flow to grow a tenant, and the **active-organization context** that the rest of the product will read.

This also makes the onboarding rule real: a freshly registered user has **no** organization and must not reach the dashboard — they go through onboarding (create an organization, or accept a pending invitation) first.

## What Changes

- Introduce an **`Organization` aggregate** (`extends BaseEntity`: UUID, soft delete, audit) with a display `name` and a unique `slug`. CRUD: create, get, rename, soft delete.
- Introduce a **`Membership` aggregate** linking a `User` to an `Organization` with a `MembershipRole` (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`). A user may belong to several organizations; an organization always has exactly one `OWNER`. Lists: members of an organization, organizations of the current user.
- Introduce an **`Invitation` aggregate**: invite a not-yet-member by email with a target role; carries an opaque token, a status (`PENDING`/`ACCEPTED`/`REVOKED`/`EXPIRED`) and an `expiresAt`. Flows: invite, list pending, revoke, accept (creates the membership), decline.
- Add an **active-organization context**: the selected organization id travels in a dedicated `httpOnly` cookie, is validated against the user's memberships, and is exposed request-scoped via the existing `AuthContext` (extended with an optional `activeOrganizationId`) plus `AuthContextService.getActiveOrganizationId()`.
- Add an **`ActiveOrgGuard`** that business routes use to require a valid active organization (membership-checked); routes without it are onboarding/account routes.
- Add an **onboarding status** signal so the frontend can route: does the current user have any membership / any pending invitation, and which (if any) organization is active.
- Endpoints (all under the JWT guard): `POST /organizations`, `GET /organizations` (mine), `GET /organizations/:id`, `PATCH /organizations/:id`, `DELETE /organizations/:id`; `POST /organizations/:id/select` (set active) and `POST /organizations/select/clear`; `GET /organizations/:id/members`, `DELETE /organizations/:id/members/:userId`; `POST /organizations/:id/invitations`, `GET /organizations/:id/invitations`, `DELETE /invitations/:id` (revoke), `POST /invitations/accept`, `POST /invitations/decline`, `GET /invitations/mine`; `GET /onboarding/status`.
- Follow the **DDD layering** established by `add-auth-ddd` (domain / application / infrastructure / interfaces) for each new module.
- Extend the Postman collection and `ROADMAP.md`.

Out of scope (per CLAUDE.md MVP exclusions): granular `Role`/`Permission`/`RolePermission` entities and the permission guard (Phase 4 — Phase 3 uses the `MembershipRole` enum for coarse authorization only); email delivery of invitations (the token is returned/listed via the API, no mailer); the Resources CRUD (Phase 5); frontend screens (tracked separately on the `saas-web` side).

## Capabilities

### New Capabilities
- `organization-management`: the `Organization` aggregate and its persistence — create, rename, look up by id/slug, soft delete, slug uniqueness among non-deleted organizations.
- `membership-management`: the `Membership` aggregate linking users and organizations with a `MembershipRole`; creating the owner membership on org creation, listing an organization's members, listing a user's organizations, removing a member, and the single-owner invariant.
- `invitations`: the `Invitation` aggregate and its lifecycle — invite by email + role, opaque token, pending list, revoke, accept (provisions a membership), decline, and expiry handling.
- `organization-context`: active-organization selection — the validated active-org cookie, the `AuthContext`/`AuthContextService` extension, the `ActiveOrgGuard`, and the `/onboarding/status` signal that drives the onboarding-vs-dashboard routing.

### Modified Capabilities
<!-- None — the auth specs' requirements do not change. The AuthContext interface is extended additively (new optional field), which is an implementation detail of `organization-context`, not a behavior change to `authentication`. -->

## Impact

- **New code:** `src/modules/organizations/**`, `src/modules/memberships/**`, `src/modules/invitations/**` (each split into `domain`/`application`/`infrastructure`/`interfaces`), wired into `app.module.ts`.
- **Touched code:** `src/common/context/auth-context.store.ts` (add optional `activeOrganizationId` to `AuthContext`), `auth-context.middleware.ts` (read + validate the active-org cookie), `auth-context.service.ts` (expose `getActiveOrganizationId()`), `app.module.ts` (register the three new modules).
- **Entities / DB:** three new tables (`organizations`, `memberships`, `invitations`) with the usual UUID + soft-delete + audit columns; `memberships` has a unique `(user_id, organization_id)` constraint among non-deleted rows; `invitations` indexes `token` and `(organization_id, email)`.
- **Config / env:** add `ACTIVE_ORG_COOKIE` name (default `active_org`) and `INVITATION_TTL` (e.g. `7d`) to `.env.example`; reuse the existing `COOKIE_*` settings.
- **New dependencies:** none expected (token generation uses Node `crypto`).
- **Docs:** `ROADMAP.md` (Phase 3 → in progress) and the Postman collection.
