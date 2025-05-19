import { TEST_USER } from "./mock-data-goals"
import { _fetch } from "./utils-general"

export async function getTodos(): Promise<Task[]> {
    const userId = TEST_USER.id

    if (!userId) {
        throw new Error("User ID is required")
    }
    const { response, error } = await _fetch("/todos", {
        method: "GET",
        body: JSON.stringify({ userId })
    })

    if (error) {
        throw new Error(error.message)
    }
    return response as Task[]
}

export async function updateTodo(id: string, data: Partial<Omit<Task, "id">>): Promise<Task[]> {
    const _data: any = data
    
    if (_data.id || _data.userId || _data.sessionId || _data.goalId || _data.routineId) {
        throw new Error("Id's cannot be updated")
    }

    const { response, error } = await _fetch(`/todos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    })

    if (error) {
        throw new Error(error.message)
    }

    return response as Task[]
}

export async function addTodo(data: Task): Promise<Task> {
    const { response, error } = await _fetch("/todos", {
        method: "POST",
        body: JSON.stringify(data)
    })

    if (error) {
        throw new Error(error.message)
    }

    return response as Task
}

export async function deleteTodo(id: string): Promise<Task[]> {
    const { response, error } = await _fetch(`/todos/${id}`, {
        method: "DELETE"
    })

    if (error) {
        throw new Error(error.message)
    }

    return response as Task[]
}