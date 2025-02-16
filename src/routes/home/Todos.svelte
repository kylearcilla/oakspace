<script lang="ts">
	import { themeState, timer } from "$lib/store"

    import { LogoIcon } from "$lib/enums"
	import { TodosManager } from "$lib/todos-manager"
	import { getElapsedTime } from "../../lib/utils-date"

	import Logo from "../../components/Logo.svelte"
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
    let lastSyncStr = ""
    let lastSyncTime = null

    $: isLight = !$themeState.isDarkTheme
    $: store = manager.store
    $: _renderFlag = $store.renderFlag
    $: onTodoist = $store.onTodoist
    $: loading = $store.loading
    $: syncLoading = loading === "sync"

    timer.subscribe(({ date }) => {
        if ($store?.todoistLinked) {
            manager.autoRefreshHandler(date)
            updateLastSyncTime(lastSyncTime)
        }
    }) 
    manager.store.subscribe(() => {
        const lastSync = manager?.lastSyncTimeStamp
        if (!lastSync) return

        lastSyncTime = lastSync
        updateLastSyncTime(lastSync)
    })

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

    function updateLastSyncTime(lastSync: Date) {
        const str = getElapsedTime({ 
            start: lastSync, end: new Date(), min: true 
        })
        if (str.includes("s")) {
            lastSyncStr = parseInt(str) < NOW_TIME_THRESHOLD_SECS ? "Now" : "1m"
        }
        else {
            lastSyncStr = str
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

    <div class="tasks__todoist" class:hidden={!onTodoist}>
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
                class:shimmer-anim={syncLoading}
            >
                {syncLoading ? "Syncing..." : "Inbox"}
            </span>
        </div>
        <div class="tasks__todoist-sync">
            {#if !syncLoading}
                <span>{lastSyncStr}</span>
            {/if}
            <button
                title="Refresh Todoist Tasks"
                on:click={() => manager.refreshTodoist()}
            >
                <i 
                    class="fa-solid fa-arrows-rotate"
                    class:sync-loading={syncLoading}
                >
                </i>
            </button>
        </div>
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

        &--light {
            --empty-btn-bg-opacity: 0.055;
            --empty-btn-inactive-opacity: 0.8;
        }
        &--light &__todoist {
            @include text-style(1);
            border-top: 1.5px dashed rgba(var(--textColor1), 0.12);
        }
        &--light &__todoist-sync span {
            @include text-style(0.25);
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

        &__todo-list-container {
            height: calc(100% - var(--ht-offset));
            max-height: calc(100% - var(--ht-offset));
            position: relative;
        }
        &__todoist {
            @include flex(center, space-between);
            @include text-style(0.35, var(--fw-400-500), 1.45rem);
            @include abs-bottom-left(7px, 1px);
            width: 100%;
            padding: 5px 0px 25px 4px;
            z-index: 100;
            border-top: 1.5px dashed rgba(var(--textColor1), 0.06);

            span {
                margin-left: 2px;
            }
        }
        &__todoist-sync {
            @include flex(center);

            span {
                margin-right: 12px;
                @include text-style(0.125, var(--fw-400-500), 1.35rem, "system");
            }
        }
        &__todoist-sync button {
            @include circle(25px);
            @include flex(center);
            font-size: 1.5rem;
            margin-right: 5px;
            color: rgba(var(--textColor1), 0.85);
            opacity: 0.2;
            
            &:hover {
                opacity: 0.9;
            }
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