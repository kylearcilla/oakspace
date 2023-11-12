<script lang="ts">
	import { formatDatetoStr, formatTimeToHHMM, getUserHourCycle, isNightTime } from "$lib/utils-date";
    import { tasks } from "$lib/utils-right-bar";
	import { onDestroy, onMount } from "svelte";

    enum TAB { 
        TASKS, RECENT_ACTIVITY 
    }
    type Task = {
        title: string,
        subtasks: { title: string, isFinished: boolean }[],
        description: string | null,
        isFinished: boolean
    }
    
    let selectedTab: TAB = TAB.TASKS

    let currentTimeStr = ""
    let isDayTime = true
    let doUse12HourFormat = false
    let interval: NodeJS.Timer | null = null
    
    let flag = true
    
    let pickedTask: Task | null = null
    let pickedTaskIdx = -1
    let pickedTaskHT: number = 0
    let pickedTaskDescriptionHT = 0
    
    let hookContainerHT: number = 0
    let hooklineOffset = 0
    let isMakingNewTask = false  // TODO, add new task, if ENTER / BLURRED then delete it if it's empty

    let titleInputTextContainer: HTMLElement | null = null
    let isEditingTitle = false
    let isEditingDescription = false

    let newTaskTitle = ""
    let newTaskDescription = ""
    let editingSubtaskIdx = -1
    let newSubtaskTitle = ""
    let hasInputBlurred = false
    
    const TASK_DESCR_LINE_HT = 15
    const TASK_BOTTOM_PADDING = 7
    const SUBTASK_HEIGHT = 15

    const TASK_HEIGHT_MIN_NO_DESCR = 28
    const TASK_HEIGHT_MIN_HAS_DESCR = TASK_HEIGHT_MIN_NO_DESCR + TASK_DESCR_LINE_HT

    const MAX_TITLE_LENGTH = 25
    const MAX_DESCRIPTION_LENGTH = 300

    /* UI Handlers */
    const onTaskTitleClicked = (taskIdx: number) => {
        highlightTask(taskIdx)
        toggleTaskTitleInput()
    }

    const onTaskedClicked = (event: Event, taskIdx: number) => {
        if (window.getSelection()?.toString()) return

        const target = event.target as HTMLElement
        const targetClass = target.classList.value
        
        if (["INPUT", "TEXTAREA", "H3"].includes(target.tagName) || targetClass.includes("checkbox")) { 
            hasInputBlurred = false
            return
        }
        if (hasInputBlurred) {
            hasInputBlurred = false
        }
        else if (taskIdx === pickedTaskIdx) {
            removeHighlightedTask()
        }
        else {
            removeHighlightedTask()
            highlightTask(taskIdx)
        }
    }
    const handleTaskCheckboxClicked = (taskIdx: number) => {
        tasks[taskIdx].isFinished = !tasks[taskIdx].isFinished
    }
    const handleSubtaskCheckboxClicked = (subtaskIdx: number) => {
        tasks[pickedTaskIdx].subtasks[subtaskIdx].isFinished = !tasks[pickedTaskIdx].subtasks[subtaskIdx].isFinished
    }
    function toggleTaskTitleInput() {
        isEditingTitle = true
        newTaskTitle = tasks[pickedTaskIdx].title

        requestAnimationFrame(() => { 
            const inputTitleElem = document.getElementById(`todo-title-id--${pickedTaskIdx}`) as HTMLInputElement
            inputTitleElem.focus()
        })
    }
    function removeHighlightedTask() {
        isEditingTitle = false
        isEditingDescription = false
        pickedTaskIdx = -1

        pickedTaskDescriptionHT = 0
        pickedTaskHT = 0
    }
    function toggleTextArea() {
        requestAnimationFrame(() => {
            newTaskDescription = tasks[pickedTaskIdx].description
            isEditingDescription = true
        })
    }
    function taskTitleInputHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        newTaskTitle = inputElem.value
    }
    function taskDescriptionInputHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        newTaskDescription = inputElem.value
    }
    function subtaskTitleInputHandler(event: Event) {
        const inputElem = event.target as HTMLInputElement
        newSubtaskTitle = inputElem.value
    }
    /* Editing Task */
    const saveNewTitle = (doSave = true) => {
        if (doSave && newTaskTitle) {
            tasks[pickedTaskIdx].title = newTaskTitle
        }

        newTaskTitle = ""
        hasInputBlurred = true
    }
    const saveNewDescription = (doSave = true) => {
        if (doSave && newTaskDescription) {
            tasks[pickedTaskIdx].description = newTaskDescription
        }
        newTaskDescription = ""
        hasInputBlurred = true
    }
    const saveNewSubtask = (doSave = true) => {
        if (doSave && newSubtaskTitle) {
            tasks[pickedTaskIdx].subtasks[editingSubtaskIdx].title = newSubtaskTitle
        }

        editingSubtaskIdx = -1
        newSubtaskTitle = ""
        hasInputBlurred = true
    }

    const highlightTask = (taskIdx: number) => {
        pickedTaskIdx = taskIdx

        requestAnimationFrame(() => {
            let minTaskHeight = TASK_HEIGHT_MIN_NO_DESCR

            let subtasksHeight = 0
            let subtasksTopPadding = 0
            
            // Description
            if (tasks[taskIdx].description) {
                const descriptionElement = document.getElementById(`todo-description-id--${taskIdx}`) as HTMLElement
                pickedTaskDescriptionHT = descriptionElement.clientHeight
            }

            // Subtasks
            if (tasks[taskIdx].subtasks.length > 0) {
                const subtasksListElement = document.getElementById(`todo-subtasks-id--${taskIdx}`) as HTMLElement
                
                subtasksHeight = subtasksListElement.clientHeight + subtasksTopPadding
                subtasksTopPadding = parseInt(getComputedStyle(subtasksListElement).getPropertyValue('padding-top'))

                hookContainerHT = pickedTaskDescriptionHT + subtasksTopPadding + SUBTASK_HEIGHT / 2 + 4
                hooklineOffset = hookContainerHT
            }

            const totalHt = pickedTaskDescriptionHT + subtasksHeight + minTaskHeight
            const taskElement = document.getElementById(`todo-id--${taskIdx}`) as HTMLElement
            const isSameHt = taskElement.clientHeight === totalHt

            pickedTaskHT = isSameHt ? totalHt : totalHt + TASK_BOTTOM_PADDING
        })

        requestAnimationFrame(() => toggleTextArea())
    }

    /* Time Stuff*/
    const updateTimeStr = () => {
        currentTimeStr = formatTimeToHHMM(new Date(), doUse12HourFormat)
        isDayTime = !isNightTime()
    }
    const toggleTimeFormatting = () => {
        doUse12HourFormat = !doUse12HourFormat 
        updateTimeStr()
    }
    const initDateTimer = () => {
        interval = setInterval(updateTimeStr, 1000)
    }
    function textAreOnKeyDown(event: KeyboardEvent) {
        if (event.key != "Enter") return
        event.preventDefault()
    }
    function keyboardShortcutsHandler(event: KeyboardEvent) {
        const target = event.target as HTMLElement

        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return
        if (event.key !== "Enter" && event.key !== "Escape") return

        const targetClass = target.classList.value

        if (targetClass.includes("subtask")) {
            saveNewSubtask(event.key === "Enter")
        }
        else if (targetClass.includes("title")) {
            saveNewTitle(event.key === "Enter")
        }
        else {
            saveNewDescription(event.key === "Enter")
        }
        
        target.blur()
        hasInputBlurred = false
    }

    onMount(() => {
        const hourCycle = getUserHourCycle()
        doUse12HourFormat = hourCycle === "h12" || hourCycle === "h11"
        updateTimeStr()
        initDateTimer()
    })
    onDestroy(() => {
        clearInterval(interval!)
    })
