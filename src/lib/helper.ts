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

  const themeItem: Theme = JSON.parse(storedThemeData!)
  colorThemeState.set({
    title: themeItem!.title,
    isDarkTheme: themeItem!.properties.isDark,
    themeToggleBtnIconColor: themeItem!.properties.iconToggleBtnBgColor,
    hasTwin: themeItem!.properties.hasTwin,
    sectionTitle: themeItem!.sectionDetails.title,
    isMultiColor: themeItem!.properties.isMultiColor,
    isHeaderElementTextLight: themeItem!.properties.isHeaderElementTextLight,
    twinTheme: themeItem!.twinTheme
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
  for (let [prop, color] of Object.entries(theme)) {
      if (typeof color === "boolean") continue
      document.documentElement.style.setProperty(`--${prop}`, color);
  }
};

/**
 * @return the current time as a string in the format "hh:mm AM/PM" for the user's local time
 */
export function getCurrentTime(doUserHour12: boolean): string {
  const now = new Date()

    return now.toLocaleTimeString(undefined, { hour12: doUserHour12, hour: 'numeric', minute: 'numeric' })
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