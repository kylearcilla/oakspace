import { habitTracker } from "./store"

import { TEST_HABITS, YEAR_HABITS_DATA } from "./mock-data"
import { afterToday, genMonthCalendar, getDiffBetweenTwoDays, getYrIdxfromDate, isLeapYear, isSameDay, sameMonth, uptoToday } from "./utils-date"

import { toggleHabitYearBit, compareDateMonth, countBitsStr } from "./utils-habits-data"
import { getHabitBitData, getHabitBitsSlice, getBitFromDate, } from "./utils-habits-data"
import { isDowIdxRequired, initCalMonth, getWeekBounds, MAX_WEEKS_BACK_IDX } from "./utils-habits-data"
import { countRequired, countSetBits, dayExists, getHabitData, getFirstIdx, getLastIdx } from "./utils-habits-data"

export const YEAR_DATA_CACHE: Record<number, {
    yearHeatMap: HabitHeatMapData[]
    yearMetrics: HabitYearMetrics
}> = {}

export const HABIT_MONTH_CACHE: Record<string, HabitHeatMapDay[]> = {}
export const HABITS_MONTH_STATS_CACHE: Record<string, HabitMonthMetrics> = {}

export const HABIT_MONTH_HEATMAP_CACHE: Record<string, HabitHeatMapData[]> = {}
export const HABITS_MONTH_HEATMAP_CACHE: Record<string, HabitHeatMapData[]> = {}

/* inits + caches */

export async function initMonthData(year: number, monthIdx: number) {
    let yearData = YEAR_DATA_CACHE[year]

    if (!yearData) {
        yearData = await cacheYearData(year)
    }

    habitTracker.update(data => ({ 
        ...data,
        ...yearData,
        monthMetrics: HABITS_MONTH_STATS_CACHE[`${year}-${monthIdx}`]
    }))
}

/**
 * Process habit data for an entire year and cache it.
 * Includes metrics for both month and year and habit data for each month.
 */
async function cacheYearData(year: number) {
    await _processYearData(year)

    YEAR_DATA_CACHE[year] = {
        yearHeatMap: getYearHeatMap(year),
        yearMetrics: getYearMetrics(year)
    }

    return YEAR_DATA_CACHE[year]
}

function _processYearData(year: number) {
    return new Promise((resolve) => {
        processYearData(year)
        resolve(null)
    })
}

/**
 * Process each habit data for a given year.
 * 
 * 1. Habit's month data.
 * 2. Habit's year heat map data.
 * 3. Total habits year heat map data.
 * 4. Month metrics.
 */
function processYearData(year: number) {
    const habits = TEST_HABITS
    const now = new Date() 
    const toMonth = year === now.getFullYear() ? now.getMonth() : 11

    for (let i = 0; i <= toMonth; i++) {
        HABITS_MONTH_STATS_CACHE[`${year}-${i}`] = getMonthMetrics({ habits, monthIdx: i, year })
        const habitsMap = initializeHeatMap(year, i)

        for (const habit of habits) {
            const data = getHabitMonthData({ habit, monthIdx: i, year })
            const habitMap = initializeHeatMap(year, i, habit.id)

            HABIT_MONTH_CACHE[`${year}-${i}--${habit.id}`] = data

            for (const day of data) {
                const { date, done, due } = day
                const sameYear = date.getFullYear() === year
                const sameMonth = date.getMonth() === i
                const toToday = uptoToday(date)
            
                if (sameYear && sameMonth && toToday) {
                    const idx = date.getDate() - 1

                    // update all habits month heat map
                    habitsMap[idx].date = date
                    habitsMap[idx].done += done
                    habitsMap[idx].due += due

                    // update habit month heat map
                    habitMap[idx].date = date
                    habitMap[idx].done += done
                    habitMap[idx].due += due
                }
            }
        }
    }
}

function initializeHeatMap(year: number, month: number, habitId?: string) {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const key = habitId ? `${year}-${month}--${habitId}` : `${year}-${month}`

    const getArray = () => Array.from({ length: daysInMonth }, () => ({ date: new Date(), done: 0, due: 0 }))
    let data = []

    if (habitId) {
        data = HABIT_MONTH_HEATMAP_CACHE[key] ||= getArray()
    } 
    else {
        data = HABITS_MONTH_HEATMAP_CACHE[key] ||= getArray()
    }
    return data
}

