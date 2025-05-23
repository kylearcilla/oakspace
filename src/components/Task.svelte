<script lang="ts">
	import { type Writable } from "svelte/store"

	import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { TasksListManager } from "$lib/tasks-list-manager"

	import SvgIcon from "./SVGIcon.svelte"

    export let idx: number
    export let level: number
    export let manager: Writable<Omit<TasksListManager, "tasks">>
    export let task: Task
    export let numbered: boolean
    export let onContextMenu: (e: Event, taskIdx: string, isChild: boolean) => void
    export let onSubtaskCheck: ((wasChecked: boolean) => void) | undefined = undefined

    const { settings, options, ui } = $manager
    const idPrefix = options.id
    const isChild = level > 0

    let leftSideWidth = 0
    let isOpen = false
    let subtasks: Task[] = []
    let checkedSubtasks = 0
    let doCheck = false
    let atMaxDepth = level + 1 === $manager.settings.maxDepth
    let allowEdit = settings.allowEdit

    $: isDark = $themeState.isDarkTheme
    $: pickedTask = $manager.pickedTask
    $: contextMenuOpen = $manager.contextMenu

    $: dragAction = $manager.dragAction
    $: dragTarget = $manager.dragTarget
    
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
        subtasks = $manager.getSubtasks(task.id)
        checkedSubtasks = subtasks.reduce((c, task) => task?.isChecked ? c + 1 : c, 0)
    }

    function _onSubtaskCheck(wasChecked: boolean) {
        checkedSubtasks += wasChecked ? 1 : -1
    }
    function onSelectStart(e: Event) {
        if ($manager.dragSrc) {
            e.preventDefault()
        }
    }
</script>

 <div
    tabindex="0"
    role="button"
    id={`${idPrefix}--task-id--${task.id}`}
    data-idx={task.idx}
    class="task"
    class:task--light={!isDark}
    class:task--hover={dragTarget?.id === task.id && dragAction === "child-add"}
    class:default-pointer={contextMenuOpen}
    class:not-focus-dmenu={contextMenuOpen && !isFocused}

    class:drop-top-border={dragTarget?.id === task.id && dragAction === "nbr-add-top"}
    class:drop-bottom-border={dragTarget?.id === task.id && dragAction === "nbr-add-bottom"}

    style:--max-title-lines={isOpen || (isEdit && editMode === "title") ? 0 : settings.maxTitleLines}
    style:--max-descr-lines={isOpen || (isEdit && editMode === "description") ? 0 : settings.maxDescrLines}
    style:--left-side-width={`${leftSideWidth - 14}px`}
 >
    <div 
        class="task__content"
        class:task__content--checked={task.isChecked && !numbered}
        class:task__content--open={isOpen}
        on:selectstart={onSelectStart}
    >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div 
            tabindex="0"
            role="button" 
            class="task__top-content"
            class:task__top-content--highlight={dragTarget?.id != task.id}
            class:task__top-content--focused={isFocused}
            on:contextmenu|preventDefault={(e) => {
                onContextMenu(e, task.id, isChild)
            }}
            on:pointerdown={(e) => {
                if (!contextMenuOpen) {
                    $manager.onPointerDown(e, task)
                }
            }}
            on:click={(event) => {
                $manager.onTaskClicked({ event, id: task.id, isChild, atMaxDepth })
            }}
        >
            <div class="task__left" bind:clientWidth={leftSideWidth}>
                <div>
                    {#if numbered}
                        <div class="task__number">
                            {task.idx + 1}.
                        </div>
                    {:else}
                        <button 
                            class="task__checkbox"
                            id={`${idPrefix}--task-checkbox-id--${task.id}`}
                            style:pointer-events={contextMenuOpen ? "none" : "auto"}
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
                <div 
                    class="grip"
                    on:pointerdown={() => $manager.toggleDragging(true)}
                    on:pointerup={() => $manager.toggleDragging(false)}
                >
                    <div class="grip__icon">
                        <SvgIcon icon={Icon.DragDots} options={{ scale: 1.15 }} />
                    </div>
                </div>
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
                <div class="task__title-container">
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div 
                        id={`${idPrefix}--task-title-id--${task.id}`}
                        class="task__title"
                        class:strike={doCheck && !numbered}
                        spellcheck="false"
                        data-placeholder="Untitled"
                        contenteditable={allowEdit && !contextMenuOpen}
                        on:click={() => { 
                            if (allowEdit) {
                                // $manager.onTaskTitleClick({ id: task.id, isChild })
                            }
                            // $manager.setContextMenu(false)
                        }}
                    >
                        {task.title}
                    </div>
                    <div class="task__count" class:hidden={subtasks.length === 0}>
                        {subtasks.length}
                    </div>
                </div>
                <div 
                    class="task__description-container"
                    class:hidden={!task.description && !(isEdit && editMode === "description")}
                >
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div 
                        id={`${idPrefix}--task-description-id--${task.id}`}
                        class="task__description"
                        class:pointer-events-none={!allowEdit}
                        class:no-pointer-events={!allowEdit}
                        data-placeholder="No description"
                        spellcheck="false"
                        contenteditable={allowEdit && !contextMenuOpen}
                        on:click={() => { 
                            if (allowEdit) {
                                // $manager.onTaskDescriptionFocus(task.id, isChild)
                            }
                            // $manager.setContextMenu(false)
                        }}
                        on:pointerdown={(e) => {
                            if (!allowEdit) {
                                e.preventDefault()
                            }
                        }}
                    >
                        {task.description}
                    </div>
                </div>
            </div>
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
                        {numbered}
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
    @use "../scss/inputs.scss" as *;
    @use "../scss/task.scss" as *;
</style>