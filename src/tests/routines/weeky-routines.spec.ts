import { RoutinesManager } from "$lib/routines-manager"
import { expect, test } from "@playwright/test"
import { generateRandomString, looseEqualTo, neg } from "../helpers"
import { TEST_DAILY_BREAKDOWN, TEST_WEEKLY_BREAKDOWN, WEEKLY_ROUTINES } from "./routines.data"
import { DAYS_OF_WEEK, getDayIdxMinutes, getTimeFromIdx } from "$lib/utils-date"
import { COLOR_SWATCHES } from "$lib/utils-colors"

import { 
    elemTopOffset, 
    elemLeftOffset, 
    elemLeftOffsetByBox, 
    getVertDistanceBetweenTwoElems, 
    getHozDistanceBetweenTwoElems,
    dragFromTo,
    vertScrollElem,
    isScrolledToEdges,
    epectTextEditor,
    expectComputedStyle,
    toggleDropdown,
    expectAttribute,
    expectToastMsg,
    fillInput,
} 
from "../pw-helpers"

import { 
    confirmEmptyDetails, 
    confirmDelete, 
    switchWeekView, 
    initTestData, 
    expectEditModal, 
    closeEditBlockModal, 
    topOffsetFromTime,
    getBlockViewPortPos,
    expectBlockElemTimePeriod,
    getContainerData,
    getNextColDistFromBlock,
    expectBlockElem,
    deleteBlock,
    getPositionFromTimeDay,
    getFirstBlock,
    getBlockElemData,
    toggleAllowScroll,
    liftDistPos,
    liftBlockToTime,
    liftBlockFromBlock, 
    makeBlock,
    duplicateBlock,
    getBlockElem,
    closeDupBlock,
    expectDupBlock,
    expectBlockElemAt,
    expectBlockElemAtCol,
    expectBtnPlacement,
    confirmDiscard,
    expectEditModalToBe,
    fillEditModal,
    expectCoreBreakdown,
    stretchBlock,
    updateCoreData,
    expectDayCoreBreakDown,
    expectWeekCoreBreakDown,
    liftBlock,
    expectDayTagBreakDown,
    expectWeekTagBreakDown,
    updateTagData,
    dayBreakdownSettingsOptn,
    emptyTestData,
    expectRoutinePage,
    makeRoutine
} 
from "./helpers"

/* Constants */
const { 
    NEW_STRETCH_DRAG_DIST_THRESHOLD, 
    BLOCK_EDGE_THRESHOLD
} = RoutinesManager

// certain actions will only work after a bottom scroll if system has to wait after a scroll
const AFTER_BOTTOM_SCROLL_DELAY = 800

/* Helpers */

test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/home/routines/weekly')
})


test.describe("making a single routine", () => {
    /* Submission */
    test('empty + new routine + is in view', async ({ page }) => {

        if (!await emptyTestData(page)) return

        await makeRoutine({
            page,
            title: "Hello World",
            description: "New Routine"
        })

        await expectRoutinePage({
            page,
            title: "Hello World",
            description: "New Routine",
            routines: ["Hello World"],
            expectEmptyBreakdown: true,
            count: 1
        })
    })
    test('no description', async ({ page }) => {
        if (!await emptyTestData(page)) return

        await makeRoutine({
            page,
            title: "Hello World",
        })

        await expectAttribute({
            attr: "data-placeholder",
            value: "Type description here...",
            selector: ".routine__description",
            page,
        })
    })
    test('no name enter visible', async ({ page }) => {
        await page.locator('.routine__wk-routines-addbtn').dispatchEvent("click")

        await makeRoutine({ page, })
        await expect(page.locator('form')).toContainText('Title is empty')
    })

    /* Cancellation */
    test('no edit - cancel', async ({ page }) => {
        if (!await emptyTestData(page)) return

        // cancel pressed
        await makeRoutine({ page, doSave: false, doCancel: true })
        await expect(page.locator('.confirm')).not.toBeAttached()
        await expect(page.locator('.new-routine')).not.toBeAttached()
        await confirmEmptyDetails(page)

        // short cut
        await makeRoutine({ page, doSave: false })
        await page.keyboard.press('Escape')
        await expect(page.locator('.confirm')).not.toBeAttached()
        await expect(page.locator('.new-routine')).not.toBeAttached()
        await confirmEmptyDetails(page)

        // click outside
        await makeRoutine({ page, doSave: false })
        await page.mouse.down()
        await page.mouse.up()
        
        await expect(page.locator('.confirm')).not.toBeAttached()
        await expect(page.locator('.new-routine')).not.toBeAttached()
    })
    test('edit - cancel confirm', async ({ page }) => {
        if (!await emptyTestData(page)) return

        await makeRoutine({ page, title: "New Routine", doSave: false, doCancel: true })
        await expect(page.locator('.confirm')).toBeAttached()

        await page.locator(".confirm__ok-btn").click()
        expect(page.locator('.confirm')).not.toBeAttached()

        await confirmEmptyDetails(page)
    })

    /* Boundaries */
    test('bounds: max title and description', async ({ page }) => {
        if (!await emptyTestData(page)) return

        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        const title = generateRandomString({ length: MAX_TITLE, includeEmojis: true, excludeEntities: true })

        // the received text will always have certain chars as HTML Entities instead of literal values from a contenteditable
        const description = generateRandomString({ length: MAX_DESCR, includeEmojis: true, excludeEntities: true })

        await makeRoutine({ page, title, description })
        await expectRoutinePage({ page, title, description, })
    })
    test('over bounds: cut off', async ({ page }) => {
        if (!await emptyTestData(page)) return

        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        const title = generateRandomString({ length: MAX_TITLE + 12, includeEmojis: true, excludeEntities: true  })
        const description = generateRandomString({ length: MAX_DESCR + 12, includeEmojis: true, excludeEntities: true })

        await makeRoutine({ page, title, description })
        await expectRoutinePage({ page, title: title.slice(0, -12), description: description.slice(0, -12), })
    })

    /* Editing */
    test('title + description update', async ({ page }) => {
        if (!await emptyTestData(page)) return

        await page.locator('.routine__wk-routines-addbtn').dispatchEvent("click")
        await makeRoutine({ page, title: "Old Title", description: "Old Description" })

        await fillInput({ 
            elem: page.getByLabel('Title'), 
            text: "New Title", 
            enter: true, 
            empty: true,
            page 
        })
        await fillInput({ 
            elem: page.getByLabel('Description'), 
            text: "New Description", 
            enter: true, 
            empty: true,
            page 
        })
        await expectRoutinePage({ 
            page, 
            title: "New Title", 
            description: "New Description", 
            routines: ["New Title"]
        })
    })
    test('title + description update - max cut offs', async ({ page }) => {
        if (!await emptyTestData(page)) return
        
        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        await makeRoutine({ page, title: "Old Title", description: "Old Description" })

        const newTitle = generateRandomString({ length: MAX_TITLE + 12, includeEmojis: true,  excludeEntities: true  })
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
            title: newTitle.slice(0, -12), 
            description: newDescription.slice(0, -12), 
            routines: [newTitle.slice(0, -12)]
        })
    })
})

