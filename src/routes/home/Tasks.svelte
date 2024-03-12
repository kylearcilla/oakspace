<script lang="ts">
	import { Icon, ShortcutSectionInFocus, TaskSettingsOptions } from "$lib/enums";
	import { globalContext, musicPlayerStore, tasksViewStore, themeState } from "$lib/store";
	import { getVertScrollStatus } from "$lib/utils-general";
	import { MAX_TAK_GROUP_TITLE_LENGTH, TEST_TASKS } from "$lib/utils-right-bar";
	import { onMount } from "svelte";
	import SvgIcon from "../../components/SVGIcon.svelte";
	import TasksList from "../../components/TasksList.svelte";
	import DropdownList from "../../components/DropdownList.svelte";

    let isTaskGroupDrodownOpen = false
    let isTasksSettingsDropdownOpen = false
    let maskListGradient = ""
    let contentList: HTMLElement
    $: isDarkTheme = $themeState.isDarkTheme

    const TASK_DROPDOWN_WIDTH = 120
    let currTaskGroupIdx = 0

    function updateMaskListGradient(status: VertScrollStatus) {
        const { hasReachedBottom, hasReachedTop } = status

        if (!hasReachedTop && !hasReachedBottom) {
            maskListGradient = "linear-gradient(180deg, transparent 0.2%, black 10%, black 80%, transparent 99%)"
        }
        else if (!hasReachedTop) {
            maskListGradient = "linear-gradient(180deg, transparent 0.2%, black 10%)"
        }
        else if (!hasReachedBottom) {
            maskListGradient = "linear-gradient(180deg, black 80%, transparent 99%)"
        }
    }
    function contentListScrollHandler(contentList: HTMLElement) {
        const status = getVertScrollStatus(contentList)
        updateMaskListGradient(status)
    }

    /* Shortcuts */
    function keyboardShortcutsHandler(event: KeyboardEvent) {
        if ($globalContext.shortcutsFocus != ShortcutSectionInFocus.TASK_BAR) {
            return
        }
        const hasMenu = isTaskGroupDrodownOpen || isTasksSettingsDropdownOpen

        // if (hasMenu && event.key === "Escape") {
        //     isTaskGroupDrodownOpen = false
        //     isTasksSettingsDropdownOpen = false

        //     if ($tasksViewStore!.contextMenuY) $tasksViewStore!.closeContextMenu()

        //     return
        // }
        // $tasksViewStore!.keyboardShortcutHandler(event)
    }
    function onTaskGroupItemClicked(idx: number) {
        isTaskGroupDrodownOpen = false
        console.log(idx)
    }

    /* Tasks */
    function _addNewTaskBtnHandler() {
        // $tasksViewStore!.addNewTaskBtnHandler()
    }
    function _taskGroupDropdownHandler(taskGroupIdx: number) {
        isTaskGroupDrodownOpen = false
        $tasksViewStore!.taskGroupDropdownHandler(taskGroupIdx)
    }
    function _tasksSettingsHandler(optionIdx: TaskSettingsOptions) {
        isTasksSettingsDropdownOpen = false
    }

    onMount(() => {
        // contentListScrollHandler(contentList)
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} />

<div 
    class={`quick-todos ${$themeState.isDarkTheme ? "quick-todos--dark-theme" : "quick-todos--light-theme"}`}
    class:quick-todos--dark-theme={isDarkTheme}
    class:quick-todos--light-theme={!isDarkTheme}
>
    <!-- Header -->
    <div class="quick-todos__header">
        {#if $tasksViewStore?.isMakingNewGroup || $tasksViewStore?.isEditingGroup}
            <div class="quick-todos__task-group-input-container">
                <div 
                    class={`quick-todos__task-group-input input-bottom-underline ${$tasksViewStore?.isNewTaskGroupFocused ? "input-bottom-underline--focus" : ""}`}
                >
                    <input 
                        type="text"
                        name="new-task-group-input" 
                        id={`task-group-input`}
                        class="quick-todos__task-group-input__new-task-group-title-input"
                        value={`${$tasksViewStore?.newText}`}
                        maxlength={MAX_TAK_GROUP_TITLE_LENGTH}
                        placeholder="New Task Group"
                        on:input={(e) => $tasksViewStore?.inputTextHandler(e)}
                        on:focus={(e) => $tasksViewStore?.onInputFocusHandler(e)}
                        on:blur={(e) => $tasksViewStore?.onInputBlurHandler(e)}
                    >
                    <div class="input-bottom-underline__underline-container">
                        <div class="input-bottom-underline__underline"></div>
                    </div>
                </div>
            </div>
        {:else if $tasksViewStore && $tasksViewStore?.taskGroups.length > 0}
            <button class="quick-todos__task-group-dropdown-btn" on:click={() => isTaskGroupDrodownOpen = !isTaskGroupDrodownOpen}>
                {#if $tasksViewStore?.currTaskGroupIdx >= 0}
                    <h1 
                        class="quick-todos__task-group-dropdown-btn-title" 
                        title={$tasksViewStore?.taskGroups[$tasksViewStore?.currTaskGroupIdx].title}
                    >
                        {$tasksViewStore?.taskGroups[$tasksViewStore?.currTaskGroupIdx].title}
                    </h1>
                {:else}
                    <h1 
                        class="quick-todos__task-group-dropdown-btn-title quick-todos__task-group-dropdown-btn-title--empty" 
                    >
                        No Task Selected
                    </h1>
                {/if}
                <svg xmlns="http://www.w3.org/2000/svg" width="6" height="5" viewBox="0 0 6 5" fill="none">
                    <path d="M3.16357 4.92871L0.536317 0.914305L5.79083 0.914305L3.16357 4.92871Z" fill="#434343"/>
                </svg>
            </button>
        {:else if $tasksViewStore}
            <h1 
                class="quick-todos__task-group-dropdown-btn-title quick-todos__task-group-dropdown-btn-title--no-tasks" 
            >
                No Tasks
            </h1>
        {/if}
        <button class="quick-todos__settings-dropdown-btn settings-btn" on:click={() => isTasksSettingsDropdownOpen = !isTasksSettingsDropdownOpen}>
            <SvgIcon icon={Icon.Settings} options={{ opacity: 0.45 }} />
        </button>
        <!-- Task Group Dropdown List -->
        <DropdownList
            isHidden={!isTaskGroupDrodownOpen} 
            options={{
                listItems: ($tasksViewStore?.taskGroups ?? []).map((task) => ({ 
                    name: task.title 
                })),
                onListItemClicked: (idx) => currTaskGroupIdx = idx,
                pickedItemIdx: currTaskGroupIdx,
                onClickOutside: () => isTaskGroupDrodownOpen = false,
                position: { left: "15px", top: "35px" }
            }}
        />
        <!-- Task Settings Dropdown -->
        <DropdownList
            isHidden={!isTasksSettingsDropdownOpen} 
            options={{
                listItems: [
                    { name: "New Group", leftIcon: "fa-solid fa-plus" },
                    { name: "Rename Group", leftIcon: "fa-solid fa-pencil" },
                    { name: "Delete Group", leftIcon: "fa-solid fa-trash-can" }
                ],
                pickedItemIdx: currTaskGroupIdx,
                onListItemClicked: (idx) => console.log(idx),
                onClickOutside: () => isTasksSettingsDropdownOpen = false,
                position: { right: "17px", top: "32px" },
            }}
        />
    </div>
    <!-- Tasks List -->
    <div 
        class="quick-todos__todo-list-container"
        class:quick-todos__todo-list-container--short={$musicPlayerStore?.doShowPlayer}
    >
        <TasksList 
            options={{
                type: "subtasks-linked subtasks",
                handlers: {
                    onTaskEdit: () => console.log("A"),
                    onSubtaskEdit: () => console.log("B"),
                    onListReorder: () => console.log("C")
                },
                tasks: TEST_TASKS,
                contextMenuOptions: { width: `${TASK_DROPDOWN_WIDTH}px` },
                ui: { showDragHandle: false }
            }}
        />
    </div>
</div>


<style lang="scss">
    @import "../../scss/inputs.scss";
    @import "../../scss/tasks.scss";

    $side-padding: 18px;
    $color-a: rgba(var(--textColor1), 0.15);
    $todo-minimized-height: 40px;

    /* Tasks */
    .quick-todos {
        height: 100%;
        width: 100%;
        border-radius: 10px;
        margin-bottom: 2px;
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
        &--light-theme &__task-group-dropdown-btn {
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
            margin-bottom: 5px;
            position: relative;
            width: 100%;
        }
        &__settings-dropdown-btn {
            margin: -2px -5px 0px 10px;
            @include circle(23px);
            @include center;
            
            &:active {
                transform: scale(0.94);
            }
        }
        &__task-group-dropdown-btn {
            @include flex(center, _);
            padding: 5px 8px;
            border-radius: 12px;

            &:focus, &:hover {
                background-color: rgba(white, 0.02);
            }
        }
        &__task-group-dropdown-btn-title {
            font-size: 1.7rem;
            font-weight: 400;
            color: rgb(var(--textColor1), 0.9);
            @include elipses-overflow;
            max-width: 100px;
            margin-right: 7px;

            &--empty, &--no-tasks {
                font-size: 1.2rem;
                font-weight: 300; 
                color: rgb(var(--textColor1), 0.4);
            }

            &--no-tasks {
                margin-left: 8px;
            }
        }
        &__task-group-input-container {
            position: relative;
            width: 80%;
            margin: 0px 0px -7px 6px;
        }
        &__task-group-input-container .input-bottom-underline {
            width: 100%;
            font-size: 1.7rem;
            font-weight: 400;
            border-radius: 5px 5px 0px 0px;
            
            input {
                padding: 5px 0px 6px 0px;
            }
        }
        &__todo-list-container {
            height: calc(100% - (38px + 29.5px));
            
            &--short {
                height: calc(100% - (38px + 29.5px + 60px));
            }
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