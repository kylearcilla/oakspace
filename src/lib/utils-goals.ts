import { genMonthCalendar, getTimeDistanceStr, isSameDay, months, uptoToday } from "./utils-date"
import { formatDatetoStr } from "./utils-date"

import { GOALS, YEARS, MONTH_ENTIRES } from "./mock-data-goals"
import { findTag, insertItemArr, reorderItemArr } from "./utils-general"
import { goalTracker } from "./store"

export let initPromise: Promise<void>

type PeriodType = "year" | "quarter" | "month"

const PERIOD_TYPES: PeriodType[] = ["year", "quarter", "month"]
export const STATUSES    = ["not-started", "in-progress", "accomplished"]
export const PERIODS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "q1", "q2", "q3", "q4", "all"]

type PeriodData = {
    entry: TextEntryOptions | null
    pinnedGoal?: Goal | null
    goals: Goal[]
}

const ALL_GOALS: Record<string, Goal> = {}

const YEAR_DATA: Record<string, {
    entry: TextEntryOptions
    smallImg: string
    goals: Goal[]
    bannerImg: {
        src: string,
        center: number
    } | null
}> = {}

const MONTH_DATA: Record<string, {
    entry: TextEntryOptions | null
    pinnedId: string | null
    pinnedGoal: Goal | null
    goals: Goal[]
}> = {}

const QUARTER_DATA: Record<string, {
    entry: TextEntryOptions | null
    goals: Goal[]
}> = {}

const COMPLETED_GOALS: Record<string, Goal[]> = {}

const PINNED_GOALS: Goal[] = []
const toUpdate = []

export async function initGoals() {
    await _initGoals()

    goalTracker.set({
        init: true, goals: GOALS, viewGoal: null, ...getGoalsData()
    })
}

/**
 * Called when there's been an update in the caches.
 * @param goal - the goal caused the update
 */
export function handleStoreUpdate(goal: Goal) {
    goalTracker.update((store) => ({ ...store, ...getGoalsData() }))
}

export function getGoalsData() {
    const now = new Date()
    const monthIdx = now.getMonth()
    const quarter = Math.ceil((monthIdx + 1) / 3)
    const year = now.getFullYear()

    return {
        yearData: {
            year,
            data: getYearData({ year })
        },
        quarterData: {
            quarter,
            data: getQuarterData({ year, quarter })
        },
        monthData: {
            month: monthIdx + 1,
            data: getMonthData({ year, moIdx: monthIdx })
        }
    }
}

async function _initGoals() {
    return new Promise<void>((resolve) => {
        initData()
        resolve()
    })
}

function initData() {
    // Initialize year data structures first
    for (const [yearStr, yearEntry] of Object.entries(YEARS)) {
        YEAR_DATA[yearStr] = {
            entry: yearEntry.entry,
            smallImg: yearEntry.smallImg,
            bannerImg: yearEntry.bannerImg,
            goals: []
        }
    }
    
    // Initialize month data structures
    for (const [monthKey, monthEntry] of Object.entries(MONTH_ENTIRES)) {
        MONTH_DATA[monthKey] = {
            entry: monthEntry.entry,
            pinnedId: monthEntry.pinnedId,
            pinnedGoal: null,
            goals: []
        }
        
        // Initialize quarter data structures
        const [yearStr, monthStr] = monthKey.split('-')
        const month = parseInt(monthStr)
        const quarter = Math.ceil(month / 3)
        const quarterKey = `${yearStr}-Q${quarter}`
        
        if (!QUARTER_DATA[quarterKey]) {
            QUARTER_DATA[quarterKey] = {
                entry: null,
                goals: []
            }
        }
    }


    for (const goal of GOALS) {
        if (goal?.pinIdx != undefined && goal.pinIdx >= 0) {
            PINNED_GOALS.push(goal)
        }

        ALL_GOALS[goal.id] = goal
        
        // Track completed goals by date
        if (goal.status === "accomplished" && goal.completedDate) {
            const completedDate = goal.completedDate
            const dateKey = `${completedDate.getFullYear()}-${completedDate.getMonth() + 1}-${completedDate.getDate()}`
            
            if (!COMPLETED_GOALS[dateKey]) {
                COMPLETED_GOALS[dateKey] = []
            }
            
            COMPLETED_GOALS[dateKey].push(goal)
        }
        
        if (!goal.due) continue

        const goalYear = goal.due.getFullYear()
        const goalMonth = goal.due.getMonth() + 1
        const goalQuarter = Math.ceil(goalMonth / 3)
        const yearStr = goalYear.toString()
        const monthKey = `${yearStr}-${goalMonth}`
        const quarterKey = `${yearStr}-Q${goalQuarter}`
        
        // Add to year data
        if (YEAR_DATA[yearStr]) {
            YEAR_DATA[yearStr].goals.push(goal)
        }
        
        // Add to month data
        if (MONTH_DATA[monthKey]) {
            MONTH_DATA[monthKey].goals.push(goal)

            if (goal.id === MONTH_DATA[monthKey].pinnedId) {
                MONTH_DATA[monthKey].pinnedGoal = goal
            }
        }
        
        // Add to quarter data - all goals go here
        if (QUARTER_DATA[quarterKey]) {
            if (!QUARTER_DATA[quarterKey].goals.some(g => g.id === goal.id)) {
                QUARTER_DATA[quarterKey].goals.push(goal)
            }
        }
    }
}

