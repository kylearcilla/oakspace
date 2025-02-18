<script lang="ts">
	import { themeState } from "$lib/store"

	import { TodosManager } from "$lib/todos-manager"

	import Loader from "../../components/Loader.svelte"
	import TasksList from "../../components/TasksList.svelte"
    
    export let manager: TodosManager
    export let removeCompleteFlag: boolean
    export let onTaskComplete: (completed: number) => void
    
    const NOW_TIME_THRESHOLD_SECS = 10
    const { onAddTask, onDeleteTask, onTaskUpdate } = manager

    let todoListContainer: HTMLElement
    let newTaskFlag = false
    let completedTasks = 0
    let renderFlag = false
    
    // source tasks and tasks list are separate, not bounded as state
    let currTasks = manager.currTasks
    let tasks = []

    $: isLight = !$themeState.isDarkTheme
    $: store = manager.store
    $: _renderFlag = $store.renderFlag
    $: onTodoist = $store.onTodoist
    $: loading = $store.loading

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
    style:--ht-offset={onTodoist ? "68px" : "28px"}
>
    <div 
        class="tasks__todo-list-container"
        bind:this={todoListContainer}
    >
      {#if todoListContainer && loading != "init"}
        <!-- remount only if tasks source changes or updates and list needs to be re-initialized -->
        {#key renderFlag}
            <TasksList
                {newTaskFlag}
                {removeCompleteFlag}
                tasks={structuredClone(currTasks)}
                onTaskChange={(_tasks) => tasks = _tasks}
                options={{
                    id: "todos",
                    hotkeyFocus: "side-bar",
                    type: "side-bar",
                    handlers: {
                        onTaskUpdate, onAddTask, onDeleteTask
                    },
                    settings: {
                        checkSubtasks: onTodoist,
                        allowDuplicate: !onTodoist,
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

    {#if tasks.length === 0 || loading === "init"}
        <div class="tasks__txt">
            {#if loading === "init"}
                <span>
                    Loading
                </span>
                <div class="tasks__loading">
                    <Loader visible={true} />
                </div>
            {:else}
                <span>
                    You have 0 tasks.
                </span>
                <button on:click={() => newTaskFlag = !newTaskFlag}>
                    Add a task
                </button>
            {/if}
        </div>
    {/if}
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

        &--light {
            --empty-btn-bg-opacity: 0.055;
            --empty-btn-inactive-opacity: 0.8;
        }
        &--light &__todoist {
            @include text-style(1);
            border-top: 1.5px dashed rgba(var(--textColor1), 0.12);
        }
        &--light &__todoist-sync span {
            @include text-style(0.34);
        }
        &--light &__todoist button {
            opacity: 0.4;
        }
        &--light &__txt span {
            @include text-style(0.9);
        }
        &--light &__txt button {
            @include text-style(1);
        }
        &--light button {
            opacity: 0.8;
        }
        &--light .shimmer-anim {
            @include text-style(0.145);
        }

        &__todo-list-container {
            height: calc(100% - var(--ht-offset));
            max-height: calc(100% - var(--ht-offset));
            position: relative;
        }
        &__txt {
            @include abs-top-left(10%, 50%);
            text-align: center;
            width: 100%;

            span {
                @include text-style(0.35, var(--fw-400-500), 1.225rem, "Geist Mono");
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
        &__loading {
            position: relative;
            height: 20px;
            width: 20px;
            margin: 12px auto 0px auto;
        }
    }
</style>