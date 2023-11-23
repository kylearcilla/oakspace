<script lang="ts">
    import { onDestroy, onMount } from "svelte"
    
	import { Session } from "$lib/pom-session"
	import { clickOutside } from "$lib/utils-general"
    import { themeState, ytPlayerStore } from "$lib/store"
    import { HrsMinsFormatOption, ModalType } from "$lib/enums"
	import { calculateEndTime, getTimePeriodString, minsToHHMM } from "$lib/utils-date"
	import { 
            BREAK_TIMES_ARR, DEFAULT_SESSION_INPUTS, FOCUS_TIMES_ARR, MAX_SESSION_NAME_LENGTH, 
            MAX_TODO_COUNT, MAX_TODO_NAME_LENGTH, createSessionToastMsg, initSession 
    } from "$lib/utils-session"
	
    import Modal from "../../components/Modal.svelte";
	import { closeModal, openModal } from "$lib/utils-home";

    let newTodoTitle = ""

    let isTagListDropDownOpen = false
    let isFocusTimeDropDownOpen = false
    let isBreakTimeDropDownOpen = false
    let sessionNameInputContainer: HTMLElement
    let newTodoInputContainer: HTMLElement
    let todoCount = 0

    let interval: NodeJS.Timer | null = null

    let input: SessionInputData = { ...DEFAULT_SESSION_INPUTS }
    let tags = [ { name: "school", color: "#9997FE" }, { name: "swe", color: "#FF8B9C" } ]

    /* Session Stuff */
    const createNewSession = (e: Event) => {
        e.preventDefault()

        if (input.name.length === 0 || input.name.length > MAX_SESSION_NAME_LENGTH) return
        input.startTime = new Date()
        input.sessionDurationMins = (input.pomPeriods * input.pomTime) + ((input.pomPeriods - 1) * input.breakTime)

        initSession(input) 
        resetAndCloseModal()
        
        if ($ytPlayerStore?.doShowPlayer) {
            openModal(ModalType.ActiveSession)
        }
    }
    const setResultTimes = () => {
        const totalFocusTimeMins = input.pomPeriods * input.pomTime
        const totalbreakTimeMins = (input.pomPeriods - 1) * input.breakTime
        const totalMins = totalbreakTimeMins + totalFocusTimeMins

        input.calculatedEndTime = calculateEndTime(new Date, totalMins)
        input.timePeriodString = getTimePeriodString(new Date, input.calculatedEndTime)
        input.totalElapsedTime = minsToHHMM(totalMins, HrsMinsFormatOption.MIN_LETTERS)
    }
    const resetAndCloseModal = () => {
        clearInterval(interval!)
        closeModal(ModalType.NewSession)
    }

    /* Event Handlers */
    const tagDropDownClicked = (e: Event) => {
        if ((e as PointerEvent).pointerId < 0) return
        isTagListDropDownOpen = true
        isFocusTimeDropDownOpen = false
        isBreakTimeDropDownOpen = false
    }
    const handleNewTagClicked = (idx: number) => {
        input.tag = tags[idx]
        isTagListDropDownOpen = false
    }
    const handleNewTodoClicked  = () => {
        if (newTodoTitle === "" || newTodoTitle.length > MAX_TODO_NAME_LENGTH) {
            return
        }
        if (input.todos.length === MAX_TODO_COUNT) {
            createSessionToastMsg("Max todo count reached.")
            return
        }

        input.todos.push({ title: newTodoTitle, isChecked: false })
        todoCount++
        newTodoTitle = "" 

        const inputElement = newTodoInputContainer.firstChild! as HTMLInputElement
        inputElement.focus()
    }
    const focustTimeDropdownOptionClicked = (time: number) => {
        input.pomTime = time
        isFocusTimeDropDownOpen = false
        setResultTimes()
    }
    const breakTimeDropdownOptionClicked = (time: number) => {
        input.breakTime = time
        isBreakTimeDropDownOpen = false
        setResultTimes()
    }

    const handleCreateNewTagClicked = () => {
        // Create a New Tag
    }

    const startTimer = () => interval = setInterval(() => setResultTimes(), 1000)

    onDestroy(() => clearInterval(interval!))
    onMount(() => {
        // restart data, can contain data from prev session since default input object isn't a fully shallow copy
        input.currentTime = { minutes: 0, seconds: 0 }
        input.todos = []

        startTimer()
        setResultTimes()

        const inputElement = sessionNameInputContainer.firstChild as HTMLInputElement
        inputElement.focus()
    })
