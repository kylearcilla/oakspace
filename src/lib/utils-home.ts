import { get } from "svelte/store"
import { homeViewLayout } from "./store"
import { loadTheme } from "./utils-appearance"
import { initMusicPlatform } from "./utils-music"
import { initYtPlayer, initYtUser } from "./utils-youtube"
import { initSession } from "./utils-session"

const LEFT_BAR_LEFT_BOUND = 5
const LEFT_BAR_RIGHT_BOUND = 80
const MIN_UI_MAX_WIDTH = 600

/**
 * On mouse move handler for home page.
 * Toggles left side bar based on the positioning of the mouse.
 * @param event                         Mouse Event
 * @param hasUserToggledWithKeyLast     If user opened the left side bar with a short cut, then must be hidden again from using the same short cut.
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
    let data: HomeLayout

    if (!storedData) {
        data = {
        isNavMenuOpen: true,
        isTaskMenuOpen: true,
        isVideoViewOpen: true,
        isMusicPlayerOpen: true,
        minModeSrc: null,
        settingsModal: null
        }
    } else {
        data = JSON.parse(storedData)
    }
    homeViewLayout.set({ ...data, settingsModal: null })
}

/**
 * Initialize app state.
 * Load data from previously saved state (if there is any).
 */
export const initAppState = () => {
    // ui
    loadTheme()
    loadHomeViewLayOutUIData()

    // app data
    initSession()

    // streaming platforms
    initYtUser()
    initYtPlayer()
    initMusicPlatform()
}