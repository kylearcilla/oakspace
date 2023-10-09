<script lang="ts">
    import SessionProgress from "./SessionProgress.svelte"
	import { sessionStore, themeState } from "$lib/store"
	import SessionEditModal from "./SessionEditModal.svelte";
	import { clickOutside } from "$lib/utils-general";
	import { onMount } from "svelte";
	import SessionActiveModal from "./SessionActiveModal.svelte";

    let isEditSessionModalOpen = false
    let isActiveSessionModalOpen = false
    let isDropDownOpen = false
    let isSessionComponentActive = false
    let isShowingTime = true

    const handleDropDownControlsListClicked = () => isDropDownOpen = !isDropDownOpen

    const handlePomOptionClicked = (optionIdx: number) => {
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

    const onClick = (event: Event) => {
        const target = event.target as HTMLElement
        const className = target.classList.value

        if (className.includes("settings-btn") || 
            className.includes("dropdown") || 
            className.includes("session-time") || 
            className.includes("session-todo-count") ||
            target.tagName.toLocaleUpperCase() === "CIRCLE") {
            return
        }

        isActiveSessionModalOpen = true
    }

    const onMouseDown = (event: Event) => {
        const target = event.target as HTMLElement
        const className = target.classList.value

        if (className.includes("settings-btn") || 
            className.includes("dropdown") || 
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
    const onMouseUp = () => isSessionComponentActive = false
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class={`header-session ${$themeState?.isDarkTheme ? "" : "header-session--light"} ${isSessionComponentActive ? "header-session--active" : ""}`} 
    on:mouseup={onMouseUp}
    on:mousedown={onMouseDown}
    on:click={onClick}
>
    <div title={$sessionStore?.tag.name} class="header-session__session-tag">
        {$sessionStore?.tag.name[0].toLocaleUpperCase()}
    </div>
    <div class="header-session__session-name" title={$sessionStore?.name}>
        {$sessionStore?.name}
    </div>
    {#if isShowingTime}
        <div class="header-session__session-time">
            {`${$sessionStore?.currentTime?.minutes}:${String($sessionStore?.currentTime?.seconds).padStart(2, '0')}`}
        </div>
    {:else}
        <div class="header-session__session-todo-count" title={`Todos accombplished: ${$sessionStore?.todosCheckedCount}`}>
            {`${$sessionStore?.todosCheckedCount} / ${$sessionStore?.todos.length}`}
        </div>
    {/if}
    <div class="header-session__session-progress-container">
        <SessionProgress/>
    </div>
    <div class="header-session__dropdown-btn-container dropdown-container">
        <button class="header-session__settings-btn dropdown-btn" on:click={handleDropDownControlsListClicked}>
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
                class="active-session__settings-dropdown-menu dropdown-menu"
                >
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionClicked(0)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-pencil"></i>
                        </div>
                        <p class="dropdown-element">Edit Session</p>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionClicked(1)}>
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
                    <button class="dropdown-element" on:click={() => handlePomOptionClicked(2)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-rotate-right"></i>
                        </div>
                        <p class="dropdown-element">Restart Period</p>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionClicked(3)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-forward-step"></i>
                        </div>
                        <p class="dropdown-element">Skip Period</p>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionClicked(4)}>
                        <div class="new-session-modal__name-input-btn-tag dropdown-menu__option-icon">
                            <i class="fa-solid fa-ban"></i>
                        </div>
                        <p class="dropdown-element">Cancel Session</p>
                    </button>
                </li>
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={() => handlePomOptionClicked(5)}>
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

{#if isEditSessionModalOpen}
    <SessionEditModal closeModal={() => isEditSessionModalOpen = false} />
{/if}

{#if isActiveSessionModalOpen}
    <SessionActiveModal closeModal={() => isActiveSessionModalOpen = false} />
{/if}


<style lang="scss">
    @import "../../scss/dropdown.scss";

    .header-session {
        @include flex-container(center, _);
        width: 50vw;
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
        &--light {
            // &:focus {
            //     filter: brightness(1.03);
            // }
            // &:hover {
            //     filter: brightness(1.02) !important;
            // }
        }
        &--light p {
            font-weight: 300;
        }
        &--light span {
            font-weight: 500;
        }
        &--light &__session-time {
            font-weight: 400;
            color: rgba(var(--headerElementTextColor), 0.8);
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
        &__session-time, &__session-todo-count {
            color: rgba(var(--headerElementTextColor), 0.3);
            font-size: 1.15rem;
            font-weight: 300;
            margin-left: 4px;
            width: 37px;
            text-align: center;
            margin-right: 4px;
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
            @include dropdown-menu-dark;
            z-index: 1000;
        }
    }
</style>