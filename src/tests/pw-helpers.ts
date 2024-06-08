type Position = "top-left" | "top" | "top-right" | "middle-left" | "middle" | "middle-right" | "bottom-left" | "bottom-right" | "bottom"
type Offset   = { x: number, y: number }

export const vertScrollElem = async (elem: any, to: "top" | "bottom" | "middle" | number) => {
    return await elem.evaluate((element: HTMLElement, scrollTo: string | number) => {
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
        return element.scrollTop

    }, to)
}

export const pointer = async (elem: any, type: string) => {
    await elem.dispatchEvent("pointer" + type)
}

export const dragFromTo = async (options: {
    origin: {
        pos: Position | { x: number | Position, y: number | Position },
        offset?: Offset
    },
    dragTo: {
        pos: Position | { x: number | Position, y: number | Position },
        offset?: Offset
    },
    absolute?: boolean,
    elem: any, 
    page: any
}) => {
    const { origin, dragTo, elem, absolute = false, page } = options
    const boxTopLeft = await getElemOrigin(elem, "top-left")

    let originX = 0, originY = 0, targetX = 0, targetY = 0

    /* ORIGIN */
    if (typeof origin.pos === "string") {
        const originPos = await getElemOrigin(elem, origin.pos as Position)
        originX = originPos.x
        originY = originPos.y
    } 
    else {
        const originPos = origin.pos as { x: number | Position, y: number | Position }
        const isXStr = typeof originPos.x === 'string'
        const isYStr = typeof originPos.y === 'string'

        originX = isXStr ? (await getElemOrigin(elem, originPos.x as Position)).x : originPos.x as number
        originY = isYStr ? (await getElemOrigin(elem, originPos.y as Position)).y : originPos.y as number

        // any non position string (so numbers) must be made to be relative to the box container manually
        originX += isXStr ? 0 : boxTopLeft.x
        originY += isYStr ? 0 : boxTopLeft.y
    }

    /* DESTINATION */
    if (typeof dragTo.pos === "string") {
        const targetPos = await getElemOrigin(elem, dragTo.pos as Position)
        targetX = targetPos.x
        targetY = targetPos.y
    } 
    else {
        const targetPos = dragTo.pos as { x: number | Position, y: number | Position }
        const isXStr = typeof targetPos.x === 'string'
        const isYStr = typeof targetPos.y === 'string'
        
        targetX = isXStr ? (await getElemOrigin(elem, targetPos.x as Position)).x : targetPos.x as number
        targetY = isYStr ? (await getElemOrigin(elem, targetPos.y as Position)).y : targetPos.y as number

        // by default drag to position will take place from the original position
        // otherwise will take on an absolute value relative to container
        // custom numbers must be made to be relative to container manually
        targetX += absolute ? (isXStr ? 0 : boxTopLeft.x) : 0
        targetY += absolute ? (isYStr ? 0 : boxTopLeft.y) : 0
    }

    originX += origin.offset?.x ?? 0
    originY += origin.offset?.y ?? 0

    targetX += dragTo.offset?.x ?? 0
    targetY += dragTo.offset?.y ?? 0

    if (!absolute) {
        targetX += originX
        targetY += originY
    }

    console.log("========")
    console.log(originX, originY)
    console.log(targetX, targetY)

    await page.mouse.move(originX, originY, { steps: 5 })
    await page.mouse.down()
    await page.mouse.move(targetX, targetY, { steps: 5 })
    await page.mouse.up()
}

export const getElemOrigin = async (elem: any, pos: Position) => {
    const { x, y, width, height }  = (await elem.boundingBox())!
    let origin = { x: 0, y: 0 }

    if (pos === "top-left") {
        origin = { x, y }
    }
    else if (pos === "top") {
        origin = { x: x + width / 2, y }
    }
    else if (pos === "top-right") {
        origin = { x: x + width - 1, y }
    }
    else if (pos === "middle-left") {
        origin = { x, y: y + height / 2 }
    }
    else if (pos === "middle") {
        origin = { x: x + width / 2, y: y + height / 2 }
    }
    else if (pos === "middle-right") {
        origin = { x: x + width - 1, y: y + height / 2 }
    }
    else if (pos === "bottom-left") {
        origin = { x, y: y + height - 1}
    }
    else if (pos === "bottom") {
        origin = { x: x + width / 2, y: y + height - 1}
    }
    else {
        origin = { x: x + width - 1, y: y + height - 1 }
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