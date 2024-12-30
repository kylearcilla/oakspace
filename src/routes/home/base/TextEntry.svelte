<script lang="ts">
	import { onMount } from "svelte";

	import { iconPicker } from "$lib/utils-home"
	import { TextEditorManager } from "$lib/inputs"
	import { themeState } from "../../../lib/store"
	import { clickOutside, findElemVertSpace, getMaskedGradientStyle } from "$lib/utils-general"
    
	import ToggleBtn from "../../../components/ToggleBtn.svelte"
	import BounceFade from "../../../components/BounceFade.svelte"
	import { formatPlural, getElemById } from "../../../lib/utils-general";

    export let id: string
    export let entry: ThoughtEntry

    let toStyle: "styled" | "default" | "block" = entry.styling
    let focused = false
    let hasIcon = true
    let length = 0

    let containerHeight = 0
    let height = 0
    let displayHeight = 0
    let textGradient = ""
    
    let textEntryElem: HTMLElement
    let textEditorElem: HTMLElement
    let stylingOpen = false

    let styling = "", text = "", icon = null

    const INPUT_ID = `${id}--thought-entry`

    // upon focusing, its height before will still be present
    $: isLight = !$themeState.isDarkTheme

    $: updateData(entry)

    $: if (focused && textEntryElem) {
        displayHeight = getTextEditorHeight()
        textGradient = ""
    }
    $: if (height) {
        containerHeight = focused ? displayHeight : getTextEditorHeight()
    }
    $: if (focused != undefined && textEntryElem) {
        requestAnimationFrame(() => handleEditor(textEditorElem))
    }

    const editor = new TextEditorManager({ 
        placeholder: "type something here...",
        allowFormatting: true,
        maxLength: 1000,
        id: INPUT_ID,
        allowBlurOnClickAway: false,
        handlers: {
            onInputHandler: (_, val, _length) => {
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

    function updateData(entry: ThoughtEntry) {
        styling = entry.styling
        text = entry.text
        icon = entry.icon

        editor.updateText(text)
    }
    function handleEditor(elem: HTMLElement) {
        if (focused) return
        const { styling } = getMaskedGradientStyle(elem, {
            head: {
                end: "50px"
            },
            tail: {
                start: "10%",
                end: "100%"
            }
        })
        textGradient = styling
    }
    function getTextEditorHeight() {
        return findElemVertSpace(textEntryElem) - 15
    }
    function onEditComplete() {
        focused = false
        textEditorElem?.blur()

        styling = toStyle
    }
    function onStylingChange(optn: "default" | "styled" | "margin") {
        const isDefault = styling === "default" || styling === "block"

        if (optn === "default" && !isDefault) {
            toStyle = "default"
        }
        else if (optn === "styled") {
            toStyle = "styled"
        }
        else {
            toStyle = toStyle === "default" ? "block" : "default"
        }
    }

    onMount(() => handleEditor(textEditorElem))
</script>

<div 
    style:height={`${containerHeight}px`}
    style:position={"relative"}
    style:margin-top={"-1.5px"}
    use:clickOutside on:click_outside={() => onEditComplete()}
>
    <div 
        class="thought-entry"
        class:thought-entry--no-icon={!hasIcon}
        class:thought-entry--focused={focused}
        class:thought-entry--icon-img={hasIcon && icon.type === "img"}
        class:thought-entry--icon-emoji={hasIcon && icon.type === "emoji"}
        class:thought-entry--default={styling === "default"}
        class:thought-entry--block={styling === "block"}
        style:z-index={id === "month" ? 2 : 1}
        bind:this={textEntryElem}
        bind:clientHeight={height}
    >
        <div class="flx" style:width="100%">
            {#if hasIcon}
                <button 
                    id={`${id}--dbtn`}
                    class="thought-entry__icon" 
                    class:thought-entry__icon--img={icon.type === "img"}
                    on:click={() => {
                        iconPicker.init({
                            id: id,
                            onSubmitIcon: (_icon) => {
                                if (_icon) {
                                    icon = _icon
                                }
                            }
                        })
                    }}
                >
                    {#if icon.type === "img"}
                        <img src={icon.src} alt="icon">
                    {:else}
                        {icon.src}
                    {/if}
                </button>
            {/if}
            <div 
                id={INPUT_ID}
                class="text-editor"
                contenteditable
                spellcheck="false"
                style={textGradient}
                bind:this={textEditorElem}
                on:scroll={() => handleEditor(textEditorElem)}
            >
                {@html text}
            </div>
        </div>
        <div class="thought-entry__details" class:hidden={!focused}>
            <button on:click={() => hasIcon = !hasIcon}>
                {hasIcon ? "Remove Icon" : "Add Icon"}
            </button>
            <div class="thought-entry__count">
                {formatPlural("character", length)}
            </div>
            <button     
                id={`${id}--dbtn`}
                on:click={() => stylingOpen = !stylingOpen}
            >
                {styling === "styled" ? "Styled" : "Default"}
            </button>
        </div>
        <BounceFade 
            isHidden={!stylingOpen}
            zIndex={200}
            position={{ 
                bottom: "-60px", right: "30px"
            }}
        >
            {@const isDefault = toStyle === "default" || toStyle === "block"}
            <div 
                id={`${id}--dmenu`}
                class="dmenu" 
                class:dmenu--light={isLight}
                style:width={"140px"}
                use:clickOutside on:click_outside={() => stylingOpen = false} 
            >
                <div class="dmenu__option" class:dmenu__option--selected={isDefault}>
                    <button 
                        class="dmenu__option-btn" 
                        on:click={() => onStylingChange("default")}
                    >
                        <span class="dmenu__option-text">
                            Default
                        </span>
                        {#if isDefault}
                            <i class="fa-solid fa-check"></i> 
                        {/if}
                    </button>
                </div>
                <div class="dmenu__option" class:dmenu__option--selected={toStyle === "styled"}>
                    <button 
                        class="dmenu__option-btn" 
                        on:click={() => onStylingChange("styled")}
                    >
                        <span class="dmenu__option-text">
                            Styled
                        </span>
                        {#if toStyle === "styled"}
                            <i class="fa-solid fa-check"></i> 
                        {/if}
                    </button>
                </div>
                {#if isDefault}
                    <li class="dmenu__section-divider"></li>
                    <div class="dmenu__toggle-optn  dmenu__option--static">
                        <span class="dmenu__option-heading">Add Margin</span>
                        <ToggleBtn 
                            active={toStyle === "block"}
                            onToggle={() => onStylingChange("margin")}
                        />
                    </div>
                {/if}
            </div>
        </BounceFade>
    </div>
</div>

<style global lang="scss">
    @import "../../../scss/inputs.scss";
    @import "../../../scss/dropdown.scss";

    @mixin styled {
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
        margin-bottom: 25px !important;
        @include styled;

        &::before {
            @include abs-top-left(10px, 0px);
            height: calc(100% - 20px);
            width: 3px;
            border-radius: 20px;
            background-color: rgba(var(--textColor1), 0.08);
            content: " ";
            display: none;
        }
        /* styling */
        &--default,
        &--block {
            background: none;
            border-color: transparent;
            margin: 0px 0px 0px -13px;
        }
        &--block {
            margin-left: 0px !important;
            padding-left: 20px !important;
            margin-bottom: 0px;
        }
        &--block::before {
            display: block !important;
        }
        
        /* focus */
        &--focused {
            transform: scale(1.0085);
            @include styled;
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
            padding: 0px 14px 0px 11px !important;
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
            margin-top: 0px;
            padding: 8px 2px 10px 2px;
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
                @include square(50px);
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
            @include text-style(0.7, 500, 1.3rem);
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
        max-height: 90px;
        padding-bottom: 25px;
        width: 100%;
    }
</style>