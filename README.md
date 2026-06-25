# lastlight-test-repo

A small **Hono + Vite + React** todo app, used as an example for exercising
lastlight workflows (lint / typecheck / test / build). It is a single
integrated Vite app: Vite serves the React client and the Hono API runs as
middleware inside the same dev server, so everything is served from one origin.

No database or secrets required — todos live in an in-memory store, so the app
runs with zero config.

## Stack

- **Hono** — API routes under `/api/*`, with `zod` request validation
- **Vite + React 19 + TypeScript** — client SPA
- **Typed RPC** — the client talks to the server through Hono's `hc` client, so
  request/response types stay in sync at compile time
- **Vitest** + Testing Library — server (`app.request`) and component tests
- **oxlint** — linting (the Vite starter default)
- **tsx** — runs the production Node server

## Project layout

```
src/
  client/        React SPA
    main.tsx
    App.tsx      todo UI
    api.ts       typed Hono RPC client
    *.test.tsx   component tests
  server/
    index.ts     Hono app (mounts /api/todos)
    todos.ts     todo routes + in-memory store + zod schemas
    node.ts      production entry: serves dist/ + API
    *.test.ts    API tests
vite.config.ts   Vite + Hono dev-server middleware
vitest.config.ts test config (jsdom)
```

## Scripts

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Vite dev server with the Hono API at `/api`          |
| `npm run build`     | Typecheck (`tsc -b`) + build the client to `dist/`   |
| `npm start`         | Run the production Node server (serves `dist/` + API)|
| `npm run lint`      | Lint with oxlint                                     |
| `npm run typecheck` | Typecheck with `tsc -b`                              |
| `npm test`          | Run the test suite once                              |
| `npm run test:watch`| Run tests in watch mode                              |

## API

| Method   | Path              | Body                          | Description        |
| -------- | ----------------- | ----------------------------- | ------------------ |
| `GET`    | `/api/todos`      | —                             | List todos         |
| `POST`   | `/api/todos`      | `{ "title": string }`         | Create a todo      |
| `PATCH`  | `/api/todos/:id`  | `{ "title"?, "done"? }`       | Update a todo      |
| `DELETE` | `/api/todos/:id`  | —                             | Delete a todo      |
