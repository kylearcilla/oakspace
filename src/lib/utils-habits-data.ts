import { habitTracker } from "./store";
import { TEST_HABITS, YEAR_HABITS_DATA } from "./mock-data";
import { getActiveStreak, getMonthMetrics } from "./utils-habits";
import { genMonthCalendar, getWeekPeriod, isLeapYear, isSameDay } from "./utils-date"

export const MAX_WEEKS_BACK = 6
export const MAX_WEEKS_BACK_IDX = MAX_WEEKS_BACK - 1


export function initHabits() {
    const habits = initHabitData()
    const monthMetrics = getMonthMetrics({
        habits, 
        monthIdx: new Date().getMonth(),
        year: new Date().getFullYear()
    })
    const activeStreak = getActiveStreak(habits)

    habitTracker.set({ habits, monthMetrics, activeStreak })
}

export function initHabitData() {
    TEST_HABITS.forEach((habit) => {
        const yearData = YEAR_HABITS_DATA.find((_habit) => _habit.name === habit.name)!
        const { start, end } = getWeekBounds()

        habit.data = getHabitBitsSlice(yearData.data, start, end)
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

    data[chunkKey] ^= (1 << bitPosition)
}

/**
 * Extract a subset of bits between two dates (inclusive)
 * 
 * @param yearHabits - The habit data for the year
 * @param startDate  - The start date (1-based)
 * @param endDate    - The end date (1-based)
 * @returns A bigint representing the extracted bits
 */
export function getHabitBitsSlice(yearHabits: Record<string, number>, startDate: Date, endDate: Date) {
    let bitsStr = ''
    const currentDate = new Date(endDate)

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
    return !!getBitFromDate(getHabitBitData(habit), date)
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
    const yearData = YEAR_HABITS_DATA.find(h => h.name === habit.name)!.data
    const habitData = TEST_HABITS.find(h => h.name === habit.name)!
    const bits = getHabitBitsSlice(yearData, firstDate, endDate)

    let wkIdx = 0

    const getDateFromIdx = (dayIdx: number) => {
        const date = new Date(firstDate)
        date.setDate(date.getDate() + dayIdx)
        return date
    }
    const beyondBounds = (dayIdx: number) => {
        return isDayBeyondBounds(getDateFromIdx(dayIdx))
    } 
    const dayExists = (dayIdx: number) => {
        return getBitFromDate(yearData, getDateFromIdx(dayIdx))
    }
    for (let week = 0; week < 6; week++) {
        const n = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
        const weekDays = data.slice(week * 7, week * 7 + 7)
        const firstIdx = getFirstIdx({ habit, days: weekDays })
        const lastIdx = getLastIdx({ habit, days: weekDays })

        const weekStart = week * 7
        const weekEnd = Math.min(weekStart + 7, length)
        const weekBits = bits.slice(weekStart, weekEnd)
        const requiredDays = getWeekRequiredDays({ 
            habit: habitData, weekBits, lastIdx, firstIdx 
        })

        for (let i = firstIdx; i <= lastIdx; i++) {
            const required = requiredDays[i] === 1
            const completed = weekBits[i] === '1'

            n[i][0] += completed ? 1 : 0
            n[i][1] += required ? 1 : 0
        }
        for (let i = 0; i <= 6; i++) {
            const idx = wkIdx * 7 + i
            const offBounds = i < firstIdx || i > lastIdx

            if (!offBounds) {
                data[idx].done += n[i][0]
                data[idx].due += n[i][1]
            }

            if (!dayExists(idx)) {
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
 * Given a habit and week ago idx, return the given week bits
 * 
 * @param habit   - The habit 
 * @param weekId  - Number of weeks ago (0 = current week, 1 = last week, etc.)
 * @returns       - The week bits from the habit's data property
 */
export function getHabitWeekBits(habit: Habit, weeksAgoIdx: number): string {
    const data = habit.data
    const startIdx = (MAX_WEEKS_BACK_IDX - weeksAgoIdx) * 7
    
    return data.slice(startIdx, startIdx + 7)
}

/**
 * Get the start and end of 6 week period where habits can be toggled from now.
 */
export function getWeekBounds() {
    const date = new Date() 
    const { start } = getWeekPeriod(date, MAX_WEEKS_BACK_IDX)
    const { end } = getWeekPeriod(date, 0)

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
 * @param habit   - The habit object
 * @param weekBits - The week bits from the habit's data property
 * @param lastIdx  - The index of the last day in the week (default: 6)
 * @returns       - The required days for the habit
 */
export function getWeekRequiredDays({ habit, weekBits, lastIdx = 6, firstIdx = 0 }: {
    habit: Habit, weekBits: string, lastIdx?: number, firstIdx?: number
}) {
    const { freqType, frequency } = habit
    const overToday = 6 - lastIdx
    const days = new Array(7).fill(0)
  
    if (freqType === "daily") {
        return new Array(7).fill(1, 0, lastIdx + 1)
    }
    else if (freqType === "day-of-week") {
        for (let i = firstIdx; i <= lastIdx; i++) {
            days[i] = isDowIdxRequired(frequency, i) ? 1 : 0
        }
        return days
    }
    else {
        let freqCount = Math.max(countRequired(habit), 0) - overToday

        for (let i = firstIdx; i <= lastIdx && freqCount > 0; i++) {
            if (weekBits[i] === "1") {
                days[i] = 1
                freqCount--
            }
        }
        for (let i = lastIdx; i >= firstIdx && freqCount > 0; i--) {
            if (weekBits[i] === "0") {
                days[i] = 1
                freqCount--
            }
        }
        return days
    }
}

/* month utils */

export function initCalMonth({ monthIdx, year, strict = false }: { monthIdx: number, year: number, strict?: boolean }) {
    const date = new Date(year, monthIdx)
    const month = genMonthCalendar(date)
    const length = month.days.length
    const data: HabitHeatMapDay[] = month.days.map(day => {
        const { date, isInCurrMonth } = day

        return {
            date,
            isInCurrMonth,
            due: 0,
            done: 0
        }
    })

    let firstDate = month.days[0].date
    let endDate = month.days[length - 1].date

    if (strict) {
        firstDate = new Date(year, monthIdx, 1)
        endDate = new Date(year, monthIdx + 1, 0)
    }

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

export function getFirstIdx<T extends { date: Date }>({ habit, days }: { habit: Habit, days: T[] }) {
    const firstIdx = getNullIdx({ habit, days, order: "last" })

    return firstIdx === -1 ? 0 : firstIdx + 1
}

export function getLastIdx<T extends { date: Date }>({ habit, days }: { habit: Habit, days: T[] }) {
    let todayIdx = getTodayIdx(days)
    let nullIdx = getNullIdx({ habit, days })

    todayIdx = todayIdx === -1 ? 6 : todayIdx
    nullIdx = nullIdx === -1 ? 6 : nullIdx - 1

    return Math.min(todayIdx, nullIdx)
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


export function isDowIdxRequired(frequency: number, idx: number) {
    return frequency >> (6 - idx) & 1
}

export function getWeekBitsStr(bitsStr: string) {
    const weeks = bitsStr.match(/.{1,7}/g) || []
    return weeks.join('_')
}

/**
 * Get a date's order relation to another date.
 * @param date1 
 * @param date2 
 * @returns 
 */
export function compareDateMonth(date1: Date, date2: Date) {
    const year1 = date1.getFullYear()
    const year2 = date2.getFullYear()
    const month1 = date1.getMonth()
    const month2 = date2.getMonth()

    if (year1 < year2 || (year1 === year2 && month1 < month2)) {
        return "before"
    }
    else if (year1 === year2 && month1 === month2) {
        return "same"
    }
    else {
        return "after"
    }
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