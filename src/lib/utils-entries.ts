import { _url } from './api-utils'
import { v4 as uuidv4 } from 'uuid'
import { _fetch } from "./utils-general"
import { TEST_USER } from './mock-data-goals'
import { INITIAL_PERIOD_REACH_ENTRY, NEXT_PERIOD_REACH_ENTRY } from './constants'
import { extractPeriodDatesFromRange, getFirstDayOfMonth, getIso, getNextMoRange, getNextQuarterRange, getNextYearRange } from './utils-date'

type FetchEntriesParams = {
    start: string,
    end: string,
    catchAll?: boolean,  // catch all the parent periods for fetching month entries
    period: PeriodType
}

type FetchEntryParams = {
    isoDate: string,
    period?: PeriodType,
    catchAll?: boolean,
    dir?: "left" | "right"
}

type UpdateCacheParams = {
    isoDate: string,
    period: PeriodType,
    data: TextEntryUpdates
}

// entries that already been fetched
export const M_ENTRIES_DB: { [key: string]: TextEntry } = {}
export const Q_ENTRIES_DB: { [key: string]: TextEntry } = {}
export const Y_ENTRIES_DB: { [key: string]: TextEntry } = {}

// when entry doesn't exist, create an empty one and add here
// if user updates the entry, the push it to the db
export const NEW_ENTRIES = new Map<string, TextEntry>()

export async function updateTextEntry({
    entryId, 
    period,
    isoDate,
    data
}: {
    entryId: string,
    isoDate?: string,
    period?: PeriodType,
    data: TextEntryUpdates
}) {
    const _data: any = data
    const isNew = NEW_ENTRIES.has(entryId)

    if (isNew) {
        const res = await createNewEntry(NEW_ENTRIES.get(entryId)!)
        NEW_ENTRIES.delete(entryId)
        return res
    }
    if (_data.id || _data.userId) {
        throw new Error("Ids not allowed to be updated")
    }
    if (data.iconSrc === null) {
        data.iconType = null
        data.iconSize = null
    }
    if (period && isoDate) {
        updateCache({ isoDate, period, data })
    }
    const { response, error } = await _fetch(`/home/entries/${entryId}`, {
        method: "PUT", body: JSON.stringify(data)
    })

    if (error) {
        throw new Error(error.message)
    }
    return response
}

/* updates */

export async function createNewEntry(entry: TextEntry) {
    const { icon, ...rest } = entry
    const data: TextEntryDB = {
        ...rest,
        iconSrc: icon?.src || null,
        iconType: icon?.src ? icon?.type || null : null,
        iconSize: icon?.src ? icon?.size || null : null
    }
    cacheTextEntries([entry])

    const { response, error } = await _fetch(`/home/entries`, {
        method: "POST",
        body: JSON.stringify(data)
    })
    if (error) {
        throw new Error(error.message)
    }

    return response
}

function updateCache({ isoDate, period, data }: UpdateCacheParams) {
    const id = isoDate
    if (period === "month" && M_ENTRIES_DB[id]) {
        M_ENTRIES_DB[id] = { ...M_ENTRIES_DB[id], ...data }
    }
    else if (period === "quarter" && Q_ENTRIES_DB[id]) {
        Q_ENTRIES_DB[id] = { ...Q_ENTRIES_DB[id], ...data }
    }
    else if (period === "year" && Y_ENTRIES_DB[id]) {
        Y_ENTRIES_DB[id] = { ...Y_ENTRIES_DB[id], ...data }
    }
}

function cacheTextEntries(entries: TextEntry[]) {
    for (const entry of entries) {
        const { period, isoDate } = entry

        if (!isoDate) continue

        if (period === "month") {
            M_ENTRIES_DB[isoDate] = entry
        }
        else if (period === "quarter") {
            Q_ENTRIES_DB[isoDate] = entry
        }
        else if (period === "year") {
            Y_ENTRIES_DB[isoDate] = entry
        }
    }
}

/* fetches */

