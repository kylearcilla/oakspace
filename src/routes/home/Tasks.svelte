<script lang="ts">
	import { ContextMenuOption, Icon, ShortcutSectionInFocus, TaskSettingsOptions } from "$lib/enums";
	import { globalContext, musicPlayerStore, tasksViewStore, themeState } from "$lib/store";
	import { clickOutside, getVertScrollStatus } from "$lib/utils-general";
	import { MAX_TAK_GROUP_TITLE_LENGTH, TASK_HEIGHT_MIN_HAS_DESCR, TASK_HEIGHT_MIN_NO_DESCR, MAX_TITLE_LENGTH, TASK_DESCR_LINE_HT, MAX_DESCRIPTION_LENGTH, SUBTASK_HEIGHT } from "$lib/utils-right-bar";
	import { onMount } from "svelte";
	import SvgIcon from "../../components/SVGIcon.svelte";

    let isTaskGroupDrodownOpen = false
    let isTasksSettingsDropdownOpen = false
    let maskListGradient = ""
    let contentList: HTMLElement

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
        const hasMenu = isTaskGroupDrodownOpen || isTasksSettingsDropdownOpen || $tasksViewStore!.contextMenuX

        if (hasMenu && event.key === "Escape") {
            isTaskGroupDrodownOpen = false
            isTasksSettingsDropdownOpen = false

            if ($tasksViewStore!.contextMenuY) $tasksViewStore!.closeContextMenu()

            return
        }
        $tasksViewStore!.keyboardShortcutHandler(event)
    }

    /* Tasks */
    function _addNewTaskBtnHandler() {
        $tasksViewStore!.addNewTaskBtnHandler()
    }
    function _taskGroupDropdownHandler(taskGroupIdx: number) {
        isTaskGroupDrodownOpen = false
        $tasksViewStore!.taskGroupDropdownHandler(taskGroupIdx)
    }
    function _tasksSettingsHandler(optionIdx: TaskSettingsOptions) {
        isTasksSettingsDropdownOpen = false
    }

    onMount(() => {
        contentListScrollHandler(contentList)
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} />


<div class={`quick-todos ${$themeState.isDarkTheme ? "quick-todos--dark-theme" : "quick-todos--light-theme"}`}>
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
        <div class="quick-todos__task-group-dropdown-container">
            <ul class={`dropdown-menu ${isTaskGroupDrodownOpen ? "" : "dropdown-menu--hidden"}`} use:clickOutside on:click_outside={() => isTaskGroupDrodownOpen = false}>
                {#each $tasksViewStore?.taskGroups ?? [] as taskGroup, idx}
                    <li class="dropdown-menu__option">
                        <button class="dropdown-element" on:click={() => _taskGroupDropdownHandler(idx)}>
                            <span class="dropdown-menu__option-text">
                                {taskGroup.title}
                            </span>
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
        <div class="quick-todos__tasks-settings-dropdown-container">
            <ul 
                use:clickOutside on:click_outside={() => isTasksSettingsDropdownOpen = false} 
                class={`dropdown-menu ${isTasksSettingsDropdownOpen ? "" : "dropdown-menu--hidden"}`}
            >
                <li class="dropdown-menu__option">
                    <button 
                        class="dropdown-element"
                        on:click={() => _tasksSettingsHandler(TaskSettingsOptions.MAKE_NEW_TASK_GROUP)}
                    >
                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
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
                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
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
                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                            <i class="fa-regular fa-trash-can"></i>
                        </div>
                        <span class="dropdown-menu__option-text">
                            Delete Group
                        </span>
                    </button>
                </li>
            </ul>
        </div>
    </div>
    <!-- Tasks List -->
    <div 
        class={`quick-todos__todo-list-container ${$musicPlayerStore?.doShowPlayer ? "quick-todos__todo-list-container--short" : ""}`}
        style={`-webkit-mask-image: ${maskListGradient}; mask-image: ${maskListGradient};`}
    >
        {#if $tasksViewStore?.tasks}
            <ul class="quick-todos__todo-list" on:scroll={() => contentListScrollHandler(contentList)} bind:this={contentList}>
                <!-- Add Button  -->
                <button class="quick-todos__add-btn" on:click={() => _addNewTaskBtnHandler()}>
                    <span>+</span> Add New Todo
                </button>
                <!-- Task Element  -->
                {#each $tasksViewStore?.tasks as task, taskIdx}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li
                        role="button" tabindex="0" 
                        id={`todo-id--${taskIdx}`}
                        class={`quick-todo 
                                    ${taskIdx === $tasksViewStore?.pickedTaskIdx ? "quick-todo--expanded" : ""} ${task.isFinished ? "quick-todo--checked" : ""}
                                    ${$themeState.isDarkTheme ? "" : "quick-todo--light"}
                                `}
                        style={`height: ${taskIdx === $tasksViewStore?.pickedTaskIdx ? `${$tasksViewStore?.pickedTaskHT}` : `${task.description ? TASK_HEIGHT_MIN_HAS_DESCR : TASK_HEIGHT_MIN_NO_DESCR}`}px;`}
                        on:click={(event) => $tasksViewStore?.onTaskedClicked(event, taskIdx)}  
                        on:contextmenu={(e) => $tasksViewStore?.openMilestoneContextMenu(e, taskIdx)}
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
                                {#if taskIdx === $tasksViewStore?.pickedTaskIdx && $tasksViewStore?.isEditingTitle}
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
                                        class={`quick-todo__title ${task.isFinished ? "strike" : ""} ${task.isFinished && $tasksViewStore?.taskCheckBoxJustChecked === taskIdx ? "strike--animated" : ""}`}
                                    >
                                        {task.title}
                                    </h3>
                                {/if}
                            </div>
                            <!-- Description -->
                            <div 
                                id={`todo-description-id--${taskIdx}`}  class="quick-todo__description-container"
                                style={`line-height: ${TASK_DESCR_LINE_HT}px; ${$tasksViewStore?.pickedTaskDescriptionHT ? `height: ${$tasksViewStore?.pickedTaskDescriptionHT}px` : ""}`}
                            >
                                {#if taskIdx === $tasksViewStore?.pickedTaskIdx && $tasksViewStore?.isEditingDescription}
                                    <textarea
                                        rows="1"
                                        id={`todo-description-input-id--${taskIdx}`}
                                        class="quick-todo__description-text-area"
                                        style={`height: ${$tasksViewStore?.pickedTaskDescriptionHT}px`}
                                        maxlength={MAX_DESCRIPTION_LENGTH}
                                        placeholder={task.description ? "" : "No description"}
                                        value={task.description}
                                        spellcheck={$tasksViewStore?.textAreaHasSpellCheck}
                                        on:focus={(e) => $tasksViewStore?.onInputFocusHandler(e)}
                                        on:keydown={(e) => e.key === "Enter" ? e.preventDefault() : null}
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
                            {#if taskIdx === $tasksViewStore?.pickedTaskIdx}
                                <ul id={`todo-subtasks-id--${taskIdx}`} class="quick-todo__subtasks-list">
                                    {#each task.subtasks as subtask, subtaskIdx}
                                        <li 
                                            class={`quick-todo__subtask 
                                                        ${subtask.isFinished ? "quick-todo__subtask--checked" : ""}
                                                        ${subtaskIdx === $tasksViewStore?.focusedSubtaskIdx ? "quick-todo__subtask--focused" : ""}
                                                        ${$themeState.isDarkTheme ? "" : "quick-todo__subtask--light"}
                                                `} 
                                            style={`height: ${SUBTASK_HEIGHT}px; animation: fade-in 0.3s cubic-bezier(.5,.84,.42,.9) ${(task.subtasks.length <= 5 ? 100 : 30) * subtaskIdx}ms forwards;`}
                                            id={`subtask-idx--${subtaskIdx}`}
                                            use:clickOutside on:click_outside={() => $tasksViewStore?.resetCurrentFocusedSubtaskIdx()}
                                        >
                                            {#if subtaskIdx === 0}
                                                <div 
                                                    class={`quick-todo__subtask-hook-line ${subtaskIdx === 0 ? "quick-todo__subtask-hook-line--first" : ""}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height={`${$tasksViewStore?.hookContainerHT ?? 30}`} viewBox={`0 0 10 ${$tasksViewStore?.hookContainerHT ?? 30}`} fill="none">
                                                        <path 
                                                            d={`M18.5684 ${$tasksViewStore?.hooklineOffset}H9.66992C4.69936 ${$tasksViewStore?.hooklineOffset} 0.669922 ${$tasksViewStore?.hooklineOffset - 4.0294} 0.669922 ${$tasksViewStore?.hooklineOffset - 9}V0.0244141`} stroke-dasharray="1.6 1.6"
                                                        />
                                                    </svg>
                                                </div>
                                            {:else}
                                                <div class="quick-todo__subtask-hook-line">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="31" viewBox="0 0 25 31" fill="none">
                                                        <path d="M16.2188 30.0801H9.66797C4.69741 30.0801 0.667969 26.0506 0.667969 21.0801V0.687744" stroke-dasharray="1.6 1.6"/>
                                                    </svg>
                                                </div>
                                            {/if}
                                            <div class="flx flx--algn-center">
                                                <button class="quick-todo__subtask-checkbox quick-todo__checkbox" on:click={() => $tasksViewStore?.handleSubtaskCheckboxClicked(subtaskIdx)}>
                                                    <i class="fa-solid fa-check checkbox-check"></i>
                                                </button>
                                                {#if $tasksViewStore?.editingSubtaskIdx === subtaskIdx}
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
                                                                ${subtask.isFinished && $tasksViewStore?.subtaskCheckBoxJustChecked === subtaskIdx ? "strike--animated" : ""}
                                                        `}
                                                        on:click={() => $tasksViewStore?.onSubtaskTitleClicked(subtaskIdx)}
                                                    >
                                                        {subtask.title}
                                                    </span>
                                                {/if}
                                            </div>                                                
                                            <button 
                                                class="quick-todo__subtask-settings-btn settings-btn" 
                                                on:click={(e) => $tasksViewStore?.openMilestoneContextMenu(e, taskIdx, subtaskIdx)}
                                            >
                                                <SvgIcon icon={Icon.Settings}/>
                                            </button>
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
    <!-- Context Menu -->
    <ul 
        use:clickOutside on:click_outside={() => $tasksViewStore?.closeContextMenu()} 
        class={`quick-todos__context-menu dropdown-menu ${$tasksViewStore?.isContextMenuOpen ? "" : "dropdown-menu--hidden"}`}
        style={`left: ${$tasksViewStore?.contextMenuX}px; top: ${$tasksViewStore?.contextMenuY}px`}
    >
        {#if $tasksViewStore?.rightClickedTask}
            <li class="dropdown-menu__option">
                <button 
                        class="dropdown-element" 
                        on:click={() => $tasksViewStore?.contextMenuHandler(ContextMenuOption.ADD_SUBTASK)}
                >
                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                        <i class="fa-solid fa-list-check"></i>
                    </div>
                    <span class="dropdown-menu__option-text">
                        Add Subtask
                    </span>
                    <div class="dropdown-menu__option-icon quick-todos__context-menu-command">
                        <span>⌘</span>
                        <span class="quick-todos__context-menu-command--plus">+</span>
                    </div>
                </button>
            </li>
            <li class="dropdown-menu__option">
                <button 
                        class="dropdown-element" 
                        on:click={() => $tasksViewStore?.contextMenuHandler(ContextMenuOption.DELETE_TASK)}
                >
                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                        <i class="fa-regular fa-trash-can"></i>
                    </div>
                    <span class="dropdown-menu__option-text">
                        Delete Task
                    </span>
                    <div class="dropdown-menu__option-icon quick-todos__context-menu-command">
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
                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                        <i class="fa-regular fa-trash-can"></i>
                    </div>
                    <span class="dropdown-menu__option-text">
                        Delete Subtask
                    </span>
                    <div class="dropdown-menu__option-icon quick-todos__context-menu-command">
                        <span>⌘</span><span>⌫</span>
                    </div>
                </button>
            </li>
        {/if}
    </ul>
</div>


<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/inputs.scss";

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

        &--dark-theme .dropdown-menu {
            @include dropdown-menu-dark;
        }
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
        &__task-group-dropdown-container {
            @include pos-abs-bottom-left-corner(-5px, 15px);
        }
        &__tasks-settings-dropdown-container {
            @include pos-abs-top-right-corner(30px, 150px);
        }
        &__tasks-settings-dropdown-container .dropdown-menu {
            &__option-icon {
                margin-right: 8px;
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
    .quick-todo {
        @include flex(flex-start, _);
        outline: none;
        padding: 3px 0px 0px 0px;
        cursor: pointer;
        overflow: hidden;
        transition: height 0.4s cubic-bezier(.1,.84,.42,.95);
        width: 100%;
        border-top: 0.5px solid transparent;
        border-bottom: 0.5px solid transparent;

        &--light {
            border: none !important;
        }
        &--light &__title-container {
            h3, input {
                color: rgba(var(--textColor1), 0.8);
                font-weight: 500;
            }
        }
        &--light &__description, &--light &__description-text-area {
            font-size: 1.1rem;
            font-weight: 500;
            color: rgba(var(--textColor1), 0.6);
        }
        &--light &__checkbox {
            border-width: 1.5px;
        }
        
        &:not(:last-child) {
            margin-bottom: 3px;
        }
        &:last-child {
            margin-bottom: 100px;
        }
        &:hover, &:focus, &--selected {
            background-color: var(--sidePanelLightAccentColor);
            border-color: rgb(var(--textColor1), 0.015);

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
            background-color: var(--tasksCheckBoxColorComplete);

            i {
                display: block;
            }
        }
        &--checked  &__title-container h3 {
            color: var(--tasksLightTextColor);
        }
        &--checked &__title.strike::after {
            background-color: var(--tasksLightTextColor);
        }

        &__left {
            width: 18%;
        }
        &__right {
            width: calc(100% - 18%);
        }
        &__checkbox {
            @include circle(12px);
            @include center;
            transition: 0.1s ease-in-out;
            border: 1px solid rgba(var(--tasksCheckBoxColorDefault), 1);
            margin: 3px 10px 0px $side-padding;
            cursor: pointer;

            i {
                margin-top: 1px;
                font-size: 0.8rem;
                color: var(--tasksCheckColor);
                display: none;
            }
            &:focus {
                background-color: rgba(var(--tasksCheckBoxColorDefault), 0.3);
            }
            &:hover {
                background-color: rgba(var(--tasksCheckBoxColorDefault), 0.3);
            }
            &:active {
                transform: scale(0.92);
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
            color: rgba(var(--textColor1), 0.3);
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
            @include flex(center, space-between);
            position: relative;
            visibility: hidden;
            transition: 0.12s ease-in-out;

            &--light &-title, &--light &-title-input {
                font-weight: 500;
                color: rgba(var(--textColor1), 0.6);
            }
            &--light &-settings-btn {
                &:hover {
                    opacity: 0.7 !important;
                }
            }
            
            &:hover &-settings-btn {
                opacity: 0.1;
                visibility: visible;
            }
            &:not(:last-child) {
                margin-bottom: 8px;
            }

            &:hover &-title, &--focused &-title {
                color: rgba(var(--tasksSubtaskFocusColor));
            }
            &:hover &-title.strike::after, &--focused &-title.strike::after {
                background-color: rgba(var(--tasksSubtaskFocusColor));
            }
            &--checked &-checkbox {
                border-color: transparent;
                background-color: var(--tasksCheckBoxColorComplete);

                i {
                    display: block;
                }
            }
            &--checked  &-title {
                color: var(--tasksLightTextColor);
            }
            &--checked &-title.strike::after {
                background-color: var(--tasksLightTextColor);
            }

            &-hook-line {
                @include pos-abs-bottom-left-corner(3px, -18.5px);
                
                &--first {
                    @include pos-abs-bottom-left-corner(3px, -26px);
                }
                svg {
                    stroke: $color-a;
                }
            }
            &-checkbox {
                margin: 0px 9px 0px 0px;
                @include circle(11px);
            }
            &-title {
                display: inline-block;
                transition: 0.1s ease-in-out;
                cursor: pointer;
            }
            &-title-input {
                width: 100%;
                cursor: text;

                &::placeholder {
                    opacity: 0.2;
                }
            }
            &-title, &-title-input {
                font-weight: 300;
                font-size: 1.215rem;
                color: rgba(var(--textColor1), 0.2);
            }
            &-title.strike::after {
                background-color: rgba(var(--textColor1), 0.2);
            }
            &-settings-btn {
                margin: -2px 10px 0px 0px;
                opacity: 0;
                visibility: hidden;

                &:hover {
                    opacity: 0.4 !important;
                    background-color: rgb(var(--textColor1), 0.1);
                }
            }
        }
    }
</style>