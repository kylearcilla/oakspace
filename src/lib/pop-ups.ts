import { get } from "svelte/store"
import type { ComponentType } from "svelte"
import { writable, type Writable } from "svelte/store"

import { cursorPos } from "./utils-home"
import { initFloatElemPos } from "./utils-general"
import { ALLOWED_IMAGE_TYPES } from "./utils-media-upload"
import { DEFAULT_MAX_SIZE_MB } from "./utils-media-upload"

import TagPickerComponent from "$components/TagPicker.svelte"
import ImgUploadComponent from "$components/ImgUpload.svelte"
import DatePickerComponent from "$components/DatePicker.svelte"
import IconPickerComponent from "$components/IconPicker.svelte"
import ColorPickerComponent from "$components/ColorPicker.svelte"
import EmojiPickerComponent from "$components/EmojiPicker.svelte"

const IMG_DIM_HEIGHT = 290
const IMG_DIM_WIDTH  = 460

const ICON_PICKER_HEIGHT = 85
const ICON_PICKER_WIDTH  = 175

const EMOJI_PICKER_HEIGHT = 305
const EMOJI_PICKER_WIDTH  = 380

export let imageUpload = ImageUpload()
export let emojiPicker = EmojiPicker()

export let iconPicker = IconPicker()
export let colorPicker = ColorPicker()
export let datePicker = DatePicker()
export let tagPicker = TagPicker()

export let absoluteElem = AbsoluteFloatElem()

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
    let onPickIcon: (icon: Icon | null) => void = () => {}
    let imgUploadOptions: ImgUploadOptions | undefined = undefined

    function onChooseType(type: IconType) {
        if (type === "emoji") {
            emojiPicker.init({ 
                onSubmitEmoji: (emoji) => {
                    onPickIcon({ type: "emoji", src: emoji.native })
                }
            })
        } 
        else {
            imageUpload.init({ 
                ...imgUploadOptions!, 
                onSubmitImg: (src) => {
                    onPickIcon({ type: "img", src })
                }
            })
        }
        close()
    }

    function init({ onSubmitIcon, imgOptions, id = "icon-picker", onClose = () => {} }: { 
        onSubmitIcon: (icon: Icon | null) => void
        imgOptions?: ImgUploadOptions
        id?: string
        onClose?: () => void
    }) {
        onPickIcon = onSubmitIcon
        imgUploadOptions = imgOptions

        return absoluteElem.init({
            id,
            props: { 
                onChooseType
            },
            dims: { height: ICON_PICKER_HEIGHT, width: ICON_PICKER_WIDTH },
            onClose,
            component: IconPickerComponent
        })
    }

    function close(id?: string) {
        absoluteElem.close(id)
    }

    return { init, close }
}

function ColorPicker() {
    function init({ onSubmitColor, picked, id = "color-picker", onClose = () => {} }: { 
        onSubmitColor: (color: Color) => void
        picked: Color | null
        id?: string
        onClose?: () => void 
    }) {
        return absoluteElem.init({
            id,
            props: { onSubmitColor, picked },
            dims: { height: 370, width: 150 },
            offset: { top: 25, left: -30 },
            onClose,
            component: ColorPickerComponent
        })
    }

    function close(id?: string) {
        absoluteElem.close(id)
    }

    return { init, close }
}

function DatePicker() {
    function init({ props, onClose, id = "date-picker" }: {
        id?: string, props: DatePickerProps, onClose: () => void
    }) {
        return absoluteElem.init({
            id,
            props,
            onClose,
            component: DatePickerComponent,
        })
    }
    function close(id?: string) {
        absoluteElem.close(id)
    }
    return { init, close }
}

function TagPicker() {
    function init({ props, onClose, id = "tag-picker" }: {
        id?: string, props: TagPickerProps, onClose: () => void
    }) {
        return absoluteElem.init({
            id,
            props,
            onClose,
            component: TagPickerComponent
        })
    }
    function close(id?: string) {
        absoluteElem.close(id)
    }
    return { init, close }
}

function AbsoluteFloatElem() {
    const state: Writable<AbsoluteFloatElem[]> = writable([])

    function init({ component, props, offset = { top: 18, left: -35 }, dims, id, onClose }: { 
        component: ComponentType 
        offset?: { top: number, left: number }
        dims?: { height: number, width: number }
        props: any
        id: string
        onClose: () => void
    }) {
        if (get(state).find(elem => elem.id === id)) return

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

        state.update(elems => [...elems, { 
            props,
            position,
            component,
            id: id,
            bounceId: id,
            onClose,
            isHidden: false
        }])
    }

    function close(id?: string) {
        state.update(elems => {
            const targetId = id || elems[elems.length - 1]?.id
            const newElems = elems.map(e => e.id === targetId ? { ...e, isHidden: true } : e )
            const elem = newElems.find(e => e.id === targetId)

            if (elem) {
                elem.onClose()
            }

            return newElems
        })
    }
    function onDismount(id: string) {
        state.update(elems => elems.filter(elem => elem.id !== id))
    }

    return {
        state, init, close, onDismount
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
