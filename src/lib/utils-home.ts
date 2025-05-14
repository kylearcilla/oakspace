import { get } from "svelte/store"
import { globalContext, timer, ytPlayerStore } from "./store"

import { ModalType } from "./enums"
import { initEmojis } from "./emojis"
import { themes } from "./data-themes"
import { initGoals } from "./utils-goals"
import { POPULAR_SPACES } from "./data-spaces"
import { initHabits } from "./utils-habits-data"
import { didTodoistAPIRedirect } from "./api-todoist"
import { loadTheme, setDefaultFont, setNewTheme } from "./utils-appearance"
import { continueFocusSession, didInitSession, initSessions } from "./utils-session"
import { getElemById, isTargetTextEditor, randomArrayElem } from "./utils-general"
import { initYoutubePlayer, didInitYtPlayer, handleChooseItem, initYtUserData } from "./utils-youtube"

/* constants */
export const SMALL_WIDTH = 740
export const X_SMALL_WIDTH = 650

export const LEFT_BAR_MIN_WIDTH = 60
export const LEFT_BAR_FLOAT_WIDTH = 160
export const LEFT_BAR_FULL_WIDTH = 175

const MAX_PAST_YEARS = 3
const MAX_FUTURE_YEARS = 3

const LEFT_BAR_LEFT_BOUND = 20
const RIGHT_BAR_RIGHT_BOUND = 20

const SESSION_MIN_WIDTH = 750
const MAX_AMBIENT_OPACITY = 0.85

const BASE_VIEW_OPTIONS_KEY = "base-view-options"
const BASE_LEFT_MARGIN_VIEW_KEY = "base-left-margin-view"

const OVERVIEW_OPTIONS_KEY = "base-overview-options"
const GOALS_OPTIONS_KEY = "base-goals-options"
const HABITS_OPTIONS_KEY = "base-habits-options"
const YR_VIEW_OPTIONS_KEY = "base-yr-view-options"

const DAY_VIEW_OPTIONS_KEY = "day-view-options"

export let cursorPos = {
    left: 0, top: 0
}

export function updateCursor(_cursorPos: OffsetPoint) {
    cursorPos = _cursorPos
}

/* blur */
export const AMBIENT = {
    BG_BLUR: "blur(50px)",
    BG_COLOR: "rgba(25, 25, 25, 0.2)",
    DARK_BG_COLOR: "rgba(25, 25, 25, 0.5)",
    BORDER: "1px solid rgba(255, 255, 255, 0.055)"
}

let worker: Worker | null = null

/**
 * Initialize app state.
 * Load data from previously saved state (if there is any).
 */
export const initAppState = async () => {
    initEmojis()  
    initTimer()
    initSessions()
    initHabits()
    initGoals()
    loadTheme()
    loadGlobalContext()
    loadAmbience()
    initYtUserData()

    if (didInitSession()) {
        continueFocusSession()
    }
    if (didInitYtPlayer()) {
        initYoutubePlayer()
    }
}


export function onQuitApp() {
    // const session = get(sessionManager)
    // if (session) {
    //     session.stopTimer()
    // }
}

export function initTimer() {
    worker = new Worker(new URL('./workers/timeWorker.ts', import.meta.url))

    worker.onmessage = (event) => {
        if (event.data === 'tick') { 
            timer.update((data: { date: Date }) => ({ ...data, date: new Date() }))
        }
    }
    worker.postMessage({ interval: 1000 })
}

/**
 * Keyboard shortcut handler for key down events. 
 * 
 * @param event                  The keyboard key down event to handle.
 * @param toggledLeftBarWithKey  If user opened the left side bar with a short cut.
 * 
 * @returns If user still has toggled left side bar.
 */
