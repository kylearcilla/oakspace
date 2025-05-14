import { json } from '@sveltejs/kit'
import { err } from "$lib/server/utils"
import { getQuote } from '$lib/server/db/quotes'
import { TEST_USER } from "$lib/mock-data-goals"

export async function GET({ locals }) {
    const userId = TEST_USER.id
    
    if (!userId) {
      return err({ status: 401 })
    }
    try {
        const quote = await getQuote({ userId })
        return json(quote)
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}