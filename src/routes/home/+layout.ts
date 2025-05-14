import { QUOTE_DATE_KEY, QUOTE_KEY } from "$lib/constants"
import { isQuoteExpired } from "$lib/utils"

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
export async function load({ fetch: _fetch }) {
    fetch = _fetch
    // get user data

    // get optoins data

    // get habit data

    // get quote

    const user = await getUserData()
    const home = await getHomeData()

    console.log(home)

    return {
        quote: getQuoteData(),
        home,
        user
    }
}


/* general data */

async function getUserData(): Promise<User> {
    const userRes = await fetch('/home/user')
    const user = await userRes.json()

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

async function getAppearanceData() {

}

async function getTodosData() {

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

    const likesRes = await fetch(`/home/quotes/likes?quoteId=${quoteData!.quote.id}`)
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
            quote: JSON.parse(quote)
        }
    }
    else {
        return null
    }
}