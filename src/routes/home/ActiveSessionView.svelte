<script lang="ts">
	import PomProgressBar from "./PomProgressBar.svelte";
	import { clickOutside } from "$lib/helper";
	import { colorThemeState, globalSessionObj, globalSessionState } from "$lib/store";
	import type { Session } from "$lib/Session";

    enum SessionState {
        EMPTY, PAUSED, FOCUSING, ON_BREAK, WAITING_TO_PROGRESS_BREAK, WAITING_TO_PROGRESS_FOCUS, FINISHED, CANCELED, FINISH_TOO_EARLY
    }

    let sessionObj: Session | null = null
    let activeSession: ActiveSessionState | null = null


    let isEditSessionModalOpen = false
    let newSessionTitle = ""
    let isNewSessionTitleValid = true
    let isTagListDropDownOpen = false
    let isNewTagModalOpen = false

    let todoToEditIndex = -1
    let todoToEditNewTitle = ""
    let isTodoToEditTitleValid = true

    globalSessionObj.subscribe((sess: any) => {
        if (!sess) return
        sessionObj = sess
    })
    globalSessionState.subscribe((sessionState: any) => {
        if (!sessionState) return
        activeSession = sessionState
    })

    // updating the array does not induce a rererender
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
    let newTag = {
        name: "",
        color: ""
    }

    let isMakingNewTask = false
    let todoToEditTitle = ""
    let isTodoTitleValid = false
    let isLightTheme = false

    /* Editing Session */
    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const handleEditSessionBtnClicked = () => {
        isEditSessionModalOpen = true
        newSessionTitle = activeSession!.name
    }
    const handleEditSessionDoneBtnClicked = () => {
        sessionObj!.name = newSessionTitle

        if (newTag.name != "") {
            sessionObj!.tag.name = newTag.name
            sessionObj!.tag.color = newTag.color
        }
        
        handleEditSessionCancelClicked()
    }
    const handleEditSessionCancelClicked = () => {
        todoToEditNewTitle = ""
        isNewSessionTitleValid = true
        isTagListDropDownOpen = false
        isEditSessionModalOpen = false
        newTag = { 
            name: sessionObj!.tag.name, 
            color: sessionObj!.tag.color 
        }
    }
    const editActiveSessionTitleInputHandler = (event: any) => {
        newSessionTitle = event.target.value;
        
        if (newSessionTitle != "" && newSessionTitle.length < 20) {
            isNewSessionTitleValid = true
        }
        else {
            isNewSessionTitleValid = false
        }
    }
    const toggleTagDropdownList = () => {
        isTagListDropDownOpen = !isTagListDropDownOpen
    }
    const handleNewTagClicked = (tag: { name: string, color: string }) => {
        isTagListDropDownOpen = false
        
        newTag.name = tag.name
        newTag.color = tag.color
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
        
        if (todoToEditNewTitle != "" && todoToEditNewTitle.length < 20) {
            isTodoToEditTitleValid = true
        }
        else {
            isTodoToEditTitleValid = false
        }
    }
    const handleCheckBoxClicked = (idx: number) => {
        sessionObj!.toggleCheckTodo(idx)
	}

    /* Adding New Todo */
    const newTodoCancelBtnHandler = () => {
        todoToEditTitle = ""
        isTodoTitleValid = false
        isMakingNewTask = false
    }
    const newTodoAddBtnHandler = () => {
        sessionObj!.addTodo(todoToEditTitle)
        newTodoCancelBtnHandler()
    }
    const newTodoTextInputHandler = (event: any) => {
        todoToEditTitle = event.target.value;

        if (todoToEditTitle != "" && todoToEditTitle.length < 20) {
            isTodoTitleValid = true
        }
        else {
            isTodoTitleValid = false
        }
    }

</script>

