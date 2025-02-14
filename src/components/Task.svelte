<script lang="ts">
	import { type Writable } from "svelte/store"

	import SvgIcon from "./SVGIcon.svelte"

	import { Icon } from "../lib/enums"
	import { themeState } from "../lib/store"
	import { TasksListManager } from "$lib/tasks-list-manager"

    export let idx: number
    export let level: number
    export let manager: Writable<Omit<TasksListManager, "tasks">>
    export let task: Task
    export let onContextMenu: (e: Event, taskIdx: string, isChild: boolean) => void
    export let onSubtaskCheck: ((wasChecked: boolean) => void) | undefined = undefined

    const { settings, options, ui } = $manager
    const idPrefix = options.id
    const isChild = level > 0

    let tasks = $manager.tasks._store
    let leftSideWidth = 0
    let isOpen = false
    let subtasks = []
    let checkedSubtasks = 0
    let doCheck = false
    let type = settings.type
    let atMaxDepth = level + 1 === $manager.tasks.maxDepth

    $: isDark = $themeState.isDarkTheme
    $: pickedTask = $manager.pickedTask
    $: dragSrc = $manager.dragSrc
    $: isContextMenuOpen = $manager.isContextMenuOpen
    
    $: isFocused = task.id === $manager.focusTask?.id
    $: isEdit    = $manager.editTask?.id === task.id
    $: editMode  = $manager.editMode

    $: {
        isOpen = $manager.isTaskOpen(task.id, isChild) || task.id === pickedTask?.id
    }
    $: {
        doCheck = task.isChecked && $manager.editTask?.id != task.id
    }
    $: {
        subtasks = $manager.tasks.getSubtasks(task.id)
        checkedSubtasks = subtasks.reduce((c, task) => task?.isChecked ? c + 1 : c, 0)
    }

    function _onSubtaskCheck(wasChecked: boolean) {
        checkedSubtasks += wasChecked ? 1 : -1
    }
</script>

 <div
    tabindex="0"
    role="button"
    id={`${idPrefix}--task-id--${task.id}`}
    data-idx={task.idx}
    class="task"
    class:task--light={!isDark}
    class:task--dragging-state={$manager.dragSrc}
    class:task--side-menu={type === "side-menu"}
    class:drag-src={task.id === dragSrc?.id}
    style:--max-title-lines={isOpen ? 0 : settings.maxTitleLines}
    style:--max-descr-lines={isOpen ? 0 : settings.maxDescrLines}
    style:--left-side-width={`${leftSideWidth - 14}px`}
 >
    <div 
        class="task__content"
        class:task__content--checked={task.isChecked}
        class:task__content--open={isOpen}
    >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div 
            tabindex="0"
            role="button" 
            draggable="true"
            class="task__top-content"
            class:task__top-content--focused={isFocused}
            on:dragstart|self={(e) => { 
                $manager.onDragStart(e, task)
            }}
            on:dragenter|self={(e) => { 
                $manager.onDragEnter(e, task.parentId, task.id)
            }}
            on:dragleave|self={(e) => { 
                $manager.onDragLeave(e)
            }}
            on:dragover|self={(e) => { 
                $manager.onDrag(e, task.id)
            }}
            on:dragend|self={(e) => { 
                $manager.onDragEnd(e)
            }}
            on:click={(event) => {
                if (isContextMenuOpen) return
        
                $manager.onTaskClicked({ event, id: task.id, isChild, atMaxDepth })
            }}
            on:contextmenu|preventDefault={(e) => {
                onContextMenu(e, task.id, isChild)
            }}
        >
            <!-- checkbox or number -->
            <div 
                bind:clientWidth={leftSideWidth}
                class="task__left"
            >
                <div style:margin={level === 0 && type === "side-menu" ? "0px 0px 0px 2px" : ""}>
                    {#if settings.numbered}
                        <div class="task__number">
                            {task.idx + 1}.
                        </div>
                    {:else}
                        <button 
                            class="task__checkbox"
                            id={`${idPrefix}--task-checkbox-id--${task.id}`}
                            on:click={() => { 
                                if (isChild && onSubtaskCheck) {
                                    onSubtaskCheck(!task.isChecked)
                                }
                                $manager.toggleTaskComplete(task.id)
                            }}
                        >
                            <i class="fa-solid fa-check checkbox-check"></i>
                        </button>
                    {/if}
                </div>
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
                <!-- Toggle Arrow -->
                <button
                    class="toggle-arrow toggle-arrow--section"
                    class:toggle-arrow--closed={!isOpen}
                    class:hidden={subtasks.length === 0 || atMaxDepth}
                    style:margin-left={"18px"}
                >
                    <SvgIcon 
                        icon={Icon.Dropdown}
                        options={{
                            scale: 1.2, height: 12, width: 12, strokeWidth: 1.4
                        }}
                    />
                </button>
            </div>
            <div class="task__right">
                <!-- Title -->
                <div class="task__title-container">
                    <div 
                        id={`${idPrefix}--task-title-id--${task.id}`}
                        class="task__title"
                        class:strike={doCheck}
                        spellcheck="false"
                        data-placeholder="Title goes here..."
                        draggable="false"
                        contenteditable
                        on:click={() => { 
                            $manager.onTaskTitleClick({
                                id: task.id,
                                doExpand: !isChild,
                                isChild
                            })
                        }}
                    >
                        {task.title}
                    </div>
                    <div class="task__count" class:hidden={subtasks.length === 0}>
                        {subtasks.length}
                    </div>
                </div>
                <!-- Description -->
                <div 
                    class="task__description-container"
                    class:hidden={!task.description && !(isEdit && editMode === "description")}
                >
                    <div 
                        id={`${idPrefix}--task-description-id--${task.id}`}
                        class="task__description"
                        data-placeholder="No description"
                        draggable="false"
                        spellcheck="false"
                        contenteditable
                        on:click={() => { 
                            $manager.onTaskDescriptionFocus(task.id, isChild)
                        }}
                    >
                        {task.description}
                    </div>
                </div>
            </div>
            <!-- Divider -->
            {#if task.idx != 0 && ui.hasTaskDivider}
                <div class="divider"></div>
            {/if}
        </div>
    </div>
    {#if isOpen && subtasks.length > 0 && !atMaxDepth}
        <ul 
            class="task__subtasks"
            id={`${idPrefix}--task-children-id--${task.id}`}
        >
            <div class="divider"></div>
            {#each subtasks.sort((a, b) => a.idx - b.idx) as subtask (subtask.id)}
                <li>
                    <svelte:self
                        {idx}
                        level={level + 1}
                        task={subtask}
                        onSubtaskCheck={_onSubtaskCheck}
                        {manager} 
                        {onContextMenu}
                    />
                </li>
            {/each}
        </ul>
    {/if}
 </div>

<style lang="scss">
    @import "../scss/inputs.scss";
    @import "../scss/task.scss";
</style>