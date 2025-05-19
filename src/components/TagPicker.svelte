<script lang="ts">
	import { onMount } from "svelte"

    import { Icon } from "$lib/enums"
    import { themeState } from "$lib/store"
	import { cursorPos } from "$lib/utils-home"
	import { TEST_TAGS } from "$lib/mock-data-tags"
	import { colorPicker, emojiPicker, tagPicker } from "$lib/pop-ups"
    import { COLOR_SWATCHES, getSwatchColors } from "$lib/utils-colors"
	import { randomArrayElem, removeItemArr, reorderItemArr } from "$lib/utils-general"
    
    import SvgIcon from "./SVGIcon.svelte"
	import EmptyList from "./EmptyList.svelte"
	import BounceFade from "./BounceFade.svelte"
	import DropdownList from "./DropdownList.svelte"
	import ConfirmationModal from "./ConfirmationModal.svelte"

    const { close, state, onSubmitTag } = tagPicker

    const MAX_TAG_NAME_LENGTH = 20
    const MAX_TAGS = 20

    const EXAMPLE_TAGS = [
        { name: "Health", emoji: "💪", color: COLOR_SWATCHES[3] }, 
        { name: "Relationships", emoji: "❤️", color: COLOR_SWATCHES[0] }, 
        { name: "Meditation", emoji: "🌿", color: COLOR_SWATCHES[3] },
        { name: "Reading", emoji: "📖", color: COLOR_SWATCHES[7] },
        { name: "Writing", emoji: "📝", color: COLOR_SWATCHES[1] },
        { name: "Business", emoji: "💵", color: COLOR_SWATCHES[4] },
    ]

    let tags: Tag[] = TEST_TAGS

    $: light = !$themeState.isDarkTheme
    $: isOpen = $state.isOpen
    $: pickedTag = $state.tag
    $: position = $state.position ?? { top: 0, left: 0 }

    let dropdownPos = { left: 0, top: 0 }
    let width = 0
    let tagPickerRef: HTMLElement | null = null
    let listRef: HTMLElement | null = null

    let dropdownOpen = false
    let inputFocus = false
    let dragging = false
    let colorsOpen = false
    let emojiOpen = false
    let newName = ""

    let editTag: Tag | null = tags[1]
    let renaming = false
    let srcId: string = ""
    let targetId: string = ""
    let searchQuery = ""
    let deleteConfirm = false

    let randEmoji = ""
    let randColor: Color | null = null

    $: canCreateNewTag = searchQuery.trim().length > 0 && !tags.find(tag => tag.name.toLowerCase() === searchQuery.toLowerCase())
    $: viewTags = tags.filter(tag => tag.id !== "*" && tag.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => a.idx - b.idx)

    $: if (!searchQuery) {
        randEmoji = randomArrayElem(["🔖", "🌿", "👏", "💵"])
        randColor = randomArrayElem(COLOR_SWATCHES)
    }
    $: if (!isOpen) {
        closeOpenPickers()
        dropdownOpen = false
        searchQuery = ""
    }

    /* edits */
    function onNewTagClicked(emoji: string, color: Color | null) {
        if (!color) return

        const newTag: Tag = {
            id: crypto.randomUUID(),
            name: searchQuery,
            idx: tags.length,
            symbol: { emoji, color }
        }

        tags = [...tags, newTag]
        searchQuery = ""
    }
    function confirmDelete() {
        const picked = pickedTag?.id === editTag?.id
        tags = removeItemArr({
            array: tags.filter(tag => tag.id !== "*"),
            itemIdx: editTag!.idx
        })

        deleteConfirm = false
        editTag = null

        if (picked) {
            onSubmitTag(null)
        }
    }

    /* options */
    function initDropdown(tag: Tag) {
        editTag = tag
        const { top, left } = tagPickerRef!.getBoundingClientRect()
        const { top: c_top, left: c_left }  = cursorPos

        dropdownPos.top = c_top - top
        dropdownPos.left = c_left - left
        dropdownOpen = true
    }
    function onRename(newName: string) {
        renaming = false
        if (!editTag) return
        if (newName.length === 0 || tags.find(tag => tag.name === newName)) {
            newName = editTag.name
        }

        searchQuery = ""
        editTag.name = newName
        initChanges()
    }
    function initChanges() {
        const tag = tags.find(tag => tag.id === editTag!.id)
        if (!tag || !editTag) return

        tag.name = editTag.name
        tag.symbol.emoji = editTag.symbol.emoji
        tag.symbol.color = editTag.symbol.color

        editTag = null
        tags = tags

        if (pickedTag?.id === tag.id) {
            onSubmitTag(tag)
        }
    }
    function dropdownOptnClicked(name: string) {
        if (name === "Rename") {
            renaming = true
            newName = editTag!.name

            requestAnimationFrame(() => {
                const renamingTag = document.getElementById("renaming-tag")
                renamingTag?.focus()
            })
        }
        else if (name === "Change Emoji") {
            initEmojiPicker()
        }
        else if (name === "Change Color") {
            initColorPicker()
        }
        else if (name === "Delete") {
            deleteConfirm = true
        }
        dropdownOpen = false
    }
    /* pop ups */
    function initEmojiPicker() {
        emojiOpen = true
        emojiPicker.init({
            dmenuId: "tag-picker",
            onClose: () => {
                emojiOpen = false
            },
            onSubmitEmoji: (emoji) => {
                editTag!.symbol.emoji = emoji.native
                initChanges()
            }
        })
    }
    function initColorPicker() {
        colorsOpen = true
        colorPicker.init({
            dmenuId: "tag-picker",
            picked: editTag!.symbol.color,
            onClose: () => {
                colorsOpen = false
            },
            onSubmitColor: (color) => {
                colorsOpen = false
                editTag!.symbol.color = color
                initChanges()
                colorPicker.close()
            }
        })
    }
    function closeOpenPickers() {
        if (colorsOpen) {
            colorPicker.close()
        }
        if (emojiOpen) {
            emojiPicker.close()
        }
    }

    /* dragging */
    function onDragStart(e: DragEvent) {
        if (!dragging) {
            e.preventDefault()
            return
        }
        const target = e.target as HTMLElement
        srcId = target.dataset.tagId || ""

        e.dataTransfer?.setData("text", "")
        e.dataTransfer!.effectAllowed = "move"

        listRef!.addEventListener("dragend", onDragEnd)
        listRef!.addEventListener("dragover", onDrag)
    }
    function onDrag(e: DragEvent) {
        e.preventDefault()

        const target = e.target as HTMLElement
        const elem = target.closest(".tag-picker__dropdown-opt") as HTMLElement

        if (elem) {
            targetId = elem.dataset.tagId || ""
        }
    }
    function onDragEnd() {
        if (srcId && targetId) {
            const srcIdx = tags.find(tag => tag.id === srcId)!.idx
            const targetIdx = tags.find(tag => tag.id === targetId)!.idx

            tags = reorderItemArr({ array: tags, srcIdx, targetIdx })
        }
        listRef!.removeEventListener("dragend", onDragEnd)
        listRef!.removeEventListener("dragover", onDrag)

        srcId = ""
        targetId = ""
    }

    /* misc. */
    function getRandTag() {
        const { name, emoji, color } = randomArrayElem(EXAMPLE_TAGS)

        return {
            name,
            idx: tags.length,
            symbol: { emoji, color },
            id: crypto.randomUUID()
        }
    }
    function onKeyUp(e: KeyboardEvent) {
        const { key } = e
        if (key === "Enter" && canCreateNewTag) {
            onNewTagClicked(randEmoji, randColor)
        }
    }

    onMount(() => {
        // initEditor()
    })
