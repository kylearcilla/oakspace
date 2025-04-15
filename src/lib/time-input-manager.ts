import { minsFromStartToHHMM } from "./utils-date"
import { clamp, extractNumStr, getElemById, isInRange } from "./utils-general"

export class TimeInputManager {
    min = 0
    max = 1440
    oldTitle: string
    value: string
    id: string
    inputElem?: HTMLInputElement
    handlers?: {
        onInputHandler?: FunctionParam
        onBlurHandler?: FunctionParam
        onFocusHandler?: FunctionParam
        onError?: FunctionParam
    }

    constructor(options: TimeInputOptions) {
        this.min = options.min ?? this.min
        this.max = options.max ?? this.max
        this.oldTitle = options.initValue || ""
        this.value = options.initValue ?? ""
        this.id = options.id ?? ""
        this.handlers = options.handlers
    }

    updateBounds({ min, max }: { min?: number, max?: number }) {
        this.min = min ?? this.min
        this.max = max ?? this.max
    }

    initElem() {
        this.inputElem = getElemById(this.id) as HTMLInputElement

        if (!this.inputElem) {
            return null
        }

        this.inputElem.addEventListener("blur", (e) => this.onBlurHandler(e))
        this.inputElem.addEventListener("input", (e) => this.onInputHandler(e))
        this.inputElem.addEventListener("keydown", (e) => this.onKeyDownHandler(e))

        return this.inputElem
    }

    updateVal(e: Event, newVal: string) {
        this.value = newVal

        if (this.handlers?.onInputHandler) {
            this.handlers!.onInputHandler(e, newVal, newVal.length)
        }
    }

    onInputHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        this.updateVal(event, inputElem.value)
    }

    onBlurHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        const value = inputElem.textContent ?? ""
        
        try {
            const mins = this.validateTimeStr(value)
            const timeInput = clamp(this.min, mins, this.max)
            const timeStr = minsFromStartToHHMM(timeInput, false)

            this.updateVal(event, timeStr)
        }
        catch(e: any) {
            this.updateVal(event, this.oldTitle)
        }

        this.inputElem!.textContent = this.value

        if (this.handlers?.onBlurHandler) { 
            this.handlers!.onBlurHandler(event, this.value)
        }
    }

    /**
     * Get the total minutes from hours and minutes
     * @param hhNum 
     * @param mmNum 
     * @param isAM 
     * @returns 
     */
    minsFromHHMM(hhNum: number, mmNum: number, isAM = false) {
        if (hhNum === 24) {
            return mmNum;
        } 
        else if (isAM) {
            return (hhNum % 12) * 60 + mmNum
        } 
        else {
            const totalHrs = hhNum === 12 ? 12 : hhNum % 12 + 12
            return totalHrs * 60 + mmNum
        }
    }

    isAM(hh: number, stringInput: string) {
        if (hh === 24 || hh === 0) return true
        if (hh >= 13) return false

        const containsAMPM = /am|pm/i.test(stringInput)
        return containsAMPM ? /am/i.test(stringInput) : hh <= 11
    }

    /**
     * Validate the time string and return the total minutes from start of day
     */
    validateTimeStr(val: string) {
        const value = val.toLowerCase()
        const numbersArr = extractNumStr(val)
        const numStr = numbersArr.join("")
        const num = +numStr

        let isAM = this.isAM(num, value)

        // 1 or 2 nums
        if (numbersArr.length === 1 && isInRange(0, num, 9)) {

            return this.minsFromHHMM(num, 0, isAM)
        }
        else if (numbersArr.length === 2 && isInRange(0, num, 24)) {

            return this.minsFromHHMM(num, 0, isAM)
        }

        const hh = +numStr.slice(0, numbersArr.length === 3 ? 1 : 2)
        const mm = +numStr.slice(-2)
        isAM = this.isAM(hh, value)

        // 3 or 4 nums
        if (numbersArr.length === 3 && isInRange(0, mm, 59)) {

            return this.minsFromHHMM(hh, mm, isAM)
        }
        else if (numbersArr.length === 4 && isInRange(0, hh, 24) && isInRange(0, mm, 59)) {

            return this.minsFromHHMM(hh, mm, isAM)
        }

        throw new Error("Invalid time input.")
    }

    updateText(text: string) {
        if (!this.inputElem) return

        this.value = text
        this.inputElem!.textContent = this.value
    }

    onKeyDownHandler(event: KeyboardEvent) {
        const { key, metaKey } = event
        const formatting = metaKey && ['b', 'e', 'i', 'u'].includes(key)

        if (formatting) {
            event.preventDefault()
        }
    }
}
