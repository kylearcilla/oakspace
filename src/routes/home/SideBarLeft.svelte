<script lang="ts">
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"

	import { globalContext, themeState } from "$lib/store"
    import { Icon, ModalType } from "$lib/enums"
	import { findAncestor, } from "$lib/utils-general"
	import { openModal, updateRoute } from "$lib/utils-home"
    import { getThemeFromSection, setNewTheme } from "$lib/utils-appearance"
    
	import BounceFade from "../../components/BounceFade.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"

    const NAV_MENU_NARROW_BAR_WIDTH = 58
    const NAV_MENU_WIDE_BAR_WIDTH = 220

    enum SideBarTab {
        Workspace, Productivity, Goals, Habits, Routines, Youtube, Music, Themes
    }

    const tabs = [
        { name: "Workspace", icon: "fa-solid fa-ruler-combined" }, 
        { name: "Goals", icon: "fa-solid fa-bullseye" },     
        { name: "Habits", icon: "fa-solid fa-cubes-stacked" }, 
        { name: "Routines", icon: "fa-solid fa-spa" },       
        { name: "Themes", icon: "fa-solid fa-brush" },
        { name: "Music", icon: "fa-solid fa-record-vinyl" }, 
        { name: "Youtube", icon: "fa-brands fa-youtube" }
    ]

    let selectedTabButtonElement: HTMLElement
    let hoveredTabButtonElement: HTMLElement | null = null
    let selectedTabTabModifier = ""
    let settingsOpen = false

    let initDragXPos = -1
    let isWideBarMenuOpen = true

    $: ambience = $globalContext.ambience
    $: isDarkTheme = $themeState.isDarkTheme

    $: {
        const isDefaultTheme = ["Dark", "Light"].includes($themeState.title)
        removeBtnStyling(selectedTabButtonElement)

        if (isDefaultTheme) {
           selectedTabTabModifier = $themeState.title === "Light Mode" ? "--selected--light-default" : "--selected--dark-default"
        }
        else {
           selectedTabTabModifier = "--selected"
        }
        highlightTabBtn(selectedTabButtonElement)
    }

    /* Resizer */
    function onResizerDrag(event: Event) {
        const pe = event as MouseEvent
        const newDragXOffSet = pe.clientX

        pe.preventDefault()
    }
    function onResizerEndDrag() {
        removeDragEventListener()
    }
    function removeDragEventListener() {
        initDragXPos = -1

        window.removeEventListener("mousemove", onResizerDrag)
        window.removeEventListener("mouseup", onResizerEndDrag)
    }
    /* Ta Buttons */
    function highlightTabBtn(elem: HTMLElement, doSelect = false) {
        const buttonElem = findAncestor({
            child: elem, queryBy: "class", queryStr: "bar__icon-tab", strict: true
        })

        if (!buttonElem) return
        buttonElem.classList.add(`bar__icon-tab${selectedTabTabModifier}`)
        
        if (doSelect) {
            selectedTabButtonElement = buttonElem
        }
        else if (!doSelect && buttonElem != hoveredTabButtonElement) {
            // do not remove prev hov if it was selected
            if (hoveredTabButtonElement != selectedTabButtonElement) {
                removeBtnStyling(hoveredTabButtonElement)
            }

            hoveredTabButtonElement = buttonElem
        }
    }
    function removeBtnStyling(btn: HTMLElement | null) {
        if (!btn) return
        btn.classList.remove(`bar__icon-tab${selectedTabTabModifier}`)
    }

    /* Event Listeners */
    function onTabBtnMouseOver(e: MouseEvent) {
        const btn = e.target as HTMLElement
        highlightTabBtn(btn)
    }
    function onTabBtnMouseLeave(e: MouseEvent) {
        const btn = e.target as HTMLElement

        if (btn != selectedTabButtonElement) {
            removeBtnStyling(btn)
        }
        hoveredTabButtonElement = null
    }
    function handleTabBtnClicked(event: Event, textTab: string) {
        removeBtnStyling(selectedTabButtonElement)
        
        const target = event.target! as HTMLElement
        selectTabBtn(target, textTab)
    }
    function selectTabBtn(target: HTMLElement, textTab: string) {
        const isModal = ["Themes", "Music", "Youtube"].includes(textTab)
        const option = textTab.toLowerCase()

        highlightTabBtn(target, !isModal)
        
        if (option === "workspace") {
            goto("/home")
        }
        else if (option === "goals") {
            // toast("default", {
            //     message: "x",
            //     description: "Hello world",
            //     logoIcon: getLogoIconFromEnum(MusicPlatform.Spotify, MusicPlatform),
            //     action: {
            //         label: 'Undo',
            //         onClick: () => console.log('Undo')
            //     }
            // })

            // goto("/home/goals")
        }
        else if (option === "habits") {
            goto("/home/habits")
        }
        else if (option === "routines") {
            goto("/home/routines")
        }
        else if (option === "themes") {
            openModal(ModalType.Appearance)
        }
        else if (option === "music") {
            openModal(ModalType.Music)   
        }
        else {
            openModal(ModalType.Youtube)   
        }
    }

    /* Util Buttons */
    function handleToggleThemeMode() {
        const title = $themeState!.twinTheme!.sectionName as keyof AppearanceSectionToThemeMap
        const idx = $themeState!.twinTheme!.index
        setNewTheme(getThemeFromSection(title, idx))
    }
    function _toggleFloatSideBar() {
        // toggleFloatSideBar()
        settingsOpen = false
    }

    onMount(() => {
        let selectedTab = SideBarTab.Workspace
        let currentHomePath = window.location.pathname.split("/")[2]

        if (currentHomePath === "routines") {
            selectedTab = SideBarTab.Routines
        }
        else if (currentHomePath === "goals") {
            selectedTab = SideBarTab.Goals
        }
        else if (currentHomePath === "habits") {
            selectedTab = SideBarTab.Habits
        }
        else if (currentHomePath === "productivity") {
            selectedTab = SideBarTab.Productivity
        }

        // const tabBtn = getElemById(`workspace-btn--${selectedTab}`)! as HTMLButtonElement
        // selectTabBtn(tabBtn, selectedTab)
    })
