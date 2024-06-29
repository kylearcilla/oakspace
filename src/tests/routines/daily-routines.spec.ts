import { RoutinesManager } from "$lib/routines-manager"
import { expect, test } from "@playwright/test"
import { generateRandomString, looseEqualTo, neg } from "../helpers"
import { SET_DAILY_ROUTINES, TEST_DAILY_BREAKDOWN } from "./routines.data"
import { getTimeFromIdx } from "$lib/utils-date"

import { 
    elemTopOffset, elemLeftOffset, 
    dragFromTo as _dragFromTo,
    vertScrollElem,
    isScrolledToEdges,
    epectTextEditor,
    expectComputedStyle,
    toggleDropdown,
    expectAttribute,
    expectToastMsg,
    fillInput,
    type DragPoint,
    type DragPosition,
} from "../pw-helpers"

import { 
    exectRoutinesPageDetails,
    confirmDelete, 
    expectEditModal, 
    closeEditBlockModal, 
    topOffsetFromTime,
    getBlockViewPortPos,
    expectBlockElemTimePeriod,
    getContainerData,
    expectBlockElem,
    deleteBlock,
    getPositionFromTimeDay,
    toggleAllowScroll,
    liftBlockToTime,
    liftBlockFromBlock, 
    makeBlock as _makeBlock,
    duplicateBlock,
    getBlockElem,
    closeDupBlock,
    expectDupBlock,
    expectBlockElemAt,
    expectBtnPlacement,
    confirmDiscard,
    expectEditModalToBe,
    fillEditModal,
    expectCoreBreakdown,
    stretchBlock,
    updateCoreData,
    liftBlock as _liftBlock,
    expectTagBreakdown,
    updateTagData,
    emptyTestData,
    makeRoutine,
    expectRoutinePage
} from "./helpers"
import { COLOR_SWATCHES } from "$lib/utils-general"

/* Constants */
const { 
    NEW_STRETCH_DRAG_DIST_THRESHOLD, 
    BLOCK_EDGE_THRESHOLD
} = RoutinesManager

// certain actions will only work after a bottom scroll if system has to wait after a scroll
const AFTER_BOTTOM_SCROLL_DELAY = 800

export async function dragFromTo(options: {
    origin: DragPoint,
    dragTo: DragPoint | DragPosition[],
    absolute?: boolean,
    scrollTop?: number,
    scrollLeft?: number,
    elem: any, 
    page: any,
    mousedown?: boolean
    mouseup?: boolean
    delay?: number
    steps?: number
}) {
    await _dragFromTo({
        ...options,
        origin: {
            ...options.origin,
            offset: {
                x: (options.origin.offset?.x ?? 0) + 45,
                y: options.origin.offset?.y ?? 0,
            }
        }
    })
}

export async function liftBlock(options: { 
    blockId: string,
    toTime: { h: number, m: number, ampm: "am" | "pm" }
    fromOffset?: { x: number, y: number }
    toOffset?: { x: number, y: number }
    toColIdx?: number,
    vScrollTo?:  "top" | "bottom" | "middle" | number, 
    vScrollOffset?: number
    vScrollDelay?: number
    up?: boolean,
    steps?: number
    delay?: number
    mouseup?: boolean
    page: any
}) {
    await _liftBlock({
        ...options,
        fromOffset: {
            ...options.fromOffset,
            x: (options.fromOffset?.x ?? 0) + 45,
            y: options.fromOffset?.y ?? 0
        },
        toOffset: {
            ...options.toOffset,
            x: (options.toOffset?.x ?? 0) + 45 + 29,
            y: options.toOffset?.y ?? 0
        }
    })
}

export async function makeBlock(options: {
    colIdx?: number,
    start: { h: number, m: number, ampm: "am" | "pm" },
    end: { h: number, m: number, ampm: "am" | "pm" },
    close?: boolean,
    vScrollTo?:  "top" | "bottom" | "middle" | number, 
    vScrollOffset?: number
    vScrollDelay?: number
    startOffset?: { x: number, y: number }
    endOffset?: { x: number, y: number }
    doCancel?: boolean
    page: any
}) {
    await _makeBlock({
        ...options,
        startOffset: {
            ...options.startOffset,
            x: (options.startOffset?.x ?? 0) + 45,
            y: options.startOffset?.y ?? 0
        },
        endOffset: {
            ...options.endOffset,
            x: (options.endOffset?.x ?? 0) + 45,
            y: options.endOffset?.y ?? 0
        }
    })
}

test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/home/routines/daily')
})