function getYearMetrics(year: number) {
    const now = new Date()
    const toMonth = year === now.getFullYear() ? now.getMonth() : 11
    const metrics = {
        habitsDone: 0,
        habitsDue: 0,
        perfectDays: 0, 
        missedDays: 0,
        missed: 0
    }

    for (let i = 0; i <= toMonth; i++) {
        const monthData = HABITS_MONTH_STATS_CACHE[`${year}-${i}`]

        metrics.habitsDone += monthData.habitsDone
        metrics.habitsDue += monthData.habitsDue
        metrics.perfectDays += monthData.perfectDays
        metrics.missedDays += monthData.missedDays
        metrics.missed += monthData.missed
    }
    return metrics
}

function getYearHeatMap(year: number) {
    const now = new Date()
    const toMonth = year === now.getFullYear() ? now.getMonth() : 11
    const length = isLeapYear(year) ? 366 : 365
    const map = Array.from({ length }, () => ({ date: null, done: 0, due: 0 })) as HabitHeatMapData[]
    let idx = 0

    for (let i = 0; i <= toMonth; i++) {
        const data = HABITS_MONTH_HEATMAP_CACHE[`${year}-${i}`]
        for (let day = 0; day < data.length; day++) {
            map[idx++] = data[day]
        }
    }

    return map
}

/* habit data  */

/**
 * Get the habit's weekly data for a given week (checked, required, etc...).
 * Using the # of weeks from current week.
 */
export function getHabitWeekData({ habit, weeksAgoIdx, dayIdx }: { 
    habit: Habit, weeksAgoIdx: number, dayIdx: number 
}) {
    const start = getWeekBounds().start
    const weekIdx = MAX_WEEKS_BACK_IDX - weeksAgoIdx


    const date = new Date(start)
    date.setDate(date.getDate() + weekIdx * 7 + dayIdx)

    const required = dayExists(habit, date) && isDayRequired({ habit, dayIdx })
    const complete = isDayComplete({ habit, date })

    return { complete, required, date }
}

/**
 * Get a single habit's month data (checked, required, etc...).
 */
export function getHabitMonthData({ habit, monthIdx, year }: { habit: Habit, monthIdx: number, year: number }) {
    const { data, firstDate, endDate, length } = initCalMonth({ monthIdx, year })

    getHabitData({ 
        habit, 
        firstDate, 
        endDate, 
        length, 
        data 
    })

    return data
}

/**
 * Combine all habit data for a given month.
 */
export function getHabitsMonthData({ monthIdx, year }: { monthIdx: number, year: number }) {
    const { data, firstDate, endDate, length } = initCalMonth({ monthIdx, year })

    YEAR_HABITS_DATA.forEach(h => {
        getHabitData({ 
            habit: TEST_HABITS.find(_h => _h.name === h.name)!, 
            firstDate, endDate, 
            length, 
            data
        })
    })
    return data
}

/**
 * Calculate a month's metrics for all habits.
 */