</script>

<div 
    class="bar"
    class:bar--dark-theme={isDarkTheme}
    class:bar--light-theme={!isDarkTheme}
    class:bar--ambience={ambience?.styling === "blur" || ambience?.styling === "clear"}
    class:bar--ambience-solid={ambience?.styling === "solid"}
    class:bar--ambience-clear={ambience?.styling === "clear"}
>
    <!-- Narrow Bar -->
    <div class="bar__narrow-bar">
        <div>
            <span class="bar__temp-logo">S</span>
            <div 
                class="bar__icon-tabs"
                class:bar__icon-tabs--dark-theme={isDarkTheme}
                class:bar__icon-tabs--dark-default={$themeState.title === "Dark Mode"}
                class:bar__icon-tabs--light-default={$themeState.title === "Light Mode"}
                class:bar__icon-tabs--simple-styling={$themeState.title != "Light Mode"}
            >
                {#each tabs as tab, tabIdx}
                    {@const name = tab.name}
                    {@const icon = tab.icon}

                    {#if name === "Themes"}
                        <div class="bar__divider"></div>
                    {/if}
                    <div class="bar__icon-tab-container">
                        <button 
                            class={`bar__icon-tab bar__icon-tab--${name.toLocaleLowerCase()}`}
                            data-tab-name={name.toLocaleLowerCase()}
                            on:click={(e) => handleTabBtnClicked(e, name)}
                            on:mouseenter={onTabBtnMouseOver}
                            on:mouseleave={onTabBtnMouseLeave}
                        >
                            <i class={`${icon} bar__icon-tab-icon`}></i>
                            <!-- <span>{name}</span> -->
                        </button>
                        <div class="bar__icon-tab-tool-tip">
                            {tab.name === "Themes" ? "Appearance" : tab.name}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
        <button 
            on:click={handleToggleThemeMode}
            class="narrow-theme-toggle"
            class:narrow-theme-toggle--dark={isDarkTheme}
            class:narrow-theme-toggle--light={!isDarkTheme}
        >
            <div class="narrow-theme-toggle__container">
                <div class="narrow-theme-toggle__sun">
                    <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                            d="M9.23877 0.507812C9.7419 0.507812 10.1498 0.91568 10.1498 1.4188V2.81219C10.1498 3.31531 9.7419 3.72318 9.23877 3.72318C8.73565 3.72318 8.32778 3.31531 8.32778 2.81219V1.4188C8.32778 0.91568 8.73565 0.507812 9.23877 0.507812ZM13.0436 9.08209C13.0436 11.065 11.436 12.6725 9.45307 12.6725C7.47014 12.6725 5.86268 11.065 5.86268 9.08209C5.86268 7.09916 7.47014 5.49159 9.45307 5.49159C11.436 5.49159 13.0436 7.09916 13.0436 9.08209ZM0.878906 9.29638C0.878906 8.79326 1.28677 8.38539 1.7899 8.38539H3.18317C3.68629 8.38539 4.09416 8.79326 4.09416 9.29638C4.09416 9.79951 3.68629 10.2074 3.18317 10.2074H1.7899C1.28677 10.2074 0.878906 9.79951 0.878906 9.29638ZM17.1164 9.77867C17.6195 9.77867 18.0273 9.3708 18.0273 8.86768C18.0273 8.36455 17.6195 7.95669 17.1164 7.95669H15.723C15.2198 7.95669 14.812 8.36455 14.812 8.86768C14.812 9.3708 15.2198 9.77867 15.723 9.77867H17.1164ZM8.75649 16.7453C8.75649 17.2484 9.16436 17.6562 9.66748 17.6562C10.1706 17.6562 10.5785 17.2484 10.5785 16.7453V15.352C10.5785 14.8489 10.1706 14.441 9.66748 14.441C9.16436 14.441 8.75649 14.8489 8.75649 15.352V16.7453ZM3.23867 3.17067C3.59432 2.81491 4.17118 2.81491 4.52695 3.17067L5.51224 4.15597C5.868 4.51173 5.868 5.08859 5.51224 5.44435C5.15647 5.80012 4.57961 5.80012 4.22385 5.44435L3.23867 4.45906C2.88279 4.1033 2.88279 3.52644 3.23867 3.17067ZM14.3792 14.9935C14.735 15.3493 15.3118 15.3493 15.6676 14.9935C16.0233 14.6376 16.0233 14.0609 15.6676 13.7051L14.6824 12.7198C14.3266 12.3641 13.7498 12.3641 13.394 12.7198C13.0382 13.0756 13.0382 13.6524 13.394 14.0082L14.3792 14.9935ZM15.3645 2.86758C15.7203 3.22346 15.7203 3.8002 15.3645 4.15597L14.3792 5.14126C14.0234 5.49702 13.4466 5.49702 13.0908 5.14126C12.735 4.78549 12.735 4.20863 13.0908 3.85287L14.0761 2.86769C14.4319 2.51181 15.0087 2.51181 15.3645 2.86758ZM3.54177 14.0082C3.186 14.364 3.186 14.9408 3.54177 15.2966C3.89753 15.6523 4.47439 15.6523 4.83016 15.2966L5.81534 14.3113C6.1711 13.9555 6.1711 13.3787 5.81534 13.0229C5.45957 12.6672 4.88271 12.6672 4.52695 13.0229L3.54177 14.0082Z" 
                            fill={$themeState.themeToggleBtnIconColor}
                        />
                    </svg>
                </div>
                <div class="narrow-theme-toggle__moon">
                    <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g filter="url(#filter0_d_2572_18359)">
                        <path 
                            fill={`${isDarkTheme ? "url(#paint0_linear_2572_18359)" : $themeState.themeToggleBtnIconColor}`}
                            d="M18.2197 12.3918C14.7036 12.7697 12.1435 15.7469 12.4976 19.0413C12.8516 22.3358 15.9858 24.701 19.502 24.3231C21.2273 24.1377 22.7211 23.3252 23.7563 22.1579C23.8847 22.0121 23.8999 21.8057 23.7911 21.6504C23.6822 21.4951 23.4758 21.423 23.2827 21.476C23.0086 21.5513 22.7264 21.6059 22.4332 21.6374C19.6743 21.9339 17.211 20.0757 16.9328 17.4871C16.7444 15.7347 17.6054 14.0985 19.0365 13.1311C19.2001 13.0192 19.2684 12.8233 19.2062 12.6468C19.144 12.4703 18.9643 12.3522 18.7633 12.3577C18.5825 12.3636 18.4022 12.3749 18.22 12.3945L18.2197 12.3918Z"
                        />
                        </g>
                        {#if isDarkTheme}
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
                <div class="narrow-theme-toggle__highlighter"></div>
            </div>
        </button>
    </div>
    <!-- Wide Bar -->
    <div 
        class="wide-bar" 
        class:wide-bar--dark={isDarkTheme}
        class:wide-bar--light={!isDarkTheme}
        style:display={`${isWideBarMenuOpen ? "block" : "none"}`}
    >
        <!-- Profile Section -->
        <div class="wide-bar__profile">
            <img src="https://i.pinimg.com/474x/87/7a/f8/877af84ee302075f969be04f809a0e5f.jpg" alt="">
            <div class="wide-bar__profile-details">
                <span class="wide-bar__profile-name">
                    Kyle Arcilla
                </span>
                <div class="wide-bar__profile-stats" title="Active Habit streak">
                    <div class="wide-bar__habit-streak">
                        <i class="fa-solid fa-fire"></i>
                        4
                    </div>
                    <div class="wide-bar__yr-goals" title="Goals accomplished this year.">
                        <i class="fa-solid fa-bullseye"></i>
                        12/22
                    </div>
                </div>
            </div>
            <button 
                class="wide-bar__settings-btn" 
                id="left-bar--dropdown-btn"
                on:click={() => settingsOpen = !settingsOpen}
            >
                <SvgIcon icon={Icon.Settings} options={{ opacity: 1, scale: 0.9 }} />
            </button>
        </div>

        <div class="wide-bar__divider wide-bar__divider--first"></div>

        <!-- Settings Dropdown -->
        <div class="wide-bar__settings-dropdown-container">
            <BounceFade
                id="left-bar--dropdown-menu"
                styling={{ }}
                isHidden={!settingsOpen}
                onClickOutside={() => settingsOpen = false}
            >
                <ul 
                    class="wide-bar__settings-dropdown dropdown-menu"
                    class:dropdown-menu--dark={isDarkTheme}
                >
                    <li class="dropdown-menu__option">
                        <button class="dropdown-menu__option-btn" on:click={() => openModal(ModalType.Shortcuts)}>
                            <span class="dropdown-menu__option-text">
                                Settings
                            </span>
                        </button>
                    </li>
                    <li class="dropdown-menu__option">
                        <button class="dropdown-menu__option-btn" >
                            <span class="dropdown-menu__option-text">
                                Daily Wisdom
                            </span>
                        </button>
                    </li>
                    <li class="dropdown-menu__option">
                        <button class="dropdown-menu__option-btn" on:click={() => openModal(ModalType.Shortcuts)}>
                            <span class="dropdown-menu__option-text">
                                Shortcuts
                            </span>
                        </button>
                    </li>
                    <li class="dropdown-menu__section-divider"></li>
                    <li class="dropdown-menu__item" id="appearance-optn">
                        <span class="dropdown-menu__item-text">
                            Appearance
                        </span>
                        <div class="wide-bar__toggle-appearance">
                            <button 
                                class="wide-theme-toggle"
                                class:wide-theme-toggle--dark={isDarkTheme}
                                class:wide-theme-toggle--light={!isDarkTheme}
                                on:click={handleToggleThemeMode}
                            >
                                <div class="wide-theme-toggle__container">
                                    <div class="wide-theme-toggle__sun">
                                        <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path 
                                                d="M9.23877 0.507812C9.7419 0.507812 10.1498 0.91568 10.1498 1.4188V2.81219C10.1498 3.31531 9.7419 3.72318 9.23877 3.72318C8.73565 3.72318 8.32778 3.31531 8.32778 2.81219V1.4188C8.32778 0.91568 8.73565 0.507812 9.23877 0.507812ZM13.0436 9.08209C13.0436 11.065 11.436 12.6725 9.45307 12.6725C7.47014 12.6725 5.86268 11.065 5.86268 9.08209C5.86268 7.09916 7.47014 5.49159 9.45307 5.49159C11.436 5.49159 13.0436 7.09916 13.0436 9.08209ZM0.878906 9.29638C0.878906 8.79326 1.28677 8.38539 1.7899 8.38539H3.18317C3.68629 8.38539 4.09416 8.79326 4.09416 9.29638C4.09416 9.79951 3.68629 10.2074 3.18317 10.2074H1.7899C1.28677 10.2074 0.878906 9.79951 0.878906 9.29638ZM17.1164 9.77867C17.6195 9.77867 18.0273 9.3708 18.0273 8.86768C18.0273 8.36455 17.6195 7.95669 17.1164 7.95669H15.723C15.2198 7.95669 14.812 8.36455 14.812 8.86768C14.812 9.3708 15.2198 9.77867 15.723 9.77867H17.1164ZM8.75649 16.7453C8.75649 17.2484 9.16436 17.6562 9.66748 17.6562C10.1706 17.6562 10.5785 17.2484 10.5785 16.7453V15.352C10.5785 14.8489 10.1706 14.441 9.66748 14.441C9.16436 14.441 8.75649 14.8489 8.75649 15.352V16.7453ZM3.23867 3.17067C3.59432 2.81491 4.17118 2.81491 4.52695 3.17067L5.51224 4.15597C5.868 4.51173 5.868 5.08859 5.51224 5.44435C5.15647 5.80012 4.57961 5.80012 4.22385 5.44435L3.23867 4.45906C2.88279 4.1033 2.88279 3.52644 3.23867 3.17067ZM14.3792 14.9935C14.735 15.3493 15.3118 15.3493 15.6676 14.9935C16.0233 14.6376 16.0233 14.0609 15.6676 13.7051L14.6824 12.7198C14.3266 12.3641 13.7498 12.3641 13.394 12.7198C13.0382 13.0756 13.0382 13.6524 13.394 14.0082L14.3792 14.9935ZM15.3645 2.86758C15.7203 3.22346 15.7203 3.8002 15.3645 4.15597L14.3792 5.14126C14.0234 5.49702 13.4466 5.49702 13.0908 5.14126C12.735 4.78549 12.735 4.20863 13.0908 3.85287L14.0761 2.86769C14.4319 2.51181 15.0087 2.51181 15.3645 2.86758ZM3.54177 14.0082C3.186 14.364 3.186 14.9408 3.54177 15.2966C3.89753 15.6523 4.47439 15.6523 4.83016 15.2966L5.81534 14.3113C6.1711 13.9555 6.1711 13.3787 5.81534 13.0229C5.45957 12.6672 4.88271 12.6672 4.52695 13.0229L3.54177 14.0082Z" 
                                                fill={`${isDarkTheme ? "rgba(var(--textColor1), 0.1)" : "rgba(var(--textColor1), 0.3)"}`}
                                            />
                                        </svg>                                                                                                                          
                                    </div>
                                    <div class="wide-theme-toggle__moon">
                                        <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <g filter="url(#filter0_d_2572_18359)">
                                                <path 
                                                    fill={`${isDarkTheme ? "url(#paint0_linear_2572_18359)" : "rgba(var(--textColor1), 0.3)"}`}
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
                                    <div class="wide-theme-toggle__highlighter"></div>
                                </div>
                            </button>
                        </div>
                    </li>
                    <li class="dropdown-menu__item">
                        <span class="dropdown-menu__item-text">
                            Sidebar
                        </span>
                        <div class="wide-bar__bar-options">
                            <button 
                                title="Pin bar to edge"
                                class="wide-bar__bar-option-btn"
                                on:click={_toggleFloatSideBar}
                            >
                                <i class="fa-solid fa-compress"></i>
                            </button>
                            <button 
                                title="Float side bar"
                                class="wide-bar__bar-option-btn"
                                on:click={_toggleFloatSideBar}
                            >
                                <i class="fa-solid fa-expand"></i>
                            </button>
                        </div>
                    </li>
                </ul>
            </BounceFade>
        </div>

        <!-- Tabs -->
        <div 
            class="wide-bar__tabs"
            class:wide-bar__tabs--dark-default={$themeState.title === "Dark Mode"}
            class:wide-bar__tabs--light-default={$themeState.title === "Light Mode"}
            class:wide-bar__tabs--simple-styling={$themeState.title !== "Light Mode"}
        >   
            <!-- Core Features -->

            <!-- Utilities -->
 
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/inputs.scss";

    $bar-width: 62px;

    .bar {
        height: 100%;
        left: 0px;
        display: flex;
        position: relative;

        &--ambience &__narrow-bar,
        &--ambient-solid &__narrow-bar {
            justify-content: center;
            padding: 0px 0px 0px 0px;
        }
        &--ambience &__divider {
            margin: 10px auto;
        }
        &--ambience &__icon-tabs {
            padding: 9px 0px 3px 0.5px;
            margin: 0px;
        }
        &--ambience &__icon-tab {
            border-radius: 25px;
            background-color: rgba(white, 0.025);
            margin-bottom: 6.5px;

            // background-color: rgba(white, 0);
            // margin-bottom: 4px;
        }
        &--ambience-clear &__icon-tabs {
            padding-bottom: 8px;
        }
        &--ambience-clear &__icon-tab {
            background-color: rgba(white, 0.04);
        }
        &--ambience-solid &__narrow-bar {
            padding: 0px 0px 2px 0px;
        }
        &--ambience-solid &__icon-tab {
            margin-bottom: 10px;
        }
        &--ambience &__icon-tab i {
            font-size: 1.4rem;
        }
        &--ambience &__temp-logo,
        &--ambience .narrow-theme-toggle,
        &--ambience-solid &__temp-logo,
        &--ambience-solid .narrow-theme-toggle {
            display: none
        }
        
        &--light-theme &__icon-tab-tool-tip {
            border: 1.5px solid rgba(var(--textColor1), 0.1);
            @include abs-top-left(4px, 44px);
            @include text-style(0.9, 500);
        }
        
        &__narrow-bar {
            // background-color: var(--navMenuBgColor);
            // box-shadow: var(--navMenuBoxShadow);
            // border-right: 1.5px solid rgba((var(--textColor1)), 0.022);
            @include flex(center, space-between);
            position: relative;
            flex-direction: column;
            padding: 8.5px 0px 12px 0px;
            text-align: center;
            z-index: 1;
            width: $bar-width;
            position: relative;
        }
        &__wide-bar {
            background-color: var(--wideLeftBarColor);
            box-shadow: var(--wideLeftBarBoxShadow);
            width: 100%;
            border-top: 0px solid;
            padding: 10px 0px 0px 0px;
            position: relative;
        }
        &__dashboard-container {
            height: calc(100% - 150.5px);
            width: 100%;
            padding: 11px 0px 0px 0px;
        }
        &__temp-logo {
            font-family: "Apercu";
            @include text-style(_, 500, 1.8rem);
            color: var(--navIconColor);
            position: relative;

            &:after {
                content: " ";
                @include abs-bottom-right(3.5px, -5px);
                @include circle(3px);
                background-color: #FFA8A0;
            }
        }
        &__divider {
            @include divider(0.1, 1px, 25px);
            margin: 15px auto;
        }
        &__icon-tabs {
            margin-top: 12px;
        }
        &__icon-tab-container {
            position: relative;

            &:last-child {
                margin-bottom: 0px !important;
            }
            &:hover .bar__icon-tab-tool-tip {
                @include visible;
            }
        }
        &__icon-tab {
            height: 38px;
            width: 38px;
            position: relative;
            font-size: 1rem;
            margin-bottom: 10px;
            border-radius: 16px;
            transition: 0.04s ease-in-out;
            background-color: var(--navIconBgColor);
            @include flex(center, center);
            
            &:active {
                transition: 0.1s ease-in-out;
                transform: scale(0.92);
            }
            i {
                font-size: 1.3rem;
                @include text-style(0.3);
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
        // dark default styling
        &__icon-tab {
            &--selected--dark-default#{&}--workspace {
                background-color: rgba(#A3C2FF, 0.045);
                i {
                    color: #A3C2FF;
                }
            }
            &--selected--dark-default#{&}--productivity {
                background-color: rgba(#949FFF, 0.045);
                i {
                    color: #949FFF;
                }
            }
            &--selected--dark-default#{&}--music {
                background-color: rgba(#949FFF, 0.045);
                i {
                    color: #949FFF;
                }
            }
            &--selected--dark-default#{&}--goals {
                background-color: rgba(#FFA3C4, 0.045);
                i {
                    color: #FFA3C4;
                }
            }
            &--selected--dark-default#{&}--youtube {
                background-color: rgba(#FFA3C4, 0.045);
                i {
                    color: #FFA3C4;
                }
            }
            &--selected--dark-default#{&}--habits {
                background-color: rgba(#FFCFA3, 0.045);
                i {
                    color: #FFCFA3;
                }
            }
            &--selected--dark-default#{&}--themes {
                background-color: rgba(#FFCFA3, 0.045);
                i {
                    color: #FFCFA3;
                }
            }
            &--selected--dark-default#{&}--routines {
                background-color: rgba(#C3F493, 0.045);
                i {
                    color: #C3F493;
                }
            }
        }
        &__icon-tab-tool-tip {
            position: absolute;
            z-index: 200;
            padding: 6px 14px;
            border-radius: 11px;
            transition: 0.08s ease-in-out;
            background-color: var(--bg-3);
            border: 1px solid rgba(var(--textColor1), 0.05);
            @include abs-top-left(4px, 44px);
            @include text-style(0.94, 400, 1.1rem, "DM Mono");
            @include not-visible;
        }
    }

    .wide-bar {
        background-color: var(--wideLeftBarColor);
        box-shadow: var(--wideLeftBarBoxShadow);
        border-top: 0px solid;
        padding: 11px 0px 0px 0px;
        position: relative;
        height: 100%;
        width: 0px !important;
        display: none !important;

        &--floating {
            width: 100%;
            border: none;
        }
        &--floating &__dashboard-container {
            max-height: 340px;
        }
        &--floating &__divider {
            margin: 16.5px 0px 6px 0px;
        }
        &--floating &__divider--first {
            margin: 12px 0px 7px 0px;
        }
        /* User Info */
        &__profile {
            position: relative;
            margin: 0px 0px 0px 13px;
            @include flex(flex-start);
            img {
                height: 31px;
                width: 31px;
                border-radius: 12px;
                object-fit: cover;
            }
        }
        &__profile-details {
            margin-left: 10.5px;
        }
        &__profile-name {
            @include text-style(1, 300, 1.18rem, "Apercu");
        }
        &__profile-stats {
            margin-top: 4px;
            @include flex(center);
            @include text-style(0.19, 500, 1rem, "DM Sans");

            i {
                font-size: 0.84rem;
                margin-right: 2px;
            }
        }
        &__habit-streak {
            margin-right: 9px;
        }

        /* Settings */
        &__settings-btn {
            @include abs-top-right(-4px, 10px);
            @include circle(19px);
            opacity: 0.2;

            &:active {
                transform: scale(0.94);
            }
            &:hover {
                opacity: 0.5;
                @include txt-color(0.08, "bg");
            }
        }
        &__settings-dropdown-container {
            @include abs-top-right(28px, -105px);
            width: 155px;
        }
        &__settings-dropdown {
        }
        &__bar-options {
            @include flex(center);
            margin-right: 8px;
        }
        &__bar-option-btn {
            opacity: 0.2;
            font-size: 1rem;
            
            &--selected {
                opacity: 0.5;
                pointer-events: none;
            }
            &:hover {
                opacity: 0.5;
            }
            &:first-child {
                margin-right: 12px;
            }
        }

        .dropdown-menu {
            padding-bottom: 5px;
            &__item {
                padding-bottom: 2px;
            }
            &__option-btn {
                padding: 5px 7px 6px 7px;
            }
            &__section-divider {
                margin: 6px 0px 6px 5px;
            }
            #appearance-optn {
                padding-top: 0px;
                margin-top: -3px;
            }
            span {
                font-size: 1.15rem;
            }
        }

        /* Tabs */
        &__tabs {
            margin-bottom: 0px;
            padding-left: 8px;

            &--light-default {
                .wide-bar__tab-btn--workspace {
                    background-color: #F5F9FF !important;
                }
                .wide-bar__tab-btn--productivity {
                    background-color: #F3F5FF !important;
                }
                .wide-bar__tab-btn--goals {
                    background-color: #F6F2FF !important;
                }
                .wide-bar__tab-btn--habits {
                    background-color: #FFF2FB !important;
                }
                .wide-bar__tab-btn--routines {
                    background-color: #fff4f7 !important;
                }
            }
        }
        &__tab-btn {
            @include flex(center);
            padding: 4.5px 8px 4.5px 8px;
            width: calc(100% - 27px);
            border-radius: 10.5px;
            margin-bottom: 1.5px;
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
                border: 0.5px solid rgba(var(--textColor1), 0.03);
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

            &-icon {
                margin-right: 13px;
                width: 10px;
                height: 10px;
                opacity: 0.25;
                @include center;
                @include text-style(1, _, 1rem);
            }
            span {
                @include text-style(1, 400, 1.2rem);
                opacity: 0.4;
            }
        }
        &__section-title {
            @include text-style(0.18, 500, 1rem);
            margin: 12px 0px 7px 8px;
            display: block;
        }
        &__divider {
            margin: 17px 0px 6px 0px;
            @include divider(0.07, 0.5px, 100%);
            
            &--first {
                margin: 13px 0px 10px 0px;
            }
        }
        &__below-tabs {
            display: flex;
            flex-direction: column;
            height: calc(100% - 200px);
            padding-bottom: 2px;
        }
        &__dashboard-container {
        }
        &__settings {
            @include flex(center, space-between);
        }
    }

    .wide-theme-toggle {
        width: 42px;
        height: 17px;
        border-radius: 20px;
        transition: 0.12s ease-in-out;
        outline: none;
        border: var(--borderVal2);
        background-color: rgba(var(--textColor1), 0.02);
        border: 2px solid rgba(var(--textColor1), 0);
        padding: 0px 0px 0px 1px;
        margin-top: 5px;

        &:active {
            transform: scale(0.97);
        }
        
        &--light &__highlighter {
            @include abs-bottom-right(1px, 24.5px);
        }
        &--dark &__highlighter {
            @include abs-bottom-right(1px, 1px);
        }
        &__container {
            position: relative;
            width: 100%;
            height: 100%;
            @include flex(center);
            padding: 0px 0px 0px 0px;
        }
        &__sun {
            z-index: 100;
            transform: scale(0.68);
            margin-top: 1px;
        }
        &__moon {
            transform: scale(0.68);
            margin: 2px 0px 0px 0px;
            z-index: 2;
            @include abs-bottom-right(-12px, -10px);
        }
        &__highlighter {
            transition: 0.1s cubic-bezier(.16,.86,.57,.84);
            @include circle(16px);
            position: absolute;
            z-index: -1;
            background-color: rgba(var(--textColor1), 0.07);
        }
    }

    .narrow-theme-toggle {
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
            @include abs-bottom-left(calc(100% - (3px + 33px)), calc(50% - 16.5px));
        }
        &--dark &__highlighter {
            background-color: var(--highlighterToggleBtnBgColor);
            @include abs-bottom-left(calc(0% + 3px), calc(50% - 16.5px));
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