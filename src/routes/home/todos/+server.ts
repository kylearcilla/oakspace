import { json } from "@sveltejs/kit"
import { TEST_USER } from "$lib/mock-data-goals.js"
import { addTodo, getTodos } from "$lib/server/db/todos"

export async function GET({ request }) {
    try {
        const userId = TEST_USER.id
        const result = await getTodos(userId)
        return json(result)
    } 
    catch (error) {
        console.error(error)
        return json({ error: 'Failed to get todos' }, { status: 500 })
    }
}

export async function POST({ request }) {
    try {
        const todo = await request.json()

        todo.title ??= "Untitled"
        await addTodo(todo)
        
        return json(true)
    } 
    catch (error) {
        console.error(error)
        return json({ error: 'Failed to create todo' }, { status: 500 })
    }
}