test.describe("making a routine", () => {
    /* Submission */
    test('empty + new routine + is in view', async ({ page }) => {
        if (!await emptyTestData(page)) return

        await makeRoutine({
            page,
            title: "Hello World",
            description: "New Routine",
            forWeek: false
        })
        await expectRoutinePage({
            page,
            title: "Hello World",
            description: "New Routine",
            routines: ["Hello World"],
            expectEmptyBreakdown: true,
            forWeek: false
        })
    })
    test('no description', async ({ page }) => {
        await makeRoutine({
            page,
            title: "Hello World",
            forWeek: false
        })

        await expectAttribute({
            attr: "data-placeholder",
            value: "Type description here...",
            selector: ".routine__description",
            page,
        })
    })
    test('no name enter visible', async ({ page }) => {
        await page.locator('.routines__add-new-routine').dispatchEvent("click")

        await makeRoutine({ page, forWeek: false })
        await expect(page.locator('form')).toContainText('Title is empty')
    })

    /* Cancellation */
    test('no edit - cancel', async ({ page }) => {
        if (!await emptyTestData(page)) return

        // cancel pressed
        await makeRoutine({ page, doSave: false, doCancel: true, forWeek: false })
        await expect(page.locator('.confirm')).not.toBeAttached()
        await expect(page.locator('.new-routine')).not.toBeAttached()
        await exectRoutinesPageDetails(false, page)

        // short cut
        await makeRoutine({ page, doSave: false, forWeek: false })
        await page.keyboard.press('Escape')
        await expect(page.locator('.confirm')).not.toBeAttached()
        await expect(page.locator('.new-routine')).not.toBeAttached()
        await exectRoutinesPageDetails(false, page)

        // click outside
        await makeRoutine({ page, doSave: false, forWeek: false })
        await page.mouse.down()
        await page.mouse.up()
        
        await expect(page.locator('.confirm')).not.toBeAttached()
        await expect(page.locator('.new-routine')).not.toBeAttached()
    })
    test('edit - cancel confirm', async ({ page }) => {
        if (!await emptyTestData(page)) return

        await makeRoutine({ page, title: "New Routine", doSave: false, doCancel: true, forWeek: false })
        await expect(page.locator('.confirm')).toBeAttached()

        await page.locator(".confirm__ok-btn").click()
        expect(page.locator('.confirm')).not.toBeAttached()

        await exectRoutinesPageDetails(false, page)
    })

    /* Boundaries */
    test('bounds: max title and description', async ({ page }) => {
        if (!await emptyTestData(page)) return

        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        const title = generateRandomString({ length: MAX_TITLE, includeEmojis: true, excludeEntities: true  })

        // the received text will always have certain chars as HTML Entities instead of literal values from a contenteditable
        const description = generateRandomString({ length: MAX_DESCR, includeEmojis: true, excludeEntities: true })

        await makeRoutine({ page, title, description, forWeek: false })
        await expectRoutinePage({ page, title, description, forWeek: false, })
    })
    test('over bounds: cut off', async ({ page }) => {
        if (!await emptyTestData(page)) return

        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        const title = generateRandomString({ length: MAX_TITLE + 12, includeEmojis: true, excludeEntities: true  })
        const description = generateRandomString({ length: MAX_DESCR + 12, includeEmojis: true, excludeEntities: true })

        await makeRoutine({ page, title, description, forWeek: false })
        await expectRoutinePage({ 
            page, forWeek: false,
            title: title.slice(0, -12), 
            description: description.slice(0, -12), 
        })
    })

    /* Editing */
    test('title + description update', async ({ page }) => {
        if (!await emptyTestData(page)) return
        await makeRoutine({ page, title: "Old Title", description: "Old Description", forWeek: false })

        await fillInput({ 
            query: ".routine__title", 
            text: "New Title", 
            enter: true, 
            empty: true,
            page 
        })
        await fillInput({ 
            query: ".routine__description", 
            text: "New Description", 
            enter: true, 
            empty: true,
            page 
        })
        await expectRoutinePage({ 
            page, 
            forWeek: false,
            title: "New Title", 
            description: "New Description", 
            routines: ["New Title"]
        })
    })
    test('title + description update - max cut offs', async ({ page }) => {
        if (!await emptyTestData(page)) return
        
        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        await makeRoutine({ page, title: "Old Title", description: "Old Description", forWeek: false })

        const newTitle = generateRandomString({ length: MAX_TITLE + 12, includeEmojis: true, excludeEntities: true  })
        const newDescription = generateRandomString({ length: MAX_DESCR + 12, includeEmojis: true,  excludeEntities: true })

        await fillInput({ 
            elem: page.getByLabel('Title'), 
            text: newTitle, 
            enter: true, 
            empty: true,
            page 
        })
        await fillInput({ 
            elem: page.getByLabel('Description'), 
            text: newDescription, 
            enter: true, 
            empty: true,
            page 
        })
        await expectRoutinePage({ 
            page, 
            forWeek: false,
            title: newTitle.slice(0, -12), 
            description: newDescription.slice(0, -12), 
            routines: [newTitle.slice(0, -12)]
        })
    })
})
test.describe("multiple routines", () => {
    const createThreeRoutines = async (page: any) => {
        await makeRoutine({
            page,
            title: "Routine #1",
            description: "1",
            forWeek: false
        })
        await makeRoutine({
            page,
            title: "Routine #2",
            description: "2",
            forWeek: false
        })
        await makeRoutine({
            page,
            title: "Routine #3",
            forWeek: false
        })
    }
    test("make three routines", async ({ page }) => {
        if (!await emptyTestData(page)) return
        await createThreeRoutines(page)

        // check
        await expectRoutinePage({
            page,
            title: "Routine #1",
            description: "1",
            routines: ["Routine #1", "Routine #2", "Routine #3"],
            expectEmptyBreakdown: true,
            forWeek: false,
            count: 3
        })

        await page.locator('li').filter({ hasText: 'Routine #2' }).click()
        await expectRoutinePage({
            page,
            title: "Routine #2",
            description: "2",
            forWeek: false,
            expectEmptyBreakdown: false,
        })

        await page.locator('li').filter({ hasText: 'Routine #3' }).click()
        await expectRoutinePage({
            page,
            title: "Routine #3",
            forWeek: false,
            expectEmptyBreakdown: false,
        })
        
        await expectAttribute({
            attr: "data-placeholder",
            value: "Type description here...",
            selector: ".routine__description",
            page,
        })
    })
    test("new titles and descriptions", async ({ page }) => {
        if (!await emptyTestData(page)) return
        await createThreeRoutines(page)

        // routine #1
        await page.locator('li').filter({ hasText: 'Routine #1' }).click()
        await fillInput({ 
            query: ".routine__title", 
            text: "New Routine #1", 
            enter: true, 
            empty: true,
            page 
        })
        await fillInput({ 
            query: ".routine__description", 
            text: "New Routine #1 Description", 
            enter: true, 
            empty: true,
            page 
        })
        await expectRoutinePage({ 
            page, 
            title: "New Routine #1", 
            description: "New Routine #1 Description",
            forWeek: false
        })

        // routine #2
        await page.locator('li').filter({ hasText: 'Routine #2' }).click()
        await fillInput({ 
            query: ".routine__title", 
            text: "New Routine #2", 
            enter: true, 
            empty: true,
            page 
        })
        await fillInput({ 
            query: ".routine__description", 
            text: "New Routine #2 Description", 
            enter: true, 
            empty: true,
            page 
        })
        await expectRoutinePage({ 
            page, 
            title: "New Routine #2", 
            description: "New Routine #2 Description",
            forWeek: false
        })

        // check list
        await expectRoutinePage({ 
            page, 
            routines: ["New Routine #1", "New Routine #2", "Routine #3"],
            forWeek: false
        })
    })
    test("setting view routines", async ({ page }) => {
        await page.goto('http://localhost:5173/home/routines/daily')

        if (!await emptyTestData(page)) return
        await createThreeRoutines(page)

        // choose 2 as current
        await page.locator('li').filter({ hasText: 'Routine #2' }).click({ button: "right" })
        await page.getByRole('button', { name: 'View Routine' }).click()

        await expectRoutinePage({ 
            page, 
            title: "Routine #2", 
            description: "2",
            forWeek: false
        })
    })
    test("deleting all", async ({ page }) => {
        await page.goto('http://localhost:5173/home/routines/daily')

        if (!await emptyTestData(page)) return
        await createThreeRoutines(page)

        // delete #1
        await page.locator('li').filter({ hasText: 'Routine #1' }).click({ button: "right" })
        await page.getByRole('button', { name: 'Delete Routine' }).click()
        await confirmDelete(page)

        await expectRoutinePage({ 
            page, 
            routines: ["Routine #2", "Routine #3"],
            expectEmptyBreakdown: false,
            forWeek: false
        })
        await exectRoutinesPageDetails(false, page)

        // delete #2
        await page.locator('li').filter({ hasText: 'Routine #2' }).click({ button: "right" })
        await page.getByRole('button', { name: 'Delete Routine' }).click()
        await confirmDelete(page)

        await expectRoutinePage({ 
            page, 
            routines: ["Routine #3"],
            expectEmptyBreakdown: false,
            forWeek: false
        })

        // delete #3
        await page.locator('li').filter({ hasText: 'Routine #3' }).click({ button: "right" })
        await page.getByRole('button', { name: 'Delete Routine' }).click()
        await confirmDelete(page)

        await expectRoutinePage({ 
            page, 
            expectEmptyBreakdown: false,
            routines: [],
            forWeek: false
        })
    })
})
test.describe("display", () => {
    test("blocks are properly rendered", async ({ page }) => {
        const { blocksBox } = await getContainerData(page)
        const routines = SET_DAILY_ROUTINES
        const testRoutinesIndices = [0, 7, 8, 9, 10, 11, 12]

        for (let testRoutineIdx of testRoutinesIndices) {
            const routine = routines[testRoutineIdx]
            const blocks  = routine.blocks.sort((a, b) => a.startTime - b.startTime)

            await page.locator('li').filter({ hasText: routine.name }).click()

            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i]
                const expectedLeft = 30
                const expectedTop  = (block.startTime / 1440) * blocksBox!.height

                const blockElem = page.locator(`[id="rblock--${i}"]`)

                const actualLeft = await elemLeftOffset(blockElem)
                const actualTop = await elemTopOffset(blockElem)

                console.log(actualTop, expectedTop)
                expect(looseEqualTo(actualTop, expectedTop, 1)).toBeTruthy()
                expect(looseEqualTo(actualLeft, expectedLeft, 1)).toBeTruthy()
            }
        }
    })
    test("narrow view", async ({ page }) => {
        await page.setViewportSize({ width: 860, height: 700 })
        await exectRoutinesPageDetails(false, page)
        
        let blockElem = page.locator(`[id="rblock--0"]`)
        let actualLeft = await elemLeftOffset(blockElem)

        expect(actualLeft).toBe(30)

        await page.setViewportSize({ width: 600, height: 700 })
        blockElem = page.locator(`[id="rblock--0"]`)
        actualLeft = await elemLeftOffset(blockElem)

        expect(actualLeft).toBe(8)

        await page.setViewportSize({ width: 500, height: 700 })

    })
    test("time and grid display check", async ({ page }) => {
        const { blocksBox } = await getContainerData(page)
        
        let hourBlocks = page.locator('.hour-blocks__block')
        expect(await hourBlocks.count()).toBe(24)

        // left hour blocks
        for (let i = 0; i <= 23; i++) {
            if (i === 0) continue

            const block = hourBlocks.nth(i)
            const timeStr = getTimeFromIdx(i, true)
            const topOffset = ((60 / 1440) * blocksBox!.height) * i
            const actual    = await elemTopOffset(block)

            expect(looseEqualTo(actual, topOffset, 2)).toBeTruthy()
            expect(block).toContainText(timeStr)
        }

        //  horizontal dividers
        let hozDividers = page.locator('.wk-grid__hoz-line')
        expect(await hozDividers.count()).toBe(24)

        for (let i = 1; i <= 23; i++) {
            const divider = hozDividers.nth(i)
            const topOffset = ((60 / 1440) * blocksBox!.height) * i

            expect(looseEqualTo(await elemTopOffset(divider), topOffset, 3)).toBeTruthy()
        }

        // vert divider
        const vertDividers = page.locator('.wk-grid__vert-line')
        const divider = vertDividers.nth(0)

        expect(await vertDividers.count()).toBe(1)
        expect(looseEqualTo(await elemLeftOffset(divider), 0, 0)).toBeTruthy()
    })
})
test.describe("strech edits", () => {
    test("new: drag boundary check", async ({ page }) => {
        const { container, blocksContainer } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top" })

        // click
        await dragFromTo({
            origin: { pos: "top-left" },
            dragTo: { 
                pos: { x: 0, y: 0 } 
            },
            elem: blocksContainer,
            page
        })
        await expect(page.locator(".edit-routine")).not.toBeAttached()

        // too short drag down
        await dragFromTo({
            origin: { pos: "top-left" },
            dragTo: { 
                pos: { x: 0, y: NEW_STRETCH_DRAG_DIST_THRESHOLD - 1 } 
            },
            elem: blocksContainer,
            page
        })
        await expect(page.locator(".edit-routine")).not.toBeAttached()

        // too short drag up
        await dragFromTo({
            origin: { pos: "top-left", offset: { x: 0, y: NEW_STRETCH_DRAG_DIST_THRESHOLD } },
            dragTo: { 
                pos: { x: 0, y: neg(NEW_STRETCH_DRAG_DIST_THRESHOLD - 1) } 
            },
            elem: blocksContainer,
            page
        })
        await expect(page.locator(".edit-routine")).not.toBeAttached()

        // drag just enough down
        await dragFromTo({
            origin: { pos: "top-left" },
            dragTo: { 
                pos: { x: 0, y: NEW_STRETCH_DRAG_DIST_THRESHOLD } 
            },
            elem: blocksContainer,
            page
        })
        await expectEditModal(true, page)
        await closeEditBlockModal({ page })

        // drag just enough up
        await dragFromTo({
            origin: { 
                pos: "top-left", offset: { x: 0, y: NEW_STRETCH_DRAG_DIST_THRESHOLD }  
            },
            dragTo: { 
                pos: { x: 0, y: neg(NEW_STRETCH_DRAG_DIST_THRESHOLD) } 
            },
            elem: blocksContainer,
            page
        })
        await expectEditModal(true, page)
        await closeEditBlockModal({ page })
    })

    test("new: near border edits", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Empty' }).click()

        const { container, blocksContainer, blocksBox } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top" })
        const { height } = blocksBox

        let scrollTop = await vertScrollElem({ elem: container, to: "top" })

        /* Top Left */

        /* 1. dragging from the very top */
        await dragFromTo({
            origin: { pos: "top-left" },
            dragTo: { pos: {  x: 0, y: 100 } },
            elem: container, page
        })

        await expectEditModalToBe({ startTime: "12:00 AM", page })

        /* 2. max possible block */
        await dragFromTo({
            origin: {
                pos: { 
                    x: "top-left",
                    y: topOffsetFromTime({ time: { h: 12, m: 0, ampm: "am" }, blocksHeight: height, scrollTop })
                }
            },
            dragTo: { 
                pos: { 
                    x: "top-left",
                    y: topOffsetFromTime({ time: { h: 11, m: 59, ampm: "pm" }, blocksHeight: height, scrollTop })
                }
            },
            page, elem: container, absolute: true
        })

        await expectEditModalToBe({ startTime: "12:00 AM", endTime: "11:59 PM", page })

        /* 3. hit the border up perfect */
        await dragFromTo({
            origin: {
                pos: { 
                    x: "top-left", y: NEW_STRETCH_DRAG_DIST_THRESHOLD
                }
            },
            dragTo: { 
                pos: { 
                    x: 0, y: neg(NEW_STRETCH_DRAG_DIST_THRESHOLD) 
                }
            },
            elem: container, page
        })

        await expectEditModalToBe({ startTime: "12:00 AM", endTime: "12:15 AM", page })

        scrollTop = await vertScrollElem({ 
            elem: container, to: "bottom", delay: AFTER_BOTTOM_SCROLL_DELAY
        })

        /* Bottom Left */

        /* 1. dragging from the very bottom */
        await dragFromTo({
            origin: {
                pos: "bottom-left",
                offset: { x: 0, y: -1 }
            },
            dragTo: { 
                pos: {  x: 0, y: -100 }
            },
            elem: container, page
        })

        await expectEditModalToBe({ endTime: "11:59 PM", page })


        return

        /* 2. 15 min from (not possible: 11:45 - 11:59 which is below min requirement so will be 11:40 - 11:55) */
        await dragFromTo({
            origin: { 
                pos: "bottom-left", 
                offset: { x: 0, y: -(NEW_STRETCH_DRAG_DIST_THRESHOLD)} 
            },
            dragTo: { 
                pos: { 
                    x: 0, y: NEW_STRETCH_DRAG_DIST_THRESHOLD
                }
            },
            elem: blocksContainer,
            page
        })

        await expectEditModalToBe({ notAttached: true, page })

        return

        /* 3. bottom - min possible block */
        await makeBlock({
            start: { h: 11, m: 40, ampm: "pm" }, end: { h: 11, m: 59, ampm: "pm" },
            colIdx: 0, close: false, page
        })

        await expectEditModalToBe({ startTime: "11:40 PM", endTime: "11:59 PM", page })

        /* 4. bottom - max possible block from the bottom */
        await makeBlock({
            start: { h: 11, m: 59, ampm: "pm" },  end: { h: 12, m: 0, ampm: "am" },
            startOffset: { x: 0, y: -2 },
            colIdx: 0, close: false, page
        })
        await expectEditModalToBe({ startTime: "12:00 AM", endTime: "11:59 PM", page })

        /* Right Side */

        /* 5. dragging from the very top right */
        scrollTop = await vertScrollElem({ elem: container, to: "top" })

        await dragFromTo({
            origin: {
                pos: "top-right",
                offset: { x: -18, y: 0 }  // for some reason we have to set an offset, even though the x values (w/o offset) work for creating a block (look pointer event in manager)
            },
            dragTo: { 
                pos: { x: 0, y: 100 }
            },
            elem: container, page
        })
        await expectEditModalToBe({ startTime: "12:00 AM", page })

        /* 6. dragging from the very bottom right */
        scrollTop = (await vertScrollElem({ elem: container, to: "bottom", delay: AFTER_BOTTOM_SCROLL_DELAY }))

        await dragFromTo({
            origin: {
                pos: "bottom-right",
                offset: { x: -18, y: -1 }
            },
            dragTo: { 
                pos: {  x: 0, y: -100 }
            },
            elem: container, page
        })
        await expectEditModalToBe({ endTime: "11:59 PM", page })
    })

    test("new stretch pivot points", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Routine 1.0' }).click()
        const { container, } = await getContainerData(page)

        /* new stretch - down to up w no space */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 7, m: 10, ampm: "am" }, absolute: true, page }),
            },
            dragTo: [ { x: 0, y: 70 }, { x: 0, y: -90 } ],
            steps: 20,
            page, elem: container
        })
        
        await expectEditModalToBe({ startTime: "7:10 AM", endTime: "7:25 AM", page })

        /* new stretch - down to up w space */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 7, m: 15, ampm: "am" }, absolute: true, page }),
            },
            dragTo: [ { x: 0, y: 70 }, { x: 0, y: -90 } ],
            page, elem: container
        })

        await expectEditModalToBe({ startTime: "7:00 AM", endTime: "7:15 AM", page })
        
        /* new stretch - up to down wo space */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 8, m: 40, ampm: "am" }, absolute: true, page }),
            },
            dragTo: [ { x: 0, y: -70 }, { x: 0, y: 90 } ],
            page, elem: container
        })

        await expectEditModalToBe({ startTime: "8:25 AM", endTime: "8:40 AM", page })

        /* new stretch - up to down w space */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 8, m: 30, ampm: "am" }, absolute: true, page }),
            },
            dragTo: [ { x: 0, y: -70 }, { x: 0, y: 90 } ],
            page, elem: container
        })

        await expectEditModalToBe({ startTime: "8:30 AM", endTime: "8:45 AM", page })
        return
    })

    test("new: multi-block, inbetween bounds", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Schoolday 1.0' }).click()
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })

        /* just enough space - stretch down */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 5, m: 45, ampm: "pm" }, absolute: true, page }),
                offset: { x: 0, y: -2 }
            },
            dragTo: [ { x: 0, y: 70 } ],
            steps: 20,
            page, elem: container
        })

        await expectEditModalToBe({ startTime: "5:45 PM", endTime: "6:00 PM", page })


        /* no possible - stretch down */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 5, m: 50, ampm: "pm" }, absolute: true, page }),
                offset: { x: 0, y: -2 }
            },
            dragTo: [ { x: 0, y: 70 } ],
            steps: 20,
            page, elem: container
        })

        await expectEditModalToBe({ notAttached: true, page })

        /* just enough space - stretch up */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 6, m: 0, ampm: "pm" }, absolute: true, page }),
                offset: { x: 0, y: -2 }
            },
            dragTo: [ { x: 0, y: -50 } ],
            steps: 20,
            page, elem: container
        })
        
        await expectEditModalToBe({ startTime: "5:45 PM", endTime: "6:00 PM", page })

        /* no space possible - stretch up */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 5, m: 50, ampm: "pm" }, absolute: true, page }),
                offset: { x: 0, y: -2 }
            },
            dragTo: [ { x: 0, y: -50 } ],
            steps: 20,
            page, elem: container
        })
        
        await expectEditModalToBe({ notAttached: true, page })

    })

    test("new: multi-block, above a block", async ({ page }) => {
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })

        /* right above + stretch up + block above  */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 7, m: 30, ampm: "am" }, absolute: true, page }),
            },
            dragTo: [ { x: 0, y: -15 } ],
            steps: 20,
            page, elem: container
        })
        await expectEditModalToBe({ startTime: "7:15 AM", endTime: "7:30 AM", page })

        /* right above + stretch up + clash + block above  */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 7, m: 30, ampm: "am" }, absolute: true, page }),
            },
            dragTo: [ { x: 0, y: -70 } ],
            steps: 20,
            page, elem: container
        })
        await expectEditModalToBe({ startTime: "7:00 AM", endTime: "7:30 AM", page })
    })

    test("old: under a block", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()
        const { container } = await getContainerData(page)
        
        let scrollTop = await vertScrollElem({ elem: container, to: 200 })

        /* stretch up */
        let blockTopPos = await getBlockViewPortPos({ 
            page, id: "rblock--3", from: "top", scrollOffset: false
        })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "9:15 AM", end: "11:30 AM", blockId: "rblock--3", page })


        /* stretch up + clash */
        blockTopPos = await getBlockViewPortPos({ 
            page, id: "rblock--2", from: "top", scrollOffset: false
        })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "7:50 AM", end: "9 AM", blockId: "rblock--2", page })

        /* no space above + stretch up */
        blockTopPos = await getBlockViewPortPos({ 
            page, id: "rblock--1", from: "top", scrollOffset: false
        })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "7:30 AM", end: "7:50 AM", blockId: "rblock--1", page })

        /* stretch up to max */
        blockTopPos = await getBlockViewPortPos({ page, id: "rblock--0", from: "top", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -1000 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "12 AM", end: "7:30 AM", blockId: "rblock--0", page })
    })

    test("old: above a block", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()

        const container       = page.locator('.routine-blocks-container')!
        const blocksContainer = page.locator('.routine-blocks')!
        const blocksBox       = (await blocksContainer.boundingBox())!
        const { height, width } = blocksBox
        
        let scrollTop = await vertScrollElem({ elem: container, to: 300, delay: 800 })

        /* stretch down */
        let blockTopPos = await getBlockViewPortPos({ page, id: "rblock--3", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "9:30 AM", end: "11:45 AM", blockId: "rblock--3", page })

        /* stretch up + clash */
        blockTopPos = await getBlockViewPortPos({ page, id: "rblock--2", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 50 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "8 AM", end: "9:30 AM", blockId: "rblock--2", page })

        /* no space above + stretch down */
        blockTopPos = await getBlockViewPortPos({ page, id: "rblock--5", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "2 PM", end: "4 PM", blockId: "rblock--5", page })

        /* stretch up to max */
        scrollTop = await vertScrollElem({ elem: container, to: "bottom" })
        blockTopPos = await getBlockViewPortPos({ page, id: "rblock--12",from:  "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 100 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "11 PM", end: "11:59 PM", blockId: "rblock--12", page })
    })

    test("old: stretch pivot points", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()

        const container       = page.locator('.routine-blocks-container')!
        
        let scrollTop = await vertScrollElem({ elem: container, to: 200, delay: 800 })

        /* down to up w no space */
        let gymPos = await getBlockViewPortPos({ page, id: "rblock--2", from: "bottom", scrollOffset: false })
        let blockPos = await getBlockViewPortPos({ page, id: "rblock--4", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: gymPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 20 }, { x: 0, y: -20 }, { x: 0, y: -100 }, ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "8 AM", blockId: "rblock--2", page })

        /* down to up w space */
        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 20 }, { x: 0, y: -20 }, { x: 0, y: -75 }, ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "11:30 AM", end: "11:45 AM", blockId: "rblock--4", page })


        await page.locator('li').filter({ hasText: 'Uni Grind Weekday' }).click()
        scrollTop = await vertScrollElem({ elem: container, to: 200, delay: 800 })

        /* up to down wo space */
        blockPos = await getBlockViewPortPos({ page, id: "rblock--5", from: "top", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -8 }, { x: 0, y: +8 }, { x: 0, y: 30 }, ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "12:55 PM", end: "1:10 PM", blockId: "rblock--5", page })

        /* up to down w space */
        scrollTop = await vertScrollElem({ elem: container, to: "bottom", delay: 800 })
        blockPos = await getBlockViewPortPos({ page, id: "rblock--8", from: "top", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: 300 }, ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "7:10 PM", end: "8 PM", blockId: "rblock--8", page })
    })
})
test.describe("lift edits", () => {
    test("correct edits state", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()
        const container       = page.locator('.routine-blocks-container')!
        
        let scrollTop = await vertScrollElem({ elem: container, to: 0, delay: 800 })

        /* stretch up, right below threshold */
        let blockPos = await getBlockViewPortPos({ page, id: "rblock--0", from: "top" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: BLOCK_EDGE_THRESHOLD - 1 } },
            dragTo: [ { x: 0, y: (-5 - BLOCK_EDGE_THRESHOLD) } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "6:55 AM", blockId: "rblock--0", page })

        /* stretch down right on threshold */
        blockPos = await getBlockViewPortPos({ page, id: "rblock--2", from: "bottom" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: -1 - BLOCK_EDGE_THRESHOLD } },
            dragTo: [ { x: 0, y: 5 + BLOCK_EDGE_THRESHOLD } ],
            page, elem: container, scrollTop
        })
        
        await expectBlockElemTimePeriod({ end: "9:05 AM", blockId: "rblock--2", page })

        /* lift up, right passed top threshold */
        blockPos = await getBlockViewPortPos({ page, id: "rblock--0", from: "top" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: BLOCK_EDGE_THRESHOLD + 1 } },
            dragTo: [ { x: 0, y: -11 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "6:50 AM", end: "7:25 AM",  blockId: "rblock--0", page })

        /* lift down, right passed bottom threshold */
        blockPos = await getBlockViewPortPos({ page, id: "rblock--2", from: "bottom" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: -1 - BLOCK_EDGE_THRESHOLD - 1 } },
            dragTo: [ { x: 0, y: 10 } ],
            page, elem: container, scrollTop
        })
        
        await expectBlockElemTimePeriod({ start: "8:10 AM", end: "9:10 AM", blockId: "rblock--2", page })

        /* lift right edge */
        blockPos = await getBlockViewPortPos({ page, id: "rblock--0", from: "right" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: -1, y: 0 } },
            dragTo: [ { x: 0, y: -15 } ],
            page, elem: container, scrollTop
        })
        
        await expectBlockElemTimePeriod({ start: "6:40 AM", end: "7:15 AM", blockId: "rblock--0", page })

        /* lift left edge */
        blockPos = await getBlockViewPortPos({ page, id: "rblock--0", from: "left" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 1, y: 0 } },
            dragTo: [ { x: 0, y: -15 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "6:30 AM", end: "7:05 AM", blockId: "rblock--0", page })
    })
    test("correct time", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Empty' }).click()

        const { container, containerBox } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })

        await makeBlock({
            start: { h: 6, m: 0, ampm: "am" },
            end: { h: 7, m: 0, ampm: "am" },
            page
        })

        /* move around */
        await liftBlock({
            blockId: "rblock--0",
            toTime: { h: 5, m: 0, ampm: "am" },
            steps: 10,
            mouseup: false,
            page
        })
        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 5, m: 10, ampm: "am" }, endTime: { h: 6, m: 10, ampm: "am" },
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 5, m: 10, ampm: "am" }, endTime: { h: 6, m: 10, ampm: "am" },
            page
        })

        /* top left */
        await liftBlock({
            blockId: "edit-block",
            toTime: { h: 12, m: 0, ampm: "am" },
            toOffset: { x: -30, y: -30 },
            steps: 10,
            mouseup: false,
            page
        })
        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 12, m: 0, ampm: "am" }, endTime: { h: 1, m: 0, ampm: "am" },
            page
        })

        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 12, m: 0, ampm: "am" }, endTime: { h: 1, m: 0, ampm: "am" },
            x: 30 + 45,
            page
        })

        /* top right */
        await liftBlock({
            blockId: "edit-block",
            toTime: { h: 12, m: 0, ampm: "am" },
            toOffset: { x: containerBox.width, y: -10 },
            steps: 10,
            mouseup: false,
            page
        })
        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 12, m: 0, ampm: "am" }, endTime: { h: 1, m: 0, ampm: "am" },
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 12, m: 0, ampm: "am" }, endTime: { h: 1, m: 0, ampm: "am" },
            x: 30 + 45,
            page
        })

        /* bottom right */
        await liftBlock({
            blockId: "edit-block",
            toTime: { h: 11, m: 59, ampm: "pm" },
            toOffset: { x: containerBox.width, y: 0},
            steps: 10,
            mouseup: false,
            vScrollTo: "top",
            page
        })
        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 10, m: 59, ampm: "pm" }, endTime: { h: 11, m: 59, ampm: "pm" },
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 10, m: 59, ampm: "pm" }, endTime: { h: 11, m: 59, ampm: "pm" },
            x: 30 + 45,
            page
        })

        /* bottom left */
        await liftBlock({
            blockId: "edit-block",
            toTime: { h: 11, m: 59, ampm: "pm" },
            toOffset: { x: -containerBox.width, y: 0},
            steps: 10,
            mouseup: false,
            vScrollTo: "top",
            page
        })
        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 10, m: 59, ampm: "pm" }, endTime: { h: 11, m: 59, ampm: "pm" },
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 10, m: 59, ampm: "pm" }, endTime: { h: 11, m: 59, ampm: "pm" },
            x: 30 + 45,
            page
        })

        expect((await isScrolledToEdges(container)).scrolledDown).toBeTruthy()
        expect((await isScrolledToEdges(container)).scrolledRight).toBeTruthy()

        /* back to top */
        await liftBlock({
            blockId: "edit-block",
            toTime: { h: 1, m: 0, ampm: "pm" },
            toOffset: { x: 0, y: 0 },
            steps: 10,
            mouseup: false,
            vScrollOffset: -containerBox.height,
            vScrollDelay: 1000,
            page
        })

        await vertScrollElem({ elem: container, offset: -300, delay: 800 })

        await liftBlock({
            blockId: "edit-block",
            toTime: { h: 7, m: 0, ampm: "am" },
            toOffset: { x: 0, y: 0},
            steps: 10,
            mouseup: false,
            vScrollDelay: 1000,
            page
        })

        await liftBlock({
            blockId: "edit-block",
            toTime: { h: 12, m: 0, ampm: "am" },
            toOffset: { x: 0, y: 0},
            steps: 10,
            mouseup: false,
            page
        })

        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 12, m: 0, ampm: "am" }, endTime: { h: 1, m: 0, ampm: "am" },
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 12, m: 0, ampm: "am" }, endTime: { h: 1, m: 0, ampm: "am" },
            x: 30 + 45,
            page
        })

        await page.mouse.up()

        await expectBlockElem({ 
            blockId: "rblock--0", 
            startTime: { h: 12, m: 0, ampm: "am" }, endTime: { h: 1, m: 0, ampm: "am" },
            page
        })
        expect((await isScrolledToEdges(container)).scrolledUp).toBeTruthy()
    })
    test("multiple: clashes", async ({ page }) => {
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, offset: -50, delay: 800 })

        /* clash up */
        await liftBlock({
            blockId: "rblock--0",
            toTime: { h: 10, m: 40, ampm: "am" },
            steps: 20,
            mouseup: false,
            page
        })

        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 7, m: 45, ampm: "am" }, endTime: { h: 8, m: 45, ampm: "am" },
            doCheckPos: false,
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 7, m: 45, ampm: "am" }, endTime: { h: 8, m: 45, ampm: "am" },
            page
        })
        
        await page.mouse.up()
        
        await expectBlockElem({ 
            blockId: "rblock--0", 
            startTime: { h: 7, m: 45, ampm: "am" }, endTime: { h: 8, m: 45, ampm: "am" },
            page
        })

        /* clash down */
        await liftBlock({
            blockId: "rblock--0",
            toTime: { h: 10, m: 40, ampm: "am" },
            steps: 20,
            mouseup: false,
            page
        })

        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 1, m: 20, ampm: "pm" }, endTime: { h: 2, m: 20, ampm: "pm" },
            doCheckPos: false,
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 1, m: 20, ampm: "pm" }, endTime: { h: 2, m: 20, ampm: "pm" },
            page
        })

        await page.mouse.up()
        
        await expectBlockElem({ 
            blockId: "rblock--2", 
            startTime: { h: 1, m: 20, ampm: "pm" }, endTime: { h: 2, m: 20, ampm: "pm" },
            page
        })
    })
    test("multiple: move to enough space", async ({ page }) => {
        await stretchBlock({
            blockId: "rblock--0",
            dragOrigin: "bottom",
            dragTo: { h: 7, m: 25, ampm: "am" },
            page,
        })

        await liftBlock({
            blockId: "rblock--0",
            toTime: { h: 12, m: 0, ampm: "pm" },
            steps: 20,
            mouseup: false,
            page
        })

        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 1, m: 20, ampm: "pm" }, endTime: { h: 2, m: 45, ampm: "pm" },
            doCheckPos: false,
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 1, m: 20, ampm: "pm" }, endTime: { h: 2, m: 45, ampm: "pm" },
            page
        })
        
        await page.mouse.up()
        
        await expectBlockElem({ 
            blockId: "rblock--2", 
            startTime: { h: 1, m: 20, ampm: "pm" }, endTime: { h: 2, m: 45, ampm: "pm" },
            page
        })
    })
    test("multiple: self is ignored in overlapping block search", async ({ page }) => {
        await liftBlock({
            blockId: "rblock--0",
            toTime: { h: 9, m: 0, ampm: "am" },
            mouseup: false,
            steps: 20,
            page
        })

        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { h: 7, m: 45, ampm: "am" }, endTime: { h: 8, m: 45, ampm: "am" },
            doCheckPos: false,
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 7, m: 45, ampm: "am" }, endTime: { h: 8, m: 45, ampm: "am" },
            page
        })
        
        await page.mouse.up()
        
        await expectBlockElem({ 
            blockId: "rblock--0", 
            startTime: { h: 7, m: 45, ampm: "am" }, endTime: { h: 8, m: 45, ampm: "am" },
            page
        })  
    })
    test("self will always be the initial candidate", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Schoolday 1.0' }).click()

        await liftBlock({
            blockId: "rblock--1",
            toTime: { h: 7, m: 0, ampm: "am" },
            toOffset: { x: 30, y: 0 },
            mouseup: false,
            steps: 20,
            page
        })

        await expectBlockElem({ 
            blockId: "edit-block", 

            startTime: { h: 7, m: 0, ampm: "am" }, endTime: { h: 3, m: 0, ampm: "pm" },
            doCheckPos: false,
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 7, m: 0, ampm: "am" }, endTime: { h: 3, m: 0, ampm: "pm" },
            page
        })
        
        await page.mouse.up()
        
        await expectBlockElem({ 
            blockId: "rblock--1", 
            startTime: { h: 7, m: 0, ampm: "am" }, endTime: { h: 3, m: 0, ampm: "pm" },
            page
        })  
    })
})
test.describe("duplicate edits", () => {
    test("initial correct state", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Empty' }).click()

        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        
        await makeBlock({
            start: { h: 12, m: 30, ampm: "am" }, end: { h: 1, m: 30, ampm: "am" },
            page
        })

        await duplicateBlock("rblock--0", page)
        
        await expectBlockElemTimePeriod({ 
            start: "12:30 AM", end: "1:30 AM", blockId: "edit-block", page 
        })
        await vertScrollElem({ elem: container, to: "top", delay: 800 })        

        /* initially, no add button nor drop area block */
        await expect(getBlockElem("drop-area-block", page)).not.toBeAttached()
        await expect(page.locator('.routine-blocks__dup-add')).not.toBeAttached()
        await expect(page.locator('.routine-blocks__dup-cancel')).toBeAttached()

        /* positioning is correct */
        let ogBlockPos = {
            x: await elemLeftOffset(getBlockElem("rblock--0", page)),
            y: await elemTopOffset(getBlockElem("rblock--0", page))
        }
        let dupBlockPos = {
            x: await elemLeftOffset(getBlockElem("edit-block", page)),
            y: await elemTopOffset(getBlockElem("edit-block", page))
        }

        expect(looseEqualTo(ogBlockPos.x, dupBlockPos.x, 0.2)).toBeTruthy()
        expect(looseEqualTo(ogBlockPos.y, dupBlockPos.y - 5, 0.1)).toBeTruthy()

        /* bottom most positioning is correct */
        await closeDupBlock(page)
        await deleteBlock("rblock--0", page)

        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })

        await makeBlock({
            start: { h: 10, m: 30, ampm: "pm" }, end: { h: 11, m: 59, ampm: "pm" },
            colIdx: 0,  page
        })

        await duplicateBlock("rblock--0", page)
        ogBlockPos = {
            x: await elemLeftOffset(getBlockElem("rblock--0", page)),
            y: await elemTopOffset(getBlockElem("rblock--0", page))
        }
        dupBlockPos = {
            x: await elemLeftOffset(getBlockElem("edit-block", page)),
            y: await elemTopOffset(getBlockElem("edit-block", page))
        }

        expect(looseEqualTo(ogBlockPos.x, dupBlockPos.x, 0.2)).toBeTruthy()
        expect(dupBlockPos.y < ogBlockPos.y && looseEqualTo(ogBlockPos.x, dupBlockPos.x, 40)).toBeTruthy()
    })
    test("basic lift edits", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'HS Saturday Routine' }).click()

        const { container } = await getContainerData(page)

        await duplicateBlock("rblock--0", page)
        await vertScrollElem({ elem: container, to: "top" })
        await expectBlockElemTimePeriod({ start: "8 AM", end: "9 AM", blockId: "edit-block", page })

        /* 1. move up, pushed up */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 55, ampm: "am" }, colIdx: 5, page }),
                offset: { x: 0, y: -5 }
             },
            page, elem: container, absolute: true, steps: 10, mouseup: false
        })

        await expectDupBlock({
            startTime: "7 AM",
            endTime: "8 AM",
            blockId: "rblock--0",
            page
        })

        /* 2. move down, pushed down */
        await duplicateBlock("rblock--1", page)
        await vertScrollElem({ elem: container, to: "top" })

        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 40 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 9, m: 25, ampm: "am" }, colIdx: 5, page }),
                offset: { x: 0, y: 5 }
             },
            page, elem: container, absolute: true, steps: 10, mouseup: false
        })

        await expectDupBlock({
            startTime: "10:30 AM",
            endTime: "11:30 AM",
            blockId: "rblock--3",
            page
        })
    })
    test("no initial possible space", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })
        await page.locator('li').filter({ hasText: 'HS Regular Weekday' }).click()

        const { container, blocksBox } = await getContainerData(page)

        await duplicateBlock("rblock--1", page)
        await vertScrollElem({ elem: container, to: "top" })

        await expectBlockElemTimePeriod({     
            start: "7 AM", end: "3 PM", blockId: "edit-block", page 
        })

        /* lifting up */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 2, m: 0, ampm: "am" }, page }),
                offset: { x: 0, y: 10 }
             },
            page, elem: container, absolute: true, steps: 40
        })

        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { 
                h: 7, m: 0, ampm: "am" 
            },
            y: topOffsetFromTime({ 
                time: { h: 2, m: 0, ampm: "am" }, 
                blocksHeight: blocksBox.height
            }),
            doCheckPos: false, page 
        })

        await expect(getBlockElem("drop-area-block", page)).not.toBeAttached()
        await page.mouse.up()
        await expect(page.locator('.routine-blocks__dup-add')).not.toBeAttached()
        await expect(page.locator('.routine-blocks__dup-cancel')).toBeAttached()

        /* down */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 3, m: 0, ampm: "pm" }, page }),
                offset: { x: 0, y: 30 }
             },
            page, elem: container, absolute: true, steps: 50
        })

        let scrollTop = await vertScrollElem({ elem: container, to: "bottom", delay: 800 })

        await expectBlockElem({ 
            blockId: "edit-block", 
            startTime: { 
                h: 7, m: 0, ampm: "am" 
            },
            y: topOffsetFromTime({ 
                time: { h: 3, m: 0, ampm: "pm" }, 
                blocksHeight: blocksBox.height,
                scrollTop
            }),
            doCheckPos: false, 
            page 
        })

        await expect(getBlockElem("drop-area-block", page)).not.toBeAttached()
        await page.mouse.up()
        await expect(page.locator('.routine-blocks__dup-add')).not.toBeAttached()
        await expect(page.locator('.routine-blocks__dup-cancel')).toBeAttached()
    })
    test("button positioning: small", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })

        await page.locator('li').filter({ hasText: 'Empty' }).click()
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        
        await makeBlock({
            start: { h: 4, m: 0, ampm: "am" }, end: { h: 4, m: 40, ampm: "am" },
            colIdx: 0,  page
        })

        await duplicateBlock("rblock--0", page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })

        /* TL → bottom */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 0, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: 20 }
             },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBtnPlacement("bottom", page)

        /* ~TL → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 30, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: 20 }
             },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBtnPlacement("top", page)

        /* BL → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 19, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 80
        })
        await expectBtnPlacement("top", page)

        /* ~BL → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 0, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 5
        })

        await expectBtnPlacement("top", page)

        /* middle */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 4, m: 30, ampm: "pm" }, colIdx: 2, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 5
        })

        await expectBtnPlacement("top", page)
    })
    test("button positioning: big", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })

        await page.locator('li').filter({ hasText: 'Empty' }).click()
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        
        await makeBlock({
            start: { h: 6, m: 0, ampm: "am" }, end: { h: 11, m: 0, ampm: "am" },
            colIdx: 0,  page
        })

        await duplicateBlock("rblock--0", page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })

        /* TL → bottom */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 0, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: 20 }
             },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBtnPlacement("right", page)

        /* ~TL → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 30, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: 20 }
             },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBtnPlacement("top", page)

        /* BL → right */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 19, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 80
        })
        await expectBtnPlacement("right", page)

        return

        /* ~BL → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 6, m: 0, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 5
        })

        await expectBtnPlacement("top", page)

        /* middle */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 4, m: 30, ampm: "pm" }, colIdx: 2, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 5
        })

        await expectBtnPlacement("top", page)
    })
})
test.describe("modal edits", () => {
    test("modal invocation - no changes made", async ({ page }) => {
        let blockElem = getBlockElem("rblock--0", page)
        await blockElem.click()
        await expectEditModal(true, page)

        // close by close button
        await page.getByRole('button', { name: 'Cancel' }).click()
        await expectEditModal(false, page)
        
        // close by clicking outside the modal
        await blockElem.click()
        await expectEditModal(true, page)

        await page.mouse.move(50, 50)
        await page.mouse.down()
        await page.mouse.up()
        await expectEditModal(false, page)
    })
    test("modal invocation - changes made", async ({ page }) => {
        // await initTestData(page)

        let blockElem = getBlockElem("rblock--0", page)
        await blockElem.click()
        await page.getByPlaceholder('Block Title...').click()
        await page.getByPlaceholder('Block Title...').fill('New Title')

        // close by close button
        await page.getByRole('button', { name: 'Cancel' }).click()        
        await expect(page.locator('.confirm')).toBeAttached()
        await expect(page.getByText('Heads Up! Discard unsaved')).toBeVisible()

        await confirmDiscard(page)
        await expectEditModal(false, page)
        
        // close by clicking outside the modal
        await blockElem.click()
        await page.getByPlaceholder('Block Title...').click()
        await page.getByPlaceholder('Block Title...').fill('New Title')

        await page.mouse.move(50, 50)
        await page.mouse.down()
        await page.mouse.up()

        await expect(page.locator('.confirm')).toBeAttached()
        await expect(page.getByText('Heads Up! Discard unsaved')).toBeVisible()
        await confirmDiscard(page)
        await expectEditModal(false, page)
    })
    test("title change", async ({ page }) => {
        let blockElem = getBlockElem("rblock--0", page)
        let title = "New Title"

        /* changes are saved */
        await blockElem.click()
        await fillEditModal({ title, page })

        await expectBlockElem({ title, blockId: "rblock--0", page })
        await blockElem.click()
        await expectEditModalToBe({ page, title, close: false })

        /* max title */
        const MAX_BLOCK_TITLE = RoutinesManager.MAX_BLOCK_TITLE
        title = generateRandomString({ length: MAX_BLOCK_TITLE, includeEmojis: true, excludeEntities: true  })
        await fillEditModal({ title: title, page })

        await expectBlockElem({ title, blockId: "rblock--0", page })
        await blockElem.click()
        await expectEditModalToBe({ page, title, close: false })


        /* more than max */
        title = generateRandomString({ length: MAX_BLOCK_TITLE + 12, includeEmojis: true, excludeEntities: true  })
        
        await fillEditModal({ title: title, page })

        await expectBlockElem({ title: title.slice(0, -12), blockId: "rblock--0", page })
        await blockElem.click()
        await expectEditModalToBe({ page, title: title.slice(0, -12), close: false })

        /* no title should default to Untitled */

        title = ""
        await fillEditModal({ title, page })

        await expectBlockElem({ title: "Untitled", blockId: "rblock--0", page })
        await blockElem.click()
        await expectEditModalToBe({ page, title: "Untitled", close: false })

    }) 
    test("description change", async ({ page }) => {
        const MAX = RoutinesManager.MAX_BLOCK_DESCRIPTION
        const blockElem = getBlockElem("rblock--0", page)

        let description = "New Description"

        /* changes are saved */
        await blockElem.click()
        await fillEditModal({ description: description, page })

        await blockElem.click()
        await expectEditModalToBe({ page, description: description, close: false })

        await expect(page.locator(".input-box__count")).toContainText(`${MAX - description.length}`)

        /* max description */
        description = generateRandomString({ length: MAX, includeEmojis: false, excludeEntities: true })
        await fillEditModal({ description: description, page })
        
        await blockElem.click()
        await expectEditModalToBe({ page, description, close: false })
        await page.locator(".edit-routine__description-text-editor").click()
        await expect(page.locator(".input-box__count")).toContainText("0")

        /* more than max */
        description = generateRandomString({ length: MAX + 12, includeEmojis: false, excludeEntities: true })
        
        await fillEditModal({ description: description, doSave: false, page })

        await page.locator(".edit-routine__description-text-editor").click()
        await expect(page.locator(".input-box__count")).toContainText("-12")

        await page.locator('.async-btn').isDisabled()
        await closeEditBlockModal({ page, doSave: false })

        /* no description should say type description here */
        description = ""
        await blockElem.click()
        await fillEditModal({ description, page, doLeave: true })

        await epectTextEditor({ query: ".edit-routine__description-text-editor", page, placeholder: "Type description here..." })
        await closeEditBlockModal({ page, doSave: true })

        await blockElem.click()
        await epectTextEditor({ query: ".edit-routine__description-text-editor", page, placeholder: "Type description here..." })
    })
    test("color change", async ({ page }) => {
        let blockElem = getBlockElem("rblock--0", page)
        const colorIdx = 13
        const color = COLOR_SWATCHES.d[colorIdx]
    
        /* changes are saved */
        await blockElem.click()
        await page.locator('#color-picker--dropdown-btn').click()
        await page.locator(`.color-picker__grid > div:nth-child(${colorIdx + 1})`).first().click()

        await page.locator('#color-picker--dropdown-btn').click();

        await expectComputedStyle({ 
            prop: "background-color",
            val: `rgb(${color.dark2})`,
            query: ".edit-routine__color",
            page
        })

        await closeEditBlockModal({ page, doSave: true })
        await page.waitForTimeout(200)

        blockElem = getBlockElem("rblock--0", page)
        const blockContent = blockElem.locator(".routine-blocks__block-content")

         await expectComputedStyle({ 
            prop: "background-color",
            elem: blockContent,
            val: `rgb(${color.dark2})`,
            page
         })
    })
    test("action items", async ({ page }) => {
        let blockElem = getBlockElem("rblock--0", page)
        await blockElem.click()

        /* items are saved properly */
        await page.getByRole('button', { name: 'Add an Item' }).click()
        await page.waitForTimeout(1000)
        
        await page.keyboard.type('Hello World')

        await closeEditBlockModal({ page, doSave: true })

        await blockElem.click()
        await expect(page.locator('#edit-routine--task-title-id--0')).toContainText('Hello World')
    })
    test("first block changes", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'HS Sunday Routine' }).click()

        let blockElem     = getBlockElem("rblock--0", page)
        let blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")
        await blockElem.click()

        const id = "edit-routine-settings"
        
        /* 1. set as first block */
        await toggleDropdown({ 
            page, 
            pickOptionText: "Set as first block",
            textOptions: ["Set as first block", "Set as last block", "Delete Block"],
            identifier: id
        })

        // check
        await toggleDropdown({ 
            page, 
            textOptions: ["Unset as first block", "Delete Block"],
            identifier: id
        })
        await expectAttribute({
            selector: ".edit-routine__order-context-icon svg",
            attr: "data-icon",
            value: "sun",
            page
        })
        await closeEditBlockModal({ page, doSave: true })

        await expectAttribute({
            elem: blockElemIcon,
            attr: "data-icon",
            value: "sun",
            page
        })

        /* 2. new first block with one already set */
        blockElem     = getBlockElem("rblock--1", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")
        await blockElem.click()
        await toggleDropdown({ 
            page, 
            pickOptionText: "Set as new first block",
            textOptions: ["Set as new first block", "Set as last block", "Delete Block"],
            identifier: id
        })

        // check
        await toggleDropdown({ 
            page, 
            textOptions: ["Unset as first block", "Delete Block"],
            identifier: id
        })
        await expectAttribute({
            selector: ".edit-routine__order-context-icon svg",
            attr: "data-icon",
            value: "sun",
            page
        })
        await closeEditBlockModal({ page, doSave: true })

        blockElem     = getBlockElem("rblock--1", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")

        await expectAttribute({
            elem: blockElemIcon,
            attr: "data-icon",
            value: "sun",
            page
        })

        // make sure new still hasn't been set
        blockElem     = getBlockElem("rblock--0", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")

        await expect(blockElemIcon).not.toBeAttached()

        /* 3. unset as new first block */
        blockElem     = getBlockElem("rblock--1", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")
        await blockElem.click()

        await toggleDropdown({ 
            page, 
            pickOptionText: "Unset as first block",
            textOptions: ["Unset as first block", "Delete Block"],
            identifier: id
        })

        // check
        await expect(page.locator(".edit-routine__order-context-icon")).not.toBeAttached()
        await closeEditBlockModal({ page, doSave: true })

        blockElem     = getBlockElem("rblock--1", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")

        await expect(blockElemIcon).not.toBeAttached()
    })
    test("last block changes", async ({ page }) => {
        let blockElem     = getBlockElem("rblock--0", page)
        let blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")
        await blockElem.click()

        const id = "edit-routine-settings"
        
        /* 1. set as last block */
        await toggleDropdown({ 
            page, 
            pickOptionText: "Set as last block",
            textOptions: ["Set as first block", "Set as last block", "Delete Block"],
            identifier: id
        })

        // check
        await toggleDropdown({ 
            page, 
            textOptions: ["Unset as last block", "Delete Block"],
            identifier: id
        })
        await expectAttribute({
            selector: ".edit-routine__order-context-icon svg",
            attr: "data-icon",
            value: "moon",
            page
        })
        await closeEditBlockModal({ page, doSave: true })

        await expectAttribute({
            elem: blockElemIcon,
            attr: "data-icon",
            value: "moon",
            page
        })

        /* 2. new last block with one already set */
        blockElem     = getBlockElem("rblock--1", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")
        await blockElem.click()

        await toggleDropdown({ 
            page, 
            pickOptionText: "Set as new last block",
            textOptions: ["Set as first block", "Set as new last block", "Delete Block"],
            identifier: id
        })

        // check
        await toggleDropdown({ 
            page, 
            textOptions: ["Unset as last block", "Delete Block"],
            identifier: id
        })
        await expectAttribute({
            selector: ".edit-routine__order-context-icon svg",
            attr: "data-icon",
            value: "moon",
            page
        })
        await closeEditBlockModal({ page, doSave: true })
        await expectAttribute({
            elem: blockElemIcon,
            attr: "data-icon",
            value: "moon",
            page
        })

        // make sure new still hasn't been set
        blockElem     = getBlockElem("rblock--0", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")

        await expect(blockElemIcon).not.toBeAttached()

        /* 3. unset as new last block */
        blockElem     = getBlockElem("rblock--1", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")
        await blockElem.click()

        await toggleDropdown({ 
            page, 
            pickOptionText: "Unset as last block",
            textOptions: ["Unset as last block", "Delete Block"],
            identifier: id
        })

        // check
        await expect(page.locator(".edit-routine__order-context-icon")).not.toBeAttached()
        await closeEditBlockModal({ page, doSave: true })

        await expect(blockElemIcon).not.toBeAttached()
    })
    test("tag changes", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Schoolday 1.0' }).click()

        let blockElem = getBlockElem("rblock--1", page)
        await blockElem.click()
        
        /* items are saved properly */
        await page.locator("#tag-picker--dropdown-btn").click()
        await page.locator('#tag-picker--dropdown-menu').getByRole('button', { name: '🍖 Cooking' }).click()

        await closeEditBlockModal({ page, doSave: true })

        await blockElem.click()
        await expect(page.locator('#tag-picker--dropdown-btn')).toContainText('Cooking')
    })
    test("core changes", async ({ page }) => {
        let blockElem = getBlockElem("rblock--1", page)
        await blockElem.click()
        
        /* items are saved properly */
        await page.locator("#core-dropdown--dropdown-btn").click()
        await page.getByRole('button', { name: 'Mind' }).click()

        await closeEditBlockModal({ page, doSave: true })

        await blockElem.click()
        await expect(page.locator('#core-dropdown--dropdown-btn')).toContainText('Mind');
    })
    test("time changes - valid", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'HS Saturday Routine' }).click()

        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top" })

        /* 1. make new block + lift edit */
        await makeBlock({
            start: { h: 5, m: 0, ampm: "am" }, end: { h: 6, m: 0, ampm: "am" },
            close: false, page
        })

        let blockElem = await getBlockElem("rblock--0", page)

        await fillEditModal({ page, startTime: "2:04 AM", endTime: "3:59 AM" })
        await page.waitForTimeout(200)

        await expectBlockElem({ 
            blockId: "rblock--0", 
            startTime: { h: 2, m: 4, ampm: "am" }, 
            endTime: { h: 3, m: 59, ampm: "am" }, 
            page 
        })

        /* 2. all the way up */
        await blockElem.click()
        await fillEditModal({ page, startTime: "12 AM", endTime: "1 AM" })
        await page.waitForTimeout(200)

        await expectBlockElemAt({ 
            blockId: "rblock--0", 
            startTime: { h: 12, m: 0, ampm: "am" }, 
            endTime: { h: 1, m: 0, ampm: "am" }, 
            page 
        })

        /* 3. stretch down */
        await blockElem.click()
        await fillEditModal({ page, endTime: "1:30 AM" })
        await page.waitForTimeout(200)
        
        await expectBlockElemAt({ 
            blockId: "rblock--0", 
            startTime: { h: 12, m: 0, ampm: "am" }, 
            endTime: { h: 1, m: 30, ampm: "am" }, 
            page 
        })

        /* 4. all the way down */
        await blockElem.click()
        await fillEditModal({ page, startTime: "11:30 PM", endTime: "11:59 PM" })
        await page.waitForTimeout(200)

        blockElem = await getBlockElem("rblock--7", page)

        await expectBlockElemAt({ 
            blockId: "rblock--7", 
            startTime: { h: 11, m: 30, ampm: "pm" }, 
            endTime: { h: 11, m: 59, ampm: "pm" }, 
            page 
        })

        /* 5. stretch up */
        await blockElem.click()
        await fillEditModal({ page, startTime: "11:15 PM"  })
        await page.waitForTimeout(200)

        await expectBlockElemAt({ 
            blockId: "rblock--7", 
            startTime: { h: 11, m: 15, ampm: "pm" }, 
            endTime: { h: 11, m: 59, ampm: "pm" }, 
            page 
        })

        /* 5. just the right amount */
        await blockElem.click()
        await fillEditModal({ page, startTime: "6:30 PM", endTime: "7:30 PM" })
        await page.waitForTimeout(200)

        blockElem = await getBlockElem("rblock--4", page)

        await expectBlockElemAt({ 
            blockId: "rblock--4", 
            startTime: { h: 6, m: 30, ampm: "pm" }, 
            endTime: { h: 7, m: 30, ampm: "pm" }, 
            page 
        })

        /* 6. just the right amount min */
        await blockElem.click()
        await fillEditModal({ page, startTime: "8:00 PM", endTime: "8:15 PM" })
        await page.waitForTimeout(200)

        blockElem = await getBlockElem("rblock--5", page)

        await expectBlockElemAt({ 
            blockId: "rblock--5", 
            startTime: { h: 8, m: 0, ampm: "pm" }, 
            endTime: { h: 8, m: 15, ampm: "pm" }, 
            page 
        })

        /* 7. max */
        await page.locator('li').filter({ hasText: 'Empty' }).click()
        await vertScrollElem({ elem: container, to: "top" })

        await makeBlock({
            start: { h: 5, m: 0, ampm: "am" }, end: { h: 6, m: 0, ampm: "am" },
            colIdx: 0, close: false, page
        })

        blockElem = await getBlockElem("rblock--0", page)

        await fillEditModal({ page, startTime: "12 AM", endTime: "11:59 PM" })
        await page.waitForTimeout(200)

        await expectBlockElemAt({ 
            blockId: "rblock--0", 
            startTime: { h: 12, m: 0, ampm: "am" }, 
            endTime: { h: 11, m: 59, ampm: "pm" },
            page 
        })
    })
    test("time changes - invalid overlaps", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'HS Saturday Routine' }).click()
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, offset: -70 })

        const expectOverlapMessage = async (name: string) => {
            const str = `Changes couldn't be saved. Overlaps with ${name}`
            await expectToastMsg({ title: str, page })
        }

        await makeBlock({
            start: { h: 10, m: 45, ampm: "am" }, end: { h: 11, m: 30, ampm: "am" },
            close: false, page
        })

        /* 1. clash up */
        await fillEditModal({ page, startTime: "10:29 AM", doCloseToast: false })
        await expectOverlapMessage("\"🏃‍♂️ Morning Run\" (9:15 AM - 10:30 AM)")

        await fillEditModal({ page, startTime: "12 AM", doCloseToast: false })
        await expectOverlapMessage("\"🌤️ Morning Routine\" (8 AM - 9 AM)")
        
        /* 2. clash down */
        await fillEditModal({ page, startTime: "10:30 AM", endTime: "12:01 PM", doCloseToast: false })
        await expectOverlapMessage("\"Lunch\" (12 PM - 12:30 PM)")

        await fillEditModal({ page, endTime: "11:29 PM", doCloseToast: false })
        await expectOverlapMessage("\"Lunch\" (12 PM - 12:30 PM)")

        /* 3. clash both sides */
        await fillEditModal({ page, startTime: "10:29 AM", endTime: "12:01 PM", doCloseToast: false })
        await expectOverlapMessage("\"🏃‍♂️ Morning Run\" (9:15 AM - 10:30 AM)")

        /* 3. within a block - same exact */
        await fillEditModal({ page, startTime: "9:15 AM", endTime: "10:30 AM", doCloseToast: false })
        await expectOverlapMessage("\"🏃‍♂️ Morning Run\" (9:15 AM - 10:30 AM)")
        
        /* 4. within a block - same start */
        await fillEditModal({ page, startTime: "9:15 AM", endTime: "10:25 AM", doCloseToast: false })
        await expectOverlapMessage("\"🏃‍♂️ Morning Run\" (9:15 AM - 10:30 AM)")

        await fillEditModal({ page, startTime: "9:15 AM", endTime: "10:35 AM", doCloseToast: false })
        await expectOverlapMessage("\"🏃‍♂️ Morning Run\" (9:15 AM - 10:30 AM)")

        /* 5. within a block - same end */
        await fillEditModal({ page, startTime: "9:10 AM", endTime: "10:30 AM", doCloseToast: false })
        await expectOverlapMessage("\"🏃‍♂️ Morning Run\" (9:15 AM - 10:30 AM)")

        await fillEditModal({ page, startTime: "9:20 AM", endTime: "10:30 AM", doCloseToast: false })
        await expectOverlapMessage("\"🏃‍♂️ Morning Run\" (9:15 AM - 10:30 AM)")

        /* 6. within a block - fully */
        await fillEditModal({ page, startTime: "9:20 AM", endTime: "10:25 AM", doCloseToast: false })
        await expectOverlapMessage("\"🏃‍♂️ Morning Run\" (9:15 AM - 10:30 AM)")

        /* 7. block inside - same end */
        await fillEditModal({ page, startTime: "11:30 AM", endTime: "12:45 PM", doCloseToast: false })
        await expectOverlapMessage("\"Lunch\" (12 PM - 12:30 PM)")
    })
    test("time changes - invalid times", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'HS Saturday Routine' }).click()
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, offset: -70 })

        await makeBlock({
            start: { h: 10, m: 45, ampm: "am" }, end: { h: 11, m: 30, ampm: "am" },
            close: false, page
        })
        /* 1. below minimum */
        await fillEditModal({ page, startTime: "10:45 AM", endTime: "10:59 AM" })
        await expectToastMsg({ title: `Blocks must be at least ${RoutinesManager.MIN_BLOCK_DURATION_MINS} minutes long`, page })

        /* 2. negative elapsed time */
        await fillEditModal({ page, startTime: "10:45 AM", endTime: "10:44 AM" })
        await expectToastMsg({ title: `Invalid time`, page })
        
        /* 3. surpassed max end time */
        await fillEditModal({ page, startTime: "11:30 PM", endTime: "12 AM" })
        await expectToastMsg({ title: `Invalid end time`, page })

        await fillEditModal({ page, startTime: "11:30 PM", endTime: "1:15 AM" })
        await expectToastMsg({ title: `Invalid time`, page })
    })
})
test.describe("tag updates", () => {
    test("display correct breakdown", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'HS Regular Weekday' }).click()
        
        let container = page.locator('.routine__breakdown').nth(1)

        // hs student - mon
        await expectTagBreakdown({
            expectData: TEST_DAILY_BREAKDOWN[0].tagBreakdown,
            daily: true,
            container
        })

        // hs student - tue
        await page.locator('li').filter({ hasText: 'HS EC Weekday' }).click()

        await expectTagBreakdown({
            expectData: TEST_DAILY_BREAKDOWN[1].tagBreakdown,
            daily: true,
            container
        })

        // hs student - sat
        await page.locator('li').filter({ hasText: 'HS Saturday Routine' }).click()

        await expectTagBreakdown({
            expectData: TEST_DAILY_BREAKDOWN[2].tagBreakdown,
            daily: true,
            container
        })

        // uni student - mon
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()

        await expectTagBreakdown({
            expectData: TEST_DAILY_BREAKDOWN[3].tagBreakdown,
            daily: true,
            container
        })
    })
    test("edit changes", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()

        let dayTagData  = structuredClone(TEST_DAILY_BREAKDOWN[3].tagBreakdown)
        let breakdownContainer = page.locator('.routine__breakdown').nth(1)

        /* stretch up - morning lecture */
        await stretchBlock({
            blockId: "rblock--3",
            dragOrigin: "top",
            dragTo: { h: 9, m: 0, ampm: "am" },
            page,
        })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "School", totalTime: { offset: 30 } }]
        })

        await expectTagBreakdown({
            expectData: dayTagData,
            daily: true,
            container: breakdownContainer
        })

        /* stretch down */
        await stretchBlock({
            blockId: "rblock--8",
            dragOrigin: "bottom",
            dragTo: { h: 8, m: 0, ampm: "pm" },
            vScrollTo: "bottom",
            page,
        })

        await fillEditModal({ blockId: "rblock--8", tag: "Meditation", page })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Meditation", totalTime: { offset: 90 }, total: { total: 1 } }]
        })

        await expectTagBreakdown({
            expectData: dayTagData,
            daily: true,
            container: breakdownContainer
        })

        /* lift gym deep work session */
        await fillEditModal({ blockId: "rblock--2", startTime: "12 AM", endTime: "2:33 AM", page })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Body", totalTime: { offset: 93 } }]
        })

        await expectTagBreakdown({
            expectData: dayTagData,
            daily: true,
            container: breakdownContainer
        })

        /* delete gym */
        await deleteBlock("rblock--0", page)

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Body", totalTime: { offset: -153 } }]
        })

        await expectTagBreakdown({
            expectData: dayTagData,
            daily: true,
            container: breakdownContainer
        })

        /* new - add to school */
        await makeBlock({
            start: { h: 12, m: 0, ampm: "am" }, 
            end: { h: 12, m: 30, ampm: "am" },
            colIdx: 1, 
            close: false,
            vScrollTo: "top",
            page
        })

        await fillEditModal({ endTime: "12:31 AM", tag: "Body", page })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Body", totalTime: { offset: +31 }, total: { total: 1 }  }]
        })

        await expectTagBreakdown({
            expectData: dayTagData,
            daily: true,
            container: breakdownContainer
        })
    })
})
test.describe("core updates", () => {
    test("display correct breakdown", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'HS Regular Weekday' }).click()
        
        let container = page.locator('.routine__breakdown').first()

        // hs student - mon
        await expectCoreBreakdown({
            expectData: TEST_DAILY_BREAKDOWN[0].coreBreakdown,
            container
        })

        // hs student - tue
        await page.locator('li').filter({ hasText: 'HS EC Weekday' }).click()

        await expectCoreBreakdown({
            expectData: TEST_DAILY_BREAKDOWN[1].coreBreakdown,
            container
        })

        // hs student - sat
        await page.locator('li').filter({ hasText: 'HS Saturday Routine' }).click()

        await expectCoreBreakdown({
            expectData: TEST_DAILY_BREAKDOWN[2].coreBreakdown,
            container
        })

        // uni student - mon
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()

        await expectCoreBreakdown({
            expectData: TEST_DAILY_BREAKDOWN[3].coreBreakdown,
            container
        })
    })
    test("edits #1", async ({ page }) => {
        // changes - stretch up / down, deletions
        const { container } = await getContainerData(page)

        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()
        await vertScrollElem({ elem: container, to: "top" })
        let breakdownContainer = page.locator('.routine__breakdown').first()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)

        /* increase first block by 2 hours */
        await stretchBlock({
            blockId: "rblock--0",
            dragOrigin: "top",
            dragTo: { h: 5, m: 0, ampm: "am" },
            page,
        })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: -120 } }, 
                { core: "awake", totalTime: { offset: +120 } }
            ]
        })

        await expectCoreBreakdown({ expectData: dayCoreData, container: breakdownContainer })

        /* increase relaxation by 55 mins down */
        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })
        
        await stretchBlock({
            blockId: "rblock--8",
            dragOrigin: "bottom",
            dragTo: { h: 7, m: 55, ampm: "pm" },
            page
        })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "selfCare", totalTime: { offset: +55 } },
            ]
        })

        await expectCoreBreakdown({ expectData: dayCoreData, container: breakdownContainer })

        /* delete morning lecture and internship search */
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        await deleteBlock("rblock--3", page)

        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })
        await deleteBlock("rblock--10", page)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "working", totalTime: { offset: -(120 + 75) }, total: { offset: -2 } },
            ]
        })
        await expectCoreBreakdown({ expectData: dayCoreData, container: breakdownContainer })

        /* increase last block */
        await stretchBlock({
            blockId: "rblock--12",
            dragOrigin: "top",
            dragTo: { h: 11, m: 59, ampm: "pm" },
            page,
        })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: -29 } }, 
                { core: "awake", totalTime: { offset: +29 } },
                { core: "selfCare", totalTime: { offset: -1 } }
            ]
        })

        await expectCoreBreakdown({ expectData: dayCoreData, container: breakdownContainer })
    })
    test("edits #2", async ({ page }) => {
        // changes - lift up / down, modal time / additions, core changes
        const { container } = await getContainerData(page)

        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()
        await vertScrollElem({ elem: container, to: "top" })

        let breakdownContainer = page.locator('.routine__breakdown').first()
        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)

        /* lift morning up */
        await liftBlock({
            blockId: "rblock--0",
            toTime: { h: 1, m: 0, ampm: "am" },
            toOffset: { x: 0, y: -10 },
            steps: 40,
            vScrollTo: "top",
            up: true,
            page
        })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: -(6 * 60) } }, 
                { core: "awake", totalTime: { offset: +(6 * 60) } }
            ]
        })

        await expectCoreBreakdown({ expectData: dayCoreData, container: breakdownContainer })
        await page.waitForTimeout(200)

        /* deep work from 1 to 1:30 */
        await fillEditModal({ blockId: "rblock--5", startTime: "1:00 PM", endTime: "1:30 PM", page })
        await page.waitForTimeout(200)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "working", totalTime: { offset: -90 } }, 
            ]
        })

        await expectCoreBreakdown({ expectData: dayCoreData, container: breakdownContainer })

        /* new - add to body */
        await makeBlock({
            start: { h: 2, m: 15, ampm: "pm" }, 
            end: { h: 3, m: 30, ampm: "pm" },
            colIdx: 1, close: false,
            page
        })
        await fillEditModal({ core: "Body", page })
        await page.waitForTimeout(200)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "body", totalTime: { offset: 75 } }, 
            ]
        })
        
        /* change new to mind */
        await fillEditModal({ blockId: "rblock--6", core: "Mind", page })
        await page.waitForTimeout(200)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "body", totalTime: { offset: -75 } }, 
                { core: "mind", totalTime: { offset: 75 }, avgTime: { total: 75 }, total: { total: 1 } }, 
            ]
        })

        await expectCoreBreakdown({ expectData: dayCoreData, container: breakdownContainer })
    })
    test("awake / asleep - changing first / last", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)
        let breakdownContainer = page.locator('.routine__breakdown').first()

        /* change first */
        await fillEditModal({ blockId: "rblock--1", settingsOptn: "Set as new first block", page })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: +(30) } }, 
                { core: "awake", totalTime: { offset: -(30) } }
            ]
        })

        await expectCoreBreakdown({
            expectData: dayCoreData,
            container: breakdownContainer
        })

        /* change last */
        await page.waitForTimeout(200)

        await fillEditModal({ blockId: "rblock--10", settingsOptn: "Set as new last block", page })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: +(75) } }, 
                { core: "awake", totalTime: { offset: -(75) } }
            ]
        })

        await expectCoreBreakdown({
            expectData: dayCoreData,
            container: breakdownContainer
        })
    })
    test("awake / asleep - only first", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()
        let breakdownContainer = page.locator('.routine__breakdown').first()

        /* change new to mind */
        await fillEditModal({ blockId: "rblock--12", settingsOptn: "Unset as last block", page })

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        await expectCoreBreakdown({
            expectData: dayCoreData,
            container: breakdownContainer
        })
    })
    test("awake / asleep - only last", async ({ page }) => {
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()
        const breakdownContainer = page.locator('.routine__breakdown').first()

        /* change new to mind */
        await fillEditModal({ blockId: "rblock--0", settingsOptn: "Unset as first block", page })

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        await expectCoreBreakdown({
            expectData: dayCoreData,
            container: breakdownContainer
        })
    })
    test("awake / asleep - last then first", async ({ page }) => {
        const { container } = await getContainerData(page)
        const breakdownContainer = page.locator('.routine__breakdown').first()

        await vertScrollElem({ elem: container, to: "top" })
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)

        /* morning routine becomes last, block after becomes first */
        await fillEditModal({ blockId: "rblock--1", settingsOptn: "Set as new first block", page })
        await fillEditModal({ blockId: "rblock--0", settingsOptn: "Set as new last block", page })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        await expectCoreBreakdown({
            expectData: dayCoreData,
            container: breakdownContainer
        })
    })
    test("awake / asleep - right next to each other", async ({ page }) => {
        const { container } = await getContainerData(page)
        const breakdownContainer = page.locator('.routine__breakdown').first()

        await vertScrollElem({ elem: container, to: "top" })
        await page.locator('li').filter({ hasText: 'Uni Light Weekday' }).click()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)

        await fillEditModal({ blockId: "rblock--1", settingsOptn: "Set as new last block", page })
        await page.waitForTimeout(200)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: +(940) } }, 
                { core: "awake", totalTime: { offset: -(940) } }
            ]
        })

        await expectCoreBreakdown({
            expectData: dayCoreData,
            container: breakdownContainer
        })
    })
})