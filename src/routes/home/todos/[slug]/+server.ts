import { json } from "@sveltejs/kit"
import { deleteTodo, updateTodo } from "$lib/server/db/todos"

export async function PUT({ params, request }) {
    try {
        if (!params.slug) {
            return json({ error: 'Todo ID is required' }, { status: 400 })
        }

        const data = await request.json()
        const result = await updateTodo(params.slug, data)
        
        if (!result.length) {
            return json({ error: 'Todo not found' }, { status: 404 })
        }

        return json(result)
    } 
    catch (error) {
        console.error(error)
        return json({ error: 'Failed to update todo' }, { status: 500 })
    }
}

export async function DELETE({ params }) {
    try {
        if (!params.slug) {
            return json({ error: 'Todo ID is required' }, { status: 400 })
        }

        const result = await deleteTodo(params.slug)
        
        if (!result.length) {
            return json({ error: 'Todo not found' }, { status: 404 })
        }

        return json(result)
    } 
    catch (error) {
        console.error(error)
        return json({ error: 'Failed to delete todo' }, { status: 500 })
    }
}
