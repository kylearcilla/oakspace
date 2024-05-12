<script lang="ts">
	import { openModal } from "$lib/utils-home"
    import { Icon, ModalType, SessionState } from "$lib/enums"
	import { clickOutside } from "$lib/utils-general"
	import { sessionManager, sessionStore, themeState, ytPlayerStore } from "$lib/store"

    import SessionProgress from "./SessionProgress.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte";
	import { getThemeStyling } from "$lib/utils-appearance";
    
    let isDropDownOpen = false
    let isSessionComponentActive = false
    let isShowingTime = true

    const dropdownOptionsBtnClicked = () => isDropDownOpen = !isDropDownOpen
    const progressBtnClicked        = () => $sessionStore!.progressToNextPeriod()
    const concludeBtnClicked        = () => $sessionManager!.concludeSessionBtnClicked()

    let settingsBtnColor = ""

    const SETTINGS_BTN_ICON = "settings-bg-icon"

    $: {
        if ($themeState) {
            settingsBtnColor = getThemeStyling("headerTextColor")
            console.log(settingsBtnColor)
        }
    }
    
    const handlePomOptionSessionViewClickeded = (optionIdx: number) => {
        if (optionIdx === 0) {
            $sessionManager!.toggleEditSessionModal(true)
        }
        else if (optionIdx === 1) {
            $sessionStore!.isPlaying? $sessionStore!.pauseSession() : $sessionStore!.playSession()
        }
        else if (optionIdx === 2) {
            $sessionStore!.restartPeriod()
        }
        else if (optionIdx === 3) {
            $sessionStore!.skipToNextPeriod()
        }
        else if (optionIdx === 4) {
            $sessionStore!.cancelSession()
        }
        else if (optionIdx === 5) {
            $sessionStore!.finishSession()
        }
        else if (optionIdx === 6) {
            $ytPlayerStore!.toggledShowPlayer()
        }
        else if (optionIdx === 7) {
            openModal(ModalType.ActiveSession)
        }

        isDropDownOpen = false
    }
    const onMouseUpHandler = () => isSessionComponentActive = false
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class={`header-session ${$themeState?.isDarkTheme ? "header-session--dark" : "header-session--light"} ${isSessionComponentActive ? "header-session--active" : ""}`} 
    on:mouseup={onMouseUpHandler}
