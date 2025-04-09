<script lang="ts">
	import { onMount } from "svelte"
    import { themeState } from "$lib/store"
    import { imageUpload } from "$lib/pop-ups"
    import { TextEditorManager } from "$lib/inputs"
    import { clickOutside } from "$lib/utils-general"

	import ToggleBtn from "$components/ToggleBtn.svelte"
	import BounceFade from "$components/BounceFade.svelte"

    export let content: Bulletin
    export let fullWidth: boolean

    $: isLight = !$themeState.isDarkTheme

    const MAX_NOTE_LENGTH = 300
    const INPUT_ID = "bulletin-input"

    let { img, hasNotes, contentsOnHover, notes, noteIdx } = content
    let isPointerOver = false
    let hasContextMenu = false
    let blurred = false

    let newNoteTxt = ""
    let contextPos = { left: -1000, top: -1000 }

    const editor = new TextEditorManager({ 
        initValue: notes[noteIdx],
        placeholder: "type note here...",
        maxLength: MAX_NOTE_LENGTH,
        allowFormatting: false,
        id: INPUT_ID,
        handlers: {
            onInputHandler: (_, val) => newNoteTxt = val,
            onBlurHandler: () => onEditComplete()
        }
    })

    function onEditComplete() {
        if (!newNoteTxt && notes.length > 0) {
            removeNote(noteIdx)
        }
        else if (newNoteTxt != notes[noteIdx]) {
            notes[noteIdx] = newNoteTxt
        }
        
        blurred = true
        notes = notes
        content.notes = notes
    }
    function removeNote(idx: number) {
        notes.splice(idx, 1)

        // undefined if removing from the end
        if (notes[idx]) {
            editor.updateText(notes[idx])
        }
        else {
            editor.updateText("")
            noteIdx = 0
        }

        notes = notes
        content.notes = notes
    }
    function onAddNewNote() {
        notes.push("")
        newNoteTxt = ""
        
        noteIdx = notes.length - 1
        hasContextMenu = false
        
        editor.updateText("")
        editor.focus()
    }
    function onPointerUp(e: PointerEvent) {
        const target = e.target as HTMLElement
        const width = target.clientWidth

        if (e.button != 0 || target.id === INPUT_ID || !hasNotes) {
            return
        }
        if (blurred) {
            blurred = false
            return
        }
        if (e.offsetX <= width / 2) {
            noteIdx = ((noteIdx - 1) + notes.length) % notes.length
        }
        else {
            noteIdx = (noteIdx + 1) % notes.length
        }
        
        content.noteIdx = noteIdx
        editor.updateText(notes[noteIdx])
    }
    function onContextMenu(_e: Event) {
        const e = _e as PointerEvent
        e.preventDefault()

        hasContextMenu = true
        contextPos = { left: e.offsetX, top: e.offsetY }
    }
    function openImgPicker() {
        hasContextMenu = false

        imageUpload.init({
            onSubmitImg: (imgSrc: string) => img = imgSrc && (content.img = imgSrc)
        })
    }

    onMount(() => {
        if (notes.length > 0) {
            editor.updateText(notes[noteIdx])
        }
    })
</script>


