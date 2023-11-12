<script lang="ts">
    import { onMount } from "svelte"
	import Modal from "../../components/Modal.svelte"

	import { closeModal } from "$lib/utils-home"
	import { ModalType, SessionState } from "$lib/enums"
	import { PomSessionManger } from "$lib/pom-session-manager"
	import { sessionStore, themeState, sessionManager } from "$lib/store"

    let todoListElement: HTMLElement

    const NEW_TASK_INPUT_ID = "new-todo-input"
    const TODO_LIST_MAX_HEIGHT = 250
    const MAX_TODO_NAME_LENGTH = 15

    /* UI Handlers */
    const finishSessionBtnHandler       = () => $sessionStore!.finishSession()
    const concludeSessionClicked        = () => $sessionManager!.concludeSessionBtnClicked()
    const todoListElementScrollHandler  = () => $sessionManager!.todoListElementScrollHandler ()

    /* Editing a Todo */
    const checkboxClickedHandler    = (idx: number) =>   $sessionManager!.toggleTodoCheckBox(idx)
    const editTodoBtnClickedHandler = (index: number) => $sessionManager!.editTodoBtnClicked(index)
    const editTextInputHandler      = (event: Event) =>  $sessionManager!.editTodoInputHandler(event)
    const editTodoDoneBtnHandler    = () =>              $sessionManager!.finishEditingTodo()
    const editDeleteBtnHandler      = (index: number) => $sessionManager!.deleteTodo(index)
    
    /* Adding New Todo */
    const newTodoBtnClickedHandler    = () =>             $sessionManager!.addTodoBtnClicked() 
    const newTodoAddBtnClickedHandler = () =>             $sessionManager!.finishAddingTodo() 
    const newTodoTextInputHandler     = (event: Event) => $sessionManager!.newTodoTextInputHandler(event)
    const newTodoCancelBtnHandler     = () =>             $sessionManager!.cancelAddingTodo()

    onMount(() => {
        requestAnimationFrame(() => { 
            new PomSessionManger(todoListElement, TODO_LIST_MAX_HEIGHT)
            $sessionManager!.todoListElementScrollHandler ()
        })
    })
</script>

<svelte:window on:keyup={(event) => $sessionManager?.keyboardShortcutHandler(event)} />

<Modal options={{ borderRadius: "20px" }} onClickOutSide={() => closeModal(ModalType.ActiveSession)}>
    {#if $sessionStore}
        <div class={`active-session ${$themeState.isDarkTheme ? "active-session--dark" : ""}`}>
            <div class="active-session__top-container">
                <!-- Session Details Header -->
                <div class="active-session__header active-session__bento-box">
                    <div>
                        <h4 class="active-session__header-session-name">{$sessionStore.name}</h4>
                        <div class="active-session__header-session-tag" style={`background-color: ${$sessionStore?.tag.color};`}>
                            <span>{`${$sessionStore?.tag.name}`}</span>
                        </div>
                    </div>
                    <div class="active-session__header-time-period">
                        <span>
                            {`${$sessionStore.timePeriodString}`}
                        </span>
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
            <div class={`active-session__tasks active-session__bento-box ${$themeState.isDarkTheme ? "" : "active-session__tasks--light-mode"}`}>
                <div class="active-session__tasks-header">
                    <h4>To Do's</h4>
                    <span>
                        {#if $sessionStore.todos.length > 0}
                            {$sessionStore.todosCheckedCount} / {$sessionStore.todos.length}
                        {/if}
                    </span>
                </div>
                <!-- To Do List -->
                <div class="active-session__tasks-todo-list-container">
                    {#if $sessionManager?.doShowTopGradient} 
                        <div class="gradient-container gradient-container--top"></div>
                    {/if}
                    <ul class="active-session__tasks-todo-list" on:scroll={todoListElementScrollHandler } bind:this={todoListElement}>
                        {#each $sessionStore.todos as todo, idx}
                            <!-- To Do List Item -->
                            <li 
                                role="button" tabindex="0"
                                on:focus={(e) => $sessionManager?.onTodoFocusEventHandler(e, idx)}
                                class={`active-session-todo 
                                            ${$sessionManager?.todoToEditIndex === idx ? "active-session-todo--editing" : ""}
                                            ${$sessionManager && $sessionManager?.focusedTodoIndex -1 === idx ? "active-session-todo--hide-divider" : ""}
                                            ${$themeState.isDarkTheme ? "" : "active-session-todo--light-mode"}
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
                                                        on:click={() => editDeleteBtnHandler(idx)}
                                                        type="reset"
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
                                            <p class={`active-session-todo__name ${todo.isChecked ? "active-session-todo__name--finished" : ""}`}>
                                                {#if todo.isChecked} 
                                                    <span class="strike">{todo.title}</span>
                                                {:else}
                                                    {todo.title}
                                                {/if}
                                            </p>
                                            {#if ($sessionStore.todos.length > 1 && idx != $sessionStore.todos.length - 1) && $sessionManager && idx != $sessionManager.todoToEditIndex - 1}
                                                <div class="divider divider--thin"></div>
                                            {/if}
                                            <button on:click={() => editTodoBtnClickedHandler(idx)} class="active-session-todo__edit-button flx">
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
                <!-- Bottom List New Task Button -->
                {#if $sessionManager?.isMakingNewTask}
                    <div class="active-session__tasks-new-todo-input-container">
                        <form on:submit={newTodoAddBtnClickedHandler} autocomplete="off">
                            <input 
                                class="active-session__tasks-new-todo-input"
                                placeholder="New Subtask" 
                                id={NEW_TASK_INPUT_ID}
                                on:input={newTodoTextInputHandler}
                            />
                        </form>
                        <div class="active-session__tasks-new-todo-btn-container">
                            <button 
                                disabled={$sessionManager?.newTodoTitle === "" || $sessionManager?.newTodoTitle.length > MAX_TODO_NAME_LENGTH}
                                class="active-session__tasks-add-btn unfill unfill--padded unfill--oval"
                                type="submit"
                                on:click={newTodoAddBtnClickedHandler}
                            >
                                    Add
                            </button>
                            <button 
                                on:click={newTodoCancelBtnHandler}
                                class="active-session__tasks-cancel-btn unfill unfill--padded unfill--oval"
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
                {#if !$sessionManager?.isMakingNewTask && ($sessionStore.todos?.length > 0 && $sessionStore.todosCheckedCount === $sessionStore.todos.length)}
                    <button 
                        on:click={() => finishSessionBtnHandler     ()}
                        class="active-session__tasks-finish-session-btn unfill unfill--padded unfill--oval"
                    >
                        Finish Session <span>👏</span>
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</Modal>

<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import '../../scss/active-session.scss';

    .active-session {
        padding: 13px 22px 10px 14px;
        position: relative;
        color: rgb(var(--textColor1));
        width: 340px;

        h1 {
            margin-bottom: 15px;
        }

        .dropdown-menu {
            @include pos-abs-top-right-corner(35px, -5px);
            width: 120px;
        }
    }
</style>
