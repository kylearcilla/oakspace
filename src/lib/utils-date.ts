import { HrsMinsFormatOption } from "./enums"
import { getBrowserLanguagePreference } from "./utils-general"

export const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
export const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

export const TOTAL_DAY_MINS = 1440

export const getDayOfWeek = () => {
    const today = new Date()
    return `${daysOfWeek[today.getDay()]}`
}

/**
 * Get total nunber of secs from MM:SS time.
 * @param mins   Minutes
 * @param secs   Seconds
 * @returns      Total seconds
 */
export const minsSecondsToSecs = (mins: number, secs: number): number => {
    return mins * 60 + secs
}

export function prefer12HourFormat() {
    const hourCycle = getUserHourCycle()
    return hourCycle === "h12" || hourCycle === "h11"
}

/**
 * Get the hour cylce based on the user's browser settings.
 * @returns  Hour cycle
 */
export const getUserHourCycle = (): "h11" | "h12" | "h23" | "h24" => {
    const lang = getBrowserLanguagePreference()
    const localObj = new Intl.Locale(lang)

    // @ts-ignore
    return localObj.hourCycle ?? localObj.hourCycles[0]
}

/**
 * @param date1 
 * @param date2 
 * @param inclusve  If same day then valid
 * @returns         If date1 is earlier than date2.
 */
export const isDateEarlier = (date1: Date, date2: Date, inclusive = false): boolean => {
    const day1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
    const day2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())

    if (inclusive) {
        return day1.getTime() <= day2.getTime()
    } else {
        return day1.getTime() < day2.getTime()
    }
}

/**
 * @param date1 
 * @param date2 
 * @returns       Difference beyween two dates in seconds.
 */
export const getDifferenceInSecs = (date1: Date, date2: Date): number => {
    const differenceMilliseconds = Math.abs(date1.getTime() - date2.getTime())
    return Math.ceil(differenceMilliseconds / 1000)
}

/**
 * 
 * @param startTime 
 * @param totalMins  Time to be added to start time.
 * @returns          Startime + total Minutes
 */
export const calculateEndTime = (startTime: Date, totalMins: number): Date => {
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + totalMins)

    return endTime
}

/**
 * 
 * @param startTime 
 * @param endTime 
 * @returns          Start time to end time. i.e. 12: 00PM - 3:00 AM
 */
export const getTimePeriodString = (startTime: Date, endTime: Date): string => {
    return `${formatTimeToHHMM(startTime)} - ${formatTimeToHHMM(endTime)}`
}

/**
 * @param doUserHour12 
 * @returns Current time as a string in the desired format (i.e. 1:22 PM / 13:22)
 */
export function getCurrentTime(doUserHour12: boolean = true): string {
    const now = new Date()
    let res = now.toLocaleTimeString(undefined, { hour12: doUserHour12, hour: 'numeric', minute: 'numeric' })
    if (res.startsWith('0')) return res.slice(1)
  
    return res
}

/**
 * @returns Current date in the format "Ddd, Mmm, D" (i.e. Thu, Sep 14) 
 */
