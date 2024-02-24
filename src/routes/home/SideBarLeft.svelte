<script lang="ts">
    import { LogoIcon, ModalType, MusicPlatform } from "$lib/enums"
    import { getThemeFromSection, setNewTheme } from "$lib/utils-appearance"
	import { themeState, globalContext, musicPlayerStore } from "$lib/store"
	import { hideWideMenuBar, openModal, showWideMenuBar } from "$lib/utils-home"
	import { createEventDispatcher, onMount } from "svelte";
	import { getElemById, getLogoIconFromEnum } from "$lib/utils-general";
	import SideBarCalendar from "./SideBarCalendar.svelte";
	import { goto } from "$app/navigation";
	import { toast, toastAPI } from "$lib/utils-toast";
	import { get } from "svelte/store";

    enum TextTab {
        Workspace, Productivity, Goals, Habits, Mindhub
    }

	const dispatch = createEventDispatcher();

    const NAV_MENU_NARROW_BAR_WIDTH = 58
    const NAV_MENU_WIDE_BAR_WIDTH = 220

    let selectedTxtButtonElement: HTMLElement
    let selectTextTabModifier = ""
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
           selectTextTabModifier = $themeState.title === "Light Mode" ? "--selected--light-default" : "--selected--dark-default"
        }
        else {
           selectTextTabModifier = "--selected"
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

    function removeSelectTabBtnStyling() {
        if (!selectedTxtButtonElement) return
        selectedTxtButtonElement.classList.remove(`nav-menu__txt-tab-btn${selectTextTabModifier}`)
    }
    function selectTabBtn(buttonElem: HTMLElement) {
        if (!buttonElem) return

        buttonElem.classList.add(`nav-menu__txt-tab-btn${selectTextTabModifier}`)
        selectedTxtButtonElement = buttonElem
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
            goto("/home/mind-hub")
        }
    }
    onMount(() => {
        const workspaceTabBtn = getElemById(`workspace-btn--${TextTab.Workspace}`)! as HTMLButtonElement
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
                        <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill={$themeState.themeToggleBtnIconColor} d="M9.60542 0.572266C10.1786 0.572266 10.6432 1.0369 10.6432 1.61005V3.19737C10.6432 3.77051 10.1786 4.23515 9.60542 4.23515C9.03227 4.23515 8.56764 3.77051 8.56764 3.19737V1.61005C8.56764 1.0369 9.03227 0.572266 9.60542 0.572266ZM13.9398 10.3399C13.9398 12.5988 12.1085 14.43 9.84955 14.43C7.59063 14.43 5.75945 12.5988 5.75945 10.3399C5.75945 8.08099 7.59063 6.24968 9.84955 6.24968C12.1085 6.24968 13.9398 8.08099 13.9398 10.3399ZM0.0820312 10.584C0.0820312 10.0109 0.546666 9.54625 1.11981 9.54625H2.707C3.28015 9.54625 3.74478 10.0109 3.74478 10.584C3.74478 11.1572 3.28015 11.6218 2.707 11.6218H1.11981C0.546666 11.6218 0.0820312 11.1572 0.0820312 10.584ZM18.5794 11.1334C19.1526 11.1334 19.6172 10.6688 19.6172 10.0957C19.6172 9.52251 19.1526 9.05787 18.5794 9.05787H16.9921C16.4189 9.05787 15.9543 9.52251 15.9543 10.0957C15.9543 10.6688 16.4189 11.1334 16.9921 11.1334H18.5794ZM9.05602 19.0696C9.05602 19.6428 9.52065 20.1074 10.0938 20.1074C10.6669 20.1074 11.1316 19.6428 11.1316 19.0696V17.4825C11.1316 16.9093 10.6669 16.4447 10.0938 16.4447C9.52065 16.4447 9.05602 16.9093 9.05602 17.4825V19.0696ZM2.77023 3.60574C3.17538 3.20046 3.83252 3.20046 4.23781 3.60574L5.36023 4.72817C5.76551 5.13345 5.76551 5.7906 5.36023 6.19588C4.95495 6.60116 4.2978 6.60116 3.89252 6.19588L2.77023 5.07345C2.36482 4.66817 2.36482 4.01102 2.77023 3.60574ZM15.4613 17.0741C15.8666 17.4794 16.5237 17.4794 16.929 17.0741C17.3343 16.6687 17.3343 16.0116 16.929 15.6064L15.8067 14.4839C15.4014 14.0787 14.7443 14.0787 14.339 14.4839C13.9337 14.8892 13.9337 15.5464 14.339 15.9516L15.4613 17.0741ZM16.5837 3.26046C16.989 3.66587 16.989 4.32289 16.5837 4.72817L15.4613 5.85059C15.056 6.25588 14.3989 6.25588 13.9936 5.85059C13.5883 5.44531 13.5883 4.78817 13.9936 4.38289L15.116 3.26059C15.5213 2.85518 16.1784 2.85518 16.5837 3.26046ZM3.11551 15.9516C2.71023 16.3569 2.71023 17.0141 3.11551 17.4194C3.52079 17.8245 4.17794 17.8245 4.58322 17.4194L5.70551 16.2969C6.1108 15.8916 6.1108 15.2345 5.70551 14.8292C5.30023 14.4239 4.64309 14.4239 4.23781 14.8292L3.11551 15.9516Z"/>
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
            <button class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--workspace`} id="workspace-btn--0" on:click={(e) => handleTxtButtonClicked(e, TextTab.Workspace)}>
                <i class="fa-solid fa-ruler-combined nav-menu__txt-tab-btn-icon"></i>
                <span>Workspace</span>
            </button>
            <button class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--productivity`} on:click={(e) => handleTxtButtonClicked(e, TextTab.Productivity)}>
                <i class="fa-solid fa-chart-line nav-menu__txt-tab-btn-icon"></i>
                <span>Productivity</span>
            </button>
            <button class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--goals`} on:click={(e) => handleTxtButtonClicked(e, TextTab.Goals)}>
                <i class="fa-solid fa-bullseye nav-menu__txt-tab-btn-icon"></i>
                <span>Goals</span>
            </button>
            <button class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--habits`} on:click={(e) => handleTxtButtonClicked(e, TextTab.Habits)}>
                <i class="fa-solid fa-cubes-stacked nav-menu__txt-tab-btn-icon"></i>
                <span>Habits</span>
            </button>
            <button class={`nav-menu__txt-tab-btn nav-menu__txt-tab-btn--mindhub`} on:click={(e) => handleTxtButtonClicked(e, TextTab.Mindhub)}>
                <i class="fa-solid fa-spa nav-menu__txt-tab-btn-icon"></i>
                <span>Mindhub</span>
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
            margin-bottom: -7px;

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
                .nav-menu__txt-tab-btn--mindhub {
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
            &--selected--dark-default#{&}--mindhub {
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