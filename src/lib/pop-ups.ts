import { get } from "svelte/store"
import { writable, type Writable } from "svelte/store"
import { initFloatElemPos } from "./utils-general"
import { cursorPos } from "./utils-home"
import { ALLOWED_IMAGE_TYPES } from "./utils-media-upload"
import { DEFAULT_MAX_SIZE_MB } from "./utils-media-upload"
import type { ComponentType } from "svelte"

const IMG_DIM_HEIGHT = 290
const IMG_DIM_WIDTH  = 460

const ICON_PICKER_HEIGHT = 85
const ICON_PICKER_WIDTH  = 175

const EMOJI_PICKER_HEIGHT = 305
const EMOJI_PICKER_WIDTH  = 380

export let imageUpload = ImageUpload()
export let iconPicker = IconPicker()
export let emojiPicker = EmojiPicker()
export let colorPicker = ColorPicker()
export let absoluteDropdown = AbsoluteFloatElem()

function ImageUpload() {
    const state: Writable<ImageUpload> = writable({ 
        isOpen: false,
        position: { top: -1000, left: -1000 },
        onSubmitImg: () => {}
    })

    function init({ onSubmitImg, exclude, maxSizeMb, dims }: ImgUploadOptions)  {
        const position = getPopFloatElemPos({ 
            height: IMG_DIM_HEIGHT, width: IMG_DIM_WIDTH 
        })
        const maxSize  = maxSizeMb ?? DEFAULT_MAX_SIZE_MB
        const excludes = exclude ?? []

        const formats = ALLOWED_IMAGE_TYPES.filter(type => {
            if (excludes.includes('jpg') || excludes.includes('jpeg')) {
                return !['jpg', 'jpeg'].includes(type)
            }
            return !excludes.includes(type)
        })
        const constraints = {
            dims, maxSizeMb: maxSize, formats
        }

        if (get(state).isOpen) {
            close()
            return
        }
        state.set({ 
            onSubmitImg, position, 
            constraints, isOpen: true 
        })
    }
    function onSubmitImg(src: string) {
        const { onSubmitImg }  = get(state)
        if (onSubmitImg) {
            onSubmitImg(src)
        }
        close()
    }
    function close() {
        state.update((data) => ({ ...data, isOpen: false }))
    }

    return {
        state, init, onSubmitImg, close
    }
}

function EmojiPicker() {
    const state: Writable<EmojiPicker> = writable({ 
        position: { top: -1000, left: -1000 },
        isOpen: false,
        onSubmitEmoji: () => {}
    })

    function init({ onSubmitEmoji }: { onSubmitEmoji: (emoji: Emoji) => void}) {
        const position = getPopFloatElemPos({ 
            height: EMOJI_PICKER_HEIGHT, width: EMOJI_PICKER_WIDTH 
        })

        if (get(state).isOpen) {
            close()
            return
        }

        state.set({ isOpen: true, position, onSubmitEmoji })
    }
    function onSubmitEmoji(emoji: Emoji) {
        const { onSubmitEmoji } = get(state)
        onSubmitEmoji(emoji)
        close()
    }
    function close() {
        state.update((data) => ({ ...data, isOpen: false }))
    }

    return { state, init, onSubmitEmoji, close }
}

function IconPicker() {
    const state: Writable<IconPicker> = writable({ 
        id: "",
        isOpen: false,
        position: { top: -1000, left: -1000 },
        onSubmitIcon: () => {}
    })

    function init({ id, onSubmitIcon, imgOptions }: { 
        id: string,
        onSubmitIcon: (icon: Icon | null) => void,
        imgOptions?: ImgUploadOptions
    }) {
        const position = getPopFloatElemPos({ 
            height: ICON_PICKER_HEIGHT, width: ICON_PICKER_WIDTH 
        })
        if (get(state).isOpen) {
            close()
            return
        }
        state.set({ 
            id, imgOptions, onSubmitIcon,
            position,  isOpen: true 
        })
    }
    
    function onChooseType(type: IconType) {
        const { imgOptions }  = get(state)

        if (type === "emoji") {
            emojiPicker.init({ onSubmitEmoji })
        }
        else {
            imageUpload.init({ ...imgOptions, onSubmitImg })
        }
        close()
    }

    function onSubmitEmoji(emoji: Emoji) {
        const { onSubmitIcon }  = get(state)
        onSubmitIcon({ type: "emoji", src: emoji.native })
    }

    function onSubmitImg(src: string) {
        const { onSubmitIcon }  = get(state)
        onSubmitIcon({ type: "img", src })
    }

    function close() {
        state.update((data) => ({ ...data, isOpen: false }))
    }

    return {
        state, init, onChooseType, close
    }
}

function ColorPicker() {
    const state: Writable<ColorPicker> = writable({ 
        isOpen: false,
        position: { top: -1000, left: -1000 },
        onSubmitColor: () => {},
        picked: null
    })

    function init({ onSubmitColor, picked, onClose }: { 
        onSubmitColor: (color: Color) => void,
        picked: Color | null,
        onClose?: () => void
    }) {
        const position = getPopFloatElemPos({ height: 370, width: 150 })
        position.top += 25
        position.left -= 30

        if (get(state).isOpen) {
            close()
            return
        }
        state.update((data) => ({ 
            ...data, 
            onSubmitColor,
            onClose,
            position, 
            isOpen: true,
            picked
        }))
    }
    function onSubmitColor(color: Color) {
        const { onSubmitColor }  = get(state)
        if (onSubmitColor) {
            onSubmitColor(color)
        }
        close()
    }
    function close() {
        state.update((data) => ({
            ...data,
            isOpen: false, 
            onSubmitColor: onSubmitColor
        }))

        const { onClose } = get(state)
        if (onClose) onClose()
    }

    return {
        state, init, onSubmitColor, close
    }
}

function AbsoluteFloatElem() {
    const state: Writable<AbsoluteFloatElem> = writable({ 
        isHidden: false,
        component: null,
        offset: { top: 0, left: 0 },
        dims: { height: 0, width: 0 },
        position: { top: -1000, left: -1000 },
        props: null
    })

    function init({ component, props, offset, dims }: { 
        component: ComponentType 
        offset?: { top: number, left: number }
        dims?: { height: number, width: number }
        props: any 
    }) {
        let position = { top: 0, left: 0 }

        if (dims) {
            position = getPopFloatElemPos(dims)
        }
        else {
            position = { top: cursorPos.top, left: cursorPos.left }
        }
        if (offset)  {
            position.left += offset.left
            position.top += offset.top
        }

        if (!get(state).isHidden) {
            close()
            return
        }
        state.update((data) => ({ 
            ...data, 
            props,
            position,
            component,
            isHidden: false
        }))
    }
    function close() {
        state.update((data) => ({ ...data, isHidden: true }))
    }

    return {
        state, init, close
    }
}

function getPopFloatElemPos(box: { height: number, width: number }) {
    const { height, width } = box

    const fromPos = {
        top: cursorPos.top - 15,
        left: cursorPos.left - 15
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
