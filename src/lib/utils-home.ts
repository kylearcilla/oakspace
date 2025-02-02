import { get } from "svelte/store"
import { globalContext, timer, ytPlayerStore } from "./store"
import { ModalType } from "./enums"

import { loadTheme, setNewTheme } from "./utils-appearance"
import { conintueWorkSession, didInitSession } from "./utils-session"
import { didInitYtUser, initYoutubePlayer, youtubeLogin, didInitYtPlayer, handleChooseItem } from "./utils-youtube"
import { getElemById, isTargetTextEditor, randomArrayElem } from "./utils-general"
import { POPULAR_SPACES } from "./data-spaces"
import { initEmojis } from "./emojis"
import { themes } from "./data-themes"
import { initHabits } from "./utils-habits"

/* constants */
export const LEFT_BAR_MIN_WIDTH = 60
export const LEFT_BAR_FLOAT_WIDTH = 160
export const LEFT_BAR_FULL_WIDTH = 185
const LEFT_BAR_LEFT_BOUND = 20
const RIGHT_BAR_RIGHT_BOUND = 20

const SESSION_MIN_WIDTH = 750
const MAX_AMBIENT_OPACITY = 0.85

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

/**
 * Initialize app state.
 * Load data from previously saved state (if there is any).
 */
export const initAppState = async () => {
    initEmojis()  
    initTimer()
    initHabits()
    loadTheme()
    loadGlobalContext()
    loadAmbience()

    if (didInitSession()) {
        conintueWorkSession()
    }
    if (didInitYtUser()) {
        youtubeLogin()
    }
    if (didInitYtPlayer()) {
        await initYoutubePlayer()
    }
}

export function onQuitApp() {
    // const session = get(sessionManager)
    // if (session) {
    //     session.stopTimer()
    // }
}

export function initTimer() {
    const worker = new Worker(new URL('./workers/timeWorker.ts', import.meta.url))

    worker.onmessage = (event) => {
        if (event.data === 'tick') { 
            timer.update((data: { date: Date }) => ({ ...data, date: new Date() }))
        }
    }
    worker.postMessage({ interval: 1000 })
}

/**
 * Keyboard shortcut handler for key down events. 
 * @param event                  The keyboard key down event to handle.
 * @param toggledLeftBarWithKey  If user opened the left side bar with a short cut.
 * @param width                  Total window width
 * 
 * @returns                             If user still has toggled left side bar.
 */
export const keyboardShortCutHandlerKeyDown = (event: KeyboardEvent, toggledLeftBarWithKey: boolean, totalWidth: number) => {    
    const target = event.target as HTMLElement
    const context = get(globalContext)
    const { altKey, metaKey, shiftKey, code, key, ctrlKey } = event
    const isTargetContentEditable = target.contentEditable === "true"

    updateGlobalContext({ 
        ...context, 
        lastKeysPressed: { keyCode: code, altKey, metaKey, shiftKey }
    })
    
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

    const doNotOpenRightBar = false
    const leftBar = context.leftBar
    const hasAmbience = context.ambience?.active
    const wideLeftBarCtrl = !hasAmbience && ctrlKey && (leftBar === "wide-float" || leftBar === "wide-full")

    // if (key === "Escape" && context.modalsOpen.length != 0) {
    //     const modals = get(globalContext).modalsOpen
    //     console.log(event)

    //     closeModal(modals[modals.length - 1])
    // }
    if (event.ctrlKey && key === "]" && !doNotOpenRightBar) {
        updateGlobalContext({ 
            rightBarOpen: !context.rightBarOpen,
            rightBarFixed: !context.rightBarOpen === false
        })
    }
    else if (ctrlKey && key === "[") {
        updateGlobalContext({ leftBarOpen: !context.leftBarOpen })
        return true
    }
    else if (key === "?" && (context.modalsOpen.length === 0 || isModalOpen(ModalType.Shortcuts))) {
        isModalOpen(ModalType.Shortcuts) ? closeModal(ModalType.Shortcuts) : openModal(ModalType.Shortcuts)
    }
    else if (key === "q" && (context.modalsOpen.length === 0 || isModalOpen(ModalType.Quote))) {
        isModalOpen(ModalType.Quote) ? closeModal(ModalType.Quote) : openModal(ModalType.Quote)
    }
    else if (key === "/" && wideLeftBarCtrl) {
        updateLeftBar(leftBar === "wide-float" ? "wide-full" : "wide-float")
    }

    return toggledLeftBarWithKey
}

