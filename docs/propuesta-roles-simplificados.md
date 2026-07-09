# Propuesta: simplificar roles y permisos (catálogo global)

> **Aceptada e implementada** (2026-07-08) vía el OpenSpec change `simplificar-roles-permisos`. Ver `openspec/changes/simplificar-roles-permisos/` (proposal, design, specs, tasks) para el detalle final de la implementación.

## Problema actual

El modelo de hoy mezcla dos sistemas de roles:

- 4 roles de sistema **hardcodeados** en un enum (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) con sus permisos default también hardcodeados en código (`DEFAULT_ROLE_PERMISSIONS`).
- Roles **custom por organización** (`roles`, con `organizationId`), con permisos configurables vía `permission_assignments`, que además soporta overrides por usuario individual y resolución de conflictos por precedencia.

Es demasiada atomicidad para el caso de uso: un gimnasio no necesita inventar sus propios roles ni tener overrides por persona. Los puestos (dueño, admin, recepcionista, instructor) son prácticamente los mismos en cualquier gimnasio.

## Decisión

1. **Los roles son un catálogo único y global**, no por organización. Todas las organizaciones ven y usan exactamente los mismos roles.
2. **Solo SUPER_ADMIN puede crear, editar o borrar roles y sus permisos.** Ninguna organización puede definir roles propios ni personalizar permisos de un rol ni de un usuario puntual.
3. **SUPER_ADMIN es un usuario de sistema, no pertenece a ninguna organización.** No tiene `Membership`, no tiene rol de negocio: es una categoría de usuario aparte con acceso total a la plataforma.

## Modelo de datos propuesto

- `roles`: catálogo global. **Sin** `organizationId`. Mantiene `hierarchyLevel` (alcance de datos que ve ese rol dentro de su organización: propio / organización / global) porque sigue siendo relevante independientemente de quién administra el catálogo.
- `role_permissions`: reemplaza a `permission_assignments`. Tabla simple `roleId + permissionCode`. Sin `userId`, sin `value` (grant/deny), sin `precedence` — la presencia de la fila ya significa "el rol tiene ese permiso". No hace falta modelar deny ni resolver conflictos porque no hay overrides.
- `memberships.roleId`: `NOT NULL`, apunta directo al catálogo global. Se elimina el enum `MembershipRole` y la columna `role`; un miembro tiene un solo rol.
- `invitations`: el campo `role` pasa de enum a `roleId` (FK al catálogo global), igual que membership.
- `users.isPlatformAdmin` (o tabla separada): flag para identificar SUPER_ADMIN. Desacoplado por completo de `Membership`/`Role`/organizaciones.

## Qué se elimina

- El enum `MembershipRole` y todo lo que dependía de él (`DEFAULT_ROLE_PERMISSIONS`, `SYSTEM_ROLE_HIERARCHY`, `systemKey`/`isSystem` en `Role`).
- El motor de resolución de conflictos (`OrganizationPermissionService.resolve`/`preferred`/`levelWins`, precedencia, "empate → gana el deny"). Se reemplaza por un lookup directo: `membership.roleId` → `role_permissions` → listo. Es chico y estable, se puede cachear en memoria.
- Los guards de jerarquía para gestión de roles por organización (`assertWithinCallerHierarchy` sobre roles custom) — ya no aplican porque ninguna organización gestiona roles.
- Los endpoints de roles dejan de colgar de `/organizations/:id/roles` y pasan a algo tipo `/admin/roles`, protegido por `isPlatformAdmin`, no por el sistema de permisos de organización.

## Qué se pierde (a propósito)

- Ninguna organización puede pedir un rol a medida ni ajustar permisos de un rol o de una persona puntual. Si en el futuro un cliente grande necesita esto, hay que revisitar el diseño — pero para el caso de uso actual es la simplificación correcta, no una limitación accidental.

## Próximos pasos

- [x] Confirmar el catálogo inicial de roles y permisos por rol (seed): `owner`, `admin`, `receptionist`, `instructor` — ver `CatalogSeeder`.
- [x] `memberships.role` (enum) → `memberships.roleId` (FK, `NOT NULL`), sin datos de producción que migrar (repo en commit inicial).
- [x] `permission_assignments` → `role_permissions`.
- [x] SUPER_ADMIN vía `users.isPlatformAdmin` + `PLATFORM_ADMIN_EMAILS` (seed idempotente al bootstrap).
- [x] `OrganizationPermissionService` reescrito como lookup directo (`membership.roleId` → `role_permissions`).
- [x] Endpoints y guards de roles movidos a `/admin/roles` + `/admin/permissions`, protegidos por `PlatformAdminGuard`.