</script>

<svelte:window on:keydown={keyboardShortcutsHandler} />

<div class="task-view">
    <div class="task-view__header task-view__header--default"> 
        <!-- Header -->
        <img class="task-view__header-img" src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/287d3559037917.5a130f45904d5.gif" alt="">
        <div class="task-view__header-top">
            <button class="task-view__header-time" title={currentTimeStr} on:click={toggleTimeFormatting}>
                <h1>
                    {currentTimeStr}
                </h1>
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
            on:click={() => selectedTab = TAB.TASKS}
            class={`task-view__tab-btn ${selectedTab === TAB.TASKS ? "task-view__tab-btn--selected" : ""}`}
        >
            Tasks            
        </button>
        <button 
            on:click={() => selectedTab = TAB.RECENT_ACTIVITY}
            class={`task-view__tab-btn ${selectedTab === TAB.RECENT_ACTIVITY ? "task-view__tab-btn--selected" : ""}`}
        >
            Recent Activity
        </button>
    </div>
    <div class="task-view__main-content">
        <!-- Tasks Section -->
        <div class="quick-todos">
            <!-- Header -->
            <div class="quick-todos__header">
                <h1 title="SWE">SWE</h1>
                <button class="task-view__settings-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18">
                        <g fill="currentcolor" stroke="currentColor" stroke-linecap="round" transform="translate(0 8.5)">
                            <circle cx="2" cy="0.8" r="0.8"></circle>
                            <circle cx="7" cy="0.8" r="0.8"></circle>
                            <circle cx="12" cy="0.8" r="0.8"></circle>
                        </g>
                    </svg>
                </button>
            </div>
            <!-- Tasks List -->
            <ul class="quick-todos__todo-list">
                <!-- Task Element  -->
                <button class="quick-todos__add-btn">
                    <span>+</span> Add New Todo
                </button>
                {#each tasks as task, taskIdx}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        role="button" tabindex="0" 
                        on:click={(event) => onTaskedClicked(event, taskIdx)}  
                        id={`todo-id--${taskIdx}`}
                        class={`quick-todo ${taskIdx === pickedTaskIdx ? "quick-todo--expanded" : ""} ${task.isFinished ? "quick-todo--checked" : ""}`}
                        style={`height: ${taskIdx === pickedTaskIdx ? `${pickedTaskHT ?? 100}` : `${task.description ? TASK_HEIGHT_MIN_HAS_DESCR : TASK_HEIGHT_MIN_NO_DESCR}`}px;`}
                    >
                        <!-- Left Side  -->
                        <div class="quick-todo__left">
                            <button class="quick-todo__checkbox" on:click={() => handleTaskCheckboxClicked(taskIdx)}>
                                <i class="fa-solid fa-check checkbox-check"></i>
                            </button>
                        </div>
                        <!-- Right Side  -->
                        <div class="quick-todo__right">
                            <!-- Title -->
                            <div class="quick-todo__title-container">
                                {#if taskIdx === pickedTaskIdx && isEditingTitle}
                                    <input 
                                        type="text" 
                                        name="title-input" 
                                        id={`todo-title-id--${taskIdx}`} 
                                        value={`${task.title}`} 
                                        maxlength={MAX_TITLE_LENGTH}
                                        class="quick-todo__title-input"
                                        on:input={taskTitleInputHandler}
                                        on:blur={() => saveNewTitle()}
                                    >
                                {:else}
                                    <h3 
                                        on:click={() => onTaskTitleClicked(taskIdx)} 
                                        class={`quick-todo__title ${task.isFinished ? "strike" : ""}`}
                                    >
                                        {task.title}
                                    </h3>
                                {/if}
                            </div>
                            <!-- Description -->
                            {#if task.description}
                                <div 
                                    id={`todo-description-id--${taskIdx}`}  class="quick-todo__description-container"
                                    style={`line-height: ${TASK_DESCR_LINE_HT}px; ${pickedTaskDescriptionHT ? `height: ${pickedTaskDescriptionHT}px` : ""}`}
                                >
                                {#if taskIdx === pickedTaskIdx && isEditingDescription}
                                    <textarea 
                                        rows="1"
                                        id={`todo-description-id--${taskIdx}`}
                                        class="quick-todo__description-text-area"
                                        value={task.description}
                                        style={`height: ${pickedTaskDescriptionHT}px`}
                                        maxlength={MAX_DESCRIPTION_LENGTH}
                                        on:keydown={textAreOnKeyDown}
                                        on:input={taskDescriptionInputHandler}
                                        on:blur={() => saveNewDescription()}
                                    />
                                {:else}
                                    <p class="quick-todo__description">
                                        {task.description}
                                    </p>
                                {/if}
                                </div>
                            {/if}
                            <!-- Subtasks -->
                            {#if taskIdx === pickedTaskIdx}
                                <ul id={`todo-subtasks-id--${taskIdx}`} class="quick-todo__subtasks-list">
                                    {#each task.subtasks as subtask, subtaskIdx}
                                        <div 
                                            class={`quick-todo__subtask ${subtask.isFinished ? "quick-todo__subtask--checked" : ""}`} 
                                            style={`height: ${SUBTASK_HEIGHT}px; animation: fade-in 0.3s cubic-bezier(.5,.84,.42,.9) ${(task.subtasks.length <= 5 ? 100 : 30) * subtaskIdx}ms forwards;`}
                                        >
                                        {#if subtaskIdx === 0}
                                            <div 
                                                class={`quick-todo__subtask-hook-line ${subtaskIdx === 0 ? "quick-todo__subtask-hook-line--first" : ""}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="23" height={`${hookContainerHT ?? 30}`} viewBox={`0 0 10 ${hookContainerHT ?? 30}`} fill="none">
                                                    <path d={`M18.5684 ${hooklineOffset + 0.0244}H9.66992C4.69936 ${hooklineOffset + 0.0244} 0.669922 ${hooklineOffset + 0.0244 - 4.0294} 0.669922 ${hooklineOffset + 0.0244 - 9}V0.0244141`} stroke-dasharray="1.6 1.6"/>
                                                </svg>
                                            </div>
                                        {:else}
                                            <div class="quick-todo__subtask-hook-line">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="31" viewBox="0 0 16 31" fill="none">
                                                    <path d="M15.2188 30.0801H9.66797C4.69741 30.0801 0.667969 26.0506 0.667969 21.0801V0.687744" stroke-dasharray="1.6 1.6"/>
                                                </svg>
                                            </div>
                                        {/if}
                                            <button class="quick-todo__subtask-checkbox quick-todo__checkbox" on:click={() => handleSubtaskCheckboxClicked(subtaskIdx)}>
                                                <i class="fa-solid fa-check checkbox-check"></i>
                                            </button>
                                            <input 
                                                type="text" 
                                                id={`todo-subtask-title-id--${subtaskIdx}`} 
                                                value={`${subtask.title}`} 
                                                maxlength={MAX_TITLE_LENGTH}
                                                class="quick-todo__subtask-title-input strike"
                                                on:input={subtaskTitleInputHandler}
                                                on:blur={() => saveNewSubtask()}
                                                on:click={() => editingSubtaskIdx = subtaskIdx}
                                            >
                                        </div>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    </div>
                {/each}
            </ul>
        </div>
    </div>
</div>

<style lang="scss">
    $side-padding: 18px;
    $color-a: rgba(var(--textColor1), 0.15);
    $todo-minimized-height: 40px;

    .task-view {
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: rgb(var(--textColor1));
        
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
            margin-bottom: 12px;
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

        &__settings-btn {
            opacity: 0.1;
            margin: -2px -5px 0px 0px;
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
    }
    .quick-todos {
        height: 100%;
        width: 100%;
        border-radius: 10px;
        margin-bottom: 2px;
    
        &__header {
            @include flex-container(center, space-between);
            padding: 0px $side-padding;
            h1 {
                font-size: 1.7rem;
                font-weight: 400;
                color: rgb(var(--textColor1), 0.9);
                @include elipses-overflow;
                max-width: 100px;
            }
        }
        &__todo-list {
            overflow: hidden;
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
            background-color: rgb(var(--textColor1), 0.009);
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

        @keyframes strike {
            0%   { width : 0; }
            100% { width: 100%; }
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
            @include multi-line-elipses-overflow(1);
        }
        &__description-text-area {

        }
        &__subtasks-list {
            padding-top: 10px;
        }
        &__subtask {
            @include flex-container(center, _);
            position: relative;
            visibility: hidden;
            
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
            &--checked &-title-input {
                color: rgba(var(--textColor1), 0.1);
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
            &-title, &-title-input {
                font-weight: 300;
                font-size: 1.1rem;
                color: rgba(var(--textColor1), 0.2);
                cursor: text;
                width: 100%;
            }
            &-title.strike::after {
                background-color: rgba(var(--textColor1), 0.2);
            }
        }
    }
    .strike {
        position: relative; 
    }
    .strike::after {
        content: ' ';
        position: absolute;
        top: 50%;
        left: 0;
        width: 100%;
        height: 1px;
        background: rgba(var(--textColor1), 0.5);
        animation-name: strike;
        animation-duration: 0.13s;
        animation-timing-function: ease-in-out;
        animation-iteration-count: 1;
        animation-fill-mode: forwards; 
    }
</style>