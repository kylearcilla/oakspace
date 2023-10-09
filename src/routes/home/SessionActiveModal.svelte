<script lang="ts">
    import { onMount } from "svelte";
	import { SessionState, type SessionModal } from "$lib/enums"
    import { clickOutside } from "$lib/utils-general"
	import Modal from "../../components/Modal.svelte"
	import { sessionStore, themeState } from "$lib/store"
	import type { Session } from "$lib/pom-session"


    export let closeModal: () => void

    let todoListElement: HTMLElement

    let isDropDownOpen = false

    let todoToEditIndex = -1
    let todoToEditNewTitle = ""

    let newTitle = ""
    let newTag = { name: "", color: "" }
    let isMakingNewTask = false
    let newTodoTitle = ""
    
    let doShowTopGradient = false
    let doShowBottomGradient = false

    const PENDING_STATES = [SessionState.WAITING_TO_PROGRESS_BREAK, SessionState.WAITING_TO_PROGRESS_FOCUS]
    const TODO_LIST_MAX_HEIGHT = 250
    const MAX_TODO_NAME_LENGTH = 15

    sessionStore.subscribe((store: Session | null) => {
        if (store!.state === SessionState.FINISHED) {
            console.log("SDfsdfsd")
        }
        if (PENDING_STATES.includes(store!.state)) {
            isMakingNewTask = false
        }
    })

    /* UI Handlers */
    const handleFinishSessionClicked = () => {
        $sessionStore!.cancelSession()
        closeModal()
    }
    
    /* Editing a Todo */
    const handleTodoEditButtonClicked = (index: number) => {
        todoToEditIndex = index
        todoToEditNewTitle = $sessionStore!.todos[index].title
    }
    const handleEditTodoDeleteBtnClicked = (index: number) => {
        $sessionStore!.deleteTodo(index)

        todoToEditIndex = -1
        todoToEditNewTitle = ""

        requestAnimationFrame(() => {
            doShowBottomGradient = todoListElement.clientHeight < TODO_LIST_MAX_HEIGHT ? false : doShowBottomGradient
        })
    }
    const handleEditTodoDoneBtnClicked = () => {
        $sessionStore!.editTodo(todoToEditIndex, todoToEditNewTitle)

        todoToEditIndex = -1
        todoToEditNewTitle = ""
    }
    const editTextInputHandler = (event: Event) => {
        todoToEditNewTitle = (event.target as HTMLInputElement).value
    }
    const handleCheckBoxClicked = (idx: number) => {
        $sessionStore!.toggleCheckTodo(idx)
	}

    /* Adding New Todo */
    const newTodoCancelBtnHandler = () => {
        newTodoTitle = ""
        isMakingNewTask = false
    }
    const newTodoAddBtnHandler = () => {
        $sessionStore!.addTodo(newTodoTitle)
        newTodoCancelBtnHandler()

        requestAnimationFrame(() => {
            doShowBottomGradient = todoListElement.clientHeight === TODO_LIST_MAX_HEIGHT ? true : doShowBottomGradient
        })
    }
    const newTodoTextInputHandler = (event: Event) => {
        newTodoTitle = (event.target as HTMLInputElement).value
    }

    const handleTodoListGradientHandler = () => {
        const scrollTop = todoListElement.scrollTop
        const windowHeight = todoListElement.clientHeight
        const scrollHeight = todoListElement.scrollHeight

        doShowTopGradient = scrollTop > 0
        doShowBottomGradient = Math.ceil(scrollTop) < scrollHeight - windowHeight
    }

    onMount(() => handleTodoListGradientHandler())
</script>