export function getCurrentDate(): string {
    const now = new Date()

    return now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 * See if 2 dates are the same day
 * @param d1 
 * @param d2 
 * @returns 
 */
export function isSameDay(d1: Date | null, d2: Date | null) {
    if (!d1 || !d2) return false
    return d1.getDate() === d2.getDate() && isSameMonth(d1, d2)
}

/**
 * See if currently evening 6PM - 5AM (Evening)
 * @returns 
 */
export function isNightTime() {
    const now = new Date();
    const currentHour = now.getHours()

    return currentHour <= 5 || currentHour >= 18
}

type WeekMonthFormat = "long" | "short" | "narrow" | undefined
type YearFormat = "numeric" | "2-digit" | undefined
type DayFormat = "numeric" | "2-digit" | undefined

/**
 * Formats date to string representation. Format depends on the options passed in and geo-location.
 * @param date 
 * @returns Formatted Time (i.e. Apr 14, 2020)
 */
export function formatDatetoStr(date: Date, options: {
    weekday?: WeekMonthFormat, year?: YearFormat, month?: WeekMonthFormat, day?: DayFormat 
}): string {

    return  new Intl.DateTimeFormat(getBrowserLanguagePreference(), options).format(date)
}

/**
 * Formats date to MM/DD/YY
 * @param date 
 * @returns  Formatted Time (i.e. Jan 12, 2024)
 */
export function formatDateLong(date: Date) {
    return formatDatetoStr(date, { year: "numeric", month: "short", day: "numeric" })
}

/**
 * Formats date to MM/DD
 * @param date 
 * @returns  Formatted Time (i.e. 9/6)
 */
export function formatDateShort(date: Date): string {
    return date.toLocaleDateString(getBrowserLanguagePreference(), { month: '2-digit', day: '2-digit' })
}

/**
 * Formats time HH:MM AM/PM
 * @param date 
 * @returns Fromatted Time (i.e. 1:15 PM)
 */
export function formatTimeToHHMM(date: Date, doUsehour12: boolean | null = null): string {
    let _doUserHour12 = doUsehour12

    if (_doUserHour12 === null) {
        const hourCycle = getUserHourCycle()
        _doUserHour12 = hourCycle === "h12" || hourCycle === "h11"
    }

    const options = { hour: 'numeric', minute: 'numeric', hour12: _doUserHour12 }    

    // @ts-ignore
    return date.toLocaleTimeString(undefined, options)
}

/**
 * Get the elapsed time for the finish pom period in HH:MM format.
 * The start / end times in HH:MM format will determine difference in minutes.
 * So 12:34:49 PM and 12:34:00 PM will be 1 min.
 * 
 * @param start   Session start.
 * @param end     Session end.
 */
export const getPomPeriodElapsedTime = (start: Date, end: Date) => {
    const timePeriodString = getTimePeriodString(start, end)
    const diffSecs = getDifferenceInSecs(start, end)
    const diffStr = secsToHHMM(diffSecs)

    if (!diffStr.includes("m")) return diffStr

    // do no include h portion if less than 1h
    const hrStr = diffStr.includes("h") ? diffStr.split(" ")[0] + " " : ""
    const strArr = timePeriodString.split(" - ")

    const startMins = Number(strArr[0].split(":")[1].slice(0, 2))
    const endMins = Number(strArr[1].split(":")[1].slice(0, 2))

    let diffMins = 0

    if (startMins <= endMins) {
        diffMins = endMins - startMins
    }
    else {
        diffMins = 60 - startMins + endMins
    }

    if (hrStr === "" && diffMins === 0) {
        return "<1m"
    }
    else {
        return `${hrStr}${diffMins}m`
    }
}

/**
 * Formats whole number hour (in 24-hour format) to HH AM/PM
 * @param time   hrs (i.e. 18)
 * @returns      Formatted Time (i.e. 6 PM)
 */
export function twentyFourToTwelveHrFormat(time: number): string {
    if (time < 0 || time > 24) throw new Error("Invalid time, out of range.")

    if (time >= 12 && time < 24) {
        return (time % 12 || 12) + " PM"
    }

    return (time === 0 || time == 24) ? "12 AM" : time + " AM"
}

/**
 * Formats secs to HH:MM
 * @param secs 
 * @param formatOption  Different formatting options: X hrs, X mins || Xh Xm || HH:MM 
 * @returns             Formatted # of secs to HH MM (i.e. 2 hrs 34 mins)
 */
export function secsToHHMM(secs: number, formatOption: HhMmFormat = "min-letters"): string {
    return minsToHHMM(Math.floor(secs / 60), formatOption)
}

/**
 * Formats mins to HH:MM
 * @param   mins 
 * @param   formatOption  Different formatting options: Xhrs, Xmins || Xh Xm || HH:MM 
 * @returns Formatted # of minutes to HH MM (i.e. 2 hrs 34 mins)
 */
export function minsToHHMM(inputMins: number, formatOption: HhMmFormat = "min-letters"): string {
    const mins = Math.ceil(inputMins)

    if (mins < 60 && formatOption === "mid-letters") {
        return mins === 0 ? "0h" : `${mins} mins`
    }
    else if (mins < 60 && formatOption === "min-letters") {
        return mins === 0 ? "0h" : `${mins}m`
    }
    else if (mins < 60 && formatOption === "numbers") {
        return `00:${String(mins).padStart(2, '0')}`
    }

    const hours = Math.floor(mins / 60)
    const minutes = mins % 60

    let hrsStr, minsStr

    if (formatOption === "mid-letters") {
        hrsStr = `${hours} ${hours > 1 ? "hrs" : "hr" }`
        minsStr = minutes === 0 ? "" : ` ${String(minutes).padStart(2, '0')} mins`

        return `${hrsStr}${minsStr}`
    }
    else if (formatOption === "min-letters") {
        hrsStr = `${hours}h`
        minsStr = minutes === 0 ? "" : ` ${String(minutes).padStart(2, '0')}m`

        return `${hrsStr}${minsStr}`
    }
    else {
        hrsStr = `${String(hours).padStart(2, '0')}`
        minsStr = `${String(minutes).padStart(2, '0')}`

        return `${hrsStr}"${minsStr}`
    }
}
  
/**
 * Formats deicmal hours to HH:MM
 * @param mins 
 * @returns Formatted # of minutes to HH MM (i.e. 2 hrs 34 mins)
 */
export function hoursToHhMm(decimalHours: number): string {
    const hours = Math.floor(decimalHours);
    const minutes = Math.ceil((decimalHours - hours) * 60);

    const formattedMinutes = String(minutes).padStart(2, '0');

    if (hours === 0) {
        return `${formattedMinutes}m`
    }
    else if (minutes == 0) {
        return `${hours}h`
    }
    else if (hours === 0 && minutes === 0) {
        return "0h 0m"
    } else {
        return `${hours}h ${formattedMinutes}m`;
    }
}

/**
 * @param mins 
 * @returns Formatted # of ms to HH MM (i.e. 2 hrs 34 mins)
 */
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

/**
 * 
 * @param fromDate  
 * @returns  The very first day of the next month form passed-in month.
 */
export function getNextMonth(fromDate: Date): Date {
    const nextMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
    return nextMonth
}

/**
 * 
 * @param fromDate  
 * @returns  The very first day of the prev month form passed-in month.
 */
export function getPrevMonth(fromDate: Date): Date {
    return new Date(fromDate.setDate(0))
}

/**
 * Checks to see if year is later than 100 yrs ago and is before 100 yrs from now
 * 
 * @param yr 
 * @param min   Min allowed yr
 * @param max   Max allowed yr
 * @returns 
 */
export function isYrValid(yr: number) {
    const max = new Date().getFullYear() + 100
    const min = new Date().getFullYear() - 100

    return min <= yr && yr <= max
}

/**
 * 
 * @returns String and ending dates of current week (Apr 1 - Apr 7)
 */
const getCurrentWeek = () => {
    const currentDate = new Date();
    const firstDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));
    const lastDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7));
  
    return `${firstDayOfWeek.getMonth() + 1}/${firstDayOfWeek.getDate()} - ${lastDayOfWeek.getMonth() + 1}/${lastDayOfWeek.getDate()}`;
}

