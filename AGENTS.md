# AGENTS.md — commercial-requests-web

Single source of rules for every AI coding tool (Claude, Cursor, Antigravity,
Copilot...) and every human. Tool-specific files only point here. These rules
are enforced by ESLint, TypeScript, tests and CI — breaking them fails the build.

## What this is

Web client of the Commercial Requests system of Universidad Icesi (Dirección de
Extensión y Consultoría): KAMs register client needs, Product Leaders (LP) assign
an expert, cost the proposal and hand it back; the KAM delivers it to the client.
It started as a validated UX prototype and is being turned into the production
client of `commercial-requests-backend` (NestJS).

**Business rules live in `docs/`** (validated with the product lead). Read
`docs/02-roles-y-permisos.md`, `docs/03-flujos-de-usuario.md` and
`docs/04-modelo-de-datos-logico.md` before touching a flow. Open questions are in
`docs/08-preguntas-abiertas-negocio.md` — if a rule is unclear, ask; never invent one.

## Architecture decisions and project knowledge

Cross-repo decisions (why the backend was kept, why this client evolves from the
prototype instead of Next.js) and the project audit live in the backend knowledge
base: `../commercial-requests-backend/wiki/` — start at `wiki/index.md`, decisions
in `wiki/decisiones/`. Clone both repositories side by side to read it. When asked
"why" about the architecture, answer from those pages; don't guess.

## Stack

React 18 · TypeScript (strict) · Vite · React Router · Tailwind · shadcn/ui ·
TanStack Query · Vitest + Testing Library. **This is not Next.js.**

## Commands

| Task               | Command                                              |
| ------------------ | ---------------------------------------------------- |
| Dev server         | `npm run dev` (port 3000)                            |
| Everything CI runs | `npm run verify` — run it before declaring work done |
| Lint / fix         | `npm run lint` / `npm run lint:fix`                  |
| Types              | `npm run typecheck`                                  |
| Tests / coverage   | `npm test` / `npm run test:coverage`                 |

## Source of truth

**The branch `fix/professor-reassignment-audit` (repo `commercial-requests-web`) is
the validated UX and business-logic reference.** It was tested with real users and
validated with the product lead. When connecting to the real backend, every rule,
animation, and component in that branch must be preserved exactly. The fact that
it runs on mocks is irrelevant — the BEHAVIOR is what matters.

Work TDD: write tests that encode that branch's behavior, then implement the
backend integration so those tests pass. Never break a behavior that exists in
that branch without explicit product-lead sign-off.

## Backend integration contract

This project is being migrated from a mock-only prototype to a real backend
(`commercial-requests-backend`, NestJS + Prisma + PostgreSQL). The following
rules govern the integration:

- **No dual writes.** A mutation goes to either the real API or the local mock
  (`AuthContext`) — never both in the same code path. Once the API call for an
  action is implemented, remove the mock write for that action.
- **No silent fallback.** If the API call fails, show an error toast and stop —
  do not silently fall back to writing the local state. The user must know the
  operation failed.
- **Do not use `startsWith("REQ-")` to detect "real" vs "mock" requests.**
  Mock IDs also start with `REQ-2026-`. Use `Boolean(apiProposal)` (i.e., whether
  `useRequestDetail` returned a non-null API object) to decide which code path to
  take. If `apiProposal` is null, the request is a local mock.
- **State mapping is authoritative.** Backend status codes (`NEW`, `IN_PROGRESS`,
  `IN_COSTING`, `DELIVERED`, `REJECTED`) must all map to distinct frontend states.
  `REJECTED` must NOT map to `"entregada"`. Any unknown backend code must produce
  a visible warning — never silently default to `"nueva"`.
- **`NegotiationRound.clientResponse` is uppercase English from the backend**
  (`"PENDING"`, `"CHANGES_REQUESTED"`). All comparisons in `RequestDetail.tsx`
  and related components must use the backend casing, not the Spanish lowercase
  mock values (`"pendiente"`, `"rechazada"`).

