import { getTagFromName } from "./utils-general"

let sectionMap: { [key: string]: number } 
let grouping: "status" | "tag"

export function reorderGoals(args: { 
    srcGoal: Goal, 
    target: Goal | GoalStatus,
    goals: Goal[],
    grouping: "status" | "tag",
    sectionMap: { [key: string]: number } 
}) {        

    const { srcGoal, target, goals, grouping: _grouping, sectionMap: _sectionMap } = args

    sectionMap = _sectionMap
    grouping = _grouping

    const oKey      = grouping as "status" | "tag"
    const toLast    = typeof target === "string"
    
    const srcSec    = goalKeyVal(srcGoal)
    const targetSec = toLast ? target : goalKeyVal(target)

    const srcSecIdx = sectionMap[srcSec]
    const toSecIdx  = sectionMap[targetSec]
    const sameSec   = srcSecIdx === toSecIdx

    const srcOrder  = srcGoal.bOrder[oKey]
    const lastOrder = goals.filter((goal: Goal) => goalKeyVal(goal) === targetSec).length 

    const toIdx     = toLast ? lastOrder : target.bOrder[oKey]
    const direction = (!sameSec ? srcSecIdx < toSecIdx : srcOrder < toIdx) ? "up" : "down"
    const targetOrder = Math.max(toIdx + (direction === "up" && sameSec ? -1 : 0), 0)

    goals
        .filter((goal: Goal) => goalKeyVal(goal) === srcSec)
        .forEach((goal: Goal) => {
            if (direction === "up" && goal.bOrder[oKey] > srcOrder) {
                goal.bOrder[oKey]--
            } 
            else if (!sameSec && direction === "down" && goal.bOrder[oKey] > srcOrder) {
                goal.bOrder[oKey]--
            }
            else if (sameSec && direction === "down" && goal.bOrder[oKey] < srcOrder) {
                goal.bOrder[oKey]++
            }
        })
    goals
        .filter((goal: Goal) => goalKeyVal(goal) === targetSec)
        .forEach((goal: Goal) => {
            if (direction === "up" && goal.bOrder[oKey] >= targetOrder) {
                goal.bOrder[oKey]++
            } 
            else if (!sameSec && direction === "down" && goal.bOrder[oKey] >= targetOrder) {
                goal.bOrder[oKey]++
            }
            else if (sameSec && direction === "down" && goal.bOrder[oKey] <= targetOrder) {
                goal.bOrder[oKey]--
            }
        })

    srcGoal.bOrder[oKey] = targetOrder
    updateSrcGoaOnOrder({ srcGoal, target, grouping })

    return goals
}

function goalKeyVal(goal: Goal) {
    if (grouping === "status") {
        return goal.status as keyof typeof sectionMap
    }
    else {
        return goal.tag!.name as keyof typeof sectionMap
    }
}

function updateSrcGoaOnOrder(args: {
    srcGoal: Goal, target: Goal | GoalStatus, grouping: "status" | "tag"
}) {
    const { srcGoal, target, grouping } = args

    if (grouping === "status") {
        srcGoal.status = typeof target === "string" ? target : target.status
    }
    else {
        srcGoal.tag = typeof target === "string" ? getTagFromName(target)! : target.tag
    }
}

export function getSectionProgress(args: { sortedGoals: Goal[][], secIdx: number }) {
    const { sortedGoals, secIdx } = args
    const section = sortedGoals[secIdx]
    const done = section.filter(goal => goal.status === "accomplished").length
    const total = section.length

    return { done, total }
}

export function sectionGoals(args: { sections: string[], goals: Goal[], grouping: "status" | "tag" }) {
    const { sections, goals, grouping } = args
    const sortedGoals: Goal[][] = []

    sections.forEach((sectionValue: string) => {
        const filteredGoals = goals.filter(goal => {
            if (grouping === "status") {
                return goal.status === sectionValue
            } 
            else if (grouping === "tag") {
                return goal.tag?.name === sectionValue
            }
            return false
        })

        filteredGoals.sort((a, b) => a.bOrder[grouping] - b.bOrder[grouping])
        sortedGoals.push(filteredGoals)
    })

    return sortedGoals
}