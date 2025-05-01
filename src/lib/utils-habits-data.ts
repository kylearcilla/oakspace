import { habitTracker } from "./store"
import { initData } from "./utils-habits"
import { TEST_HABITS, YEAR_HABITS_DATA } from "./mock-data";
import { addToDate, genMonthCalendar, getStartOfWeek, getWeekPeriod, isLeapYear, isSameDay, sameMonth } from "./utils-date"

export const MAX_WEEKS_BACK = 6
export const MAX_WEEKS_BACK_IDX = MAX_WEEKS_BACK - 1
export const MAX_HABITS_COUNT = 15

export const DEFAULT_SYMBOLS = [ "🌱", "🌿", "🧘🏼‍♂️", "📝", "👨‍💻", "🔖", "🏃‍♂️", "📖" ]

export const EXAMPLE_HABITS = [
    "Reading for 20 minutes 📖 every morning",
    "Writing for 1000 words 📝 every Sunday morning",
    "Exercise for 30 minutes 💪 every day on Monday, Wednesday, and Friday",
    "Meditation for 10 minutes 🧘 every morning",
    "Sleep for 8 hours 🛌 every day",
    "Yoga for 30 minutes 🧘 every 4x a week.",
    "Learn a Language 🇫🇷 3x a week, in the afternoons.",
]

export function initHabits() {
    initHabitData()
    initData(new Date().getFullYear(), new Date().getMonth())
}

export function initHabitData() {
    TEST_HABITS.forEach((habit) => {
        const yearData = YEAR_HABITS_DATA.find((_habit) => _habit.name === habit.name)!
        const { start, end } = getWeekBounds()
    })

    habitTracker.set({ 
        habits: TEST_HABITS, 
        activeStreak: null, 
        yearHeatMap: null,
        monthMetrics: null,
        yearMetrics: null,
        viewHabit: null
    })

    return TEST_HABITS
}

export function generateHabitData(date = new Date()) {
    const yearData = createChunks(date)
    const today = new Date()
    const currentYear = today.getFullYear()
    const nextYear = currentYear + 1
    
    // fill out chunks up to today
    Object.keys(yearData).forEach((monthKeyStr) => {
        const monthKey = monthKeyStr as HabitMonthKey
        const [year, month] = monthKey.split('-').map(Number)
        const daysInMonth = new Date(year, month, 0).getDate()
        
        if (year > nextYear || (year === nextYear && month > 1)) {
            return
        }
        
        for (let day = 0; day < daysInMonth; day++) {
            const checkDate = new Date(year, month - 1, day + 1)
            const habitCompleted = Math.random() > 0.5

            if (checkDate > today) {
                continue
            }
            if (habitCompleted) {
                yearData[monthKey] |= (1 << day)
            }
        }
    })

    return yearData
}

export function createChunks(date = new Date()): HabitMonthChunk {
    const currentYear = date.getFullYear()
    const prevYear = currentYear - 1
    const nextYear = currentYear + 1
    const chunks: Record<string, number> = {}

    // Add previous year's December chunk
    chunks[`${prevYear}-12`] = 0

    // Add current year's chunks (January through December)
    for (let month = 1; month <= 12; month++) {
        const monthKey = month.toString().padStart(2, '0')
        chunks[`${currentYear}-${monthKey}`] = 0
    }

    // Add next year's January chunk
    chunks[`${nextYear}-01`] = 0

    return chunks
}

/* year data */

export function getHabitBitData(habit: Habit) {
    return YEAR_HABITS_DATA.find(({ name }) => name === habit.name)!.data
}

export function getBitAddress(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const dayOfMonth = date.getDate()
    const monthKey = month.toString().padStart(2, '0')
    const chunkKey = `${year}-${monthKey}` as HabitMonthKey
    
    const bitPosition = dayOfMonth - 1

    return { chunkKey, bitPosition }
}

/**
 * Toggle a habit's year bit.
 * @param habit     - The habit to toggle
 * @param dayIdx    - The day index (0-6, where 0 is Sunday)
 * @param weeksAgoIdx - Number of weeks ago (0 = current week, 1 = last week, etc.)
 */
