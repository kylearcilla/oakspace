import { writable, type Writable } from "svelte/store"

import { minsFromStartToHHMM } from "./utils-date"
import { clamp, extractNumStr, getElemById, isInRange, setCursorPos } from "./utils-general"

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
    defaultText?: string
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
        this.value = options.initValue ?? ""
        this.defaultText = options.defaultText ?? "Untitled"
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
    onBlurHandler(event: Event | null) {
        const value = !this.value ? (this.doAllowEmpty ? "" : "Untitled") : this.value
        
        this.updateState({ oldTitle: value })
        this.updateVal(event!, value)

        if (this.handlers?.onBlurHandler) {
            this.handlers?.onBlurHandler(event, value)
        }
    }
}

/**
 * Manager for editor components with contenteditable attribute.
 * Has a set max height and will disallow additions if it goes over.op[ro]
 * Custom functionality for redo / undo and copy paste/
 */
export class TextEditorManager extends InputManager {
    elemInit = false
    allowFormatting: boolean
    allowBlurOnClickAway: boolean
    focused = false

    currFormat: "bold" | "code" | null = null
    prevFormat: "bold" | "code" | null = null

    undoStack: { length: number, content: string, pos: number }[] = []
    redoStack: { length: number, content: string, pos: number }[] = []

    UNDO_EDIT_MIN_DIST_FROM_PREV = 15
    MAX_UNDO_STACK_SIZE = 20

    constructor(options: InputOptions & { allowFormatting?: boolean, allowBlurOnClickAway?: boolean }) {
        super(options)
        this.allowFormatting = options.allowFormatting ?? false
        this.allowBlurOnClickAway = options.allowBlurOnClickAway ?? true

        requestAnimationFrame(() => this.initElem())
    }

    /* undo / redo */
    redoEdit() {
        if (this.redoStack.length === 0) {
            return
        }
        const recentUndo = this.redoStack.pop()!
        const pos = this.getCursorPos()

        this.undoStack.push({
            length: this.inputElem!.innerText.length,
            content: this.inputElem!.innerHTML,
            pos
        })
        this.setInputElem(recentUndo.content, recentUndo.pos)
    }
    undoEdit() {
        if (this.undoStack.length === 0) {
            return
        }
        let recentEdit = this.undoStack.pop()!
        const pos = this.getCursorPos()

        this.redoStack.push({
            length: this.inputElem!.innerText.length,
            content: this.inputElem!.innerHTML,
            pos
        })
        while (recentEdit.content === this.inputElem!.innerHTML && this.undoStack.length > 0) {
            recentEdit = this.undoStack.pop()!
        }

        this.setInputElem(recentEdit.content, recentEdit.pos)
    }

    /**
     * Runs after any change. 
     * Saves current version when far enough from last edit (length) and puts in in the undo stack.
     */
    undoHandler() {
        this.redoStack = []
        const currText = this.inputElem!.innerText
        const content = this.inputElem!.innerHTML
        const pos = this.getCursorPos()
        const length = currText.length

        if (this.undoStack.length === 0) {
            this.undoStack.push({
                length, content, pos
            })
            return
        }

        const recentEdit = this.undoStack[this.undoStack.length - 1]
        const prevEditDist = Math.abs(recentEdit.length - currText.length)

        if (prevEditDist < this.UNDO_EDIT_MIN_DIST_FROM_PREV) {
            return
        }

        this.undoStack.push({
            length, content, pos
        })
        if (this.undoStack.length > this.MAX_UNDO_STACK_SIZE) {
            this.undoStack.shift()
        }
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
  
        function getCursorPosition(node: Node): number {
            if (node === startContainer) {
                return currentPos + (range?.startOffset || 0)
            }
            if (node.nodeType === Node.TEXT_NODE) {
                currentPos += node.textContent?.length || 0
            }

            // check element to navigate nested text nodes
            for (const child of Array.from(node.childNodes)) {
                const pos = getCursorPosition(child)
                if (pos !== -1) return pos
            }
            return -1
        }

        return getCursorPosition(this.inputElem!) || 0
    }

