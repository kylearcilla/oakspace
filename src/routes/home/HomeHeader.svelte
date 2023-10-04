<script lang="ts">
	import QuoteModal from "./ModalQuote.svelte"
	import NewSessionModal from "./SessionNewModal.svelte"
	import ActiveSessionView from "./SessionActiveModal.svelte"
    
	import { SessionModal } from "$lib/enums"
	import { updateUI } from "$lib/utils-home"
	import { themeState, globalSessionObj, globalSessionState, homeViewLayout, musicDataStore, ytPlayerStore } from "$lib/store"

    let currModalOpen : SessionModal | null = null
    let dropdownMenu: HTMLElement

    const toggleModal = (modal: SessionModal | null) => currModalOpen = modal

    const handleSessionBtnClicked = () => {
        if ($globalSessionState) {
            toggleModal(SessionModal.ActiveSession)
        }
        else {
            toggleModal(SessionModal.NewSession)
        }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && currModalOpen === SessionModal.NewSession) {
            currModalOpen = null
        }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
        if (!$globalSessionObj && event.key.toLocaleLowerCase() === "n") {
            currModalOpen = SessionModal.NewSession
        }
    }

    /* Dropdown Menu */
    const handleOptionClicked = (idx: number) => {
        if (idx === 0) {
            console.log("LOGGING OUT USER")
        }
        else if (idx === 1) {
            updateUI({ ...$homeViewLayout, isVideoViewOpen: !$homeViewLayout.isVideoViewOpen})
        }
        else if (idx === 2) {
            updateUI({ ...$homeViewLayout, isMusicPlayerOpen: !$homeViewLayout.isMusicPlayerOpen})
        }
        dropdownMenu.style.display = "none"
    }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class={`header header${$themeState.isDarkTheme ? "--dark" : "--light"}`}>
    {#if currModalOpen === SessionModal.Quote}
        <QuoteModal toggleModal={toggleModal} />
    {:else if currModalOpen === SessionModal.NewSession}
        <NewSessionModal toggleModal={toggleModal} />
    {:else if $homeViewLayout.isVideoViewOpen && currModalOpen === SessionModal.ActiveSession}
        <ActiveSessionView toggleModal={toggleModal} />
    {/if}         

    <!-- Left Side -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class="user-panel" 
        on:mouseover={() => dropdownMenu.style.display = "block"} 
        on:mouseleave={() => dropdownMenu.style.display = "none"}
    >
        <img src="https://i.pinimg.com/564x/43/86/bb/4386bb3d57ddcb0c6ee1ba7a7f171689.jpg" alt="">
        <div class="user-panel__user-details">
            <div class="user-panel__user-details-user">Kyle Arcilla</div>
            <div class="user-panel__user-details-subheading">
                {#if $homeViewLayout.isVideoViewOpen}
                    <div class="user-panel__user-details-session-stat" title="4 sessions done.">
                        <i class="fa-regular fa-hourglass-half"></i>
                        <span>4</span>
                    </div>
                    <div class="user-panel__user-details-session-stat" title="2h 32m of focus time today.">
                        <i class="fa-brands fa-readme"></i>
                        <span>2h 32m</span>
                    </div>
                    <div class="user-panel__user-details-session-stat" title="1h 3m of break time today.">
                        <i class="fa-solid fa-seedling"></i>
                        <span>1h 3m</span>
                    </div>
                {:else}
                    <div class="user-panel__user-details-email">
                        kylearcilla09@gmail.com
                    </div>
                {/if}
            </div>
        </div>
        <!-- Dropdown Container -->
        <div class="dropdown-container" bind:this={dropdownMenu}>
            <ul class="dropdown-menu">
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(_) => handleOptionClicked(0)}>
                        <p>Log Out</p>
                    </button>
                </li>
                {#if $ytPlayerStore || $musicDataStore}
                    <div class="divider"></div>
                {/if}
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(_) => handleOptionClicked(1)}>
                        <p>{`${$homeViewLayout.isVideoViewOpen ? "Hide": "Show"} Video View`}</p>
                        <div class="dropdown-menu__option-icon">
                            <i class="fa-brands fa-youtube"></i>
                        </div>
                    </button>
                </li>
                {#if $musicDataStore}
                    <li class="dropdown-menu__option">
                        <button class="dropdown-element" on:click={(_) => handleOptionClicked(2)}>
                            <p>{`${$homeViewLayout.isVideoViewOpen ? "Hide": "Show"} Music Player`}</p>
                            <div class="dropdown-menu__option-icon">
                                <i class="fa-solid fa-music"></i>
                            </div>
                        </button>
                    </li>
                {/if}
            </ul>
        </div>
    </div>

    <!-- Right Side -->
    {#if $homeViewLayout.isVideoViewOpen}
        <!-- Header Session Button -->
        <button 
            class={`header-session-btn header__section ${$themeState.isDarkTheme ? "" : "header-session-btn--light-mode"}`}
            on:click={handleSessionBtnClicked}
        >
            {#if !$globalSessionState}
                <div class="header-session-btn__new-session-title">New Session</div>
                <div class="header-session-btn__new-session-icon">+</div>
            {:else}
                <div title={$globalSessionState?.tag.name} class="header-session-btn__session-tag">
                    {$globalSessionState?.tag.name[0].toLocaleUpperCase()}
                </div>
                <div class="header-session-btn__session-name">{$globalSessionState?.name}</div>
                {#if $globalSessionState.todos.length > 0}
                    <div title={`${$globalSessionState.todosCheckedCount} completed`} class="header-session-btn__session-todos">
                        {`${$globalSessionState.todosCheckedCount} / ${$globalSessionState.todos.length}`}
                    </div>
                {/if}
                <div 
                    title={$globalSessionObj?.iCurrentlyFocusTime() ? "Focus Time" : "Break Time"} 
                    class="header-session-btn__session-mode"
                >
                    {#if $globalSessionObj?.iCurrentlyFocusTime()}
                        <i class="fa-brands fa-readme"></i>
                    {:else}
                        <i class="fa-solid fa-seedling"></i>
                    {/if}
                </div>
                <div class="header-session-btn__session-time">
                    {`${$globalSessionState?.currentTime?.minutes}:${String($globalSessionState?.currentTime?.seconds).padStart(2, '0')}`}
                </div>
                <div class="header-session-btn__session-cycles">
                    {`${$globalSessionState?.currentPomPeriod} / ${$globalSessionState?.pomPeriods}`}
                </div>
            {/if}
        </button>
    {:else}
        <!-- Header Stats -->
        <div class="user-stats">
            <div class="user-stats__stat" title={`${"4"} sessions finished today 👏.`}>
                <i class="fa-regular fa-hourglass-half"></i>
                4
            </div>
            <div class="user-stats__stat" title={`${"1h 3m"} of focus time today.`}>
                <i class="fa-brands fa-readme"></i>
                1h 3m
            </div>
            <div class="user-stats__stat" title={`${"1h 3m"} of break time today.`}>
                <i class="fa-solid fa-seedling"></i>
                1h 3m
            </div>
        </div>
    {/if}
</div>

<style global lang="scss">
    @import "../../scss/dropdown.scss";

    .header {
        margin-top: 15px;
        width: 100%;
        @include flex-container(center, space-between);
        
        &__section {
            border-radius: 20px;
            height: 35px;
            @include flex-container(center, _);
            padding: 11px 15px 11px 12px;
            background: var(--headerElementBgColor);
            border: var(--headerElementBorderVal);
            box-shadow: var(--headerElementShadow);
            white-space: nowrap;
        }
        &--light .user-panel {
            &__user-details-user {
                font-weight: 600;
            }
            &__user-details-email {
                font-weight: 500;
            }
            &__user-details-session-stat {
                i {
                    color: rgba(var(--textColor1), 0.38);
                }
                span {
                    color: rgba(var(--textColor1), 0.35);
                    font-weight: 500;
                }
            }
        }
        &--light .user-stats {
            i {
                color: rgba(var(--textColor1), 0.6);
            }
            &__stat {
                font-weight: 500;
                color: rgba(var(--textColor1), 0.6);
            }
        }
        &--dark .user-panel .dropdown-menu {
            @include dropdown-menu-dark;
            i {
                color: rgba(var(--textColor1), 0.85);
            }
        }
    } 

    .user-panel {
        @include flex-container(center, _);
        position: relative;
        height: 37px;

        img {
            @include circle(32px);
            object-fit: cover;
            border: 1.5px solid white;
            margin-right: 12px;
            -webkit-user-drag: none;
        }
        &__user-details {
            height: 36px;
        }
        &__user-details-user {
            font-size: 1.3rem;
            color: rgba(var(--textColor1), 1);
        }
        &__user-details-subheading {
            margin-top: 3px;
            @include flex-container(center, _);
            color: rgba(var(--textColor1), 0.35);
        }
        &__user-details-session-stat {
            @include flex-container(center, _);

            i {
                color: rgba(var(--textColor1), 0.45);
                font-size: 0.94rem;
                padding: 0px;
            }
            span {
                color: rgba(var(--textColor1), 0.3);
                font-size: 1.1rem;
                font-weight: 300;
                margin: 0px 8px 0px 5px;
            }
        }
        &__user-details-email {
            font-size: 1.1rem;
            font-weight: 200;
        }
        .dropdown-container {
            @include pos-abs-bottom-left-corner(-120px, 0px);
            height: 120px;
            width: 135px;
            display: none;
        }
        .divider {
            background-color: rgba(var(--textColor1), 0.14);
            height: 0.5px;
            width: 90%;
            margin: 5px 0px 9px 5px;
        }
        .dropdown-menu {
            margin-top: 10px;
            width: 100%;

            &__option {
                width: 100%;
            }
            i, .fa-youtube {
                color: rgba(var(--textColor1), 1);
                font-size: 1rem;
            }
        }
    }
    
    /* Right Side */
    .user-stats {
        @include flex-container(center, _);
        &__stat {
            background-color: var(--midPanelAccentColor3);
            margin-right: 4px;
            padding: 8px 13px;
            border-radius: 15px;
            font-size: 1.1rem;
            color: rgba(var(--textColor1), 0.7);
            font-weight: 200;
            
            i {
                color: rgba(var(--textColor1), 1);
                font-size: 1rem;
                margin-right: 5px;
            }
            &:last-child {
                margin-right: 0px;
            }
        }
    }

    /* Active Session Btn */
    .header-session-btn {
        overflow: hidden;
        padding: 0px 12px 0px 15px;
        margin-right: 10px;
        color: rgba(var(--headerElementTextColor), 1);
        align-items: center;
        transition: 0.1s ease-in-out;

        &--light-mode {
            &:focus {
                filter: brightness(1.03);
            }
            &:hover {
                filter: brightness(1.02) !important;
            }
        }
        &--light-mode p {
            font-weight: 300;
        }
        &--light-mode span {
            font-weight: 500;
        }
        &--light-mode &__session-todos, &--light-mode &__session-cycles {
            font-weight: 400;
            color: rgba(var(--headerElementTextColor), 0.8);
        }

        &:focus {
            filter: brightness(1);
            box-shadow: 0px 0px 7px 0px rgba(255, 255, 255, 0.3);

            &:before {
                content: " ";
                position: absolute;
                z-index: -3;
                top: 0px;
                left: 0px;
                right: 0px;
                bottom: 0px;
                border-radius: 15px;
                border: 3px solid rgba(255, 255, 255, 0.2);
            }
        }
        &:hover {
            filter: brightness(1.07);
        }
        &:active {
            transform: scale(0.992);
            box-shadow: none;

            &:before {
                content: " " !important;
                border-width: 0px;
            }
        }
        
        span {
            font-weight: 500;
            margin-left: 4px;
            font-size: 1.2rem;
        }
        &__new-session-title {
            font-size: 1.2rem;
            margin-left: 2px;
        }
        &__new-session-icon {
            font-size: 1.5rem;
            font-weight: 400;
            margin: 0px 2px 0px 10px;
        }
        /* Active Session Component */
        &__session-tag {
            @include circle(17px);
            @include center;
            background-color: rgba(var(--fgColor1), 1);
            margin: 0px 8px 0px -5px;
            color: white;
        }
        &__session-name {
            font-size: 1.1rem;
        }
        &__session-todos {
            width: 30px;
            margin-right: -5px;
            @include center;
        }
        &__session-todos, &__session-cycles {
            color: rgba(var(--headerElementTextColor), 0.5);
            font-weight: 500;
            font-size: 0.95rem;
            margin-top: 2px;
        }
        &__session-mode {
            i {
                color: rgba(var(--headerElementTextColor), 0.85);
                margin: 2px -1px 0px 15px;
                font-size: 1.2rem;
            }
        }
        &__session-time {
            color: rgba(var(--headerElementTextColor), 0.85);
            font-size: 1.27rem;
            font-weight: 500;
            margin-left: 9px;
            width: 37px;
        }
    }
    /* Modals */
    .modal-bg__content {
        border-radius: 0px;
    }
</style>