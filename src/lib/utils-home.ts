import { get } from "svelte/store"
import { globalContext, ytPlayerStore } from "./store"
import { ModalType, MusicPlatform, ShortcutSectionInFocus } from "./enums"

import { loadTheme } from "./utils-appearance"
import { conintueWorkSession, didInitSession } from "./utils-session"
import { didInitMusicPlayer, didInitMusicUser, initMusicPlayer, musicLogin } from "./utils-music"
import { didInitYtUser, initYoutubePlayer, youtubeLogin, didInitYtPlayer, handleChooseVideo } from "./utils-youtube"
import { getElemById, isTargetTextEditor, randomArrayElem } from "./utils-general"
import { initMusicSettings } from "./utils-music-settings"
import { POPULAR_SPACES } from "./data-spaces"

/* constants */

export const LEFT_BAR_MIN_WIDTH = 60
export const LEFT_BAR_FLOAT_WIDTH = 160
export const LEFT_BAR_FULL_WIDTH = 185
const LEFT_BAR_LEFT_BOUND = 20
const SESSION_MIN_WIDTH = 750
const MAX_AMBIENT_OPACITY = 0.85

/* blur */
export const AMBIENT = {
    BG_BLUR: "blur(50px)",
    BG_COLOR: "rgba(10, 10, 10, 0.2)",
    DARK_BG_COLOR: "rgba(10, 10, 10, 0.5)",
    BORDER: "1px solid rgba(255, 255, 255, 0.055)"
}

/**
 * Initialize app state.
 * Load data from previously saved state (if there is any).
 */
export const initAppState = async () => {
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
    if (didInitMusicPlayer()) {
        await initMusicPlayer(MusicPlatform.YoutubeMusic, !didInitYtPlayer())
    }
    if (didInitMusicUser()) {
        await musicLogin()
    }

    initMusicSettings()
}

export function onQuitApp() {
    // const session = get(sessionManager)
    // if (session) {
    //     session.stopTimer()
    // }
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
        // Enter for save, Shift + Enter for break.
        if (isTargetContentEditable && ((key === "Enter" && !shiftKey) || key == "Escape")) {
            target.blur()
        }
        else if (!isTargetContentEditable && (key === "Escape" || (key === "Enter"))) {
            target.blur()
        }

        return toggledLeftBarWithKey
    }

    const doNotOpenRightBar = false
    const leftBar = context.leftBar
    const ambience = context.ambience
    const wideLeftBarCtrl = !ambience && ctrlKey && (leftBar === "wide-float" || leftBar === "wide-full")

    // if (key === "Escape" && context.modalsOpen.length != 0) {
    //     const modals = get(globalContext).modalsOpen
    //     console.log(event)

    //     closeModal(modals[modals.length - 1])
    // }
    if (event.ctrlKey && key === "]" && !doNotOpenRightBar) {
        updateGlobalContext({ rightBarOpen: !context.rightBarOpen })
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
    else if (key === "m" && wideLeftBarCtrl) {
        updateLeftBar("min")
    }
    else if (key === "m" && ctrlKey && !ambience && leftBar === "min") {
        updateLeftBar("wide-full")
    }

    return toggledLeftBarWithKey
}

function updateLeftBar(type: "wide-float" | "wide-full" | "min") {
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
    const mouseX = event.clientX
    const context = get(globalContext)
    const target = event.target as HTMLElement

    if (target.classList.value.includes("media-player")) {
        return toggledLeftBarWithKey
    }

    const isInArea = mouseX < LEFT_BAR_LEFT_BOUND
    const isActiveRoutineOpen = context.doOpenActiveRoutine
    const leftBarOpen = context.leftBarOpen
    const leftBar = context.leftBar
    const autoCloseRightThreshold = getLeftBarWidth(leftBar!)

    if (!leftBarOpen && !isActiveRoutineOpen && isInArea) {
        updateGlobalContext({ ...get(globalContext), leftBarOpen: true  })
        return false
    }
    else if (!toggledLeftBarWithKey && context.leftBarOpen && mouseX > autoCloseRightThreshold) { 
        updateGlobalContext({ ...get(globalContext), leftBarOpen: false  })
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
        ...data, modalsOpen: [] 
    })
}

export function hideRightBar() {
    updateGlobalContext({ rightBarOpen: false  })
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

export const setShortcutsFocus = (section: ShortcutSectionInFocus) => {
    globalContext.update((state: GlobalContext) => {
        return { ...state, shortcutsFocus: section }
    })
}

export function toggleActiveRoutine() {
    globalContext.update((state: GlobalContext) => {
        return { ...state, doOpenActiveRoutine: !state.doOpenActiveRoutine }
    })
}

export function toggleYoutubePlayerFloat(doShow?: boolean) {
    const oldState    = get(globalContext)
    const mediaPlayer = oldState.mediaPlayer ?? { 
        music: false, youtube: false 
    }

    updateGlobalContext({ 
        mediaPlayer: { ...mediaPlayer, youtube: doShow != undefined ? doShow : !mediaPlayer.youtube } 
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

    if (data.opacity && newData.space.type === "wallpaper") {
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
    const liveSpace = randomArrayElem(POPULAR_SPACES.videos)
    updateGlobalContext({ 
        ambience: {
            opacity: 0.5,
            styling: "blur",
            space: liveSpace
        }
     })
     handleChooseVideo(liveSpace.sourceId)
}

export async function closeAmbience() {
    const homeRef = getElemById("home")!
    const youtube = get(ytPlayerStore)

    if (youtube) {
        // if user didn't have a youtube player active.
        if (await youtube.backToPlaylist()) {
            youtube.quit()
        }
        updateGlobalContext({ mediaPlayer: {
            youtube: false, music: false
        }})
    }

    homeRef.style.backgroundImage = "none"
    updateGlobalContext({ ambience: undefined })
}

export function getHomeUrlPath(path = window.location.pathname) {
    const name = path.split("/")[2]
    return name === "base" ? "home" : name
}