export function toggleHabitYearBit({ habit, date }: { habit: Habit, date: Date }) {
    const data = YEAR_HABITS_DATA.find(({ name }) => name === habit.name)!.data
    const { chunkKey, bitPosition } = getBitAddress(date)
    
    if (!chunkKey) return

    const bit = (data[chunkKey] >> bitPosition) & 1
    data[chunkKey] ^= (1 << bitPosition)
    const chunk = data[chunkKey]
    console.log({ chunkKey, bitPosition, chunk: chunk.toString(2) })
}

/**
 * Extract a subset of bits between two dates (inclusive)
 * 
 * @param yearHabits - The habit data for the year
 * @param startDate  - The start date (1-based)
 * @param endDate    - The end date (1-based)
 * @returns A bigint representing the extracted bits
 */
export function getHabitBitsSlice(habit: Habit, startDate: Date, endDate: Date) {
    let bitsStr = ''
    const currentDate = new Date(endDate)
    const yearHabits = YEAR_HABITS_DATA.find(({ name }) => name === habit.name)!.data

    while (currentDate.getTime() >= startDate.getTime()) {
        const bit = getBitFromDate(yearHabits, currentDate)
        currentDate.setDate(currentDate.getDate() - 1)

        if (bit != null) {
            bitsStr += bit.toString()        
        }
        else {
            bitsStr += '0'
        }
    }

    return bitsStr.split('').reverse().join('')
}

export function getBitFromDate(yearHabits: Record<string, number>, date: Date) {
    const { chunkKey, bitPosition } = getBitAddress(date)
    const data = yearHabits[chunkKey]

    if (data === undefined) {
        return null
    }
    else {
        return ((data >> bitPosition) & 1).toString()
    }
}

export function dayExists(habit: Habit, date: Date) {
    const createdAt = habit.createdAt
    const startOfWeek = getStartOfWeek(createdAt)
    const beforeCreation = !isSameDay(date, startOfWeek) && date < startOfWeek

    return !beforeCreation
}

/**
 * Get a habit's data given a start and end date.
 */
export function getHabitData({ habit, firstDate, endDate, length, data }: {
    habit: Habit
    firstDate: Date
    data: HabitHeatMapDay[]
    endDate: Date
    length: number
}) {
    const bits = getHabitBitsSlice(habit, firstDate, endDate)

    let wkIdx = 0

    const getDateFromIdx = (dayIdx: number) => {
        const date = new Date(firstDate)
        date.setDate(date.getDate() + dayIdx)
        return date
    }
    const beyondBounds = (dayIdx: number) => {
        return isDayBeyondBounds(getDateFromIdx(dayIdx))
    } 
    for (let week = 0; week < 6; week++) {
        const n = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
        const weekDays = data.slice(week * 7, week * 7 + 7)
        const { firstIdx, lastIdx } = getBoundsIdx({ habit, days: weekDays, allowFuture: true })

        const weekStart = week * 7
        const weekEnd = Math.min(weekStart + 7, length)
        const weekBits = bits.slice(weekStart, weekEnd)
        const requiredDays = getWeekRequiredDays({ 
            habit, weekBits, lastIdx, firstIdx 
        })

        for (let i = firstIdx; i <= 6 && i >= 0; i++) {
            const required = requiredDays[i] === 1
            const completed = weekBits[i] === '1'

            n[i][0] += completed ? 1 : 0
            n[i][1] += required ? 1 : 0
            n[i][2] += required && completed ? 1 : 0
        }
        for (let i = 0; i <= 6; i++) {
            const idx = wkIdx * 7 + i
            const offBounds = (i < firstIdx || i > lastIdx) || firstIdx < 0

            if (!offBounds) {
                data[idx].done = n[i][0]
                data[idx].due = n[i][1]
                data[idx].trueDone = n[i][2]
            }

            if (!dayExists(habit, getDateFromIdx(idx))) {
                data[idx].noData = true
            }
            if (beyondBounds(idx)) {
                data[idx].beyondBounds = true
            }
        }
        wkIdx++
    }
}

/* week utils */

