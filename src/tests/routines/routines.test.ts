import { RoutinesManager } from '$lib/routines-manager'
import { get } from 'svelte/store'
import { describe, expect } from 'vitest'
import { TEST_DAILY_BREAKDOWN, TEST_WEEKLY_BREAKDOWN, TEST_BLOCK_MOVE_TO_NEW_COL, PRESET_ROUTINES } from './routines.data'
import { DailyRoutinesManager } from '$lib/routines-daily-manager'
import { WeeklyRoutinesManager } from '$lib/routines-weekly-manager'

const TOTAL_DAY_MINS = 1440
const DAYS_WEEK = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ]

const scrollContainer = document.createElement('div')  // scrollable window
const blocksContainer = document.createElement('div')  // scroll contnet (board of routine blocks)

// render how they would appear (ful-height window)
scrollContainer.style.height = "428px"
scrollContainer.style.width = "750px"
scrollContainer.style.display = "block"

blocksContainer.style.height = "1210px"
blocksContainer.style.width = "750px"
blocksContainer.style.display = "block"

function getBlocksFromFile() {

}

describe('Weekly Tag Breakdown', () => {
    const manager = new DailyRoutinesManager()
    let testCase, blocks, breakdown, result

    test('HS Student Monday routine', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getBlockTagBreakdown("id" in blocks ? blocks.blocks : blocks)
        expect(result).toEqual(breakdown)
    })

    test('HS Student Tuesday routine', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getBlockTagBreakdown("id" in blocks ? blocks.blocks : blocks)
        expect(result).toEqual(breakdown)
    })

    test('HS Student Saturday routine', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getBlockTagBreakdown("id" in blocks ? blocks.blocks : blocks)
        expect(result).toEqual(breakdown)
    })
    test('College Student Monday routine', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getBlockTagBreakdown("id" in blocks ? blocks.blocks : blocks)
        expect(result).toEqual(breakdown)
    })
    test('Busy routine breakdown', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getBlockTagBreakdown("id" in blocks ? blocks.blocks : blocks)
        expect(result).toEqual(breakdown)
    })
})

describe('Weekly Tag Breakdown', () => {
    const manager = new WeeklyRoutinesManager()
    let testCase, weekRoutine, breakdown, result

    test('Highschool weekly routine breakdown.', () => {
        testCase = TEST_WEEKLY_BREAKDOWN[0]
        weekRoutine = testCase.weekRoutine
        breakdown = testCase.tagBreakdown

        manager.updateCurrentWeekRoutine(weekRoutine)
        result = get(manager.tagBreakdown)

        expect(result).toEqual(breakdown)
    })

    test('College weekly routine breakdown.', () => {
        testCase = TEST_WEEKLY_BREAKDOWN[1]
        weekRoutine = testCase.weekRoutine
        breakdown = testCase.tagBreakdown

        manager.updateCurrentWeekRoutine(weekRoutine)
        result = get(manager.tagBreakdown)

        expect(result).toEqual(breakdown)
    })

    test('Busy routine breakdown.', () => {
        testCase = TEST_WEEKLY_BREAKDOWN[1]
        weekRoutine = testCase.weekRoutine
        breakdown = testCase.tagBreakdown

        manager.updateCurrentWeekRoutine(weekRoutine)
        result = get(manager.tagBreakdown)

        expect(result).toEqual(breakdown)
    })
})

// describe('Core Breakdown', () => {
//     test('Daily core breakdown', () => {
//         const manager = new DailyRoutinesManager()

//         let blocks, breakdown, res
//         let i = 0

//         for (let testCase of TEST_DAILY_BREAKDOWN) {
//             blocks = testCase.blocks
//             breakdown = testCase.coreBreakdown

//             res = manager.getBlockCoreBreakdown("id" in blocks ? blocks.blocks : blocks)
            
//             expect(res).toEqual(breakdown)
//             console.log(i++)
//         }
//     })
// })

describe('Move block into new day column', () => {
    const manager = new RoutinesManager()
    let testCase = TEST_BLOCK_MOVE_TO_NEW_COL[0]
    let blocks = []
    let resTime = 0

    const processTestBlocks = (blocks: RoutineBlock[]) => {
        return blocks.map((block, idx) => ({
            ...block, id: idx + "",
            height: 0, xOffset: 0, yOffset: 0
        })).sort((a, b) => a.startTime - b.endTime)
    }
    
    test('Target start time valid', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[0]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('Blocked, moved slighly down from top neighbor.', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[1]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('Blocked, moved slighly above from top neighbor.', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[2]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('Blocked, moved way up from top neighbor.', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[3]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('Blocked, moved way down from top neighbor.', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[4]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('Blocked, going up gives a new start time that is closest to desired start time.', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[5]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('Blocked, going down gives a new start time that is closest to desired start time.', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[6]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('Blocked, not space, blocked by the start of day', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[7]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('Blocked, not space, blocked by the end of day', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[8]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
})

describe('Finding closest neighbors of a routine block', () => {
    const blocks = PRESET_ROUTINES.uni[0]
    const manager = new RoutinesManager()

    test("Top nbr non-touching, sandwiched", () => {
        const { startTime, endTime } = blocks[2]
        const topNbr = manager.findBlockClosestTopNbr(blocks, startTime, endTime)
        
        expect(topNbr).toBe(blocks[1])
    })
    test("Bottom nbr non-touching, sandwiched", () => {
        const { startTime, endTime } = blocks[2]
        const bottomNbr = manager.findBlockClosestBottomNbr(blocks, startTime, endTime)
        
        expect(bottomNbr).toBe(blocks[3])
    })
    test("Top nbr touching, sandwiched", () => {
        const { startTime, endTime } = blocks[6]
        const bottomNbr = manager.findBlockClosestTopNbr(blocks, startTime, endTime)
        
        expect(bottomNbr).toBe(blocks[5])
    })
    test("Bottom nbr touching, sandwiched", () => {
        const { startTime, endTime } = blocks[6]
        const bottomNbr = manager.findBlockClosestBottomNbr(blocks, startTime, endTime)
        
        expect(bottomNbr).toBe(blocks[7])
    })
    test("Topmost", () => {
        const { startTime, endTime } = blocks[0]
        const topNbr = manager.findBlockClosestTopNbr(blocks, startTime, endTime)
        
        expect(topNbr).toBe(null)
    })
    test("Bottomost", () => {
        const { startTime, endTime } = blocks[blocks.length - 1]
        const bottomNbr = manager.findBlockClosestBottomNbr(blocks, startTime, endTime)
        
        expect(bottomNbr).toBe(null)
    })
})