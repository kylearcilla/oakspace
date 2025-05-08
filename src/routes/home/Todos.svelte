<script lang="ts">
	import { themeState } from "$lib/store"
	import { TodosManager } from "$lib/todos-manager"

	import TasksList from "$components/TasksList.svelte"
	import EmptyList from "$components/EmptyList.svelte"
    
    export let manager: TodosManager
    export let addBtnFlag = false
    export let removeCompleteFlag: boolean
    export let onTaskComplete: (completed: number) => void
    
    const { onAddTask, onDeleteTask, onTaskUpdate } = manager

    let todoListContainer: HTMLElement
    let completedTasks = 0
    let renderFlag = false
    
    // source tasks and tasks list are separate, not bounded as state
    let currTasks = manager.currTasks
    let tasks: Task[] = []
    
    $: isLight = !$themeState.isDarkTheme
    $: store = manager.store
    $: onTodoist = $store.onTodoist
    $: loading = $store.loading
    $: newTaskFlag = addBtnFlag

    $: _renderFlag = $store.renderFlag

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
                    context: "side-bar",
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

    <div class="tasks__empty-list">
        {#if tasks.length === 0 || loading === "init"}
            <EmptyList 
                loading={loading === "init"}
                loadingText="Loading Tasks"
                emptyText="You have 0 tasks."
                buttonText="Add a task"
                onButtonClick={() => newTaskFlag = !newTaskFlag}
            />
        {/if}
    </div>
</div>


<style lang="scss">
    @use "../../scss/inputs.scss" as *;

    .tasks {
        width: 100%;
        position: relative;
        height: 100%;

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
        &--light .shimmer-anim {
            @include text-style(0.145);
        }
        &__todo-list-container {
            height: calc(100% - var(--ht-offset));
            max-height: calc(100% - var(--ht-offset));
            position: relative;
        }
        &__empty-list {
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
        }
    }
</style>
