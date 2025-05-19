import { createTextEntry, fetchTextEntries, getTextEntryById } from "$lib/server/db/general"
import { TEST_USER } from "$lib/mock-data-goals"
import { err } from "$lib/server/utils"
import { json } from "@sveltejs/kit"

// GET /home/entries?start=YYYY-MM-DD&end=YYYY-MM-DD&period=year|quarter|month
export async function GET({ url: { searchParams: params } }) {
    const userId = TEST_USER.id
    const start = params.get('start')
    const end = params.get('end')
    const period = params.get('period') as PeriodType
    const catchAll = params.get('catchAll') || "true"

    if (!start || !end || !period) {
        return err({ status: 400, message: `All query params are required: "start", "end" and "period".` })
    }

    try {
        const res = await fetchTextEntries({ 
            userId, 
            start, 
            end, 
            catchAll: catchAll === 'true',
            period
        })
        const entries: TextEntry[] = res.map((data: TextEntryDB) => {
            const { iconSize, iconType, iconSrc, ...rest } = data
            const entry: TextEntry = { ...rest, icon: iconSrc ? {
                type: iconType!,
                src: iconSrc, 
                size: iconSize!
            } : null }

            return entry

        }) as TextEntry[]

        return json(entries)  
    } 
    catch (error) {
        console.log(error)
        return err({ status: 404 })
    }
}

// POST /home/entries
export async function POST({ request }) {
    try {
        const entry = await request.json()
        const newEntry = await createTextEntry(entry)

        return json(newEntry)
    }
    catch (error) {
        console.log(error)
        return err({ status: 404 })
    }
}