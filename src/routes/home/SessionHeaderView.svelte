<script lang="ts">
    import { SessionState } from "$lib/enums"
	import { clickOutside } from "$lib/utils-general"
	import { sessionStore, themeState } from "$lib/store"

    import SessionProgress from "./SessionProgress.svelte"
	import SessionEditModal from "./SessionEditModal.svelte"
	import SessionActiveModal from "./SessionActiveModal.svelte"
	import SessionCanceledModal from "./SessionCanceledModal.svelte"
	import SessionFinishedModal from "./SessionFinishedModal.svelte"
    
    let isEditSessionModalOpen = false
    let isActiveSessionModalOpen = false
    let isDropDownOpen = false
    let isSessionComponentActive = false
    let isShowingTime = true
    let hasSessionConcluded = false

    const dropdownOptionsBtnClicked = () => isDropDownOpen = !isDropDownOpen
    const progressBtnClicked        = () => $sessionStore!.progressToNextPeriod()
    const concludeBtnClicked        = () => hasSessionConcluded = true
    const clearSessionBtnClicked    = () => $sessionStore!.clearSession()
    
    const handlePomOptionSessionViewClickeded = (optionIdx: number) => {
        if (optionIdx === 0) {
            isEditSessionModalOpen = true
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
        else {
            $sessionStore!.finishSession()
        }
        isDropDownOpen = false
    }

    /* Button Handlers for Session View Buttons */
    const onMouseDown = (event: Event) => {
        const target = event.target as HTMLElement
        const className = target.classList.value

        if (className.includes("settings-btn") || 
            className.includes("dropdown")     || 
            className.includes("action-btn")   || 
            target.tagName.toLocaleUpperCase() === "CIRCLE") {
            return
        }
        else if (className.includes("session-time") || className.includes("session-todo-count")) {
            isShowingTime = $sessionStore?.todos.length === 0 ? true : !isShowingTime
        }
        else {   
            isSessionComponentActive = true
        }
    }

    /* Toggling Active Session Modal */
    const activeSessionModalToggleHandler = (event: Event) => {
        const target = event.target as HTMLElement
        const className = target.classList.value

        if (className.includes("settings-btn") || 
            className.includes("dropdown")     || 
            className.includes("session-time") || 
            className.includes("session-todo-count") ||
            className.includes("action-btn")   ||
            target.tagName.toLocaleUpperCase() === "CIRCLE") {
            return
        }

        isActiveSessionModalOpen = true
    }
    const onMouseUp = () => isSessionComponentActive = false
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class={`header-session ${$themeState?.isDarkTheme ? "header-session--dark" : "header-session--light"} ${isSessionComponentActive ? "header-session--active" : ""}`} 
    on:mouseup={onMouseUp}
    on:mousedown={onMouseDown}
    on:click={activeSessionModalToggleHandler}
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
            <svg class="header-session__settings-btn-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17">
                <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(0 8.5)">
                    <circle cx="2" cy="0.8" r="1.7"></circle>
                    <circle cx="8" cy="0.8" r="1.7"></circle>
                    <circle cx="14" cy="0.8" r="1.7"></circle>
                </g>
            </svg>
        </button>
        <!-- Session Controls -->
        {#if isDropDownOpen}
            <ul 
                use:clickOutside on:click_outside={() => isDropDownOpen = false} 
                class="active-session__settings-dropdown-menu dropdown-menu dropdown-menu--alt"
                >
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(0)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-pencil"></i>
                        </div>
                        <p class="dropdown-element">Edit Session</p>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(1)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            {#if $sessionStore?.isPlaying}
                                <i class="fa-solid fa-pause dropdown-element"></i>
                            {:else}
                                <i class="fa-solid fa-play dropdown-element"></i>
                            {/if}
                        </div>
                        {#if $sessionStore?.isPlaying}
                            <p class="dropdown-element">Pause Session</p>
                        {:else}
                            <p class="dropdown-element">Play Session</p>
                        {/if}
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(2)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-rotate-right"></i>
                        </div>
                        <p class="dropdown-element">Restart Period</p>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(3)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-forward-step"></i>
                        </div>
                        <p class="dropdown-element">Skip Period</p>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(4)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-ban"></i>
                        </div>
                        <p class="dropdown-element">Cancel Session</p>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionSessionViewClickeded(5)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-flag-checkered"></i>
                        </div>
                        <p class="dropdown-element">Finish Session</p>
                    </button>
                </li>
            </ul>
        {/if}
    </div>
</div>

<!-- Modals -->
{#if isActiveSessionModalOpen}
    <SessionActiveModal closeModal={() => isActiveSessionModalOpen = false} />
{/if}
{#if isEditSessionModalOpen}
    <SessionEditModal closeModal={() => isEditSessionModalOpen = false} />
{/if}
{#if hasSessionConcluded && $sessionStore}
    <SessionFinishedModal clearSession={() => clearSessionBtnClicked()}/>
{/if}
{#if $sessionStore?.state === SessionState.CANCELED}
    <SessionCanceledModal clearSession={() => clearSessionBtnClicked()}/>
{/if}


<style lang="scss">
    @import "../../scss/dropdown.scss";

    .header-session {
        @include flex-container(center, _);
        width: 100%;
        position: relative;
        overflow: visible;
        padding: 0px 10px 2px 17px;
        height: 38px;
        cursor: pointer;
        transition: 0.14s ease-in-out;
        border-radius: 20px;
        white-space: nowrap;

        background: var(--headerElementBgColor);
        border: var(--headerElementBorderVal);
        box-shadow: var(--headerElementShadow);

        &--active {
            transform: scale(0.994);
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
            background-color: rgba(var(--textColor1), 0.04);
            &:hover {
                background-color: rgba(var(--textColor1), 0.07);
            }
        }
        &--light &__settings-btn {
            font-weight: 500;

            &:hover {
                background-color: rgba(var(--textColor1), 0.04);
            }
            svg g {
                stroke: rgba(var(--textColor1), 0.3);
                stroke-width: 0.95px;
            }
        }
        &--light &__session-time, &--light &__session-todo-count {
            font-weight: 400;
            color: rgba(var(--headerElementTextColor), 0.7);
        }

        &__session-tag {
            @include circle(15px);
            @include center;
            background-color: rgba(var(--fgColor1), 1);
            margin: 0px 8px 0px -5px;
            color: white;
            font-size: 0.85rem;
        }
        &__session-name {
            min-width: 40px;
            width: 10%;
            font-size: 1.15rem;
            @include elipses-overflow;
        }
        &__context-view {
            width: 37px;
            margin: 0px 4px;
        }
        &__session-time, &__session-todo-count {
            color: rgba(var(--headerElementTextColor), 0.3);
            font-size: 1.15rem;
            font-weight: 300;
            text-align: center;
        }
        &__action-btn {
            height: 25px;
            width: 25px;
            border-radius: 10px;
            @include flex-container(center, center);
            margin: 2px 2px 0px auto;
            transition: 0.1s ease-in-out;
            background-color: rgba($color: #FFFFFF, $alpha: 0.06);
            font-size: 1.1rem;
            
            &:hover {
                background-color: rgba($color: #FFFFFF, $alpha: 0.08);
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
            width: 75%;
            margin: 0px 8px -3px 8px;
        }
        &__dropdown-btn-container {
            background: none;
        }
        &__settings-btn {
            @include flex-container(center, center);
            transition: 0.12s ease-in-out;
            @include circle(25px);
            padding: 0px;
            background: none;
            box-shadow: none;

            &:hover {
                background-color: rgba(var(--textColor1), 0.03);
            }
            &:active {
                transform: scale(0.9);
            }

            svg g {
                stroke: rgba(var(--textColor1), 0.3);
                stroke-width: 0.6px;
            }
        }

        .dropdown-menu {
            width: 130px;
            @include pos-abs-top-right-corner(40px, -20px);
            z-index: 1000;
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