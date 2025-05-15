<script lang="ts">
	import { onMount } from "svelte"
    import { v4 as uuidv4 } from 'uuid'
    import { themeState } from "$lib/store"
    import { imageUpload } from "$lib/pop-ups"
    import { TextEditorManager } from "$lib/text-editor"
	import { MAX_NOTE_LENGTH, MAX_NOTES } from "$lib/constants"
	import { clickOutside, removeItemArr } from "$lib/utils-general"
	import { createNote, deleteNote, updateBulletin, updateNote } from "$lib/api-bulletin"

	import DropdownList from "$components/DropdownList.svelte"

    export let bulletin: BulletinOptions
    export let fullWidth: boolean
    
    const INPUT_ID = "bulletin-input"
    
    let { imgSrc, hasNotes, contentsOnHover, notes, noteIdx } = bulletin
    let isPointerOver = false
    let hasContextMenu = false
    
    $: light = !$themeState.isDarkTheme
    $: contentsOnHover = light ? true : contentsOnHover

    let newNoteTxt = ""
    let imgLoading = false
    let adding = false
    let edited = false
    let contextPos = { left: -1000, top: -1000 }

    const editor = new TextEditorManager({ 
        initValue: getNote(noteIdx)?.text || "",
        maxLength: MAX_NOTE_LENGTH,
        allowFormatting: false,
        id: INPUT_ID,
        handlers: {
            onInputHandler: (_, val) => {
                newNoteTxt = val
                edited = true
            },
            onBlurHandler: () => onEditComplete()
        }
    })

    function getNote(idx: number) {
        return notes.find(note => note.idx === idx)

    }
    async function onEditComplete() {
        const note = getNote(noteIdx)!
        const same = newNoteTxt == note.text
        const empty = !newNoteTxt.trim()

        // if note is empty, remove it
        if (empty && notes.length > 0) {
            removeNote(noteIdx, adding)
            return
        }
        note.text = newNoteTxt
        bulletin.notes = notes

        // add has been completed
        if (adding && !empty) {
            completeAdd(note)
        }
        else if (!same && !empty) {
            updateNote({ id: note.id, text: newNoteTxt })
        }
    }

    /* note add / remove */
    async function completeAdd(note: Note) {
        adding = false
        addUpdateIndices(note)
        
        note.id = await createNote({ idx: noteIdx, text: newNoteTxt })
    }
    function onAddNewNote() {
        if (notes.length >= MAX_NOTES) {
            return
        }
        const newNote: Note = {
            id: uuidv4(),
            idx: noteIdx + 1,
            text: "",
            userId: ""
        }
        notes.splice(noteIdx + 1, 0, newNote)
        newNoteTxt = ""
        
        noteIdx = noteIdx + 1
        hasContextMenu = false
        
        editor.updateText("")
        setTimeout(() => editor.focus(), contentsOnHover ? 400 : 0) // wait for text to be visible

        bulletin.notes = notes
        adding = true
    }
    function removeNote(idx: number, emptyAdd?: boolean) {
        const { id: removeId, idx: removeIdx } = getNote(idx)!
        removeItemArr({ array: notes, itemIdx: removeIdx })

        const length = notes.length

        if (idx < notes.length) {
            editor.updateText(getNote(idx)!.text)
        }
        else if (length > 0) {
            const newIdx = idx < length ? idx : idx - 1
            editor.updateText(getNote(newIdx)!.text)
            noteIdx = newIdx

            updateBulletin({ noteIdx })
        }
        else {
            editor.updateText("")
            noteIdx = 0

            updateBulletin({ noteIdx })
        }

        bulletin.notes = notes

        if (!emptyAdd) {
            deleteNote({ noteId: removeId, idx: removeIdx })
        }
    }
    function addUpdateIndices(note: Note) {
        const idx = note.idx
        for (let i = 0; i < notes.length; i++) {
            if (notes[i].idx >= idx && notes[i].id !== note.id) {
                notes[i].idx += 1
            }
        }
    }

    /* ui */
    async function onPointerUp(e: PointerEvent) {
        const target = e.target as HTMLElement
        const width = target.clientWidth

        if (edited) {
            edited = false
            return
        }
        else if (e.button != 0 || target.id === INPUT_ID || !hasNotes || notes.length === 0 || target.tagName === "BUTTON") {
            return
        }
        else if (e.offsetX <= width / 2) {
            noteIdx = ((noteIdx - 1) + notes.length) % notes.length
        }
        else {
            noteIdx = (noteIdx + 1) % notes.length
        }
        setNoteIdx(noteIdx)
    }
    function setNoteIdx(idx: number) {
        noteIdx = idx

        updateBulletin({ noteIdx })
        bulletin.noteIdx = idx
        editor.updateText(getNote(noteIdx)!.text)
    }
    function uploadImg(img: string) {
        imgLoading = true

        updateBulletin({ imgSrc: img })
            .then(() => {
                imgSrc = img
                bulletin.imgSrc = imgSrc 
                imgLoading = false
            })
            .finally(() => {
                imgLoading = false
            })
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
                uploadImg(img)
            }
        })
    }

    onMount(() => {
        if (notes.length > 0) {
            editor.updateText(getNote(noteIdx)!.text)
        }
    })
</script>


<div style:position="relative" style:height="100%">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="bulletin"
        class:bulletin--light={light}
        class:bulletin--show-on-hover={contentsOnHover && !adding}
        class:bulletin--is-over={isPointerOver}
        class:bulletin--no-notes={!hasNotes}
        style:--font-size={fullWidth ? "1.35rem" : "1.2rem"}
        on:contextmenu={onContextMenu}
        on:pointerup={onPointerUp}
        on:pointerover={() => isPointerOver = true}
        on:pointerleave={() => isPointerOver = false}
        use:clickOutside on:outClick={() => edited = false}
    >
        <img src={imgSrc} alt="">
        <div class="bulletin__content" class:hidden={!hasNotes}>
            <div 
                id={INPUT_ID}
                class="text-editor"
                data-placeholder={notes.length === 0 ? "reminders, ideas, thoughts, affirmations, go here..." : "type here..."}
                contenteditable
                spellcheck="false"
            >
            </div>
        </div>
        {#if notes.length > 0}
            <button 
                class="fraction"
                on:click={() => setNoteIdx(0)}
            >
                <span style:margin-right="3px">#</span>
                {noteIdx + 1}
            </button>
        {/if}
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
                    active: bulletin.hasNotes,
                    onToggle: () => {
                        hasNotes = !hasNotes
                        bulletin.hasNotes = hasNotes

                        updateBulletin({ hasNotes: hasNotes })
                    }
                },
                {
                    name: bulletin.hasNotes ? "Auto Display" : "",
                    active: bulletin.contentsOnHover,
                    divider: true,
                    onToggle: () => {
                        contentsOnHover = !contentsOnHover
                        bulletin.contentsOnHover = contentsOnHover

                        updateBulletin({ contentsOnHover: contentsOnHover })
                    }
                },
                {
                    name: bulletin.hasNotes && notes.length < MAX_NOTES ? "Add New Note" : "",
                },
                {
                    name: bulletin.hasNotes ? "Remove Note" : ""
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
    @use "../../../scss/dropdown.scss" as *;
    @use "../../../scss/inputs.scss" as *;

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
        &:hover .fraction {
            opacity: 0.3;
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
            width: 80%;
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
        .fraction {
            @include abs-bottom-left(10px, 10px);
            opacity: 0;
            transition: opacity 0.1s ease-in-out 0.2s;
            color: rgba(white, 1);
            z-index: 1000;

            &:hover {
                opacity: 0.8;
            }
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