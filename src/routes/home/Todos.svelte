<script lang="ts">
    import { Tasks } from "$lib/tasks"
	import { Icon, LogoIcon } from "$lib/enums"
	import { TEST_TASKS } from "../../lib/mock-data"
	import { TasksViewManager } from "$lib/tasks-view-manager"

	import Logo from "../../components/Logo.svelte"
	import TasksList from "../../components/TasksList.svelte"
    
    export let newTaskFlag: boolean
    
    let todoListContainer: HTMLElement
    let tasks = new Tasks({ tasks: TEST_TASKS })
    
    // $: store = manager.store
    // $: todoistLinked = $store.todoistLinked
    // $: onTodoist = $store.onTodoist

    export function tasksSettingsHandler(option: string) {
        // if (option === "Refresh Sync") {
        //     manager.refreshTodoist()
        // }
        // else if (option === "Log Out") {
        //     manager.logoutTodoist()
        // }
        // else {
        //     manager.loginTodoist()
        // }
    }

</script>

<div class="tasks" class:tasks--on-todoist={false}>
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
                settings: {
                    addBtn: { 
                        doShow: false
                    }
                },
                ui: { 
                    maxHeight: "550px",
                    hasTaskDivider: true
                },
                containerRef: todoListContainer
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