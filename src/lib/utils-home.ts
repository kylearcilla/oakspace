import { get } from "svelte/store"
import { homeViewLayout, mediaEmbedStore, sessionStore } from "./store"
import { MediaEmbedFixed, MediaEmbedType, ModalType, ShortcutSectionInFocus } from "./enums"

import { loadTheme } from "./utils-appearance"
import { didInitYtPlayer } from "./utils-youtube-player"
import { conintueWorkSession, didInitSession } from "./utils-session"
import { didInitMusicUser, loadMusicUserData, musicLogin } from "./utils-music"
import { continueYtPlayerSession, continueYtUserSession, didInitYtUser } from "./utils-youtube"
import { didSpotifyUserAuthApp, getSpotifyCodeFromURLAndLogin } from "./api-spotify"
import { getElemById } from "./utils-general"

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
        continueYtUserSession()
    }
    if (didInitYtPlayer()) {
        continueYtPlayerSession()
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
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") { 
        if (event.key === "Escape") target.blur()

        return hasUserToggledWithKeyLast
    }

    const layoutState = get(homeViewLayout)

    if (event.key === "Escape" && layoutState.modalsOpen.length != 0) {
        const modals = get(homeViewLayout).modalsOpen
        closeModal(modals[modals.length - 1])
    }
    else if (event.ctrlKey && event.key === "]") {
        updteHomeLayout({ ...layoutState, isTaskMenuOpen: !layoutState.isTaskMenuOpen })
    }
    else if (event.ctrlKey && event.key === "[") {
        updteHomeLayout({ ...layoutState, isNavMenuOpen: !layoutState.isNavMenuOpen })
        return true
    }
    else if (event.key === "?" && (layoutState.modalsOpen.length === 0 || isModalOpen(ModalType.Shortcuts))) {
        isModalOpen(ModalType.Shortcuts) ? closeModal(ModalType.Shortcuts) : openModal(ModalType.Shortcuts)
    }
    else if (event.key === "q" && (layoutState.modalsOpen.length === 0 || isModalOpen(ModalType.Quote))) {
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
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

    if (!get(sessionStore) && event.key.toLocaleLowerCase() === "n" && get(homeViewLayout).modalsOpen.length === 0) {
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
    const homeLayout = get(homeViewLayout)

    if (!homeLayout.isNavMenuOpen && mouseX < LEFT_BAR_LEFT_BOUND) {
        updteHomeLayout({ ...get(homeViewLayout), isNavMenuOpen: true  })
        return false
    }
    else if (!hasUserToggledWithKeyLast && homeLayout.isNavMenuOpen && mouseX > LEFT_BAR_RIGHT_BOUND) { 
        updteHomeLayout({ ...get(homeViewLayout), isNavMenuOpen: false  })
    }

    return hasUserToggledWithKeyLast
}

/**
 * Update UI Layout of app.
 * @param newLayout      New layout
 */
export const updteHomeLayout = (newLayout: HomeLayout) => {
    homeViewLayout.set(newLayout)
    localStorage.setItem("home-ui", JSON.stringify(newLayout))
}
  
/**
 * Load previously set layout state.
 */
const loadHomeViewLayOutUIData = () => {
    const storedData = localStorage.getItem("home-ui")
    if (!storedData) return

    let data: HomeLayout = JSON.parse(storedData)
    homeViewLayout.set({ ...data, modalsOpen: [] })
    updteHomeLayout({ ...data, modalsOpen: [] })
}

export function hideWideMenuBar() {
    updteHomeLayout({ ...get(homeViewLayout), isLeftWideMenuOpen: false  })
}

export function showWideMenuBar() {
    updteHomeLayout({ ...get(homeViewLayout), isLeftWideMenuOpen: true  })
}

export function hideRightBar() {
    updteHomeLayout({ ...get(homeViewLayout), isTaskMenuOpen: false  })
}

export function showRightBar() {
    updteHomeLayout({ ...get(homeViewLayout), isTaskMenuOpen: true  })
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
    homeViewLayout.update((data: HomeLayout) => {
        return { ...data, modalsOpen: [ ...data.modalsOpen, modal ]}
    })
}

/**
 * Remove modal from modals array
 * @param modal  Modal to be opened
 */
export const closeModal = (modalToRemove: ModalType) => {
    homeViewLayout.update((data: HomeLayout) => {
        const newArray = data.modalsOpen.filter((modal: ModalType) => modal !== modalToRemove)
        return { ...data, modalsOpen: newArray }
    })
}

/**
 * @param modal  See if this modal is already open.
 * @returns      If modal is open.
 */
export const isModalOpen = (modal: ModalType) => {
    const modalsOpen = get(homeViewLayout).modalsOpen
    return modalsOpen.includes(modal)
}

export const setShortcutsFocus = (section: ShortcutSectionInFocus) => {
    homeViewLayout.update((state: HomeLayout) => {
        return { ...state, shortcutsFocus: section }
    })
}