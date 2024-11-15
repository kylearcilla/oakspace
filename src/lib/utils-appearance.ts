import { themeState } from "./store"
import { lightColorThemes, darkColorThemes, defaultThemes } from "$lib/data-themes"

const sectionToThemeMap: AppearanceSectionToThemeMap = {
  default: defaultThemes,
  light: lightColorThemes,
  dark: darkColorThemes
}

/**
 * Load theme from local storage to init current color theme.
 */
export function loadTheme() {
    let storedColorThemStyling = localStorage.getItem("theme")
    
    if (!storedColorThemStyling) {
      localStorage.setItem("theme", JSON.stringify(defaultThemes[0]))
      storedColorThemStyling = localStorage.getItem("theme")
    } 
  
    const themeItem = JSON.parse(storedColorThemStyling!)

    themeState.set({
      title: themeItem!.title,
      isDarkTheme: themeItem!.styling.isDark
    })
    setRootColors(themeItem!.styling)
}

/**
 * Initializes a new them state object and updates root theme colors.
 * @param newTheme  New theme selected by user
 */
export function setNewTheme(newTheme: ColorTheme) {
  let newThemeState: ThemeState = {
    title: newTheme!.title,
    isDarkTheme: newTheme!.styling.isDark
  }

  themeState.set(newThemeState!)
  setRootColors(newTheme!.styling)
  localStorage.setItem("theme", JSON.stringify(newTheme))
}

/**
 * Get theme object from title and index.
 * @param title  Section title, must be a property name of Apperance Themes
 * @param idx    Section idex
 * @returns      Theme selected
 */
export function getThemeFromSection(title: keyof AppearanceSectionToThemeMap, idx: number): Theme {
  return sectionToThemeMap[title][idx]
}


/**
 * Updates the root color variables to new theme's color scheme.
 * Allows for global access of colors throughout the app.
 * 
 * @param theme theme object to be currently used
 */
export function setRootColors(theme: ColorThemeProps) {
    const headTag = document.getElementsByTagName('head')[0];
    const styleTag = document.createElement("style");
  
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
      }
    `
    headTag.appendChild(styleTag)
  }

  /**
   * Gets a root css variable's value of a theme.
   * @param name   Name of the theme property.
   * @returns      Returns the value of this property.
   */
  export function getThemeStyling (name: keyof ColorThemeProps) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`)
  }
