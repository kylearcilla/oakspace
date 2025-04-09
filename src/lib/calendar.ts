import { DateBoundState } from "./enums"
import { formatDateLong, genMonthCalendar, getNextMonth, getPrevMonth, isDateEarlier, isSameMonth, isYrValid } from "./utils-date"

export abstract class Calendar {
    pickedDate: Date | null = null
    pickedDateStr: string = ""

    currMonth: MonthData
    prevMoAvailable: boolean
    nextMoAvailable: boolean

    minDate: Date | null 
    maxDate: Date | null 

    constructor(options: CalendarOptions | null = null) {
        this.minDate = options?.minDate ?? null
        this.maxDate = options?.maxDate ?? null

        this.currMonth = genMonthCalendar(new Date())

        this.prevMoAvailable = true
        this.nextMoAvailable = true
    }

    /**
     * Set new selected date for the calendar.
     * @param newDate  New date that was picked by the user.
     */
    setNewPickedDate(newDate: Date | null) {
        this.pickedDate = newDate
        this.pickedDateStr = newDate != null ? formatDateLong(newDate) : ""
        
        if (!isSameMonth(newDate!, this.currMonth.firstDay)) {
            this.currMonth = genMonthCalendar(structuredClone(newDate!))
        }
        return this.pickedDate
    }

    /**
     * Get next month after current.
     * Next month won't be available if the max date is in the next (would-be-current) month.
     */
    getNextMonthCalendar() { 
        const nextMonth = getNextMonth(this.currMonth.firstDay)

        this.currMonth = genMonthCalendar(nextMonth)
        this.nextMoAvailable = this.maxDate ? !this.dayInMonthGrid(this.maxDate, this.currMonth) : true

        return this.currMonth
    }

    /**
     * Get prev month after current
     * 
     * Prev month won't be available if the min date is in the prev (would-be-current) month.
     */
    getPrevMonthCalendar() {
        const prevMonth = getPrevMonth(this.currMonth.firstDay)

        this.currMonth = genMonthCalendar(prevMonth)
        this.prevMoAvailable = this.minDate ? !this.dayInMonthGrid(this.minDate, this.currMonth) : true

        return this.currMonth
    }

    dateInBounds(date: Date) {
        if (this.maxDate && isDateEarlier(this.maxDate, date)) {
            return false
        }
        else if (this.minDate && isDateEarlier(date, this.minDate)) {
            return false
        }
        return true
    }

    /**
     * Check if a date is in the month grid.
     * @param date  Date to check.
     * @param month  Month to check.
     * @returns     Returns true if date is in the month grid.
     */
    dayInMonthGrid(date: Date, month: MonthData) {
        const [firstDay, lastDay] = [month.days[0].date, month.days[month.days.length - 1].date]
        return isDateEarlier(firstDay, date) && isDateEarlier(date, lastDay)
    }

    /**
     * Get this month
     */
    getThisMonth() {
        this.currMonth = genMonthCalendar(new Date())
        this.prevMoAvailable = true
        this.nextMoAvailable = true
        this.pickedDate = new Date()

        return this.currMonth
    }

    /**
     * Check the bound state of the user date input according to the set max / min dates.
     * Checks the validity of the user input based on bounds.
     * 
     * @param date  Date picked by user.
     * @returns     Returns the bound state of user input.
     */
    getDateBoundState(date: Date): DateBoundState {
        if (!isYrValid(date.getFullYear())) {
            return DateBoundState.InvalidYr
        }
        else if (this.maxDate && isDateEarlier(this.maxDate, date)) {
            return DateBoundState.BeyondMax
        }
        else if (this.minDate && isDateEarlier(date, this.minDate)) {
            return DateBoundState.BeyondMin
        }
        return DateBoundState.InBounds
    }
}