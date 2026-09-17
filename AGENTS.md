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

## Non-negotiable business rules

1. **The KAM never receives the base cost or the contribution margin.** Only the
   total offered value and, for "Capacitación", the Pro-Cultura stamp. The backend
   enforces it; the client must not request, compute or display those fields for a KAM.
2. A KAM sees only their own requests; an LP only the requests assigned to them.
3. Pipeline: `nueva` → `en-experto` → `en-costeo` → `entregada`.
   - Advancing to `en-experto` requires an assigned professor.
   - **Only the KAM marks `entregada`**, and only if the offered value is > 0.
   - The KAM may return an `entregada` request to `en-costeo` with client observations.
4. The KAM edits or cancels their own request only while it is `nueva`.
   The LP reassigns only while `nueva`, with a structured reason.
5. Money is never negative; margin is 0–100. The costing formula lives only in
   `src/lib/costing.ts` (client-side preview); the backend is the authority.
   Do **not** change the Pro-Cultura rate: it is an open question (docs/08, Q12).
6. Professors have no account; the LP records their progress.

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
