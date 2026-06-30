import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { todosApi, type Todo } from './api'
import './App.css'

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await todosApi.$get()
    setTodos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addTodo(e: FormEvent) {
    e.preventDefault()
    const value = title.trim()
    if (!value) return

    const body: { title: string; targetDate?: string } = { title: value }
    if (targetDate) {
      body.targetDate = targetDate
    }

    await todosApi.$post({ json: body })
    setTitle('')
    setTargetDate('')
    await load()
  }

  async function updateLatestTodoTargetDate(value: string) {
    if (todos.length === 0) return

    const latest = todos[todos.length - 1]
    await todosApi[':id'].$patch({
      param: { id: String(latest.id) },
      json: { targetDate: value || null },
    })
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
      <h1>Todos</h1>

      <form className="add-form" onSubmit={addTodo}>
        <input
          aria-label="New todo"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="date"
          aria-label="Target date (optional)"
          value={targetDate}
          onChange={(e) => {
            const value = e.target.value
            setTargetDate(value)

            // When the title field is empty but we already have todos,
            // treat this as modifying the most recently created todo's
            // target date rather than composing a new one.
            if (!title && todos.length > 0) {
              void updateLatestTodoTargetDate(value)
            }
          }}
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
                {todo.targetDate && (
                  <span className="todo-date">Target: {todo.targetDate}</span>
                )}
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
