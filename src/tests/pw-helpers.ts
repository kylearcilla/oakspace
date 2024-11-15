export type Offset   = { x: number, y: number }
export type DragPosition = Position | { x: number | Position, y: number | Position } 
export type DragPoint = { 
    pos: DragPosition,
    offset?: Offset
}
import { chromium, expect } from "@playwright/test"

export async function fillInput(options: { 
    query?: string, 
    text: string, 
    page: any, 
    elem?: any
    enter?: boolean,
    empty?: boolean
}) {
    const { query, text, page, elem, empty = false, enter = true } = options
    const textInput = elem ? elem : await page.locator(query)
    await textInput.click()

    if (empty) {
        await textInput.press('ControlOrMeta+a')
    }

    await textInput.fill(text)

    if (enter) {
        await textInput.press('Enter')
    }
}

export const vertScrollElem = async (options: { 
    elem: any, 
    to?: "top" | "bottom" | "middle" | number, 
    delay?: number,
    offset?: number
}) => {
    const { elem, to, delay = 0, offset = 0 } = options;

    const scrollTop = await elem.evaluate((element: HTMLElement, move: {
        scrollTo?: string | number,
        offset: number
    }) => {
        const { scrollTo, offset } = move

        if (scrollTo === "top") {
            element.scrollTop = 0
        } 
        else if (scrollTo === "bottom") {
            element.scrollTop = element.scrollHeight
        } 
        else if (scrollTo === "middle") {
            element.scrollTop = element.scrollHeight / 2
        } 
        else if (typeof scrollTo === "number") {
            element.scrollTop = scrollTo
        }

        element.scrollTop += offset

        return element.scrollTop

    }, { scrollTo: to, offset })

    return new Promise<number>((resolve) => {
        setTimeout(() => resolve(scrollTop), delay)
    })
}

export async function epectTextEditor(options: { page: any, text?: string, placeholder?: string, query: string  }) {
    const { page, text, placeholder, query } = options
    const elem = await page.locator(query)

    if (text != undefined) {
        await expect(elem).toHaveText(text)
    }
    if (placeholder != undefined) {
        expect(await elem.getAttribute("data-placeholder")).toBe(placeholder)
    }
}

export async function expectInput(options: { page: any, text: string, query: string }) {
    const { page, text, query } = options
    const elem = await page.locator(query)

    if (text != undefined) {
        await expect(elem).toHaveValue(text)
    }
}

export async function expectToastMsg(options: {
    title?: string, 
    description?: string, 
    icon?: string, 
    count?: number, 
    expectCount?: boolean
    clickActionFunc?: boolean
    page: any
}) {
    const { 
        title, description, icon, 
        count = 1, expectCount = true, clickActionFunc = false,
        page 
    } = options

    if (expectCount) {
        console.log({ count })
        await expect(page.locator(".toast")).toHaveCount(count)
    }
    if (title != undefined) {
        await expect(page.locator(".toast__header-title").first()).toContainText(title)
    }
    if (description != undefined) {
        await expect(page.locator(".toast__description").first()).
        toContainText(description)
    }
    if (icon != undefined) {
        const iconElem = await page.locator(".toast .logo").first()
        await expectAttribute({
            attr: "data-icon",
            value: icon,
            elem: iconElem,
            page
        })
    }
    if (clickActionFunc) {
        await page.locator(".toast__action-btn").first().click()
    }
    if (count > 0 && !clickActionFunc) {
        await page.getByLabel('Close toast').first().click()
    }
}

export async function closeToastMessage(page: any) {
    await page.getByLabel('Close toast').last().click()
}

export async function expectComputedStyle(options: { 
    page: any, 
    prop?: string, 
    elem?: any,
    val: string, 
    query?: string 
}) {
    const { page, val, prop, query, elem } = options
    const _elem = elem != undefined ? elem : await page.locator(query)

    const res = await _elem.evaluate((elem: HTMLElement, prop: string) => getComputedStyle(elem)[prop as any], prop)
    expect(res).toBe(val)
}

export async function elementContainsTexts(options: {
    page: any, selector?: string, element?: any, texts: string[]
}) {
    const { page, selector, element, texts } = options
    const container = element ? element : await page.textContent(selector)
  
    for (const text of texts) {
      expect(container).toContain(text);
    }
}

export async function expectAttribute(options: {
    attr: string,
    selector?: string,
    elem?: any,
    page: any, 
    value: string
}) {
    const { attr, page, value, selector, elem: _elem } = options
    const elem = _elem ? _elem : await page.locator(selector)
 
    expect(await elem.getAttribute(attr)).toBe(value)
}

