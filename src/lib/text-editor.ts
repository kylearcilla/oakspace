import { getElemById, setCursorPos } from "./utils-general"


/**
 * Manager for editor components with contenteditable attribute.
 * Has a set max height and will disallow additions if it goes over.
 * Custom functionality for redo / undo and copy paste.
 */
export class TextEditorManager {
    oldTitle: string
    value: string 
    valLength = 0
    id: string 
    maxLength: number
    inputElem?: HTMLElement
    placeholder?: string
    isValidValue = true
    doAllowEmpty: boolean
    defaultText: string
    handlers?: {
        onInputHandler?: FunctionParam
        onBlurHandler?: FunctionParam
        onFocusHandler?: FunctionParam
        onError?: FunctionParam
    }
    allowFormatting: boolean
    allowBlurOnClickAway: boolean
    singleLine: boolean

    elemInit = false
    focused = false
    DEFAULT_MAX_LENGTH = 20

    currFormat: "bold" | "code" | null = null
    prevFormat: "bold" | "code" | null = null

    constructor(options: InputOptions & { 
        allowFormatting?: boolean, 
        allowBlurOnClickAway?: boolean,
        singleLine?: boolean
    }) {
        this.oldTitle = options.initValue || ""
        this.maxLength = options.maxLength ?? this.DEFAULT_MAX_LENGTH
        this.value = options.initValue ?? ""
        this.defaultText = options.defaultText ?? "Untitled"
        this.id = options.id ?? ""
        this.placeholder = options.placeholder
        this.handlers = options.handlers
        this.doAllowEmpty = options.doAllowEmpty ?? true
        this.allowFormatting = options.allowFormatting ?? false
        this.allowBlurOnClickAway = options.allowBlurOnClickAway ?? true
        this.singleLine = options.singleLine ?? false
        
        requestAnimationFrame(() => this.initElem())
    }

    /**
     * Get the aboslute cursor position. 
     * @returns The cursor position.
     */
    getCursorPos() {
        let currentPos = 0
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0)
        const startContainer = range?.startContainer
  
        function getPosition(node: Node): number {
            if (node === startContainer) {
                return currentPos + (range?.startOffset || 0)
            }
            if (node.nodeType === Node.TEXT_NODE) {
                currentPos += node.textContent?.length || 0
            }

            // check element to navigate nested text nodes
            for (const child of Array.from(node.childNodes)) {
                const pos = getPosition(child)
                if (pos !== -1) return pos
            }
            return -1
        }

