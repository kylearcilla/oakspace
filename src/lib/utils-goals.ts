import { get } from 'svelte/store'
import { v4 as uuidv4 } from 'uuid'
import { goalTracker } from "./store"

import { formatDatetoStr, isSameDay } from "./utils-date"
import { findTag, getTagFromId, isVoid, reorderItemArr } from "./utils-general"
import { GOALS, YEARS, MONTH_ENTIRES, QUARTER_ENTRIES } from "./mock-data-goals"
import { genMonthCalendar, getTimeDistanceStr, months, uptoToday } from "./utils-date"

export let initPromise: Promise<void>

type PeriodType = "year" | "quarter" | "month"

export const STATUSES = ["not-started", "in-progress", "accomplished"]
export const PERIODS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "q1", "q2", "q3", "q4", "all"]

export const YEAR_CREATED = 2025
export const MIN_YEAR = YEAR_CREATED - 5
export const MAX_YEAR = new Date().getFullYear() + 5
// export const MIN_YEAR = 2024
// export const MAX_YEAR = 2025

const PERIOD_TYPES: PeriodType[] = ["year", "quarter", "month"]
const ALL_GOALS: Record<string, Goal> = {}

const GOALS_PAGE_STORAGE_ID = "goals-page-options"
const GOALS_VIEW_STORAGE_ID = "goals-view-options"

const YEAR_DATA: Record<string, GoalYearData> = {}
const MONTH_DATA: Record<string, GoalMonthData> = {}
const QUARTER_DATA: Record<string, GoalQuarterData> = {}

const COMPLETED_GOALS: Record<string, Goal[]> = {}
const PINNED_GOALS: Goal[] = []

let GOALS_TO_UPDATE: Record<string, GoalIdxUpdate> = {}

export async function initGoals() {
    await _initGoals()

    goalTracker.set({
        init: true, goals: GOALS, viewGoal: null, view: null, ...getGoalsData()
    })
}

/**
 * Called when there's been an update in the caches.
 * @param goal - the goal caused the update
 */
export function handleStoreUpdate(goal: Goal) {
    const viewManager = get(goalTracker).view
    if (viewManager) {
        viewManager.resetGoals()
    }

    goalTracker.update((store) => ({ ...store, ...getGoalsData() }))

    GOALS_TO_UPDATE = {}
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
    for (const [yearStr, yearEntry] of Object.entries(YEARS)) {
        const { entry = getEmptyEntry(), smallImg, bannerImg, pinnedId } = yearEntry

        YEAR_DATA[yearStr] = {
            entry, smallImg, bannerImg, pinnedId, goals: []
        }
    }
    for (const [quarterKey, quarterEntry] of Object.entries(QUARTER_ENTRIES)) {
        const { entry = getEmptyEntry(), pinnedId } = quarterEntry

        QUARTER_DATA[quarterKey] = {
            entry, pinnedId, goals: []
        }
    }
    for (const [monthKey, monthEntry] of Object.entries(MONTH_ENTIRES)) {
        const { entry = getEmptyEntry(), pinnedId } = monthEntry

        MONTH_DATA[monthKey] = {
            entry, pinnedId, goals: []
        }
        
        // Initialize quarter data structures (if missing)
        const [yearStr, monthStr] = monthKey.split('-')
        const month = parseInt(monthStr)
        const quarter = Math.ceil(month / 3)
        const quarterKey = `${yearStr}-Q${quarter}`
        
        if (!QUARTER_DATA[quarterKey]) {
            QUARTER_DATA[quarterKey] = {
                entry: getEmptyEntry(),
                pinnedId,
                goals: []
            }
        }
    }

    for (const goal of GOALS) {
        if (!isVoid(goal.pinIdx)) {
            PINNED_GOALS.push(goal)
        }

        ALL_GOALS[goal.id] = goal
        
        // Track completed goals by date
        if (goal.status === "accomplished" && goal.completedDate) {
            const completedDate = goal.completedDate
            const dateKey = getDataKey(completedDate, "day")
            
            COMPLETED_GOALS[dateKey] ||= []
            COMPLETED_GOALS[dateKey].push(goal)
        }
        const { y, m, q } = getPeriodKeys(goal.due!)

        // Add to year data
        if (YEAR_DATA[y]) {
            YEAR_DATA[y].goals.push(goal)
        }
        // Add to month data
        if (MONTH_DATA[m]) {
            MONTH_DATA[m].goals.push(goal)
        }
        // Add to quarter data - all goals go here
        if (QUARTER_DATA[q]) {
            QUARTER_DATA[q].goals.push(goal)
        }
    }
}