export async function getTextEntry({ isoDate, period = "month", dir, catchAll = true }: FetchEntryParams) {
    const db = getDb(period)
    const entry = db[isoDate]

    if (entry) {
        return entry
    }
    else if (dir && !entry) {
        await fetchNextEntries({ isoDate, dir: dir!, period, catchAll })
        return db[isoDate]
    }
    else {
        return null
    }   
}

export async function fetchTextEntries(data: FetchEntriesParams) {
    const { start, end, period, catchAll = true } = data
    validateDateRange(start, end)

    const url = _url({ path: '/home/entries', params: { start, end, period, catchAll: `${catchAll}` } })
    const { response, error } = await _fetch(url, { method: "GET" })

    if (error) {
        throw new Error(error.message)
    }

    const entries = normFetchResponse({ start, end, period, response, catchAll })
    cacheTextEntries([
        ...entries.moEntries, 
        ...entries.qEntries, 
        ...entries.yEntries
    ])

    return entries
}

export async function fetchInitialEntries() {
    const { moEntries } = await fetchTextEntries({
        ...getInitPeriodRange(), period: "month"
    })
    return moEntries
}

async function fetchNextEntries({ isoDate, dir, period, catchAll = true }: { 
    isoDate: string, dir: "left" | "right", period: PeriodType, catchAll?: boolean }
) {
    // input iso date include the 1st period, so decrement the count
    const bounds = {
        l_count: NEXT_PERIOD_REACH_ENTRY - 1, 
        r_count: NEXT_PERIOD_REACH_ENTRY - 1
    }
    function getRange() {
        if (period === "month") {
            return getNextMoRange({ isoDate, dir, ...bounds })
        }
        else if (period === "quarter") {
            return getNextQuarterRange({ isoDate, dir, ...bounds })
        }
        return getNextYearRange({ isoDate, dir, ...bounds })
    }

    const { start, end } = getRange()
    const entries = await fetchTextEntries({ start, end, period, catchAll })

    console.log({ start, end })

    return entries
}

/* fetch uilts  */

/**
 * Process the entries from the db response.
 * Ensure that each period from range fetch is attached to an entry or null.
 * This is to mark that period as fetched.
 * 
 * @param start - start date
 * @param end - end date
 * @param period - period
 * @param response - response from db
 * 
 * @returns  All entries in the range with null for empty periods
 */
export function normFetchResponse({ start, end, period, response, catchAll }: FetchEntriesParams & { response: TextEntry[] }) {
    const { months, quarters, years } = extractPeriodDatesFromRange({ start, end, period, catchAll })

    function getEntry(isoDate: string, period: PeriodType) {
        const entry = response.find(e => e.isoDate === isoDate && e.period === period)
        const dbRef = getDb(period)[isoDate]

        return entry ?? dbRef ?? getEmptyEntry({ isoDate, period })
    }

    const moEntries = months.map(date => getEntry(date, "month"))
    const qEntries = quarters.map(date => getEntry(date, "quarter"))
    const yEntries = years.map(date => getEntry(date, "year"))

    return { moEntries, qEntries, yEntries }
}

function getInitPeriodRange() {
    const max = INITIAL_PERIOD_REACH_ENTRY
    const isoDate = getIso(getFirstDayOfMonth(new Date()))

    const { start } = getNextMoRange({ isoDate, dir: "left", l_count: max })
    const { end } = getNextMoRange({ isoDate, dir: "right", r_count: max })
    

    return { start, end }
}

function getEmptyEntry({ isoDate, period }: { isoDate: string, period: PeriodType }) {
    const id = uuidv4()
    const newEntry: TextEntry = structuredClone({
        id,
        text: "",
        styling: "has-marker",
        truncate: false,
        icon: null,
        userId: TEST_USER.id,
        period,
        isoDate
    })

    NEW_ENTRIES.set(id, newEntry)
    return newEntry
}

/* utils */

function validateDateRange(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (startDate > endDate) {
        throw new Error("Start date must be before end date")
    }
}
function getDb(period: PeriodType) {
    return period === "month" ? M_ENTRIES_DB : period === "quarter" ? Q_ENTRIES_DB : Y_ENTRIES_DB
}