/**
 * Check to see if str accturately represents a month.
 * Return the month idx if so and -1 otherwise
 * @param str   
 * @returns  Month idx
 */
export function isStrMonth(str: String): number {
    for (let idx = 0; idx < months.length; idx++) {
        const month = months[idx]
        if (month.toLowerCase() === str.toLowerCase()) {
            return idx
        }
        else if (str.length === 3 && month.toLowerCase().substring(0, 3) === str) {
            return idx
        }
    }
    return -1
}

/**
 * 
 * @param currentDate 
 * @returns Get current week number (i.e. 52 for last week)
 */
export function getWeekNumber(currentDate: Date) {
    const startDate = new Date(currentDate.getFullYear(), 0, 1)
    const days = Math.floor(((currentDate as any) - (startDate as any)) / (24 * 60 * 60 * 1000))
    
    const weekNumber = Math.ceil(days / 7)
    return weekNumber
}

export function getLastDayOfMonth(date: Date): number {
    const year = date.getFullYear()
    const month = date.getMonth()

    const nextMonthFirstDay = new Date(year, month + 1, 1)
    const lastDayOfMonth = new Date(nextMonthFirstDay.getTime() - 1)
  
    return lastDayOfMonth.getDate()
}

export function isSameMonth(d1: Date, d2: Date) {
    return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
}

