 <script lang="ts">
    import { onMount } from "svelte"

    import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { toast } from "$lib/utils-toast"
    import { colorPicker } from "$lib/pop-ups"
	import { TEST_TASKS } from "$lib/mock-data"
    import { TextEditorManager } from "$lib/inputs"
    import { getColorTrio } from "$lib/utils-colors"
	import { minsFromStartToHHMM } from "$lib/utils-date"
    import { RoutinesManager } from "$lib/routines-manager"
	import { isTargetTextEditor } from "$lib/utils-general"
	import { CORE_OPTIONS, getCoreActivityIdx, getCoreStr } from "$lib/utils-routines"

	import Modal from "$components/Modal.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import TagPicker from "$components/TagPicker.svelte"
	import TasksList from "$components/TasksList.svelte"
	import TimePicker from "$components/TimePicker.svelte"
	import DropdownBtn from "$components/DropdownBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte";
	import ConfirmBtns from "$components/ConfirmBtns.svelte";

    const { MAX_BLOCK_DESCRIPTION, MIN_BLOCK_DURATION_MINS, MAX_BLOCK_TITLE } = RoutinesManager
    const MAX_ACTION_ITEMS = 12

    export let routineManager: RoutinesManager
    export let block: RoutineBlockElem

    class EditError extends Error { }

    const DESCRIPTION_ID = "routine-block-description"
    const TITLE_ID = "routine-block-title-input"
    
    let titleElem: HTMLElement
    let settingsOpen = false, coresOpen = false, tagsOpen = false
    
    let { 
        id, startTime, endTime, title, 
        description, tasks, order, activity, 
        allowDescription = true, allowTasks = true
    } = block

    let _blocks = routineManager.editDayRoutineElems
    let isNew   = routineManager.isMakingNewBlock
    
    let updatedTasks: Task[] = tasks
    let newTaskFlag = false
    let pickedCoreItemIdx = getCoreActivityIdx(activity)

    let newStartTime = startTime
    let newEndTime = endTime
    let newOrderContext = order
    
    let editHasBeenMade = false
    let isSaving = false
    let confirmModalOpen = false
    
    let routineListRef: HTMLElement

    $: isDarkTheme = $themeState.isDarkTheme
    $: blocks = $_blocks
    $: colors = getColorTrio(block.color, true)
    $: colorPopUp = colorPicker.state

    new TextEditorManager({ 
        id: TITLE_ID,
        initValue: "",
        placeholder: "block title...",
        allowFormatting: false,
        singleLine: true,
        maxLength: MAX_BLOCK_TITLE,
        handlers: {
            onInputHandler: () => toggleEditMade()
        }
    })
    new TextEditorManager({ 
        id: DESCRIPTION_ID,
        initValue: description,
        placeholder: "description here...",
        allowFormatting: false,
        maxLength: MAX_BLOCK_DESCRIPTION,
        handlers: {
            onInputHandler: () => toggleEditMade()
        }
    })
    
    function toggleEditMade() {
        editHasBeenMade = true
    }
    function onMadeChanges(updatedBlock: RoutineBlockElem | null) {
        routineManager.onConcludeModalEdit(updatedBlock)
    }
    function optnClicked(name: string) {
        if (name.toLowerCase().includes("set")) {
            toggleEditMade()
        }
        if (name === "Unset as first block") {
            newOrderContext = null
        }
        else if (name === "Unset as last block") {
            newOrderContext = null
        }
        else if (name === "Set as first block" || name === "Set as new first block") {
            newOrderContext = "first"
        }
        else if (name === "Set as last block" || name === "Set as new last block") {
            newOrderContext = "last"
        }
        else if (name === "Delete Block") {

        }
        settingsOpen = false
    }


    /* Info */
    function onTagChange(tag: Tag | null) {
        tagsOpen = false
        block = { ...block, tag }

        toggleEditMade()
    }
    function onCoreOptnClicked(idx: number) {
        coresOpen = false
        pickedCoreItemIdx = idx
        block = { ...block, activity: CORE_OPTIONS[pickedCoreItemIdx][0] }

        toggleEditMade()
    }
    function onRemoveCore() {
        block = { ...block, activity: null }
        pickedCoreItemIdx = -1

        toggleEditMade()
    }
    function onChooseColorr(color: Color | null) {
        if (!color) return

        block = { ...block, color }

        toggleEditMade()
    }
    function onTimePickerClicked() {
        if (settingsOpen) settingsOpen = false
        if (coresOpen) coresOpen = false
        if (tagsOpen) tagsOpen = false
    }
    function verifyChanges() {
        if (newEndTime >= 1440 || newEndTime === 0) {
            throw new EditError("Invalid end time")
        }
        if (newEndTime - newStartTime < 0) {
            throw new EditError("Invalid time")
        }
        if (newEndTime - newStartTime < MIN_BLOCK_DURATION_MINS) {
            throw new EditError(`Blocks must be at least ${MIN_BLOCK_DURATION_MINS} minutes long`)
        }

        // looks for the earliest overlapping block
        const overlapBlock = routineManager.getOverlappingBlock({
            blocks: blocks!, startTime: newStartTime, endTime: newEndTime, excludeId: id
        })

        if (overlapBlock) {
            const { title, startTime, endTime } = overlapBlock
            const startTimeStr = minsFromStartToHHMM(startTime)
            const endTimeStr = minsFromStartToHHMM(endTime)

            throw new EditError(`Changes couldn't be saved. Overlaps with \"${title}\" (${startTimeStr} - ${endTimeStr})`)
        }
    }

    /* conclude changes */
    function asyncCall() {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve("Mock data"), 200)
        })
    }
    async function saveChanges() {
        if (isSaving) return
        
        try {
            isSaving = true
            await asyncCall()
            verifyChanges()
            
            onMadeChanges({
                ...block, 
                title, 
                description,
                startTime: newStartTime, 
                allowDescription,
                allowTasks,
                endTime: newEndTime,
                tasks: updatedTasks, 
                order: newOrderContext
            })

            toast("success", { message: "Changes saved!" })
        }
        catch(e: any) {
            console.error(e)
            const message = e instanceof EditError ? e.message : "Error saving your changes."
            toast("error", { message })
        }
        finally {
            isSaving = false
        }
    }
    function onAttemptClose() {
        colorPicker.close()
        if (isSaving) {
            return
        }
        else if (editHasBeenMade || isNew) {
            confirmModalOpen = true
        }
        else {
            confirmUnsavedClose()
        }
    }
    function cancelCloseAttempt() {
        confirmModalOpen = false
    }
    function confirmUnsavedClose() {
        confirmModalOpen = false
        onMadeChanges(null)
    }
    function onKeyPress(e: KeyboardEvent) {
        const target = e.target as HTMLElement
        if (isTargetTextEditor(target)) return
        
        const { metaKey, key } = e
        
        if (key == "Escape") {
            onAttemptClose()
        }
        else if (metaKey && key === "Enter") {
            saveChanges()
        }
    }


    onMount(() => {
        if (!title) {
            titleElem.focus()
        }
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
    onClickOutSide={onAttemptClose}
>
    {@const order = newOrderContext}
    <div 
        class="edit-routine"
        class:edit-routine--light={!isDarkTheme}
    >
        <!-- header -->
        <div class="edit-routine__header">
            <div 
                bind:this={titleElem}
                class="edit-routine__title text-editor"
                id={TITLE_ID}
                aria-label="Title"
                spellcheck="false"
                contenteditable="true"
                bind:textContent={title}
            >
            </div>
            <div class="flx-algn-center">
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
                    id="color-picker--dbtn"
                    class="edit-routine__color-dbtn"
                    style:--routine-bg-color-1={colors[0]}
                    style:--routine-bg-color-2={colors[1]}
                    on:click={() => {
                        colorPicker.init({
                            onSubmitColor: (color) => onChooseColorr(color),
                            picked: block.color
                        })
                    }}
                >
                    <div 
                        class="edit-routine__color-arrow arrow-down"
                        class:arrow-down--active={$colorPopUp.isOpen}
                    >
                        <i class="fa-solid fa-sort-down"></i>
                    </div>
                </button>
                <SettingsBtn 
                    id={"block-settings"}
                    onClick={() => settingsOpen = !settingsOpen}
                />
            </div>
            <DropdownList 
                id={"block-settings"}
                isHidden={!settingsOpen} 
                options={{
                    listItems: [
                        ...(order !== "last" ? [{ name: order === "first" ? "Unset as First" : "Set as First" }] : []),
                        ...(order !== "first" ? [{ name: order === "last" ? "Unset as Last" : "Set as Last", divider: true }] : []),
                        {
                            name: "Description",
                            active: allowDescription,
                            onToggle: () => {
                                allowDescription = !allowDescription
                                settingsOpen = false
                            }
                        },
                        {
                            name: "Action Items",
                            active: allowTasks,
                            divider: true,
                            onToggle: () => {
                                allowTasks = !allowTasks
                                settingsOpen = false
                            }
                        },
                        { name: "Delete Block" }
                    ],
                    position: { 
                        top: "40px", right: "0px" 
                    },
                    styling: { 
                        width: "150px" 
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
                    <div>
                        <TagPicker 
                            tag={block.tag}
                            onTagClicked={(newTag) => {
                                onTagChange(newTag)
                            }}
                            styling={{ 
                                borderRadius: "12px" 
                            }}
                        />
                    </div>
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
                                options={{ 
                                    start: newStartTime,
                                    max: newEndTime
                                }}
                                onSet={(time) => { 
                                    newStartTime = time
                                    toggleEditMade()
                                }}
                                onClick={() => onTimePickerClicked()}
                            />
                        </div>
                        <span>to</span>
                        <div class="edit-routine__time-input-container">
                            <TimePicker 
                                id="end"
                                options={{ 
                                    start: newEndTime,
                                    min: newStartTime
                                }}
                                onSet={(time) => { 
                                    newEndTime = time
                                    toggleEditMade()
                                }}
                                onClick={() => onTimePickerClicked()}
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
                                title: getCoreStr(block.activity),
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
                                    top: "28px", left: "0px" 
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
                class:edit-routine__description--no-tasks={!allowTasks}
                aria-label="Description"
                contenteditable
                spellcheck="false"
                bind:textContent={description}
            />
        </div>

        <!-- action items -->
        <div class:hidden={!allowTasks}>
            <div class="edit-routine__list-header">
                <div 
                    class="edit-routine__info-title" 
                    style:width="auto"
                    style:margin-bottom="-4px"
                >
                    Action Items
                </div>
                <div class="flx-algn-center">
                    <span class="edit-routine__list-count">
                        {tasks.filter((task) => task.parentId === null).length}
                    </span>
                    <button 
                        class="edit-routine__add-btn"
                        on:click={() => newTaskFlag = !newTaskFlag}
                    >
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 1, strokeWidth: 1.8, opacity: 0.7 }}
                        />
                    </button>
                </div>
            </div>
            <div 
                class="edit-routine__list" 
                class:edit-routine__list--empty={tasks.length === 0}
                bind:this={routineListRef}
            >
                {#if routineListRef}
                    <TasksList
                        {newTaskFlag}
                        tasks={TEST_TASKS}
                        onTaskChange={(_tasks) => tasks = _tasks}
                        options={{
                            id: "action-items",
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
                                fontSize: "1.4rem",
                                padding: "9px 0px 7px 0px",
                                hasTaskDivider: true
                            },
                            rootRef: routineListRef
                        }}
                    />
                {/if}
                {#if tasks.length === 0}
                    <div class="edit-routine__list-empty">
                        0 action items
                    </div>
                {/if}
            </div>
        </div>

        <div style:padding="0px 16px 16px 16px">
            <ConfirmBtns 
                 disabled={title === ""}
                 isLoading={isSaving}
                 onCancel={onAttemptClose}
                 onOk={saveChanges}
             />
        </div>
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text={isNew ? "Undo block creation?" :  "Discard unsaved changes?"}
        onCancel={cancelCloseAttempt}
        onOk={confirmUnsavedClose}
    /> 
{/if}

<style lang="scss">
    @import "../../../scss/inputs.scss";
    @import "../../../scss/dropdown.scss";

    .edit-routine {
        height: auto;
        width: 480px;
        padding: 0px;
        position: relative;

        --color-border-opacity: 0.65;
        --cancel-btn-opacity: 0.025;
        
        &--light {
            --color-border-opacity: 0.1;
            --cancel-btn-opacity: 0.065;
        }
        &--light &__info-title {
            @include text-style(0.5);
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
        &__info-icon {
            @include text-style(0.3, 400, 1.24rem);
            margin-right: 13px;;
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
            max-height: 100px;
            margin-bottom: 20px;

            &--no-tasks {
                margin-bottom: 120px;
            }
        }
        &__list-header {
            width: 100%;
            padding: 2px 20px 1px 20px;
            @include flex(center, space-between);
        }
        &__list-count {
            @include text-style(0.2, var(--fw-400-500), 1.3rem, "Geist Mono");
            margin-right: 11px;
        }
        &__list-empty {
            @include text-style(0.2, var(--fw-400-500), 1.3rem, "Geist Mono");
            margin: 1px 0px 0px 20px;
        }
        &__add-btn {
            @include center;
            @include circle(20px);
            background-color: rgba(var(--textColor1), 0.065);
            margin-right: -4px;

            &:hover {
                background-color: rgba(var(--textColor1), 0.15);
            }
        }
        &__list {
            position: relative;
            height: calc(100% - 35px);
            overflow-y: scroll;
            min-height: 100px;
            max-height: 280px;
            margin: 5px 0px 10px 0px;

            &--empty {
                min-height: 40px;
            }
        }
    }
</style>