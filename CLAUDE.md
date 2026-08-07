# CLAUDE.md

Guidance for Claude Code (and Last Light agents) working in this repo.

## What this is

A small **Hono + Vite + React** todo app used as an example for exercising
lastlight workflows (lint / typecheck / test / build). It's a **single
integrated Vite app**: Vite serves the React client and the Hono API runs as
middleware inside the same dev server, so everything is one origin. Todos live
in an **in-memory store** — no database, no secrets, runs with zero config.

## Branch & commit policy

**Never commit directly to `main`.** All changes go through a pull request:

1. Branch off `main` — e.g. `feature/<short-desc>` or `fix/<short-desc>`.
2. Commit to that branch and push.
3. Open a PR against `main` (`gh pr create`).
4. Keep `main` green: run lint, typecheck, and tests before opening the PR.

## Commands

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Vite dev server with the Hono API at `/api`           |
| `npm run build`     | Typecheck (`tsc -b`) + build the client to `dist/`    |
| `npm start`         | Production Node server (serves `dist/` + API via tsx) |
| `npm run lint`      | Lint with **oxlint**                                  |
| `npm run typecheck` | Typecheck with `tsc -b`                               |
| `npm test`          | Run the test suite once (Vitest)                      |
| `npm run test:watch`| Tests in watch mode                                   |

Before pushing, the full check is: `npm run lint && npm run typecheck && npm test && npm run build`.

## Layout

```
src/
  client/        React 19 SPA
    main.tsx     entry
    App.tsx      todo UI
    api.ts       typed Hono RPC client (hc<AppType>)
    App.test.tsx component tests (Testing Library + jsdom)
  server/
    index.ts     Hono app — mounts /api/todos, exports AppType
    todos.ts     routes + in-memory store + zod schemas
    node.ts      production entry: serves dist/ + API
    todos.test.ts API tests (app.request)
vite.config.ts   Vite + Hono dev-server middleware (only /api/* → Hono)
vitest.config.ts test config (jsdom) — separate from vite.config.ts on purpose
```

## Conventions & gotchas

- **Linter is oxlint, not ESLint** (the current Vite `react-ts` starter default).
- **Typed end-to-end.** The client talks to the server via Hono's `hc` client
  (`src/client/api.ts`), typed off the server's exported `AppType`. Changing a
  route's shape surfaces as a client-side type error — keep them in sync.
- **In-memory store** (`src/server/todos.ts`) exports `resetStore()`; tests call
  it in `beforeEach` for isolation. State does not persist across restarts.
- **TS is strict + bundler mode**: `verbatimModuleSyntax` (use `import type` for
  type-only imports) and `erasableSyntaxOnly` (no enums/namespaces/param props).
- Server code is typechecked under `tsconfig.app.json` (which includes `node`
  types for the production entry).
- Add tests next to the code they cover as `*.test.ts` / `*.test.tsx` under `src/`.
