import { Hono } from 'hono'
import { todosRoute } from './todos'

// Mount the API under /api. Keeping the routes chained here lets Hono
// infer the full type for the client RPC (see src/client/api.ts).
const app = new Hono().route('/api/todos', todosRoute)

export type AppType = typeof app
export default app
