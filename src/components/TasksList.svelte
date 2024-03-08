<script lang="ts">
	import { themeState } from "$lib/store"
	import { TasksListManager } from "$lib/tasks-list-manager"
	import { clickOutside, getMaskedGradientStyle } from "$lib/utils-general"
	import { onMount } from "svelte"
	import SvgIcon from "./SVGIcon.svelte"
	import { ContextMenuOption, Icon } from "$lib/enums"
	import DropdownList from "./DropdownList.svelte";

    export let options: TaskListOptionsInterface

    const manager = new TasksListManager(options).state
    const types   = $manager.types
    const { 
        TASK_HEIGHT_MIN_NO_DESCR, TASK_HEIGHT_MIN_HAS_DESCR,
        TASK_DESCR_LINE_HT, MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH, SUBTASK_HEIGHT
    } = $manager
        
    let tasksListElem: HTMLUListElement
    let maskListGradient = ""

    $: isDarkTheme = $themeState.isDarkTheme

    function contentListScrollHandler(contentList: HTMLElement) {
        maskListGradient = getMaskedGradientStyle(contentList).styling
    }
    function keyboardShortcutsHandler(event: KeyboardEvent) {
        $manager.keyboardShortcutHandler(event)
    }

    onMount(() => {
        $manager.initListContainer(tasksListElem)
    })
</script>

<svelte:window on:keydown={(e) => keyboardShortcutsHandler(e)} /> 

<ul 
    class="tasks" 
    class:tasks--dragging-state={$manager.floatingTask}
    style={`-webkit-mask-image: ${maskListGradient}; mask-image: ${maskListGradient};`}
    on:scroll={() => contentListScrollHandler(tasksListElem)} bind:this={tasksListElem}
    on:mousemove={$manager.onMouseMove}
    on:mouseup={$manager.onTaskListMouseUp}