/* data queries */

export function getMonthData({ year, moIdx}: {
    year: number, moIdx: number
}) {
    const monthKey = `${year}-${moIdx + 1}`
    const empty = { entry: null, goals: [], pinnedGoal: null, pinnedId: null }

    if (!MONTH_DATA[monthKey]) {
        MONTH_DATA[monthKey] = { ...empty, entry: getEmptyEntry() }
    }

    return MONTH_DATA[monthKey]
}

export function getQuarterData({ year, quarter }: {
    year: number, quarter: number
}) {
    const quarterKey = `${year}-Q${quarter}`
    const empty = { entry: null, goals: [] }

    if (!QUARTER_DATA[quarterKey]) {
        QUARTER_DATA[quarterKey] = empty
    }

    return QUARTER_DATA[quarterKey]
}

export function getYearData({ year }: {
    year: number
}) {
    const empty = { entry: null, smallImg: "", goals: [], bannerImg: null }

    if (!YEAR_DATA[year.toString()]) {
        YEAR_DATA[year.toString()] = { ...empty, entry: getEmptyEntry() }
    }

    return YEAR_DATA[year.toString()]
}

export function getCacheGoals(goal: Goal, period: "year" | "quarter" | "month") {
    const { y, m, q } = getPeriodKeys(goal.due!) 

    if (period === "year") {
        if (!YEAR_DATA[y]) {
            YEAR_DATA[y] = { 
                entry: getEmptyEntry(), 
                smallImg: "", 
                goals: [], 
                bannerImg: null 
            }
        }
        return YEAR_DATA[y].goals
    }
    else if (period === "quarter") {
        if (!QUARTER_DATA[q]) {
            QUARTER_DATA[q] = {
                entry: null,
                goals: []
            }
        }
        return QUARTER_DATA[q].goals
    }
    else {
        if (!MONTH_DATA[m]) {
            MONTH_DATA[m] = {
                entry: getEmptyEntry(),
                pinnedId: null,
                pinnedGoal: null,
                goals: []
            }
        }
        return MONTH_DATA[m].goals
    }
}

/* goal queries */
 
export function getPinnedGoals() {
    return PINNED_GOALS
}

export function getBigGoals() {

    return Object.values(ALL_GOALS).filter(goal => goal.big)
}

export function getRecentGoals() {
    return Object.values(ALL_GOALS)
            .filter(goal => goal.status === "accomplished" && goal.completedDate)
            .sort((a, b) => b.completedDate!.getTime() - a.completedDate!.getTime())
            .slice(0, 10)
}

export function getUpcomingGoals() {
    const now = new Date()
    return Object.values(ALL_GOALS)
            .filter(goal => goal.due && goal.status !== "accomplished" && goal.due > now)
            .sort((a, b) => a.due!.getTime() - b.due!.getTime())
            .slice(0, 10)
}

export function getOverdueGoals() {
    const now = new Date()
    return Object.values(ALL_GOALS)
            .filter(goal => goal.due && goal.status !== "accomplished" && goal.due < now)
            .sort((a, b) => a.due!.getTime() - b.due!.getTime())
}

/* updates */

/**
 * Add a goal given a time period / grouping view.
 * Used in goals board / list component. 
 * 
 * @param goal - the goal to add
 * @param idx  - the index of the goal to add
 * @param time - the time period set during add operation
 * @param grouping - the grouping set during add operation
 */
