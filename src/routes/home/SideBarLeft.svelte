<script lang="ts">
    import { ModalType, MusicPlatform } from "$lib/enums"
    import { getThemeFromSection, setNewTheme } from "$lib/utils-appearance"
	import { themeState, globalContext, musicPlayerStore } from "$lib/store"
	import { hideWideMenuBar, openModal, showWideMenuBar } from "$lib/utils-home"
	import { onMount } from "svelte"
	import { getElemById, getLogoIconFromEnum } from "$lib/utils-general"
	import SideBarCalendar from "./SideBarCalendar.svelte"
	import { goto } from "$app/navigation"
	import { toast } from "$lib/utils-toast"

    enum TextTab {
        Workspace, Productivity, Goals, Habits, Mindhub, Routines
    }

    const NAV_MENU_NARROW_BAR_WIDTH = 58
    const NAV_MENU_WIDE_BAR_WIDTH = 220

    let selectedTxtButtonElement: HTMLElement
    let selectedTxtTabModifier = ""
    let initDragXPos = -1
    let isWideBarMenuOpen = true
    let count = 0

    $: {
        isWideBarMenuOpen = $globalContext.isLeftWideMenuOpen
    }

    $: {
        const isDefaultTheme = ["Dark Mode", "Light Mode"].includes($themeState.title)
        removeSelectTabBtnStyling()

        if (isDefaultTheme) {
           selectedTxtTabModifier = $themeState.title === "Light Mode" ? "--selected--light-default" : "--selected--dark-default"
        }
        else {
           selectedTxtTabModifier = "--selected"
        }
        selectTabBtn(selectedTxtButtonElement)
    }

    function onResizerClicked(event: Event) {
        const pe = event as PointerEvent

        window.addEventListener("mousemove", onResizerDrag)
        window.addEventListener("mouseup", onResizerEndDrag)

        initDragXPos = pe.clientX
    }
    function onResizerDrag(event: Event) {
        const pe = event as MouseEvent
        const newDragXOffSet = pe.clientX
        const xOffset = initDragXPos - newDragXOffSet

        pe.preventDefault()

        if (xOffset > 0 && isWideBarMenuOpen) {
            hideWideMenuBar()
            removeDragEventListener()
        }
        else if (xOffset < 0 && !isWideBarMenuOpen) {
            showWideMenuBar()
            removeDragEventListener()
        }
    }
    function onResizerEndDrag() {
        removeDragEventListener()
    }
    function removeDragEventListener() {
        initDragXPos = -1

        window.removeEventListener("mousemove", onResizerDrag)
        window.removeEventListener("mouseup", onResizerEndDrag)
    }
    function handleToggleThemeMode() {
        const title = $themeState!.twinTheme!.sectionName as keyof AppearanceSectionToThemeMap
        const idx = $themeState!.twinTheme!.index
        setNewTheme(getThemeFromSection(title, idx))
    }
    function onWideBarResize(event: Event) {
        console.log(event)
    }

    /* Narrow Bar Btn */
    function selectTabBtn(buttonElem: HTMLElement) {
        if (!buttonElem) return

        buttonElem.classList.add(`nav-menu__txt-tab-btn${selectedTxtTabModifier}`)
        selectedTxtButtonElement = buttonElem
    }
    /* Wide Bar Btns */
    function removeSelectTabBtnStyling() {
        if (!selectedTxtButtonElement) return
        selectedTxtButtonElement.classList.remove(`nav-menu__txt-tab-btn${selectedTxtTabModifier}`)
    }
    function handleTxtButtonClicked(event: Event, textTab: TextTab) {
        removeSelectTabBtnStyling()
        const target = event.target! as HTMLElement
        selectTabBtn(target.tagName === "BUTTON" ? target : target.parentElement!)

        if (textTab === TextTab.Workspace) {
            goto("/home")
        }
        else if (textTab === TextTab.Productivity) {

            toast("default", {
                message: "x",
                description: "Hello world",
                logoIcon: getLogoIconFromEnum(MusicPlatform.Spotify, MusicPlatform),
                action: {
                    label: 'Undo',
                    onClick: () => console.log('Undo')
                }
            })

            // goto("/home/productivity")
        }
        else if (textTab === TextTab.Goals) {
            goto("/home/goals")
        }
        else if (textTab === TextTab.Habits) {
            goto("/home/habits")
        }
        else {
            goto("/home/routines/current")
        }
    }
    onMount(() => {
        let selectedTab = TextTab.Workspace
        let currentHomePath = window.location.pathname.split("/")[2]

        if (currentHomePath === "routines") {
            selectedTab = TextTab.Routines
        }
        else if (currentHomePath === "goals") {
            selectedTab = TextTab.Goals
        }
        else if (currentHomePath === "habits") {
            selectedTab = TextTab.Habits
        }
        else if (currentHomePath === "productivity") {
            selectedTab = TextTab.Productivity
        }

        const workspaceTabBtn = getElemById(`workspace-btn--${selectedTab}`)! as HTMLButtonElement
        selectTabBtn(workspaceTabBtn)
    })
