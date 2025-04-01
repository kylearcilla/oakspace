import { GOALS } from "$lib/mock-data-goals"

export function findGoal(name: string) {
    return GOALS.find(goal => goal.name === name)!
}

export function expectIndices({ goal, period, indices }: { 
    goal: Goal, 
    period: string, 
    indices: number[] 
}) {
    const [defaultIdx, statusIdx, tagIdx] = indices
    const orderKey = `${period[0]}_order` as keyof Goal
    const orderObj = goal[orderKey] as Record<string, number>

    if (defaultIdx !== -1) {
        expect(orderObj.default).toBe(defaultIdx)
    }
    if (statusIdx !== -1) {
        expect(orderObj.status).toBe(statusIdx)
    }
    if (tagIdx !== -1) {
        expect(orderObj.tag).toBe(tagIdx)
    }
}