<script lang="ts">
    import { onMount } from "svelte"

    import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { toast } from "$lib/utils-toast"
    import { colorPicker, tagPicker } from "$lib/pop-ups"
    import { getColorTrio } from "$lib/utils-colors"
    import { TextEditorManager } from "$lib/text-editor"
	import { minsFromStartToHHMM } from "$lib/utils-date"
    import { RoutinesManager } from "$lib/routines-manager"
	import { isTargetTextEditor } from "$lib/utils-general"
	import { CORE_OPTIONS, getCoreActivityIdx, getCoreStr } from "$lib/utils-routines"

	import Modal from "$components/Modal.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import TasksList from "$components/TasksList.svelte"
	import TimePicker from "$components/TimePicker.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import ConfirmBtns from "$components/ConfirmBtns.svelte"
	import DropdownBtn from "$components/DropdownBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import TagPickerBtn from "$components/TagPickerBtn.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"

    const { MAX_BLOCK_DESCRIPTION, MIN_BLOCK_DURATION_MINS, MAX_BLOCK_TITLE } = RoutinesManager
    const MAX_ACTION_ITEMS = 12

    export let routines: RoutinesManager
    export let block: RoutineBlockElem
    export let onDeleteBlock: () => void

    const DESCRIPTION_ID = "routine-block-description"
    const TITLE_ID = "routine-block-title-input"
    
    let titleElem: HTMLElement
    let settingsOpen = false, coresOpen = false
    
    let { 
        id, startTime, endTime, title, color,
        description, tasks, order, activity, tag,
        allowDescription = true, allowTasks = true
    } = block

    let _blocks = routines.editDayRoutineElems
    let isNew = routines.newBlockEdit
    let newTaskFlag = false
    let pickedCoreItemIdx = getCoreActivityIdx(activity)
    let timeError: Error | null = null
    let tagsOpen = false
    
    let saving = false
    let editHasBeenMade = false
    let confirmModalOpen = false
    let routineListRef: HTMLElement

    let colorsOpen = false

    $: isDarkTheme = $themeState.isDarkTheme
    $: blocks = $_blocks
    $: colors = getColorTrio(color, true)
    $: validateTime(startTime, endTime)

    new TextEditorManager({ 
        id: TITLE_ID,
        initValue: title,
        placeholder: "block title...",
        allowFormatting: false,
        singleLine: true,
        maxLength: MAX_BLOCK_TITLE,
        handlers: {
            onInputHandler: () => title !== block.title && toggleEditMade()
        }
    })
    new TextEditorManager({ 
        id: DESCRIPTION_ID,
        initValue: description,
        placeholder: "description here...",
        allowFormatting: false,
        maxLength: MAX_BLOCK_DESCRIPTION,
        handlers: {
            onInputHandler: () => description !== block.description && toggleEditMade()
        }
    })
    
    function toggleEditMade() {
        editHasBeenMade = true
    }
    function concludeEdit(updatedBlock: RoutineBlockElem | null) {
        routines.onConcludeModalEdit(updatedBlock)
    }
    function optnClicked(name: string) {
        if (name.toLowerCase().includes("set")) {
            toggleEditMade()
        }
        if (name.includes("Unset")) {
            order = null
        }
        else if (name === "Set as First") {
            order = "first"
        }
        else if (name === "Set as Last") {
            order = "last"
        }
        else if (name === "Delete Block") {
            onDeleteBlock()
            concludeEdit(null)
        }
        settingsOpen = false
    }
    function toggleTagPicker() {
        tagsOpen = !tagsOpen
        tagsOpen ? initTagPicker() : tagPicker.close()
    }
    function initTagPicker() {
        tagsOpen = true
        tagPicker.init({
            tag: tag ?? null,
            onClose: () => {
                tagsOpen = false
            },
            onSubmitTag: (_tag) => {
                tag = _tag
                tagsOpen = false
                if (tag?.id != block.tag?.id) {
                    toggleEditMade()
                }
            }
        })
    }
    function onCoreOptnClicked(idx: number) {
        coresOpen = false
        pickedCoreItemIdx = idx
        activity = CORE_OPTIONS[pickedCoreItemIdx][0]
        activity !== block.activity && toggleEditMade()
    }
    function onRemoveCore() {
        activity = null
        pickedCoreItemIdx = -1
        activity !== block.activity && toggleEditMade()
    }
    function onChooseColor(_color: Color) {
        color = _color
        color.name !== block.color.name && toggleEditMade()
        colorPicker.close()
    }
    function validateTime(startTime: number, endTime: number) {
        if (!blocks) return
        try {
            if (endTime - startTime < MIN_BLOCK_DURATION_MINS) {
                throw Error(`Blocks must be at least ${MIN_BLOCK_DURATION_MINS} minutes long`)
            }
            const overlapBlock = routines.getOverlappingBlock({
                blocks, startTime, endTime, excludeId: id
            })
            if (overlapBlock) {
                const { title, startTime, endTime } = overlapBlock
                const startTimeStr = minsFromStartToHHMM(startTime)
                const endTimeStr = minsFromStartToHHMM(endTime)

                throw Error(`Overlaps with \"${title}\" (${startTimeStr} - ${endTimeStr})`)
            }
            timeError = null
        }
        catch(e: any) {
            timeError = e
            initTimeErrorToast()
        }
    }
    function initTimeErrorToast() {
        if (!timeError) return

        toast("error", { 
            contextId: "time-error",
            groupExclusive: true,
            message: timeError!.message 
        })
    }

    /* conclude changes */
    async function saveChanges() {
        if (timeError || title === "" || saving) {
            timeError && initTimeErrorToast()
            return
        }
        if (!editHasBeenMade) {
            concludeEdit(null)
            return
        }

        try {
            saving = true
            await new Promise((res) => setTimeout(() => res(null), 200))
            
            const update = {
                title,
                description,
                startTime,
                allowDescription,
                allowTasks,
                endTime,
                tasks,
                order,
                activity,
                tag,
                color
            }
            concludeEdit({ ...block, ...update })
        }
        catch(e: any) {
            toast("error", { 
                contextId: "edit-block-modal", 
                groupExclusive: true,
                message: "Error saving your changes."
            })
        }
        finally {
            saving = false
        }
    }
    function onAttemptClose() {
        colorPicker.close()
        if (saving) {
            return
        }
        else if (editHasBeenMade || isNew) {
            confirmModalOpen = true
        }
        else {
            confirmUnsavedClose()
        }
    }
    function confirmUnsavedClose() {
        confirmModalOpen = false
        concludeEdit(null)
    }
    function onKeyPress(e: KeyboardEvent) {
        const target = e.target as HTMLElement
        const { metaKey, key } = e

        if (isTargetTextEditor(target) || saving) {
            return
        }
        else if (key == "Escape") {
            onAttemptClose()
        }
        else if (metaKey && key === "Enter") {
            saveChanges()
        }
    }
    /* pop ups */

    function toggleColorPicker() {
        colorsOpen = !colorsOpen

        if (colorsOpen) {
            colorPicker.init({
                picked: color,
                onSubmitColor: (color) => onChooseColor(color),
                onClose: () => colorsOpen = false
            })
        }
        else {
            colorPicker.close()
        }
    }

    onMount(() => {
        if (!title) titleElem.focus()
    })
