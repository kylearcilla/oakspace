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
    let settings   = $manager.settings
    let { DEFAULT_STYLES, CONTEXT_MENU_WIDTH } = $manager
    let { CHECK_BOX_DIM } = DEFAULT_STYLES

    let dropdownOptions = _manager.getContextMenuOptions()

    let listContainer: HTMLElement
    let tasksList: HTMLElement
    let idPrefix = options.id
    let contextMenuOpen = false
    let rootTasks: Task[] = []
    let justInit = true
    let type = settings.type

    $: isDark      = $themeState.isDarkTheme
    $: focusTask   = $manager.focusTask
    $: contextMenu = $manager.contextMenu
    $: contextMenuOpen = $manager.contextMenuOpen 
    
    $: if (newTaskFlag != undefined) {
        createNewTask()
    }
    $: if (removeCompleteFlag != undefined) {
        removeCompletedTasks()
    }

    let styles = {
        fontSize: "1.325rem",
        padding: "10px 0px 5px 0px",
        borderRadius: "0px",
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
        $manager.openContextMenu(e, taskId, isChild)
        contextMenuOpen = true
    }
    function isAtMaxDepth(taskId: string) {
        return $manager.tasks.isAtMaxDepth(taskId)
    }
    function updateStyling() {
        if (type === "day-view") {
            styles.padding = "12px 0px 10px 0px"
            styles.borderRadius = "6px"
            styles.fontSize = "1.5rem"
        }
    }

    updateStyling()

    onMount(() => {
        $manager.initAfterLoaded(listContainer, tasksList)
    })
</script>

<svelte:window on:keydown={(ke) => $manager.keyboardShortcutHandler(ke)} />

<div 
    class="tasks-wrapper"
    class:tasks-wrapper--light={!isDark}
    class:tasks-wrapper--top-btn={$manager.addBtn?.pos === "top"}
    class:tasks-wrapper--empty-list={rootTasks.length === 0}
    style:overflow-y={contextMenuOpen ? "hidden" : "scroll"}

    style:--padding={styles.padding}
    style:--border-radius={styles.borderRadius}
    style:--font-size={styles.fontSize}

    style:--side-padding={$manager.ui.sidePadding}
    style:--checkbox-dim={$manager.ui.checkboxDim ?? CHECK_BOX_DIM}

    style:--max-title-lines={$manager.settings.maxTitleLines}
    style:--max-descr-lines={$manager.settings.maxDescrLines}

    style:max-height={$manager.settings.maxHeight}
>
    <div 
        bind:this={listContainer}
        id={`${idPrefix}--tasks-list-container`}
        class="tasks-container no-scroll-bar"
        class:tasks-container--empty={rootTasks.length === 0}
        use:clickOutside on:click_outside={(e) => $manager.onClickedOutside(e)} 
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
        >   
            <!-- Task Item s-->
            {#each rootTasks as task, idx (task.id)}
                <li>
                    <Task
                        {idx}
                        level={0}
                        {task} 
                        {manager} 
                        {onContextMenu}
                    />
                </li>
            {/each}

            <!-- Dummy Task -->
            <li 
                data-task-type="task"
                class="task task--dummy dg-over-el" 
                style:pointer-events={`${$manager.dragSrc ? "all" : "none"}`}
            >
                <div class="task__content">
                    <div 
                        class="task__top-content task__top-content--dummy"
                        on:dragenter={(e) => $manager.onDragEnter(e, null, null)}
                        on:dragleave={(e) => $manager.onDragLeave(e)}
                        on:dragend={(e) => $manager.onDragEnd(e)}
                        on:dragover={(e) => e.preventDefault()}
                    >
                    </div>
                </div>
            </li>
        </ul>
    </div>
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

    <!-- Context Menu -->
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
                        }
                    }]),
                ...dropdownOptions
            ],
            onListItemClicked: (context) => {
                contextMenuOpen = false
                $manager.contextMenuHandler(context)
            },
            onClickOutside: () => {
                contextMenuOpen = false
            },
            onDismount: () => {
                contextMenuOpen = false
                $manager.onContextMenuClickedOutside()
            },
            styling: { 
                width: `${CONTEXT_MENU_WIDTH}px`,
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
            margin: 4px 0px 5px calc(var(--side-padding) - 6px);
            font-weight: 400;
            width: 100%;
            opacity: 0.2;
            max-width: 100px;
            @include text-style(1, 400, _, "DM Mono");
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
        &-container {
            max-height: 100%;
            margin: 5px 0px 0px -20px;
            padding: 2px 0px 5px 20px;
        }
        &-container--empty {
            margin-bottom: 5px !important;
        }
    }
</style>