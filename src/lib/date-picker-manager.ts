import { BasicCalendar } from "./basic-calendar"
import { DatePickerUserInput } from "./enums"
import { ResError } from "./errors"
import { datePickerManager } from "./store"
import { formatDateLong, getLastDayOfMonth, getNextMonth, getPrevMonth, isDateEarlier, isSameMonth, isStrMonth, isYrValid } from "./utils-date"
import { getElemById } from "./utils-general"

class DatePickerError extends ResError<DatePickerUserInput> { }

export class DatePickerManager {
    pickedDate: Date | null = null
    pickedDateStr = ""

    errorMsg = ""
    datePickerInput: HTMLInputElement | null = null

    isForwards: boolean | null
    minDate: Date | null
    maxDate: Date | null

    constructor(options: DatePickerOptions | null) {
        datePickerManager.set(this)

        this.minDate = options?.minDate ?? null
        this.maxDate = options?.maxDate ?? null
        this.isForwards = options?.forwards ?? null

        requestAnimationFrame(() => {
            this.datePickerInput = getElemById("date-picker-input")! as HTMLInputElement
        })
    }

    quit() {
        datePickerManager.set(null)
    }

    /**
     * Update Date Picker State's Store.
     * @param newState  New changes to be incorporated.
     */
    updateDatePickerState(newState: Partial<DatePickerManager>) {
        datePickerManager.update((data: DatePickerManager | null) => {
            return this.getNewStateObj(data!, newState)
        })
    }

    /**
     * Set a new picked date.
     * @param newDate 
     */
    setNewPickedDate(newDate: Date | null) {
        this.pickedDate = newDate ?? null
        this.pickedDateStr = newDate != null ? formatDateLong(newDate) : ""
        this.datePickerInput!.value = this.pickedDateStr

        this.updateDatePickerState({
            pickedDate: this.pickedDate,
            pickedDateStr: this.pickedDateStr
        })
    }

    /**
     * Triggered when a new cell in calender has been pressed
     * Will set a new date unless not a valid date.
     * @param day  Day object clicked.
     */
    onDateCellPressed(day: Date) {
        try {
            const isValid = day && this.getDateBoundState(day) === DatePickerUserInput.InBounds
            if (!isValid) return

            this.setNewPickedDate(day)
        }
        catch {
            return
        }
    }

    /**
     * If a proper date, the date will be returned.
     * Triggers when user pressed "Apply Button " or "Enter" Shortcut
     * Will set errors if user input is invalid.
     * 
     * @param userInput  Value of user submitted string
     * @returns          Picked date if valid, null otherwise
     * 
     */
    submitInputText(userInput: string): Date | null {
        try {
            // see if date is valid format
            const date = this.extractDateFromInput(userInput)
    
            // see date is within bounds
            const boundState = this.getDateBoundState(date!)

            if (boundState !== DatePickerUserInput.InBounds) {
                console.log(boundState)
                throw new DatePickerError(boundState)
            }

            this.setNewPickedDate(date)
            return date
        }
        catch(e: any) {
            this.setError(e)
            return null
        }
    }

    /**
     * Triggered when a user input error has occured
     * @param error 
     */
    setError(error: DatePickerError | null) {
        if (error === null) {
            this.errorMsg = ""
            this.updateDatePickerState({ errorMsg: this.errorMsg })
            return
        }

        if (error.code === DatePickerUserInput.Invalid) {
            this.errorMsg = "Input is not a valid date format."
        }
        else if (error.code === DatePickerUserInput.BeyondMin) {
            this.errorMsg = `Must be later than ${formatDateLong(this.minDate!)}`
        }
        else if (error.code === DatePickerUserInput.BeyondMax) {
            this.errorMsg = `Must be earlier than ${formatDateLong(this.maxDate!)}`
        }
        else {
            this.errorMsg = "Date year invalid."
        }

        this.datePickerInput!.value = this.pickedDateStr
        this.updateDatePickerState({ errorMsg: this.errorMsg })
    }

    /**
     * Check the bound state of the user date input according to the set max / min dates.
     * Checks the validity of the user input based on bounds.
     * 
     * @param date  Date picked by user.
     * @returns     Returns the bound state of user input.
     */
    getDateBoundState(date: Date): DatePickerUserInput {
        if (!isYrValid(date.getFullYear())) {
            return DatePickerUserInput.InvalidYr
        }
        else if (this.maxDate && isDateEarlier(this.maxDate, date)) {
            return DatePickerUserInput.BeyondMax
        }
        else if (this.minDate && isDateEarlier(date, this.minDate)) {
            return DatePickerUserInput.BeyondMin
        }
        return DatePickerUserInput.InBounds
    }

    /**
     * Update title with animated transitions.
     */
    updateFocusMonthTitle() {
    }

