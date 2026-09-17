# commercial-requests-web

Web client of the **Commercial Requests** system — Dirección de Extensión y
Consultoría, Universidad Icesi. KAMs register client needs; Product Leaders assign
an expert and cost the proposal; KAMs deliver it to the client.

Backend: [`commercial-requests-backend`](https://github.com/JuanAndresCano/commercial-requests-backend) (NestJS + PostgreSQL).

## Quick start

Requires Node 22 (`.nvmrc`).

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

| Command            | What it does                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `npm run verify`   | Everything CI checks: lint, types, format, tests + coverage, build |
| `npm test`         | Unit tests                                                         |
| `npm run lint:fix` | Auto-fix lint issues                                               |

## Stack

React 18 · TypeScript (strict) · Vite · React Router · Tailwind CSS · shadcn/ui ·
TanStack Query · Vitest.

## Documentation

- [`AGENTS.md`](AGENTS.md) — code and business rules (for people and AI tools).
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branches, commits, PRs, definition of done.
- [`docs/`](docs/README.md) — validated business rules, user flows, data model, UX patterns.

## Status

The UI comes from a UX prototype validated with the product lead. It still runs on
mock data persisted in `localStorage`; replacing that with the backend API and real
authentication is the current work.
