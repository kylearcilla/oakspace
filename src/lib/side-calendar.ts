import { Calendar } from "./calendar"

export class SideCalendar extends Calendar<ProductivityDate> {
    constructor(options: DatePickerOptions | null) {
        super(options)
    }
}