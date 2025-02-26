 <script lang="ts">
    import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { toast } from "$lib/utils-toast"
    import { TextEditorManager } from "$lib/inputs"
    import { getColorTrio } from "$lib/utils-colors"
	import { minsFromStartToHHMM } from "$lib/utils-date"
    import { RoutinesManager } from "$lib/routines-manager"
	import { isTargetTextEditor } from "$lib/utils-general"
	import { CORE_OPTIONS, getCoreActivityIdx, getCoreStr } from "$lib/utils-routines"

	import Modal from "../../../components/Modal.svelte"
	import SvgIcon from "../../../components/SVGIcon.svelte"
	import TagPicker from "../../../components/TagPicker.svelte"
	import AsyncButton from "../../../components/AsyncButton.svelte"
	import TasksList from "../../../components/TasksList.svelte"
	import TimePicker from "../../../components/TimePicker.svelte"
	import DropdownBtn from "../../../components/DropdownBtn.svelte"
	import DropdownList from "../../../components/DropdownList.svelte"
	import ConfirmationModal from "../../../components/ConfirmationModal.svelte"

    const { MAX_BLOCK_DESCRIPTION, MIN_BLOCK_DURATION_MINS } = RoutinesManager

    export let routineManager: RoutinesManager
    export let block: RoutineBlockElem

    class EditError extends Error { }

    const DESCRIPTION_ID = "routine-block-description"

    let settingsOpen = false, coresOpen = false
    let colorsOpen = false, tagsOpen = false
    
    let { 
        id, startTime, endTime, title, 
        description, tasks, order, activity, tag
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
    let firstBlockExists = false
    let lastBlockExists = false
    
    let routineListRef: HTMLElement
    let isDescrFocused = false 
    let descrLength = description.length

    $: isDarkTheme = $themeState.isDarkTheme
    $: blocks = $_blocks
    $: colors = getColorTrio(block.color, !isDarkTheme)

    $: initOrderIdx(blocks) 

    new TextEditorManager({ 
        initValue: description,
        placeholder: "no description...",
        allowFormatting: false,
        maxLength: MAX_BLOCK_DESCRIPTION,
        id: DESCRIPTION_ID,
        handlers: {
            onInputHandler: (_, val) => {
                description = val
            }
        }
    })

    function toggleEditMade() {
        editHasBeenMade = true
    }
    function onMadeChanges(updatedBlock: RoutineBlockElem | null) {
        routineManager.onConcludeModalEdit(updatedBlock)
    }
    function onSettingsOptionsClicked(event: Event) {
        const target = event.target as HTMLElement
        const optionName = target.innerText

        if (optionName.toLowerCase().includes("set")) {
            toggleEditMade()
        }
        
        if (optionName === "Unset as first block") {
            newOrderContext = null
        }
        else if (optionName === "Unset as last block") {
            newOrderContext = null
        }
        else if (optionName === "Set as first block" || optionName === "Set as new first block") {
            newOrderContext = "first"
        }
        else if (optionName === "Set as last block" || optionName === "Set as new last block") {
            newOrderContext = "last"
        }
        else if (optionName === "Delete Block") {

        }
        settingsOpen = false
    }

    /* Order */
    function initOrderIdx(blocks: RoutineBlockElem[] | null) {
        if (!blocks) return

        firstBlockExists = blocks.find((block) => 
            block.order === "first" && block.startTime != startTime) != null

        lastBlockExists = blocks.find((block) => 
            block.order === "last" && block.startTime != startTime) != null
    }

    /* Info */
    function onTagChange(tag: Tag | null) {
        tagsOpen = false
        block = { ...block, tag }

        toggleEditMade()
    }
    function onCoresOptionListClicked(idx: number) {
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
    function onColorOptionsChosen(color: Color) {
        block = { ...block, color }
        colorsOpen = false

        toggleEditMade()
    }
    function onTimePickerClicked() {
        if (settingsOpen) settingsOpen = false
        if (coresOpen) coresOpen = false
        if (tagsOpen) tagsOpen = false
    }
    function onTaskChange(tasks: Task[]) {
        toggleEditMade()
        updatedTasks = tasks
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
</script>

<svelte:window on:keydown={onKeyPress} />

<Modal options={{ borderRadius: "14px", overflowY: "hidden" }} onClickOutSide={onAttemptClose}>
    <div 
        class="edit-routine"
        class:edit-routine--dark={isDarkTheme}
        class:edit-routine--light={!isDarkTheme}
    >
        <!-- Header -->
        <div class="edit-routine__header">
            <!-- Title + Color -->
            <div class="edit-routine__header-left">
                <button 
                    class="edit-routine__color-dbtn dbtn"
                    id="color-picker--dbtn"
                    on:click={() => colorsOpen = !colorsOpen}
                >
                    <div 
                        class="edit-routine__color"
                        class:edit-routine__color--light={tag?.symbol.color.isLight}
                        style:--routine-bg-color={colors[1]}
                        style:--routine-border-color={colors[0]}
                    >
                    </div>
                </button>
                <div class="edit-routine__title-container">
                    {#if newOrderContext === "first" || newOrderContext === "last"}
                        {@const isFirst = newOrderContext === "first"}
                        <div 
                            class="edit-routine__order-context-icon"
                            title={`${isFirst ? "First routine of the day." : "Last routine of the day."}`}
                        >
                            <SvgIcon 
                                icon={isFirst ? Icon.Sun : Icon.Moon} 
                                options={{
                                    height: 16, width: 16, opacity: 0.2, scale: 0.7
                                }}
                            />
                        </div>
                    {/if}
                    <input 
                        type="text"
                        id="routine-block-title-input"
                        aria-label="Title"
                        spellcheck="false"
                        placeholder={"Block Title..."}
                        autocomplete="off"
                        maxlength={RoutinesManager.MAX_BLOCK_TITLE}
                        bind:value={title}
                    >
            </div>
            </div>
            <button 
                on:click={() => settingsOpen = !settingsOpen}
                class="edit-routine__settings-btn dbtn dbtn--settings"
                id={"edit-routine-settings--dbtn"}
            >
                <SvgIcon icon={Icon.Settings} options={{ opacity: 0.6}} />
            </button>
            <!-- Settings Dropdown -->
            <DropdownList 
                id={"edit-routine-settings"}
                isHidden={!settingsOpen} 
                options={{
                    listItems: [
                        { 
                            options: [
                                ...(newOrderContext !== "last" ? [{ name: newOrderContext === "first" ? "Unset as first block" : firstBlockExists ? "Set as new first block" : "Set as first block" }] : []),
                                ...(newOrderContext !== "first" ? [{ name: newOrderContext === "last" ? "Unset as last block" : lastBlockExists ? "Set as new last block" : "Set as last block" }] : []),
                                // { name: "Duplicate Block" }
                            ]
                        },
                        { name: "Delete Block" }
                    ],
                    position: { top: "45px", right: "0px" },
                    styling: { width: "160px" },
                    onListItemClicked: (context) => onSettingsOptionsClicked(context.event),
                    onClickOutside: () => settingsOpen = false
                }}
            />
        </div>
        <!-- Routine Info -->
        <div class="edit-routine__info">
            <!-- Tag -->
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Tag
                </div>
                <div class="edit-routine__info-value">
                    <div class="edit-routine__tag">
                        <TagPicker 
                            tag={block.tag}
                            isActive={tagsOpen}
                            onTagOptionClicked={(newTag) => onTagChange(newTag)}
                            onClick={() => tagsOpen = !tagsOpen}
                            onClickOutside={() => tagsOpen = false}
                            styling={{ borderRadius: "12px" }}
                        />
                    </div>
                </div>
            </div>
            <!-- Core -->
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Core
                </div>
                <div class="edit-routine__info-value">
                    <div class="edit-routine__core">
                        <DropdownBtn 
                            id={"core-dropdown"}
                            isActive={coresOpen}
                            options={{
                                allowEmpty: true,
                                onClick: () => coresOpen = !coresOpen,
                                onRemove:() => onRemoveCore(),
                                title: getCoreStr(block.activity),
                                styles: { fontSize: "1.24rem", padding: "4px 12px 4px 11px" }
                            }} 
                        />
                        <DropdownList 
                            id={"core-dropdown"}
                            isHidden={!coresOpen} 
                            options={{
                                listItems: CORE_OPTIONS.map((coreKey) => ({ name: coreKey[1] })),
                                pickedItem: pickedCoreItemIdx,
                                position: { top: "28px", left: "0px" },
                                styling: { width: "88px" },
                                onListItemClicked: (context) => onCoresOptionListClicked(context.idx),
                                onClickOutside: () => coresOpen = false
                            }}
                        />
                    </div>
                </div>
            </div>
            <!-- Time Frame -->
            <div class="edit-routine__info-row">
                <div class="edit-routine__info-title">
                    Time Frame
                </div>
                <div class="edit-routine__info-value">
                    <div class="edit-routine__time">
                        <div class="edit-routine__time-input-container">
                            <TimePicker
                                id="start"
                                options={{ start: newStartTime }}
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
                                options={{ start: newEndTime }}
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
        </div>
        <!-- Description -->
        <div class="edit-routine__description">
            <div class="edit-routine__description-header">
                <div class="edit-routine__info-title">Description</div>
                <div 
                    class="input-box__count"
                    class:input-box__count--over={descrLength > RoutinesManager.MAX_BLOCK_DESCRIPTION}
                    class:hidden={!isDescrFocused && descrLength <= RoutinesManager.MAX_BLOCK_DESCRIPTION}
                >
                    <!-- This can show negative when count include decoded HTML entities -->
                    {RoutinesManager.MAX_BLOCK_DESCRIPTION - descrLength}
                </div>
            </div>
            <div 
                id={DESCRIPTION_ID}
                class="text-editor"
                aria-label="Description"
                contenteditable
                spellcheck="false"
            />
        </div>
        <!-- List -->
        <div class="edit-routine__list">
            <div class="edit-routine__list-header">
                <div class="edit-routine__info-title-container">
                    <div class="edit-routine__info-title">Action Items</div>
                </div>
                <span class="edit-routine__list-count">
                    {updatedTasks.length}
                </span>
            </div>
            <div class="edit-routine__list-container" bind:this={routineListRef}>
                <TasksList
                    {tasks}
                    {newTaskFlag}
                    {onTaskChange}
                    options={{
                        id: "edit-routine",
                        type: "side-menu",
                        settings: {
                            maxDepth: 3
                        },
                        ui: { 
                            hasTaskDivider: true,
                            maxHeight: "280px"
                        },
                        containerRef: routineListRef
                    }}
                />
            </div>
        </div>
        <!-- Buttons -->
        <div class="edit-routine__btns">
            <button 
                on:click={onAttemptClose}
                class="edit-routine__cancel-btn" disabled={isSaving}
            >
                Cancel
            </button>
            <AsyncButton 
                styling={{ height: "35px", borderRadius: "13px" }}
                disabled={RoutinesManager.MAX_BLOCK_DESCRIPTION - descrLength < 0}
                isLoading={isSaving}
                actionFunc={saveChanges} 
            />
        </div>
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text={isNew ? "Undo block creation?" :  "Discard unsaved changes?"}
        onCancel={cancelCloseAttempt}
        onOk={confirmUnsavedClose}
        options={{ 
            ok: `${isNew ? "Yes" : "Discard"}`, caption: "Heads Up!" 
        }}
    /> 
{/if}

<style lang="scss">
    @import "../../../scss/inputs.scss";
    @import "../../../scss/dropdown.scss";

    .edit-routine {
        height: auto;
        width: clamp(420px, 60vw, 450px);
        padding: 0px;
        position: relative;

        &--light &__info-title {
            @include text-style(0.9, 600);
        }
        &--light &__title-container input {
            @include text-style(1, 500);
        }
        &--light &__description-text-editor {
            @include text-style(0.72, 500);
        }
        &--light &__info-icon {
            @include text-style(0.38, 400);
        }
        &--light &__cancel-btn {
            @include txt-color(0.08, "bg");
            @include text-style(1, 500);
        }
        &--light &__list-count {
            @include text-style(0.44, 600);
        }
        &--light &__time span {
            opacity: 0.4;
            @include text-style(1, 600);
        }
        &--light div[contenteditable]:empty:before {
            opacity: 0.4;
        }
        &--light .input-box {
            @include input-box--light;
        }
         
        .input-box {
            &__count {
                font-size: 1.14rem;
            }
        }

        /* Header */
        &__header {
            @include flex(center, space-between);
            margin: 0px 0px 1px -7px;
            position: relative;
            width: 100%;
            padding: 6px 14px 0px 20px;
            height: 40px;

            &-left {
                @include flex(center);
            width: 100%;
                position: relative;
            }
        }
        /* Color */
        &__color {
            background-color: rgba(var(--routine-bg-color));
            border: 1.5px solid rgba(var(--routine-border-color), 0.2);
            @include circle(9px);
            cursor: pointer;
        }
        &__color-dbtn {
            @include center;
            padding: 8px;
            margin-right: 6px;
            
            &:hover {
                @include txt-color(0.1, "bg");
                transition: 0.01s ease-in-out;
            }
            &:active {
                @include txt-color(0.1, "bg");
                transform: scale(0.97);
            }
        }
        /* Title */
        &__title-container {
            width: 100%;
            @include flex(center);
        }
        &__title-container input {
            @include text-style(1, 400, 1.55rem);
            width: calc(100% - 20px);
            position: relative;
            
            &::placeholder {
                @include text-style(0.2);
            }
            &:active {
                transition: 0.4s ease-in-out;
                transform: scale(0.99);
            }
        }
        &__order-context-icon {
            margin: 0px 5px 0px -5px;
        }
        /* Dropdowns */
        &__settings-dropdown {
            @include abs-top-right(28px);
        }
        &__color-dropdown {
            @include abs-top-left(28px);
        }

        /* Info */
        &__info {
            height: 98px;
            padding: 0px 20px 0px 20px;
        }
        &__info-row {
            margin-bottom: 9px;
            height: 20px;
            @include flex(center);

            &:last-child {
                margin-top: 1px;
            }
        }
        &__info-title {
            @include text-style(0.35, 400, 1.24rem);
            width: 110px;

            &-container {
                @include flex(center);
            }
            &:last-child {
                width: auto;
            }
        }
        &__info-icon {
            @include text-style(0.3, 400, 1.24rem);
            margin-right: 13px;;
        }
        &__info-value {
            position: relative;
        }
        &__tag {
        }
        &__core {
            @include text-style(0.65, 400, 1.33rem);
            position: relative;
        }
        &__time {
            @include flex(center);
            span {
                margin: 0px 10px;
                opacity: 0.4;
            }
        }
        &__time-input-container {
        }
        &__time-from {
        }
        &__time-to {

        }
        &__description {
            padding: 5px 20px 0px 20px;
            margin-bottom: 28px;
        }
        &__description-header {
            @include flex(center, space-between);
            margin-bottom: 3px;
            width: 100%;
        }
        &__description-text-editor {
            max-width: 100%;
            max-height: 74px;
            @include text-style(0.8, 500, 1.28rem);
        }
        &__list-header {
            width: 100%;
            padding: 2px 20px 4px 20px;
            @include flex(center, space-between);
        }
        &__list {
            height: 300px;
            width: 100%;
        }
        &__list-count {
            @include text-style(0.2, 300, 1.1rem, "DM Mono");
            margin-right: 5px;
        }
        &__list-container {
            position: relative;
            height: calc(100% - 35px);
            max-width: 100%;
        }
        &__btns {
            @include flex(center, flex-end);
            @include abs-bottom-right(20px, 24px);
        }
        &__cancel-btn {
            margin-right: 7px;
            height: 35px;
            width: 94px;
            border-radius: 13px;
            @include center;
            @include txt-color(0.03, "bg");
            @include text-style(1, 400, 1.26rem);
            
            &:hover {
                @include txt-color(0.06, "bg");
            }
        }
        &__submit-btn {
        }
    }
</style>