export function addGoal({ goal, idx, time, grouping }: { 
    goal: Goal
    idx: number
    time: "quarter" | "year" | "month"
    grouping: "status" | "tag" | "default" 
}) {         
    ALL_GOALS[goal.id] = goal

    if (goal.due) {
        setGoalPeriodCaches({ 
            goal,
            time: "month", 
            ...(time === "month" ? { context: { grouping, idx }} : {})
        })
        setGoalPeriodCaches({ 
            goal,
            time: "year", 
            ...(time === "year" ? { context: { grouping, idx }} : {})
        })
        setGoalPeriodCaches({ 
            goal,
            time: "quarter", 
            ...(time === "quarter" ? { context: { grouping, idx }} : {})
        })
    }

    handleStoreUpdate(goal)
}

export function deleteGoal(goal: Goal) {
    if (!goal.due) return

    delete ALL_GOALS[goal.id]

    unsetGoalPeriodCaches({ 
        goal, location: "month"
    })
    unsetGoalPeriodCaches({ 
        goal, location: "quarter"
    })
    unsetGoalPeriodCaches({ 
        goal, location: "year"
    })

    removeFromMiscCache(goal)
    handleStoreUpdate(goal)
}

/**
 * Move a goal from one month to another.
 * The place index is always the end for all groupings.
 * Update the indices.
 * 
 * @param goal - the goal to move
 * @param month - the destination month (0th index)
 * @param year - the destination year
 */
export function moveGoalDate({ goal, moIdx, year, date = 1 }: { 
    goal: Goal
    moIdx: number
    year: number
    date?: number
}) {
    if (!goal.due) return

    const newDate = new Date(goal.due)
    newDate.setFullYear(year)
    newDate.setMonth(moIdx)
    newDate.setDate(date)

    const { y: oldYearStr, m: oldMonthKey, q: oldQuarterKey } = getPeriodKeys(goal.due!)
    const { y: newYearStr, m: newMonthKey, q: newQuarterKey } = getPeriodKeys(newDate)
    
    // remove from old caches
    if (oldMonthKey !== newMonthKey) {
        unsetGoalPeriodCaches({ goal, location: "month" })
    }
    if (oldQuarterKey !== newQuarterKey) {
        unsetGoalPeriodCaches({ goal, location: "quarter" })
    }
    if (oldYearStr !== newYearStr) {
        unsetGoalPeriodCaches({ goal, location: "year" })
    }

    goal.due = newDate

    // add to new caches
    if (oldMonthKey !== newMonthKey) {
        setGoalPeriodCaches({ goal, time: "month" })
    }
    if (oldQuarterKey !== newQuarterKey) {
        setGoalPeriodCaches({ goal, time: "quarter" })
    }
    if (oldYearStr !== newYearStr) {
        setGoalPeriodCaches({ goal, time: "year" })
    }

    handleStoreUpdate(goal)
}

/**
 * Moving a goal within the same time period.
 * Moving between sections (status, tag)
 * 
 * Update the indices in all time periods.
 * 
 * @param srcGoal - the goal to move
 * @param target - the target goal or section to move to
 * @param timeFrame - the current time frame when move happened
 * @param grouping - the current grouping set when move happened
 */