    /**
     * Set the input element's content and cursor position.
     * @param content The new content.
     * @param pos    The absolute cursor position.
     */
    setInputElem(content: string, pos: number) {
        this.inputElem!.innerHTML = content

        const selection = window.getSelection()
        if (!selection) return

        let currentPos = 0, targetOffset = 0
        let targetNode: Node | null = null

        // find the node and relative cursor position given the absolute positions
        function walkTextNodes(node: Node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const length = node.textContent?.length || 0
                const isInNode = isInRange(currentPos, pos, currentPos + length)

                // cursor is in this node
                if (isInNode) {
                    targetNode = node
                    targetOffset = pos - currentPos
                    return true
                }
                currentPos += length
            } 
            // check nested text nodes
            else {
                for (const child of Array.from(node.childNodes)) {
                    if (walkTextNodes(child)) return true
                }
            }
            return false
        }
        walkTextNodes(this.inputElem!)

        // set the cursor position
        const range = document.createRange()
        if (targetNode) {
            range.setStart(targetNode, targetOffset)
            range.setEnd(targetNode, targetOffset)
        }
        else {
            range.selectNodeContents(this.inputElem!)
            range.collapse(false)
        }

        selection.removeAllRanges()
        selection.addRange(range)
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
        this.undoHandler()
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
        if (target.innerText.length > this.maxLength) {
            target.innerHTML = this.value

            this.undoHandler()
            setCursorPos(target, this.value.length)

            return
        }

        const newValue = target.innerHTML
        this.valLength = target.innerText.length

        this.undoHandler()
        this.updateTextEditor(event, newValue)