/**
 * Get the start and end of a week period where habits can be toggled from now.
 * 
 * @param weeksAgo - The number of weeks ago to get the bounds for (default: MAX_WEEKS_BACK_IDX)
 * @returns The start and end of the week bounds
 */
export function getWeekBounds(weeksAgo = MAX_WEEKS_BACK_IDX) {
    const date = new Date() 
    const { start, end } = getWeekPeriod(date, weeksAgo)

    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    return { start, end }
}

export function isDayBeyondBounds(date: Date) {
    const { start } = getWeekBounds()
    return date < start
}

/**
 * Get the required days for a habit given a week's bits.
 * 
 *  Req Arr:
 *  0: not required (not required)
 *  1: required     (is required)
 * 
 * @param habit   - The habit object
 * @param weekBits - The week bits from the habit's data property
 * @param lastIdx  - The index of the last day in the week (default: 6)
 * @returns       - The required days for the habit
 */
export function getWeekRequiredDays({ habit, weekBits, lastIdx = 6, firstIdx = 0 }: {
    habit: Habit, weekBits: string, lastIdx?: number, firstIdx?: number
}) {
    const { freqType, frequency } = habit
    const days = new Array(7).fill(0)
  
    if (freqType === "daily") {
        for (let i = firstIdx; i <= lastIdx; i++) {
            days[i] = 1
        }
        return days
    }
    else {
        // for per week, the last x days are required
        // if earlier days are checked y, then the last x - y days are required
        let freqCount = countRequired(habit)

        for (let i = 0; i <= 6 && freqCount > 0; i++) {
            if (weekBits[i] === "1") {
                days[i] = 1
                freqCount--
            }
        }
        for (let i = 6; i >= 0 && freqCount > 0; i--) {
            if (weekBits[i] === "0") {
                days[i] = 1
                freqCount--
            }
        }
        for (let i = 0; i <= 6; i++) {
            if (i < firstIdx || i > lastIdx) {
                days[i] = 0
            }
        }

        return days
    }
}

/* month utils */

export function initMonthHeatMap({ monthIdx, year}: { monthIdx: number, year: number }) {
    const date = new Date(year, monthIdx)
    const month = genMonthCalendar(date)
    const length = month.days.length
    const data: HabitHeatMapDay[] = month.days.map(day => {
        const { date, isInCurrMonth } = day

        return {
            date,
            isInCurrMonth,
            trueDone: 0,
            due: 0,
            done: 0
        }
    })

    let firstDate = month.days[0].date
    let endDate = month.days[length - 1].date

    return { data, firstDate, endDate, length }
}

/* utils */

export function countBitsStr(bitsStr: string) {
    return bitsStr.split('').filter(bit => bit === '1').length
}

export function countSetBits(n: number): number {
    let count = 0
    while (n) {
        n &= (n - 1)
        count++
    }
    return count
}

export function countRequired(habit: Habit) {
    const { freqType, frequency } = habit
    return freqType === "daily" ? 7 : freqType === "day-of-week" ? countSetBits(frequency) : frequency
}

export function getBoundsIdx<T extends { date: Date }>({ habit, days, month, allowFuture = false }: { 
    habit: Habit, days: T[], month?: Date, allowFuture?: boolean
}) {
    let firstIdx = 0, lastIdx = 6
    const firstDate = days[0].date
    const lastDate = days[days.length - 1].date

    const firstNullIdx = getNullIdx({ habit, days, order: "first" })
    const lastNullIdx = getNullIdx({ habit, days, order: "last" })
    const todayIdx = getTodayIdx(days)

    if (lastNullIdx >= 0) {
        firstIdx = lastNullIdx + 1
    }
    if (todayIdx >= 0 && !allowFuture) {
        lastIdx = todayIdx
    }
    if (firstNullIdx >= 0) {
        lastIdx = firstNullIdx - 1
    }
    if (month) {
        const a = sameMonth(firstDate, month)
        const b = sameMonth(lastDate, month)

        if (a && !b) {
            lastIdx = Math.min(days.findIndex(day => !sameMonth(day.date, month)) - 1, lastIdx)
        }
        else if (!a && b) {
            firstIdx = Math.max(days.findLastIndex(day => !sameMonth(day.date, month)) + 1, firstIdx)
        }
        else if (!a && !b) {
            firstIdx = -1
            lastIdx = -1
        }
     }

    if (firstIdx >= 0 && firstIdx < 7 && lastIdx >= 0 && lastIdx < 7 && firstIdx <= lastIdx) {
        return { firstIdx, lastIdx }
    }
    else {
        return { firstIdx: -1, lastIdx: -1 }
    }
}

