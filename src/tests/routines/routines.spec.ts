import { RoutinesManager } from "$lib/routines-manager"
import { expect, test } from "@playwright/test"
import { generateRandomString, looseEqualTo, neg } from "../helpers"
import { WEEKLY_ROUTINES } from "./routines.data"
import { DAYS_OF_WEEK, getDayIdxMinutes, getTimeFromIdx, timeStrToMins } from "$lib/utils-date"
import { elemTopOffset, elemLeftOffset, elemLeftOffsetByBox, 
        getVertDistanceBetweenTwoElems, getHozDistanceBetweenTwoElems,
        pointer,
        dragFromTo,
        vertScrollElem
} from "../pw-helpers"

const { 
    NEW_STRETCH_DRAG_DIST_THRESHOLD, 
    STRETCH__DRAG_DISTANCE_THRESHOLD,
    MIN_BLOCK_DURATION_MINS,
    MAX_TITLE,
    MAX_DESCRIPTION
} = RoutinesManager


test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/home/routines/weekly')
})

/* Helpers */
const relPosFromTime = (
    time: {h: number, m: number, ampm?: "am" | "pm"}, 
    blocksHeight: number,
    scrollTop: number = 0
) => {
    const minsFromSOD = timeStrToMins(time.h, time.m, time.ampm)
    const res         = Math.ceil((minsFromSOD / 1440) * blocksHeight) - scrollTop

    console.log({ 
        minsFromSOD, 
        res,
        scrollTop
    })

    return res
}
const confirmEmptyDetails = async (page: any) => {
    await expect(page.locator('.routine__details')).not.toBeAttached()
    await expect(page.locator('.routine__breakdown')).not.toBeAttached()

    await expect(page.locator('.routine__wk-routines-count')).toContainText("0")
    await expect(page.getByText('Empty')).toBeVisible()
}

const confirmDelete = async (page: any) => {
    await page.locator('.confirm__ok-btn').hover()
    await page.mouse.down()
    await page.waitForTimeout(1600)
    await page.mouse.up()
}

const closeEditBlockModal = async (page: any) => {
    await page.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
}

const switchWeekView = async (page: any, option: "Today" | "Weekly" | "M T W T" | "F S S", useShortcut = false) => {
    if (useShortcut) {
        const num = option === "Today" ? 1 : option === "Weekly" ? 2 : option === "M T W T" ? 3 : 4
        await page.keyboard.press
        await page.locator('[id="\\30 --0"]').getByText('🌤️ Morning Routine 6 AM - 6:').click();(`Digit${num}`)
    }
    else {
        await page.locator('#view-option--dropdown-btn').click();
    
        const dropdownMenu = await page.locator('#view-option--dropdown-menu')
        await dropdownMenu.locator('button').filter({ hasText: option }).click()
    }
}

const initTestData = async (page: any) => {
        // TODO: get rid of this
        // @ts-ignore
        await page.evaluate((data) => window.LUCIOLE.pw_set_test(data), WEEKLY_ROUTINES)
}

const emptyTestData = async (page: any) => {
        // TODO: get rid of this
        // @ts-ignore
        await page.evaluate((data) => window.LUCIOLE.pw_set_test(data), [])
}