export function moveGoal({
    srcGoal,
    target,
    timeFrame,
    grouping
}: {
    srcGoal: Goal
    target: Goal | string
    timeFrame: { year: number, period: string }
    grouping: "status" | "tag" | "default"
}) {
    const period = getPeriodType(timeFrame.period)
    const goals = getCacheGoals(srcGoal, period)

    const toEnd = typeof target === "string"
    const s = {
        order: getGoalIdx({ goal: srcGoal, period, grouping }),
        section: getGroupVal(srcGoal, grouping),
        sectionIdx: -1
    }
    const t = {
        order:   toEnd ? 0 : getGoalIdx({ goal: target as Goal, period, grouping }),
        section: toEnd ? target : getGroupVal(target as Goal, grouping),
        sectionIdx: -1
    }
    
    const sameSec = s.section === t.section
    const sSection = goals.filter(goal => getGroupVal(goal, grouping) === s.section)
    const tSection = goals.filter(goal => getGroupVal(goal, grouping) === t.section)
    const fromIdx = s.order

    t.order = toEnd ? tSection.length : t.order

    let toIdx = 0
    let direction: "up" | "down" = "up"

    // update the indices
    if (sameSec) {
        direction = s.order > t.order ? "up" : "down"
        toIdx = direction === "up" ? t.order : Math.max(0, t.order - 1)

        if (direction === "up") {
            shiftPeriodGroup({
                goals: sSection,
                fromIdx: toIdx,
                toIdx: fromIdx,
                shift: 1,
                context: { location: period, grouping }
            })
        }
        else {
            shiftPeriodGroup({
                goals: tSection,
                fromIdx,
                toIdx: toIdx + 1,
                shift: -1,
                context: { location: period, grouping }
            })
        }
    }
    else {
        toIdx = t.order

        // remove from src section
        shiftPeriodGroup({
            goals: sSection,
            fromIdx: fromIdx + 1,
            toIdx: sSection.length,
            shift: -1,
            context: { location: period, grouping }
        })

        // make space for new item
        shiftPeriodGroup({
            goals: tSection,
            fromIdx: toIdx,
            toIdx: tSection.length,
            shift: 1,
            context: { location: period, grouping }
        })
    }
    // need to update references in other time periods if we changed the status or tag
    // we remove from old section and add the end of new section
    if (!sameSec && grouping != "default") {
        groupSwitchUpdate({ 
            goal: srcGoal, 
            periods: PERIOD_TYPES.filter(p => p !== period),
            grouping,
            sSection: s.section, 
            tSection: t.section
        })
    }

    if (grouping === "status") {
        const toComplete = t.section === "accomplished"
        srcGoal.status = t.section as GoalStatus
        srcGoal.completedDate = toComplete ? new Date() : null
    } 
    else if (grouping === "tag") {
        srcGoal.tag = typeof target === "string" ? findTag(target) : target.tag
    }
    updateGoalIdx({
        goal: srcGoal, idx: toIdx, period, grouping,
    })
    handleStoreUpdate(srcGoal)
}

export async function updateGoal({ goal, update }: { goal: Goal, update: Goal }) {
    return new Promise((resolve) => {
        const tagChanged = goal.tag !== update.tag
        const statusChanged = goal.status !== update.status
        const dueChanged = goal.due !== update.due

        if (tagChanged) {
            const oldTag = goal.tag
            goal.tag = update.tag

            groupSwitchUpdate({ 
                goal, 
                grouping: "tag",
                sSection: oldTag!.name!, 
                tSection: goal.tag!.name!
            })
        }
        if (statusChanged) {
            const oldStatus = goal.status
            goal.status = update.status

            groupSwitchUpdate({ 
                goal, 
                grouping: "status",
                sSection: oldStatus, 
                tSection: goal.status
            })
        }
        if (dueChanged) {
            goal.due = update.due

            moveGoalDate({ 
                goal, 
                moIdx: update.due!.getMonth(), 
                year: update.due!.getFullYear() 
            })
        }

        goal = { ...goal, ...update }
        resolve(goal)
    })
}

/* completion */

export function updateCacheOnCheckToggle(goal: Goal, date: Date) {
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    const complete = goal.status === "accomplished"

    // copmleted goals
    if (complete) {
        if (!COMPLETED_GOALS[dateKey]) {
            COMPLETED_GOALS[dateKey] = []
        }
        COMPLETED_GOALS[dateKey].push(goal)
    }
    else {
        COMPLETED_GOALS[dateKey] = COMPLETED_GOALS[dateKey].filter(g => g.id !== goal.id)
    }
    COMPLETED_GOALS[dateKey].push(goal)
}

export function getGoalHeatMap(year: number): YearHeatMapData[] {

    const data: YearHeatMapData[] = []
    const toMonth = year === new Date().getFullYear() ? new Date().getMonth() : 11
    
    for (let i = 0; i <= toMonth; i++) {
        const month = genMonthCalendar(new Date(year, i, 1))
        const monthKey = `${year}-${i + 1}`
        const monthData = MONTH_DATA[monthKey]

        for (let day of month.days) {
            const { date, isInCurrMonth } = day

            if (!uptoToday(date) || date.getFullYear() !== year || !isInCurrMonth) {
                continue
            }
            const dayData: YearHeatMapData = {
                date, 
                goals: []
            }
            
            // if (monthData && isInCurrMonth) {
            //     for (const goal of monthData.goals) {
            //         if (!goal.due) continue
                    
            //         if (isSameDay(goal.due, date)) {
            //             dayData.goals.push(goal)
            //         }
            //     }
            // }
            
            const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
            
            if (COMPLETED_GOALS[dateKey]) {
                for (const goal of COMPLETED_GOALS[dateKey]) {
                    if (!dayData.goals.some(g => g.id === goal.id)) {
                        dayData.goals.push(goal)
                    }
                }
            }            
            data.push(dayData)
        }
    }

    return data
}

