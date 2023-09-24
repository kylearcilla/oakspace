<script lang="ts">
	import { clickOutside } from "$lib/utils-general";
	import { colorThemeState, globalSessionObj, globalSessionState } from "$lib/store";
	import type { Session } from "$lib/pom-session";

    enum SessionState {
        EMPTY, PAUSED, FOCUSING, ON_BREAK, WAITING_TO_PROGRESS_BREAK, 
        WAITING_TO_PROGRESS_FOCUS, FINISHED, CANCELED, FINISH_TOO_EARLY
    }
    enum CurrentModal { Quote, NewSession, ActiveSession }

    let sessionObj: Session | null = null
    let activeSession: ActiveSessionState | null = null
    let sessionNameInput: HTMLElement

    let isEditSessionModalOpen = false
    let newSessionTitle = ""
    let isNewSessionTitleValid = true
    let isTagListDropDownOpen = false
    let isNewTagModalOpen = false

    const MAX_SESSION_NAME_LENGTH = 18
    const MAX_TODO_NAME_LENGTH = 15

    let todoToEditIndex = -1
    let todoToEditNewTitle = ""
    let isTodoToEditTitleValid = true

    globalSessionObj.subscribe((sess: any) => {
        sessionObj = sess
    })
    globalSessionState.subscribe((sessionState: any) => {
        activeSession = sessionState
    })

    let tags = [
        {
            name: "school",
            color: "#9997FE"
        },
        {
            name: "swe",
            color: "#FF8B9C"
        },
        {
            name: "book",
            color: "#CFAB96"
        },
    ]
    let newTitle = ""
    let newTag = { name: "", color: "" }
    let isDropDownOpen = false

    let isMakingNewTask = false
    let newTodoTitle = ""
    let isLightTheme = false

    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const handleFinishSessionClicked = () => {
        sessionObj!.cancelSession()
        globalSessionObj.set(null)
    }
    const handlePomOptionClicked = (optionIdx: number) => {
        if (optionIdx === 0) {
            isEditSessionModalOpen = true
            newSessionTitle = activeSession!.name
            newTag = activeSession!.tag
        }
        else if (optionIdx === 1) {
            activeSession!.sessionState === SessionState.PAUSED ? sessionObj!.playSession() : sessionObj!.pauseSession()
        }
        else if (optionIdx === 2) {
            sessionObj!.restartPeriod()
        }
        else if (optionIdx === 3) {
            sessionObj!.skipToNextPeriod()
        }
        else if (optionIdx === 4) {
            sessionObj!.cancelSession()
        }
        else {
            sessionObj!.finishSession()
        }
    
        isDropDownOpen = false
        // newTag = tags[idx]
    }
    
    /* Editing Session */
    const handleEditSessionDoneBtnClicked = () => {
        sessionObj!.name = newSessionTitle

        if (newTag.name != "") {
            sessionObj!.editSesionTag(newTag)
            sessionObj!.editSessionTitle(newTitle)
        }
        
        handleEditSessionCancelClicked()
    }
    const handleEditSessionCancelClicked = () => {
        todoToEditNewTitle = ""
        isTagListDropDownOpen = false
        isEditSessionModalOpen = false
        newTag = { 
            name: sessionObj!.tag.name, 
            color: sessionObj!.tag.color 
        }
    }
    const editActiveSessionTitleInputHandler = (event: any) => {
        newSessionTitle = event.target.value;
    }
    const toggleTagDropdownList = () => {
        isTagListDropDownOpen = !isTagListDropDownOpen
    }
    const handleCreateTagBtnClicked = () => {
        isTagListDropDownOpen = false
        isNewTagModalOpen = false
    }


    /* Editing a Todo */
    const handleTodoEditButtonClicked = (index: number) => {
        todoToEditIndex = index
        todoToEditNewTitle = activeSession!.todos[index].title
    }
    const handleEditTodoDeleteBtnClicked = (index: number) => {
        sessionObj!.deleteTodo(index)

        todoToEditIndex = -1
        todoToEditNewTitle = ""
    }
    const handleEditTodoDoneBtnClicked = () => {
        sessionObj!.editTodo(todoToEditIndex, todoToEditNewTitle)

        todoToEditIndex = -1
        todoToEditNewTitle = ""
    }
    const editTextInputHandler = (event: any) => {
        todoToEditNewTitle = event.target.value;
    }
    const handleCheckBoxClicked = (idx: number) => {
        sessionObj!.toggleCheckTodo(idx)
	}

    /* Adding New Todo */
    const newTodoAddBtnHandler = () => {
        sessionObj!.addTodo(newTodoTitle)
        newTodoCancelBtnHandler()
    }
    const newTodoCancelBtnHandler = () => {
        newTodoTitle = ""
        isMakingNewTask = false
    }
    const newTodoTextInputHandler = (event: any) => {
        newTodoTitle = event.target.value;
    }


    const handleKeyUp = (event: KeyboardEvent) => {
        if (event.key.toLocaleLowerCase() === "n") {
            isMakingNewTask = true
        }
    }
</script>

<svelte:window on:keyup={handleKeyUp} />

