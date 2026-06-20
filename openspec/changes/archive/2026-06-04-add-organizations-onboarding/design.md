## Context

Phase 2 (`add-auth-ddd`, archived) established authenticated users and the DDD reference architecture: each module is split into `domain` / `application` / `infrastructure` / `interfaces`, persistence is reached only through repository ports bound to DI tokens, and request-scoped auth context lives in an `AsyncLocalStorage` populated by `AuthContextMiddleware` (which verifies the `access_token` cookie itself, independent of guard order). `BaseAuditEntity` reads `authContextStorage.getStore()?.accountId` directly to fill `createdBy` / `updatedBy`.

Today the `AuthContext` carries only `{ accountId }`. There is no tenant: a `User` belongs to no organization, so business data cannot yet be scoped. Phase 3 adds the tenant (`Organization`), the link (`Membership`), the growth mechanism (`Invitation`), and the **active-organization** that subsequent phases will scope every query to. CLAUDE.md mandates multi-tenancy from day one, a single active organization per request, and an onboarding gate (no org ⇒ no dashboard).

## Goals / Non-Goals

**Goals:**
- Model `Organization`, `Membership`, `Invitation` as DDD modules mirroring `users`/`auth`.
- Let a user create organizations, belong to several, and **select an active one** that is propagated request-scoped via the existing `AuthContext`/`AuthContextService`.
- Validate the active organization against the caller's memberships on **every** request (a stale or forged cookie must never grant access).
- Provide an invitation lifecycle (invite → accept/decline/revoke, with expiry) that provisions a membership on accept.
- Expose an onboarding-status signal so the frontend can route between onboarding and the dashboard.
- Keep coarse authorization on the `MembershipRole` enum; leave granular permissions for Phase 4.

**Non-Goals:**
- Granular `Role`/`Permission`/`RolePermission` entities and `@RequirePermissions` (Phase 4). `ownershipContext` on the `AuthContext` is still deferred.
- Sending invitation emails (no mailer in the MVP) — the token is surfaced through the API.
- Resources CRUD (Phase 5) and any frontend screens.
- Refresh-token rotation / org switching baked into the JWT claims (see Decision 2).

## Decisions

### Decision 1 — Active organization in a dedicated `httpOnly` cookie, not in the JWT

The active org is carried in its own `active_org` cookie (`httpOnly`, `sameSite=lax`, mirroring the auth cookies) rather than embedded as a JWT claim.

- **Why:** switching org must be cheap and must not require re-issuing/refreshing the token pair. The access token stays purely about *identity* (`sub`, `email`); the active org is *session navigation state*. Decoupling them means `POST /organizations/:id/select` just sets a cookie, and logout/refresh logic is untouched.
- **Trust model:** the cookie value is **never trusted on its own**. On each request `AuthContextMiddleware` reads it and the middleware (or the guard for business routes) confirms an active, non-deleted `Membership` exists for `(accountId, activeOrganizationId)`. A forged or stale cookie resolves to "no active org", which the `ActiveOrgGuard` rejects.
- **Alternative considered:** putting `activeOrg` in the access-token claims. Rejected — couples org switching to token refresh, bloats every audited write's context source, and makes revocation on membership removal lag until token expiry.

### Decision 2 — `AuthContext` extended additively; middleware stays the single populator

`AuthContext` becomes `{ accountId: string; activeOrganizationId?: string }`. `AuthContextMiddleware` is the only writer (consistent with Phase 2): after verifying the access token it reads the `active_org` cookie and **validates membership before** putting it in the store, so `authContextStorage` only ever holds a legitimately-active org. `AuthContextService` gains `getActiveOrganizationId()`.

- **Why:** business code and future tenant-scoped repositories read the active org from one trusted seam, exactly like `getAccountId()`. Keeping validation in the middleware means even non-guarded code paths can't observe a bogus org.
- **Trade-off:** the middleware now needs to ask the membership module whether the pair is valid, introducing a dependency from `common` → a membership lookup port. Mitigated by depending on a **port** (`MembershipContextPort` exposing `isActiveMember(userId, orgId)`), bound in the membership module and injected into the middleware — `common` stays free of TypeORM. `[Risk: a DB read per request]` → the lookup is a single indexed `(user_id, organization_id, deleted_at IS NULL)` hit; acceptable, and cacheable later if needed.