test.describe("working with multiple routines", () => {
    const createThreeRoutines = async (page: any) => {
        await makeRoutine({
            page,
            title: "Routine #1",
            description: "1"
        })
        await makeRoutine({
            page,
            title: "Routine #2",
            description: "2"
        })
        await makeRoutine({
            page,
            title: "Routine #3",
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
            count: 3
        })

        await page.getByRole('button', { name: 'Routine #2' }).click()
        await expectRoutinePage({
            page,
            title: "Routine #2",
            description: "2",
            expectEmptyBreakdown: false,
        })

        await page.getByRole('button', { name: 'Routine #3' }).click()
        await expectRoutinePage({
            page,
            title: "Routine #3",
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
        await page.getByRole('button', { name: 'Routine #1' }).click()
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
        })

        // routine #2
        await page.getByRole('button', { name: 'Routine #2' }).click()
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
        })

        // check list
        await expectRoutinePage({ 
            page, 
            routines: ["New Routine #1", "New Routine #2", "Routine #3"]
        })
    })

    test("setting current routines", async ({ page }) => {
        if (!await emptyTestData(page)) return
        await createThreeRoutines(page)

        // choose 2 as current
        await page.getByRole('button', { name: 'Routine #2' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Choose as Current' }).click()
        await expect(page.locator('.routine__wk-routines-item--chosen')).toBeAttached()

        // go to 2
        await page.getByRole('button', { name: 'Routine #2' }).click()
        await expect(page.locator('.routine__details')).toContainText('Current');
      
        // go to 1 + unselect 2 as current
        await page.getByRole('button', { name: 'Routine #1' }).click()
        await page.getByRole('button', { name: 'Routine #2' }).click({ button: "right" })

        await page.getByRole('button', { name: 'Unselect Routine' }).click()
        await expect(page.locator('.routine__details')).not.toContainText('Current');

        // select 1 as current
        await page.getByRole('button', { name: 'Routine #1' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Choose as Current' }).click()

        await expect(page.locator('.routine__details')).toContainText('Current');
        await expect(page.locator('.routine__wk-routines-item--chosen')).toBeAttached()
    })

    test("deleting all", async ({ page }) => {
        if (!await emptyTestData(page)) return
        await createThreeRoutines(page)

        await page.getByRole('button', { name: 'Routine #2' }).click()

        // delete 1
        await page.getByRole('button', { name: 'Routine #1' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Delete Routine' }).click()

        await confirmDelete(page)

        await expect(page.locator('.routine__wk-routines-list')).not.toContainText("Routine #1")
        await expect(page.locator('.routine__wk-routines-count')).toContainText("2")

        // delete 3
        await page.getByRole('button', { name: 'Routine #3' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Delete Routine' }).click()
        await confirmDelete(page)

        await expect(page.locator('.routine__wk-routines-list')).not.toContainText("Routine #3")
        await expect(page.locator('.routine__wk-routines-count')).toContainText("1")

        // delete 2
        await page.getByRole('button', { name: 'Routine #2' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Delete Routine' }).click()

        await confirmDelete(page)
        await confirmEmptyDetails(page)
    })
    test("deleting current view", async ({ page }) => {
        if (!await emptyTestData(page)) return
        await createThreeRoutines(page)

        await page.getByRole('button', { name: 'Routine #2' }).click()

        await page.getByRole('button', { name: 'Routine #2' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Delete Routine' }).click()

        await confirmDelete(page)

        await expect(page.locator('.routine__details')).not.toBeAttached()
        await expect(page.locator('.routine__breakdown')).not.toBeAttached()
    })
    test("delete set routine in view", async ({ page }) => {
        if (!await emptyTestData(page)) return
        await createThreeRoutines(page)

        // #1 as current and in view -> deleted
        await page.getByRole('button', { name: 'Routine #1' }).click()
        await page.getByRole('button', { name: 'Routine #1' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Choose as Current' }).click()
        await expect(page.locator('.routine__wk-routines-item--chosen')).toBeAttached()

        await page.getByRole('button', { name: 'Routine #1' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Delete Routine' }).click()

        await confirmDelete(page)

        // none shown, none chosen
        await expect(page.locator('.routine__wk-routines-list')).not.toContainText("Routine #1")
        await expect(page.locator('.routine__wk-routines-count')).toContainText("2")
        await expect(page.locator('.routine__wk-routines-item--chosen')).not.toBeAttached()
        await expect(page.locator('.routine__details')).not.toBeAttached()
        await expect(page.locator('.routine__breakdown')).not.toBeAttached()
    })
})

test.describe("week view display", () => {
    test("day header, time blocks, current time indicator, grid rendered properly in all views.", async ({ page }) => {
        const { container, containerBox, blocksBox } = await getContainerData(page)
        const containerWidth = containerBox!.width
        
        const todayIdx = getDayIdxMinutes().dayIdx
        const nowMins = getDayIdxMinutes().minutes

        const nowBarTopOffset  = (nowMins / 1440) * blocksBox!.height
        let nowBarLeftOffset = (containerWidth / 7) * todayIdx


        let hourBlocks = page.locator('.hour-blocks__block')
        expect(await hourBlocks.count()).toBe(23)

        // left hour blocks
        for (let i = 1; i <= 23; i++) {
            const block = hourBlocks.nth(i - 1)
            const timeStr = getTimeFromIdx(i, true)
            const topOffset = ((60 / 1440) * blocksBox!.height) * i

            expect(looseEqualTo(await elemTopOffset(block), topOffset, 3)).toBeTruthy()
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

        // ⛳️ weekly
        await switchWeekView(page, "Weekly")

        // days
        let days = page.locator('.week-view__days-day')
        let dayCount = await days.count()
        expect(dayCount).toBe(7)
        for (let i = 0; i < 7; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 7, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i] + "s")
        }

        // now line
        expect(looseEqualTo(await elemTopOffset(page.locator('.now-line')), nowBarTopOffset, 3)).toBeTruthy()
        expect(looseEqualTo(await elemLeftOffset(page.locator('.now-line')), nowBarLeftOffset, 3)).toBeTruthy()

        // vertical dividers
        let vertDividers = page.locator('.wk-grid__vert-line')
        expect(await vertDividers.count()).toBe(7)

        for (let i = 0; i < 7; i++) {
            const divider = vertDividers.nth(i)
            const leftOffset = (blocksBox!.width / 7) * i

            expect(looseEqualTo(await elemLeftOffsetByBox(container, divider), leftOffset, 3)).toBeTruthy()
        }

        // ⛳️ today
        await switchWeekView(page, "Today")

        // days
        days = page.locator('.week-view__days-day')
        dayCount = await days.count()
        expect(dayCount).toBe(1)
        await expect(days.nth(0)!).toContainText(DAYS_OF_WEEK[todayIdx] + "s")

        // now line
        expect(looseEqualTo(await elemTopOffset(page.locator('.now-line')), nowBarTopOffset, 3)).toBeTruthy()
        expect((await elemLeftOffset(page.locator('.now-line')))).toEqual(0)

        // vertical dividers
        vertDividers = page.locator('.wk-grid__vert-line')
        expect(await vertDividers.count()).toBe(1)

        expect(looseEqualTo(await elemLeftOffsetByBox(container, vertDividers.nth(0)), 0, 3)).toBeTruthy()

        // ⛳️ MTWT
        await switchWeekView(page, "M T W T")

        // days
        days = page.locator('.week-view__days-day')
        dayCount = await days.count()
        expect(dayCount).toBe(4)
        for (let i = 0; i < 4; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 4, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i] + "s")
        }

        // now line
        if ([0, 1, 2, 3].includes(todayIdx)) {
            nowBarLeftOffset = (containerWidth / 4) * todayIdx
            expect(looseEqualTo(await elemTopOffset(page.locator('.now-line')), nowBarTopOffset, 3)).toBeTruthy()
            expect(looseEqualTo(await elemLeftOffset(page.locator('.now-line')), nowBarLeftOffset, 3)).toBeTruthy()
        }

        // vert dividers
        vertDividers = page.locator('.wk-grid__vert-line')
        expect(await vertDividers.count()).toBe(4)

        for (let i = 0; i < 4; i++) {
            const divider = vertDividers.nth(i)
            const leftOffset = (blocksBox!.width / 4) * i

            expect(looseEqualTo(await elemLeftOffsetByBox(container, divider), leftOffset, 3)).toBeTruthy()
        }
        
        // ⛳️ FSS
        await switchWeekView(page, "F S S")

        // days
        days = page.locator('.week-view__days-day')
        dayCount = await days.count()
        expect(dayCount).toBe(3)
        for (let i = 0; i < 3; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 3, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i + 4] + "s")
        }

        // now line
        if ([4, 5, 6].includes(todayIdx)) {
            nowBarLeftOffset = (containerWidth / 3) * (todayIdx - 4)
            expect(looseEqualTo(await elemTopOffset(page.locator('.now-line')), nowBarTopOffset, 3)).toBeTruthy()
            expect(looseEqualTo(await elemLeftOffset(page.locator('.now-line')), nowBarLeftOffset, 3)).toBeTruthy()
        }

        // vert dividers
        expect(await vertDividers.count()).toBe(3)
        for (let i = 0; i < 3; i++) {
            const divider = vertDividers.nth(i)
            const leftOffset = (blocksBox!.width / 3) * i

            expect(looseEqualTo(await elemLeftOffsetByBox(container, divider), leftOffset, 3)).toBeTruthy()
        }
    })

    test("view switch shortcut works", async ({ page }) => {
        const { containerBox } = await getContainerData(page)
        const containerWidth = containerBox!.width
        const todayIdx = getDayIdxMinutes().dayIdx

        // ⛳️ weekly
        await switchWeekView(page, "Weekly", true)

        let days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(7)

        for (let i = 0; i < 7; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 7, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i] + "s")
        }

        // ⛳️ today
        await switchWeekView(page, "Today", true)
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(1)

        await expect(days.nth(0)!).toContainText(DAYS_OF_WEEK[todayIdx] + "s")
        
        // ⛳️ MTWT
        await switchWeekView(page, "M T W T", true)
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(4)

        for (let i = 0; i < 4; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 4, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i] + "s")
        }
        
        // ⛳️ FSS
        await switchWeekView(page, "F S S", true)
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(3)

        for (let i = 0; i < 3; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 3, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i + 4] + "s")
        }
    })

    test("narrow view works", async ({ page }) => {
        await page.setViewportSize({ width: 700, height: 700 })
        let { blocksBox }  = await getContainerData(page)
        let containerWidth = blocksBox!.width
        const todayIdx       = getDayIdxMinutes().dayIdx

        await page.setViewportSize({ width: 700, height: 700 })

        // ⛳️ weekly
        await switchWeekView(page, "Weekly", true)

        let days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(7)

        for (let i = 0; i < 7; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 7, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i].slice(0, 3))
        }

        // ⛳️ today
        await switchWeekView(page, "Today", true)
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(1)

        await expect(days.nth(0)!).toContainText(DAYS_OF_WEEK[todayIdx].slice(0, 3))

        blocksBox = (await getContainerData(page)).blocksBox
        containerWidth = blocksBox!.width
        
        // ⛳️ MTWT
        await switchWeekView(page, "M T W T", true)
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(4)

        for (let i = 0; i < 4; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 4, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i].slice(0, 3))
        }

        blocksBox = (await getContainerData(page)).blocksBox
        containerWidth = blocksBox!.width
        
        // ⛳️ FSS
        await switchWeekView(page, "F S S", true)
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(3)

        for (let i = 0; i < 3; i++) {
            const dayElem = days.nth(i)
            const dayBoundingBox = await dayElem.boundingBox()
            const dayWidth = dayBoundingBox!.width

            expect(dayWidth).toBeCloseTo(containerWidth / 3, 1)
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i + 4].slice(0, 3))
        }
    })

    test("days header + time blocks scroll", async ({ page }) => {
        await page.setViewportSize({ width: 730, height: 700 })

        const container      = page.locator('.week-view__days-container')!
        const blocksContainer = page.locator('.routine-blocks-container')!

        // time blocks vert scroll works
        const hourBlocks = page.locator('.hour-blocks__block')
        const nineBlock = hourBlocks.nth(8)
        await expect(nineBlock).toContainText("9 am")

        const nineBlockTopOffset = await getVertDistanceBetweenTwoElems({
            top: { elem: container, edge: "top" },
            bottom: { elem: nineBlock, edge: "top" }
        })

        await blocksContainer.evaluate((elem: HTMLElement) => elem.scrollTop = elem.scrollHeight)
        const newDistFromTop = await getVertDistanceBetweenTwoElems({
            top: { elem: container, edge: "top" },
            bottom: { elem: nineBlock, edge: "top" },
        })

        // has moved
        expect(newDistFromTop).toBeLessThan(nineBlockTopOffset)
        expect(newDistFromTop).toBeLessThan(0)

        // day header hoz scroll works
        await blocksContainer.evaluate((elem: HTMLElement) => {
            const scrollHeight = elem.scrollHeight
            elem.scrollTop = scrollHeight
        })

        const days = page.locator('.week-view__days-day')
        const wedElem = days.nth(2)
        await expect(wedElem).toContainText("Wed")

        const wedElemLeftOffset = await getHozDistanceBetweenTwoElems({
            left: { elem: container, edge: "left" },
            right: { elem: wedElem, edge: "left" }
        })
        await blocksContainer.evaluate((elem: HTMLElement) => elem.scrollLeft = elem.scrollWidth)

        const newDistFromLeft = await getHozDistanceBetweenTwoElems({
            left: { elem: container, edge: "left" },
            right: { elem: wedElem, edge: "left" }
        })

        // has moved
        expect(newDistFromLeft).toBeLessThan(wedElemLeftOffset)
        expect(newDistFromLeft).toBeLessThan(0)
    })
})

test.describe("rendering blocks", () => {
    test("blocks are properly rendered.", async ({ page }) => {
        const { containerBox, blocksBox } = await getContainerData(page)
        const containerWidth = containerBox!.width
        const weekRoutines       = WEEKLY_ROUTINES
        const testRoutinesIndices    = [0, 1, 5]

        await initTestData(page)
        
        for (let testRoutineIdx of testRoutinesIndices) {
            const wkRoutine = weekRoutines[testRoutineIdx]

            await page.getByRole('button', { name: wkRoutine.name }).click()

            // Loop through each day of the week
            for (let i = 0; i < 7; i++) {
                const dayKey     = DAYS_OF_WEEK[i] as keyof WeeklyRoutineBlocks
                const dayRoutine = wkRoutine.blocks[dayKey]
                const dayBlocks: RoutineBlock[] = "id" in dayRoutine ? dayRoutine.blocks : dayRoutine as RoutineBlock[]
    
                dayBlocks.sort((a, b) => a.startTime - b.startTime)
    
                for (let j = 0; j < dayBlocks.length; j++) {
                    const block = dayBlocks[j]
                    const expectedLeft = (containerWidth / 7) * i
                    const expectedTop  = (block.startTime / 1440) * blocksBox!.height
    
                    // Get actual top and left positions for the block
                    const id  = `${i}--${j}`
                    const blockElem = page.locator(`[id="${id}"]`)
    
                    const actualLeft = await elemLeftOffset(blockElem) - 2
                    const actualTop = await elemTopOffset(blockElem)
    
                    expect(looseEqualTo(actualTop, expectedTop, 1)).toBeTruthy()
                    expect(looseEqualTo(actualLeft, expectedLeft, 1)).toBeTruthy()
                }
            }
        }
    })
    test("blocks are properly rendered between views.", async ({ page }) => {
        const container      = page.locator('.week-view__days-container')!
        const containerBox   = await container!.boundingBox()!
        const containerWidth = containerBox!.width
        const blocksContainer    = page.locator('.routine-blocks')!
        const blocksContainerBox = await blocksContainer!.boundingBox()
        const weekRoutines       = WEEKLY_ROUTINES

        const todayIdx            = getDayIdxMinutes().dayIdx
        const testRoutinesIndices = [0, 1]
        const viewOpts            = ["Weekly", "Today", "M T W T", "F S S"]
        
        for (let testRoutineIdx of testRoutinesIndices) {
            const wkRoutine = weekRoutines[testRoutineIdx]
            await page.getByRole('button', { name: wkRoutine.name }).click()
            
            for (let view of viewOpts) {
                await switchWeekView(page, view as any)
                const dayCount = view === "Weekly" ? 7 : view.split(" ").length

                // Loop through each day of the week
                for (let i = 0; i < dayCount; i++) {
                    const dayIdx     = view === "Today" ? todayIdx : view === "F S S" ? i + 4 : i
                    const dayKey     = DAYS_OF_WEEK[dayIdx] as keyof WeeklyRoutineBlocks
                    const dayRoutine = wkRoutine.blocks[dayKey]
                    const dayBlocks: RoutineBlock[] = "id" in dayRoutine ? dayRoutine.blocks : dayRoutine as RoutineBlock[]
                    
                    dayBlocks.sort((a, b) => a.startTime - b.startTime)
                    
                    for (let j = 0; j < dayBlocks.length; j++) {
                        const block = dayBlocks[j]
                        const expectedLeft = view === "Today" ? 0 : ((containerWidth / dayCount) * i)
                        const expectedTop  = (block.startTime / 1440) * blocksContainerBox!.height
        
                        // Get actual top and left positions for the block
                        const id  = `${dayIdx}--${j}`
                        const blockElem = page.locator(`[id="${id}"]`)
        
                        const actualLeft = await elemLeftOffset(blockElem) - 2
                        const actualTop  = await elemTopOffset(blockElem)
        
                        expect(looseEqualTo(actualTop, expectedTop, 3)).toBeTruthy()
                        expect(looseEqualTo(actualLeft, expectedLeft, 3)).toBeTruthy()
                    }
                }
            }
        }
    })
})

