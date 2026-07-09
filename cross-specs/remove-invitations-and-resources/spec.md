---
feature: remove-invitations-and-resources
stage: implementing
updated: 2026-07-09
branch: feature/remove-invitations-and-resources
cross_spec: ../../../cross-specs/wip/2026-07-08-2327-remove-invitations-and-resources/
cross_repo: local (no remote configured)
---

# Remove Invitations and Resources — gym-saas-be slice

## Summary

Delete the Invitations and Resources modules entirely (entities, use cases, controllers,
DTOs, repositories, permission keys), rewrite the two cross-module couplings that depend
on Invitations (`onboarding/status` response, role-deletion guard), and clean up this
repo's local OpenSpec docs that describe Invitations. See the cross spec's
`2-technical/technical.md` for the full contract.

## This app's tasks

| # | Task | Depends on | Status |
|---|------|------------|--------|
| 1 | Delete the Invitations module in full: `src/modules/invitations/` and `src/common/enums/invitation-status.enum.ts`. | — | [x] |
| 2 | Delete the Resources module in full: `src/modules/resources/`. | — | [x] |
| 3 | Remove module wiring: drop `InvitationsModule`/`ResourcesModule` imports from `app.module.ts`, and `InvitationsModule` import from `organizations.module.ts` and `roles.module.ts`. | 1, 2 | [x] |
| 4 | Rewrite the `onboarding/status` contract to drop `pendingInvitations`. | 1, 3 | [x] |
| 5 | Rewrite `DeleteRoleUseCase` to drop the pending-invitations guard. | 1, 3 | [x] |
| 6 | Remove `members:invite` and `resources:*` permission keys from the catalog/seeder. | 1, 2 | [x] |
| 7 | Update affected unit tests. | 1, 2, 4, 5, 6 | [x] |
| 8 | Clean up this repo's local OpenSpec docs referencing Invitations. | 1 | [x] |
| 9 | Verify: grep sweep, lint, full test suite, acceptance scenarios. | 1-8 | [x] |
