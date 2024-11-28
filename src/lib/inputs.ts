import { writable, type Writable } from "svelte/store"
import { clamp, extractNumStr, getContentEditableSelectionRange, getElemById, isInRange, setCursorPos } from "./utils-general"
import { minsFromStartToHHMM } from "./utils-date"

/**
 * General purpose input manager.
 */
export class InputManager {
    oldTitle: string
    value: string 
    valLength = 0
    id: string 
    maxLength: number
    state: Writable<InputManager>
    inputElem?: HTMLElement
    placeholder?: string
    isValidValue = true
    doAllowEmpty: boolean
    handlers?: {
        onInputHandler?: FunctionParam
        onBlurHandler?: FunctionParam
        onFocusHandler?: FunctionParam
        onError?: FunctionParam
    }

    DEFAULT_MAX_LENGTH = 20

    constructor(options: InputOptions) {
        this.oldTitle  = options.initValue
        this.maxLength = options.maxLength ?? this.DEFAULT_MAX_LENGTH
        this.value = options.initValue
        this.id = options.id ?? ""
        this.placeholder = options.placeholder
        this.handlers = options.handlers
        this.doAllowEmpty = options.doAllowEmpty ?? true

        this.state = writable(this)

        requestAnimationFrame(() => this.initElem())
    }
    
    /* helpers */

    initElem() {
        this.inputElem = getElemById(this.id) as HTMLInputElement
    }
    updateVal(e: Event, newVal: string) {
        this.value = newVal
        this.updateState({ value: newVal })

        if (this.handlers?.onInputHandler) {
            this.handlers!.onInputHandler(e, newVal, newVal.length)
        }
    }

    focus() {
        this.inputElem?.focus()
    }
    blur() {
        this.inputElem?.blur()
    }

    /* handlers */
    onPaste(e: Event) {
        
    }
    updateState(newState: Partial<InputManager>) {
        this.state.update((state) => {
            state.oldTitle = newState.oldTitle ?? state.oldTitle
            state.value   = newState.value ?? state.value

            this.oldTitle = state.oldTitle
            this.value = state.value

            return state
        })
    }
    onInputHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        this.updateVal(event, inputElem.value)
    }
    onFocusHandler(event: Event) {
        if (this.handlers?.onFocusHandler) {
            this.handlers?.onFocusHandler(event, this.value, this.valLength)
        }
    }
    onBlurHandler(event: Event) {
        const value = !this.value ? (this.doAllowEmpty ? "" : "Untitled") : this.value
        
        this.updateState({ oldTitle: value })
        this.updateVal(event, value)

        if (this.handlers?.onBlurHandler) {
            this.handlers?.onBlurHandler(event, value)
        }
    }
}

/**
 * Manager for text area inputs.
 */
export class TextAreaManager extends InputManager { 
    constructor(options: InputOptions) {
        super(options)
    }
}

/**
 * Manager for editor components with contenteditable attribute.
 * Has a set max height and will disallow additions if it goes over.op[ro]
 * Custom functionality for redo / undo and copy paste/
 */
export class TextEditorManager extends InputManager {
    allowFormatting = false
    state: Writable<TextEditorManager>

    /* undo / redo stuff */
    undoStack: string[] = []
    redoStack: string[] = []
    currentIntervalLength = 0
    
    /* caret stuff */
    // caretPos = { x: 0, y: 0 }
    // caretElem?: HTMLElement | null
    // activeTimer: NodeJS.Timer | null = null
    // caretAnimation: Animation | null = null

    // CARET_IDLE_DELAY = 1000
    // CARET_ANIMATION = {
    //     keyframes: [
    //         { opacity: 0, offset: 0 },
    //         { opacity: 0, offset: 0.2 },
    //         { opacity: 1, offset: 0.5 },
    //         { opacity: 1, offset: 0.8 },
    //         { opacity: 0, offset: 1 }
    //     ],
    //     options: {
    //         duration: 1000,
    //         iterations: Infinity
    //     }
    // }

