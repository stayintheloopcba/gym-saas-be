## 1. Backend module removal

- [ ] 1.1 Delete `src/modules/invitations/**`, remove `InvitationsModule` from `AppModule` and `OrganizationsModule`, and delete `InvitationStatus`.
- [ ] 1.2 Delete `src/modules/resources/**` and remove `ResourcesModule` from `AppModule`.
- [ ] 1.3 Remove invitation/resource OpenAPI models and references from `src/common/openapi/api-models.ts`.
- [ ] 1.4 Remove invitation/resource folders, variables, and examples from the Postman collection.

## 2. Permission and role catalog cleanup

- [ ] 2.1 Remove `members:invite` and `resources:*` from `PERMISSIONS`.
- [ ] 2.2 Update the permission catalog seeder and tests so removed codes are not inserted.
- [ ] 2.3 Update role catalog seed defaults and role tests so no role references removed codes.
- [ ] 2.4 Sweep backend code for removed permission-code references.

## 3. Organization and membership flows

- [ ] 3.1 Remove `pendingInvitations` from onboarding status response and tests.
- [ ] 3.2 Ensure membership list, role-change, and remove-member flows remain green without invitations.
- [ ] 3.3 Confirm role deletion checks no longer inspect pending invitations.

## 4. Specs, docs, and verification

- [ ] 4.1 Remove/archive active `openspec/specs/invitations/spec.md` when applying the change.
- [ ] 4.2 Update backend architecture diagrams and README/Postman references.
- [ ] 4.3 Run backend unit/e2e tests and lint.
- [ ] 4.4 Run a final `rg` sweep for `invitation`, `invitations`, `resource`, `resources`, `members:invite`, and `resources:`.

