<script lang="ts">
	import BounceFade from "../../../components/BounceFade.svelte";
	import DropdownList from "../../../components/DropdownList.svelte";
	import ToggleBtn from "../../../components/ToggleBtn.svelte";
	import { globalContext, themeState } from "../../../lib/store";
	import { clickOutside } from "../../../lib/utils-general";
	import { TextEditorManager } from "$lib/inputs"
	import ImgUpload from "../../../components/ImgUpload.svelte"
	import { ModalType } from "../../../lib/enums";

    export let options: {
        contentsOnHover?: boolean
    } | undefined = undefined

    // const contentsOnHover = options?.contentsOnHover ?? true
    $: isLight = !$themeState.isDarkTheme

    const MAX_NOTE_LENGTH = 300
    const INPUT_ID = "bulletin-input"
    
    let contentsOnHover = isLight
    let isPointerOver = false
    let fontSize = 1.2
    let contextPos: OffsetPoint = {
        left: -1000, top: -1000
    }
    let hasNotes = true
    let hasContextMenu = false
    let titleEditor: TextEditorManager
    let blurred = false
    let newNoteTxt = ""
    // let bulletinImg = "https://i.pinimg.com/564x/81/2d/7b/812d7be9f97ac8a753e6a73997c71fea.jpg"
    let bulletinImg = "https://i.pinimg.com/736x/2e/ec/f9/2eecf97b4032e2c96df00e137a789708.jpg"
    let isImgModalOpen = false
    
    let notes = [
        "real growth starts when you're tired of your own shit",
        "Inner peace over everything else.",
        "Can't approach new energy and new life with the same attitude u was using to maintain ya old shit!",
        "How would the most relaxed version of you approach it? The most confident version? Your best version?",
        "Life begins at the end of your comfort.",
        "Everything in life starts with your mindset first and your actions second. <br><br>Your actions follow your thoughts, your beliefs and ideas.",
        "Be yourself so the people looking for you can find you.",
        "You gotta learn how to move from things that don't serve you well.",
        "Decide what kind of life you actually want. And then say no to everything that isn't that.",
        "Self love is the highest frequency that attracts everything you desire.",
        "Do not rely on transient feelings, rely on who you desire to be on this day, in this lifetime. <br><br>What would they do. Don't ask yourself if you want to do it. <br><br>Ask your future self if they want you to do it. <br><br>You do it for that person.",
        "If you only listen to yourself, all you will do is recreate the same reality that you've always been living in. <br><br>If you keep reframing your everyday from within your future, idealized best-self, you will inch closer and closer to be that person",
        "What a disgrace it is for a man to grow old without ever seeing the beauty and strength of which his body is capable.",
        "I'm in love with my future.",
        "It's the small habits. How you spend your mornings. <br><br> How you talk to yourself. Your first instinct when boredom arises. <br><br>What you choose to spend enery on. Who you share your energy with. That will change your life.",
        "The past is just a story we tell ourselves.",
        "You need 3 daily wins: <br><br>A physical win. <br>A mental win. <br>A spiritual win.",
        "I love ppl with good energy. It makes me so happy.",
        "If the mind wanders 100 times, simply invite it back 100 times.<br><br> Each time you bring your mind back without judgement, it is like a bicep curl for your brain.",
        "Spoiler: it absolutely does workout for you, and even better than you anticipated.",
        "Develop a strong opinion of yourself so you don't end up internalizing the beliefs others have of you.",
        "Wheresoever you go, go with all your heart.",
        "Someone could be more successful than you and still envy you because your character carries more weight than their status.",
        "You have to get so confident in who you are that no one's opinion, rejection, or behavior can fucking rock you.",
    ]
    let noteIdx = 0

    titleEditor = new TextEditorManager({ 
        initValue: notes[noteIdx],
        placeholder: "type note here...",
        maxLength: MAX_NOTE_LENGTH,
        id: INPUT_ID,
        handlers: {
            onInputHandler: (_, val) => {
                newNoteTxt = val
                console.log({ newNoteTxt })
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
        blurred = true
    }
    function removeNote(idx: number) {
        notes.splice(idx, 1)

        // undefined if removing from the end
        if (notes[idx]) {
            titleEditor.updateText(notes[idx])
        }
        else {
            titleEditor.updateText(notes[idx - 1])
            noteIdx--
        }
    }
    function onPointerUp(e: PointerEvent) {
        const target = e.target as HTMLElement
        const width = target.clientWidth
        const x = e.offsetX

        if (e.button != 0 || target.id === INPUT_ID) {
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

        titleEditor.updateText(notes[noteIdx])
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
        noteIdx = notes.length - 1
        newNoteTxt = ""
        titleEditor.focus()
        hasContextMenu = false
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
        style:font-size={`${fontSize}rem`}
        on:contextmenu={onContextMenu}
        on:pointerup={onPointerUp}
        on:pointerover={() => isPointerOver = true}
        on:pointerleave={() => isPointerOver = false}
    >
        <img src={bulletinImg} alt="">
        <div class="bulletin__content" class:hidden={!hasNotes}>
            <div 
                id={INPUT_ID}
                class="text-editor"
                data-placeholder={titleEditor.placeholder}
                contenteditable
                spellcheck="false"
                on:input={(e) => titleEditor.onInputHandler(e)}
                on:focus={(e) => titleEditor.onFocusHandler(e)}
                on:blur={(e) => titleEditor.onBlurHandler(e)}
                on:paste={(e) => titleEditor.onPaste(e)}
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
                    on:click={() => {
                        isImgModalOpen = true
                        hasContextMenu = false
                    }}
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

{#if isImgModalOpen} 
    <ImgUpload
        title="Bulletin Background"
        constraints={{ 
            maxMbSize: 5
        }}
        onSubmit={(img) => {
            if (bulletinImg != img) {
                bulletinImg = img
                isImgModalOpen = false
            }
        }}
        onClickOutside={() => isImgModalOpen = false}
    />
{/if}

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

        &--light p {
            font-weight: 500;
            color: white !important;
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
            @include text-style(0.8, 400, _, "DM Mono");
            font-size: var(--font-size);
        }
        &__content {
            width: 100%;
            height: 100%;
            text-align: center;
            z-index: 2;
            background-color: rgba(black, 0.5);
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