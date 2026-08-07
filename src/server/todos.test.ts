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

  it('creates a todo without a target date', async () => {
    const res = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write tests' }),
    })

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 1, title: 'Write tests', done: false, targetDate: null })
    expect(await listTodos()).toEqual([
      { id: 1, title: 'Write tests', done: false, targetDate: null },
    ])
  })

  it('creates a todo with a target date', async () => {
    const res = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write tests', targetDate: '2026-12-31' }),
    })

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      id: 1,
      title: 'Write tests',
      done: false,
      targetDate: '2026-12-31',
    })
    expect(await listTodos()).toEqual([
      {
        id: 1,
        title: 'Write tests',
        done: false,
        targetDate: '2026-12-31',
      },
    ])
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

  it('rejects an invalid targetDate on create', async () => {
    const res = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write tests', targetDate: '2026-13-40' }),
    })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(JSON.stringify(body)).toContain('targetDate')
    expect(await listTodos()).toHaveLength(0)
  })

  it('toggles done via PATCH', async () => {
    resetStore([{ id: 1, title: 'Ship it', done: false, targetDate: null }])

    const res = await app.request('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 1, done: true })
  })

  it('updates targetDate via PATCH', async () => {
    resetStore([{ id: 1, title: 'Ship it', done: false, targetDate: null }])

    const res = await app.request('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDate: '2026-10-10' }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      id: 1,
      title: 'Ship it',
      done: false,
      targetDate: '2026-10-10',
    })

    expect(await listTodos()).toEqual([
      {
        id: 1,
        title: 'Ship it',
        done: false,
        targetDate: '2026-10-10',
      },
    ])
  })

  it('can clear targetDate via PATCH', async () => {
    resetStore([
      { id: 1, title: 'Ship it', done: false, targetDate: '2026-10-10' },
    ])

    const res = await app.request('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDate: null }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      id: 1,
      title: 'Ship it',
      done: false,
      targetDate: null,
    })

    expect(await listTodos()).toEqual([
      {
        id: 1,
        title: 'Ship it',
        done: false,
        targetDate: null,
      },
    ])
  })

  it('rejects an invalid targetDate on PATCH', async () => {
    resetStore([{ id: 1, title: 'Ship it', done: false, targetDate: null }])

    const res = await app.request('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDate: 'not-a-date' }),
    })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(JSON.stringify(body)).toContain('targetDate')

    expect(await listTodos()).toEqual([
      {
        id: 1,
        title: 'Ship it',
        done: false,
        targetDate: null,
      },
    ])
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
    resetStore([{ id: 1, title: 'Remove me', done: false, targetDate: null }])

    const res = await app.request('/api/todos/1', { method: 'DELETE' })

    expect(res.status).toBe(200)
    expect(await listTodos()).toHaveLength(0)
  })
})