export async function toggleDropdown(options: {
    page: any, 
    pickOptionText?: string, 
    textOptions?: string[],
    identifier: string
}) {
    const { page, pickOptionText, textOptions, identifier } = options

    const dropdownBtn = page.locator(`#${identifier}--dbtn`)    
    await dropdownBtn.click()

    const dropdownMenu = page.locator(`#${identifier}--dmenu`)    
    await expect(dropdownMenu).toBeAttached()

    if (textOptions) {
        const options = dropdownMenu.locator(".dmenu__option-text")
        await expectList({ optionElems: options, texts: textOptions })
    }

    if (pickOptionText) {
        await page.getByRole('button', { name: pickOptionText }).click()
        await expect(dropdownMenu).not.toBeAttached()
    }
    else {
        await clickOutsideElem({ page, elem: dropdownMenu })
    }
}

export async function expectList(options: { optionElems: any, texts: string[] }) {
    const { optionElems, texts } = options

    await expect(optionElems).toHaveCount(texts.length);

    for (let i = 0; i < texts.length; i++) {
        await expect(optionElems.nth(i)).toContainText(texts[i]);
    }
}

export async function typeTextOnFocusInput(options: { 
    page: any, 
    text: string, 
    elem?: any, 
    selector?: string,
    highlightDel?: boolean,
    enter?: boolean
}) {
    const { page, text, elem: _elem, selector, highlightDel = false, enter = false } = options
    const elem = _elem ? _elem : await page.locator(selector)

    await elem.click()
    await page.waitForTimeout(500)

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('Backspace')
    await page.keyboard.type(text)

    if (enter) await page.keyboard.press('Enter')
}

export async function clickOutsideElem(options: {
    page: any, 
    elem?: any, 
    selector?: string,
    pos?: Position
}) {
    const { page, elem: _elem, selector, pos = "top-left" } = options

    let elem = _elem ? _elem : await page.locator(selector)
    const elemPos = await getElemOrigin(elem, pos, -2)

    await page.mouse.move(elemPos.x, elemPos.y)
    await page.mouse.down()
    await page.mouse.up()
}

export const hozScrollElem = async (options: { 
    elem: any, 
    to?: "left" | "right" | "middle" | number, 
    delay?: number,
    offset?: number
}) => {
    const { elem, to, delay = 0, offset = 0 } = options;

    const scrollLeft = await elem.evaluate((element: HTMLElement, move: {
        scrollTo?: string | number,
        offset: number
    }) => {
        const { scrollTo, offset } = move

        if (scrollTo === "left") {
            element.scrollLeft = 0
        } 
        else if (scrollTo === "right") {
            element.scrollLeft = element.scrollWidth
        } 
        else if (scrollTo === "middle") {
            element.scrollLeft = element.scrollWidth / 2
        } 
        else if (typeof scrollTo === "number") {
            element.scrollLeft = scrollTo
        }

        element.scrollLeft += offset

        return element.scrollLeft

    }, { scrollTo: to, offset })

    return new Promise<number>((resolve) => {
        setTimeout(() => resolve(scrollLeft), delay)
    });
}

export const getScrollData = async (elem: any) => {
    return await elem.evaluate((elem: HTMLElement) => {
        const { scrollHeight, scrollWidth, scrollLeft, scrollTop, clientHeight, clientWidth } = elem
        return {
            scrollTop,
            scrollHeight,
            clientHeight,
            clientWidth,
            scrollWidth,
            scrollLeft,
        }
    })
}

export const isScrolledToEdges = async (elem: any) => {
    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = await getScrollData(elem)

    const scrolledUp    = scrollTop === 0;
    const scrolledDown  = scrollTop + clientHeight >= scrollHeight
    const scrolledLeft  = scrollLeft === 0;
    const scrolledRight = scrollLeft + clientWidth >= scrollWidth

    return {
        scrolledUp,
        scrolledDown,
        scrolledLeft,
        scrolledRight
    };
}

export const pointer = async (elem: any, type: string) => {
    await elem.dispatchEvent("pointer" + type)
}

