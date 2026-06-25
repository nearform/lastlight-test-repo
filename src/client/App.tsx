import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { todosApi, type Todo } from './api'
import './App.css'

type Theme = 'light' | 'dark'

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>('light')

  const load = useCallback(async () => {
    const res = await todosApi.$get()
    setTodos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    try {
      const stored = window.localStorage?.getItem('theme')
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored)
        return
      }

      if (stored != null && stored !== 'light' && stored !== 'dark') {
        // eslint-disable-next-line no-console
        console.warn('Unknown theme in localStorage, falling back to default')
      }
    } catch {
      // If localStorage is unavailable or throws, fall back to default.
    }

    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches

    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const root = document.documentElement

    if (theme === 'dark') {
      root.dataset.theme = 'dark'
    } else {
      delete root.dataset.theme
    }

    try {
      window.localStorage?.setItem('theme', theme)
    } catch {
      // Ignore storage write failures.
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  async function addTodo(e: FormEvent) {
    e.preventDefault()
    const value = title.trim()
    if (!value) return
    await todosApi.$post({ json: { title: value } })
    setTitle('')
    await load()
  }

  async function toggle(todo: Todo) {
    await todosApi[':id'].$patch({
      param: { id: String(todo.id) },
      json: { done: !todo.done },
    })
    await load()
  }

  async function remove(todo: Todo) {
    await todosApi[':id'].$delete({ param: { id: String(todo.id) } })
    await load()
  }

  const remaining = todos.filter((t) => !t.done).length

  return (
    <main className="app">
      <header className="app-header">
        <h1>Todos</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-pressed={theme === 'dark'}
          aria-label={
            theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
          }
        >
          <span className={theme === 'light' ? 'selected' : ''}>Light</span>
          <span className={theme === 'dark' ? 'selected' : ''}>Dark</span>
        </button>
      </header>

      <form className="add-form" onSubmit={addTodo}>
        <input
          aria-label="New todo"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : todos.length === 0 ? (
        <p className="muted">Nothing here yet — add your first todo.</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.done ? 'done' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggle(todo)}
                />
                <span>{todo.title}</span>
              </label>
              <button
                className="remove"
                aria-label={`Delete ${todo.title}`}
                onClick={() => remove(todo)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {todos.length > 0 && (
        <p className="muted count">{remaining} remaining</p>
      )}
    </main>
  )
}
