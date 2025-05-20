import { _fetch } from "./utils-general"
import { TEST_USER } from "./mock-data-goals"
import { PUBLIC_BASE_URL } from "$env/static/public"

export async function getTodos(): Promise<Task[]> {
    const userId = TEST_USER.id

    if (!userId) {
        throw new Error("User ID is required")
    }
    const { response, error } = await _fetch("/home/todos")

    if (error) {
        throw new Error(error.message)
    }
    return response
}

export async function updateTodo(id: string, data: Partial<Omit<Task, "id">>) {
    const _data: any = data
    
    if (_data.id || _data.userId || _data.sessionId || _data.goalId || _data.routineId) {
        throw new Error("Id's cannot be updated")
    }

    const { response, error } = await _fetch(`/home/todos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    })

    if (error) {
        throw new Error(error.message)
    }

    return response
}

export async function addTodo(data: Task) {
    const { response, error } = await _fetch("/home/todos", {
        method: "POST",
        body: JSON.stringify(data)
    })

    if (error) {
        throw new Error(error.message)
    }

    return response
}

export async function reorderTodo(data: TaskReorderPayload) {
    const { response, error } = await _fetch(`${PUBLIC_BASE_URL}/home/todos/${data.task.id}/order`, {
        method: "PUT",
        body: JSON.stringify(data)
    })

    if (error) {
        throw new Error(error.message)
    }
    return response
}

export async function deleteTodo(todo: Task) {
    const { response, error } = await _fetch(`/home/todos/${todo.id}`, {
        method: "DELETE",
        body: JSON.stringify(todo)
    })

    if (error) {
        throw new Error(error.message)
    }

    return response
}