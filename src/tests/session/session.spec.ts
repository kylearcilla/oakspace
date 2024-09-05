import { expect, test } from "@playwright/test"
import { fillInput } from "../pw-helpers"

const FOCUS_INIT_TIME = 25
const BREAK_INIT_TIME = 5
const TIME_INCREMENT = 5

async function isTransition(args: { page: any, state: "to-break" | "to-focus" }) {

}

async function isMode(args: { page: any, mode: "to-break" | "to-focus" }) {

}

async function expectResultToBe(args: { page: any }) {

}

async function createSession(args: { page: any, mode: "flow" | "pom", focusTime: number, breakTime: number, name: string }) {
    const { page, mode, focusTime, breakTime, name } = args
    await page.locator(".header__new-session-btn").click()

    await fillInput({ query: "#session-title-input", text: name, page })

    const modes = await page.locator(".new-session__mode")

    if (mode === "pom") {
        await modes.first().click()
    }
    else {
        await modes.last().click()
    }

    const focusTimeInput = await page.locator(".new-session__time-input").first()
    const breakTimeInput = await page.locator(".new-session__time-input").last()

    const subtFocusTimeBtn = focusTimeInput.getByRole('button').first()
    const addFocusTimeBtn  = focusTimeInput.getByRole('button').last()

    const subtBreakTimeBtn = breakTimeInput.getByRole('button').first()
    const addBreakTimeBtn  = breakTimeInput.getByRole('button').last()

    const focusIncrCount = Math.abs(focusTime - FOCUS_INIT_TIME) / TIME_INCREMENT
    const breakIncrCount = Math.abs(breakTime - BREAK_INIT_TIME) / TIME_INCREMENT

    const focusBtn = focusTime < FOCUS_INIT_TIME ? subtFocusTimeBtn : addFocusTimeBtn
    const breakBtn = breakTime < BREAK_INIT_TIME ? subtBreakTimeBtn : addBreakTimeBtn

    for (let i = 0; i < focusIncrCount; i++) {
        await focusBtn.click()
    }
    for (let i = 0; i < breakIncrCount; i++) {
        await breakBtn.click()
    }

    await page.locator(".async-btn").click()
    await clickOnActiveSessionMini(page)
}

async function clickOnActiveSessionMini(page: any) {
    await page.locator(".active-session").click()
}

async function expectSessionToBe(args: { 
    page: any, 
    startTime?: string,
    endTime?: string,
    breakTime?: string,
    focusTime?: string,
    progressTime?: string,
    mode?: "pom" | "flow" 
    period?: "focus" | "break" | "to-focus" | "to-break"
}) {
    const { 
        page,
        startTime,
        endTime,
        breakTime,
        focusTime,
        progressTime,
        mode = "pom",
        period
    } = args

    const progressTimeElem = await page.locator(".active-session__time")
    const focusTimeElem = await page.locator(".session__focus-time")
    const breakTimeElem = await page.locator(".session__detail").first()
    const periodName = await page.locator(".session__detail").nth(1)

    const startTimeElem = await page.locator(".progress__segment-time").first()
    const endTimeElem = await page.locator(".progress__segment-time--last")

    const innerRing = await page.locator(".active-session__ring--inner")
    const miniMessage = await page.locator(".active-session__message")

    // visual
    if (progressTime) await expect(progressTimeElem).toContainText(progressTime)
    if (focusTime)    await expect(focusTimeElem).toContainText(focusTime)
    if (breakTime)    await expect(breakTimeElem).toContainText(breakTime)
    if (startTime)    await expect(startTimeElem).toContainText(startTime)
    if (endTime)      await expect(endTimeElem).toContainText(endTime)

    if (period === "focus" || period === "to-break") {
        await expect(periodName).toContainText("Focus")
    }
    else if (period === "break" || period === "to-focus") {
        await expect(periodName).toContainText("Break")
    }

    // mini
    if (period === "focus" || period === "to-focus") {
        await expect(innerRing).toBeAttached()
    }
    else if (period === "break" || period === "to-break") {
        await expect(innerRing).not.toBeAttached()
    }
    if (period === "to-break") {
        await expect(miniMessage).toContainText("Now breaking...")
    }
    else if (period === "to-focus") {
        await expect(miniMessage).toContainText("Now focusing...")
    }
}

function getIdxFromDate() {

}

test.describe("rendering visualizer", () => {
    test('pom: 1h', async ({ page }) => {

    })
    test('pom: 4h', async ({ page }) => {

    })
    test('pom: 8h', async ({ page }) => {
        
    })
    test('flow: 5h', async ({ page }) => {
        
    })
    test('break precision', async ({ page }) => {
        
    })
})

test.describe("entire session completion", () => {
    test('pom: 25m & 5m w/ 5 periods', async ({ page }) => {
        await page.clock.install()
        await page.goto('http://localhost:5173/home')
        await page.clock.setSystemTime(new Date(2024, 8, 5, 4, 30))

        await createSession({
            page,
            mode: "pom",
            focusTime: 25,
            breakTime: 5,
            name: "Test 1"
        })

        await page.waitForTimeout(1000)
        await page.clock.fastForward("00:05:00")

        // await expectSessionToBe({
        //     page,
        //     startTime: "",
        //     breakTime: "",
        //     period: "focus"
        // })
    })
    test('pom: 60m & 10m', async ({ page }) => {

    })
    test('flow: 221m & 74m', async ({ page }) => {

    })
    test('between two days', async ({ page }) => {
        
    })
    test('between two days + 12 hours', async ({ page }) => {
        
    })
})