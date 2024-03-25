<script lang="ts">
	import { onMount } from "svelte";
	import Modal from "../../../../components/Modal.svelte";
	import { InputManager, TextEditorManager } from "$lib/inputs"
	import SvgIcon from "../../../../components/SVGIcon.svelte"
	import { Icon, ModalType } from "$lib/enums"
	import { globalContext, themeState } from "$lib/store"
	import DropdownList from "../../../../components/DropdownList.svelte"
	import DropdownBtn from "../../../../components/DropdownBtn.svelte"
	import TasksList from "../../../../components/TasksList.svelte"
	import { TEST_MILESTONES } from "$lib/utils-goals"
	import TimePicker from "../../../../components/TimePicker.svelte"
	import ColorPicker from "../../../../components/ColorPicker.svelte"
	import { ROUTINE_CORE_KEYS, getCoreStr } from "$lib/utils-routines"
	import TagPicker from "../../../../components/TagPicker.svelte"
	import AsyncButton from "../../../../components/AsyncButton.svelte"
	import { closeModal, openModal } from "$lib/utils-home";
	import ConfirmationModal from "../../../../components/ConfirmationModal.svelte";
	import { toast } from "$lib/utils-toast";
	import type { Writable } from "svelte/store";

    export let block: RoutineBlockElem
    export let onMadeChanges: (routineBlock: RoutineBlockElem) => void
    export let onCancel: () => void
    
    let settingsOpen = false
    let coresOpen = false
    let colorsOpen = false
    let tagsOpen = false
    
    let { startTime, endTime, title, description } = block
    
    let pickedCoreItemIdx = 0
    let doCreateNewTask = false

    let editHasBeenMade = false
    let isSaving = false
    let confirmModalOpen = false

    let routineListRef: HTMLElement

    $: isDarkTheme = $themeState.isDarkTheme
    $: initTitleEditor(title)
    $: initDescriptionEditor(description)
    
    /* Text Editors */
    let titleInput: Writable<InputManager>
    let descriptionEditor: Writable<InputManager>

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

    function toggleEditMade() {
        editHasBeenMade = true
    }

    /* Text Info */
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
    function onSettingsOptionsClicked(idx: number) {
        settingsOpen = false
    }
    function onCoresOptionListClicked(idx: number) {
        coresOpen = false
        pickedCoreItemIdx = idx
        block = { ...block, activity: ROUTINE_CORE_KEYS[idx][0] }

        toggleEditMade()
    }
    function onColorOptionsChosen(color: Color) {
        block = { ...block, color }
        colorsOpen = false

        toggleEditMade()
    }
    function onRemoveCore() {
        block = { ...block, activity: null }
        pickedCoreItemIdx = -1

        toggleEditMade()
    }
    function onTimePickerClicked() {
        if (settingsOpen) settingsOpen = false
        if (coresOpen) coresOpen = false
        if (tagsOpen) tagsOpen = false
    }

    /* Action Item */
    function onNewActionItemBtnClicked() {
        doCreateNewTask = true
        requestAnimationFrame(() => doCreateNewTask = false)
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
            onMadeChanges({
                ...block,
                startTime, endTime, title, description
            })
            toast("success", { message: "Changes saved!" })
        }
        catch(e) {
            toast("error", { message: "Error saving your changes." })
        }
        finally {
            isSaving = false
        }
    }
    function onAttemptClose() {
        if (isSaving) return
        
        if (editHasBeenMade) {
            confirmModalOpen = true
            openModal(ModalType.Confirmation)
        }
        else {
            okUnsavedClose()
        }
    }
    function cancelUnsavedClose() {
        confirmModalOpen = false
    }
    function okUnsavedClose() {
        confirmModalOpen = false
        onCancel()
    }
    onMount(() => {
    })
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
                            on:blur={(e) => $titleInput.onBlurHandler(e)}
                            on:input={(e) => $titleInput.onInputHandler(e)}
                        >
                    {/if}
                </div>
            </div>
            <button 
                class="edit-routine__settings-btn dropdown-btn dropdown-btn--settings"
                id={"edit-routine-settings--dropdown-btn"}
                on:click={() => settingsOpen = !settingsOpen}
            >
                <SvgIcon icon={Icon.Settings} options={{ opacity: 0.4}}/>
            </button>
            <!-- Settings Dropdown -->
            <DropdownList 
                id={"edit-routine-settings"}
                isHidden={!settingsOpen} 
                options={{
                    listItems: [{ name: "Duplicate Block" }, { name: "Delete Block" }],
                    onListItemClicked: onSettingsOptionsClicked,
                    position: { top: "45px", right: "0px" },
                    styling: { width: "140px" },
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
                                onRemove: () => onRemoveCore(),
                                pickedOptionName: getCoreStr(block.activity),
                                styles: { fontSize: "1.18rem", padding: "4px 12px 4px 11px" }
                            }} 
                        />
                        <DropdownList 
                            id={"core-dropdown"}
                            isHidden={!coresOpen} 
                            options={{
                                listItems: ROUTINE_CORE_KEYS.map((coreKey) => ({ name: coreKey[1] })),
                                pickedItemIdx: pickedCoreItemIdx,
                                position: { top: "28px", left: "0px" },
                                styling: { width: "88px" },
                                onListItemClicked: (e, idx) => onCoresOptionListClicked(idx),
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
                                options={{ start: startTime, max: endTime }}
                                onSet={(time) => startTime = time}
                                onClick={() => onTimePickerClicked()}
                            />
                        </div>
                        <span>to</span>
                        <div class="edit-routine__time-input-container">
                            <TimePicker 
                                options={{ start: endTime, min: startTime }}
                                onSet={(time) => endTime = time}
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
                <!-- svelte-ignore a11y-click-events-have-key-events -->
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
                <button 
                    class="edit-routine__list-add-btn"
                    on:click={onNewActionItemBtnClicked}
                >
                    <div class="edit-routine__list-add-btn-icon">
                        <SvgIcon icon={Icon.Add} options={{ scale: 0.6, strokeWidth: 1.3 }} />
                    </div>
                    <span>Add</span>
                </button>
            </div>
            <div class="edit-routine__list-container" bind:this={routineListRef}>
                {#if routineListRef}
                    <TasksList 
                        options={{
                            id:   "edit-routine",
                            type: "subtasks numbered",
                            isCreatingNewTask: doCreateNewTask,
                            containerRef: routineListRef,
                            tasks: TEST_MILESTONES.map((t) => ({ ...t, subtasks: [] })),
                            styling: {
                                task:             { fontSize: "1.23rem", height: "30px", padding: "8px 0px 2px 0px" },
                                subtask:          { fontSize: "1.23rem", padding: "8px 0px 8px 0px" },
                                checkbox:         { margin: "1px 18px 0px 26px" },
                                description:      { margin: "4px 0px 2px 0px"},
                                descriptionInput: { fontSize: "1.23rem" }
                            },
                            cssVariables: { maxDescrLines: 2 },
                            contextMenuOptions: { width: "170px" },
                            ui: { 
                                hasTaskDivider: false,
                                sidePadding: "25px", listHeight: "100%"
                            }
                        }}
                    />
                {/if}
            </div>
        </div>
        <!-- Buttons -->
        <div class="edit-routine__btns">
            <button 
                class="edit-routine__cancel-btn"
                on:click={onAttemptClose}
                disabled={isSaving}
            >
                Cancel
            </button>
            <AsyncButton
                isLoading={isSaving}
                actionFunc={saveChanges}
            />
        </div>
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        msg="Discard unsaved changes?"
        onCancel={() => cancelUnsavedClose()}
        onOk={() => okUnsavedClose()}
        options={{ okMsg: "Discard" }}
    /> 
{/if}

<style lang="scss">
    @import "../../../../scss/inputs.scss";
    @import "../../../../scss/dropdown.scss";

    .edit-routine {
        height: 75vh;
        width: clamp(420px, 70vw, 600px);
        padding: 0px;

        &--light {

        }
        &--dark .dropdown-btn {
            @include dropdown-btn-dark;
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
            @include circle(5px);
            cursor: pointer;
        }
        &__color-dropdown-btn {
            @include center;
            padding: 8px;
            margin-right: 4.5px;
            
            &:hover {
                @include txt-color(0.08, "bg");
                transition: 0.01s ease-in-out;
            }
            &:active {
                @include txt-color(0.08, "bg");
                transform: scale(0.97);
            }
        }
        &__color-picker-container {
            @include pos-abs-top-left-corner(22px, 5px);
            z-index: 100;
        }
        /* Title */
        &__title-container {
            font-family: "DM Sans";
            width: 100%;
        }
        &__title-container input {
            @include text-style(1, 300, 1.64rem);
            width: fit-content;
            max-width: 100%;
            
            &::placeholder {
                @include text-style(0.2);
            }
            &:active {
                transition: 0.4s ease-in-out;
                transform: scale(0.99);
            }
        }
        /* Dropdowns */
        &__settings-dropdown {
            @include pos-abs-top-right-corner(28px);
        }
        &__color-dropdown {
            @include pos-abs-top-left-corner(28px);
        }

        /* Info */
        &__info {
            height: 94px;
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
            margin-bottom: 8px;
        }
        &__description-text-editor {
            max-width: 100%;
            @include text-style(0.8, 400, 1.24rem);
        }
        &__list-header {
            padding: 30px 20px 10px 25px;
            @include flex(center, space-between);
        }
        &__list {
            height: calc(100% - (90px + 40px + 94px + 75px));
            width: 100%;
        }
        &__list-add-btn {
            @include flex(center);
            opacity: 0.5;
            @include text-style(0.8, 300, 1.22rem);

            &:hover {
                opacity: 1;
            }
        }
        &__list-add-btn-icon {
            margin-right: 5px;
        }
        &__list-container {
            position: relative;
            height: calc(100% - 56.5px);
            max-width: 100%;
        }
        &__btns {
            @include flex(center, flex-end);
            padding-right: 20px;
            margin-top: 13px;
        }
        &__cancel-btn {
            margin-right: 7px;
            height: 39px;
            width: 94px;
            border-radius: 15px;
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