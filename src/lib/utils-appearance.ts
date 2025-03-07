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
  },
  confirmBtn: {
    light: {
      color1: "#f4d5cd",
      color2: "#824C47",
      color3: "#F1CAC2"
    },
    dark: {
      color1: "#191212",
      color2: "#d49396",
      color3: "#2E2020"
    }
  }
}

export function loadTheme() {
    let theme = JSON.parse(localStorage.getItem("theme") ?? "{}")
    
    if (!theme || Object.keys(theme).length === 0) {
      theme = {
        current: themes[0],
        isDarkTheme: true,
        lightTheme: themes[1].name,
        darkTheme: themes[0].name
      }
      localStorage.setItem("theme", JSON.stringify(theme))
    }
  
    const current = theme.current
    const { name, styling } = current

    themeState.update(state => ({
      ...state, ...theme, current
  }))

  setRootColors(name, styling)
}

export function setPrevTheme(prevTheme: string | null) {
  if (prevTheme) {
    localStorage.setItem("prevTheme", prevTheme)
  }
  else {
    localStorage.removeItem("prevTheme")
  }
}

export function getPrevTheme() {
  return localStorage.getItem("prevTheme")
}

export function setNewTheme(newTheme: Theme, forAmbience = false) {
  const { name, styling } = newTheme
  const isDark = styling.isDark

  themeState.update(state => ({
      ...state,
      isDarkTheme: isDark,
      current: newTheme,
      lightTheme: !isDark ? name : state.lightTheme,
      darkTheme:   isDark ? name : state.darkTheme
  }))
  
  setRootColors(name, newTheme.styling)
  localStorage.setItem("theme", JSON.stringify(get(themeState)))

  if (!forAmbience) {
    setPrevTheme(null)
  }
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
export function setRootColors(name: string, theme: ThemeStyling) {
    const headTag = document.getElementsByTagName('head')[0]
    const styleTag = document.createElement("style")
    const { isDark } = theme

    const dividerBorderStyle = STYLES.dividerBorder[isDark ? "dark" : "light"]
    const dividerBgStyle = STYLES.dividerBg[isDark ? "dark" : "light"]

    const weight_300_400 = isDark ? "300" : "400"
    const weight_400_500 = isDark ? "400" : "500"
    const weight_500_600 = isDark ? "500" : "600"

    const superLight = name === "light" || name === "sand"
    const cardLightBorder = name === "light" ? "1.5px solid rgba(var(--textColor1), 0.065)" : "none"
    const cardLightShadow = superLight ? "rgba(var(--textColor1), 0.055) 0px 5px 10px 1px" : "none"

    const deleteColor1 = STYLES.confirmBtn[isDark ? "dark" : "light"].color1
    const deleteColor2 = STYLES.confirmBtn[isDark ? "dark" : "light"].color2
    const deleteColor3 = STYLES.confirmBtn[isDark ? "dark" : "light"].color3
  
    styleTag.innerHTML = `
      :root {
          --bg-1: ${theme.bg1};
          --bg-2: ${theme.bg2};
          --bg-3: ${theme.bg3};
          --fgColor1: ${theme.fgColor1};
          --fgColor2: ${theme.fgColor2};
          --textColor1: ${theme.textColor1};
          --textColor2: ${theme.textColor2};
          --lightColor1: ${theme.lightColor1};
          --lightColor2: ${theme.lightColor2};
          --calMarkColor: ${theme.calMarkColor};
          --modalBgColor: ${theme.modalBgColor};
          --modalBgAccentColor: ${theme.modalBgAccentColor};
          --bentoBoxBgColor: ${theme.bentoBoxBgColor};
          --bentoBoxBorder: ${theme.bentoBoxBorder};
          --bentoBoxShadow: ${theme.bentoBoxShadow};
          --sessionBlockColor: ${theme.sessionBlockColor};
          --navMenuBgColor: ${theme.navMenuBgColor};
          --navBtnColor: ${theme.navBtnColor};
          --navBtnBgColor: ${theme.navBtnBgColor};
          --rightBarBgColor: ${theme.rightBarBgColor};
          --elemColor1: ${theme.elemColor1};
          --elemColor2: ${theme.elemColor2};
          --elemTextColor: ${theme.elemTextColor};
          --cardBgColor: ${theme.cardBgColor};
          --starColor: ${theme.starColor};
          --heatMapColor: ${theme.heatMapColor};
          --cardFgColor: ${theme.cardHovColor};
          --divider-border: ${dividerBorderStyle};
          --ringColor: ${theme.ringColor};
          --divider-bg: ${dividerBgStyle};
          --textEntryBgColor: ${theme.textEntryBgColor};
          --fw-300-400: ${weight_300_400};
          --fw-400-500: ${weight_400_500};
          --fw-500-600: ${weight_500_600};
          --card-light-border: ${cardLightBorder};
          --card-light-shadow: ${cardLightShadow};
          --confirm-color-1: ${deleteColor1};
          --confirm-color-2: ${deleteColor2};
          --confirm-color-3: ${deleteColor3};
    `
    headTag.appendChild(styleTag)
  }

  /**
   * Gets a root css variable's value of a theme.
   * @param name   Name of the theme property.
   * @returns      Returns the value of this property.
   */
  export function getThemeStyling (name: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`)
  }