export const keyboardShortCutHandlerKeyDown = (event: KeyboardEvent, toggledLeftBarWithKey: boolean) => {    
    const target = event.target as HTMLElement
    const context = get(globalContext)
    const { shiftKey, key, ctrlKey, code } = event
    const isTargetContentEditable = target.contentEditable === "true"
    const width = window.innerWidth
    
    if (isTargetTextEditor(target)) { 
        const allowCustomFormatting = false

        // Enter for save, Shift + Enter for break.
        if (isTargetContentEditable && ((key === "Enter" && !shiftKey && !allowCustomFormatting) || key == "Escape")) {
            target.blur()
        }
        else if (!isTargetContentEditable && (key === "Escape" || (key === "Enter"))) {
            target.blur()
        }

        return toggledLeftBarWithKey
    }

    const doNotFixBars = width <= X_SMALL_WIDTH
    const leftBarFixed = context.leftBarFixed
    const hasAmbience = context.ambience?.active
    const wideLeftBarCtrl = !hasAmbience && ctrlKey && (leftBarFixed === false || leftBarFixed === true)

    /* left bar */
    if (event.ctrlKey && key === "]" && doNotFixBars) {
        updateGlobalContext({ 
            rightBarOpen: !context.rightBarOpen 
        })
    }
    else if (event.ctrlKey && key === "]") {
        updateGlobalContext({ 
            rightBarOpen: !context.rightBarOpen,
            rightBarFixed: !context.rightBarOpen === false
        })
    }
    else if (key === "/" && wideLeftBarCtrl && !doNotFixBars) {
        updateGlobalContext({ leftBarFixed: !leftBarFixed })
    }
    /* right bar */
    else if (ctrlKey && key === "[") {
        updateGlobalContext({ leftBarOpen: !context.leftBarOpen })
        return true
    }
    /* modals */
    else if (key === "?") {
        closeAllModals()
        openModal(ModalType.Shortcuts)
    }
    else if (shiftKey && key === "Q") {
        closeAllModals()
        openModal(ModalType.Quote)
    }
    else if (shiftKey && key === "S") {
        closeAllModals()
        openModal(ModalType.Settings)
    }
    else if (shiftKey && code === "Space") {
        closeAllModals()
        openModal(ModalType.NewSession)
    }

    return toggledLeftBarWithKey
}

export function middleViewExpandHandler(args: { 
    width: number, route: string, rightBarOpen: boolean
}) {
    const { route, width, rightBarOpen } = args

    if (route === "/home/session" && rightBarOpen) {
        return width < SESSION_MIN_WIDTH
    }
    else {
        return false
    }
}

/**
 * Keyboard shortcut handler for key up events. 
 * @param event  The keyboard key up event to handle.
 */
export const keyboardShortCutHandlerKeyUp = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    const { key } = event

    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable) {
        return
    }

    if (key === "n" && get(globalContext).modalsOpen.length === 0) {
        openModal(ModalType.NewSession)
    }
}

export function updateRoute(route: string) {
    updateGlobalContext({ ...get(globalContext), route })
}

/**
 * On mouse move handler for home page.
 * Toggles left side bar based on the positioning of the mouse.
 * @param event                     Mouse Event
 * @param toggledLeftBarWithKey     If user opened the left side bar with a short cut, then must be hidden again from using the same short cut. Cannot be closed from mouse event.
 * @returns                         If user still has toggled left side bar.
 */
export const onMouseMoveHandler = (event: MouseEvent, toggledLeftBarWithKey: boolean): boolean => {
    const context = get(globalContext)
    const mouseLeftPos = event.clientX
    const mouseRightPos = window.innerWidth - mouseLeftPos
    const elem = event.target as HTMLElement

    const { 
        leftBarOpen, 
        rightBarOpen, 
        rightBarFixed, 
        leftBarFixed, 
    } = context

    const leftInArea = mouseLeftPos < LEFT_BAR_LEFT_BOUND
    const activeRoutineOpen = !!getElemById("active-routine-elem")
    const lbAutoCloseThreshold = getLeftBarWidth(leftBarFixed)
    
    const rightInArea = mouseRightPos < RIGHT_BAR_RIGHT_BOUND
    const rbAutoCloseThreshold = 300

    if (!leftBarOpen && !activeRoutineOpen && leftInArea) {
        const hasModal = document.querySelector(".modal-bg")
        if (hasModal) return false

        updateGlobalContext({ leftBarOpen: true  })
        return false
    }
    else if (!toggledLeftBarWithKey && context.leftBarOpen && mouseLeftPos > lbAutoCloseThreshold && !getElemById("left-bar-menu")) { 
        updateGlobalContext({ leftBarOpen: false  })
    }
    else if (rightBarFixed && !rightBarOpen && rightInArea) { 
        const hasModal = document.querySelector(".modal-bg")
        if (hasModal) return false
        
        updateGlobalContext({ rightBarOpen: true  })
    }
    else if (rightBarFixed && rightBarOpen && mouseRightPos > rbAutoCloseThreshold) { 
        updateGlobalContext({ rightBarOpen: false  })
    }

    return toggledLeftBarWithKey
}


export function getLeftBarWidth(leftBarFixed: boolean): number {
    return leftBarFixed ? LEFT_BAR_FULL_WIDTH : LEFT_BAR_FLOAT_WIDTH
}

/**
 * Update UI Layout of app.
 * @param newContext  New layout
 */