export function addDaysToDate(d: Date, n: number): Date { 
    return new Date(d.setDate(d.getDate() + n))
}

export function getTotalSecondsFromStartOfDay(date: Date): number {
    const currentDate = date.getTime()
  
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const startOfDayMillis = startOfDay.getTime()
  
    // Calculate the total seconds elapsed
    const totalSeconds = Math.floor((currentDate - startOfDayMillis) / 1000)
  
    return totalSeconds
}

export function minsToMMSS(mins: number) {
    return secsToMMSS(mins * 1000)
}

export function secsToMMSS(s: number) {
    return msToHHMMSS(s * 1000)
}

/**
 * Converts milliseconds to a formatted string in the format HH:MM:SS.
 * @param ms   The number of milliseconds to convert.
 * @returns    The formatted string in the format HH:MM:SS.
 */
export function msToHHMMSS(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    // Format the time components as HH:MM:SS
    let formattedTime = ''
    if (hours > 0) {
        formattedTime += hours + ':'
    }
    if (minutes > 0 || hours > 0) {
        formattedTime += minutes + ':'
    } else {
        formattedTime += '0:'
    }
    formattedTime += (seconds < 10 ? '0' : '') + seconds

    return formattedTime
}

/**
 * Converts the given number of minutes from the beginning of the day to the "hh:mm" format.
 * @param    minutes - The number of minutes from the beginning of the day.
 * @returns            The time in "hh:mm AM / PM" format.
 */
export function minsFromStartToHHMM(minsFromStart: number, doShorten = true) {
    const _hours = Math.floor(minsFromStart / 60)
    const hours =  _hours % 12 || 12
    const mins = minsFromStart % 60

    let formattedHours = String(hours)

    if (formattedHours.length === 1) {
        formattedHours = formattedHours.padStart(2, ' ')
    }

    const formattedMins = String(mins).padStart(2, '0')
    const period = _hours < 12 ? 'AM' : 'PM'

    if (formattedMins === "00" && doShorten) {
        return `${formattedHours} ${period}`.trim()
    }
    else {
        return `${formattedHours}:${formattedMins} ${period}`.trim()
    }
}


/**
 * Returns a formatted time string based on the provided time index.
 * @param    timeIdx - The numerical index representing the time.
 * @returns  A formatted time string in the format "hour AM/PM".
 * @example
 * 
 * ``` ts
 * const timeIdx = 14;
 * const formattedTime = getTimeFromIdx(timeIdx);
 * console.log(formattedTime); // Output: "2 PM"
 * ```
 */
export function getTimeFromIdx(timeIdx: number, lowerCase = false) {
    const suffix = timeIdx < 12 ? "AM" : "PM";
    const formattedHour = timeIdx % 12 || 12

    const str = `${formattedHour} ${suffix}`

    if (lowerCase) {
        return str.toLowerCase()
    }
    else {
        return str
    }
}