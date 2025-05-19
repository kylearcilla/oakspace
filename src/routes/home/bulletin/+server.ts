import { json } from '@sveltejs/kit'
import { err } from '$lib/server/utils'
import { TEST_USER } from '$lib/mock-data-goals'
import { createNote, deleteNote, updateNote } from '$lib/server/db/bulletin'

// POST /api/notes - Create a new note
export async function POST({ request }) {
    const userId = TEST_USER.id
    const { idx, text} = await request.json()

    try {
        const newNote = await createNote({ idx, text, userId })
        return json(newNote)
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}