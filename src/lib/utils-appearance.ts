import { get } from "svelte/store"
import { themeState } from "./store"
import { themes } from "$lib/data-themes"

const STYLES = {
  dividerBorder: {
    light: "1px solid rgba(var(--textColor1), 0.1)",
    dark: "0.5px solid rgba(var(--textColor1), 0.05)"
  },
  dividerBg: {
    light: "rgba(var(--textColor1), 0.1)",
    dark: "rgba(var(--textColor1), 0.05)"
  }
}

/**
 * Load theme from local storage to init current color theme.
 */
export function loadTheme() {
    let storedTheme = localStorage.getItem("theme")
    
    if (!storedTheme) {
      localStorage.setItem("theme", JSON.stringify(themes[0]))
      storedTheme = localStorage.getItem("theme")
    } 
  
    const { name, styling } = JSON.parse(storedTheme!)
    const isDark = styling.isDark

    themeState.update(state => ({
      ...state,
      isDarkTheme: isDark,
      lightTheme: !isDark ? name : state.lightTheme,
      darkTheme:   isDark ? name : state.darkTheme
  }))

  setRootColors(styling)
}

export function setPrevTheme(prevTheme: string) {
  localStorage.setItem("prevTheme", prevTheme)
}

export function getPrevTheme() {
  return localStorage.getItem("prevTheme")
}

export function setNewTheme(newTheme: Theme) {
  const { name, styling } = newTheme
  const isDark = styling.isDark

  themeState.update(state => ({
      ...state,
      isDarkTheme: isDark,
      lightTheme: !isDark ? name : state.lightTheme,
      darkTheme:   isDark ? name : state.darkTheme
  }))
  
  setRootColors(newTheme.styling)
  localStorage.setItem("theme", JSON.stringify(newTheme))
}

export function findThemeFromName(name: string) {
  return themes.find(theme => theme.name === name)
}

export function getActiveTheme() {
  const theme = get(themeState)
  const { isDarkTheme, lightTheme, darkTheme } = theme

  return isDarkTheme ? darkTheme : lightTheme
}

/**
 * Updates the root color variables to new theme's color scheme.
 * Allows for global access of colors throughout the app.
 * 
 * @param theme theme object to be currently used
 */
export function setRootColors(theme: ThemeStyling) {
    const headTag = document.getElementsByTagName('head')[0]
    const styleTag = document.createElement("style")
    const { isDark } = theme

    const dividerBorderStyle = STYLES.dividerBorder[isDark ? "dark" : "light"]
    const dividerBgStyle = STYLES.dividerBg[isDark ? "dark" : "light"]

    const weight_300_400 = isDark ? "300" : "400"
    const weight_400_500 = isDark ? "400" : "500"
    const weight_500_600 = isDark ? "500" : "600"
  
    styleTag.innerHTML = `
      :root {
          --bg-1: ${theme.bg1};
          --bg-2: ${theme.bg2};
          --bg-3: ${theme.bg3};
          --fgColor1: ${theme.fgColor1};
          --fgColor2: ${theme.fgColor2};
          --textColor1: ${theme.textColor1};
          --textColor2: ${theme.textColor2};
          --lightColor: ${theme.lightColor};
          --lightColor2: ${theme.lightColor2};
          --lightColor3: ${theme.lightColor3};
          --navMenuBorder: ${theme.navMenuBorder};
          --modalBgColor: ${theme.modalBgColor};
          --modalBgAccentColor: ${theme.modalBgAccentColor};
          --bentoBoxBgColor: ${theme.bentoBoxBgColor};
          --bentoBoxBorder: ${theme.bentoBoxBorder};
          --bentoBoxShadow: ${theme.bentoBoxShadow};
          --muiscPlayerBgColor: ${theme.muiscPlayerBgColor};
          --musicProgressFgColor: ${theme.musicProgressFgColor};
          --sessionBlockColor: ${theme.sessionBlockColor};
          --navMenuBgColor: ${theme.navMenuBgColor};
          --navBtnColor: ${theme.navBtnColor};
          --navBtnBgColor: ${theme.navBtnBgColor};
          --minNavBtnColor: ${theme.minNavBtnColor};
          --minNavBtnBgColor: ${theme.minNavBtnBgColor};
          --rightBarBgColor: ${theme.rightBarBgColor};
          --elemColor1: ${theme.elemColor1};
          --elemColor2: ${theme.elemColor2};
          --elemTextColor: ${theme.elemTextColor};
          --cardBgColor: ${theme.cardBgColor};
          --cardFgColor: ${theme.cardHovColor};
          --divider-border: ${dividerBorderStyle};
          --divider-bg: ${dividerBgStyle};
          --textEntryBgColor: ${theme.textEntryBgColor};
          --fw-300-400: ${weight_300_400};
          --fw-400-500: ${weight_400_500};
          --fw-500-600: ${weight_500_600};
    `
    headTag.appendChild(styleTag)
  }

  /**
   * Gets a root css variable's value of a theme.
   * @param name   Name of the theme property.
   * @returns      Returns the value of this property.
   */
  export function getThemeStyling (name: keyof ThemeStyling) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`)
  }