</script>

<svelte:window on:keydown={onKeyPress} />

<Modal 
    options={{ 
        borderRadius: "14px", 
        overflowY: "visible", 
        overflowX: "visible", 
        scaleUp: true 
    }}
    onClickOutSide={() => {
        if (tagsOpen) {
            tagPicker.close()
        }
        onAttemptClose()
    }}
>
    <div 
        class="edit-routine"
        class:edit-routine--light={!isDarkTheme}
        class:edit-routine--no-tasks={!allowTasks}
        class:edit-routine--no-desc={!allowDescription}
    >
        <div class="edit-routine__header">
            <div 
                bind:this={titleElem}
                class="edit-routine__title text-editor"
                id={TITLE_ID}
                aria-label="Title"
                spellcheck="false"
                contenteditable="true"
                bind:innerText={title}
            >
            </div>
            <div class="flx-center">
                {#if order === "first" || order === "last"}
                    {@const isFirst = order === "first"}
                    <div 
                        class="edit-routine__order-context"
                        title={`${isFirst ? "First routine of the day." : "Last routine of the day."}`}
                    >
                        <SvgIcon 
                            icon={isFirst ? Icon.Sun : Icon.Moon} 
                            options={{
                                height: 18, width: 18, opacity: 0.2, scale: 0.95
                            }}
                        />
                    </div>
                {/if}
                <button 
                    data-dmenu-id="color-picker"
                    class="edit-routine__color-dbtn"
                    style:--routine-bg-color-1={colors[0]}
                    style:--routine-bg-color-2={colors[1]}
                    on:click={() => toggleColorPicker()}
                >
                    <div 
                        class="edit-routine__color-arrow arrow-down"
                        class:arrow-down--active={colorsOpen}
                    >
                        <i class="fa-solid fa-sort-down"></i>
                    </div>
                </button>
                <SettingsBtn 
                    id="block-settings"
                    onClick={() => settingsOpen = !settingsOpen}
                /> 
            </div>
            <DropdownList 
                id="block-settings"
                isHidden={!settingsOpen} 
                options={{
                    listItems: [
                        ...(order !== "last" ? [{ name: order === "first" ? "Unset as First" : "Set as First", divider: order === "first"}] : []),
                        ...(order !== "first" ? [{ name: order === "last" ? "Unset as Last" : "Set as Last", divider: true }] : []),
                        {
                            name: "Description",
                            active: allowDescription,
                            onToggle: () => {
                                allowDescription = !allowDescription
                                settingsOpen = false
                                toggleEditMade()
                            }
                        },
                        {
                            name: "Action Items",
                            active: allowTasks,
                            divider: true,
                            onToggle: () => {
                                allowTasks = !allowTasks
                                settingsOpen = false
                                toggleEditMade()
                            }
                        },
                        { name: "Delete Block" }
                    ],
                    position: { 
                        top: "40px", right: "0px" 
                    },
                    styling: { 
                        minWidth: "150px" 
                    },
                    onListItemClicked: ({ name }) => {
                        optnClicked(name)
                    },
                    onClickOutside: () => {
                        settingsOpen = false
                    }
                }}
            />
        </div>
        <!-- info -->
        <div 
            class="edit-routine__info"
            style:margin-bottom={allowTasks || allowDescription ? "15px" : "60px"}
        >
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Tag
                </div>
                <div class="edit-routine__info-val">
                    <TagPickerBtn 
                        {tag}
                        onClick={() => toggleTagPicker()}
                        styling={{ 
                            borderRadius: "12px" 
                        }}
                    />
                </div>
            </div>
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Time
                </div>
                <div class="edit-routine__info-val">
                    <div class="edit-routine__time">
                        <div class="edit-routine__time-input-container">
                            <TimePicker
                                id="start"
                                error={timeError}
                                options={{ 
                                    start: startTime,
                                    max: endTime - 15
                                }}
                                onSet={(time) => { 
                                    startTime = time
                                    startTime !== block.startTime && toggleEditMade()
                                }}
                            />
                        </div>
                        <span>to</span>
                        <div class="edit-routine__time-input-container">
                            <TimePicker 
                                id="end"
                                error={timeError}
                                options={{ 
                                    start: endTime,
                                    min: startTime + 15
                                }}
                                onSet={(time) => { 
                                    endTime = time
                                    endTime !== block.endTime && toggleEditMade()
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Core
                </div>
                <div style:position="relative">
                    <div class="edit-routine__core">
                        <DropdownBtn 
                            id={"core-dropdown"}
                            isActive={coresOpen}
                            options={{
                                allowEmpty: true,
                                noBg: false,
                                title: getCoreStr(activity),
                                onClick: () => {
                                    coresOpen = !coresOpen
                                },
                                onRemove:() => {
                                    onRemoveCore()
                                },
                                styles: { 
                                    fontSize: "1.285rem", 
                                    padding: "6px 10px 6.5px 10px" 
                                }
                            }} 
                        />
                        <DropdownList 
                            id={"core-dropdown"}
                            isHidden={!coresOpen} 
                            options={{
                                listItems: CORE_OPTIONS.map((coreKey) => ({ name: coreKey[1] })),
                                pickedItem: pickedCoreItemIdx,
                                position: { 
                                    top: "29px", left: "0px" 
                                },
                                styling: { 
                                    width: "88px" 
                                },
                                onListItemClicked: ({ idx }) => {
                                    onCoreOptnClicked(idx)
                                },
                                onClickOutside: () => {
                                    coresOpen = false
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
        <div 
            class:hidden={!allowDescription}
            style:padding="5px 20px 0px 20px" 
        >
            <div 
                class="edit-routine__info-title"
                style:margin-bottom="2px"
            >
                    Description
            </div>
            <div 
                id={DESCRIPTION_ID}
                class="edit-routine__description text-editor"
                aria-label="Description"
                contenteditable
                spellcheck="false"
                bind:textContent={description}
            />
        </div>

        <!-- action items -->
        <div class="edit-routine__list" class:hidden={!allowTasks}>
            <div class="edit-routine__list-header">
                <div class="flx-center">
                    <div 
                        class="edit-routine__info-title" 
                        style:width="auto"
                    >
                        Action Items
                    </div>
                    <button 
                        class="edit-routine__add-btn"
                        on:click={() => newTaskFlag = !newTaskFlag}
                    >
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 1.15, strokeWidth: 1.2, opacity: 0.8 }}
                        />
                    </button>
                </div>
                <span>
                    {tasks.filter((task) => task.parentId === null).length}
                </span>
            </div>
            <div 
                class="edit-routine__list-body" 
                class:edit-routine__list-body--empty={tasks.length === 0}
                bind:this={routineListRef}
            >
                {#if routineListRef}
                    <TasksList
                        {newTaskFlag}
                        allowInitTasksCall={false}
                        tasks={tasks}
                        onTaskChange={(_tasks) => {
                            toggleEditMade()
                            tasks = _tasks
                        }}
                        options={{
                            id: "action-items",
                            context: "modal",
                            hotkeyFocus: "default",
                            settings: {
                                checkSubtasks: false,
                                allowDuplicate: false,
                                removeOnComplete: false,
                                numbered: true,
                                max: MAX_ACTION_ITEMS,
                                maxDepth: 2
                            },
                            ui: { 
                                sidePadding: "20px",
                                fontSize: "1.385rem",
                                padding: "9px 0px 7px 0px",
                                hasTaskDivider: true
                            },
                            rootRef: routineListRef
                        }}
                    />
                {/if}
                {#if tasks.length === 0}
                    <span class="edit-routine__list-empty">
                        0 action items
                    </span>
                {/if}
            </div>
        </div>

        <div style:padding="0px 16px 16px 16px">
            <ConfirmBtns 
                 disabled={title === "" || !!timeError}
                 isLoading={saving}
                 onCancel={onAttemptClose}
                 weakDisable={!!timeError}
                 onOk={saveChanges}
             />
        </div>
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text={isNew ? "Undo block creation?" :  "Discard unsaved changes?"}
        confirmText="Yes, Discard"
        onCancel={() => confirmModalOpen = false}
        onOk={confirmUnsavedClose}
    /> 
{/if}

<style lang="scss">
    @use "../../../scss/inputs.scss" as *;
    @use "../../../scss/dropdown.scss" as *;

    .edit-routine {
        max-width: 500px;
        width: 90vw;
        padding: 0px;
        position: relative;

        --color-border-opacity: 0.65;
        --cancel-btn-opacity: 0.025;
        
        &--light {
            --color-border-opacity: 0.1;
            --cancel-btn-opacity: 0.065;
        }
        &--light &__info-title {
            @include text-style(1);
        }
        &--light &__list {
            @include text-style(0.45);
        }
        &--light &__description {
            @include text-style(1);
        }
        &--no-tasks  {
            max-width: 450px;
        }
        &--no-tasks &__description {
            min-height: 120px;
            margin-bottom: 30px;
            max-height: 250px;
        }
        &--no-desc {
            max-width: 470px;
        }
        &__header {
            @include flex(center, space-between);
            margin: 0px 0px 0px -6px;
            position: relative;
            width: 100%;
            padding: 6px 14px 0px 20px;
            height: 40px;
        }
        &__color-dbtn {
            background-color: rgba(var(--routine-bg-color-2));
            border: 2.5px solid rgba(var(--routine-bg-color-1), var(--color-border-opacity));
            @include square(16px, 9px);
            @include center;
            cursor: pointer;
            margin-right: 8px;

            &:focus {
                @include border-focus;
            }
        }
        &__color-arrow {
            @include center;

            i {
                margin-top: -3px;
                color: rgb(var(--routine-bg-color-1));
            }
        }
        &__title {
            width: fit-content;
            margin-left: 7px;
            @include flex(center);
            @include text-style(1, _, 1.55rem);
        }
        &__order-context {
            margin: 0px 8px 0px -5px;
        }
        &__settings-dropdown {
            @include abs-top-right(28px);
        }
        &__color-dropdown {
            @include abs-top-left(28px);
        }
        &__info {
            margin: 5.5px 20px 15px 20px;
        }
        &__info-row {
            margin-bottom: 12px;
            height: 22px;
            @include flex(center);
        }
        &__info-title {
            @include text-style(0.35, var(--fw-400-500), 1.4rem);
            width: 55px;
            margin-bottom: 3px;
        }
        &__info-value {
            position: relative;
        }
        &__time {
            @include flex(center);

            span {
                margin: 0px 8px;
                @include text-style(0.35, var(--fw-400-500), 1.15rem, "Geist Mono");
            }
        }
        &__description {
            min-height: 60px;
            max-height: 140px;
            margin-bottom: 10px;
            font-size: 1.35rem;
        }
        &__list span {
            @include text-style(0.2, var(--fw-400-500), 1.3rem, "Geist Mono");
        }
        &__list-header {
            width: 100%;
            padding: 2px 20px 0px 20px;
            @include flex(center, space-between);
        }
        &__list-body {
            position: relative;
            height: calc(100% - 35px);
            overflow-y: scroll;
            min-height: 100px;
            max-height: 280px;
            margin: 0px 0px 10px 0px;

            &--empty {
                min-height: 100px;
            }
        }
        &__list-empty {
            margin: 1px 0px 0px 20px;
        }
        &__add-btn {
            @include center;
            @include square(22px, 7px);
            opacity: 0.25;
            margin: 0px 0px 2px 7px;
            
            &:hover {
                background-color: rgba(var(--textColor1), 0.12);
                opacity: 0.5;
            }
        }
    }
</style>