import { defaultThemes } from "./data-themes"
import { colorThemeState } from "./store"

export function clickOutside(node: any) {
    // if user clicks on any element that has has 'dropdown', do not dispatch event to close it, let the local btn close
    // if dispatched, local bool will be toggled to true from dispatch, after toggled to false from btn
    const handleClick = (event: any)  => {
        // check for black-list elements, assumes they are placed first in the class list
        const srcElement = event.srcElement
        const flag = srcElement.classList.value.includes("dropdown")|| srcElement.parentElement.classList.value.includes("dropdown")

        if (!flag && node && !node.contains(event.target) && !event.defaultPrevented) {
            node.dispatchEvent(
                new CustomEvent('click_outside', node)
            )
        }
    }
    document.addEventListener('click', handleClick, true)

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true)
      }
    }
}

export const loadTheme = () => {
  let storedThemeData = localStorage.getItem("theme")
  
  if (!storedThemeData) {
    localStorage.setItem("theme", JSON.stringify(defaultThemes[0]))
    storedThemeData = localStorage.getItem("theme")
  } 

  const themeItem = JSON.parse(storedThemeData!)
  colorThemeState.set({
    title: themeItem!.title,
    isDarkTheme: themeItem!.properties.isDark,
    themeToggleBtnIconColor: themeItem!.properties.iconToggleBtnBgColor,
    sectionTitle: themeItem!.sectionDetails.title,
    twinTheme: themeItem!.twinTheme,
    headerTimeColor: themeItem!.headerTimeColor
  })
  setRootColors(themeItem!.properties)
}

/**
 * Sets selected theme colors to the root element of the document
 * Allows for global access of colors throughout the app
 * 
 * @param theme theme object to be currently used
 */
export const setRootColors = (theme: ThemeData) => {
  const headTag = document.getElementsByTagName('head')[0];
  const styleTag = document.createElement("style");

  console.log(theme)

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
        --midPanelAccentColor: ${theme.midPanelAccentColor};
        --midPanelAccentAltColor: ${theme.midPanelAccentAltColor};
        --midPanelAccentTextColor: ${theme.midPanelAccentTextColor};
        --sidePanelBorder: ${theme.sidePanelBorder};
        --sidePanelShadow: ${theme.sidePanelShadow};
        --dropdownMenuBgColor: ${theme.dropdownMenuBgColor};
        --prodMenuViewShadow: ${theme.prodMenuViewShadow};
    }
  `

  headTag.appendChild(styleTag)
  // for (let [prop, color] of Object.entries(theme)) {
  //     if (typeof color === "boolean") continue

  //     // @ts-ignore
  //     const root = document.querySelector(': ${theme.primaryBgColor};
  //     // @ts-ignore
  //     root.style.setProperty(`--${prop}`, color);
  // }
};

/**
 * @return the current time as a string in the format "hh:mm AM/PM" for the user's local time
 */
export function getCurrentTime(doUserHour12: boolean = true): string {
  const now = new Date()
  let res = now.toLocaleTimeString(undefined, { hour12: doUserHour12, hour: 'numeric', minute: 'numeric' })
  if (res.startsWith('0')) return res.slice(1)

  return res
}

export  function isNightTime() {
    const now = new Date();
    const currentHour = now.getHours();
  
    return currentHour >= 18 || currentHour <= 5;
}

/**
 * @return the current time as a string in the format "Ddd, Mmm, D" for the user's local time
 */
export function getCurrentDate(): string {
  const now = new Date()
  
  return now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 *  Formats date to Mmm DD, YYYY 
 *  i.e. 2017-11-10T11:46:23Z to Nov 11, 2016
 *  
 *  @return the formatted date
 * 
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const options: any = { year: 'numeric', month: 'short', day: 'numeric' }
  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date)

  return formattedDate
}

/**
 *  Formats date to MM/DD 
 *  @return the formatted date
 * 
 */
export function formatDateToMMDD(date: Date): string {
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
}

export function minsToHHMM(mins: number): string {
  if (mins < 60) return `${mins} mins`

  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;

  return `${hours} ${hours > 1 ? "hrs" : "hr" } ${String(minutes).padStart(2, '0')} mins`;
}

/* 4.65 - 4h:39m */
export function hoursToHhMm(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  const formattedMinutes = String(minutes).padStart(2, '0');

  if (hours === 0) {
    return `${formattedMinutes}m`
  }
  else if (minutes == 0) {
    return `${hours}h`
  }
  else {
    return `${hours}h ${formattedMinutes}m`;
  }
}

export function decimalAdd(x: number, y: number): number {
  return parseFloat((x + y).toFixed(2))
}

export function formatDateToHHMM(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 || 12
  const formattedMinutes = String(minutes).padStart(2, '0')
  return `${formattedHours}:${formattedMinutes} ${ampm}`
}

/**
 *  Adds commas to numbers
 *  
 *  @return Fromatted number w/ commas
 * 
 */
export function addCommasToNum(num: string): string {
  const formattedNumber = Number(num).toLocaleString()
  return formattedNumber
}
/**
 *  Converts a number into a shortened representation with magnitude suffixes.
 *  
 *  @param num The number to be converted, provided as a string.
 *  @return string representing the shortened number with magnitude suffix.
 * 
 */
export function shorterNum(num: string): string {
  const val = Number(num)
  if (val < 1000) {
    return val.toString()
  } else if (val < 1000000) {
    return parseFloat((val / 1000).toFixed(2)).toString() + "K"
  } else if (val < 1000000000) {
    return parseFloat((val / 1000000).toFixed(2)).toString() + "M"
  } else {
    return parseFloat((val / 1000000000).toFixed(2)).toString() + "B"
  }
}

export const formatTime = (milliseconds: number) => {
  let seconds = Math.floor(milliseconds / 1000)
  let hours = Math.floor(seconds / 3600)
  seconds = seconds % 3600
  let minutes = Math.floor(seconds / 60)
  seconds = seconds % 60

  let result = ""
  if (hours > 0) {
    result += hours + "h "
  }
  if (minutes > 0 || hours > 0) {
    result += minutes + "m "
  }
  return result.trim()
}

const getWeekNumber = (currentDate: Date) => {
  const startDate = new Date(currentDate.getFullYear(), 0, 1) // starting point of counting weeks
  const days = Math.floor(((currentDate as any) - (startDate as any)) / (24 * 60 * 60 * 1000)) // count difference in days (ms to days)
  
  const weekNumber = Math.ceil(days / 7) // days / 7
  return weekNumber
}

const getCurrentWeek = () => {
  const currentDate = new Date();
  const firstDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));
  const lastDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7));

  return `${firstDayOfWeek.getMonth() + 1}/${firstDayOfWeek.getDate()} - ${lastDayOfWeek.getMonth() + 1}/${lastDayOfWeek.getDate()}`;
}