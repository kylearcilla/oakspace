import { RoutinesManager } from '$lib/routines-manager'
import { get } from 'svelte/store'
import { describe, expect } from 'vitest'
import { TEST_DAILY_BREAKDOWN, TEST_WEEKLY_BREAKDOWN, TEST_BLOCK_MOVE_TO_NEW_COL, PRESET_ROUTINES, BREAKDOWN_TEST_DAILY_BLOCKS } from './routines.data'
import { DailyRoutinesManager } from '$lib/routines-daily-manager'
import { WeeklyRoutinesManager } from '$lib/routines-weekly-manager'
import { COLOR_SWATCHES } from '$lib/utils-general'

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

function rawDataToBlocks(data: any) {
    return data.map((data: any) => ({ 
        ...data, 
        color: COLOR_SWATCHES.d[0], 
        description: "", tasks: [],
        tag: null,
        activity: data.activity as keyof RoutineCores
    })) as RoutineBlock[]
}

describe('daily - tag', () => {
    const manager = new DailyRoutinesManager()
    let testCase, blocks, breakdown, result

    test('hs student monday routine', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getRoutineTagBreakdown("id" in blocks ? blocks.blocks : blocks as RoutineBlock[])
        expect(result).toEqual(breakdown)
    })

    test('hs student tuesday routine', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getRoutineTagBreakdown("id" in blocks ? blocks.blocks : blocks as RoutineBlock[])
        expect(result).toEqual(breakdown)
    })

    test('hs student saturday routine', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getRoutineTagBreakdown("id" in blocks ? blocks.blocks : blocks as RoutineBlock[])
        expect(result).toEqual(breakdown)
    })
    test('college student monday routine', () => {
        testCase = TEST_DAILY_BREAKDOWN[0]
        blocks = testCase.blocks
        breakdown = testCase.tagBreakdown
        
        result = manager.getRoutineTagBreakdown("id" in blocks ? blocks.blocks : blocks as RoutineBlock[])
        expect(result).toEqual(breakdown)
    })
})

describe('weekly - tag', () => {
    const manager = new WeeklyRoutinesManager()
    let testCase, weekRoutine, breakdown, result

    test('highschool weekly routine breakdown', () => {
        testCase = TEST_WEEKLY_BREAKDOWN[0]
        weekRoutine = testCase.weekRoutine as WeeklyRoutine
        breakdown = testCase.tagBreakdown

        manager.updateCurrentWeekRoutine(weekRoutine)
        result = get(manager.tagBreakdown)

        expect(result).toEqual(breakdown)
    })

    test('college weekly routine breakdown', () => {
        testCase = TEST_WEEKLY_BREAKDOWN[1]
        weekRoutine = testCase.weekRoutine as WeeklyRoutine
        breakdown = testCase.tagBreakdown

        manager.updateCurrentWeekRoutine(weekRoutine)
        result = get(manager.tagBreakdown)

        expect(result).toEqual(breakdown)
    })

})

describe('daily - core', () => {
    test('daily core breakdown - valid', () => {
        const manager = new DailyRoutinesManager()

        let blocks, breakdown, res

        for (let i = 0; i < 3; i++) {
            const testCase = TEST_DAILY_BREAKDOWN[i]
            blocks = testCase.blocks
            blocks = "id" in blocks ? blocks.blocks : blocks
            breakdown = testCase.coreBreakdown

            res = manager.getRoutineCoreBreakdown(blocks as RoutineBlock[])
            
            expect(res).toEqual(breakdown)
        }
    })
    test('daily core breakdown - invalid sleeping / awake', () => {
        const manager = new DailyRoutinesManager()

        const expectSleepAwakeEmpty = (res: RoutineCores) => {
            expect(res.awake.totalTime).toBe(-1)
            expect(res.awake.avgTime).toBe(-1)
            expect(res.awake.total).toBe(-1)

            expect(res.sleeping.totalTime).toBe(-1)
            expect(res.sleeping.avgTime).toBe(-1)
            expect(res.sleeping.total).toBe(-1)
        }

        let testBlocks, breakdown, res

        /* only first block set */
        testBlocks = rawDataToBlocks(BREAKDOWN_TEST_DAILY_BLOCKS[1])
        res = manager.getRoutineCoreBreakdown(testBlocks)

        expectSleepAwakeEmpty(res)

        /* only last block set */
        testBlocks = rawDataToBlocks(BREAKDOWN_TEST_DAILY_BLOCKS[2])
        res = manager.getRoutineCoreBreakdown(testBlocks)

        expectSleepAwakeEmpty(res)

        /* only last first then first set */
        testBlocks = rawDataToBlocks(BREAKDOWN_TEST_DAILY_BLOCKS[3])
        res = manager.getRoutineCoreBreakdown(testBlocks)

        expectSleepAwakeEmpty(res)

        /* only first and last next to each other set */
        testBlocks = rawDataToBlocks(BREAKDOWN_TEST_DAILY_BLOCKS[4])
        res = manager.getRoutineCoreBreakdown(testBlocks)

        expect(res.awake.totalTime).toBe(150)
        expect(res.awake.avgTime).toBe(0)
        expect(res.awake.total).toBe(0)

        expect(res.sleeping.totalTime).toBe(1290)
        expect(res.sleeping.avgTime).toBe(0)
        expect(res.sleeping.total).toBe(0)
    })
})