/* pin */

/**
 * Pin goal to carousel.
 * 
 * @param goal - the goal to pin
 * @param idx - the index to pin the goal at, if empty, pin to the end
 */
export function pinGoal(goal: Goal, idx?: number) {
    const goals  =  PINNED_GOALS
    const length = goals.length
    goals.push(goal)

    if (idx === undefined) {
        goal.pinIdx = length
    }
    for (let i = 0; i < length; i++) {
        const idx = goals[i].pinIdx!

        if (idx >= goal.pinIdx!) {
            goals[i].pinIdx! += 1
        }
    }
}

export function unpinGoal(goal: Goal) {
    const goals =  PINNED_GOALS
    const removeIdx = goals.findIndex(g => g.id === goal.id)

    for (let i = 0; i < goals.length; i++) {
        const idx = goals[i].pinIdx!

        if (idx >= goal.pinIdx!) {
            goals[i].pinIdx! -= 1
        }
    }
    if (removeIdx >= 0) {
        goals.splice(removeIdx, 1)
    }

    goal.pinIdx = null
}

export function reorderPinned(src: Goal, target: Goal) {
    const targetIdx = target.pinIdx!
    const srcIdx = src.pinIdx!

    reorderItemArr({ 
        array: PINNED_GOALS.map(g => ({ idx: g.pinIdx!, goal: g })), 
        srcIdx, targetIdx 
    })
    .forEach(item => { item.goal.pinIdx = item.idx })
}

export function isGoalPinned(goal: Goal | null) {
    if (!goal) return false

    return PINNED_GOALS.some(g => g.id === goal.id)
}

/* data utils */

/**
 * Add a goal to its data period caches based on its due date.
 */
function setGoalPeriodCaches({ goal, time, context }: { 
    goal: Goal
    time: "year" | "month" | "quarter"
    context?: {
        grouping: "status" | "tag" | "default"
        idx: number
    }
}) {
    const { m, y, q } = getPeriodKeys(goal.due!)

    const addIdx = {
        default: -1, status: -1, tag: -1,
        ...(context ? { [context.grouping]: context.idx } : {})
    }
    if (time === "year") {
        vertifyData({ key: y, data: "year" })
        shiftAllNeighbors({ goal, period: "year", addIdx })
        YEAR_DATA[y].goals.push(goal)
    }
    else if (time === "month") {
        vertifyData({ key: m, data: "month" })
        shiftAllNeighbors({ goal, period: "month", addIdx })
        MONTH_DATA[m].goals.push(goal)

        console.log(m, MONTH_DATA[m].goals)
    }
    else if (time === "quarter") {
        vertifyData({ key: q, data: "quarter" })
        shiftAllNeighbors({ goal, period: "quarter", addIdx })
        QUARTER_DATA[q].goals.push(goal)
    }
}

/**
 * Remove a goal from its data period caches based on its due date.
 */
export function unsetGoalPeriodCaches({ goal, location }: {
    goal: Goal
    location: "year" | "month" | "quarter"
}) {
    const { m, y, q } = getPeriodKeys(goal.due!)

    // shift indices to fill the space left behind by removed goal
    if (location === "year") {
        shiftAllNeighbors({     
            goal, shift: -1, period: "year"
        })

        YEAR_DATA[y].goals = YEAR_DATA[y].goals.filter(g => g.id !== goal.id)
    }
    else if (location === "month") {
        shiftAllNeighbors({ 
            goal, shift: -1, period: "month"
        })

        MONTH_DATA[m].goals = MONTH_DATA[m].goals.filter(g => g.id !== goal.id)

        if (MONTH_DATA[m].pinnedGoal?.id === goal.id) {
            MONTH_DATA[m].pinnedGoal = null
        }
    }
    else if (location === "quarter") {
        shiftAllNeighbors({ 
            goal, shift: -1, period: "quarter"
        })

        QUARTER_DATA[q].goals = QUARTER_DATA[q].goals.filter(g => g.id !== goal.id)
    }
}

