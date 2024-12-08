<script lang="ts">
    import { emojiPicker } from "$lib/emojis"
    import { imageUpload } from "$lib/utils-home"
	import { TextEditorManager } from "$lib/inputs"
	import { randomArrayElem } from "../../../lib/utils-general"
    
	import IconPicker from "../../../components/IconPicker.svelte"

    export let date: Date
    export let entry: "year" | "month"

    const INPUT_ID = "text-entry"

    let focused = false
    let hasIcon = true
    let iconPicker = false
    let text = "some people want it all but i dont want nothing at all"
    let length = 0
    let icon = {
        type: "emoji",
        src: randomArrayElem(["💪", "👏", "🌞", "🎈", "🙌", "💵", "🌙", "🌴"])
    }
    // let icon = {
    //     type: "img",
    //     src: "https://i.pinimg.com/736x/98/6c/eb/986ceb87af5f7442463be09d5e49c2ae.jpg"
    // }
    let textEntryElem: HTMLElement

    new TextEditorManager({ 
        placeholder: "type something here...",
        allowFormatting: true,
        maxLength: 1000,
        id: INPUT_ID,
        handlers: {
            onInputHandler: (_, __, _length) => {
                text
                length = _length
            },
            onBlurHandler: () => onEditComplete(),
            onFocusHandler: (_, __, _length) => {
                focused = true
                length = _length
            }
        }
    })

    function onIconChoose(type: "img" | "emoji", src: string) {
        icon = { type, src }
    }
    function onEmojiSelect(emoji: any) {
        if (emoji) {
            onIconChoose("emoji", emoji.native)
        }
    }
    function initEmojiPicker() {
        const { top, left } = textEntryElem.getBoundingClientRect()

        emojiPicker.init({ 
            position: {
                top: `${top + (icon.type === "img" ? 55 : 40)}px`, 
                left: `${left - 20}px`, 
            },
            onEmojiSelect
        })
    }
    function initImgModal() {
        imageUpload.init({
            title: "Journal Icon",
            onSubmit: (imgSrc: string) => {
                if (icon?.src != imgSrc) {
                    onIconChoose("img", imgSrc)
                }
            }
        })
    }
    function onEditComplete() {
        focused = false
    }
</script>

<div 
    class="text-entry"
    class:text-entry--focused={focused}
    class:text-entry--icon-img={icon.type === "img"}
    class:text-entry--icon-emoji={icon.type === "emoji"}
    bind:this={textEntryElem}
>
    <div class="flx" style:width="100%">
        <button 
            id={"icon-picker--dbtn"}
            class="text-entry__icon" 
            class:text-entry__icon--img={icon.type === "img"}
            class:hidden={!hasIcon}
            on:click={() => iconPicker = !iconPicker}
        >
            {#if icon.type === "img"}
                <img src={icon.src} alt="icon">
            {:else}
                {icon.src}
            {/if}
        </button>
        <div style:width="100%">
            <div 
                id={INPUT_ID}
                class="text-editor"
                contenteditable
                spellcheck="false"
            >
                {@html text}
            </div>
        </div>
    </div>
    <div class="text-entry__details" class:hidden={!focused}>
        <button on:click={() => {
            hasIcon = !hasIcon
        }}>
            {hasIcon ? "Remove Icon" : "Add Icon"}
        </button>
        <div class="text-entry__count">
            {length} characters
        </div>
        <button>
            Done
        </button>
    </div>
    <IconPicker 
        position={{ 
            top: `${icon.type === "img" ? 66 : 40}px`, 
            left: "-20px"
        }}
        isOpen={iconPicker}
        optnClicked={type => {
            if (type === "img") {
                initImgModal()
            }
            else if (type === "emoji") {
                initEmojiPicker()
            }
            iconPicker = false
        }}
    />
</div>

<style global lang="scss">
    @import "../../../scss/inputs.scss";

    .text-entry {
        margin: 12px 0px 15px -3px;
        background-color: rgba(var(--textColor1), 0.01);
        padding: 5.5px 14px 9px 14px;
        border-radius: 10px;
        border: 1.5px dashed rgba(var(--textColor1), 0.06);
        width: 100%;
        position: relative;

        &--focused {
            padding-bottom: 7px !important;
        }
        &--icon-emoji {
            padding: 3px 14px 6px 11px;

            .text-editor {
                padding-top: 6px;
                width: calc(100% - 20px) !important;    
            }
        }
        &--icon-img {
            padding: 0px 14px 14px 11px;

            .text-editor {
                padding-top: 8px;
                width: calc(100% - 20px) !important; 
            }
        }
        
        &__details {
            width: 100%;
            height: 34px;
            margin-top: 15px;
            padding: 4px 2px 2px 2px;
            border-top: 1px solid rgba(var(--textColor1), 0.06);
            @include flex(center, space-between);
        }
        &__count {
            @include text-style(0.1, 400, 1.3rem, "DM Sans");
        }
        &__icon {
            @include square(25px, 3px);
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
                @include square(100%, 5px);
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
    .text-entry .text-editor {
        cursor: text;
        @include text-style(_, 500, 1.5rem);
        color: rgb(150, 150, 150);
        line-height: 1.3;
        width: 100%;
    }
</style>