<div style:position="relative" style:height="100%">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="bulletin"
        class:bulletin--light={isLight}
        class:bulletin--show-on-hover={contentsOnHover}
        class:bulletin--is-over={isPointerOver}
        class:bulletin--no-notes={!hasNotes}
        style:--font-size={fullWidth ? "1.35rem" : "1.2rem"}
        on:contextmenu={onContextMenu}
        on:pointerup={onPointerUp}
        on:pointerover={() => isPointerOver = true}
        on:pointerleave={() => isPointerOver = false}
    >
        <img src={img} alt="">
        <div class="bulletin__content" class:hidden={!hasNotes}>
            <div 
                id={INPUT_ID}
                class="text-editor"
                data-placeholder={editor.placeholder}
                contenteditable
                spellcheck="false"
            >
            </div>
        </div>
    </div>
    <BounceFade 
        isHidden={!hasContextMenu}
        zIndex={200}
        position={{ 
            top: contextPos.top + "px",
            left: contextPos.left + "px"
        }}
    >
        <div 
            data-dmenu-id="base"
            class="base__dmenu dmenu" 
            class:dmenu--light={isLight}
            style:--font-size="1.32rem"
            style:width={"180px"}
            use:clickOutside on:outClick={() => hasContextMenu = false}
        >
            <li class="dmenu__option">
                <button 
                    class="dmenu__option-btn"
                    on:click={() => openImgPicker()}
                >
                    <span class="dmenu__option-text">
                        Change Background
                    </span>
                </button>
            </li>
            <li class="dmenu__section-divider"></li>
            <li class="dmenu__section">
                <div class="dmenu__section-name">
                    Notes
                </div>
                <div class="dmenu__toggle-optn  dmenu__option--static">
                    <span class="dmenu__option-heading">Include Notes</span>
                    <ToggleBtn 
                        active={hasNotes}
                        onToggle={() => {
                            hasNotes = !hasNotes
                            content.hasNotes = hasNotes
                        }}
                    />
                </div>
                {#if hasNotes}
                    <div class="dmenu__toggle-optn  dmenu__option--static">
                        <span class="dmenu__option-heading">Auto Display</span>
                        <ToggleBtn 
                            active={contentsOnHover}
                            onToggle={() => {
                                contentsOnHover = !contentsOnHover
                                content.contentsOnHover = contentsOnHover
                            }}
                        />
                    </div>
                    <li class="dmenu__section-divider"></li>
                    <div class="dmenu__option">
                        <button class="dmenu__option-btn" on:click={() => onAddNewNote()}>
                            <span class="dmenu__option-text">
                                Add New Note
                            </span>
                        </button>
                    </div>
                    <div class="dmenu__option" class:hidden={notes.length === 0}>
                        <button 
                            class="dmenu__option-btn" 
                            on:click={() => {
                                removeNote(noteIdx)
                                hasContextMenu = false
                            }}
                        >
                            <span class="dmenu__option-text">
                                Remove Note
                            </span>
                        </button>
                    </div>
                {/if}
            </li>
        </div>
    </BounceFade>
</div>

<style lang="scss">
    @import "../../../scss/dropdown.scss";
    @import "../../../scss/inputs.scss";

    .bulletin {
        width: 100%;
        height: 100%;
        overflow: visible;
        position: relative;
        user-select: none;
        overflow: visible;
        cursor: pointer;
        --overlay-opacity: 0.55;
        --text-opacity: 0.95;
        
        &--light {
            --overlay-opacity: 0.35;
            --text-opacity: 1;
        }
        &--show-on-hover &__content {
            @include not-visible;
        }
        &--is-over &__content {
            @include visible;
        }
        &--no-notes &__content {
            background: transparent;
        }

        img {
            height: 100%;
            width: 100%;
            object-fit: cover;
        }
        .text-editor {
            cursor: text;
            font-weight: 400;
            color: rgba(white, var(--text-opacity));
            font-family: "DM Mono";
            font-size: var(--font-size);
            width: 75%;
            overflow: visible;
            height: auto;
        }
        &__content {
            width: 100%;
            height: 100%;
            overflow-y: auto;
            text-align: center;
            z-index: 1;
            background-color: rgba(black, var(--overlay-opacity));
            transition: 0.2s ease-in-out 0.1s;
            @include abs-top-left;
            @include center;
        }   
    }

    div[contenteditable]:empty:before {
        content: attr(data-placeholder);
        opacity: 0.4 !important;
    }

    .dmenu {
        overflow: visible;
        padding-bottom: 5px;

        &__toggle-optn {
            padding: 4px 7px 5px 7px;
            width: 100%;
            @include flex(center, space-between);
        }
    }
</style>