import { get } from "svelte/store"
import { homeViewLayout } from "./store"
import { loadTheme } from "./utils-appearance"
import { initMusicPlatform } from "./utils-music"
import { initYtPlayer, initYtUser } from "./utils-youtube"

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
 * When window is resized, update the look of the app by toggling side menu bars.
 * If the window is smaller than 600, then hide both side menus.
 */
export const onWindowResizedHandler = () => {
    if (document.body.clientWidth > MIN_UI_MAX_WIDTH) return
    updateUI({ ...get(homeViewLayout), isTaskMenuOpen: false, isNavMenuOpen: false  })
}

/**
 * 
 * @param event   Keyboard Event
 * @returns       If user has used the short cut to hide the left side bar.
 */
export const appShortCutsHandler = (event: KeyboardEvent): boolean => {
    const homeLayout = get(homeViewLayout)

    if (event.shiftKey && event.key === "}") {
        updateUI({ ...homeLayout, isTaskMenuOpen: !homeLayout.isTaskMenuOpen })
    }
    else if (event.shiftKey && event.key === "{") {
        updateUI({ ...homeLayout, isNavMenuOpen: !homeLayout.isNavMenuOpen })
        return true
    }
    else if (event.key=== "Escape") {
        homeViewLayout.update((data: HomeLayout) => ({ ...data, modal: null }))
    }

    return false
}

/**
 * Update home's classes that depends on side bars being open / closed.
 * @param isNavMenuOpen   If left side bar is open.
 * @param isTaskMenuOpen  If right side bar is open.
 * @returns               List of classes to be applied to middle view copmonent to change its apperance.
 */
export const homeVideoViewClassHandler = (isNavMenuOpen: boolean, isTaskMenuOpen: boolean): string => {
    const classes = [];
    if (!isNavMenuOpen) {
        classes.push("home__video--nav-menu-hidden");
    }
    if (!isTaskMenuOpen) {
        classes.push("home__video--task-view-hidden");
    }
    if (!isTaskMenuOpen && isNavMenuOpen) {
        classes.push("home__video--just-nav-menu-shown");
    }
    if (isTaskMenuOpen && !isNavMenuOpen) {
        classes.push("home__video--just-task-view-shown");
    }
    if (isTaskMenuOpen && isNavMenuOpen) {
        classes.push("home__video--task-view-also-shown");
    }

   return classes.join(' ');
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
        modal: null
        }
    } else {
        data = JSON.parse(storedData)
    }
    homeViewLayout.set({ ...data, modal: null })
}

/**
 * Initialize app state.
 * Load data from previously saved state (if there is any).
 */
export const initAppState = () => {
    // ui
    onWindowResizedHandler()
    loadTheme()
    loadHomeViewLayOutUIData()

    // streaming platforms
    initYtUser()
    initYtPlayer()
    initMusicPlatform()
}