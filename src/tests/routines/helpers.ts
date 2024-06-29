import { minsFromStartToHHMM, minsToHHMM, timeStrToMins } from "$lib/utils-date"
import { expect, test } from "@playwright/test"
import { looseEqualTo } from "../helpers"
import { getScrollData, getElemOrigin, getHozDistanceBetweenTwoElems, 
        vertScrollElem, elemLeftOffset, elemTopOffset,
        type Position, dragFromTo, type DragPoint, type DragPosition,
        fillInput,
        expectInput,
        epectTextEditor,
        typeTextOnFocusInput,
        toggleDropdown,
        clickOutsideElem,
        expectComputedStyle,
        expectAttribute,
        expectList, 
} from "../pw-helpers"
import { RoutinesManager } from "$lib/routines-manager"
import { WEEKLY_ROUTINES } from "./routines.data"
import { getCoreStr } from "$lib/utils-routines"
import { COLOR_SWATCHES } from "$lib/utils-general"

type RoutineCoreChange = {
    core: keyof RoutineCores
    total?: {
        offset?: number
        total?: number
    }
    avgTime?: {
        offset?: number
        total?: number
    }
    totalTime?: {
        offset?: number
        total?: number
    }
}

type RoutineTagChage ={
    name: string,
    total?: {
        offset?: number
        total?: number
    }
    avgTime?: {
        offset?: number
        total?: number
    }
    totalTime?: {
        offset?: number
        total?: number
    }
}

type RoutineTagData = {
    tag: Tag,
    data: {
        avgTime: number
        totalTime : number
        total: number
    }
}

/* Constants */
export const { 
    NEW_STRETCH_DRAG_DIST_THRESHOLD, 
    STRETCH_DRAG_DISTANCE_THRESHOLD,
    MIN_BLOCK_DURATION_MINS,
    MAX_TITLE,
    MAX_DESCRIPTION,
    BLOCK_EDGE_THRESHOLD
} = RoutinesManager

export const timeExpectEditModal = async (options: {
    start?: string, end?: string, close?: boolean, page: any
}) => {
    const { start, end, close = true, page } = options
    await expectEditModal(true, page)

    if (start) {
        await expect(page.locator('#start--dropdown-btn')).toContainText(start)
    }
    if (end) {
        await expect(page.locator('#end--dropdown-btn')).toContainText(end)
    }

    if (close) {
        await closeEditBlockModal(page) 
    }
}

/* Routine Edits */
export async function dayBreakdownSettingsOptn(options: { 
    page: any,
    day: string,
    option: string
}) {
    const { page, day, option } = options

    await page.getByRole('button', { name: day }).click()
    await page.locator('#day-breakdown-settings--dropdown-btn').click()

    await page.getByRole('button', { name: option }).click()
    let confirm 

    if (option === "Clear routine") {
        confirm = page.locator(".confirm")
        await confirm.locator('.confirm__ok-btn').click()
    }
    else if (option === "Unlink routine") {
        confirm = page.locator(".confirm")
        await confirm.locator('.confirm__ok-btn').click()
    }
}
export async function makeRoutine(options: {
    page: any,
    title?: string,
    description?: string
    doSave?: boolean,
    doCancel?: boolean,
    forWeek?: boolean 
}) {
    const { page, title, description, forWeek = true, doSave = true, doCancel = false } = options

    if (forWeek) {
        await page.locator('.routine__wk-routines-add-btn').dispatchEvent("click")
    }
    else {
        await page.locator('.routines__add-new-routine').dispatchEvent("click")
    }

    if (title != undefined) {
        await page.getByPlaceholder('Type name here...').fill(title)
    }
    if (description != undefined) {
        await page.locator('#new-routine-description').click()
        await page.locator('#new-routine-description').fill(description)
    }
    if (doSave) {
        await page.getByRole('button', { name: 'Save' }).click()
    }
    if (doCancel) {
        await page.getByRole('button', { name: 'Cancel' }).click()
    }
}
export async function expectRoutinePage(options: {
    page: any,
    title?: string
    description?: string
    expectEmptyBreakdown?: boolean
    count?: number
    routines?: string[]
    forWeek?: boolean
}) {
    const { page, title, description, routines, count, forWeek = true, expectEmptyBreakdown = true } = options

    if (title != undefined) {
        await expect(page.locator('.routine__title')).toContainText(title)
    }
    if (description != undefined) {
        await expect(page.locator('.routine__description')).toContainText(description)
    }
    if (forWeek && count != undefined) {
        await expect(page.locator('.routine__wk-routines-count')).toContainText(count + "")
    }
    if (routines) {
        let selector = forWeek ? ".routine__wk-routines-list" : ".routines__collection ul"
        const list      = page.locator(selector)
        const listItems = list.locator("li")
        
        if (routines.length === 0) {
            await expect(page.locator(".routine__collection-empty")).toHaveText("Empty")
        }
        else {
            await expectList({ optionElems: listItems, texts: routines })
        }
    }
    if (expectEmptyBreakdown) {
        await page.locator("#breakdown-option--dropdown-btn").click()

        // check cores empty
        await page.locator('.dropdown-menu__option >> text=Cores').click()
        await page.getByRole('button', { name: 'Sum' }).click()
        await assertCoreBreakdownEmpty(page)

        await page.getByRole('button', { name: 'Avg' }).click()
        await assertCoreBreakdownEmpty(page)
        
        // check tags empty
        await page.locator("#breakdown-option--dropdown-btn").click()
        await page.locator('.dropdown-menu__option >> text=Tags').click()

        await page.getByRole('button', { name: 'Sum' }).click()
        await expect(page.getByText('No Tags')).toBeVisible()
        
        await page.getByRole('button', { name: 'Avg' }).click()
        await expect(page.getByText('No Tags')).toBeVisible()
    }
}
export async function exectRoutinesPageDetails(isShown: boolean, page: any) {
    if (isShown) {
        await expect(page.locator(".routines-page").locator(".routine")).toBeVisible()
    }
    else {
        await expect(page.locator(".routines-page").locator(".routine")).not.toBeVisible()
    }
}

