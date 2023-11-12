<script lang="ts">
    import { ModalType } from "$lib/enums"
	import { openModal } from "$lib/utils-home"
	import { formatTimeToHHMM, formatDatetoStr, getUserHourCycle, isNightTime } from "$lib/utils-date"
	import { themeState, musicDataStore, ytPlayerStore, sessionStore } from "$lib/store"

	import SessionHeaderView from "./SessionHeaderView.svelte"
	import { onDestroy, onMount } from "svelte"

    let dropdownMenu: HTMLElement
    let interval: NodeJS.Timer | null = null
    let doMinHeaderUI = false
    let headerWidth = 0
    let currentTimeStr = ""
    let doUse12HourFormat = false
    let isDayTime = true

    $: {
        doMinHeaderUI = $ytPlayerStore?.doShowPlayer ?? false
    }

    /* Event Handlers */
    const handleOptionClicked = (idx: number) => {
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
    const handleResize = () => {
        if (!$ytPlayerStore?.doShowPlayer) return
        doMinHeaderUI = headerWidth < 840 
    }
    const openNewSessionModal = () => {
        openModal(ModalType.NewSession)
    }
    const updateTimeStr = () => {
        currentTimeStr = formatTimeToHHMM(new Date(), doUse12HourFormat)
        isDayTime = !isNightTime()
    }
    const toggleTimeFormatting = () => {
        doUse12HourFormat = !doUse12HourFormat 
        updateTimeStr()
    }
    const initDateTimer = () => {
        interval = setInterval(updateTimeStr, 1000)
    }

    onMount(() => {
        window.addEventListener("resize", handleResize)
        
        const hourCycle = getUserHourCycle()
        doUse12HourFormat = hourCycle === "h12" || hourCycle === "h11"
        updateTimeStr()
        
        initDateTimer()
    })
    onDestroy(() => {
        window.removeEventListener("resize", handleResize)
        clearInterval(interval!)
    })
</script>

<div 
    class={`header header${$themeState.isDarkTheme ? "--dark" : "--light"} ${$sessionStore && doMinHeaderUI ? "header--min" : ""}`} 
    bind:clientWidth={headerWidth}
>
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
                <span class="user-panel__user-details-time">
                    {`${formatDatetoStr(new Date(), { weekday: "short", day: "2-digit", month: "short" })}`}
                </span>
            </div>
        </div>
        <!-- Dropdown Container -->
        <div class="dropdown-container" bind:this={dropdownMenu}>
            <ul class="dropdown-menu dropdown-menu--alt">
                <li class="user-panel__stats">
                    <div class="user-panel__stats-stat">
                        <i class="fa-solid fa-hourglass-half"></i>
                        <span>3 Sess.</span>
                    </div>
                    <div class="user-panel__stats-stat">
                        <i class="fa-brands fa-readme"></i>
                        <span>4hr 3m</span>
                    </div>
                    <div class="user-panel__stats-stat">
                        <i class="fa-solid fa-seedling"></i>
                        <span>1h 3m</span>
                    </div>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(_) => handleOptionClicked(0)}>
                        <p>Weekly Wisdom</p>
                        <div class="dropdown-menu__option-icon">
                            <i class="fa-solid fa-quote-right"></i>
                        </div>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(_) => handleOptionClicked(1)}>
                        <p>Keyboard Shortcuts</p>
                        <div class="dropdown-menu__option-icon">
                            <i class="fa-regular fa-keyboard"></i>
                        </div>
                    </button>
                </li>
                {#if $ytPlayerStore || $musicDataStore}
                    <div class="divider"></div>
                {/if}
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(_) => handleOptionClicked(2)}>
                        <p>Log Out</p>
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
                on:click={openNewSessionModal}
            >
            <div class="header-new-session-btn-title">New Session</div>
            <div class="header-new-session-btn-icon">+</div>
        </button>
        {/if}
        <!-- Current Time -->
        <button class="header__time header__element" title={currentTimeStr} on:click={toggleTimeFormatting}>
            {#if isDayTime}
                <i class="fa-solid fa-sun"></i>
            {:else}
                <i class="fa-solid fa-moon"></i>
            {/if}
            <span>{currentTimeStr}</span>
        </button>
    </div>
</div>

<style global lang="scss">
    @import "../../scss/dropdown.scss";

    .header {
        margin-top: 15px;
        width: 100%;
        @include flex-container(center, space-between);

        /* Active Session Component Responsiveness */
        &--min .user-panel {
            @include circle(30px);
            img {
                @include circle(26px);
            }
            &__user-details {
                margin: none;
                display: none;
            }
        }
        &--min &-session-container {
            width: 80%;
        }
        &--min &__time {
            @include circle(35px);
            @include center;
            margin-left: 4px;
            padding: 0px;
            span {
                display: none;   
            }
            i {
                font-size: 1.35rem;
            }
        }

        /* Dark / Light Themes */
        &--light .user-panel {
            &__user-details-time {
                color: rgba(var(--textColor1), 0.55);
            }
        }
        &--light &-new-session-btn-title {
            color: rgba(var(--textColor1), 0.55);
        }
        &--light .user-panel {
            &__user-details-user {
                font-weight: 600;
            }
            &__user-details-time {
                font-weight: 500;
            }
            &__stats {
                background-color: rgba(45, 45, 45, 0.03);

                &-stat i {
                    color: rgba(var(--textColor1), 0.6) !important;
                }
                &-stat span {
                    color: rgba(var(--textColor1), 0.5);
                    font-weight: 500;
                }
            }
        }
        &--light &__time span {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.55);
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
        &__time {
            transition: 0.1s ease-in-out;
            padding: 0px 14px 0px 14px;
            display: none;
            
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

    /* User Panel */
    .user-panel {
        @include flex-container(center, _);
        position: relative;
        height: 40px;

        img {
            @include circle(27px);
            object-fit: cover;
            border: 1.5px solid white;
            margin-right: 10px;
            -webkit-user-drag: none;
        }

        &__stats {
            @include flex-container(center, space-between);
            background-color: rgba(45, 45, 45, 0.13);
            padding: 8px 11px 10px 11px;
            border-radius: 12px;
            width: 95%;
            margin: 2px 0px 10px 3px;

            i {
                font-size: 1.1em !important;
            }

            &-stat {
                display: block;
                text-align: center;

                span {
                    font-size: 0.97em;
                    margin-top: 5px;
                    display: block;
                    font-weight: 400;
                    color: rgba(var(--textColor1), 0.8);
                }
            }
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
            font-weight: 300;
            white-space: nowrap;
        }
        .dropdown-container {
            @include pos-abs-bottom-left-corner(-120px, 0px);
            height: 120px;
            width: 150px;
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
        color: rgba(var(--headerElementTextColor), 1);
        align-items: center;
        width: 70%;

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
        color: rgba(var(--textColor1), 0.8);
        align-items: center;
        transition: 0.1s ease-in-out;

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