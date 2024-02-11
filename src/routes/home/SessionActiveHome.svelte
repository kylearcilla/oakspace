<script lang="ts">
    import { onMount } from "svelte";

	import { Icon, SessionState } from "$lib/enums"
    import { clickOutside } from "$lib/utils-general"
	import { PomSessionManger } from "$lib/pom-session-manager"
    import { sessionStore, sessionManager, themeState } from "$lib/store"

	import SessionProgress from "./SessionProgress.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte";
	import { getThemeStyling } from "$lib/utils-appearance";
    
    let todoListElement: HTMLElement

    const NEW_TASK_INPUT_ID = "new-todo-input"
    const TODO_LIST_MAX_HEIGHT = 400
    const MAX_TODO_NAME_LENGTH = 15

    /* UI Handlers */
    const finishSessionBtnHandleer       = () =>                   $sessionStore!.finishSession()
    const pomControlsDropdownBtnHandler  = (optionIdx: number) =>  $sessionManager!.pomControlsDropdownBtnHandler(optionIdx)
    const todoListElementScrollHandler   = () =>                   $sessionManager!.todoListElementScrollHandler()
    const concludeSessionClicked         = () =>                   $sessionManager!.concludeSessionBtnClicked()
    const togglePomDropdownMenu          = (isOpen: boolean) =>    $sessionManager!.togglePomControlsDropDown(isOpen)

    /* Editing a Todo */
    const checkboxClickedHandler = (idx: number) =>  $sessionManager!.toggleTodoCheckBox(idx)
    const editBtnClickedHandler = (index: number) => $sessionManager!.editTodoBtnClicked(index)
    const editTextInputHandler = (event: Event)  =>  $sessionManager!.editTodoInputHandler(event)
    const editTodoDoneBtnHandler = () =>             $sessionManager!.finishEditingTodo()
    const editDeleteBtnHandler = (index: number) =>  $sessionManager!.deleteTodo(index)
    
    /* Adding New Todo */
    const newTodoBtnClickedHandler    = () =>             $sessionManager!.addTodoBtnClicked() 
    const newTodoAddBtnClickedHandler = () =>             $sessionManager!.finishAddingTodo() 
    const newTodoTextInputHandler     = (event: Event) => $sessionManager!.newTodoTextInputHandler(event)
    const newTodoCancelBtnHandler     = () =>             $sessionManager!.cancelAddingTodo()

    onMount(() => {
        requestAnimationFrame(() => { 
            new PomSessionManger(todoListElement, TODO_LIST_MAX_HEIGHT)
            $sessionManager!.todoListElementScrollHandler()
        })
    })
</script>

<svelte:window on:keyup={(event) => $sessionManager?.keyboardShortcutHandler(event)} />

