import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { todosApi, type Todo } from './api'
import './App.css'

const TAGLINE = 'Do all your stuff!'

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
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
      <h1>Todos</h1>
      <p className="app-tagline">{TAGLINE}</p>

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