        this.inputElem!.normalize()
        this.removeFontWrapper()
    }

    focus() {
        this.inputElem?.focus()
        this.focused = true
    }
    
    onFocusHandler(event: Event) {
        const target = event.target as HTMLElement
        this.valLength = target.innerText.length
        this.focused = true

        if (this.undoStack.length === 0) {
            requestAnimationFrame(() => this.undoHandler())
        }

        super.onFocusHandler(event)
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
            this.inputElem.innerText = this.defaultText
        }

        this.updateTextEditor(event, value)

        if (this.handlers?.onBlurHandler) {
            this.handlers?.onBlurHandler(event, value, this.valLength)
        }
    }

    /* formatting  */
    formattingHandler(ke: KeyboardEvent) {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return
        const { key } = ke

        if (key === "e") {
            this.currFormat = "code"
        }
        else if (key === "b") {
            this.currFormat = "bold"
        }
        if (selection.isCollapsed) {
            return
        } 
        else {
            this.formatText()
        }

        this.updateClientOnFormat()
        this.currFormat = null
    }

    formatText() {
        const selection = window.getSelection()!
        const range = selection.getRangeAt(0)

        if (range!.toString().trim() === "") return

        if (this.isSelectionFullyInWrapper(range)) {
            // text if fully wrapped already
            this.removeFormat(range)
        } 
        else if (this.isSelectionWithinWrapper(range)) {
            // text partially wrapped
            this.extendFormatWrapper(range)
        } 
        else {
            // free text, wrap it
            this.formatFreeText(range)
        }

        selection?.removeAllRanges()
    }

    wrapCaretWithFormat(typedCharacter: string | null) {
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0)
    
        if (!range || !typedCharacter) return
    
        const wrapper = this.createFormatWrapper(typedCharacter)         
        range.deleteContents()    
        range.insertNode(wrapper)
    
        const newRange = document.createRange()
        newRange.setStart(wrapper, typedCharacter.length) 
        newRange.setEnd(wrapper, typedCharacter.length)
        selection?.removeAllRanges()
        selection?.addRange(newRange)
    }

    /* wrapper validation */
    isSelectionWithinWrapper(range: Range): boolean {
        const startNode = range.startContainer
        const endNode = range.endContainer
        return this.isNodeWithinWrapper(startNode) || this.isNodeWithinWrapper(endNode)
    }
    
    isSelectionFullyInWrapper(range: Range): boolean {
        const startNode = range.startContainer
        const endNode = range.endContainer
        return this.isNodeWithinWrapper(startNode) && this.isNodeWithinWrapper(endNode)
    }
    
    isNodeWithinWrapper(node: Node): boolean {
        if (!node || !node.parentElement) return false

        const tag = node.parentElement.tagName.toLowerCase()

        if (this.currFormat === 'code') {
            return ['code', 'em'].includes(tag)
        } 
        else if (this.currFormat === 'bold') {
            return ['strong', 'b'].includes(tag)
        } 
        else {
            return false
        }
    }

    /* format actions */
    /**
     * Wrap free text in format wrapper element.
     * @param range 
     */
    formatFreeText(range: Range) {
        const selectedText = range.toString()
        const wrapper = this.createFormatWrapper(selectedText)
        
        range.deleteContents()
        range.insertNode(wrapper)
        
        requestAnimationFrame(() => {
            this.manuallySelectText(wrapper, 0, selectedText.length)
        })
    }

    /**
     * Wrap text whose head or tail segemnts is part of anoter wrapped element.
     * @param range 
     */
    extendFormatWrapper(range: Range) {
        const startNode = range.startContainer
        const endNode = range.endContainer

        let existingWrapper: HTMLElement | null = null
        let nbrDirection: "head" | "tail" 
        let headNbrLastIdx = -1
    
        // find which side has already part of the wrapper
        if (this.isNodeWithinWrapper(startNode)) {
            existingWrapper = startNode.parentElement as HTMLElement
            nbrDirection = "head"

            const childNodes = Array.from(existingWrapper.childNodes)
            for (let i = 0; i < childNodes.length; i++) {
                const currentNode = childNodes[i]
                if (currentNode.nodeType != Node.TEXT_NODE) continue

                const currentText = (currentNode as Text).textContent || ""
                const startOffset = range.startOffset
                if (range.startContainer === currentNode) {
                    headNbrLastIdx = startOffset
                } 
                else {
                    headNbrLastIdx = currentText.length
                }
            }
        } 
        else if (this.isNodeWithinWrapper(endNode)) {
            existingWrapper = endNode.parentElement as HTMLElement
            nbrDirection = "tail"
        }

        // Get the head or tail segment and include it in the wrapper element
        const selectedText = range.toString()
        let headText = "", tailText = ""
        
        if (nbrDirection! === "head") {
            headText = existingWrapper!.textContent?.substring(0, range.startOffset) || ""
        }
        else {
            tailText = existingWrapper!.textContent?.substring(range.endOffset) || ""
        }

        existingWrapper!.parentElement?.removeChild(existingWrapper!)
        const wrapper = this.createFormatWrapper(headText + selectedText + tailText)!

        // Insert the new wrapper at the correct position
        range.deleteContents()
        range.insertNode(wrapper)

        requestAnimationFrame(() => {
            let sOffset = nbrDirection! === "tail" ? 0 : headNbrLastIdx
            let length  = nbrDirection! === "tail" ? selectedText.length : selectedText.length + headNbrLastIdx
            this.manuallySelectText(wrapper, sOffset, length)
        })
    }

    /**
     * Unwrap an element that has already been wrapped.
     * Close wraps of neighbos if they exist.
     * @param range 
     */
    removeFormat(range: Range) {
        const startNode = range.startContainer
        const parentSpan = startNode.parentElement as HTMLElement
    
       // Get the start and end of the selection relative to the wrapper
        const selectedText = range.toString()
        const leftText = parentSpan.textContent?.substring(0, range.startOffset) || ""
        const rightText = parentSpan.textContent?.substring(range.endOffset) || ""

        parentSpan.remove()
        range.deleteContents()

        if (rightText) {
            const rightWrapper = this.createFormatWrapper(rightText)
            range.insertNode(rightWrapper)
        }

        const selectedTextNode = document.createTextNode(selectedText)
        range.insertNode(selectedTextNode)

        if (leftText) {
            const leftWrapper = this.createFormatWrapper(leftText)
            range.insertNode(leftWrapper)
        }

        requestAnimationFrame(() => {
            this.manuallySelectText(selectedTextNode!, 0, selectedText.length)
        })
    }

    /**
     * Inserts a text after user has formatted with no text selected.
     * Succeededing text should be formatted unless user has closed an existing wrapper.
     * 
     * @param ke
     * @param insert - Determines whether the text should be inserted inside or outside of a format wrapper
     * 
     */
    emptyFormatInsert(ke: KeyboardEvent, insert: "inside" | "outside") {
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0)
        const text = this.getPrintableCharacter(ke)
        
        let node: Node | HTMLElement
        if (!text || !range) return

        if (insert === "inside") {
            node = this.createFormatWrapper(text)
            range.deleteContents()
            range.insertNode(node)

            this.prevFormat = this.currFormat
            this.currFormat = null
        }
        else {
            const currentNode = range.startContainer.parentElement!
            if (!["CODE", "STRONG"].includes(currentNode.tagName)) return

            node = document.createTextNode(text)
            currentNode.after(node)
            range.deleteContents()
        }

        const newRange = document.createRange()
        newRange.setStart(node, 1) 
        newRange.setEnd(node, 1)   
    
        selection?.removeAllRanges()
        selection?.addRange(newRange)


        this.updateClientOnFormat()
    }

    /**
     * Create a format wrapper element to format a segment of text.
     * @param text   Text content of the element.
     * @returns      Wrapper element.
     */
    createFormatWrapper(text: string) {
        let wrapper: HTMLElement;

        if (this.currFormat === 'code') {
            wrapper = document.createElement("code")
        } 
        else if (this.currFormat === 'bold') {
            wrapper = document.createElement("strong")
        } 
        else {
            wrapper = document.createElement("span")
        }
    
        wrapper.textContent = text
        return wrapper;
    }

    /**
     * remove font element that is added after a formatted text node is removed
     */
    removeFontWrapper() {
        const fonts = this.inputElem!.querySelectorAll('font')
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0)
        const caretPosition = range ? range.startOffset : null

        if (fonts.length === 0) return

        // span element exists under font
        fonts.forEach(font => {
            const span = font.querySelector('span')
            if (span) {
                font.replaceWith(...span.childNodes)
            } 
            else {
                font.replaceWith(...font.childNodes)
            }
        })

        // after removal caret will be behind
        if (selection && caretPosition !== null && range) {
            const newRange = document.createRange()
            newRange.setStart(range.startContainer, caretPosition)
            newRange.setEnd(range.endContainer, caretPosition)

            selection.removeAllRanges()
            selection.addRange(newRange)
        }
    }

    updateText(text: string) {
        if (!this.inputElem && !this.initElem()) {
            return
        }
        this.value = text
        this.inputElem!.innerHTML = text
        this.undoStack = []
        this.redoStack = []
    }

    private updateTextEditor(event: Event | null, newVal: string) {
        if (newVal === undefined) return
        
        // if empty, <br> will appear which will not show the place holder
        if (newVal === "<br>") {
            newVal = ""
            this.inputElem!.innerHTML = ""
            this.inputElem!.innerText = ""
        }

        this.value = newVal
        this.updateState({ value: newVal })
        
        if (this.handlers?.onInputHandler) {
            this.handlers.onInputHandler(event, newVal, this.valLength)
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
        const customFormatting = formatting && (key === "b" || key === "e")
        const undoRedo  = metaKey && key === "z"
        const target = ke.target as HTMLElement
        const cmd = ctrlKey || metaKey

        let emptyFormat = !!this.currFormat

        if (this.id != target.id || !this.focused) {
            return
        }
        if (!shiftKey && key === "Enter") {
            this.onBlurHandler(null, true)
            return
        }
        if (!this.allowFormatting && formatting) {
            ke.preventDefault()
        }
        if (this.allowFormatting && customFormatting) {
            ke.preventDefault()
        }
        if (undoRedo) {
            ke.preventDefault()
            shiftKey ? this.redoEdit() : this.undoEdit()
        }

        // empty formatted, typed and formatted (same) again
        if (emptyFormat && this.prevFormat === this.currFormat) {
            this.currFormat = null
            this.prevFormat = null

            ke.preventDefault()
            this.emptyFormatInsert(ke, "outside")
            return
        }
        // empty formatted twice without typing anything
        if (emptyFormat && (customFormatting || cmd)) {
            this.currFormat = null
            return
        }
        // empty formatted and typing
        if (emptyFormat) {
            ke.preventDefault()
            this.emptyFormatInsert(ke, "inside")
            return
        }
        /* formatting */
        if (this.allowFormatting && customFormatting) {
            this.formattingHandler(ke)
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

    initElem() {
        const elem = getElemById(this.id)
        if (!elem) return null

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
