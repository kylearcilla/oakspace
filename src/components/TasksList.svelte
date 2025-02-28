<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import { themeState, globalContext } from "$lib/store"

	import { hexToRgb } from "$lib/utils-colors"
	import { inlineStyling } from "$lib/utils-general"
	import { getThemeStyling } from "$lib/utils-appearance"
	import { TasksListManager } from "$lib/tasks-list-manager"

	import TaskElem from "../components/Task.svelte"
	import DropdownList from "./DropdownList.svelte"
	import { clickOutside } from "../lib/utils-general"

    export let removeCompleteFlag: boolean | undefined = undefined
    export let newTaskFlag: boolean | undefined = undefined
    export let tasks: Task[]
    export let allowInitTasksCall = true
    export let options: TasksListOptions
    export let onTaskChange: ((tasks: Task[]) => void) | undefined = undefined

    let _manager   = new TasksListManager({ options, tasks })
    let manager    = _manager.state
    let dropdownOptions = $manager.getContextMenuOptions()
    let { settings, ui } = $manager

    let listContainer: HTMLElement
    let tasksList: HTMLElement
    let listContainerWidth = 0
    let idPrefix = options.id
    let contextMenuOpen = false
    let justInit = true
    let rootTasks: Task[] = []
    let floatBgRgb = ""

    $: isDark      = $themeState.isDarkTheme
    $: focusTask   = $manager.focusTask
    $: contextMenu = $manager.contextMenu
    $: ambience = $globalContext.ambience
    $: dragPos = $manager.dragPos
    $: dragSrc = $manager.dragSrc
    
    $: if (newTaskFlag != undefined) {
        createNewTask()
    }
    $: if (removeCompleteFlag != undefined) {
        removeCompletedTasks()
    }
    $: {
        if (ambience?.active) {
            floatBgRgb = "40, 40, 40"
        }
        else {
            floatBgRgb = hexToRgb({ 
                hex: getThemeStyling("sessionBlockColor"),
                format: "str"
            })
        }
    }

    $manager.tasks._store?.subscribe((state) => {
        rootTasks = state.getRootTasks()

        if (onTaskChange && (!justInit) || (justInit && allowInitTasksCall)) {
            onTaskChange(state.getAllTasks())
        }
    })
    function createNewTask() {
        if (justInit) {
            removeCompleteFlag === undefined && (justInit = false)
            return
        }
        $manager.addNewTaskFromOutside(0)
    }
    function removeCompletedTasks() {
        if (justInit) {
            justInit = false
            return
        }
        $manager.removeCompletedTasks()
    }
    function onContextMenu(e: Event, taskId: string, isChild: boolean) {
        contextMenuOpen = $manager.openContextMenu(e, taskId, isChild)
    }
    function isAtMaxDepth(task: Task & { id: string } | null) {
        return task ? $manager.tasks.isAtMaxDepth(task.id) : false
    }

    onMount(() => {
        $manager.initAfterLoaded(listContainer, tasksList)
    })
    onDestroy(() => {
        $manager.removePointerMoveHandler()
    })
</script>

<svelte:window on:keydown={(ke) => $manager.keyboardShortcutHandler(ke)} />

<div 
    bind:this={listContainer}
    bind:clientWidth={listContainerWidth}
    class="tasks-wrapper"
    class:tasks-wrapper--light={!isDark}
    class:tasks-wrapper--top-btn={settings.addBtn?.pos === "top"}
    class:tasks-wrapper--empty-list={rootTasks.length === 0}
    style:overflow-y={contextMenuOpen ? "hidden" : "scroll"}

    style:--float-bg={floatBgRgb}
    style:--padding={ui.padding}
    style:--border-radius={ui.borderRadius}
    style:--font-size={ui.fontSize}
    style:--side-padding={ui.sidePadding}
    style:--checkbox-dim={ui.checkboxDim}
    style:--max-title-lines={settings.maxTitleLines}
    style:--max-descr-lines={settings.maxDescrLines}
    style:--container-width={`${listContainerWidth}px`}
    style:max-height={settings.maxHeight}

    on:pointermove={(e) => $manager.onTaskListPointerMove(e)}
    on:pointerup={(e) => $manager.onPointerUp(e)}