export const updateGlobalContext = (newState: Partial<GlobalContext>) => {
    const oldState = get(globalContext)
    const newGlobalContext = {
        ...oldState, ...newState
    }

    globalContext.set(newGlobalContext)
    localStorage.setItem("home-ui", JSON.stringify(newGlobalContext))
}
  
/**
 * Load previously set layout state.
 */
const loadGlobalContext = () => {
    const storedData = localStorage.getItem("home-ui")
    if (!storedData) return
    const data: GlobalContext = JSON.parse(storedData)
    const fontStyle = data.fontStyle

    updateGlobalContext({ ...data, modalsOpen: []  })
    
    if (fontStyle === "mono") {
        setDefaultFont("mono")
    }
}

export function hideRightBar() {
    updateGlobalContext({ rightBarOpen: false })
}

export function showRightBar() {
    updateGlobalContext({ rightBarOpen: true  })
}


export const openModal = (modal: ModalType) => {
    globalContext.update((data: GlobalContext) => {
        return { ...data, modalsOpen: [ ...data.modalsOpen, modal ]}
    })
}

export const closeModal = (modalToRemove: ModalType) => {
    globalContext.update((data: GlobalContext) => {

        return { 
            ...data, 
            modalsOpen: data.modalsOpen.filter((modal: ModalType) => modal !== modalToRemove)
        }
    })
}

export function closeAllModals() {
    globalContext.update((data: GlobalContext) => {
        return { ...data, modalsOpen: [] }
    })
}

export function hasModalOpen() {
    const modalsOpen = get(globalContext).modalsOpen
    return modalsOpen.length > 0
}

/**
 * @param modal  See if this modal is already open.
 * @returns      If modal is open.
 */
export const isModalOpen = (modal: ModalType) => {
    const modalsOpen = get(globalContext).modalsOpen
    return modalsOpen.includes(modal)
}

export const setHotkeyFocus = (context: HotkeyContext) => {
    globalContext.update((state: GlobalContext) => {
        return { ...state, hotkeyFocus: context }
    })
}