    UNDO_INTERVAL_LENGTH_THRSHOLD = 30

    constructor(options: InputOptions) {
        super(options)
        this.state = writable(this)

        requestAnimationFrame(() => this.initElem())
    }

    /* undo / redo */

    /**
     * When user redos, get the most recent state from redo stack.
     * The current state will be put in the undo stack.
     * 
     * @param event 
     */
    redoEdit(event: KeyboardEvent) {
        if (this.redoStack.length === 0) return

        if (this.value) {
            this.undoStack.push(this.value)
        }

        const recentUndo = this.redoStack.pop()!
        this.updateTextEditorVal(event, recentUndo, true)
    }
    
    /**
     * When user undos, get the most recent state from undo stack.
     * The current state will be put in the redo stack.
     * 
     * @param event 
     */
    undoEdit(event: KeyboardEvent) {
        this.redoStack.push(this.value)

        const recentEdit = this.undoStack.pop() ?? ""
        this.updateTextEditorVal(event, recentEdit, true)
    }

    /**
     * After every insertion of new text, check to see if the text added from prev undo state
     * is big enough for the curent text to be put in the undo stack.
     */
    undoHandler(newValue: string) {
        const recentEditLength = this.undoStack[this.undoStack.length - 1]?.length ?? 0
        this.currentIntervalLength = Math.abs(recentEditLength - newValue.length)

        if (this.currentIntervalLength < this.UNDO_INTERVAL_LENGTH_THRSHOLD) {
            return
        }

        this.undoStack.push(newValue)
        this.currentIntervalLength = 0
    }

    /* event handlers */

    onPaste(event: ClipboardEvent) {
        // don't allow formatted pasted content
        const pastedText = event.clipboardData!.getData('text/plain')
        const target = event.target as HTMLElement
        event.preventDefault()

        if (!pastedText) return

        // place the pasted text in the appropriate cursor position of prev value
        let preVal = target.innerText
        let { start, end } = getContentEditableSelectionRange(target)
        let newValue       = preVal.slice(0, start) + pastedText + preVal.slice(end)
        newValue           = newValue.substring(0, this.maxLength)

        target.innerHTML = newValue
        this.valLength = target.innerText.length

        // move the cursor ups
        const newcaretPos = start + pastedText.length
        // setCursorPos(target, newcaretPos)
        this.undoHandler(newValue)
        
        // save
        this.updateTextEditorVal(event, newValue)
    }

    
    onInputHandler(e: Event) {
        const event = e as InputEvent
        const target = event.target as HTMLElement

        // allow paste handler to handle
        if (event.inputType === "insertFromPaste") { 
            return
        }
        // keep under max length
        if (target.innerText.length > this.maxLength) {
            target.innerHTML = this.value

            this.undoHandler(this.value)
            setCursorPos(target, this.value.length)

            return
        }

        const newValue = target.innerHTML
        this.valLength = target.innerText.length

        this.undoHandler(newValue)
        this.updateTextEditorVal(event, newValue)
    }
    
    onFocusHandler(event: Event) {
        const target = event.target as HTMLElement
        this.valLength = target.innerText.length

        // this.updateCaretStyle({ doShow: true })
        super.onFocusHandler(event)
    }

    onBlurHandler(event: FocusEvent): void {
        const value = this.value || (this.doAllowEmpty ? "" : "Untitled")
        
        // this.updateCaretStyle({ doShow: false })

        this.updateState({ oldTitle: value })
        this.updateTextEditorVal(event, value)

        if (this.handlers?.onBlurHandler) {
            this.handlers?.onBlurHandler(event, value, this.valLength)
        }
    }

    /* helpers */
    updateState(newState: Partial<TextEditorManager>) {
        this.state.update((state: TextEditorManager) => {
            state.oldTitle = newState.oldTitle ?? state.oldTitle
            state.value   = newState.value ?? state.value

            this.oldTitle = state.oldTitle
            this.value = state.value

            return state
        })
    }

