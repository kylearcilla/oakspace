import { LogoIcon } from "./enums"

/**
 * Custom click outside use directive.
 * Relevant for modals and dropdown menus / lists.
 * Has a black list of classes that prevents dispatching click outside event for special use cases.
 * 
 *  Special Cases
 *  1. Dropdown Btn - Do not close dropdown list when dropdown button is clicked, let the local handler do that
 * 
 * @param node    Node that the deritive has been binded / attached to.
 * @returns       Object that contains a function that removes click outside event listener when attachee node is unmounted from DOM.
 */
export const clickOutside = (node: any) => {
  const handleClick = (event: any) => {
    const srcClasses = event.srcElement.classList.value + " " + event.srcElement.parentElement.classList.value

    let hasBlacklistedClass = srcClasses.includes("dropdown-btn") || srcClasses.includes("dropdown-elem")
    let hasClickedInsideNode = node?.contains(event.target)

    if (!hasBlacklistedClass && !hasClickedInsideNode && !event.defaultPrevented) {
        node.dispatchEvent(new CustomEvent('click_outside', node))
    }
  }
  document.addEventListener('click', handleClick, true)

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true)
    }
  }
}

/**
 * Find an element's ancestor by name
 * @param child 
 * @param className 
 * @returns  Ancestor
 */
export const findAncestorByClass = (child: HTMLElement, className: string): HTMLElement | null => {
  let currentElement: HTMLElement | null = child
  let i = 0

  while (currentElement !== null && !currentElement.classList.contains(className) && i++ < 15) {
      currentElement = currentElement.parentElement
  }

  if (currentElement?.classList.contains(className))  {
    return currentElement
  }
  else {
    return null
  }
}

/**
 * Move an element given an idex to a new index within the same array.
 * @param array       
 * @param fromIndex   Original location of element to be moved.
 * @param toIndex     New location where element should be moved to.
 * @returns           Updated array.
 */
export const moveElementInArr = (array: any[], fromIndex: number, toIndex: number) => {
  const elementToMove = array.splice(fromIndex, 1)[0]
  array.splice(toIndex, 0, elementToMove)
  return array
}

/**
 * Remove an item from 1st array and move it to the 2nd array. 
 * Arrays must be different.
 * 
 * @param array1   Array where item should be removed from
 * @param oldIdx   Location of to-be-removed item
 * @param array2   Array whre item should be moved to
 * @param newIdx   Location where the item should be placed in
 * 
 * @returns        Updated two arrays.
 */
export function moveItemBetweenArrays<T>(array1: T[], oldIdx: number, array2: T[], newIdx: number): { newArray1: T[], newArray2: T[] } {
  const newArray1 = [...array1]
  const newArray2 = [...array2]

  const [removedItem] = newArray1.splice(oldIdx, 1)
  newArray2.splice(newIdx, 0, removedItem)

  return { newArray1, newArray2 }
}

/**
 * @returns  User's preferred language code. i.e. US is "en-US"
 */
export const getBrowserLanguagePreference = () => {
  return navigator.language
}

/**
 * Update the document title.
 * @param newTitle   New document title
 */
export const setDocumentTitle = (newTitle: string) => {
  document.title = newTitle
}

/**
 * Get HTML element by its id.
 * @param id  Id to identify elem
 */
export const getElemById = (id: string): HTMLElement | null => {
    return document.getElementById(id)
}

/**
 * Get HTML elements that share the same className
 * @param className  Elements' class name
 */
export const getElemsByClass = (className: string): Element[] | null => {
    return [...document.getElementsByClassName(className)]
}

/**
 * Get an elem css style that is a number value
 * @returns 
 */
export const getElemNumStyle = (elem: HTMLElement, style: string): number => {
  return parseFloat(getComputedStyle(elem).getPropertyValue(style))
}

/**
 * Checks if any strings in passed in array exists in string.
 * @param str   String in question.
 * @param arr   Contains substrings to be checked in stringg
 * @returns     If a substring in array exists in str.
 */
export const containsSubstring = (str: string, arr: string[]) => {
  return arr.some(s => str.includes(s))
}

/**
 * @param n   Decimal number
 * @returns   Rounded up number
 */
export const roundToNearestFive = (n: number) => Math.ceil(n / 5) * 5

