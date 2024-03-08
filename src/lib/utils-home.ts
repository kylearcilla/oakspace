import { get } from "svelte/store"
import { globalContext, mediaEmbedStore, sessionStore } from "./store"
import { MediaEmbedFixed, MediaEmbedType, ModalType, MusicPlatform, ShortcutSectionInFocus, ToasterPosition } from "./enums"

import { loadTheme } from "./utils-appearance"
import { conintueWorkSession, didInitSession } from "./utils-session"
import { didInitMusicUser, loadMusicUserData, musicLogin } from "./utils-music"
import { didInitYtUser, initYoutubePlayer, youtubeLogin, didInitYtPlayer } from "./utils-youtube"
import { didSpotifyUserAuthApp, getSpotifyCodeFromURLAndLogin } from "./api-spotify"

const LEFT_BAR_LEFT_BOUND = 5
const LEFT_BAR_RIGHT_BOUND = 80

/**
 * Initialize app state.
 * Load data from previously saved state (if there is any).
 */
export const initAppState = async () => {
    loadTheme()
    loadHomeViewLayOutUIData()

    if (didInitSession()) {
        conintueWorkSession()
    }
    if (didInitYtUser()) {
        youtubeLogin()
    }
    if (didInitYtPlayer()) {
        initYoutubePlayer()
    }
    if (didInitMusicUser()) {
        const musicPlatform = loadMusicUserData()!.musicPlatform!
        await musicLogin(musicPlatform)
    }
    if (didSpotifyUserAuthApp()) {
        getSpotifyCodeFromURLAndLogin()
    }
}

/**
 * Keyboard shortcut handler for key down events. 
 * @param event  The keyboard key down event to handle.
 * @param hasUserToggledWithKeyLast     If user opened the left side bar with a short cut.
 * @returns                             If user still has toggled left side bar.
 */
export const keyboardShortCutHandlerKeyDown = (event: KeyboardEvent, hasUserToggledWithKeyLast: boolean) => {    
    const target = event.target as HTMLElement
    const context = get(globalContext)
    const { altKey, metaKey, shiftKey, code, key, ctrlKey } = event
    const isTargetContentEditable = target.contentEditable === "true"

    updteGlobalContext({ 
        ...context, 
        lastKeysPressed: { keyCode: code, altKey, metaKey, shiftKey }
    })
    
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || isTargetContentEditable) { 
        // Enter for save, Shift + Enter for break.
        if (isTargetContentEditable && ((key === "Enter" && !shiftKey) || key == "Escape")) {
            target.blur()
        }
        else if (!isTargetContentEditable && (key === "Escape" || (key === "Enter"))) {
            target.blur()
        }

        return hasUserToggledWithKeyLast
    }

    if (key === "Escape" && context.modalsOpen.length != 0) {
        const modals = get(globalContext).modalsOpen
        closeModal(modals[modals.length - 1])
    }
    else if (event.ctrlKey && key === "]") {
        updteGlobalContext({ ...context, isTaskMenuOpen: !context.isTaskMenuOpen })
    }
    else if (ctrlKey && key === "[") {
        updteGlobalContext({ ...context, isNavMenuOpen: !context.isNavMenuOpen })
        return true
    }
    else if (key === "?" && (context.modalsOpen.length === 0 || isModalOpen(ModalType.Shortcuts))) {
        isModalOpen(ModalType.Shortcuts) ? closeModal(ModalType.Shortcuts) : openModal(ModalType.Shortcuts)
    }
    else if (key === "q" && (context.modalsOpen.length === 0 || isModalOpen(ModalType.Quote))) {
        isModalOpen(ModalType.Quote) ? closeModal(ModalType.Quote) : openModal(ModalType.Quote)
    }

    return hasUserToggledWithKeyLast
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

    if (!get(sessionStore) && key === "n" && get(globalContext).modalsOpen.length === 0) {
        openModal(ModalType.NewSession)
    }
}

/**
 * On mouse move handler for home page.
 * Toggles left side bar based on the positioning of the mouse.
 * @param event                         Mouse Event
 * @param hasUserToggledWithKeyLast     If user opened the left side bar with a short cut, then must be hidden again from using the same short cut. Cannot be closed from mouse event.
 * @returns                             If user still has toggled left side bar.
 */
export const onMouseMoveHandler = (event: MouseEvent, hasUserToggledWithKeyLast: boolean): boolean => {
    const mouseX = event.clientX
    const homeLayout = get(globalContext)

    if (!homeLayout.isNavMenuOpen && mouseX < LEFT_BAR_LEFT_BOUND) {
        updteGlobalContext({ ...get(globalContext), isNavMenuOpen: true  })
        return false
    }
    else if (!hasUserToggledWithKeyLast && homeLayout.isNavMenuOpen && mouseX > LEFT_BAR_RIGHT_BOUND) { 
        updteGlobalContext({ ...get(globalContext), isNavMenuOpen: false  })
    }

    return hasUserToggledWithKeyLast
}

/**
 * Update UI Layout of app.
 * @param newLayout      New layout
 */
export const updteGlobalContext = (newLayout: GlobalContext) => {
    globalContext.set(newLayout)
    localStorage.setItem("home-ui", JSON.stringify(newLayout))
}
  
/**
 * Load previously set layout state.
 */
const loadHomeViewLayOutUIData = () => {
    const storedData = localStorage.getItem("home-ui")
    if (!storedData) return

    let data: GlobalContext = JSON.parse(storedData)
    globalContext.set({ ...data, modalsOpen: [] })
    updteGlobalContext({ ...data, modalsOpen: [] })
}

export function hideWideMenuBar() {
    updteGlobalContext({ ...get(globalContext), isLeftWideMenuOpen: false  })
}

export function showWideMenuBar() {
    updteGlobalContext({ ...get(globalContext), isLeftWideMenuOpen: true  })
}

export function hideRightBar() {
    updteGlobalContext({ ...get(globalContext), isTaskMenuOpen: false  })
}

export function showRightBar() {
    updteGlobalContext({ ...get(globalContext), isTaskMenuOpen: true  })
}

export function initFloatingEmbed(type: MediaEmbedType) {
    const width = 600
    const height = 80

    const leftOffset = "50%"
    const topOffset = "100%"
    
    const leftPos = `calc(${leftOffset} - ${width / 2}px)`
    const leftTransform = `calc(-1 * calc(${leftOffset} - ${width / 2}px))`

    const topPos = `calc(${topOffset} + ${height}px)`
    const topTransform = `calc(calc(-1 * calc(${topOffset} - ${height}px)))`

    mediaEmbedStore.set({
        mediaEmbedType: type,
        fixed: MediaEmbedFixed.Bottom,
        leftPos, leftTransform,
        topPos, topTransform,
        width:`${width}`, height: `${height}`
    })
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
        const newArray = data.modalsOpen.filter((modal: ModalType) => modal !== modalToRemove)
        return { ...data, modalsOpen: newArray }
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