</script>

<Modal onClickOutSide={() => resetAndCloseModal()}>
    <div class={`new-session-modal ${$themeState.isDarkTheme ? "new-session-modal--dark" : "new-session-modal--light"}`}>
        <h1>Create New Session</h1>
        <form on:submit={createNewSession} autocomplete="off" autocorrect="off">
            <!-- Name -->
            <label for="new-session-title-input">Session Name</label>
            <div class="new-session-modal__name-input">
                <div class="new-session-modal__name-input-container text-input-container" bind:this={sessionNameInputContainer}> 
                    <input 
                        type="text"
                        id="new-session-title-input"
                        name="new-session-title"
                        placeholder="Afternoon Reading"
                        on:focus={() => sessionNameInputContainer.classList.add("text-input-container--focus")}
                        on:blur={() => sessionNameInputContainer.classList.remove("text-input-container--focus")}
                        bind:value={input.name}
                    >
                    <div class="new-session-modal__name-input-container-divider"></div>
                    <div class="new-session-modal__name-input-tag-dropdown-container dropdown-container">
                        <button class="new-session-modal__name-input-tag-dropdown-btn dropdown-btn trans-btn" type="button" on:click={tagDropDownClicked}>
                            <div class="dropdown-btn__icon" style={`background-color: ${input.tag.color}`}></div>
                            <div class="dropdown-btn__title">
                                {input.tag.name}
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
                                    <li class={`dropdown-menu__option ${tag.name === input.tag.name ? "dropdown-menu__option--selected" : ""}`}>
                                        <button class="dropdown-element" type="button" on:click={() => handleNewTagClicked(idx)}>
                                            <div class="dropdown-menu__option-icon">
                                                <div 
                                                    class="new-session-modal__name-input-tag-option-circle"
                                                    style={`background-color: ${tag.color}`}
                                                >
                                                </div>
                                            </div>
                                            <span class="dropdown-menu__option-text">
                                                {tag.name}
                                            </span>
                                            {#if tag.name === input.tag.name}
                                                <div class="dropdown-menu__option-icon">
                                                    <i class="fa-solid fa-check"></i>
                                                </div>
                                            {/if}
                                        </button>
                                    </li>
                                {/each}
                                <div class="dropdown-menu__divider"></div>
                                <li class="dropdown-menu__option">
                                    <button on:click={handleCreateNewTagClicked}>
                                        <div class="dropdown-menu__option-icon">
                                            <span class="new-session-modal__name-input-new-tag-option-icon">+</span>
                                        </div>
                                        <span class="dropdown-menu__option-text">
                                            New Tag
                                        </span>
                                    </button>
                                </li>
                            </ul>
                        {/if}
                    </div>
                </div>
            </div>
            <!-- Pom Details -->
            <div class="new-session-modal__pom-input-container">
                <!-- Pomodoro Count -->
                <div class="new-session-modal__pom-input">
                    <h2>Pomodoros</h2>
                    <div class="new-session-modal__pom-input-stepper">
                        <button 
                            class="trans-btn" 
                            type="button"
                            on:click={(e) => { input.pomPeriods = Math.max(2, input.pomPeriods) - 1; setResultTimes() }}
                        >
                            -
                        </button>
                        <span>{input.pomPeriods}</span>
                        <button 
                            class="trans-btn" 
                            type="button"
                            on:click={(e) => { input.pomPeriods = Math.min(5, input.pomPeriods) + 1; setResultTimes() }}
                        >
                            +
                        </button>
                    </div>
                </div>
                <!-- Focus Time -->
                <div class="new-session-modal__pom-input">
                    <h2>Focus Time</h2>
                    <div class="new-session-modal__pom-input-dd-container">
                        <button class="new-session-modal__pom-input-dropdown-btn dropdown-btn trans-btn" type="button" on:click={() => { 
                            isFocusTimeDropDownOpen = true; 
                            isBreakTimeDropDownOpen = false;
                            isTagListDropDownOpen = false;
                        }}>
                            <div class="dropdown-btn__title">
                                {input.pomTime} mins
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
                        {#if isFocusTimeDropDownOpen}
                            <ul use:clickOutside on:click_outside={() => isFocusTimeDropDownOpen = false } class="dropdown-menu">
                                {#each FOCUS_TIMES_ARR as time} 
                                    <li class={`dropdown-menu__option ${input.pomTime === time ? "dropdown-menu__option--selected" : ""}`}>
                                        <button 
                                            class="dropdown-element" 
                                            on:click={() => focustTimeDropdownOptionClicked(time)}
                                        >
                                            <span class="dropdown-menu__option-text">{time} mins</span>
                                            {#if input.pomTime === time}
                                                <div class="dropdown-menu__option-icon">
                                                    <i class="fa-solid fa-check"></i>
                                                </div>
                                            {/if}
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                </div>
                <!-- Break Time -->
                <div class="new-session-modal__pom-input">
                    <h2>Break Time</h2>
                    <div class="new-session-modal__pom-input-dd-container">
                        <button class="new-session-modal__pom-input-dropdown-btn dropdown-btn trans-btn" type="button" on:click={() => {{ 
                            isBreakTimeDropDownOpen = true;
                            isFocusTimeDropDownOpen = false;
                            isTagListDropDownOpen = false;
                        }}}>
                            <div class="dropdown-btn__title">
                                {input.breakTime} mins
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
                        {#if isBreakTimeDropDownOpen}
                            <ul use:clickOutside on:click_outside={() => isBreakTimeDropDownOpen = false} class="dropdown-menu">
                                {#each BREAK_TIMES_ARR as time} 
                                    <li class={`dropdown-menu__option ${input.breakTime === time ? "dropdown-menu__option--selected" : ""}`}>
                                        <button 
                                            class="dropdown-element" 
                                            on:click={() => breakTimeDropdownOptionClicked(time)}
                                        >
                                            <span class="dropdown-menu__option-text">{time} mins</span>
                                            {#if input.breakTime === time}
                                                <div class="dropdown-menu__option-icon">
                                                    <i class="fa-solid fa-check"></i>
                                                </div>
                                            {/if}
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                </div>
            </div>
            <!-- Todos -->
            <div class="new-session-modal__pom-input-todos">
                <label for="new-todo-title-input">Todos</label>
                <div class="new-session-modal__pom-input-todo-input-wrapper">
                    <div class="new-session-modal__pom-input-todo-input-container text-input-container" bind:this={newTodoInputContainer}>
                        <input 
                            type="text"
                            placeholder="Finish 2 Chapters" 
                            id="new-todo-title-input"
                            name="new-todo-title"
                            on:focus={() => newTodoInputContainer.classList.add("text-input-container--focus")}
                            on:blur={() => newTodoInputContainer.classList.remove("text-input-container--focus")}
                            bind:value={newTodoTitle}
                        >
                        <span>{todoCount}</span>
                    </div>
                    <button 
                        disabled={newTodoTitle === "" || newTodoTitle.length > MAX_TODO_NAME_LENGTH || input.todos.length + 1 > MAX_TODO_COUNT} 
                        class="form-submit-btn" 
                        type="button" 
                        on:click={handleNewTodoClicked}
                    >
                        Submit
                    </button>
                </div>
            </div>
            <!-- Result -->
            <div class="new-session-modal__pom-input-result">
                <h2>Result: </h2>
                <h3>{input.timePeriodString}</h3>
                <h4>{`(${input.totalElapsedTime})`}</h4>
            </div>
            <!-- Button Container -->
            <div class="new-session-modal__pom-input-btn-container">
                <button 
                    disabled={input.name === "" || input.name.length >= MAX_SESSION_NAME_LENGTH} 
                    type="submit" class="new-session-modal__pom-input-btn-done-btn form-submit-btn form-submit-btn--fill"
                    on:click={createNewSession}
                >
                    Start Session
                </button>
                <button 
                    on:click={() => resetAndCloseModal()} 
                    class="new-session-modal__pom-input-btn-cancel-btn form-submit-btn form-submit-btn--cancel"
                    type="reset"
                >
                    Cancel
                </button>
            </div>
        </form>
    </div>     
</Modal>


<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/form.scss";

    /* New Session Modal */
    .new-session-modal {        
        width: 390px;   
        padding: 16px 22px;
        border-radius: 14px;

        h1 {
            font-size: 1.7rem;
            margin-bottom: 20px;
            font-weight: 600;
            color: rgba(var(--textColor1), 0.85);
        }
        label, h2 {
            font-size: 1.35rem;
            font-weight: 500;
            margin-bottom: 9px;
            color: rgba(var(--textColor1), 0.75);
        }

        /* Btn Styling */
        .fill-btn { 
            @include color-btn-styling;
        }
        .trans-btn {
            @include trans-btn-light-styling;
        }
        .unfill {
            @include unfill-btn-ficus-styling(var(--fgColor1));
        }
        .unfill--gray {
            @include unfill-btn-ficus-styling(var(--textColor1));
        }

        /* Dropdown Styling */
        .dropdown-menu {
            background-color: var(--sidePanelContextMenuBgColor);
            border: var(--sidePanelContextMenuBorder);
            box-shadow: var(--sidePanelContextMenuBoxShadow);

            &__option button {
                &:hover {
                    background-color: var(--sidePanelContextMenuHoverColor) !important;
                }
                &:focus {
                    background-color: var(--sidePanelContextMenuHoverColor) !important;
                }
            }
        }

        /* Light Themes Adjustments */
        &--light .text-input-container {
            @include input-text-field-light;
        }
        
        /* Dark Themes Adjustments */
        &--dark .trans-btn {
            @include trans-btn-dark-styling;
        }
        &--dark .dropdown-menu {
            border: 1px solid rgba(60, 60, 60, 0.1);
        }
        &--dark h1 {
            font-weight: 500;
        }
        &--dark label {
            font-weight: 400;
            color: rgba(var(--textColor1), 0.8);
        }
        &--dark button {
            font-weight: 500;
        }
        &--dark &__name-input-tag-dropdown-btn {
            @include dropdown-btn-dark;
        }
        &--dark &__name-input-tag-dropdown-container .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--dark &__pom-input-stepper {
            span {
                color: rgba(var(--textColor1), 0.65);
            }
            button {
                color: rgba(var(--textColor1), 0.65);
            }
        }
        &--dark &__pom-input-dropdown-btn {
            @include dropdown-btn-dark;
        }
        &--dark &__pom-input-dd-container .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--dark &__pom-input-result {
            h3 {
                font-weight: 400;
            }
            h4 {
                font-weight: 300;
            }
        }

        /* Name Input */
        &__name-input { 
            height: 47px;
            width: 100%;
        }
        &__name-input-container {
            height: 47px;
            input {
                width: 70%;
            }
            &-divider {
                width: 0.9px;
                height: 14px;
                margin: 0px 10px 0px 0px;
                background-color: rgba(var(--textColor1), 0.15);
            }
        }
        &__name-input-tag-dropdown-container {
            position: relative;
            .dropdown-btn {
                &__icon {
                    @include circle(7px);
                }
            }
            .dropdown-menu {
                position: absolute;
                top: 40px;
                width: 100px;
            }
        }
        &__name-input-tag-dropdown-btn {
            @include flex-container(center, _);
            background: none;
            box-shadow: none;
            padding: 10px 11px 10px 10px;
            border-radius: 10px;
        }
        &__name-input-tag-option-circle {
            @include circle(6px);
        }
        &__name-input-new-tag-option-icon {
            font-size: 1.45rem;
            font-weight: 200;
        }

        /* Pomodoros Stuff */
        &__pom-input-container {
            @include flex-container(center, space-between);
            margin: 20px 0px 10px 0px;
            width: 100%;
        }
        &__pom-input {
            width: 32%;
        }
        &__pom-input-dropdown-btn, &__pom-input-stepper {
            height: 40px;
            border-radius: 9px;
        }
        &__pom-input-dropdown-btn {
            box-shadow: none;
            padding: 0px;
            width: 100%;
            justify-content: start;
            background-color: var(--modalBgAccentColor);

            &:active {
                transform: scale(0.995);
            }

            .dropdown-btn__title {
                width: 45px;
                margin: 0px 14px 0px 21px;
                color: rgba(var(--textColor1), 0.55);
            }
        }

        /* Pom Count */
        &__pom-input-stepper {
            padding: 0px 4px;
            @include flex-container(center, space-between);
            background-color: var(--modalBgAccentColor);

            span {
                margin: 0px 5px;
                font-size: 1.2rem;
                color: rgba(var(--textColor1), 0.55);
            }
            button {
                padding: 10px;
                height: 8px;
                font-size: 1.4rem;
                @include center;
                transition: 0.05s ease-in-out;
                border-radius: 7px;
                color: rgba(var(--textColor1), 0.55);
                background: none;

                &:active {
                    transform: scale(0.97);
                }
            }
        }
        &__pom-input-dd-container {
            position: relative;
        }

        /* Focust & Break Time */
        &__pom-input-dd-container .dropdown-menu {
            position: absolute;
            top: 40px;
            left: 7px;
            border-radius: 10px;
            width: 90px;
            
            &__option {
                border-radius: 10px;
            }
        }

        /* Subtasks */
        &__pom-input-todos {
            margin-top: 22px;
        }
        &__pom-input-todo-input-wrapper {
            display: flex;
            width: 100%;
            height: 45px;
            
            button {
                width: calc(100% - (65% + 10px));
                border-radius: 10px;
                font-size: 1.3rem;
            }
        }
        &__pom-input-todo-input-container {
            position: relative;
            width: 65%;
            margin-right: 10px;

            &--focus {
                border-color: rgba(211, 211, 211, 0.5);
            }
            span {
                display: inline-block;
                position: absolute;
                right: 15px;
                color: rgba(150, 150, 150, 0.6);
            }
        }

        /* Result */
        &__pom-input-result {
            margin: 35px 0px 45px 0px;
            @include flex-container(center, center);
            label, h2 {
                margin: 0px 20px 0px 0px;
                font-size: 1.5rem;
            }
            h3 {
                padding: 0px;
                margin-right: 8px;
                color: rgba(var(--textColor1), 0.8);
                font-weight: 500;
                font-size: 1.45rem;
            }
            h4 {
                font-size: 1.45rem;
                font-weight: 400;
                color: rgba(var(--textColor1), 0.45);
            }
        }

        /* Button Container */
        &__pom-input-btn-container {
            width: 100%;
            display: flex;

            button {
                @include center;
                border-radius: 9px;
                height: 45px;
                font-size: 1.3rem;
                transition: 0.12s ease-in-out;

                &:active {
                    transform: scale(0.99);
                }
            }
        }
        &__pom-input-btn-done-btn {
            width: 70%;
            margin-right: 5px;
        }
        &__pom-input-btn-cancel-btn {
            width: calc(100% - (70% + 5px));
        }
    }
</style>