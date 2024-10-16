import { formatPlural, getBrowserLanguagePreference } from "./utils-general"

export const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
export const DAYS_OF_WEEK = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

export const TOTAL_DAY_MINS = 1440
export const TOTAL_DAY_SECS = 86_400

export const getDayOfWeek = () => {
    const today = new Date()
    return `${DAYS_OF_WEEK[today.getDay()]}`
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
 * @returns Formatted Time (i.e. Apr 14, 2020 / Apr 14)
 */
export function formatDatetoStr(date: Date, options?: {
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
 * @param start   From start time.
 * @param end     to end time.
 */
export const getElapsedTime = (start: Date, end: Date) => {
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
        return mins === 0 ? "0h 0m" : `${mins}m`
    }
    else if (mins < 60 && formatOption === "numbers") {
        return `00:${String(mins).padStart(2, '0')}`
    }

    const hours = Math.floor(mins / 60)
    const minutes = mins % 60

    let hrsStr, minsStr

    if (formatOption === "mid-letters") {
        hrsStr = `${hours} ${hours > 1 ? "hrs" : "hr" }`
        minsStr = minutes === 0 ? "" : ` ${minutes} mins`

        return `${hrsStr}${minsStr}`
    }
    else if (formatOption === "min-letters") {
        hrsStr = `${hours}h`
        minsStr = minutes === 0 ? "" : ` ${minutes}m`

        return `${hrsStr}${minsStr}`
    }
    else {
        hrsStr = `${hours}`
        minsStr = `${minutes}`

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

export function getMonthStr(date: Date, format: "long" | "med" | "min" = "med") {
    const substrNum = format === "long" ? undefined : format === "med" ? 3 : 1

    return months[date.getMonth()].substring(0, substrNum)
}

/**
 * 
 * @param fromDate  
 * @returns  The very first day of the prev month form passed-in month.
 */
export function getPrevMonth(fromDate: Date): Date {
    return new Date(fromDate.setDate(0))
}

export function getPrevMonthFirstDay(fromDate: Date): Date {
    return new Date(fromDate.getFullYear(), fromDate.getMonth() - 1, 1)
}

export function getFirstDayOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
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

/**
 * Calculates the total number of seconds that have elapsed since the start of the day.
 * 
 * @param date  The date object from which to calculate the elapsed time.
 * @returns     The total number of secs elapsed from the start of the day to the specified date.
 */
export function startOfDay(date: Date): number {
    const currentDate = date.getTime()
  
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const startOfDayMillis = startOfDay.getTime()
    const totalSeconds = Math.floor((currentDate - startOfDayMillis) / 1000)
  
    return totalSeconds
}

export function getMinsFromStartOfDay(date: Date): number {
    return startOfDay(date) / 60
}

export function minsToHhMmSs(mins: number) {
    return secsToHhMmSs(mins)
}

export function secsToHhMmSs(secs: number) {
    return msToHHMMSS(secs * 1000)
}

/**
 * Converts milliseconds to a formatted string in the format HH:MM:SS.
 * 
 * @param ms   The number of milliseconds to convert.
 * @param hr   Include the hour section.
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
        formattedTime += (minutes < 10 ? '0' : '') + minutes + ':'
    } 
    else {
        formattedTime += minutes + ':'
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
 * ```
 * const timeIdx = 14          // 14:00 / 2 PM
 * const formattedTime = getTimeFromIdx(timeIdx)
 * console.log(formattedTime) // 2 PM
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

/**
 * 
 * Check if time of day is valid.
 * 
 * @param h       The hours portion of the time (0-12)
 * @param m       The minutes portion of the time (0-59)
 * @param ampm    Indicates whether it's AM or PM
 * @param strict  Wether am or pm rules should be enforced
 * 
 * @throws Error if the input values for hours or minutes are invalid.
 * 
 */
export function validateTimeOfDay(h: number, m: number, ampm?: "am" | "pm", strict = true) {
    if (h < 0 || h > 24) {
        throw new Error("Invalid value for hours. Hours must be between 0 and 24.")
    }
    if (ampm && strict && ampm === "am" && (h > 12 || h === 0)) {
        throw new Error("Invalid value for hours.")
    }
    if (ampm && strict && ampm === "pm" && (h > 12 || h === 0)) {
        throw new Error("Invalid value for hours.")
    }
    if (m < 0 || m > 59) {
        throw new Error("Invalid value for minutes. Minutes must be between 0 and 59.")
    }
}

/**
 * From a given time of day, return the number of minutes elapsed from the start of day to that time
 * 
 * @param h     The hours portion of the time (0-12)
 * @param m     The minutes portion of the time (0-59)
 * @param ampm  Indicates whether it's AM or PM
 * 
 * @throws      Error if the input values for hours or minutes are invalid.
 * @returns     The total number of minutes elapsed
 * 
 * `1:00 AM  = 60`
 * 
 */
export function timeStrToMins(h: number, m: number, ampm?: "am" | "pm") {
    validateTimeOfDay(h, m, ampm, false)

    if (h === 24 || h === 0) {
        h = 0
    }
    else if (h > 12) {
        h = h
    }
    else if (ampm === "pm" && h !== 12) {
        h += 12
    } 
    else if (ampm === "am" && h === 12) {
        h = 0
    }
    return (h * 60) + m
}

export function getNowMins() {
    const date = new Date()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    
    return hours * 60 + minutes
}

/**
 * Gets the current day index (0 for Monday, 6 for Sunday) and the current time in minutes since midnight.
 * 
 * @returns An object containing:
 *             - dayIdx: The current day of the week, with Monday as 0 and Sunday as 6.
 *             - minutes: The current time in minutes since midnight.
 */
export function getDayIdxMinutes() {
    const dayIdx = new Date().getDay()
    
    return {
        dayIdx: (dayIdx + 6) % 7,
        minutes: getNowMins()
    }
}

/**
 * Format date into ISO format
 * 
 * i.e. 2024-08-07T23:59:59+00:00
 * 
 * @param    options 
 * @returns  Date in iso format
 */
export function formatDateToISO(options: { date: Date, type?: "start" | "end" | "abs", timeZoneOffset?: string }) {
    const { date, type = "absolute", timeZoneOffset = '+00:00' } = options

    if (type === 'start') {
        date.setHours(0, 0, 0, 0)
    } 
    else if (type === 'end') {
        date.setHours(23, 59, 59, 999)
    } 

    const isoString = date.toISOString().split('.')[0]    
    return `${isoString}${timeZoneOffset}`
}

/**
 * Formats date into YYYY-MM-DD format.
 * 
 * @param date  Date object
 * @returns     Date in YYYY-MM-DD format.
 */
export function formatDateToSimpleIso(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`
}

/**
 * Gets the number of minutes from the start of the day given a date in ISO format
 * 
 * `i.e. 2024-08-07T23:59:59+00:00 -> 1439`
 * 
 * @param   date
 * @returns mins from start of the date
 */
export function getIsoDateMinutesFromStartOfDay(isoDateString: string): number {
    const [_, timePart] = isoDateString.split('T')

    let offsetMinutes = 0
    const offsetIndex = timePart.indexOf('+') !== -1 ? timePart.indexOf('+') : timePart.indexOf('-')
    
    if (offsetIndex !== -1) {
      const offsetPart = timePart.substring(offsetIndex)
      const cleanedOffsetPart = offsetPart.replace('Z', '')
      const sign = cleanedOffsetPart[0]

      const [hours, minutes] = cleanedOffsetPart.substring(1).split(':').map(Number)
      offsetMinutes = (hours * 60 + minutes) * (sign === '-' ? -1 : 1)
    }
  
    const date = new Date(isoDateString)
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    const totalMinutes = (hours * 60 + minutes) + offsetMinutes
    return totalMinutes < 0 ? 1440 + totalMinutes : totalMinutes
}

export function isToday(date: Date) {
    return isSameDay(date, new Date())
}


/**
 * Given a date add a time to it
 * @param   arg  Date + time to be added (string or number in seconds).
 * @returns      Date with the added time.
 */
export function addToDate(arg: { date: Date, time: TimeString | number }): Date {
    const { date, time } = arg
    const newDate = new Date(date)
    if (typeof time === "number") {
        newDate.setSeconds(newDate.getSeconds() + time)
        return newDate
    }

    const value = parseInt(time, 10)
    const unit = time.slice(-1)

    switch (unit) {
        case 'h':
            newDate.setHours(newDate.getHours() + value)
            break;
        case 'm':
            newDate.setMinutes(newDate.getMinutes() + value)
            break;
        case 's':
            newDate.setSeconds(newDate.getSeconds() + value)
            break;
        case 'd':
            newDate.setDate(newDate.getDate() + value)
            break;
        default:
            throw new Error('Invalid time unit')
    }

    return newDate
}

export function getNextHour(date: Date) {
    const nearestHour = new Date(date)

    nearestHour.setHours(nearestHour.getHours() + 1)
    nearestHour.setMinutes(0, 0, 0)

    return nearestHour
}

export function getTimeDistanceStr(targetDate: Date) {
    const now = new Date()
    const diffInMs = targetDate.getTime() - now.getTime()
    const diffInDays = Math.abs(Math.floor(diffInMs / (1000 * 60 * 60 * 24)))
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30) 
    const diffInYears = Math.floor(diffInMonths / 12) 
    
    const passed = diffInMs < 0
  
    if (diffInDays === 0) {
      return "today";
    } 
    else if (diffInYears > 0) {
      return `${formatPlural("year", diffInYears)} ${passed ? "ago" : ""}`
    } 
    else if (diffInMonths > 0) {
      return `${formatPlural("month", diffInMonths)} ${passed ? "ago" : ""}`
    } 
    else if (diffInWeeks > 0) {
      return `${formatPlural("week", diffInWeeks)} ${passed ? "ago" : ""}`
    } 
    else if (diffInDays > 0) {
      return `${formatPlural("day", diffInDays)} ${passed ? "ago" : ""}`
    }
  }
  