/* Tests */
test.describe("Making Single Routine", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/home/routines/weekly')
    })

    const assertCoreBreakdownEmpty = async (page: any) => {
        await expect(page.getByText('Sleeping --')).toBeVisible()
        await expect(page.getByText('Awake --')).toBeVisible()
        await expect(page.getByText('Working 0h')).toBeVisible()
        await expect(page.getByText('Self-Care 0h')).toBeVisible()
        await expect(page.getByText('Mind 0h')).toBeVisible()
        await expect(page.getByText('Body 0h')).toBeVisible()
    }

    /* Submission */

    test('SUBMISSION: Name + Description -> Enter Button -> Both Visible -> Empty Breakdowns', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill('Hello World')
        await page.locator('#new-routine-description').click()
        await page.locator('#new-routine-description').fill('New Routine')

        await page.getByRole('button', { name: 'Save' }).click()

        await expect(page.locator('.routine__title')).toContainText("Hello World")
        await expect(page.locator('.routine__description')).toContainText("New Routine")

        await expect(page.locator('.routine__wk-routines-count')).toContainText("1")
        await expect(page.locator('.routine__wk-routines-list')).toContainText("Hello World")

        await assertCoreBreakdownEmpty(page)

        await page.getByRole('button', { name: 'Sum' }).click()

        await assertCoreBreakdownEmpty(page)

        await page.getByRole('button', { name: 'Avg' }).click()
        await page.getByRole('button', { name: 'Cores' }).click()
        await page.getByRole('button', { name: 'Tag' }).click()

        await expect(page.getByText('No Tags')).toBeVisible()

        await page.getByRole('button', { name: 'Sum' }).click()
        await expect(page.getByText('No Tags')).toBeVisible()
    })
    test('SUBMISSION: Name + Description -> Empty Key Pressed -> Both Visible -> Empty Breakdowns', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill('Hello World')
        await page.locator('#new-routine-description').click()
        await page.locator('#new-routine-description').fill('New Routine')
        
        await page.keyboard.press('Enter')

        await assertCoreBreakdownEmpty(page)
    })
    test('SUBMISSION: Name + No Description -> Both Visible -> Description Shows Place Holder Text', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill('Hello World')
        await page.locator('#new-routine-description').click()

        await page.getByRole('button', { name: 'Save' }).click()

        expect(await page.locator('.routine__description').getAttribute("data-placeholder")).toBe("Type description here...")
    })
    test('SUBMISSION: No Name -> Enter -> Error Visible', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        
        await page.getByRole('button', { name: 'Save' }).click()
        await expect(page.locator('form')).toContainText('Title is empty')
    })

    /* Cancellation */
    test('CANCELLATION: No Edits -> Cancel -> Home', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByRole('button', { name: 'Cancel' }).click();
        expect(page.locator('.confirm')).not.toBeAttached()

        await confirmEmptyDetails(page)
    })
    test('CANCELLATION: No Edits -> Escape Pressed -> Home', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.keyboard.press('Escape')
        expect(page.locator('.confirm')).not.toBeAttached()

        await confirmEmptyDetails(page)
    })
    test('CANCELLATION: No Edits -> Click Outside -> Home', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.locator('.modal-bg').click();
        expect(page.locator('.confirm')).not.toBeAttached()

        await confirmEmptyDetails(page)
    })
    test('CANCELLATION: Edits -> No Edit -> Cancel -> Home', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill('Hello World')
        await page.getByPlaceholder('Type name here...').fill('')

        await page.getByRole('button', { name: 'Cancel' }).click();
        expect(page.locator('.confirm')).not.toBeAttached()

        await confirmEmptyDetails(page)
    })
    test('CANCELLATION: Edits -> Pop Up -> Confirm -> Cancel -> Back to Edit', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill('Hello World')

        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.locator('.confirm')).toBeAttached()

        await page.locator('.confirm__cancel-btn').click()
        await expect(page.locator('.confirm')).not.toBeAttached()

        await  expect(page.locator('.new-routine')).toBeAttached()
    })
    test('CANCELLATION: Edits -> Pop Up -> Confirm -> OK -> Back to Home', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill('Hello World')

        await page.getByRole('button', { name: 'Cancel' }).click()

        await page.locator('.confirm__ok-btn').click()

        await expect(page.locator('.confirm')).not.toBeAttached()
        await expect(page.locator('.new-routine')).not.toBeAttached()

        await confirmEmptyDetails(page)
    })

    /* Boundaries */

    test('BOUNDS: Max Title and Description Lengths', async ({ page }) => {
        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        const title = generateRandomString({ length: MAX_TITLE, includeEmojis: true })
        const description = generateRandomString({ length: MAX_DESCR, includeEmojis: true, exclude: [">", "<", "&"] })

        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")

        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill(title)
        await page.locator('#new-routine-description').click()
        await page.locator('#new-routine-description').fill(description)

        await page.getByRole('button', { name: 'Save' }).click()

        await expect(page.locator('.routine__title')).toContainText(title)
        
        // the received text will always have certain chars as HTML Entities instead of literal values from a contenteditable
        await expect(page.locator('.routine__description')).toContainText(description)
    })

    test('BOUNDS: Cuts Off Extract character for Big Inputs', async ({ page }) => {
        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        const title = generateRandomString({ length: MAX_TITLE + 12, includeEmojis: true })
        const description = generateRandomString({ length: MAX_DESCR + 12, includeEmojis: true,exclude: [">", "<", "&"] })

        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")

        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill(title)
        await page.locator('#new-routine-description').click()
        await page.locator('#new-routine-description').fill(description)

        await page.getByRole('button', { name: 'Save' }).click()

        await expect(page.locator('.routine__title')).toContainText(title.slice(0, -12))

        // the received text will always have certain chars as HTML Entities instead of literal values from a contenteditable
        await expect(page.locator('.routine__description')).toContainText(description.slice(0, -12))
    })

    /* Editing */

    test('LATE EDITS: Editing Title and Description Saved', async ({ page }) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill("Old Title")
        await page.locator('#new-routine-description').fill("Old Description")

        await page.getByRole('button', { name: 'Save' }).click()

        await page.getByLabel('Title').click()
        await page.getByLabel('Title').press('ControlOrMeta+a')
        await page.getByLabel('Title').fill('New Title')
        await page.keyboard.press('Enter')

        await page.getByLabel('Description').click();
        await page.getByLabel('Description').press('ControlOrMeta+a')
        await page.getByLabel('Description').fill('New Description')
        await page.keyboard.press('Enter')

        await expect(page.locator('.routine__title')).toContainText("New Title")
        await expect(page.locator('.routine__description')).toContainText("New Description")

        await expect(page.locator('.routine__wk-routines-list')).toContainText("New Title")
    })

    test('LATE EDITS: Editing Title and Description MAX CUT OFFS', async ({ page }) => {
        const MAX_TITLE = RoutinesManager.MAX_TITLE
        const MAX_DESCR = RoutinesManager.MAX_DESCRIPTION

        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill("Old Title")
        await page.locator('#new-routine-description').fill("Old Description")

        await page.getByRole('button', { name: 'Save' }).click()

        const newTitle = generateRandomString({ length: MAX_TITLE + 12, includeEmojis: true, exclude: [">", "<", "&"]  })
        const newDescription = generateRandomString({ length: MAX_DESCR + 12, includeEmojis: true, exclude: [">", "<", "&"] })

        await page.getByLabel('Title').click()
        await page.getByLabel('Title').press('ControlOrMeta+a')
        await page.getByLabel('Title').fill(newTitle)
        await page.keyboard.press('Enter')

        await page.getByLabel('Description').click();
        await page.getByLabel('Description').press('ControlOrMeta+a')
        await page.getByLabel('Description').fill(newDescription)
        await page.keyboard.press('Enter')

        await expect(page.locator('.routine__title')).toContainText(newTitle.slice(0, -12))
        await expect(page.locator('.routine__description')).toContainText(newDescription.slice(0, -12))

        await expect(page.locator('.routine__wk-routines-list')).toContainText(newTitle.slice(0, -12))

    })
})

