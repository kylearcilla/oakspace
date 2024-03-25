<script lang="ts">
    import { onMount } from "svelte"
	import SvgIcon from "./SVGIcon.svelte"
	import { themeState } from "$lib/store"
	import DropdownList from "./DropdownList.svelte";
	import { Icon } from "$lib/enums"
	import { clickOutside, getMaskedGradientStyle, inlineStyling } from "$lib/utils-general"
	import { TasksListManager } from "$lib/tasks-list-manager"
	import { InputManager, TextEditorManager } from "$lib/inputs";
	import type { Writable } from "svelte/store";
	import { backInOut } from "svelte/easing";

    export let options: TaskListOptionsInterface

    const _manager   = new TasksListManager(options)
    const manager    = _manager.state
    const tasksStore = _manager.tasks 
    const types      = $manager.types
    const {
        TASK_HEIGHT_MIN_NO_DESCR, TASK_HEIGHT_MIN_HAS_DESCR, FLOATING_WIDTH_PERCENT,
        TASK_DESCR_LINE_HT, FLOATING_SUBTASK_HEIGHT
    } = $manager

    let TASK_OPTIONS: DropdownListItem[] = [
        {
            options: [
                { 
                    name: "Rename"
                },
                ...(types["subtasks"] ? [
                    {
                        name: "Add Subtask",
                        rightIcon: {
                            type: "hotkey",
                            icon: ["shift", "plus"]
                        }
                    } as DropdownOption
                ] : [])
            ]
        },
        {
            options: [
                { 
                    name: "Add Task Above",
                    rightIcon: {
                        type: "hotkey",
                        icon: ["meta", "up"]
                    }
                },
                { 
                    name: "Add Task Below",
                    rightIcon: {
                        type: "hotkey",
                        icon: ["meta", "down"]
                    }
                },
                { 
                    name: "Duplicate Task",
                    rightIcon: {
                        type: "hotkey",
                        icon: ["meta", "d"]
                    }
                }
            ]
        },
        { 
            name: "Delete Task",
            rightIcon: {
                type: "hotkey",
                icon: ["meta", "delete"]
            }
        },
    ]
    let SUBTASK_OPTIONS: DropdownListItem[] = [
        {
            options: [
                { 
                    name: "Rename"
                },
            ]
        },
        {
            options: [
                { 
                    name: "Add Subtask Above",
                    rightIcon: {
                        type: "hotkey",
                        icon: ["meta", "up"]
                    }
                },
                { 
                    name: "Add Subtask Below",
                    rightIcon: {
                        type: "hotkey",
                        icon: ["meta", "down"]
                    }
                },
                { 
                    name: "Duplicate Subtask",
                    rightIcon: {
                        type: "hotkey",
                        icon: ["meta", "d"]
                    }
                }
            ]
        },
        { 
            name: "Delete Subtask",
            rightIcon: {
                type: "hotkey",
                icon: ["meta", "delete"]
            }
        },
    ]
        
    let tasksListContainerElem: HTMLElement
    let maskListGradient = ""
    let idPrefix = options.id

    $: tasks = $tasksStore

    $: createNewTask(options.isCreatingNewTask)
    $: isDarkTheme = $themeState.isDarkTheme
    $: pickedTaskIdx = $manager.pickedTaskIdx
    $: editingSubtaskIdx = $manager.editingSubtaskIdx
    $: pickedTaskTitle = $manager.getTask(pickedTaskIdx)?.title ?? ""
    $: pickedTaskDescription = $manager.getTask(pickedTaskIdx)?.description ?? ""
    $: editingSubtaskTitle = $manager.getSubtask(pickedTaskIdx, editingSubtaskIdx)?.title ?? ""

    $: {
        if ($manager.isContextMenuOpen && tasksListContainerElem) {
            tasksListContainerElem.style.overflowY = "hidden"
        }
        else if (tasksListContainerElem) {
            tasksListContainerElem.style.overflowY = "scroll"
        }
    }

    /* Text Editors */
    const handlers = {
        onInputHandler: $manager.inputTextHandler,
        onBlurHandler:  $manager.onInputBlurHandler,
        onFocusHandler: $manager.onInputFocusHandler
    }

    let titleTextEditor: Writable<InputManager>
    let descriptionTextEditor: Writable<InputManager> 
    let subtaskTextEditor: Writable<InputManager> 

    $: initTaskTextEditors(pickedTaskIdx)
    $: initSubtaskTextEditor(editingSubtaskIdx)

    function createNewTask(doCreateNewTask: boolean) {
        if (!doCreateNewTask) return

        $manager.addingNewTask(0, true)
        $manager.setMinAfterEdit()
    }
    function initSubtaskTextEditor(editingSubtaskIdx: number) {
        if (editingSubtaskIdx < 0) return

        subtaskTextEditor = (new TextEditorManager({ 
            initValue: editingSubtaskTitle,
            placeholder: "Title goes here...",
            doAllowEmpty: false,
            maxLength: 150,
            id: `${idPrefix}--task-subtask-title-input-id--${editingSubtaskIdx}`,
            handlers
        })).state
    }
    function initTaskTextEditors(pickedTaskIdx: number) {
        if (pickedTaskIdx < 0) return

        titleTextEditor = (new TextEditorManager({ 
            initValue: pickedTaskTitle,
            placeholder: "Title goes here...",
            doAllowEmpty: false,
            maxLength: 120,
            id: `${idPrefix}--task-title-id--${pickedTaskIdx}`,
            handlers
        })).state

        descriptionTextEditor = (new TextEditorManager({ 
            initValue: pickedTaskDescription,
            placeholder: "No Description",
            maxLength: 250,
            id: `${idPrefix}--task-description-input-id--${pickedTaskIdx}`,
            handlers
        })).state
    }

    /* Input */
    function contentListScrollHandler(contentList: HTMLElement) {
        maskListGradient = getMaskedGradientStyle(contentList).styling
    }
    function keyboardShortcutsHandler(event: KeyboardEvent) {
        $manager.keyboardShortcutHandler(event)
    }

    function onWindowResize() {
        requestAnimationFrame(() => $manager.updateTaskHeight({ hasWidthChanged: true }))
    }
    onMount(() => {
        $manager.initAfterLoaded()
        contentListScrollHandler(tasksListContainerElem)
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)}  on:resize={onWindowResize} /> 

