import { get, writable, type Writable } from "svelte/store"
import { globalContext } from "./store"
import { getElemById } from "./utils-general"

/**
 * General purpose input manager.
 */
export class InputManager {
    placeholder: string
    oldTitle: string
    value: string 
    id: string 
    maxLength: number
    state: Writable<InputManager>
    inputElem: HTMLInputElement | null = null

    DEFAULT_MAX_LENGTH = 20

    constructor(options: InputOptions) {
        this.oldTitle  = options.initValue
        this.maxLength = options.maxLength ?? this.DEFAULT_MAX_LENGTH
        this.value = options.initValue
        this.placeholder = options.placeholder
        this.id = options.id ?? ""

        this.state = writable(this)

        requestAnimationFrame(() => {
            if (this.id) {
                this.inputElem = getElemById(this.id) as HTMLInputElement
            }
        })
    }

    updateState(newState: Partial<InputManager>) {
        this.state.update((state) => {

            state.placeholder = newState.placeholder ?? state.placeholder
            state.oldTitle = newState.oldTitle ?? state.oldTitle
            state.value = newState.value ?? state.value

            this.placeholder = state.placeholder
            this.oldTitle = state.oldTitle
            this.value = state.value

            return state
        })
    }

    onClickHandler(event: Event) {
    }
    onInputHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        this.updateState({ value: inputElem.value })
    }
    onFocusHandler(event: Event) {

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
 * Manager for editors with contenteditable attribute.
 */
export class TextEditorManager extends InputManager {
    constructor(options: InputOptions) {
        super(options)

        // editor values always comes form value member
        if (!this.value) {
            this.value = this.placeholder
            this.updateState({ value: this.value })
        }
    }

    onClickHandler(event: Event) {
        if (this.value != this.placeholder) return

        this.updateState({ value: "" })
    }
    onInputHandler(event: Event) {
        const target = event.target as HTMLElement
        this.updateState({ value: target.innerHTML ?? "" })
    }
    onBlurHandler(event: Event): void {
        const target = event.target as HTMLInputElement 
        const value = target.innerHTML ?? ""
        const lastKeysPressed = get(globalContext).lastKeysPressed

        if (lastKeysPressed.keyCode === "Escape") {
            this.updateState({ value: this.oldTitle })
        }
        else {
            this.updateState({ 
                value: value || this.placeholder, 
                oldTitle: value 
            })
        }
    }
}