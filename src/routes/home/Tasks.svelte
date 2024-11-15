<script lang="ts">
	import { Icon, LogoIcon } from "$lib/enums"
	import { TasksViewManager } from "$lib/tasks-view-manager"

	import Logo from "../../components/Logo.svelte"
	import TasksList from "../../components/TasksList.svelte"
    
    export let manager: TasksViewManager
    export let newTaskFlag: boolean
    
    let todoListContainer: HTMLElement
    let tasks = manager.currTasks
    
    $: store = manager.store
    $: todoistLinked = $store.todoistLinked
    $: onTodoist = $store.onTodoist

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
        <TasksList
            {newTaskFlag}
            options={{
                id: "todos",
                tasks,
                handlers: {
                    onTaskUpdate: manager.onTaskUpdate,
                    onAddTask: manager.onAddTask,
                    onDeleteTask: manager.onDeleteTask
                },
                settings: {
                    reorder: !todoistLinked,
                    allowDuplicate: !onTodoist,
                    removeOnComplete: todoistLinked,
                    progress: !todoistLinked ? "perc" : "count",
                    addBtn: { 
                        doShow: false
                    },
                },
                styling: {
                    task: {
                        padding: "8px 0px 13px 0px"
                    },
                    subtask: {
                        padding: "5px 0px 8px 0px",
                    },
                    description: { 
                        margin: "6px 0px 12px 0px"
                    },
                    checkbox: {
                        borderRadius: "0px",
                        margin: "1px 12px 0px 10px"
                    }
                },
                ui: { 
                    maxHeight: "550px",
                    sidePadding: "12px",
                    hasTaskDivider: true
                },
                containerRef: todoListContainer,
            }}
        />
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
        width: 100%;
        border-radius: 10px;
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