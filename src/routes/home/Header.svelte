<script lang="ts">
    import { ModalType } from "$lib/enums"
	import { openModal } from "$lib/utils-home"
	import { themeState, musicDataStore, ytPlayerStore, sessionStore, musicPlayerStore } from "$lib/store"

	import SessionHeaderView from "./SessionHeaderView.svelte"
	import { onDestroy, onMount } from "svelte"

    let dropdownMenu: HTMLElement
    let doMinHeaderUI = false
    let headerWidth = 0
    let isColorThemeDefault = true

    $: {
        doMinHeaderUI = $ytPlayerStore?.doShowPlayer ?? false
        isColorThemeDefault = ["Dark Mode", "Light Mode"].includes($themeState.title)
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
    bind:clientWidth={headerWidth}
    class={`header 
                header${$themeState.isDarkTheme ? "--dark" : "--light"} 
                ${isColorThemeDefault ? "" : "header--non-default"}
                ${$sessionStore && doMinHeaderUI ? "header--min" : ""}
    `} 
>
    <!-- Left Side -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class={`user-panel ${$themeState.isDarkTheme ? "" : "user-panel--light"} header__section`}
        on:mouseover={() => dropdownMenu.style.display = "block"} 
        on:mouseleave={() => dropdownMenu.style.display = "none"}
    >
        <div class="user-panel__details">
            <img src="https://i.pinimg.com/474x/87/7a/f8/877af84ee302075f969be04f809a0e5f.jpg" alt="">
            <span class="user-panel__details-name">Kyle Arcilla</span>
            <div class="user-panel__active-streak" title="Active perfect habit streak.">
                <span>4</span>
                <i class="fa-solid fa-fire"></i>
            </div>
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
        <div class="header__ctrl-btns">
            <!-- New Session Button -->
            {#if !$sessionStore}
                <button class="header__ctrl-btn header__ctrl-btn--session" title="New Session" on:click={() => openModal(ModalType.NewSession)}>
                    <i class="fa-regular fa-clock"></i>
                </button>
            {/if}
            <button class={`header__ctrl-btn ${$musicPlayerStore ? "header__ctrl-btn--music-active" : "header__ctrl-btn--inactive"}`} title="Music Player Settings">
                <i class="fa-solid fa-compact-disc"></i>
            </button>
            <button class={`header__ctrl-btn ${ytPlayerStore ? "header__ctrl-btn--youtube-active" : "header__ctrl-btn--inactive"}`} title="Youtube Player Settings">
                <i class="fa-brands fa-youtube"></i>
            </button>
        </div>
        <!-- Total Session Time -->
        <div class="header__session-time" title="Tota productive time">
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
        @include flex(center, space-between);
        background-color: var(--headerBgColor);
        box-shadow: var(--headerBoxShadow);
        border-bottom: var(--headerBorder);
        
        /* Dark / Light Themes */
        &--light &__divider {
            display: none;
        }
        &--light &__ctrl-btns {
            margin-right: 11px;
            i {
                color: rgba(var(--fgColor1), 1) !important;
            }
        }
        &--light &__ctrl-btn {
            margin-right: 13px;

            i {
                font-size: 1.3rem;
            }
        }
        &--light &__session-time {
            i {
                opacity: 1;
            }
            span {
                font-weight: 400;
                @include text-style(_, 400, 1.18rem);
                opacity: 1;
            }
        }
        &--dark .user-panel .dropdown-menu {
            @include dropdown-menu-dark;
            i {
                color: rgba(var(--textColor1), 0.85);
            }
        }
        &--non-default &__ctrl-btn i {
            color: var(--headerIconColor) !important;
        }
        &--non-default &__ctrl-btn--inactive i {
            opacity: 0.5;
            &:hover {
                opacity: 1;
            }
        }

        &__section {
            @include flex(center);
        }
        &__session-time {
            @include flex(center);
            white-space: nowrap;
            i {
                opacity: 0.45;
                color: rgb(var(--headerTextColor));
            }
            span {
                @include text-style(_, 300, 1.05rem);
                color: rgb(var(--headerTextColor));
                opacity: 0.65;
                font-family: "DM Sans";
                margin-left: 6px;
            }
        }
        &__divider {
            @include divider(rgba(var(--textColor1), 0.1), 0.5px, 100%);
            @include pos-abs-bottom-left-corner(0px, 0px);
            z-index: 1;
        }

        /* Control Buttons */
        &__ctrl-btns {
            @include flex(center);
            margin-right: 4px;
        }
        &__ctrl-btn {
            @include center;
            margin-right: 13px;

            &:hover i {
                color: rgba(var(--headerTextColor), 0.2);
            }            
            &:active {
                transform: scale(0.95);
            }
            
            i {
                font-size: 1.2rem;
                transition: 0.1s ease-in-out;
            }
            &--inactive {
                color: rgba(var(--headerTextColor), 0.1);
            }
            &--session {
                i {
                    color: rgba(var(--headerTextColor), 0.4);
                    font-size: 1.17rem;
                }
                &:hover {
                    color: rgba(var(--headerTextColor), 0.7);
                }
            }
            &--music-active {
                i, &:hover i {
                    color: #DDA3F2;
                }
                &:hover i {
                    opacity: 0.8;
                }
            }
            &--youtube-active {
                i, &:hover i  {
                    color: #e94b4a;
                }
                &:hover i {
                    opacity: 0.8;
                }
            }
        }
    } 

    /* User Panel */
    .user-panel {
        @include flex(center);
        position: relative;
        height: 40px;

        &--light &__details {
            &-name {
                font-weight: 400;
            }
            img {
                @include circle(18px);
                margin-right: 10px;
            }
        }
        &--light &__active-streak i {
            color: #fab238;
        }
        &--light &__active-streak span {
            font-weight: 500;
            color: rgba(var(--headerTextColor), 0.5);
        }

        img {
            @include circle(16px);
            object-fit: cover;
            -webkit-user-drag: none;
            margin-right: 7px;
        }
        &__details {
            font-family: "Apercu";
            @include flex(center);
            
            &-name {
                @include text-style(_, 300, 1.14rem);
                @include elipses-overflow;
                color: rgb(var(--headerTextColor));
                white-space: nowrap;
                // max-width: 30px;
            }
        }
        &__active-streak {
            @include flex(center);
            margin-left: 10px;
            // display: none;
            i {
                color: #FFD18B;
                font-size: 0.85rem;
            }
            span {
                @include text-style(_, 300, 1.12rem, "DM Sans");
                color: rgba(var(--headerTextColor), 0.5);
                margin-right: 4px;
            }
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
</style>