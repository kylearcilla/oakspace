<script lang="ts">
	import { Icon } from "$lib/enums"
	import Task from "../components/Task.svelte"
	import { themeState } from "$lib/store"
	import { TasksListManager } from "$lib/tasks-list-manager"
	import { clickOutside, inlineStyling } from "$lib/utils-general"
    
	import SvgIcon from "./SVGIcon.svelte"
	import DropdownList from "./DropdownList.svelte"
	import { onMount } from "svelte";

    export let newTaskFlag: boolean
    export let options: TasksListOptions

    const _manager   = new TasksListManager(options)
    const manager    = _manager.state
    const settings   = $manager.settings
    const { DEFAULT_STYLES, CONTEXT_MENU_WIDTH } = $manager
    const { CHECK_BOX_DIM } = DEFAULT_STYLES

    const dropdownOptions = _manager.getContextMenuOptions()

    let listContainer: HTMLElement
    let tasksList: HTMLElement
    let idPrefix = options.id
    let isContextMenuOpen = false
    let tasks = $manager.tasks._store
    let rootTasks: Task[] = []
    let justInit = false

    $: isDark      = $themeState.isDarkTheme
    $: focusTask   = $manager.focusTask
    $: contextMenu = $manager.contextMenu
    $: isContextMenuOpen = $manager.isContextMenuOpen 

    $: if (newTaskFlag != undefined) {
        createNewTask()
    }
    $: if (isContextMenuOpen && listContainer) {
        listContainer.style.overflowY = "hidden"
    }
    else if (listContainer) {
        listContainer.style.overflowY = "scroll"
    }

    tasks?.subscribe((state) => rootTasks = state.getRootTasks())

    function createNewTask() {
        if (!justInit) {
            justInit = true
            return
        }
        $manager.addNewTaskFromOutside(0)
    }
    function onContextMenu(e: Event, taskId: string, isChild: boolean) {
        $manager.openContextMenu(e, taskId, isChild)
        isContextMenuOpen = true
    }
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

    style:--side-padding={$manager.ui.sidePadding}
    style:--checkbox-dim={$manager.ui.checkboxDim ?? CHECK_BOX_DIM}

    style:--max-title-lines={$manager.settings.maxTitleLines}
    style:--max-descr-lines={$manager.settings.maxDescrLines}
    style:--left-section-width={`${$manager?.taskLayout?.leftSectionWidth}px`}
>
    <div 
        bind:this={listContainer}
        id={`${idPrefix}--tasks-list-container`}
        class="tasks-container no-scroll-bar"
        class:tasks-container--empty={rootTasks.length === 0}
        style:height={$manager.ui.listHeight}
        use:clickOutside on:click_outside={(e) => $manager.onClickedOutside(e)} 
    >
        <ul 
            id={`${idPrefix}--tasks-list`}
            class="tasks"
            class:tasks--dragging-state={$manager.dragSrc}
            class:tasks--numbered={settings.numbered}
            style={inlineStyling($manager.styling?.list)}
            bind:this={tasksList}
            on:pointermove={$manager.onTaskListPointerMove}
        >   
            <!-- Task Item s-->
            {#each rootTasks as task, idx}
                {#if task}
                    <li>
                        <Task
                            {idx}
                            level={0}
                            {task} 
                            {manager} 
                            {onContextMenu}
                        />
                    </li>
                {/if}
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
            listItems: [
                ...(focusTask?.description ? [] :  [{ name: "Add Description" }]),
                ...dropdownOptions
            ],
            onListItemClicked: (context) => {
                isContextMenuOpen = false
                $manager.contextMenuHandler(context)
            },
            onClickOutside: () => {
                isContextMenuOpen = false
            },
            onDismount: () => {
                isContextMenuOpen = false
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
        padding-bottom: 10px;

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
</style>