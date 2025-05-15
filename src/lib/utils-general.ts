import { DEFAUL_ERR_MESSAGE } from "./constants"
import type { APIError } from "./errors"
import { APIErrorCode, LogoIcon } from "./enums"
import { TEST_TAGS } from "./mock-data-tags"
import { toast } from "./utils-toast"

/**
 * Custom click outside action function.
 * @param node    Node that the action function has been binded / attached to.
 */
export const clickOutside = (node: any) => {
  const handleClick = (event: any) => {
    const target = event.target as HTMLElement
    const hasClickedInsideNode = node?.contains(target)
    
    // Check for data attributes instead of IDs
    const srcDmenuId = node.getAttribute('data-dmenu-id')
    const targetElem = target.closest('[data-dmenu-id]')
    
    let sameDropdownContext = false

    // if source is a dropdown menu
    // do not dispatch outClick event if the target elem is within the same dropdown context
    if (srcDmenuId && targetElem) {
        const targetId = targetElem.getAttribute('data-dmenu-id')
        sameDropdownContext = srcDmenuId === targetId
    }

    const hasClickedOutside = !sameDropdownContext && !hasClickedInsideNode && !event.defaultPrevented

    // has clicked outside
    if (hasClickedOutside) {
        const event = new CustomEvent('outClick', {
          ...node, detail: { target, src: node }
        })

        node.dispatchEvent(event)
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
 * @param options QueryOptions for finding ancestor element. 
 * @returns  Ancestor
 */
export const findAncestor = (options: AncestoryQueryOptions): HTMLElement | null => {
  let currentElement: HTMLElement | null = options.child
  let i = 0

  const max = options.max ?? 15
  const strict = options.strict === undefined ? false : options.strict
  const queryStr = options.queryStr
  const byId = options.queryBy ? options.queryBy === "id" : false

  while (currentElement && i++ < max) {
    if (strict && byId && currentElement!.id === queryStr) {
      return currentElement
    }
    else if (!strict && byId && currentElement!.id.includes(queryStr)) {
      return currentElement
    }
    else if (strict && !byId && currentElement!.classList.contains(queryStr)) {
      return currentElement
    }
    else if (!strict && !byId && currentElement!.classList.value.includes(queryStr)) {
      return currentElement
    }

    currentElement = currentElement.parentElement
  }
  return null
}

export function isTargetTextEditor(target: HTMLElement) {
    const isTargetContentEditable = target.contentEditable === "true"
    return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || isTargetContentEditable
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
 * Checks if any class from the given array is present in the target's classList.
 * @param target - The HTMLElement to check against.
 * @param classes - An array of class strings to check for.
 * @returns True if any class is found in the target's classList, false otherwise.
 */
export function elemHasClasses(target: HTMLElement, classes: string[]) {
  return classes.some((cls) => target.classList.contains(cls))
}

/**
 * Get HTML elements that share the same className
 * @param className  Elements' class name
 */
export const getElemByClass = (className: string): Element | null => {
    return document.querySelector("." + className)
}


/**
 * Get an elem css style that is a number value
 * @returns 
 */
export const getElemNumStyle = (elem: HTMLElement, style: string): number => {
  return parseFloat(getElemStyle(elem, style))
}

export function getElemStyle(elem: HTMLElement, style: string) {
  return getComputedStyle(elem).getPropertyValue(style)
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
  return findEnumIdxFromDiffEnum(enumVal, fromEnum, LogoIcon) ?? LogoIcon.Somara
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

type GradientStyleOptions = {
  isVertical?: boolean
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
  const isVertical = options?.isVertical ?? true
  const scrollStatus = isVertical ? getVertScrollStatus(element) : getHozScrollStatus(element)
        
  const angle = isVertical ? "180deg" : "90deg"
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
      (scrollStatus as HozScrollStatus).hasReachedStart

  let gradient = ""

  if (hasReachedEnd && hasReachedStart) {
      gradient = ""
  } 
  else if (!hasReachedEnd && !hasReachedStart) {
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

export function roundUpToNearestTen(num: number) {
  return Math.ceil(num / 10) * 10;
}
export function roundUpFive(num: number) {
  return Math.ceil(num / 5) * 5;
}

export function isBetween(number: number, min: number, max: number) {
  return number >= min && number <= max
}

export function randomArrayElem(arr: any[]) {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function addItemToArray(idx: number, array: any[], item: any) {
  array.splice(idx, 0, item)

  return array
}

export function removeItemFromArray(idx: number, array: any[]) {
  array.splice(idx, 1)

  return array
}

export function capitalizeString(str: string) {
  return str.split('').map((ch) => ch.toUpperCase()).join('')
}

export function extractNum(str: string) {
  // Use a regular expression to find all numbers in the string
  const numbers = str.match(/\d+(\.\d+)?/g);
  
  // If numbers are found, convert them to numbers and return
  if (numbers) {
      return numbers.map(Number);
  } else {
      return []
  }
}

export function isCharNumber(ch: string) {
  return ch >= '0' && ch <= '9';
}

export function extractNumStr(str: string) {
  const nums: string[] = []
  for (let ch of str) {
    if (isCharNumber(ch)) {
      nums.push(ch)
    }
  }
  return nums
}

/**
 * @param    camelCaseString 
 * @returns   Kebab cases version of camelcase
 */
export function camelToKebab(camelCaseString: string) {
  return camelCaseString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function kebabToNormal(str: string, capitalizeAll = false): string {
  const specialWords = new Set(["is", "or", "and", "of"])
  
  return str
    .split('-')
    .map((w, i) => capitalizeAll || i === 0 || !specialWords.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ')
}

export function normalToKebab(str: string): string {
    return str
        .split(' ')
        .map(word => word.toLowerCase())
        .join('-');  
}

export function inlineStyling(styling?: StylingOptions) {
    if (!styling) return ""
    let cssString = ''

    for (let [prop, value] of Object.entries(styling)) {
      if (!value) return
      prop = camelToKebab(prop)
      cssString += `${prop}: ${value}; `
    
    }
    return cssString.trim()
}

export function showElement(element: HTMLElement) {
    element.style.opacity = "1"
    element.style.visibility = "visible"
}


export function getDistBetweenTwoPoints(pointA: OffsetPoint, pointB: OffsetPoint) {
  const deltaX = pointB.left - pointA.left
  const deltaY = pointB.top - pointA.top
  
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
}

export function isKeyAlphaNumeric(event: KeyboardEvent) {
  return isAlphaNumeric(event.key) && !event.ctrlKey && !event.metaKey
}

export function isAlphaNumeric(char: string) {
    const alphaNumericRegex = /^[0-9a-zA-Z]$/
    
    return alphaNumericRegex.test(char)
}

export function isEditTextElem(elem: HTMLElement) {
  const className = elem.classList[0]

  return elem.tagName === "INPUT" || 
         elem.tagName === "TEXTAREA" || 
         elem.contentEditable === "true"
}

export function getContentEditableSelectionRange(element: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return { start: 0, end: 0 }

  
  const range = selection.getRangeAt(0)
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(element)
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  
  const start = preCaretRange.toString().length
  const end = start + range.toString().length

  return { start, end }
}

export function isInRange(min: number, num: number, max: number) {
  return min <= num && num <= max
}

export function setCursorPos(element: HTMLElement, pos: number) {
  const selection = window.getSelection()
  const range = document.createRange()

  if (!selection || !element.firstChild) return

  if (pos > element.textContent!.length) {
      pos = element.textContent!.length
  }

  range.setStart(element.firstChild, pos)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

export function clamp(min: number, value: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

type SpaceElem = {
  elem: HTMLElement
  edge?: "top" | "bottom" | "left" | "right"
}

export function getVertSpace({ top, bottom, absolute = true }: { top: SpaceElem, bottom: SpaceElem, absolute?: boolean }) {
  const topRect  = top.elem.getBoundingClientRect()
  const bottomRect = bottom.elem.getBoundingClientRect()

  top.edge  = top.edge ?? "bottom"
  bottom.edge = bottom.edge ?? "top"

  const topEdge  = top.edge === "bottom" ? topRect.y + topRect.height : topRect.y
  const bottomEdge = bottom.edge === "bottom" ? bottomRect.y + bottomRect.height : bottomRect.y

  if (absolute) {
    return Math.abs(bottomEdge - topEdge)
  }
  else {
    return bottomEdge - topEdge
  }
}

export function getHozSpace({ left, right, absolute = true }: { left: SpaceElem, right: SpaceElem, absolute?: boolean }) {
  const leftRect  = left.elem.getBoundingClientRect()
  const rightRect = right.elem.getBoundingClientRect()

  left.edge  = left.edge ?? "right"
  right.edge = right.edge ?? "left"

  const leftEdge  = left.edge === "right" ? leftRect.right : leftRect.left
  const rightEdge = right.edge === "right" ? rightRect.right : rightRect.left

  if (absolute) { 
    return Math.abs(rightEdge - leftEdge)
  }
  else {
    return rightEdge - leftEdge
  }
}

/**
 * Extracts CSS values that can have 4 space-separated values in one line.
 * 
 * i.e.: "0px 2px" || "2px" || "2px 2px 2px 2px" || "1px 1px 1px"
 * 
 * @param   val CSS space-separated value
 * @returns Extracted, top, right, bottom, left values
 */
export function extractQuadCSSValue(val: CSSMultiDimPxVal | undefined) {
  const res = { top: 0, right: 0, bottom: 0, left: 0 }
  if (!val) return res

  const values = val.split(" ").map(value => parseInt(value))
  const [top, right = top, bottom = top, left = right] = values

  return { ...res, top, right, bottom, left }
}

/**
 * Ensures that a floating element inside a parent conatiner always fit inside the parent.
 * Context menu or an element being dragged and dropped.
 * 
 * @param dims          - Float element width and height (does not have to be compeletely accurate)
 * @param cursorPos     - Current cursor position (relative to the parent) where menu was invoked. 
 * 
 * @param containerDims - Height and width dimensions of the container element.
 *                        This container is the menu will be position relatively of.
 *                        This is the scrollable element / window (not the overflow element.)
 * 
 * @param clientOffset  - Drag touch point position within the floating element.
 * 
 * @returns Left and top offset where the menu should end postioned.
 */
export function initFloatElemPos(context: {
  dims: BoxSize 
  cursorPos: OffsetPoint 
  containerDims: BoxSize 
  clientOffset?: OffsetPoint
  margins?: { ns: number, ew: number }
}) {
  
  const { 
    dims, 
    cursorPos, 
    containerDims, 
    clientOffset, 
    margins = { ns: 0, ew: 0 }
  } = context

  const { width: menuWidth, height: menuHeight } = dims
  const { width: containerWidth, height: containerHeight } = containerDims

  const clientOffsetLeft = clientOffset?.left ?? 0
  const clientOffsetTop = clientOffset?.top ?? 0 

  let left = cursorPos.left - clientOffsetLeft
  let top = cursorPos.top - clientOffsetTop

  const marginOffset = {
    left:   margins.ew,
    top:    margins.ns,
    bottom: margins.ns,
    right:  margins.ew
  }
  const containerEdges = {
    top:    marginOffset.top,
    left:   marginOffset.left,
    right:  containerWidth - marginOffset.right,
    bottom: containerHeight  - marginOffset.bottom
  }
  const elemPos = {
    right:  menuWidth + left,
    bottom: menuHeight + top,
    top,
    left
  }

  if (elemPos.left < containerEdges.left) {
      left = containerEdges.left
  }
  if (elemPos.top < containerEdges.top) {
      top = containerEdges.top
  }
  if (elemPos.right >= containerEdges.right) {
      const xOffset = elemPos.right - containerEdges.right
      left -= xOffset
  }
  if (elemPos.bottom >= containerEdges.bottom) {
      const yOffset = elemPos.bottom - containerEdges.bottom
      top -= yOffset
  }

  left = Math.max(left, 0)
  top = Math.max(top, 0)

  return { left, top }
}

/**
 * Check if cursor is near a border and should scroll towards the moving block. if there's space left.
 * 
 * @param containerElem       - The container of the floating item
 * @param cursorPosFromWindow - Positioning of the cursor inside the scroll window / container element
 * 
 * @returns  Direction the scroll should be to. Null if a scroll is not needed
 */
export function shouldScroll(containerElem: HTMLElement, cursorPosFromWindow: OffsetPoint) {
  const { 
      scrollTop, 
      scrollLeft, 
      scrollHeight, 
      scrollWidth,
      clientHeight: windowHeight, 
      clientWidth: windowWidth
  } = containerElem!

  const windowTopOffset   = cursorPosFromWindow.top
  const windowLeftOffset  = cursorPosFromWindow.left

  const hasReachedBottom   = scrollTop >= scrollHeight - windowHeight
  const hasReachedRightEnd = scrollLeft >= scrollWidth - windowWidth

  const canScrollHoz  = scrollWidth > windowWidth
  const canScrollVert = scrollHeight > windowHeight

  if (windowTopOffset < 10 && scrollTop != 0 && canScrollVert) {
      return "up"
  }
  else if (windowHeight - windowTopOffset < 20 && !hasReachedBottom && canScrollVert) {
      return "down"
  }
  else if (windowLeftOffset < 10 && scrollLeft != 0 && canScrollHoz) {
      return "left"
  }
  else if (windowWidth - windowLeftOffset < 20 && !hasReachedRightEnd && canScrollHoz) {
      return "right"
  }
  else {
      return null
  }
} 

export function capitalize(str: string) {
  if (str.length === 0) return str

  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Used to prevent scroll from tab indexing which would force scroll on overflow hidden elements.
 * @param e 
 */
export function preventScroll(e: Event) {
  const target = e.target as HTMLElement
  
  target.scrollTop = 0
  target.scrollLeft = 0
}

/**
 * Simple formats a string to its plural form based on the given count.
 * i.e.  "3 Videos"
 * 
 * @param str 
 * @param count 
 * @returns 
 */
export function formatPlural(str: string, count: number) {
  const noun = count === 1 ? str : `${str}s`

  return `${count} ${noun}`
}

export function containsHtmlTags(str: string) {
  const regex = /<\/?[^>]+(>|$)/;
  return regex.test(str)
}

export function looseEqualTo(x: number, y: number, diff = 5) {
  return Math.abs(x - y) <= diff
}

/**
 * Fetch api wrapper than handles errors and returns response / error.
 * @param url      - The url to fetch.
 * @param options  - Request options.
 * @returns        - Response and error (if any)
 */
export async function _fetch(url: string, options: RequestInit): 
    Promise<{ response: any, error?: { code: number, message?: string } | null }> 
{
    try {
        const res = await fetch(url, options)

        if (!res.ok) {
            console.error(res)
            await serverError(res)
            return { response: null, error: { code: res.status } }
        }

        const data = await res.json()
        return { response: data }
    } 
    catch (error) {
        console.error('Request error:', error)
        toast("error", { message: DEFAUL_ERR_MESSAGE })

        return { response: null, error: { code: 0 } }
    }
}

export async function serverError(res: Response) {
  const status = res.status
  const data = await res.json()
  console.error(`Error ${status}:`, res.statusText)

  toast("error", { message: DEFAUL_ERR_MESSAGE })
}

/**
 * Error handler for working with APIs
 * @param options 
 */
export function toastApiErrorHandler(options: {
  error: APIError, 
  title: string,
  logoIcon: LogoIcon,
  contextId?: string
  action?: { 
    label: string, onClick: (event: MouseEvent) => void 
  }
}) {
  let { error, title, logoIcon, action, contextId } = options
  let toastOptions: ToastInitOptions

  const isNotAPIError = error.code === undefined
  const errorMessage  = isNotAPIError ? "" : error.message
  const hasMsg        = errorMessage != undefined && errorMessage

  if (error.code === APIErrorCode.PLAYER) {
      toastOptions = {
          message: hasMsg ? errorMessage : "Player error. Try again later.",
      }
  }
  else if (error.code === APIErrorCode.AUTHORIZATION_ERROR) {
      toastOptions = {
          message: hasMsg ? errorMessage : `Authorization failed. Please try again.`,
      }
  }
  else if (error.code === APIErrorCode.RESOURCE_NOT_FOUND) {
      toastOptions = {
          message: hasMsg ? errorMessage : `Request resource not found.`,
      }
  }
  else if (error.code === APIErrorCode.EXPIRED_TOKEN) {
      toastOptions = {
          message: hasMsg ? errorMessage : `Token has expired. Refresh token or login in again to continue.`,
      }
  }
  else if (error.code === APIErrorCode.REFRESH_TOKEN) {
      toastOptions = {
          message: hasMsg ? errorMessage : "Token has expired. Try re-logging in.",
      }
  }
  else if (error.code === APIErrorCode.RATE_LIMIT_HIT) {
      toastOptions = {
          message: hasMsg ? errorMessage : "Rate limit exceeded. Try again later.",
      }
  }
  else if (error.code === APIErrorCode.AUTH_DENIED) {
      toastOptions = {
          message: hasMsg ? errorMessage : "Authorization denied.",
      }
  }
  else if (error.code === APIErrorCode.API_ERROR) {
      toastOptions = {
          message: hasMsg ? errorMessage : `Error occured with ${title}. Try again later`,
      }
  }
  else {
      toastOptions = {
          message: hasMsg ? errorMessage : "An error has occured. Try again later."
      }
  }
  toastOptions.action = action

  toast("default", {
      message: title,
      description: toastOptions.message,
      icon: logoIcon,
      action: toastOptions.action,
      contextId: "google-calendar",
      ...(contextId && { groupExclusive: true })
  })
}

export function getAttrValue(elem: HTMLElement, attr: string) {
  return elem.getAttribute(attr)
}

export function getCheerEmoji() {
  return randomArrayElem(["👏", "🎉", "💪", "🙌", "🎈", "🎯"])
}

/**
 * Compares two floating-point numbers after rounding them to a specified number of decimal places.
 *
 * @param arg  s - The arguments for the comparison.
 * @param args.x - The first floating-point number to compare.
 * @param args.y - The second floating-point number to compare.
 * @param args.digits - The number of decimal places to round the numbers to before comparing.
 * @param args.op - The comparison operator: "<" | ">" | "≥" | "≤" | "="
 * 
 * @returns Boolean result of the comparison after rounding to the specified decimal places.
 */
export function floatCompare(args: { x: number, y: number, digits?: number, op: ">" | "<" | "≥" | "≤" | "=" }) {
  const { x, y, op, digits = 5 } = args;
  const factor = Math.pow(10, digits);

  const roundedX = Math.round(x * factor);
  const roundedY = Math.round(y * factor);

  switch (op) {
      case ">":
          return roundedX > roundedY;
      case "<":
          return roundedX < roundedY;
      case "≥":
          return roundedX >= roundedY;
      case "≤":
          return roundedX <= roundedY;
      case "=":
          return roundedX === roundedY;
      default:
          throw new Error(`Invalid comparison operator: ${op}`)
  }
}
export function getTagFromName(name: string) {
  return TEST_TAGS.find(tag => tag.name === name)
}

export function getTagFromId(id: string) {
  return TEST_TAGS.find(tag => tag.id === id)
}

export function isValidUrl(string: string) {
  try {
    new URL(string)
    return true
  } 
  catch (e) {
      return false
  }
}

export function getElemPadding(elem: HTMLElement | null) {
  if (!elem) return { top: 0, bottom: 0, left: 0, right: 0 }

  const styles = window.getComputedStyle(elem)
  const parsePixelValue = (value: string) => parseFloat(value) || 0

  const top = parsePixelValue(styles.paddingTop)
  const bottom = parsePixelValue(styles.paddingBottom)
  const left = parsePixelValue(styles.paddingLeft)
  const right = parsePixelValue(styles.paddingRight)

  return { top, bottom, right, left }
}

export function findElemVertSpace(target: HTMLElement | null) {
  if (!target) return 0

  const styles = window.getComputedStyle(target)
  const parsePixelValue = (value: string) => parseFloat(value) || 0

  const marginTop = parsePixelValue(styles.marginTop)
  const marginBottom = parsePixelValue(styles.marginBottom)
  const paddingTop = parsePixelValue(styles.paddingTop)
  const paddingBottom = parsePixelValue(styles.paddingBottom)
  const borderTopWidth = parsePixelValue(styles.borderTopWidth)
  const borderBottomWidth = parsePixelValue(styles.borderBottomWidth)
  const height = target.clientHeight

  return height + marginTop + marginBottom + paddingTop + paddingBottom + borderTopWidth + borderBottomWidth
}

export function getFontFromStyle(style: string) {
  if (style === "stylish") {
      return { 
        scaleFactor: 0.98, 
        fam: "Zodiak-Bold" 
      }
  }
  else if (style === "fancy") {
      return { 
        scaleFactor: 1.06, 
        fam: "Melodrama-Bold" 
      }
  }
  else if (style === "cute") {
      return { 
        scaleFactor: 1.05, 
        fam: "Bagel Fat One" 
      }
  }
  else if (style === "mono") {
      return { 
        scaleFactor: 1, 
        fam: "Geist Mono" 
      }
  }
  else {
      return { 
        scaleFactor: 1, 
        fam: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
      }
  }
}

/**
 * Inserts an item into an array at a specified index.
 * Updates the index of all items that had a higher index.
 * Updates in place and returns the new array.
 * 
 * @param array - The array to insert the item into.
 * @param item - The item to insert into the array.
 * @param atIdx - The index to insert the item at.
 * @returns The new array with the item inserted.
 */
export function insertItemArr<T extends { idx: number }>({ 
    array, 
    item, 
    atIdx 
}: { array: T[], item: T, atIdx?: number }): T[] {
  atIdx ??= item.idx
  const newArray = [...array, item]
  
  for (let i = 0; i < newArray.length; i++) {
    if (newArray[i].idx >= atIdx && newArray[i] !== item) {
      newArray[i].idx += 1
    }
  }
  
  return newArray
}

export function removeItemArr<T extends { idx: number }>({
  array,
  itemIdx
}: { array: T[], itemIdx: number }): T[] {
  const itemIndex = array.findIndex(item => item.idx === itemIdx)
  array.splice(itemIndex, 1)
  
  // Update indices for all items that had a higher index
  array.forEach(item => {
    if (item.idx > itemIdx) {
      item.idx -= 1
    }
  })
  
  return array
}

/**
 * Reorders an item in an array by swapping its position with the target position.
 * Updates the new index of the the source item.
 * Updates in place and returns the new array.
 * 
 * @param array - The array to reorder.
 * @param srcIdx - The index of the source item.
 * @param targetIdx - The index of the target item where the source item will be above at.
 * @returns The new array with the item reordered.
 */
export function reorderItemArr<T extends { idx: number }>({ 
  array, 
  srcIdx, 
  targetIdx 
}: { array: T[], srcIdx: number, targetIdx: number }): T[] {
  const newArray = [...array]
  const direction = srcIdx < targetIdx ? "down" : "up"

  if (direction === "up") {
    for (let i = 0; i < newArray.length; i++) {
      if (newArray[i].idx >= targetIdx && newArray[i].idx < srcIdx) {
        newArray[i].idx += 1
      } 
      else if (newArray[i].idx === srcIdx) {
        newArray[i].idx = targetIdx
      }
    }
  } 
  else {
    const toIdx = targetIdx - 1
    
    for (let i = 0; i < newArray.length; i++) {
      if (newArray[i].idx > srcIdx && newArray[i].idx < targetIdx) {
        newArray[i].idx -= 1
      } 
      else if (newArray[i].idx === srcIdx) {
        newArray[i].idx = toIdx
      }
    }
  }

  return newArray
}

export function decrementIdx(idx: number, length: number) {
  if (idx === 0 && length > 0) {
    return idx
  }
  else {
    return Math.max(idx - 1, -1)
  }
}

export function findTag(name: string) {
  return TEST_TAGS.find(tag => tag.name === name) ?? null
}

export function isVoid(value: any) {
  return value === null || value === undefined 
}

export function formatNumber(num: number) {
  return num.toLocaleString("en-US")
}