/* data queries */

export function getMonthData({ year, moIdx }: { year: number, moIdx: number }): 
    GoalMonthData & { pinnedGoal: Goal | null } 
{
    const key = `${year}-${moIdx + 1}`
    
    vertifyData({ key, data: "month" })
    const data = MONTH_DATA[key]
    const pinnedGoal = data.pinnedId ? getGoal(data.pinnedId) : null

    if (!pinnedGoal) {
        data.pinnedId = null
    }

    return { ...data, pinnedGoal }
}

export function getQuarterData({ year, quarter }: { year: number, quarter: number }): 
    GoalQuarterData & { pinnedGoal: Goal | null } 
{
    const key = `${year}-Q${quarter}`
    vertifyData({ key, data: "quarter" })

    const data = QUARTER_DATA[key]
    const pinnedGoal = data.pinnedId ? getGoal(data.pinnedId) : null

    if (!pinnedGoal) {
        data.pinnedId = null
    }

    return { ...data, pinnedGoal }
}

export function getYearData({ year }: { year: number }): 
    GoalYearData & { pinnedGoal: Goal | null } 
{
    const key = year.toString()
    vertifyData({ key, data: "year" })

    const data = YEAR_DATA[key]
    const pinnedGoal = data.pinnedId ? getGoal(data.pinnedId) : null

    if (!pinnedGoal) {
        data.pinnedId = null
    }

    return { ...data, pinnedGoal }
}

export function getCacheGoals(goal: Goal, period: PeriodType) {
    const { y, m, q } = getPeriodKeys(goal.due!) 

    if (period === "year") {
        vertifyData({ key: y, data: "year" })
        return YEAR_DATA[y].goals
    }
    else if (period === "quarter") {
        vertifyData({ key: q, data: "quarter" })
        return QUARTER_DATA[q].goals
    }
    else {
        vertifyData({ key: m, data: "month" })
        return MONTH_DATA[m].goals
    }
}

export function getGoal(id: string) {
    return ALL_GOALS[id]
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
            .filter(goal => goal.status === "accomplished" && goal.completedDate && uptoToday(goal.completedDate))
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
 * Add a goal.
 * Put the goal in relevant caches.
 * Add item to the last group index for all groupings (default, status, tag).
 */
export function addGoal(goal: Goal) {         
    return new Promise((resolve) => {
        ALL_GOALS[goal.id] = goal

        addGoalPeriodCaches({ goal, time: "month" })
        addGoalPeriodCaches({ goal, time: "year" })
        addGoalPeriodCaches({ goal, time: "quarter" })

        if (goal.status === "accomplished") {
            addToChecked(goal, goal.completedDate!)
        }
        if (!isVoid(goal.pinIdx)) {
            PINNED_GOALS.push(goal)
        }

        handleStoreUpdate(goal)
        resolve(null)
    })
}

export function deleteGoal(goal: Goal) {
    return new Promise((resolve) => {
        delete ALL_GOALS[goal.id]

        removeGoalPeriodCaches({ 
            goal, location: "month"
        })
        removeGoalPeriodCaches({ 
            goal, location: "quarter"
        })
        removeGoalPeriodCaches({ 
            goal, location: "year"
        })

        removeFromMiscCache(goal)
        handleStoreUpdate(goal)
        resolve(null)
    })
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
        removeGoalPeriodCaches({ goal, location: "month" })
    }
    if (oldQuarterKey !== newQuarterKey) {
        removeGoalPeriodCaches({ goal, location: "quarter" })
    }
    if (oldYearStr !== newYearStr) {
        removeGoalPeriodCaches({ goal, location: "year" })
    }

    goal.due = newDate

    // add to new caches
    if (oldMonthKey !== newMonthKey) {
        addGoalPeriodCaches({ goal, time: "month" })
    }
    if (oldQuarterKey !== newQuarterKey) {
        addGoalPeriodCaches({ goal, time: "quarter" })
    }
    if (oldYearStr !== newYearStr) {
        addGoalPeriodCaches({ goal, time: "year" })
    }

    handleStoreUpdate(goal)
}

