## Descripción

<!-- Qué cambio hace este PR y por qué. Incluir contexto relevante. -->

## Tipo de cambio

<!-- Marcar el que aplica -->

- [ ] feat — nueva funcionalidad
- [ ] fix — corrección de bug
- [ ] refactor — cambio de código sin nueva funcionalidad ni corrección de bug
- [ ] chore — mantenimiento, dependencias, configuración
- [ ] docs — solo cambios en documentación
- [ ] test — agregar o corregir tests

## Checklist

- [ ] El lint pasa (`npm run lint`)
- [ ] Los tests pasan sin regresión de cobertura (`npm run test:cov:ratchet`)
- [ ] El build pasa (`npm run build`)
- [ ] DTOs validados con class-validator (sin `process.env` directo en servicios)
- [ ] Si hay nuevo endpoint: documentado en la Postman collection
- [ ] Si hay nueva variable de entorno: agregada a `.env.example`
- [ ] Operaciones de negocio respetan el scope multi-tenant (organización activa)

## Notas (si aplica)

<!-- Screenshots, decisiones de diseño, follow-ups pendientes -->
