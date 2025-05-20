import { json } from "@sveltejs/kit"
import { reorderTodo } from "$lib/server/db/todos.js"

export async function PUT({ params, request }) {
    try {
        if (!params.slug) {
            return json({ error: 'Todo ID is required' }, { status: 400 })
        }
        
        const data = await request.json()
        const result = await reorderTodo(data)
        
        return json(result)
    } 
    catch (error) {
        console.error(error)
        return json({ error: 'Failed to update todo' }, { status: 500 })
    }
}