export function getMonthMetrics({ habits, monthIdx, year }: {
    habits: Habit[]
    monthIdx: number
    year: number
}) {
    const date = new Date(year, monthIdx)
    const days = genMonthCalendar(date).days
    const today = new Date()
    const idxStart = 35

    const metrics = {
        habitsDone: 0,  habitsDue: 0,
        perfectDays: 0, missedDays: 0, missed: 0,
        longestStreak: {
            count: 0,
            start: new Date()
        }
    }

    let longestStreak = 0
    let longestStreakStart = new Date()
    let curStreak = 0
    
    for (let idx = idxStart; idx >= 0; idx -= 7) {
        const start = days[idx].date
        const end = days[idx + 6].date
        const weekDays = days.slice(idx, idx + 7)

        const isToday = (i: number) => isSameDay(days[idx + i].date, today)
        
        let requiredCounts = new Array(7).fill(0)
        let missedTracker = new Array(7).fill(1) 
        
        if (afterToday(start) || !sameMonth(start, date)) {
            continue
        }
        for (const habit of habits) {
            const data = getHabitBitData(habit)
            const weekBits = getHabitBitsSlice(data, start, end)
            const weekData = getBoundWeekReqs({ 
                habit,
                weekBits,  
                weekDays,
                monthDate: date
            })
            
            // count the weekly data for this month
            if (weekData) {
                const { dueCount, checkedCount, reqArr } = weekData
                const checked = Math.min(checkedCount, dueCount)
                const counters = updateCounters({ reqArr, requiredCounts, missedTracker })
                
                requiredCounts = counters.requiredCounts
                missedTracker = counters.missedTracker

                metrics.habitsDone += checked
                metrics.habitsDue += dueCount
            }
        }

        // count longest streak
        for (let i = 6; i >= 0; i--) {
            const t = isToday(i)

            if (requiredCounts[i] === 0) {
                longestStreak = Math.max(longestStreak, ++curStreak)
                longestStreakStart = days[idx + i].date
            }
            else if (!t) {
                curStreak = 0
            }
        } 
        // missed & perfect days
        for (let i = 0; i <= 6; i++) {
            const required = requiredCounts[i]
            const missed = missedTracker[i] === 1

            if (required === 0) {
                metrics.perfectDays++
            }
            // count today if checked, don't if not yet
            if (isToday(i)) {
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

    metrics.longestStreak.count = longestStreak
    metrics.longestStreak.start = longestStreakStart

    if (metrics.habitsDue === 0) {
        metrics.longestStreak.count = 0
        metrics.longestStreak.start = new Date()

        metrics.habitsDone = 0
        metrics.habitsDue = 0
        metrics.perfectDays = 0
        metrics.missedDays = 0
        metrics.missed = 0
    }

    return metrics
}

/* habit queries */

/**
 * Get the active habit streak for a habit.
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

export function getActiveStreak() {
    const today = new Date()
    let base = 120
    let count = 0
    let streakStart = new Date()
    let currentStreak = 0
    let streakBroken = false

    const { start } = getWeekBounds()
    
    for (let idx = MAX_WEEKS_BACK_IDX; idx >= 0; idx--) {
        const startDate = new Date(start)
        startDate.setDate(startDate.getDate() + idx * 7)

        const weekDays = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)
            weekDays.push({ date, isInCurrMonth: true })
        }

        const endDate = weekDays[6].date
        let requiredCounts = new Array(7).fill(0)
        
        for (const habit of TEST_HABITS) {
            if (streakBroken) continue
            
            const firstIdx = getFirstIdx({ habit, days: weekDays })
            const lastIdx = getLastIdx({ habit, days: weekDays })
            
            const data = getHabitBitData(habit)
            const weekBits = getHabitBitsSlice(data, startDate, endDate)
            const reqArr = getWeekReqs({ habit, weekBits, lastIdx })

            for (let i = firstIdx; i <= lastIdx; i++) {
                requiredCounts[i] += reqArr[i]
            }
        }

        // count active streak from today
        for (let i = 6; i >= 0 && !streakBroken; i--) {
            const isToday = isSameDay(weekDays[i].date, today)

            if (requiredCounts[i] === 0) {
                currentStreak++
                streakStart = weekDays[i].date
            }
            else if (!isToday) {
                streakBroken = true
            }
        } 
    }


    count = streakBroken ? currentStreak : currentStreak + base

    return { count, start: streakStart, base }
}

/**
 * Given a week's bits, get the required array.
 * Avoid spill over months, only include days of the given month.
 * 
 * @returns The required days that still need to be checked.
 */
function getBoundWeekReqs({ habit, weekBits, monthDate, weekDays }: {
    habit: Habit
    weekBits: string
    monthDate: Date
    weekDays: { date: Date, isInCurrMonth: boolean }[]
}) {

    // no possible in bounds exists here
    if (afterToday(weekDays[0].date)) {
        return null
    }
    
    const firstIdx = getFirstIdx({ habit, days: weekDays })
    const lastIdx = getLastIdx({ habit, days: weekDays })

    const overToday = 6 - lastIdx
    const checkedArr: number[] = new Array(7).fill(0)
    const allowArr = new Array(7).fill(-1)
    const { freqType, frequency } = habit 

    let checkedCount = 0, extraDays = 0, reqStartIdx = 0, totalCheck = 0
    let monthSpillOver: "same" | "before" | "after" = "same"

    const idxMonthPosition = (dayIdx: number) => {
        const day = weekDays[dayIdx]
        const position = compareDateMonth(day.date, monthDate)

        return position
    }
    const inMonth = (dayIdx: number) => {
        const day = weekDays[dayIdx]
        return sameMonth(day.date, monthDate) && uptoToday(day.date)
    }


    // count checked days if they are in the current month and <= today
    // track the spill over days
    for (let i = firstIdx; i <= lastIdx; i++) {
        const position = idxMonthPosition(i)
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
        }
        else if (monthSpillOver === "after") {
            reqStartIdx = 0
        }
    }

    // fill the req array and due count
    const required = countRequired(habit) 
    const reqArr: number[] = new Array(7).fill(0)
 
    let reqLeft = required - overToday - totalCheck
    let dueCount = 0
    
    if (monthSpillOver === "after") {
        reqLeft -= extraDays
    }
    reqLeft = Math.max(reqLeft, 0)    

    if (freqType === "day-of-week") {
        checkedCount = 0

        for (let i = firstIdx; i <= lastIdx; i++) {
            const inBounds = inMonth(i)
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
    for (let i = firstIdx; i <= lastIdx; i++) {
        const inBounds = inMonth(i)
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
    for (let i = 6; i >= firstIdx; i--) {
        const allow = allowArr[i]

        if (allow === 1 && reqRemaining > 0) {
            reqArr[i] = 1
            reqRemaining--
        }
        else if (allow < 0) {
            reqArr[i] = -1
        }
    }

    // calculate the due count
    if (monthSpillOver === "before") {
        const length = 7 - overToday
        const fromEnd = required - overToday
        const overlap = findOverlap(extraDays, fromEnd, length)

        dueCount = required - overlap
    }
    else if (monthSpillOver === "after") {
        dueCount = required - overToday - extraDays
    }
    else {
        dueCount = Math.max(required - overToday, 0)
    }

    return {
        reqArr,
        checkedCount,
        dueCount
    }
}

/**
 * Given a week's bits, get the required array.
 * Week bits comes from the past 6 weeeks.
 * Includes spill over months, days outside of the given month.
 * 
 * @returns The required days that still need to be checked.
 */
function getWeekReqs({ habit, weekBits, lastIdx }: {
    habit: Habit
    weekBits: string
    lastIdx: number
}) {
    const { freqType, frequency } = habit
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

/* display clients */

export function getHabitTableData({ habit, timeFrame, currWeekIdx, currMonth, dayProgress, rowProgress }: {
    habit: Habit
    timeFrame: "weekly" | "monthly"
    currWeekIdx: number
    currMonth: Date
    dayProgress: number[][]
    rowProgress: Map<string, { complete: number, total: number }>

}): HabitDayData[] {
    const data = []
    const weeksAgoIdx = currWeekIdx
    const monthIdx = currMonth.getMonth()
    const year = currMonth.getFullYear()
    const id = habit.id

    if (timeFrame === "weekly") {
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const { date, required, complete } = getHabitWeekData({ habit, dayIdx, weeksAgoIdx })
            data.push({ required, complete, date })

            tallyHabitProgress({ 
                id, 
                dayIdx, 
                date: new Date(),
                required: required ? 1 : 0, 
                complete: complete ? 1 : 0,
                timeFrame,
                rowProgress,
                dayProgress,
            })
        }
    }
    else {
        const cacheData = HABIT_MONTH_CACHE[`${year}-${monthIdx}--${habit.id}`]
        const monthData = cacheData || getHabitMonthData({ habit, monthIdx, year })

        for (let i = 0; i < monthData.length; i++) {
            const { date, due } = monthData[i]
            const { isInCurrMonth: currMonth, done, ...rest } = monthData[i]
            const toToday = date <= new Date()
            const required = due === 1
            const dayIdx = date.getDate() - 1

            if (currMonth && toToday) {
                const complete = done === 1

                data.push({ ...rest, required, complete })

                tallyHabitProgress({ 
                    id, 
                    date,
                    dayIdx,
                    required: due, 
                    complete: complete ? 1 : 0,
                    timeFrame,
                    rowProgress,
                    dayProgress
                })
            }
            else if (currMonth) {
                data.push({ ...rest, required, complete: false })
            }
        }
    }
    return data
}

export function tallyHabitProgress({ id, dayIdx, date, required, complete, timeFrame, rowProgress, dayProgress }: {
    id: string
    dayIdx: number
    date: Date
    required: number
    complete: number
    timeFrame: "weekly" | "monthly"
    rowProgress: Map<string, { complete: number, total: number }>
    dayProgress: number[][]
}) {
    const due = required === 1

    // day column progress
    if (!dayProgress[dayIdx]) {
        dayProgress[dayIdx] = [0, 0]
    }
    if (timeFrame === "monthly" && due) {
        const satIdx = getSatIdx(dayIdx + 1, date)

        dayProgress[satIdx] = [
            dayProgress[satIdx][0] + required,
            dayProgress[satIdx][1] + complete
        ]
    }
    else if (due) {
        dayProgress[dayIdx] = [
            dayProgress[dayIdx][0] + required,
            dayProgress[dayIdx][1] + complete
        ]
    }

    // habit progress
    if (rowProgress.has(id) && due) {
        const { complete: c, total } = rowProgress.get(id)!

        rowProgress.set(id, {
            complete: c + complete, total: total + 1
        })
    } 
    else if (due) {
        rowProgress.set(id, { complete, total: 1 })
    }
}

function getSatIdx(day: number, date: Date): number {
    const adjustedDate = new Date(date) 
    adjustedDate.setDate(day) 
    const dayIdx = adjustedDate.getDay() 
    const daysUntilSaturday = (6 - dayIdx + 7) % 7 
    adjustedDate.setDate(adjustedDate.getDate() + daysUntilSaturday) 
    
    return adjustedDate.getDate() - 1
}

/* updates  */

export function toggleCompleteHabit({ habit, date, currMonth }: { 
    habit: Habit, date: Date, currMonth: Date 
}) {
    const year = currMonth.getFullYear()
    const monthIdx = currMonth.getMonth()

    habitTracker.update((state) => {
        const { habits, yearHeatMap } = state
        const idx = habits.findIndex((_habit: any) => habit.name === _habit.name)!
        const targetHabit = habits[idx]
        const { data, checked } = toggleDayComplete({ habit, date })
        const heatmap = yearHeatMap!

        targetHabit.data = data
        habits[idx] = targetHabit

        state.habits = habits
        state.activeStreak = getActiveStreak()

        state.monthMetrics = getMonthMetrics({
            habits, 
            monthIdx: currMonth.getMonth(),
            year: currMonth.getFullYear()
        })

        // update caches
        state.yearHeatMap = updateHeatMapsFromCheck({ habit, date, checked, heatmap })
        state.yearMetrics = getYearMetrics(year)

        HABIT_MONTH_CACHE[`${year}-${monthIdx}--${habit.id}`] = getHabitMonthData({ habit, monthIdx, year })
        HABITS_MONTH_STATS_CACHE[`${year}-${monthIdx}`] = state.monthMetrics!
        YEAR_DATA_CACHE[year] = {
            yearHeatMap: state.yearHeatMap,
            yearMetrics: state.yearMetrics!
        }

        return state
    })
}

export function updateHeatMapsFromCheck({ habit, date, checked, heatmap }: { 
    habit: Habit, date: Date, checked: boolean, heatmap: HabitHeatMapData[]
}) {
    const habitCache = HABIT_MONTH_HEATMAP_CACHE
    const habitsCache = HABITS_MONTH_HEATMAP_CACHE

    const year = date.getFullYear()
    const month = date.getMonth()

    const habitsData = habitsCache[`${year}-${month}`]
    const habitData = habitCache[`${year}-${month}--${habit.id}`]

    habitData[date.getDate() - 1].done += checked ? 1 : -1
    habitsData[date.getDate() - 1].done += checked ? 1 : -1

    const idx = getYrIdxfromDate(date) - 1
    heatmap[idx].done += checked ? 1 : -1

    return heatmap
}

export function updateMonthMetrics(date: Date) {
    habitTracker.update((state) => {
        state.monthMetrics = getMonthMetrics({
            habits:   state.habits,
            monthIdx: date.getMonth(),
            year:     date.getFullYear()
        })
        return state
    })
}

export function toggleDayComplete({ habit, date }: { habit: Habit, date: Date}) {
    const start = getWeekBounds().start
    date.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)

    const diff = getDiffBetweenTwoDays(date, start) + 1
    const bits = habit.data.split('')
    
    bits[diff - 1] = bits[diff - 1] === '1' ? '0' : '1'
    habit.data = bits.join('')
    
    toggleHabitYearBit({ habit, date })

    return { data: habit.data, checked: bits[diff - 1] === '1' }
}

/* ui utils */

export function isDayRequired({ habit, dayIdx }: { habit: Habit, dayIdx: number }) {
    const { freqType, frequency } = habit

    if (freqType === "day-of-week") {
        return Boolean((frequency >> (6 - dayIdx)) & 1)
    }
    else {
        return true
    }
}

export function isDayComplete({ habit, date }: { habit: Habit, date: Date }) {
    const yearData = YEAR_HABITS_DATA.find((_habit) => _habit.name === habit.name)!
    const bit = getBitFromDate(yearData.data, date)
    return bit === '1'
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

/* reorder */

export function reorderInDefaultView({
    srcHabit, targetHabit, habits
}: {
    srcHabit: any
    targetHabit: any
    habits: any[]
}) {
    const srcOrder    = srcHabit.order.default
    const lastOrder   = Math.max(...habits.map((habit: any) => habit.order.default)) + 1
    const toIdx       = targetHabit === "all-day" ? lastOrder : targetHabit.order.default
    const direction   = srcOrder < toIdx ? "up" : "down"
    const targetOrder = toIdx + (direction === "up" ? -1 : 0)

    habits.forEach((habit: any) => {
        if (direction === "up" && habit.order.default > srcOrder && habit.order.default <= targetOrder) {
            habit.order.default--
        } 
        else if (direction === "down" && habit.order.default >= targetOrder && habit.order.default < srcOrder) {
            habit.order.default++
        }
    })

    srcHabit.order.default = targetOrder
}

export function reorderInTimeOfDayView({
    srcHabit, targetHabit, habits, secMap
}: {
    srcHabit: any
    targetHabit: any
    habits: any[]
    secMap: Record<string, number>
}) {
    const toLast  = typeof targetHabit === "string"

    const srcTod = srcHabit.timeOfDay
    const targetTod  = toLast ? targetHabit : targetHabit.timeOfDay

    const srcSecIdx = secMap[srcTod]
    const toSecIdx = secMap[targetTod]
    const sameSec = srcSecIdx === toSecIdx

    const srcOrder = srcHabit.order.tod
    const lastOrder = habits.filter((habit: any) => habit.timeOfDay === targetTod).length 

    const toIdx       = toLast ? lastOrder : targetHabit.order.tod
    const betweenSec  = srcTod != targetTod
    const direction   = (betweenSec ? srcSecIdx < toSecIdx : srcOrder < toIdx) ? "up" : "down"

    const targetOrder = Math.max(toIdx + (direction === "up" && sameSec ? -1 : 0), 0)

    habits
        .filter((habit: any) => habit.timeOfDay === srcTod)
        .forEach((habit: any) => {
            if (direction === "up" && habit.order.tod > srcOrder) {
                habit.order.tod--
            } 
            else if (!sameSec && direction === "down" && habit.order.tod > srcOrder) {
                habit.order.tod--
            }
            else if (sameSec && direction === "down" && habit.order.tod < srcOrder) {
                habit.order.tod++
            }
        })
    habits
        .filter((habit: any) => habit.timeOfDay === targetTod)
        .forEach((habit: any) => {
            if (direction === "up" && habit.order.tod >= targetOrder) {
                habit.order.tod++
            } 
            else if (!sameSec && direction === "down" && habit.order.tod >= targetOrder) {
                habit.order.tod++
            }
            else if (sameSec && direction === "down" && habit.order.tod <= targetOrder) {
                habit.order.tod--
            }
        })

    srcHabit.order.tod = targetOrder
    srcHabit.timeOfDay = targetTod 

    return habits
}

/* utils */

/**
 * Hanldler for updating counter data for habits.
 */
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