/**
 * Add decimal numbers.
 * @param x   Decimal number to be added.
 * @param y   Decimal number to be added.
 * @returns   Result, will always be in 2 decimal places.
 */
export const decimalAdd = (x: number, y: number): number => {
  return parseFloat((x + y).toFixed(2))
}

/**
 *  Adds commas to numbers
 *  @return Fromatted number w/ commas
 */
export const addCommasToNum = (num: string): string => {
  const formattedNumber = Number(num).toLocaleString()
  return formattedNumber
}

/**
 *  Converts a number into a shortened representation with magnitude suffixes.
 *  @param num The number to be converted, provided as a string.
 *  @return string representing the shortened number with magnitude suffix.
 */
export const shorterNum = (num: string): string => {
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

/**
 * Gets the first highlighter btn Element in a highlighter btn component
 * @param containerId   String id for the Highlighter Btn Component
 * @returns             First highlighter btn.
 */
export const getFirstHighlighterBtn = (containerId: string) => {
  return getElemById(containerId)!.firstChild as HTMLButtonElement
}

/**
 * Get the matching LogoIcon enum that is contained in another enum.
 * 
 * i.e. Spotify exists in LogoIcon and MusicPlatform enums, get the LogoIcon enum value (LogoIcon.Spotify) instead.
 * 
 * @param enumVal    Enum val querying for that exists in fromEnum and LogoIcon.
 * @param fromEnum   Enum where the value exists.
 * @returns          The matching enum value from LopoIcon
 */
export function getLogoIconFromEnum(enumVal: any, fromEnum: any): LogoIcon {
  return findEnumIdxFromDiffEnum(enumVal, fromEnum, LogoIcon) ?? LogoIcon.Luciole
}

/**
 * Given an enum value that exists both in enumA and enumB, find the index value in enumB using the enum from enum A.
 * 
 * @param enumMember   The desired enum in query enum whose index value is desired.
 * @param originEnum   Enum where enumMember is from.
 * @param queryEnum    Enum that contains the same enum member value. 
 * @returns            The idx in query enum where the same enum member name exists. Return enumMember does not exist in both enums.
 */
export function findEnumIdxFromDiffEnum(enumMember: any, enumA: any, enumB: any) {
  for (const value in enumB) {
      if (isNaN(Number(value))) continue

      const val = enumB[value]
      const idx = value

      if (enumA[enumMember] === val) return Number(idx)
  }

  return null
}

/**
 * Add spaces to camel case string.
 * AppleMusic -> Apple Music
 * 
 * @param camelCaseStr   Camel case string
 * @returns              Stringn with spaces
 */
export const addSpacesToCamelCaseStr = (camelCaseStr: string) => {
  const words = camelCaseStr.replace(/([a-z])([A-Z])/g, '$1 $2');
  return words.charAt(0).toUpperCase() + words.slice(1);
}


/**
 *  According to the PKCE standard, a code verifier is a high-entropy cryptographic random string with a length between 43 and 128 characters (the longer the better). 
 *  It can contain letters, digits, underscores, periods, hyphens, or tildes.
 * 
 *  @param length 
 *  @returns 
 */
export function generateCodeVerifier(length: number): string {
  if (length < 43 || length > 128) { 
    throw new Error("Must be between 43 and 128 inclusive.")
  }

  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))

  return values.reduce((acc, x) => acc + possible[x % possible.length], "")
}

/**
 * Hashes a string using that SHA 256 Algorithm
 * @param plain  String to be hashed 
 * @returns      SHA 256-Hashed String
 */
export function hashSHA256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

/**
 * Returns the base64 representation of a string
 * @param input   
 * @returns 
 */