function updateLeftBar(type: "wide-float" | "wide-full") {
    updateGlobalContext({ leftBar: type, leftBarOpen: true })
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

    const { 
        leftBarOpen, 
        rightBarOpen, 
        rightBarFixed, 
        leftBar, 
    } = context

    const leftInArea = mouseLeftPos < LEFT_BAR_LEFT_BOUND
    const activeRoutineOpen = !!getElemById("active-routine--dmenu")
    const lbAutoCloseThreshold = getLeftBarWidth(leftBar!)
    
    const rightInArea = mouseRightPos < RIGHT_BAR_RIGHT_BOUND
    const rbAutoCloseThreshold = 300

    if (!leftBarOpen && !activeRoutineOpen && leftInArea) {
        const hasModal = document.querySelector(".modal-bg")
        if (hasModal) return false

        updateGlobalContext({ ...get(globalContext), leftBarOpen: true  })
        return false
    }
    else if (!toggledLeftBarWithKey && context.leftBarOpen && mouseLeftPos > lbAutoCloseThreshold) { 
        updateGlobalContext({ ...get(globalContext), leftBarOpen: false  })
    }
    else if (rightBarFixed && !rightBarOpen && rightInArea) { 
        const hasModal = document.querySelector(".modal-bg")
        if (hasModal) return false
        
        updateGlobalContext({ ...get(globalContext), rightBarOpen: true  })
    }
    else if (rightBarFixed && rightBarOpen && mouseRightPos > rbAutoCloseThreshold) { 
        updateGlobalContext({ ...get(globalContext), rightBarOpen: false  })
    }

    return toggledLeftBarWithKey
}


export function getLeftBarWidth(leftBar: "min" | "wide-float" | "wide-full"): number {
    switch (leftBar) {
        case "min":
            return LEFT_BAR_MIN_WIDTH
        case "wide-float":
            return LEFT_BAR_FLOAT_WIDTH
        default:
            return LEFT_BAR_FULL_WIDTH
    }
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

    updateGlobalContext({ 
        ...data, 
        modalsOpen: [] 
    })
}

export function hideRightBar() {
    updateGlobalContext({ rightBarOpen: false })
}

export function showRightBar() {
    updateGlobalContext({ rightBarOpen: true  })
}
/**
 * Add modal to "open modals" array
 * @param modal  Modal to be opened
 */
export const openModal = (modal: ModalType) => {
    globalContext.update((data: GlobalContext) => {
        return { ...data, modalsOpen: [ ...data.modalsOpen, modal ]}
    })
}

/**
 * Remove modal from modals array
 * @param modal  Modal to be opened
 */
export const closeModal = (modalToRemove: ModalType) => {
    globalContext.update((data: GlobalContext) => {

        return { 
            ...data, 
            modalsOpen: data.modalsOpen.filter((modal: ModalType) => modal !== modalToRemove)
        }
    })
}

/**
 * @param modal  See if this modal is already open.
 * @returns      If modal is open.
 */
export const isModalOpen = (modal: ModalType) => {
    const modalsOpen = get(globalContext).modalsOpen
    return modalsOpen.includes(modal)
}

export const setShortcutsFocus = (context: HotkeyContext) => {
    globalContext.update((state: GlobalContext) => {
        return { ...state, shortcutsFocus: context }
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
            clockFont: "DM Sans",
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