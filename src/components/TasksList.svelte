<script lang="ts">
	import type { Writable } from "svelte/store"
    import { onMount } from "svelte"

	import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { TasksListManager } from "$lib/tasks-list-manager"
	import { InputManager, TextEditorManager } from "$lib/inputs"
	import { clickOutside, inlineStyling } from "$lib/utils-general"
    
	import SvgIcon from "./SVGIcon.svelte"
	import DropdownList from "./DropdownList.svelte"

    export let newTaskFlag: boolean
    export let options: TasksListOptions

    const _manager   = new TasksListManager(options)
    const manager    = _manager.state
    const tasksStore = _manager.tasks 
    const settings   = $manager.settings
    const { TASK_DESCR_LINE_HT, DEFAULT_STYLES, CONTEXT_MENU_WIDTH } = $manager
    const { 
        TASK_FONT_SIZE, DESCR_FONT_SIZE, SUB_TASK_FONT_SIZE, 
        CHECK_BOX_DIM 
    } = DEFAULT_STYLES

    const { tasksOptions, subTaskOptions } = _manager.getContextMenuOptions()

    let tasksListContainerElem: HTMLElement
    let tasksList: HTMLElement
    let idPrefix = options.id
    let isContextMenuOpen = false
    let containerHeight = 0
    let tasks: Task[] = []

    $: createNewTask(newTaskFlag ?? false)

    $: isDark       = $themeState.isDarkTheme
    $: pickedTaskIdx     = $manager.pickedTaskIdx
    $: editSubtaskIdx    = $manager.editSubtaskIdx
    $: pickedTaskTitle   = $manager.getTask(pickedTaskIdx)?.title ?? ""
    $: pickedTaskDescription = $manager.getTask(pickedTaskIdx)?.description ?? ""
    $: editingSubtaskTitle   = $manager.getSubtask(pickedTaskIdx, editSubtaskIdx)?.title ?? ""

    $: if ($manager.isContextMenuOpen && tasksListContainerElem) {
        tasksListContainerElem.style.overflowY = "hidden"
    }
    else if (tasksListContainerElem) {
        tasksListContainerElem.style.overflowY = "scroll"
    }
    $: if (options.containerRef) {
        containerHeight = options.containerRef.clientHeight
    }

    tasksStore.subscribe((_tasks) => tasks = _tasks)

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
    $: initSubtaskTextEditor(editSubtaskIdx)

    function createNewTask(doCreateNewTask: boolean) {
        console.log({ doCreateNewTask })
        if (!doCreateNewTask) return

        $manager.addingNewTask(0)
    }
    function initSubtaskTextEditor(editSubtaskIdx: number) {
        if (editSubtaskIdx < 0) return

        subtaskTextEditor = (new TextEditorManager({ 
            initValue: editingSubtaskTitle,
            placeholder: "Title goes here...",
            doAllowEmpty: false,
            maxLength: 150,
            id: `${idPrefix}--task-subtask-title-input-id--${editSubtaskIdx}`,
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
    function keyboardShortcutsHandler(event: KeyboardEvent) {
        $manager.keyboardShortcutHandler(event)
    }
    
    function onTaskContextMenu(e: Event, taskIdx: number) {
        const target = e.target as HTMLElement
        const isSubask = $manager.didClickOnSubtaskElem(target)

        if (isSubask) return
        $manager.openContextMenu(e, taskIdx)
        isContextMenuOpen = true
    }
    function onSubtaskContextMenu(taskIdx: number, subtaskIdx: number, context = true) {
        if (isContextMenuOpen) {
            isContextMenuOpen = false
            return
        }
        $manager.openSubtaskContextMenu(taskIdx, subtaskIdx)
        isContextMenuOpen = true
    }
    function onWindowResize() {
        requestAnimationFrame(() => $manager.updateOpenTaskHeight({ hasWidthChanged: true }))
    }
    onMount(() => {
        $manager.initAfterLoaded(tasksListContainerElem, tasksList)
    })
</script>

<svelte:window on:keydown={keyboardShortcutsHandler}  on:resize={onWindowResize} /> 

<div 
    class="tasks-wrapper"
    class:tasks-wrapper--light={!isDark}
    class:tasks-wrapper--top-btn={$manager.addBtn?.pos === "top"}
    class:tasks-wrapper--empty-list={tasks.length === 0}

    style:--side-padding={$manager.ui.sidePadding}
    style:--checkbox-dim={$manager.ui.checkboxDim ?? CHECK_BOX_DIM}

    style:--max-title-lines={$manager.settings.maxTitleLines}
    style:--max-descr-lines={$manager.settings.maxDescrLines}
    style:--task-top-padding={`${$manager.taskLayout?.topPadding}px`}
    style:--left-section-width={`${$manager?.taskLayout?.leftSectionWidth}px`}

    style:--tasks-max-height={$manager.ui.maxHeight}
    style:--title-font-size={`${$manager.styling?.task?.fontSize ?? TASK_FONT_SIZE}`}
    style:--descr-font-size={`${$manager.styling?.description?.fontSize ?? DESCR_FONT_SIZE}`}
    style:--subtask-font-size={`${$manager.styling?.subtask?.fontSize ?? SUB_TASK_FONT_SIZE}`}
>
    <div 
        bind:this={tasksListContainerElem}
        bind:clientHeight={containerHeight}
        class="tasks-container no-scroll-bar"
        class:tasks-container--empty={tasks.length === 0}
        id={`${idPrefix}--tasks-list-container`}
        style={`${inlineStyling($manager.styling?.list)}`}
        style:height={$manager.ui.listHeight}
        use:clickOutside on:click_outside={(e) => $manager.onClickedOutside(e)} 
    >
        <ul 
            bind:this={tasksList}
            class="tasks"
            class:tasks--dragging-state={$manager.dragSrc}
            class:tasks--numbered={settings.numbered}
            id={`${idPrefix}--tasks-list`}
            style={inlineStyling($manager.styling?.list)}
            on:pointermove={$manager.onTaskListPointerMove}
        >   
            <!-- Task Item -->
            {#each tasks as task, taskIdx (task.idx)}
                {@const pickedIdx = $manager.pickedTaskIdx}
                {@const focusedIdx = $manager.focusedTaskIdx}
                {@const subtaskProgress = settings.subtasks ? $manager.getSubtaskProgress(taskIdx) : null }
                {@const subtasks = task.subtasks ?? []}
                {@const isPicked = taskIdx === $manager.pickedTaskIdx}
                {@const _ = $manager.initMinTaskHeight(task)}

                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li
                    draggable="true"
                    role="button" 
                    tabindex="0" 
                    id={`${idPrefix}--task-id--${taskIdx}`}
                    data-task-type="task"
                    class="task dg-over-el"
                    class:drag-src={$manager.dragSrc?.idx === task.idx}
                    class:task--light={!isDark}
                    class:task--no-divider={!$manager.ui.hasTaskDivider}
                    class:task--hide-drag-handle={!$manager.ui.showDragHandle}
                    class:task--expanded={taskIdx === pickedIdx}
                    class:task--min={taskIdx != pickedIdx}
                    class:task--focused={focusedIdx === taskIdx}
                    class:task--checked={task.isChecked}
                    class:dg-over-el--over={task.title === $manager.dragTarget?.title}
                    style={`${inlineStyling($manager.styling?.task)}`}
                    on:dragstart={(e) => $manager.onDragStart(e, task)}
                    on:dragstart={(e) => $manager.onDragStart(e, task)}
                    on:dragover={(e) => $manager.onDragOver(e, task)}
                    on:dragleave={() => $manager.onDragLeave()}
                    on:drag={(e) => $manager.onDrag(e)}
                    on:dragend={() => $manager.onDragEnd()}
                    on:click={(event) => {
                        if (isContextMenuOpen) return
                        $manager.onTaskClicked(event, taskIdx)
                    }}
                    on:contextmenu|preventDefault={(e) => {
                        onTaskContextMenu(e, taskIdx)
                    }}
                >
                    <div class="task__top">
                        <!-- checkbox or number  -->
                        <div class="task__left">
                            {#if settings.numbered}
                                <div class="task__number" style={inlineStyling($manager.styling?.num)}>
                                    {taskIdx + 1}.
                                </div>
                            {:else}
                                <button 
                                    class="task__checkbox"
                                    id={`${idPrefix}--task-checkbox-id--${taskIdx}`}
                                    style={inlineStyling($manager.styling?.checkbox)}
                                    on:click={() => $manager.toggleTaskComplete(task)}
                                >
                                    <i class="fa-solid fa-check checkbox-check"></i>
                                </button>
                            {/if}
                            <!-- Drag Handle -->
                            <div 
                                class="grip"
                                on:pointerdown={() => $manager.toggleDragging(true)}
                                on:pointerup={() => $manager.toggleDragging(false)}
                            >
                                <div class="grip__icon">
                                    <SvgIcon icon={Icon.DragDots} options={{ scale: 1.15 }} />
                                </div>
                            </div>
                        </div>
                        <div class="task__right">
                            <!-- Title -->
                            <div class="task__title-container">
                                {#if taskIdx === $manager.pickedTaskIdx}
                                    <div 
                                        id={`${idPrefix}--task-title-id--${taskIdx}`}
                                        class="task__title-input"
                                        spellcheck="false"
                                        data-placeholder={$titleTextEditor.placeholder}
                                        contenteditable
                                        bind:innerHTML={$titleTextEditor.value}
                                        on:paste={(e) => $titleTextEditor.onPaste(e)}
                                        on:input={(e) => $titleTextEditor.onInputHandler(e)}
                                        on:blur={(e)  => {
                                            $titleTextEditor.onBlurHandler(e)
                                        }}
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
                                    {@const frac = `${Math.floor((subtaskProgress.countDone / subtaskProgress.length) * 100)}%`}
                                    {@const count = subtaskProgress.length}

                                    <div 
                                        class="task__subtask-progress"
                                        class:task__subtask-progress--min={settings.numbered}
                                    >    
                                        <span>
                                            {settings.progress === "count" ? count : frac}
                                        </span>
                                    </div>
                                {/if}
                            </div>
                            <!-- Description -->
                            <div 
                                class="task__description-container" id={`${idPrefix}--task-description-id--${taskIdx}`}
                                class:hidden={!task.description && !isPicked}
                                style={inlineStyling($manager.styling?.description)}
                                style:height={`${$manager.pickedTaskDescriptionHT ? `height: ${$manager.pickedTaskDescriptionHT}px` : "height: auto"}`}
                                style:line-height={`${TASK_DESCR_LINE_HT}px`}
                            >
                                {#if isPicked}
                                    <div 
                                        id={`${idPrefix}--task-description-input-id--${taskIdx}`}
                                        class="task__description-input"
                                        data-placeholder={$descriptionTextEditor.placeholder}
                                        spellcheck="false"
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
                    {#if settings.subtasks && subtasks.length > 0 && taskIdx === $manager.pickedTaskIdx}
                        <ul 
                            class="task__subtasks-list" 
                            id={`${idPrefix}--task-subtasks-id--${taskIdx}`}
                        >
                            {#each subtasks as subtask, subtaskIdx (`${taskIdx}--${subtaskIdx}`)}
                                {@const focusedSubtaskIdx   =  $manager.focusedSubtaskIdx}
                                {@const focused             = $manager.rightClickedSubtask?.idx === subtaskIdx || focusedSubtaskIdx === subtaskIdx}
                                {@const subtaskAnimDuration = subtasks.length < 8 ? 150 : 90}
                                {@const subtaskDelayFactor  = subtasks.length < 8 ? 15  : 12}
                                {@const subtaskDelay        = subtask.title ? (subtaskDelayFactor * subtaskIdx) : 0}
                                {@const hideDivider         = false}

                                <li 
                                    role="button" 
                                    tabindex="0" 
                                    class="task subtask"
                                    data-task-type="subtask"
                                    id={`${idPrefix}--subtask-id--${subtaskIdx}`}
                                    style={inlineStyling($manager.styling?.subtask)}
                                    class:task--light={!isDark}
                                    class:subtask--light={!isDark}
                                    class:subtask--checked={subtask.isChecked}
                                    class:subtask--focused={focused}
                                    class:subtask--drag-over={subtaskIdx === 0}
                                    class:drag-src={subtaskIdx === $manager.dragSrc?.idx}
                                    style:--subtask-animation-duration={`${subtaskAnimDuration}ms`}
                                    style:--subtask-idx-delay={`${subtaskDelay}ms`}
                                    use:clickOutside on:click_outside={() => {
                                        $manager.resetCurrentFocusedSubtaskIdx()
                                    }}
                                    on:click={() => {
                                        $manager.onSubtaskClicked(taskIdx, subtaskIdx)
                                    }}
                                    on:contextmenu|preventDefault={() => {
                                        onSubtaskContextMenu(taskIdx, subtaskIdx)
                                    }}
                                >
                                    <div class="subtask__content">
                                        <div class="subtask__content-main">
                                            <div class="subtask__left">
                                                <!-- Checkbox -->
                                                {#if settings.numbered}
                                                    <div class="subtask__number task__number">
                                                        {String.fromCharCode(subtaskIdx + 65 + 32)}.
                                                    </div>
                                                {:else}
                                                    <button 
                                                        id={`${idPrefix}--subtask-checkbox-id--${subtaskIdx}`}
                                                        style={inlineStyling($manager.styling?.checkbox)}
                                                        class="subtask__checkbox task__checkbox" 
                                                        on:click={() => $manager.toggleSubtaskComplete(subtaskIdx)}
                                                    >
                                                        <i class="fa-solid fa-check checkbox-check"></i>
                                                    </button>
                                                {/if}
                                            </div>
                                            <!-- Main Content -->
                                            <div class="subtask__right">
                                                {#if $manager.editSubtaskIdx === subtaskIdx}
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
                                    </div>
                                    <!-- Divider -->
                                    {#if !hideDivider}
                                        <div class="subtask__divider"></div>
                                    {/if}
                                </li>
                            {/each}
                                <!-- Dummy Subtask Task -->
                                <li 
                                    data-task-type="subtask"
                                    class="subtask--dummy" 
                                    class:subtask--dummy-min={!$manager.dragSrc}
                                    class:subtask--drag-over={subtasks.length === 0}
                                    id={`${idPrefix}--subtask-id--${subtasks.length}`}
                                >
                                </li>
                        </ul>
                    {/if}
                    <!-- Divider -->
                    {#if taskIdx != 0}
                        <div class="task__divider divider"></div>
                    {/if}
                </li>
            {/each}
            <!-- Dummy Task -->
            <li 
                data-task-type="task"
                class="task task--dummy dg-over-el" 
                class:dg-over-el--over={$manager.isTargetEnd}
                class:hidden={!$manager.dragSrc}
                id={`${idPrefix}--task-id--${tasks.length}`}
                on:dragover={(e) => $manager.onDragOver(e, "end")}
                on:dragleave={() => $manager.onDragLeave()}
                on:dragend={() => $manager.onDragEnd()}
            >
            </li>

            <!-- Floating Task -->
            <li 
                id={`${idPrefix}--float-task-elem`}
                class="task task--floating"
            >
                <div class="task__top">
                    <!-- checkbox or number  -->
                    <div class="task__left">
                        {#if settings.numbered}
                            <div class="task__number" style={inlineStyling($manager.styling?.num)}>
                                {($manager.dragSrc?.idx ?? 0) + 1}
                            </div>
                        {:else}
                            <button 
                                class="task__checkbox"
                                style={inlineStyling($manager.styling?.checkbox)}
                            >
                                <i class="fa-solid fa-check checkbox-check"></i>
                            </button>
                        {/if}
                        <!-- Drag Handle -->
                        <div class="task__drag-handle">
                            <div class="task__drag-handle-dots">
                                <SvgIcon 
                                    icon={Icon.DragDots} 
                                    options={{ scale: 0.85, width: 25, height: 24 }}
                                />
                            </div>
                        </div>
                    </div>
                    <div class="task__right">
                        <!-- Title -->
                        <div class="task__title-container">
                            <h3 class="task__title">
                                {@html $manager.dragSrc?.title}
                            </h3>
                        </div>
                        <!-- Description -->
                        <div 
                            class="task__description-container"
                            style:line-height={`${TASK_DESCR_LINE_HT}px`}
                        >
                            <p class="task__description">
                                {@html $manager.dragSrc?.description}
                            </p>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
    {#if $manager.settings?.addBtn?.doShow}
        {@const iconScale = $manager.settings.addBtn.iconScale}
        {@const { style, text } = $manager.settings.addBtn}
        <button 
            class="tasks-wrapper__addbtn"
            style={inlineStyling(style)}
            on:click={() => $manager.addingNewTask(0)}
        >
            <span>
                {text ?? "Add an Item"}
            </span>
            <SvgIcon 
                icon={Icon.Add} 
                options={{ 
                    strokeWidth: 1.8,
                    scale: iconScale
                }} 
            />
        </button>
    {/if}

    <!-- Context Menu -->
    <DropdownList
        id={`${idPrefix}--tasks`}
        isHidden={!isContextMenuOpen}
        options={{
            listItems:   $manager.rightClickedTask ? tasksOptions : subTaskOptions,
            onListItemClicked: (context) => {
                isContextMenuOpen = false
                $manager.contextMenuOptionClickedHandler(context)
            },
            onClickOutside: () => {
                isContextMenuOpen = false
            },
            onDismount: () => {
                isContextMenuOpen = false
                $manager.onContextMenuClickedOutsideHandler()
            },
            styling: { 
                width: `${CONTEXT_MENU_WIDTH}px`
            },
            position: { 
                top: $manager.contextMenuY + "px", left: $manager.contextMenuX + "px" 
            }
        }}
    />
</div>


<style lang="scss">
    @import "../scss/inputs.scss";

    .tasks-wrapper {
        height: 100%;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: visible;

        &--light &__addbtn {
            opacity: 0.6;
            &:hover {
                opacity: 1;
            }
            span {
                font-weight: 600;
            }
        }

        &__addbtn {
            margin: 0px 0px 5px var(--side-padding);
            font-weight: 400;
            width: 100%;
            opacity: 0.2;
            max-width: 100px;
            @include text-style(1, 500, 1.2rem);
            @include flex(center);

            span {
                margin-right: 7px;
            }
            &:hover {
                opacity: 0.6;
            }
        }
    }

    .tasks {
        position: relative;
        height: 100%;
        max-height: 100%;
        padding-top: 2px;

        &--dragging-state * {
            cursor: grabbing;
        }

        &-wrapper--top-btn {
            flex-direction: column-reverse;
        }
        &-wrapper--empty-list .tasks-addbtn {
            margin: 7px 0px 1px var(--side-padding);
        }
        &-container {
            overflow-y: scroll;
            max-height: var(--tasks-max-height);
            margin: 5px 0px 0px -20px;
            padding-left: 20px;
        }
        &-container--empty {
            margin-bottom: 5px !important;
        }
    }
    .task {
        cursor: pointer;
        outline: none;
        padding: 5px 0px 0px 0px;
        width: 100%;
        position: relative;
        opacity: 1 ;
        margin-bottom: 0px;
        border-radius: 5px;

        &:hover,
        &:focus,
         &--focused, 
         &--selected {
            @include txt-color(0.01, "bg");
        }

        &:focus-visible {
            box-shadow: none !important;
        }
        &:hover {
            user-select: auto;
        }
        &--not-animated {
            transition: 0s;
        }
        &--min:hover &__drag-handle {
            @include visible;
        }

        /* light adhustments */
        &--light:hover,  
        &--light:focus,
        &--light#{&}--focused, 
        &--light#{&}--selected {
            @include txt-color(0.03, "bg");
        }
        &--light &__title-input, 
        &--light &__title {
            @include text-style(1, 600)
        }
        &--light &__description,
        &--light &__description-input {
            @include text-style(0.9)
        }
        &--light &__number {
            @include text-style(0.7);
        }
        &--light &__drag-handle-dots {
            opacity: 0.5;
        }
        &--light &__subtask-progress span {
            @include text-style(0.3);
        }
        &--light#{&}--floating {
            box-shadow: 0px 1px 14px 4px rgba(0, 0, 0, 0.02);
            border: 1px solid rgba(var(--textColor1), 0.09) !important;
        }

        /* Expanded UI */
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
        &--expanded &__description, &__description-input {
            opacity: 1 !important;
        }
        &--expanded &__drag-handle {
            @include abs-top-left(-1px);
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

        /* Checked UI */
        &--checked &__left &__checkbox {
            background-color: var(--elemColor1);

            i {
                display: block;
            }
        }
        &--checked  &__title-container h3 {
            color: rgba(var(--textColor1), 0.5);
        }
        &--checked &__title.strike::after {
            background-color: rgba(var(--textColor1), 0.4);
        }
        &--checked &__description, &__description-input {
            opacity: 0.4;
        }

        &--dummy {
            height: 30px;
            background: none !important;
        }
        &--floating {
            position: absolute;
            background-color: var(--bg-2) !important;
            border-radius: 12px;
            z-index: 100;
            box-shadow: 0px 1px 16.4px 4px rgba(0, 0, 0, 0.14);
            border: 1.5px solid rgba(var(--textColor1), 0.04) !important;
            padding: 8px 0px 11px 0px !important;
            height: 66px;
            width: 80%;
            @include not-visible;
            @include abs-bottom-left(-100px, -100px);
        }
        &--floating &__number, 
        &--floating &__checkbox {
            margin-left: 18px !important;
        }
        &--floating &__title-container {
            width: calc(100% - 10px) !important;  
            margin-bottom: 2.5px;
        }
        &--floating-subtask {
            padding: 0px;
        }
        &--floating &__description {
            @include multi-line-elipses-overflow(1);
        }
        &--no-divider &__divider {
            display: none;
        }
        &--hide-drag-handle &__drag-handle {
            display: none;
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
            @include abs-top-left(-3px, -3px);
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
            @include text-style(0.4, 500);
            font-size: calc(var(--title-font-size) - 1px);
        }
        &__checkbox {
            @include center;
            height: var(--checkbox-dim);
            width: var(--checkbox-dim);
            transition: 0.1s ease-in-out;
            background-color: var(--lightColor3);
            border-radius: 0px;
            position: relative;
            cursor: pointer;
            z-index: 1;
            
            i {
                margin-top: 1px;
                font-size: 1rem;
                display: none;
                color: var(--elemTextColor);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.055);
            }
            &:active {
                transform: scale(0.92);
            }
        }
        &__title-container {
            width: calc(100% - var(--side-padding));
            @include flex(flex-start, space-between);
            margin-top: -1.5px;
        }
        &__title {
            @include multi-line-elipses-overflow(var(--max-title-lines));
            max-width: 100%;
        }
        &__title, 
        &__title-input {
            cursor: text;
            width: fit-content;
            white-space: pre-wrap;
            word-break: break-word;
            user-select: none;
            @include text-style(1, 500, var(--title-font-size));
        }
        &__description-container {
            width: 100%;
        }
        &__description, 
        &__description-input {
            @include text-style(0.4, 500, var(--descr-font-size));
            opacity: 0.65;
            user-select: none;
            padding: 0px 8px 1.5px 0px;
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
            margin: 0px 0px 0px 6px;
            user-select: none;

            span {
                @include text-style(0.15, 400, calc(var(--title-font-size) - 1px), "DM Mono");
            }
            span:nth-last-child(2) {
                display: inline-block;
                margin: 0px 1px;
            }
        }
        &__subtask-progress--min span:not(:last-child) {
            display: none;
        }
        &__subtasks-list {
            width: 100%;
        }
        &__divider {
            @include divider(0.05, 0.5px, calc(100% - calc(2 * var(--side-padding))));
            @include abs-top-left(0px, var(--side-padding));
        }
    }
    .subtask {
        @include flex(center, space-between);
        position: relative;
        visibility: hidden;
        width: 100%;
        animation: appear-in var(--subtask-animation-duration) cubic-bezier(.5,.84,.42,.9) var(--subtask-idx-delay) forwards;
        padding-left: var(--left-section-width) !important;
        
        &:focus, &--focused {
            background-color: rgba(var(--textColor1), 0.024);
            outline: none;
        }
        &:hover {
            background: none !important;
        }
        &:hover &__drag-handle {
            @include visible;
        }

        &:hover &__divider, 
        &:focus &__divider, 
        &--focused &__divider {
            display: none;
        }
        &:hover + .subtask .subtask__divider,
        &:focus + .subtask .subtask__divider, 
        &--focused + .subtask .subtask__divider {
            display: none;
        }

        /* Light & Dark Adjustments */
        &--light &__title, 
        &--light &__title-input {
            color: rgba(var(--textColor1), 0.8);
            font-weight: 600 !important
        }
        &--light &__divider {
            @include divider(0.06, 1px, calc(100% - (var(--side-padding) + var(--left-section-width))));
        }

        &--hidden {
            display: none !important;
            height: 0px !important;
        }
        &--checked &__checkbox i {
            display: block;
        }
        &--checked &__title {
            @include text-style(0.3);
            text-decoration: line-through rgba(var(--textColor1), 0.2);
        }
        &--checked &__checkbox {
            background-color: var(--elemColor1);
        }
        &--dummy {
            height: 25px !important;
            padding: 0px !important;
        }
        &--dummy-min {
            height: 10px !important;
            padding: 4px !important;
        }
        &__content {
            width: 100%;
            width: 100%;
            @include flex(start, space-between)
        }
        &__content-main {
            width: 100%;
            position: relative;
            @include flex(start);
        }
        &__left {
            position: relative;
        }
        &__right {
            width: 100%;
            max-width: calc(100% - 55px);
        }
        &__drag-handle {
            cursor: grab;
            transition: 0.1s ease-in-out;
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
            margin: 2px 11px 0px 0px !important;
        }
        &__number {
            padding-left: 5px;
        }
        &__title,
        &__title-input {
            white-space: pre-wrap;
            word-break: break-word;
            max-width: 100%;
            width: 100%;
            display: block;
            cursor: text;
            transition: 0.1s ease-in-out;
            @include text-style(1, 500, var(--subtask-font-size));
        }
        &__title-input::placeholder {
            opacity: 0.4;
        }
        &__divider {
            display: none;
            @include divider(0.04, 0.5px, calc(100% - (var(--side-padding) + var(--left-section-width))));
            @include abs-top-left(0px, var(--left-section-width));
        }
    }
    .divider {
        background-color: rgba(var(--textColor1), 0.035);
        height: 0.5px;
        width: 100%;
        @include divider(0.05, 0.5px, calc(100% - calc(2 * var(--side-padding))));
        @include abs-top-left(0px, var(--side-padding));

        &:first-child {
            display: none;
        }
    }

    .drag-src {
        // no display none as it will trigger an animation
        opacity: 0.5;
    }

    .grip {
        top: -8px;
        left: -18px;
    }

    @keyframes appear-in {
        0% {
            visibility: hidden;
            opacity: 0;
        }
        100% {
            visibility: visible;
            opacity: 1;
        }
    }
</style>