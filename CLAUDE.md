# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repositorio

Prototipo de UX/UI (React + TypeScript + Vite + Tailwind + shadcn/ui) para el sistema de gestión de solicitudes comerciales de la Dirección de Extensión y Consultoría de la Universidad Icesi. **No hay backend real**: los datos viven en `src/lib/mock-data.ts` y se persisten en `localStorage` vía `AuthContext`. No inventes llamadas a API ni asumas que existe una base de datos.

**Antes de tocar lógica de negocio, lee `docs/README.md` y sigue sus enlaces** — es el punto de entrada real de este repo y ya documenta en detalle: dominio y roles (`01`, `02`), flujos de usuario (`03`), el modelo de datos implícito (`04`), inventario de pantallas (`05`), sistema visual (`06`), y — muy importante — `07-gaps-conocidos-y-deuda-tecnica.md`, que lista atajos y bugs conocidos del prototipo que **no deben confundirse con reglas de negocio intencionales**. No repitas ese contenido aquí; consúltalo antes de asumir cómo debería comportarse algo.

## Comandos

```bash
npm install
npm run dev          # servidor de desarrollo (puerto 3000)
npm run build         # build de producción
npm run lint          # eslint
npm run test          # vitest (una sola corrida)
npm run test:watch    # vitest en watch
```

Para correr un solo archivo de test: `npx vitest run src/test/<archivo>.test.ts(x)` (o sin `run` para watch mode).

## Flujo de git de este equipo

- Ramas: `main` (release) ← `develop` (integración) ← `feature/<nombre>` (por cambio). Cada feature nace de `develop`, nunca de `main`.
- **Nunca hagas push directo a `main` ni a `develop`.** Todo cambio pasa por una rama `feature/...` (o `docs/...` para documentación) y un Pull Request revisado por el equipo. Esto aplica también a ti como agente: si te piden implementar algo, termina en "rama creada + pusheada", no en un merge.
- Antes de crear una rama, `git fetch origin` y parte desde `origin/develop` actualizado, no desde un `develop` local desactualizado.
- Decisiones de gobernanza del repo (cosas que no son de negocio ni de UX pero afectan cómo se trabaja aquí) están en `docs/10-decisiones-pendientes-equipo.md`.
- `docs/11`, `12` y `13` son **bitácora histórica** de cómo se llegó a los cambios de costeo/reasignación/trazabilidad de 2026-09 — no son la referencia vigente. El estado **actual y vivo** del modelo de datos y los flujos vive en `03-flujos-de-usuario.md`, `04-modelo-de-datos-logico.md`, `07-gaps-conocidos-y-deuda-tecnica.md` y `08-preguntas-abiertas-negocio.md` — **siempre parte de ahí**, no de los documentos numerados más altos.

## Arquitectura

**Todo el estado de la aplicación (usuario actual + las solicitudes) vive en un único `AuthContext` (`src/context/AuthContext.tsx`)**, respaldado por `localStorage` (`icesi_auth_user_v3`, `icesi_requests_data_v3`). No hay Redux/Zustand/etc. — cualquier componente que necesite leer o mutar una solicitud usa `useAuth()`. Mutaciones siempre pasan por `updateRequest(id, partial)` (o los helpers específicos como `updateCosting`, `updateStatus`, `assignProfessorDetailed`) — nunca mutes `RequestItem` directamente fuera de este contexto, porque `updateRequest` tiene efectos secundarios implícitos que hay que preservar (ej. recalcula `statusUpdatedAt` cuando cambia `status`, sincroniza `totalCostCop` cuando cambia `costing`).

**El pipeline comercial es una máquina de estados lineal** sobre `RequestStatus`: `"nueva" → "en-experto" → "en-costeo" → "entregada"` (tipo en `src/lib/mock-data.ts`). El rol que puede mover cada transición y las reglas de validación de cada paso están documentadas en `docs/03-flujos-de-usuario.md` — no las reinventes leyendo solo el código de un componente, la razón de negocio de cada validación está en `04-modelo-de-datos-logico.md` y en `08-preguntas-abiertas-negocio.md`.

**Autenticación es un mock de rol, no autenticación real** (`src/context/ThemeContext.tsx` es independiente, solo tema claro/oscuro). Cualquiera puede cambiar de rol desde la topbar (`ROLE_CONFIGS` en `AuthContext.tsx`). No agregues lógica de permisos que asuma sesiones reales — ver gap #6 en `07-gaps-conocidos-y-deuda-tecnica.md`.

**Los dos roles con UI dedicada y activamente mantenida son KAM y Líder de Producto** (`src/components/dashboard/KamCommandCenter.tsx`, `src/components/dashboard/ProductLeaderDashboard.tsx`), enrutados desde `src/pages/Dashboard.tsx`. Los roles `lider-nodo` y `profesor` caen en una rama genérica de `Dashboard.tsx` que está rota (variables no declaradas, ver gap #4 en `07-...`) — no la uses como referencia de patrón, y ten cuidado de no ejecutarla accidentalmente al tocar ese archivo.

**Costeo de propuestas** vive en `src/components/costing/ProposalCostingModule.tsx`, tipado por `ProposalCosting` en `mock-data.ts` — el modelo vigente (incluyendo `NegotiationRound`) está documentado en `04-modelo-de-datos-logico.md`. Antes de tocarlo, confirma ahí cuál es el modelo de campos actual, puede haber cambiado respecto a versiones previas del código.

**Hay lógica duplicada a propósito documentada como deuda técnica**, no la repliques al agregar una tercera copia: el modal de reasignación de líder existe casi idéntico en `RequestDetail.tsx` y `ProductLeaderDashboard.tsx` (y una tercera copia muerta/inalcanzable en `Dashboard.tsx`) — ver gap #9 en `07-gaps-conocidos-y-deuda-tecnica.md`. Si vas a modificar esa lógica, es buen momento para extraerla a un componente/hook compartido en vez de duplicar el cambio.

## Al implementar un cambio de negocio

1. Si el cambio viene de un audio/mensaje suelto del stakeholder, no lo traduzcas directo a código: primero **actualiza el documento categorizado que ya cubre ese tema** (`03` flujos, `04` modelo de datos, `07` gaps, `08` preguntas de negocio) con qué dijo el stakeholder, qué dice el código hoy, y la decisión validada — y haz que un humano lo confirme antes de programar contra él. **No crees un documento numerado nuevo (`11`, `12`...) solo porque el cambio es nuevo** — eso fragmenta la referencia viva en varios archivos y deja desactualizado el que alguien realmente va a leer. Un documento nuevo solo se justifica si el tema no encaja en ninguna categoría existente, y en ese caso hay que decidirlo explícitamente, no por defecto.
2. Verifica los nombres de campos/handlers en el código actual antes de programar contra la especificación — los documentos pueden citar líneas que ya se movieron.
3. Corre `npm run lint` y `npm run build` antes de dar por terminado un cambio.
