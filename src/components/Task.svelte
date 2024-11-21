<script lang="ts">
	import { type Writable } from "svelte/store"

	import SvgIcon from "./SVGIcon.svelte"

	import { Icon } from "../lib/enums"
	import { themeState } from "../lib/store"
	import { inlineStyling } from "../lib/utils-general"
	import { TasksListManager } from "$lib/tasks-list-manager"

    export let idx: number
    export let level: number
    export let manager: Writable<Omit<TasksListManager, "tasks">>
    export let task:    Task
    export let onContextMenu: (e: Event, taskIdx: string, isChild: boolean) => void
    export let onSubtaskCheck:    ((wasChecked: boolean) => void) | undefined = undefined

    const { settings, options, ui, styling } = $manager
    const idPrefix = options.id
    const isChild = level > 0

    let tasks = $manager.tasks._store
    let leftSideWidth = 0
    let isOpen = false
    let subtasks = []
    let checkedSubtasks = 0

    $: isDark = $themeState.isDarkTheme
    $: pickedTask = $manager.pickedTask
    $: dragSrc = $manager.dragSrc
    $: isContextMenuOpen = $manager.isContextMenuOpen
    
    $: isFocused = task.id === $manager.focusTask?.id
    $: isEdit    = $manager.editTask?.id === task.id
    $: editMode  = $manager.editMode

    $: {
        isOpen = $tasks.isTaskOpen(task.id) || task.id === pickedTask?.id
    }
    $: {
        subtasks = $manager.tasks.getSubtasks(task.id)
        checkedSubtasks = subtasks.reduce((c, task) => task.isChecked ? c + 1 : c, 0)
    }
    
    function _onSubtaskCheck(wasChecked: boolean) {
        checkedSubtasks += wasChecked ? 1 : -1
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
 <div
    id={`${idPrefix}--task-id--${task.id}`}
    class="task dg-over-el"
    class:task--subtask={isChild}
    role="button" 
    draggable="true"
    tabindex="0" 

    class:task--light={!isDark}
    class:drag-src={task.id === dragSrc?.id}

    class:task--hide-drag-handle={!ui.showDragHandle}
    class:dg-over-el--over={task.title === $manager.dragTarget?.title}

    style={`${inlineStyling(styling?.task)}`}
 >
    <div 
        class="task__content"
        class:task__content--checked={task.isChecked}
    >
        <div 
            class="task__top-content"
            class:task__top-content--focused={isFocused}
            on:dragstart={(e) => { 
                $manager.onDragStart(e, task)
            }}
            on:dragstart={(e) => { 
                $manager.onDragStart(e, task)
            }}
            on:dragover={(e) => { 
                $manager.onDragOver(e, task)
            }}
            on:dragleave={() => { 
                $manager.onDragLeave()
            }}
            on:drag={(e) => { 
                $manager.onDrag(e)
            }}
            on:dragend={() => { 
                $manager.onDragEnd()
            }}
            on:click={(event) => {
                if (isContextMenuOpen) return
        
                $manager.onTaskClicked({ event, id: task.id, isChild })
            }}
            on:contextmenu|preventDefault={(e) => {
                onContextMenu(e, task.id, isChild)
            }}
        >
            <!-- checkbox or number  -->
            <div 
                bind:clientWidth={leftSideWidth}
                class="task__left"
            >
                {#if settings.numbered}
                    <div class="task__number" style={inlineStyling($manager.styling?.num)}>
                        {task.idx + 1}.
                    </div>
                {:else}
                    <button 
                        class="task__checkbox"
                        id={`${idPrefix}--task-checkbox-id--${task.id}`}
                        style={inlineStyling($manager.styling?.checkbox)}
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
                    class:hidden={subtasks.length === 0}
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
                        spellcheck="false"
                        data-placeholder="Title goes here..."
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
                </div>
                <!-- Description -->
                <div class="task__description-container">
                    <div 
                        id={`${idPrefix}--task-description-id--${task.id}`}
                        class="task__description"
                        class:task__description--hide={!task.description && !isEdit && editMode != "description"}
                        data-placeholder="No description"
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
                <div class="task__divider divider"></div>
            {/if}
    
            {#if subtasks.length > 0}
                <div class="fraction">
                    {checkedSubtasks}<span class="fraction__slash">/</span>{subtasks.length}
                </div>
            {/if}
        </div>
    </div>
    {#if isOpen && subtasks.length > 0 && level <= 3}
        <ul 
            class="task__subtasks"
            style:margin-left={`${leftSideWidth - 8}px`}
            id={`${idPrefix}--task-children-id--${task.id}`}
        >
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