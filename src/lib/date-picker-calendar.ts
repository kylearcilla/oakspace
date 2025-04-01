import { Calendar } from "./calendar"
import { DatePickerError } from "./enums"
import { formatDateLong, getLastDayOfMonth, isDateEarlier, isStrMonth, isYrValid, months } from "./utils-date"

/**
 *  Basic calendar for general use-case. 
 *  Use with the date picker.
 */
export class DatePickerCalendar extends Calendar {
    dateType: DateType = "day"

    constructor(options: DatePickerOptions) {
        super(options)
        this.dateType = options.dueType ?? "day"

    }

    setDateType(dateType: "day" | "month" | "year" | "quarter") {
        this.dateType = dateType
    }

    extractDateFromInput(inputVal: string): { str: string | null, date: Date | null, errorMsg?: string } {
        try {
            const date = this.extractDateFromStr(inputVal)

            return { str: this.formatDateByType(date), date }
        }
        catch(e: any) {
            return { str: null, date: null, errorMsg: this.getErrorMsg(e) }
        }
    }
 
    formatDateByType(date: Date): string {
        return formatDateLong(date)
    }

    extractDateFromStr(inputVal: string): Date {
        const val = inputVal.toLowerCase().trim()
        const strArr = val.split(/[,\s]+/)
        const currYr = new Date().getFullYear()
        
        if (val === "" || strArr.length === 0 || strArr.length > 3) {
            throw { code: DatePickerError.Invalid }
        }

        // Check for quarter format (q1, q2, q3, q4)
        if (strArr.length <= 2) {
            for (let i = 0; i < strArr.length; i++) {
                
                const match = strArr[i].match(/^q\s*([1-4])$/)
                if (match) {
                    const quarter = parseInt(match[1])
                    const month = (quarter * 3) - 1
                    
                    let year = currYr
                    if (strArr.length === 2) {
                        const otherIdx = i === 0 ? 1 : 0

                        if (isYrValid(+strArr[otherIdx])) {
                            year = parseInt(strArr[otherIdx])
                        }
                    }
                    const lastDayOfMonth = getLastDayOfMonth(new Date(year, month))
                    return new Date(year, month, lastDayOfMonth)
                }
            }
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
                throw { code: DatePickerError.Invalid }
            }
            if (monthIdx >= 0) {
                month = monthIdx
            }
            else if (isDay && day >= 0) {
                throw { code: DatePickerError.Invalid }
            }
            else if (isDay) {
                day = num
            }
            else if (isYr && yr >= 0)  {
                throw { code: DatePickerError.Invalid }
            }
            else if (isYr) {
                yr = num
            }
        }

        // String length of 1
        if (strArr.length === 1 && day >= 1) {
            throw { code: DatePickerError.Invalid }
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
            throw { code: DatePickerError.Invalid }
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
        
        throw { code: DatePickerError.Invalid }
    }

    getErrorMsg(error: any | null) {
		if (error.code === DatePickerError.BeyondMin) {
			return `Must be later than ${formatDateLong(this.minDate!)}`
		}
		else if (error.code === DatePickerError.BeyondMax) {
			return `Must be earlier than ${formatDateLong(this.maxDate!)}`
		}
		else {
            return "Invalid date format."
		}
	}
}