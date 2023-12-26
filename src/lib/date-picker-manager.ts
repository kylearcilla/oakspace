import { datePickerManager } from "./store"
import { addDaysToDate, formatDateLong, getLastDayOfMonth, getNextMonth, getPrevMonth, isDateEarlier, isSameDay, isSameMonth, isStrMonth, isYrValid } from "./utils-date"
import { getElemById, getScrollStatus } from "./utils-general"

type MonthData = {
    monthIdx: number,
    firstDay: Date,    
    year: number,
    days: ({ date: Date, isInCurrMonth: boolean } | null)[]
}

enum DateError {
    Invalid, BeyondMin, BeyondMax, InvalidYr
}

export class DatePickerManager {
    pickedDate: Date | null = null
    pickedDateStr: string = ""
    
    currMonth: MonthData
    isPrevMonthAvailable: boolean
    isNextMonthAvailable: boolean
    isForwards: boolean | null = null
    errorMsg = ""

    minDate: Date | null 
    maxDate: Date | null 

    datePickerInput: HTMLInputElement | null = null

    constructor(pickedDate: Date | null, options: DatePickerOptions | null) {
        datePickerManager.set(this)

        this.minDate = options?.minDate ?? null
        this.maxDate = options?.maxDate ?? null
        this.isForwards = options?.forwards ?? null

        this.currMonth = this.genMonthCalendar(new Date())

        this.isPrevMonthAvailable = !this.isForwards ?? true
        this.isNextMonthAvailable = this.isForwards ?? true

        requestAnimationFrame(() => {
            this.datePickerInput = getElemById("date-picker-input")! as HTMLInputElement
            this.setNewPickedDate(pickedDate)
        })

        this.updateDatePickerState({ 
            currMonth: this.currMonth ,
            isPrevMonthAvailable: this.isPrevMonthAvailable,
            isNextMonthAvailable: this.isNextMonthAvailable
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
        this.pickedDateStr = newDate ? formatDateLong(newDate) : ""
        this.datePickerInput!.value = this.pickedDateStr

        this.updateDatePickerState({
            pickedDate: this.pickedDate,
            pickedDateStr: this.pickedDateStr,
        })
    }

    /**
     * Triggered when a new cell in calender has been pressed
     * Will set a new date unless not a valid date.
     * @param day  Day object clicked.
     */
    onDateCellPressed(day: { date: Date, isInCurrMonth: boolean } | null) {
        const isValid = day && this.isDateInBounds(day.date).result   
        if (!isValid) return

        this.setNewPickedDate(day.date)
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
        // see if date is valid format
        const { result: date, error: extractError } = this.extractDateFromInput(userInput)
        
        if (extractError != null) {
            this.setError(extractError)
            return null
        }


        // see date is within bounds
        const { result, error: boundsError } = this.isDateInBounds(date!)
        
        if (boundsError != null) {
            this.setError(boundsError)
            return null
        }

        this.setNewPickedDate(date)
        return date
    }

    /**
     * Triggered when a user input error has occured
     * @param error 
     */
    setError(error: DateError | null) {
        if (error === null) {
            this.errorMsg = ""
            this.updateDatePickerState({ errorMsg: this.errorMsg })
            return
        }

        if (error === DateError.Invalid) {
            this.errorMsg = "Input is not a valid date format."
        }
        else if (error === DateError.BeyondMin) {
            this.errorMsg = `Must be later than ${formatDateLong(this.minDate!)}`
        }
        else if (error === DateError.BeyondMax) {
            this.errorMsg = `Must be earlier than ${formatDateLong(this.maxDate!)}`
        }
        else {
            this.errorMsg = "Date year invalid."
        }

        this.datePickerInput!.value = this.pickedDateStr
        this.updateDatePickerState({ errorMsg: this.errorMsg })
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

        this.updateDatePickerState({ 
            currMonth: this.currMonth, 
            isPrevMonthAvailable: this.isPrevMonthAvailable,
            isNextMonthAvailable: this.isNextMonthAvailable
        })
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

        this.updateDatePickerState({ 
            currMonth: this.currMonth, 
            isPrevMonthAvailable: this.isPrevMonthAvailable,
            isNextMonthAvailable: this.isNextMonthAvailable
        })
    }

    /**
     * Get this month
     */
    getThisMonth() {
        this.currMonth = this.genMonthCalendar(new Date())


        this.isPrevMonthAvailable = !this.isForwards ?? true
        this.isNextMonthAvailable = this.isForwards ?? true

        this.updateDatePickerState({ 
            currMonth: this.currMonth, 
            isPrevMonthAvailable: this.isPrevMonthAvailable,
            isNextMonthAvailable: this.isNextMonthAvailable
        })
    }

    /**
     * Check if current date is a valid date.
     * If date must be used after today then dates must be either today after today (depends if inclusive is set)
     * Same logic follows for use before.
     * 
     * @param date  Date picked by user.
     * @returns     If date is within bounds.
     */
    isDateInBounds(date: Date): Result<boolean, DateError | null> {
        if (!isYrValid(date.getFullYear())) {
            return { result: false, error: DateError.InvalidYr }
        }
        else if (this.maxDate && isDateEarlier(this.maxDate, date)) {
            return { result: false, error: DateError.BeyondMax }
        }
        else if (this.minDate && isDateEarlier(date, this.minDate)) {
            return { result: false, error: DateError.BeyondMin }
        }
    
        return { result: true, error: null }
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
    extractDateFromInput(inputVal: string): Result<Date | null, DateError | null> {
        const val = inputVal.toLowerCase().trim()
        const strArr = val.split(/[,\s]+/)
        const currYr = new Date().getFullYear()
        
        if (val === "" || strArr.length === 0 || strArr.length > 3) {
            return { result: null, error: DateError.Invalid }
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
                return { result: null, error: DateError.Invalid }
            }
            if (monthIdx >= 0) {
                month = monthIdx
            }
            else if (isDay && day >= 0) {
                return { result: null, error: DateError.Invalid }
            }
            else if (isDay) {
                day = num
            }
            else if (isYr && yr >= 0)  {
                return { result: null, error: DateError.Invalid }
            }
            else if (isYr) {
                yr = num
            }
        }
    
        // String length of 1
        if (strArr.length === 1 && day >= 1) {
            return { result: null, error: DateError.Invalid }
        }
        else if (strArr.length === 1 && yr >= 0) {
            return { result: new Date(yr, 11, 31), error: null }
        }
        else if (strArr.length === 1 && month >= 0) {
            const lastDayOfMonth = getLastDayOfMonth(new Date)
    
            return { result: new Date(currYr, month, lastDayOfMonth), error: null }
        }

        // String length of 2
        if (strArr.length === 2 && month < 0) {
            return { result: null, error: DateError.Invalid }
        }
        else if (strArr.length === 2 && day >= 0) {
            return { result: new Date(currYr, month, day), error: null }
        }
        else if (strArr.length === 2 && yr >= 0) {
            const lastDayOfMonth = getLastDayOfMonth(new Date(yr, month))
            return { result: new Date(yr, month, lastDayOfMonth), error: null }
        }
        
        // String length of 3
        if (yr >= 0 && day >= 0 && month >= 0) {
            return { result: new Date(yr, month, day), error: null }
        }
        
        return { result: null, error: DateError.Invalid }
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

        if (newState.pickedDateStr != undefined)  newStateObj!.pickedDateStr = newState.pickedDateStr
        if (newState.pickedDate != undefined)     newStateObj!.pickedDate = newState.pickedDate
        if (newState.currMonth != undefined)      newStateObj!.currMonth = newState.currMonth
        if (newState.isNextMonthAvailable != undefined)      newStateObj!.isNextMonthAvailable = newState.isNextMonthAvailable
        if (newState.isPrevMonthAvailable != undefined)      newStateObj!.isPrevMonthAvailable = newState.isPrevMonthAvailable
        if (newState.errorMsg != undefined)                  newStateObj!.errorMsg = newState.errorMsg

        return newStateObj
    }
}