test.describe("stretch edits", () => {
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
        await page.getByRole('button', { name: 'Empty' }).click()

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
        await page.getByRole('button', { name: 'College Student' }).click()
        const { container, blocksContainer } = await getContainerData(page)

        const blocksBox       = (await blocksContainer.boundingBox())!
        const { height } = blocksBox
        
        let scrollTop = await vertScrollElem({ elem: container, to: "bottom", delay: 800 })

        /* new stretch - down to up w no space */
        let sideHusteBlockPos = await getBlockViewPortPos({ page, id: "6--6", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: {
                pos: { 
                    x: sideHusteBlockPos.x,
                    y: topOffsetFromTime({ time: { h: 3, m: 10, ampm: "pm" }, blocksHeight: height, scrollTop }),
                },
            },
            dragTo: [ { x: 0, y: 70 }, { x: 0, y: -70 }, { x: 0, y: -20 } ],
            steps: 20,
            page, elem: container
        })

        await expectEditModalToBe({ startTime: "3:10 PM", endTime: "3:25 PM", page })

        /* new stretch - down to up w space */
        await dragFromTo({
            origin: {
                pos: { 
                    x: sideHusteBlockPos.x,
                    y: topOffsetFromTime({ time: { h: 3, m: 15, ampm: "pm" }, blocksHeight: height, scrollTop })
                }
            },
            dragTo: [ { x: 0, y: 70 }, { x: 0, y: -70 }, { x: 0, y: -15 }, ],
            page, elem: container
        })

        await expectEditModalToBe({ startTime: "3:00 PM", endTime: "3:15 PM", page })
        
        /* new stretch - up to down wo space */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ 
                    time: { h: 7, m: 55, ampm: "pm" }, 
                    absolute: true, 
                    colIdx: 6,
                    page 
                }),
            },
            dragTo: [ { x: 0, y: -70 }, { x: 0, y: +70 }, { x: 0, y: 25 } ],
            page, elem: container
        })

        await expectEditModalToBe({ startTime: "7:40 PM", endTime: "7:55 PM", page })

        /* new stretch - up to down w space */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ 
                    time: { h: 7, m: 45, ampm: "pm" }, 
                    absolute: true, 
                    colIdx: 6,
                    page 
                }),
            },
            dragTo: [ { x: 0, y: -70 }, { x: 0, y: +70 }, { x: 0, y: 25 } ],
            page, elem: container
        })

        await expectEditModalToBe({ startTime: "7:45 PM", endTime: "8:00 PM", page })
    })

    test("new: multi-block, inbetween bounds", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()
        const { container, blocksContainer } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "bottom" })

        /* just enough space - stretch down */
        let topBlockBottomPos = await getBlockViewPortPos({ page, id: "0--9", from: "bottom" }) // dinner

        await dragFromTo({
            origin: { pos: topBlockBottomPos },
            dragTo: { 
                pos: { x: 0, y: 100 } 
            },
            elem: blocksContainer,
            page
        })
        
        // should expect edit modal but correct drag point values (that work in practice) do not work in pw environment
        await expectEditModal(false, page)

        /* no possible - stretch down */
        await dragFromTo({
            origin: { 
                pos: {
                    x: topBlockBottomPos.x,
                    y: topBlockBottomPos.y + 5,
                }
            },
            dragTo: { 
                pos: { x: 0, y: 20 } 
            },
            elem: blocksContainer,
            page
        })
        
        await expectEditModal(false, page)

        /* just enough space - stretch up */
        topBlockBottomPos = await getBlockViewPortPos({ page, id: "0--10", from: "top" }) // internship / research

        await dragFromTo({
            origin: { pos: topBlockBottomPos },
            dragTo: { 
                pos: { x: 0, y: -20 } 
            },
            elem: blocksContainer,
            page
        })
        
        // should expect edit modal but correct drag point values (that work in practice) do not work in pw environment
        await expectEditModal(false, page)

        /* no space possible - stretch up */
        await dragFromTo({
            origin: { 
                pos: {
                    x: topBlockBottomPos.x,
                    y: topBlockBottomPos.y - 5,
                }
            },
            dragTo: { 
                pos: { x: 0, y: -20 } 
            },
            elem: blocksContainer,
            page
        })
        
        await expectEditModal(false, page)
    })

    test("new: multi-block, above a block", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()

        const container       = page.locator('.routine-blocks-container')!
        const blocksContainer = page.locator('.routine-blocks')!

        await vertScrollElem({ elem: container, offset: 50, delay: 800 })
        let bottomBlockBottomPos = await getBlockViewPortPos({ 
            page, id: "0--5", from: "top", offset: { x: 0, y: -1 }, scrollOffset: false
        })

        /* right above + stretch up + block above  */
        await dragFromTo({
            origin: { pos: bottomBlockBottomPos },
            dragTo: { 
                pos: { x: 0, y: -20 } 
            },
            elem: blocksContainer,
            page
        })

        await expectEditModalToBe({ endTime: "2:00 PM", page })

        /* right above + stretch up + clash + block above  */
        await dragFromTo({
            origin: { pos: bottomBlockBottomPos },
            dragTo: { 
                pos: { x: 0, y: -100 } 
            },
            elem: blocksContainer,
            page
        })
        
        await expectEditModalToBe({ startTime: "12:45 PM", endTime: "2:00 PM", page })
    })

    test("old: under a block", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()

        const container       = page.locator('.routine-blocks-container')!
        
        let scrollTop = await vertScrollElem({ elem: container, to: 200 })

        /* stretch up */
        let blockTopPos = await getBlockViewPortPos({ 
            page, id: "0--3", from: "top", scrollOffset: false
        })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "9:15 AM", end: "11:30 AM", blockId: "0--3", page })

        /* stretch up + clash */
        blockTopPos = await getBlockViewPortPos({ 
            page, id: "0--2", from: "top", scrollOffset: false
        })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "7:50 AM", end: "9 AM", blockId: "0--2", page })

        /* no space above + stretch up */
        blockTopPos = await getBlockViewPortPos({ 
            page, id: "0--1", from: "top", scrollOffset: false
        })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "7:30 AM", end: "7:50 AM", blockId: "0--1", page })

        /* stretch up to max */
        blockTopPos = await getBlockViewPortPos({ page, id: "0--0", from: "top", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -1000 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "12 AM", end: "7:30 AM", blockId: "0--0", page })
    })

    test("old: above a block", async ({ page }) => {
        // await initTestData(page)
        await page.getByRole('button', { name: 'College Student' }).click()

        const container       = page.locator('.routine-blocks-container')!
        const blocksContainer = page.locator('.routine-blocks')!
        const blocksBox       = (await blocksContainer.boundingBox())!
        const { height, width } = blocksBox
        
        let scrollTop = await vertScrollElem({ elem: container, to: 300, delay: 800 })

        /* stretch down */
        let blockTopPos = await getBlockViewPortPos({ page, id: "0--3", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "9:30 AM", end: "11:45 AM", blockId: "0--3", page })

        /* stretch up + clash */
        blockTopPos = await getBlockViewPortPos({ page, id: "0--2", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 50 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "8 AM", end: "9:30 AM", blockId: "0--2", page })

        /* no space above + stretch down */
        blockTopPos = await getBlockViewPortPos({ page, id: "0--5", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 13 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "2 PM", end: "4 PM", blockId: "0--5", page })

        /* stretch up to max */
        scrollTop = await vertScrollElem({ elem: container, to: "bottom" })
        blockTopPos = await getBlockViewPortPos({ page, id: "0--12",from:  "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: blockTopPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 100 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "11 PM", end: "11:59 PM", blockId: "0--12", page })
    })

    test("old: stretch pivot points", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()

        const container       = page.locator('.routine-blocks-container')!
        const blocksContainer = page.locator('.routine-blocks')!
        
        let scrollTop = await vertScrollElem({ elem: container, to: 200, delay: 800 })

        /* down to up w no space */
        let gymPos = await getBlockViewPortPos({ page, id: "0--2", from: "bottom", scrollOffset: false })
        let lunchPos = await getBlockViewPortPos({ page, id: "0--4", from: "bottom", scrollOffset: false })

        await dragFromTo({
            origin: { pos: gymPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 20 }, { x: 0, y: -20 }, { x: 0, y: -100 }, ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "8 AM", blockId: "0--2", page })

        /* down to up w space */
        await dragFromTo({
            origin: { pos: lunchPos, offset: { x: 0, y: -1 } },
            dragTo: [ { x: 0, y: 20 }, { x: 0, y: -20 }, { x: 0, y: -75 }, ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "11:30 AM", end: "11:45 AM", blockId: "0--4", page })

        /* up to down wo space */
        lunchPos = await getBlockViewPortPos({ page, id: "3--5", from: "top", scrollOffset: false })

        await dragFromTo({
            origin: { pos: lunchPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -8 }, { x: 0, y: +8 }, { x: 0, y: 30 }, ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "12:55 PM", end: "1:10 PM", blockId: "3--5", page })

        /* up to down w space */
        lunchPos = await getBlockViewPortPos({ page, id: "1--4", from: "top", scrollOffset: false })

        await dragFromTo({
            origin: { pos: lunchPos, offset: { x: 0, y: 1 } },
            dragTo: [ { x: 0, y: -5 }, { x: 0, y: +5 }, { x: 0, y: 150 }, ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "12:45 PM", end: "2 PM", blockId: "1--4", page })
    })
})

test.describe("lift edits", () => {
    test("correct edits state.", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()

        const container       = page.locator('.routine-blocks-container')!
        const blocksContainer = page.locator('.routine-blocks')!
        
        let scrollTop = await vertScrollElem({ elem: container, to: 0, delay: 800 })

        /* stretch up, right on threshold */
        let blockPos = await getBlockViewPortPos({ page, id: "0--0", from: "top" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: BLOCK_EDGE_THRESHOLD - 1 } },
            dragTo: [ { x: 0, y: (-5 - BLOCK_EDGE_THRESHOLD) } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "6:55 AM", blockId: "0--0", page })

        /* stretch down right on threshold */
        blockPos = await getBlockViewPortPos({ page, id: "0--2", from: "bottom" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: -1 - BLOCK_EDGE_THRESHOLD } },
            dragTo: [ { x: 0, y: 5 + BLOCK_EDGE_THRESHOLD } ],
            page, elem: container, scrollTop
        })
        
        await expectBlockElemTimePeriod({ end: "9:05 AM", blockId: "0--2", page })

        /* lift up, right passed top threshold */
        blockPos = await getBlockViewPortPos({ page, id: "1--0", from: "top" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: BLOCK_EDGE_THRESHOLD + 1 } },
            dragTo: [ { x: 0, y: -11 } ],
            page, elem: container, scrollTop
        })
        
        await expectBlockElemTimePeriod({ start: "6:55 AM", end: "7:25 AM",  blockId: "1--0", page })

        /* lift down, right passed bottom threshold */
        blockPos = await getBlockViewPortPos({ page, id: "1--2", from: "bottom" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: -1 - BLOCK_EDGE_THRESHOLD - 1 } },
            dragTo: [ { x: 0, y: 10 } ],
            page, elem: container, scrollTop
        })
        
        await expectBlockElemTimePeriod({ start: "8:05 AM", end: "9:05 AM", blockId: "0--2", page })

        /* lift right edge */
        blockPos = await getBlockViewPortPos({ page, id: "2--0", from: "right" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: -1, y: 0 } },
            dragTo: [ { x: 0, y: -10.5 } ],
            page, elem: container, scrollTop
        })
        
        await expectBlockElemTimePeriod({ start: "6:55 AM", end: "7:25 AM", blockId: "2--0", page })

        /* lift left edge */
        blockPos = await getBlockViewPortPos({ page, id: "2--2", from: "left" })

        await dragFromTo({
            origin: { pos: blockPos, offset: { x: 0, y: 0 } },
            dragTo: [ { x: 0, y: 10 } ],
            page, elem: container, scrollTop
        })

        await expectBlockElemTimePeriod({ start: "8:05 AM", end: "9:05 AM", blockId: "2--2", page })
    })
    test("drop area positioning: moving forwards", async ({ page }) => {
        await page.getByRole('button', { name: 'Empty' }).click()
        
        const { container, containerBox, blocksBox } = await getContainerData(page)
        const containerWidth = containerBox!.width
        const blocksHeight   = blocksBox!.height
        
        const viewOpts = ["Today", "Weekly", "M T W T", "F S S"]
        const todayIdx = (new Date().getDay() + 6) % 7
        
        /* move all the way to the right and then to the left, column by column */
        for (let i = 0; i < viewOpts.length; i++) {
            const view = viewOpts[i]
            await switchWeekView(page, view as any)

            const scrollTop = await vertScrollElem({ elem: container, to: "top", delay: 800 })
            const dayCount = view === "Weekly" ? 7 : view.split(" ").length
            const colWidth = containerWidth / dayCount

            // make a block in first column
            await dragFromTo({
                origin: {
                    pos: { 
                        x: "top-left",
                        y: topOffsetFromTime({ time: { h: 0, m: 0, ampm: "am" }, blocksHeight, scrollTop })
                    }
                },
                dragTo: { 
                    pos: { 
                        x: "top-left",
                        y: topOffsetFromTime({ time: { h: 1, m: 0, ampm: "am" }, blocksHeight, scrollTop })
                    }
                },
                page, elem: container, absolute: true
            })

            await closeEditBlockModal({ page, doSave: true })

            let isToday = view === "Today"
            let blockId = ""

            // Each day of the week
            for (let j = 0; j < dayCount; j++) {
                let dayIdx = j
                blockId    = isToday ? `${todayIdx}--0` : `${dayIdx += view ==="F S S" ? 4 : 0}--0`
                const block      = page.locator(`[id="${blockId}"]`)
                const blockWidth = (await block.boundingBox())!.width
                
                const xOffset    = colWidth * j
                const blockPos   = await getBlockViewPortPos({ page, id: blockId, from: "middle" })
                const dragOrigin = { x: blockPos.x, y: blockPos.y }
                
                const nextColDistFromBlock = await getNextColDistFromBlock({
                    idx: j, blockId, view, page,
                })
                const nextBorderXDist = nextColDistFromBlock + (blockWidth / 2)

                // move just before the vertical border
                await dragFromTo({
                    origin: { pos: dragOrigin },
                    dragTo: { pos: { x: nextBorderXDist - 1, y: 0 } },
                    page, elem: container, mouseup: false
                })

                await expectBlockElem({
                    x: xOffset,
                    blockId: "drop-area-block",
                    page, 
                    width: isToday ? 290 : colWidth
                })

                await page.mouse.up()

                // move right on the vertical border
                await dragFromTo({
                    origin: { pos: dragOrigin, },
                    dragTo: { pos: { x: nextBorderXDist + 1, y: 0 } },
                    page, elem: container, mouseup: false
                })

                await expectBlockElem({
                    x: colWidth * Math.min(j + 1, dayCount - 1), 
                    blockId: "drop-area-block",
                    page, 
                    width: isToday ? 290 : colWidth
                })

                await page.mouse.up()
            }

            await deleteBlock(blockId, page)
        }
    })
    test("drop area positioning: moving backwards", async ({ page }) => {
        await page.getByRole('button', { name: 'Empty' }).click()
        
        const { container, containerBox, blocksBox } = await getContainerData(page)
        const containerWidth = containerBox!.width
        const blocksHeight   = blocksBox!.height
        
        const viewOpts = ["Weekly", "M T W T", "F S S"]
        const todayIdx = (new Date().getDay() + 6) % 7
        
        /* move all the way to the right and then to the left, column by column */
        for (let i = 0; i < viewOpts.length; i++) {
            const view = viewOpts[i]
            await switchWeekView(page, view as any)

            const scrollTop = await vertScrollElem({ elem: container, to: "top", delay: 800 })
            const dayCount  = view === "Weekly" ? 7 : view.split(" ").length
            const colWidth  = containerWidth / dayCount

            // make a block in first column
            await dragFromTo({
                origin: {
                    pos: { 
                        x: "top-right",
                        y: topOffsetFromTime({ time: { h: 0, m: 0, ampm: "am" }, blocksHeight, scrollTop })
                    },
                    offset: { x: -5, y: 0 }
                },
                dragTo: { 
                    pos: { 
                        x: "top-right",
                        y: topOffsetFromTime({ time: { h: 1, m: 0, ampm: "am" }, blocksHeight, scrollTop })
                    }
                },
                page, elem: container, absolute: true
            })

            await closeEditBlockModal({ page, doSave: true })

            let isToday = view === "Today"
            let blockId = ""

            // Each day of the week
            for (let j = 0; j < dayCount; j++) {
                let dayIdx = dayCount - 1 - j
                blockId    = isToday ? `${todayIdx}--0` : `${dayIdx += view ==="F S S" ? 4 : 0}--0`
                
                const colIdx     = (dayCount - 1 - j)
                const block      = page.locator(`[id="${blockId}"]`)
                const blockWidth = (await block.boundingBox())!.width

                const blockPos   = await getBlockViewPortPos({ page, id: blockId, from: "middle" })
                const dragOrigin = { x: blockPos.x, y: blockPos.y }
                
                const nextBorderXDist = -(blockWidth / 2)

                // move just before the vertical border
                await dragFromTo({
                    origin: { pos: dragOrigin },
                    dragTo: { pos: { x: nextBorderXDist, y: 0 } },
                    page, elem: container, mouseup: false
                })

                await expectBlockElem({
                    x: colWidth * colIdx, 
                    blockId: "drop-area-block",
                    page, 
                    width: isToday ? 290 : colWidth
                })

                await page.mouse.up()

                // move right on the vertical border
                await dragFromTo({
                    origin: { pos: dragOrigin, },
                    dragTo: { pos: { x: nextBorderXDist - 3, y: 0 } },
                    page, elem: container, mouseup: false
                })

                await expectBlockElem({
                    x: colWidth * Math.max(colIdx - 1, 0), 
                    blockId: "drop-area-block",
                    page, 
                    width: isToday ? 290 : colWidth
                })
                await page.mouse.up()
            }

            await deleteBlock(blockId, page)
        }


    })
    test("max check + scroll: clockwise", async ({ page }) => {
        await page.getByRole('button', { name: 'Empty' }).click()
        await page.setViewportSize({ width: 700, height: 700 })

        const { container, containerBox, blocksBox } = await getContainerData(page)
        const containerWidth  = containerBox!.width
        const containerHeight = containerBox!.height
        const blocksHeight    = blocksBox!.height

        let blockData
        let blockElem
        let scrollTop = await vertScrollElem({ elem: container, to: "top", delay: 800 })

        /* start from top left corner */ 
        await dragFromTo({
            origin: {
                pos: { 
                    x: "top-left",
                    y: topOffsetFromTime({ time: { h: 0, m: 0, ampm: "am" }, blocksHeight, scrollTop })
                }
            },
            dragTo: { 
                pos: { 
                    x: "top-left",
                    y: topOffsetFromTime({ time: { h: 1, m: 0, ampm: "am" }, blocksHeight, scrollTop })
                }
            },
            page, elem: container, absolute: true
        })

        await closeEditBlockModal({ page, doSave: true })
        scrollTop = await vertScrollElem({ elem: container, to: "top", delay: 1500 })

        /* 1. all the way to the right */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 0, m: 0, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 5, y: 5 }
            },
            dragTo: { 
                pos: { x: containerWidth, y: 0 },
            },
            page, elem: container, mouseup: false, absolute: false, delay: 1000
        })

        blockElem = getFirstBlock({ page, isEdit: true })
        blockData = await getBlockElemData({ blockElem, page })

        await dragFromTo({
            origin: {
                pos: { x: blockData.x, y: blockData.y },
            },
            dragTo: { 
                pos: await getPositionFromTimeDay({ time: { h: 0, m: 0, ampm: "am" }, colIdx: 6, page }),
            },
            page, elem: container
        })

        await expectBlockElemTimePeriod({ start: "12 AM", end: "1 AM", blockId: "6--0", page })
        expect((await isScrolledToEdges(container)).scrolledRight).toBeTruthy

        /* 2. all the way to the bottom */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 0, m: 0, ampm: "am" }, colIdx: 6, absolute: true, page }),
                offset: { x: 5, y: 5 }
            },
            dragTo: { 
                pos: { x: 0, y: containerHeight },
            },
            page, elem: container, mouseup: false, delay: 1000
        });
        
        blockElem = getFirstBlock({ page, isEdit: true })
        blockData = await getBlockElemData({ blockElem, page })
        
        await dragFromTo({
            origin: {
                pos: { x: blockData.x, y: blockData.y },
            },
            dragTo: { 
                pos: await getPositionFromTimeDay({ time: { h: 11, m: 55, ampm: "pm" }, colIdx: 6, page }),
            },
            page, absolute: true, elem: container
        });

        await expectBlockElemTimePeriod({ start: "10:59 PM", end: "11:59 PM", blockId: "6--0", page });
        expect((await isScrolledToEdges(container)).scrolledDown).toBeTruthy()
        expect((await isScrolledToEdges(container)).scrolledRight).toBeTruthy()

        /* 3. all the way to the left */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 11, m: 30, ampm: "pm" }, absolute: true, colIdx: 6, page }),
                offset: { x: 10, y: -5 }
            },
            dragTo: { 
                pos: { x: -containerWidth, y: 0 },
            },
            page, elem: container, mouseup: false, delay: 1000
        })
        
        blockElem = getFirstBlock({ page, isEdit: true })
        blockData = await getBlockElemData({ blockElem, page })
        
        await dragFromTo({
            origin: {
                pos: { x: blockData.x, y: blockData.y },
            },
            dragTo: { 
                pos: await getPositionFromTimeDay({ time: { h: 11, m: 59, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 5, y: -5 }
            },
            page, absolute: true, elem: container
        })

        await expectBlockElemTimePeriod({ start: "10:59 PM", end: "11:59 PM", blockId: "0--0", page });
        expect((await isScrolledToEdges(container)).scrolledDown).toBeTruthy()
        expect((await isScrolledToEdges(container)).scrolledLeft).toBeTruthy()

        /* 4. all the way to the top */
        blockElem = getFirstBlock({ page, isEdit: false })
        blockData = await getBlockElemData({ blockElem, absolutePos: true, page })

        // wait to scroll all the way up
        await dragFromTo({
            origin: {
                pos: { x: blockData.x, y: blockData.y },
                offset: { x: 10, y: 10 }
            },
            dragTo: { 
                pos: { x: 0, y: -containerHeight },
            },
            page, elem: container, mouseup: false, delay: 3000
        })

        blockElem = getFirstBlock({ page, isEdit: true })
        blockData = await getBlockElemData({ blockElem, page })

        // now move cursor near the top to dispatch pointer event that will move the block to where cursro is (block does not move as scroll occurs)
        await dragFromTo({
            origin: {
                pos: { x: 0, y: 0 },
            },
            dragTo: { 
                pos: { x: 0, y: 0 },
                offset: { x: 0, y: -170 }  // BUG: actual user pointer and pointer in the system are not in same location
            },
            page, elem: container, absolute: true
        })

        await expectBlockElemTimePeriod({ start: "12 AM", end: "1 AM", blockId: "0--0", page });
        expect((await isScrolledToEdges(container)).scrolledUp).toBeTruthy()
        expect((await isScrolledToEdges(container)).scrolledLeft).toBeTruthy()
    })
    test("max check + scroll: counter clockwise", async ({ page }) => {
        await page.setViewportSize({ width: 700, height: 700 })
        await page.getByRole('button', { name: 'Empty' }).click()

        const { container, containerBox, blocksBox } = await getContainerData(page)
        const containerWidth  = containerBox!.width
        const containerHeight = containerBox!.height
        const blocksHeight    = blocksBox!.height

        let blockData
        let blockElem
        let scrollTop = await vertScrollElem({ elem: container, to: "top", delay: 800 })

        /* start from top left corner */ 
        await dragFromTo({
            origin: {
                pos: { 
                    x: "top-left",
                    y: topOffsetFromTime({ time: { h: 0, m: 0, ampm: "am" }, blocksHeight, scrollTop })
                }
            },
            dragTo: { 
                pos: { 
                    x: "top-left",
                    y: topOffsetFromTime({ time: { h: 1, m: 0, ampm: "am" }, blocksHeight, scrollTop })
                }
            },
            page, elem: container, absolute: true
        })
 
        await closeEditBlockModal({ page, doSave: true })
        scrollTop = await vertScrollElem({ elem: container, to: "top", delay: 1500 })

        /* 1. move all the way down */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 0, m: 0, ampm: "am" }, colIdx: 0, absolute: true, page }),
                offset: { x: 5, y: 5 }
            },
            dragTo: { 
                pos: { x: 0, y: containerHeight },
            },
            page, elem: container, mouseup: false, delay: 1700
        });
        
        blockElem = getFirstBlock({ page, isEdit: true })
        blockData = await getBlockElemData({ blockElem, page })
        
        await dragFromTo({
            origin: {
                pos: { x: blockData.x, y: blockData.y },
            },
            dragTo: { 
                pos: await getPositionFromTimeDay({ time: { h: 11, m: 55, ampm: "pm" }, colIdx: 0, page }),
            },
            page, absolute: true, elem: container
        })

        await expectBlockElemTimePeriod({ start: "10:59 PM", end: "11:59 PM", blockId: "0--0", page });
        expect((await isScrolledToEdges(container)).scrolledDown).toBeTruthy()
        expect((await isScrolledToEdges(container)).scrolledLeft).toBeTruthy()

        /* 2. move all the way right */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 11, m: 30, ampm: "pm" }, absolute: true, colIdx: 0, page }),
                offset: { x: 5, y: 5 }
            },
            dragTo: { 
                pos: { x: containerWidth, y: 0 },
            },
            page, elem: container, mouseup: false, absolute: false, delay: 1000
        })

        blockElem = getFirstBlock({ page, isEdit: true })
        blockData = await getBlockElemData({ blockElem, page })

        await dragFromTo({
            origin: {
                pos: { x: blockData.x, y: blockData.y },
            },
            dragTo: { 
                pos: await getPositionFromTimeDay({ time: { h: 11, m: 59, ampm: "pm" }, colIdx: 5, page }),
                offset: { x: 5, y: -5 }
            },
            page, elem: container
        })

        await expectBlockElemTimePeriod({ start: "10:59 PM", end: "11:59 PM", blockId: "6--0", page });
        expect((await isScrolledToEdges(container)).scrolledRight).toBeTruthy
        expect((await isScrolledToEdges(container)).scrolledDown).toBeTruthy

        /* 3. move all the way up */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 11, m: 30, ampm: "pm" }, absolute: true, colIdx: 6, page }),
                offset: { x: 10, y: 10 }
            },
            dragTo: { 
                pos: { x: 0, y: -containerHeight },
            },
            page, elem: container, mouseup: false, delay: 3000
        })

        blockElem = getFirstBlock({ page, isEdit: true })
        blockData = await getBlockElemData({ blockElem, page })

        // now move cursor near the top to dispatch pointer event that will move the block to where cursro is (block does not move as scroll occurs)
        await dragFromTo({
            origin: {
                pos: { x: blockData.x, y: blockData.y },
                offset: { x: 10, y: 10 }
            },
            dragTo: { 
                pos: await getPositionFromTimeDay({ time: { h: 0, m: 0, ampm: "am" }, colIdx: 6, page }),
                offset: { x: 0, y: -170 }  // BUG: actual user pointer and pointer in the system are not in same location
            },
            page, elem: container, absolute: true
        })

        await expectBlockElemTimePeriod({ start: "12 AM", end: "1 AM", blockId: "6--0", page });
        expect((await isScrolledToEdges(container)).scrolledUp).toBeTruthy()
        expect((await isScrolledToEdges(container)).scrolledRight).toBeTruthy()

        /* 4. move all the way left */
        await dragFromTo({
            origin: {
                pos: await getPositionFromTimeDay({ time: { h: 0, m: 0, ampm: "am" }, absolute: true, colIdx: 6, page }),
                offset: { x: 10, y: 10 }
            },
            dragTo: { 
                pos: { x: -containerWidth, y: 0 },
            },
            page, elem: container, mouseup: false, delay: 1400
        })
        
        blockElem = getFirstBlock({ page, isEdit: true })
        blockData = await getBlockElemData({ blockElem, page })
        
        await dragFromTo({
            origin: {
                pos: { x: blockData.x, y: blockData.y },
            },
            dragTo: { 
                pos: await getPositionFromTimeDay({ time: { h: 0, m: 0, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 5, y: -5 }
            },
            page, absolute: true, elem: container
        })

        await expectBlockElemTimePeriod({ start: "12 AM", end: "1 AM", blockId: "0--0", page });
        expect((await isScrolledToEdges(container)).scrolledUp).toBeTruthy()
        expect((await isScrolledToEdges(container)).scrolledLeft).toBeTruthy()
    })
    test("correct time", async ({page}) => {
        // await toggleAllowScroll({ allow: false, page })
        await page.getByRole('button', { name: 'Empty' }).click()

        const { container, containerBox } = await getContainerData(page)
        const containerHeight = containerBox!.height

        await vertScrollElem({ elem: container, to: "top", delay: 800 })

        /* 1h */
        await dragFromTo({
            origin: { pos: "top-left" },
            dragTo: { pos: { x: 0, y: 50 } },
            page, elem: container
        })
        await closeEditBlockModal({ page, doSave: true })
        await expectBlockElemTimePeriod({ start: "12 AM", end: "1 AM", blockId: "0--0", page })

        await liftDistPos({
            blockId: "0--0",
            page,
            toTime: { h: 4, m: 0, ampm: "am" }
        })

        /* move 12:25 AM */
        await dragFromTo({
            origin: { 
                pos: await getBlockViewPortPos({ page, id: "0--0", from: "top-left" }),
                offset: { x: 0, y: BLOCK_EDGE_THRESHOLD }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 25, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: 5 }
             },
            page, elem: container, absolute: true, steps: 10
        })

        await expectBlockElemTimePeriod({ start: "12:25 AM", end: "1:25 AM", blockId: "0--0", page })

        /* move to 7:00 AM */
        await dragFromTo({
            origin: { 
                pos: await getBlockViewPortPos({ page, id: "0--0", from: "top-left" }),
                offset: { x: 0, y: BLOCK_EDGE_THRESHOLD }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 0, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: 5 }
            },
            page, elem: container, absolute: true, steps: 50
        })

        await expectBlockElemTimePeriod({ start: "7 AM", end: "8 AM", blockId: "0--0", page })

        /* move to 9:20 AM */
        await dragFromTo({
            origin: { 
                pos: await getBlockViewPortPos({ page, id: "0--0", from: "top-left" }),
                offset: { x: 0, y: BLOCK_EDGE_THRESHOLD }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 9, m: 20, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: 5 }
            },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBlockElemTimePeriod({ start: "9:20 AM", end: "10:20 AM", blockId: "0--0", page })

        await vertScrollElem({ elem: container, offset: 120  })

        /* move to 12 PM */
        await dragFromTo({
            origin: { 
                pos: await getBlockViewPortPos({ page, id: "0--0", from: "top-left" }),
                offset: { x: 0, y: BLOCK_EDGE_THRESHOLD }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 0, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 0, y: 5 }
            },
            page, elem: container, absolute: true, steps: 40
        })

        await expectBlockElemTimePeriod({ start: "12 PM", end: "1 PM", blockId: "0--0", page })

        /* move to 5:55 PM */
        await vertScrollElem({ elem: container, to: containerHeight, delay: 800 })

        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--0" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 5, m: 55, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 0, y: 5  }
            },
            page, elem: container, absolute: true, steps: 80
        })

        await expectBlockElemTimePeriod({ start: "5:55 PM", end: "6:55 PM", blockId: "0--0", page })

        /* move to 3:25 */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--0" }),
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 3, m: 25, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 0, y: -(5 + 3) }
            },
            page, elem: container, absolute: true, steps: 20
        })

        await expectBlockElemTimePeriod({ start: "3:25 PM", end: "4:25 PM", blockId: "0--0", page })

        /* move to 11 PM */
        await vertScrollElem({ elem: container, to: containerHeight + 400, delay: 800 })

        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--0" }),
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 0, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 0, y: 5 }
            },
            page, elem: container, absolute: true, steps: 60
        })

        await expectBlockElemTimePeriod({ start: "10:59 PM", end: "11:59 PM", blockId: "0--0", page })

        /* move to 6 PM */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--0" }),
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 6, m: 0, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 0, y: -(5 + 5) }
            },
            page, elem: container, absolute: true, steps: 40
        })

        await expectBlockElemTimePeriod({ start: "6 PM", end: "7 PM", blockId: "0--0", page })

        /* move to 10:55 PM - Sunday */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--0" }),
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 10, m: 55, ampm: "pm" }, colIdx: 6, page }),
                offset: { x: 0, y: 5 }
            },
            page, elem: container, absolute: true, steps: 40
        })

        await expectBlockElemTimePeriod({ start: "10:55 PM", end: "11:55 PM", blockId: "6--0", page })

        /* move to 6:05 PM - Wednesday */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "6--0" }),
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 6, m: 5, ampm: "pm" }, colIdx: 2, page }),
                offset: { x: 0, y: -(5 + 3) }
            },
            page, elem: container, absolute: true, steps: 40
        })

        await expectBlockElemTimePeriod({ start: "6:05 PM", end: "7:05 PM", blockId: "2--0", page })

        await vertScrollElem({ elem: container, offset: -200, delay: 800 })

        /* move to 12 AM - Sunday */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "2--0" }),
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 0, ampm: "am" }, colIdx: 6, page }),
                offset: { x: 0, y: -(5 + 5) }
            },
            page, elem: container, absolute: true, steps: 100
        })

        await expectBlockElemTimePeriod({ start: "12 AM", end: "1 AM", blockId: "6--0", page })

        await vertScrollElem({ elem: container, to: 0 })
    })
    test("multiple: top and bottom clashes", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })
        await page.getByRole('button', { name: 'College Student' }).click()

        const { container } = await getContainerData(page)

        /* lunch clash with morning lecture */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--4" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 25, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: -(5 + 0) }
             },
            page, elem: container, absolute: true, steps: 10, mouseup: false
        })

        // edit / drop area block shows where the block will end ujp
        await expectBlockElemTimePeriod({ start: "11:30 AM", end: "12:30 PM", blockId: "edit-block", page })
        await expectBlockElemTimePeriod({ start: "11:30 AM", end: "12:30 PM", blockId: "drop-area-block", page })

        await page.mouse.up()
        await expectBlockElemTimePeriod({ start: "11:30 AM", end: "12:30 PM", blockId: "0--4", page })

        /* lunch clash with deep work session */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--4" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 2, m: 5, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 0, y: (5 + 0) }
             },
            page, elem: container, absolute: true, steps: 10, mouseup: false
        })

        // edit / drop area block shows where the block will end up
        await expectBlockElemTimePeriod({ start: "1 PM", end: "2 PM", blockId: "edit-block", page })
        await expectBlockElemTimePeriod({ start: "1 PM", end: "2 PM", blockId: "drop-area-block", page })

        await page.mouse.up()
        await expectBlockElemTimePeriod({ start: "1 PM", end: "2 PM", blockId: "0--4", page })

        /* lunch up clash, moves to 6AM */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--4" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 8, m: 30, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: -(5 + 2) }
             },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBlockElemTimePeriod({ start: "6 AM", end: "7 AM", blockId: "0--0", page })

        /* gym bottom clash to tuesday, moves to 7AM */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--3" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 4, m: 30, ampm: "pm" }, colIdx: 1, page }),
                offset: { x: 0, y: 5 }
             },
            page, elem: container, absolute: true, steps: 50
        })

        await expectBlockElemTimePeriod({ start: "7 PM", end: "8 PM", blockId: "1--9", page })

    })
    test("multiple: moving to closest space when multi many options", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })

        const { container, containerBox, blocksBox } = await getContainerData(page)
        const containerHeight = containerBox!.height

        /* morning run clash with morning routine, moves up*/
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "5--1" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 50, ampm: "am" }, colIdx: 5, page }),
                offset: { x: 0, y: -(5 + 5) }
             },
            page, elem: container, absolute: true, steps: 20
        })

        await expectBlockElemTimePeriod({ start: "6:45 AM", end: "8 AM", blockId: "5--0", page })

        /* morning run clash with morning routine, moves down */
        await page.goto('http://localhost:5173/home/routines/weekly')

        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "5--1" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 55, ampm: "am" }, colIdx: 5, page }),
                offset: { x: 0, y: -(5 + 5) }
             },
            page, elem: container, absolute: true, steps: 20
        })

        await expectBlockElemTimePeriod({ start: "9 AM", end: "10:15 AM", blockId: "5--1", page })
    })
    test("multiple: move to enough space", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })
        await page.getByRole('button', { name: 'College Student' }).click()

        const { container, containerBox } = await getContainerData(page)
        const containerHeight = containerBox!.height

        await vertScrollElem({ elem: container, offset: containerHeight, delay: 800 })

        /* move evening routine to between gym and morning lecture */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--12" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 9, m: 0, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: -(5 + 5) }
             },
            page, elem: container, absolute: true, steps: 70
        })

        await expectBlockElemTimePeriod({ start: "9 AM", end: "9:30 AM", blockId: "0--3", page })

        /* make a 15 min block + put it between lecture and lunch */

        await makeBlock({
            start: { h: 1, m: 30, ampm: "pm" }, end: { h: 1, m: 45, ampm: "pm" },
            vScrollOffset: -30,
            colIdx: 0,  page
        })

        await vertScrollElem({ elem: container, offset: -80, delay: 800 })

        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "0--6" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 30, ampm: "am" }, colIdx: 0, page }),
                offset: { x: 0, y: -(5 + 5) }
             },
            page, elem: container, absolute: true, steps: 40
        })

        await expectBlockElemTimePeriod({ start: "11:30 AM", end: "11:45 AM", blockId: "0--5", page })
    })
    test("multiple: self is ignored in overlapping block search", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })

        const { container, containerBox, blocksBox } = await getContainerData(page)
        const containerHeight = containerBox!.height

        /* morning run clash with morning routine, moves up*/
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "5--0" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 9, m: 20, ampm: "am" }, colIdx: 5, page }),
                offset: { x: 0, y: 5 }
             },
            page, elem: container, absolute: true, steps: 20
        })

        await expectBlockElemTimePeriod({ start: "8:15 AM", end: "9:15 AM", blockId: "5--0", page })

        await page.goto('http://localhost:5173/home/routines/weekly')

        /* morning run clash with morning routine, moves up*/
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "5--1" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 8, m: 55, ampm: "am" }, colIdx: 5, page }),
                offset: { x: 0, y: -(5 + 5) }
             },
            page, elem: container, absolute: true, steps: 20
        })

        await expectBlockElemTimePeriod({ start: "9 AM", end: "10:15 AM", blockId: "5--1", page })
    })
    test("multiple: no possible space", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })
        const { container, } = await getContainerData(page)

        /* move to left, no space, move to og space */

        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "4--1" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 0, ampm: "am" }, colIdx: 3, page }),
                offset: { x: 0, y: -3 }
             },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBlockElemTimePeriod({ start: "7 AM", end: "3 PM", blockId: "4--1", page })

        /* move to right, has space  */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "4--1" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 0, ampm: "am" }, colIdx: 5, page }),
                offset: { x: 0, y: -3 }
                },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBlockElemTimePeriod({ start: "12 AM", end: "8 AM", blockId: "5--0", page })

        await vertScrollElem({ elem: container, to: "top", delay: 800 })

        /* move to thursday, move to friday original space  */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "5--0" })
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 0, ampm: "am" }, colIdx: 2, page }),
                offset: { x: 0, y: -3 }
                },
            page, elem: container, absolute: true, steps: 30
        })

        await expectBlockElemTimePeriod({ start: "6:45 AM", end: "2:45 PM", blockId: "4--1", page })
    })
})