/**
 * Get the today's date index from a list of days.
 * @param   days 
 * @returns The index of today's date in the list
 */
export function getTodayIdx<T extends { date: Date }>(days: T[]) {
    const today = new Date() 

    return days.findIndex(day => isSameDay(day.date, today))
}

/**
 * Get the last non-existant day index from a list of days.
 * @param   days 
 * @returns The index of the last non-existant day in the list
 */
export function getNullIdx<T extends { date: Date }>({ habit, days, order = "first" }: { habit: Habit, days: T[], order?: "first" | "last" }) {
    if (order === "first") {
        return days.findIndex(day => !dayExists(habit, day.date))
    }
    else {
        return days.findLastIndex(day => !dayExists(habit, day.date))
    }
}

export function getWeekDays(date: Date) {
    const { start } = getWeekPeriod(date)
    const days = Array.from({ length: 7 }, (_, i) => addToDate({ date: start, time: `${i}d` }))

    return days
}

export function isDowIdxRequired(frequency: number, idx: number) {
    const result = (frequency >> (6 - idx)) & 1
    return result
}

export function getWeekBitsStr(bitsStr: string) {
    const weeks = bitsStr.match(/.{1,7}/g) || []
    return weeks.join('_')
}

/* prints  */

export function printBits(bits: string) {
    let formatted = ''
    for (let i = 0; i < bits.length; i++) {
        if (i > 0 && i % 7 === 0) {
            formatted += '_'
        }
        formatted += bits[i]
    }
    console.log(formatted)
}

export function printYearData(yearHabits: Record<string, number>, year = new Date().getFullYear()) {
    const prevYear = year - 1
    const nextYear = year + 1
    let monthString = ''
    
    // Print previous December
    const prevDecBits = yearHabits[`${prevYear}-12`]
    for (let day = 0; day < 31; day++) {
        const habitCompleted = (prevDecBits & (1 << day)) !== 0
        monthString += habitCompleted ? '1' : '0'
    }
    console.log(`Dec ${prevYear}: ${monthString}`)

    // Print current year months
    const daysInMonth = [
        31, 28 + (isLeapYear(year) ? 1 : 0), 31, 30, 31, 30, 
        31, 31, 30, 31, 30, 31
    ]

    for (let month = 1; month <= 12; month++) {
        const monthKey = month.toString().padStart(2, '0')
        const bits = yearHabits[`${year}-${monthKey}`]
        monthString = ''

        for (let day = 0; day < daysInMonth[month - 1]; day++) {
            const habitCompleted = (bits & (1 << day)) !== 0
            monthString += habitCompleted ? '1' : '0'
        }

        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' })
        console.log(`${monthName} ${year}: ${monthString}`)
    }

    // Print next January
    monthString = ''
    const nextJanBits = yearHabits[`${nextYear}-01`]
    for (let day = 0; day < 31; day++) {
        const habitCompleted = (nextJanBits & (1 << day)) !== 0
        monthString += habitCompleted ? '1' : '0'
    }
    console.log(`Jan ${nextYear}: ${monthString}`)
}

export function printBitsByChunk(yearHabits: Record<string, number>) {
    const sortedChunks = Object.entries(yearHabits)
        .sort(([a], [b]) => a.localeCompare(b))

    for (const [chunkKey, bits] of sortedChunks) {
        printChunk(chunkKey, bits)
    }
}

export function printChunk(chunkKey: string, bits: number) {
    const bitsStr = bits.toString(2).padStart(31, '0') // Max 31 days in a month
    const [year, month] = chunkKey.split('-')
    const monthName = new Date(parseInt(year), parseInt(month) - 1)
        .toLocaleString('default', { month: 'short' })
    console.log(`\n${monthName} ${year}: ${bitsStr}`)
}