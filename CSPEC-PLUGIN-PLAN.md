# Plugin `cspec` — Definición y plan

> Documento de trabajo. Define el plugin de Claude Code para gestionar specs cross-aplicación
> (frontend + backend + futuros microservicios) usando OpenSpec como motor de formato.
> Estado: **definición cerrada** — listo para construir; queda un ítem de investigación en §11.

## 1. Problema y objetivo

OpenSpec funciona repo por repo: `openspec/specs/` como fuente de verdad de capabilities y
`openspec/changes/` como propuestas con delta. No tiene concepto de specs compartidas entre
repos. Cuando un cambio toca el contrato entre apps (ej. eliminar el flujo de invitations,
que impacta `gym-saas-be` y `gym-saas-fe`), hoy no hay dónde especificarlo una sola vez.

`cspec` (cross-spec) agrega esa capa: un repo de specs cross-app con ciclo de vida por etapas,
y skills que orquestan carpetas, metadata, git y la bajada a cada repo de app.

## 2. Decisiones ya tomadas

| Decisión | Elección |
|----------|----------|
| Ubicación de `cross-specs/` | Repo git propio, hermano de las apps en el workspace (`gym-saas/cross-specs`) |
| Ubicación del plugin | Repo propio (`cspec-plugin`), genérico y reusable fuera de gym-saas |
| Idioma de las specs generadas | Inglés (este doc de planificación queda en español) |
| Relación con OpenSpec | cspec usa los formatos/convenciones de OpenSpec; los repos de app conservan su `openspec/` local (ver §8) |
| Referencias en apps | Carpeta espejo `cross-specs/` en cada app, con una carpeta por feature y su `spec.md` de metadata/estado/resumen + índice (ver §9). **No** se generan changes locales de OpenSpec |
| Modelo de ramas | Git flow completo: `develop` + `main`, features salen de `develop` |
| Integración de ramas | PRs en GitHub (via `gh`), nunca merge directo desde los skills |

Implicancia de que el plugin sea repo propio: **cero acoplamiento a gym-saas**. Nada de
nombres de apps hardcodeados; las apps se declaran en el `meta.md` de cada feature y se
detectan por el nombre de la carpeta del repo donde se está parado. Lo específico del
proyecto (dominio, stack, convenciones) vive en el `README.md` / contexto del repo
cross-specs, que los skills leen — análogo al `project.md` de OpenSpec.

## 3. Arquitectura del sistema

| Pieza | Repo | Contenido |
|-------|------|-----------|
| `cspec-plugin` | propio, reusable | 6 skills + convenciones y templates compartidos |
| `cross-specs` | propio, por workspace | features cross en `wip/` y `done/`, índice raíz, contexto del proyecto |
| Apps (`gym-saas-be`, `gym-saas-fe`, …) | existentes | su `openspec/` local para cambios atómicos + carpeta espejo `cross-specs/` con las features cross que las tocan (ver §9) |

Regla del sistema: **si el cambio toca el contrato entre apps → cspec; si es interno a un
servicio → openspec local de ese repo.**

## 4. Estructura del plugin

```
cspec-plugin/
├── .claude-plugin/plugin.json      # name: "cspec"
├── README.md
└── skills/
    ├── start/SKILL.md
    ├── functional/SKILL.md
    ├── technical/SKILL.md
    ├── tasks/SKILL.md
    ├── implement/SKILL.md
    ├── archive/SKILL.md
    └── _shared/
        ├── conventions.md          # formato openspec, estructura de carpetas, meta.md, gating
        └── templates/              # meta.md, functional.md, technical.md, tasks.md, README.md, implementation.md
```

Instalado a nivel usuario (o marketplace local apuntando al repo), los skills quedan
disponibles como `/cspec:start`, `/cspec:functional`, etc. **desde cualquier repo del
workspace** — necesario porque `/cspec:implement` se corre parado en el repo de cada app.

Descubrimiento de `cross-specs/`: búsqueda hacia arriba desde el cwd de una carpeta hermana
llamada `cross-specs` (override futuro vía archivo de config en el workspace si hiciera falta).

## 5. Estructura del repo cross-specs

```
cross-specs/
├── README.md                       # contexto del proyecto + índice de features (wip y done, una línea c/u)
├── wip/
│   └── 2026-07-08-1430-remove-invitations-resources/
│       ├── meta.md
│       ├── 1-functional/functional.md
│       ├── 2-technical/technical.md
│       ├── 3-tasks/tasks.md
│       └── 4-implementation/       # notas por app durante implement (<app>.md)
└── done/
    └── remove-invitations-resources/
        ├── README.md               # ← lo que leen los agentes futuros (spec breve + decisiones clave)
        ├── implementation.md       # resumen de lo implementado, desvíos respecto al plan
        └── 1-functional/ 2-technical/ 3-tasks/ 4-implementation/   # completos, para auditoría
```

