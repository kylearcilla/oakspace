<script lang="ts">
	import { LogoIcon } from "$lib/enums"
	import { TodosManager } from "$lib/todos-manager"

	import { themeState } from "../../lib/store"
	import Logo from "../../components/Logo.svelte"
	import TasksList from "../../components/TasksList.svelte"
    
    export let manager: TodosManager
    export let onTaskComplete: (completed: number) => void
    export let removeCompleteFlag: boolean

    let todoListContainer: HTMLElement
    let newTaskFlag = false
    let completedTasks = 0
    let renderFlag = false
    
    const { onAddTask, onDeleteTask, onTaskUpdate } = manager
    
    $: store = manager.store
    $: isLight = !$themeState.isDarkTheme
    $: _renderFlag = $store.renderFlag
    $: onTodoist = $store.onTodoist

    // source tasks and tasks list are separate, not bounded as state
    let currTasks = manager.currTasks
    let tasks = []
    let loading = false

    // for checking for completed tasks
    $: {
        completedTasks = tasks.filter(task => task.isChecked).length
        onTaskComplete(completedTasks)
    }
    // for changing between Todoist and Inbox tasks, or Todoist refreshes
    $: {
        if (onTodoist != undefined && _renderFlag != undefined) {
            currTasks = manager.currTasks
            renderFlag = !renderFlag
        }
    }
</script>

<div 
    class="tasks" 
    class:tasks--light={isLight}
    class:tasks--on-todoist={false}
>
    <div 
        class="tasks__todo-list-container"
        bind:this={todoListContainer}
    >
      {#if todoListContainer}
        <!-- remount only if tasks source changes or updates and list needs to be re-initialized -->
        {#key renderFlag}
            <TasksList
                {newTaskFlag}
                {removeCompleteFlag}
                tasks={currTasks}
                onTaskChange={(_tasks) => tasks = _tasks}
                options={{
                    id: "todos",
                    hotkeyFocus: "side-bar",
                    type: "side-bar",
                    handlers: {
                        onTaskUpdate, onAddTask, onDeleteTask
                    },
                    settings: {
                        allowDuplicate: true,
                        removeOnComplete: false,
                        maxDepth: 3
                    },
                    ui: { 
                        hasTaskDivider: true
                    },
                    rootRef: todoListContainer
                }}
            />
        {/key}
      {/if}
    </div>

    {#if tasks.length === 0}
        <div class="tasks__empty">
            <span>
                You have 0 tasks.
            </span>
            <button on:click={() => newTaskFlag = !newTaskFlag}>
                Add a task
            </button>
        </div>
    {/if}

    <div 
        class="tasks__todoist"
        class:hidden={!onTodoist}
    >
        <div class="flx-algn-center">
            <Logo 
                logo={LogoIcon.Todoist}
                options={{
                    containerWidth: "30px",
                    scale: 1.05,
                    iconWidth: "100%"
                }}
            />
            <span
                style:--shimmer-text-width="50px"
                class:shimmer-anim={loading}
            >
                {loading ? "Syncing..." : "Inbox"}
            </span>
        </div>
        <button
            title="Refresh Todoist Tasks"
            on:click={async () => {
                loading = true
                await manager.refreshTodoist()
                loading = false
            }}
        >
            <i 
                class="fa-solid fa-arrows-rotate"
                class:sync-loading={loading}
            >
            </i>
        </button>
    </div>
</div>


<style lang="scss">
    @import "../../scss/inputs.scss";

    .tasks {
        width: 100%;
        position: relative;
        margin-top: -10px;
        height: 100%;

        --empty-btn-bg-opacity: 0.04;
        --empty-btn-inactive-opacity: 0.7;

        &--on-todoist &__todo-list-container {
            height: calc(100% - 35px);
        }
        &--on-todoist &__todoist {
            display: flex;
        }
        &--light {
            --empty-btn-bg-opacity: 0.08;
            --empty-btn-inactive-opacity: 0.8;
        }
        &--light &__empty span {
            @include text-style(0.9);
        }
        &--light &__empty button {
            @include text-style(1);
        }
        &--light button {
            opacity: 0.8;
        }

        &__todo-list-container {
            height: calc(100% - 28px);
            max-height: calc(100% - 28px);
            position: relative;
        }
        &__todoist {
            @include flex(center, space-between);
            @include text-style(0.35, 400, 1.3rem, "Geist Mono");
            @include abs-bottom-left(0px, 4px);
            width: 100%;
            padding: 5px 0px 25px 4px;
            z-index: 100;
            border-top: 1.5px dashed rgba(var(--textColor1), 0.06);
            background-color: var(--rightBarBgColor);

            span {
                margin-left: 2px;
            }
            button {
                @include circle(25px);
                @include flex(center);
                font-size: 1.3rem;
                margin-right: 5px;
                color: white;
                opacity: 0.2;
                
                &:hover {
                    opacity: 0.9;
                }
            }
        }
        &__empty {
            @include abs-top-left(10%, 50%);
            text-align: center;
            width: 100%;

            span {
                @include text-style(0.35, var(--fw-400-500), 1.2rem, "Geist Mono");
                display: block;
            }
            button {
                @include text-style(1, var(--fw-400-500), 1.2rem, "Geist Mono");
                opacity: var(--empty-btn-inactive-opacity);
                margin-top: 20px;
                background-color: rgba(var(--textColor1), var(--empty-btn-bg-opacity));
                padding: 8px 17px 9px 17px;
                border-radius: 4px;
                
                &:hover {
                    opacity: 1;
                }
            }
        }
    }
    .sync-loading {
        animation: spin 1s linear infinite;
        transform-origin: center;

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg); 
            }
        }
    }
</style>