export const dragFromTo = async (options: {
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
}) => {
    const { 
        origin, dragTo, elem, absolute = false, scrollTop = 0, 
        page, mouseup = true, mousedown = true, delay = 0, steps = 5 
    } = options
    const ORIGIN_OFFSET = 0 // interactions at the very tips are wonky
    const boxTopLeft    = await getElemOrigin(elem, "top-left")

    let originX = 0, originY = 0, targetX = 0, targetY = 0

    /* ORIGIN */
    if (typeof origin.pos === "string") {
        const originPos = await getElemOrigin(elem, origin.pos as Position, ORIGIN_OFFSET)
        originX = originPos.x
        originY = originPos.y
    } 
    else {
        const originPos = origin.pos as { x: number | Position, y: number | Position }
        const isXStr = typeof originPos.x === 'string'
        const isYStr = typeof originPos.y === 'string'

        originX = isXStr ? (await getElemOrigin(elem, originPos.x as Position, ORIGIN_OFFSET)).x : originPos.x as number
        originY = isYStr ? (await getElemOrigin(elem, originPos.y as Position, ORIGIN_OFFSET)).y : originPos.y as number

        // any non position string (so numbers) must be made to be relative to the box container manually
        originX += isXStr ? 0 : boxTopLeft.x
        originY += isYStr ? 0 : boxTopLeft.y
    }

    originX += origin.offset?.x ?? 0
    originY += origin.offset?.y ?? 0
    originY -= scrollTop

    /* DESTINATION */
    const isDragArray = Array.isArray(dragTo)
    const dragPositions = isDragArray ? dragTo : [dragTo.pos]

    await page.mouse.move(originX, originY, { steps: 5 })

    if (mousedown) await page.mouse.down()

    for (let pos of dragPositions) {
        if (typeof pos === "string") {
            const targetPos = await getElemOrigin(elem, pos as Position, ORIGIN_OFFSET)
            targetX = targetPos.x
            targetY = targetPos.y
        } 
        else {
            const targetPos = pos as { x: number | Position, y: number | Position }
            const isXStr = typeof targetPos.x === 'string'
            const isYStr = typeof targetPos.y === 'string'
            
            targetX = isXStr ? (await getElemOrigin(elem, targetPos.x as Position, ORIGIN_OFFSET)).x : targetPos.x as number
            targetY = isYStr ? (await getElemOrigin(elem, targetPos.y as Position, ORIGIN_OFFSET)).y : targetPos.y as number

            targetX += absolute ? (isXStr ? 0 : boxTopLeft.x) : 0
            targetY += absolute ? (isYStr ? 0 : boxTopLeft.y) : 0
        }

        if (!isDragArray && dragTo.offset) {
            targetX += dragTo.offset?.x ?? 0
            targetY += dragTo.offset?.y ?? 0
        }

        if (absolute) {
            // targetY -= scrollTop
        }
        if (!absolute) {
            targetX += originX
            targetY += originY
        }

        console.log({
            origin:    { x: originX, y: originY },
            originRel: { x: originX - boxTopLeft.x, y: originY - boxTopLeft.y },
            target:    { x: targetX, y: targetY },
            targetRel: { x: targetX - boxTopLeft.x, y: targetY - boxTopLeft.y }
        })
     
        await page.mouse.move(targetX, targetY, { steps })

        // Update origin to the current target for the next iteration
        originX = targetX
        originY = targetY
    }

    if (mouseup) await page.mouse.up()

    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), delay)
    })
}

export const getElemOrigin = async (elem: any, pos: Position, offset = 0) => {
    const { x, y, width, height }  = (await elem.boundingBox())!
    let origin = { x: 0, y: 0 }

    if (pos === "top-left") {
        origin = { 
            x: x + offset, 
            y: y + offset 
        }
    }
    else if (pos === "top") {
        origin = { 
            x: x + width / 2, 
            y: y + offset 
        }
    }
    else if (pos === "top-right") {
        origin = { 
            x: x + width - offset, 
            y: y + offset 
        }
    }
    else if (pos === "left") {
        origin = { 
            x: x + offset, 
            y: y + height / 2 
        }
    }
    else if (pos === "middle") {
        origin = { 
            x: x + width / 2, 
            y: y + height / 2 
        }
    }
    else if (pos === "right") {
        origin = { 
            x: x + width - offset, 
            y: y + height / 2 
        }
    }
    else if (pos === "bottom-left") {
        origin = { 
            x: x + offset, 
            y: y + height - offset 
        }
    }
    else if (pos === "bottom") {
        origin = {
             x: x + width / 2, 
             y: y + height - offset
        }
    }
    else if (pos === "bottom-right") {
        origin = { 
            x: x + width - offset, 
            y: y + height - offset 
        }
    }

    return origin
}

export const elemTopOffset = async (elem: any) => {
    return await elem.evaluate((elem: any) => (elem as any).offsetTop)
}

export const elemLeftOffset = async (elem: any) => {
    return await elem.evaluate((elem: any) => (elem as any).offsetLeft)
}

