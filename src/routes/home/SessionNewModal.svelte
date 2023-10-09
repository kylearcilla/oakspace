<script lang="ts">
    import { onDestroy, onMount } from "svelte"
    
    import { SessionModal } from "$lib/enums"
	import { Session } from "$lib/pom-session"
	import { clickOutside } from "$lib/utils-general"
    import { sessionStore, themeState } from "$lib/store"
	import { DEFAULT_SESSION_INPUTS } from "$lib/utils-session"
	import { calculateEndTime, getTimePeriodString, minsToHHMM } from "$lib/utils-date"
	import Modal from "../../components/Modal.svelte";
    
    export let toggleModal: (modal: SessionModal | null) => void

    let newTodoTitle = ""
    let subtaskCount = 0

    let isTagListDropDownOpen = false
    let isFocusTimeDropDownOpen = false
    let isBreakTimeDropDownOpen = false
    let sessionNameInput: HTMLElement
    let newTodoInput: HTMLElement

    const MAX_SESSION_NAME_LENGTH = 18
    const MAX_TODO_NAME_LENGTH = 15
    const FOCUS_TIMES_ARR = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
    const BREAK_TIMES_ARR = [5, 10, 15, 20, 25, 30]

    let interval: NodeJS.Timer | null = null

    let sessionDefaultInputs: NewSessionUserInput = { ...DEFAULT_SESSION_INPUTS }
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

    sessionStore.subscribe((data: Session | null) => {
        if (data && interval) clearInterval(interval)
    })

    /* Session Stuff */
    const createNewSession = () => {
        sessionDefaultInputs.startTime = new Date()
        new Session(sessionDefaultInputs)
        resetNewSesion() 
        toggleModal(SessionModal.ActiveSession)
    }
    const setResultTimes = () => {
        const totalFocusTimeMins = sessionDefaultInputs.pomPeriods * sessionDefaultInputs.pomTime
        const totalbreakTimeMins = (sessionDefaultInputs.pomPeriods - 1) * sessionDefaultInputs.breakTime
        const totalMins = totalbreakTimeMins + totalFocusTimeMins

        sessionDefaultInputs.calculatedEndTime = calculateEndTime(new Date, totalMins)
        sessionDefaultInputs.timePeriodString = getTimePeriodString(new Date, sessionDefaultInputs.calculatedEndTime)
        sessionDefaultInputs.totalElapsedTime = minsToHHMM(totalMins)
    }
    const resetNewSesion = () => {
        sessionDefaultInputs = { ...DEFAULT_SESSION_INPUTS }
        setResultTimes()
        toggleModal(null)
    }

    /* Event Handlers */
    const editTextInputHandler = (event: Event) => {
        if (sessionDefaultInputs.name.length >= 20) return
        sessionDefaultInputs.name = (event.target as HTMLInputElement).value
    }
    const editNewTodoInputHandler = (event: Event) => {
        if (sessionDefaultInputs.name.length >= 20) return
        newTodoTitle = (event.target as HTMLInputElement).value
    }
    const handleNewTagClicked = (idx: number) => {
        sessionDefaultInputs.tag = tags[idx]
        isTagListDropDownOpen = false
    }
    const handleNewTodoClicked  = () => {
        sessionDefaultInputs.todos.push({ title: newTodoTitle, isChecked: false })
        newTodoTitle = "" 
        subtaskCount++
    }
    const handleCreateNewTagClicked = () => {
        // Create a New Tag
    }

    const startTimer = () => interval = setInterval(() => setResultTimes(), 1000)

    onDestroy(() => clearInterval(interval!))
    onMount(() => {
        setResultTimes()
        startTimer()
    })
</script>