test.describe("duplicate edits", () => {
    test("initial correct state", async ({ page }) => {
        await page.getByRole('button', { name: 'Empty' }).click()
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        
        await makeBlock({
            start: { h: 12, m: 0, ampm: "am" }, end: { h: 12, m: 30, ampm: "am" },
            colIdx: 0,  page
        })

        await duplicateBlock("0--0", page)
        await expectBlockElemTimePeriod({ start: "12 AM", end: "12:30 AM", blockId: "edit-block", page })

        /* initially, no add button nor drop area block */
        await expect(getBlockElem("drop-area-block", page)).not.toBeAttached()
        await expect(page.locator('.routine-blocks__dup-add')).not.toBeAttached()
        await expect(page.locator('.routine-blocks__dup-cancel')).toBeAttached()

        /* ensure cannot switch views  */
        await page.locator('#view-option--dbtn').isDisabled()

        await page.keyboard.press('Digit1')
        let days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(7)

        await page.keyboard.press('Digit2')
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(7)

        await page.keyboard.press('Digit3')
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(7)

        await page.keyboard.press('Digit4')
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(7)

        /* positioning is correct */
        let ogBlockPos = {
            x: await elemLeftOffset(getBlockElem("0--0", page)),
            y: await elemTopOffset(getBlockElem("0--0", page))
        }
        let dupBlockPos = {
            x: await elemLeftOffset(getBlockElem("edit-block", page)),
            y: await elemTopOffset(getBlockElem("edit-block", page))
        }

        expect(looseEqualTo(ogBlockPos.x, dupBlockPos.x, 0.2)).toBeTruthy()
        expect(looseEqualTo(ogBlockPos.y, dupBlockPos.y - 5, 0.1)).toBeTruthy()

        /* bottom most positioning is correct */
        await closeDupBlock(page)
        await deleteBlock("0--0", page)

        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })

        await makeBlock({
            start: { h: 10, m: 30, ampm: "pm" }, end: { h: 11, m: 59, ampm: "pm" },
            colIdx: 0,  page
        })

        await duplicateBlock("0--0", page)
        ogBlockPos = {
            x: await elemLeftOffset(getBlockElem("0--0", page)),
            y: await elemTopOffset(getBlockElem("0--0", page))
        }
        dupBlockPos = {
            x: await elemLeftOffset(getBlockElem("edit-block", page)),
            y: await elemTopOffset(getBlockElem("edit-block", page))
        }

        expect(looseEqualTo(ogBlockPos.x, dupBlockPos.x, 0.2)).toBeTruthy()
        expect(dupBlockPos.y < ogBlockPos.y && looseEqualTo(ogBlockPos.x, dupBlockPos.x, 40)).toBeTruthy()
    })
    test("basic lift edits", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })

        const { container } = await getContainerData(page)

        await duplicateBlock("5--0", page)
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
            blockId: "5--0",
            page
        })

        /* 2. move down, pushed down */
        await duplicateBlock("5--1", page)
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
            blockId: "5--3",
            page
        })

        /* 3. FSS -> sat lunch move all the way to the left: friday */
        await switchWeekView(page, "F S S")

        await duplicateBlock("5--4", page, 1400)
        await vertScrollElem({ elem: container, offset: -300 , delay: 800 })

        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 10 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 10, m: 30, ampm: "pm" }, colIdx: 0, page }),
                offset: { x: 0, y: 5 }
             },
            page, elem: container, absolute: true, steps: 40, mouseup: false
        })

        await expectDupBlock({
            startTime: "11:15 PM",
            endTime: "11:45 PM",
            blockId: "4--7",
            page
        })

        await switchWeekView(page, "Weekly")
        
        await page.waitForTimeout(1000)

        await expectBlockElemTimePeriod({ start: "11:15 PM", end: "11:45 PM", blockId: "4--7",  page })
        await expectBlockElemAtCol({ blockId: "4--7", colIdx: 4, page })
    })
    test("no initial possible space", async ({ page }) => {
        await toggleAllowScroll({ allow: false, page })

        const { container } = await getContainerData(page)

        await duplicateBlock("4--1", page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        await expectBlockElemTimePeriod({ start: "7 AM", end: "3 PM", blockId: "edit-block", page })

        /* dup school @ friday and move it to thursday, no thursday */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 30, ampm: "am" }, colIdx: 3, page }),
                offset: { x: 0, y: 0 }
             },
            page, elem: container, absolute: true, steps: 20
        })

        await expect(getBlockElem("drop-area-block", page)).not.toBeAttached()
        await page.mouse.up()

        await expect(page.locator('.routine-blocks__dup-add')).not.toBeAttached()
        await expect(page.locator('.routine-blocks__dup-cancel')).toBeAttached()

        await expectBlockElem({ 
            blockId: "edit-block", startTime: { h: 7, m: 0, ampm: "am" }, 
            doCheckPos: false, colIdx: 3, page 
        })

        /* then move to sunday */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 30, ampm: "am" }, colIdx: 6, page }),
                offset: { x: 20, y: 20 }
             },
            page, elem: container, absolute: true, steps: 50
        })

        await expect(page.locator('.routine-blocks__dup-add')).toBeAttached()
        await expectBlockElem({ 
            blockId: "edit-block", startTime: { h: 12, m: 0, ampm: "am" }, 
            doCheckPos: false, colIdx: 6, page 
        })

        /* then move to wed */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 7, m: 30, ampm: "am" }, colIdx: 2, page }),
                offset: { x: -20, y: 20 }
             },
            page, elem: container, absolute: true, steps: 50
        })

        await expect(page.locator('.routine-blocks__dup-add')).toBeAttached()
        await expectBlockElem({ 
            blockId: "edit-block", startTime: { h: 12, m: 0, ampm: "am" }, 
            doCheckPos: false, colIdx: 5, page 
        })

    })
    test("button positioning: small", async ({ page }) => {
        await page.getByRole('button', { name: 'Empty' }).click()
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        
        await makeBlock({
            start: { h: 4, m: 0, ampm: "am" }, end: { h: 4, m: 40, ampm: "am" },
            colIdx: 0,  page
        })

        await duplicateBlock("0--0", page)
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

        
        /* TR → bottom */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 0, ampm: "am" }, colIdx: 6, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 80
        })

        await expectBtnPlacement("bottom", page)

        /* ~TR → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 30, ampm: "am" }, colIdx: 6, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 5
        })

        await expectBtnPlacement("top", page)

        /* BR → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 19, ampm: "pm" }, colIdx: 6, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 80
        })

        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })
        await expectBtnPlacement("top", page)

        /* ~BR → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 0, ampm: "pm" }, colIdx: 6, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 5
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
        await page.getByRole('button', { name: 'Empty' }).click()
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        
        await makeBlock({
            start: { h: 6, m: 0, ampm: "am" }, end: { h: 11, m: 0, ampm: "am" },
            colIdx: 0,  page
        })

        await duplicateBlock("0--0", page)
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

        /* TR → bottom */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 0, ampm: "am" }, colIdx: 6, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 80
        })

        await expectBtnPlacement("left", page)

        /* ~TR → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 12, m: 30, ampm: "am" }, colIdx: 6, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 5
        })

        await expectBtnPlacement("top", page)

        /* BR → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 11, m: 19, ampm: "pm" }, colIdx: 6, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 80
        })

        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })
        await expectBtnPlacement("left", page)

        /* ~BR → top */
        await dragFromTo({
            origin: { 
                pos: await liftBlockFromBlock({ page, blockId: "edit-block" }),
                offset: { x: 0, y: 20 }
            },
            dragTo: { 
                pos: await liftBlockToTime({ time: { h: 6, m: 0, ampm: "pm" }, colIdx: 6, page }),
                offset: { x: 10, y: 20 }
                },
            page, elem: container, absolute: true, steps: 5
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
        await expectBtnPlacement("right", page)

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

test.describe("modal Edits", () => {
    test("modal invocation - no changes made", async ({ page }) => {
        await initTestData(page)

        let blockElem = getBlockElem("0--0", page)
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

        let blockElem = getBlockElem("0--0", page)
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
        let blockElem = getBlockElem("0--0", page)
        let title = "New Title"

        /* changes are saved */
        await blockElem.click()
        await fillEditModal({ title, page })

        await expectBlockElem({ title, blockId: "0--0", page })
        await blockElem.click()
        await expectEditModalToBe({ page, title, close: false })

        /* max title */
        const MAX_BLOCK_TITLE = RoutinesManager.MAX_BLOCK_TITLE
        title = generateRandomString({ length: MAX_BLOCK_TITLE, includeEmojis: true, excludeEntities: true  })
        await fillEditModal({ title: title, page })

        await expectBlockElem({ title, blockId: "0--0", page })
        await blockElem.click()
        await expectEditModalToBe({ page, title, close: false })


        /* more than max */
        title = generateRandomString({ length: MAX_BLOCK_TITLE + 12, includeEmojis: true, excludeEntities: true  })
        
        await fillEditModal({ title: title, page })

        await expectBlockElem({ title: title.slice(0, -12), blockId: "0--0", page })
        await blockElem.click()
        await expectEditModalToBe({ page, title: title.slice(0, -12), close: false })

        /* no title should default to Untitled */

        title = ""
        await fillEditModal({ title, page })

        await expectBlockElem({ title: "Untitled", blockId: "0--0", page })
        await blockElem.click()
        await expectEditModalToBe({ page, title: "Untitled", close: false })

    }) 
    test("description change", async ({ page }) => {
        const MAX = RoutinesManager.MAX_BLOCK_DESCRIPTION
        const blockElem = getBlockElem("0--0", page)

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
        let blockElem = getBlockElem("0--0", page)
        const colorIdx = 13
        const color = COLOR_SWATCHES.d[colorIdx]
    
        /* changes are saved */
        await blockElem.click()
        await page.locator('#color-picker--dbtn').click()
        await page.locator(`.color-picker__grid > div:nth-child(${colorIdx + 1})`).first().click()

        await page.locator('#color-picker--dbtn').click();

        await expectComputedStyle({ 
            prop: "background-color",
            val: `rgb(${color.dark2})`,
            query: ".edit-routine__color",
            page
        })

        await closeEditBlockModal({ page, doSave: true })
        await page.waitForTimeout(200)

        blockElem = getBlockElem("0--0", page)
        const blockContent = blockElem.locator(".routine-blocks__block-content")

         await expectComputedStyle({ 
            prop: "background-color",
            elem: blockContent,
            val: `rgb(${color.dark2})`,
            page
         })
    })
    test("action items", async ({ page }) => {
        let blockElem = getBlockElem("0--0", page)
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
        let blockElem     = getBlockElem("5--0", page)
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
        blockElem     = getBlockElem("5--1", page)
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

        blockElem     = getBlockElem("5--1", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")

        await expectAttribute({
            elem: blockElemIcon,
            attr: "data-icon",
            value: "sun",
            page
        })

        // make sure new still hasn't been set
        blockElem     = getBlockElem("5--0", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")

        await expect(blockElemIcon).not.toBeAttached()

        /* 3. unset as new first block */
        blockElem     = getBlockElem("5--1", page)
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

        blockElem     = getBlockElem("5--1", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")

        await expect(blockElemIcon).not.toBeAttached()
    })
    test("last block changes", async ({ page }) => {
        let blockElem     = getBlockElem("5--0", page)
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
        blockElem     = getBlockElem("5--1", page)
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
        blockElem     = getBlockElem("5--0", page)
        blockElemIcon = blockElem.locator(".routine-blocks__block-order-icon svg")

        await expect(blockElemIcon).not.toBeAttached()

        /* 3. unset as new last block */
        blockElem     = getBlockElem("5--1", page)
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
        let blockElem = getBlockElem("0--1", page)
        await blockElem.click()
        
        /* items are saved properly */
        await page.getByRole('button', { name: '🎒 School' }).click()
        await page.locator('#tag-picker--dmenu').getByRole('button', { name: '🍖 Cooking' }).click()

        await closeEditBlockModal({ page, doSave: true })

        await blockElem.click()
        await expect(page.locator('#tag-picker--dbtn')).toContainText('Cooking')
    })
    test("core changes", async ({ page }) => {
        let blockElem = getBlockElem("0--1", page)
        await blockElem.click()
        
        /* items are saved properly */
        await page.getByRole('button', { name: 'Working' }).click()
        await page.getByRole('button', { name: 'Mind' }).click()

        await closeEditBlockModal({ page, doSave: true })

        await blockElem.click()
        await expect(page.locator('#core-dropdown--dbtn')).toContainText('Mind');
    })
    test("time changes - valid", async ({ page }) => {
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top" })

        /* 1. make new block + lift edit */
        await makeBlock({
            start: { h: 5, m: 0, ampm: "am" }, end: { h: 6, m: 0, ampm: "am" },
            colIdx: 5, close: false, page
        })

        let blockElem = await getBlockElem("5--0", page)

        await fillEditModal({ page, startTime: "2:04 AM", endTime: "3:59 AM" })
        await page.waitForTimeout(200)

        await expectBlockElem({ 
            blockId: "5--0", 
            startTime: { h: 2, m: 4, ampm: "am" }, 
            endTime: { h: 3, m: 59, ampm: "am" }, 
            colIdx: 5,
            page 
        })

        
        /* 2. all the way up */
        await blockElem.click()
        await fillEditModal({ page, startTime: "12 AM", endTime: "1 AM" })
        await page.waitForTimeout(200)

        await expectBlockElemAt({ 
            blockId: "5--0", 
            startTime: { h: 12, m: 0, ampm: "am" }, 
            endTime: { h: 1, m: 0, ampm: "am" }, 
            colIdx: 5,
            page 
        })

        /* 3. stretch down */
        await blockElem.click()
        await fillEditModal({ page, endTime: "1:30 AM" })
        await page.waitForTimeout(200)
        
        await expectBlockElemAt({ 
            blockId: "5--0", 
            startTime: { h: 12, m: 0, ampm: "am" }, 
            endTime: { h: 1, m: 30, ampm: "am" }, 
            colIdx: 5,
            page 
        })

        /* 4. all the way down */
        await blockElem.click()
        await fillEditModal({ page, startTime: "11:30 PM", endTime: "11:59 PM" })
        await page.waitForTimeout(200)

        blockElem = await getBlockElem("5--7", page)

        await expectBlockElemAt({ 
            blockId: "5--7", 
            startTime: { h: 11, m: 30, ampm: "pm" }, 
            endTime: { h: 11, m: 59, ampm: "pm" }, 
            colIdx: 5,
            page 
        })

        /* 5. stretch up */
        await blockElem.click()
        await fillEditModal({ page, startTime: "11:15 PM"  })
        await page.waitForTimeout(200)

        await expectBlockElemAt({ 
            blockId: "5--7", 
            startTime: { h: 11, m: 15, ampm: "pm" }, 
            endTime: { h: 11, m: 59, ampm: "pm" }, 
            colIdx: 5,
            page 
        })

        /* 5. just the right amount */
        await blockElem.click()
        await fillEditModal({ page, startTime: "6:30 PM", endTime: "7:30 PM" })
        await page.waitForTimeout(200)

        blockElem = await getBlockElem("5--4", page)

        await expectBlockElemAt({ 
            blockId: "5--4", 
            startTime: { h: 6, m: 30, ampm: "pm" }, 
            endTime: { h: 7, m: 30, ampm: "pm" }, 
            colIdx: 5,
            page 
        })

        /* 6. just the right amount min */
        await blockElem.click()
        await fillEditModal({ page, startTime: "8:00 PM", endTime: "8:15 PM" })
        await page.waitForTimeout(200)

        blockElem = await getBlockElem("5--5", page)

        await expectBlockElemAt({ 
            blockId: "5--5", 
            startTime: { h: 8, m: 0, ampm: "pm" }, 
            endTime: { h: 8, m: 15, ampm: "pm" }, 
            colIdx: 5,
            page 
        })

        /* 7. max */
        await page.getByRole('button', { name: 'Empty' }).click()
        await vertScrollElem({ elem: container, to: "top" })

        await makeBlock({
            start: { h: 5, m: 0, ampm: "am" }, end: { h: 6, m: 0, ampm: "am" },
            colIdx: 0, close: false, page
        })

        blockElem = await getBlockElem("0--0", page)

        await fillEditModal({ page, startTime: "12 AM", endTime: "11:59 PM" })
        await page.waitForTimeout(200)

        await expectBlockElemAt({ 
            blockId: "0--0", 
            startTime: { h: 12, m: 0, ampm: "am" }, 
            endTime: { h: 11, m: 59, ampm: "pm" }, 
            colIdx: 0,
            page 
        })
    })
    test("time changes - invalid overlaps", async ({ page }) => {
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, offset: -70 })

        const expectOverlapMessage = async (name: string) => {
            const str = `Changes couldn't be saved. Overlaps with ${name}`
            await expectToastMsg({ title: str, page })
        }

        await makeBlock({
            start: { h: 10, m: 45, ampm: "am" }, end: { h: 11, m: 30, ampm: "am" },
            colIdx: 5, close: false, page
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
        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, offset: -70 })

        await makeBlock({
            start: { h: 10, m: 45, ampm: "am" }, end: { h: 11, m: 30, ampm: "am" },
            colIdx: 5, close: false, page
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

test.describe("core updates", () => {
    test("hs student - display correct breakdown", async ({ page }) => {
        await page.getByRole('button', { name: 'High School Student' }).click()
        let container = page.locator('.routine__breakdown')

        /* weekly */
        await expectCoreBreakdown({
            container,
            expectData: TEST_WEEKLY_BREAKDOWN[0].coreBreakdown
        })

        /* daily */
        await page.getByRole('button', { name: 'Mondays' }).click()
        container = page.locator('#day-breakdown--dmenu')

        // monday
        await expectCoreBreakdown({
            container,
            expectData: TEST_DAILY_BREAKDOWN[0].coreBreakdown
        })

        // tuesday
        await page.getByRole('button', { name: 'Tuesdays' }).click()
        container = page.locator('#day-breakdown--dmenu')

        await expectCoreBreakdown({
            container,
            expectData: TEST_DAILY_BREAKDOWN[1].coreBreakdown
        })

        // saturday
        await page.getByRole('button', { name: 'Saturday' }).click()
        container = page.locator('#day-breakdown--dmenu')

        await expectCoreBreakdown({
            container,
            expectData: TEST_DAILY_BREAKDOWN[2].coreBreakdown
        })

        // saturday in FSS view
        await switchWeekView(page, "F S S")
        await page.getByRole('button', { name: 'Sat' }).click()
        container = page.locator('#day-breakdown--dmenu')

        await expectCoreBreakdown({
            container,
            expectData: TEST_DAILY_BREAKDOWN[2].coreBreakdown
        })
    })
    test("college student - display correct breakdown", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()
        let container = page.locator('.routine__breakdown')

        /* weekly */
        await expectCoreBreakdown({
            container,
            expectData: TEST_WEEKLY_BREAKDOWN[1].coreBreakdown
        })

        /* daily */
        await page.getByRole('button', { name: 'Mondays' }).click()
        container = page.locator('#day-breakdown--dmenu')

        // monday
        await expectCoreBreakdown({
            container,
            expectData: TEST_DAILY_BREAKDOWN[3].coreBreakdown
        })
    })
    test("edit changes #1", async ({ page }) => {
        // changes - stretch up / down, deletions
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'College Student' }).click()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[1].coreBreakdown)

        /* increase first block by 2 hours */
        await stretchBlock({
            blockId: "1--0",
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
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "sleeping", totalTime: { offset: -120 } }, 
                { core: "awake", totalTime: { offset: +120 } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })

        /* increase relaxation by 55 mins down */
        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })
        
        await stretchBlock({
            blockId: "1--8",
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
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "selfCare", totalTime: { offset: +55 } }, 
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })

        /* delete morning lecture and internship search */
        await vertScrollElem({ elem: container, to: "top", delay: 800 })
        await deleteBlock("1--3", page)

        await vertScrollElem({ elem: container, to: "bottom", delay: 800 })
        await deleteBlock("1--10", page)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "working", totalTime: { offset: -(120 + 75) }, total: { offset: -2 } },
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [ 
                { core: "working", totalTime: { offset: -(120 + 75) }, total: { offset: -2 } }, 
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })

        /* increase last block */
        await stretchBlock({
            blockId: "1--12",
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
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "sleeping", totalTime: { offset: -29 } }, 
                { core: "awake", totalTime: { offset: +29 } },
                { core: "selfCare", totalTime: { offset: -1 } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
    test("edit changes #2", async ({ page }) => {
        // changes - lift up / down, modal time / additions, core changes
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'College Student' }).click()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[1].coreBreakdown)

        /* lift morning up */
        await liftBlock({
            blockId: "1--0",
            toTime: { h: 1, m: 0, ampm: "am" },
            toColIdx: 1,
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
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "sleeping", totalTime: { offset: -(6 * 60) } }, 
                { core: "awake", totalTime: { offset: +(6 * 60) } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })

        await page.waitForTimeout(200)

        /* deep work from 1 to 1:30 */
        await fillEditModal({ blockId: "1--5", startTime: "1:00 PM", endTime: "1:30 PM", page })
        await page.waitForTimeout(200)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "working", totalTime: { offset: -90 } }, 
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "working", totalTime: { offset: -90 } }, 
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })

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
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "body", totalTime: { offset: 75 } }, 
            ],
        })
        
        /* change new to mind */
        await fillEditModal({ blockId: "1--6", core: "Mind", page })
        await page.waitForTimeout(200)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "body", totalTime: { offset: -75 } }, 
                { core: "mind", totalTime: { offset: 75 }, avgTime: { total: 75 }, total: { total: 1 } }, 
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "body", totalTime: { offset: -75 } }, 
                { core: "mind", totalTime: { offset: 75 }, avgTime: { total: 75 }, total: { total: 1 } }, 
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
    test("awake / asleep - changing first / last", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'College Student' }).click()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[1].coreBreakdown)

        /* change first */
        await fillEditModal({ blockId: "1--1", settingsOptn: "Set as new first block", page })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: +(30) } }, 
                { core: "awake", totalTime: { offset: -(30) } }
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "sleeping", totalTime: { offset: +(30) } }, 
                { core: "awake", totalTime: { offset: -(30) } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })

        /* change last */
        await page.waitForTimeout(200)
        await fillEditModal({ blockId: "1--10", settingsOptn: "Set as new last block", page })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: +(75) } }, 
                { core: "awake", totalTime: { offset: -(75) } }
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "sleeping", totalTime: { offset: +(75) } }, 
                { core: "awake", totalTime: { offset: -(75) } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
    test("awake / asleep - only first", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()

        /* change new to mind */
        await fillEditModal({ blockId: "1--12", settingsOptn: "Unset as last block", page })

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[1].coreBreakdown)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        weekCoreData = updateCoreData({
            cores: weekCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
    test("awake / asleep - only last", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()

        /* change new to mind */
        await fillEditModal({ blockId: "1--0", settingsOptn: "Unset as first block", page })

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[1].coreBreakdown)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        weekCoreData = updateCoreData({
            cores: weekCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
    test("awake / asleep - last then first", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'College Student' }).click()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[1].coreBreakdown)

        /* morning routine becomes last, block after becomes first */
        await fillEditModal({ blockId: "1--1", settingsOptn: "Set as new first block", page })
        await fillEditModal({ blockId: "1--0", settingsOptn: "Set as new last block", page })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        weekCoreData = updateCoreData({
            cores: weekCoreData,
            changes: [
                { core: "sleeping", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
                { core: "awake", totalTime: { total: -1 }, avgTime: { total: -1 }, total: { total: -1 }, }, 
            ]
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
    test("awake / asleep - right next to each other", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'College Student' }).click()

        let dayCoreData  = structuredClone(TEST_DAILY_BREAKDOWN[3].coreBreakdown)
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[1].coreBreakdown)

        await fillEditModal({ blockId: "1--1", settingsOptn: "Set as new last block", page })
        await page.waitForTimeout(200)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: +(940) } }, 
                { core: "awake", totalTime: { offset: -(940) } }
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "sleeping", totalTime: { offset: +(940) } }, 
                { core: "awake", totalTime: { offset: -(940) } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Tuesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
    test("awake / asleep - non set to set (weekly)", async ({ page }) => {
        await page.getByRole('button', { name: 'High School Student' }).click()

        /* sat and sun are empty */
        await fillEditModal({ blockId: "5--0", settingsOptn: "Set as first block", page })
        await fillEditModal({ blockId: "5--6", settingsOptn: "Set as last block", page })

        await fillEditModal({ blockId: "6--0", settingsOptn: "Set as first block", page })
        await fillEditModal({ blockId: "6--6", settingsOptn: "Set as last block", page })
        
        /* now update the weekly */
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[0].coreBreakdown)

        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "sleeping", totalTime: { total: (525 * 2) + (405 * 5) - 7 } }, 
                { core: "awake",    totalTime: { total: 10080 - ((525 * 2) + (405 * 5)) + 7 } }
            ]
        })

        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
})

