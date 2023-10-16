import { themeState } from "./store"
import { lightColorThemes, darkColorThemes, imageThemes, ambientVideos, defaultThemes } from "$lib/data-themes"

const themeSections: AppearanceThemes = {
  default: defaultThemes,
  light: lightColorThemes,
  dark: darkColorThemes,
  image: imageThemes,
  video: ambientVideos
}

/**
 * Load theme from local storage to persit theme data between refreshes.
 */
export const loadTheme = () => {
    let storedColorThemStyling = localStorage.getItem("theme")
    
    if (!storedColorThemStyling) {
      localStorage.setItem("theme", JSON.stringify(defaultThemes[0]))
      storedColorThemStyling = localStorage.getItem("theme")
    } 
  
    const themeItem = JSON.parse(storedColorThemStyling!)

    themeState.set({
      title: themeItem!.title,
      isDarkTheme: themeItem!.styling.isDark,
      themeToggleBtnIconColor: themeItem!.styling.iconToggleBtnBgColor,
      twinTheme: themeItem!.twinTheme
    })
    setRootColors(themeItem!.styling)
}

/**
 * Uses object prop / string indexing to get theme from selected theme item's title and index. 
 * @param title  Section title, must be a property name of Apperance Themes
 * @param idx    Section idex
 * @returns      Theme selected
 */
export const getThemeFromSection = (title: keyof AppearanceThemes, idx: number): Theme => {
  return themeSections[title][idx]
}

/**
 * Set and save new theme, handles all themes.
 * @param newTheme  New Theme
 */
export const setNewTheme = (newTheme: Theme) => {
  let theme: any = newTheme
  let newThemeState: ThemeState
  
  // if a Color Theme
  if ("twinTheme" in newTheme) {
    newThemeState = {
      title: theme.title,
      isDarkTheme: theme.styling.isDark,
      themeToggleBtnIconColor: theme.styling.iconToggleBtnBgColor,
      twinTheme: theme.twinTheme
    }

    setRootColors(theme.styling)
  }
  
  themeState.set(newThemeState!)
  localStorage.setItem("theme", JSON.stringify(theme))
}

/**
 * Sets selected theme colors to the root element of the document
 * Allows for global access of colors throughout the app
 * 
 * @param theme theme object to be currently used
 */
export const setRootColors = (theme: ColorThemeProps) => {
    const headTag = document.getElementsByTagName('head')[0];
    const styleTag = document.createElement("style");
  
    styleTag.innerHTML = `
      :root {
          --primaryBgColor: ${theme.primaryBgColor};
          --secondaryBgColor: ${theme.secondaryBgColor};
          --tertiaryBgColor: ${theme.tertiaryBgColor};
          --fgColor1: ${theme.fgColor1};
          --fgColor2: ${theme.fgColor2};
          --sessionBgColor: ${theme.sessionBgColor};
          --sessionBorderVal: ${theme.sessionBorderVal};
          --sessionShadowVal: ${theme.sessionShadowVal};
          --textColor1: ${theme.textColor1};
          --textColor2: ${theme.textColor2};
          --hoverColor: ${theme.hoverColor};
          --hoverColor2: ${theme.hoverColor2};
          --hoverColor3: ${theme.hoverColor3};
          --tabColor: ${theme.tabColor};
          --tabHighlightColor: ${theme.tabHighlightColor};
          --tabHighlightBoxShadow: ${theme.tabHighlightBoxShadow};
          --headerElementBgColor: ${theme.headerElementBgColor};
          --headerElementBorderVal: ${theme.headerElementBorderVal};
          --headerElementTextColor: ${theme.headerElementTextColor};
          --headerElementShadow: ${theme.headerElementShadow};
          --headerTimeColor: ${theme.headerTimeColor};
          --headerProgressColor1: ${theme.headerProgressColor1};
          --headerProgressColor2: ${theme.headerProgressColor2};
          --headerTrackColor1: ${theme.headerTrackColor1};
          --headerTrackColor2: ${theme.headerTrackColor2};
          --baseProgressColor1: ${theme.baseProgressColor1};
          --baseProgressColor2: ${theme.baseProgressColor2};
          --baseTrackColor1: ${theme.baseTrackColor1};
          --baseTrackColor2: ${theme.baseTrackColor2};
          --progressBallGlow: ${theme.progressBallGlow};
          --modalBgColor: ${theme.modalBgColor};
          --modalBgAccentColor: ${theme.modalBgAccentColor};
          --bentoBoxBgColor: ${theme.bentoBoxBgColor};
          --bentoBoxBorder: ${theme.bentoBoxBorder};
          --bentoBoxShadow: ${theme.bentoBoxShadow};
          --muiscPlayerBgColor: ${theme.muiscPlayerBgColor};
          --musicProgressFgColor: ${theme.musicProgressFgColor};
          --navMenuBgColor: ${theme.navMenuBgColor};
          --navIconColor: ${theme.navIconColor};
          --navIconBgColor: ${theme.navIconBgColor};
          --themeToggleBtnBgColor: ${theme.themeToggleBtnBgColor};
          --iconToggleBtnBgColor: ${theme.iconToggleBtnBgColor};
          --highlighterToggleBtnBgColor: ${theme.highlighterToggleBtnBgColor};
          --midPanelBorder: ${theme.midPanelBorder};
          --midPanelShadow: ${theme.midPanelShadow};
          --midPanelBaseColor: ${theme.midPanelBaseColor};
          --midPanelAccentColor1: ${theme.midPanelAccentColor1};
          --midPanelAccentColor2: ${theme.midPanelAccentColor2};
          --midPanelAccentColor3: ${theme.midPanelAccentColor3};
          --midPanelAccentTextColor: ${theme.midPanelAccentTextColor};
          --sidePanelBorder: ${theme.sidePanelBorder};
          --sidePanelShadow: ${theme.sidePanelShadow};
          --dropdownMenuBgColor1: ${theme.dropdownMenuBgColor1};
          --dropdownMenuBgHoverColor1: ${theme.dropdownMenuBgHoverColor1};
          --dropdownMenuBgColor2: ${theme.dropdownMenuBgColor2};
          --dropdownMenuBgHoverColor2: ${theme.dropdownMenuBgHoverColor2};
      }
    `
    headTag.appendChild(styleTag)
  }


  export const getThemeStyling = (name: keyof ColorThemeProps) => {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`)
  }