## Non-negotiable business rules

1. **The KAM never receives the base cost or the contribution margin.** Only the
   total offered value and, for "Capacitación", the Pro-Cultura stamp. The backend
   enforces it; the client must not request, compute or display those fields for a KAM.
2. A KAM sees only their own requests; an LP only the requests assigned to them.
3. Pipeline: `nueva` → `en-experto` → `en-costeo` → `entregada`.
   - Advancing to `en-experto` requires an assigned professor.
   - **Only the KAM marks `entregada`**, and only if the offered value is > 0.
   - The LP does NOT have a button to mark `entregada` — that action belongs
     exclusively to the KAM (see `docs/02-roles-y-permisos.md`, confirmed with
     the product lead; the LP only does "Enviar a KAM").
   - The KAM may return an `entregada` request to `en-costeo` with client observations.
4. The KAM edits or cancels their own request only while it is `nueva`.
   The LP reassigns only while `nueva` or `en-experto`, with a structured reason.
   Reassigning from `en-experto` resets the request to `nueva` and clears the
   assigned professor (the new LP restarts the flow).
5. Money is never negative; margin is 0–100. The costing formula lives only in
   `src/lib/costing.ts` (client-side preview); the backend is the authority.
   Do **not** change the Pro-Cultura rate: it is an open question (docs/08, Q12).
6. Professors have no account; the LP records their progress.
7. **Professor/advisor assignment is locked after `en-experto`.** The field is
   editable only while the request is `nueva` or `en-experto`. Once it reaches
   `en-costeo` or `entregada` (including after a "Devolver con observaciones"
   which returns to `en-costeo`), the field is read-only. Use `canEditProfessor()`
   from `src/lib/professor-assignment.ts` — do not re-implement this check inline.
   Every assignment change (while it was allowed) must be recorded in
   `req.professorHistory` via `assignProfessorWithHistory()`.
8. **The LP can edit "Información completa" only in `en-costeo` AND only after
   at least one client rejection** (`wasRejectedByClient === true`). Before any
   rejection, that section is read-only for the LP (it belongs to the KAM).
   See `docs/03-flujos-de-usuario.md`, section B.7.
9. The node field (`nodeId`) is mandatory when creating a request. It belongs in
   Step 3 of the wizard (Requerimiento del Servicio), not Step 1. Do not assign
   `dbNodes[0]` as a silent default — require explicit selection.

## Code rules

- Code, identifiers, commits and PRs in **English**. Every user-facing text in **Spanish**.
- No `any`. No `@ts-ignore` (`@ts-expect-error` only with a description).
  Never add `eslint-disable` without a written reason.
- HTTP only through the API layer in `src/lib/api/` — no ad hoc `fetch`/`axios`.
  Request/response types come from the backend contract, not hand-written copies.
- No `localStorage` for business data. Per-device UI state: `usePersistentState`.
- No hardcoded hex colours; use the design tokens in `tailwind.config.ts`
  (legacy hex classes are being migrated — do not add new ones).
- `src/components/ui/` is generated shadcn/ui code: regenerate it, don't hand-edit it.
- New business logic ships with tests. Coverage thresholds in `vitest.config.ts`
  only go up.
- Keep components small; split files that grow past a few hundred lines.

## Rules for AI agents

- **Never weaken a check to make it pass.** Do not edit `eslint.config.js`,
  `tsconfig*.json`, `vitest.config.ts`, `.github/`, `.husky/`, `AGENTS.md` or the
  tool adapter files unless the task is explicitly about them. Fix the code instead.
- Do not add, remove or upgrade dependencies without asking.
- Do not commit, push, merge or open PRs on your own — humans own the history.
- Do not delete or skip tests to make a change pass.
- Before finishing, run `npm run verify` and report the real result.

## Workflow

Branches, commit convention, PRs and Definition of Done: see `CONTRIBUTING.md`.