test.describe("tag updates", () => {
    test("hs student - display correct breakdown", async ({ page }) => {
        await page.getByRole('button', { name: 'High School Student' }).click()

        /* weekly */
        await expectWeekTagBreakDown({
            weekTagData: TEST_WEEKLY_BREAKDOWN[0].tagBreakdown,
            page
        })
        /* daily */

        // monday
        await expectDayTagBreakDown({
            dayTagData: TEST_DAILY_BREAKDOWN[0].tagBreakdown,
            day: "Mondays",
            page
        })

        // tuesday
        await expectDayTagBreakDown({
            dayTagData: TEST_DAILY_BREAKDOWN[1].tagBreakdown,
            day: "Tuesdays",
            page
        })

        // saturday
        await expectDayTagBreakDown({
            dayTagData: TEST_DAILY_BREAKDOWN[2].tagBreakdown,
            day: "Saturday",
            page
        })

        // saturday in FSS view
        await switchWeekView(page, "F S S")
        await page.waitForTimeout(1000)

        await expectDayTagBreakDown({
            dayTagData: TEST_DAILY_BREAKDOWN[2].tagBreakdown,
            day: "Saturdays",
            page
        })
    })
    test("college student - display correct breakdown", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()

        /* weekly */
        await expectWeekTagBreakDown({
            weekTagData: TEST_WEEKLY_BREAKDOWN[1].tagBreakdown,
            page
        })

        /* daily */

        // monday
        await expectDayTagBreakDown({
            day: "Mondays",
            dayTagData: TEST_DAILY_BREAKDOWN[3].tagBreakdown,
            page
        })
    })
    test("edit changes", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'College Student' }).click()

        let dayTagData  = structuredClone(TEST_DAILY_BREAKDOWN[3].tagBreakdown)
        let weekTagData = structuredClone(TEST_WEEKLY_BREAKDOWN[1].tagBreakdown)

        /* stretch up - morning lecture */
        await stretchBlock({
            blockId: "1--3",
            dragOrigin: "top",
            dragTo: { h: 9, m: 0, ampm: "am" },
            page,
        })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "School", totalTime: { offset: 30 } }]
        })
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "School", totalTime: { offset: 30 } }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Tuesdays", page })
        await expectWeekTagBreakDown({ weekTagData, page })

        /* stretch down */
        await stretchBlock({
            blockId: "1--8",
            dragOrigin: "bottom",
            dragTo: { h: 8, m: 0, ampm: "pm" },
            vScrollTo: "bottom",
            page,
        })

        await fillEditModal({ blockId: "1--8", tag: "Meditation", page })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Meditation", totalTime: { offset: 90 }, total: { total: 1 } }]
        })
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "Meditation", totalTime: { offset: 90 } , total: { total: 1 } }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Tuesdays", page })
        await expectWeekTagBreakDown({ weekTagData, page })

        /* lift gym deep work session */
        await fillEditModal({ blockId: "1--2", startTime: "12 AM", endTime: "2:33 AM", page })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Body", totalTime: { offset: 93 } }]
        })
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "Body", totalTime: { offset: 93 }  }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Tuesdays", page })
        await expectWeekTagBreakDown({ weekTagData, page })

        /* delete gym */
        await deleteBlock("1--0", page)

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Body", totalTime: { offset: -153 } }]
        })
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "Body", totalTime: { offset: -153 }  }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Tuesdays", page })
        await expectWeekTagBreakDown({ weekTagData, page })

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
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "Body", totalTime: { offset: +31 }, total: { total: 1 }   }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Tuesdays", page })
        // await expectWeekTagBreakDown({ weekTagData, page })
    })
})

