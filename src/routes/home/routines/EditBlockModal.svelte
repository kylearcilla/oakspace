<script lang="ts">
    import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { themeState } from "$lib/store"
	import { InputManager, TextEditorManager } from "$lib/inputs"
    import type { RoutinesManager } from "$lib/routines-manager"
	import { CORE_OPTIONS, getCoreActivityIdx, getCoreStr } from "$lib/utils-routines"

	import Modal from "../../../components/Modal.svelte"
	import SvgIcon from "../../../components/SVGIcon.svelte"
	import TagPicker from "../../../components/TagPicker.svelte"
	import AsyncButton from "../../../components/AsyncButton.svelte"
	import TasksList from "../../../components/TasksList.svelte"
	import TimePicker from "../../../components/TimePicker.svelte"
	import ColorPicker from "../../../components/ColorPicker.svelte"
	import DropdownBtn from "../../../components/DropdownBtn.svelte"
	import DropdownList from "../../../components/DropdownList.svelte"
	import ConfirmationModal from "../../../components/ConfirmationModal.svelte"
	import type { Writable } from "svelte/store"
	import { TEST_TASKS } from "$lib/utils-right-bar"
	import { minsFromStartToHHMM } from "$lib/utils-date"

    export let routineManager: RoutinesManager
    export let block: RoutineBlockElem

    class EditError extends Error { }

    let settingsOpen = false, coresOpen = false
    let colorsOpen = false, tagsOpen = false
    
    let { 
        id, startTime, endTime, title, 
        description, tasks, orderContext, activity
    } = block
    let _blocks = routineManager.editDayRoutineElems
    
    let updatedTasks: Task[] = tasks
    let doCreateNewTask = false
    let pickedCoreItemIdx = getCoreActivityIdx(activity)

    let newStartTime = startTime
    let newEndTime = endTime
    let newOrderContext = orderContext
    let orderOptnText = ""
    
    let editHasBeenMade = false
    let isSaving = false
    let confirmModalOpen = false
    let actualOrder: BlockOrderContext = "middle"
    
    let routineListRef: HTMLElement
    let titleInput: Writable<InputManager>
    let descriptionEditor: Writable<InputManager>

    $: isDarkTheme = $themeState.isDarkTheme
    $: blocks = $_blocks

    $: initTitleEditor(title)
    $: initDescriptionEditor(description)
    $: initOrderIdx(blocks) 

    function toggleEditMade() {
        editHasBeenMade = true
    }
    function onMadeChanges(updatedBlock: RoutineBlockElem | null) {
        routineManager.onConcludeModalEdit(updatedBlock)
    }
    function onSettingsOptionsClicked(idx: number) {
        if (idx === 0) {
            updateOrderIdx()
        }
        settingsOpen = false
    }

    /* Order */

    function initOrderIdx(blocks: RoutineBlockElem[] | null) {
        if (!blocks) return
        const orderIdx = routineManager.getBlockOrderFromStartTime(startTime, blocks!)
        
        if (orderIdx === 0) {
            actualOrder = blocks!.length === 1 ? "only" : "first"
        }
        else if (orderIdx === blocks!.length - 1) {
            actualOrder = "last"
        }
        else {
            actualOrder = "middle"
        }

        updateOrderOptnText()
    }
    function updateOrderIdx() {
        if (actualOrder === "first") {
            newOrderContext = newOrderContext === "first" ? null : "first"
        }
        else {
            newOrderContext = newOrderContext === "last" ? null : "last"
        }

        updateOrderOptnText()
    }
    function updateOrderOptnText() {
        if (actualOrder === "first") {
            orderOptnText = newOrderContext === "first" ? "Unmark as First Routine" : "Mark as First Routine"
        }
        else if (actualOrder === "last") {
            orderOptnText = newOrderContext === "first" ? "Unmark as Last Routine" : "Mark as Last Routine"
        }
        else {
            orderOptnText = ""
        }
    }

    /* Text Stuff */

    function initTitleEditor(_title: string) {
        titleInput = (new InputManager({ 
            initValue: _title,
            placeholder: "Block Title...",
            maxLength: 100,
            id: "routine-block-title-input",
            handlers: {
                onBlurHandler: (e, val) => onTitleChange(val)
            }
        })).state
    }

    function initDescriptionEditor(_description: string) {
        descriptionEditor = (new TextEditorManager({ 
            initValue: _description,
            placeholder: "Type description here...",
            doAllowEmpty: true,
            maxLength: 500,
            id: "routine-block-description",
            handlers: {
                onBlurHandler: (e, val) => onDescriptionChange(val)
            }
        })).state
    }

    function onTitleChange(newTitle: string) {
        title = newTitle
        toggleEditMade()
    }

    function onDescriptionChange(newDescription: string) {
        description = newDescription
        toggleEditMade()
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
    function onTaskChange(event: CustomEvent) {
        toggleEditMade()
        const _updatedTasks = event.detail
        updatedTasks = _updatedTasks
    }

    /* Action Items */

    function verifyChanges() {
        const overlapBlock = routineManager.getOverlappingBlock(blocks!, newStartTime, newEndTime, id)

        if (overlapBlock) {
            const { title, startTime, endTime } = overlapBlock
            const startTimeStr = minsFromStartToHHMM(startTime)
            const endTimeStr = minsFromStartToHHMM(endTime)

            throw new EditError(`Changes couldn't be saved. his block would overlap with \"${title}\" (${startTimeStr} - ${endTimeStr})`)
        }
    }

    /* Conclude Changes */
    function asyncCall() {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve("Mock data"), 1400)
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
                startTime: newStartTime, endTime: newEndTime,
                title, description, tasks: updatedTasks, orderContext: newOrderContext
            })

            toast("success", { message: "Changes saved!" })
        }
        catch(e: any) {
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
        else if (editHasBeenMade) {
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
</script>

<Modal options={{ borderRadius: "20px", overflowY: "hidden" }} onClickOutSide={onAttemptClose}>
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
                    class="edit-routine__color-dropdown-btn dropdown-btn"
                    id="color-picker--dropdown-btn"
                    on:click={() => colorsOpen = !colorsOpen}
                >
                    <div 
                        class="edit-routine__color"
                        style:--routine-color={block.color.primary}
                    >
                    </div>
                </button>
                <div class="edit-routine__color-picker-container">
                    <ColorPicker 
                        chosenColor={block.color}
                        onChoose={onColorOptionsChosen}
                        isActive={colorsOpen}
                        onClickOutside={() => colorsOpen = false}
                    />
                </div>
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
                    {#if titleInput}
                        <input 
                            type="text"
                            name="routine-block-title-input" 
                            id="routine-block-title-input"
                            aria-label="Title"
                            spellcheck="false"
                            value={$titleInput.value}
                            placeholder={$titleInput.placeholder}
                            maxlength={$titleInput.maxLength}
                            autocomplete="false"
                            on:blur={(e) => $titleInput.onBlurHandler(e)}
                            on:input={(e) => $titleInput.onInputHandler(e)}
                        >
                    {/if}
                </div>
            </div>
            <button 
                on:click={() => settingsOpen = !settingsOpen}
                class="edit-routine__settings-btn dropdown-btn dropdown-btn--settings"
                id={"edit-routine-settings--dropdown-btn"}
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
                                ...(actualOrder !== "middle" ? [{ name: orderOptnText }] : []),
                                { name: "Duplicate Block" }
                            ]
                        },
                        { name: "Delete Block" }
                    ],
                    position: { top: "45px", right: "0px" },
                    styling: { width: "160px" },
                    onListItemClicked: (context) => onSettingsOptionsClicked(context.idx),
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
                                pickedOptionName: getCoreStr(block.activity),
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
                                options={{ start: newStartTime, max: newEndTime }}
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
                                options={{ start: newEndTime, min: newStartTime }}
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
                <div class="edit-routine__info-icon">
                    <i class="fa-solid fa-align-left"></i>
                </div>
                <div class="edit-routine__info-title">Description</div>
            </div>
            {#if descriptionEditor}
                <div 
                    class="edit-routine__description-text-editor text-editor"
                    data-placeholder={$descriptionEditor.placeholder}
                    contenteditable
                    bind:innerHTML={$descriptionEditor.value}
                    on:paste={(e) => $descriptionEditor.onPaste(e)}
                    on:input={(e) => $descriptionEditor.onInputHandler(e)}
                    on:focus={(e) => $descriptionEditor.onFocusHandler(e)}
                    on:blur={(e)  => $descriptionEditor.onBlurHandler(e)}
                >
                </div>
            {/if}
        </div>
        <!-- List -->
        <div class="edit-routine__list">
            <div class="edit-routine__list-header">
                <div class="edit-routine__info-title-container">
                    <div class="edit-routine__info-icon">
                        <i class="fa-solid fa-list-ol"></i>
                    </div>
                    <div class="edit-routine__info-title">Action Items</div>
                </div>
                <span class="edit-routine__list-count">
                    {updatedTasks.length}
                </span>
            </div>
            <div class="edit-routine__list-container" bind:this={routineListRef}>
                <TasksList 
                    on:tasksUpdated={onTaskChange}
                    options={{
                        id:   "edit-routine",
                        type: "subtasks numbered",
                        isCreatingNewTask: doCreateNewTask,
                        containerRef: routineListRef,
                        tasks: TEST_TASKS,
                        styling: {
                            task: { 
                                fontSize: "1.3rem", height: "30px", padding: "5px 0px 5px 0px" 
                            },
                            subtask: { 
                                fontSize: "1.23rem", padding: "8px 0px 9px 0px" 
                            },
                            num: { 
                                width: "24px", margin: "1px 0px 0px 26px" 
                            },
                            description: { 
                                padding: "5px 0px 2px 0px"
                            },
                            descriptionInput: { 
                                fontSize: "1.23rem"
                            }
                        },
                        addBtn: {
                            style: { fontSize: "1.25rem" }
                        },
                        cssVariables: { 
                            maxDescrLines: 2 
                        },
                        contextMenuOptions: { 
                            width: "170px" 
                        },
                        ui: { 
                            hasTaskDivider: false,
                            sidePadding: "25px", 
                            listHeight: "100%"
                        }
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
                isLoading={isSaving}
                actionFunc={saveChanges} 
            />
        </div>
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text="Discard unsaved changes?"
        onCancel={cancelCloseAttempt}
        onOk={confirmUnsavedClose}
        options={{ ok: "Discard", caption: "Heads Up!" }}
    /> 
{/if}

<style lang="scss">
    @import "../../../scss/inputs.scss";
    @import "../../../scss/dropdown.scss";

    .edit-routine {
        height: 75vh;
        width: clamp(420px, 70vw, 600px);
        padding: 0px;
        position: relative;

        &--light &__info-title {
            @include text-style(0.9, 500);
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
        &--light {

        }
        &--light &__time span {
            opacity: 0.4;
            @include text-style(1, 600);
        }
        &--light div[contenteditable]:empty:before {
            opacity: 0.4;
        }

        /* Header */
        &__header {
            @include flex(center, space-between);
            margin: 0px 0px 14px -7px;
            position: relative;
            width: 100%;
            padding: 18px 14px 0px 25px;
            height: 40px;

            &-left {
                @include flex(center);
            width: 100%;
                position: relative;
            }
        }
        /* Color */
        &__color {
            background-color: rgba(var(--routine-color));
            @include circle(6px);
            cursor: pointer;
        }
        &__color-dropdown-btn {
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
        &__color-picker-container {
            @include abs-top-left(30px, 0px);
            z-index: 100;
        }
        /* Title */
        &__title-container {
            width: 100%;
            @include flex(center);
        }
        &__title-container input {
            @include text-style(1, 400, 1.64rem);
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
            padding: 0px 20px 0px 25px;
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
            padding: 5px 20px 12px 25px;
            height: 80px;
        }
        &__description-header {
            @include flex(center);
            margin-bottom: 5px;
        }
        &__description-text-editor {
            max-width: 100%;
            @include text-style(0.9, 400, 1.28rem);
        }
        &__list-header {
            padding: 30px 20px 10px 25px;
            @include flex(center, space-between);
        }
        &__list {
            height: calc(100% - 260px);
            width: 100%;
        }
        &__list-count {
            @include text-style(0.3, 400, 1.1rem, "DM Sans");
            margin-right: 5px;
        }
        &__list-container {
            position: relative;
            height: calc(100% - 56.5px);
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