<div class="active-session-container">
    {#if activeSession}
        <!-- Edit Active Session Modal -->
        <div class={`modal-bg ${isEditSessionModalOpen ? "" : "modal-bg--hidden"}`}>
            <div 
                use:clickOutside on:click_outside={() => isEditSessionModalOpen = false} 
                class="modal-bg__content modal-bg__content--overflow-show modal-bg__content--small"
            >
                <div class={`edit-session-modal ${!isLightTheme ? "edit-session-modal--dark" : ""}`}>
                    <h1>Edit Active Session</h1>
                    <h3>Title / Tag</h3>
                    <!-- Name -->
                    <div class="edit-session-modal__name-input" bind:this={sessionNameInput}>
                        <input 
                            spellcheck="false"
                            type="text"
                            placeholder="Afternoon Reading" 
                            on:focus={() => sessionNameInput.classList.add("edit-session-modal__name-input--focus")}
                            on:blur={() => sessionNameInput.classList.remove("edit-session-modal__name-input--focus")}
                            on:input={editTextInputHandler}
                            bind:value={newTitle}
                        >
                        <div class="edit-session-modal__name-input__divider"></div>
                        <div class="edit-session-modal__name-input-tag-dropdown-container dropdown-container">
                            <button class="edit-session-modal__name-input-tag-dropdown-btn dropdown-btn trans-btn" on:click={() => {
                                isTagListDropDownOpen = true
                            }}>
                                <div class="edit-session-modal__name-input-btn-tag" style={`background-color: ${newTag.color}`}></div>
                                <div class="dropdown-btn__title">
                                    {newTag.name}
                                </div>
                                <div class="dropdown-btn__arrows">
                                    <div class="dropdown-btn__arrows-triangle-up">
                                        <i class="fa-solid fa-chevron-up"></i>
                                    </div>
                                    <div class="dropdown-btn__arrows-triangle-down">
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </div>
                                </div>
                            </button>
                            {#if isTagListDropDownOpen}
                                <ul use:clickOutside on:click_outside={() => isTagListDropDownOpen = false} class="dropdown-menu">
                                    {#each tags as tag, idx} 
                                        <li class={`dropdown-menu__option ${tag.name === newTag.name ? "dropdown-menu__option--selected" : ""}`}>
                                            <button class="dropdown-element" on:click={() => handlePomOptionClicked(idx)}>
                                                <div class="edit-session-modal__name-input-btn-tag dropdown-menu__option-icon" style={`background-color: ${tag.color}`}></div>
                                                <p>{tag.name}</p>
                                                <i class="fa-solid fa-check"></i>
                                            </button>
                                        </li>
                                    {/each}
                                    <li class="dropdown-menu__new-option-container">
                                        <div class="divider divider--thin"></div>
                                        <button on:click={handleCreateTagBtnClicked}>
                                            <span>+</span>New Tag
                                        </button>
                                    </li>
                                </ul>
                            {/if}
                        </div>
                    </div>
                    <div class="edit-session-modal__buttons-container">
                        <button 
                            disabled={newTitle === "" || newTitle.length >= MAX_SESSION_NAME_LENGTH} 
                            class="edit-session-modal__done-btn fill-btn" 
                            on:click={handleEditSessionDoneBtnClicked}>
                                Save Changes
                        </button>
                        <button 
                            class="edit-session-modal__cancel-btn unfill unfill--gray" 
                            on:click={handleEditSessionCancelClicked}>
                                Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Session Component -->
        <div class={`active-session ${isLightTheme ? "" : "active-session--dark"}`}>
            <!-- Left Side -->
            <div class="active-session__top-container">
                <!-- Session Details Header -->
                <div class="active-session__header active-session__bento-box">
                    <div class="active-session__header-left">
                        <div class="active-session__header-title-tag">
                            <div class="active-session__header-tag" style={`background-color: ${activeSession.tag.color}`}>
                                {activeSession.tag.name[0]}
                            </div>
                            <div class="active-session__header-name">
                                <h4>{activeSession.name}</h4>
                            </div>
                        </div>
                        <div class="active-session__header-time-period">
                            <span>
                                {`${activeSession.timePeriodString}`}
                            </span>
                            <div class="divider"></div>
                            <span>{`${activeSession.pomTime} / ${activeSession.breakTime} min × ${activeSession.pomPeriods} `}</span>
                        </div>
                    </div>
                    <div class="active-session__header-right">
                        <div class="active-session__header-pom-timer-capsule">
                            <i class="fa-brands fa-readme"></i>
                            <p>
                                {`${activeSession.currentTime?.minutes}:${String(activeSession.currentTime?.seconds).padStart(2, '0')}`}
                            </p>
                            <span>
                                {`${activeSession.currentPomPeriod} / ${activeSession.pomPeriods}`}
                            </span>
                        </div>
                        <div class="new-session-modal__name-input-tag-dropdown-container dropdown-container">
                            <button on:click={() => isDropDownOpen = !isDropDownOpen} class="active-session__header-edit-button settings-btn dropdown-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                                    <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(1 10)">
                                        <circle cx="2" cy="0.8" r="1.2"></circle>
                                        <circle cx="8" cy="0.8" r="1.2"></circle>
                                        <circle cx="14" cy="0.8" r="1.2"></circle>
                                    </g>
                                </svg>
                            </button>
                            <!-- Session Controls -->
                            {#if isDropDownOpen}
                                <ul use:clickOutside on:click_outside={() => isDropDownOpen = false} class="active-session__settings-dropdown-menu dropdown-menu">
                                    <li class="dropdown-menu__option">
                                        <button class="dropdown-element" on:click={() => handlePomOptionClicked(0)}>
                                            <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                                                <i class="fa-solid fa-pencil"></i>
                                            </div>
                                            <p>Edit Session</p>
                                        </button>
                                    </li>
                                    <li class="dropdown-menu__option">
                                        <button class="dropdown-element" on:click={() => handlePomOptionClicked(1)}>
                                            <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                                                {#if activeSession.sessionState === SessionState.PAUSED}
                                                    <i class="fa-solid fa-play"></i>
                                                {:else}
                                                    <i class="fa-solid fa-pause"></i>
                                                {/if}
                                            </div>
                                            {#if activeSession.sessionState === SessionState.PAUSED}
                                                <p>Play Session</p>
                                            {:else}
                                                <p>Pause Session</p>
                                            {/if}
                                        </button>
                                    </li>
                                    <li class="dropdown-menu__option">
                                        <button class="dropdown-element" on:click={() => handlePomOptionClicked(2)}>
                                            <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                                                <i class="fa-solid fa-rotate-right"></i>
                                            </div>
                                            <p>Restart Period</p>
                                        </button>
                                    </li>
                                    <li class="dropdown-menu__option">
                                        <button class="dropdown-element" on:click={() => handlePomOptionClicked(3)}>
                                            <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                                                <i class="fa-solid fa-forward-step"></i>
                                            </div>
                                            <p>Skip Period</p>
                                        </button>
                                    </li>
                                    <li class="dropdown-menu__option">
                                        <button class="dropdown-element" on:click={() => handlePomOptionClicked(4)}>
                                            <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                                                <i class="fa-solid fa-ban"></i>
                                            </div>
                                            <p>Cancel Session</p>
                                        </button>
                                    </li>
                                    <li class="dropdown-menu__option">
                                        <button class="dropdown-element" on:click={() => handlePomOptionClicked(5)}>
                                            <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                                                <i class="fa-solid fa-flag-checkered"></i>
                                            </div>
                                            <p>Finish Session</p>
                                        </button>
                                    </li>
                                </ul>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Active Session Tasks -->
            <div class={`active-session__tasks active-session__bento-box ${isLightTheme ? "active-session__tasks--light-mode" : ""}`}>
                <div class="active-session__tasks-header">
                    <h4>To-Do's</h4>
                    <p>
                        {#if activeSession.todos.length === 0}
                            No To-do's
                        {:else}
                            {activeSession.todosCheckedCount} / {activeSession.todos.length}
                        {/if}
                    </p>
                </div>
                <!-- To Do List -->
                <ul class="active-session__tasks-todo-list">
                    {#each activeSession.todos as todo, idx}
                        <!-- To Do List Item -->
                        <li 
                            class={`active-session-todo 
                                        ${todoToEditIndex === idx ? "active-session-todo--editing" : ""}
                                        ${isLightTheme ? "active-session-todo--light-mode" : ""}
                                `}
                        >
                                <!-- Todo Check Box -->
                                {#if idx != activeSession.todos.length - 1}
                                    {#if todo.isChecked && idx + 1 < activeSession.todos.length && activeSession.todos[idx + 1].isChecked} 
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
                                        {#if (activeSession.todos.length > 1 && idx != activeSession.todos.length - 1) && idx != todoToEditIndex - 1}
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
                {#if !isMakingNewTask && (activeSession.todos?.length > 0 && activeSession.todosCheckedCount === activeSession.todos.length)}
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
</div>      

<style lang="scss">
    @import '../../scss/active-session.scss';

    .active-session-container {
        margin-top: 35px;
        width: 100%;
    }
    .active-session {
        &__header {
            margin-bottom: 20px;
            h4 {
                max-width: 200px;
                font-size: 1.75rem;
                @include elipses-overflow;
            }
        }
        &__header-tag {
            @include circle(19px);
        }
        &__header-time-period {
            span {
                font-size: 1.3rem;
            }
        }
        &__settings-dropdown-menu {
            @include pos-abs-top-right-corner(40px, 0px);
            width: 120px;
        }
        &__header-pom-timer-capsule {
            width: 120px;
        }
        &__tasks-todo-list {
            max-height: 600px;
            min-height: 0px;
        }
    }
    .active-session-todo {

        &--editing > &__right-container {
            padding: 11px 0px 11px 2px;
        }
        p {
            font-size: 1.35rem;
        }
        &__dotted-line {
            bottom: -12px;
            height: 25px;
        }
        &__solid-line {
            &::after {
                height: 30px;
                bottom: -35px;
            }
        }
    }
</style>
