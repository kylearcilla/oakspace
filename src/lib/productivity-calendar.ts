import { writable, type Writable } from "svelte/store";
import { Calendar, type CalendarStore } from "./calendar";
import { isSameDay, isSameMonth } from "./utils-date";

export class ProductivityCalendar extends Calendar<ProductivityDate> implements CalendarStore<ProductivityCalendar> {
    pickedDate: Date = new Date()
    _store: Writable<ProductivityCalendar>

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
            currMonth: this.currMonth, 
            isNextMonthAvailable: this.isNextMonthAvailable, 
            isPrevMonthAvailable: this.isPrevMonthAvailable,
            pickedDate: this.pickedDate
        })
    }

    setNewPickedDate(newDate: Date) {
        super.setNewPickedDate(newDate)

        this.updateDatePickerState({ 
            currMonth: this.currMonth,
            pickedDate: this.pickedDate
        })
    }
    
    genMonthCalendar(inputDate: Date): ProductivityDate {
        const firstDayOfMonth = new Date(new Date(inputDate).setDate(1))
        const monthFirstDayOfWeek = firstDayOfMonth.getDay()
        const currMonth: ProductivityDate = { 
            firstDay: firstDayOfMonth,
            monthIdx: inputDate.getMonth(), 
            days: [],
            year: inputDate.getFullYear(), 
        }

        // go to the first date in grid using negative offset from first day
        let day = (monthFirstDayOfWeek - 1) * -1  

        for (let w = 0; w < 6; w++) {
            for (let d = 0; d < 7; d++) {
                const currDate = new Date(new Date(inputDate).setDate(day++))
                const isInCurrMonth = isSameMonth(currDate, firstDayOfMonth)
                currMonth.days.push({ date: currDate, isInCurrMonth, hadGoal: isInCurrMonth && Math.random() < 0.3, hadSession: isInCurrMonth && Math.random() < 0.5 })
            }
        }
        return currMonth
    }

    updateDatePickerState(newState: Partial<ProductivityCalendar>) {
        this._store.update((data: ProductivityCalendar | null) => {
            return this.getNewStateObj(data!, newState)
        })
    }

    getNewStateObj(oldState: ProductivityCalendar, newState: Partial<ProductivityCalendar>): ProductivityCalendar {
        const newStateObj = oldState

        if (newState.pickedDateStr != undefined)  newStateObj!.pickedDateStr = newState.pickedDateStr
        if (newState.pickedDate != undefined)     newStateObj!.pickedDate = newState.pickedDate
        if (newState.currMonth != undefined)      newStateObj!.currMonth = newState.currMonth
        if (newState.isNextMonthAvailable != undefined)      newStateObj!.isNextMonthAvailable = newState.isNextMonthAvailable
        if (newState.isPrevMonthAvailable != undefined)      newStateObj!.isPrevMonthAvailable = newState.isPrevMonthAvailable

        return newStateObj
    }
}