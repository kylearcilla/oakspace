import { toaster } from "./store"
import { Session } from "./pom-session"
import { HrsMinsFormatOption, ProgressVisualPartType, SessionState, ToastContext } from "./enums"
import { formatTimeToHHMM, getDifferenceInSecs, getTimePeriodString, secsToHHMM } from "./utils-date"

/* New Session Input */
export const MAX_SESSION_NAME_LENGTH = 18
export const MAX_TODO_NAME_LENGTH = 15
export const FOCUS_TIMES_ARR = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
export const BREAK_TIMES_ARR = [5, 10, 15, 20, 25, 30]
export const MAX_TODO_COUNT = 5
export const MAX_EXTRA_TIME_MINS = 45

export const DEFAULT_SESSION_INPUTS: SessionInputData = {
    name: "",
    tag: { name: "Korean", color: "#C7C4AB", symbol: "📖" },
    pomTime: 25,
    pomPeriods: 2,
    breakTime: 5,
    startTime: new Date(),
    isPlaying: true,
    endTime: null,
    calculatedEndTime: new Date(),
    totalElapsedTime: "",
    timePeriodString: "",
    currentIndex: 0,
    currentPomPeriod: 0,
    lastFinishedPeriodIdx: -1,
    sessionResult: null,
    todos: [],
    todosCheckedCount: 0,
    pomMessage: "Focus Time",
    state: SessionState.FOCUSING,
    result: null,
    currentTime: { minutes: 0, seconds: 0 },
    userFocusTimeSecs: 0,
    userBreakTimeSecs: 0,
    currentSessionTimeSecs: 0,
    sessionDurationMins: 0
}

/* Active Session Progress Visualizer */
export const HEADER_PROGRESS_COLOR_1 = "headerProgressColor1" as keyof ColorThemeProps
export const HEADER_PROGRESS_COLOR_2 = "headerProgressColor2" as keyof ColorThemeProps 
export const HEADER_TRACK_COLOR_1 = "headerTrackColor1" as keyof ColorThemeProps
export const HEADER_TRACK_COLOR_2 = "headerTrackColor2" as keyof ColorThemeProps
export const BASE_PROGRESS_COLOR_1 = "baseProgressColor1" as keyof ColorThemeProps
export const BASE_PROGRESS_COLOR_2 = "baseProgressColor2" as keyof ColorThemeProps
export const BASE_TRACK_COLOR_1 = "baseTrackColor1" as keyof ColorThemeProps
export const BASE_TRACK_COLOR_2 = "baseTrackColor2" as keyof ColorThemeProps

const CHECKPOINT_INNER_CIRCLE_NAME = "session-progress__checkpoint-inside"

/**
 * Continue work session after a refresh.
 */
export const conintueWorkSession = () => initSession()

/**
 * Continue a session if there was one.
 * Used in making new session modal or contiuing as ession.
 */
export const initSession = (inputSession: SessionInputData | null = null) => {
    if (inputSession) {
        new Session(inputSession)
    }
    else {
        new Session({ ...getSessionSavedData()!, todos: getTodosSavedTodos()! })
    }
}

export const getTodosSavedTodos = () => {
    const savedData = localStorage.getItem("todos")
    if (!savedData) return null

    return JSON.parse(savedData)
}

export const getSessionSavedData = () => {
    const savedData = localStorage.getItem("session")
    if (!savedData) return null

    return JSON.parse(savedData)
}

/**
 * @returns  See if a user has previously made a new session.
 */
export const didInitSession = () => localStorage.getItem("session") != null

/**
 * Session related toast messages.
 * @param msg    Message to be displayed.
 */
export const createSessionToastItem = (msg: string) => {
    const toastMessage = {
        context: ToastContext.Session,
        message: msg,
    }
    toaster.update((toaster: ToastItem[]) => [...toaster, toastMessage])
}

/**
 * Progress visual parts is made up of different parts. Each period is defined by a progress line, book-ened by checkpoints.
 * @param sess           Currrent session.
 * @param totalMins      Total length of session in minutes.
 * @returns              Parts of progress visual component.
 */
export const makeProgressVisualParts = (sess: Session, totalMins: number) => {
    let segments: ProgressVisualPart[] = []

    const sessionTimePercent = (sess.pomTime / totalMins) * 100
    const breakTimePercent = (sess.breakTime / totalMins) * 100

    let nextOffSetPerc = 0
    let currPeriodIdx = 0
    let currSegmentIdx = 0

    // Push focus + checkpoint + break + checkpoint
    for (let i = 0; i < sess.pomPeriods; i++) {
        
        // push: focus part
        segments.push({ 
            type: ProgressVisualPartType.FOCUS, offSetPerc: nextOffSetPerc, 
            widthPerc: sessionTimePercent, periodIdx: currPeriodIdx, segmentIdx: currSegmentIdx++
        })

        if (i === sess.pomPeriods - 1) break
        
        // push: checkpoint + break part + checkpoint
        nextOffSetPerc += sessionTimePercent

        segments.push({ 
            type: ProgressVisualPartType.CHECKPOINT, offSetPerc: nextOffSetPerc, 
            widthPerc: null, periodIdx: currPeriodIdx++, segmentIdx:currSegmentIdx++
         })
        segments.push({ 
            type: ProgressVisualPartType.BREAK, offSetPerc: nextOffSetPerc, 
            widthPerc: breakTimePercent, periodIdx: currPeriodIdx, segmentIdx: currSegmentIdx++
        })
        
        nextOffSetPerc += breakTimePercent

        segments.push({ 
            type: ProgressVisualPartType.CHECKPOINT, offSetPerc: nextOffSetPerc, 
            widthPerc: null, periodIdx: currPeriodIdx++, segmentIdx: currSegmentIdx++
        })
    }
    
    return segments
}

