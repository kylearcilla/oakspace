<script lang="ts">
	import { onMount } from "svelte"
    import { themeState } from "$lib/store"
    import { imageUpload } from "$lib/pop-ups"
    import { TextEditorManager } from "$lib/inputs"
	import DropdownList from "$components/DropdownList.svelte"

    export let options: BulletinOptions
    export let fullWidth: boolean
    export let onUpdateOptions: (updated: BulletinOptions) => void

    $: isLight = !$themeState.isDarkTheme

    const MAX_NOTE_LENGTH = 300
    const INPUT_ID = "bulletin-input"

    let { imgSrc, hasNotes, contentsOnHover, notes, noteIdx } = options
    let isPointerOver = false
    let hasContextMenu = false

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
        options.notes = notes
    }
    function removeNote(idx: number) {
        notes.splice(idx, 1)
        const length = notes.length

        if (notes[idx]) {
            editor.updateText(notes[idx])
        }
        else if (length > 0) {
            const newIdx = idx < length ? idx : idx - 1
            editor.updateText(notes[newIdx])
            noteIdx = newIdx
        }
        else {
            editor.updateText("")
            noteIdx = 0
        }

        options.notes = notes
        onUpdateOptions(options)
    }
    function onAddNewNote() {
        notes.splice(noteIdx + 1, 0, "")
        newNoteTxt = ""
        
        noteIdx = noteIdx + 1
        hasContextMenu = false
        
        editor.updateText("")
        editor.focus()

        options.notes = notes
        onUpdateOptions(options)
    }
    function onPointerUp(e: PointerEvent) {
        const target = e.target as HTMLElement
        const width = target.clientWidth

        if (e.button != 0 || target.id === INPUT_ID || !hasNotes || notes.length === 0) {
            return
        }
        if (e.offsetX <= width / 2) {
            noteIdx = ((noteIdx - 1) + notes.length) % notes.length
        }
        else {
            noteIdx = (noteIdx + 1) % notes.length
        }
        
        options.noteIdx = noteIdx
        editor.updateText(notes[noteIdx])
        onUpdateOptions(options)
    }
    function onContextMenu(e: Event) {
        const pe = e as PointerEvent
        pe.preventDefault()

        hasContextMenu = true
        contextPos = { left: pe.offsetX, top: pe.offsetY }
    }
    function openImgPicker() {
        hasContextMenu = false

        imageUpload.init({
            onSubmitImg: (img: string) => {
                imgSrc = img
                options.imgSrc = imgSrc
                onUpdateOptions(options)
            }
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
        <img src={imgSrc} alt="">
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
    <DropdownList 
        id="base"
        isHidden={!hasContextMenu} 
        options={{
            listItems: [
                {
                    name: "Change Background",
                    divider: true
                },
                {
                    sectionName: "Notes"
                },
                {
                    name: "Include Notes",
                    active: options.hasNotes,
                    onToggle: () => {
                        hasNotes = !hasNotes
                        options.hasNotes = hasNotes
                        onUpdateOptions(options)
                    }
                },
                {
                    name: "Auto Display",
                    active: options.contentsOnHover,
                    divider: true,
                    onToggle: () => {
                        contentsOnHover = !contentsOnHover
                        options.contentsOnHover = contentsOnHover
                        onUpdateOptions(options)
                    }
                },
                {
                    name: "Add New Note"
                },
                {
                    name: "Remove Note"
                },
            ],
            styling: {
                minWidth: "160px",
                fontSize: "1.32rem",
                zIndex: 1000
            },
            position: { 
                top: contextPos.top + "px",
                left: contextPos.left + "px"
            },
            onListItemClicked: ({ name }) => {
                if (name === "Change Background") {
                    openImgPicker()
                }
                else if (name === "Add New Note") {
                    onAddNewNote()
                }
                else if (name === "Remove Note") {
                    removeNote(noteIdx)
                    hasContextMenu = false
                }
            },
            onClickOutside: () => {
                hasContextMenu = false
            }
        }}
/>
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
            font-family: "Geist Mono";
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