export function base64encode(input: any): string {
  return window.btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Calculates the additional heights of an element, including margin, padding, and border widths.
 * 
 * @param element - The HTMLElement to calculate additional heights for.
 * @returns The sum of margin, padding, and border widths of the element.
 */
export function getAdditionalHeights(element: HTMLElement): number {
  const styles = getComputedStyle(element);

  // Extract margin, padding, and border widths
  const marginTop = parseInt(styles.marginTop);
  const marginBottom = parseInt(styles.marginBottom);
  const paddingTop = parseInt(styles.paddingTop);
  const paddingBottom = parseInt(styles.paddingBottom);
  const borderTopWidth = parseInt(styles.borderTopWidth);
  const borderBottomWidth = parseInt(styles.borderBottomWidth);

  // Calculate the sum of additional heights
  return marginTop + marginBottom + paddingTop + paddingBottom + borderTopWidth + borderBottomWidth;
}

/**
 * Calculates the total height of an element, including its client height and additional heights (margin, padding, border).
 * 
 * @param element - The HTMLElement to calculate the total height for.
 * @returns The total height of the element, including client height and additional heights.
 */
export function getElemHeight(element: HTMLElement): number {
  const additionalHeights = getAdditionalHeights(element);
  return element.clientHeight + additionalHeights;
}

type GradientStyleOptions = {
  isVertical: boolean
  head?: {
    start?: string
    end?: string
  }
  tail?: {
    start?: string
    end?: string
  }
}

/**
 * Helper for seeing if there's space to scroll up or down.
 * @param target    Scroll Element
 * @param options   Options for how early client wants to hit the top / bottom
 * @returns         Scroll status as array
 */
export function getVertScrollStatus(target: HTMLElement, options?: { topOffSet?: number, bottomOffSet?: number }): VertScrollStatus {
  const scrollTop = target.scrollTop
  const windowHeight = target.clientHeight
  const scrollHeight = target.scrollHeight

  const hasReachedBottom = scrollTop + (options?.bottomOffSet ?? 1) >= scrollHeight - windowHeight
  const hasReachedTop = scrollTop <= (options?.topOffSet ?? 0) 

  return { hasReachedBottom, hasReachedTop, details: { scrollTop, scrollHeight, windowHeight } }
}

/**
 * Helper for seeing if there's space to scroll left or right
 * @param target    Scroll Element
 * @param options   Options for how early client wants to hit the top / bottom
 * @returns         Scroll status as array
 */
export function getHozScrollStatus(target: HTMLElement, options?: { leftOffSet?: number, rightOffSet?: number }): HozScrollStatus {
  const scrollLeft = target.scrollLeft
  const windowWidth = target.clientWidth
  const scrollWidth = target.scrollWidth

  const hasReachedEnd = scrollLeft + (options?.rightOffSet ?? 1) >= scrollWidth - windowWidth
  const hasReachedStart = scrollLeft <= (options?.leftOffSet ?? 0) 

  return { hasReachedEnd, hasReachedStart, details: { scrollLeft, scrollWidth, windowWidth } }
}

/**
 * Generates a masked gradient style on a scrollable element based on scroll status and options.
 * Return scroll state details and styling.
 * 
 * @param  elementn The HTML element to apply the style to.
 * @param  options  gradient style options.
 * @returns         Object containing the styling and horizontal scroll status.
 */
export function getMaskedGradientStyle(element: HTMLElement, options?: GradientStyleOptions): HozScrollMaskedGradient | VertScrollMaskedGradient {
  const scrollStatus = options?.isVertical 
        ? getVertScrollStatus(element) 
        : getHozScrollStatus(element)
        
  const angle = (options?.isVertical ?? true) ? "180deg" : "90deg"
  const head = {
      start: options?.head?.start ?? "0%",
      end: options?.head?.end ?? "10%"
  }
  const tail = {
      start: options?.tail?.start ?? "85%",
      end: options?.tail?.end ?? "100%"
  }

  const hasReachedEnd = 
      (scrollStatus as VertScrollStatus).hasReachedBottom ?? 
      (scrollStatus as HozScrollStatus).hasReachedEnd;

  const hasReachedStart = 
      (scrollStatus as VertScrollStatus).hasReachedTop ?? 
      (scrollStatus as HozScrollStatus).hasReachedStart;

  let gradient = ""

  if (!hasReachedEnd && !hasReachedStart) {
      gradient = `linear-gradient(${angle}, transparent ${head.start}, #000 ${head.end}, #000 ${tail.start}, transparent ${tail.end})`
  } 
  else if (!hasReachedStart) {
      gradient = `linear-gradient(${angle}, transparent ${head.start}, #000 ${head.end})`
  } 
  else {
      gradient = `linear-gradient(${angle}, #000 ${tail.start}, transparent ${tail.end})`
  }

  const styling = `mask-image: ${gradient}; -webkit-mask-image: ${gradient}`


    return options?.isVertical ? { styling, scrollStatus } as VertScrollMaskedGradient : { styling, scrollStatus } as HozScrollMaskedGradient
}

/* Colors */
export const COLOR_SWATCHES = {
  d: [
    /* Yellow */
    {
      id: "d4-0",
      primary: "255, 246, 163",
      light1: "156, 124, 63",
      light2: "240, 215, 169",
      light3: "240, 215, 169",
      dark1:  "255, 235, 196",
      dark2:  "35, 28, 23",
      dark3:  "255, 203, 100"
    },
    /* Purple */
    {
      id: "d1-0",
      primary: "120, 118, 254",
      light1: "73, 58, 117",
      light2: "172, 165, 253",
      light3: "172, 165, 253",
      dark1:  "198, 189, 225",
      dark2:  "30, 27, 49",
      dark3:  "133, 111, 194",
    },
    /* Red */
    {
      id: "d3-0",
      primary: "255, 196, 163",
      light1: "156, 96, 63",
      light2: "240, 199, 169",
      light3: "240, 199, 169",
      dark1:  "247, 214, 195",
      dark2:  "51, 35, 28",
      dark3:  "216, 113, 90",
    },
    /* Green */
    {
      id: "d5-3",
      primary: "237, 255, 163",
      light1: "93, 97, 71",
      light2: "230, 240, 169",
      light3: "230, 240, 169",
      dark1:  "208, 211, 172",
      dark2:  "53, 54, 35",
      dark3:  "223, 232, 115",
    },
    /* Blue */
    {
      id: "d6-3",
      primary: "200, 248, 248",
      light1: "59, 78, 92",
      light2: "163, 216, 2559",
      light3: "163, 216, 2559",
      dark1:  "150, 192, 201",
      dark2:  "32, 36, 45",
      dark3:  "107, 156, 213",
    },
  ],
  p: [

  ]
}

/* Tags */
export const TEST_TAGS = [
  {
    id: "",
    name: "Body",
    symbol: {
      color: COLOR_SWATCHES.d[0],
      emoji: "💪"
    }
  },
  {
    id: "",
    name: "SWE",
    symbol: {
      color: COLOR_SWATCHES.d[1],
      emoji: "👨‍💻"
    }
  },
  {
    id: "",
    name: "French",
    symbol: {
      color: COLOR_SWATCHES.d[4],
      emoji: "🇫🇷"
    }
  },
  {
    id: "",
    name: "Cooking",
    symbol: {
      color: COLOR_SWATCHES.d[2],
      emoji: "🍖"
    }
  },
  {
    id: "",
    name: "SWE",
    symbol: {
      color: COLOR_SWATCHES.d[4],
      emoji: "👨‍💻"
    }
  },
  {
    id: "",
    name: "BBall",
    symbol: {
      color: COLOR_SWATCHES.d[2],
      emoji: "🏀"
    }
  },
  {
    id: "",
    name: "Running",
    symbol: {
      color: COLOR_SWATCHES.d[2],
      emoji: "🏃‍♂️"
    }
  },
  {
    id: "",
    name: "Meditation",
    symbol: {
      color: COLOR_SWATCHES.d[3],
      emoji: "🌿"
    }
  },
  {
    id: "",
    name: "Art",
    symbol: {
      color: COLOR_SWATCHES.d[0],
      emoji: "🌁"
    }
  },
]

export function roundUpToNearestTen(num: number) {
  return Math.ceil(num / 10) * 10;
}
export function roundUpToNearestFive(num: number) {
  return Math.ceil(num / 5) * 5;
}

export function isBetween(number: number, min: number, max: number) {
  return number >= min && number <= max
}

export function randomArrayElem(arr: any[]) {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Get the pair of color properties based on the theme.
 * @param    color - The color object containing light and dark properties.
 * @param    doGetLight - Boolean value indicating whether the theme is light or dark.
 * @returns  An tuple containing a color's light or dark color trio.
 */
export function getColorTrio(color: Color, doGetLight: boolean): [string, string, string] {
  return doGetLight ? [color.light1, color.light2, color.light3] : [color.dark1, color.dark2, color.dark3];
}

export function extractNum(str: string) {
  // Use a regular expression to find all numbers in the string
  const numbers = str.match(/\d+(\.\d+)?/g);
  
  // If numbers are found, convert them to numbers and return
  if (numbers) {
      return numbers.map(Number);
  } else {
      return [];
  }
}