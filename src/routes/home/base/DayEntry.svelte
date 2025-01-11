<script lang="ts">
    import { imageUpload } from "$lib/pop-ups"
    import { TextEditorManager } from "$lib/inputs"
	import { formatDatetoStr } from "../../../lib/utils-date"

	import { capitalize, clamp, clickOutside } from "../../../lib/utils-general"
	import SettingsBtn from "../../../components/SettingsBtn.svelte";
	import DropdownList from "../../../components/DropdownList.svelte";

    export let data: DayEntry
    export let onUpdate: (updatedData: DayEntryUpdatePayload) => void

    const TITLE_ID = "thought-title"
    const DESCRIPTION_ID = "thought-text"
    const MAX_CAPTION_LENGTH = 50
    
    const { img, date, thoughtEntry } = data
    const ASPECT_RATIO = 1 / 1.05
    const MAX_WIDTH = 800
    const MIN_WIDTH = 520

    let newData: DayEntryUpdatePayload = {
        img, thoughtEntry
    }

    let width = thoughtEntry.width || 580
    let height = 0
    let imgWidth = 0
    let cursor = "default"
    let imgOpen = false

    let fontStyle = thoughtEntry.fontStyle
    let fontFamily = "Bagel Fat One"

    let initDragPoint = 0
    let initWidth = 0
    let dragDirection: "left" | "right" | "top" | "bottom" | null = null
    let fontOptions = false
    let imgOptions = false

    $: {
        height = width / ASPECT_RATIO
    }
    $: updateFontStyle(fontStyle)

    new TextEditorManager({ 
        placeholder: "title goes here..",
        maxLength: 200,
        id: TITLE_ID,
        handlers: {
            onInputHandler: (_, val) => {
                newData.thoughtEntry.title = val
            }
        }
    })
    new TextEditorManager({ 
        placeholder: "notes about this day...",
        maxLength: 1000,
        id: DESCRIPTION_ID,
        handlers: {
            onInputHandler: (_, val) => {
                newData.thoughtEntry.text = val
            }
        }
    })

    function updateFontStyle(style: string) {
        newData.thoughtEntry.fontStyle = style

        if (style === "basic") {
            fontFamily = "Manrope"
        }
        else if (style === "stylish") {
            fontFamily = "Gambarino-Regular" 
        }
        else if (style === "fancy") {
            fontFamily = "Melodrama-Bold"
        }
        else if (style === "cute") {
            fontFamily = "Bagel Fat One"
        }
        newData = newData
    }
    function onPointerDown(e: PointerEvent) {
        const target = e.target as HTMLElement
        const classes = target.classList
        const isHandle = classes.contains("resize-handle")

        if (!isHandle) return

        if (classes.contains("resize-handle--top")) {
            cursor = "ns-resize"
            dragDirection = "top"
        }
        else if (classes.contains("resize-handle--bottom")) {
            cursor = "ns-resize"
            dragDirection = "bottom"
        }
        else if (classes.contains("resize-handle--left")) {
            cursor = "ew-resize"
            dragDirection = "left"
        }
        else if (classes.contains("resize-handle--right")) {
            cursor = "ew-resize"
            dragDirection = "right"
        }

        initDragPoint = cursor === "ns-resize" ? e.clientY : e.clientX
        initWidth = width
    }
    function onPointerMove(e: PointerEvent) {
        if (!dragDirection) {
            return
        }

        const dragPoint = cursor === "ns-resize" ? e.clientY : e.clientX
        const dist = dragPoint - initDragPoint
        const positive = dragDirection === "right" || dragDirection === "bottom"

        const newWidth = initWidth + (positive ? +dist : -dist)
        width = clamp(MIN_WIDTH, newWidth,MAX_WIDTH)

        thoughtEntry.width = width
    }
    function onPointerUp(e: PointerEvent) {
        const target = e.target as HTMLElement

        if (target.classList.contains("modal-bg")) {
            return
        }
        closeDrag()
    }
    function closeDrag() {
        cursor = "auto"
        initDragPoint = 0
        dragDirection = null
    }
    function initImgUpload() {
        imgOpen = true
        imageUpload.init({
            onSubmit: (src: string | null) => {
                imgOpen = false
                if (src) {
                    newData.src = src
                    newData = newData
                }
            }
        })
    }
