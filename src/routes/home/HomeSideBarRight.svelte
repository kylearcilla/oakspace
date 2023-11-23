<script lang="ts">
	import { formatDatetoStr, formatTimeToHHMM, getUserHourCycle, isNightTime } from "$lib/utils-date";
	import { taskGroups } from "$lib/utils-right-bar";
	import { onDestroy, onMount } from "svelte";
    import { fly } from 'svelte/transition'
    import { quintOut } from 'svelte/easing'
	import { tasksViewStore } from "$lib/store";

    enum TAB { 
        TASKS, RECENT_ACTIVITY 
    }
    type Task = {
        title: string,
        subtasks: { name: string, isChecked: boolean }[],
        description: string | null,
        isFinished: boolean
    }

    let selectedTab: TAB = TAB.TASKS

    let currentTimeStr = ""
    let isDayTime = true
    let doUse12HourFormat = false
    let interval: NodeJS.Timer | null = null
    
    let flag = true
    let sum = 38

    let pickedTask: Task | null = null
    let pickedTaskIdx = -1
    let pickedTaskHT: number | null = null
    let pickedTaskDescriptionHT: number | null

    /* UI Handlers */
    const onTaskedClicked = (event: Event) => {
        pickedTaskIdx === 0
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
                <h1 title="SWE">
                    SWE
                </h1>
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
            {#if $tasksViewStore?.tasks}
                <!-- Tasks List -->
                <ul class="quick-todos__todo-list">
                    <!-- Task Element  -->
                    {#each $tasksViewStore.tasks as task, taskIdx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div
                            role="button" tabindex="0" on:click={onTaskedClicked}  
                            class={`quick-todo ${taskIdx === pickedTaskIdx ? "quick-todo--expanded" : ""} ${task.isFinished ? "quick-todo--chcked" : ""}`}
                        >
                            <!-- Left Side  -->
                            <div class="quick-todo__left">
                                <button class="quick-todo__checkbox">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            </div>
                            <!-- Right Side  -->
                            <div class="quick-todo__right">
                                <!-- Title  -->
                                <div class="quick-todo__title">
                                    <span class="">{task.title}</span>
                                </div>
                                <!-- Description  -->
                                <div class="quick-todo__description">
                                    {task.description}
                                </div>
                                <!-- Subtasks  -->
                                {#if taskIdx === pickedTaskIdx && task.subtasks.length > 0}
                                    <ul class="quick-todo__subtasks-list">
                                        {#each task.subtasks as subtask, subtaskIdx}
                                            <div 
                                                class="quick-todo__subtask" 
                                                in:fly={{ x: 0, y: -6, opacity: 0, duration: 600, delay: 200 * 1, easing: quintOut }}
                                            >
                                            {#if subtaskIdx === 0}
                                                <div 
                                                    class={`quick-todo__subtask-hook-line ${subtaskIdx === 0 ? "quick-todo__subtask-hook-line--first" : ""}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="85" viewBox="0 0 23 85" fill="none">
                                                        <path d={`M15 ${42.2466 + sum}H10.3164C5.34584 ${42.2466 + sum} 1.31641 ${38.2171 + sum} 1.31641 ${33.2466 + sum} V0.719971`} stroke-dasharray="2 2"/>
                                                    </svg>
                                                </div>
                                            {:else}
                                                <div class="quick-todo__subtask-hook-line">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="30" viewBox="0 0 23 30" fill="none">
                                                        <path d="M16.084 27.2358H10.3125C5.34194 27.2358 1.3125 23.2064 1.3125 18.2358V0.141846" stroke-dasharray="2 2"/>
                                                    </svg>
                                                </div>
                                            {/if}
                                                <div class="quick-todo__subtask-checkbox quick-todo__checkbox"></div>
                                                <div class="quick-todo__subtask-title quick-todo__title">
                                                    {subtask.title}
                                                </div>
                                            </div>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </ul>
            {/if}
            <button class="quick-todos__add-btn">
                <span>+</span> Add New Todo
            </button>
        </div>
    </div>
</div>

<style lang="scss">
    $side-padding: 18px;
    $color-a: rgba(var(--textColor1), 0.15);

    .task-view {
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: rgb(var(--textColor1));

        .tab-btn {
            &--selected {
                background-color: var(--sidePanelTabBgColor) !important;
            }
        }

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
                background-color: var(--sidePanelTabBgColor) !important;
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
            margin-top: 7px;
            overflow: hidden;
        }
        &__add-btn {
            margin: 20px 0px 0px 2px;
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
        padding: 3px 0px;
        cursor: pointer;
        overflow: hidden;
        margin-bottom: 3px;
        height: 40px;
        transition: height 0.4s cubic-bezier(.1,.84,.42,.95);
        
        &:hover, &:focus {
            background-color: rgb(var(--textColor1), 0.009);
        }
        &--selected {
            background-color: rgb(var(--textColor1), 0.011);
        }
        &--expanded {
            height: 150px;
        }
        &--expanded &__description {
            display: flex;
        }
        &--expanded &__subtask {
            opacity: 1;
        }

        &--checked &__checkbox {
            background-color: rgb(var(--textColor1)) !important;

            &:hover {
                background-color: rgb(var(--navMenuBgColor));
            }
            i {
                display: block;
            }
        }
        &--checked &__title {
            color: rgba(var(--textColor1), 0.4);

        }
        
        &__checkbox {
            @include circle(10px);
            @include center;
            transition: 0.1s ease-in-out;
            border: 1px solid $color-a;
            margin: 4px 9px 0px $side-padding;

            i {
                margin-top: 1px;
                font-size: 0.65rem;
                color: var(--navMenuBgColor);
                display: none;
            }
            &:focus {
                background-color: rgba(var(--textColor1), 0.2);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.15);
            }
            &:active {
                transform: scale(0.97);
            }
        }

        &__title {
            font-size: 1.3rem;
            font-weight: 200;

            .strike {
                position: relative; 
            }
            @keyframes strike {
                0%   { width : 0; }
                100% { width: 100%; }
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
        }
        &__description {
            font-size: 1.1rem;
            font-weight: 300;
            margin-top: 2px;
            color: rgba(var(--textColor1), 0.22);
            padding-right: 8px;
            @include multi-line-elipses-overflow(1);
        }
        &__subtasks-list {
            margin-top: 10px;
        }
        &__subtask {
            @include flex-container(center, _);
            margin-bottom: 8px;
            position: relative;

            &-hook-line {
                @include pos-abs-bottom-left-corner(1.5px, -16.5px);
                
                &--first {
                    @include pos-abs-bottom-left-corner(0px, -16.5px);
                }
                svg {
                    stroke: $color-a;
                }
            }
            &-checkbox {
                margin: 0px 7px 0px 0px;
                @include circle(11.5px);
            }
            &-title {
                font-size: 1.1rem;
                color: rgba(var(--textColor1), 0.65);
            }
        }
    }
</style>