test.describe("Working with Multiple Routines", () => {
    const createThreeRoutines = async (page: any) => {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")

        await page.getByPlaceholder('Type name here...').fill("Routine #1")
        await page.locator('#new-routine-description').fill('1')

        await page.getByRole('button', { name: 'Save' }).click()

        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill("Routine #2")
        await page.locator('#new-routine-description').fill('2')

        await page.getByRole('button', { name: 'Save' }).click()

        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
        await page.getByPlaceholder('Type name here...').fill("Routine #3")

        await page.getByRole('button', { name: 'Save' }).click()
    }

    test("Make Three Routines", async ({ page }) => {
        await createThreeRoutines(page)
        await expect(page.locator('.routine__wk-routines-count')).toContainText("3")

        await expect(page.locator('.routine__wk-routines-list')).toContainText("Routine #1")
        await expect(page.locator('.routine__wk-routines-list')).toContainText("Routine #2")
        await expect(page.locator('.routine__wk-routines-list')).toContainText("Routine #3")

        await page.getByRole('button', { name: 'Routine #1' }).click()
        await expect(page.locator('.routine__title')).toContainText("Routine #1")
        await expect(page.locator('.routine__description')).toContainText("1")
        
        await page.getByRole('button', { name: 'Routine #2' }).click()
        await expect(page.locator('.routine__title')).toContainText("Routine #2")
        await expect(page.locator('.routine__description')).toContainText("2")

        await page.getByRole('button', { name: 'Routine #3' }).click()
        await expect(page.locator('.routine__title')).toContainText("")
        expect(await page.locator('.routine__description').getAttribute("data-placeholder")).toBe("Type description here...")
    })

    test("UPDATES: New Title & Description", async ({ page }) => {
        await createThreeRoutines(page)

        await page.getByRole('button', { name: 'Routine #1' }).click()

        await page.getByLabel('Title').click()
        await page.getByLabel('Title').press('ControlOrMeta+a')
        await page.getByLabel('Title').fill("New Routine #1")
        await page.keyboard.press('Enter')

        await page.getByLabel('Description').click();
        await page.getByLabel('Description').press('ControlOrMeta+a')
        await page.getByLabel('Description').fill("New Routine #1 Description")
        await page.keyboard.press('Enter')

        await expect(page.locator('.routine__wk-routines-list')).toContainText("New Routine #1")

        await page.getByRole('button', { name: 'Routine #2' }).click()

        await page.getByLabel('Title').click()
        await page.getByLabel('Title').press('ControlOrMeta+a')
        await page.getByLabel('Title').fill("New Routine #2")
        await page.keyboard.press('Enter')

        await page.getByLabel('Description').click();
        await page.getByLabel('Description').press('ControlOrMeta+a')
        await page.getByLabel('Description').fill("New Routine #2 Description")
        await page.keyboard.press('Enter')

        await expect(page.locator('.routine__wk-routines-list')).toContainText("New Routine #2")

        await page.getByRole('button', { name: 'Routine #1' }).click()

        await expect(page.locator('.routine__title')).toContainText("New Routine #1")
        await expect(page.locator('.routine__description')).toContainText("New Routine #1 Description")
        
        await page.getByRole('button', { name: 'Routine #2' }).click()

        await expect(page.locator('.routine__title')).toContainText("New Routine #2")
        await expect(page.locator('.routine__description')).toContainText("New Routine #2 Description")
    })

    test("UPDATES: Setting Current Routines", async ({ page }) => {
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


    test("DELETIONS: Deleteing 3", async ({ page }) => {
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
    test("DELETIONS: Deleting current routine in view", async ({ page }) => {
        await createThreeRoutines(page)

        await page.getByRole('button', { name: 'Routine #2' }).click()

        await page.getByRole('button', { name: 'Routine #2' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Delete Routine' }).click()

        await confirmDelete(page)

        await expect(page.locator('.routine__details')).not.toBeAttached()
        await expect(page.locator('.routine__breakdown')).not.toBeAttached()
    })

    test("DELETIONS: Deleting set routine in view", async ({ page }) => {
        await createThreeRoutines(page)

        await page.getByRole('button', { name: 'Routine #1' }).click()

        await page.getByRole('button', { name: 'Routine #1' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Choose as Current' }).click()
        await expect(page.locator('.routine__wk-routines-item--chosen')).toBeAttached()

        await page.getByRole('button', { name: 'Routine #1' }).click({ button: 'right' })
        await page.getByRole('button', { name: 'Delete Routine' }).click()

        await confirmDelete(page)

        await expect(page.locator('.routine__wk-routines-list')).not.toContainText("Routine #1")
        await expect(page.locator('.routine__wk-routines-count')).toContainText("2")
        await expect(page.locator('.routine__wk-routines-item--chosen')).not.toBeAttached()
        await expect(page.locator('.routine__details')).not.toBeAttached()
        await expect(page.locator('.routine__breakdown')).not.toBeAttached()
    })
})

test.describe("Week view display", () => {
    test("day Header, time blocks, current time indicator, grid rendered properly in all views.", async ({ page }) => {
        const container      = page.locator('.week-view__days-container')!
        const containerBox   = await container!.boundingBox()!
        const containerWidth = containerBox!.width
        const blocks = await page.locator('.routine-blocks')!.boundingBox()
        
        const todayIdx = getDayIdxMinutes().dayIdx
        const nowMins = getDayIdxMinutes().minutes

        const nowBarTopOffset  = (nowMins / 1440) * blocks!.height
        let   nowBarLeftOffset = (containerWidth / 7) * todayIdx


        let hourBlocks = page.locator('.hour-blocks__block')
        expect(await hourBlocks.count()).toBe(23)

        // left hour blocks + 24 horizontal lines
        for (let i = 1; i <= 23; i++) {
            const block = hourBlocks.nth(i - 1)
            const timeStr = getTimeFromIdx(i, true)
            const topOffset = ((60 / 1440) * blocks!.height) * i

            expect(looseEqualTo(await elemTopOffset(block), topOffset, 3)).toBeTruthy()
            expect(block).toContainText(timeStr)
        }

        //  horizontal dividers
        let hozDividers = page.locator('.wk-grid__hoz-line')
        expect(await hozDividers.count()).toBe(24)

        for (let i = 1; i <= 23; i++) {
            const divider = hozDividers.nth(i)
            const topOffset = ((60 / 1440) * blocks!.height) * i

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
            const leftOffset = (blocks!.width / 7) * i

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
            const leftOffset = (blocks!.width / 4) * i

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
            const leftOffset = (blocks!.width / 3) * i

            expect(looseEqualTo(await elemLeftOffsetByBox(container, divider), leftOffset, 3)).toBeTruthy()
        }
    })

    test("view switch shortcut works", async ({ page }) => {
        const container      = page.locator('.week-view__days-container')!
        const containerBox   = await container!.boundingBox()!
        const containerWidth = containerBox!.width
        const todayIdx = getDayIdxMinutes().dayIdx
        const nowMins = getDayIdxMinutes().minutes

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

        const container      = page.locator('.week-view__days-container')!
        const containerBox   = await container!.boundingBox()!
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
            await expect(days.nth(i)!).toContainText(DAYS_OF_WEEK[i].slice(0, 3))
        }

        // ⛳️ today
        await switchWeekView(page, "Today", true)
        days = page.locator('.week-view__days-day')
        expect(await days.count()).toBe(1)

        await expect(days.nth(0)!).toContainText(DAYS_OF_WEEK[todayIdx].slice(0, 3))
        
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

    test("vays header + time blocks scroll", async ({ page }) => {
        await page.setViewportSize({ width: 730, height: 700 })

        const container      = page.locator('.week-view__days-container')!

        const blocksContainer = page.locator('.routine-blocks-container')!
        const blocks          = await page.locator('.routine-blocks')!.boundingBox()

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

test.describe("Rendering Blocks", () => {
    test("Blocks are properly rendered.", async ({ page }) => {
        const container      = page.locator('.week-view__days-container')!
        const containerBox   = await container!.boundingBox()!
        const containerWidth = containerBox!.width
        const blocksContainer    = page.locator('.routine-blocks')!
        const blocksContainerBox = await blocksContainer!.boundingBox()
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
                    const expectedTop  = (block.startTime / 1440) * blocksContainerBox!.height
    
                    // Get actual top and left positions for the block
                    const id  = `${i}--${j}`
                    const blockElem = page.locator(`[id="${id}"]`)
    
                    const actualLeft = await elemLeftOffset(blockElem) - 2
                    const actualTop = await elemTopOffset(blockElem)
    
                    expect(looseEqualTo(actualTop, expectedTop, 3)).toBeTruthy()
                    expect(looseEqualTo(actualLeft, expectedLeft, 3)).toBeTruthy()
                }
            }
        }
    })
    test("Blocks are properly rendered between views.", async ({ page }) => {
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

test.describe("Stretch Edits", () => {
    test("Drag boundary check", async ({ page }) => {
        // await initTestData(page)

        const container       = page.locator('.routine-blocks-container')!
        const blocksContainer = page.locator('.routine-blocks')!

        await container.evaluate((elem: HTMLElement) => elem.scrollTop = 0)

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
        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

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
        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)
    })
    test("Near border edits", async ({ page }) => {
        // await initTestData(page)
        await page.getByRole('button', { name: 'Empty' }).click()

        const container       = page.locator('.routine-blocks-container')!
        const blocksContainer = page.locator('.routine-blocks')!
        const blocksBox       = (await blocksContainer.boundingBox())!
        const { height, width } = blocksBox

        let scrollTop = (await vertScrollElem(container, "top"))

        /* Top Left */

        /* dragging from the very top */
        await dragFromTo({
            origin: {
                pos: "top-left"
            },
            dragTo: { 
                pos: {  x: 0, y: 100 }
            },
            elem: container, page
        })

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

        /* top - max possible block */
        await dragFromTo({
            origin: {
                pos: { 
                    x: "top-left",
                    y: relPosFromTime({ h: 12, m: 0, ampm: "am" }, height, scrollTop)
                }
            },
            dragTo: { 
                pos: { 
                    x: "top-left",
                    y: relPosFromTime({ h: 11, m: 59, ampm: "pm" }, height, scrollTop)
                }
            },
            page, elem: container, absolute: true
        })

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

        /* hit the border up perfect */
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

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

        /* hit the border up (clash) - still possible due to pointer capture */
        await dragFromTo({
            origin: {
                pos: { 
                    x: "top-left", y: NEW_STRETCH_DRAG_DIST_THRESHOLD - 1
                }
            },
            dragTo: { 
                pos: { 
                    x: 0, y: neg(NEW_STRETCH_DRAG_DIST_THRESHOLD) 
                }
            },
            elem: container, page
        })

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

        scrollTop = await vertScrollElem(container, "bottom")

        /* Bottom Left */

        /* dragging from the very bottom */
        await dragFromTo({
            origin: {
                pos: "bottom-left"
            },
            dragTo: { 
                pos: {  x: 0, y: -100 }
            },
            elem: container, page
        })

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

        /* hit the border down perfect (not possible: 11:45 - 11:59 which is below min requirement) */
        await dragFromTo({
            origin: { 
                pos: "bottom-left", 
                offset: { x: 0, y: -NEW_STRETCH_DRAG_DIST_THRESHOLD } 
            },
            dragTo: { 
                pos: { 
                    x: 0, y: NEW_STRETCH_DRAG_DIST_THRESHOLD
                }
            },
            elem: blocksContainer,
            page
        })

        // since cursor will go out of window
        await expect(page.locator(".edit-routine")).not.toBeAttached()

        /* bottom - min possible block */
        await dragFromTo({
            origin: {
                pos: { 
                    x: "top-left",
                    y: relPosFromTime({ h: 11, m: 40, ampm: "pm" }, height, scrollTop)
                }
            },
            dragTo: { 
                pos: { 
                    x: "top-left",
                    y: relPosFromTime({ h: 11, m: 59, ampm: "pm" }, height, scrollTop)
                }
            },
            page, elem: container, absolute: true
        })

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

        /* bottom - max possible block */
        await dragFromTo({
            origin: {
                pos: { 
                    x: "top-left",
                    y: relPosFromTime({ h: 11, m: 55, ampm: "pm" }, height, scrollTop)
                }
            },
            dragTo: { 
                pos: { 
                    x: "top-left",
                    y: relPosFromTime({ h: 12, m: 0, ampm: "am" }, height, scrollTop)
                }
            },
            page, elem: container, absolute: true
        })

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

        /* Right Side */

        /* dragging from the very top right */
        scrollTop = (await vertScrollElem(container, "top"))

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

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)

        /* dragging from the very bottom right */
        scrollTop = (await vertScrollElem(container, "bottom"))

        await dragFromTo({
            origin: {
                pos: "bottom-right",
                offset: { x: -18, y: 0 }
            },
            dragTo: { 
                pos: {  x: 0, y: -100 }
            },
            elem: container, page
        })

        await expect(page.locator(".edit-routine")).toBeAttached()
        await closeEditBlockModal(page)
    })

    
})

test.describe("Lift Edits", () => {
    test("XXX", async ({ page }) => {

    })
})

test.describe("Duplicate edits", () => {
    test("Make Three Routines", async ({ page }) => {

        // TODO: get rid of this
        // @ts-ignore
        await page.evaluate((data) => window.LUCIOLE.pw_set_test(data), WEEKLY_ROUTINES)
    })
})

test.describe("Linked routines", () => {
    test("Make Three Routines", async ({ page }) => {

        // TODO: get rid of this
        // @ts-ignore
        await page.evaluate((data) => window.LUCIOLE.pw_set_test(data), WEEKLY_ROUTINES)
    })
})

test.describe("Core updates", () => {
    test("Make Three Routines", async ({ page }) => {

        // TODO: get rid of this
        // @ts-ignore
        await page.evaluate((data) => window.LUCIOLE.pw_set_test(data), WEEKLY_ROUTINES)
    })
})

test.describe("Tag updates", () => {
    test("Make Three Routines", async ({ page }) => {
        await initTestData(page)
    })
})

test.describe("Modal Edits", () => {
    test("Make Three Routines", async ({ page }) => {
        await initTestData(page)
    })
}
)

test.describe("Active Routine Edits", () => {
    test("Make Three Routines", async ({ page }) => {
        await initTestData(page)
    })
})