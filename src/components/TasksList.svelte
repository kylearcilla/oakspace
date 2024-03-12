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

    export let options: TaskListOptionsInterface

    const manager = new TasksListManager(options).state
    const types   = $manager.types
    const { 
        TASK_HEIGHT_MIN_NO_DESCR, TASK_HEIGHT_MIN_HAS_DESCR, FLOATING_WIDTH_PERCENT,
        TASK_DESCR_LINE_HT
    } = $manager
        
    let tasksListContainerElem: HTMLElement
    let maskListGradient = ""
    let taskDropdownOptions: DropdDownListItem[] = []
    let idPrefix = options.id

    $: pickedTaskIdx = $manager.pickedTaskIdx
    $: editingSubtaskIdx = $manager.editingSubtaskIdx
    $: pickedTaskTitle = $manager.getTask(pickedTaskIdx)?.title ?? ""
    $: pickedTaskDescription = $manager.getTask(pickedTaskIdx)?.description ?? ""
    $: editingSubtaskTitle = $manager.getSubtask(pickedTaskIdx, editingSubtaskIdx)?.title ?? ""

    const handlers = {
        onInputHandler: $manager.inputTextHandler,
        onBlurHandler:  $manager.onInputBlurHandler,
        onFocusHandler: $manager.onInputFocusHandler
    }

    /* Text Editors */
    let titleTextEditor: Writable<InputManager>
    let descriptionTextEditor: Writable<InputManager> 
    let subtaskTextEditor: Writable<InputManager> 

    $: isDarkTheme = $themeState.isDarkTheme
    $: initTaskTextEditors(pickedTaskIdx)
    $: initSubtaskTextEditor(editingSubtaskIdx)

    $: if (types["subtasks"]) {
        taskDropdownOptions = [{ name: "Rename" }, { name: "Add Subtask" }, { name: "Delete Task" }]
    }
    else {
        taskDropdownOptions = [{ name: "Rename" }, { name: "Delete Task" }]
    }

    $: {
        console.log("FART")
    }

    function initSubtaskTextEditor(editingSubtaskIdx: number) {
        if (editingSubtaskIdx < 0) return


        subtaskTextEditor = (new TextEditorManager({ 
            initValue: editingSubtaskTitle,
            placeholder: "Title goes here...",
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
            maxLength: 120,
            id: `${idPrefix}--task-title-id--${pickedTaskIdx}`,
            handlers
        })).state

        descriptionTextEditor = (new TextEditorManager({ 
            initValue: pickedTaskDescription,
            placeholder: "No Description",
            maxLength: 120,
            id: `${idPrefix}--task-description-input-id--${pickedTaskIdx}`,
            handlers
        })).state
    }

    function contentListScrollHandler(contentList: HTMLElement) {
        maskListGradient = getMaskedGradientStyle(contentList).styling
    }
    function keyboardShortcutsHandler(event: KeyboardEvent) {
        $manager.keyboardShortcutHandler(event)
    }
    onMount(() => {
        $manager.initAfterLoaded()
        contentListScrollHandler(tasksListContainerElem)
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} /> 

<div 
    class="tasks-container"
    id={`${idPrefix}--tasks-list-container`}
    style={`-webkit-mask-image: ${maskListGradient}; mask-image: ${maskListGradient}; ${inlineStyling($manager.styling?.list)}}`}
    on:scroll={() => contentListScrollHandler(tasksListContainerElem)} 
    bind:this={tasksListContainerElem}
>
    <ul 
        class="tasks" 
        class:tasks--dragging-state={$manager.floatingTask}
        id={`${idPrefix}--tasks-list`}
        style={inlineStyling($manager.styling?.list)}
        style:--side-padding={$manager.ui.sidePadding}
        style:--checkbox-fill={$manager.cssVariables.checkBoxFill}
        style:--checkbox-empty={$manager.cssVariables.checkBoxEmpty}
        style:--checkbox-icon={$manager.cssVariables.checkIcon}
        style:--task-top-padding={`${$manager.taskLayout?.topPadding}px`}
        style:--title-font-size={`${$manager.styling?.task?.fontSize ?? "1.25rem"}`}
        style:--task-bg-color={$manager.cssVariables.taskBgColor}
        style:--task-bg-hover-color={$manager.cssVariables.taskHoverBgColor}
        style:--floating-task-bg-color={$manager.cssVariables.floatingTaskBgColor}
        style:--left-section-width={`${$manager?.taskLayout?.leftSectionWidth}px`}
        on:mousemove={$manager.onMouseMove}
        on:mouseup={$manager.onTaskListMouseUp}
    >
        <!-- Task Item -->
        {#each $manager.tasks as task, taskIdx (task.id)}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li
                role="button" tabindex="0" 
                id={`${idPrefix}--task-id--${taskIdx}`}
                class="task"
                class:task--expanded={taskIdx === $manager.pickedTaskIdx}
                class:task--min={taskIdx != $manager.pickedTaskIdx}
                class:task--light={!isDarkTheme}
                class:task--checked={task.isChecked}
                class:task--not-animated={$manager.floatingTask}
                style={`
                            ${inlineStyling($manager.styling?.task)}
                            height: ${taskIdx === $manager.pickedTaskIdx ? $manager.pickedTaskHT : task.description ? TASK_HEIGHT_MIN_HAS_DESCR : TASK_HEIGHT_MIN_NO_DESCR}px
                      `}
                on:click={(event) => $manager.onTaskedClicked(event, taskIdx)}
                on:mousedown={$manager.onTaskMouseDown}
                on:contextmenu={(e) => $manager.openContextMenu(e, taskIdx)}
            >
                <!-- CheckBox  -->
                <div class="task__left">
                    <button 
                        class="task__checkbox" 
                        id={`${idPrefix}--task-checkbox-id--${taskIdx}`}
                        style={inlineStyling($manager.styling?.checkbox)}
                        on:click={() => $manager.handleTaskCheckboxClicked(task)}
                    >
                        <i class="fa-solid fa-check checkbox-check"></i>
                    </button>
                    <!-- Drag Handle -->
                    {#if $manager.ui.showDragHandle}
                        <div class="task__drag-handle">
                            <div class="task__drag-handle-dots">
                                <SvgIcon icon={Icon.DragDots} options={{ scale: 0.8 }}/>
                            </div>
                        </div>
                    {/if}
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
                    </div>
                    <!-- Description -->
                    <div 
                        class="task__description-container" id={`${idPrefix}--task-description-id--${taskIdx}`}
                        style={`${$manager.pickedTaskDescriptionHT ? `height: ${$manager.pickedTaskDescriptionHT}px` : ""}`}
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
                    <!-- Subtasks -->
                    {#if types["subtasks"] && taskIdx === $manager.pickedTaskIdx}
                        <ul 
                            class="task__subtasks-list" 
                            id={`${idPrefix}--task-subtasks-id--${taskIdx}`}
                        >
                            {#each task.subtasks ?? [] as subtask, subtaskIdx}
                                <li 
                                    class="subtask"
                                    class:subtask--checked={subtask.isChecked}
                                    class:subtask--focused={subtaskIdx === $manager.focusedSubtaskIdx}
                                    class:subtask--light={!isDarkTheme}
                                    style={inlineStyling($manager.styling?.subtask)}
                                    style:--subtask-idx-delay={`${subtask.title ? (30 * subtaskIdx) : 0}ms`}
                                    id={`${idPrefix}--subtask-idx--${subtaskIdx}`}
                                    use:clickOutside on:click_outside={() => $manager.resetCurrentFocusedSubtaskIdx()}
                                >
                                    <!-- Main Content -->
                                    <div class="subtask__content">
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
                                            <button 
                                                class="subtask__checkbox task__checkbox" 
                                                id={`${idPrefix}--subtask-checkbox-id--${subtaskIdx}`}
                                                on:click={() => $manager.handleSubtaskCheckboxClicked(subtaskIdx)}
                                            >
                                                <i class="fa-solid fa-check checkbox-check"></i>
                                            </button>
                                        </div>
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
                                    <button 
                                        class="subtask__settings-btn settings-btn"
                                        on:click={(e) => $manager.openContextMenu(e, taskIdx, subtaskIdx)}
                                    >
                                        <SvgIcon icon={Icon.Settings}/>
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
                <!-- Divider -->
                <div class="task__divider"></div>
            </li>
        {/each}
        <!-- Dragging Task -->
        {#if $manager.floatingTask && $manager.floatingTaskOffset}
            {@const task = $manager.floatingTask}
            {@const containerWidth = tasksListContainerElem.clientWidth}
            <li
                id={`${idPrefix}--floating-task-id--${task.idx}`}
                class="task task--floating"
                class:task--light={!isDarkTheme}
                class:task--checked={task.isChecked}
                style={`
                    ${inlineStyling($manager.styling?.task)}
                    height: ${task.description ? TASK_HEIGHT_MIN_HAS_DESCR : TASK_HEIGHT_MIN_NO_DESCR}px
                `}
                style:width={`${FLOATING_WIDTH_PERCENT * (containerWidth)}px`}
                style:top={`${$manager.floatingTaskOffset.top}px`}
                style:left={`${$manager.floatingTaskOffset.left}px`}
            >
                <div class="task__left">
                    <button 
                        class="task__checkbox"
                        style={inlineStyling($manager.styling?.checkbox)}
                    >
                        <i class="fa-solid fa-check checkbox-check"></i>
                    </button>
                </div>
                <div class="task__right">
                    <div class="task__title-container">
                        <h3 class={`task__title ${task.isChecked ? "strike" : ""}`}>
                            {task.title}
                        </h3>
                    </div>
                    <div 
                        class="task__description-container"
                        style={`${$manager.pickedTaskDescriptionHT ? `height: ${$manager.pickedTaskDescriptionHT}px` : ""}`}
                        style:line-height={`${TASK_DESCR_LINE_HT}px`}
                        style:--description-font-size={`${$manager.styling?.descriptionInput?.fontSize ?? "1.2rem"}`}
                    >
                        <p class="task__description">
                            {task.description}
                        </p>
                    </div>
                </div>
            </li>
        {/if}
        <!-- Dummy Task -->
        <li 
            class="task task--dummy" 
            id={`${idPrefix}--task-id--${$manager.tasks.length}`}
        >
        </li>
        <!-- Context Menu -->
        <DropdownList
            id={`${idPrefix}--tasks-list-dropdown`}
            isHidden={!$manager.isContextMenuOpen} 
            options={{
                onListItemClicked: (event, idx) => $manager.contextMenuOptionClickedHandler(event, idx),
                width:             options.contextMenuOptions.width,
                listItems:         $manager.rightClickedTask ?  taskDropdownOptions : [{ name: "Rename" }, { name: "Delete Subtask" }],
                onClickOutside:    $manager.onContextMenuClickedOutsideHandler,
                position:          { top: $manager.contextMenuY + "px", left: $manager.contextMenuX + "px" }
            }}
        />
    </ul>
</div>

<style lang="scss">
    @import "../scss/inputs.scss";

    .tasks {
        position: relative;

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
        @include flex(flex-start, _);
        outline: none;
        padding: 5px 0px 0px 0px;
        cursor: pointer;
        width: 100%;
        border-top: 0.5px solid transparent;
        border-bottom: 0.5px solid transparent;
        transition: height 0.2s cubic-bezier(.1,.84,.42,.95);
        position: relative;
        font-family: "DM Sans";
        
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
        &:hover, &:focus, &--selected, &--drag-over {
            background-color: var(--task-bg-hover-color);
            @include txt-color(0.015, "border");
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
        &--expanded &__description {
            display: flex;
            max-height: fit-content;
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
        &--drag-over {
            border-top: 1px solid rgba(var(--textColor1), 0.1) !important;
        }
        &--floating {
            position: absolute;
            background-color: var(--floating-task-bg-color) !important;
            border-radius: 12px;
        }
        &--dummy {
            height: 50px;
            background: transparent !important;
            border-bottom-color: transparent !important;
        }
        &--dummy:hover {
            border-top-color: 1px solid transparent;
        }

        &__left {
            width: auto;
            position: relative;
        }
        &__drag-handle {
            cursor: grab;
            transition: 0.1s ease-in-out;
            @include pos-abs-top-left-corner;
            @include not-visible;
        }
        &__drag-handle-dots {
            opacity: 0.1;
        }
        &__right {
            width: calc(100% - var(--left-section-width));
            height: 100%;
            position: relative;
        }
        &__checkbox {
            @include circle(12px);
            @include center;
            transition: 0.1s ease-in-out;
            cursor: pointer;
            border: 1px solid var(--checkbox-empty);
            margin: 3px 19px 0px var(--side-padding);
            position: relative;

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
            }
            &:active {
                transform: scale(0.92);
            }
        }
        &__title-container {
            margin-bottom: 4px;
            max-width: 97%;
        }
        &__title {
            @include multi-line-elipses-overflow;
            max-width: 100%;
        }
        &__title, &__title-input {
            cursor: text;
            width: fit-content;
            white-space: pre-wrap;
            word-break: break-word;
            @include text-style(0.58, 300);
            font-size: var(--title-font-size);
        }
        &__description-container {
            width: 100%;
        }
        &__description, &__description-input {
            @include text-style(0.3, 300, var(--description-font-size));
            padding-right: 8px;
            cursor: text;
        }
        &__description {
            width: 100%;
            @include multi-line-elipses-overflow;
            white-space: pre-wrap;
            word-break: break-word;
        }
        &__subtasks-list {
            padding: 6px 0px 2px 0px;
            width: 100%;
        }
        &__divider {
            @include divider(0.02, 0.5px, calc(100% - var(--left-section-width)));
            @include pos-abs-top-left-corner(0px, var(--left-section-width))
        }
    }
    .subtask {
        @include flex(center, space-between);
        position: relative;
        visibility: hidden;
        transition: 0.12s ease-in-out;
        width: 100%;
        padding: 7px 0px 5px 0px;
        animation: fade-in 0.22s cubic-bezier(.5,.84,.42,.9) var(--subtask-idx-delay) forwards;


        &:first-child {
            padding-top: 3px;
        }
        &:hover &__settings-btn {
            opacity: 0.1;
            visibility: visible;
        }
        &--light &__title, &--light &__title-input {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.6);
        }
        &--light &__settings-btn:hover {
            opacity: 0.7 !important;
        }
        &--checked &__checkbox {
            border-color: transparent;
            background-color: var(--checkbox-fill);
            i {
                display: block;
            }
        }
        &--checked &__title {
            text-decoration: line-through rgba(var(--textColor1), 0.12);
        }
        &__subtask-link {
            @include pos-abs-top-left-corner(0px, 0px);
            svg {
                stroke: rgba(var(--textColor1), 0.15);
            }
        }
        &__content {
            width: 100%;
            display: flex;
        }
        &__left {
            position: relative;
        }
        &__checkbox {
            margin: 2px 11px 0px 0px;
        }
        &__title {
            transition: 0.1s ease-in-out;
        }
        &__title-input::placeholder {
            opacity: 0.2;
        }
        &__title, &__title-input {
            @include text-style(0.2, 300);
            white-space: pre-wrap;
            word-break: break-word;
            max-width: calc(100% - 55px);
            cursor: text;
        }
        &__settings-btn {
            margin: -2px 10px 0px 0px;
            @include pos-abs-top-right-corner;
            opacity: 0;
            visibility: hidden;

            &:hover {
                opacity: 0.4 !important;
                background-color: rgba(var(--textColor1), 0.2);
            }
        }
    }
</style>