Convención de nombre en wip: `YYYY-MM-DD-HHmm-<feature-name>`. En done se pierde el timestamp.

## 6. meta.md — estado de la feature

```markdown
---
name: remove-invitations-resources
stage: functional        # started → functional → technical → tasks → implementing → done
created: 2026-07-08T14:30
updated: 2026-07-08
developer: Joaquin Benegas          # tomado de git config user.name
branch: feature/remove-invitations-resources
apps: [gym-saas-be, gym-saas-fe]
---

## History
| Date | Stage | Note |
|------|-------|------|
```

`stage` es la máquina de estados. Reglas de gating:

- Cada skill valida que la etapa anterior esté completa; si no, se niega y explica qué falta.
- Re-correr una etapa ya hecha es válido (iterar), pero el skill avisa qué etapas posteriores
  quedan desactualizadas y lo registra en History.
- Toda transición de stage se registra en History con fecha y nota.

## 7. Los seis skills

### `/cspec:start <nombre> [descripción]`
- Valida que no exista feature homónima en `wip/`.
- Crea la carpeta con timestamp, `meta.md`, carpetas de etapas vacías.
- Actualiza el índice del README raíz.
- Crea la rama `feature/<nombre>` en el repo cross-specs (git flow).
- Pregunta (o deduce de la descripción) qué apps toca y lo registra en `apps`.

### `/cspec:functional`
- Solo negocio, cero código: objetivo, actores, casos de uso, decisiones de negocio,
  fuera de alcance (non-goals).
- **Criterios de aceptación en formato scenario de OpenSpec** (`WHEN / THEN / AND`) —
  trazables después hasta los tests.
- Modo entrevista si hay ambigüedad (espíritu de `opsx:explore`).
- Marca `stage: functional`.

### `/cspec:technical`
- Lee functional. Produce: **contrato entre apps** (endpoints, DTOs, errores — el corazón
  de una spec cross), modelo de datos, permisos, impacto desglosado **por app**, decisiones
  técnicas con trade-offs, riesgos y migración.
- Equivale al `design.md` de OpenSpec.
- Marca `stage: technical`.

### `/cspec:tasks`
- Deriva la tabla tildable, agrupada por app, con dependencias explícitas
  (típico: contrato en BE primero, FE después):

```markdown
| # | App | Task | Depends on | Status |
|---|-----|------|------------|--------|
| 1 | gym-saas-be | Remove invitations module | — | [ ] |
| 5 | gym-saas-fe | Remove invitation screens  | 1 | [ ] |
```

- Marca `stage: tasks`.

### `/cspec:implement`
- Se corre **parado en el repo de una app**. Detecta la app por el cwd.
- Filtra las tareas pendientes de esa app cuyas dependencias estén satisfechas.
- Crea la rama `feature/<nombre>` desde `develop` en el repo de la app.
- Crea/actualiza el espejo local `cross-specs/<feature>/spec.md` de la app y su índice (ver §9).
- Implementa, tilda en `tasks.md` (commit en cross-specs), actualiza el estado en el
  espejo local, deja notas en `4-implementation/<app>.md`.
- Al completarse todas las tareas de esa app: pushea la rama y abre PR a `develop` con `gh`.
- Marca `stage: implementing` en la primera corrida.

### `/cspec:archive`
- Valida que todas las tareas estén tildadas y que los PRs de las apps estén mergeados
  (si no, pide confirmación explícita).
- Genera `README.md` (spec breve + decisiones importantes — para que agentes futuros lean
  eso en lugar de todas las specs) e `implementation.md` (resumen + desvíos).
- Mueve todo a `done/<nombre>`, actualiza el índice raíz.
- Finaliza el espejo local de cada app: reescribe su `spec.md` como resumen final
  (prácticamente el mismo contenido que el README de arriba) y actualiza su índice.
- Abre PR de la rama de cross-specs a `develop` (git flow).
- Marca `stage: done`.

## 8. Integración con OpenSpec ("¿por detrás usa openspec?")

Dos niveles, con respuestas distintas:

