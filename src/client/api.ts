import { hc } from 'hono/client'
import type { AppType } from '../server/index'

// Typed RPC client derived from the Hono server — request/response types
// stay in sync with the backend at compile time.
export const client = hc<AppType>('/')

export const todosApi = client.api.todos

// Todo.targetDate is an optional `YYYY-MM-DD` date string, or null when unset.
export type { Todo } from '../server/todos'
