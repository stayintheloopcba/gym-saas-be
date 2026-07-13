---
feature: auth-session-flow
stage: implementing
updated: 2026-07-12
branch: feature/auth-session-flow
cross_spec: ../../gym-saas-knowledge-base/wip/2026-07-12-auth-session-flow/
cross_repo: local workspace repository
---

# Authentication session flow - gym-saas-be slice

## Summary

Validate and complete the cookie-based authentication, session, onboarding, gym-selection, OpenAPI, test, and non-secret configuration contract owned by the backend.

## This app's tasks

| # | Task | Depends on | Status |
|---|------|------------|--------|
| 1 | Audit auth, onboarding, gym-selection, and OpenAPI contracts against the approved technical specification. | -- | [x] |
| 2 | Extend auth e2e coverage for local authentication, refresh rotation, rejection, logout, and cookie assertions. | 1 | [x] |
| 3 | Cover Google-provisioned users and onboarding status. | 1 | [x] |
| 4 | Document non-secret frontend, CORS, cookie, and Google callback configuration. | 1 | [x] |
| 5 | Run backend quality checks and inspect the generated OpenAPI contract. | 2, 3, 4 | [x] |

### Error de registro

Cuando `POST /auth/register` recibe un email ya registrado, responde `409` con el envelope de error estándar y `code: "EMAIL_ALREADY_REGISTERED"`. El mensaje no incluye el email enviado. El frontend usa ese código estable para asociar el error al campo `email`; los errores de validación (`400`) se muestran en el campo correspondiente y los límites (`429`) como aviso de formulario.