export function moveGoalDueDay(goal: Goal, newDueDate: Date) {
    goal.due = newDueDate

    if (goal.status === "accomplished") {
        removeFromChecked(goal, goal.completedDate!)
        addToChecked(goal, newDueDate)
    }

    handleStoreUpdate(goal)
}   

/**
 * Moving a goal within the same time period.
 * Moving between sections (status, tag).
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
    grouping: GoalViewSection
}) {
    const period = getPeriodType(timeFrame.period)
    const goals = getCacheGoals(srcGoal, period)

    const toEnd = typeof target === "string"
    const s = {
        order: getGroupIdx({ goal: srcGoal, period, grouping }),
        section: getGroupVal(srcGoal, grouping) || "Empty",
        sectionIdx: -1
    }
    const t = {
        order:   toEnd ? 0 : getGroupIdx({ goal: target as Goal, period, grouping }),
        section: toEnd ? target : getGroupVal(target as Goal, grouping) || "Empty",
        sectionIdx: -1
    }
    
    const sameSec = s.section === t.section
    const sSection = findGroupMembers({ goals, grouping, groupName: s.section })
    const tSection = findGroupMembers({ goals, grouping, groupName: t.section })
    const fromIdx = s.order

    t.order = toEnd ? tSection.length : t.order

    let toIdx = 0
    let direction: "up" | "down" = "up"

    // is not always added to the end of new section
    // so we need to update this period for the period in view
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


    // for the other two periods we add at the end
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

    // update grouping and index
    if (grouping === "status") {
        updateGoalStatus({ 
            goal: srcGoal, 
            status: t.section as GoalStatus 
        })
    } 
    else if (grouping === "tag") {
        updateGoalTag({ 
            goal: srcGoal, 
            tag: typeof target === "string" ? findTag(target)! : target.tag!
        })
    }
    updateGoalIdx({
        goal: srcGoal, 
        idx: toIdx, 
        period, 
        grouping,
    })

    handleStoreUpdate(srcGoal)
}

export async function updateGoal({ goal, update }: { 
    goal: Goal
    update: GoalUpdateData
}) {
    const checkComplete = (g_date?: Date | null, u_date?: Date | null) => {
        if (g_date && u_date) {
            return !isSameDay(g_date, u_date)
        }
        return g_date !== u_date
    }
    return new Promise((resolve) => {
        const tagChanged = goal.tag !== update.tag
        const statusChanged = goal.status !== update.status
        const dueChanged = goal.due !== update.due
        const updatedComplete = checkComplete(goal.completedDate, update.completedDate)

        const hasPin = !isVoid(goal.pinIdx)
        const pinnedChanged = update.pinned !== hasPin

        if (tagChanged) {
            groupSwitchUpdate({ 
                goal, 
                grouping: "tag",
                sSection: goal.tag?.name ?? "Empty", 
                tSection: update.tag?.name ?? "Empty"
            })
        }
        if (statusChanged && update.status) {
            groupSwitchUpdate({ 
                goal, 
                grouping: "status",
                sSection: goal.status, 
                tSection: update.status
            })
        }
        if (dueChanged && update.due) {
            moveGoalDate({ 
                goal, 
                moIdx: update.due!.getMonth(), 
                year: update.due!.getFullYear() 
            })
        }
        if (pinnedChanged && update.pinned) {
            pinGoal(goal)
        }
        else if (pinnedChanged) {
            unpinGoal(goal)
        }

        goal.name = update.name
        goal.description = update.description
        goal.due = update.due
        goal.tag = update.tag
        goal.img = update.img
        goal.status = update.status
        goal.dueType = update.dueType
        goal.big = update.big
        goal.tasks = update.tasks

        // uncheck
        if (statusChanged && goal.status != "accomplished" && goal.completedDate) {
            removeFromChecked(goal, goal.completedDate)
        }
        // check
        if (statusChanged && goal.status === "accomplished") {
            addToChecked(goal, new Date())
            goal.completedDate = new Date()
        }
        // completed date change
        if (updatedComplete && update.completedDate) {
            goal.completedDate && (removeFromChecked(goal, goal.completedDate))
            addToChecked(goal, update.completedDate)
        }
        
        goal.completedDate = update.completedDate

        handleStoreUpdate(goal)
        resolve(goal)
    })
}



/* completion */

function removeFromChecked(goal: Goal, date: Date) {
    const dateKey = getDataKey(date, "day")
    COMPLETED_GOALS[dateKey] = COMPLETED_GOALS[dateKey].filter(g => g.id !== goal.id)
}