        return getPosition(this.inputElem!) || 0
    }

    /* event handlers */
    onPaste(event: ClipboardEvent) {
        const target = event.target as HTMLElement
        const plainText = event.clipboardData!.getData('text/plain')
        event.preventDefault()

        if (!plainText || (plainText.length + this.valLength) > this.maxLength) {
            return
        }
        
        let node: HTMLElement | Node
        if (this.allowFormatting) {
            node = this.parsePastedHTML(event.clipboardData!.getData('text/html'))
        }
        else {
            node = document.createTextNode(plainText)
        }

        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            
            if (this.allowFormatting) {
                [...(node as HTMLElement).childNodes].forEach((child) => {
                    range.insertNode(child)
                    range.setStartAfter(child) 
                    range.setEndAfter(child)
                })
            } 
            else {
                range.insertNode(node)
                const newRange = document.createRange()
                newRange.setStartAfter(node)  
                newRange.setEndAfter(node)
                selection.removeAllRanges()
                selection.addRange(newRange)
            }
        }
        
        this.valLength = target.innerText.length
        this.inputElem!.normalize()
        this.updateTextEditor(event, target.innerHTML)
    }

    /**
     * Parses the provided HTML string and processes the nodes within it.
     * This function cleans up any inline styles or attributes.
     * 
     * @param   data The HTML string to parse.
     * @returns The container element with the processed content.
     */
    parsePastedHTML(data: string) {
        const doc = new DOMParser().parseFromString(data, 'text/html')
        const container = doc.body
    
        const processNode = (node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const elem = node as HTMLElement

                if (['strong', 'b', 'i', 'em', 'code'].includes(elem.tagName.toLowerCase())) {
                    elem.removeAttribute("inline")
                    elem.removeAttribute("style")
                } 
                else {
                    const textNode = document.createTextNode(elem.textContent || '')
                    elem.replaceWith(textNode)
                }
            }
            for (let child of node.childNodes) {
                processNode(child)
            }
        }
        processNode(container)
        return container
    }
    
    onInputHandler(e: Event) {
        const event = e as InputEvent
        const target = event.target as HTMLElement
        e.preventDefault()
        

        // allow paste handler to handle
        if (event.inputType === "insertFromPaste") { 
            return
        }
        // keep under max length
        if (target.textContent!.length > this.maxLength) {
            target.innerHTML = this.value

            setCursorPos(target, this.value.length)
            return
        }

        this.updateTextEditor(event, target.innerHTML)
        this.inputElem!.normalize()

    }

    focus() {
        this.inputElem?.focus()
        this.focused = true
    }
    
    onFocusHandler(event: Event) {
        const target = event.target as HTMLElement
        this.valLength = target.innerText.length
        this.focused = true

        if (this.handlers?.onFocusHandler) {
            this.handlers.onFocusHandler(event, this.value, this.valLength)
        }
    }

    onBlurHandler(event: FocusEvent | null, force?: boolean) {
        this.focused = false

        if (!this.allowBlurOnClickAway && !force && event) {
            event.preventDefault()
            return
        }
        if (this.value === undefined) {
            return
        }

        let value = this.value

        if (!this.value && !this.doAllowEmpty && this.defaultText && this.inputElem) {
            value = this.defaultText
            this.inputElem.innerHTML = this.defaultText
        }

        this.updateTextEditor(event, value)

        if (this.handlers?.onBlurHandler) {
            this.handlers?.onBlurHandler(event, value, this.valLength)
        }
    }

    updateText(text: string) {
        if (!this.inputElem && !this.initElem()) {
            return
        }
        this.value = text
        this.inputElem!.innerHTML = text
    }

    private updateTextEditor(event: Event | null, rawVal: string) {
        if (rawVal === undefined) return
        const elem = this.inputElem!
        const formatted = this.allowFormatting
        
        // if empty, <br> will appear which will not show the empty placeholder
        if (rawVal === "<br>") {
            rawVal = ""
            elem.innerHTML = ""
            elem.innerText = ""
        }
        
        this.valLength = elem.textContent!.length
        this.value = formatted ? rawVal : elem.textContent!
        
        if (this.handlers?.onInputHandler) {
            this.handlers.onInputHandler(event, this.value, this.valLength)
        }
    }

    updateClientOnFormat() {
        this.value = this.inputElem!.innerHTML

        if (this.handlers?.onInputHandler) {
            this.handlers.onInputHandler(null, this.value, this.inputElem!.innerText.length)
        }
    }

    /* helpers */
    keydownHandler = (ke: KeyboardEvent) => {
        const { ctrlKey, metaKey, key, shiftKey } = ke
        const formatting = metaKey && ['b', 'e', 'i', 'u'].includes(key)
        const target = ke.target as HTMLElement

        if (this.id != target.id || !this.focused) {
            return
        }
        if (!shiftKey && key === "Enter") {
            // this.onBlurHandler(null, true)
            return
        }
    }

    /**
    * Extracts the actual printable character from a KeyboardEvent.
    * Uses a temporary input to simulate and capture the character.
    * @param event
    */
    getPrintableCharacter(event: KeyboardEvent) {
        const { metaKey, ctrlKey } = event
        if (metaKey || ctrlKey) {
            return null
        }
        if (event.key.length === 1) {
            return event.key
        }
       
       // HUses a temporary input to simulate and capture the character.
        try {
            const tempInput = document.createElement('input')
            tempInput.type = 'text'
            
            const keyboardEvent = new KeyboardEvent('keypress', {
                key: event.key,
                bubbles: true,
                cancelable: true,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey
            })
            
            tempInput.dispatchEvent(keyboardEvent)
            tempInput.remove()

            return tempInput.value || null
        } 
        catch {
            return null
        }
    }

    manuallySelectText(element: HTMLElement | Text, startOffset: number, endOffset: number) {
        const range = document.createRange()
        const selection = window.getSelection()

        if (element.nodeType === Node.TEXT_NODE) {
            range.setStart(element, startOffset)
            range.setEnd(element, endOffset)
        } 
        else if (element.nodeType === Node.ELEMENT_NODE && element.firstChild?.nodeType === Node.TEXT_NODE) {
            range.setStart(element.firstChild, startOffset)
            range.setEnd(element.firstChild, endOffset)
        } 
    
        selection?.removeAllRanges()
        selection?.addRange(range)
    }

    /**
     * Initializes the input element with event listeners and other properties.
     * @returns The set input element.
     */
    initElem() {
        const elem = getElemById(this.id)
        if (!elem) {
            return null
        }
        if (this.elemInit) {
            return this.inputElem
        }

        this.inputElem = elem
        this.inputElem.addEventListener("keydown", (ke) => this.keydownHandler(ke))
        this.inputElem.addEventListener("input", (e) => this.onInputHandler(e))
        this.inputElem.addEventListener("blur", (e) => this.onBlurHandler(e))
        this.inputElem.addEventListener("focus", (e) => this.onFocusHandler(e))
        this.inputElem.addEventListener("paste", (e) => this.onPaste(e))
        this.inputElem.addEventListener("dragstart", (e) => e.preventDefault())

        if (this.placeholder) {
            this.inputElem.setAttribute("data-placeholder", this.placeholder)
        }
        this.inputElem.setAttribute("data-formatting", this.allowFormatting + "")
        
        // initialize text
        this.value = this.value
        this.elemInit = true

        return this.inputElem
    }

    quit() {
        this.inputElem!.removeEventListener("keydown", this.keydownHandler)
    }
}