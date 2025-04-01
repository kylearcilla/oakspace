import { describe, it, expect, beforeEach } from 'vitest'
import { initGoals } from '$lib/utils-goals'
import { moveGoal, getMonthData, getQuarterData, getYearData } from '$lib/utils-goals'
import type { Goal } from '$lib/types'
import { GOALS } from '$lib/mock-data-goals'

function findGoal(name: string) {
    return GOALS.find(goal => goal.name === name)!
}

function expectIndices({ goal, period, indices }: { 
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

describe('moveGoal', () => {
    initGoals()

    /* default */
    it('default: first to above last', () => {
        let a = findGoal("Finish portfolio webite")
        let b = findGoal("Go hiking in Iceland")
        let c = findGoal("Read 12 Books This Year")
        
        moveGoal({
            srcGoal: a,
            target: c,
            timeFrame: { year: 2025, period: "mar" },
            grouping: "default"
        })
        
        a = findGoal("Finish portfolio webite")
        b = findGoal("Go hiking in Iceland")
        c = findGoal("Read 12 Books This Year")

        expectIndices({ goal: a, period: "mar", indices: [1, -1, -1] })
        expectIndices({ goal: b, period: "mar", indices: [0, -1, -1] })
        expectIndices({ goal: c, period: "mar", indices: [2, -1, -1] })
    })

    it('default: first move to last', () => {
        let a = findGoal("Go hiking in Iceland")
        let b = findGoal("Finish portfolio webite")
        let c = findGoal("Read 12 Books This Year")
        
        moveGoal({
            srcGoal: a,
            target: "default",
            timeFrame: { year: 2025, period: "mar" },
            grouping: "default"
        })
        
        a = findGoal("Go hiking in Iceland")
        b = findGoal("Finish portfolio webite")
        c = findGoal("Read 12 Books This Year")

        expectIndices({ goal: a, period: "mar", indices: [2, -1, -1] })
        expectIndices({ goal: b, period: "mar", indices: [0, -1, -1] })
        expectIndices({ goal: c, period: "mar", indices: [1, -1, -1] })
    })

    it('default: last move to first', () => {
        let a = findGoal("Finish portfolio webite")
        let b = findGoal("Read 12 Books This Year")
        let c = findGoal("Go hiking in Iceland")

        moveGoal({
            srcGoal: c,
            target: a,
            timeFrame: { year: 2025, period: "mar" },
            grouping: "default"
        })

        expectIndices({ goal: a, period: "mar", indices: [1, -1, -1] })
        expectIndices({ goal: b, period: "mar", indices: [2, -1, -1] })
        expectIndices({ goal: c, period: "mar", indices: [0, -1, -1] })

    })

    /* tag  */

    it('status: different', () => {
        // go hiking in Iceland move to in progress (first index)

        let a = findGoal("Go hiking in Iceland")
        let b = findGoal("Read 12 Books This Year")
        let c = findGoal("Finish portfolio webite")

        moveGoal({
            srcGoal: a,
            target: b,
            timeFrame: { year: 2025, period: "mar" },
            grouping: "tag"
        })

        // within month
        expectIndices({ goal: a, period: "mar", indices: [1, -1, -1] })
        expectIndices({ goal: b, period: "mar", indices: [2, -1, -1] })
        expectIndices({ goal: c, period: "mar", indices: [0, -1, -1] })

        // within quarter

        // within year

    })
})