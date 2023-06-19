<script lang="ts">
    import { onMount } from 'svelte';
	import { getCurrentDate, getCurrentTime } from "$lib/helper";

    export let isTaskMenuExpanded: Boolean;

    const hasActiveSession = false;
    const sessionIDClicked = 1;
    let flag = false;
    const isEmpty = false;
    let doUse12HourFormat = true;

    let currentTime = getCurrentTime(doUse12HourFormat);
    let currentDate = getCurrentDate();

    const prevSessionClickedHandler = () => {
        flag = !flag;
    }
    const newTaskButtonHandler = () => {
        console.log("SDG");
    }
    const handleNewTaskSubmit = (event: Event) => {
        event.preventDefault();
        console.log("SwefweweDG");
    }
    const changeTimeFormat = () => {
        doUse12HourFormat = !doUse12HourFormat;
        currentTime = getCurrentTime(doUse12HourFormat);
    }
    onMount(() => {
        const intervalId = setInterval(() => {
            currentDate = getCurrentDate();
            currentTime = getCurrentTime(doUse12HourFormat);
        }, 1000);
    
        return () => clearInterval(intervalId);
    });
</script>

<div class={`task-view ${!isTaskMenuExpanded ? "task-view--minimize" : ""}`}>
        {#if isEmpty}
            <h6 class={`task-view__no-sessions-message ${!isTaskMenuExpanded ? "task-view__no-sessions-message--minimize" : ""}`}>No Sessions for Today</h6>
        {/if}
        {#if isTaskMenuExpanded}
        <!-- Header -->
        <div class="task-view__header task-view__header--default"> 
            <img class="task-view__header-img" src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/287d3559037917.5a130f45904d5.gif" alt="">
            <div class="flx flx--space-between">
                <h1>Hey, Kyle!</h1>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="task-view__header-today-time" on:click={() => changeTimeFormat()} >
                    <i class="fa-solid fa-moon"></i>
                    <p>{currentTime}</p>
                </div>
            </div>
            <p class="task-view__header-today-date">{currentDate}</p>
        </div>
        {:else}
        <div class="task-view__header task-view__header--secondary"> 
            <h1>{currentTime}</h1><p>Wed</p>
        </div>
        {/if}
    {#if !hasActiveSession}
    <!-- <button class={`text-icon-btn-1 task-view__new-task-btn ${!isTaskMenuExpanded ? "task-view__new-task-btn--minimize" : ""}`} on:click={newTaskButtonHandler}>
        <p>New Session</p> <p>+</p>
    </button> -->
    {/if}
    <div class={`today-stats ${!isTaskMenuExpanded ? "today-stats--minimize" : ""}`}>
        <div class="today-stats__stat">
            <i class="fa-solid fa-clock"></i>
            <div class="today-stats__stat-nums">
                <p>3 hr 30 m</p>
                <span>Work Time</span>
            </div>
        </div>
        <div class="today-stats__stat today-stats__stat--middle">
            <i class="fa-solid fa-mug-hot"></i>
            <div class="today-stats__stat-nums">
                <p>30 m</p>
                <span>Work Time</span>
            </div>
        </div>
    </div>
    <div class={`current-session-container ${(!isTaskMenuExpanded || !hasActiveSession) ? "current-session-container--minimize" : ""}`}>
        <h4>Current Session</h4>
        <div class="session">
            <h4>Math HW</h4>
            <ul class="session__todo-list">
                <li class="session-todo session-todo--active">
                    <div class="session-todo__icon session-todo__icon--check session-todo__icon--active">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <p class="session-todo__text">Problems 3 - 6</p>
                </li>
                <li class="session-todo session-todo--checked">
                    <button class="session-todo__icon">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <p class="session-todo__text">Problems 3 - 6</p>
                </li>
                <li class="session-todo session-todo--new-session-btn">
                    <form on:submit={handleNewTaskSubmit}>
                        <button class="session-todo__icon session-todo__icon--add session-todo__icon--active" type="submit">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <!-- <p class="session-todo__text">Add New Task</p> -->
                        <input class="session-todo__text session-todo__text--input" placeholder="Read 20 Pages!"><br>
                    </form>
                </li>
            </ul>
            <div class="session__task-tag-emblem">S</div>
            <div class="session__pom-period">45 min × 3</div>
        </div>
    </div>
    <div class={`task-view__prev-sessions-container ${!isTaskMenuExpanded ? "task-view__prev-sessions-container--minimize" : ""}`}>
        <div class="task-view__prev-sessions-header"> <h2>Today's Sessions</h2> <p>2</p> </div>
        <ul>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li class={`task task--complete ${flag ? "task--clicked" : ""}`} on:click={prevSessionClickedHandler}>
                <div>
                    <div class="flx flx--algn-center flx--justify-center">
                        <div class="task__completeness-icon task__completeness-icon--complete">
                            <i class="fa-solid fa-check"></i>
                        </div>
                        <div class="task__details-container">
                            <div class="task__header">
                                <h5>Math HW</h5>
                                <p>45 min × 3</p>
                            </div>
                            <div class="task__time-period">
                                <p>2:21 PM - 12:30 AM</p>
                            </div>
                            <div class="task-tag-emblem">S</div>
                        </div>
                    </div>
                    <ul class={`task__todo-list ${flag ? "task__todo-list--clicked" : ""}`}>
                        <li class="session-todo">
                            <div class="session-todo__icon session-todo__icon--unfinished">
                                <i class="fa-solid fa-check"></i>
                            </div>
                            <p class="session-todo__text">Problems 3 - 6</p>
                        </li>
                        <li class="session-todo">
                            <div class="session-todo__icon session-todo__icon--finished">
                                <i class="fa-solid fa-xmark"></i>
                            </div>
                            <p class="session-todo__text">Problems 3 - 6</p>
                        </li>
                    </ul>
                </div>
            </li>
        </ul>
    </div>
    
</div>

<style lang="scss">
    .task-view {
        width: 100%;
        overflow: hidden;
        color: rgb(var(--textColor1));
        
        &--minimize {
            padding: 0px 25% 0px 17%;
        }
        &__header {
            width: 100%;
            margin: 0px 0px 15px 0px;
            h1 {
                font-family: "Apercu";
                font-size: 1.5rem;
                white-space: nowrap;
                padding-left: 7%;
                @include elipses-overflow;
                margin-right: 10px;
            }
            &--secondary {
                display: block;
                text-align: center;
            }
            &--secondary > h1 {
                font-size: 0.9rem;
            }
            &--secondary > p {
                margin: 5px 0px 6px 0px;
                font-size: 0.8rem;
            }
        }
        &__header-img {
            width: 100%;
            margin-bottom: 10px;
            height: 60px;
            object-fit: cover;
        }
        &__header-today-time {
            padding-right: 10%;
            cursor: pointer;
            @include flex-container(center, center);
            i {
                color: #D4A373;
            }
            p {
                opacity: 0.7;
                margin-left: 5px;
                @include elipses-overflow;
            }
        }
        &__header-today-date {
            padding: 0px 7%;
            margin-top: 3px;
            font-weight: 600;
            opacity: 0.45;
        }

        &__new-task-btn {
            &--minimize {
                border-radius: 100%;
                width: 100%;
                padding: 0px;
                aspect-ratio: 1 / 1;
            }
            &--minimize > p {
                font-size: 1.5rem;
            }
            &--minimize > p:first-child {
                display: none;
            }
        }

        .today-stats {
            height: 45px;
            @include flex-container(center, space-around);
            border-radius: 13px;
            background-color: rgb(var(--fgColor3));
            color: rgb(var(--textColor2));
            margin: 0px 7% 0px 7%;

            &__stat {
                @include flex-container(center, _);

                i {
                    font-size: 1.3rem;
                    margin-right: 12px;
                }
                p {
                    font-size: 1rem;
                    margin-bottom: -2px;
                }
                span {
                    font-size: 0.7rem;
                }
            }

            &--minimize {
                display: block;
                
                .today-stat:first-child {
                    margin-top: 5px;
                }
                .today-stat--middle {
                    margin: 15px 0px !important;
                }
            }
        }
        .current-session-container {
            margin-bottom: 30px;
            padding: 0% 7%;

            h4 {
                font-size: 11.5px;
                margin: 20px 0px 10px 0px;
            }
            &--minimize { 
                display: none;
            }
            .session {
                position: relative;
                background-color: $bg-color-3;
                padding: 10px 10px 15px 15px;
                border-radius: 10px;
                h4 {
                    font-size: 0.95rem;
                    margin: 0px;
                    color: white;
                }
                &__todo-list {
                }
                &__task-tag-emblem {
                    position: absolute;
                    right: 10px;
                    top: 10px;
                    cursor: default;
                    font-family: "Apercu";
                    font-weight: 800;
                    font-size: 0.8rem;
                    @include center;
                    @include circle(13px);
                    border-radius: 100%;
                    background-color: #9997FE;   
                }
                &__pom-period {
                    position: absolute;
                    right: 10px;
                    bottom: 10px;
                    font-size: 0.8rem;
                    color: #818181;
                }
            }
        }

        &__prev-sessions-header {
            @include flex-container(center, space-between);
            margin: 30px 0px 15px 0px;
            h2 {
                font-size: 12px;
            }
        }
        &__prev-sessions-container {
            padding: 0% 7%;
            &--minimize {
                display: none;
            }
        }
        &__no-sessions-message {
            position: absolute;
            text-align: center;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: rgb(137, 137, 137);

            &--minimize {
                top: 50%;
            }
        }
    }


    .task {
        height: 45px;
        width: 100%;
        position: relative;
        @include flex-container(center, _);
        padding: 8px 12px;
        margin-bottom: 5px;
        border-radius: 9px;
        color: rgb(var(--textColor1));
        cursor: pointer;
        transition: ease-in-out 0.14s;
        border: var(--borderVal);
        box-shadow: var(--shadowVal);

        &:hover {
            opacity: 0.9;
        }

        &--clicked {
            height: auto;
        }

        &__completeness-icon {
            @include circle(14px);
            text-align: center;
            margin-right: 10px;
            transition: ease-in-out 0.1s;
            opacity: 0.8;
            color: rgb(var(--fgColor3));
            @include center;

            i {
                margin-top: 0.5px;
                font-size: 6px;
            }

            &--complete {
                color: var(--secondaryBgColor);
                background-color: rgb(var(--textColor1));
            }
            &--incomplete {
                background-color: transparent;
                i {
                    color: rgb(var(--textColor1));
                    font-size: 1rem;
                    margin-left: -1px;
                    &::before {
                        content: "\f00d";
                    }
                }
            }
        }
        &__details-container {
            width: 100%;
        }
        &__header {
            width: 100%;
            @include flex-container(center, space-between);
            h5 {
                font-size: 1rem;
                max-width: 80%;
                @include elipses-overflow;
                font-weight: 800;
                margin: -3px 0px 1px 0px;
            }
            p {
                position: absolute;
                top: 6px;
                right: 10px;
                font-size: 0.75rem;
                opacity: 0.7;
            }
        }
        &__time-period {
            font-weight: 100;
            @include flex-container(center, _);
            color: rgb(131, 131, 131);
            white-space: nowrap;
            overflow: hidden;
            p {
                font-size: 0.8rem;
            }
        }
        .task-tag-emblem {
            cursor: default;
            font-family: "Apercu";
            font-weight: 800;
            font-size: 0.8rem;
            @include pos-abs-bottom-right-corner(8px, 8px);
            @include center;
            @include circle(13px);
            background-color: #9997FE;   
            color: var(--secondaryBgColor);
        }
        &__todo-list {
            display: none;
            &--clicked {
                display: block;
            }
        }
    }

    /* todo element for sessions, accomodates finished, unfinished, active, new todo states */
    .session-todo {
        font-family: "Manrope";
        @include flex-container(center, _);
        margin-bottom: 5px;
        width: 100%;

        &:first-child {
            margin-top: 10px;
        }
        &:last-child {
            margin-bottom: 20px;
        }

        &__icon {
            margin-right: 8px;
            border-radius: 18px;
            @include circle(9.5px);
            background: rgba(115, 119, 255, 0.05);
            border: 1.8px solid #5e5e5e;
            transition: ease-in-out 0.1s;
            cursor: default;
            @include center;
            width: 18px;
            background-color: red;

            i {
                font-size: 0.4rem;
                display: none;
            }
            
            &--active { // todo element in an active session
                border: 1.8px solid #5e5e5e;
                cursor: pointer;
                &:hover {
                    cursor: pointer;
                    background-color: rgb(50, 50, 50);
                }
            }
            &--add { // add new todo element
                border-color: transparent;
                background: none;
                @include center;
                i {
                    font-size: 1rem;
                    display: block;
                    font-weight: 100;
                }
            }
            &--finished, &--unfinished { // todo element in an active session
                border: none;
                background-color: transparent;
                margin-right: 5px;
                i {
                    margin-left: -5px;
                    font-size: 0.8rem;
                    display: block;
                    opacity: 0.7;
                }
            }
        }
        &__text {
            color: rgb(139, 139, 139);
            max-width: 90%;
            @include elipses-overflow;
            font-size: 0.85rem;
            &--input {
                color: white;
            }
        }
        form { // input field for a new todo
            display: flex;
            width: 100%;
            input {
                color: rgb(199, 199, 199);
                width: 85%;
                max-width: 80%;
                padding-bottom: 4px;
                border-bottom: 1.5px solid #4e4e4e;
                &::placeholder {
                    color: rgb(56, 56, 56);
                }
                &:focus {
                    border-color: #6A83FF;
                    box-shadow: 0px 6px 8px -6px #2f3362;
                }
            }
        }

        &--new-session-btn {
            margin: 10px 0px 30px 0px;
        }

        /* active session todos (checked) */
        &--checked > .session-todo__icon {
            background: linear-gradient(90deg, #5366FF 0%, #7876FE 100%);
            border: 2px solid #9997FE;
            box-shadow: -1px 1px 2px 1px rgba(120, 118, 254, 0.02);
            i {
                display: block;
            }
        }
        &--checked > p {
            text-decoration: line-through;
            text-decoration-thickness: 1px;
        }
    }

</style>