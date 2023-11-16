<script lang="ts">
	import { TasksViewManager } from "$lib/tasks-view-manager"
	import { formatDatetoStr, formatTimeToHHMM, getUserHourCycle, isNightTime } from "$lib/utils-date"
	import { setShortcutsFocus } from "$lib/utils-home"
	import { clickOutside } from "$lib/utils-general"
	import { onDestroy, onMount } from "svelte"
    import { homeViewLayout, tasksViewStore } from "$lib/store"    
	import { ContextMenuOption, TaskSettingsOptions, RightSideTab, ShortcutSectionInFocus } from "$lib/enums"
    import { 
        tasks, taskGroups, MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH, SUBTASK_HEIGHT, TASK_DESCR_LINE_HT, 
        TASK_HEIGHT_MIN_HAS_DESCR, TASK_HEIGHT_MIN_NO_DESCR, MAX_TAK_GROUP_TITLE_LENGTH 
    } from "$lib/utils-right-bar"

    let currentTimeStr = ""
    let isDayTime = true
    let doUse12HourFormat = false
    let interval: NodeJS.Timer | null = null
    let selectedTab: RightSideTab = RightSideTab.TASKS

    let isTaskGroupDrodownOpen = false
    let isTasksSettingsDropdownOpen = false

    function handleTabClicked (newTab: RightSideTab) {
        if (newTab === RightSideTab.TASKS) {
            // removeHighlightedTask()
        }
        selectedTab = newTab
    }

    /* Time Stuff*/
    function updateTimeStr() {
        currentTimeStr = formatTimeToHHMM(new Date(), doUse12HourFormat)
        isDayTime = !isNightTime()
    }
    function toggleTimeFormatting() {
        doUse12HourFormat = !doUse12HourFormat 
        updateTimeStr()
    }
    function initDateTimer() {
        interval = setInterval(updateTimeStr, 1000)
    }
    function textAreOnKeyDown(event: KeyboardEvent) {
        if (event.key != "Enter") return
        event.preventDefault()
    }

    /* Shortcuts */
    function keyboardShortcutsHandler(event: KeyboardEvent) {        
        if ($homeViewLayout.shortcutsFocus != ShortcutSectionInFocus.TASK_BAR) {
            return
        }
        if (selectedTab === RightSideTab.TASKS) { 
            $tasksViewStore!.keyboardShortcutHandler(event)
        }
    }

    /* Tasks */
    function _addNewTaskBtnHandler() {
        $tasksViewStore!.addNewTaskBtnHandler()
    }
    function _taskGroupDropdownHandler(taskGroup: string) {
        isTaskGroupDrodownOpen = false
        $tasksViewStore!.taskGroupDropdownHandler(taskGroup)
    }
    function _tasksSettingsHandler(optionIdx: TaskSettingsOptions) {
        isTasksSettingsDropdownOpen = false
        $tasksViewStore!.tasksSettingsHandler(optionIdx)
    }

    onMount(() => {
        const hourCycle = getUserHourCycle()
        doUse12HourFormat = hourCycle === "h12" || hourCycle === "h11"
        updateTimeStr()
        initDateTimer()

        new TasksViewManager(tasks, taskGroups)
    })
    onDestroy(() => {
        clearInterval(interval!)
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="task-view" 
    on:click={() => setShortcutsFocus(ShortcutSectionInFocus.TASK_BAR)}
    use:clickOutside on:click_outside={() => setShortcutsFocus(ShortcutSectionInFocus.MAIN)}
>
    <div class="task-view__header task-view__header--default"> 
        <!-- Header -->
        <img class="task-view__header-img" src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/287d3559037917.5a130f45904d5.gif" alt="">
        <div class="task-view__header-top">
            <button class="task-view__header-time" title={currentTimeStr} on:click={toggleTimeFormatting}>
                <h1>{currentTimeStr}</h1>
                <div class="task-view__header-time-icon">
                    {#if isDayTime}
                        <i class="fa-solid fa-sun"></i>
                    {:else}
                        <i class="fa-solid fa-moon"></i>
                    {/if}
                </div>
            </button>
            <div class="task-view__header-date">
                {`${formatDatetoStr(new Date(), { weekday: "short", day: "2-digit", month: "short" })}`}
            </div>
        </div>
        <div class="task-view__header-bottom">
            <p class="task-view__header-text">
                Morning, Kyle!
            </p>
        </div>
    </div>
    <div class="task-view__tab-btns">
        <button 
            on:click={() => handleTabClicked(RightSideTab.TASKS)}
            class={`task-view__tab-btn ${selectedTab === RightSideTab.TASKS ? "task-view__tab-btn--selected" : ""}`}
        >
            Tasks            
        </button>
        <button 
            on:click={() => handleTabClicked(RightSideTab.RECENT_ACTIVITY)}
            class={`task-view__tab-btn ${selectedTab === RightSideTab.RECENT_ACTIVITY ? "task-view__tab-btn--selected" : ""}`}
        >
            Recent Activity
        </button>
    </div>
    <div class="task-view__main-content">
        {#if selectedTab === RightSideTab.TASKS && $tasksViewStore}
            <!-- Tasks Section -->
            <div class="quick-todos">
                <!-- Header -->
                <div class="quick-todos__header">
                    {#if $tasksViewStore.isMakingNewGroup || $tasksViewStore.isEditingGroup}
                        <div class="quick-todos__task-group-input-container">
                            <div 
                                class={`quick-todos__task-group-input input-bottom-underline ${$tasksViewStore.isNewTaskGroupFocused ? "input-bottom-underline--focus" : ""}`}
                            >
                                <input 
                                    type="text"
                                    name="new-task-group-input" 
                                    id={`task-group-input`}
                                    class="quick-todos__task-group-input__new-task-group-title-input"
                                    value={`${$tasksViewStore.taskGroups[$tasksViewStore.pickedTaskGroupIdx]}`}
                                    maxlength={MAX_TAK_GROUP_TITLE_LENGTH}
                                    placeholder="New Task"
                                    on:input={(e) => $tasksViewStore?.inputTextHandler(e)}
                                    on:focus={(e) => $tasksViewStore?.onInputFocusHandler(e)}
                                    on:blur={(e) => $tasksViewStore?.onInputBlurHandler(e)}
                                >
                                <div class="input-bottom-underline__underline-container">
                                    <div class="input-bottom-underline__underline"></div>
                                </div>
                            </div>
                        </div>
                    {:else if $tasksViewStore}
                        <button class="quick-todos__task-group-dropdown-btn" on:click={() => isTaskGroupDrodownOpen = !isTaskGroupDrodownOpen}>
                            <h1 title={$tasksViewStore?.taskGroups[$tasksViewStore?.pickedTaskGroupIdx ?? 0]}>
                                {$tasksViewStore?.taskGroups[$tasksViewStore?.pickedTaskGroupIdx ?? 0]}
                            </h1>
                            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="5" viewBox="0 0 6 5" fill="none">
                                <path d="M3.16357 4.92871L0.536317 0.914305L5.79083 0.914305L3.16357 4.92871Z" fill="#434343"/>
                            </svg>
                        </button>
                    {/if}
                    <button class="task-view__settings-dropdown-btn" on:click={() => isTasksSettingsDropdownOpen = !isTasksSettingsDropdownOpen}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18">
                            <g fill="currentcolor" stroke="currentColor" stroke-linecap="round" transform="translate(0 8.5)">
                                <circle cx="2" cy="0.8" r="0.8"></circle>
                                <circle cx="7" cy="0.8" r="0.8"></circle>
                                <circle cx="12" cy="0.8" r="0.8"></circle>
                            </g>
                        </svg>
                    </button>
                    {#if isTaskGroupDrodownOpen}
                        <div class="quick-todos__task-group-dropdown-container">
                            <ul use:clickOutside on:click_outside={() => isTaskGroupDrodownOpen = false} class="dropdown-menu">
                                {#each $tasksViewStore.taskGroups as taskGroup}
                                    <li class="dropdown-menu__option">
                                        <button class="dropdown-element" on:click={() => _taskGroupDropdownHandler(taskGroup)}>
                                            <span class="dropdown-menu__option-text">
                                                {taskGroup}
                                            </span>
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                    {#if isTasksSettingsDropdownOpen}
                        <div class="quick-todos__tasks-settings-dropdown-container">
                            <ul use:clickOutside on:click_outside={() => isTasksSettingsDropdownOpen = false} class="dropdown-menu">
                                <li class="dropdown-menu__option">
                                    <button 
                                        class="dropdown-element"
                                        on:click={() => _tasksSettingsHandler(TaskSettingsOptions.MAKE_NEW_TASK_GROUP)}
                                    >
                                        <div class="dropdown-menu__option-icon">
                                            +
                                        </div>
                                        <span class="dropdown-menu__option-text">
                                            New Group
                                        </span>
                                    </button>
                                </li>
                                <li class="dropdown-menu__option">
                                    <button 
                                        class="dropdown-element"
                                        on:click={() => _tasksSettingsHandler(TaskSettingsOptions.RENAME_TASK_GROUP)}
                                    >
                                        <div class="dropdown-menu__option-icon">
                                            <i class="fa-solid fa-pencil"></i>
                                        </div>
                                        <span class="dropdown-menu__option-text">
                                            Rename Group
                                        </span>
                                    </button>
                                </li>
                                <li class="dropdown-menu__option">
                                    <button 
                                        class="dropdown-element"
                                        on:click={() => _tasksSettingsHandler(TaskSettingsOptions.DELETE_TASK_GROUP)}
                                    >
                                        <div class="dropdown-menu__option-icon">
                                            <i class="fa-regular fa-trash-can"></i>
                                        </div>
                                        <span class="dropdown-menu__option-text">
                                            Delete Group
                                        </span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    {/if}
                </div>
                <!-- Tasks List -->
                <ul class="quick-todos__todo-list">
                    <!-- Add Button  -->
                    <button class="quick-todos__add-btn" on:click={() => _addNewTaskBtnHandler()}>
                        <span>+</span> Add New Todo
                    </button>
                    <!-- Task Element  -->
                    {#each $tasksViewStore.tasks as task, taskIdx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li
                            role="button" tabindex="0" 
                            id={`todo-id--${taskIdx}`}
                            class={`quick-todo ${taskIdx === $tasksViewStore.pickedTaskIdx ? "quick-todo--expanded" : ""} ${task.isFinished ? "quick-todo--checked" : ""}`}
                            style={`height: ${taskIdx === $tasksViewStore.pickedTaskIdx ? `${$tasksViewStore.pickedTaskHT}` : `${task.description ? TASK_HEIGHT_MIN_HAS_DESCR : TASK_HEIGHT_MIN_NO_DESCR}`}px;`}
                            on:click={(event) => $tasksViewStore?.onTaskedClicked(event, taskIdx)}  
                            on:contextmenu={(e) => $tasksViewStore?.toggleContextMenu(e, taskIdx)}
                        >
                            <!-- Left Side  -->
                            <div class="quick-todo__left">
                                <button class="quick-todo__checkbox" on:click={() => $tasksViewStore?.handleTaskCheckboxClicked(taskIdx)}>
                                    <i class="fa-solid fa-check checkbox-check"></i>
                                </button>
                            </div>
                            <!-- Right Side  -->
                            <div class="quick-todo__right">
                                <!-- Title -->
                                <div class="quick-todo__title-container">
                                    {#if taskIdx === $tasksViewStore.pickedTaskIdx && $tasksViewStore.isEditingTitle}
                                        <input 
                                            type="text" 
                                            name="title-input" 
                                            id={`todo-title-id--${taskIdx}`} 
                                            value={`${task.title}`} 
                                            maxlength={MAX_TITLE_LENGTH}
                                            class="quick-todo__title-input"
                                            placeholder="New Task"
                                            on:input={(e) => $tasksViewStore?.inputTextHandler(e)}
                                            on:focus={(e) => $tasksViewStore?.onInputFocusHandler(e)}
                                            on:blur={(e) => $tasksViewStore?.onInputBlurHandler(e)}
                                        >
                                    {:else}
                                        <h3 
                                            on:click={() => $tasksViewStore?.onTaskTitleClicked(taskIdx)} 
                                            class={`quick-todo__title ${task.isFinished ? "strike" : ""} ${task.isFinished && $tasksViewStore.taskCheckBoxJustChecked === taskIdx ? "strike--animated" : ""}`}
                                        >
                                            {task.title}
                                        </h3>
                                    {/if}
                                </div>
                                <!-- Description -->
                                <div 
                                    id={`todo-description-id--${taskIdx}`}  class="quick-todo__description-container"
                                    style={`line-height: ${TASK_DESCR_LINE_HT}px; ${$tasksViewStore.pickedTaskDescriptionHT ? `height: ${$tasksViewStore.pickedTaskDescriptionHT}px` : ""}`}
                                >
                                    {#if taskIdx === $tasksViewStore.pickedTaskIdx && $tasksViewStore.isEditingDescription}
                                        <textarea
                                            rows="1"
                                            id={`todo-description-input-id--${taskIdx}`}
                                            class="quick-todo__description-text-area"
                                            style={`height: ${$tasksViewStore.pickedTaskDescriptionHT}px`}
                                            maxlength={MAX_DESCRIPTION_LENGTH}
                                            placeholder={task.description ? "" : "No description"}
                                            value={task.description}
                                            spellcheck={$tasksViewStore.textAreaHasSpellCheck}
                                            on:focus={(e) => $tasksViewStore?.onInputFocusHandler(e)}
                                            on:keydown={textAreOnKeyDown}
                                            on:input={(e) => $tasksViewStore?.inputTextHandler(e)}
                                            on:blur={(e) => $tasksViewStore?.onInputBlurHandler(e)}
                                        />
                                    {:else}
                                        <p class="quick-todo__description">
                                            {task.description}
                                        </p>
                                    {/if}
                                </div>
                                <!-- Subtasks -->
                                {#if taskIdx === $tasksViewStore.pickedTaskIdx}
                                    <ul id={`todo-subtasks-id--${taskIdx}`} class="quick-todo__subtasks-list">
                                        {#each task.subtasks as subtask, subtaskIdx}
                                            <li 
                                                class={`quick-todo__subtask 
                                                            ${subtask.isFinished ? "quick-todo__subtask--checked" : ""}
                                                            ${subtaskIdx === $tasksViewStore.focusedSubtaskIdx ? "quick-todo__subtask--focused" : ""}
                                                       `} 
                                                style={`height: ${SUBTASK_HEIGHT}px; animation: fade-in 0.3s cubic-bezier(.5,.84,.42,.9) ${(task.subtasks.length <= 5 ? 100 : 30) * subtaskIdx}ms forwards;`}
                                                id={`subtask-idx--${subtaskIdx}`}
                                                use:clickOutside on:click_outside={() => $tasksViewStore?.resetCurrentFocusedSubtaskIdx()}
                                            >
                                                {#if subtaskIdx === 0}
                                                    <div 
                                                        class={`quick-todo__subtask-hook-line ${subtaskIdx === 0 ? "quick-todo__subtask-hook-line--first" : ""}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="23" height={`${$tasksViewStore.hookContainerHT ?? 30}`} viewBox={`0 0 10 ${$tasksViewStore.hookContainerHT ?? 30}`} fill="none">
                                                            <path d={`M18.5684 ${$tasksViewStore.hooklineOffset}H9.66992C4.69936 ${$tasksViewStore.hooklineOffset} 0.669922 ${$tasksViewStore.hooklineOffset - 4.0294} 0.669922 ${$tasksViewStore.hooklineOffset - 9}V0.0244141`} stroke-dasharray="1.6 1.6"/>
                                                        </svg>
                                                    </div>
                                                {:else}
                                                    <div class="quick-todo__subtask-hook-line">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="31" viewBox="0 0 16 31" fill="none">
                                                            <path d="M15.2188 30.0801H9.66797C4.69741 30.0801 0.667969 26.0506 0.667969 21.0801V0.687744" stroke-dasharray="1.6 1.6"/>
                                                        </svg>
                                                    </div>
                                                {/if}
                                                <div class="flx flx--algn-center">
                                                    <button class="quick-todo__subtask-checkbox quick-todo__checkbox" on:click={() => $tasksViewStore?.handleSubtaskCheckboxClicked(subtaskIdx)}>
                                                        <i class="fa-solid fa-check checkbox-check"></i>
                                                    </button>
                                                    {#if $tasksViewStore.editingSubtaskIdx === subtaskIdx}
                                                        <input 
                                                            type="text" 
                                                            id={`todo-subtask-title-id--${subtaskIdx}`} 
                                                            value={`${subtask.title}`} 
                                                            maxlength={MAX_TITLE_LENGTH}
                                                            placeholder={`${subtask.title === "" ? "New Subtask" : ""}`}
                                                            class="quick-todo__subtask-title-input"
                                                            on:input={(e) => $tasksViewStore?.inputTextHandler(e)}
                                                            on:focus={(e) => $tasksViewStore?.onInputFocusHandler(e)}
                                                            on:blur={(e) => $tasksViewStore?.onInputBlurHandler(e)}
                                                        >
                                                    {:else}
                                                        <span 
                                                            class={`quick-todo__subtask-title ${subtask.isFinished ? "strike" : ""} 
                                                                    ${subtask.isFinished && $tasksViewStore.subtaskCheckBoxJustChecked === subtaskIdx ? "strike--animated" : ""}
                                                            `}
                                                            on:click={() => $tasksViewStore?.onSubtaskTitleClicked(subtaskIdx)}
                                                        >
                                                            {subtask.title}
                                                        </span>
                                                    {/if}
                                                </div>                                                
                                                <button class="quick-todo__subtask-settings-btn" on:click={(e) => $tasksViewStore?.toggleContextMenu(e, taskIdx, subtaskIdx)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18">
                                                        <g fill="currentcolor" stroke="currentColor" stroke-linecap="round" transform="translate(0 8.5)">
                                                            <circle cx="2" cy="0.8" r="0.8"></circle>
                                                            <circle cx="7" cy="0.8" r="0.8"></circle>
                                                            <circle cx="12" cy="0.8" r="0.8"></circle>
                                                        </g>
                                                    </svg>
                                                </button>
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
        {:else if selectedTab === RightSideTab.RECENT_ACTIVITY}
        {/if}
    </div>
    <!-- Context Menu -->
    {#if $tasksViewStore && $tasksViewStore.contextMenuX > 0}
        <div 
            class="task-view__context-menu"
            style={`left: ${$tasksViewStore.contextMenuX}px; top: ${$tasksViewStore.contextMenuY}px`}
        >
            <ul use:clickOutside on:click_outside={() => $tasksViewStore?.closeContextMenu()} class="dropdown-menu">
                {#if $tasksViewStore.rightClickedTask}
                    <li class="dropdown-menu__option">
                        <button 
                                class="dropdown-element" 
                                on:click={() => $tasksViewStore?.contextMenuHandler(ContextMenuOption.ADD_SUBTASK)}
                        >
                            <div class="dropdown-menu__option-icon">
                                <i class="fa-solid fa-list-check"></i>
                            </div>
                            <span class="dropdown-menu__option-text">
                                Add Subtask
                            </span>
                            <div class="dropdown-menu__option-icon task-view__context-menu-command">
                                <span>⌘</span>
                                <span class="task-view__context-menu-command--plus">+</span>
                            </div>
                        </button>
                    </li>
                    <li class="dropdown-menu__option">
                        <button 
                                class="dropdown-element" 
                                on:click={() => $tasksViewStore?.contextMenuHandler(ContextMenuOption.DELETE_TASK)}
                        >
                            <div class="dropdown-menu__option-icon">
                                <i class="fa-regular fa-trash-can"></i>
                            </div>
                            <span class="dropdown-menu__option-text">
                                Delete Task
                            </span>
                            <div class="dropdown-menu__option-icon task-view__context-menu-command">
                                <span>⌘</span><span>⌫</span>
                            </div>
                        </button>
                    </li>
                {:else}
                    <li class="dropdown-menu__option">
                        <button 
                            class="dropdown-element" 
                            on:click={() => $tasksViewStore?.contextMenuHandler(ContextMenuOption.DELETE_SUBTASK)}
                        >
                            <div class="dropdown-menu__option-icon">
                                <i class="fa-regular fa-trash-can"></i>
                            </div>
                            <span class="dropdown-menu__option-text">
                                Delete Subtask
                            </span>
                            <div class="dropdown-menu__option-icon task-view__context-menu-command">
                                <span>⌘</span><span>⌫</span>
                            </div>
                        </button>
                    </li>
                {/if}
            </ul>
        </div>
    {/if}
</div>

<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/inputs.scss";

    $side-padding: 18px;
    $color-a: rgba(var(--textColor1), 0.15);
    $todo-minimized-height: 40px;

    .dropdown-menu {
        @include dropdown-menu-dark;
        background-color: #181818;
        padding-right: 5px;
    }

    .task-view {
        width: 100%;
        height: 100vh;
        color: rgb(var(--textColor1));
        position: relative;
        
        &__header {
            width: 100%;
            margin: 0px 0px 15px 0px;
            h2 {
                font-family: "Apercu";
                padding-left: 7%;
                @include elipses-overflow;
                margin: 0px 10px 2px 0px;
                font-weight: 500;
            }
            &--secondary {
                display: block;
                text-align: center;
            }
            &--secondary > p {
                margin: 5px 0px 6px 0px;
            }

            &-img {
                width: 100%;
                margin-bottom: 10px;
                height: 60px;
                object-fit: cover;
            }
            &-top {
                margin: 4px 0px 3px 0px;
                @include flex-container(center, space-between);
            }
            &-top, &-bottom {
                padding: 0px 18px;
            }

            &-time {
                @include flex-container(center, _);
                h1 {
                    font-size: 1.7rem;
                    font-weight: 300;
                    margin-right: 11px;
                }
            }
            &-time-icon {
                i {
                    font-size: 1.5rem;
                    color: #F4CCA8;
                }
            }
            &-date {
                font-size: 1.15rem;
                font-weight: 200;
                color: rgb(var(--textColor1), 0.4);
            }
            &-text {
                margin-top: 3px;
                font-size: 1.2rem;
                font-weight: 200;
                color: rgb(var(--textColor1), 0.32);
            }
        }

        &__tab-btns {
            @include flex-container(center, _);
            padding-left: $side-padding;
            margin-bottom: 9px;
        }
        &__tab-btn {
            padding: 4px 12px;
            margin-right: 4px;
            font-weight: 300;
            font-size: 1.14rem;
            border-radius: 15px;
            background-color: rgb(255, 255, 255, 0.02);
            color: rgb(var(--textColor1), 0.4);
            
            &--selected {
                background-color: rgb(255, 255, 255, 0.05);
                color: rgb(var(--textColor1), 0.9);
            }
        }
        &__main-content {
            height: calc(100% - 134.5px);
            width: 100%;
        }
        &__settings-dropdown-btn {
            opacity: 0.1;
            margin: -2px -5px 0px 10px;
            @include circle(23px);
            @include center;
            
            &:active {
                transform: scale(0.94);
            }
            &:hover {
                opacity: 0.5;
                background-color: rgb(var(--textColor1), 0.1);
            }
        }
        &__context-menu {
            position: absolute;

            &-command span {
                margin-right: 2px;
                width: 9px;
            }
            &-command {
                width: 25px;
                @include flex-container(center, center);
                font-weight: 200;
                color: rgba(var(--textColor1), 0.3);
                font-size: 0.9rem;
                margin-left: 5px;

                &--plus {
                    font-size: 1.3rem;
                }
            }
        }
        &__context-menu .dropdown-menu {
            background-color: #181818;
            padding-right: 5px;
        }
        &__context-menu .dropdown-menu__option {
            &-icon {
                margin-right: 6.5px;
            }
        }
    }
    .quick-todos {
        height: 100%;
        width: 100%;
        border-radius: 10px;
        margin-bottom: 2px;
    
        &__header {
            @include flex-container(center, space-between);
            padding: 0px $side-padding 0px calc($side-padding - 8px);
            margin-bottom: 5px;
            position: relative;
        }
        &__task-group-dropdown-btn {
            @include flex-container(center, _);
            padding: 5px 8px;
            border-radius: 12px;

            h1 {
                font-size: 1.7rem;
                font-weight: 400;
                color: rgb(var(--textColor1), 0.9);
                @include elipses-overflow;
                max-width: 100px;
                margin-right: 7px;
            }

            &:focus {
                background-color: rgba(white, 0.02);
            }
            &:hover {
                background-color: rgba(white, 0.02);
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

            &__underline {
                background-color: rgba(white, 0.06);
                box-shadow: none;
            }
        }
        &__task-group-dropdown-container {
            @include pos-abs-bottom-left-corner(-5px, 15px);
        }
        &__tasks-settings-dropdown-container {
            @include pos-abs-top-right-corner(30px, 130px);
        }
        &__tasks-settings-dropdown-container .dropdown-menu {
            &__option-icon {
                margin-right: 8px;
            }
        }

        &__todo-list {
            // overflow: hidden;
            position: relative;
        }
        &__add-btn {
            margin: 3px 0px 9px 2px;
            @include flex-container(center, _);
            font-weight: 300;
            font-size: 11.5px;
            opacity: 0.3;
            padding: 0px $side-padding;
            
            span {
                margin-right: 10px;
                font-weight: 100;
                font-size: 15px;
            }

            &:active {
                transform: scale(0.98);
            }
            &:hover {
                opacity: 1;
            }
        }
        &__new-todo-input-container {
            
        }
        &__new-todo-input-btns {

        }
    }
    .quick-todo {
        @include flex-container(flex-start, _);
        outline: none;
        padding: 3px 0px 0px 0px;
        cursor: pointer;
        overflow: hidden;
        transition: height 0.4s cubic-bezier(.1,.84,.42,.95);
        width: 100%;
        
        &:not(:last-child) {
            margin-bottom: 3px;
        }
        &:hover, &:focus {
            background-color: rgb(var(--textColor1), 0.01);
        }
        &--selected {
            background-color: rgb(var(--textColor1), 0.011);
        }
        &--expanded &__description {
            display: flex;
            max-height: fit-content;
        }
        &--expanded &__subtask {
            opacity: 1;
        }

        &--checked &__left &__checkbox {
            border-color: transparent;
            background-color: rgba(var(--textColor1), 0.3);

            i {
                display: block;
            }
        }
        &--checked  &__title {
            color: rgba(var(--textColor1), 0.3);
        }
        &--checked &__title.strike::after {
            background-color: rgba(var(--textColor1), 0.3);
        }
        &__left {
            width: 16.25%;
        }
        &__right {
            width: calc(100% - 16.25%);
        }
        &__checkbox {
            @include circle(10px);
            @include center;
            transition: 0.1s ease-in-out;
            border: 1px solid $color-a;
            margin: 4px 9px 0px $side-padding;
            cursor: pointer;

            i {
                margin-top: 1px;
                font-size: 0.65rem;
                color: var(--navMenuBgColor);
                display: none;
            }
            &:focus {
                background-color: rgba(var(--textColor1), 0.1);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.1);
            }
            &:active {
                transform: scale(0.97);
            }
        }
        &__title-container {
            margin-bottom: 2px;
            
            h3, input {
                display: inline-block;
                font-size: 1.3rem;
                font-weight: 200;
                cursor: text;
            }
        }
        &__title {
        }
        &__title-input {
            &::placeholder {
                opacity: 0.2;
            }
        }
        &__description-container {
            width: 100%;
        }
        &__description, &__description-text-area {
            font-size: 1.1rem;
            font-weight: 300;
            color: rgba(var(--textColor1), 0.22);
            width: 100%;
            padding: 0px 8px 0px 0px;
        }
        &__description {
            max-height: 16px;
            cursor: text;
            overflow: hidden;
            white-space: pre-wrap;
            word-break: break-word;
            @include multi-line-elipses-overflow(1);
        }
        &__description-text-area {
            &::placeholder {
                opacity: 0.3;
            }
        }
        &__subtasks-list {
            padding-top: 10px;
        }
        &__subtask {
            @include flex-container(center, space-between);
            position: relative;
            visibility: hidden;
            transition: 0.12s ease-in-out;
            
            &:hover span {
                color: rgba(var(--textColor1), 0.4);   
            }
            &--focused span, &:focus span {
                color: rgba(var(--textColor1), 0.4);   
            }
            &--focused &-checkbox {
                border: 1px solid rgba(var(--textColor1), 0.4);
            }

            &:hover &-settings-btn {
                opacity: 0.1;
                visibility: visible;
            }
            &:not(:last-child) {
                margin-bottom: 8px;
            }

            &--checked &-checkbox {
                border-color: transparent;
                background-color: rgba(var(--textColor1), 0.2) !important;

                &:hover {
                    background-color: rgb(var(--navMenuBgColor));
                }
                i {
                    display: block;
                }
            }

            &-hook-line {
                @include pos-abs-bottom-left-corner(3px, -15.5px);
                
                &--first {
                    @include pos-abs-bottom-left-corner(3px, -22px);
                }
                svg {
                    stroke: $color-a;
                }
            }
            &-checkbox {
                margin: 0px 7px 0px 0px;
                @include circle(10px);
            }
            &-title {
                display: inline-block;
                width: auto;
            }
            &-title-input {
                width: 100%;

                &::placeholder {
                    opacity: 0.2;
                }
            }
            &-title, &-title-input {
                font-weight: 300;
                font-size: 1.1rem;
                color: rgba(var(--textColor1), 0.2);
                cursor: text;
            }
            &-title.strike::after {
                background-color: rgba(var(--textColor1), 0.2);
            }
            &-settings-btn {
                opacity: 0.1;
                margin: -2px 10px 0px 0px;
                @include circle(20px);
                @include center;
                opacity: 0;
                visibility: hidden;
                
                &:active {
                    transform: scale(0.94);
                }
                &:hover {
                    opacity: 0.4 !important;
                    background-color: rgb(var(--textColor1), 0.1);
                }
            }
        }
    }
    @keyframes strike {
        0%   { width : 0; }
        100% { width: 100%; }
    }
    .strike {
        position: relative; 

        &::after {
            content: ' ';
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 1px;
            background: rgba(var(--textColor1), 0.5);
        }
        
        &--animated {
            &::after {
                animation: 0.13s strike ease-in-out forwards 1;
            }
        }
    }
</style>