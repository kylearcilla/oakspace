<script lang="ts">
	import { Icon, LogoIcon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { MAX_TASK_GROUP_TITLE_LENGTH } from "$lib/utils-right-bar"

	import Logo from "../../components/Logo.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import TasksList from "../../components/TasksList.svelte"
	import { TasksViewManager } from "$lib/tasks-view-manager"
	import DropdownList from "../../components/DropdownList.svelte"
	import ConfirmationModal from "../../components/ConfirmationModal.svelte"
    
    export let manager: TasksViewManager

    const todoistGroupOption: DropdownListItem = {
        options: [
        { 
            name: "Inbox",
            leftIcon: {
                type: "logo",
                icon: LogoIcon.Todoist,
                styling: {
                    height: "12px",
                    width: "12px",
                    margin: "0px 7.5px 0px 0px"
                }
            }
        }]
    }
    
    let groupDropdown = false
    let settingsOpen = false
    let todoListContainer: HTMLElement
    let curTaskGroup: TaskGroup = manager.currTaskGroup
    let tasks: Task[] = curTaskGroup.tasks
    let confirmModalOpen = false
    
    $: isDarkTheme = $themeState.isDarkTheme
    $: store = manager.store
    $: currTaskGroupAbsIdx = $store.currTaskGroupAbsIdx
    $: todoistLinked = $store.todoistLinked
    $: onTodoist = $store.onTodoist
    $: taskGroups = $store.taskGroups.map((task) => ({ 
        name: task.title 
    }))
    $: if ($store.isMakingNewGroup) {
        tasks = []
    }
    $: {
        curTaskGroup = $store.currTaskGroup
        tasks = curTaskGroup.tasks
    }
    $: taskGroupSettingsOptions = $store.getTaskSettingsDropdown()

    function tasksSettingsHandler(option: string) {
        settingsOpen = false

        if (option === "New Group") {
            manager.initNewGroupEdit()
        }
        else if (option === "Rename Group") {
            manager.initEditGroupEdit()
        }
        else if (option === "Refresh Sync") {
            manager.refreshTodoist()
        }
        else if (option === "Log Out") {
            manager.logoutTodoist()
        }
        else if (option === "Delete Group") {
            confirmModalOpen = true
        }
        else {
            manager.loginTodoist()
        }
    }

</script>

<div 
    class="tasks"
    class:tasks--dark-theme={isDarkTheme}
    class:tasks--light-theme={!isDarkTheme}
>
    <!-- Header -->
    <div class="tasks__header">
        {#if $store.isMakingNewGroup || $store.isEditingGroup}
            <div class="tasks__group-input-container">
                <div 
                    class="tasks__group-input input-bottom-underline"
                    class:input-bottom-underline--focus={true}
                >
                    <input 
                        type="text"
                        name="new-task-group-input" 
                        id={TasksViewManager.TASK_GROUP_INPUT_ID}
                        class="tasks__group-input__new-task-group-title-input"
                        maxlength={MAX_TASK_GROUP_TITLE_LENGTH}
                        value={`${$store.newText}`}
                        placeholder="Task Title Here..."
                        on:input={(e) => $store.inputTextHandler(e)}
                        on:blur={() => $store.onInputBlurHandler()}
                    >
                    <div class="input-bottom-underline__underline-container">
                        <div class="input-bottom-underline__underline"></div>
                    </div>
                </div>
            </div>
        {:else}
            <button
                id="task-group--dropdown-btn"
                class="tasks__group-dropdown-btn" 
                class:tasks__group-dropdown-btn--active={groupDropdown}
                on:click={() => groupDropdown = !groupDropdown}
            >
                {#if onTodoist}
                    <div class="tasks__group-todoist-icon">
                        <Logo
                            logo={LogoIcon.Todoist}
                            options={{ containerWidth: "14px", iconWidth: "100%" }}
                        />
                    </div>
                    <h1 
                        class="tasks__group-dropdown-btn-title" 
                        title={curTaskGroup.title}
                    >
                        Inbox
                    </h1>
                {:else}
                    <h1 
                        class="tasks__group-dropdown-btn-title" 
                        title={curTaskGroup.title}
                    >
                        {curTaskGroup.title}
                    </h1>
                {/if}
                <svg xmlns="http://www.w3.org/2000/svg" width="6" height="5" viewBox="0 0 6 5" fill="none">
                    <path d="M3.16357 4.92871L0.536317 0.914305L5.79083 0.914305L3.16357 4.92871Z" fill="#434343"/>
                </svg>
            </button>
        {/if}
        <button 
            id="task-group-settings--dropdown-btn"
            class="tasks__settings-dropdown-btn" 
            on:click={() => settingsOpen = !settingsOpen}
         >
            <SvgIcon 
                icon={Icon.Settings} 
                options={{ opacity: 0.45 }} 
            />
        </button>
        <!-- Task Group Dropdown List -->
        <DropdownList
            id="task-group"
            isHidden={!groupDropdown} 
            options={{
                listItems: [
                    ...(todoistLinked ? [todoistGroupOption] : []),
                    {
                        options: [{ name: "Inbox" }]
                    },
                    ...taskGroups
                ],
                pickedItem: currTaskGroupAbsIdx,
                onListItemClicked: (context) => {
                    manager.taskGroupDropdownHandler(context.idx)
                    groupDropdown = false
                },
                onClickOutside: () => {
                    groupDropdown = false
                },
                styling: {
                    zIndex: 5,
                    minWidth: "95px",
                    maxWidth: "120px"
                },
                position: {
                    left: "11px", top: "38px" 
                }
            }}
        />
        <!-- Task Settings Dropdown -->
        <DropdownList
            id="task-group-settings"
            isHidden={!settingsOpen} 
            options={{
                listItems: taskGroupSettingsOptions,
                onListItemClicked: (context) => {
                    tasksSettingsHandler(context.name)
                },
                onClickOutside: () => {
                    settingsOpen = false
                },
                styling: {
                    zIndex: 5,
                    width: "150px"
                },
                position: { 
                    right: "17px", top: "32px" 
                },
            }}
        />
    </div>
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
</div>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text={`Are you sure you want to delete "${curTaskGroup.title}"?`}
        onCancel={() => {
            confirmModalOpen = false
        }}
        onOk={() => {
            manager.deleteTaskGroup()
            confirmModalOpen = false
        }}
        options={{ 
            ok: "Delete!", caption: "Heads Up!" 
        }}
    /> 
{/if}



<style lang="scss">
    @import "../../scss/inputs.scss";
    @import "../../scss/tasks.scss";

    $side-padding: 18px;
    $color-a: rgba(var(--textColor1), 0.15);
    $todo-minimized-height: 40px;

    /* Tasks */
    .tasks {
        height: 100%;
        width: 100%;
        border-radius: 10px;
        margin: -7px 0px 0px 0px;
        position: relative;

        &--light-theme .input-bottom-underline {
            @include input-bottom-underline--light;
        }
        &--light-theme .settings-btn {
            @include input-bottom-underline--light;
        }
        &--light-theme &__settings-dropdown-btn {
            @include settings-btn--light;
        }
        &--light-theme &__group-dropdown-btn {
        }
        &--light-theme &__add-btn {
            opacity: 0.45;
            font-weight: 500;
            
            span {
                font-weight: 500;
            }
        }

        &__header {
            @include flex(center, space-between);
            padding: 0px $side-padding 0px calc($side-padding - 8px);
            margin-bottom: 1.5px;
            position: relative;
            width: 100%;
        }
        &__settings-dropdown-btn {
            @include circle(20px);
            @include center;
            margin: -2px -5px 0px 0px;
            background-color: rgba(var(--textColor1), 0.05);
            opacity: 0.5;
            
            &:hover {
                opacity: 1;
            }
        }
        &__group-dropdown-btn {
            @include flex(center);
            padding: 5px 8px;
            border-radius: 12px;
            border: 1px solid rgba(var(--textColor1), 0);
            
            &--active svg {
                transform: rotate(90deg) !important;
            }
            &:focus, &:hover {
                background-color: rgba(var(--textColor1), 0.04);
                border: 1px solid rgba(var(--textColor1), 0.03);

                svg {
                    opacity: 1;
                }
            }
            svg {
                opacity: 0;
                transition: 0.1s cubic-bezier(.4,0,.2,1);
                transform: rotate(0deg);
            }
        }
        &__group-dropdown-btn-title {
            @include text-style(0.9, 400, 1.7rem);
            @include elipses-overflow;
            max-width: 150px;
            margin-right: 7px;

            &--no-tasks {
                font-size: 1.2rem;
                font-weight: 300; 
                color: rgb(var(--textColor1), 0.4);
            }

            &--no-tasks {
                margin-left: 8px;
            }
        }
        &__group-todoist-icon {
            margin: 1px 9px 0px 0px;
        }
        &__group-input-container {
            position: relative;
            width: 80%;
            margin: 0px 0px -7px 6px;
        }
        &__group-input-container .input-bottom-underline {
            width: 100%;
            border-radius: 5px 5px 0px 0px;
            
            input {
                font-weight: 500;
                padding: 5px 0px 6px 0px;
            }
        }
        &__todo-list-container {
            height: 100%;
            position: relative;
            margin-top: 6px;
        }
        &__todo-list {
            overflow-y: scroll;
            height: 100%;
            position: relative;
        }
        &__add-btn {
            margin: 3px 0px 9px 2px;
            @include flex(center, _);
            font-weight: 300;
            font-size: 1.15rem;
            opacity: 0.3;
            padding: 0px $side-padding;
            
            span {
                margin-right: 10px;
                font-weight: 100;
                font-size: 1.5rem;
            }

            &:active {
                transform: scale(0.98);
            }
            &:hover {
                opacity: 1;
            }
        }
        &__context-menu {
            position: absolute;
        }
        &__context-menu-command span {
            margin-right: 2px;
            width: 9px;
        }
        &__context-menu-command {
            width: 25px;
            @include flex(center, center);
            font-weight: 200;
            color: rgba(var(--textColor1), 0.3);
            font-size: 0.9rem;

            &--plus {
                font-size: 1.3rem;
            }
        }
        &__new-todo-input-container {
            
        }
        &__new-todo-input-btns {

        }
    }
</style>