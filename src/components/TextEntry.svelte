
<script lang="ts">
	import { onMount } from "svelte";

	import { themeState } from "$lib/store"
	import { iconPicker } from "$lib/pop-ups"
	import { TextEditorManager } from "$lib/text-editor"
	import { formatPlural, getElemPadding } from "$lib/utils-general"
	import { clickOutside, findElemVertSpace, getMaskedGradientStyle } from "$lib/utils-general"
    
	import DropdownList from "$components/DropdownList.svelte"

    export let entry: TextEntry
    export let zIndex: number
    export let id: string
    let { styling, icon, truncate } = entry

    // when style changes, apple when unfocused
    let toStyle = styling 
    let focused = false
    let hasIcon = true
    let length = 0

    let height = 0
    let containerHeight = 0
    let markerHeight = 0
    let displayHeight = 0
    let textGradient = ""
    let loading = false
    
    let styleOpen = false
    let imgOpen = false
    let imgSizeOpen = false
    let text = ""
    let width = 0
    let padding = "0px 0px 0px 0px"
    let margin = "0px 0px 0px 0px"
    let txtBottomPadding = "0px"

    let textEntryElem: HTMLElement
    let textEditorElem: HTMLElement

    const INPUT_ID = `${id}--thought-entry`

    // upon focusing, its height before will still be present
    $: isLight = !$themeState.isDarkTheme
    $: minHeight = getMinHeight(focused)

    $: if (isLight !== undefined && textEditorElem) {
        handleEditorStyle(textEditorElem)
    }
    $: if (focused && textEntryElem) {
        displayHeight = getTextEditorHeight()
        textGradient = ""
    }
    $: if (height) {
        containerHeight = focused ? displayHeight : getTextEditorHeight()
    }
    $: if (focused != undefined && textEntryElem) {
        requestAnimationFrame(() => handleEditorStyle(textEditorElem))
    }
    $: if (width && textEditorElem) {
        handleEditorStyle(textEditorElem)
    }
    $: updateStyling(styling, icon)

    const editor = new TextEditorManager({ 
        placeholder: "Priorities, intentions, thoughts...",
        allowFormatting: true,
        maxLength: 1000,
        initValue: entry.text,
        id: INPUT_ID,
        handlers: {
            onInputHandler: (_, __, _length) => {
                length = _length
            },
            onBlurHandler: (_, val) => {
                entry.text = val
                onEditComplete()
            },
            onFocusHandler: (_, __, _length) => {
                focused = true
                length = _length
            }
        }
    })

    /* updates */
    function updateData(entry: any) {
        styling = entry.styling
        text = entry.text
        icon = entry.icon
        hasIcon = icon != null

        editor.updateText(text)
    }
    function onEditComplete() {
        styling = toStyle
        entry.styling = toStyle
    }

    /* ui */
    function handleEditorStyle(elem: HTMLElement) {
        if (focused || !elem) return

        const { styling } = getMaskedGradientStyle(elem, {
            head: {
                start: "15px",
                end: "15px"
            },
            tail: {
                start: isLight ? "25%" : "10%",
                end: isLight ? "100%" : "92%"
            }
        })

        textGradient = styling
        setMarkerHeight()
    }
    /* layout */
    function getMinHeight(focused: boolean) {
        const size = icon?.size ?? null
        const type = icon?.type ?? null

        if (focused) {
            return !size || type === "emoji" ? 20 :  size === "big" ? 125 : 70 
        }
        else {
            return !size || type === "emoji" ? 20 :  size === "big" ? 100 : 52
        }
    }
    function setMarkerHeight() {
        const { top, bottom } = getElemPadding(textEditorElem)
        const padding = top + bottom
        markerHeight = 10 + textEditorElem.clientHeight

        if (icon && icon.type === "img") {
            markerHeight = Math.max(minHeight, markerHeight - 25)
        }
        else {
            markerHeight = Math.max(minHeight, textEditorElem.clientHeight - padding - 2)
        }
    }
    function updateStyling(styling: string, icon: any) {
        const { size, type } = icon || {}

        /* no icon */
        if (styling === "default" && !icon) {
            margin = "0px 0px 25px -12px"
            padding = "4px 14px 0px 13px"
        }
        else if (styling === "background" && !icon) {
            margin = "5px 0px 10px 0px"
            padding = "5px 14px 14px 14px"
            txtBottomPadding = "0px"
        }
        else if (styling === "has-marker" && !icon) {
            margin = "0px 0px 20px 0px"
            padding = "5px 12px 5px 16px"
            txtBottomPadding = "0px"
        }
        /* emoji */
        else if (styling === "default" && type === "emoji") {
            margin = "0px 0px 15px -14px"
            padding = "5px 14px 7px 14px"
        }
        else if (styling === "background" && type === "emoji") {
            margin = "8px 0px 20px 0px"
            padding = "4px 14px 10px 13px"
            txtBottomPadding = "20px"
        }
        else if (styling === "has-marker" && type === "emoji") {
            margin = "0px 0px 10px 0px"
            padding = "4px 14px 5px 14px"
            txtBottomPadding = "12px"
        }
        /* big */
        else if (styling === "default" && size === "big") {
            margin = "0px 0px 35px -15px"
            padding = "3px 0px 0px 13px"
        }
        else if (styling === "background" && size === "big") {
            margin = "10px 0px 20px 0px"
            padding = "3px 14px 14px 13px"
            txtBottomPadding = "12px"
        }
        else if (styling === "has-marker" && size === "big") {
            margin = "0px 0px 25px 0px"
            padding = "4px 14px 4px 14px"
        }
        /* med */
        else if (styling === "default") {
            margin = "-2px 0px 35px -16px"
            padding = "4px 14px 0px 13px"
            txtBottomPadding = "9px"
        }
        else if (styling === "background") {
            margin = "8px 0px 12px -2px"
            padding = "4px 14px 14px 13px"
            txtBottomPadding = "0px"
        }
        else if (styling === "has-marker") {
            margin = "0px 0px 20px 0px"
            padding = "4px 14px 0px 13px"
            txtBottomPadding = "10px"
        }
    }
    function getTextEditorHeight() {
        return findElemVertSpace(textEntryElem) - 15
    }

    /* styling*/
    function onStylingChange(optn: "background" | "has-marker") {
        if (optn === "background") {
            toStyle = toStyle === "background" ? "default" : "background"
        }
        else {
            toStyle = toStyle === "has-marker" ? "default" : "has-marker"
        }
    }
    function initImagePopUp() {
        iconPicker.init({
            id,
            onSubmitIcon: (newIcon) => {
                icon = { ...icon, ...newIcon } as TextEntryIcon
                entry.icon = icon
                requestAnimationFrame(() => {
                    displayHeight = getTextEditorHeight()
                    textGradient = ""
                    setMarkerHeight()
                    handleEditorStyle(textEditorElem)
                })
            }
        })
    }
    onMount(() => {
        handleEditorStyle(textEditorElem)
        updateData(entry)
        containerHeight = getTextEditorHeight()
    })