</script>

<div class={`nav-menu ${$themeState.isDarkTheme ? "nav-menu--dark-theme" : "nav-menu--light-theme"}`}>
    <!-- Narrow Bar -->
    <div class="nav-menu__narrow-bar">
        <div>
            <span class="nav-menu__temp-logo">
                S
            </span>
            <div class="nav-menu__divider"></div>
            <div class={`nav-menu__icon-tabs ${$themeState.isDarkTheme ? "nav-menu__icon-tabs--dark-theme" : ""} nav-menu__icon-tabs--${$themeState.title === "Dark Mode" ? "dark-default" : ($themeState.title === "Light Mode" ? "light-default" : "simple-styling")}`}>
                <button on:click={() => openModal(ModalType.Appearance)} class="nav-menu__icon-tab nav-menu__icon-tab--appearance">
                    <i class="fa-solid fa-brush"></i>
                </button>
                <button on:click={() => openModal(ModalType.Music)} class="nav-menu__icon-tab nav-menu__icon-tab--music">
                    <i class="fa-solid fa-compact-disc"></i>
                </button>
                <button on:click={() => openModal(ModalType.Youtube)} class="nav-menu__icon-tab nav-menu__icon-tab--vid">
                    <i class="fa-brands fa-youtube"></i>
                </button>
            </div>
        </div>
        {#if $themeState.twinTheme != null}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <button 
                on:click={handleToggleThemeMode}
                class={`theme-mode-toggle 
                        ${$themeState.isDarkTheme ? "theme-mode-toggle--dark" : "theme-mode-toggle--light"}
                        ${$musicPlayerStore?.doShowPlayer ? "theme-mode-toggle--music-player-active" : ""}
                `}
            >
                <div class="theme-mode-toggle__container">
                    <div class="theme-mode-toggle__sun">
                        <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path 
                                d="M9.23877 0.507812C9.7419 0.507812 10.1498 0.91568 10.1498 1.4188V2.81219C10.1498 3.31531 9.7419 3.72318 9.23877 3.72318C8.73565 3.72318 8.32778 3.31531 8.32778 2.81219V1.4188C8.32778 0.91568 8.73565 0.507812 9.23877 0.507812ZM13.0436 9.08209C13.0436 11.065 11.436 12.6725 9.45307 12.6725C7.47014 12.6725 5.86268 11.065 5.86268 9.08209C5.86268 7.09916 7.47014 5.49159 9.45307 5.49159C11.436 5.49159 13.0436 7.09916 13.0436 9.08209ZM0.878906 9.29638C0.878906 8.79326 1.28677 8.38539 1.7899 8.38539H3.18317C3.68629 8.38539 4.09416 8.79326 4.09416 9.29638C4.09416 9.79951 3.68629 10.2074 3.18317 10.2074H1.7899C1.28677 10.2074 0.878906 9.79951 0.878906 9.29638ZM17.1164 9.77867C17.6195 9.77867 18.0273 9.3708 18.0273 8.86768C18.0273 8.36455 17.6195 7.95669 17.1164 7.95669H15.723C15.2198 7.95669 14.812 8.36455 14.812 8.86768C14.812 9.3708 15.2198 9.77867 15.723 9.77867H17.1164ZM8.75649 16.7453C8.75649 17.2484 9.16436 17.6562 9.66748 17.6562C10.1706 17.6562 10.5785 17.2484 10.5785 16.7453V15.352C10.5785 14.8489 10.1706 14.441 9.66748 14.441C9.16436 14.441 8.75649 14.8489 8.75649 15.352V16.7453ZM3.23867 3.17067C3.59432 2.81491 4.17118 2.81491 4.52695 3.17067L5.51224 4.15597C5.868 4.51173 5.868 5.08859 5.51224 5.44435C5.15647 5.80012 4.57961 5.80012 4.22385 5.44435L3.23867 4.45906C2.88279 4.1033 2.88279 3.52644 3.23867 3.17067ZM14.3792 14.9935C14.735 15.3493 15.3118 15.3493 15.6676 14.9935C16.0233 14.6376 16.0233 14.0609 15.6676 13.7051L14.6824 12.7198C14.3266 12.3641 13.7498 12.3641 13.394 12.7198C13.0382 13.0756 13.0382 13.6524 13.394 14.0082L14.3792 14.9935ZM15.3645 2.86758C15.7203 3.22346 15.7203 3.8002 15.3645 4.15597L14.3792 5.14126C14.0234 5.49702 13.4466 5.49702 13.0908 5.14126C12.735 4.78549 12.735 4.20863 13.0908 3.85287L14.0761 2.86769C14.4319 2.51181 15.0087 2.51181 15.3645 2.86758ZM3.54177 14.0082C3.186 14.364 3.186 14.9408 3.54177 15.2966C3.89753 15.6523 4.47439 15.6523 4.83016 15.2966L5.81534 14.3113C6.1711 13.9555 6.1711 13.3787 5.81534 13.0229C5.45957 12.6672 4.88271 12.6672 4.52695 13.0229L3.54177 14.0082Z" 
                                fill={$themeState.themeToggleBtnIconColor}
                            />
                        </svg>                                                                                                                          
                    </div>
                    <div class="theme-mode-toggle__moon">
                        <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g filter="url(#filter0_d_2572_18359)">
                            <path 
                                fill={`${$themeState.isDarkTheme ? "url(#paint0_linear_2572_18359)" : $themeState.themeToggleBtnIconColor}`}
                                d="M18.2197 12.3918C14.7036 12.7697 12.1435 15.7469 12.4976 19.0413C12.8516 22.3358 15.9858 24.701 19.502 24.3231C21.2273 24.1377 22.7211 23.3252 23.7563 22.1579C23.8847 22.0121 23.8999 21.8057 23.7911 21.6504C23.6822 21.4951 23.4758 21.423 23.2827 21.476C23.0086 21.5513 22.7264 21.6059 22.4332 21.6374C19.6743 21.9339 17.211 20.0757 16.9328 17.4871C16.7444 15.7347 17.6054 14.0985 19.0365 13.1311C19.2001 13.0192 19.2684 12.8233 19.2062 12.6468C19.144 12.4703 18.9643 12.3522 18.7633 12.3577C18.5825 12.3636 18.4022 12.3749 18.22 12.3945L18.2197 12.3918Z"
                            />
                            </g>
                            {#if $themeState.isDarkTheme}
                                <defs>
                                    <filter id="filter0_d_2572_18359" x="0.464844" y="0.357422" width="35.3984" height="36.0054" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                    <feOffset/>
                                    <feGaussianBlur stdDeviation="6"/>
                                    <feComposite in2="hardAlpha" operator="out"/>
                                    <feColorMatrix type="matrix" values="0 0 0 0 0.945098 0 0 0 0 0.8 0 0 0 0 0.643137 0 0 0 0.31 0"/>
                                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2572_18359"/>
                                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2572_18359" result="shape"/>
                                    </filter>
                                    <linearGradient id="paint0_linear_2572_18359" x1="17.023" y1="9.67795" x2="18.2169" y2="20.7874" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FAEEE3"/>
                                    <stop offset="1" stop-color="#F2C59C"/>
                                    </linearGradient>
                                </defs>
                            {/if}
                        </svg>
                    </div>
                    <div class="theme-mode-toggle__highlighter"></div>
                </div>
            </button>
        {/if}
        <div class="nav-menu__divider"></div>
    </div>
    <!-- Wide Bar -->
    <div class="nav-menu__wide-bar" style={`${!isWideBarMenuOpen ? "display: none;" : ""}`}>
        <!-- Tab Buttons -->
        <div class={`nav-menu__txt-tabs nav-menu__txt-tabs--${$themeState.title === "Dark Mode" ? "dark-default" : ($themeState.title === "Light Mode" ? "light-default" : "simple-styling")}`}>
            <button 
                class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--workspace`} 
                id={`workspace-btn--${TextTab.Workspace}`} 
                on:click={(e) => handleTxtButtonClicked(e, TextTab.Workspace)}
            >
                <i class="fa-solid fa-ruler-combined nav-menu__txt-tab-btn-icon"></i>
                <span>Workspace</span>
            </button>
            <button 
                class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--productivity`} 
                id={`workspace-btn--${TextTab.Productivity}`} 
                on:click={(e) => handleTxtButtonClicked(e, TextTab.Productivity)}
            >
                <i class="fa-solid fa-chart-line nav-menu__txt-tab-btn-icon"></i>
                <span>Productivity</span>
            </button>
            <button 
                class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--goals`} 
                id={`workspace-btn--${TextTab.Goals}`} 
                on:click={(e) => handleTxtButtonClicked(e, TextTab.Goals)}
            >
                <i class="fa-solid fa-bullseye nav-menu__txt-tab-btn-icon"></i>
                <span>Goals</span>
            </button>
            <button 
                class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--habits`} 
                id={`workspace-btn--${TextTab.Habits}`} 
                on:click={(e) => handleTxtButtonClicked(e, TextTab.Habits)}
            >
                <i class="fa-solid fa-cubes-stacked nav-menu__txt-tab-btn-icon"></i>
                <span>Habits</span>
            </button>
            <button 
                class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--routines`} 
                id={`workspace-btn--${TextTab.Routines}`} 
                on:click={(e) => handleTxtButtonClicked(e, TextTab.Routines)}
            >
                <i class="fa-solid fa-spa nav-menu__txt-tab-btn-icon"></i>
                <span>Routines</span>
            </button>
        </div>
        <!-- Calendar / Day View -->
        <div class="nav-menu__calendar-container">
            <SideBarCalendar/>
        </div>
    </div>
    <div class="nav-menu__wide-bar-resize" on:mousedown={onResizerClicked}></div>
</div>

<style lang="scss">
    $nav-menu-width: 58px;

    .nav-menu {
        height: 100%;
        left: 0px;
        display: flex;
        position: relative;
        
        &--light-theme &__txt-tab-btn span {
            opacity: 0.64;
            @include text-style(1, 500);
        }
        &--light-theme &__txt-tab-btn-icon {
            @include text-style(1);
            opacity: 0.48;
        }
        &--light-theme &__txt-tabs {
            padding-left: 3px;
        }
        
        &__narrow-bar {
            background-color: var(--navMenuBgColor);
            position: relative;
            flex-direction: column;
            padding: 8.5px 10px 12px 10px;
            text-align: center;
            @include flex(center, space-between);
            z-index: 1;
            box-shadow: var(--navMenuBoxShadow);
            border-right: var(--navMenuBorder);
            width: $nav-menu-width;
            position: relative;
        }
        &__wide-bar {
            background-color: var(--wideLeftBarColor);
            box-shadow: var(--wideLeftBarBoxShadow);
            border-right: var(--wideLeftBarBorder);
            border-top: 0px solid;
            padding: 8px 0px 0px 5px;
            position: relative;
            // border-top-left-radius: 18px;
        }
        &__calendar-container {
            height: calc(100% - 150.5px);
            padding-right: 6px;
        }
        &__temp-logo {
            font-family: "Apercu";
            @include text-style(_, 500, 1.8rem);
            position: relative;
            color: var(--navIconColor);

            &:after {
                content: " ";
                @include pos-abs-bottom-right-corner(-5px, 3px);
                @include circle(3px);
                background-color: #FFA8A0;
            }
        }
        &__divider {
            @include divider(rgba(white, 0), 0.5px, 25px);
            margin: 8px auto;
        }
        &__divider:last-child {
            @include divider(rgba(white, 0.045), 100%, 0.5px);
            @include pos-abs-top-right-corner(0px, 0px);
            margin: 0px;
        }
        &__icon-tabs {
            &--dark-theme .nav-menu__icon-tab {
                &:focus {
                    filter: brightness(1.3) !important;
                }
            }
            &--dark-default, &--light-default {
                .fa-brush  {
                    color: #A6ADE9 !important;
                }
                .fa-compact-disc {
                    color: #DDA3F2 !important;
                }
                .fa-youtube {
                    color: #EE8A9C !important;
                }
            }
            &--light-default {
                .nav-menu__icon-tab--stats {
                    background-color: #F5F9FF !important;
                }
                .nav-menu__icon-tab--journal {
                    background-color: #F3F5FF !important;
                }
                .nav-menu__icon-tab--music {
                    background-color: #F6F2FF !important;
                }
                .nav-menu__icon-tab--appearance {
                    background-color: #FFF2FB !important;
                }
                .nav-menu__icon-tab--settings {
                    background-color: #fff4f7 !important;
                }
            }
            &--simple-styling {
                i {
                    color: var(--navIconColor) !important;
                }
            }
        }
        &__icon-tab {
            height: 38px;
            width: 38px;
            position: relative;
            font-size: 1rem;
            margin-bottom: 10px;
            padding: 0px;
            border-radius: 15px;
            transition: 0.14s ease-in-out;
            background-color: var(--navIconBgColor);
            @include flex(center, center);
            
            &:active {
                transform: scale(0.91);
            }
            &:hover {
                border-radius: 100%;
            }
            &:focus {
                border-radius: 100%;
                filter: brightness(0.98);
            }
            i {
                font-size: 1.3rem;
            }
            .fa-compact-disc {
                font-size: 1.4rem;
            }
            .fa-brush {
                font-size: 1.5rem;
            }
            &__text {
                white-space: nowrap;
                display: none;
            }
        }
        &__txt-tabs {
            margin-bottom: 0px;

            &--dark-theme .nav-menu__txt-tab-btn {
                &:focus {
                    filter: brightness(1.3) !important;
                }
            }
            &--light-default {
                .nav-menu__txt-tab-btn--workspace {
                    background-color: #F5F9FF !important;
                }
                .nav-menu__txt-tab-btn--productivity {
                    background-color: #F3F5FF !important;
                }
                .nav-menu__txt-tab-btn--goals {
                    background-color: #F6F2FF !important;
                }
                .nav-menu__txt-tab-btn--habits {
                    background-color: #FFF2FB !important;
                }
                .nav-menu__txt-tab-btn--routines {
                    background-color: #fff4f7 !important;
                }
            }
        }
        &__txt-tab-btn {
            @include flex(center);
            padding: 5px 8px 5px 11px;
            transition: 0.04s ease-in-out;
            width: calc(100% - 27px);
            border-radius: 10.5px;
            margin-bottom: 2px;
            border: 0.5px solid transparent;
        
            &:hover {
                background-color: var(--wideLeftBarTabColor);
            }
            &:hover span {
                opacity: 1;
            }
            &:active {
                transition: 0.1s ease-in-out;
                transform: scale(0.99);
            }

            // all shared styling
            &--selected, &--selected--dark-default {
                border: 0.5px solid rgba(white, 0.026);
                span {
                    opacity: 0.85 !important;
                }
            }
            &--selected, &--selected--dark-default &-icon {
                opacity: 1 !important;
            }

            // default styling
            &--selected {
                background-color: var(--wideLeftBarTabColor) !important;
            }
            &--selected i {
                color: var(--wideLeftBarTabIconColor) !important;
                opacity: 1 !important;
            }

            // dark default styling
            &--selected--dark-default#{&}--workspace {
                background-color: rgba(#A3C2FF, 0.02);
                i {
                    color: #A3C2FF;
                }
            }
            &--selected--dark-default#{&}--productivity {
                background-color: rgba(#949FFF, 0.02);
                i {
                    color: #949FFF;
                }
            }
            &--selected--dark-default#{&}--goals {
                background-color: rgba(#FFA3C4, 0.02);
                i {
                    color: #FFA3C4;
                }
            }
            &--selected--dark-default#{&}--habits {
                background-color: rgba(#FFCFA3, 0.02);
                i {
                    color: #FFCFA3;
                }
            }
            &--selected--dark-default#{&}--routines {
                background-color: rgba(#C3F493, 0.02);
                i {
                    color: #C3F493;
                }
            }

            &-icon {
                margin-right: 18px;
                width: 10px;
                height: 10px;
                @include text-style(1, _, 1rem);
                opacity: 0.25;
            }
            span {
                @include text-style(1, 300, 1.28rem);
                transition: 0.06s ease-in-out;
                opacity: 0.35;
            }
        }
        &__wide-bar-resize {
            @include pos-abs-top-right-corner(0px, -5px);
            width: 5px;
            height: 100%;
            cursor: ew-resize;
        }
    }
    .theme-mode-toggle {
        height: 85px;
        border-radius: 20px;
        background-color: var(--themeToggleBtnBgColor);
        border: var(--borderVal2);
        transition: 0.12s ease-in-out;
        outline: none;
        border: 2px solid rgba(var(--textColor1), 0);
        
        &:focus {
            border: 2px solid rgba(var(--textColor1), 0.05);
        }
        &:active {
            transform: scale(0.99);
        }
        
        &--light &__highlighter {
            background-color: var(--highlighterToggleBtnBgColor);
            @include pos-abs-bottom-left-corner(calc(100% - (3px + 33px)), calc(50% - 16.5px));
        }
        &--dark &__highlighter {
            background-color: var(--highlighterToggleBtnBgColor);
            @include pos-abs-bottom-left-corner(calc(0% + 3px), calc(50% - 16.5px));
        }
        &--music-player-active {
            @include mq-custom(max-width, 34.375em) {
                margin-bottom: 55px;
            }
        }
        &__container {
            position: relative;
            width: 100%;
            height: 100%;
            @include flex(center, space-between);
            flex-direction: column;
            padding-top: 9px;
        }
        &__sun {
            z-index: 2;
        }
        &__moon {
            margin-bottom: -2.5px;
            z-index: 2;
        }
        &__highlighter {
            transition: 0.2s cubic-bezier(.16,.86,.57,.84);
            position: absolute;
            @include circle(33px);
            z-index: 1;
        }
    }
</style>    