    /**
     * Generates a month calendar given a date from the month.
     * @param d   Date from the month.
     */
    genMonthCalendar(inputDate: Date): MonthData {
        const firstDayOfMonth = new Date(inputDate.setDate(1))
        const monthFirstDayOfWeek = firstDayOfMonth.getDay()
        const currMonth: MonthData = { 
            monthIdx: inputDate.getMonth(), days: Array(42).fill(null),
            year: inputDate.getFullYear(), firstDay: firstDayOfMonth
        }

        let day = (monthFirstDayOfWeek - 1) * -1
        let idx = 0
    
        for (let w = 0; w < 6; w++) {
            for (let d = 0; d < 7; d++) {
                const currDate = new Date(new Date(inputDate).setDate(day++));
        
                const isInCurrMonth = isSameMonth(currDate, firstDayOfMonth);
                currMonth.days[idx++] = { date: currDate, isInCurrMonth };
            }
        }
        return currMonth
    }

    /**
     * Extract dates from inputs.
     * 
     * Valid dates example: 
     * Dec 12 | 12 Dec | Dec 2023 | 2023 Dec |
     * Dec, 23 2023 | 2023 23 Dec | December 12 2023, etc...
     * 
     * Invalid: 
     * 12 2023 | 2023 2023 Dec | 11 12 Dec | 12 23 12
     * 
     * @param inputVal  User input
     * @returns         If valid, will return a Date object, null otherise
     */
    extractDateFromInput(inputVal: string): Date {
        const val = inputVal.toLowerCase().trim()
        const strArr = val.split(/[,\s]+/)
        const currYr = new Date().getFullYear()
        
        if (val === "" || strArr.length === 0 || strArr.length > 3) {
            throw new DatePickerError(DatePickerUserInput.Invalid)
        }
    
        let yr = -1, day = -1, month = -1
    
        // extract yr, date, month elements
        for (let str of strArr) {
            const isNotNum = isNaN(Number(str))
            const num = isNotNum ? -1 : Number(str)
            const monthIdx = isNotNum ? isStrMonth(str) : -1
            const isDay = isNotNum ? -1 : num >= 1 && num <= 31
            const isYr = str.length === 4 && !isNotNum
    
            if (monthIdx >= 0 && month >= 0) {
                throw new DatePickerError(DatePickerUserInput.Invalid)
            }
            if (monthIdx >= 0) {
                month = monthIdx
            }
            else if (isDay && day >= 0) {
                throw new DatePickerError(DatePickerUserInput.Invalid)
            }
            else if (isDay) {
                day = num
            }
            else if (isYr && yr >= 0)  {
                throw new DatePickerError(DatePickerUserInput.Invalid)
            }
            else if (isYr) {
                yr = num
            }
        }
    
        // String length of 1
        if (strArr.length === 1 && day >= 1) {
            throw new DatePickerError(DatePickerUserInput.Invalid)
        }
        else if (strArr.length === 1 && yr >= 0) {
            return new Date(yr, 11, 31)
        }
        else if (strArr.length === 1 && month >= 0) {
            const lastDayOfMonth = getLastDayOfMonth(new Date)
            return new Date(currYr, month, lastDayOfMonth)
        }

        // String length of 2
        if (strArr.length === 2 && month < 0) {
            throw new DatePickerError(DatePickerUserInput.Invalid)
        }
        else if (strArr.length === 2 && day >= 0) {
            return new Date(currYr, month, day)
        }
        else if (strArr.length === 2 && yr >= 0) {
            const lastDayOfMonth = getLastDayOfMonth(new Date(yr, month))
            return new Date(yr, month, lastDayOfMonth)
        }
        
        // String length of 3
        if (yr >= 0 && day >= 0 && month >= 0) {
            return new Date(yr, month, day)
        }
        
        throw new DatePickerError(DatePickerUserInput.Invalid)
    }
    
    /**
     * 
     * Get the updated version of the old state. 
     * This is done to avoid destructuring as methods will not be preserved.
     * Will only update the UI-relevant data that needs to be listned in the UI.
     * 
     * @param newState  New state changes to be incorporated
     * @param oldState  Current state
     * @returns         New state with the latest incorporated changes.
     */
    getNewStateObj(oldState: DatePickerManager, newState: Partial<DatePickerManager>): DatePickerManager {
        const newStateObj = oldState

        if (newState.errorMsg != undefined)                  newStateObj!.errorMsg = newState.errorMsg
        if (newState.pickedDate != undefined)                  newStateObj!.pickedDate = newState.pickedDate
        if (newState.pickedDateStr != undefined)                  newStateObj!.pickedDateStr = newState.pickedDateStr

        return newStateObj
    }
}