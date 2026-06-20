---
name: nest-module
description: Genera un módulo backend de NestJS en generic-saas-be siguiendo las convenciones del proyecto (arquitectura modular, DTOs + class-validator, UUIDs, soft delete, multi-tenant por organización, paginación/filtros y permisos granulares). Úsala al crear un módulo nuevo (users, organizations, memberships, roles, invitations, resources, o cualquier feature de negocio).
---

# Crear un módulo NestJS

Genera un módulo en `generic-saas-be/src/modules/<feature>/` consistente con las
decisiones de `definicion-inicial-saas-reutilizable.md` y `CLAUDE.md`.

## Antes de empezar

1. Confirmá el nombre del módulo (singular para la entidad, plural para la carpeta:
   `resources/`, entidad `Resource`).
2. Revisá si Prisma ya está configurado (`src/prisma/prisma.service.ts`) y si existe
   el modelo en `prisma/schema.prisma`. Si no, agregalo primero.
3. Mirá un módulo existente para copiar el estilo antes de escribir uno nuevo.

## Estructura a generar

```
src/modules/<feature>/
  dto/
    create-<entity>.dto.ts
    update-<entity>.dto.ts
    query-<entity>.dto.ts   # extiende PaginationDto (page, limit, search, sortBy, sortOrder, status)
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.module.ts
```

## Reglas obligatorias

- **IDs:** UUID (`@default(uuid())` en Prisma).
- **Soft delete:** entidades principales llevan `deletedAt`. Las queries por defecto
  filtran `deletedAt: null`. El `delete` actualiza `deletedAt`, no borra físicamente.
- **Multi-tenant:** toda operación de negocio se scopea por `organizationId` de la
  organización activa. Nunca consultar sin filtrar por organización. Usá el decorator
  `@CurrentOrganization()` (`src/common/decorators/`).
- **Validación:** DTOs con `class-validator` / `class-transformer`. No aceptar payloads
  sin DTO.
- **Paginación/filtros:** el endpoint de listado acepta `page`, `limit`, `search`,
  `sortBy`, `sortOrder`, `status` y responde
  `{ data: [], meta: { page, limit, total, totalPages } }`. Reutilizá
  `src/common/pagination/`.
- **Permisos:** proteger endpoints con el guard de permisos y el decorator
  `@RequirePermissions('<recurso>.<accion>')` (p. ej. `resources.create`,
  `resources.read`, `resources.update`, `resources.delete`).
- **Auth:** endpoints privados detrás del `JwtAuthGuard`.

## Pasos

1. Agregar/confirmar el modelo en `prisma/schema.prisma` (con `id` UUID, `organizationId`,
   `createdAt`, `updatedAt`, `deletedAt`) y correr la migración.
2. Crear los DTOs (create, update parcial con `PartialType`, query extendiendo `PaginationDto`).
3. Implementar el service: métodos `create`, `findAll` (paginado + filtros + scope por org),
   `findOne`, `update`, `remove` (soft delete). Lanzar `NotFoundException` cuando no exista
   dentro de la organización.
4. Implementar el controller con rutas REST y los decorators de permisos.
5. Registrar el módulo en `app.module.ts`.
6. Agregar los requests a la colección de Postman (no Swagger).

## Verificación

- `npm run lint` y `npm run build` en `generic-saas-be/` deben pasar.
- Probar que el listado excluye soft-deleted y respeta el scope de organización.
