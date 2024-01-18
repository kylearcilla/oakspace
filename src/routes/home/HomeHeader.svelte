<script lang="ts">
    import { ModalType } from "$lib/enums"
	import { openModal } from "$lib/utils-home"
	import { themeState, musicDataStore, ytPlayerStore, sessionStore } from "$lib/store"

	import SessionHeaderView from "./SessionHeaderView.svelte"
	import { onDestroy, onMount } from "svelte"

    let dropdownMenu: HTMLElement
    let doMinHeaderUI = false
    let headerWidth = 0

    $: {
        doMinHeaderUI = $ytPlayerStore?.doShowPlayer ?? false
    }

    /* Event Handlers */
    function handleDropdownOption(idx: number) {
        if (idx === 0) {
            openModal(ModalType.Quote)
        }
        else if (idx === 1) {
            openModal(ModalType.Shortcuts)
        }
        else {
            console.log("LOGGING OUT USER")
        }
        dropdownMenu.style.display = "none"
    }
    function handleResize() {
        if (!$ytPlayerStore?.doShowPlayer) return
        doMinHeaderUI = headerWidth < 840  
    }


    onMount(() => {
        window.addEventListener("resize", handleResize)
    })
    onDestroy(() => {
        window.removeEventListener("resize", handleResize)
    })
</script>

<header 
    class={`header header${$themeState.isDarkTheme ? "--dark" : "--light"} ${$sessionStore && doMinHeaderUI ? "header--min" : ""}`} 
    bind:clientWidth={headerWidth}
>
    <!-- Left Side -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class="user-panel header__section" 
        on:mouseover={() => dropdownMenu.style.display = "block"} 
        on:mouseleave={() => dropdownMenu.style.display = "none"}
    >
        <div class="user-panel__details">
            <img src="https://i.pinimg.com/474x/87/7a/f8/877af84ee302075f969be04f809a0e5f.jpg" alt="">
            <span class="user-panel__details">Kyle Arcilla</span>
        </div>
        <!-- Dropdown Container -->
        <div class="dropdown-container" bind:this={dropdownMenu}>
            <ul class="dropdown-menu dropdown-menu--alt">
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(_) => handleDropdownOption(0)}>
                        <span class="dropdown-menu__option-text">
                            Weekly Wisdom
                        </span>
                        <div class="dropdown-menu__option-icon">
                            <i class="fa-solid fa-quote-right"></i>
                        </div>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(_) => handleDropdownOption(1)}>
                        <span class="dropdown-menu__option-text">
                            Keyboard Shortcuts
                        </span>
                        <div class="dropdown-menu__option-icon">
                            <i class="fa-regular fa-keyboard"></i>
                        </div>
                    </button>
                </li>
                {#if $ytPlayerStore || $musicDataStore}
                    <div class="divider"></div>
                {/if}
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(_) => handleDropdownOption(2)}>
                        <span class="dropdown-menu__option-text">
                            Log Out
                        </span>
                    </button>
                </li>
            </ul>
        </div>
    </div>

    <!-- Active Session Component -->
    {#if $sessionStore != null && $ytPlayerStore?.doShowPlayer}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class={`header-session-container ${$themeState.isDarkTheme ? "" : "header-session-container--light-mode"}`}>
            <SessionHeaderView />
        </div>
    {/if}

    <!-- Right Side -->
    <div class="header__section">
        <!-- New Session Button -->
        {#if !$sessionStore}
            <button 
                class={`header-new-session-btn header__element ${$themeState.isDarkTheme ? "" : "header-new-session-btn--light-mode"}`}
                on:click={() => openModal(ModalType.NewSession)}
            >
                <div class="header-new-session-btn-title">New Session</div>
                <div class="header-new-session-btn-icon">+</div>
            </button>
        {/if}
        <!-- Total Session Time -->
        <div class="header__session-time">
            <i class="fa-regular fa-clock"></i>
            <span>1h 45m</span>
        </div>
    </div>

    <!-- Divider -->
    <div class="header__divider"></div>
</header>

<style global lang="scss">
    @import "../../scss/dropdown.scss";

    .header {
        width: 100%;
        height: 32px;
        padding: 0px 10px;
        position: relative;
        @include flex-container(center, space-between);

        /* Dark / Light Themes */
        &--light &-new-session-btn-title {
            color: rgba(var(--textColor1), 0.55);
        }
        &--light .user-panel {
        }
        &--dark .user-panel .dropdown-menu {
            @include dropdown-menu-dark;
            i {
                color: rgba(var(--textColor1), 0.85);
            }
        }

        &__element {
            border-radius: 20px;
            height: 40px;
            @include flex-container(center);
            padding: 11px 15px 11px 12px;
            background: var(--headerElementBgColor);
            border: var(--headerElementBorderVal);
            box-shadow: var(--headerElementShadow);
            white-space: nowrap;
        }
        &__section {
            @include flex-container(center);
        }

        &__session-time {
            @include flex-container(center);
            
            i {
                opacity: 0.45;
            }
            span {
                @include text-style(0.4, 300, 1.1rem);
                font-family: "DM Sans";
                margin-left: 6px;
            }
        }
        &__divider {
            @include divider(rgba(var(--textColor1), 0.1), 0.5px, 100%);
            @include pos-abs-bottom-left-corner(0px, 0px);
        }
    } 

    /* User Panel */
    .user-panel {
        @include flex-container(center);
        position: relative;
        height: 40px;

        img {
            @include circle(16px);
            object-fit: cover;
            margin-right: 8px;
            -webkit-user-drag: none;
        }
        &__details {
            font-family: "Apercu";
            @include text-style(1, 300, 1.14rem);
            @include flex-container(center);
        }
        .dropdown-container {
            @include pos-abs-bottom-left-corner(-120px, 0px);
            height: 120px;
            width: 150px;
            display: none;
        }
        .dropdown-menu {
            margin-top: 10px;
            width: 100%;
            border-radius: 12px;

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
        align-items: center;
        width: 70%;
    }

    /* New Session Btn */
    .header-new-session-btn {
        display: none;
        padding: 0px 12px 0px 15px;
        margin-right: 10px;
        align-items: center;
        transition: 0.1s ease-in-out;
        color: rgba(var(--textColor1), 0.8);

        &--light-mode {
            &:focus {
                filter: brightness(0.98);
            }
            &:hover {
                filter: brightness(0.98) !important;
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
        &-title {
            font-size: 1.2rem;
            margin: 0px 0px 2px 2px;
        }
        &-icon {
            font-size: 1.5rem;
            font-weight: 400;
            margin: 0px 2px 0px 10px;
        }
    }
</style>