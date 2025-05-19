import { json } from "@sveltejs/kit"
import { getTodos } from "$lib/server/db/todos"
import { db } from "$lib/server/db/drizzle"
import { todos } from "$lib/server/db/general-schema"
import { TEST_USER } from "$lib/mock-data-goals.js"

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
        
        if (!todo.title) {
            return json({ error: 'Title is required' }, { status: 400 })
        }

        const [result] = await db
            .insert(todos)
            .values(todo)
            .returning()
        
        return json(result, { status: 201 })
    } 
    catch (error) {
        console.error(error)
        return json({ error: 'Failed to create todo' }, { status: 500 })
    }
}
