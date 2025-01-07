import { get } from "svelte/store"
import { writable, type Writable } from "svelte/store"
import { initFloatElemPos } from "./utils-general"
import { cursorPos } from "./utils-home"

function getPopFloatElemPos(box: { height: number, width: number }) {
    const { height, width } = box

    const fromPos = {
        top: cursorPos.top - 25,
        left: cursorPos.left - 35
    }
    return initFloatElemPos({
        dims: { 
            height,
            width
        }, 
        containerDims: { 
            height: window.innerHeight, 
            width: window.innerWidth
        },
        cursorPos: fromPos
    })
}

export let imageUpload = ImageUpload()
export let iconPicker = IconPicker()
export let emojiPicker = EmojiPicker()
export let colorPicker = ColorPicker()

function ImageUpload() {
    const state: Writable<ImageUpload> = writable({ 
        isOpen: false,
        position: { top: -1000, left: -1000 },
        onSubmit: null
    })

    function init(args: { 
        onSubmit: (imgSrc: string | null) => void
        constraits?: ImgUploadConstraints 
    }) {
        const { constraits, onSubmit } = args
        const position = getPopFloatElemPos({ height: 290, width: 460 })

        if (get(state).isOpen) {
            close()
            return
        }

        state.update((data) => ({ 
            ...data, 
            onSubmit,
            position, 
            constraits, isOpen: true 
        }))
    }
    function onSubmit(imgSrc: string | null) {
        const { onSubmit }  = get(state)
        if (onSubmit) {
            onSubmit(imgSrc)
        }
        close()
    }
    function close() {
        state.update((data) => ({
            ...data,
            isOpen: false, 
            onEmojiSelect: onSubmit
        }))
    }

    return {
        state, init, onSubmit, close
    }
}

function ColorPicker() {
    const state: Writable<ColorPicker> = writable({ 
        isOpen: false,
        position: { top: -1000, left: -1000 },
        onSubmit: null,
        picked: null
    })

    function init(args: { 
        onSubmit: (color: Color | null) => void,
        picked: Color | null
    }) {
        const { onSubmit, picked } = args
        const position = getPopFloatElemPos({ height: 290, width: 460 })

        if (get(state).isOpen) {
            close()
            return
        }

        state.update((data) => ({ 
            ...data, 
            onSubmit,
            position, 
            isOpen: true,
            picked
        }))
    }
    function onSubmit(color: Color | null) {
        const { onSubmit }  = get(state)
        if (onSubmit) {
            onSubmit(color)
        }
        close()
    }
    function close() {
        state.update((data) => ({
            ...data,
            isOpen: false, 
            onEmojiSelect: onSubmit
        }))
    }

    return {
        state, init, onSubmit, close
    }
}

function IconPicker() {
    const state: Writable<IconPicker> = writable({ 
        id: "",
        isOpen: false,
        position: { top: -1000, left: -1000 },
        onSubmitIcon: (icon: Icon | null) => {}
    })

    function init(args: { 
        id: string,
        onSubmitIcon: (icon: Icon | null) => void
    }) {
        const position = getPopFloatElemPos({ height: 90, width: 175 })

        if (get(state).isOpen) {
            close()
            return
        }

        state.update((data) => ({ 
            ...data, 
            ...args,
            position, 
            isOpen: true 
        }))
    }
    function onChooseType(type: IconType | null) {
        const { onSubmitIcon }  = get(state)

        if (type === "emoji") {
            emojiPicker.init({
                onEmojiSelect: (emoji: any) => {
                    if (emoji) {
                        onSubmitIcon({ type: "emoji", src: emoji.native })
                    }
                    else {
                        onSubmitIcon(null)
                    }
                }
            })
        }
        else if (type === "img") {
            imageUpload.init({
                onSubmit: (src: string | null) => {
                    if (src) {
                        onSubmitIcon({ type: "img", src })
                    }
                    else {
                        onSubmitIcon(null)
                    }
                }
            })
        }
        else {
            onSubmitIcon(null)
        }
        close()
    }
    function close() {
        state.update((data) => ({
            ...data,
            isOpen: false
        }))
    }

    return {
        state, init, onChooseType, close
    }
}

function EmojiPicker() {
    const state: Writable<EmojiPicker> = writable({ 
        position: { top: -1000, left: -1000 },
        isOpen: false,
        onEmojiSelect: null
    })

    function init(args: { onEmojiSelect: (emoji: any) => void}) {
        const { onEmojiSelect } = args
        const position = getPopFloatElemPos({ height: 305, width: 380 })

        if (get(state).isOpen) {
            close()
            return
        }

        state.set({
            isOpen: true, 
            position,
            onEmojiSelect
        })
    }
    function onEmojiSelect(emoji: any) {
        const { onEmojiSelect }  = get(state)
        if (onEmojiSelect) {
            onEmojiSelect(emoji)
        }
        close()
    }
    function close() {
        // do not change positioning when closing as it will change before the bounce fade animation finished
        state.update((data) => ({
            ...data,
            isOpen: false, 
            onEmojiSelect: null
        }))
    }
    return {
        state, init, onEmojiSelect, close
    }
}

