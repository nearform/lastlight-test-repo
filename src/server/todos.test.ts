import { beforeEach, describe, expect, it } from 'vitest'
import app from './index'
import { resetStore, type Todo } from './todos'

beforeEach(() => {
  resetStore()
})

async function listTodos(): Promise<Todo[]> {
  const res = await app.request('/api/todos')
  return res.json()
}

describe('todos API', () => {
  it('starts empty', async () => {
    const res = await app.request('/api/todos')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('creates a todo', async () => {
    const res = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write tests' }),
    })

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 1, title: 'Write tests', done: false })
    expect(await listTodos()).toHaveLength(1)
  })

  it('rejects an empty title', async () => {
    const res = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    })

    expect(res.status).toBe(400)
    expect(await listTodos()).toHaveLength(0)
  })

  it('toggles done via PATCH', async () => {
    resetStore([{ id: 1, title: 'Ship it', done: false }])

    const res = await app.request('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 1, done: true })
  })

  it('returns 404 when patching a missing todo', async () => {
    const res = await app.request('/api/todos/999', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })

    expect(res.status).toBe(404)
  })

  it('deletes a todo', async () => {
    resetStore([{ id: 1, title: 'Remove me', done: false }])

    const res = await app.request('/api/todos/1', { method: 'DELETE' })

    expect(res.status).toBe(200)
    expect(await listTodos()).toHaveLength(0)
  })
})