/**
 * Remove from misc pinned and completed caches.
 */
export function removeFromMiscCache(goal: Goal) {
    const pinnedIndex = PINNED_GOALS.findIndex(g => g.id === goal.id)
    if (pinnedIndex >= 0) {
        unpinGoal(goal)
    }

    if (goal.completedDate) {
        const dayKey = getDataKey(goal.completedDate, "day")
        if (COMPLETED_GOALS[dayKey]) {
            COMPLETED_GOALS[dayKey] = COMPLETED_GOALS[dayKey].filter(g => g.id !== goal.id)
        }
    }
}

/**
 * Given a goal, shift its neighbors in all groupings under a time period.  
 * A group neighbor is a goal that shares the same groupning val (status or tag).
 * 
 * (default, status, tag).
 * 
 * @param goal - the goal to update
 * @param time - the time period to update
 * @param shift - the shift direction
 * @param addIdx - the specific non-last group idx where goal will be added 
 */
export function shiftAllNeighbors({ goal, period, addIdx = { default: -1, status: -1, tag: -1 }, shift = 1 }: {
    goal: Goal
    period: "year" | "month" | "quarter"
    shift?: 1 | -1
    addIdx?: {
        default?: number
        status?: number
        tag?: number
    }
}) {
    const orderKey = `${period[0]}_order` as keyof Goal
    const orderObj = goal[orderKey] as Record<string, number>
    const adding = shift === 1

    let currNbrs: Goal[] = []
    let currIdx = -1

    // update indices for each grouping
    for (const [key, i] of Object.entries(addIdx)) {
        const grouping = key as "status" | "tag" | "default"
        const data = getPeriodNeighbors({ goal, period, grouping })!

        currNbrs = data.nbrs

        // if adding, the i will be the new goal idx, so make space for it from there
        // if removing, the i is where the removed goal is
        currIdx = adding && i >= 0 ? i : data.idx

        // for adding
        if (adding) {
            orderObj[grouping] = i === -1 ? currNbrs.length : i
        }
        // no shifting necessary if adding to the end
        if (adding && i < 0) {
            continue
        }
        
        // shift the indices to make space (adding) or fill space (removing)
        shiftPeriodGroup({
            goals: currNbrs,
            fromIdx: currIdx,
            toIdx: currNbrs.length,
            shift,
            context: {
                location: period,
                grouping
            }
        })
    }
}

/**
 * Given a list of goals, shift a single group under a time period.
 * To make space (adding) or fill space (removing).
 * 
 * @param param0 
 * @returns 
 */
function shiftPeriodGroup({ goals, context, fromIdx, toIdx, shift }: {
    goals: Goal[]
    fromIdx: number
    toIdx: number
    shift: 1 | -1
    context: {
        location: "year" | "quarter" | "month"
        grouping: "status" | "tag" | "default"
    }
}) {
    const { location, grouping } = context
    const key = `${location[0]}_order` as keyof Goal

    goals.forEach(goal => {
        const orderObj = goal[key] as Record<string, number>
        const order = orderObj[grouping]

        if (order >= fromIdx && order < toIdx) {
            orderObj[grouping] += shift
            orderObj[grouping] = Math.max(0, orderObj[grouping]) // prevent -1 on 0th indices
        }
    })
    return goals
}

/**
 * Removes a goal from old grouping and adds it to new grouping.
 * Update the indices in all time periods.
 * 
 * @param goal - the goal to update
 * @param period - the time period to update
 * @param grouping - the grouping to update
 * @param sSection - the old section
 * @param tSection - the new section
 */