function loadAmbience() {
    const homeRef = getElemById("home")!
    const context = get(globalContext)
    const ambience = context.ambience

    if (!ambience) return
    const { opacity, space: { sourceId } } = ambience

    if (ambience?.space.type === "wallpaper") {
        homeRef.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, ${opacity}), rgba(0, 0, 0, ${opacity})), url(${sourceId})`
    }
}

/**
 * Update a current ambience space.
 * With mbient setting already set.
 * 
 * @param data  New data to be incorporated.
 */
export function updateAmbience(data: Partial<AmbientOptions>) {
    const homeRef  = getElemById("home")!
    const ambience = get(globalContext).ambience!
    const newData  = { ...ambience, ...data }
    newData.opacity = Math.min(newData.opacity, MAX_AMBIENT_OPACITY)
    const { space, opacity } = newData

    if ((data.opacity || data.active === true) && newData.space.type === "wallpaper") {
        homeRef.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, ${opacity}), rgba(0, 0, 0, ${opacity})), url(${space.sourceId})`
    }
    else if (data?.space?.type === "wallpaper") {
        homeRef.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, ${opacity}), rgba(0, 0, 0, ${opacity})), url(${space.sourceId})`
    }
    else if (newData.space.type === "video") {
        homeRef.style.backgroundImage = "none"
    }

    updateGlobalContext({ ambience: newData })
}

/**
 * Initializes a random ambient space
 */
export function setAmbience() {
    setNewTheme(themes[0])
    const liveSpace = randomArrayElem(POPULAR_SPACES.videos)

    updateGlobalContext({ 
        ambience: {
            opacity: 0.5,
            styling: "blur",
            active: true,
            showTime: true,
            fontStyle: "default",
            spacesOpen: false,
            space: liveSpace
        }
     })
     handleChooseItem(liveSpace.sourceId, liveSpace.type)
}

export function hasAmbienceSpace() {
    const global = localStorage.getItem("home-ui")
    if (!global) {
        return false
    }
    const { ambience } = JSON.parse(global)

    return !!ambience
}

export async function closeAmbience() {
    const homeRef = getElemById("home")!
    const youtube = get(ytPlayerStore)

    if (youtube) {
        youtube.quit()
    }

    homeRef.style.backgroundImage = "none"
    updateGlobalContext({ ambience: undefined })
}

export function getHomeUrlPath(path = window.location.pathname) {
    const name = path.split("/")[2]
    return name === "base" ? "home" : name
}

export function setOatuhRedirectContext(api: "gcal" | "tapi" | "yt") {
    localStorage.setItem("oauth-redirect-context", JSON.stringify({ 
        redirectBackUrl: window.location.pathname, api
    }))
}

export function getOAuthRedirectData(api: "gcal" | "tapi" | "yt") {
    const code = localStorage.getItem(`${api}-code`)
    const error = localStorage.getItem(`${api}-error`) 
    const state = localStorage.getItem(`${api}-state`)

    if (!code) return null
    
    return {
        code,
        error,
        state
    }
}

export function removeOAuthRedirectData(api: "gcal" | "tapi" | "yt") {
    localStorage.removeItem(`${api}-code`)
    localStorage.removeItem(`${api}-error`)
    localStorage.removeItem(`${api}-state`)
}

export function ambienceSideBarOffset(leftOffset: number) {
    const ambience = get(globalContext).ambience
    const sidebar = getElemById("home--right-bar")!
    const sidebarRect = sidebar.getBoundingClientRect()

    if (ambience && ambience.active && ambience.styling === "blur") {
        return leftOffset - sidebarRect.left
    }
    return leftOffset
}

export function modalSideBarOffset(pos: { left: number, top: number }) {
    const modal = document.querySelector(".modal-bg__content")
    if (modal) {
        const modalRect = modal.getBoundingClientRect()
        return {
            left: pos.left - modalRect.left,
            top: pos.top - modalRect.top
        }
    }
    return pos
}

export function setSessionLocation(location: "workspace" | "default") { 
    updateGlobalContext({ sessionLocation: location })
}

/* view options */

/**
 * Load month view options.
 */
export function loadMonthView(): {
    overview: OverviewOptions | null
    goals: GoalsViewOptions | null
    habits: HabitTableOptions | null
    year: YearViewOptions | null
} {
    const overview = localStorage.getItem(OVERVIEW_OPTIONS_KEY)
    const goals = localStorage.getItem(GOALS_OPTIONS_KEY)
    const habits = localStorage.getItem(HABITS_OPTIONS_KEY)
    const year = localStorage.getItem(YR_VIEW_OPTIONS_KEY)

    return { 
        overview: overview ? JSON.parse(overview) : null, 
        goals: goals ? JSON.parse(goals) : null, 
        habits: habits ? JSON.parse(habits) : null, 
        year: year ? JSON.parse(year) : null
    }
}

/**
 * Save month view options.
 */
export function saveMonthView({ overviewView, goalsView, habitView, yearView }: { 
    overviewView: OverviewOptions 
    goalsView: GoalsViewOptions 
    habitView: HabitTableOptions 
    yearView: YearViewOptions 
}) {
    const o_data = JSON.stringify(overviewView)
    const g_data = JSON.stringify(goalsView)
    const h_data = JSON.stringify(habitView)
    const y_data = JSON.stringify(yearView)

    localStorage.setItem(OVERVIEW_OPTIONS_KEY, o_data)
    localStorage.setItem(GOALS_OPTIONS_KEY, g_data)
    localStorage.setItem(HABITS_OPTIONS_KEY, h_data)
    localStorage.setItem(YR_VIEW_OPTIONS_KEY, y_data)
}


export function loadBaseView(): BaseView {
    const data = localStorage.getItem(BASE_VIEW_OPTIONS_KEY)
    return data ? JSON.parse(data) : null
}

export function saveBaseView(options: BaseView) {
    const data = JSON.stringify(options)
    localStorage.setItem(BASE_VIEW_OPTIONS_KEY, data)
}

export function loadBaseLeftMarginView(): BaseLeftMarginView {
    const data = localStorage.getItem(BASE_LEFT_MARGIN_VIEW_KEY)
    return data ? JSON.parse(data) : null
}

export function saveBaseLeftMarginView(options: BaseLeftMarginView) {
    const data = JSON.stringify(options)
    localStorage.setItem(BASE_LEFT_MARGIN_VIEW_KEY, data)
}

export function loadDayViewOptions(): DayViewOptions {
    const data = localStorage.getItem(DAY_VIEW_OPTIONS_KEY)
    return data ? JSON.parse(data) : null
}

export function saveDayViewOptions(options: DayViewOptions) {
    const data = JSON.stringify(options)
    localStorage.setItem(DAY_VIEW_OPTIONS_KEY, data)
}

export function getYearBounds() {
    const user = get(globalContext).user
    const createdYear = new Date(user.createdAt).getFullYear()
    const minDate = new Date(createdYear - MAX_PAST_YEARS, 0, 1)
    const maxDate = new Date(createdYear + MAX_FUTURE_YEARS, 11, 31)
    return { minDate, maxDate }
}