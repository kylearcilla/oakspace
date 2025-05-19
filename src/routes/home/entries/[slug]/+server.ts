import { updateTextEntry } from "$lib/server/db/general"
import { TEST_USER } from "$lib/mock-data-goals"
import { err } from "$lib/server/utils"
import { json } from "@sveltejs/kit"

// PUT /home/entries/entryId
export async function PUT({ params: { slug: id }, request }) {
    const userId = TEST_USER.id

    try {
        const data = await request.json()

        await updateTextEntry(id, data)
        return json({ success: true })
    }
    catch (error) {
        return err({ status: 404 })
    }
}