function groupSwitchUpdate({ goal, grouping, sSection, tSection, periods = PERIOD_TYPES }: {
    goal: Goal
    periods?: PeriodType[]
    grouping: "status" | "tag" | "default"
    sSection: string
    tSection: string
}) {
    const periodNbrs = (time: PeriodType) => {
        if (time === "year") {
            return getCacheGoals(goal, "year")
        } 
        else if (time === "quarter") {
            return getCacheGoals(goal, "quarter")
        } 
        else {
            return getCacheGoals(goal, "month")
        }
    }

    // for each time period, update the group nbr indices
    for (const p of periods) {
        const period = p as PeriodType
        const goals = periodNbrs(period)!

        const oldGroupNbrs = goals.filter(g => (getGroupVal(g, grouping) === sSection))
        const newGroupNbrs = goals.filter(g => (getGroupVal(g, grouping) === tSection))

        // idx in old section
        const currentIdx = getGoalIdx({ 
            goal, 
            period,
            grouping 
        })

        // remove from old section
        shiftPeriodGroup({
            goals: oldGroupNbrs,
            fromIdx: currentIdx,
            toIdx: oldGroupNbrs.length,
            shift: -1,
            context: { location: period, grouping }
        })     

        // add to new section
        const orderKey = `${period[0]}_order` as keyof Goal
        const orderObj = goal[orderKey] as Record<string, number>
        orderObj[grouping] = newGroupNbrs.length
    }
}

/* ui utils */

export function setViewGoal(goal: Goal | null) {
    goalTracker.update(store => ({ ...store, viewGoal: goal }))
}

export function getYearProgress(year: number) {
    const yearData = getYearData({ year })
    const totalGoals = yearData.goals.length
    const completedGoals = yearData.goals.filter(goal => goal.status === "accomplished").length

    return completedGoals / totalGoals
}

export function getPeriodData({ year, period }: { year: number, period: string }): PeriodData {
    if (period.startsWith("q")) {
        const quarter = parseInt(period.split("q")[1])
        return getQuarterData({ year, quarter })
    }
    else if (period === "all") {
        const data = getYearData({ year })
        return {
            goals: data.goals, entry: null,
        }
    }
    else {
        const moIdx = months.findIndex(mo => mo.slice(0, 3).toLowerCase() === period)
        const { pinnedId, ...rest } = getMonthData({ year, moIdx })
        return rest
    }
}

export function getDueDateDistStr({ due, dueType, type, min = true }: { 
    due: Date
    dueType: DateType
    type: "distance" | "date"
    min?: boolean 
}) {
    if (!due) {
        return { dueStr: "🤞", isLate: false }
    }
    if (type === "date") {
        if (dueType === "day") {
            return { dueStr: formatDatetoStr(due, { month: "short", day: "numeric", year: min ? undefined : "numeric" }) }
        } 
        else if (min) {
            return { dueStr: formatDatetoStr(due, { month: "short" }) }
        }
        else if (dueType === "quarter") {
            return { dueStr: `Q${Math.floor(due.getMonth() / 3) + 1} ${formatDatetoStr(due, { year: "numeric" })}` }
        }
        else if (dueType === "month") {
            return { dueStr: formatDatetoStr(due, { month: "short", year: "numeric" }) }
        }
        else {
            return { dueStr: formatDatetoStr(due, { year: "numeric" }) }
        }
    }

    // Distance type (default)
    let str = getTimeDistanceStr({ date: due, enforce: "d" })
    const isLate = str.includes("ago")

    if (min) {
        str = str.split("")[0] + "d"
    }
    if (isLate) {
        return { dueStr: "-" + str.split("ago")[0], isLate: true }
    } 
    else {
        return { dueStr: str }
    }
}

/* utils */

function getPeriodKeys(date: Date) {
    return { 
        y: getDataKey(date, "year"), 
        m: getDataKey(date, "month"),     
        q: getDataKey(date, "quarter") 
    }
}

function vertifyData({ key, data }: { key: string, data: "year" | "month" | "quarter" }) {
    if (data === "year") {
        MONTH_DATA[key] ||= { entry: getEmptyEntry(), pinnedId: null, pinnedGoal: null, goals: [] }
    }
    else if (data === "month") {
        QUARTER_DATA[key] ||= { entry: null, goals: [] }
    }
    else {
        YEAR_DATA[key] ||= { entry: getEmptyEntry(), smallImg: "", bannerImg: null, goals: [] }
    }
}

export function findSectionNbrs({ goal, section, period }: { 
    goal: Goal 
    section: "default" | "status" | "tag" 
    period: "year" | "month" | "quarter"
}) {
    const goals = getCacheGoals(goal, period)

    return section === "default" ? goals : goals.filter(g => (getGroupVal(g, section) === getGroupVal(goal, section)))
}

/**
 * Find a goal's section nbrs and idx at that section.
 * 
 * @param param0 
 * @returns 
 */