<Modal options={{ borderRadius: "20px" }} onClickOutSide={closeModal}>
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
                        <div>
                            <div class="active-session__pom-details">
                                <div class="active-session__pom-timer">
                                    <h1>
                                        {`${$sessionStore.currentTime?.minutes}:${String($sessionStore.currentTime?.seconds).padStart(2, '0')}`}
                                    </h1>
                                    <span>
                                        {`${$sessionStore.currentPomPeriod} / ${$sessionStore.pomPeriods}`}
                                    </span>
                                </div>
                                <span class="active-session__pom-message">
                                    {`${$sessionStore.pomMessage}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Active Session Tasks -->
            <div class={`active-session__tasks active-session__bento-box ${$themeState.isDarkTheme ? "" : "active-session__tasks--light-mode"}`}>
                <div class="active-session__tasks-header">
                    <h4>To Do's</h4>
                    <p>
                        {#if $sessionStore.todos.length > 0}
                            {$sessionStore.todosCheckedCount} / {$sessionStore.todos.length}
                        {/if}
                    </p>
                </div>
                <!-- To Do List -->
                <div class="active-session__tasks-todo-list-container">
                    {#if doShowTopGradient} 
                        <div class="gradient-container gradient-container--top"></div>
                    {/if}
                    <ul class="active-session__tasks-todo-list" on:scroll={handleTodoListGradientHandler} bind:this={todoListElement}>
                        {#each $sessionStore.todos as todo, idx}
                            <!-- To Do List Item -->
                            <li 
                                class={`active-session-todo 
                                            ${todoToEditIndex === idx ? "active-session-todo--editing" : ""}
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
                                    <button  on:click={() => handleCheckBoxClicked(idx)} class={`active-session-todo__check-box ${todo.isChecked ? "active-session-todo__check-box--finished" : ""}`}>
                                        <i class="fa-solid fa-check"></i>
                                    </button> 
                                    <!-- Todo Content -->
                                    <div class="active-session-todo__right-container">
                                        {#if idx === todoToEditIndex}
                                            <form>
                                                <input
                                                    class="active-session-todo__edit-todo-input"
                                                    placeholder="New Subtask Title"
                                                    on:input={editTextInputHandler}
                                                    bind:value={todoToEditNewTitle}
                                                />
                                            </form>
                                        {:else}
                                            <p class={`active-session-todo__name ${todo.isChecked ? "active-session-todo__name--finished" : ""}`}>
                                                {#if todo.isChecked} 
                                                    <span class="strike">{todo.title}</span>
                                                {:else}
                                                    {todo.title}
                                                {/if}
                                            </p>
                                            {#if ($sessionStore.todos.length > 1 && idx != $sessionStore.todos.length - 1) && idx != todoToEditIndex - 1}
                                                <div class="divider divider--thin"></div>
                                            {/if}
                                        {/if}
                                        {#if idx === todoToEditIndex}
                                            <div class="active-session-todo__edit-btn-container">
                                                <button 
                                                    class="active-session-todo__delete-btn text-only"
                                                    on:click={() => handleEditTodoDeleteBtnClicked(idx)}>
                                                        Delete
                                                </button>
                                                <button
                                                    disabled={todoToEditNewTitle === "" || todoToEditNewTitle.length > MAX_TODO_NAME_LENGTH}
                                                    on:click={handleEditTodoDoneBtnClicked}
                                                    class="active-session-todo__done-btn text-only">
                                                        Done
                                                </button>
                                            </div>
                                        {/if}
                                        {#if todoToEditIndex < 0}
                                            <button on:click={() => handleTodoEditButtonClicked(idx)} class="active-session-todo__edit-button flx">
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
                    {#if doShowBottomGradient} 
                        <div class="gradient-container gradient-container--bottom"></div>
                    {/if}
                </div>
                <!-- New Task Button -->
                {#if isMakingNewTask}
                    <div class="active-session__tasks-new-todo-input-container">
                        <form>
                            <input 
                                class="active-session__tasks-new-todo-input"
                                placeholder="New Subtask" 
                                on:input={newTodoTextInputHandler}
                                bind:value={newTodoTitle}
                            />
                        </form>
                        <div class="active-session__tasks-new-todo-btn-container">
                            <button 
                                disabled={newTodoTitle === "" || newTodoTitle.length > MAX_TODO_NAME_LENGTH}
                                class="active-session__tasks-add-btn unfill unfill--padded unfill--oval"
                                on:click={newTodoAddBtnHandler}>
                                    Add
                            </button>
                            <button 
                                on:click={newTodoCancelBtnHandler}
                                class="active-session__tasks-cancel-btn unfill unfill--padded unfill--oval">
                                    Cancel
                            </button>
                        </div>
                    </div>
                {:else}
                    <button class="active-session__tasks-new-task-btn" on:click={() => isMakingNewTask = true}>
                        <span>+</span> Add New Task
                    </button>
                {/if}
                {#if !isMakingNewTask && PENDING_STATES.includes($sessionStore?.state)}
                    <button 
                        on:click={() => $sessionStore?.progressToNextPeriod()}
                        class="active-session__tasks-finish-session-btn unfill unfill--padded unfill--oval"
                    >
                        Progress <span>👉</span>
                    </button>
                {:else if !isMakingNewTask && ($sessionStore.todos?.length > 0 && $sessionStore.todosCheckedCount === $sessionStore.todos.length)}
                    <button 
                        on:click={() => handleFinishSessionClicked()}
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
        padding: 13px 22px 10px 22px;
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
