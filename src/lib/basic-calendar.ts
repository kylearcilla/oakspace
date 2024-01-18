import { writable, type Writable } from "svelte/store";
import { Calendar, type CalendarStore } from "./calendar";
import { isSameMonth } from "./utils-date";

/**
 *  Basic calendar for general use-case. 
 *  Use with the date picker.
 */
export class BasicCalendar extends Calendar implements CalendarStore<BasicCalendar> {
    _store: Writable<BasicCalendar>

    constructor(options: DatePickerOptions | null) {
        super(options)
        this._store = writable(this)
    }

    getNextMonthCalendar() {
        super.getNextMonthCalendar()

        this.updateDatePickerState({ 
            currMonth: this.currMonth, isNextMonthAvailable: this.isNextMonthAvailable, isPrevMonthAvailable: this.isPrevMonthAvailable 
        })
    }

    getPrevMonthCalendar() {
        super.getPrevMonthCalendar()

        this.updateDatePickerState({ 
            currMonth: this.currMonth, isNextMonthAvailable: this.isNextMonthAvailable, isPrevMonthAvailable: this.isPrevMonthAvailable 
        })
    }

    getThisMonth() {
        super.getThisMonth()

        this.updateDatePickerState({ 
            currMonth: this.currMonth, isNextMonthAvailable: this.isNextMonthAvailable, isPrevMonthAvailable: this.isPrevMonthAvailable 
        })
    }

    setNewPickedDate(newDate: Date | null) {
        super.setNewPickedDate(newDate)

        this.updateDatePickerState({ pickedDate: this.pickedDate, pickedDateStr: this.pickedDateStr})
    }
    
    genMonthCalendar(inputDate: Date): MonthData {
        const firstDayOfMonth = new Date(inputDate.setDate(1))
        const monthFirstDayOfWeek = firstDayOfMonth.getDay()
        const currMonth: MonthData = { 
            monthIdx: inputDate.getMonth(), days: [],
            year: inputDate.getFullYear(), firstDay: firstDayOfMonth
        }

        // go to the first date in grid using negative offset from first day
        let day = (monthFirstDayOfWeek - 1) * -1  

        for (let w = 0; w < 6; w++) {
            for (let d = 0; d < 7; d++) {
                const currDate = new Date(new Date(inputDate).setDate(day++))
                const isInCurrMonth = isSameMonth(currDate, firstDayOfMonth)
                currMonth.days.push({ date: currDate, isInCurrMonth })
            }
        }
        return currMonth
    }

    updateDatePickerState(newState: Partial<BasicCalendar>) {
        this._store.update((data: BasicCalendar | null) => {
            return this.getNewStateObj(data!, newState)
        })
    }

    getNewStateObj(oldState: BasicCalendar, newState: Partial<BasicCalendar>): BasicCalendar {
        const newStateObj = oldState

        if (newState.pickedDateStr != undefined)  newStateObj!.pickedDateStr = newState.pickedDateStr
        if (newState.pickedDate != undefined)     newStateObj!.pickedDate = newState.pickedDate
        if (newState.currMonth != undefined)      newStateObj!.currMonth = newState.currMonth
        if (newState.isNextMonthAvailable != undefined)      newStateObj!.isNextMonthAvailable = newState.isNextMonthAvailable
        if (newState.isPrevMonthAvailable != undefined)      newStateObj!.isPrevMonthAvailable = newState.isPrevMonthAvailable

        return newStateObj
    }
}