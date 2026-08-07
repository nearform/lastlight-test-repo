import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export type Todo = {
  id: number
  title: string
  done: boolean
  /**
   * Optional target completion date in `YYYY-MM-DD` format.
   * Stored as `null` when no date is set.
   */
  targetDate: string | null
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return false

  const iso = date.toISOString().slice(0, 10)
  return iso === value
}

const targetDateSchema = z
  .string()
  .refine(isValidIsoDate, {
    message: 'Invalid targetDate; expected YYYY-MM-DD',
  })

// Simple in-memory store so the app runs with zero config (no DB/secrets).
// Exported reset helper keeps tests isolated.
let todos: Todo[] = []
let nextId = 1

export function resetStore(seed: Todo[] = []): void {
  todos = seed.map((t) => ({
    ...t,
    targetDate: t.targetDate ?? null,
  }))
  nextId = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1
}

const createSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  targetDate: targetDateSchema.optional(),
})

const updateSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    done: z.boolean().optional(),
    targetDate: z.union([targetDateSchema, z.null()]).optional(),
  })
  .refine(
    (body) => Object.keys(body).length > 0,
    {
      message: 'Provide at least one field to update',
    },
  )

export const todosRoute = new Hono()
  .get('/', (c) => c.json(todos))
  .post('/', zValidator('json', createSchema), (c) => {
    const { title, targetDate } = c.req.valid('json')
    const todo: Todo = {
      id: nextId++,
      title,
      done: false,
      targetDate: targetDate ?? null,
    }
    todos.push(todo)
    return c.json(todo, 201)
  })
  .patch('/:id', zValidator('json', updateSchema), (c) => {
    const id = Number(c.req.param('id'))
    const todo = todos.find((t) => t.id === id)
    if (!todo) return c.json({ error: 'Todo not found' }, 404)

    const patch = c.req.valid('json')
    if (patch.title !== undefined) todo.title = patch.title
    if (patch.done !== undefined) todo.done = patch.done
    if (patch.targetDate !== undefined) todo.targetDate = patch.targetDate
    return c.json(todo)
  })
  .delete('/:id', (c) => {
    const id = Number(c.req.param('id'))
    const index = todos.findIndex((t) => t.id === id)
    if (index === -1) return c.json({ error: 'Todo not found' }, 404)

    const [removed] = todos.splice(index, 1)
    return c.json(removed)
  })