<div 
    class="tasks-container"
    id={`${idPrefix}--tasks-list-container`}
    style={`-webkit-mask-image: ${maskListGradient}; mask-image: ${maskListGradient}; ${inlineStyling($manager.styling?.list)}}`}
    style:height={$manager.ui.listHeight}
    on:scroll={() => contentListScrollHandler(tasksListContainerElem)} 
    bind:this={tasksListContainerElem}
>
    <ul 
        class="tasks"
        class:tasks--dragging-state={$manager.floatingItem}
        class:tasks--numbered={types["numbered"]}
        id={`${idPrefix}--tasks-list`}
        style={inlineStyling($manager.styling?.list)}
        style:--side-padding={$manager.ui.sidePadding}
        style:--checkbox-fill={$manager.cssVariables.checkBoxFill}
        style:--checkbox-empty={$manager.cssVariables.checkBoxEmpty}
        style:--checkbox-icon={$manager.cssVariables.checkIcon}
        style:--task-bg-color={$manager.cssVariables.taskBgColor}
        style:--task-bg-hover-color={$manager.cssVariables.taskHoverBgColor}
        style:--floating-task-bg-color={$manager.cssVariables.floatingItemBgColor}
        style:--subtask-link-color={$manager.cssVariables.subTaskLinkSolidColor}
        style:--max-title-lines={$manager.cssVariables.maxTitleLines}
        style:--max-descr-lines={$manager.cssVariables.maxDescrLines}
        style:--task-top-padding={`${$manager.taskLayout?.topPadding}px`}
        style:--title-font-size={`${$manager.styling?.task?.fontSize ?? "1.25rem"}`}
        style:--left-section-width={`${$manager?.taskLayout?.leftSectionWidth}px`}
        on:mousemove={$manager.onMouseMove}
        on:mouseup={$manager.onTaskListMouseUp}
    >   
        <!-- Task Item -->
        {#each tasks as task, taskIdx (task.idx)}
            {@const pickedIdx = $manager.pickedTaskIdx}
            {@const focusedIdx = $manager.focusedTaskIdx}
            {@const subtaskProgress = types["subtasks"] ? $manager.getSubtaskProgress(taskIdx) : null }
            {@const subtasksNoLink = types["subtasks"] && !types["subtasks-linked"]}
            {@const isDraggingTask = $manager.isDraggingTask}
            {@const height = $manager.initMinTaskHeight(task)}
            {@const leftCornerStyle = inlineStyling($manager.styling?.checkbox)}

            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li
                role="button" tabindex="0" 
                id={`${idPrefix}--task-id--${taskIdx}`}
                class="task"
                class:task--no-divider={!$manager.ui.hasTaskDivider}
                class:task--hide-drag-handle={!$manager.ui.showDragHandle}
                class:task--expanded={taskIdx === pickedIdx}
                class:task--drag-over={isDraggingTask && (taskIdx === $manager.dragOverItemElemIdx)}
                class:task--min={taskIdx != pickedIdx}
                class:task--subtask-dragging-state={$manager.isDraggingSubtask}
                class:task--light={!isDarkTheme}
                class:task--focused={pickedIdx === taskIdx}
                class:task--full-divider={(focusedIdx === taskIdx && pickedIdx === taskIdx) || (taskIdx > 0 && focusedIdx === taskIdx - 1 && pickedIdx === taskIdx - 1)}
                class:task--checked={task.isChecked}
                class:task--not-animated={$manager.floatingItem}
                class:task--subtasks-no-link={subtasksNoLink}
                class:dragging-source-hidden={isDraggingTask && $manager.draggingSourceIdx === taskIdx}
                style={inlineStyling($manager.styling?.task)}
                on:click={(event) => $manager.onTaskedClicked(event, taskIdx)}
                on:mousedown={$manager.onTaskMouseDown}
                on:contextmenu={(e) => $manager.openContextMenu(e, taskIdx)}
            >
                <div class="task__top">
                    <!-- CheckBox  -->
                    <div class="task__left">
                        {#if types["numbered"]}
                            <div 
                                class="task__number"
                                style={leftCornerStyle}
                            >
                                {taskIdx + 1}.
                            </div>
                        {:else}
                            <button 
                                class="task__checkbox" 
                                id={`${idPrefix}--task-checkbox-id--${taskIdx}`}
                                style={leftCornerStyle}
                                on:click={() => $manager.handleTaskCheckboxClicked(task)}
                            >
                                <i class="fa-solid fa-check checkbox-check"></i>
                            </button>
                        {/if}
                        <!-- Drag Handle -->
                        <div class="task__drag-handle">
                            <div class="task__drag-handle-dots">
                                <SvgIcon icon={Icon.DragDots} options={{ scale: 0.8 }}/>
                            </div>
                        </div>
                    </div>
                    <!-- Content -->
                    <div class="task__right">
                        <!-- Title -->
                        <div class="task__title-container">
                            {#if taskIdx === $manager.pickedTaskIdx}
                                <div 
                                    id={`${idPrefix}--task-title-id--${taskIdx}`}
                                    class="task__title-input"
                                    data-placeholder={$titleTextEditor.placeholder}
                                    contenteditable
                                    bind:innerHTML={$titleTextEditor.value}
                                    on:paste={(e) => $titleTextEditor.onPaste(e)}
                                    on:input={(e) => $titleTextEditor.onInputHandler(e)}
                                    on:focus={(e) => $titleTextEditor.onFocusHandler(e)}
                                    on:blur={(e)  => $titleTextEditor.onBlurHandler(e)}
                                >
                                </div>
                            {:else}
                                <h3 
                                    id={`${idPrefix}--task-title-id--${taskIdx}`}
                                    on:click={() => $manager.onTaskTitleClicked(taskIdx)} 
                                    class="task__title"
                                    class:strike={task.isChecked}
                                    class:strike--animated={$manager.taskCheckBoxJustChecked === taskIdx}
                                >
                                    {@html task.title}
                                </h3>
                            {/if}
                            <!-- Subtask Progress -->
                            {#if subtaskProgress && subtaskProgress.length > 0}
                                <div class="task__subtask-progress">
                                    <span>{subtaskProgress.countDone}</span>
                                    <span>/</span>
                                    <span>{subtaskProgress.length}</span>
                                </div>
                            {/if}
                        </div>
                        <!-- Description -->
                        <div 
                            class="task__description-container" id={`${idPrefix}--task-description-id--${taskIdx}`}
                            style={inlineStyling($manager.styling?.description)}
                            style:height={`${$manager.pickedTaskDescriptionHT ? `height: ${$manager.pickedTaskDescriptionHT}px` : ""}`}
                            style:line-height={`${TASK_DESCR_LINE_HT}px`}
                            style:--description-font-size={`${$manager.styling?.descriptionInput?.fontSize ?? "1.2rem"}`}
                        >
                            {#if taskIdx === $manager.pickedTaskIdx}
                                <div 
                                    id={`${idPrefix}--task-description-input-id--${taskIdx}`}
                                    class="task__description-input"
                                    data-placeholder={$descriptionTextEditor.placeholder}
                                    contenteditable
                                    bind:innerHTML={$descriptionTextEditor.value}
                                    on:paste={(e) => $descriptionTextEditor.onPaste(e)}
                                    on:input={(e) => $descriptionTextEditor.onInputHandler(e)}
                                    on:focus={(e) => $descriptionTextEditor.onFocusHandler(e)}
                                    on:blur={(e)  => $descriptionTextEditor.onBlurHandler(e)}
                                >
                                </div>
                            {:else}
                                <p 
                                    id={`${idPrefix}--task-description-input-id--${taskIdx}`}
                                    class="task__description"
                                    on:click={() => $manager.onTaskDescriptionClicked(taskIdx)} 
                                >
                                    {@html task.description}
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>
                <!-- Subtasks -->
                {#if types["subtasks"] && taskIdx === $manager.pickedTaskIdx}
                    {@const subtasks = task.subtasks ?? []}
                    <ul class="task__subtasks-list" id={`${idPrefix}--task-subtasks-id--${taskIdx}`}>
                        {#each subtasks as subtask, subtaskIdx (`${taskIdx}--${subtaskIdx}`)}
                            {@const isFocused           = $manager.rightClickedSubtask?.idx === subtaskIdx || $manager.focusedSubtaskIdx === subtaskIdx}
                            {@const subtaskAnimDuration = subtasks.length < 8 ? 200 : 95}
                            {@const subtaskDelayFactor  = subtasks.length < 8 ? 30 : 18}
                            {@const subtaskDelay        = subtask.title ? (subtaskDelayFactor * subtaskIdx) : 0}
                            {@const noSubtaskLink       = !types["subtasks-linked"]}
                                <li 
                                    role="button" tabindex="0" 
                                    class="subtask"
                                    id={`${idPrefix}--subtask-id--${subtaskIdx}`}
                                    class:subtask--checked={subtask.isChecked}
                                    class:subtask--light={!isDarkTheme}
                                    class:subtask--dragging-state={$manager.isDraggingSubtask}
                                    class:subtask--not-animated={$manager.floatingItem}
                                    class:subtask--focus={isFocused}
                                    class:subtask--no-link={noSubtaskLink}
                                    class:subtask--drag-over={!isDraggingTask && subtaskIdx === $manager.dragOverItemElemIdx}
                                    class:dragging-source-hidden={!isDraggingTask && $manager.draggingSourceIdx === subtaskIdx}
                                    style={inlineStyling($manager.styling?.subtask)}
                                    style:--subtask-animation-duration={`${subtaskAnimDuration}ms`}
                                    style:--subtask-idx-delay={`${subtaskDelay}ms`}
                                    use:clickOutside on:click_outside={() => $manager.resetCurrentFocusedSubtaskIdx()}
                                >
                                    <!-- Main Content -->
                                    <div class="subtask__content">
                                        <div class="subtask__content-main">
                                            <div class="subtask__left">
                                                <!-- Links -->
                                                {#if types["subtasks-linked"] && subtaskIdx === 0}
                                                    <div 
                                                        class="subtask__subtask-link"
                                                        id={`${idPrefix}--subtask-link-id--${subtaskIdx}`}
                                                        class:subtask__subtask-link--first={subtaskIdx === 0}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none">
                                                            <path stroke-dasharray="1.6 1.6"/>
                                                        </svg>
                                                    </div>
                                                {:else if types["subtasks-linked"] }
                                                    <div 
                                                        class="subtask__subtask-link"
                                                        id={`${idPrefix}--subtask-link-id--${subtaskIdx}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none">
                                                            <path stroke-dasharray="1.6 1.6"/>
                                                        </svg>
                                                    </div>
                                                {/if}
                                                <!-- Checkbox -->
                                                {#if types["numbered"]}
                                                    <div class="subtask__number task__number">
                                                        {String.fromCharCode(subtaskIdx + 65 + 32)}.
                                                    </div>
                                                {:else}
                                                    <button 
                                                        id={`${idPrefix}--subtask-checkbox-id--${subtaskIdx}`}
                                                        class="subtask__checkbox task__checkbox" 
                                                        on:click={() => $manager.handleSubtaskCheckboxClicked(subtaskIdx)}
                                                    >
                                                        <i class="fa-solid fa-check checkbox-check"></i>
                                                    </button>
                                                {/if}
                                            </div>
                                            <!-- Main Content -->
                                            <div class="subtask__right">
                                                {#if $manager.editingSubtaskIdx === subtaskIdx}
                                                    <div 
                                                        id={`${idPrefix}--task-subtask-title-input-id--${subtaskIdx}`}
                                                        class="subtask__title-input"
                                                        data-placeholder={$subtaskTextEditor.placeholder}
                                                        contenteditable
                                                        bind:innerHTML={$subtaskTextEditor.value}
                                                        on:paste={(e) => $subtaskTextEditor.onPaste(e)}
                                                        on:input={(e) => $subtaskTextEditor.onInputHandler(e)}
                                                        on:focus={(e) => $subtaskTextEditor.onFocusHandler(e)}
                                                        on:blur={(e)  => $subtaskTextEditor.onBlurHandler(e)}
                                                    >
                                                </div>
                                                {:else}
                                                    <span 
                                                        class="subtask__title"
                                                        on:click={() => $manager.onSubtaskTitleClicked(subtaskIdx)}
                                                    >
                                                        {subtask.title}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                        <!-- Settings Button -->
                                        <button 
                                            class="subtask__settings-btn settings-btn"
                                            on:click={(e) => $manager.openContextMenu(e, taskIdx, subtaskIdx)}
                                        >
                                            <SvgIcon icon={Icon.Settings}/>
                                        </button>
                                    </div>
                                    <!-- Drag Handle -->
                                    <div class="subtask__drag-handle">
                                        <div class="subtask__drag-handle-dots">
                                            <SvgIcon icon={Icon.DragDots}  options={{ width: 18, scale: 0.8 }} />
                                        </div>
                                    </div>
                                    <!-- Divider -->
                                    <div class="subtask__divider"></div>
                                </li>
                            {/each}
                            <!-- Dummy Subtask Task -->
                            <li 
                                class="subtask subtask--dummy" 
                                id={`${idPrefix}--subtask-id--${subtasks.length}`}
                                class:subtask--drag-over={subtasks.length === $manager.dragOverItemElemIdx}
                            >
                            </li>
                    </ul>
                {/if}
                <!-- Divider -->
                <div class="task__divider"></div>
            </li>
        {/each}
        <!-- Dragging Task -->
        {#if $manager.floatingItem && $manager.floatingItemOffset}
            {@const floatingItem    = $manager.floatingItem}
            {@const isTask          = $manager.isDraggingTask}
            {@const { top, left }   = $manager.floatingItemOffset}
            {@const containerWidth  = tasksListContainerElem.clientWidth}
            {@const stylingProps    = isTask ? $manager.styling?.task : $manager.styling?.subtask}
            {@const styling         = inlineStyling(stylingProps)}
            {@const description     =  "description" in floatingItem ? floatingItem.description : ""}
            {@const height          = !isTask ? FLOATING_SUBTASK_HEIGHT : description ? TASK_HEIGHT_MIN_HAS_DESCR : TASK_HEIGHT_MIN_NO_DESCR}
            {@const subtaskProgress = isTask && types["subtasks"] ? $manager.getSubtaskProgress(floatingItem.idx) : null}
            {@const leftCornerStyle = inlineStyling($manager.styling?.checkbox)}

            <li
                id={`${idPrefix}--floating-item-id--${floatingItem.idx}`}
                class="task task--floating"
                class:task--light={isTask && !isDarkTheme}
                class:task--checked={isTask && floatingItem.isChecked}
                class:task--floating-subtask={!isTask}
                class:subtask--light={!isTask && !isDarkTheme}
                class:subtask--checked={!isTask && floatingItem.isChecked}
                style={`${styling} height: ${height}px`}
                style:width={`${FLOATING_WIDTH_PERCENT * (containerWidth)}px`}
                style:top={`${top}px`}
                style:left={`${left}px`}
            >
                <div class="task__top">
                    <div class="task__left">
                        {#if types["numbered"]}
                            {@const marker = isTask ? floatingItem.idx + 1 : String.fromCharCode(floatingItem.idx + 65 + 32)}
                            <div 
                                class="task__number"
                                style={leftCornerStyle}
                            >
                                {marker}.
                            </div>
                        {:else}
                            <button 
                                class="task__checkbox"
                                style={leftCornerStyle}
                            >
                                <i class="fa-solid fa-check checkbox-check"></i>
                            </button>
                        {/if}
                    </div>
                    <div class="task__right">
                        <div class="task__title-container">
                            <h3 class="task__title ${floatingItem.isChecked ? "strike" : ""}">
                                {floatingItem.title}
                            </h3>
                            <!-- Subtask Progress -->
                            {#if subtaskProgress && subtaskProgress.length > 0}
                                <div class="task__subtask-progress">
                                    <span>{subtaskProgress.countDone}</span>
                                    <span>/</span>
                                    <span>{subtaskProgress.length}</span>
                                </div>
                            {/if}
                        </div>
                        {#if isTask}
                            <div 
                                class="task__description-container"
                                style={`${$manager.pickedTaskDescriptionHT ? `height: ${$manager.pickedTaskDescriptionHT}px` : ""}`}
                                style:line-height={`${TASK_DESCR_LINE_HT}px`}
                                style:--description-font-size={`${$manager.styling?.descriptionInput?.fontSize ?? "1.2rem"}`}
                            >
                                <p class="task__description">
                                    {description}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>
            </li>
        {/if}
        <!-- Dummy Task -->
        <li 
            class="task task--dummy" 
            id={`${idPrefix}--task-id--${tasks.length}`}
            class:task--drag-over={tasks.length === $manager.dragOverItemElemIdx}
        >
        </li>
    </ul>
</div>

<!-- Context Menu -->
<DropdownList
    id={`${idPrefix}--tasks-list`}
    isHidden={!$manager.isContextMenuOpen} 
    options={{
        styling:           { width: options.contextMenuOptions.width },
        listItems:         $manager.rightClickedTask ? TASK_OPTIONS : SUBTASK_OPTIONS,
        onClickOutside:    () => $manager.onContextMenuClickedOutsideHandler(),
        onListItemClicked: (event) => requestAnimationFrame(() => $manager.contextMenuOptionClickedHandler(event)),
        position: { 
            top: $manager.contextMenuY + "px", left: $manager.contextMenuX + "px" 
        }
    }}
/>

<style lang="scss">
    @import "../scss/inputs.scss";

    .tasks {
        position: relative;
        height: auto;

        &-container {
            overflow-y: scroll;
            height: 100%;
        }

        &--dragging-state * {
            user-select: none;
            cursor: grabbing !important; 
        }
    }
    .task {
        outline: none;
        padding: 5px 0px 0px 0px;
        cursor: pointer;
        width: 100%;
        border-top: 0.5px solid transparent;
        border-bottom: 0.5px solid transparent;
        transition: height 0.2s cubic-bezier(.1,.84,.42,.95);
        position: relative;
        font-family: "DM Sans";
        user-select: none;
        
        &--not-animated {
            transition: 0s;
        }
        &--light {
            border: none !important;
        }
        &--light &__title-input, &--light &__title {
            @include text-style(0.8, 500)
        }
        &--light &__description, &--light &__description-text-area {
            @include text-style(0.6, 500)
        }
        &--light &__checkbox {
            border-width: 1.5px;
        }
        
        &:first-child &__checkbox-link {
            display: none;
        }
        &:hover, &:focus, &--focused, &--selected, &--drag-over {
            background-color: var(--task-bg-hover-color);
            @include txt-color(0.015, "border");
        }
        &--full-divider &__divider {
            @include divider(0.05, 0.5px, 100%);
            @include pos-abs-top-left-corner;
        }
        &:hover {
            user-select: auto;
        }
        &--min:hover &__drag-handle {
            @include visible;
        }
        &--expanded {
            padding-top: 6px;
        }
        &--expanded &__title {
            white-space: normal;
        }
        &--expanded &__title-container {
            // margin-bottom: 4px;
        }
        &--expanded &__description {
            display: flex;
            max-height: fit-content;
        }
        &--expanded &__description, &__description-input {
            opacity: 1 !important;
        }
        &--expanded &__drag-handle {
            @include pos-abs-top-left-corner(-1px);
            @include not-visible;
        }
        &--expanded &__left:hover &__drag-handle {
            @include visible;
        }
        &--expanded &__left {
            padding-bottom: 15px;
        }
        &--expanded h3 .strike::after {
            opacity: 0;
        }
        &--expanded .subtask {
            opacity: 1;
        }
        &--checked &__left &__checkbox {
            border-color: transparent;
            background-color: var(--checkbox-fill);
            i {
                display: block;
            }
        }
        &--checked  &__title-container h3 {
            color: rgba(var(--textColor1), 0.2);
        }
        &--checked &__title.strike::after {
            background-color: rgba(var(--textColor1), 0.12);
        }
        &--checked &__description, &__description-input {
            opacity: 0.4;
        }
        &--drag-over {
            border-top: 1px solid rgba(var(--textColor1), 0.1) !important;
        }
        &--subtask-dragging-state &__subtasks-list {
            padding-top: 5px;
        }
        &--floating {
            position: absolute;
            background-color: var(--floating-task-bg-color) !important;
            border-radius: 12px;
            z-index: 100;
            box-shadow: 0px 1px 16.4px 4px rgba(0, 0, 0, 0.14);
            border: 1px solid rgba(white, 0.04);
        }
        &--floaitng-subtask {
            padding: 0px;
        }
        &--floating &__description {
            @include multi-line-elipses-overflow(1);
        }
        &--dummy {
            height: 50px;
            background: transparent !important;
            border-bottom-color: transparent !important;
        }
        &--dummy:hover {
            border-top-color: 1px solid transparent;
        }
        &--subtasks-no-link &__subtasks-list {
            padding-top: 11px;
        }
        &--no-divider &__divider {
            display: none;
        }
        &--hide-drag-handle &__drag-handle {
            display: none;
        }
        &--numbered {

        }

        &__top {
            @include flex(flex-start, _);
        }
        &__left {
            width: auto;
            position: relative;
        }
        &__drag-handle {
            cursor: grab;
            transition: 0.1s ease-in-out;
            @include pos-abs-top-left-corner(-3px);
            @include not-visible;
        }
        &__drag-handle-dots {
            opacity: 0.1;
            @include center;

            &:hover {
                opacity: 0.25;
            }
        }
        &__right {
            width: calc(100% - var(--left-section-width));
            height: 100%;
            position: relative;
        }
        &__left-corner {
            margin: 1px 19px 0px var(--side-padding);
            @include center;
        }
        &__number {
            @include text-style(0.35, 400);
            font-size: calc(var(--title-font-size) - 1px);
        }
        &__checkbox {
            @include center;
            @include circle(12px);
            transition: 0.1s ease-in-out;
            border: 1px solid var(--checkbox-empty);
            position: relative;
            cursor: pointer;
            z-index: 1;
            
            i {
                margin-top: 1px;
                font-size: 0.8rem;
                display: none;
                color: var(--checkbox-icon);
            }
            &:focus {
                background-color: var(--checkbox-empty);
            }
            &:hover {
                background-color: var(--checkbox-empty);
                cursor: pointer !important;
            }
            &:active {
                transform: scale(0.92);
            }
        }
        &__title-container {
            width: calc(100% - var(--side-padding));
            @include flex(flex-start, space-between);
        }
        &__title {
            @include multi-line-elipses-overflow(var(--max-title-lines));
            max-width: 100%;
        }
        &__title, &__title-input {
            cursor: text;
            width: fit-content;
            white-space: pre-wrap;
            word-break: break-word;
            @include text-style(0.9, 300);
            font-size: var(--title-font-size);
        }
        &__description-container {
            width: 100%;
        }
        &__description, &__description-input {
            @include text-style(0.4, 300, var(--description-font-size));
            padding: 0px 8px 0px 0px;
            cursor: text;
        }
        &__description {
            width: calc(100% - var(--side-padding));
            @include multi-line-elipses-overflow(var(--max-descr-lines));
            white-space: pre-wrap;
            word-break: break-word;
        }
        &__subtask-progress {
            @include flex(center);
            margin-left: 5px;

            span {
                @include text-style(0.2, 400, calc(var(--title-font-size) - 1px));
            }
            span:nth-last-child(2) {
                display: inline-block;
                margin: 0px 1px;
            }
        }
        &__subtasks-list {
            width: 100%;
        }
        &__divider {
            @include divider(0.05, 0.5px, calc(100% - calc(2 * var(--side-padding))));
            @include pos-abs-top-left-corner(0px, var(--side-padding));
        }
    }
    .subtask {
        @include flex(center, space-between);
        position: relative;
        visibility: hidden;
        transition: 0.12s ease-in-out;
        width: 100%;
        animation: fade-in var(--subtask-animation-duration) cubic-bezier(.5,.84,.42,.9) var(--subtask-idx-delay) forwards;
        padding: 5px 0px 5px 0px;
        padding-left: var(--left-section-width) !important;
        border-top: 1px solid transparent;
        
        &:focus, &--focus {
            background-color: var(--task-bg-hover-color);
            outline: none;
        }
        &:hover &__settings-btn {
            @include visible(0.25);
        }
        &:hover &__drag-handle {
            @include visible;
        }

        &--light &__title, &--light &__title-input {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.6);
        }
        &--light &__settings-btn:hover {
            opacity: 0.7 !important;
        }
        &--not-animated {
            transition: 0s;
        }
        &--checked &__checkbox {
            border-color: transparent;
            background-color: var(--checkbox-fill);
            i {
                display: block;
            }
        }
        &--checked &__title {
            @include text-style(0.3);
        }
        &--checked &__title {
            text-decoration: line-through rgba(var(--textColor1), 0.2);
        }
        &--no-link {
            width: 100%;
            padding-left: 0px !important;
        }
        &--no-link &__content {
            padding-left: var(--left-section-width) !important;
        }
        &--no-link &__drag-handle {
            @include pos-abs-top-left-corner(50%, calc(var(--side-padding) + 4px));
        }
        &--no-link &__settings-btn {
            @include pos-abs-top-right-corner(8px, var(--side-padding));
        }
        &--no-link &__divider {
            display: block;
        }
        &--dragging-state &__subtask-link {
            @include not-visible;
        }
        &--dragging-state {
            padding: 5.5px 0px 5.5px var(--left-section-width);
        }
        &--drag-over {
            border-top-color: rgba(var(--textColor1), 0.05) !important;
            background-color: var(--task-bg-hover-color);
        }
        &--dummy {
            height: 25px !important;
            padding: 0px !important;
            background: transparent !important;
            border-bottom-color: transparent !important;
            @include visible;
        }

        &__subtask-link {
            @include pos-abs-top-left-corner;
            pointer-events: none;
            z-index: -2;
        }
        &__subtask-link svg {
            stroke: var(--subtask-link-color);
        }
        &__content {
            width: 100%;
            width: 100%;
            @include flex(center, space-between)
        }
        &__content-main {
            width: 100%;
            position: relative;
            display: flex;
        }
        &__left {
            position: relative;
        }
        &__right {
            max-width: calc(100% - 55px);
        }
        &__drag-handle {
            cursor: grab;
            transition: 0.1s ease-in-out;
            @include pos-abs-top-left-corner(50%);
            @include not-visible;
        }
        &__drag-handle-dots {
            opacity: 0.07;
            @include center;
            
            &:hover {
                opacity: 0.25;
            }
        }
        &__checkbox, &__number {
            margin: 2px 11px 0px 0px;
        }
        &__number {
            padding-left: 5px;
        }
        &__title {
            transition: 0.1s ease-in-out;
        }
        &__title-input::placeholder {
            opacity: 0.2;
        }
        &__title, &__title-input {
            @include text-style(0.6, 300);
            white-space: pre-wrap;
            word-break: break-word;
            max-width: 100%;
            cursor: text;
        }
        &__settings-btn {
            @include not-visible;

            &:hover {
                opacity: 0.6 !important;
                @include txt-color(0.1, "bg");
            }
        }
        &__divider {
            display: none;
            @include divider(0.03, 0.5px, calc(100% - (var(--side-padding) + var(--left-section-width))));
            @include pos-abs-top-left-corner(0px, var(--left-section-width));
        }
    }

    /* Shared Styling Classes */
    .dragging-source-hidden {
        opacity: 0 !important;
        visibility: hidden !important;
        height: 0px !important;
        padding: 0px !important;
        border-width: 0px !important;

        * {
            display: none !important;
        }
    }
</style>