    updateText(text: string) {
        this.value = text
        this.updateState({ value: text })

        this.inputElem!.innerHTML = text
    }

    updateTextEditorVal(event: Event, newVal: string, doUpdatecaretPos = false) {
        // if empty, <br> will appear which will not show the place holder
        if (newVal === "<br>") {
            newVal = ""
            this.inputElem!.innerHTML = ""
            this.inputElem!.innerText = ""
        }

        this.value = newVal
        this.updateState({ value: newVal })
        

        if (doUpdatecaretPos) {
            // this.inputElem!.innerHTML = newVal
            // setCursorPos(this.inputElem!, newVal.length)
        }
        if (this.handlers?.onInputHandler) {
            this.handlers.onInputHandler(event, newVal, this.valLength)
        }
    }

    keydownHandler = (event: KeyboardEvent) => {
        const { ctrlKey, metaKey, key, shiftKey } = event
        const formatted = metaKey && ['b', 'i', 'u'].includes(key)
        const undoRedo  = (ctrlKey || metaKey) && key === "z"
        const arrows = ["ArrowRight", "ArrowLeft"].includes(key)

        if (arrows && !shiftKey) {
            // this.getCaretPos()
        }
        if (arrows && shiftKey) {
            // this.updateCaretStyle({ doShow: false })
        }
        if (!this.allowFormatting && formatted) {
            event.preventDefault()
        }
        if (undoRedo) {
            event.preventDefault()
            shiftKey ? this.redoEdit(event) : this.undoEdit(event)
        }
    }

    initElem() {
        const elem = getElemById(this.id)!
        if (!elem) return

        this.inputElem = elem
    
        // const parentElem = elem.parentElement as HTMLElement
        // this.caretElem = parentElem.querySelector(".text-editor-caret")
        // this.updateCaretStyle({ doShow: true })

        this.inputElem.addEventListener("keydown", (ke) => this.keydownHandler(ke))
        // this.inputElem.addEventListener("keyup", (ke) => this.keydownHandler(ke))
        // this.inputElem.addEventListener("pointerdown", () => this.getCaretPos())
        // this.inputElem.addEventListener("pointerup", () => this.getCaretPos( )

        if (this.placeholder) {
            this.inputElem.setAttribute("data-placeholder", this.placeholder)
        }

        // initialize text
        this.value = this.value
        this.updateState({ value: this.value })
    }

    quit() {
        this.inputElem!.removeEventListener("keydown", this.keydownHandler)
    }
}

export class TimeInputManager extends InputManager {
    min = 0
    max = 1440

    constructor(options: TimeInputOptions) {
        super(options)

        this.state = writable(this)

        this.min = options.min ?? this.min
        this.max = options.max ?? this.max
    }

    onInputHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        this.updateVal(event, inputElem.value)
    }

    onBlurHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        const value = inputElem.value

        try {
            const timeInput = clamp(this.min, TimeInputManager.validateTimeInput(value), this.max)
            this.updateVal(event, minsFromStartToHHMM(timeInput, false))

            if (this.handlers?.onBlurHandler) { 
                this.handlers!.onBlurHandler(event, timeInput)
            }
        }
        catch (error: any) {
            if (this.handlers?.onError) this.handlers!.onError(error)

            this.updateVal(event, this.oldTitle)
        }
    }

    /**
     * Get the total minutes from hours and minutes
     * @param hhNum 
     * @param mmNum 
     * @param isAM 
     * @returns 
     */
    static minsFromHHMM(hhNum: number, mmNum: number, isAM = false) {
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

    static isAM(hh: number, stringInput: string) {
        if (hh === 24 || hh === 0) return true
        if (hh >= 13) return false

        const containsAMPM = /am|pm/i.test(stringInput)
        return containsAMPM ? /am/i.test(stringInput) : hh <= 11
    }

    static validateTimeInput(val: string) {
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
}