### Decision 3 — `ActiveOrgGuard` for business routes; org/account routes opt out

A lightweight `ActiveOrgGuard` reads `AuthContextService.getActiveOrganizationId()` and throws `403` when absent. Business routes (Phase 5 Resources, and `members`/`invitations` listing within an org) compose `JwtAuthGuard` + `ActiveOrgGuard`. Onboarding/account routes (`POST /organizations`, `GET /organizations` mine, select, `/onboarding/status`, `/invitations/mine`) require only `JwtAuthGuard`.

- **Why:** encodes the CLAUDE.md rule "a user without an organization cannot access the dashboard" as a guard, not scattered checks. The org-scoped member/invitation endpoints already take `:id` in the path; the guard ensures the path org equals the active org (defense in depth against acting on an org you've merely guessed the id of).

### Decision 4 — `Membership` owns the role; coarse RBAC via `MembershipRole`

`Membership` carries `role: MembershipRole` (`OWNER`/`ADMIN`/`MEMBER`/`VIEWER`). Authorization in Phase 3 is coarse: only `OWNER`/`ADMIN` may invite or remove members or rename/delete the org; `OWNER` is unique per org and cannot be removed or demoted while sole owner.

- **Why:** Phase 4 introduces the granular `Role`/`Permission` tables. Until then the enum is enough for the onboarding/management flows, and modeling it on the membership matches CLAUDE.md (roles exist now; permissions are separated later without rewriting the membership).
- **Alternative:** build the full permission tables now. Rejected — out of MVP scope for this phase and would couple two phases' risk.

### Decision 5 — Org creation atomically creates the owner membership

`CreateOrganizationUseCase` creates the `Organization` **and** the `OWNER` `Membership` for the creator in one transaction, and sets it active. A user who just registered and creates an org is immediately onboarded.

- **Why:** an org with no owner is an invalid state; doing both in a transaction prevents orphan orgs. `[Risk: partial failure]` → wrap in a TypeORM transaction (`DataSource.transaction`), exposed behind a repository/use-case boundary so the application layer stays persistence-agnostic.

### Decision 6 — Invitations are opaque-token based, email-addressed, idempotent per email

An `Invitation` stores a `crypto.randomBytes` opaque token (looked up on accept), the invitee `email`, target `role`, `status`, and `expiresAt` (`now + INVITATION_TTL`). Accepting requires the authenticated user's email to match the invitation email, that the invite is `PENDING` and not expired, and that no active membership already exists; it then creates the membership and marks the invite `ACCEPTED`. Re-inviting an already-pending email returns the existing pending invite rather than duplicating.

- **Why:** matches the "invite by email, accept after registering" flow without a mailer. Binding accept to the authenticated user's email prevents token theft from granting access to a different account. `[Risk: expired-but-PENDING rows]` → treated as expired on read (status computed/guarded at accept time); a sweep job is out of scope.

## Risks / Trade-offs

- **Cross-module dependency `common → memberships` (via port).** → Inject a `MembershipContextPort` token bound in `MembershipsModule`; `CommonModule` stays TypeORM-free and the middleware depends on an interface, not the concrete repo. If a circular import appears, the port lives in `common` and is *implemented* in memberships.
- **Per-request membership validation cost.** → Single indexed lookup; revisit with a short-lived cache only if profiling shows it matters (not in this phase).
- **Slug uniqueness with soft delete.** → Unique partial index on `slug WHERE deleted_at IS NULL`, so a deleted org's slug can be reused; generate slug from name with a collision suffix.
- **Active-org cookie set on a different path scope than refresh.** → Scope `active_org` to `/` (needed on all business routes), unlike the refresh cookie scoped to `/auth/refresh`; document in the cookie helper.
- **Removing a member / deleting an org while it's someone's active org.** → The next request's middleware validation fails membership and drops the active org to none, routing them back to onboarding — no stale access. Worth a test.

## Migration Plan

Additive only — three new tables, new optional `AuthContext` field, new env vars. `synchronize` (dev) creates the tables; no data migration. Rollback = remove the three modules and revert the `AuthContext`/middleware/service edits. No production deploy in the MVP.

## Open Questions

- Should `GET /organizations/:id/members` and the invitation listing live under the org modules or a combined endpoint? (Leaning: members under `memberships` interface, invitations under `invitations` interface, both mounted on the `organizations/:id` path.) — resolved during tasks, not blocking.