>
    <ul 
        id={`${idPrefix}--tasks-list`}
        class="tasks"
        class:tasks--numbered={settings.numbered}
        class:tasks--side-menu={settings.type === "side-menu"}
        style={inlineStyling($manager.styling?.list)}
        bind:this={tasksList}
        use:clickOutside on:outClick={() => $manager.onClickOutside()}
    >   
        {#each rootTasks as task, idx (task.id)}
            <li>
                <TaskElem
                    level={0}
                    {idx}
                    {task} 
                    {manager} 
                    {onContextMenu}
                />
            </li>
        {/each}
    </ul>

    {#if dragSrc && dragPos}
        {@const { isChecked, id, title, description, isChild, onSubtaskCheck, type } = dragSrc}
        {@const subtasks = $manager.tasks.getSubtasks(id)}

        <div
            id={`${idPrefix}--dummy-task`}
            class="task task--dummy"
            class:task--light={!isDark}
            class:task--side-menu={type === "side-menu"}
            style:top={`${dragPos.top}px`}
            style:left={`${dragPos.left}px`}
        >
            <div 
                class="task__content"
                class:task__content--checked={isChecked}
            >
                <div class="task__top-content">
                    <div class="task__left">
                        <div style:margin={"0px 0px 0px 2px"}>
                            {#if settings.numbered}
                                <div class="task__number">
                                    1.
                                </div>
                            {:else}
                                <button 
                                    class="task__checkbox"
                                    id={`${idPrefix}--task-checkbox-id--${id}`}
                                    on:click={() => { 
                                        if (isChild && onSubtaskCheck) {
                                            onSubtaskCheck(!isChecked)
                                        }
                                        $manager.toggleTaskComplete(id)
                                    }}
                                >
                                    <i class="fa-solid fa-check checkbox-check"></i>
                                </button>
                            {/if}
                        </div>
                    </div>
                    <div class="task__right">
                        <!-- Title -->
                        <div class="task__title-container">
                            <div class="task__title" style:user-select="none">
                                {title}
                            </div>
                            <div class="task__count" class:hidden={subtasks.length === 0}>
                                {subtasks.length}
                            </div>
                        </div>
                        <!-- Description -->
                        <div class="task__description-container">
                            <div class="task__description" style:user-select="none">
                                {description}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}


    {#if $manager.settings?.addBtn?.doShow}
        {@const { style, text } = $manager.settings.addBtn}
        <button 
            class="tasks-wrapper__addbtn"
            style={inlineStyling(style)}
            on:click={() => $manager.addNewTaskFromOutside()}
        >
            <span>
                {text ?? "Add an Item"}
            </span>
        </button>
    {/if}
    <DropdownList
        id={`${idPrefix}--tasks`}
        isHidden={!contextMenuOpen}
        options={{
            listItems: [
                ...(focusTask?.description ? [] :  [{ name: "Add Description" }]),
                ...(!settings.subtasks || isAtMaxDepth(focusTask) ? [] :  [{ 
                        name: "Add Subtask",
                        rightIcon: {
                            type: "hotkey",
                            icon: ["shift", "plus"]
                        },
                        divider: true,
                    }]),
                ...dropdownOptions
            ],
            onListItemClicked: ({ name }) => {
                contextMenuOpen = false
                $manager.contextMenuHandler(name)
            },
            onClickOutside: () => {
                contextMenuOpen = false
            },
            onDismount: () => {
                contextMenuOpen = false
                $manager.closeContextMenu()
            },
            styling: { 
                width: ui.menuWidth,
            },
            position: { 
                top: `${contextMenu.top}px`, 
                left: `${contextMenu.left}px`,
            }
        }}
    />
</div>


<style lang="scss">
    @import "../scss/inputs.scss";
    @import "../scss/task.scss";

    .tasks-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
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
            margin: 4px 0px 5px calc(var(--side-padding) - 2px);
            font-weight: 400;
            width: 100%;
            opacity: 0.2;
            @include text-style(1, var(--fw-400-500), var(--font-size));
            @include flex(center);

            &:hover {
                opacity: 0.6;
            }
        }
        &__plus-icon {
            margin: 0px 5px 0px 10px;
        }
    }

    .tasks {
        position: relative;
        margin: 0px 0px 0px -20px;
        padding: 0px 0px 5px 20px;

        &--side-menu {
            padding: 0px 0px 0px 2px;
        }
        &-wrapper--top-btn {
            flex-direction: column-reverse;
        }
        &-wrapper--empty-list .tasks-addbtn {
            margin: 7px 0px 1px var(--side-padding);
        }
    }
</style>