>
    <div title={$sessionStore?.tag.name} class="header-session__session-tag">
        {$sessionStore?.tag.name[0].toLocaleUpperCase()}
    </div>
    <div class="header-session__session-name" title={$sessionStore?.name}>
        {$sessionStore?.name}
    </div>
    <div class="header-session__context-view">
        {#if $sessionStore?.isCurrentlyWaiting()}
            <button class="header-session__action-btn header-session__action-btn--finger" title="Press to progress to next phase." on:click={progressBtnClicked}>
                <span class="header-session__action-btn-icon">👉</span>
            </button>
        {:else if $sessionStore?.state === SessionState.FINISHED}
            <button class="header-session__action-btn header-session__action-btn--flag" title="Press to conclude session." on:click={concludeBtnClicked}>
                <span class="header-session__action-btn-icon">
                    <i class="fa-solid fa-flag-checkered header-session__action-btn-icon"></i>
                </span>
            </button>
        {:else if isShowingTime}
            <div class="header-session__session-time">
                {`${$sessionStore?.currentTime?.minutes}:${String($sessionStore?.currentTime?.seconds).padStart(2, '0')}`}
            </div>
        {:else}
            <div class="header-session__session-todo-count" title={`Todos accombplished: ${$sessionStore?.todosCheckedCount}`}>
                {`${$sessionStore?.todosCheckedCount} / ${$sessionStore?.todos.length}`}
            </div>
        {/if}
    </div>
    <div class="header-session__session-progress-container">
        <SessionProgress/>
    </div>
    <div class="header-session__dropdown-btn-container dropdown-container">
        <button class="header-session__settings-btn dropdown-btn" on:click={dropdownOptionsBtnClicked}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" >
                <g fill={`rgb(${settingsBtnColor})`} stroke={`rgb(${settingsBtnColor})`} stroke-linecap="round" transform="translate(0 8.5)">
                    <circle cx="2" cy="0.8" r="0.8"></circle>
                    <circle cx="7" cy="0.8" r="0.8"></circle>
                    <circle cx="12" cy="0.8" r="0.8"></circle>
                </g>
              </svg>
        </button>
        <!-- Session Controls -->
        <ul 
            use:clickOutside on:click_outside={() => isDropDownOpen = false} 
            class={`active-session__settings-dropdown-menu dropdown-menu ${isDropDownOpen ? "" : "dropdown-menu--hidden"}`}
        >
            <li class="dropdown-menu__option">
                <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(7)}>
                    <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                        <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                    </div>
                    <span class="dropdown-menu__option-text">Open Session</span>
                </button>
            </li>
            <li class="dropdown-menu__option">
                <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(0)}>
                    <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                        <i class="fa-solid fa-pencil"></i>
                    </div>
                    <span class="dropdown-menu__option-text">Edit Session</span>
                </button>
            </li>
            <li class="dropdown-menu__option">
                <button 
                    on:click={() => handlePomOptionSessionViewClickeded(1)}
                    disabled={$sessionStore?.state === SessionState.FINISHED}
                >
                    <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                        {#if $sessionStore?.isPlaying}
                            <i class="fa-solid fa-pause dropdown-element"></i>
                        {:else}
                            <i class="fa-solid fa-play dropdown-element"></i>
                        {/if}
                    </div>
                    {#if $sessionStore?.isPlaying}
                        <span class="dropdown-menu__option-text">Pause Session</span>
                    {:else}
                        <span class="dropdown-menu__option-text">Play Session</span>
                    {/if}
                </button>
            </li>
            <li class="dropdown-menu__option">
                <button 
                    disabled={$sessionStore && ($sessionStore.WAITING_STATES.includes($sessionStore.state) || $sessionStore.state === SessionState.FINISHED)}
                    on:click={() => handlePomOptionSessionViewClickeded(2)}
                >
                    <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                        <i class="fa-solid fa-rotate-right"></i>
                    </div>
                    <span class="dropdown-menu__option-text">Restart Period</span>
                </button>
            </li>
            <li class="dropdown-menu__option">
                <button 
                    on:click={() => handlePomOptionSessionViewClickeded(3)}
                    disabled={$sessionStore?.state === SessionState.FINISHED}
                >
                    <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                        <i class="fa-solid fa-forward-step"></i>
                    </div>
                    <span class="dropdown-menu__option-text">Skip Period</span>
                </button>
            </li>
            <li class="dropdown-menu__option">
                <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(4)}>
                    <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                        <i class="fa-solid fa-ban"></i>
                    </div>
                    <span class="dropdown-menu__option-text">Cancel Session</span>
                </button>
            </li>
            <li class="dropdown-menu__option">
                <button 
                    on:click={() => handlePomOptionSessionViewClickeded(5)}
                    disabled={$sessionStore?.state === SessionState.FINISHED}
                >
                    <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                        <i class="fa-solid fa-flag-checkered"></i>
                    </div>
                    <span class="dropdown-menu__option-text">Finish Session</span>
                </button>
            </li>
            <li class="dropdown-menu__option">
                <button 
                    on:click={() => handlePomOptionSessionViewClickeded(6)}
                    disabled={$sessionStore?.state === SessionState.FINISHED}
                >
                    <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                        <i class="fa-solid fa-expand"></i>
                    </div>
                    <span class="dropdown-menu__option-text">Large Mode</span>
                </button>
            </li>
        </ul>
    </div>
</div>


<style lang="scss">
    @import "../../scss/dropdown.scss";

    .header-session {
        @include flex(center, _);
        width: 100%;
        position: relative;
        overflow: visible;
        padding: 0px 10px 2px 17px;
        height: 29px;
        transition: 0.14s ease-in-out;
        border-radius: 20px;
        white-space: nowrap;
        @include txt-color(0.05, "bg");

        &--active {
            transform: scale(0.998);
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--light &__session-name {
            font-weight: 500;
        }
        &--light p {
            font-weight: 300;
        }
        &--light span {
            font-weight: 500;
        }
        &--light &__action-btn {
            @include txt-color(0.09, "bg");
            &:hover {
                @include txt-color(0.25, "bg");
            }
        }
        &--light &__settings-btn {
            font-weight: 500;
            opacity: 0.8;

            &:hover {
                opacity: 0.9;
                background-color: rgba(black, 0.04);
            }
        }
        &--light &__session-time, &--light &__session-todo-count {
            font-weight: 500;
            color: rgb(var(--headerTextColor));
        }

        &__session-tag {
            @include circle(14px);
            @include center;
            background-color: rgba(var(--fgColor1), 1);
            margin: 0px 0px 0px -5px;
            @include text-style(_, 600, 0.74rem);
            color: var(--headerBgColor);
        }
        &__session-name {
            min-width: 40px;
            width: 10%;
            font-size: 1rem;
            display: none;
            @include elipses-overflow;
        }
        &__context-view {
            width: 37px;
            margin: 0px 4px;
        }
        &__session-time, &__session-todo-count {
            color: rgb(var(--headerTextColor));
            @include text-style(_, 400, 1.1rem);
            text-align: center;
            font-family: "DM Sans";
        }
        &__action-btn {
            height: 25px;
            width: 25px;
            border-radius: 10px;
            @include flex(center, center);
            margin: 2px 2px 0px auto;
            transition: 0.14s ease-in-out;
            background-color: rgba(white, .06);
            font-size: 1.1rem;
            
            &:hover {
                background-color: rgba(white, .08);
            }
            &:active {
                transform: scale(0.97);
            }

            &--finger span {
                animation: moveBackAndForth 2s ease-in-out infinite;
            }
            &--flag span {
                animation: rotation 1.5s ease-in-out infinite;
            }
        }
        &__session-progress-container {
            height: 10px;
            width: calc(100% - (13px + 37px + 25px));
            margin: 0px 8px -3px 8px;
        }
        &__dropdown-btn-container {
            background: none;
        }
        &__settings-btn {
            @include flex(center, center);
            @include circle(25px);
            transition: 0.12s ease-in-out;
            padding: 0px;
            background: none;
            box-shadow: none;
            opacity: 0.3;
            
            &:hover {
                opacity: 0.6;
                @include txt-color(0.085, "bg");
            }
            &:active {
                transform: scale(0.9);
            }
        }

        .dropdown-menu {
            width: 160px;
            @include abs-top-right(35px, 0px);
            z-index: 2000001;

            &__option-icon {
                margin-right: 9px;
            }
        }
    }

    @keyframes moveBackAndForth {
        0% {
            transform: translateX(-1px);
        }
        50% {
            transform: translateX(1.5px);
        }
        100% {
            transform: translateX(-1px);
        }
    }
    @keyframes rotation {
        0% {
            -webkit-transform: rotate(0deg);
        }
        25% {
            -webkit-transform: rotate(25deg);
        }
        50% {
            -webkit-transform: rotate(0deg);
        }
        75% {
            -webkit-transform: rotate(-25deg);
        }
        100% {
            -webkit-transform: rotate(0deg);
        }
    }

</style>