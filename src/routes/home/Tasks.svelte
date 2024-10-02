<script lang="ts">
	import { Icon, LogoIcon } from "$lib/enums"
	import { TasksViewManager } from "$lib/tasks-view-manager"

	import Logo from "../../components/Logo.svelte"
	import TasksList from "../../components/TasksList.svelte"
    
    export let manager: TasksViewManager
    
    let todoListContainer: HTMLElement
    let tasks = manager.currTasks
    
    $: store = manager.store
    $: todoistLinked = $store.todoistLinked
    $: onTodoist = $store.onTodoist
    $: console.log({ tasks })

    export function tasksSettingsHandler(option: string) {
        if (option === "Refresh Sync") {
            manager.refreshTodoist()
        }
        else if (option === "Log Out") {
            manager.logoutTodoist()
        }
        else {
            manager.loginTodoist()
        }
    }

</script>

<div class="tasks" class:tasks--on-todoist={onTodoist}>
    <!-- Tasks List -->
    <div 
        class="tasks__todo-list-container"
        bind:this={todoListContainer}
    >
        {#key tasks}
            <TasksList
                options={{
                    id: "todos",
                    handlers: {
                        onTaskUpdate: manager.onTaskUpdate,
                        onAddTask: manager.onAddTask,
                        onDeleteTask: manager.onDeleteTask
                    },
                    settings: {
                        reorder: !todoistLinked,
                        allowDuplicate: !onTodoist,
                        removeOnComplete: todoistLinked,
                        progress: !todoistLinked ? "perc" : "count"
                    },
                    tasks,
                    containerRef: todoListContainer,
                    styling: {
                        task: { 
                            fontSize: "1.21rem",
                            fontWeight: "500",
                            opacity: 0.74,
                            padding: "8px 0px 13px 0px"
                        },
                        subtask: { 
                            fontSize: "1.2rem",
                            fontWeight: "500",
                            padding: "5px 0px 8px 0px",
                            opacity: 0.65
                        },
                        description: { 
                            margin: "6px 0px 7px 0px", 
                            fontSize: "1.2rem",
                            fontWeight: "500",
                            opacity: 0.54
                        },
                        checkbox: {
                            width: "11px",
                            borderRadius: "2px",    
                            height: "11px",
                            margin: "1px 12px 0px 17px"
                        }
                    },
                    addBtn: {
                        style: { 
                            fontSize: "1.25rem"
                        },
                        pos: "top"
                    },
                    contextMenuOptions: { 
                        width: "170px" 
                    },
                    ui: { 
                        sidePadding: "17px", 
                        showDragHandle: false,
                        hasTaskDivider: false,   
                        listHeight: "100%"
                    }
                }}
            />
        {/key}
    </div>

    <div class="tasks__todoist">
        <Logo 
            logo={LogoIcon.Todoist}
            options={{
                containerWidth: "30px",
                scale: 0.9,
                iconWidth: "100%"
            }}
        />
        <span>
            Inbox
        </span>
    </div>
</div>


<style lang="scss">
    @import "../../scss/inputs.scss";
    @import "../../scss/tasks.scss";

    .tasks {
        height: calc(100% - 40px);
        width: 100%;
        border-radius: 10px;
        margin: 12px 0px 0px 0px;
        position: relative;

        &--on-todoist &__todo-list-container {
            height: calc(100% - 35px);
        }
        &--on-todoist &__todoist {
            display: flex;
        }
        &__todo-list-container {
            height: 100%;
            position: relative;
            margin-top: 6px;
        }
        &__todoist {
            @include flex(center);
            @include text-style(0.35, 400, 1.2rem, "DM Mono");
            @include abs-bottom-left(15px, 2px);
            width: 100%;
            height: 25px;
            padding: 10px 0px 0px 5px;
            border-top: 1.5px solid rgba(var(--textColor1), 0.045);
            display: none;

            span {
                margin-left: 2px;
            }
        }
    }
</style>