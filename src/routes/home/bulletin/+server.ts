import { json } from '@sveltejs/kit'
import { createNote, deleteNote, updateNote } from '$lib/server/db/bulletin'
import { err } from '$lib/server/utils'

// POST /api/notes - Create a new note
export async function POST({ request }) {
    const { idx, text, userId } = await request.json()

    try {
        const newNote = await createNote({ idx, text, userId })
        return json(newNote)
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}