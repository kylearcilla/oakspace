<script lang="ts">
	import QuoteModal from "./ModalQuote.svelte"
	import NewSessionModal from "./SessionNewModal.svelte"
    
	import { SessionModal } from "$lib/enums"
	import { updateUI } from "$lib/utils-home"
	import { themeState, homeViewLayout, musicDataStore, ytPlayerStore, sessionStore } from "$lib/store"
	import SessionHeaderView from "./SessionHeaderView.svelte";

    let currModalOpen: SessionModal | null = null
    let dropdownMenu: HTMLElement

    const toggleModal = (modal: SessionModal | null) => currModalOpen = modal

    /* Event Handlers */
    const handleSessionBtnClicked = () => {
        if ($sessionStore) {
            toggleModal(SessionModal.ActiveSession)
        }
        else {
            toggleModal(SessionModal.NewSession)
        }
    }
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

    /* Shortcuts */
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && currModalOpen === SessionModal.NewSession) {
            currModalOpen = null
        }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
        if (!$sessionStore && event.key.toLocaleLowerCase() === "n") {
            currModalOpen = SessionModal.NewSession
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class={`header header${$themeState.isDarkTheme ? "--dark" : "--light"}`}>
    {#if currModalOpen === SessionModal.Quote}
        <QuoteModal toggleModal={toggleModal} />
    {:else if currModalOpen === SessionModal.NewSession}
        <NewSessionModal toggleModal={toggleModal} />
    {/if}

    <!-- Left Side -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class="user-panel header__section" 
        on:mouseover={() => dropdownMenu.style.display = "block"} 
        on:mouseleave={() => dropdownMenu.style.display = "none"}
    >
        <img src="https://i.pinimg.com/564x/43/86/bb/4386bb3d57ddcb0c6ee1ba7a7f171689.jpg" alt="">
        <div class="user-panel__user-details">
            <div class="user-panel__user-details-user">Kyle Arcilla</div>
            <div class="user-panel__user-details-subheading">
                <span class="user-panel__user-details-time">Sat, Oct 7 2023</span>
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

    {#if $sessionStore != null}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class={`header-session-container ${$themeState.isDarkTheme ? "" : "header-session-container--light-mode"}`}>
            <SessionHeaderView />
        </div>
    {/if}

    <!-- Right Side -->
    <div class="header__section">
        {#if !$sessionStore}
            <!-- Header Session Button -->
            <button 
                class={`header-new-session-btn header__element ${$themeState.isDarkTheme ? "" : "header-new-session-btn--light-mode"}`}
                on:click={handleSessionBtnClicked}
            >
                <div class="header-new-session-btn__new-session-title">New Session</div>
                <div class="header-new-session-btn__new-session-icon">+</div>
            </button>
        {/if}
        <div class="header__time header__element">
            <i class="fa-solid fa-moon"></i>
            <span>9:34 PM</span>
        </div>
    </div>
</div>

<style global lang="scss">
    @import "../../scss/dropdown.scss";

    .header {
        margin-top: 15px;
        width: 100%;
        @include flex-container(center, space-between);
        
        &__element {
            border-radius: 20px;
            height: 40px;
            @include flex-container(center, _);
            padding: 11px 15px 11px 12px;
            background: var(--headerElementBgColor);
            border: var(--headerElementBorderVal);
            box-shadow: var(--headerElementShadow);
            white-space: nowrap;
        }
        &__section {
            @include flex-container(center, _);
        }


        &--light .user-panel {
            &__user-details-user {
                font-weight: 600;
            }
            &__user-details-time {
                font-weight: 500;
            }
        }
        &--dark .user-panel .dropdown-menu {
            @include dropdown-menu-dark;
            i {
                color: rgba(var(--textColor1), 0.85);
            }
        }

        &__time {
            i {
                font-size: 1.3rem;
                color: #F4CCA8;
            }
            span {
                margin-left: 8px;
                font-size: 1.3rem;
                font-weight: 200;
                color: rgba(var(--textColor1), 0.8);
            }
        }
    } 

    .user-panel {
        @include flex-container(center, _);
        position: relative;
        height: 40px;

        img {
            @include circle(030px);
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
        &__user-details-time {
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

    /* Active Session Component  */
    .header-session-container {
        color: rgba(var(--headerElementTextColor), 1);
        align-items: center;

        &--light-mode {
            
        }

        // &:focus {
        //     filter: brightness(1);
        //     box-shadow: 0px 0px 7px 0px rgba(255, 255, 255, 0.3);

        //     &:before {
        //         content: " ";
        //         position: absolute;
        //         z-index: -3;
        //         top: 0px;
        //         left: 0px;
        //         right: 0px;
        //         bottom: 0px;
        //         border-radius: 15px;
        //         border: 3px solid rgba(255, 255, 255, 0.2);
        //     }
        // }
        // &:hover {
        //     filter: brightness(1.07);
        // }
        // &:active {
        //     transform: scale(0.992);
        //     box-shadow: none;

        //     &:before {
        //         content: " " !important;
        //         border-width: 0px;
        //     }
        // }
        

        /* Active Session Component */
    }

    /* New Session Btn */
    .header-new-session-btn {
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
            margin: 0px 0px 2px 2px;
        }
        &__new-session-icon {
            font-size: 1.5rem;
            font-weight: 400;
            margin: 0px 2px 0px 10px;
        }
    }
    /* Modals */
    .modal-bg__content {
        border-radius: 0px;
    }
</style>