</script>

<BounceFade
    dmenuId="tag-picker"
    zIndex={10000}
    isHidden={!isOpen}
    position={{
        top: `${position.top}px`,
        left: `${position.left}px`,
    }}
    onClickOutside={() => {
        if (emojiOpen || colorsOpen) {
            closeOpenPickers()
            return
        }
        if (renaming || deleteConfirm) {
            return
        }
        close()
    }}
>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
        role="dialog"
        class="tag-picker" 
        class:tag-picker--light={light}
        on:pointerup={() => closeOpenPickers()}
        bind:clientWidth={width}
        bind:this={tagPickerRef}
        style:min-width={`${width}px`}
    >
        <div class="tag-picker__dmenu-container">
            <div class="tag-picker__dmenu-search">
                <input
                    type="text"
                    placeholder={tags.length === 0 ? "new tag name..." : "Search Tags"}
                    class="tag-picker__search-input"
                    class:tag-picker__search-input--border-focus={inputFocus}
                    maxLength={MAX_TAG_NAME_LENGTH}
                    spellcheck="false"
                    autocapitalize="off"
                    on:keyup={onKeyUp}
                    bind:value={searchQuery}
                    on:focus={() => inputFocus = true}
                    on:blur={() => inputFocus = false}
                />
            </div>
            <ul 
                class="tag-picker__dmenu" 
                bind:this={listRef}
                class:tag-picker__dmenu--empty={viewTags.length === 0}
            >
                {#each viewTags as tagOption, _ (tagOption.name)}
                    {@const { id, name, symbol, idx } = tagOption}
                    {@const colors = getSwatchColors({ color: symbol.color, light })}
                    {@const picked = pickedTag?.name === name}
                    {@const editing = editTag?.id === id}
                    {@const isRenaming = renaming && editing}
                    {@const dragOver = targetId === id}

                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
                    <li
                        tabindex={0}
                        role="button"
                        data-tag-id={id}
                        data-tag-idx={idx}
                        class="tag-picker__dropdown-opt drop-top-border"
                        class:tag-picker__dropdown-opt--picked={picked}
                        class:drop-top-border--over={dragOver}
                        draggable="true"
                        on:dragstart={(e) => onDragStart(e)}
                        on:contextmenu={() => {
                            initDropdown(tagOption)
                        }}
                        on:click={() => {
                            if (!isRenaming) {
                                onSubmitTag(tagOption)
                                close()
                            }
                        }}
                    >
                        <div class="tag-picker__dropdown-opt-btn">
                            <div 
                                class="grip"
                                on:pointerdown={() => dragging = true}
                                on:pointerup={() => dragging = false}
                            >
                                <div class="grip__icon">
                                    <SvgIcon icon={Icon.DragDots} options={{ scale: 1.15 }} />
                                </div>
                            </div>
                            <div 
                                class="tag"
                                style:--tag-color-primary={tagOption.symbol.color.primary}
                                style:--tag-color-1={colors[0]}
                                style:--tag-color-2={colors[1]}
                                style:--tag-color-3={colors[2]}
                            >
                                <span class="tag__symbol">
                                    {tagOption.symbol.emoji}
                                </span>
                                {#if isRenaming && editTag}
                                    <input
                                        id="renaming-tag"
                                        class="tag__title"
                                        placeholder="name goes here..."
                                        maxlength={MAX_TAG_NAME_LENGTH}
                                        type="text" 
                                        spellcheck="false"
                                        autocapitalize="off"
                                        bind:value={newName}
                                        on:blur={() => onRename(newName)}
                                    />
                                {:else}
                                    <div class="tag__title">
                                        {tagOption.name}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </li>
                {/each}
            </ul>
            {#if tags.length === 0 && !searchQuery}
                {@const { name, symbol: { emoji, color } } = getRandTag()}

                <div class="tag-picker__empty-list">
                    <EmptyList 
                        emptyText="No tags yet." 
                        subtitle={`${emoji} ${name}`}
                        buttonText="Add Tag"
                        onButtonClick={() => {
                            searchQuery = name
                            onNewTagClicked(emoji, color)
                        }}
                    />
                </div>
            {/if}
            {#if searchQuery && canCreateNewTag && tags.length <= MAX_TAGS && randColor}
                {@const colors = getSwatchColors({ color: randColor, light })}
                    <div 
                    class="tag-picker__dmenu-add"
                    class:border-top={viewTags.length > 0}
                >
                    <div 
                        class="tag"
                        style:--tag-color-1={colors[0]}
                        style:--tag-color-2={colors[1]}
                        style:--tag-color-3={colors[2]}
                    >
                        <span class="tag__symbol">
                            {randEmoji}
                        </span>
                        <div class="tag__title">
                            {searchQuery}
                        </div>
                    </div>
                    <button 
                        on:click={() => onNewTagClicked(randEmoji, randColor)}
                    >
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 1.2, strokeWidth: 1.2, opacity: 0.7 }}
                        />
                    </button>
                </div>  
            {/if}
        </div>
    </div>

    <DropdownList
        isHidden={!dropdownOpen}
        options={{
            listItems: [
                {
                    sectionName: editTag?.name ?? "",
                },
                { 
                    name: "Rename"
                },
                { 
                    name: "Change Emoji"
                },
                { 
                    name: "Change Color",
                    divider: true,
                },
                { 
                    name: "Delete"
                },
            ],
            onListItemClicked({ name }) {
                dropdownOptnClicked(name)
            },
            onClickOutside: () => {
                dropdownOpen = false
            },
            styling: { 
                zIndex: 10000,
                minWidth: "120px",
            },
            position: { 
                top: `${dropdownPos.top}px`,
                left: `${dropdownPos.left}px`,
            }
        }}
    />
</BounceFade>

{#if deleteConfirm} 
    <ConfirmationModal 
        text="Are you sure? <br><br> All references to this tag will be removed!"
        confirmText="Yes, Delete"
        type="delete"
        onCancel={() => {
            deleteConfirm = false
            editTag = null
        }}
        onOk={confirmDelete}
    /> 
{/if}


<style lang="scss">
    @use "../scss/dropdown.scss" as *;
    @use "../scss/inputs.scss" as *;

    .tag-picker {
        --tag-hov-brightness: 1.1;
        --optn-hov-opacity: 0.02;

        --ip-bg-opacity: 0.02;
        --ip-focus-bg-opacity: 0.03;
        --ip-placeholder-opacity: 0.3;
        --ip-focus-shadow-opacity: 0.035;
        
        &--light {
            --tag-hov-brightness: 1.015;
            --optn-hov-opacity: 0.03;

            --ip-bg-opacity: 0.05;
            --ip-focus-bg-opacity: 0.05; 
            --ip-placeholder-opacity: 0.6;
            --ip-focus-shadow-opacity: 0.075;
        }
        &--light &__dmenu-container {
            @include contrast-bg("bg-3");
        }
        &--light &__search-input {
            @include text-style(0.9);
        }
        &--light &__dmenu-add button {
            opacity: 0.4;
        }
        &--light .grip__icon {
            opacity: 0.2;
        }
        
        &__dmenu-container {
            width: 220px;
            padding: 7px 0px 0px 0px;
            border-radius: 15px;
            width: 100%;

            // @include contrast-bg("bg-2");
            background-color: #171615;
            border: none;
        }
        &__dmenu {
            max-height: 280px;
            overflow-y: scroll;
            padding: 0px 0px 5px 0px;

            &--empty {
                padding: 0px 0px 0px 0px;
            }
        }
        &__settings-btn {
            @include abs-top-right(5px, 8px);
            @include not-visible;
            opacity: 0.25;
            transition: 0s ease-in-out;
        }
        &__dropdown-opt {
            border-radius: 6px;
            padding: 2px 8px 2px 3px;
            user-select: text;
            position: relative;
            width: calc(100% - 11px);
            margin: 0px 0px 1px 5px;
            cursor: pointer;

            &:hover {
                background-color: rgba(var(--textColor1), var(--optn-hov-opacity));
            }
            &:hover &-check {
                @include not-visible;
            }
            &--picked {
                background-color: rgba(var(--textColor1), 0.02);
            }
            &--picked &-check {
                @include visible(0.5);
            }
            &-check {
                @include not-visible;
            }
            i {
                font-size: 1.05rem;
                color: rgba(var(--textColor1), 1);
            }
        }
        &__dropdown-opt:hover &__settings-btn {
            @include visible(0.2);

            &:hover {
                opacity: 0.8 !important;
            }
        }
        &__dropdown-opt-btn {
            @include flex(center);
            width: 100%;
            margin-right: 4px;
            height: 26px;

            &:hover { 
                filter: brightness(var(--tag-hov-brightness));
            }
        }
        &__dmenu-search {
            width: 100%;
            margin-bottom: 0px;
            padding: 0px 0px 5px 6px;
        }
        &__search-input {
            width: calc(100% - 25px);
            padding: 7px 8px 7px 8px;
            border-radius: 9px;
            background: rgba(var(--textColor1), var(--ip-bg-opacity));
            color: rgba(var(--textColor1), var(--ip-text-opacity));
            border: 1px solid transparent;
            @include text-style(1, var(--fw-400-500), 1.3rem);
            transition: box-shadow 0.2s ease-in-out,
            background-color 0.1s ease-in-out;

            &::placeholder {
                color: rgba(var(--textColor1), var(--ip-placeholder-opacity));
            }
        }
        &__search-input--border-focus {
            background: rgba(var(--textColor1), var(--ip-focus-bg-opacity));
            box-shadow: rgba(var(--textColor1), var(--ip-focus-shadow-opacity)) 0px 0px 0px 1.5px inset, 
                        rgba(var(--textColor1), calc(var(--ip-focus-shadow-opacity) - 0.01)) 0px 0px 0px 3px;
        }
        &__dmenu-add {
            padding: 7px 8px;
            @include flex(center, space-between);
            width: 100%;

            span {
                @include elipses-overflow;
                max-width: 165px;
            }
        }
        &__dmenu-add button {
            opacity: 0.2;
            margin-right: 5px;
            @include text-style(1, var(--fw-400-500), 1.25rem);

            &:hover {
                opacity: 0.85;
            }
            &--disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }
        &__dmenu-add .tag {
            border-radius: 6px;
            max-width: calc(100% - 0px);
            margin-right: 10px;
        }
        &__dmenu-add .tag__title {
            @include elipses-overflow;
        }
        &__empty-list {
            @include center;
            height: 150px;
            padding-bottom: 10px;
        }
    }
    .tag {
        border-radius: 6px;
        transition: 0.1s ease-in-out;
        padding: 3px 5px 3.5px 7px;

        &__symbol {
            cursor: pointer;
            margin-right: 10px;
            font-size: 0.9rem !important;
        }
        &__title {
            font-weight: var(--fw-400-500);
            margin-right: 4px;
            color: rgba(var(--tag-color-1), 1);
            @include truncate-lines(1);
            font-size: 1.18rem !important;
            height: 16px;
            cursor: pointer;
        }
        &__title::placeholder {
            color: rgba(var(--tag-color-1), 0.4);
        }
    }
    input.tag__title {
        cursor: text;
    }
    .grip {
        position: relative;
        left: unset;
        top: unset;
        margin-right: 6px;
        
        &__icon {
            opacity: 0.08;
            visibility: visible;
            background: none !important;
        }
    }
    .drop-top-border::before {
        width: calc(100% - 10px);
        @include abs-top-left(0px, 5px);
    }

</style>