</script>

<div 
    style:height={`${containerHeight}px`}
    style:position="relative"
    style:has-marker-top="-1.5px"
    style:--z-index={zIndex}
    style:--img-size={icon?.size === "big" ? "100px" : "50px"}
    style:--marker-height={`${markerHeight - 0}px`}
    style:--margin={margin}
    style:--padding={padding}
    style:--txt-bottom-padding={txtBottomPadding}
    bind:clientWidth={width}
    use:clickOutside on:outClick={() => {
        focused = false
        onEditComplete()
    }}
>
    <div 
        class="thought-entry"
        class:thought-entry--light={isLight}
        class:thought-entry--no-icon={!hasIcon}
        class:thought-entry--focused={focused}
        class:thought-entry--full={!truncate}
        class:thought-entry--default={styling === "default"}
        class:thought-entry--marker={styling === "has-marker"}
        class:thought-entry--background={styling === "background"}
        bind:this={textEntryElem}
        bind:clientHeight={height}
    >
        <div 
            class="flx" 
            style:width="100%"
            style:min-height={`${minHeight}px`}
        >
            {#if icon}
                <button 
                    data-dmenu-id={id}
                    class="thought-entry__icon" 
                    class:thought-entry__icon--img={icon?.type === "img"}
                    on:click={() => initImagePopUp()}
                >
                    {#if icon && icon.type === "img"}
                        <img src={icon?.src} alt="icon">
                    {:else}
                        {icon?.src}
                    {/if}
                </button>
            {/if}
            <div 
                id={INPUT_ID}
                class="text-editor"
                contenteditable
                spellcheck="false"
                style={`${textGradient}; max-height: ${icon?.size === "big" ? "110px" : "90px"}; overflow: ${focused ? "auto" : "hidden"}`}
                bind:this={textEditorElem}
                on:scroll={() => {
                    handleEditorStyle(textEditorElem)
                }}
            >
            </div>
        </div>
        <div class="thought-entry__details" class:hidden={!focused}>
            {#if icon}
                <button 
                    id={`${id}--img-dbtn`}
                    on:click={() => imgOpen = !imgOpen}
                >
                    Image
                </button>
            {:else}
                <button 
                    id={`${id}--img-dbtn`}
                    on:click={() => initImagePopUp()}
                >
                    Add Icon
                </button>
            {/if}
            <div class="thought-entry__count">
                {formatPlural("character", length)}
            </div>
            <button     
                id={`${id}--style-dbtn`}
                on:click={() => styleOpen = !styleOpen}
            >
                Appearance
            </button>
        </div>

        <!-- styling options -->
        <DropdownList 
            id={`${id}--style-dmenu`}
            isHidden={!styleOpen}
            options={{
                listItems: [
                    {
                        sectionName: "Styling",
                    },
                    {
                        name: "Background",
                        active: toStyle === "background",
                        onToggle: () => onStylingChange("background")
                    },
                    {
                        name: "Divider",
                        active: toStyle === "has-marker",
                        divider: true,
                        onToggle: () => onStylingChange("has-marker")
                    },
                    {
                        name: "Truncate",
                        active: truncate,
                        onToggle: () => {
                            truncate = !truncate
                            entry.truncate = truncate
                        }
                    },
                ],
                styling: { 
                    minWidth: "140px",
                    zIndex: 1
                },
                position: { 
                    bottom: "-120px", 
                    right: "0px"
                },
                onClickOutside: () => {
                    styleOpen = false
                }
            }}
        />

        <DropdownList
            id={`${id}--img-dmenu`}
            isHidden={!imgOpen}
            options={{
                styling: { 
                    minWidth: "120px",
                    zIndex: 1,
                },
                position: { 
                    bottom: icon?.type === "emoji" ? "-60px" : "-100px",
                    left: "10px",
                },
                listItems: [
                    { 
                        name: icon ? "Replace Icon" : "Add Icon"
                    },
                    {
                        name: icon?.type === "img" ? "Bigger" : "",
                        active: icon?.size === "big",
                        onToggle: () => {
                            imgSizeOpen = !imgSizeOpen
                            if (icon?.type === "img") {
                                icon.size = icon.size === "small" ? "big" : "small"
                            }
                        },
                        divider: true
                    },
                    {
                        name: icon ? "Remove" : ""
                    },
                ],
                onListItemClicked: ({ name }) => {
                    if (name === "Replace Icon") {
                        initImagePopUp()
                        imgOpen = false
                    }
                    else if (name === "Remove") {
                        icon = null
                        imgOpen = false
                    }
                },
                onClickOutside: () => {
                    imgOpen = false
                }
            }}
        />

    </div>

</div>

<style global lang="scss">
    @use "../scss/inputs.scss" as *;

    @mixin background {
        background-color: rgba(var(--textColor1), 0.035);
        background-color: var(--textEntryBgColor);
    }

    .thought-entry {
        border-radius: 10px;
        transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        transform: scale(1);
        position: absolute;
        height: auto;
        z-index: var(--z-index);
        border: 1.5px dashed transparent;
        width: 100%;
        margin: var(--margin);
        padding: var(--padding);
        @include background;

        --txt-opacity: 0.6;
        --dashed-opacity: 0.0835;

        &--light {
            --txt-opacity: 0.85;
            --dashed-opacity: 0.2;
        }
        &--light &__count {
            @include text-style(0.5);
        }
        &--light &__details button {
            @include text-style(1);
        }

        /* styling */
        &--default,
        &--marker {
            background: none;
        }
        &--marker::before {
            display: block !important;
        }
        &--full .text-editor {
            max-height: 500px !important;
            mask-image: unset !important;
            -webkit-mask-image: unset !important;
        }
        /* no icon */
        &--no-icon {
            width: 100% !important;
        }
        &--no-icon .text-editor{
            padding-top: 0px;
        }
        
        /* focus */
        &--focused {
            transform: scale(1.0085);
            @include background;
            border-color: rgba(var(--textColor1), var(--dashed-opacity));
            box-shadow: 0px 4px 10px 1px rgba(0, 0, 0, 0.075);
            padding: 4px 14px 5px 13px !important;
            
            &::before {
                display: none !important;
            }
            .text-editor {
                padding-bottom: 25px !important;
                max-height: 700px !important;
            }
        }

        &::before {
            @include abs-top-left(12px, 0px);
            height: var(--marker-height);
            width: 3px;
            border-radius: 20px;
            background-color: rgba(var(--textColor1), 0.10);
            content: " ";
            display: none;
        }
        
        &__details {
            width: 100%;
            height: 34px;
            padding: 10px 2px 9px 2px;
            border-top: var(--divider-border);
            @include flex(center, space-between);
        }
        &__icon {
            @include square(25px);
            @include center;
            margin: 5px 9px 4px 0px;
            font-size: 2rem !important;
            opacity: 1 !important;
            color: white !important;
            transition: background-color 0.18s cubic-bezier(.4, 0, .2, 1);

            &--img {
                margin: 9px 15px 0px 2px;
                @include square(var(--img-size));
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.05);
            }
            img {
                @include square(100%, 4px);
                object-fit: cover;
            }
        }
        &__count {
            @include text-style(0.1, var(--fw-400-500), 1.25rem);
        }
        &__details button {
            @include text-style(0.7, var(--fw-400-500), 1.35rem);
            opacity: 0.4;

            &:hover {
                opacity: 0.65;
            }
        }
    }
    .thought-entry .text-editor {
        cursor: text !important;
        @include text-style(var(--txt-opacity), var(--fw-300-400), 1.5rem);
        line-height: 1.185;
        max-height: var(--max-height);
        height: fit-content;
        width: 100%;
        word-break: break-word;
        padding-top: 6px;
        padding-bottom: var(--txt-bottom-padding);

        &:empty:before {
            opacity: 0.25;
            font-weight: var(--fw-400-500);
        }
    }
</style>