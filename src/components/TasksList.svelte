<script lang="ts">
	import { onMount } from "svelte"

	import { themeState } from "$lib/store"
	import { TasksListManager } from "$lib/tasks-list-manager"
	import { clickOutside, inlineStyling } from "$lib/utils-general"

	import Task from "../components/Task.svelte"
	import DropdownList from "./DropdownList.svelte"

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
    let idPrefix = options.id
    let contextMenuOpen = false
    let justInit = true
    let rootTasks: Task[] = []

    $: isDark      = $themeState.isDarkTheme
    $: focusTask   = $manager.focusTask
    $: contextMenu = $manager.contextMenu
    
    $: if (newTaskFlag != undefined) {
        createNewTask()
    }
    $: if (removeCompleteFlag != undefined) {
        removeCompletedTasks()
    }
    $manager.tasks._store?.subscribe((state) => {
        rootTasks = state.getRootTasks()

        if (onTaskChange && (!justInit) || (justInit && allowInitTasksCall)) {
            onTaskChange(state.getAllTasks())
        }
    })
    function createNewTask() {
        if (justInit) {
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
    function isAtMaxDepth(taskId: string) {
        return $manager.tasks.isAtMaxDepth(taskId)
    }

    onMount(() => {
        $manager.initAfterLoaded(listContainer, tasksList)
    })
</script>

<svelte:window on:keydown={(ke) => $manager.keyboardShortcutHandler(ke)} />


<div 
    bind:this={listContainer}
    class="tasks-wrapper"
    class:tasks-wrapper--light={!isDark}
    class:tasks-wrapper--top-btn={settings.addBtn?.pos === "top"}
    class:tasks-wrapper--empty-list={rootTasks.length === 0}
    style:overflow-y={contextMenuOpen ? "hidden" : "scroll"}

    style:--padding={ui.padding}
    style:--border-radius={ui.borderRadius}
    style:--font-size={ui.fontSize}
    style:--side-padding={ui.sidePadding}
    style:--checkbox-dim={ui.checkboxDim}
    style:--max-title-lines={settings.maxTitleLines}
    style:--max-descr-lines={settings.maxDescrLines}
    style:max-height={settings.maxHeight}
>
    <ul 
        id={`${idPrefix}--tasks-list`}
        class="tasks"
        class:tasks--dragging-state={$manager.dragSrc}
        class:tasks--numbered={settings.numbered}
        class:tasks--side-menu={settings.type === "side-menu"}
        style={inlineStyling($manager.styling?.list)}
        bind:this={tasksList}
        on:pointermove={$manager.onTaskListPointerMove}
        use:clickOutside on:click_outside={(e) => $manager.onClickedOutside(e)} 
    >   
        {#each rootTasks as task, idx (task.id)}
            <li>
                <Task
                    level={0}
                    {idx}
                    {task} 
                    {manager} 
                    {onContextMenu}
                />
            </li>
        {/each}
    </ul>
    {#if $manager.settings?.addBtn?.doShow}
        {@const { style, text } = $manager.settings.addBtn}
        <button 
            class="tasks-wrapper__addbtn"
            style={inlineStyling(style)}
            on:click={() => $manager.addingNewTask(0)}
        >
            <span>+</span>
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
                ...(!settings.subtasks || isAtMaxDepth(focusTask?.id) ? [] :  [{ 
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
            margin: 4px 0px 5px calc(var(--side-padding) - 6px);
            font-weight: 400;
            width: 100%;
            opacity: 0.2;
            max-width: 100px;
            @include text-style(1, 400);
            @include flex(center);

            span {
                white-space: nowrap;
                font-size: var(--font-size);
            }
            span:first-child {
                font-weight: 100;
                font-size: calc(var(--font-size) + 0.85rem);
                margin: 0px 10px -1.5px 0px;
            }
            &:hover {
                opacity: 0.6;
            }
        }
    }

    .tasks {
        position: relative;
        margin: 5px 0px 0px -20px;
        padding: 2px 0px 5px 20px;
        

        &--side-menu {
            padding: 0px 0px 0px 2px;
        }
        &--dragging-state * {
            cursor: grabbing;
        }

        &-wrapper--top-btn {
            flex-direction: column-reverse;
        }
        &-wrapper--empty-list .tasks-addbtn {
            margin: 7px 0px 1px var(--side-padding);
        }

        &-container--empty {
            margin-bottom: 5px !important;
        }
    }
</style>