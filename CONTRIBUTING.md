# Cómo trabajamos

Reglas de trabajo del equipo para `commercial-requests-web`. Las reglas de código
y de negocio están en [`AGENTS.md`](AGENTS.md); este archivo cubre el proceso.

## Puesta en marcha

Requisitos: Node 22 (ver `.nvmrc`) y npm.

```bash
npm install          # instala dependencias y activa los hooks de git (Husky)
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

Antes de abrir un PR: `npm run verify` tiene que pasar. Es exactamente lo que
corre la CI.

## Ramas

| Fase                     | Modelo                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **Fundación (Sprint 0)** | Solo el lead hace commits directos a `main`, hasta dejar la base arriba.                      |
| **Desde el Sprint 1**    | `main` (estable, lo que se demuestra/despliega) y `develop` (integración). Todo entra por PR. |

Ramas de trabajo, siempre desde `develop`:

```
feat/<area>-<descripcion>     feat/kam-cancel-request
fix/<area>-<descripcion>      fix/lp-costing-negative-values
chore/ · docs/ · refactor/ · test/
```

- Ramas cortas: idealmente de 1 a 3 días. Si crece, se parte.
- Una rama, un propósito. Nada de "arreglos varios".
- Se borran al mergear (GitHub lo hace solo con _Automatically delete head branches_).
- Integración a `develop`: **Squash and merge** (un commit convencional por PR).
- Paso a `main`: PR de `develop` → `main` con **Merge commit**.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), en inglés y en
minúscula. Lo valida `commitlint` al hacer el commit.

```
<tipo>(<área>): <qué cambia>

feat(kam): allow cancelling a request while it is new
fix(costing): reject negative base cost
test(costing): cover pro-cultura stamp rounding
```

Tipos: `feat` `fix` `refactor` `test` `docs` `chore` `ci` `style` `perf`.
Áreas sugeridas: `kam`, `lp`, `costing`, `auth`, `api`, `ui`, `docs`, `deps`.

## Pull requests

- Contra `develop`, usando la plantilla.
- Pequeños: si pasa de ~400 líneas cambiadas, probablemente son dos PRs.
- Requisitos para mergear: **CI en verde + 1 aprobación**. Cambios en archivos
  de reglas (lint, TypeScript, CI, `AGENTS.md`) requieren además al lead (CODEOWNERS).
- Si cambia algo visible, captura de pantalla en el PR.

## Definición de terminado

Una historia está terminada cuando:

1. Cumple los criterios de aceptación y las reglas de negocio de `docs/`.
2. `npm run verify` pasa, sin warnings nuevos.
3. La lógica de negocio nueva tiene tests.
4. Los textos visibles están en español; el código, en inglés.
5. Se revisó en un PR y está mergeada en `develop`.
6. Si cambió una regla de negocio, se actualizó `docs/` en el mismo PR.

## Uso de IA (Claude, Cursor, Antigravity, Copilot, lo que sea)

Se puede usar la herramienta que cada uno prefiera, con tres condiciones:

1. **Todas leen `AGENTS.md`.** Claude usa `CLAUDE.md`, Cursor `.cursor/rules/`,
   Copilot `.github/copilot-instructions.md` y las herramientas de Gemini
   `GEMINI.md`; todos apuntan a `AGENTS.md`. Si tu herramienta no lee ninguno de
   esos archivos, avisa al lead antes de usarla en el repo.
2. **Tú respondes por lo que genera.** Lee todo el diff antes de hacer commit.
   "Lo hizo la IA" no es una explicación válida en una revisión.
3. **Las reglas no se negocian con la IA.** Si una herramienta propone desactivar
   una regla de lint, relajar TypeScript, bajar un umbral de cobertura o borrar un
   test para que algo pase, la respuesta es no: se corrige el código.

La CI y la revisión son las que garantizan esto; los archivos de instrucciones solo
ayudan a que las herramientas acierten a la primera.

## Configuración del repositorio (lead)

En GitHub, una sola vez, cuando la base ya esté en `main`:

- Crear `develop` y protegerla junto con `main`: PR obligatorio, check `verify`
  obligatorio, 1 aprobación, _Require review from Code Owners_, sin push directo.
- Activar _Automatically delete head branches_.
- Dejar solo _Squash merging_ y _Merge commits_ habilitados.

> En repos **privados**, la protección de ramas requiere GitHub Pro o Team.
> El GitHub Student Developer Pack incluye Pro.
