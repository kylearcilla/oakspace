<script lang="ts">
	import { onMount } from "svelte";

	import { Icon } from "$lib/enums";
	import { themeState } from "$lib/store"
	import { iconPicker } from "$lib/pop-ups"
	import { TextEditorManager } from "$lib/inputs"
	import { formatPlural, capitalize, getElemPadding } from "$lib/utils-general";
	import { clickOutside, findElemVertSpace, getMaskedGradientStyle } from "$lib/utils-general"
    
	import ToggleBtn from "../../../components/ToggleBtn.svelte"
	import BounceFade from "../../../components/BounceFade.svelte"
	import DropdownList from "../../../components/DropdownList.svelte"

    export let options: TextEntryOptions & { id: string }
    let { id, styling, icon } = options

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
    
    let styleOpen = false
    let imgOpen = false
    let imgSizeOpen = false
    let text = ""

    let textEntryElem: HTMLElement
    let textEditorElem: HTMLElement

    const INPUT_ID = `${id}--thought-entry`
    $: updateData(options)

    // upon focusing, its height before will still be present
    $: isLight = !$themeState.isDarkTheme
    $: minHeight = getMinHeight(focused)

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

    const editor = new TextEditorManager({ 
        placeholder: "type something here...",
        allowFormatting: true,
        maxLength: 1000,
        id: INPUT_ID,
        allowBlurOnClickAway: false,
        handlers: {
            onInputHandler: (_, __, _length) => {
                length = _length
            },
            onBlurHandler: () => {
                onEditComplete()
            },
            onFocusHandler: (_, __, _length) => {
                focused = true
                length = _length
            }
        }
    })

    function getMinHeight(focused: boolean) {
        if (focused) {
            return icon?.size === "big" ? 125 : 70
        }
        else {
            return icon?.size === "big" ? 100 : 50
        }
    }
    function updateData(options: any) {
        styling = options.styling
        text = options.entry
        icon = options.icon
        hasIcon = icon != null

        editor.updateText(text)
    }
    function handleEditorStyle(elem: HTMLElement) {
        if (focused) return

        const { styling } = getMaskedGradientStyle(elem, {
            head: {
                start: "20px",
                end: "20px"
            },
            tail: {
                start: "10%",
                end: "92%"
            }
        })
        textGradient = styling

        setMarkerHeight()
    }
    function setMarkerHeight() {
        const { top, bottom } = getElemPadding(textEditorElem)
        const padding = top + bottom
        markerHeight = 10 + textEditorElem.clientHeight

        if (icon && icon.type === "img") {
            markerHeight = minHeight
        }
        else {
            markerHeight = 10 + textEditorElem.clientHeight - padding
        }
    }
    function getTextEditorHeight() {
        return findElemVertSpace(textEntryElem) - 15
    }
    function onEditComplete() {
        focused = false
        textEditorElem?.blur()

        styling = toStyle
    }
    function onStylingChange(optn: "bordered" | "has-marker") {
        if (optn === "bordered") {
            toStyle = toStyle === "bordered" ? "default" : "bordered"
        }
        else {
            toStyle = toStyle === "has-marker" ? "default" : "has-marker"
        }
    }
    function initImagePopUp() {
        iconPicker.init({
            id,
            onSubmitIcon: (newIcon) => {
                if (newIcon) {
                    icon = { ...icon, ...newIcon }
                    icon.size = icon.type === "emoji" ? "small" : "big"

                    requestAnimationFrame(() => setMarkerHeight())
                }
            }
        })
    }

    onMount(() => handleEditorStyle(textEditorElem))
</script>

<div 
    style:height={`${containerHeight}px`}
    style:position={"relative"}
    style:has-marker-top={"-1.5px"}
    style:--img-size={icon?.size === "big" ? "100px" : "50px"}
    style:--marker-height={`${markerHeight - 0}px`}
    use:clickOutside on:click_outside={() => onEditComplete()}
