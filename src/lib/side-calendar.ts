import { Calendar } from "./calendar"

export class SideCalendar extends Calendar<ProductivityDate> {
    constructor(options?: DatePickerOptions) {
        super(options)
    }
}