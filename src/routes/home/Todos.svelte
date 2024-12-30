<script lang="ts">
	import { LogoIcon } from "$lib/enums"
	import { TasksViewManager } from "$lib/tasks-view-manager"

	import Logo from "../../components/Logo.svelte"
	import TasksList from "../../components/TasksList.svelte"
    
    export let manager: TasksViewManager
    export let onTaskComplete: (completed: number) => void
    export let removeCompleteFlag: boolean

    let todoListContainer: HTMLElement
    let newTaskFlag = false
    let completedTasks = 0
    let renderFlag = false
    
    const { onAddTask, onDeleteTask, onTaskUpdate } = manager
    
    $: store = manager.store
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

<div class="tasks" class:tasks--on-todoist={false}>
    <!-- Tasks List -->
    <div 
        class="tasks__todo-list-container"
        bind:this={todoListContainer}
    >
        <!-- remount only if tasks source changes or updates and list needs to be re-initialized -->
        {#key renderFlag}
            <TasksList
                {newTaskFlag}
                {removeCompleteFlag}
                tasks={currTasks}
                onTaskChange={(_tasks) => tasks = _tasks}
                options={{
                    id: "todos",
                    type: "side-menu",
                    handlers: {
                        onTaskUpdate, onAddTask, onDeleteTask
                    },
                    settings: {
                        allowDuplicate: !onTodoist,
                        removeOnComplete: onTodoist,
                        maxDepth: 3
                    },
                    ui: { 
                        maxHeight: "550px",
                        hasTaskDivider: true
                    },
                    containerRef: todoListContainer
                }}
            />
        {/key}
    </div>

    {#if tasks.length === 0}
        <div class="tasks__empty">
            <span>
                You have 0 tasks.
            </span>
            <button 
                on:click={() => {
                    newTaskFlag = !newTaskFlag
                }}
            >
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
    @import "../../scss/tasks.scss";

    .tasks {
        width: 100%;
        position: relative;
        margin-top: -10px;
        height: 100%;

        &--on-todoist &__todo-list-container {
            height: calc(100% - 35px);
        }
        &--on-todoist &__todoist {
            display: flex;
        }
        &__todo-list-container {
            height: 100%;
            position: relative;
        }
        &__todoist {
            @include flex(center, space-between);
            @include text-style(0.35, 400, 1.3rem, "DM Mono");
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
                @include text-style(0.35, 400, 1.2rem, "DM Mono");
                display: block;
            }
            button {
                @include text-style(_, 400, 1.2rem, "DM Mono");
                opacity: 0.7;
                margin-top: 15px;
                background-color: rgba(var(--textColor1), 0.04);
                padding: 9px 17px;
                border-radius: 4px;
                
                &:hover {
                    opacity: 0.95;
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