<div class="active-session-container">
    {#if activeSession}
        <!-- Edit Active Session Modal -->
        <div class={`modal-bg ${isEditSessionModalOpen ? "" : "modal-bg--hidden"}`}>
            <div 
                use:clickOutside on:click_outside={() => isEditSessionModalOpen = false} 
                class="modal-bg__content modal-bg__content--overflow-show modal-bg__content--small"
            >
                <div class={`active-session-modal ${isLightTheme ? "active-session-modal--light-mode" : ""}`}>
                    <h1>Edit Active Session</h1>
                    <h3>Title</h3>
                    <form spellcheck="false">
                        <input 
                            type="text" 
                            placeholder="Rename Session"
                            on:input={editActiveSessionTitleInputHandler}
                            bind:value={newSessionTitle}
                        />
                    </form>
                    <div class="flx flx--space-between">
                        <h3>Tag</h3>
                        <div class="tag-dropdown dropdown-container">
                            <button on:click={toggleTagDropdownList} class="tag-dropdown__dropdown-btn dropdown-btn">
                                <div class="tag-dropdown__dropdown-btn-tag" style={`background-color: ${newTag.color}`}></div>
                                <div class="dropdown-btn__name">
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
                                    {#each tags as tag} 
                                        <li class={`dropdown-menu__option ${activeSession.tag.name === newTag.name ? "dropdown-menu__option--selected" : ""}`}>
                                            <button class="dropdown-element" on:click={() => handleNewTagClicked(tag)}>
                                                <div class="tag-dropdown__dropdown-btn-tag" style={`background-color: ${tag.color}`}></div>
                                                <p>{activeSession.tag.name}</p>
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
                    <div class="active-session-modal__buttons-container">
                        <button 
                            class="active-session-modal__cancel-btn unfill unfill--oval" 
                            on:click={handleEditSessionCancelClicked}>
                                Cancel
                        </button>
                        <button 
                            disabled={!isNewSessionTitleValid}
                            class="active-session-modal__done-btn unfill unfill--oval" 
                            on:click={handleEditSessionDoneBtnClicked}>
                                Save Changes
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
                    <div class="active-session__header-name">
                        <h4>{activeSession.name}</h4>
                    </div>
                    <button on:click={handleEditSessionBtnClicked} class="active-session__header-edit-button settings-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                            <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(1 10)">
                                <circle cx="2" cy="0.8" r="1.2"></circle>
                                <circle cx="8" cy="0.8" r="1.2"></circle>
                                <circle cx="14" cy="0.8" r="1.2"></circle>
                            </g>
                        </svg>
                    </button>
                    <div class="active-session__header-time-period">
                        <span>
                            {`${activeSession.timePeriodString}`}
                        </span>
                        <div class="divider"></div>
                        <span>{`${activeSession.pomTime} / ${activeSession.breakTime} min × ${activeSession.pomPeriods} `}</span>
                    </div>
                </div>
                <!-- Pomodoro Details -->
                <div class="active-session__pom active-session__bento-box">
                    <div class="active-session__pom-details">
                        <div>
                            <div class="active-session__pom-details">
                                <div class="active-session__pom-timer">
                                    <h1>
                                        {`${activeSession.currentTime?.minutes}:${String(activeSession.currentTime?.seconds).padStart(2, '0')}`}
                                    </h1>
                                    <span>
                                        {`${activeSession.currentPomPeriod} / ${activeSession.pomPeriods}`}
                                    </span>
                                </div>
                                <span class="active-session__pom-message">
                                    {`${activeSession.pomMessage}`}
                                </span>
                            </div>
                            <div class="active-session__pom-btn-container">
                                <button on:click={() => { 
                                        if (activeSession?.sessionState === SessionState.PAUSED) {
                                            sessionObj?.playSession()
                                        }
                                        else {
                                            sessionObj?.pauseSession()
                                        }
                                    }
                                }>
                                    {#if activeSession.sessionState === SessionState.PAUSED}
                                        <i class="fa-solid fa-play"></i> <span>Play</span>
                                    {:else}
                                        <i class="fa-solid fa-pause"></i> <span>Pause</span>
                                    {/if}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
            <!-- Active Session Tasks -->
            <div class={`active-session__tasks active-session__bento-box ${isLightTheme ? "active-session__tasks--light-mode" : ""}`}>
                <div class="active-session__tasks-header">
                    <h4>Session Subtasks</h4>
                    <p>
                        {#if activeSession.todos.length === 0}
                            No substasks
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
                                </div>
                                {#if todoToEditIndex < 0}
                                    <button on:click={() => handleTodoEditButtonClicked(idx)} class="active-session-todo__edit-button flx">
                                        <div class="flx flx--algn-center">
                                            <i class="fa-solid fa-pencil"></i>
                                            <span>Edit</span>
                                        </div>
                                    </button>
                                {/if}
                                {#if idx === todoToEditIndex}
                                    <div class="active-session-todo__edit-btn-container">
                                        <button 
                                            class="active-session-todo__delete-btn text-only"
                                            on:click={() => handleEditTodoDeleteBtnClicked(idx)}>
                                                Delete
                                        </button>
                                        <button
                                            disabled={!isTodoToEditTitleValid} 
                                            on:click={handleEditTodoDoneBtnClicked}
                                            class="active-session-todo__done-btn text-only">
                                                Done
                                        </button>
                                    </div>
                                {/if}
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
                                bind:value={todoToEditTitle}
                            />
                        </form>
                        <div class="active-session__tasks-new-todo-btn-container">
                            <button 
                                disabled={!isTodoTitleValid} 
                                class="active-session__tasks-add-btn unfill unfill--oval"
                                on:click={newTodoAddBtnHandler}>
                                    Add
                            </button>
                            <button 
                                on:click={newTodoCancelBtnHandler}
                                class="active-session__tasks-cancel-btn unfill unfill--oval">
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
                    <button class="active-session__tasks-finish-session-btn unfill unfill--oval">
                        Finish Session <span>👏</span>
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    $bento-box-padding: 8px;

    .active-session-container {
        position: relative;
        color: rgb(var(--textColor1));
    }
    
    /* Actual Active Session Component */
    .active-session {
        &--dark &__bento-box h4 {
            color: rgba(var(--textColor1), 1);
            font-weight: 600;
        }
        &--dark &__header-time-period {
            font-weight: 300;
        }
        &--dark &__header-session-details-data {
            h6 {
                font-weight: 500;
            }
            span {
                font-weight: 300;
            }
        }
        &--dark &__pom-timer h1 {
            font-weight: 400;
        }
        &--dark &__pom-btn-container button {
            background-color: var(--hoverColor) !important;
        }
        &--dark &__pom-btn-container button {
            background-color: var(--hoverColor) !important;
        }

        &__bento-box {
            position: relative;
            h4 {
                font-size: 1.5rem;
                color: rgba(var(--textColor1), 0.85);
            }
        }

        &__top-container {
            width: 100%;
            display: block;
        }
        
        /* Header */
        &__header {
            width: 100%;
        }
        &__header-name {
            display: flex;
            margin-bottom: 2px;
            h4 {
                font-size: 1.5rem;
                max-width: 145px;
                margin-right: 8px;
                max-width: 600px;
                @include elipses-overflow;
            }
        }
        &__header-time-period {
            @include flex-container(center, _);
            span {
                font-size: 1.15rem;
                font-weight: 500;
                white-space: nowrap;
                color: rgba(var(--textColor1), 0.4);
            }

            .divider {
                width: 0.5px;
                height: 9px;
                background-color: rgba(var(--textColor1), 0.8);
                margin: 0px 10px;
            }
        }
        &__header-tag {
            color: white;
            border-radius: 20px;
            @include center;
            padding: 2px 12px;
            font-size: 0.95rem;
            font-weight: 500;
            p {
                @include elipses-overflow;
            }
        }
        &__header-edit-button {
            @include pos-abs-top-right-corner(-5px, -5px);
            svg {
                transition: 0.15s ease-in-out;
                color: rgba(var(--textColor1), 0.4);
            }
            &:hover {
                background-color: var(--secondaryBgColor);
                svg {
                    color: rgba(var(--textColor1), 0.7);
                }
            }
            &:active {
                transform: scale(0.92);
            }
        }

        /* Pomodoro Component */
        &__pom {
            height: 120px;
            width: 100%;
            margin: 15px 0px 25px 0px;
        }
        &__pom-details {
            text-align: center;
            margin-top: 0px;
        }
        &__pom-message {
            display: block;
            margin-top: -2px;
            font-weight: 500;
            font-size: 1.4em;
            color: rgba(var(--textColor1), 0.42);
        }
        &__pom-timer {
            @include flex-container(baseline, center);
            h1 {
                margin: -8px 10px 0px 0px;
                font-size: 6rem;
                font-weight: 500;
                color: rgba(var(--textColor1), 0.85);
                width: 170px;
            }
            span {
                display: none;
                color: rgba(var(--textColor1), 0.5);
            }
        }
        &__pom-btn-container {
            margin-top: 2px;
            @include pos-abs-bottom-right-corner(-5px,-3px);
            button {
                margin-right: 4px;
                transition: 0.1s ease-in-out;
                padding: 8px 13px 5px 13px;
                border-radius: 8px;
                position: relative;
                background-color: var(--bentoBoxBgColor);
                box-shadow: var(--bentoBoxShadow);
                @include flex-container(center, center);

                &:active {
                    transform: scale(0.98);
                }
                span {
                    display: block;
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-top: -2px;
                    color: rgba(var(--fgColor1), 0.9);
                }
                i  {
                    color: rgba(var(--fgColor1), 0.9);
                    font-size: 1rem;
                    margin: 0px 10px 2px 0px;
                }
            }
        }

        /* Tasks Component */
        &__tasks {
            height: 100%;
            width: 100%;
        }
        &__tasks-header {
            @include flex-container(center, space-between);
            h4 {
                margin-bottom: 5px;
            }
            p {
                opacity: 0.35;
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 3px;
            }
        }
        &__tasks-todo-list {
            overflow-y: scroll;
            overflow-x: hidden;
            height: 70%;
            min-height: 100px;
            max-height: 250px;
            padding-top: 4px;
        }
        &__tasks-new-task-btn {
            transition: 0.15s ease-in-out;
            opacity: 0.35;
            padding: 10px 10px 18px 0px;
            margin: 3px 0px -5px 3px;
            font-size: 1.2rem;
            @include flex-container(center, center);

            span {
                font-size: 1.3rem;
                margin-right: 18px;
            }
            &:hover {
                opacity: 1;
            }
            &:active {
                opacity: 1;
            }
        }
        &__tasks-new-todo-input-container {
            margin: -2px 0px 0px 3px;
            @include flex-container(center, space-between);

            form {
                width: 100%;
            }
        }
        &__tasks-new-todo-input {
            cursor: text;
            width: 90%;
            font-size: 1.15rem;
            font-weight: 500;
            transition: 0.1s ease-in-out;
            margin: 20px 0px 10px 0px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(var(--fgColor2), 0.3);
            
            &::placeholder {
                opacity: 0.5;
            }
            &:focus {
                border-bottom: 1px solid rgba(var(--fgColor2), 0.7);
            }
            &:focus::placeholder {
                opacity: 0.6;
            }
        }
        &__tasks-new-todo-btn-container {
            margin: 8px 0px 0px -5px;
            display: flex;
            button {
                @include center;
                color: rgb(var(--fgColor2));
                border-color: rgb(var(--fgColor2));
                padding: 6px 12px 6px 12px;

                &:hover {
                    background: rgb(var(--fgColor2));
                }
                &:first-child {
                    margin-right: 5px;
                }
            }
        }
        &__tasks-add-btn {
            &:disabled {
                opacity: 0.5;
            }
            &:disabled {
                &:hover {
                    background: none;
                    color: rgb(var(--fgColor2));
                }
            }
        }
        &__tasks-finish-session-btn {
            color: rgb(var(--fgColor2));
            border-color: rgb(var(--fgColor2));
            @include pos-abs-bottom-right-corner(0px, 10px);

            span {
                margin-left: 5px;
            }

            &:hover {
                background-color: rgb(var(--fgColor2));
                color: var(--secondaryBgColor);
            }
        }
    }

    /* Todo Component in Subtasks Section */
    .active-session-todo {
        position: relative;
        @include flex-container(center, _);

        .divider {
            margin: 0px;
            background-color: rgba(var(--textColor1), 0.06);
            height: 0.5px;
        }

        &--editing > &__right-container {
            border: 1px solid rgba(var(--textColor1), 0.1);
            border-radius: 8px;
            padding: 9px 0px 9px 2px;
            font-size: 1.2rem;
            font-weight: 500;
            color: rgba(var(--textColor1), 0.7);
        }
        &--editing > .divider {
            display: none;
        }
        &--editing > form {
            display: block;
        }

        &--light-mode .divider {
            background-color: rgba(var(--textColor1), 0.16);
        }
        &--light-mode &__check-box {
            border: 2px solid rgb(var(--fgColor1));
        }
        &--light-mode &__dotted-line {
            border-left: 2px dotted rgb(var(--fgColor1));
            left: 8px;
        }
        &--light-mode &__solid-line {
            
            &::after {
                border-left: 1.2px solid rgb(var(--fgColor1));
                left: 8px;
            }
        }
        &--light-mode &__name {
            font-weight: 500;
        }
        &:first-child {
            margin-top: -4px;
        }
        &:hover > &__edit-button { 
            transition: 0.2s ease-in-out;
            visibility: visible;
            opacity: 0.5;
        }
        
        /* Check Box */
        &__check-box {
            @include circle(13.5px);
            @include flex-container(center, center);
            transition: 0.1s ease-in-out;
            position: relative;
            margin-right: 8.5px;
            border: 1.5px solid rgb(var(--fgColor1));
            color: rgb(var(--textColor2));

            i {
                margin-top: 1px;
                font-size: 0.8rem;
                display: none;
            }
            &:hover {
                background-color: rgba(var(--fgColor1), 0.2);
            }
            &:active {
                transform: scale(0.9);
            }
            &--finished > i {
                display: block;
            }
            &--finished {
                background-color: rgb(var(--fgColor1));
                &:hover {
                    background-color: rgb(var(--fgColor1));
                }
                // &:hover > i:before {
                //     font-size: 0.9rem;
                //     content: "\f00d";
                // }
            }
            &--edit-mode {
                margin-top: -40px;
                &:hover {
                    background: none;
                }
            }
        }
        &__dotted-line {
            position: absolute;
            width: 1px;
            transition: 0.2s ease-in-out;
            border-left: 1.45px dotted rgb(var(--fgColor1));
            bottom: -10px;
            height: 21px;
            left: 7.7px;
        }
        &__solid-line {
            position: relative; 

            @keyframes progress-line {
                0%   { height : 0; }
                100% { height: 17px; }
            }

            &::after {
                content: ' ';
                position: absolute;
                bottom: -30px;
                left: 7.3px;
                height: 25px;
                border-left: 1.2px solid rgb(var(--fgColor1));
                animation-name: progress-line;
                animation-duration: 0.1s;
                animation-timing-function: ease-in-out;
                animation-iteration-count: 1;
                animation-fill-mode: backwards; 
            }
        }

        /* Todo Content Stuff */
        &__right-container {
            padding-left: 7px; 
            width: 100%;
        }
        &__name {
            margin: 9px 0px;
            padding: 2px 0px;
            transition: 0.13s ease-in-out;
            opacity: 0.7;
            font-size: 1.2rem;
            
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
                background: rgb(var(--textColor1));
                animation-name: strike;
                animation-duration: 0.13s;
                animation-timing-function: ease-in-out;
                animation-iteration-count: 1;
                animation-fill-mode: forwards; 
            }
            &--finished {
                opacity: 0.2;
            }
        }
        &__edit-button {
            transition: 0.01s ease-in-out;
            visibility: hidden;
            opacity: 0;
            padding: 0px 10px;
            margin: 0px;

            @include pos-abs-top-right-corner(13px, -10px);

            &:hover {
                opacity: 1 !important;
            }
            span {
                font-size: 1.05rem;
                margin-left: 5px;
            }
        }
        &__edit-btn-container {
            @include pos-abs-bottom-right-corner(12px, 10px);
            button {
                font-size: 1.07rem;
                transition: 0.01s ease-in-out;
            }
        }
        &__delete-btn {
            margin-right: 10px;
            color: rgba(227, 145, 132, 0.7);
        }
        &__done-btn {
            color: rgba(var(--textColor1), 0.7);
            &:hover {
                color: rgba(var(--textColor1), 1);
            }
            &:disabled {
                opacity: 0.3;
            }
        }
        &__edit-todo-input {
            cursor: text;
            width: 90%;
            margin-left: 6px;

            &::placeholder {
                opacity: 0.5;
            }
        }
    }

    /* Edit Active Session Modal */
    .active-session-modal {
        background-color: var(--modalBgColor);
        height: 215px;
        width: 250px;

        &--light-mode h1 {
            font-weight: 700;
        }
        &--light-mode h3 {
            font-weight: 600;
        }


        h1 {
            margin-bottom: 25px;
        }
        h3 {
            opacity: 0.9;
            margin-bottom: 10px;
        }
        input {
            margin-bottom: 25px;
            border-bottom: 1px solid rgba(var(--textColor1), 0.1);
            width: 100%;
            padding-bottom: 5px;
            color: rgba(var(--textColor1), 0.4);
            font-size: 1.3rem;
            font-weight: 400;

            &::placeholder {
                color: rgba(var(--textColor1), 0.2);
            }
            &:focus {
                color: rgba(var(--textColor1), 0.7);
                box-shadow: -1px 4px 7px -6px rgba(var(--fgColor2), 0.4);
                border-bottom: 1px solid rgba(var(--fgColor2), 1);
            }
        }
        &__buttons-container {
            width: 250px;
            margin-top: 35px;
            display: flex;
            width: 100%;

            button {
                width: 50%;
            }
        }
        &__cancel-btn {
            margin-right: 5px;
        }
    }

    .tag-dropdown {
        @include flex-container(center, _);
        &__dropdown-btn-tag {
            @include circle(8px);
            margin-right: 7px;
        }
        .dropdown-menu {
            position: absolute;
            top: 35px;
            width: 100px;
            &__option {
                p {
                    margin-left: 3px;
                }
                span {
                    margin-right: 3px;
                }
            }
        }
    }
</style>
