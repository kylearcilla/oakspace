import { habitTracker } from "./store";

import { addToDate, genMonthCalendar, getWeekPeriod } from "./utils-date";
import { TEST_HABITS, YEAR_HABITS_DATA } from "./mock-data";


export function initHabits() {
    const habits = initHabitData()
    const metrics = getMonthMetrics(habits)

    habitTracker.set({ habits, metrics })
}

/* chunks  */

function createChunks(date = new Date()): HabitMonthChunk {
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

function getBitAddress(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const dayOfMonth = date.getDate()
    const monthKey = month.toString().padStart(2, '0')
    const chunkKey = `${year}-${monthKey}` as HabitMonthKey
    
    const bitPosition = dayOfMonth - 1

    return { chunkKey, bitPosition }
}

export function generateHabitData(date = new Date()) {
    const yearData = createChunks(date)
    const today = new Date()
    const currentYear = today.getFullYear()
    const nextYear = currentYear + 1
    
    // Generate random data for each month
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

/**
 * Toggle a habit's year bit.
 * @param habit     - The habit to toggle
 * @param dayIdx    - The day index (0-6, where 0 is Sunday)
 * @param weeksAgoIdx - Number of weeks ago (0 = current week, 1 = last week, etc.)
 */
export function toggleHabitYearBit({ habit, dayIdx, weeksAgoIdx }: {
    habit: Habit
    dayIdx: number
    weeksAgoIdx: number
}) {
    const data = YEAR_HABITS_DATA.find(({ name }) => name === habit.name)!.data
    const { start } = getWeekPeriod(new Date(), weeksAgoIdx)
    const date = addToDate({ date: start, time: `${dayIdx}d` })
    const { chunkKey, bitPosition } = getBitAddress(date)
    
    if (!chunkKey) return

    data[chunkKey] ^= (1 << bitPosition)
}

/**
 * Extract a subset of bits between two dates (inclusive)
 * @param yearHabits - The habit data for the year
 * @param startDate  - The start date (1-based)
 * @param endDate    - The end date (1-based)
 * @returns A bigint representing the extracted bits
 */
export function getBitsFromYear(yearHabits: Record<string, number>, startDate: Date, endDate: Date) {
    let bitsStr = ''
    const currentDate = new Date(endDate)

    while (currentDate.getTime() >= startDate.getTime()) {
        const { chunkKey, bitPosition } = getBitAddress(currentDate)
        
        if (!chunkKey) {
            bitsStr += '0'
            currentDate.setDate(currentDate.getDate() - 1)
            continue
        }

        const data = yearHabits[chunkKey]
        const bit = (data >> bitPosition) & 1
        bitsStr += bit.toString()        
        currentDate.setDate(currentDate.getDate() - 1)
    }

    return bitsStr.split('').reverse().join('')
}

/* weekly stuff */

/**
 * Gets habit data for the past 6 weeks
 */
export function initHabitData() {
    TEST_HABITS.forEach((habit) => {
        const yearData = YEAR_HABITS_DATA.find((_habit) => _habit.name === habit.name)!
        const date = new Date()

        const { start } = getWeekPeriod(date, 5)
        const { end } = getWeekPeriod(date, 0)

        habit.data = getBitsFromYear(yearData.data, start, end)
    })

    return TEST_HABITS
}

/**
 * Get the start index of a week given a number of weeks ago.
 * @param weeksAgoIdx  - Number of weeks ago (0 = current week, 1 = last week, etc.)
 * @returns            - Start index of the week    
 */
export function getWeeksAgoStartIdx(weeksAgoIdx: number) {
    const { start: origin } = getWeekPeriod(new Date(), 5)
    const { start } = getWeekPeriod(new Date(), weeksAgoIdx)

    return Math.floor((start.getTime() - origin.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Given a habit and week ago idx, return the given week bits from its data property.
 * @param habit   - The habit object
 * @param weekId  - Number of weeks ago (0 = current week, 1 = last week, etc.)
 * @returns       - The week bits from the habit's data property
 */
export function getHabitWeekBits(habit: Habit, weeksAgoIdx: number): string {
    const data = habit.data
    const startIdx = (5 - weeksAgoIdx) * 7
    
    return data.slice(startIdx, startIdx + 7)
}

export function getWeekBitsStr(bitsStr: string) {
    const weeks = bitsStr.match(/.{1,7}/g) || []
    return weeks.join('_')
}

export function getHabitWeekProgress(habit: Habit, weeksAgoIdx: number) {
    const { frequency, freqType } = habit
    const bitsStr  = getHabitWeekBits(habit, weeksAgoIdx)
    let checked = 0, total = 0

    if (freqType === 'daily') {
        checked = countBitsStr(bitsStr)
        total = 7
    }
    else if (freqType === 'day-of-week') {
        for (let i = 0; i < 7; i++) {
            const required = isDowIdxRequired(frequency, i)
            const done = bitsStr[i] === '1'

            if (required && done) {
                checked++
            }
            if (required) {
                total++
            }
        }
    }
    else if (freqType === 'per-week') {
        checked = countBitsStr(bitsStr)
        total = Math.min(frequency, 7)
    }

    return { checked, total }
}

export function getDaysProgress(habits: any[], weeksAgoIdx: number) {
    const dayIdx = new Date().getDay()
    const lastIdx = weeksAgoIdx > 0 ? 6 : dayIdx
    const n = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
    
    for (const habit of habits) {
        const weekBits = getHabitWeekBits(habit, weeksAgoIdx)
        const requiredDays = getRequiredDays({ habit, weekBits, lastIdx })

        for (let i = 0; i <= lastIdx; i++) {
            const required = requiredDays[i] === 1
            const completed = weekBits[i] === '1'

            n[i][0] += completed && required ? 1 : 0
            n[i][1] += required ? 1 : 0
        }
    }

    return n.map((d) => {
        const result = Math.min(Math.floor((d[0] / d[1]) * 100), 100)
        return isNaN(result) ? -1 : result
    })
}

/* weekly metrics */

/**
 * Get the current habit streak for a habit.
 * Uses a weekly time frame to determine streak.
 * 
 * @param habit - The habit to get the streak for
 * @returns     - The current streak for the habit
 */
export function getHabitStreak(habit: Habit) {
    const { data, freqType, frequency, streak: activeStreak } = habit
    let streak = 0
    let broken = false
    
    // go week by week, from the current week
    for (let idx = 35; idx >= 0 && !broken; idx -= 7) {
        const currWeek = idx === 35
        const lastIdx = currWeek ? new Date().getDay() : 6
        const weekBits = data.slice(idx, idx + 7)
        const checkedDays = countBitsStr(weekBits)

        /* daily: ++ streak only if its unbroken from before today */
        if (freqType === "daily") {
            for (let i = lastIdx; i >= 0; i--) {
                const completed = weekBits[i] === '1'
                const today = i === lastIdx && currWeek
                
                // add today's if its complete
                if (completed) {
                    streak++
                }
                else if (!completed && !today) {
                    broken = true
                    break
                }
            }
        }

        /* day of week: ++ the streak only if this week is complete */
        if (freqType === "day-of-week") {
            let weekCount = 0

            for (let i = 0; i <= lastIdx; i++) {
                const required = isDowIdxRequired(frequency, i)
                const completed = weekBits[i] === '1'
                const today = i === lastIdx && currWeek
                
                if (completed && required) {
                    weekCount++
                }
                else if (required && !today) {
                    broken = true
                }
            }
            if (!broken) {
                streak += weekCount
            }
        }
        
        /* per week: ++ the streak only if this week is complete */
        if (freqType === "per-week") {
            // for current week, ther's still enough days to meet required days
            const required = frequency
            const todayChecked = currWeek && weekBits[lastIdx] === '1'
            const daysLeft = currWeek ? 7 - lastIdx - (todayChecked ? 1 : 0) : 0
    
            if (checkedDays + daysLeft >= required) {
                streak += Math.min(checkedDays, required)
            }
            else {
                broken = true
                break
            }
        }
    }
  
    return broken ? streak : streak + activeStreak
}

/* monthly metrics */

function isWeekInCurrentMonth(idx: number) {
    const today = new Date()
    const origin = getWeekPeriod(today, 5).start
    const currentMonth = today.getMonth()
    const startMonth = addToDate({ date: origin, time: `${idx}d` }).getMonth()
    const endMonth   = addToDate({ date: origin, time: `${idx + 6}d` }).getMonth()

    return !(startMonth !== currentMonth && endMonth !== currentMonth)
}

/**
 * Get the required days that still need to be checked. 
 * Includes the days that spill over from neighboring months.
 * 
 * @returns The required days that still need to be checked.
 */
function getWeekReqs({ habit, weekBits, wkIdx }: {
    habit: Habit
    weekBits: string
    wkIdx: number
}) {
    const lastIdx = getLastIdx(wkIdx)
    const overToday = 6 - lastIdx
    const checkedArr: number[] = new Array(7).fill(0)
    const allowArr = new Array(7).fill(-1)
    const inMonth = isWeekInCurrentMonth(wkIdx)
    const { freqType, frequency } = habit 

    if (!inMonth) {
        return null
    }

    let checkedCount = 0, extraDays = 0, reqStartIdx = 0, reqEndIdx = lastIdx, totalCheck = 0
    let monthSpillOver: "same" | "before" | "after" = "same"

    // count checked days if they are in the current month and <= today
    // track the spill over days
    for (let i = 0; i <= lastIdx; i++) {
        const position = idxMonthPosition(wkIdx + i)
        totalCheck += weekBits[i] === "1" ? 1 : 0
        
        if (position === "same") {
            checkedCount += weekBits[i] === "1" ? 1 : 0
            checkedArr[i] = weekBits[i] === "1" ? 1 : 0
            continue
        }
        extraDays++

        // week spills over to next month || prev month spills over to week
        if (monthSpillOver === "same") {
            monthSpillOver = position
        } 
        if (monthSpillOver === "before") {
            reqStartIdx++
            reqEndIdx = lastIdx
        }
        else if (monthSpillOver === "after") {
            reqStartIdx = 0
            reqEndIdx = i
        }
    }

    // fill the req array and due count
    const required = countRequired(habit) 
    const reqArr: number[] = new Array(7).fill(0)

    let reqLeft = required - overToday - totalCheck
    let reqLeftStartIdx = 0
    let reqLeftEndIdx = lastIdx
    let dueCount = 0
    
    if (monthSpillOver === "before") {
        reqLeftStartIdx = reqStartIdx
        reqLeftEndIdx = reqEndIdx
    }
    if (monthSpillOver === "after") {
        reqLeftStartIdx = 0
        reqLeftEndIdx = reqEndIdx
  
        reqLeft -= extraDays
    }
    reqLeft = Math.max(reqLeft, 0)    

    if (freqType === "day-of-week") {
        checkedCount = 0

        for (let i = 0; i <= lastIdx; i++) {
            const inBounds = i >= reqLeftStartIdx && i <= reqLeftEndIdx
            const checked = checkedArr[i] === 1
            const required = inBounds && isDowIdxRequired(frequency, i)

            if (checked && required) {
                checkedCount++
            }
            if (required && !checked) {
                reqArr[i] = 1
            }
            if (required) {
                dueCount++
            }
            if (!inBounds) {
                reqArr[i] = -1
            }
        }
        return { reqArr, checkedCount, dueCount }
    }

    // avoid checked and truncated days
    // 0 = not required, 1 = required, -1 = out of bounds
    for (let i = 0; i < 7; i++) {
        const inBounds = i >= reqLeftStartIdx && i <= reqLeftEndIdx
        const checked = checkedArr[i] === 1

        if (!inBounds) {
            allowArr[i] = -1
        }
        else if (!checked) {
            allowArr[i] = 1
        }
        else if (checked) {
            allowArr[i] = 0
        }
    }

    // counting backwards, avoiding the truncated days AND the checked days
    let reqRemaining = reqLeft
    for (let i = 6; i >= 0; i--) {
        const allow = allowArr[i]

        if (allow === 1 && reqRemaining > 0) {
            reqArr[i] = 1
            reqRemaining--
        }
        else if (allow < 0) {
            reqArr[i] = -1
        }
    }

    dueCount = findTotalReqsRequired({ 
        spillDays: extraDays, 
        reqs: required, 
        todayOver: overToday, 
        spillOver: monthSpillOver 
    })
    return {
        reqArr,
        checkedCount,
        dueCount
    }
}

/**
 * Get the required days that still need to be checked. 
 * Includes the days that spill over from neighboring months.
 * 
 * @returns The required days that still need to be checked.
 */
export function getFullWeekReqs({ habit, weekBits, wkIdx }: {
    habit: Habit
    weekBits: string
    wkIdx: number
}) {
    const { freqType, frequency } = habit
    const today = new Date()
    const dowIdx = today.getDay()
    const currWkStart = 35
    const currWeek = wkIdx === currWkStart
    const lastIdx = currWeek ? dowIdx : 6
    const overToday = 6 - lastIdx
    
    const checkedArray = new Array(7).fill(0)
    const reqArr = new Array(7).fill(0)
    let checkedCount = 0

    // Count checked days up to lastIdx
    for (let i = 0; i <= lastIdx; i++) {
        if (weekBits[i] === "1") {
            checkedCount++
            checkedArray[i] = 1
        }
    }

    if (freqType === "day-of-week") {
        for (let i = lastIdx; i >= 0; i--) {
            const required = (frequency >> (6 - i)) & 1
            const checked = weekBits[i] === "1"

            if (!checked && required) {
                reqArr[i] = 1
            }
        }
        return reqArr
    }

    // fill in required days from right to left
    let required = countRequired(habit)
    let reqLeft = Math.max(required - overToday - checkedCount, 0)
    let i = lastIdx

    while (reqLeft > 0 && i >= 0) {
        const checked = weekBits[i] === "1"
        if (!checked) {
            reqArr[i] = 1
            reqLeft--
        }
        i--
    }

    return reqArr
}

export function getMonthMetrics(habits: Habit[]) {
    const dowIdx = new Date().getDay()
    const today = new Date()
    const currWkStart = 35
    const origin = getWeekPeriod(today, 5).start
    const metrics = {
        habitsDone: 0,  habitsDue: 0,
        perfectDays: 0, missedDays: 0, missed: 0,
        activeStreak: {
            base: 120,
            streak: 0,
            start: new Date()
        }
    }

    let currentStreak = 0
    let streakBroken = false
    
    for (let idx = currWkStart; idx >= 0; idx -= 7) {
        const currWeek = idx === currWkStart
        const weekEnd = currWeek ? Math.min(idx + dowIdx + 1, idx + 7) : idx + 7
        const inMonth = isWeekInCurrentMonth(idx)
        const endIdx = currWeek ? dowIdx : 6

        // times a habit's box was not checked and is required to continue streak
        let requiredCounts = new Array(7).fill(0)  // this month
        let fullReqCounts = new Array(7).fill(0)   // past 6 weeks

        //  a day is missed when every habit on a day that had to be checked was not checked
        let missedTracker = new Array(7).fill(1) 
        
        for (const habit of habits) {
            const weekBits = habit.data.slice(idx, weekEnd)
            const weekData = getWeekReqs({ habit, weekBits, wkIdx: idx })

            // count the weekly data for this month
            if (weekData) {
                const { dueCount, checkedCount, reqArr } = weekData
                const checked = Math.min(checkedCount, dueCount)
                const counters = updateCounters({ 
                    reqArr, requiredCounts, missedTracker
                })
                requiredCounts = counters.requiredCounts
                missedTracker = counters.missedTracker

                metrics.habitsDone += checked
                metrics.habitsDue += dueCount
            }

            // count the streak for past 6 weeks
            if (!streakBroken) {
                const unuboundedReqArr = getFullWeekReqs({ habit, weekBits, wkIdx: idx })
                
                for (let i = endIdx; i >= 0; i--) {
                    // a required check was seen
                    if (unuboundedReqArr[i] != 0) {
                        fullReqCounts[i]++
                    }
                }
            }
        }

        // count active streak from today
        for (let i = endIdx; i >= 0 && !streakBroken; i--) {
            const isToday = currWeek && i === dowIdx

            if (fullReqCounts[i] === 0) {
                currentStreak++
            }
            else if (!isToday) {
                streakBroken = true
            }
        } 

        for (let i = 0; i <= endIdx && inMonth; i++) {
            const required = requiredCounts[i]
            const missed = missedTracker[i] === 1
            const isToday = currWeek && i === dowIdx

            if (required === 0) {
                metrics.perfectDays++
            }
            if (isToday) {
                continue
            }
            // total missed
            if (required > 0) {
                metrics.missed += required
            }
            // all habits that day that had to checked were not checked
            if (missed) {
                metrics.missedDays++
            }
        }
    }

    if (currentStreak > 0) {
        const startStreakIdx = 41 - currentStreak
        const base = metrics.activeStreak.base

        metrics.activeStreak.streak = streakBroken ? currentStreak : currentStreak + base
        metrics.activeStreak.start = addToDate({ date: origin, time: `${startStreakIdx}d` })
    }

    return metrics
}

function findTotalReqsRequired({ spillDays, reqs, todayOver, spillOver }: {
    spillOver: "before" | "after" | "same"
    spillDays: number
    reqs: number
    todayOver: number
}): number {

    if (spillOver === "before") {
        const length = 7 - todayOver
        const fromEnd = reqs - todayOver
        const overlap = findOverlap(spillDays, fromEnd, length)

        return reqs - overlap
    }
    else if (spillOver === "after") {
        return reqs - todayOver - spillDays
    }
    else {
        return Math.max(reqs - todayOver, 0)
    }
}

function findOverlap(fromStart: number, fromEnd: number, length: number): number {
    const n = new Array(length).fill(0)
    let count = 0
  
    for (let i = 0; i < fromStart; i++) {
        n[i] = 1
    }
    for (let i = length - fromEnd; i < length; i++) {
        count += n[i]
    }
    return count
}

function updateCounters({ reqArr, requiredCounts, missedTracker }: {
    reqArr: number[]
    requiredCounts: number[]
    missedTracker: number[]
}) {
    requiredCounts = requiredCounts.map((c, i) => {
        // marked as out of bounds
        if (c === -1) {
            return c
        }
        // a required check for this day
        else if (reqArr[i] === 1) {
            return c + 1
        }
        // mark spot as out of bounds
        else if (reqArr[i] === -1) {
            return -1
        }
        return c
    })
    missedTracker = missedTracker.map((m, i) => {
        if (m === -1) {
            return m
        }
        else if (reqArr[i] === 0) {
            return 0
        }
        else if (reqArr[i] === -1) {
            return -1
        }
        return m
    })

    return { requiredCounts, missedTracker }
}

/* yearly metrics */

export function getMonthHeatMap({ monthIdx, year }: { monthIdx: number, year: number }) {
    const date = new Date(year, monthIdx)
    const month = genMonthCalendar(date)
    const monthLength = month.days.length
    const data: HabitHeatMapDay[] = month.days.map(day => {
        const { date, isInCurrMonth } = day

        return {
            date,
            isInCurrMonth,
            due: 0,
            done: 0
        }
    })

    const firstDate = month.days[0].date
    const endDate = month.days[monthLength - 1].date

    YEAR_HABITS_DATA.forEach(habit => {
        const yearData = habit.data
        const habitData = TEST_HABITS.find(h => h.name === habit.name)!
        const bits = getBitsFromYear(yearData, firstDate, endDate)

        let wkIdx = 0
         
        for (let week = 0; week < 6; week++) {
            const n = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
            const weekStart = week * 7
            const weekEnd = Math.min(weekStart + 7, monthLength)
            const weekBits = bits.slice(weekStart, weekEnd)
            const requiredDays = getRequiredDays({ habit: habitData, weekBits  })

            for (let i = 0; i <= 6; i++) {
                const required = requiredDays[i] === 1
                const completed = weekBits[i] === '1'

                n[i][0] += completed ? 1 : 0
                n[i][1] += required ? 1 : 0
            }
            for (let i = 0; i <= 6; i++) {
                const idx = wkIdx * 7 + i
    
                data[idx].done += n[i][0]
                data[idx].due += n[i][1]
            }
            wkIdx++
        }
    })

    return data
}

/* utils */

function countBitsStr(bitsStr: string) {
    return bitsStr.split('').filter(bit => bit === '1').length
}

function countSetBits(n: number): number {
    let count = 0
    while (n) {
        n &= (n - 1)
        count++
    }
    return count
}

function compareDateMonth(date1: Date, date2: Date) {
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

function isLeapYear(year: number) {
    return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
}

function idxMonthPosition(idx: number) {
    const today = new Date()
    const origin = getWeekPeriod(today, 5).start
    const thisDate = addToDate({ date: origin, time: `${idx}d` })

    return compareDateMonth(thisDate, today)
}

function getLastIdx(wkIdx: number) {
    const today = new Date()
    const dowIdx = today.getDay()
    const currWkStart = 35
    const currWeek = wkIdx === currWkStart
    const lastIdx = currWeek ? dowIdx : 6

    return lastIdx
}

/* habit utils */

function countRequired(habit: Habit) {
    const { freqType, frequency } = habit
    return freqType === "daily" ? 7 : freqType === "day-of-week" ? countSetBits(frequency) : frequency
}

function getRequiredDays({ habit, weekBits, lastIdx = 6 }: {
    habit: Habit, weekBits: string, lastIdx?: number
}) {
    const { freqType, frequency } = habit
    const overToday = 6 - lastIdx
    const days = new Array(7).fill(0)
  
    if (freqType === "daily") {
        return new Array(7).fill(1, 0, lastIdx + 1)
    }
    else if (freqType === "day-of-week") {
        for (let i = 0; i <= lastIdx; i++) {
            days[i] = isDowIdxRequired(frequency, i) ? 1 : 0
        }
        return days
    }
    else {
        let required = Math.max(frequency - overToday, 0)

        for (let i = 0; i <= lastIdx; i++) {
            if (weekBits[i] === "1") {
                days[i] = 1
                required--
            }
        }
        for (let i = lastIdx; i >= 0 && required > 0; i--) {
            if (weekBits[i] === "0") {
                days[i] = 1
                required--
            }
        }
        return days
    }
}

/**
 * Toggle completion status for a specific day in a habit's week
 * @param habit       - The habit object
 * @param weeksAgoIdx - Number of weeks ago (0 = current week, 1 = last week, etc.)
 * @param dayIdx      - Day index within the week (0-6, where 0 is Sunday)
 */
export function toggleDayComplete({ habit, weeksAgoIdx, dayIdx }: {
    habit: Habit
    weeksAgoIdx: number
    dayIdx: number
}) {
    const startIdx = getWeeksAgoStartIdx(weeksAgoIdx)
    const bitPosition = startIdx + dayIdx
    const bits = habit.data.split('')

    bits[bitPosition] = bits[bitPosition] === '1' ? '0' : '1'
    habit.data = bits.join('')

    toggleHabitYearBit({ habit, dayIdx, weeksAgoIdx })

    return habit.data
}

function isDowIdxRequired(frequency: number, idx: number) {
    return frequency >> (6 - idx) & 1
}

/* ui utils */

export function isBoxRequired(habit: Habit, dayIdx: number) {
    const { freqType, frequency } = habit

    if (freqType === "day-of-week") {
        return Boolean((frequency >> (6 - dayIdx)) & 1)
    }
    else {
        return true
    }
}

export function isDayComplete({
    habit,
    weeksAgoIdx = 0,
    dayIdx = 0
}: {
    habit: Habit
    weeksAgoIdx?: number
    dayIdx?: number
}) {
    const weekBits = getHabitWeekBits(habit, weeksAgoIdx)
    return weekBits[dayIdx] === '1'
}

export function getFreqDaysStr(habit: Habit, literal = false) {
    const { freqType, frequency } = habit
    const days = "SMTWTFS"

    if (freqType === "daily") {
        return days
    }
    else if (freqType === "day-of-week" && literal) {
        return days
            .split("")
            .filter((_, index) => (frequency >> (6 - index)) & 1)
            .join("");
    }
    else if (freqType === "day-of-week") {
        const count = countSetBits(frequency)
        return days.slice(-count)
    }
    else {
        return days.slice(-frequency)
    }
}

/* store utils */

export function toggleCompleteHabit({ habit, dayIdx, weeksAgoIdx }: {
    habit: Habit
    dayIdx: number
    weeksAgoIdx: number
}) {

    habitTracker.update((state) => {
        const habits = state.habits
        const idx = habits.findIndex((_habit: any) => habit.name === _habit.name)!
        const targetHabit = habits[idx]

        targetHabit.data = toggleDayComplete({ habit, dayIdx, weeksAgoIdx })
        habits[idx] = targetHabit

        state.habits = habits
        state.metrics = getMonthMetrics(habits)

        return state
    })
}

/* prints */

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