</script>

<div 
    class="modal-bg"
    style:--cursor={cursor}
    style:--font-family={fontFamily}
    on:pointerdown={onPointerDown}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
>
    <div 
        class="wrapper"
        style:position="relative"
        use:clickOutside on:click_outside={() => {
            if (imgOpen) {
                return
            }
            if (!dragDirection) {
                imageUpload.close()
                onUpdate(newData)
            }
            closeDrag()
        }}
    >
        <div 
            class="day-entry"
            class:day-entry--no-img={!newData.img}
            class:day-entry--dragging={dragDirection !== null}
            style:height={`${height}px`}
            style:width={`${width}px`}
        >
            {#if !newData.img}
                <button 
                    class="day-entry__add-img-btn"
                    on:click={() => initImgUpload()}
                >
                    Add Image
                </button>
            {/if}
            {#if newData.img}
                <div 
                    class="day-entry__img"
                    bind:clientWidth={imgWidth}
                >
                <div style:position="relative">
                    <div class="day-entry__img-overlay">
                        <input 
                            maxlength={MAX_CAPTION_LENGTH}
                            placeholder="no caption"
                            type="text" 
                            bind:value={newData.img.caption}
                        >
                    </div>
                    <img src={newData.img.src} alt="">
                </div>
                </div>
            {/if}

            <div 
                id={TITLE_ID}
                class="day-entry__title"
                style:width={`calc(100% - ${imgWidth}px - 35px)`}
                contenteditable
                spellcheck="false"
            >
                {@html thoughtEntry.title}
            </div>
            <div class="day-entry__date">
                <span>
                    {formatDatetoStr(date, { 
                        month: "long", day: "numeric"
                    })}
                </span>
                <span style:opacity="0.2">
                    {date.getFullYear()}
                </span>
            </div>
            <div 
                id={DESCRIPTION_ID}
                class="text-editor"
                style:font-size="1.5rem"
                contenteditable
                spellcheck="false"
            >
                {@html thoughtEntry.text}
            </div>
            
            <div class="day-entry__top">
                <button
                    id="font-options--dbtn"
                    on:click={() => fontOptions = !fontOptions}
                >
                    Font: {capitalize(newData.thoughtEntry.fontStyle)}
                </button>
                <button
                    id="img-options--dbtn"
                    on:click={() => {
                        if (newData.img) {
                            imgOptions = !imgOptions
                        }
                        else {
                            initImgUpload()
                        }
                    }}
                >
                    {newData.img ? "Image" : "Add Image"}
                </button>

                <DropdownList 
                    id="font-options"
                    isHidden={!fontOptions} 
                    options={{
                        pickedItem: capitalize(fontStyle),
                        listItems: [
                            { name: "Basic" }, { name: "Cute" }, { name: "Stylish" }, { name: "Fancy" }
                        ],
                        position: { 
                            top: "40px", left: "25px" 
                        },
                        styling: { 
                            width: "100px" 
                        },
                        onClickOutside: () => { 
                            fontOptions = null 
                        },
                        onListItemClicked: ({ name }) => {
                            fontStyle = name.toLowerCase()
                            fontOptions = null 
                        }
                    }}
                />
                <DropdownList 
                    id="img-options"
                    isHidden={!imgOptions} 
                    options={{
                        listItems: [
                            { name: "Replace" }, { name: "Delete" }
                        ],
                        position: { 
                            top: "40px", right: "25px" 
                        },
                        styling: { 
                            width: "100px" 
                        },
                        onClickOutside: () => { 
                            imgOptions = null 
                        },
                        onListItemClicked: ({ name }) => {
                            if (name === "Replace") {
                                initImgUpload()
                            }
                            else if (name === "Delete") {
                                newData.img = null
                                newData = newData
                            }
                        }
                    }}
                />
            </div>
        </div>
        <div class="resize-handle resize-handle--top"></div>
        <div class="resize-handle resize-handle--bottom"></div>
        <div class="resize-handle resize-handle--left"></div>
        <div class="resize-handle resize-handle--right"></div>
    </div>
</div>

<style lang="scss">
    .modal-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.8);
        perspective: 700px;
    }

    .wrapper {
        animation: hinge-down 0.22s cubic-bezier(.4, 0, .2, 1) forwards;
    }

    .day-entry {
        padding: 50px 30px 22px 28px;
        position: relative;
        cursor: var(--cursor) !important;
        background-color: var(--modalBgColor);
        overflow-y: scroll;

        &--dragging * {
            user-select: none;
        }

        button {
            @include text-style(1, 400, 1.18rem, "DM Mono");
            opacity: 0.2;
            
            &:hover {
                opacity: 0.4;
            }
        }
        img {
            width: 230px;
            max-height: 300px;
            object-fit: cover;
            border-radius: 0px;
        }
        input {
            @include text-style(_, 400, 1.3rem, "DM Mono");
            color: white;
            width: 80%;
            height: max-content;
            cursor: text;
            opacity: 1;

            &::placeholder {
                color: white;
                opacity: 0.5;
            }
        }
        &__title {
            position: relative;
            width: 100%;
            line-height: 1;
            max-height: 200px;
            padding-bottom: 10px;
            overflow: scroll;
            @include text-style(1, 500, 6rem, var(--font-family));
        }
        &__img {
            float: right;
            margin: 0px 0px 20px 30px;
        }
        &__img:hover &__img-overlay {
            @include visible;
        }
        &__img-overlay {
            transition: 0.2s ease-in-out 0.2s;
            background-color: rgba(black, 0.5);
            width: 100%;
            height: 100%;
            text-align: center;
            @include not-visible;
            @include abs-top-left;
            @include center;
        }
        &__date {
            margin: 15px 0px 0px 0px;
            @include flex(center);
            @include text-style(1, 500, 1.9rem, "Gambarino");

            span {
                margin-right: 14px;
                display: block;
            }
        }
        &__add-img-btn {
            display: none;
        }
        &__settings-btn {
            @include abs-top-right(0px, -20px);
        }
        &__top {
            @include flex(center, space-between);
            @include abs-top-left;
            padding: 15px 15px 12px 28px;
            width: 100%;
            @include text-style(1, 500, 1.35rem, "DM Mono");
        }
        &__top button {
            margin-right: 12px;

            i {
                font-size: 1.5rem;
            }
        }
        &__top button:hover {
            opacity: 0.7;
        }
    }

    .resize-handle {
        position: absolute;

        &--top {
            width: 100%;
            height: 5px;
            @include abs-top-left;
            cursor: ns-resize;
        }
        &--bottom {
            width: 100%;
            height: 5px;
            @include abs-bottom-left;
            cursor: ns-resize;
        }
        &--left {
            width: 5px;
            height: 100%;
            @include abs-top-left;
            cursor: ew-resize;
        }
        &--right {
            width: 5px;
            height: 100%;
            @include abs-top-right;
            cursor: ew-resize;
        }
    }

    .text-editor {
        @include text-style(0.45, 500, 1.5rem, "Manrope");
        padding: 30px 0px 15px 0px;
        overflow: unset;
    }

    @keyframes hinge-down {
        0% {
            opacity: 0;
            -webkit-transform: rotateX(-20deg);
            transform: rotateX(-20deg);
        }
        100% {
            -webkit-transform: rotateX(0);
            transform: rotateX(0);
            opacity: 1;
        }
    }
</style>