**Nivel cross (repo cross-specs):** cspec usa los **formatos y la metodología** de OpenSpec
(requirements con scenarios `WHEN/THEN`, separación funcional/técnico/tareas, deltas) vía
prompt en los skills — no invoca los skills `opsx:*` ni el CLI, porque estos asumen la
estructura fija `openspec/changes/` y nuestra estructura por etapas (`1-functional/`,
`2-technical/`, `3-tasks/`, `meta.md`, wip/done) es distinta.
*Ítem a investigar en construcción:* si el `schema` configurable de OpenSpec
(`config.yml: schema: spec-driven`) soporta schemas custom con artefactos y rutas propias,
el repo cross-specs podría ser un proyecto OpenSpec real con un schema `cross`. Si no,
queda formato-por-convención (plan actual).

**Nivel app (cada repo):** el `openspec/` local queda **exclusivamente** para cambios
atómicos de ese servicio. Las features cross **no** generan changes locales de OpenSpec:
se registran en la carpeta espejo `cross-specs/` de la app (ver §9).
*Trade-off asumido:* el `openspec/specs/` local no refleja los cambios que llegaron desde
arriba; la fuente de verdad de esos cambios es el repo cross-specs, y el espejo local es
el puente de lectura para agentes trabajando en la app.

## 9. Referencias desde los repos de app — carpeta espejo

Cada repo de app tiene su propia carpeta `cross-specs/` que espeja (en liviano) las
features cross que tocan esa app:

```
gym-saas-be/
└── cross-specs/
    ├── README.md                          # índice: una línea por feature (como el índice de arriba)
    └── remove-invitations-resources/
        └── spec.md
```

`spec.md` contiene:

- **Metadata:** nombre, estado actual (espejo del `stage` de arriba), fechas, rama local.
- **Referencia a la spec completa:** path relativo en el workspace
  (`../../cross-specs/wip/<feature>/`) + URL del repo cross-specs.
- **Resumen** del alcance de la feature en *esta* app (sus tareas, su slice del contrato).

Ciclo de vida del espejo:

- `/cspec:implement` lo crea al arrancar en esa app y actualiza estado/resumen a medida
  que avanza.
- `/cspec:archive` lo finaliza: reescribe `spec.md` como resumen definitivo — prácticamente
  el mismo contenido que el `README.md` de la feature en `done/` de arriba (spec breve +
  decisiones importantes), con la referencia apuntando ya a `done/<feature>/`.
- El índice `cross-specs/README.md` de la app se mantiene en cada paso, igual que el
  índice del repo de arriba: agentes futuros trabajando en la app leen ese índice y los
  `spec.md` en lugar de ir a las specs completas.

## 10. Convenciones de git

Git flow completo en los tres tipos de repo (cross-specs y apps): `main` para releases,
`develop` como rama base de trabajo, features en `feature/<feature-name>`.

- `start` crea `feature/<feature-name>` desde `develop` en cross-specs.
- `implement` crea `feature/<feature-name>` desde `develop` en el repo de la app; al
  completar las tareas de esa app pushea y abre PR a `develop` con `gh`.
- `archive` abre el PR de cross-specs a `develop`. Los merges los aprueba siempre una
  persona — los skills nunca mergean directo.
- Commits en cross-specs: `spec(<feature>): <qué etapa/qué cambió>`.
- Commits en apps: convención propia de cada repo, referenciando la feature.
- Prerequisito de setup: crear la rama `develop` en los repos que hoy solo tienen `main`.

## 11. Preguntas abiertas

1. **Cross-specs como proyecto OpenSpec real:** ¿invertir en investigar schemas custom
  de OpenSpec, o formato-por-convención y listo? (Se resuelve en la fase 1-2 de
  construcción; el plan actual asume formato-por-convención.)

Decisiones menores con default propuesto (objetar si no va):
- `developer` en meta.md sale de `git config user.name`.
- `/cspec:start` deduce las apps de la descripción y confirma con el usuario.
- Gating estricto pero con override explícito del usuario (nunca silencioso).
- Nombre del archivo espejo en apps: `cross-specs/<feature>/spec.md`.

## 12. Plan de construcción (cuando se apruebe la definición)

1. **Esqueleto de repos:** crear `cspec-plugin` y `cross-specs` con estructura base;
   crear la rama `develop` en cross-specs y en las apps (hoy solo tienen `main`).
2. **Convenciones y templates:** `_shared/conventions.md` + templates — es la pieza que
   define todo lo demás; los 6 skills la referencian.
3. **Skills en orden de flujo:** `start` → `functional` → `technical` → `tasks` →
   `implement` → `archive`, probando cada uno contra el caso piloto real
   **`remove-invitations-resources`** (la feature que motivó todo esto).
4. **Ajustes post-piloto:** lo que el caso real demuestre que falta o sobra.
