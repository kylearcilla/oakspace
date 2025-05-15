import { json } from '@sveltejs/kit'
import { err } from "$lib/server/utils"
import { TEST_USER } from "$lib/mock-data-goals"
import { getLikes, toggleLike } from "$lib/server/db/quotes"

export async function GET({ locals, params }) {
    const userId = TEST_USER.id

    if (!userId) {
        return err({ status: 401 })
    }

    const quoteId = params.slug

    if (!quoteId) {
        return err({ status: 400 })
    }
  
    try {
        const likes = await getLikes({ quoteId })
        return json(likes)
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}

export async function POST({ locals, params }) {
    const userId = TEST_USER.id
    
    if (!userId) {
      return err({ status: 401 })
    }
    
    const quoteId = params.slug
    
    if (!quoteId) {
      return err({ status: 400 })
    }
    
    try {
        await toggleLike({ quoteId, userId })
        return json({ success: true })
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}