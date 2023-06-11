<script lang="ts">
	import { clickOutside } from "$lib/helper";

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
    <div class={`modal-bg ${isEditSessionModalOpen ? "" : "modal-bg--hidden"}`}>
        <div 
            use:clickOutside on:click_outside={() => isEditSessionModalOpen = false} 
            class="modal-bg__content modal-bg__content--overflow-show modal-bg__content--small"
        >
            <div class="active-session-modal">
                <h1>Edit Active Session</h1>
                <h2>Title</h2>
                <input 
                    type="text" 
                    placeholder="Rename Session Name"
                    on:input={editActiveSessionTitleInputHandler}
                    bind:value={newSessionTitle}
                />
                <div class="flx flx--space-between">
                    <h2>Tag</h2>
                    <div class="tag-dropdown dropdown-container">
                        <button on:click={toggleTagDropdownList} class="tag-dropdown__dropdown-btn dropdown-btn">
                            <div class="tag-dropdown__dropdown-btn-tag" style={`background-color: ${newTag.color}`}></div>
                            <div class="dropdown-btn__title">
                                {newTag.title}
                            </div>
                            <div class="dropdown-btn__icon">
                                <div class="dropdown-btn__icon-triangle-up">
                                    <i class="fa-solid fa-chevron-up"></i>
                                </div>
                                <div class="dropdown-btn__icon-triangle-down">
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
                                    <div class="divider"></div>
                                    <button on:click={handleCreateTagBtnClicked}>
                                        <p>+</p>
                                        <p>New Tag</p>
                                    </button>
                                </li>
                            </ul>
                        {/if}
                    </div>
                </div>
                <div class="active-session-modal__buttons-container">
                    <button 
                        class="active-session-modal__cancel-btn btn-line" 
                        on:click={handleEditSessionCancelClicked}>
                            Cancel
                    </button>
                    <button 
                        disabled={!isNewSessionTitleValid}
                        class="active-session-modal__done-btn btn-line" 
                        on:click={handleEditSessionDoneBtnClicked}>
                            Save Changes
                    </button>
                </div>
            </div>
        </div>
    </div>

    <h1>Active Session</h1>
    <div class="active-session-container__session-details">
        <p>Started at 12:23 PM</p>
        <div class="divider divider--vertical"></div>
        <p>45 min x 3</p>
    </div>
    <div class="active-session">
        <div class="active-session__header">
            <h2>{currentActiveSession.title}</h2>
            <button on:click={handleEditSessionBtnClicked} class="active-session__edit-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(1 10)">
                        <circle cx="2" cy="1.7" r="1.7"></circle>
                        <circle cx="8.5" cy="1.7" r="1.7"></circle>
                        <circle cx="15" cy="1.7" r="1.7"></circle>
                    </g>
                </svg>
            </button>
        </div>
        <div class="active-session__tag" style={`background-color: ${currentActiveSession.tag.color}`}>
            <p>{currentActiveSession.tag.title}</p>
        </div>
        <div class="active-session__subheader">
            <h3>Session Subtasks</h3>
            <p>
                {#if todos.length === 0}
                    No substasks
                {:else}
                    {completedTodosCount} / {todos.length}
                {/if}
            </p>
        </div>
        <ul class="active-session__todo-list">
            {#each todos as todo, idx}
                <li class={`active-session-todo ${todoToEditIndex === idx ? "active-session-todo--editing" : ""}`}>
                    {#if isMakingNewTask || idx != todos.length - 1}
                        {#if todo.isComplete && idx + 1 < todos.length && todos[idx + 1].isComplete} 
                            <div class="active-session-todo__line active-session-todo__solid-line active-session-todo__solid-line"></div>
                        {:else}
                            <div class="active-session-todo__line active-session-todo__dotted-line"></div>
                        {/if}
                    {/if}
                    <button on:click={() => handleCheckBoxClicked(idx)} class={`active-session-todo__check-box ${todo.isComplete ? "active-session-todo__check-box--finished" : ""}`}>
                        <i class="fa-solid fa-check"></i>
                    </button> 
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
                            <div class="divider"></div>
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
                                class="active-session-todo__delete-btn btn-text-only"
                                on:click={() => handleEditTodoDeleteBtnClicked(idx)}>
                                    Delete
                            </button>
                            <button
                                disabled={!isTodoToEditTitleValid} 
                                on:click={handleEditTodoDoneBtnClicked}
                                class="active-session-todo__done-btn btn-text-only">
                                    Done
                            </button>
                        </div>
                    {/if}
                </li>
            {/each}
            {#if isMakingNewTask}
                <li class="active-session-todo">
                    <button disabled class="active-session-todo__check-box active-session-todo__check-box--edit-mode">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <div class="active-session-todo__right-container">
                        <div class="divider"></div>
                            <!-- <p class="session-todo__text">Add New Task</p> -->
                            <form>
                                <input 
                                    class="active-session-todo__new-todo-input"
                                    placeholder="New Subtask" 
                                    on:input={newTodoTextInputHandler}
                                    bind:value={todoToEditTitle}
                                />
                            </form>
                        <div class="active-session-todo__new-todo-btn-container">
                            <button 
                                disabled={!isTodoTitleValid} 
                                class="active-session-todo__add-btn btn-line"
                                on:click={newTodoAddBtnHandler}>
                                    Add
                            </button>
                            <button 
                                on:click={newTodoCancelBtnHandler}
                                class="active-session-todo__cancel-btn btn-line">
                                    Cancel
                            </button>
                        </div>
                    </div>
                </li>
            {:else}
                <button class="active-session__new-task-btn" on:click={() => isMakingNewTask = true}>
                    <span>+</span> Add New Task
                </button>
            {/if}
        </ul>
        {#if todos.length > 0 && completedTodosCount === todos.length}
        <div class="flx flx--right">
            <button class="active-session__finish-session-btn btn-line">
                Finish Session <span>👏</span>
            </button>
        </div>
        {/if}
    </div>
</div>

<style lang="scss">
    .active-session-container {
        position: relative;
        color: rgb(var(--textColor1));
        margin: 20px 0px 100px 0px;
        h1 {
            font-size: 1.4rem;
        }
        &__session-details {
            @include flex-container(center, _);
            height: 9px;
            display: flex;
            width: auto;
            font-size: 0.96rem;
            @include pos-abs-top-right-corner(5px, 0px);
            opacity: 0.5;

            .divider {
                margin: 0px 7px;
                height: 80%;
                width: 0.85px;
                opacity: 0.4;
            }
        }
    }
    .active-session-modal {
        height: 200px;
        width: 250px;
        h1 {
            font-size: 1.6rem;
            margin-bottom: 15px;
        }
        h2 {
            font-size: 1.3rem;
            margin-bottom: 10px;
        }
        input {
            margin-bottom: 25px;
            border-bottom: 1px solid rgba(var(--fgColor4), 0.7);
            width: 100%;
            padding-bottom: 5px;
            &::placeholder {
                color: rgba(var(--textColor1), 0.4);
            }
            &:focus {
                box-shadow: 0px 4px 7px -4px rgba(var(--fgColor4), 0.6);
                border-bottom: 1px solid rgba(var(--fgColor4), 1);
            }
        }
        &__buttons-container {
            width: 250px;
            margin-top: 30px;
            display: flex;
            width: 100%;

            button {
                @include center;
                width: 50%;
                color: rgb(var(--fgColor4));
                border-color: rgb(var(--fgColor4));

                &:hover {
                    background-color: rgb(var(--fgColor4));
                }
                &:disabled {
                    opacity: 0.4;
                    &:hover {
                        color: rgb(var(--fgColor4));
                        background: none;
                    }
                }
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
            }
        }
    }
    .active-session {
        min-height: 160px;
        position: relative;
        margin-top: 10px;
        background-color: var(--secondaryBgColor);
        border-radius: 8px;
        border: var(--borderVal);
        box-shadow: var(--shadowVal);
        padding: 10px 20px 20px 20px;

        &__header {
            @include flex-container(center, space-between);
            h2 {
                font-size: 1.3rem;
            }
        }
        &__edit-button {
            transition: 0.08s ease-in-out;
            padding: 0px 5px;
            border-radius: 5px;
            margin-right: -5px;

            svg {
                color: rgba(var(--textColor1), 0.7);
            }
            &:hover {
                background-color: var(--secondaryBgColor);
                filter: brightness(0.97);
                svg {
                    color: rgba(var(--textColor1), 1);
                }
            }
        }
        &__tag {
            color: white;
            border-radius: 20px;
            @include flex-container(center, center);
            font-size: 0.8rem;
            padding: 2px 8px;
            margin: 2px 0px 14px 0px;
            display: inline-block;
        }
        &__subheader {
            @include flex-container(center, space-between);
            margin-bottom: 12px;
            h3 {
                opacity: 0.85;
            }
            p {
                opacity: 0.6;
            }
        }
        &__todo-list {
            margin-bottom: 0px;
        }
        &__new-task-btn {
            transition: 0.15s ease-in-out;
            opacity: 0.65;
            padding: 10px 10px 10px 0px;
            margin: -5px 0px 0px 3px;
            @include flex-container(center, center);

            span {
                font-size: 1.35rem;
                margin-right: 18px;
            }
            &:hover {
                opacity: 1;
            }
            &:active {
                opacity: 1;
                transform: scale(0.98);
            }
        }
        &__finish-session-btn {
            color: rgb(var(--fgColor4));
            border-color: rgb(var(--fgColor4));

            span {
                margin-left: 5px;
            }

            &:hover {
                background-color: rgb(var(--fgColor4));
                color: var(--secondaryBgColor);
            }
        }

        .divider {
            background-color: rgba(var(--textColor2), 0.1) !important;
            margin: 0px;
        }
    }

    .active-session-todo {
        @include flex-container(center, _);
        position: relative;
        cursor: pointer;

        &--editing > &__right-container {
            border: 1px solid rgba(var(--textColor1), 0.1);
            border-radius: 5px;
            padding: 8px 0px 8px 0px;
        }
        &--editing > .divider {
            display: none;
        }
        &--editing > form {
            display: block;
        }

        &:hover > &__edit-button { 
            transition: 0.2s ease-in-out;
            visibility: visible;
            opacity: 0.5;
        }
        
        &__check-box {
            @include circle(11px);
            @include flex-container(center, center);
            
            transition: 0.1s ease-in-out;
            position: relative;
            border: 1.9px solid rgb(var(--fgColor3));
            margin-right: 8.5px;
            color: rgb(var(--textColor4));

            i {
                font-size: 0.7rem;
                display: none;
            }
            &:hover {
                background-color: rgba(var(--fgColor3), 0.2);
            }
            
            &--finished > i {
                display: block;
            }
            &--finished {
                background-color: rgb(var(--fgColor3));
                &:hover {
                    background-color: rgb(var(--fgColor3));
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
            border-left: 2px dotted rgb(var(--fgColor3));
            left: 6px;
            height: 0px;
            bottom: 0px;
            transition: 0.2s ease-in-out;
            border-left: 1.5px dotted rgb(var(--fgColor3));
            bottom: -9px;
            height: 17px;
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
                bottom: -23px;
                left: 6.5px;

                height: 17px;
                border-left: 1.2px solid rgb(var(--fgColor3));

                animation-name: progress-line;
                animation-duration: 0.1s;
                animation-timing-function: ease-in-out;
                animation-iteration-count: 1;
                animation-fill-mode: backwards; 
            }
        }
        &__right-container {
            padding-left: 7px; 
            width: 100%;
        }
        &__title {
            font-size: 1.05rem;
            margin: 7px 0px;
            transition: 0.13s ease-in-out;
            
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
                opacity: 0.4;
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
            &:hover {
                color: #e42828;
            }
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
            font-size: 1.05rem;
            width: 90%;
            margin-left: 6px;

            &::placeholder {
                opacity: 0.5;
            }
        }
        &__new-todo-input {
            margin: 8px 0px 5px 0px;
            cursor: text;
            font-size: 1.05rem;
            width: 50%;

            &::placeholder {
                opacity: 0.5;
            }
        }
        &__new-todo-btn-container {
            display: flex;
            margin: 8px 0px 10px -5px;
            button {
                @include center;
                color: rgb(var(--fgColor4));
                border-color: rgb(var(--fgColor4));
                padding: 6px 12px 6px 12px;

                &:hover {
                    background: rgb(var(--fgColor4));
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
                    color: rgb(var(--fgColor4));
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
