<script lang="ts">
	import { clickOutside } from "$lib/helper";
	import { colorThemeState } from "$lib/store";
	import PomProgressBar from "./PomProgressBar.svelte";

    let currentActiveSession = {
        title: "Math Homework",
        tag:  {
            title: "school",
            color: "#9997FE"
        }
    }
    let newTag = { 
        title: currentActiveSession.tag.title, 
        color: currentActiveSession.tag.color 
    }
    let tags = [
        {
            title: "school",
            color: "#9997FE"
        },
        {
            title: "swe",
            color: "#FF8B9C"
        },
        {
            title: "book",
            color: "#CFAB96"
        },
    ]
    let todos = [
        {
            title: "Reach CH 3.1",
            isComplete: false
        },
        {
            title: "Math Homework",
            isComplete: false
        },
        {
            title: "Read a Book",
            isComplete: false
        },
        {
            title: "Reach CH 3.3",
            isComplete: false
        }
    ]

    let isAllTodoChecked = true
    let completedTodosCount = 0

	const handleCheckBoxClicked = (idx: number) => {
        const todoClicked = todos[idx]
        if (todoClicked.isComplete) {
            completedTodosCount--
        } else {
            completedTodosCount++
        }

        todos[idx].isComplete = !todos[idx].isComplete
	}

    /* Editing Session */
    let isEditSessionModalOpen = false
    let newSessionTitle = ""
    let isNewSessionTitleValid = true
    let isTagListDropDownOpen = false
    let isNewTagModalOpen = false

    let isLightTheme = false
    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    const handleEditSessionBtnClicked = () => {
        isEditSessionModalOpen = true
        newSessionTitle = currentActiveSession.title
    }
    const handleEditSessionDoneBtnClicked = () => {
        currentActiveSession.title = newSessionTitle

        if (newTag.title != "") {
            currentActiveSession.tag.title = newTag.title
            currentActiveSession.tag.color = newTag.color
        }
        
        handleEditSessionCancelClicked()
    }
    const handleEditSessionCancelClicked = () => {
        todoToEditNewTitle = ""
        isNewSessionTitleValid = true
        isTagListDropDownOpen = false
        isEditSessionModalOpen = false
        newTag = { 
            title: currentActiveSession.tag.title, 
            color: currentActiveSession.tag.color 
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
    const handleNewTagClicked = (tag: { title: string, color: string }) => {
        isTagListDropDownOpen = false
        
        newTag.title = tag.title
        newTag.color = tag.color
    }
    const handleCreateTagBtnClicked = () => {
        isTagListDropDownOpen = false
        isNewTagModalOpen = false
    }


    /* Editing a Todo */
    let todoToEditIndex = -1
    let todoToEditNewTitle = ""
    let isTodoToEditTitleValid = true

    const handleTodoEditButtonClicked = (index: number) => {
        todoToEditIndex = index
        todoToEditNewTitle = todos[index].title
    }
    const handleEditTodoDeleteBtnClicked = (index: number) => {
        if (todos[index].isComplete) completedTodosCount--
        todos.splice(index, 1)
        todos.length = todos.length

        todoToEditIndex = -1
        todoToEditNewTitle = ""
    }
    const handleEditTodoDoneBtnClicked = () => {
        todos[todoToEditIndex].title = todoToEditNewTitle

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

    /* Adding New Todo */
    let isMakingNewTask = false
    let todoToEditTitle = ""
    let isTodoTitleValid = false

    const newTodoCancelBtnHandler = () => {
        todoToEditTitle = ""
        isTodoTitleValid = false
        isMakingNewTask = false
    }
    const newTodoAddBtnHandler = () => {
        todos.push({ title: todoToEditTitle, isComplete: false })
        todos.length = todos.length

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
                            <div class="dropdown-btn__title">
                                {newTag.title}
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
                                    <li class={`dropdown-menu__option ${tag.title === newTag.title ? "dropdown-menu__option--selected" : ""}`}>
                                        <button class="dropdown-element" on:click={() => handleNewTagClicked(tag)}>
                                            <div class="tag-dropdown__dropdown-btn-tag" style={`background-color: ${tag.color}`}></div>
                                            <p>{tag.title}</p>
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
    <div class="active-session">
        <div class="flx">
            <!-- Session Details Header -->
            <div class="active-session__header active-session__bento-box">
                <div class="active-session__header-title">
                    <h4>{currentActiveSession.title}</h4>
                    <div class="active-session__header-tag" style={`background-color: ${currentActiveSession.tag.color}`}>
                        <p title={currentActiveSession.tag.title} >{currentActiveSession.tag.title[0].toUpperCase()}</p>
                    </div>
                </div>
                <button on:click={handleEditSessionBtnClicked} class="active-session__header-edit-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(1 10)">
                            <circle cx="2" cy="0.8" r="1.2"></circle>
                            <circle cx="8" cy="0.8" r="1.2"></circle>
                            <circle cx="14" cy="0.8" r="1.2"></circle>
                        </g>
                    </svg>
                </button>
                <div class={`active-session__header-session-details ${isLightTheme ? "active-session__header-session-details--light-mode" : ""}`}>
                    <span class="active-session-header-time-period">
                        6:21 PM - 10:23 PM
                    </span>
                    <div class="divider divider--vertical">|</div>
                    <span class="active-session-header-time-period">
                        45 min × 3 min
                    </span>
                </div>
            </div>
            <!-- Pomodoro Timer -->
            <div class="active-session__pom-view active-session__bento-box">
                <div class="active-session__pom-view-bar-container">
                    <PomProgressBar/>
                </div>
            </div>
        </div>
        <!-- Active Session Tasks -->
        <div class="active-session__tasks active-session__bento-box">
            <div class="active-session__tasks-subheader">
                <h5 class="subheading-2">Session Subtasks</h5>
                <p>
                    {#if todos.length === 0}
                        No substasks
                    {:else}
                        {completedTodosCount} / {todos.length}
                    {/if}
                </p>
            </div>
            <!-- To Do List -->
            <ul class="active-session__tasks-todo-list">
                {#each todos as todo, idx}
                <!-- To Do List Item -->
                <li 
                    class={`active-session-todo 
                             ${todoToEditIndex === idx ? "active-session-todo--editing" : ""}
                             ${isLightTheme ? "active-session-todo--light-mode" : ""}
                          `}
                >
                        <!-- Check Box -->
                        {#if isMakingNewTask || idx != todos.length - 1}
                            {#if todo.isComplete && idx + 1 < todos.length && todos[idx + 1].isComplete} 
                                <div class="active-session-todo__line active-session-todo__solid-line active-session-todo__solid-line"></div>
                            {:else}
                                <div class="active-session-todo__line active-session-todo__dotted-line"></div>
                            {/if}
                        {/if}
                        <button  on:click={() => handleCheckBoxClicked(idx)} class={`active-session-todo__check-box ${todo.isComplete ? "active-session-todo__check-box--finished" : ""}`}>
                            <i class="fa-solid fa-check"></i>
                        </button> 
                        <!-- Content -->
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
                                {#if todoToEditIndex < 0 || idx != todoToEditIndex + 1} <!-- Do not remember below todo's top divider line -->
                                    <div class="divider divider--thin"></div>
                                {/if}
                                <p class={`active-session-todo__title ${todo.isComplete ? "active-session-todo__title--finished" : ""}`}>
                                    {#if todo.isComplete} 
                                        <span class="strike">{todo.title}</span>
                                    {:else}
                                        {todo.title}
                                    {/if}
                                </p>
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
                <!-- New Task Button -->
                {#if isMakingNewTask}
                    <li class={`active-session-todo ${isLightTheme ? "active-session-todo--light-mode" : ""}`}>
                        <button disabled class="active-session-todo__check-box active-session-todo__check-box--edit-mode">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <div class="active-session-todo__right-container">
                            <div class="divider divider--thin"></div>
                                <!-- <p class="session-todo__text">Add New Task</p> -->
                                <form>
                                    <input 
                                        class="active-session-todo__new-todo-input paragraph-2"
                                        placeholder="New Subtask" 
                                        on:input={newTodoTextInputHandler}
                                        bind:value={todoToEditTitle}
                                    />
                                </form>
                            <div class="active-session-todo__new-todo-btn-container">
                                <button 
                                    disabled={!isTodoTitleValid} 
                                    class="active-session-todo__add-btn unfill unfill--oval"
                                    on:click={newTodoAddBtnHandler}>
                                        Add
                                </button>
                                <button 
                                    on:click={newTodoCancelBtnHandler}
                                    class="active-session-todo__cancel-btn unfill unfill--oval">
                                        Cancel
                                </button>
                            </div>
                        </div>
                    </li>
                {:else}
                    <button class="active-session__tasks-new-task-btn paragraph-2" on:click={() => isMakingNewTask = true}>
                        <span>+</span> Add New Task
                    </button>
                {/if}
            </ul>
            {#if todos.length > 0 && completedTodosCount === todos.length}
                <div class="flx flx--right">
                    <button class="active-session__tasks-finish-session-btn unfill unfill--oval">
                        Finish Session <span>👏</span>
                    </button>
                </div>
            {/if}
            </div>
        </div>
</div>

<style lang="scss">
    $bento-box-padding: 6px;

    .active-session-container {
        position: relative;
        color: rgb(var(--textColor1));
        margin: 20px 0px 100px 0px;
        h1 {
            font-size: 1.4rem;
            margin-bottom: 2px;
        }
    }
    /* Edit Active Session Modal */
    .active-session-modal {
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
    
    /* Actual Active Session Component */
    .active-session {
        min-height: 160px;
        position: relative;
        margin-top: 10px;
        background-color: var(--secondaryBgColor);
        border-radius: 22px;
        border: var(--borderVal);
        box-shadow: var(--shadowVal);
        padding: 12px 15px 15px 15px;

        &__bento-box {
            position: relative;
            background-color: var(--tertiaryBgColor);
            border: var(--activeSessionItemBorderVal);
            box-shadow: var(--activeSessionItemShadowVal);
            padding: 10px 25px 14px 15px;
            border-radius: 15px;
            overflow: hidden;
        }
        
        &__top-row {
            display: flex;
            margin-bottom: $bento-box-padding;
        }
        /* Header */
        &__header {
            width: 35%;
            margin-right: $bento-box-padding;
        }
        &__header-title {
            display: flex;
            margin-bottom: 2px;
            width: 80%;
            h4 {
                max-width: 145px;
                margin-right: 8px;
                @include elipses-overflow;
            }
        }
        &__header-tag {
            color: white;
            border-radius: 20px;
            @include center;
            @include circle(12px);
            margin: 4px 0px 4px 0px;
            font-size: 8px;
            max-width: 70px;
            font-family: "Apercu";
            p {
                @include elipses-overflow;
            }
        }
        &__header-session-details {
            color: rgba(var(--textColor1), 0.5);
            @include flex-container(center, _);
            font-weight: 300;
            width: 100%;

            &--light-mode span {
                font-weight: 500;
            }

            span {
                font-size: 0.95rem;
                white-space: nowrap;
            }
            .divider {
                margin: 0px 8px !important;
                background-color: rgba(var(--textColor1), 0.3);
                height: 7px !important;
                width: 0.4px;
                color: transparent;  // added "|", will disappear when squeezed
            }
        }
        &__header-edit-button {
            padding: 0px 5px;
            border-radius: 5px;
            @include pos-abs-top-right-corner(8px, 8px);
            
            svg {
                transition: 0.15s ease-in-out;
                color: rgba(var(--textColor1), 0.25);
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

        /* Pomodoro View */
        &__pom-view {
            width: 65%;
            position: relative;
        }
        &__pom-view-bar-container {
            width: 85%;
            margin-top: -3px;
            @include abs-center;
        }

        /* Tasks Component */
        &__tasks {
            margin-top: $bento-box-padding;
        }
        &__tasks-subheader {
            @include flex-container(center, space-between);
            margin-bottom: 12px;
            h5 {
                opacity: 0.85;
            }
            p {
                opacity: 0.6;
            }
        }
        &__tasks-todo-list {
            margin-bottom: 0px;
        }
        &__tasks-new-task-btn {
            transition: 0.15s ease-in-out;
            opacity: 0.35;
            padding: 10px 10px 10px 0px;
            margin: -5px 0px 0px 4px;
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
        &__tasks-finish-session-btn {
            color: rgb(var(--fgColor2));
            border-color: rgb(var(--fgColor2));

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
        @include flex-container(center, _);
        position: relative;
        cursor: pointer;

        &--editing > &__right-container {
            border: 0.3px solid rgba(var(--textColor1), 0.1);
            border-radius: 5px;
            padding: 8px 0px 8px 0px;
        }
        &--editing > .divider {
            display: none;
        }
        &--editing > form {
            display: block;
        }

        &--light-mode &__check-box {
            border: 1.5px solid rgb(var(--fgColor2));
        }
        &--light-mode &__dotted-line {
            border-left: 1.5px dotted rgb(var(--fgColor2));
            left: 7px;
        }
        &--light-mode &__solid-line {
            
            &::after {
                border-left: 1.2px solid rgb(var(--fgColor2));
                left: 7px;
            }
        }
        &--light-mode &__title {
            font-weight: 500;
        }

        .divider {
            margin: 0px;
        }

        &:hover > &__edit-button { 
            transition: 0.2s ease-in-out;
            visibility: visible;
            opacity: 0.5;
        }
        
        /* Check Box */
        &__check-box {
            @include circle(12px);
            @include flex-container(center, center);
            transition: 0.1s ease-in-out;
            position: relative;
            margin-right: 8.5px;
            border: 1px solid rgb(var(--fgColor2));
            color: rgb(var(--textColor2));

            i {
                font-size: 0.7rem;
                display: none;
            }
            &:hover {
                background-color: rgba(var(--fgColor2), 0.2);
            }
            &:active {
                transform: scale(0.9);
            }
            &--finished > i {
                display: block;
            }
            &--finished {
                background-color: rgb(var(--fgColor2));
                &:hover {
                    background-color: rgb(var(--fgColor2));
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
            left: 6px;
            transition: 0.2s ease-in-out;
            border-left: 1.45px dotted rgb(var(--fgColor2));
            bottom: -9px;
            height: 19px;
            left: 6.5px;
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
                bottom: -25px;
                left: 6.5px;
                height: 22px;
                border-left: 1.2px solid rgb(var(--fgColor2));
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
        &__title {
            margin: 9px 0px;
            transition: 0.13s ease-in-out;
            opacity: 0.7;
            
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
        &__edit-btn-container {
            @include pos-abs-bottom-right-corner(15px, 10px);
            button {
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
        &__new-todo-input {
            margin: 8px 0px 5px 0px;
            cursor: text;
            width: 50%;
            font-size: 1.1rem;
            font-weight: 400;

            &::placeholder {
                opacity: 0.5;
            }
        }
        &__new-todo-btn-container {
            display: flex;
            margin: 8px 0px 10px -5px;
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
        &__add-btn {
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
        &__cancel-btn {
        }
        &__edit-button {
            transition: 0.01s ease-in-out;
            visibility: hidden;
            opacity: 0;
            padding: 0px 10px;
            margin: 0px;

            @include pos-abs-top-right-corner(8px, -10px);

            &:hover {
                opacity: 1 !important;
            }
            span {
                margin-left: 5px;
            }
        }
    }
</style>
