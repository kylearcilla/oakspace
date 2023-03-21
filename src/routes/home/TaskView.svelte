<script lang="ts">
    export let isTaskMenuExpanded: Boolean;
    const hasActiveSession = true;
    const sessionIDClicked = 1;
    let flag = false;
    const isEmpty = false;

    console.log("renderd");
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
</script>

<div class={`task-view ${!isTaskMenuExpanded ? "task-view--minimize" : ""}`}>
        {#if isEmpty}
            <h6 class={`task-view__no-sessions-message ${!isTaskMenuExpanded ? "task-view__no-sessions-message--minimize" : ""}`}>No Sessions for Today</h6>
        {/if}
        {#if isTaskMenuExpanded}
        <div class="task-view__header task-view__header--default"> 
            <h1>Today</h1><p>Wed, July 07</p>
        </div>
        {:else}
        <div class="task-view__header task-view__header--secondary"> 
            <h1>6/7</h1><p>Wed</p>
        </div>
        {/if}
    <div class="divider"></div>
    {#if !hasActiveSession}
    <button class={`text-icon-btn-1 task-view__new-task-btn ${!isTaskMenuExpanded ? "task-view__new-task-btn--minimize" : ""}`} on:click={newTaskButtonHandler}>
        <p>New Session</p>
        <p>+</p>
    </button>
    {/if}
    <div class={`today-stats ${!isTaskMenuExpanded ? "today-stats--minimize" : ""}`}>
        <div class="today-stat">
            <i class="fa-solid fa-book-open"></i>
            <p>3.4 hrs</p>
        </div>
        <div class="today-stat today-stat--middle">
            <i class="fa-solid fa-mug-hot"></i>
            <p>23 min</p>
        </div>
        <div class="today-stat">
            <i class="fa-solid fa-pencil"></i>
            <p>3 Sess.</p>
        </div>
    </div>
    <div class={`current-session-container ${(!isTaskMenuExpanded || !hasActiveSession) ? "current-session-container--minimize" : ""}`}>
        <h4>Current Session</h4>
        <div class="session">
            <h4>Math HW</h4>
            <ul class="session__todo-list">
                <li class="session-todo session-todo--active">
                    <button class="session-todo__icon session-todo__icon--check session-todo__icon--active">
                        <i class="fa-solid fa-check"></i>
                    </button>
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
        <div class="task-view-day-section task-view-day-section--morning"> 
            <div class="task-view-day-section__header"> <h2>Morning</h2> <p>2</p> </div>
            <ul>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li class={`task ${flag ? "task--clicked" : ""}`} on:click={prevSessionClickedHandler}>
                    <div class="task__header">
                        <div class="task-header-title">Math HW</div>
                        <div class="task-score-indicator">🥇</div>
                    </div>
                    <div class="task__details">
                        <div class="details-time-period">
                            <p>45 min × 3</p>
                        </div>
                        <p class="dot">•</p>
                        <div class="details-tasks-done">
                            <p>3 / 6</p>
                        </div>
                    </div>
                    <div class="task-tag-emblem">S</div>
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
                    <p class={`task__time ${flag ? "task__time--clicked" : ""}`}>2 - 3 PM</p>
                </li>
            </ul>
        </div>
    </div>
    
</div>

<style lang="scss">
    .task-view {
        padding: 0px 10%;
        width: 100%;
        overflow: hidden;

        &--minimize {
            padding: 0px 25% 0px 17%;
        }
        &__header {
            width: 100%;
            margin-top: 55px;
            @include flex-container(flex-end, space-between);
            p {
                color: #adadad;
                overflow: hidden;
                margin-left: 10px;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            &--secondary {
                display: block;
                text-align: center;
            }
            &--secondary > h1 {
                font-size: 13px;
            }
            &--secondary > p {
                margin: 2px 0px 4px 0px;
                font-size: 8px;
            }
        }
        .divider {
            margin-bottom: 5px
        }

        &__new-task-btn {
            &--minimize {
                border-radius: 100%;
                width: 100%;
                padding: 0px;
                aspect-ratio: 1 / 1;
            }
            &--minimize > p {
                font-size: 15px;
            }
            &--minimize > p:first-child {
                display: none;
            }
        }

        .today-stats {
            display: flex;
            width: 100%;
            padding: 10px 2%;
            justify-content: space-evenly;
            align-items: center;
            border-radius: 10px;
            margin-bottom: 15px;
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
            h4 {
                font-size: 11.5px;
                margin: 20px 0px 10px 0px;
            }
            &--minimize { 
                display: none;
            }
            .session {
                position: relative;
                background-color: #121112;
                padding: 10px 10px 15px 15px;
                border-radius: 10px;
                h4 {
                    font-size: 10.5px;
                    margin: 0px;
                    color: rgb(194, 194, 194);
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
                    font-size: 8px;
                    @include center;
                    height: 13px;
                    width: 13px;
                    aspect-ratio: 1 / 1;
                    border-radius: 100%;
                    background-color: #9997FE;   
                }
                &__pom-period {
                    position: absolute;
                    right: 10px;
                    bottom: 10px;
                    font-size: 8px;
                    color: #818181;
                }
            }
        }
        &__prev-sessions-container {
            .task-view-day-section {
                margin-bottom: 25px;
                &__header {
                    @include flex-container(baseline, space-between);
                    margin-bottom: 10px;
                    h2 {
                        font-size: 1.1rem;
                        font-family: "Gordita Medium";
                    }
                    p {
                        font-weight: 100;
                        font-size: 0.7rem;
                        color: #808080;
                    }
                }
                .divider {
                    height: 0.1px;
                    margin: 6px 0px 10px 0px;
                }
                &--morning {
                    color: #9997FE;
                }
                &--afternoon {
                    color: #B27EDA;
                }
                &--evening {
                    color: #6A83FF;
                }

                .task {
                    color: white;
                    padding: 8px 12px;
                    border-radius: 7px;
                    width: 100%;
                    margin-bottom: 5px;
                    transition: ease-in-out 0.14s;
                    position: relative;
                    background-color: #1c1c20;

                    &:hover {
                        background-color: #222226;
                    }
                    &__header {
                        display: flex;
                        .task-header-title {
                            font-size: 1rem;
                            white-space: nowrap;
                            max-width: 80%;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            font-weight: 800;
                        }
                        .task-score-indicator {
                            height: 3.5px;
                            width: 3.5px;
                            // background-color: #AEFA8A;
                            margin: 2px 0px 0px 3px;
                            border-radius: 100%;
                            aspect-ratio: 1/1;
                            font-size: 0.45rem;
                        }
                    }
                    &__details {
                        margin-top: 1px;
                        display: flex;
                        font-weight: 100;
                        align-items: center;
                        color: rgb(131, 131, 131);
                        white-space: nowrap;
                        max-width: 80%;
                        overflow: hidden;
                        .details-time-period {
                            font-size: 0.8rem;
                        }
                        .dot {
                            margin: 0px 4px;
                        }
                        .details-tasks-done {
                            font-size: 0.8rem;  
                        }
                    }
                    .task-tag-emblem {
                        cursor: default;
                        position: absolute;
                        right: 10px;
                        bottom: 10px;
                        font-family: "Apercu";
                        font-weight: 800;
                        font-size: 8px;
                        @include center;
                        height: 13px;
                        width: 13px;
                        aspect-ratio: 1 / 1;
                        border-radius: 100%;
                        background-color: #9997FE;   
                    }
                    &__time {
                        display: none;
                        font-weight: 100;
                        font-size: 0.85rem;
                        color: #808080;
                        top: 10px;
                        right: 15px;
                        position: absolute;
                        &--clicked {
                            display: block;
                        }
                    }
                    &__todo-list {
                        display: none;
                        &--clicked {
                            display: block;
                        }
                    }
                }
            }
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
                // display: none;
                top: 50%;
            }
        }
    }
</style>