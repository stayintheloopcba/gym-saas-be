---
feature: data-model-migration
stage: implementing
updated: 2026-07-10
branch: feature/data-model-migration
cross_spec: ../../../gym-saas-knowledge-base/wip/2026-07-09-data-model-migration/
cross_repo: https://github.com/stayintheloopcba/gym-saas-knowledge-base
---

# Data model migration — gym-saas-be slice

## Summary

Reshapes the backend's core model from the generic platform (organizations,
memberships) to the gym-domain MVP v2: `Organization` → `Gym`, `Membership`
replaced by per-gym `Member` (single role, optional `userId`), RBAC repointed
at `members`, and new domain modules (branches, disciplines, gym settings,
plans, subscriptions, payments, access logs, routines, progress) with
entities and CRUD/action endpoints. Full HTTP rename to `/gyms`. Dev schema
evolves via TypeORM `synchronize` + idempotent seeders — no data migrations
(pre-launch).

## This app's tasks

| # | Task | Depends on | Status |
|---|------|------------|--------|
| 1 | Rename `organizations` module → `gyms`: entity/table, `/gyms` routes, views/DTOs, active-gym cookie + guard, onboarding; full suite green | — | [x] |
| 2 | Rename permission codes `organization:*` → `gym:*` (permission-key, seeder, decorators, tests) | 1 | [x] |
| 3 | `Member` entity + repository port | 1 | [x] |
| 4 | Repoint RBAC resolution to `members` | 3 | [x] |
| 5 | Members CRUD endpoints | 3 | [x] |
| 6 | Member role-change + grant-portal-access endpoints | 5 | [x] |
| 7 | `POST /gyms` creates owner Member in same unit of work | 3, 4 | [x] |
| 8 | Delete `memberships` module | 4, 6, 7 | [x] |
| 9 | Extend catalog seeder: new permission matrix + `student` role | 2, 3 | [x] |
| 10 | `GymSettings` module | 1 | [x] |
| 11 | `Branches` module | 1 | [x] |
| 12 | `Disciplines` global catalog | 1 | [x] |
| 13 | Branch offered-disciplines replace-set | 11, 12 | [x] |
| 14 | `Plans` module with branch/discipline joins | 13 | [x] |
| 15 | `Subscriptions` module | 5, 14 | [x] |
| 16 | `Payments` module | 10, 15 | [x] |
| 17 | Derived overdue on read | 16 | [ ] |
| 18 | `AccessLogs` module | 11, 17 | [ ] |
| 19 | `Routines` module | 5 | [ ] |
| 20 | Routine assignments | 19 | [ ] |
| 21 | `Progress` module | 19 | [ ] |
| 22 | Index/constraint pass + OpenAPI + full regression | 8, 9, 14, 17, 18, 20, 21 | [ ] |
| 23 | E2E contract test: full member lifecycle | 22 | [ ] |

<!-- On archive, this file is rewritten as the final summary (same spirit as the
feature's done/README.md, scoped to this app) and cross_spec points to done/. -->