describe('weekly - core', () => { 
    const manager = new WeeklyRoutinesManager()
    let testCase, weekRoutine, breakdown, result

    test('highschool weekly routine breakdown', () => {
        testCase = TEST_WEEKLY_BREAKDOWN[0]
        weekRoutine = testCase.weekRoutine as WeeklyRoutine
        breakdown = testCase.coreBreakdown

        manager.updateCurrentWeekRoutine(weekRoutine)
        result = get(manager.coreBreakdown)

        expect(result).toEqual(breakdown)
    })
    test('uni weekly routine breakdown', () => {
        testCase = TEST_WEEKLY_BREAKDOWN[1]
        weekRoutine = testCase.weekRoutine as WeeklyRoutine
        breakdown = testCase.coreBreakdown

        manager.updateCurrentWeekRoutine(weekRoutine)
        result = get(manager.coreBreakdown)

        expect(result).toEqual(breakdown)
    })
})

describe('move block into new day column', () => {
    const manager = new RoutinesManager()
    let testCase = TEST_BLOCK_MOVE_TO_NEW_COL[0]
    let blocks: RoutineBlock[] = []
    let resTime = 0

    const processTestBlocks = (blocks: RoutineBlock[]) => {
        return blocks.map((block, idx) => ({
            ...block, id: idx + "",
            height: 0, xOffset: 0, yOffset: 0
        })).sort((a, b) => a.startTime - b.endTime)
    }
    
    test('target start time valid', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[0]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('clash, moved slighly down from top neighbor', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[1]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('clash, moved slighly above from top neighbor', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[2]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('clash, moved way up from top neighbor', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[3]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('clash, moved way down from top neighbor', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[4]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('clash, going up gives a new start time that is closest to desired start time', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[5]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('clash, going down gives a new start time that is closest to desired start time', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[6]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('clash, not space, blocked by the start of day', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[7]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
        }

        resTime = manager.getStartTimeFromDragLiftEdit({
            blocks: processTestBlocks(blocks),
            editId: "x",
            newStartTime: testCase.newStartTime,
            newEndTime: testCase.newEndTime
        })

        expect(resTime).toBe(testCase.resultStartTime)
    })
    test('clash, not space, blocked by the end of day', () => {
        testCase = TEST_BLOCK_MOVE_TO_NEW_COL[8]
        blocks = []

        if ("id" in testCase.blocks) {
            blocks = testCase.blocks.blocks
        }
        else {
            blocks = testCase.blocks as RoutineBlock[]
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

describe('finding closest neighbors of a routine block', () => {
    const blocks = PRESET_ROUTINES.uni[0]
    const manager = new RoutinesManager()

    test("top nbr non-touching, sandwiched", () => {
        const { startTime, endTime } = blocks[2]
        const topNbr = manager.findBlockClosestTopNbr(blocks, startTime, endTime)
        
        expect(topNbr).toBe(blocks[1])
    })
    test("bottom nbr non-touching, sandwiched", () => {
        const { startTime, endTime } = blocks[2]
        const bottomNbr = manager.findBlockClosestBottomNbr(blocks, startTime, endTime)
        
        expect(bottomNbr).toBe(blocks[3])
    })
    test("top nbr touching, sandwiched", () => {
        const { startTime, endTime } = blocks[6]
        const bottomNbr = manager.findBlockClosestTopNbr(blocks, startTime, endTime)
        
        expect(bottomNbr).toBe(blocks[5])
    })
    test("bottom nbr touching, sandwiched", () => {
        const { startTime, endTime } = blocks[6]
        const bottomNbr = manager.findBlockClosestBottomNbr(blocks, startTime, endTime)
        
        expect(bottomNbr).toBe(blocks[7])
    })
    test("topmost", () => {
        const { startTime, endTime } = blocks[0]
        const topNbr = manager.findBlockClosestTopNbr(blocks, startTime, endTime)
        
        expect(topNbr).toBe(null)
    })
    test("bottomost", () => {
        const { startTime, endTime } = blocks[blocks.length - 1]
        const bottomNbr = manager.findBlockClosestBottomNbr(blocks, startTime, endTime)
        
        expect(bottomNbr).toBe(null)
    })
})