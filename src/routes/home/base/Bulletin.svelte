<script lang="ts">
    import { imageUpload } from "$lib/pop-ups"
    import { themeState } from "../../../lib/store"
    import { TextEditorManager } from "$lib/inputs"
    import { clickOutside } from "../../../lib/utils-general"

	import ToggleBtn from "../../../components/ToggleBtn.svelte"
	import BounceFade from "../../../components/BounceFade.svelte"

    export let fullWidth: boolean
    export let content: {
        img: string,
        hasNotes: boolean,
        contentsOnHover: boolean,
        notes: string[],
        noteIdx: number
    }

    // const contentsOnHover = options?.contentsOnHover ?? true
    $: isLight = !$themeState.isDarkTheme

    const MAX_NOTE_LENGTH = 300
    const INPUT_ID = "bulletin-input"

    let { img, hasNotes, contentsOnHover, notes, noteIdx } = content
    
    let isPointerOver = false
    let fontSize = 1.25
    let contextPos: OffsetPoint = {
        left: -1000, top: -1000
    }
    let hasContextMenu = false
    let blurred = false
    let newNoteTxt = ""
    
    let editor = new TextEditorManager({ 
        initValue: notes[noteIdx],
        placeholder: "type note here...",
        maxLength: MAX_NOTE_LENGTH,
        id: INPUT_ID,
        handlers: {
            onInputHandler: (_, val) => {
                newNoteTxt = val
            },
            onBlurHandler: () => onEditComplete()
        }
    })

    function onEditComplete() {
        if (!newNoteTxt) {
            removeNote(noteIdx)
        }
        else if (newNoteTxt != notes[noteIdx]) {
            notes[noteIdx] = newNoteTxt
        }

        notes = notes
        content.notes = notes
        blurred = true
    }
    function removeNote(idx: number) {
        notes.splice(idx, 1)

        // undefined if removing from the end
        if (notes[idx]) {
            editor.updateText(notes[idx])
        }
        else {
            editor.updateText(notes[0])
            noteIdx = 0
        }
    }
    function onPointerUp(e: PointerEvent) {
        const target = e.target as HTMLElement
        const width = target.clientWidth
        const x = e.offsetX

        if (e.button != 0 || target.id === INPUT_ID || !hasNotes) {
            return
        }
        if (blurred) {
            blurred = false
            return
        }

        if (x <= width / 2) {
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
        contextPos = {
            left: e.offsetX, top: e.offsetY
        }
    }
    function onAddNewNote() {
        notes.push("")
        newNoteTxt = ""

        noteIdx = notes.length - 1
        hasContextMenu = false

        editor.updateText("")
        editor.focus()
    }
    function openImgModal() {
        hasContextMenu = false

        imageUpload.init({
            onSubmit: (imgSrc: string) => {
                if (imgSrc && img != imgSrc) {
                    img = imgSrc
                    content.img = imgSrc
                }
            }
        })
    }
</script>


<!-- svelte-ignore a11y-click-events-have-key-events -->
<div style:position="relative" style:height="100%">
    <div 
        class="bulletin"
        class:bulletin--light={isLight}
        class:bulletin--show-on-hover={contentsOnHover}
        class:bulletin--is-over={isPointerOver}
        class:bulletin--no-notes={!hasNotes}
        class:bulletin--full-width={fullWidth}
        style:font-size={`${fontSize}rem`}
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
                {@html notes[noteIdx]}
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
            id="base--dmenu"
            class="base__dmenu dmenu" 
            class:dmenu--light={isLight}
            style:width={"180px"}
            use:clickOutside on:click_outside={() => hasContextMenu = false}
        >
            <li class="dmenu__option">
                <button 
                    class="dmenu__option-btn"
                    on:click={() => openImgModal()}
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
                        <button class="dmenu__option-btn" on:click={() => {
                            removeNote(noteIdx)
                            hasContextMenu = false
                        }}>
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
        --opacity: 0.5;

        &--light {
            --opacity: 0.2;
        }
        &--light p {
            font-weight: 500;
            color: white !important;
        }
        &--full-width .text-editor {
            font-size: 1.35rem !important;
        }
        &--show-on-hover &__content {
            @include not-visible;
        }
        &--is-over &__content {
            @include visible;
        }
        &--no-notes p {
            display: none !important;
        }
        &--no-notes &__content {
            background: transparent;
        }

        img {
            height: 100%;
            width: 100%;
            object-fit: cover;
        }
        p, .text-editor  {
            cursor: text;
            width: 80%;
            @include text-style(_, 400, _, "DM Mono");
            color: rgba(white, 0.95);
            font-size: var(--font-size);
        }
        &__content {
            width: 100%;
            height: 100%;
            text-align: center;
            z-index: 1;
            background-color: rgba(black, var(--opacity));
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