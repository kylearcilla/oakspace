import { isQuoteExpired } from "$lib/utils"
import { TEST_USER } from "$lib/mock-data-goals"
import { fetchInitialEntries, fetchTextEntries } from "$lib/utils-entries"
import { getUiOptions, getUser } from "$lib/api-general"
import { INITIAL_PERIOD_REACH_ENTRY, QUOTE_DATE_KEY, QUOTE_KEY } from "$lib/constants"
import { getTodos } from "$lib/api-todos.js"

export const ssr = false

let fetch: typeof globalThis.fetch 

// /**
//  * Fetch data for the whole app.
//  * The resources are ones that must be fetched for every refresh.
//  * 
//  * 
//  * @param param0 '
//  * @returns 
//  */
export async function load({ fetch: _fetch }): Promise<InitialDataLoad> {
    fetch = _fetch
    // get user data

    // get optoins data

    // get habit data

    // get quote

    const user = await getUserData()
    const home = await getHomeData()
    const { appearance, bar } = await getUiOptions()
    const entries = await fetchInitialEntries()
    const todos = await getTodos()

    return {
        quote: getQuoteData(),
        home,
        user,
        appearance,
        bar,
        entries,
        todos
    }
}


/* general data */

async function getUserData(): Promise<User> {
    const user = await getUser(TEST_USER.id)

    return {
        ...user,
        stats: {
            goalsReached: user.goalsReached,
            habitsDone: user.habitsDone,
            sessions: user.sessions,
            focusTime: user.focusTime,
            routinesMade: user.routinesMade
        }
    }
}
/* home data */

async function getHomeData() {
    const homeRes = await fetch('/home')
    return await homeRes.json()
}

/* quotes */

async function getQuoteData(): Promise<Quote> {
    let quoteData = didInitQuote()

    if (!quoteData || isQuoteExpired(quoteData.date)) {
        const quoteRes = await fetch('/home/quotes')
        quoteData = await quoteRes.json()

        setQuote(quoteData!.quote)
    }

    const likesRes = await fetch(`/home/quotes/likes/${quoteData!.quote.id}`)
    const res = await new Promise(resolve => setTimeout(resolve, 1500))
    const likes = await likesRes.json()

    return { ...quoteData!.quote, likes }
}

function setQuote(quote: Quote) {
    localStorage.setItem(QUOTE_KEY, JSON.stringify(quote))
    localStorage.setItem(QUOTE_DATE_KEY, JSON.stringify(new Date()))
}

function didInitQuote() {
    const date = localStorage.getItem(QUOTE_DATE_KEY)
    const quote = localStorage.getItem(QUOTE_KEY)

    if (date && quote) {
        return { 
            date: new Date(date), 
            quote: JSON.parse(quote) as Quote
        }
    }
    else {
        return null
    }
}