<div class="active-session-container">
    {#if $sessionStore}
        <div class={`active-session ${$themeState?.isDarkTheme ? "active-session--dark" : "active-session--light"}`}>
            <div class="active-session__top-container">
                <!-- Session Details Header -->
                <div class="active-session__header active-session__bento-box">
                    <!-- Left Side -->
                    <div>
                        <h4 class="active-session__header-session-name">{$sessionStore.name}</h4>
                        <div class="active-session__header-session-tag" style={`background-color: ${$sessionStore?.tag.color};`}>
                            {`${$sessionStore?.tag.name}`}
                        </div>
                    </div>
                    <!-- Right Side -->
                    <div class="new-session-modal__name-input-tag-dropdown-container dropdown-container">
                        <button on:click={() => togglePomDropdownMenu(true)} class="active-session__settings-dropdown-btn settings-btn">
                            <SvgIcon icon ={Icon.Settings} options={{ opacity: 0.6 }} />
                        </button>
                        <!-- Session Controls -->
                        <ul 
                            use:clickOutside on:click_outside={() => togglePomDropdownMenu(false)} 
                            class={`active-session__settings-dropdown-menu dropdown-menu ${$sessionManager?.isDropDownOpen ? "" : "dropdown-menu--hidden"}`}
                        >
                            <li class="dropdown-menu__option">
                                <button class="dropdown-element" on:click={() => pomControlsDropdownBtnHandler(0)}>
                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                                        <i class="fa-solid fa-pencil"></i>
                                    </div>
                                    <span class="dropdown-menu__option-text">
                                        Edit Session
                                    </span>
                                </button>
                            </li>
                            <li class="dropdown-menu__option">
                                <button 
                                    disabled={$sessionStore?.state === SessionState.FINISHED}
                                    class="dropdown-element" 
                                    on:click={() => pomControlsDropdownBtnHandler(1)}
                                >
                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                                        {#if $sessionStore.isPlaying}
                                            <i class="fa-solid fa-pause"></i>
                                        {:else}
                                            <i class="fa-solid fa-play"></i>
                                        {/if}
                                    </div>
                                    <span class="dropdown-menu__option-text">
                                        {#if $sessionStore.isPlaying}
                                            Pause Session
                                        {:else}
                                            Play Session
                                        {/if}
                                    </span>
                                </button>
                            </li>
                            <li class="dropdown-menu__option">
                                <button 
                                    class="dropdown-element" 
                                    on:click={() => pomControlsDropdownBtnHandler(2)}
                                    disabled={$sessionStore && ($sessionStore.WAITING_STATES.includes($sessionStore.state) || $sessionStore.state === SessionState.FINISHED)}
                                >
                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                                        <i class="fa-solid fa-rotate-right"></i>
                                    </div>
                                    <span class="dropdown-menu__option-text">
                                        Restart Period
                                    </span>
                                </button>
                            </li>
                            <li class="dropdown-menu__option">
                                <button 
                                    class="dropdown-element" 
                                    on:click={() => pomControlsDropdownBtnHandler(3)}
                                    disabled={$sessionStore?.state === SessionState.FINISHED}
                                >
                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                                        <i class="fa-solid fa-forward-step"></i>
                                    </div>
                                    <span class="dropdown-menu__option-text">
                                        Skip Period
                                    </span>
                                </button>
                            </li>
                            <li class="dropdown-menu__option">
                                <button class="dropdown-element" on:click={() => pomControlsDropdownBtnHandler(4)}>
                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                                        <i class="fa-solid fa-ban"></i>
                                    </div>
                                    <span class="dropdown-menu__option-text">
                                        Cancel Session
                                    </span>
                                </button>
                            </li>
                            <li class="dropdown-menu__option">
                                <button 
                                    class="dropdown-element" 
                                    on:click={() => pomControlsDropdownBtnHandler(5)}
                                    disabled={$sessionStore?.state === SessionState.FINISHED}
                                >
                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                                        <i class="fa-solid fa-flag-checkered"></i>
                                    </div>
                                    <span class="dropdown-menu__option-text">
                                        Finish Session
                                    </span>
                                </button>
                            </li>
                            <li class="dropdown-menu__option">
                                <button 
                                    class="dropdown-element" 
                                    on:click={() => pomControlsDropdownBtnHandler(6)}
                                    disabled={$sessionStore?.state === SessionState.FINISHED}
                                >
                                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                                        <i class="fa-solid fa-minimize"></i>
                                    </div>
                                    <span class="dropdown-menu__option-text">
                                        Min Mode
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Pomodoro Details -->
                <div class="active-session__pom active-session__bento-box">
                    <div class="active-session__pom-details">
                        <div class="active-session__pom-details">
                            <div class="active-session__pom-timer">
                                <h1>
                                    {`${$sessionStore.currentTime?.minutes}:${String($sessionStore.currentTime?.seconds).padStart(2, '0')}`}
                                </h1>
                            </div>
                            <span class="active-session__pom-message">
                                {`${$sessionStore.pomMessage}`}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Pomodoro Progress Visualizer -->
                <div class="active-session__progress">
                    <div class="active-session__progress-container">
                        <SessionProgress isForHeader={false}/>
                    </div>
                </div>

                <!-- Action Buttons -->
                {#if $sessionStore?.state === SessionState.FINISHED}
                    <div class="active-session__conclude-btn-container">
                        <button 
                            on:click={() => concludeSessionClicked()}
                            class="active-session__conclude-btn active-session__conclude-btn--flag unfill unfill--padded unfill--oval"
                        >
                            Conclude Session <span>🏁</span>
                        </button>
                    </div>
                {:else if $sessionStore && $sessionStore.isCurrentlyWaiting()}
                    <div class="active-session__conclude-btn-container">
                        <button 
                            on:click={() => $sessionStore?.progressToNextPeriod()}
                            class="active-session__conclude-btn active-session__conclude-btn--finger unfill unfill--padded unfill--oval"
                        >
                            Proceed <span>👉</span>
                        </button>
                    </div>
                {/if}
            </div>
            
            <!-- Active Session Tasks -->
            <div class={`active-session__tasks active-session__bento-box ${!$themeState?.isDarkTheme ? "active-session__tasks--light-mode" : ""}`}>
                <div class="active-session__tasks-header">
                    <h4>To-Do's</h4>
                    <span>
                        {#if $sessionStore.todos.length === 0}
                            0
                        {:else}
                            {$sessionStore.todosCheckedCount} / {$sessionStore.todos.length}
                        {/if}
                    </span>
                </div>
                <!-- To Do List -->
                <div class="active-session__tasks-todo-list-container">
                    {#if $sessionManager?.doShowTopGradient} 
                        <div class="gradient-container gradient-container--top"></div>
                    {/if}
                    <ul class="active-session__tasks-todo-list" on:scroll={todoListElementScrollHandler} bind:this={todoListElement}>
                        {#each $sessionStore.todos as todo, idx}
                            <!-- To Do List Item -->
                            <li 
                                role="button" tabindex="0"
                                on:focus={(e) => $sessionManager?.onTodoFocusEventHandler(e, idx)}
                                class={`active-session-todo 
                                            ${$sessionManager?.todoToEditIndex === idx ? "active-session-todo--editing" : ""}
                                            ${$sessionManager && $sessionManager?.focusedTodoIndex -1 === idx ? "active-session-todo--hide-divider" : ""}
                                            ${!$themeState?.isDarkTheme ? "active-session-todo--light-mode" : ""}
                                      `}
                            >
                                    <!-- Todo Check Box -->
                                    {#if idx != $sessionStore.todos.length - 1}
                                        {#if todo.isChecked && idx + 1 < $sessionStore.todos.length && $sessionStore.todos[idx + 1].isChecked} 
                                            <div class="active-session-todo__line active-session-todo__solid-line active-session-todo__solid-line"></div>
                                        {:else}
                                            <div class="active-session-todo__line active-session-todo__dotted-line"></div>
                                        {/if}
                                    {/if}
                                    <button  on:click={() => checkboxClickedHandler(idx)} class={`active-session-todo__check-box ${todo.isChecked ? "active-session-todo__check-box--finished" : ""}`}>
                                        <i class="fa-solid fa-check"></i>
                                    </button> 
                                    <!-- Todo Content -->
                                    <div class="active-session-todo__right-container">
                                        <!-- Edit Mode -->
                                        {#if idx === $sessionManager?.todoToEditIndex}
                                            <form autocomplete="off" on:submit={editTodoDoneBtnHandler}>
                                                <input
                                                    class="active-session-todo__edit-todo-input"
                                                    placeholder="New Subtask Title"
                                                    id={`todo-${idx}`}
                                                    on:input={editTextInputHandler}
                                                    bind:value={$sessionManager.todoToEditNewTitle}
                                                />
                                                <div class="active-session-todo__edit-btn-container">
                                                    <button 
                                                        class="active-session-todo__delete-btn text-only"
                                                        type="reset"
                                                        on:click={() => editDeleteBtnHandler(idx)}
                                                    >
                                                            Delete
                                                    </button>
                                                    <button
                                                        disabled={$sessionManager.todoToEditNewTitle === "" || $sessionManager.todoToEditNewTitle.length > MAX_TODO_NAME_LENGTH}
                                                        type="submit"
                                                        class="active-session-todo__done-btn text-only"
                                                        on:click={editTodoDoneBtnHandler}
                                                    >
                                                            Done
                                                    </button>
                                                </div>
                                            </form>
                                        <!-- Normdal Mode -->
                                        {:else}
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <p 
                                                class={`active-session-todo__name ${todo.isChecked ? "active-session-todo__name--finished" : ""}`}
                                                on:click={() => editBtnClickedHandler(idx)}
                                            >
                                                {#if todo.isChecked} 
                                                    <span class="strike">{todo.title}</span>
                                                {:else}
                                                    {todo.title}
                                                {/if}
                                            </p>
                                            {#if $sessionStore.todos.length > 1 && idx != $sessionStore.todos.length - 1 && $sessionManager && idx != $sessionManager.todoToEditIndex - 1}
                                                <div class="divider divider--thin"></div>
                                            {/if}
                                            <button on:click={() => editBtnClickedHandler(idx)} class="active-session-todo__edit-button flx">
                                                <div class="flx flx--algn-center">
                                                    <i class="fa-solid fa-pencil"></i>
                                                    <span>Edit</span>
                                                </div>
                                            </button>
                                        {/if}
                                    </div>
                                </li>
                        {/each}
                    </ul>
                    {#if $sessionManager?.doShowBottomGradient} 
                        <div class="gradient-container gradient-container--bottom"></div>
                    {/if}
            </div>
            <!-- New Task Input -->
            {#if $sessionManager?.isMakingNewTask}
                <div class="active-session__new-task-input-container input-box">
                    <form on:submit={newTodoAddBtnClickedHandler} autocomplete="off">
                        <input
                            type="text"
                            name="new-subtask-input" 
                            spellcheck="false"
                            maxlength={25}
                            placeholder="New Task" 
                            id={NEW_TASK_INPUT_ID}
                            on:input={newTodoTextInputHandler}
                        />
                    </form>
                    <div class="input-box__btn-container">
                        <button 
                            on:click={newTodoAddBtnClickedHandler}
                            disabled={$sessionManager?.newTodoTitle === "" || $sessionManager?.newTodoTitle.length > MAX_TODO_NAME_LENGTH}
                            type="submit"
                            class="input-box__btn input-box__btn--submit"
                        >
                            Add
                        </button>
                        <button 
                            on:click={newTodoCancelBtnHandler}
                            class="input-box__btn input-box__btn--cancel"
                            type="reset"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            {:else}
                <button class="active-session__tasks-new-task-btn" on:click={newTodoBtnClickedHandler}>
                    <span>+</span> Add New Task
                </button>
            {/if}
            <!-- Finish Btn -->
            {#if !$sessionManager?.isMakingNewTask && ($sessionStore.todos?.length > 0 && $sessionStore.todosCheckedCount === $sessionStore.todos.length)}
                <button 
                    on:click={() => finishSessionBtnHandleer()}
                    class="active-session__tasks-finish-session-btn unfill unfill--padded unfill--oval"
                >
                    Finish Session <span>👏</span>
                </button>
            {/if}
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import '../../scss/active-session.scss';
    @import "../../scss/inputs.scss";

    $todo-padding-left: 7px;

    .active-session-container {
        margin-top: 20px;
        width: 100%;
    }
    .active-session {
        &--light &__pom-message {
            color: rgb(var(--textColor1), 0.35);
        }
        &--light &__settings-dropdown-btn {
            opacity: 0.7;
            background: rgba(black, 0.05) !important;
            
            &:hover {
                opacity: 1;
            }
        }

        &__header {
            margin-bottom: 20px;
            padding-left: 5px;
            h4 {
                max-width: 200px;
                font-size: 1.75rem;
                @include elipses-overflow;
            }
        }
        &__header-session-tag {
            font-size: 1.2rem;
        }
        &__settings-dropdown-btn {
            opacity: 0.6;
            background: rgba(white, 0.06) !important;
            
            &:hover {
                opacity: 0.8;
            }
        }
        &__settings-dropdown-menu {
            @include pos-abs-top-right-corner(28px, 0px);
            width: 150px;
        }
        &__pom {
            margin: -20px 0px 15px 0px;
        }
        &__pom-timer {
            font-family: "DM Sans";
            h1 {
                font-size: 7rem;
                margin-bottom: 20px;
            }
            span {
                font-size: 1.5rem;
            }
        }
        &__pom-message {
            font-size: 1.5rem;
        }
        &__progress {
            margin: 50px 0px 30px 0px;
            width: 100%;
            @include flex(center, center);
        }
        &__progress-container {
            width: 90%;
            max-width: 600px;
        }
        &__conclude-btn-container {
            margin: 45px 0px -30px 0px;
        }
        &__conclude-btn {
        }
        &__tasks {
            margin-top: 65px;
            
            &-header h4 {
                margin: 2px 0px 5px $todo-padding-left;
            } 
            &-header span {
                font-size: 1.2rem;
                color: rgb(var(--textColor1), 0.25);
            }
            &-todo-list {
                min-height: 0px;
                max-height: 400px !important;
            }
            &-new-task-btn {
                margin: 4px 0px 8px calc($todo-padding-left + 5px);
            }
            &-new-todo-input {
                margin: 4px 0px 8px $todo-padding-left;
            }
        }
        &__new-task-input-container {
            margin-top: 16px;
        }
    }
    .active-session-todo {
        padding-left: $todo-padding-left;

        &--light-mode &__dotted-line {
            border-left: 2px dotted rgb(var(--fgColor1));
            left: calc(8px + $todo-padding-left);
        }
        &--editing > &__right-container {
            padding: 11px 0px 11px 2px;
        }
        p {
            font-size: 1.35rem;
        }
        &__dotted-line {
            bottom: -12px;
            height: 25px;
            left: calc(7.7px + $todo-padding-left);
        }
        &__solid-line {
            &::after {
                height: 30px;
                bottom: -35px;
            }
        }
    }
    .gradient-container {
        &--top {
            background: linear-gradient(180deg, var(--primaryBgColor) 20%, transparent) !important;
            height: 20px;
        }
        &--bottom {
            background: linear-gradient(0deg, var(--primaryBgColor) 20%, transparent) !important;
            height: 20px;
        }
    }
</style>