<Modal onClickOutSide={() => toggleModal(null)}>
    <div class={`new-session-modal ${$themeState.isDarkTheme ? "new-session-modal--dark" : ""}`}>
        <h1>Create New Session</h1>
        <h2>Session Name</h2>
            <!-- Name -->
            <div class="new-session-modal__name-input" bind:this={sessionNameInput}>
                <input 
                    type="text"
                    placeholder="Afternoon Reading" 
                    on:focus={() => sessionNameInput.classList.add("new-session-modal__name-input--focus")}
                    on:blur={() => sessionNameInput.classList.remove("new-session-modal__name-input--focus")}
                    on:input={editTextInputHandler}
                    bind:value={sessionDefaultInputs.name}
                >
                <div class="new-session-modal__name-input__divider"></div>
                <div class="new-session-modal__name-input-tag-dropdown-container dropdown-container">
                    <button class="new-session-modal__name-input-tag-dropdown-btn dropdown-btn trans-btn" on:click={() => {
                        isTagListDropDownOpen = true
                        isFocusTimeDropDownOpen = false
                        isBreakTimeDropDownOpen = false
                    }}>
                        <div class="dropdown-btn__icon" style={`background-color: ${sessionDefaultInputs.tag.color}`}></div>
                        <div class="dropdown-btn__title">
                            {sessionDefaultInputs.tag.name}
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
                                <li class={`dropdown-menu__option ${tag.name === sessionDefaultInputs.tag.name ? "dropdown-menu__option--selected" : ""}`}>
                                    <button class="dropdown-element" on:click={() => handleNewTagClicked(idx)}>
                                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon" style={`background-color: ${tag.color}`}></div>
                                        <p>{tag.name}</p>
                                        {#if tag.name === sessionDefaultInputs.tag.name}
                                            <div class="dropdown-menu__option-icon">
                                                <i class="fa-solid fa-check"></i>
                                            </div>
                                        {/if}
                                    </button>
                                </li>
                            {/each}
                            <li class="dropdown-menu__new-option-container">
                                <div class="divider divider--thin"></div>
                                <button on:click={handleCreateNewTagClicked}>
                                    <span>+</span>New Tag
                                </button>
                            </li>
                        </ul>
                    {/if}
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
                            on:click={() => { sessionDefaultInputs.pomPeriods = Math.max(2, sessionDefaultInputs.pomPeriods) - 1; setResultTimes() }}
                        >
                            -
                        </button>
                        <span>{sessionDefaultInputs.pomPeriods}</span>
                        <button 
                            class="trans-btn" 
                            on:click={() => { sessionDefaultInputs.pomPeriods = Math.min(5, sessionDefaultInputs.pomPeriods) + 1; setResultTimes() }}
                        >
                            +
                        </button>
                    </div>
                </div>
                <!-- Focus Time -->
                <div class="new-session-modal__pom-input">
                    <h2>Focus Time</h2>
                    <div class="new-session-modal__pom-input-dd-container">
                        <button class="new-session-modal__pom-input-dropdown-btn dropdown-btn trans-btn" on:click={() => { 
                            isFocusTimeDropDownOpen = true; 
                            isBreakTimeDropDownOpen = false;
                            isTagListDropDownOpen = false;
                        }}>
                            <div class="dropdown-btn__title">
                                {sessionDefaultInputs.pomTime} mins
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
                                    <li class={`dropdown-menu__option ${sessionDefaultInputs.pomTime === time ? "dropdown-menu__option--selected" : ""}`}>
                                        <button 
                                            class="dropdown-element" 
                                            on:click={() => { 
                                                sessionDefaultInputs.pomTime = time
                                                isFocusTimeDropDownOpen = false
                                                setResultTimes()
                                            }}
                                        >
                                            <p>{time} mins</p>
                                            {#if sessionDefaultInputs.pomTime === time}
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
                        <button class="new-session-modal__pom-input-dropdown-btn dropdown-btn trans-btn" on:click={() => {{ 
                            isBreakTimeDropDownOpen = true;
                            isFocusTimeDropDownOpen = false;
                            isTagListDropDownOpen = false;
                        }}}>
                            <div class="dropdown-btn__title">
                                {sessionDefaultInputs.breakTime} mins
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
                                    <li class={`dropdown-menu__option ${sessionDefaultInputs.breakTime === time ? "dropdown-menu__option--selected" : ""}`}>
                                        <button 
                                            class="dropdown-element" 
                                            on:click={() => { 
                                                sessionDefaultInputs.breakTime = time
                                                isBreakTimeDropDownOpen = false
                                                setResultTimes()
                                            }}
                                        >
                                            <p>{time} mins</p>
                                            {#if sessionDefaultInputs.breakTime === time}
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
                <h2>Todos</h2>
                <div class="new-session-modal__pom-input-todo-input-container">
                    <div class="new-session-modal__pom-input-todo-input" bind:this={newTodoInput}>
                        <input 
                            type="text"
                            placeholder="Afternoon Reading" 
                            on:focus={() => newTodoInput.classList.add("new-session-modal__pom-input-todo-input--focus")}
                            on:blur={() => newTodoInput.classList.remove("new-session-modal__pom-input-todo-input--focus")}
                            on:input={editNewTodoInputHandler}
                            bind:value={newTodoTitle}
                        >
                        <span>{subtaskCount}</span>
                    </div>
                    <button disabled={newTodoTitle === "" || newTodoTitle.length > MAX_TODO_NAME_LENGTH} class="unfill" on:click={handleNewTodoClicked}>
                        Submit
                    </button>
                </div>
            </div>
            <!-- Result -->
            <div class="new-session-modal__pom-input-result">
                <h2>Result: </h2>
                <h3>{sessionDefaultInputs.timePeriodString}</h3>
                <h4>{`(${sessionDefaultInputs.totalElapsedTime})`}</h4>
            </div>
            <!-- Button Container -->
            <div class="new-session-modal__pom-input-btn-container">
                <button 
                    disabled={sessionDefaultInputs.name === "" || sessionDefaultInputs.name.length >= MAX_SESSION_NAME_LENGTH} 
                    on:click={createNewSession} class="new-session-modal__pom-input-btn-done-btn fill-btn"
                >
                    Start Session
                </button>
                <button 
                    on:click={() => resetNewSesion()} 
                    class="new-session-modal__pom-input-btn-cancel-btn unfill unfill--gray"
                >
                    Cancel
                </button>
            </div>
    </div>     
</Modal>


<style lang="scss">
    @import "../../scss/dropdown.scss";

    /* New Session Modal */
    .new-session-modal {        
        width: 390px;   
        padding: 16px 22px;
        border-radius: 14px;

        h1 {
            font-size: 1.7rem;
            margin-bottom: 20px;
        }
        h2 {
            font-size: 1.35rem;
            font-weight: 500;
            margin-bottom: 9px;
            color: rgba(var(--textColor1), 0.8);
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
        &--dark .trans-btn {
            @include trans-btn-dark-styling;
        }

        /* Dark Themes Adjustments */
        &--dark .dropdown-menu {
            border: 1px solid rgba(60, 60, 60, 0.1);
        }
        &--dark h1 {
            font-weight: 500;
        }
        &--dark h2 {
            font-weight: 400;
            color: rgba(var(--textColor1), 0.8);
        }
        &--dark button {
            font-weight: 500;
        }
        &--dark &__name-input {
            @include input-text-field-dark;
        }
        &--dark &__pom-input-todo-input {
            @include input-text-field-dark;
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
        &--dark &__pom-input-btn-cancel-btn {
            border: 1px solid rgba(var(--textColor1), 0.4);
            color: rgba(var(--textColor1), 0.4);
        }

        /* Name Input */
        &__name-input { 
            font-size: 1.32rem;
            padding: 0px 7px 0px 20px;
            height: 47px;
            border-radius: 10px;
            width: 100%;
            @include flex-container(center, _);
            transition: 0.2s ease-in-out;
            border: 1px solid rgba(211, 211, 211, 0);
            background-color: var(--modalBgAccentColor);
            
            &--focus {
                border-color: rgba(211, 211, 211, 0.5);
            }
            
            input {
                color: rgba(var(--textColor1), 0.5);
                transition: 0.14s ease-in-out;
                font-weight: 500;
                width: 70%;

                &::placeholder {
                    font-size: 1.4rem;
                    font-weight: 400;
                    opacity: 0.2;
                }
            }
            &__divider {
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
                &__option {
                    p {
                        width: 60%;
                        margin-left: 3px;
                    }
                    span {
                        margin-right: 3px;
                    }
                }
            }
        }
        &__name-input-tag-dropdown-btn {
            @include flex-container(center, _);
            background: none;
            box-shadow: none;
            padding: 10px 11px 10px 10px;
            border-radius: 10px;
        }
        &__name-input-btn-tag {
            @include circle(8px);
            margin-right: 7px;
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
        &__pom-input-dropdown-btn {
            height: 34px;
            border-radius: 7px;
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
            }
        }

        /* Pom Count */
        &__pom-input-stepper {
            height: 34px;
            padding: 0px 4px;
            border-radius: 7px;
            @include flex-container(center, space-between);
            background-color: var(--modalBgAccentColor);

            span {
                margin: 0px 5px;
                font-size: 1.2rem;
                color: rgba(var(--textColor1), 0.7);
            }
            button {
                padding: 10px;
                height: 8px;
                font-size: 1.4rem;
                @include center;
                transition: 0.05s ease-in-out;
                border-radius: 3px;
                color: rgba(var(--textColor1), 0.7);
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
                padding: 0px;
                border-radius: 10px;
                button {
                    padding: 8px 12px;
                }
                p {
                    width: 65%;
                }
            }
        }

        /* Subtasks */
        &__pom-input-todos {
            margin-top: 22px;
        }
        &__pom-input-todo-input-container {
            display: flex;
            width: 100%;
            
            button {
                width: calc(100% - (65% + 10px));
                border-radius: 10px;
                font-size: 1.3rem;

                &:focus {
                    background-color: rgba(60, 60, 60, 0.3);
                }
            }
        }
        &__pom-input-todo-input {
            font-size: 1.32rem;
            padding: 0px 7px 0px 20px;
            height: 38px;
            border-radius: 10px;
            width: 65%;
            @include flex-container(center, _);
            transition: 0.2s ease-in-out;
            border: 1px solid rgba(211, 211, 211, 0);
            margin-right: 10px;
            position: relative;
            background-color: var(--modalBgAccentColor);

            &--focus {
                border-color: rgba(211, 211, 211, 0.5);
            }
            input {
                color: rgba(150, 150, 150, 0.9);
                &::placeholder {
                    font-size: 1.4rem;
                    font-weight: 300;
                    opacity: 0.2;
                }
            }
            span {
                @include pos-abs-top-right-corner(10px, 15px);
                color: rgba(150, 150, 150, 0.6);
            }
        }

        /* Result */
        &__pom-input-result {
            margin: 35px 0px 45px 0px;
            @include flex-container(center, center);
            h2 {
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
            background-color: rgba(var(--fgColor1), 1);
            color: var(--modalBgColor);
            margin-right: 5px;
        }
        &__pom-input-btn-cancel-btn {
            width: calc(100% - (70% + 5px));
            background-color: transparent;
            border: solid 1.15px rgba(150, 150, 150, 0.7);
            color: rgba(var(--textColor1), 0.55);
            
            &:hover {
                background-color: rgba(150, 150, 150, 0.7);
                border-color: transparent;
                color: var(--modalBgColor);
            }
        }
    }
</style>