/**
 * Based on a previously completed goal's status, update the completed goals cache.
 * 
 * @param goal - the goal to update
 * @param completed - the completed date
 */
export function addToChecked(goal: Goal, date: Date) {
    const dateKey = getDataKey(date, "day")

    if (!COMPLETED_GOALS[dateKey]) {
        COMPLETED_GOALS[dateKey] = []
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
            const dateKey = getDataKey(date, "day")
            
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

export function setPeriodPinned({ goal, timeFrame }: { 
    goal: Goal | null
    timeFrame: { year: number, period: string } 
}) {
    const { period, year } = timeFrame
    const periodType = getPeriodType(period)

    if (periodType === "year") {
        YEAR_DATA[`${year}`].pinnedId = goal?.id ?? null
    }
    else if (periodType === "month") {
        const monIdx = getIdxFromMo(period)
        MONTH_DATA[`${year}-${monIdx + 1}`].pinnedId = goal?.id ?? null
    }
    else if (periodType === "quarter") {
        QUARTER_DATA[`${year}-Q${+period[1]}`].pinnedId = goal?.id ?? null
    }
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
 * 
 * 
 * @param goal - the goal to add
 * @param time - the time period to add the goal to
 * @param idxContext - optional, if provided, add the goal to the specific index for a grouping
 */
function addGoalPeriodCaches({ goal, time, idxContext }: { 
    goal: Goal
    time: PeriodType
    idxContext?: {
        grouping: GoalViewSection
        idx: number
    }
}) {
    const { m, y, q } = getPeriodKeys(goal.due!)

    const addIdx = {
        default: -1, status: -1, tag: -1,
        ...(idxContext ? { [idxContext.grouping]: idxContext.idx } : {})
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
export function removeGoalPeriodCaches({ goal, location }: {
    goal: Goal
    location: PeriodType
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
    if (PINNED_GOALS.findIndex(g => g.id === goal.id) >= 0) {
        unpinGoal(goal)
    }
    if (goal.completedDate) {
        removeFromChecked(goal, goal.completedDate)
    }
}

/**
 * Given a goal, shift its neighbors in all groupings under a time period.  
 * A group neighbor is a goal that shares the same groupning val (status or tag).
 * 
 * If shifting to add, goal's group indices will be updated to its new location group index.
 * 
 * @param goal - the goal to update
 * @param time - the time period to update
 * @param shift - the shift direction
 * @param addIdx - the specific non-last group idx where goal will be added 
 */
export function shiftAllNeighbors({ goal, period, shift = 1, addIdx = { default: -1, status: -1, tag: -1 } }: {
    goal: Goal
    period: PeriodType
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
        const grouping = key as GoalViewSection
        const data = getPeriodNeighbors({ goal, period, grouping })

        currNbrs = data.nbrs!

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
        grouping: GoalViewSection
    }
}) {
    const { location, grouping } = context
    const key = `${location[0]}_order` as keyof Goal

    goals.forEach(goal => {
        const orderObj = goal[key] as Record<string, number>
        const order = orderObj[grouping]

        if (order >= fromIdx && order < toIdx) {
            const idx = Math.max(0, order + shift)
            
            if (orderObj[grouping] !== idx) {
                orderObj[grouping] = idx
                trackIdxChange({ goalId: goal.id, period: location, grouping, idx })
            }
        }
    })
    return goals
}

/**
 * Removes a goal from old grouping and adds it to new grouping.
 * Always added to the last index of the new grouping.
 * The input goal's grouping should've been already updated.
 * Update the indices in all time periods by default.
 * 
 * @param goal - the goal to update
 * @param period - the time period to update
 * @param grouping - the grouping to update
 * @param sSection - the old section
 * @param tSection - the new section
 */
export function groupSwitchUpdate({ goal, grouping, sSection, tSection, periods = PERIOD_TYPES }: {
    goal: Goal
    periods?: PeriodType[]
    grouping: GoalViewSection
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

        const oldGroupNbrs = findGroupMembers({ goals, grouping, groupName: sSection })
        const newGroupNbrs = findGroupMembers({ goals, grouping, groupName: tSection })

        // idx in old section
        const currentIdx = getGroupIdx({ 
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

function updateGoalTag({ goal, tag }: { goal: Goal, tag: Tag }) {
    const isEmpty = tag === null || tag.name === "Empty"

    if (isEmpty) {
        goal.tag = null
    }
    else {
        goal.tag = tag
    }
}

function updateGoalStatus({ goal, status }: { goal: Goal, status: GoalStatus }) {
    const toComplete = status === "accomplished"
    const fromComplete = goal.status === "accomplished" && !toComplete

    if (toComplete) {
        addToChecked(goal, new Date())
    }
    else if (fromComplete) {
        removeFromChecked(goal, goal.completedDate!)
    }
    
    goal.status = status
    goal.completedDate = toComplete ? new Date() : null
}

/* ui utils */

export function setViewGoal(goal: Goal) {
    goalTracker.update(store => ({ ...store, viewGoal: { goal, type: "edit" } }))
}

export function setViewGoalNew({ timeFrame, section, day }: GoalAddContext) {
    const emptyGoal: Goal = {
        id: uuidv4(),
        name: "",
        due: new Date(),
        dueType: "day",
        description: "",
        tag: null,
        creationDate: new Date(),
        tasks: [],
        status: "not-started",
        img: null,
        y_order: {
         default: -1,
         status: -1,
         tag: -1
        },
        q_order: {
         default: -1,
         status: -1,
         tag: -1
        },
        m_order: {
         default: -1,
         status: -1,
         tag: -1
        }
    }

    emptyGoal.due = getDateFromTimeFrame(timeFrame)!
    emptyGoal.dueType = getPeriodType(timeFrame.period)

    if (section?.name === "status") {
        emptyGoal.status = section.valueId as GoalStatus
    }
    else if (section?.name === "tag") {
        const tag = getTagFromId(section.valueId)!
        emptyGoal.tag = tag
    }
    else if (day) {
        emptyGoal.due = day
        emptyGoal.dueType = "day"
    }

    goalTracker.update(store => ({ ...store, viewGoal: { goal: emptyGoal, type: "new" } }))
}

export function closeViewGoal() {
    goalTracker.update(store => ({ ...store, viewGoal: null }))
}

export function getYearProgress(year: number) {
    const yearData = getYearData({ year })
    const totalGoals = yearData.goals.length
    const completedGoals = yearData.goals.filter(goal => goal.status === "accomplished").length

    return completedGoals / totalGoals
}

export function getPeriodData({ year, period }: { year: number, period: string }): {
    goals: Goal[]
    entry: TextEntryOptions | null
    pinnedGoal: Goal | null
} {
    if (period.startsWith("q")) {
        const quarter = parseInt(period.split("q")[1])
        const { goals, entry, pinnedGoal } = getQuarterData({ year, quarter })

        return { goals, entry, pinnedGoal }
    }
    else if (period === "all") {
        const { goals, entry, pinnedGoal } = getYearData({ year })

        return { goals, entry, pinnedGoal }
    }
    else {
        const moIdx = months.findIndex(mo => mo.slice(0, 3).toLowerCase() === period)
        const { goals, entry, pinnedGoal } = getMonthData({ year, moIdx })

        return { goals, entry, pinnedGoal }
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

    let str = getTimeDistanceStr({ date: due, enforce: "d" })
    const isLate = str.includes("ago")

    if (min) {
        str = str.split(" ")[0] + "d"
    }
    if (isLate) {
        return { dueStr: "-" + str.split("ago")[0], isLate: true }
    } 
    else {
        return { dueStr: str }
    }
}

export function saveOptions({ page, view }: { page: GoalsPageOptions, view: GoalsViewOptions }) {
    localStorage.setItem(GOALS_PAGE_STORAGE_ID, JSON.stringify(page))
    localStorage.setItem(GOALS_VIEW_STORAGE_ID, JSON.stringify(view))
}

export function getPageOptions() {
    const page = localStorage.getItem(GOALS_PAGE_STORAGE_ID)
    const view = localStorage.getItem(GOALS_VIEW_STORAGE_ID)

    return {
        page: page ? JSON.parse(page) : null,
        view: view ? JSON.parse(view) : null
    }
}

export function saveHeights(heights: { pinnedHeight: number, upcomingHeight: number, overdueHeight: number }) {
    const page = JSON.parse(localStorage.getItem(GOALS_PAGE_STORAGE_ID)!)
    page.marginLeftView.heights = heights

    localStorage.setItem(GOALS_PAGE_STORAGE_ID, JSON.stringify(page))
}

/* utils */

/**
 * Track an index change for a goal
 */
function trackIdxChange({ goalId, period, grouping, idx }: {
    goalId: string
    period: PeriodType
    grouping: GoalViewSection
    idx: number
}) {
    const pKey = period[0] as "y" | "q" | "m"

    // Initialize update object if needed
    if (!GOALS_TO_UPDATE[goalId]) {
        GOALS_TO_UPDATE[goalId] = { id: goalId }
    }
    
    const update = GOALS_TO_UPDATE[goalId]
    
    if (!update[pKey]) {
        update[pKey] = {}
    }
    const groupKey = grouping === 'default' ? 'd' : 
                     grouping === 'status' ? 's' : 't'
    
    update[pKey]![groupKey] = idx
}


function getPeriodKeys(date: Date) {
    return { 
        y: getDataKey(date, "year"), 
        m: getDataKey(date, "month"),     
        q: getDataKey(date, "quarter") 
    }
}

function vertifyData({ key, data }: { key: string, data: PeriodType }) {
    if (data === "year") {
        YEAR_DATA[key] ||= { entry: getEmptyEntry(), smallImg: "", bannerImg: null, goals: [], pinnedId: null }
    }
    else if (data === "month") {
        MONTH_DATA[key] ||= { entry: getEmptyEntry(), pinnedId: null, goals: [] }
    }
    else {
        QUARTER_DATA[key] ||= { entry: getEmptyEntry(), pinnedId: null, goals: [] }
    }
}

export function findGroupMembers({ goals, grouping, groupName }: {
    goals: Goal[]
    grouping: GoalViewSection
    groupName: string
}) {
    if (groupName === "Empty" && grouping === "tag") {
        return goals.filter(g => (getGroupVal(g, grouping) === null))
    }
    else {
        return goals.filter(g => (getGroupVal(g, grouping) === groupName))
    }
}

export function findGoalGroupNbrs({ goal, section, period }: { 
    goal: Goal 
    section: "default" | "status" | "tag" 
    period: PeriodType
}) {
    const goals = getCacheGoals(goal, period)

    if (section === "status" || section === "tag" && goal.tag) {
        return goals.filter(g => (getGroupVal(g, section) === getGroupVal(goal, section)))
    }
    else if (section === "tag" && !goal.tag) {
        return goals.filter(g => g.tag === null)
    }
    else {
        return goals
    }
}

/**
 * Find a goal's group / section nbrs and idx at that section under a period.
 * 
 * @param param0 
 * @returns 
 */
export function getPeriodNeighbors({ goal, period, grouping }: {
    goal: Goal,
    grouping: GoalViewSection,
    period: PeriodType
}) {
    if (grouping === "status") {
        return {
            nbrs: findGoalGroupNbrs({ goal, section: "status", period }),
            idx: getGroupIdx({ goal, period, grouping: "status" })
        }
    }
    else if (grouping === "tag") {
        return {
            nbrs: findGoalGroupNbrs({ goal, section: "tag", period }),
            idx: getGroupIdx({ goal, period, grouping: "tag" })
        }
    }
    else {
        return {
            nbrs: findGoalGroupNbrs({ goal, section: "default", period }),
            idx: getGroupIdx({ goal, period, grouping: "default" })
        }
    }
}

/**
 * Get a goal's group index at a given period.
 */
export function getGroupIdx({ goal, period, grouping }: {
    goal: Goal
    period: string
    grouping: GoalViewSection
}) {
    const key = `${period[0]}_order` as keyof Goal
    const orderObj = goal[key] as Record<string, number>

    return orderObj[grouping]
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

/**
 * Update a goal's indices.
 * @param param0 
 */
export function updateGoalIdx({ goal, period, grouping, idx }: {
    goal: Goal
    period: PeriodType
    grouping: GoalViewSection
    idx: number
}) {
    const key = `${period[0]}_order` as keyof Goal
    const orderObj = goal[key] as Record<string, number>

    if (orderObj[grouping] !== idx) {
        orderObj[grouping] = idx
        trackIdxChange({ goalId: goal.id, period, grouping, idx })
    }
}

/**
 * Find the grouping value for the goal.
 * (status, tag)
 * 
 * @param goal 
 * @param grouping 
 * @returns 
 */
function getGroupVal(goal: Goal, grouping: GoalViewSection) {
    if (grouping === "status") {
        return goal.status
    }
    else if (grouping === "tag") {
        return goal.tag?.name || null
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