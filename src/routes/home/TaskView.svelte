<script lang="ts">
    const newTaskButtonHandler = () => {
        console.log("SDG");
    }
</script>

<div class="task-view">
    <div class="task-view__header"> <h1>Today</h1> <p>Wed, July 07</p> </div>
    <div class="divider"></div>
    <button class="task-view__new-task-btn" on:click={newTaskButtonHandler}>
        <p>New Session</p>
        <p>+</p>
    </button>
    <div class="task-view__task-list-container">
        <div class="task-view-day-section task-view-day-section--morning"> 
            <div class="task-view-day-section__header"> <h2>Morning</h2> <p>2</p> </div>
            <div class="divider"></div>
            <li>
                <ul class="task">
                    <div class="task__header">
                        <h3>Math HW</h3>
                        <p class="tasks-done">3 / 6</p>
                    </div>
                    <div class="task__details">
                        <p class="task-score">🥇</p>
                        <div class="task-tag-emblem">S</div>
                    </div>
                </ul>
                <ul class="task">
                    <div class="task__header">
                        <h3>Math HW</h3>
                        <p class="tasks-done">3 / 6</p>
                    </div>
                    <div class="task__details">
                        <p class="task-score">🥇</p>
                        <div class="task-tag-emblem">S</div>
                    </div>
                </ul>
            </li>
        </div>
        <div class="task-view-day-section task-view-day-section--afternoon"> 
            <div class="task-view-day-section__header"> <h2>Afternoon</h2> <p>2</p> </div>
            <div class="divider"></div>
            <li>
                <ul class="task">
                    <div class="task__header">
                        <h3>Math HwefwfweW</h3>
                        <p class="tasks-done">3 / 6</p>
                    </div>
                    <div class="task__details">
                        <p class="task-score">🥇</p>
                        <div class="task-tag-emblem">S</div>
                    </div>
                </ul>
                <ul class="task">
                    <div class="task__header">
                        <h3>Math HW</h3>
                        <p class="tasks-done">3 / 6</p>
                    </div>
                    <div class="task__details">
                        <p class="task-score">🥇</p>
                        <div class="task-tag-emblem">S</div>
                    </div>
                </ul>
            </li>
        </div>
        <div class="task-view-day-section task-view-day-section--evening"> 
            <div class="task-view-day-section__header"> <h2>Evening</h2> <p>2</p> </div>
            <div class="divider"></div>
            <li>
                <ul class="task">
                    <div class="task__header">
                        <h3>Math HW</h3>
                        <p class="tasks-done">3 / 6</p>
                    </div>
                    <div class="task__details">
                        <p class="task-score">🥇</p>
                        <div class="task-tag-emblem">S</div>
                    </div>
                </ul>
                <ul class="task">
                    <div class="task__header">
                        <h3>Math HW</h3>
                        <p class="tasks-done">3 / 6</p>
                    </div>
                    <div class="task__details">
                        <p class="task-score">🥇</p>
                        <div class="task-tag-emblem">S</div>
                    </div>
                </ul>
            </li>
        </div>
    </div>
</div>

<style lang="scss">
    .task-view {
        padding: 0px 10%;
        
        &__header {
            margin-top: 55px;
            white-space: nowrap;
            @include flex-container(flex-end, space-between);

            p {
                color: #adadad;
            }
        }
        .divider {
            margin-bottom: 15px
        }
        &__new-task-btn {
            @include center;
            transition: ease-in-out 0.1s;
            font-weight: 700;
            width: 100%;
            background: #1E1E22; 
            box-shadow: 3px 3px 4px rgba(0, 0, 0, 0.07);
            padding: 10px 0px;
            border-radius: 8px;
            margin-bottom: 20px;
            &:hover {
                background: #272427;
            }
            &:active {
                background: rgb(51, 48, 48); 
            }
        }
        &__task-list-container {
            .task-view-day-section {
                margin-bottom: 25px;
                &__header {
                    @include flex-container(baseline, space-between);
                    h2 {
                        font-size: 1.1rem;
                        font-family: "Apercu Medium";
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
                    width: 100%;
                    background-color: #1c1c20;
                    padding: 8px 12px;
                    border-radius: 9px;
                    margin-bottom: 5px;
                    transition: ease-in-out 0.14s;
                    @include flex-container(center, space-between);

                    &:hover {
                        background-color: #222123;
                    }

                    &__header {
                        @include flex-container(center, space-between);
                        h3 {
                            font-size: 1.05rem;
                            white-space: nowrap;
                            max-width: 70px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .tasks-done {
                            font-size: 0.7rem;
                            font-weight: 100;
                            color: rgb(164, 164, 164);
                            margin-left: 7px
                        }
                    }

                    &__details {
                        @include flex-container(center, _);
                        .task-pom-time {
                            font-size: 0.6rem;
                            font-weight: 100;
                            color: rgb(164, 164, 164);
                        }
                        .task-score {
                            margin: 0px 3px 0px 3px;
                        }
                        .task-tag-emblem {
                            font-family: "Apercu";
                            font-weight: 800;
                            font-size: 7px;
                            @include center;
                            height: 13px;
                            width: 13px;
                            border-radius: 100%;
                            aspect-ratio: 1 / 1;
                            background-color: #9997FE;   
                        }
                    }
                }
            }
        }
    }
</style>