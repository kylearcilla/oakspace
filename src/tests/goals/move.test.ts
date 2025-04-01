import { describe, it, expect, beforeEach } from 'vitest'
import { initGoals } from '$lib/utils-goals'
import { moveGoal, getMonthData, getQuarterData, getYearData } from '$lib/utils-goals'
import type { Goal } from '$lib/types'

describe('moveGoal', () => {
    beforeEach(() => initGoals())

    it('should move goal within same status section', () => {
        // Setup test goals
        const srcGoal: Goal = {
            id: 'test-1',
            name: 'Source Goal',
            status: 'not-started',
            due: new Date(2024, 3, 15), // April 15, 2024
            creationDate: new Date(),
            m_order: { default: 2, status: 2, tag: 0 },
            q_order: { default: 2, status: 2, tag: 0 },
            y_order: { default: 2, status: 2, tag: 0 }
        }

        const targetGoal: Goal = {
            id: 'test-2',
            name: 'Target Goal',
            status: 'not-started',
            due: new Date(2024, 3, 15),
            creationDate: new Date(),
            m_order: { default: 0, status: 0, tag: 0 },
            q_order: { default: 0, status: 0, tag: 0 },
            y_order: { default: 0, status: 0, tag: 0 }
        }

        // Add goals to data
        const monthData = getMonthData({ year: 2024, moIdx: 3 })
        monthData.goals.push(srcGoal, targetGoal)

        // Move source goal before target goal
        moveGoal({
            srcGoal,
            target: targetGoal,
            timeFrame: { year: 2024, period: "4" },
            grouping: "status"
        })

        // Verify indices were updated
        expect(srcGoal.m_order.status).toBe(0)
        expect(targetGoal.m_order.status).toBe(1)
    })

    it('should move goal between different status sections', () => {
        const srcGoal: Goal = {
            id: 'test-3',
            name: 'Source Goal',
            status: 'not-started',
            due: new Date(2024, 3, 15),
            creationDate: new Date(),
            m_order: { default: 1, status: 1, tag: 0 },
            q_order: { default: 1, status: 1, tag: 0 },
            y_order: { default: 1, status: 1, tag: 0 }
        }

        // Add goal to data
        const monthData = getMonthData({ year: 2024, moIdx: 3 })
        monthData.goals.push(srcGoal)

        // Move to end of "in-progress" section
        moveGoal({
            srcGoal,
            target: "in-progress",
            timeFrame: { year: 2024, period: "4" },
            grouping: "status"
        })

        // Verify status and indices were updated
        expect(srcGoal.status).toBe("in-progress")
        expect(srcGoal.m_order.status).toBe(0) // First in new section
        
        // Verify other time periods were updated
        expect(srcGoal.q_order.status).toBe(0)
        expect(srcGoal.y_order.status).toBe(0)
    })

    it('should move goal between tag sections', () => {
        const srcGoal: Goal = {
            id: 'test-4',
            name: 'Source Goal',
            status: 'not-started',
            tag: { id: 'work', name: 'Work', orderIdx: 0, symbol: '' },
            due: new Date(2024, 3, 15),
            creationDate: new Date(),
            m_order: { default: 0, status: 0, tag: 0 },
            q_order: { default: 0, status: 0, tag: 0 },
            y_order: { default: 0, status: 0, tag: 0 }
        }

        // Add goal to data
        const monthData = getMonthData({ year: 2024, moIdx: 3 })
        monthData.goals.push(srcGoal)

        // Move to "personal" tag section
        moveGoal({
            srcGoal,
            target: "personal",
            timeFrame: { year: 2024, period: "4" },
            grouping: "tag"
        })

        // Verify tag and indices were updated
        expect(srcGoal.tag?.name).toBe("personal")
        expect(srcGoal.m_order.tag).toBe(0)
        
        // Verify other time periods were updated
        expect(srcGoal.q_order.tag).toBe(0)
        expect(srcGoal.y_order.tag).toBe(0)
    })

    it('should handle moving goal to end of section', () => {
        const srcGoal: Goal = {
            id: 'test-5',
            name: 'Source Goal',
            status: 'not-started',
            due: new Date(2024, 3, 15),
            creationDate: new Date(),
            m_order: { default: 0, status: 0, tag: 0 },
            q_order: { default: 0, status: 0, tag: 0 },
            y_order: { default: 0, status: 0, tag: 0 }
        }

        const existingGoal: Goal = {
            id: 'test-6',
            name: 'Existing Goal',
            status: 'in-progress',
            due: new Date(2024, 3, 15),
            creationDate: new Date(),
            m_order: { default: 0, status: 0, tag: 0 },
            q_order: { default: 0, status: 0, tag: 0 },
            y_order: { default: 0, status: 0, tag: 0 }
        }

        // Add goals to data
        const monthData = getMonthData({ year: 2024, moIdx: 3 })
        monthData.goals.push(srcGoal, existingGoal)

        // Move to end of "in-progress" section
        moveGoal({
            srcGoal,
            target: "in-progress",
            timeFrame: { year: 2024, period: "4" },
            grouping: "status"
        })

        // Verify moved to end of section
        expect(srcGoal.status).toBe("in-progress")
        expect(srcGoal.m_order.status).toBe(1) // After existing goal
        expect(existingGoal.m_order.status).toBe(0) // Unchanged
    })

    it('should update indices in all time periods when moving between sections', () => {
        const srcGoal: Goal = {
            id: 'test-7',
            name: 'Source Goal',
            status: 'not-started',
            due: new Date(2024, 3, 15),
            creationDate: new Date(),
            m_order: { default: 1, status: 1, tag: 0 },
            q_order: { default: 1, status: 1, tag: 0 },
            y_order: { default: 1, status: 1, tag: 0 }
        }

        // Add goal to all caches
        const monthData = getMonthData({ year: 2024, moIdx: 3 })
        const quarterData = getQuarterData({ year: 2024, quarter: 2 })
        const yearData = getYearData({ year: 2024 })

        monthData.goals.push(srcGoal)
        quarterData.goals.push(srcGoal)
        yearData.goals.push(srcGoal)

        // Move to "in-progress" section
        moveGoal({
            srcGoal,
            target: "in-progress",
            timeFrame: { year: 2024, period: "4" },
            grouping: "status"
        })

        // Verify indices updated in all time periods
        expect(srcGoal.m_order.status).toBe(0)
        expect(srcGoal.q_order.status).toBe(0)
        expect(srcGoal.y_order.status).toBe(0)
    })
})