>
    <div 
        class="thought-entry"
        class:thought-entry--no-icon={!hasIcon}
        class:thought-entry--focused={focused}
        class:thought-entry--icon-img={hasIcon && icon?.type === "img"}
        class:thought-entry--icon-emoji={hasIcon && icon?.type === "emoji"}
        class:thought-entry--default={styling === "default"}
        class:thought-entry--marker={styling === "has-marker"}
        class:thought-entry--bordered={styling === "bordered"}
        style:z-index={id === "month" ? 2 : 1}
        bind:this={textEntryElem}
        bind:clientHeight={height}
    >
        <div 
            class="flx" 
            style:width="100%"
            style:min-height={`${minHeight}px`}
        >
            {#if hasIcon}
                <button 
                    id={`${id}--dbtn`}
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
                style={`${textGradient}; max-height: ${icon?.size === "big" ? "120px" : "90px"}`}
                bind:this={textEditorElem}
                on:scroll={() => handleEditorStyle(textEditorElem)}
            >
                {@html text}
            </div>
        </div>
        <div class="thought-entry__details" class:hidden={!focused}>
            <button 
                id={`${id}--img-dbtn`}
                on:click={() => imgOpen = !imgOpen}
            >
                Image
            </button>
            <div class="thought-entry__count">
                {formatPlural("character", length)}
            </div>
            <button     
                id={`${id}--style-dbtn`}
                on:click={() => styleOpen = !styleOpen}
            >
                Styling
            </button>
        </div>

        <!-- styling options -->
        <BounceFade 
            isHidden={!styleOpen}
            zIndex={200}
            position={{ 
                bottom: "-60px", 
                right: "30px"
            }}
        >
            <div 
                id={`${id}--style-dmenu`}
                class="dmenu" 
                class:dmenu--light={isLight}
                style:width={"140px"}
                use:clickOutside on:click_outside={() => styleOpen = false} 
            >

                <div class="dmenu__toggle-optn  dmenu__option--static">
                    <span class="dmenu__option-heading">Bordered</span>
                    <ToggleBtn 
                        active={toStyle === "bordered"}
                        onToggle={() => onStylingChange("bordered")}
                    />
                </div>
                <div class="dmenu__toggle-optn  dmenu__option--static">
                    <span class="dmenu__option-heading">Marker</span>
                    <ToggleBtn 
                        active={toStyle === "has-marker"}
                        onToggle={() => onStylingChange("has-marker")}
                    />
                </div>
            </div>
        </BounceFade>

        <DropdownList
            id={`${id}--img-dmenu`}
            isHidden={!imgOpen}
            options={{
                listItems: [
                    { 
                        name: icon ? "Replace Icon" : "Add Icon"
                    },
                    ...(icon && icon.type === "img" ? [
                        { 
                            name: "Icon Size",
                            rightIcon: { 
                                type: "svg",
                                icon: Icon.ChevronRight,
                                transform: "scale(0.98) translate(2px, 0px)"
                            },
                            onPointerOver: () => {
                                imgSizeOpen = true
                            },
                            onPointerLeave: () => {
                                imgSizeOpen = false
                            },
                            divider: true
                        }
                    ] : []),
                    ...(icon ? [
                        { 
                            name: "Remove"
                        }
                    ] : []),
                ],
                parentContext: {
                    childId: `${id}--img-sizes`
                },
                onListItemClicked: ({ name }) => {
                    if (name === "Replace Icon") {
                        initImagePopUp()
                        imgOpen = false
                    }
                    else if (name === "Remove") {
                        icon = null
                    }
                },
                onClickOutside: () => {
                    imgOpen = false
                },
                styling: { 
                    width: "140px",
                    zIndex: 1,
                },
                position: { 
                    bottom: `-70px`, 
                    left: `10px`,
                }
            }}
        />
    
        <DropdownList 
            id={`${id}--img-sizes`}
            isHidden={!imgSizeOpen}
            options={{
                pickedItem: capitalize(icon?.size ?? ""),
                listItems: [
                    { name: "Small" },
                    { name: "Big" },
                ],
                onListItemClicked: ({ name: size }) => {
                    icon.size = size.toLowerCase()
                    imgSizeOpen = false
                },
                styling:  { 
                    width: "100px",
                    zIndex: 2,
                },
                position: { 
                    bottom: `-70px`, 
                    left: `152px`,
                },
                parent: {
                    id: `${id}--img-dmenu`,
                    optnIdx: 1,
                    optnName: "Image Size"
                },
                onPointerLeave: () => {
                    imgSizeOpen = false
                }
           }}
        />
    </div>

</div>

<style global lang="scss">
    @import "../../../scss/inputs.scss";
    @import "../../../scss/dropdown.scss";

    @mixin bordered {
        background-color: #161516;
        padding: 5.5px 14px 0px 14px;
        border: 1.5px dashed rgba(var(--textColor1), 0.06);
    }

    .thought-entry {
        border-radius: 10px;
        width: 100%;
        margin: 9px 0px 18px -3px;
        transition: transform 0.22s cubic-bezier(.4, 0, .2, 1);
        transform: scale(1);
        position: absolute;
        height: auto;
        margin-bottom: 10px !important;
        @include bordered;

        &::before {
            @include abs-top-left(12px, 0px);
            height: var(--marker-height);
            width: 3px;
            border-radius: 20px;
            background-color: rgba(var(--textColor1), 0.08);
            content: " ";
            display: none;
        }
        /* styling */
        &--default,
        &--marker {
            background: none;
            border-color: transparent;
            margin: 0px 0px 0px -13px;
        }
        &--marker {
            margin: 0px 0px 20px 0px !important;
            padding-left: 20px !important;
        }
        &--marker::before {
            display: block !important;
        }
        &--bordered {
            margin-bottom: 20px !important;
        }
        
        /* focus */
        &--focused {
            transform: scale(1.0085);
            @include bordered;
            padding: 5.5px 14px 0px 14px !important;

            &::before {
                display: none !important;
            }
            .text-editor {
                max-height: 700px !important;
            }
        }

        /* icon */
        &--icon-emoji {
            padding: 3px 14px 0px 11px !important;
            width: calc(100% - 20px) !important;
            
            .text-editor {
                padding-top: 6px;
            }
        }
        &--icon-img {
            padding: 0px 14px 5px 11px !important;
            width: calc(100% - 20px) !important;

            .text-editor {
                padding-top: 10px;
            }
        }
        &--no-icon {
            padding: 0px 14px 0px 14px;
        }
        
        &__details {
            width: 100%;
            height: 34px;
            padding: 8px 2px 6px 2px;
            border-top: 1px solid rgba(var(--textColor1), 0.06);
            @include flex(center, space-between);
        }
        &__count {
            @include text-style(0.1, 400, 1.3rem, "DM Sans");
        }
        &__icon {
            @include square(25px);
            @include center;
            margin: 5px 12px 4px 0px;
            font-size: 2rem !important;
            opacity: 1 !important;
            color: white !important;
            transition: background-color 0.18s cubic-bezier(.4, 0, .2, 1);

            &--img {
                margin: 12px 15px 0px 2px;
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

        &__details button {
            @include text-style(0.7, 400, 1.15rem, "Geist Mono");
            opacity: 0.4;
            &:hover {
                opacity: 0.65;
            }
        }
    }
    .thought-entry .text-editor {
        cursor: text;
        @include text-style(_, 500, 1.5rem, "Manrope");
        color: rgb(150, 150, 150);
        line-height: 1.25;
        max-height: var(--max-height);
        height: fit-content;
        padding-bottom: 25px;
        width: 100%;
    }
</style>