export const getHozDistanceBetweenTwoElems = async (options: { left: { elem: any, edge?: "left" | "right"}, right: { elem: any, edge?: "left" | "right"} }) => {
    const leftRect  = await options.left.elem.boundingBox()
    const rightRect = await options.right.elem.boundingBox()
  
    options.left.edge  = options.left.edge ?? "right"
    options.right.edge = options.right.edge ?? "left"
  
    const leftEdge  = options.left.edge === "right" ? leftRect.x + leftRect.width : leftRect.x
    const rightEdge = options.right.edge === "right" ? rightRect.x + rightRect.width : rightRect.x
  
    return rightEdge - leftEdge
}

export const getVertDistanceBetweenTwoElems = async (options: { top: { elem: any, edge?: "top" | "bottom"}, bottom: { elem: any, edge?: "top" | "bottom"} }) => {
    const topRect  = await options.top.elem.boundingBox()
    const bottomRect = await options.bottom.elem.boundingBox()
  
    options.top.edge  = options.top.edge ?? "bottom"
    options.bottom.edge = options.bottom.edge ?? "top"
  
    const topEdge  = options.top.edge === "bottom" ? topRect.y + topRect.height : topRect.y
    const bottomEdge = options.bottom.edge === "bottom" ? bottomRect.y + bottomRect.height : bottomRect.y
  
    return bottomEdge - topEdge
}
  
export const elemTopOffsetByBox = async (parent: any, child: any) => {
    const pTop = await parent.boundingBox()
    const cTop = await child.boundingBox()

    return cTop.y - pTop.y
}

export const elemLeftOffsetByBox = async (parent: any, child: any) => {
    const pLeft = await parent.boundingBox()
    const cLeft = await child.boundingBox()

    return cLeft.x - pLeft.x
}

export async function verifyInfiniteScoll(options: {
    page: any, 
    elem: any, 
    firstItemsPerRequest: string[],
    itemSelector: string
}) {
    const { elem, firstItemsPerRequest, itemSelector, page } = options
    const _itemSelector = `${itemSelector}:not([class*="--skeleton"])`

    for (const item of firstItemsPerRequest) {
        const beforeReqCount = await elem.locator(_itemSelector).count()
        
        await vertScrollElem({ elem, to: "bottom" })
        await page.waitForTimeout(800)

        const itemElems     = elem.locator(_itemSelector)
        const afterReqCount = await elem.locator(_itemSelector).count()
        const firstItem     = itemElems.nth(beforeReqCount)

        if (item === "") {
            expect(beforeReqCount === afterReqCount).toBeTruthy()
            return
        }
        else {
            await expect(firstItem).toContainText(item)
        }
    }
}

export async function expectSkeletonItems(options: { 
    elem: any,
    itemSelector: string
}) {
    const { elem, itemSelector } = options

    const _itemSelector = `${itemSelector}--skeleton`
    const itemCount     = await elem.locator(_itemSelector).count()

    expect(itemCount != 0).toBeTruthy()
}

export async function closeModal(page: any) {
    await page.mouse.move(20, 20)
    await page.mouse.down()
    await page.mouse.up()
}

// export async function 

export async function googleLogIn(options: {
    email: string, 
    password: string,
    chooseAccount?: string,
    page: any, 
}) {
    const { email, password, page, chooseAccount } = options

    // no noeed to input credentials after expired token log ins
    try {
        // Enter email/phone
        await page.fill('input[type="email"]', `${email}`)
    }
    catch {
        return
    }
    
    await page.click('button:has-text("Next")')

    // Wait for the password input to be visible
    await page.waitForSelector('input[type="password"]', { state: "visible" })
    
    // Enter password
    await page.fill('input[type="password"]', `${password}`)
    await page.click('button:has-text("Next")')

    if (chooseAccount != undefined) {
        const chosenAccount = page.locator("ul li").filter({ hasText: chooseAccount })
        await chosenAccount.click()
    }

    try {
        await page.waitForURL((url: URL) => url.pathname === "/signin/oauth/warning")
        await page.click('button:has-text("Continue")')
        
        await page.waitForURL((url: URL) => url.pathname === "/signin/oauth/id")
        await page.click('button:has-text("Continue")')

        await page.waitForURL((url: URL) => url.pathname === "/signin/oauth/v2/consentsummary")
        await page.click('button:has-text("Continue")')
    } 
    catch {
        return
    }
}

export async function launchAuthBrowser() {
    //  disable certain automation features in the Chromium rendering engine
    //  avoids detection of automated browsing, making the browser behave more like a human-controlled browser.

    const browser = await chromium.launch({ 
        headless: false,
        args: ["--disable-blink-features=AutomationControlled"] 
    })
    const context = await browser.newContext()
    return await context.newPage()
}