>
    <!-- Add Button  -->
    <!-- <button class="quick-todos__add-btn" on:click={() => _addNewTaskBtnHandler()}>
        <span>+</span> Add New Todo
    </button> -->

    <!-- Task Item -->
    {#each $manager.tasks as task, taskIdx (task.idx)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li
            role="button" tabindex="0" 
            id={`task-id--${taskIdx}`}
            class="task"
            class:task--expanded={taskIdx === $manager.pickedTaskIdx}
            class:task--light={!isDarkTheme}
            class:task--checked={task.isChecked}
            class:task--not-animated={$manager.floatingTask}
            style={`height: ${taskIdx === $manager.pickedTaskIdx ? $manager.pickedTaskHT : task.description ? TASK_HEIGHT_MIN_HAS_DESCR : TASK_HEIGHT_MIN_NO_DESCR}px`}
            on:click={(event) => $manager.onTaskedClicked(event, taskIdx)}
            on:mousedown={$manager.onTaskMouseDown}
            on:contextmenu={(e) => $manager.openContextMenu(e, taskIdx)}

        >
            <!-- CheckBox  -->
            <div class="task__left">
                <button class="task__checkbox" on:click={() => $manager.handleTaskCheckboxClicked(taskIdx)}>
                    <i class="fa-solid fa-check checkbox-check"></i>
                </button>
            </div>
            <!-- Content -->
            <div class="task__right">
                <!-- Title -->
                <div class="task__title-container">
                    {#if taskIdx === $manager.pickedTaskIdx && $manager.isEditingTitle}
                        <input 
                            type="text" 
                            name="title-input" 
                            id={`task-title-id--${taskIdx}`} 
                            value={`${task.title}`} 
                            maxlength={MAX_TITLE_LENGTH}
                            class="task__title-input"
                            placeholder="New Task"
                            on:input={(e) => $manager.inputTextHandler(e)}
                            on:focus={(e) => $manager.onInputFocusHandler(e)}
                            on:blur={(e) => $manager.onInputBlurHandler(e)}
                        >
                    {:else}
                        <h3 
                            on:click={() => $manager.onTaskTitleClicked(taskIdx)} 
                            class={`task__title ${task.isChecked ? "strike" : ""} ${task.isChecked && $manager.taskCheckBoxJustChecked === taskIdx ? "strike--animated" : ""}`}
                        >
                            {task.title}
                        </h3>
                    {/if}
                </div>
                <!-- Description -->
                <div 
                    class="task__description-container" id={`task-description-id--${taskIdx}`}
                    style={`${$manager.pickedTaskDescriptionHT ? `height: ${$manager.pickedTaskDescriptionHT}px` : ""}`}
                    style:line-height={`${TASK_DESCR_LINE_HT}px`}
                >
                    {#if taskIdx === $manager.pickedTaskIdx && $manager.isTextAreaActive}
                        <textarea
                            rows="1"
                            id={`task-description-input-id--${taskIdx}`}
                            class="task__description-text-area"
                            style:height="auto"
                            maxlength={MAX_DESCRIPTION_LENGTH}
                            placeholder={task.description ? "" : "No description"}
                            spellcheck={$manager.textAreaHasSpellCheck}
                            bind:value={task.description}
                            on:focus={(e) => $manager.onInputFocusHandler(e)}
                            on:keydown={(e) => e.key === "Enter" ? e.preventDefault() : null}
                            on:input={(e) => $manager.inputTextHandler(e)}
                            on:blur={(e) => $manager.onInputBlurHandler(e)}
                        />
                    {:else}
                        <p class="task__description">
                            {task.description}
                        </p>
                    {/if}
                </div>
                <!-- Subtasks -->
                {#if taskIdx === $manager.pickedTaskIdx}
                    <ul class="task__subtasks-list" id={`task-subtasks-id--${taskIdx}`}>
                        {#each task.subtasks as subtask, subtaskIdx}
                            <li 
                                class="subtask"
                                class:subtask--checked={subtask.isChecked}
                                class:subtask--focused={subtaskIdx === $manager.focusedSubtaskIdx}
                                class:subtask--light={!isDarkTheme}
                                style:height={`${SUBTASK_HEIGHT}px`}
                                style:--subtak-idx-delay={`${30 * subtaskIdx}ms`}
                                id={`subtask-idx--${subtaskIdx}`}
                                use:clickOutside on:click_outside={() => $manager.resetCurrentFocusedSubtaskIdx()}
                            >
                                <!-- Links -->
                                {#if types["subtasks-linked"] && subtaskIdx === 0}
                                    <div class="subtask__hook-line" class:subtask__hook-line--first={subtaskIdx === 0}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height={`${$manager.hookContainerHT}`} viewBox={`0 0 10 ${$manager.hookContainerHT}`} fill="none">
                                            <path 
                                                d={`M18.5684 ${$manager.hooklineOffset}H9.66992C4.69936 ${$manager.hooklineOffset} 0.669922 ${$manager.hooklineOffset - 4.0294} 0.669922 ${$manager.hooklineOffset - 9}V0.0244141`} stroke-dasharray="1.6 1.6"
                                            />
                                        </svg>
                                    </div>
                                {:else if types["subtasks-linked"] }
                                    <div class="subtask__hook-line">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="31" viewBox="0 0 25 31" fill="none">
                                            <path d="M16.2188 30.0801H9.66797C4.69741 30.0801 0.667969 26.0506 0.667969 21.0801V0.687744" stroke-dasharray="1.6 1.6"/>
                                        </svg>
                                    </div>
                                {/if}
                                <!-- Main Content -->
                                <div class="flx-algn-center">
                                    <button class="subtask__checkbox task__checkbox" on:click={() => $manager.handleSubtaskCheckboxClicked(subtaskIdx)}>
                                        <i class="fa-solid fa-check checkbox-check"></i>
                                    </button>
                                    {#if $manager.editingSubtaskIdx === subtaskIdx}
                                        <input 
                                            type="text" 
                                            id={`task-subtask-title-id--${subtaskIdx}`} 
                                            value={`${subtask.title}`} 
                                            maxlength={MAX_TITLE_LENGTH}
                                            placeholder={`${subtask.title === "" ? "New Subtask" : ""}`}
                                            class="subtask__title-input"
                                            on:input={(e) => $manager.inputTextHandler(e)}
                                            on:focus={(e) => $manager.onInputFocusHandler(e)}
                                            on:blur={(e) => $manager.onInputBlurHandler(e)}
                                        >
                                    {:else}
                                        <span 
                                            class="subtask__title"
                                            class:strike={subtask.isChecked }
                                            class:strike--animated={subtask.isChecked && $manager.subtaskCheckBoxJustChecked === subtaskIdx}
                                            on:click={() => $manager.onSubtaskTitleClicked(subtaskIdx)}
                                        >
                                            {subtask.title}
                                        </span>
                                    {/if}
                                </div>                                                
                                <button 
                                    class="subtask__settings-btn settings-btn"
                                    on:click={(e) => $manager.openContextMenu(e, taskIdx, subtaskIdx)}
                                >
                                    <SvgIcon icon={Icon.Settings}/>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
            <!-- Drag Handle -->
            {#if types["flexible"]}
                <div class="task__drag-handle">
                    <div class="task__drag-handle-dots">
                        <SvgIcon icon={Icon.DragDots} options={{ scale: 0.8 }}/>
                    </div>
                </div>
            {/if}
        </li>
    {/each}
    <!-- Dragging Task -->
    {#if $manager.floatingTask && $manager.floatingTaskOffset}
        {@const task = $manager.floatingTask}
        <li
            id={`floating-task-id--${task.idx}`}
            class="task task--floating"
            class:task--light={!isDarkTheme}
            class:task--checked={task.isChecked}
            style={`height: ${task.description ? TASK_HEIGHT_MIN_HAS_DESCR : TASK_HEIGHT_MIN_NO_DESCR}px`}
            style:top={`${$manager.floatingTaskOffset.top}px`}
            style:left={`${$manager.floatingTaskOffset.left}px`}
        >
            <div class="task__left">
                <button class="task__checkbox">
                    <i class="fa-solid fa-check checkbox-check"></i>
                </button>
            </div>
            <div class="task__right">
                <div class="task__title-container">
                    <h3 class={`task__title ${task.isChecked ? "strike" : ""}`}>
                        {task.title}
                    </h3>
                </div>
                <div class="task__description-container">
                    <p class="task__description">
                        {task.description}
                    </p>
                </div>
            </div>
        </li>
    {/if}
    <!-- Dummy Task -->
    <li class="task task--dummy" id={`task--${$manager.tasks.length}`}></li>
     <!-- Context Menu -->
    <DropdownList
        isHidden={!$manager.isContextMenuOpen} 
        options={{
            listItems: $manager.rightClickedTask ? 
            [{ name: "Rename" }, { name: "Add Subtask" }, { name: "Delete Task" }] : 
            [{ name: "Rename" }, { name: "Delete Subtask" }],
            onListItemClicked: (idx) => $manager.contextMenuOptionClickedHandler(idx),
            onClickOutside:    $manager.onContextMenuClickedOutsideHandler,
            position:          { top: $manager.contextMenuY + "px", left: $manager.contextMenuX + "px" },
            width:             options.contextMenuOptions.width
        }}
    />
</ul>

<style lang="scss">
    @import "../scss/inputs.scss";

    $side-padding: 18px;
    $color-a: rgba(var(--textColor1), 0.15);

    .tasks {
        position: relative;

        &--dragging-state * {
            user-select: none;
            cursor: grabbing !important; 
        }
    }
    .task {
        @include flex(flex-start, _);
        outline: none;
        padding: 5px 0px 0px 0px;
        cursor: pointer;
        // overflow: hidden;
        width: 100%;
        border-top: 0.5px solid transparent;
        border-bottom: 0.5px solid transparent;
        transition: height 0.2s cubic-bezier(.1,.84,.42,.95);

        * {
            user-select: none;
        }
        
        &--not-animated {
            transition: 0s;
        }
        &--light {
            border: none !important;
        }
        &--light &__title-container {
            h3, input {
                @include text-style(0.8, 500)
            }
        }
        &--light &__description, &--light &__description-text-area {
            @include text-style(0.6, 500, 1.1rem)
        }
        &--light &__checkbox {
            border-width: 1.5px;
        }
        
        &:not(:last-child) {
            margin-bottom: 3px;
        }
        &:hover, &:focus, &--selected, &--drag-over {
            background-color: var(--sidePanelLightAccentColor);
            @include txt-color(0.015, "border");
        }
        &:hover {
            user-select: auto;
        }
        &--expanded {
            padding-top: 6px;
        }
        &--expanded &__description-container {
            padding-top: 4px;
        }
        &--expanded &__description {
            display: flex;
            max-height: fit-content;
        }
        &--expanded &__drag-handle {
            @include visible(0.8);
        }
        &--expanded .subtask {
            opacity: 1;
        }
        &--checked &__left &__checkbox {
            border-color: transparent;
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
        &--drag-over {
            border-top: 1px solid rgba(var(--textColor1), 0.1);
        }
        &--floating {
            position: absolute;
            padding-top: 5px;
            margin-bottom: 0px !important;
            background-color: #171617;
            border-radius: 12px;
            width: 180px;
        }
        &--floating &__left {
            @include center;
            width: 45px;
        }
        &--floating:hover {
            background-color: #171617 !important;
        }
        &--dummy {
            height: 50px;
            background: transparent !important;
            border-bottom-color: transparent !important;
        }
        &--dummy:hover {
            border-top-color: 1px solid transparent;
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
            cursor: pointer;
            border: 1px solid rgba(var(--tasksCheckBoxColorDefault), 1);
            margin: 3px 10px 0px $side-padding;

            i {
                margin-top: 1px;
                font-size: 0.8rem;
                display: none;
                margin-top: 1px;
                color: var(--tasksCheckColor);
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
            width: fit-content;
            
            h3, input {
                display: inline-block;
                @include text-style(_, 200, 1.3rem);
                cursor: text;
            }
        }
        &__title {
        }
        &__title-input::placeholder {
            opacity: 0.2;
        }
        &__description-container {
            width: fit-content;
        }
        &__description, &__description-text-area {
            @include text-style(0.3, 300, 1.215rem);
            width: 100%;
            padding-right: 8px;
        }
        &__description {
            max-height: 16px;
            width: fit-content;
            cursor: text;
            overflow: hidden;
            white-space: pre-wrap;
            word-break: break-word;
            @include multi-line-elipses-overflow(1);
        }
        &__description-text-area {
        }
        &__description-text-area::placeholder {
            opacity: 0.3;
        }
        &__subtasks-list {
            padding: 7px 0px 2px 0px;
        }
        &__drag-handle {
            cursor: grab;
            @include pos-abs-top-left-corner(50%, 0px);
            @include not-visible;
        }
        &__drag-handle-dots {
            opacity: 0.1;
        }
    }
    .subtask {
        @include flex(center, space-between);
        position: relative;
        visibility: hidden;
        transition: 0.12s ease-in-out;
        width: 100%;
        animation: fade-in 0.22s cubic-bezier(.5,.84,.42,.9) var(--subtak-idx-delay) forwards;

        &:hover &__settings-btn {
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
        &--light &__title, &--light &__title-input {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.6);
        }
        &--light &__settings-btn:hover {
            opacity: 0.7 !important;
        }
        &--checked &__checkbox i {
            display: block;
        }
        &--checked &__checkbox {
            border-color: transparent;
            background-color: var(--tasksCheckBoxColorComplete);

            i {
                display: block;
            }
        }
        &--checked  &__title {
            color: var(--tasksLightTextColor);
        }
        &--checked &__title.strike::after {
            background-color: var(--tasksLightTextColor);
        }
        &__hook-line {
            @include pos-abs-bottom-left-corner(3px, -18.5px);
            &--first {
                @include pos-abs-bottom-left-corner(4px, -26px);
            }
            svg {
                stroke: $color-a;
            }
        }
        &__checkbox {
            margin: 0px 9px 0px 0px;
            // @include circle(11px);
        }
        &__title {
            display: inline-block;
            transition: 0.1s ease-in-out;
            max-width: 80%;
            @include elipses-overflow;
            cursor: pointer;
        }
        &__title-input {
            width: 100%;
            cursor: text;

            &::placeholder {
                opacity: 0.2;
            }
        }
        &__title, &__title-input {
            @include text-style(0.2, 300, 1.215rem);
        }
        &__title.strike::after {
            background-color: rgba(var(--textColor1), 0.2);
        }
        &__settings-btn {
            margin: -2px 10px 0px 0px;
            opacity: 0;
            visibility: hidden;

            &:hover {
                opacity: 0.4 !important;
                background-color: rgb(var(--textColor1), 0.1);
            }
        }
    }
</style>