/* Block Edits */
/**
 * Create a routine block inside calendar based on times.
 * Note that fi the new block that is north of scroll view, one should always scroll to that position so that it is in view.
 * 
 * @param options 
 */
export const makeBlock = async (options: {
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
}) => {
    const { 
        start, 
        end, 
        colIdx = 0,
        startOffset,
        endOffset,
        vScrollTo,
        doCancel = false,
        vScrollOffset,
        vScrollDelay = 800,
        close = true, 
        page 
    } = options
    const { container } = await getContainerData(page)

    if (vScrollTo || vScrollOffset) {
        await vertScrollElem({ 
            elem: container, offset: vScrollOffset, to: vScrollTo, delay: vScrollDelay
        })
    }

    await dragFromTo({
        origin: {
            pos: await getPositionFromTimeDay({ time: start, absolute: true, colIdx, page }),
            offset: startOffset
        },
        dragTo: { 
            pos: await getPositionFromTimeDay({ time: end, absolute: true, colIdx, page }),
            offset: endOffset
        },
        page, elem: container, absolute: true
    }) 

    if (doCancel) {
        await closeEditBlockModal({ page, doSave: false })
    }
    else if (close) {
        await closeEditBlockModal({ page, doSave: true })
    }
}

export const stretchBlock = async (options: {
    blockId: string,
    dragOrigin: "top" | "bottom",
    dragTo: DragPoint | DragPosition[] | { h: number, m: number, ampm: "am" | "pm" },
    vScrollTo?:  "top" | "bottom" | "middle" | number, 
    vScrollOffset?: number
    vScrollDelay?: number
    up?: boolean,
    steps?: number
    originOffset?: { x: number, y: number },
    targetOffset?: { x: number, y: number },
    delay?: number
    page: any
}) => {
    const { 
        blockId, 
        dragOrigin, 
        vScrollTo,
        vScrollOffset,
        originOffset,
        targetOffset,
        vScrollDelay = 800,
        dragTo: _dragTo, 
        page 
    } = options
    const { container } = await getContainerData(page)

    if (vScrollTo || vScrollOffset) {
        await vertScrollElem({ 
            elem: container, offset: vScrollOffset, to: vScrollTo, delay: vScrollDelay
        })
    }

    const blockPos = await getBlockViewPortPos({ page, id: blockId, from: dragOrigin })
    const _originOffset = originOffset ? originOffset : { x: 0, y: dragOrigin === "top" ? 1 : -1 }
    let dragTo 
    
    if ("ampm" in _dragTo ) {
        dragTo = {
            pos: await getPositionFromTimeDay({ time: _dragTo, absolute: true, colIdx: 0, page }),
            offset: targetOffset
        }
    }
    else {
        dragTo = _dragTo
    }

    await dragFromTo({
        origin: { pos: blockPos, offset: _originOffset },
        dragTo,
        page, elem: container, absolute: true
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
    const {
        page,
        vScrollTo,
        vScrollOffset,
        vScrollDelay = 800,
        steps = 10,
        blockId,
        mouseup,
        toTime,
        delay,
        up = false,
        fromOffset = { x: 0, y: up ? (5) : -(5) },
        toOffset   = { x: 0, y: up ? (-5) : (5) },
        toColIdx = 0
    } = options

    console.log({ fromOffset })
    console.log({ toOffset })

    const { container } = await getContainerData(page)

    if (vScrollTo || vScrollOffset) {
        await vertScrollElem({ 
            elem: container, offset: vScrollOffset, to: vScrollTo, delay: vScrollDelay
        })
    }

    await dragFromTo({
        origin: { 
            pos: await liftBlockFromBlock({ page, blockId }),
            offset: { x: fromOffset.x, y: fromOffset.y }
        },
        dragTo: { 
            pos: await liftBlockToTime({ time: toTime, colIdx: toColIdx, page }),
            offset: { x: toOffset.x , y: toOffset.y }
         },
        page, elem: container, absolute: true, steps, mouseup, delay
    })
}

export const getPositionFromTimeDay = async (options: { 
    time: { h: number, m: number, ampm?: "am" | "pm" }, 
    colIdx?: number,
    view?: string,
    absolute?: boolean
    page: any
}) => {

    const { page, time, colIdx = 0, absolute = false, view = "Weekly" } = options
    const { blocksBox } = await getContainerData(page)
    const daysCount = 7

    const yPos = topOffsetFromTime({ time, blocksHeight: blocksBox.height })
    const xPos = ((blocksBox.width / daysCount) * colIdx) + 1

    let res

    if (absolute) {
        const container = page.locator('.routine-blocks-container')!
        const { scrollTop, scrollLeft } = await getScrollData(container)
        res = { x: xPos - scrollLeft, y: yPos - scrollTop }
    }
    else {
        res = { x: xPos, y: yPos }
    }

    return res
}

export const getFirstBlock = (options: { page: any, isEdit?: boolean }) => {
    const { page, isEdit = false } = options

    if (isEdit) {
        return page.locator(`[id="edit-block"]`)
    }
    else {
        return page.locator(".routine-blocks__block").nth(0)
    }
}

export const liftBlockFromBlock = async (options: { 
    blockId: string,
    page: any,
}) => {
    const { page, blockId } = options
    const container = page.locator('.routine-blocks-container')!

    const pos = await getBlockViewPortPos({ page, id: blockId, from: "top-left" })

    return {
        x: pos.x,
        y: pos.y + BLOCK_EDGE_THRESHOLD
    }
}

export const liftBlockToTime = async (options: { 
    time: { h: number, m: number, ampm?: "am" | "pm" }, 
    colIdx?: number,
    page: any
}) => {
    const { time, colIdx = 0, page } = options
    const timePos = await getPositionFromTimeDay({ time, colIdx, page })
    const container = page.locator('.routine-blocks-container')!
    const { scrollTop, scrollLeft } = await getScrollData(container)

    return {
        x: timePos.x,
        y: timePos.y + BLOCK_EDGE_THRESHOLD - scrollTop,
    }
}

export const getBlockElemData = async (options: {
    blockElem: any, absolutePos?: boolean, page: any
}) => {

    const { blockElem, absolutePos = false, page } = options

    const container       = page.locator('.routine-blocks-container')!
    const blocksContainer = page.locator('.routine-blocks')!
    const blockElemBox    = await blockElem.boundingBox()
    const boxTopLeft      = await getElemOrigin(blocksContainer, "top-left")

    const clientPos = await getElemOrigin(blockElem, "top-left")
    const blockPos  = {
        x: clientPos.x -  boxTopLeft.x,
        y: clientPos.y -  boxTopLeft.y
    }

    const timePeriodElem = blockElem.locator('.routine-blocks__block-time-period')
    const timePeriod     = await timePeriodElem.evaluate((elem: HTMLElement) => {
        const children = elem.children
        return { 
            start: children[0].textContent, 
            end: children[2].textContent
        }
    })

    if (absolutePos) {
        const { scrollTop, scrollLeft } = await getScrollData(container)

        blockPos.x -= scrollLeft
        blockPos.y -= scrollTop
    }

    return {
        x: blockPos.x,
        y: blockPos.y,
        startTime: timePeriod.start,
        endTime: timePeriod.end,
        width: blockElemBox!.width,
        height: blockElemBox!.height
    }
}

export const getContainerData = async (page: any) => {
    const container       = page.locator('.routine-blocks-container')!
    const containerBox    = await container!.boundingBox()!
    const blocksContainer = page.locator('.routine-blocks')!
    const blocksBox       = await blocksContainer!.boundingBox()
    
    return {
        container, containerBox, blocksContainer, blocksBox
    }
}

/* Singular Block Updates */
export function getBlockElem(blockId: string, page: any) {
    return page.locator(`[id="${blockId}"]`)
}

export async function duplicateBlock(blockId: string, page: any, delay = 1000) {
    const blockElem = page.locator(`[id="${blockId}"]`)
    await blockElem.click({ button: 'right' })
    await page.getByRole('button', { name: 'Duplicate' }).click()

    return new Promise<void>((resolve) => setTimeout(() => resolve(), delay))
}

export async function closeDupBlock(page: any) {
    await page.locator('#edit-block').getByRole('button').click();
}

export const deleteBlock = async (blockId: string, page: any) => {
    const blockElem = page.locator(`[id="${blockId}"]`)
    await blockElem.click({ button: 'right' })
    await page.getByRole('button', { name: 'Delete Block' }).click()
}

/* Block Elem Assert */
export const expectBlockElemTimePeriod = async (options: {
    start?: string, end?: string
    blockId: string, page: any
}) => {
    const { start, end, blockId, page } = options
    const { containerBox } = await getContainerData(page)
    const blockElem = page.locator(`[id="${blockId}"]`)

    const timePeriod = blockElem.locator('.routine-blocks__block-time-period')
    const expectedTime = await timePeriod.evaluate((elem: HTMLElement) => {
        const children = elem.children

        return { 
            start: children[0].textContent, 
            end: children[2].textContent
        }
    })

    if (start) {
        expect(expectedTime.start).toBe(start)
    }
    if (end) {
        expect(expectedTime.end).toBe(end)
    }
}

export const expectEditModal = async (isOpen = true, page: any) => {
    if (isOpen) {
        await expect(page.locator(".edit-routine")).toBeAttached()
    }
    else {
        await expect(page.locator(".edit-routine")).not.toBeAttached()
    }
}

export const expectBlockElem = async (options: { 
    x?: number, 
    y?: number,
    title?: string,
    startTime?: { h: number, m: number, ampm: "am" | "pm" },
    endTime?: { h: number, m: number, ampm: "am" | "pm" },
    color?: Color,
    icon?: "sun" | "moon", 
    width?: number, 
    colIdx?: number
    diff?: number,
    blockId: string,
    doCheckTimePeriod?: boolean,
    doCheckPos?: boolean,
    view?: "Weekly" | "M T W T" | "F S S" | "Today",
    page: any, 
}) => {
    const { 
        x, y, width, blockId, diff = 3, doCheckTimePeriod = true,
        title, color, icon, startTime, endTime, doCheckPos = true,
        page
    } = options

    const { blocksBox, blocksContainer, container } = await getContainerData(page)
    const blockElem     = await getBlockElem(blockId, page)
    const blockWidth    = (await blockElem.boundingBox())!.width
    const blockElemYPos = await elemTopOffset(blockElem)

    const boxTopLeft  = await getElemOrigin(container, "top-left")
    const clientPos   = await getElemOrigin(blockElem, "top-left")
    const pos = {
        x: clientPos.x - boxTopLeft.x,
        y: clientPos.y - boxTopLeft.y
    }
    
    // check start time
    if (startTime && doCheckPos) {
        const startTimePos  = topOffsetFromTime({ time: startTime, blocksHeight: blocksBox.height })
        console.log({ startTimePos, blockElemYPos })
        expect(looseEqualTo(startTimePos, blockElemYPos, diff)).toBeTruthy()
    }

    // check end time
    if (endTime && doCheckPos) {
        const blockElemHt      = await blockElem.evaluate((elem: HTMLElement) => getComputedStyle(elem).height)
        const blockElemEndYPos = blockElemYPos + +blockElemHt.slice(0, -2)
        const endTimePos       = topOffsetFromTime({ time: endTime, blocksHeight: blocksBox.height })

        expect(looseEqualTo(endTimePos, blockElemEndYPos, diff + 1.5)).toBeTruthy()
    }

    // block content
    if (color) {
        const blockContent = blockElem.locator(".routine-blocks__block-content")

        await expectComputedStyle({ 
            prop: "background-color",
            elem: blockContent,
            val: `rgb(${color.dark2})`,
            page
        })
    }
    if (width) {
        expect(looseEqualTo(width, blockWidth, diff)).toBeTruthy()
    }
    if (title) {
        await expect(blockElem.locator(".routine-blocks__block-title")).toContainText(title)
    }
    if (startTime && endTime && doCheckTimePeriod) {
        const startStr = minsFromStartToHHMM(timeStrToMins(startTime.h, startTime.m, startTime.ampm))
        const endStr   = endTime ? minsFromStartToHHMM(timeStrToMins(endTime.h, endTime.m, endTime.ampm)) : undefined

        await expectBlockElemTimePeriod({ blockId, start: startStr, end: endStr, page })
    }

    // check literal coordinates
    if (x) {
        console.log(pos.x, x)
        expect(looseEqualTo(pos.x, x, diff)).toBeTruthy()
    }
    if (y) {
        console.log(pos.y, y)
        expect(looseEqualTo(pos.y, y, diff)).toBeTruthy()
    }
}

export async function expectBlockElemAt(options: {
    startTime: { h: number, m: number, ampm: "am" | "pm" }
    endTime?: { h: number, m: number, ampm: "am" | "pm" }
    colIdx?: number
    blockId: string,
    diff?: number,
    doCheckTimePeriod?: boolean
    page: any,
    view?: "Weekly" | "M T W T" | "F S S" | "Today"
}) {
    const { startTime, endTime, blockId, diff = 1.5, page, colIdx, view, doCheckTimePeriod = true } = options
    const { blocksBox } = await getContainerData(page)

    const blockElem     = await getBlockElem(blockId, page)
    const startTimePos  = topOffsetFromTime({ time: startTime, blocksHeight: blocksBox.height })
    const blockElemYPos = await elemTopOffset(blockElem)

    console.log(startTimePos, blockElemYPos)
    
    expect(looseEqualTo(startTimePos, blockElemYPos, diff)).toBeTruthy()
    
    
    if (endTime) {
        const blockElemHt      = await blockElem.evaluate((elem: HTMLElement) => getComputedStyle(elem).height)
        const blockElemEndYPos = blockElemYPos + +blockElemHt.slice(0, -2)
        const endTimePos       = topOffsetFromTime({ time: endTime, blocksHeight: blocksBox.height })

        expect(looseEqualTo(endTimePos, blockElemEndYPos, diff + 1.5)).toBeTruthy()
    }
    if (doCheckTimePeriod) {
        const startStr = minsFromStartToHHMM(timeStrToMins(startTime.h, startTime.m, startTime.ampm))
        const endStr   = endTime ? minsFromStartToHHMM(timeStrToMins(endTime.h, endTime.m, endTime.ampm)) : undefined
        
        await expectBlockElemTimePeriod({ blockId, start: startStr, end: endStr, page })
    }
    if (colIdx != undefined) {
        await expectBlockElemAtCol({ blockId, colIdx, page, view })
    }
}

export async function expectBlockElemAtCol(options: { 
    page: any, 
    blockId: string, 
    colIdx: number, 
    view?: "Weekly" | "M T W T" | "F S S" | "Today"
    diff?: number
}) {
    const { page, blockId, colIdx, view = "Weekly", diff = 3 } = options

    const { blocksBox } = await getContainerData(page)
    const blockElem = page.locator(`[id="${blockId}"]`)
    const containerWidth = blocksBox.width

    const dayCount = view === "Weekly" ? 7 : view.split(" ").length
    const colWidth = containerWidth / dayCount

    const xOffset  = await elemLeftOffset(blockElem)
    const _xOffset = colWidth * colIdx

    expect(looseEqualTo(xOffset, _xOffset, diff)).toBeTruthy()
}

export async function expectDupBlock(options: {
    startTime: string, endTime: string, blockId: string, page: any
}) {

    const { startTime, endTime, blockId, page } = options

    // still moving
    await expectBlockElemTimePeriod({ start: startTime, end: endTime, blockId: "drop-area-block", page })
    await expectBlockElemTimePeriod({ start: startTime, end: endTime, blockId: "edit-block", page })

    await page.mouse.up()

    // released
    await expectBlockElemTimePeriod({ start: startTime, end: endTime, blockId: "edit-block", page })
    await expect(page.locator('.routine-blocks__dup-add')).toBeAttached()
    await expect(page.locator('.routine-blocks__dup-cancel')).toBeAttached()

    // new block
    await page.locator('#edit-block').getByRole('button').first().click();
    await expectBlockElemTimePeriod({ start: startTime, end: endTime, blockId, page })

    await expect(getBlockElem("edit-block", page)).not.toBeAttached()
    await expect(getBlockElem("drop-area-block", page)).not.toBeAttached()
}

export async function expectBtnPlacement(toBe: "top" | "left" | "bottom" | "right", page: any) {
    const editBlock        = await getBlockElem("edit-block", page);

    const editBlockContent = editBlock.locator(".routine-blocks__block-content")
    const editBlockBox     = await editBlockContent.boundingBox()

    const btns    = editBlock.locator(".routine-blocks__block-buttons")
    const btnsBox =  await btns.boundingBox()
    
    const { x: blockX, y: blockY, height: blockHeight, width: blockWidth } = editBlockBox
    const { x: btnX, y: btnY, height: btnHeight, width: btnWidth } = btnsBox

    if (toBe === "top") {
        expect(btnY < blockY && blockY - btnY >= 20).toBeTruthy()
    } 
    else if (toBe === "left") {
        expect(looseEqualTo(blockY, btnY, 10)).toBeTruthy()
        expect(btnX < blockX && blockX - btnX >= 20).toBeTruthy()
    } 
    else if (toBe === "bottom") {
        expect(btnY > blockY + blockHeight && btnY + btnHeight - (blockY + blockHeight) >= 20).toBeTruthy()
    } 
    else if (toBe === "right") {
        expect(looseEqualTo(blockY, btnY, 10)).toBeTruthy()
        expect(btnX > blockX + blockWidth && btnX + btnWidth - (blockX + blockWidth) >= 20).toBeTruthy()
    }
}

/* Core Breakdown */
export async function assertCoreBreakdownEmpty(page: any) {
    await expect(page.getByText('Sleeping --')).toBeVisible()
    await expect(page.getByText('Awake --')).toBeVisible()
    await expect(page.getByText('Working 0h')).toBeVisible()
    await expect(page.getByText('Self-Care 0h')).toBeVisible()
    await expect(page.getByText('Mind 0h')).toBeVisible()
    await expect(page.getByText('Body 0h')).toBeVisible()
}
export async function expectDayCoreBreakDown(options: { 
    dayCoreData: RoutineCores,
    day: string,
    page: any
}) {
    const { dayCoreData, day, page } = options
    await page.getByRole('button', { name: day }).click()
        
    const container = page.locator('#day-breakdown--dropdown-menu')
    await expectCoreBreakdown({
        container, expectData: dayCoreData
    })
}
export async function expectWeekCoreBreakDown(options: { 
    weekCoreData: RoutineCores,
    page: any
}) {
    const { weekCoreData, page } = options
    const container = page.locator('.routine__breakdown')
        
    await expectCoreBreakdown({ container, expectData: weekCoreData })
}

export async function expectCoreBreakdown(options: { 
    container: any, 
    daily?: boolean
    expectData: RoutineCores 
}) {
    const { container, expectData, daily } = options

    const expedCoreDataToBe = async (options: { type: "sum" | "avg" }) => {
        const prop = options.type === "sum" ? "totalTime" : "avgTime"

        for (const core in expectData) {
            const str = getCoreStr(core as RoutineActvity)
            const elementWithText = await container.getByText(str).first()
    
            const expectVal    = expectData[core as keyof RoutineCores][prop]
            const expectValStr = expectVal >= 0 ? minsToHHMM(Math.floor(expectVal)) : "--"
            const val          = await elementWithText.evaluate((e: HTMLElement) => e.nextElementSibling!.textContent)
    
            expect(val).toBe(expectValStr)
        }
    }

    await container.getByRole('button', { name: 'Sum' }).click()
    await expedCoreDataToBe({ type: "sum" })

    await container.getByRole('button', { name: 'Avg' }).click()
    await expedCoreDataToBe({ type: "avg" })
}

export function updateCoreData(options: { 
    cores: RoutineCores,
    daily?: boolean,
    changes: RoutineCoreChange[]
}) {
    const { cores, changes, daily = true } = options

    changes.forEach((coreChange) => {
        const { core, total: count, avgTime, totalTime } = coreChange
        const isSleepAwake = core === "sleeping" || core === "awake"

        if (count) {
            const { offset, total } = count

            if (offset != undefined) cores[core].total += offset
            if (total != undefined)  cores[core].total  = total
        }
        if (avgTime) {
            const { offset, total } = avgTime

            if (offset != undefined) cores[core].avgTime +=  offset
            if (total != undefined)   cores[core].avgTime  = total
        }
        if (totalTime) {
            const { offset, total } = totalTime

            if (offset != undefined) cores[core].totalTime += offset
            if (total != undefined)  cores[core].totalTime  = total

            if (cores[core].totalTime === 0 || (cores[core].total === 0 && !isSleepAwake)) {
                cores[core].total     = 0
                cores[core].totalTime = 0
                cores[core].avgTime   = 0

                return
            }

            if (daily) {
                cores[core].avgTime = isSleepAwake ? cores[core].totalTime : Math.floor(cores[core].totalTime / cores[core].total)
            } 
            else {
                cores[core].avgTime = Math.floor(cores[core].totalTime / 7)
            }
        }
    })

    return cores
}

/* Tag Breakdown */
export async function expectDayTagBreakDown(options: { 
    dayTagData: RoutineTagData[],
    day: string,
    page: any
}) {
    const { dayTagData, day, page } = options
    await page.getByRole('button', { name: day }).click()
        
    const container = page.locator('#day-breakdown--dropdown-menu').first()

    await expectTagBreakdown({
        container, expectData: dayTagData
    })

    await clickOutsideElem({ page, elem: container, pos: "left" })
}

export async function expectWeekTagBreakDown(options: { 
    weekTagData: RoutineTagData[],
    page: any
}) {
    const { weekTagData, page } = options
    const container = page.locator('.routine__breakdown')
        
    await expectTagBreakdown({ container, expectData: weekTagData })
}

export async function expectTagBreakdown(options: { 
    container: any,
    daily?: boolean
    expectData: RoutineTagData[] 
}) {
    const { container, expectData, daily = false } = options
    const breakdownContainer = container.locator('.routine__tag-breakdown')

    const expectTagData = async (options: { type: "sum" | "avg" }) => {
        const prop = options.type === "sum" ? "totalTime" : "avgTime"

        for (let tagData of expectData) {
            const elementWithText = await breakdownContainer.getByText(tagData.tag.name).first()
            const expectVal    = tagData.data[prop]
            const isEmpty      = expectVal === 0

            if (isEmpty) {
                await expect(breakdownContainer.getByText(tagData.tag.name)).not.toBeAttached()
                continue
            }
    
            const expectValStr = expectVal >= 0 ? minsToHHMM(Math.floor(expectVal)) : "--"
            const val          = await elementWithText.evaluate((e: HTMLElement) => {
                return e.parentElement?.nextElementSibling?.textContent ?? ""
            })

            expect(val).toBe(expectValStr)
        }
    }

    if (!daily) {
        await container.locator(".dropdown-btn").click()
        await container.locator('.dropdown-menu__option >> text=Tags').click()
    }

    await container.getByRole('button', { name: 'Sum' }).click()
    await expectTagData({ type: "sum" })

    await container.getByRole('button', { name: 'Avg' }).click()
    await expectTagData({ type: "avg" })
}
export function updateTagData(options: { 
    tagBreakdown: RoutineTagData[],
    daily?: boolean,
    changes: RoutineTagChage[]
}) {
    const { tagBreakdown: tags, changes, daily = true } = options

    changes.forEach((tagChange) => {
        const { name, total: count, avgTime, totalTime } = tagChange
        let tagIdx = tags.findIndex((data) => data.tag.name === name)
        let isNew = tagIdx < 0
        tagIdx = isNew ? tags.length : tagIdx

        if (isNew) {
            tags.push({ 
                tag: {
                    id: tagIdx + "",
                    orderIdx: tagIdx,
                    name,
                    symbol: {
                        color: COLOR_SWATCHES.d[9],
                        emoji: "😭",
                    }
                },
                data: { 
                    total: 0, avgTime: 0, totalTime: 0 
                }
            })
        }

        if (count) {
            const { offset, total } = count

            if (offset != undefined) tags[tagIdx].data.total += offset
            if (total != undefined)  tags[tagIdx].data.total  = total
        }
        if (avgTime) {
            const { offset, total } = avgTime

            if (offset != undefined) tags[tagIdx].data.avgTime +=  offset
            if (total != undefined)   tags[tagIdx].data.avgTime  = total
        }
        if (totalTime) {
            const { offset, total } = totalTime

            if (offset != undefined) tags[tagIdx].data.totalTime += offset
            if (total != undefined)  tags[tagIdx].data.totalTime  = total

            if (tags[tagIdx].data.totalTime === 0 || tags[tagIdx].data.total === 0) {
                tags[tagIdx].data.total     = 0
                tags[tagIdx].data.totalTime = 0
                tags[tagIdx].data.avgTime   = 0
                return
            }

            if (daily) {
                tags[tagIdx].data.avgTime = Math.floor(tags[tagIdx].data.totalTime / tags[tagIdx].data.total)
            } 
            else {
                tags[tagIdx].data.avgTime = Math.floor(tags[tagIdx].data.totalTime / 7)
            }
        }
    })

    return tags
}

/* Block Elem Position */
export const getBlockViewPortPos = async (options: {
    page: any, 
    id: string, 
    from: Position,
    offset?: { x: number, y: number },
    scrollOffset?: boolean
}) => {
    const { page, id, from, offset = { x: 0, y: 0 }, scrollOffset = true } = options
    const container = page.locator('.routine-blocks-container')!
    const blocksContainer = page.locator('.routine-blocks')!
    const blockElem       = page.locator(`[id="${id}"]`)
    
    const boxTopLeft = await getElemOrigin(blocksContainer, "top-left")
    const clientPos  = await getElemOrigin(blockElem, from)

    const { scrollTop, scrollLeft } = await getScrollData(container)

    const res = {
        x: clientPos.x - boxTopLeft.x + offset.x - (scrollOffset ? scrollLeft : 0),
        y: clientPos.y - boxTopLeft.y + offset.y - (scrollOffset ? scrollTop : 0)
    }
    return res
}

export const getNextColDistFromBlock = async (options: { 
    idx: number, 
    view: string, 
    blockId: string,
    page: any
}) => {
    const { idx, view, page, blockId } = options
    const container = page.locator('.routine-blocks-container')!
    const block     = page.locator(`[id="${blockId}"]`)
    const dayCount  = view === "Weekly" ? 7 : view.split(" ").length
    const lines     = page.locator('.wk-grid__vert-line')

    if (view === "Today") {
        return await getHozDistanceBetweenTwoElems({
            left:  { elem: block, edge: "right" },
            right: { elem: container, edge: "right" }
        })
    }

    const isLastCol = dayCount === idx + 1

    return await getHozDistanceBetweenTwoElems({
        left: { elem: block, edge: "right" },
        right: {
            elem: isLastCol ? container : lines.nth(idx + 1), 
            edge: isLastCol ? "right" : "left" 
        }
    })
}

export const liftDistPos = async (options: { 
    page: any 
    blockId: string,
    toTime: { h: number, m: number, ampm?: "am" | "pm" },
}) => {
    const { page, blockId, toTime } = options
    const blocksContainer = page.locator('.routine-blocks')!
    const blocksBoxHeight = (await blocksContainer.boundingBox())!.height

    const minsFromSOD = timeStrToMins(toTime.h, toTime.m, toTime.ampm)
    const relTimePos  = Math.ceil((minsFromSOD / 1440) * blocksBoxHeight)

    const blockElem    = page.locator(`[id="${blockId}"]`)
    const blockTopLeft = await getElemOrigin(blockElem, "top-left")
    const blockOrigin  =  {
        x: blockTopLeft.x,
        y: blockTopLeft.y
    }

    const hozLines   = page.locator('.wk-grid__hoz-line')!
    const hozLinePos = await getElemOrigin(hozLines.nth(1), "top-left")

    console.log({ linePosY: hozLinePos.y + 14 })
    console.log(hozLinePos.y - blockOrigin.y)
}

export function topOffsetFromTime(options: {
    time: { h: number, m: number, ampm?: "am" | "pm" }, 
    blocksHeight: number,
    scrollTop?: number     // wont get the y offset, but the client / vp offset from container
}) {
    const { time, blocksHeight, scrollTop = 0 } = options;
    const minsFromSOD = timeStrToMins(time.h, time.m, time.ampm)
    const res         = Math.ceil((minsFromSOD / 1440) * blocksHeight) - scrollTop

    return res
}

/* Modal */
export const confirmEmptyDetails = async (page: any) => {
    await expect(page.locator('.routine__details')).not.toBeAttached()
    await expect(page.locator('.routine__breakdown')).not.toBeAttached()

    await expect(page.locator('.routine__wk-routines-count')).toContainText("0")
    await expect(page.getByText('Empty')).toBeVisible()
}

export const confirmDelete = async (page: any) => {
    await page.locator('.confirm__ok-btn').hover()
    await page.mouse.down()
    await page.waitForTimeout(1600)
    await page.mouse.up()
}

export const confirmDiscard = async (page: any) => {
    await page.locator('.confirm__ok-btn').hover()
    await page.mouse.down()
    await page.mouse.up()
}

export async function closeEditBlockModal(options: { page: any, doSave?: boolean, closeToast?: boolean })  {
    const { page, doSave = false, closeToast = true } = options
    if (!doSave) {
        await page.getByRole('button', { name: 'Cancel' }).click()
        const confirmModal     = await page.locator(".confirm")

        if (await confirmModal.count() != 0) {
            await confirmDiscard(page)
        }
        else {
            return
        }
    }
    else {
        await page.getByRole('button', { name: 'Save' }).click()
        await page.waitForTimeout(1000)
        const toast = await page.getByLabel('Close')
        
        if (closeToast && await toast.isVisible()) {
            await toast.click()
        }
    }
}

export async function fillEditModal(options: {
    blockId?: string
    title?: string
    colorIdx?: number
    description?: string
    tag?: string
    core?: string
    startTime?: string
    endTime?: string
    actionItems?: string[]
    settingsOptn?: string,
    doSave?: boolean
    doLeave?: boolean
    doCloseToast?: boolean
    delay?: boolean
    page: any
}) {
    const { 
        blockId, title, colorIdx, description, tag, core, startTime, endTime, actionItems, page,
        settingsOptn, doSave = true, doCloseToast = false, doLeave = false, delay = false
    } = options

    const settingsId = "edit-routine-settings"

    if (blockId) {
        const blockElem = getBlockElem(blockId, page)
        await blockElem.click()
    }
    if (title != undefined) {
        await fillInput({ query: "#routine-block-title-input", text: title, page })
    }
    if (description != undefined) {
        await fillInput({ query: ".edit-routine__description-text-editor", text: description, page })
    }
    if (startTime != undefined) {
        await typeTextOnFocusInput({ 
            page, text: startTime, selector: "#start--dropdown-btn", enter: true, highlightDel: true
        })
    }
    if (endTime != undefined) {
        await typeTextOnFocusInput({ 
            page, text: endTime, selector: "#end--dropdown-btn", enter: true, highlightDel: true
        })
    }
    if (settingsOptn != undefined) {
        await toggleDropdown({ 
            page, 
            pickOptionText: settingsOptn,
            identifier: settingsId
        })
    }
    if (core) {
        await page.locator('#core-dropdown--dropdown-btn').click()
        await page.getByRole('button', { name: core }).click()
    }
    if (tag) {
        await page.locator('#tag-picker--dropdown-btn').click()
        await page.getByRole('button', { name: tag }).click()
    }
    if (colorIdx != undefined) {
        await page.locator('#color-picker--dropdown-btn').click()
        await page.locator(`.color-picker__grid > div:nth-child(${colorIdx + 1})`).first().click()

        await page.locator('#color-picker--dropdown-btn').click();
        await page.locator('#color-picker--dropdown-btn').press('ControlOrMeta+b')
    }    


    if (doLeave) { 
        return
    }
    if (doSave) {
        await closeEditBlockModal({ page, doSave })
    }
    if (doCloseToast && doSave != undefined) {
        await closeEditBlockModal({ page })
    }
}

export async function expectEditModalToBe(options: {
    blockId?: string,
    title?: string,
    color?: string,
    description?: string,
    tag?: string,
    core?: string,
    startTime?: string,
    endTime?: string,
    actionItems?: string[],
    notAttached?: boolean,
    icon?: "sun" | "moon"
    doSave?: boolean
    close?: boolean
    page: any
}) {
    const { 
        title, blockId, color, description, tag, core, startTime, endTime, actionItems, 
        close = true, notAttached = false, doSave = false, page, icon
    } = options

    if (notAttached) {
        await expectEditModal(false, page)
        return
    }
    if (blockId != undefined) {
        const blockElem = getBlockElem("0--0", page)
        await blockElem.click()
    }
    if (title != undefined) {
        await expectInput({ query: "#routine-block-title-input", page, text: title })
    }
    if (description != undefined) {
        await epectTextEditor({ query: ".edit-routine__description-text-editor", page, text: description })
    }
    if (startTime != undefined) {
        await expect(page.locator('#start--dropdown-btn')).toContainText(startTime)
    }
    if (endTime != undefined) {
        await expect(page.locator('#end--dropdown-btn')).toContainText(endTime)
    }
    if (tag != undefined) {
        await expect(page.locator('#tag-picker--dropdown-btn')).toContainText(tag)
    }
    if (core != undefined) {
        await expect(page.locator('#core-dropdown--dropdown-btn')).toContainText(core)
    }
    if (icon != undefined) {
        await expectAttribute({
            selector: ".edit-routine__order-context-icon svg",
            attr: "data-icon",
            value: icon,
            page
        })
    }

    if (!close) {
        return
    }
    else if (doSave) {
        await closeEditBlockModal({ doSave: true, page })   
    }
    else if (close || !doSave) {
        await closeEditBlockModal({ page })   
    }
}

export const switchWeekView = async (page: any, option: "Today" | "Weekly" | "M T W T" | "F S S", useShortcut = false) => {
    if (useShortcut) {
        const num = option === "Today" ? 1 : option === "Weekly" ? 2 : option === "M T W T" ? 3 : 4
        await page.keyboard.press(num + '')
    }
    else {
        await page.locator('#view-option--dropdown-btn').click();
    
        const dropdownMenu = await page.locator('#view-option--dropdown-menu')
        await dropdownMenu.locator('button').filter({ hasText: option }).click()
    }
}

export const initTestData = async (page: any) => {
        // TODO: get rid of this
        // @ts-ignore
        return await page.evaluate((data) => {
            try {
                (window as any).LUCIOLE.initTestData(data)
                return true
            }
            catch {
                return false
            }
        }, WEEKLY_ROUTINES)
}

export const emptyTestData = async (page: any) => {
    // @ts-ignore
    return await page.evaluate((data) => {
        try {
            (window as any).LUCIOLE.initTestData(data)
            return true
        }
        catch {
            return false
        }
    }, [])
}
    
export const toggleAllowScroll = async (options: { page: any, allow: boolean } ) => {
    const { page, allow } = options

    // @ts-ignore
    await page.evaluate((allow) => window.LUCIOLE.allowScroll(allow), allow)
}