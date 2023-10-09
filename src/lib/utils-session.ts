import { SessionState } from "./enums"
import type { Session } from "./pom-session"

type BacklineColorOptions = {
    dotted: {
        default: string,
        active: string
    },
    solid: {
        default: string,
        active: string
    },
}

export const DEFAULT_SESSION_INPUTS: NewSessionUserInput = {
    name: "",
    tag: {
        name: "Korean",
        color: "#C7C4AB"
    },
    pomPeriods: 2,
    pomTime: 25,
    breakTime: 5,
    todos: [],
    startTime: null,
    calculatedEndTime: null,
    totalElapsedTime: null,
    timePeriodString: null
}

enum SemgnentType {
    FOCUS, BREAK, CHECKPOINT
}
type Segment = {
    type: SemgnentType
    offSetPerc: number,
    widthPerc: number | null, 
    periodIdx: number,
    segmentIdx: number
}

export const createProgressSegments = (sess: Session, totalMins: number) => {
    let segments: Segment[] = []

    const sessionTimePercent = (sess.pomTime / totalMins) * 100
    const breakTimePercent = (sess.breakTime / totalMins) * 100

    let nextOffSetPerc = 0
    let currPeriodIdx = 0
    let currSegmentIdx = 0

    for (let i = 0; i < sess.pomPeriods; i++) {
        
        // push: session segment
        segments.push({ 
            type: SemgnentType.FOCUS, offSetPerc: nextOffSetPerc, 
            widthPerc: sessionTimePercent, periodIdx: currPeriodIdx, segmentIdx: currSegmentIdx++
        })

        if (i === sess.pomPeriods - 1) break
        
        // push: checkpoint + break segment + checkpoint
        nextOffSetPerc += sessionTimePercent

        segments.push({ 
            type: SemgnentType.CHECKPOINT, offSetPerc: nextOffSetPerc, 
            widthPerc: null, periodIdx: currPeriodIdx++, segmentIdx:currSegmentIdx++
         })
        segments.push({ 
            type: SemgnentType.BREAK, offSetPerc: nextOffSetPerc, 
            widthPerc: breakTimePercent, periodIdx: currPeriodIdx, segmentIdx: currSegmentIdx++
        })
        
        nextOffSetPerc += breakTimePercent

        segments.push({ 
            type: SemgnentType.CHECKPOINT, offSetPerc: nextOffSetPerc, 
            widthPerc: null, periodIdx: currPeriodIdx++, segmentIdx: currSegmentIdx++
        })
    }
    
    return segments
}

const CHECKPOINT_INSIDE_NAME = "session-progress__checkpoint-inside"

const extractElements = (backLineElement: HTMLElement) => {
    const segmentIdx = parseInt(backLineElement.id)

    const prevCheckPoint = document.getElementById(`${segmentIdx - 1}`) as HTMLElement
    const prevCheckPointInnerCircle = !prevCheckPoint ? null : prevCheckPoint.getElementsByClassName(CHECKPOINT_INSIDE_NAME)[0] as HTMLElement

    const nextCheckPoint = document.getElementById(`${segmentIdx + 1}`) as HTMLElement
    const nextCheckPointInnerCircle = !nextCheckPoint ? null : nextCheckPoint.getElementsByClassName(CHECKPOINT_INSIDE_NAME)[0] as HTMLElement

    return [
        (backLineElement.getElementsByClassName("session-progress__back-line-svg")[0] as HTMLElement).firstChild as SVGPathElement,
        prevCheckPoint ?? null,
        prevCheckPointInnerCircle,
        nextCheckPoint ?? null,
        nextCheckPointInnerCircle
    ]
}

const colorElements = (elements: (HTMLElement | SVGPathElement | null)[], color: string, hasFinished: boolean) => {
    const [path, prevCheckPoint, prevCheckPointInnerCircle, nextCheckPoint, nextCheckPointInnerCircle] = elements

    path!.setAttribute('stroke', color)

    if (prevCheckPoint) {
        prevCheckPoint.style[hasFinished ? 'backgroundColor' : 'borderColor'] = color
        prevCheckPointInnerCircle!.style.backgroundColor = color
    }
    if (nextCheckPoint) {
        nextCheckPoint.style[hasFinished ? 'backgroundColor' : 'borderColor'] = color
        nextCheckPointInnerCircle!.style.backgroundColor = color
    }
}

export const onMouseOver = (event: Event, colorOptions: BacklineColorOptions) => {
    const backLineElement = event.target as HTMLElement
    const className = backLineElement.classList.value
    if (backLineElement.tagName.toLocaleUpperCase() === "SVG" || !className.includes("back-line")) return 

    const hasFinished = className.includes("finished")
    const color = hasFinished ? `${colorOptions.solid.active}` : `${colorOptions.dotted.active}`

    const elements = extractElements(backLineElement)
    colorElements(elements, color, hasFinished)
}

export const onMouseLeave = (event: Event, colorOptions: BacklineColorOptions) => {
    const backLineElement = event.target as HTMLElement
    const className = backLineElement.classList.value
    if (backLineElement.tagName.toLocaleUpperCase() === "SVG" || !className.includes("back-line")) return 

    const hasFinished = className.includes("finished")
    const color = hasFinished ? `${colorOptions.solid.default}` : `${colorOptions.dotted.default}`

    const elements = extractElements(backLineElement)
    colorElements(elements, color, hasFinished)
}