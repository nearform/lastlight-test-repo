import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Todo } from './api'

// Back the typed client with an in-memory fake so the component test
// exercises real UI behaviour without a running server.
const store = vi.hoisted(() => ({ todos: [] as Todo[], nextId: 1 }))

vi.mock('./api', () => {
  const json = (body: unknown) => ({ json: async () => body })
  return {
    todosApi: {
      // Return fresh objects each call, like a real HTTP response, so
      // React sees a new reference and re-renders.
      $get: async () => json(store.todos.map((t) => ({ ...t }))),
      $post: async ({
        json: { title, targetDate },
      }: {
        json: { title: string; targetDate?: string | null }
      }) => {
        const todo: Todo = {
          id: store.nextId++,
          title,
          done: false,
          targetDate: targetDate ?? null,
        }
        store.todos.push(todo)
        return json(todo)
      },
      [':id']: {
        $patch: async ({
          param,
          json: patch,
        }: {
          param: { id: string }
          json: Partial<Todo>
        }) => {
          const todo = store.todos.find((t) => t.id === Number(param.id))!
          Object.assign(todo, patch)
          return json(todo)
        },
        $delete: async ({ param }: { param: { id: string } }) => {
          store.todos = store.todos.filter((t) => t.id !== Number(param.id))
          return json({})
        },
      },
    },
  }
})

// Imported after the mock is registered.
const { default: App } = await import('./App')

beforeEach(() => {
  store.todos = []
  store.nextId = 1
})

afterEach(cleanup)

describe('<App />', () => {
  it('shows the empty state', async () => {
    render(<App />)
    expect(await screen.findByText(/add your first todo/i)).toBeInTheDocument()
  })

  it('adds a todo without a target date', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/add your first todo/i)

    await user.type(screen.getByLabelText('New todo'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('1 remaining')).toBeInTheDocument()
    expect(screen.queryByText(/Target:/i)).not.toBeInTheDocument()
  })

  it('adds a todo with a target date', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/add your first todo/i)

    await user.type(screen.getByLabelText('New todo'), 'Buy milk')
    await user.type(
      screen.getByLabelText('Target date (optional)'),
      '2026-12-31',
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Target: 2026-12-31')).toBeInTheDocument()
    expect(screen.getByText('1 remaining')).toBeInTheDocument()
  })

  it('toggles a todo as done', async () => {
    store.todos = [{ id: 1, title: 'Walk dog', done: false, targetDate: null }]
    store.nextId = 2
    const user = userEvent.setup()
    render(<App />)

    const checkbox = await screen.findByRole('checkbox')
    await user.click(checkbox)

    await waitFor(() =>
      expect(screen.getByText('0 remaining')).toBeInTheDocument()
    )
  })

  it('deletes a todo', async () => {
    store.todos = [{ id: 1, title: 'Old task', done: false, targetDate: null }]
    store.nextId = 2
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Old task')
    await user.click(screen.getByRole('button', { name: 'Delete Old task' }))

    expect(await screen.findByText(/add your first todo/i)).toBeInTheDocument()
  })
})
