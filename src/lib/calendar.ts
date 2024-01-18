import type { Writable } from "svelte/store"
import { DateBoundState } from "./enums"
import { formatDateLong, getNextMonth, getPrevMonth, isDateEarlier, isSameMonth, isYrValid } from "./utils-date"

/**
 * Abstract class for all calendars.
 * The object structure for each day depends on the client.
 * MonthData is the general type.
 */
export abstract class Calendar<T extends MonthData = MonthData> {
    pickedDate: Date | null = null
    pickedDateStr: string = ""

    currMonth: T
    isPrevMonthAvailable: boolean
    isNextMonthAvailable: boolean
    isForwards: boolean | null = null

    minDate: Date | null 
    maxDate: Date | null 

    constructor(options: CalendarOptions | null = null) {
        this.minDate = options?.minDate ?? null
        this.maxDate = options?.maxDate ?? null
        this.isForwards = options?.forwards ?? null

        this.currMonth = this.genMonthCalendar(new Date())

        this.isPrevMonthAvailable = !this.isForwards ?? true
        this.isNextMonthAvailable = this.isForwards ?? true
    }

    /**
     * Set new selected date for the calendar.
     * @param newDate  New date that was picked by the user.
     */
    setNewPickedDate(newDate: Date | null) {
        this.pickedDate = newDate ?? null
        this.pickedDateStr = newDate != null ? formatDateLong(newDate) : ""
    }

    /*
     * Get prev month after current
     */
    getNextMonthCalendar() { 
        this.currMonth = this.genMonthCalendar(getNextMonth(this.currMonth.firstDay))

        if (!this.isForwards) {
            this.isNextMonthAvailable = !isSameMonth(this.currMonth.firstDay, new Date())
        }
        else if (this.isForwards) {
            this.isPrevMonthAvailable = true
        }
    }

    /**
     * Get next month after current
     */
    getPrevMonthCalendar() {
        this.currMonth = this.genMonthCalendar(getPrevMonth(this.currMonth.firstDay))

        if (this.isForwards) {
            this.isPrevMonthAvailable = !isSameMonth(this.currMonth.firstDay, new Date())
        }
        else if (!this.isForwards) {
            this.isNextMonthAvailable = true
        }
    }

    /**
     * Get this month
     */
    getThisMonth() {
        this.currMonth = this.genMonthCalendar(new Date())
        this.isPrevMonthAvailable = !this.isForwards ?? true
        this.isNextMonthAvailable = this.isForwards ?? true
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

    /**
     * Generates a month calendar given a date from the month.
     * @param d   Date from the month.
     */
    abstract genMonthCalendar(inputDate: Date): T
}

/**
 * @interface
 * Interface that allows Calendar Object to be reactive
 */
export interface CalendarStore<T> {
    _store: Writable<T>

    updateDatePickerState(newState: Partial<T>): void
    getNewStateObj(oldState: T, newState: Partial<T>): T 
}