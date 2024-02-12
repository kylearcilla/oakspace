<script lang="ts">
    import { ModalType } from "$lib/enums"
    import { getThemeFromSection, setNewTheme } from "$lib/utils-appearance"
	import { themeState, musicPlayerStore, homeViewLayout, spotifyIframeStore } from "$lib/store"
	import { hideWideMenuBar, openModal, showWideMenuBar } from "$lib/utils-home"
	import { onMount } from "svelte";
	import { getElemById } from "$lib/utils-general";
	import SideBarCalendar from "./SideBarCalendar.svelte";
	import { goto } from "$app/navigation";

    enum TextTab {
        Workspace, Productivity, Goals, Habits, Mindhub
    }

    const NAV_MENU_NARROW_BAR_WIDTH = 58
    const NAV_MENU_WIDE_BAR_WIDTH = 220

    let selectedTxtButtonElement: HTMLElement
    let selectTextTabModifier = ""
    let initDragXPos = -1
    let isWideBarMenuOpen = true

    $: {
        isWideBarMenuOpen = $homeViewLayout.isLeftWideMenuOpen
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
            const player = $spotifyIframeStore!
            player.controller.seek(200)
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
                    <!-- <span class="tool-tip-text tool-tip-text--left">Appearance</span> -->
                    <i class="fa-solid fa-brush"></i>
                </button>
                <button on:click={() => openModal(ModalType.Music)} class="nav-menu__icon-tab nav-menu__icon-tab--music">
                    <!-- <span class="tool-tip-text tool-tip-text--left">Music</span> -->
                    <i class="fa-solid fa-compact-disc"></i>
                </button>
                <button on:click={() => openModal(ModalType.Youtube)} class="nav-menu__icon-tab nav-menu__icon-tab--vid">
                    <!-- <span class="tool-tip-text tool-tip-text--left">Youtube</span> -->
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
                        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g filter="url(#filter0_d_2609_23316)">
                                <path d="M17.297 20.5476C19.3712 20.5476 21.0527 18.8661 21.0527 16.7919C21.0527 14.7177 19.3712 13.0362 17.297 13.0362C15.2229 13.0362 13.5414 14.7177 13.5414 16.7919C13.5414 18.8661 15.2229 20.5476 17.297 20.5476Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M17.297 21.1618C14.8876 21.1618 12.9273 19.2015 12.9273 16.792C12.9273 14.3825 14.8876 12.4222 17.297 12.4222C19.7065 12.4222 21.6668 14.3825 21.6668 16.792C21.6668 19.2015 19.7065 21.1618 17.297 21.1618ZM17.297 13.6503C15.5648 13.6503 14.1555 15.0596 14.1555 16.7919C14.1555 18.5242 15.5648 19.9335 17.297 19.9335C19.0293 19.9335 20.4386 18.5242 20.4386 16.7919C20.4386 15.0596 19.0293 13.6503 17.297 13.6503Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M17.297 11.5164C16.9579 11.5164 16.683 11.2414 16.683 10.9023V8.90561C16.683 8.56646 16.9579 8.2915 17.297 8.2915C17.6362 8.2915 17.9111 8.56646 17.9111 8.90561V10.9023C17.9111 11.2414 17.6362 11.5164 17.297 11.5164Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M17.2969 25.2915C16.9577 25.2915 16.6828 25.0165 16.6828 24.6774V22.6807C16.6828 22.3416 16.9577 22.0666 17.2969 22.0666C17.636 22.0666 17.911 22.3416 17.911 22.6807V24.6774C17.911 25.0166 17.636 25.2915 17.2969 25.2915Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M25.1828 17.4058H23.1862C22.847 17.4058 22.5721 17.1309 22.5721 16.7917C22.5721 16.4526 22.847 16.1776 23.1862 16.1776H25.1828C25.5219 16.1776 25.7969 16.4526 25.7969 16.7917C25.7969 17.1309 25.522 17.4058 25.1828 17.4058Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M11.4076 17.4057H9.41097C9.07182 17.4057 8.79688 17.1307 8.79688 16.7916C8.79688 16.4524 9.07182 16.1775 9.41097 16.1775H11.4076C11.7467 16.1775 12.0217 16.4524 12.0217 16.7916C12.0217 17.1307 11.7467 17.4057 11.4076 17.4057Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M21.4613 13.241C21.3042 13.241 21.147 13.1811 21.0271 13.0611C20.7873 12.8213 20.7873 12.4324 21.0271 12.1927L22.4389 10.7809C22.6788 10.541 23.0676 10.541 23.3073 10.7809C23.5472 11.0207 23.5472 11.4096 23.3073 11.6493L21.8955 13.0611C21.7756 13.1811 21.6184 13.241 21.4613 13.241Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M11.7204 22.9818C11.5632 22.9818 11.406 22.9219 11.2862 22.8019C11.0463 22.5621 11.0463 22.1732 11.2862 21.9335L12.698 20.5216C12.9378 20.2818 13.3267 20.2818 13.5664 20.5216C13.8062 20.7615 13.8062 21.1503 13.5664 21.3901L12.1546 22.8019C12.0347 22.9219 11.8776 22.9818 11.7204 22.9818Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M22.8731 22.9818C22.716 22.9818 22.5588 22.9219 22.4389 22.8019L21.0271 21.3901C20.7873 21.1502 20.7873 20.7614 21.0271 20.5216C21.2669 20.2818 21.6558 20.2818 21.8955 20.5216L23.3073 21.9335C23.5472 22.1733 23.5472 22.5622 23.3073 22.8019C23.1875 22.9219 23.0303 22.9818 22.8731 22.9818Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                <path d="M13.1322 13.241C12.9751 13.241 12.8179 13.1811 12.698 13.0611L11.2862 11.6493C11.0463 11.4095 11.0463 11.0207 11.2862 10.7809C11.526 10.541 11.9148 10.541 12.1546 10.7809L13.5664 12.1927C13.8062 12.4325 13.8062 12.8213 13.5664 13.0611C13.4465 13.1811 13.2894 13.241 13.1322 13.241Z" fill={`${!$themeState.isDarkTheme ? "#C7C2B3" : $themeState.themeToggleBtnIconColor}`}/>
                                </g>
                                <defs>
                                    <stop stop-color="#C7C2B3"/>
                                    <stop offset="0.966295" stop-color="#C7C2B3"/>
                                </defs>
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
        }
        &__sun {
            margin-top: 2px;
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