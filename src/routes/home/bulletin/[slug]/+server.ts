import { json } from "@sveltejs/kit"
import { err } from "$lib/server/utils"
import { deleteNote, updateNote } from "$lib/server/db/bulletin"

// DELETE /api/notes/:id - Delete a note
export async function DELETE({ params, request }) {
    const noteId = params.slug
    const { idx, userId } = await request.json()

    if (!noteId) {
        return err({ status: 400 })
    }

    try {
        const success = await deleteNote({ noteId, idx, userId })
        return json({ success })
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}

// PUT /api/notes/:id - Update a note
export async function PUT({ params, request }) {
    const noteId = params.slug

    if (!noteId) {
        return err({ status: 400 })
    }

    try {
        const { text } = await request.json()
        const updatedNote = await updateNote({ noteId, text })

        if (!updatedNote) {
            return err({ status: 404 })
        }

        return json(updatedNote)
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}
