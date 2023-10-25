import { get } from "svelte/store"
import { homeViewLayout, sessionStore } from "./store"

import { ModalType } from "./enums"
import { conintueWorkSession, didInitSession } from "./utils-session"
import { loadTheme } from "./utils-appearance"
import { continueMusicSession, didInitMusicUser, loadMusicUserData } from "./utils-music"
import { continueYtPlayerSession, continueYtUserSession, didInitYtUser } from "./utils-youtube"
import { didInitYtPlayer } from "./utils-youtube-player"

const LEFT_BAR_LEFT_BOUND = 5
const LEFT_BAR_RIGHT_BOUND = 80
const MIN_UI_MAX_WIDTH = 600

/**
 * Initialize app state.
 * Load data from previously saved state (if there is any).
 */
export const initAppState = () => {
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
        continueMusicSession(musicPlatform)
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
    if (target.tagName === "INPUT") return hasUserToggledWithKeyLast

    const layoutState = get(homeViewLayout)

    if (event.key === "Escape" && layoutState.modalsOpen.length != 0) {
        const modals = get(homeViewLayout).modalsOpen
        closeModal(modals[modals.length - 1])
    }
    else if (event.ctrlKey && event.key === "]") {
        updateUI({ ...layoutState, isTaskMenuOpen: !layoutState.isTaskMenuOpen })
    }
    else if (event.key === "?" && layoutState.modalsOpen.length === 0) {
        isModalOpen(ModalType.Shortcuts) ? closeModal(ModalType.Shortcuts) : openModal(ModalType.Shortcuts)
    }
    else if (event.ctrlKey && event.key === "[") {
        updateUI({ ...layoutState, isNavMenuOpen: !layoutState.isNavMenuOpen })
        return true
    }

    return hasUserToggledWithKeyLast
}

/**
 * Keyboard shortcut handler for key up events. 
 * @param event  The keyboard key up event to handle.
 */
export const keyboardShortCutHandlerKeyUp = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    if (target.tagName === "INPUT") return

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
        updateUI({ ...get(homeViewLayout), isNavMenuOpen: true  })
        return false
    }
    else if (!hasUserToggledWithKeyLast && homeLayout.isNavMenuOpen && mouseX > LEFT_BAR_RIGHT_BOUND) { 
        homeViewLayout.update((data: any) => ({ ...data, isNavMenuOpen: false }))
    }

    return hasUserToggledWithKeyLast
}

/**
 * Update home's classes that depends on side bars being open / closed.
 * @param isNavMenuOpen   If left side bar is open.
 * @param isTaskMenuOpen  If right side bar is open.
 * @returns               List of classes to be applied to middle view copmonent to change its apperance.
 */
export const homeVideoViewClassHandler = (isNavMenuOpen: boolean, isTaskMenuOpen: boolean): string => {
    if (!isTaskMenuOpen && isNavMenuOpen) {
       return "home--just-nav-menu-shown"
    }
    if (isTaskMenuOpen && !isNavMenuOpen) {
       return "home--just-task-view-shown"
    }
    if (isTaskMenuOpen && isNavMenuOpen) {
       return "home--both-shown"
    }

   return ""
}

/**
 * Update UI Layout of app.
 * @param newLayout      New layout
 */
export const updateUI = (newLayout: HomeLayout) => {
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