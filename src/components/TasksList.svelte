<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import { themeState, globalContext } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { hexToRgb } from "$lib/utils-colors"
	import { inlineStyling } from "$lib/utils-general"
	import { clickOutside } from "../lib/utils-general"
	import { getThemeStyling } from "$lib/utils-appearance"
	import { TasksListManager } from "$lib/tasks-list-manager"

	import SvgIcon from "./SVGIcon.svelte"
	import TaskElem from "../components/Task.svelte"

    export let options: TasksListOptions
    export let tasks: Task[]
    export let onTaskChange: ((tasks: Task[]) => void) | undefined = undefined
    export let newTaskFlag: boolean | undefined = undefined
    export let allowInitTasksCall = true
    export let removeCompleteFlag: boolean | undefined = undefined

    let _manager   = new TasksListManager({ options, tasks })
    let manager    = _manager.state
    let { settings, ui } = $manager

    let listContainer: HTMLElement
    let tasksList: HTMLElement
    let listContainerWidth = 0
    let idPrefix = options.id
    let justInit = true
    let rootTasks: Task[] = []
    let floatBgRgb = ""

    $: isDark      = $themeState.isDarkTheme
    $: ambience = $globalContext.ambience
    $: dragPos = $manager.dragPos
    $: dragSrc = $manager.dragSrc
    $: numbered = options.settings?.numbered ?? false
    $: contextMenu = $manager.contextMenu
    $: editMode = $manager.editMode

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
            const hex = getThemeStyling("sessionBlockColor")
            floatBgRgb = hexToRgb({ hex,format: "str" }) as string
        }
    }

    _manager.tasks._store?.subscribe((state) => {
        rootTasks = state.getRootTasks()

        if (onTaskChange && (!justInit || (justInit && allowInitTasksCall))) {
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
        $manager.openContextMenu(e, taskId, isChild)
    }

    onMount(() => {
        $manager.initAfterLoaded(listContainer, tasksList)
    })
    onDestroy(() => {
        $manager.removePointerMoveHandler()
    })
</script>

<svelte:window 
    on:keydown={(ke) => {
        $manager.keyboardShortcutHandler(ke)
    }} 
    on:beforeunload={(e) => {
        if (editMode) {
            e.preventDefault()
            e.returnValue = false
        }
    }}
/>

<div 
    bind:this={listContainer}
    bind:clientWidth={listContainerWidth}
    class="tasks-wrapper"
    class:tasks-wrapper--light={!isDark}
    class:tasks-wrapper--top-btn={settings.addBtn?.pos === "top"}
    class:tasks-wrapper--empty-list={rootTasks.length === 0}
    style:overflow-y={contextMenu ? "auto" : "scroll"}
    style:--float-bg={floatBgRgb}
    style:--padding={ui.padding}
    style:--border-radius={ui.borderRadius}
    style:--font-size={ui.fontSize}
    style:--side-padding={ui.sidePadding}
    style:--checkbox-dim={ui.checkboxDim}
    style:--max-title-lines={settings.maxTitleLines}
    style:--max-descr-lines={settings.maxDescrLines}
    style:--container-width={`${listContainerWidth}px`}

    on:pointermove={(e) => $manager.onTaskListPointerMove(e)}
    on:pointerup={(e) => $manager.onPointerUp(e)}
>
    <ul 
        id={`${idPrefix}--tasks-list`}
        class="tasks"
        class:tasks--numbered={settings.numbered}
        bind:this={tasksList}
        use:clickOutside on:outClick={(e) => $manager.onClickOutside(e)}
    >   
        {#each rootTasks as task, idx (task.id)}
            <li>
                <TaskElem
                    level={0}
                    {manager} 
                    {numbered}
                    {idx}
                    {task} 
                    {onContextMenu}
                />
            </li>
        {/each}
    </ul>

    {#if dragSrc && dragPos}
        {@const { isChecked, id, title, description } = dragSrc}
        {@const subtasks = $manager.getSubtasks(id)}
        <div
            id={`${idPrefix}--dummy-task`}
            class="task task--dummy"
            class:task--light={!isDark}
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
        {@const emptyList = rootTasks.length === 0}

        <button 
            class="tasks-wrapper__addbtn"
            class:tasks-wrapper__addbtn--empty={emptyList}
            style={inlineStyling(style)}
            on:click={() => $manager.addNewTaskFromOutside()}
        >
            <div style:margin="0px 8px 0px 0px">
                <SvgIcon 
                    icon={Icon.Add} 
                    options={{ scale: 1.15, strokeWidth: 1.2, opacity: 0.8 }}
                />
            </div>
            <span>
                {text ?? "New Task"}
            </span>
        </button>
    {/if}
</div>


<style lang="scss">
    @use "../scss/inputs.scss" as *;
    @use "../scss/task.scss" as *;

    .tasks-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;

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
            width: fit-content;
            opacity: 0.2;
            @include text-style(1, var(--fw-400-500), var(--font-size));
            @include flex(center);

            &--empty {
                margin-top: -4px;
            }
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
        overflow: scroll;

        &--side-menu {
            padding: 0px 0px 0px 2px;
        }
    }
</style>