import { themeState } from "./store"
import { lightColorThemes, darkColorThemes, imageThemes, ambientVideos, defaultThemes } from "$lib/data-themes"
import { ResError } from "./errors"

const sectionToThemeMap: AppearanceSectionToThemeMap = {
  default: defaultThemes,
  light: lightColorThemes,
  dark: darkColorThemes,
  image: imageThemes,
  video: ambientVideos
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
      isDarkTheme: themeItem!.styling.isDark,
      themeToggleBtnIconColor: themeItem!.styling.iconToggleBtnBgColor,
      twinTheme: themeItem!.twinTheme
    })
    setRootColors(themeItem!.styling)
}

/**
 * Initializes a new them state object and updates root theme colors.
 * @param newTheme  New Theme
 */
export function setNewTheme(newTheme: Theme) {
  let _newTheme: any = newTheme
  let newThemeState: ThemeState
  
  // if theme is a color / default theme
  if ("twinTheme" in newTheme) {
    newThemeState = {
      title: _newTheme.title,
      isDarkTheme: _newTheme.styling.isDark,
      themeToggleBtnIconColor: _newTheme.styling.iconToggleBtnBgColor,
      twinTheme: _newTheme.twinTheme
    }

    setRootColors(_newTheme.styling)
  }
  
  themeState.set(newThemeState!)
  localStorage.setItem("theme", JSON.stringify(_newTheme))
}

/**
 * Uses object prop / string indexing to get theme from selected theme item's title and index. 
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
          --primaryBgColor: ${theme.primaryBgColor};
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
          --headerTextColor: ${theme.headerTextColor};
          --headerIconColor: ${theme.headerIconColor};
          --headerBorder: ${theme.headerBorder};
          --headerBoxShadow: ${theme.headerBoxShadow};
          --headerProgressColor1: ${theme.headerProgressColor1};
          --headerProgressColor2: ${theme.headerProgressColor2};
          --headerTrackColor1: ${theme.headerTrackColor1};
          --headerTrackColor2: ${theme.headerTrackColor2};
          --baseProgressColor1: ${theme.baseProgressColor1};
          --baseProgressColor2: ${theme.baseProgressColor2};
          --navMenuBoxShadow: ${theme.navMenuBoxShadow};
          --navMenuBorder: ${theme.navMenuBorder};
          --baseTrackColor1: ${theme.baseTrackColor1};
          --baseTrackColor2: ${theme.baseTrackColor2};
          --progressBallGlow: ${theme.progressBallGlow};
          --pomToolTipBgColor: ${theme.pomToolTipBgColor};
          --pomToolTipTextColor: ${theme.pomToolTipTextColor};
          --modalBgColor: ${theme.modalBgColor};
          --modalBgAccentColor: ${theme.modalBgAccentColor};
          --bentoBoxBgColor: ${theme.bentoBoxBgColor};
          --bentoBoxBorder: ${theme.bentoBoxBorder};
          --bentoBoxShadow: ${theme.bentoBoxShadow};
          --muiscPlayerBgColor: ${theme.muiscPlayerBgColor};
          --musicProgressFgColor: ${theme.musicProgressFgColor};
          --headerBgColor: ${theme.headerBgColor};
          --wideLeftBarColor: ${theme.wideLeftBarColor};
          --wideLeftBarBorder: ${theme.wideLeftBarBorder};
          --wideLeftBarBoxShadow: ${theme.wideLeftBarBoxShadow};
          --wideLeftBarTabColor: ${theme.wideLeftBarTabColor};
          --wideLeftBarTabIconColor: ${theme.wideLeftBarTabIconColor};
          --sessionBlockColor: ${theme.sessionBlockColor};
          --rightBarMindNoteBgColor: ${theme.rightBarMindNoteBgColor};
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
          --sidePanelTabBgColor: ${theme.sidePanelTabBgColor};
          --sidePanelTabHighlightColor: ${theme.sidePanelTabHighlightColor};
          --rightBarBgColor: ${theme.rightBarBgColor};
          --rightBarBgBoxShadow: ${theme.rightBarBgBoxShadow};
          --tasksCheckBoxColorDefault: ${theme.tasksCheckBoxColorDefault};
          --sidePanelLightAccentColor: ${theme.sidePanelLightAccentColor};
          --tasksCheckColor: ${theme.tasksCheckColor};
          --tasksCheckBoxColorDefault: ${theme.tasksCheckBoxColorDefault};
          --tasksCheckBoxColorComplete: ${theme.tasksCheckBoxColorComplete};
          --tasksSubtaskFocusColor: ${theme.tasksSubtaskFocusColor};
          --tasksLightTextColor: ${theme.tasksLightTextColor};
          --dropdownMenuBgColor1: ${theme.dropdownMenuBgColor1};
          --dropdownMenuBgHoverColor1: ${theme.dropdownMenuBgHoverColor1};
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