/**
 * From the hovered over progress line, get the svg path element and elements that are attached to the line (checkpoints & their inner circles)
 * @param progressLineElement   The progress line element hovered over.
 * @returns                     Progress line path element, checkpoints and their inner circles.
 */
const extractElements = (progressLineElement: HTMLElement) => {
    const segmentIdx = parseInt(progressLineElement.id)

    const prevCheckPoint = document.getElementById(`${segmentIdx - 1}`) as HTMLElement
    const prevCheckPointInnerCircle = !prevCheckPoint ? null : prevCheckPoint.getElementsByClassName(CHECKPOINT_INNER_CIRCLE_NAME)[0] as HTMLElement

    const nextCheckPoint = document.getElementById(`${segmentIdx + 1}`) as HTMLElement
    const nextCheckPointInnerCircle = !nextCheckPoint ? null : nextCheckPoint.getElementsByClassName(CHECKPOINT_INNER_CIRCLE_NAME)[0] as HTMLElement

    return [
        (progressLineElement.getElementsByClassName("session-progress__track-line-svg")[0] as HTMLElement).firstChild as SVGPathElement,
        prevCheckPoint ?? null,
        prevCheckPointInnerCircle,
        nextCheckPoint ?? null,
        nextCheckPointInnerCircle
    ]
}

/**
 * Color the elements of the hovered over progress segment (lines and checkpoints)
 * @param elements       Hovered over progress segment: progress line and checkpoints.
 * @param color          New color of the elements.
 * @param hasFinished    If finished checkpoint's background color will be colored instead of the border.
 */
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

/**
 * Get the active (when hovered-over) coloring for solid or dotted progress lines, using either header or base styling.
 * @param hasFinished    If the progress line is solid (finished) or dotted (unfinished)
 * @param isForHeader    If the progress visualizer is currently in the header or the base.
 */
export const getActiveColor = (hasFinished: boolean, isForHeader: boolean) => {
    if (isForHeader) {
        return hasFinished ? `var(--${HEADER_PROGRESS_COLOR_2})` : `var(--${HEADER_TRACK_COLOR_2})`
    }
    else {
        return hasFinished ? `var(--${BASE_PROGRESS_COLOR_2})` : `var(--${BASE_TRACK_COLOR_2})`
    }
}

/**
 * Get the default coloring for solid or dotted progress lines, using either header or base styling.
 * @param hasFinished    If the progress line is solid (finished) or dotted (unfinished)
 * @param isForHeader    If the progress visualizer is currently in the header or the base.
 */
export const getDefaultColor = (hasFinished: boolean, isForHeader: boolean) => {
    if (isForHeader) {
        return hasFinished ? `var(--${HEADER_PROGRESS_COLOR_1})` : `var(--${HEADER_TRACK_COLOR_1})`
    }
    else {
        return hasFinished ? `var(--${BASE_PROGRESS_COLOR_1})` : `var(--${BASE_TRACK_COLOR_1})`
    }
}

/**
 * If mouse hovers over a progress line, change the coloring of the line and the bookend checkpoints from default colors to active colors.
 * Default and acive colors are different for finished / unfinished (solid & dotted respectively) progress lines.
 * They are also different for header and home components.
 * @param event           MouseEvent
 * @param isForHeader     If progress component is located in the header or the base component.
 */
export const onMouseOverProgressLine = (event: Event, isForHeader: boolean) => {
    const progressLineElement = event.target as HTMLElement
    const className = progressLineElement.classList.value
    if (progressLineElement.tagName.toLocaleUpperCase() === "SVG" || !className.includes("track-line")) return 

    const hasFinished = className.includes("finished")
    const color = getActiveColor(hasFinished, isForHeader)

    const elements = extractElements(progressLineElement)
    colorElements(elements, color, hasFinished)
}

/**
 * If mouse hovers over a progress line, change the coloring of the line and the bookend checkpoints from active colors to default colors.
 * Default and acive colors are different for finished / unfinished (solid & dotted respectively) progress lines.
 * They are also different for header and home components.
 * @param event           MouseEvent
 * @param isForHeader     If progress component is located in the header or the base component.
 */
export const onMouseLeaveProgressLine = (event: Event, isForHeader: boolean) => {
    const progressLineElement = event.target as HTMLElement
    const className = progressLineElement.classList.value
    if (progressLineElement.tagName.toLocaleUpperCase() === "SVG" || !className.includes("track-line")) return 

    const hasFinished = className.includes("finished")
    const color = getDefaultColor(hasFinished, isForHeader)

    const elements = extractElements(progressLineElement)
    colorElements(elements, color, hasFinished)
}
