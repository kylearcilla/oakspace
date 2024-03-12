import { get, writable, type Writable } from "svelte/store"
import { globalContext } from "./store"
import { getContentEditableSelectionRange, getElemById, setCursorPos } from "./utils-general"

/**
 * General purpose input manager.
 */
export class InputManager {
    oldTitle: string
    value: string 
    id: string 
    maxLength: number
    state: Writable<InputManager>
    inputElem?: HTMLInputElement
    placeholder: string
    prevVal: string
    handlers?: {
        onInputHandler?: FunctionParam
        onBlurHandler?: FunctionParam
        onFocusHandler?: FunctionParam
    }

    DEFAULT_MAX_LENGTH = 20

    constructor(options: InputOptions) {
        this.oldTitle  = options.initValue
        this.maxLength = options.maxLength ?? this.DEFAULT_MAX_LENGTH
        this.value = options.initValue
        this.id = options.id ?? ""
        this.placeholder = options.placeholder
        this.handlers = options.handlers
        this.prevVal = options.initValue

        this.state = writable(this)

        requestAnimationFrame(() => {
            this.initElem()
                this.inputElem = getElemById(this.id) as HTMLInputElement
        })
    }

    onPaste(e: Event) {
        console.log(e)
    }

    initElem() {
        this.inputElem = getElemById(this.id) as HTMLInputElement

        // attach placeholder
        this.inputElem.style.setProperty('--placeholder-val', this.placeholder);
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
        this.updateState({ value: inputElem.value })
    }
    onFocusHandler(event: Event) {
        if (this.handlers?.onFocusHandler) {
            this.handlers?.onFocusHandler(event)
        }
    }
    onBlurHandler(event: Event) {
        const target = event.target as HTMLInputElement 
        const value = target.value
        const lastKeysPressed = get(globalContext).lastKeysPressed

        if (lastKeysPressed.keyCode === "Escape") {
            this.updateState({ value: this.oldTitle })
        }
        else {
            this.updateState({ 
                value: value, 
                oldTitle: value 
            })
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
    undoStack: string[] = []
    redoStack: string[] = []
    currentIntervalLength = 0

    UNDO_INTERVAL_LENGTH_THRSHOLD = 30

    constructor(options: InputOptions) {
        super(options)

        requestAnimationFrame(() => {
            this.inputElem!.addEventListener("keydown", this.keydownHandler)
        })

        // editor values always comes form value member
        if (!this.value) {
            this.updateState({ value: this.value })
        }
    }

    quit() {
        this.inputElem!.removeEventListener("keydown", this.keydownHandler)
    }

    keydownHandler = (event: KeyboardEvent) => {
        if ((!event.ctrlKey && !event.metaKey) || event.key != "z") {
            return
        }

        event.preventDefault()
        event.shiftKey ? this.redoEdit() : this.undoEdit()
    }

    redoEdit() {
        if (this.redoStack.length === 0) return

        if (this.value) {
            this.undoStack.push(this.value)
        }

        const recentUndo = this.redoStack.pop()!
        this.updateVal(recentUndo, true)
    }
    
    undoEdit() {
        this.redoStack.push(this.value)

        const recentEdit = this.undoStack.pop() ?? ""
        this.updateVal(recentEdit, true)
    }

    undoHandler(newValue: string) {
        const recentEditLength = this.undoStack[this.undoStack.length - 1]?.length ?? 0
        this.currentIntervalLength = Math.abs(recentEditLength - newValue.length)

        if (this.currentIntervalLength < this.UNDO_INTERVAL_LENGTH_THRSHOLD) {
            return
        }

        this.undoStack.push(newValue)
        this.currentIntervalLength = 0
    }

    updateVal(newVal: string, doUpdateCursorPos = false) {
        this.prevVal = this.value
        this.value = newVal
        this.updateState({ value: newVal })

        if (this.handlers?.onInputHandler) {
            this.handlers?.onInputHandler(newVal)
        }
        if (doUpdateCursorPos) {
            this.inputElem!.innerHTML = newVal
            setCursorPos(this.inputElem!, newVal.length)
        }
    }

    onPaste(event: ClipboardEvent) {
        // don't allow formatted pasted content
        const pastedText = event.clipboardData!.getData('text/plain')
        const target = event.target as HTMLElement
        event.preventDefault()

        if (!pastedText) return

        // current val will contain the pasted content, use pre val
        let { start, end } = getContentEditableSelectionRange(target)
        let newValue       = this.prevVal.slice(0, start) + pastedText + this.prevVal.slice(end)
        newValue = newValue.substring(0, this.maxLength)

        target.innerHTML = newValue

        // move the cursor ups
        const newCursorPos = start + pastedText.length
        setCursorPos(target, newCursorPos)

        this.undoHandler(newValue)
        
        // save
        this.updateVal(newValue)
    }

    onInputHandler(event: InputEvent) {
        const target = event.target as HTMLElement
        
        // allow paste handler to handle
        if (event.inputType === "insertFromPaste") { 
            target.innerHTML = this.prevVal
            return
        }

        if (target.innerText.length === this.maxLength) {
            target.innerHTML = this.prevVal
            setCursorPos(target, this.prevVal.length)
            return
        }

        const newValue = target.innerHTML
        this.undoHandler(newValue)
        this.updateVal(newValue)
    }
    onBlurHandler(event: Event): void {
        const value = this.value
        const lastKeysPressed = get(globalContext).lastKeysPressed

        if (lastKeysPressed.keyCode === "Escape") {
            this.updateVal(this.oldTitle)
        }
        else {
            this.updateState({ oldTitle: value })
            this.updateVal(value)
        }

        if (this.handlers?.onBlurHandler) {
            this.handlers?.onBlurHandler(event)
        }
    }
}