test.describe("linked routines", () => {
    test("stretches", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'High School Student' }).click()

        /* stretch up */
        await stretchBlock({
            blockId: "0--1",
            dragOrigin: "top",
            dragTo: { h: 5, m: 0, ampm: "am" },
            page,
        })

        await expectBlockElem({ 
            blockId: "0--1", 
            startTime: { h: 6, m: 45, ampm: "am" }, 
            endTime: { h: 3, m: 0, ampm: "pm" }, 
            colIdx: 0, 
            page 
        })
        await expectBlockElem({ 
            blockId: "2--1", 
            startTime: { h: 6, m: 45, ampm: "am" }, 
            endTime: { h: 3, m: 0, ampm: "pm" }, 
            colIdx: 2, 
            page 
        })

        /* stretch down */
        await stretchBlock({
            blockId: "0--8",
            dragOrigin: "bottom",
            vScrollTo: "bottom",
            dragTo: { h: 11, m: 59, ampm: "pm" },
            page,
        })

        await expectBlockElem({ 
            blockId: "0--8", 
            startTime: { h: 10, m: 45, ampm: "pm" }, 
            endTime: { h: 11, m: 59, ampm: "pm" }, 
            colIdx: 0, 
            page 
        })

        await expectBlockElemAt({ 
            blockId: "2--8", 
            startTime: { h: 10, m: 45, ampm: "pm" }, 
            endTime: { h: 11, m: 59, ampm: "pm" }, 
            colIdx: 2, 
            page 
        })
    })
    test("lifts", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'High School Student' }).click()

        /* lift up */
        await liftBlock({
            blockId: "0--0",
            toTime: { h: 3, m: 0, ampm: "am" },
            toColIdx: 0,
            steps: 40,
            vScrollTo: "top",
            up: true,
            page
        })

        await expectBlockElem({ 
            blockId: "0--0", 
            startTime: { h: 3, m: 0, ampm: "am" }, 
            endTime: { h: 3, m: 45, ampm: "am" }, 
            colIdx: 0, 
            page 
        })

        await expectBlockElem({ 
            blockId: "2--0", 
            startTime: { h: 3, m: 0, ampm: "am" }, 
            endTime: { h: 3, m: 45, ampm: "am" }, 
            colIdx: 2, 
            page 
        })

        /* overlap */
        await liftBlock({
            blockId: "0--1",
            toTime: { h: 3, m: 0, ampm: "am" },
            toColIdx: 0,
            steps: 40,
            up: true,
            page
        })

        await expectBlockElem({ 
            blockId: "0--1", 
            startTime: { h: 3, m: 45, ampm: "am" }, 
            endTime: { h: 11, m: 45, ampm: "am" }, 
            colIdx: 0, 
            page 
        })

        await expectBlockElem({ 
            blockId: "2--1", 
            startTime: { h: 3, m: 45, ampm: "am" }, 
            endTime: { h: 11, m: 45, ampm: "am" }, 
            colIdx: 2, 
            page 
        })
    })
    test("lift between columns", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'High School Student' }).click()

        /* away */
        await liftBlock({
            blockId: "0--0",
            toTime: { h: 4, m: 0, ampm: "am" },
            toOffset: { x: 0, y: -2 },
            toColIdx: 1,
            steps: 40,
            up: true,
            vScrollTo: "top",
            page
        })
        await expectBlockElem({ 
            blockId: "1--0", 
            startTime: { h: 4, m: 0, ampm: "am" }, 
            endTime: { h: 4, m: 45, ampm: "am" }, 
            title: "🌤️ Morning Routine",
            colIdx: 1, 
            page 
        })
        await expectBlockElem({ 
            blockId: "0--0", 
            title: "🎒 School",
            colIdx: 0, 
            page 
        })
        await expectBlockElem({ 
            blockId: "2--0", 
            title: "🎒 School",
            colIdx: 2, 
            page 
        })

        /* to column */
        await liftBlock({
            blockId: "1--0",
            toTime: { h: 7, m: 30, ampm: "am" },
            toOffset: { x: 0, y: -2 },
            toColIdx: 2,
            steps: 20,
            up: true,
            page
        })
        await expectBlockElem({ 
            blockId: "0--0", 
            startTime: { h: 6, m: 15, ampm: "am" },
            endTime: { h: 7, m: 0, ampm: "am" },
            title: "🌤️ Morning Routine",
            colIdx: 0, 
            page 
        })
        await expectBlockElem({ 
            blockId: "2--0", 
            startTime: { h: 6, m: 15, ampm: "am" },
            endTime: { h: 7, m: 0, ampm: "am" },
            title: "🌤️ Morning Routine",
            colIdx: 2, 
            page 
        })

        /* to a sibling day #1 */
        await liftBlock({
            blockId: "2--0",
            toTime: { h: 5, m: 45, ampm: "am" },
            toOffset: { x: 0, y: 0 },
            toColIdx: 0,
            steps: 20,
            up: true,
            page
        })
        await expectBlockElem({ 
            blockId: "0--0", 
            startTime: { h: 5, m: 45, ampm: "am" },
            endTime: { h: 6, m: 30, ampm: "am" },
            title: "🌤️ Morning Routine",
            colIdx: 0, 
            page 
        })
        await expectBlockElem({ 
            blockId: "2--0", 
            startTime: { h: 5, m: 45, ampm: "am" },
            endTime: { h: 6, m: 30, ampm: "am" },
            title: "🌤️ Morning Routine",
            colIdx: 2, 
            page 
        })

        /* hover on self */
        await liftBlock({
            blockId: "2--0",
            toTime: { h: 6, m: 0, ampm: "am" },
            fromOffset: { x: 0, y: 5 },
            toColIdx: 0,
            steps: 20,
            mouseup: false,
            page
        })

        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 6, m: 0, ampm: "am" },
            endTime: { h: 6, m: 45, ampm: "am" },
            colIdx: 0, 
            page 
        })

        await page.mouse.up()

        /* push onto itself */
        await liftBlock({
            blockId: "2--0",
            toTime: { h: 7, m: 15, ampm: "am" },
            fromOffset: { x: 0, y: 5 },
            toColIdx: 0,
            steps: 20,
            mouseup: false,
            page
        })
        await expectBlockElem({ 
            blockId: "drop-area-block", 
            startTime: { h: 6, m: 15, ampm: "am" },
            endTime: { h: 7, m: 0, ampm: "am" },
            colIdx: 0, 
            page 
        })

        await page.mouse.up()

        /* release */
        await expectBlockElem({ 
            blockId: "0--0", 
            startTime: { h: 6, m: 15, ampm: "am" },
            endTime: { h: 7, m: 0, ampm: "am" },
            colIdx: 0, 
            page 
        })  

        await expectBlockElem({ 
            blockId: "2--0", 
            startTime: { h: 6, m: 15, ampm: "am" },
            endTime: { h: 7, m: 0, ampm: "am" },
            colIdx: 2, 
            page 
        })  
    })
    test("addition / deletion", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'High School Student' }).click()

        /* addition */
        await makeBlock({
            start: { h: 1, m: 0, ampm: "am" }, end: { h: 2, m: 0, ampm: "am" },
            colIdx: 0, page
        })
        await page.waitForTimeout(200)

        await expectBlockElem({ 
            blockId: "0--0", 
            startTime: { h: 1, m: 0, ampm: "am" },
            endTime: { h: 2, m: 0, ampm: "am" },
            colIdx: 0, 
            page 
        })  
        await expectBlockElem({ 
            blockId: "2--0", 
            startTime: { h: 1, m: 0, ampm: "am" },
            endTime: { h: 2, m: 0, ampm: "am" },
            colIdx: 2, 
            page 
        })

        /* deletion */
        await deleteBlock("2--2", page)

        await expectBlockElem({ 
            blockId: "0--2",
            title: "🎾 Tennis",
            colIdx: 0, 
            page 
        })  
        await expectBlockElem({ 
            blockId: "2--2", 
            title: "🎾 Tennis",
            colIdx: 2, 
            page 
        })
    })
    test("core updates", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'High School Student' }).click()

        let dayCoreData  = TEST_DAILY_BREAKDOWN[0].coreBreakdown
        let weekCoreData = structuredClone(TEST_WEEKLY_BREAKDOWN[0].coreBreakdown)

        weekCoreData.sleeping = { status: 0, totalTime: 3068, avgTime: 438, total: 0 }
        weekCoreData.awake    = { status: 0, totalTime: 7012, avgTime: 1001, total: 0 }

        /* sat and sun are empty */
        await fillEditModal({ blockId: "5--0", settingsOptn: "Set as first block", page })
        await fillEditModal({ blockId: "5--6", settingsOptn: "Set as last block", page })

        await fillEditModal({ blockId: "6--0", settingsOptn: "Set as first block", page })
        await fillEditModal({ blockId: "6--6", settingsOptn: "Set as last block", page })

        /* moving first set block */
        await stretchBlock({
            blockId: "0--0",
            dragOrigin: "top",
            vScrollTo: "top",
            dragTo: { h: 4, m: 0, ampm: "am" },
            page,
        })

        /* increase first block by 2 hours */

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "sleeping", totalTime: { offset: -120 } }, 
                { core: "awake", totalTime: { offset: +120 } }
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "sleeping", totalTime: { offset: -(120 * 2) } }, 
                { core: "awake", totalTime: { offset: +(120 * 2) } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Mondays", page })
        await expectDayCoreBreakDown({ dayCoreData, day: "Wednesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })

        /* new mind block */
        await makeBlock({
            start: { h: 1, m: 0, ampm: "am" }, end: { h: 2, m: 0, ampm: "am" },
            colIdx: 0, page, close: false
        })

        await fillEditModal({ page, core: "Mind" })

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "mind", totalTime: { total: 60 }, total: { total: 1 } }, 
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "mind", totalTime: { total: 120 }, total: { total: 1 } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Mondays", page })
        await expectDayCoreBreakDown({ dayCoreData, day: "Wednesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })

        await vertScrollElem({ elem: container, to: "top", delay: 800 })

        /* delete working block */
        await deleteBlock("0--2", page)

        dayCoreData = updateCoreData({
            cores: dayCoreData,
            changes: [
                { core: "working", totalTime: { offset: -480 }, total: { offset: -1 } }, 
            ]
        })
        weekCoreData = updateCoreData({
            cores: weekCoreData, daily: false,
            changes: [
                { core: "working", totalTime: { offset: -(480 * 2) }, total: { offset: -2 } }
            ],
        })

        await expectDayCoreBreakDown({ dayCoreData, day: "Mondays", page })
        await expectDayCoreBreakDown({ dayCoreData, day: "Wednesdays", page })
        await expectWeekCoreBreakDown({ weekCoreData, page })
    })
    test("tag updates", async ({ page }) => {
        const { container } = await getContainerData(page)

        await vertScrollElem({ elem: container, to: "top" })
        await page.getByRole('button', { name: 'High School Student' }).click()

        let dayTagData  = TEST_DAILY_BREAKDOWN[0].tagBreakdown
        let weekTagData = structuredClone(TEST_WEEKLY_BREAKDOWN[0].tagBreakdown)

        /* stretch up - morning lecture */
        await stretchBlock({
            blockId: "0--1",
            dragOrigin: "top",
            dragTo: { h: 6, m: 30, ampm: "am" },
            page,
        })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "School", totalTime: { offset: +15 } }]
        })
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "School", totalTime: { offset: +(15 * 2) } }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Mondays", page })
        await expectDayTagBreakDown({ dayTagData, day: "Wednesdays", page })
        await expectWeekTagBreakDown({ weekTagData, page })

        /* lift gym deep work session */
        await fillEditModal({ blockId: "0--2", startTime: "3 PM", endTime: "4 PM", page })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Sport", totalTime: { offset: -(15) } }]
        })
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "Sport", totalTime: { offset: -(15 * 2)}  }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Mondays", page })
        await expectDayTagBreakDown({ dayTagData, day: "Wednesdays", page })
        await expectWeekTagBreakDown({ weekTagData, page })

        /* delete HW and Study */
        await deleteBlock("0--3", page)

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "School", totalTime: { offset: -(65) }, total: { offset: -1 } }]
        })
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "School", totalTime: { offset: -(65 * 2) }, total: { offset: -1 }  }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Mondays", page })
        await expectDayTagBreakDown({ dayTagData, day: "Wednesdays", page })
        await expectWeekTagBreakDown({ weekTagData, page })

        /* new - add to body */
        await makeBlock({
            start: { h: 12, m: 0, ampm: "am" }, 
            end: { h: 12, m: 30, ampm: "am" },
            colIdx: 0, 
            close: false,
            vScrollTo: "top",
            page
        })

        await fillEditModal({ endTime: "12:31 AM", tag: "Body", page })

        dayTagData = updateTagData({
            tagBreakdown: dayTagData,
            changes: [{ name: "Body", totalTime: { offset: +31 }, total: { total: 1 }  }]
        })
        weekTagData = updateTagData({
            tagBreakdown: weekTagData,
            changes: [{ name: "Body", totalTime: { offset: +(31 * 2) }, total: { offset: +2 }   }],
            daily: false
        })

        await expectDayTagBreakDown({ dayTagData, day: "Mondays", page })
        await expectDayTagBreakDown({ dayTagData, day: "Wednesdays", page })
        await expectWeekTagBreakDown({ weekTagData, page })
    })
    test("settings check", async ({ page }) => {
        const { container } = await getContainerData(page)
        await page.getByRole('button', { name: 'High School Student' }).click()
        await vertScrollElem({ elem: container, to: "top" })

        const identifier = "day-breakdown-settings"

        await page.getByRole('button', { name: "Mondays" }).click()
        await toggleDropdown({ 
            textOptions: ["Replace routine", "Unlink routine", "Clear routine"],
            identifier,
            page
        })

        await page.getByRole('button', { name: "Tuesdays" }).click()
        await toggleDropdown({ 
            textOptions: ["Link a routine", "Clear routine"],
            identifier,
            page
        })

        await page.getByRole('button', { name: "Wednesdays" }).click()
        await toggleDropdown({ 
            textOptions: ["Replace routine", "Unlink routine", "Clear routine"],
            identifier,
            page
        })
    })
    test("linked routine changes", async ({ page }) => {
        await page.getByRole('button', { name: 'High School Student' }).click()

        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top" })
        
        /* unlink routine */
        await dayBreakdownSettingsOptn({ 
            page, day: "Mondays", option: "Unlink routine"
        })

        await vertScrollElem({ elem: container, to: "top", delay: 800 })

        await fillEditModal({ 
            blockId: "0--1", 
            startTime: "8 AM", endTime: "9:22 AM", page 
        })
        await page.waitForTimeout(200)

        await expectBlockElem({ 
            blockId: "0--1", 
            startTime: { h: 8, m: 0, ampm: "am" }, 
            endTime: { h: 9, m: 22, ampm: "am" }, 
            colIdx: 0, 
            page 
        })
        await expectBlockElem({ 
            blockId: "2--1", 
            startTime: { h: 7, m: 0, ampm: "am" }, 
            endTime: { h: 3, m: 0, ampm: "pm" }, 
            colIdx: 2,
            page 
        })
    })
    test("new routine + clear routine", async ({ page }) => {
        await page.getByRole('button', { name: 'College Student' }).click()

        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top" })

        /* upgrade to sunday routine */
        await dayBreakdownSettingsOptn({ 
            page, day: "Mondays", option: "Link a routine"
        })
        
        await page.getByRole('button', { name: 'Uni Sunday' }).click()

        await expectBlockElem({ 
            blockId: "0--2", 
            title: "👨‍💻 Deep Work Session", 
            page 
        })
        await expectBlockElem({ 
            blockId: "0--3", 
            title: "🌿 Relaxation", 
            page
        })
    })
    test("block changes", async ({ page }) => {
        await page.getByRole('button', { name: 'High School Student' }).click()

        const { container } = await getContainerData(page)
        await vertScrollElem({ elem: container, to: "top" })

        await fillEditModal({ 
            page,
            colorIdx: 13,
            title: "Hello World",
            description: "new description",
            blockId: "0--1",
            settingsOptn: "Set as new first block",
            tag: "Body",
            core: "Self-Care",
            startTime: "2:04 AM", 
            endTime: "3:59 AM" 
        })
        await page.waitForTimeout(200)

        await vertScrollElem({ elem: container, to: "top" })

        await expectBlockElem({ 
            blockId: "2--0", 
            title: "Hello World",
            startTime: { h: 2, m: 4, ampm: "am" }, 
            endTime:  { h: 3, m: 59, ampm: "am" }, 
            color: COLOR_SWATCHES.d[13],
            colIdx: 2, 
            page 
        })
        await expectEditModalToBe({ 
            blockId: "2--0", 
            title: "Hello World",
            startTime: "2:04 AM", 
            endTime: "3:59 AM",
            description: "new description",
            core: "Self-Care",
            tag: "💪 Body",
            icon: "sun",
            page
        })
    })
})