export function getPeriodNeighbors({ goal, period, grouping }: {
    goal: Goal,
    grouping: "status" | "tag" | "default",
    period: "year" | "month" | "quarter"
}) {
    if (grouping === "default") {
        return {
            nbrs: findSectionNbrs({ goal, section: "default", period }),
            idx: getGoalIdx({ goal, period, grouping: "default" })
        }
    }
    else if (grouping === "status") {
        return {
            nbrs: findSectionNbrs({ goal, section: "status", period }),
            idx: getGoalIdx({ goal, period, grouping: "status" })
        }
    }
    else if (grouping === "tag") {
        return {
            nbrs: findSectionNbrs({ goal, section: "tag", period }),
            idx: getGoalIdx({ goal, period, grouping: "tag" })
        }
    }
}

function getEmptyEntry(): TextEntryOptions {
    return {
        entry: "",
        styling: "has-marker",
        date: new Date(),
        truncate: false,
        icon: null
    }
}

function getDataKey(date: Date, time: "quarter" | "year" | "month" | "day") {
    if (time === "year") {
        return date.getFullYear().toString()
    }
    else if (time === "quarter") {
        const month = date.getMonth() + 1
        const quarter = Math.ceil(month / 3)
        return `${date.getFullYear()}-Q${quarter}`
    }
    else if (time === "month") {
        const month = date.getMonth() + 1
        return `${date.getFullYear()}-${month}`
    }
    else if (time === "day") {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }
    return ""
}

export function getPeriodType(period: string) {
    if (period.startsWith("q")) {
        return "quarter"
    }
    else if (period === "all") {
        return "year"
    }
    return "month"
}

export function getGoalIdx({ goal, period, grouping }: {
    goal: Goal
    period: string
    grouping: "status" | "tag" | "default"
}) {
    const key = `${period[0]}_order` as keyof Goal
    const orderObj = goal[key] as Record<string, number>

    return orderObj[grouping]
}

/**
 * Update a goal's indices.
 * @param param0 
 */
export function updateGoalIdx({ goal, period, grouping, idx }: {
    goal: Goal
    period: string
    grouping: "status" | "tag" | "default"
    idx: number
}) {
    const key = `${period[0]}_order` as keyof Goal
    const orderObj = goal[key] as Record<string, number>
    orderObj[grouping] = idx
}

/**
 * Find the grouping value for the goal.
 * (status, tag)
 * 
 * @param goal 
 * @param grouping 
 * @returns 
 */
function getGroupVal(goal: Goal, grouping: "status" | "tag" | "default") {
    if (grouping === "status") {
        return goal.status
    }
    else if (grouping === "tag") {
        return goal.tag?.name || "*"
    }
    else {
        return "*"
    }
}

export function getMoFromIdx(idx: number) {
    return months[idx].slice(0, 3).toLowerCase()
}

export function getIdxFromMo(mo: string) {
    return months.findIndex(m => m.slice(0, 3).toLowerCase() === mo)
}

/**
 * Get the next time frame.
 * i.e. "jan" -> "feb"
 * i.e. "q4 2025" -> "q1 2026"
 * i.e. "all 2025" -> "jan 2026"
 */
export function getNextTimeFrame({ period, year }: { period: string, year: number }) {
    if (period === "all") {
        return { period: "jan", year: year + 1 }
    }
    else if (period.startsWith("q")) {
        const quarter = parseInt(period.split("q")[1])
        
        if (quarter === 4) {
            return { period: "q1", year: year + 1 }
        } 
        else {
            return { period: `q${quarter + 1}`, year }
        }
    }
    else {
        const monthIdx = getIdxFromMo(period)
        
        if (monthIdx === 11) {
            return { period: "jan", year: year + 1 }
        } 
        else {
            const nextMonth = getMoFromIdx(monthIdx + 1)
            return { period: nextMonth, year }
        }
    }
}

/**
 * Get the date from time frame.
 * Dates are always last days of the month.
 */
export function getDateFromTimeFrame({ period, year }: { period: string, year: number }): Date {
    if (period.startsWith("q")) {
        const quarter = parseInt(period.split("q")[1])
        const month = quarter * 3 - 1
        return new Date(year, month + 1, 0)
    }
    else if (period === "all") {
        return new Date(year, 0, 31)
    }
    else {
        return new Date(year, getIdxFromMo(period) + 1, 0)
    }
}