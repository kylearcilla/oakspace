<script lang="ts">
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"

	import { themeState } from "$lib/store"
    import { LogoIcon, ModalType } from "$lib/enums"
    import { getThemeStyling } from "$lib/utils-appearance"
	import { getHomeUrlPath, openModal } from "$lib/utils-home"
	import { capitalize, randomArrayElem } from "$lib/utils-general"
    
	import { page } from "$app/stores";
	import Logo from "../../components/Logo.svelte"
	import BounceFade from "../../components/BounceFade.svelte"
	import { getActiveTheme } from "../../lib/utils-appearance";
	import { toast } from "../../lib/utils-toast";

    const tabs = [
        { name: "Home", icon: "fa-solid fa-house", rgb: "178, 204, 255" }, 
        { name: "Goals", icon: "fa-solid fa-bullseye", rgb: "255, 185, 185" },     
        { name: "Habits", icon: "fa-solid fa-cubes-stacked", rgb: "226, 190, 255" }, 
        { name: "Routines", icon: "fa-solid fa-spa", rgb: "241, 251, 180" },       
        { name: "Workspace", icon: "fa-solid fa-ruler-combined", rgb: "251, 180, 180" },
        { name: "Themes", icon: "fa-solid fa-swatchbook", rgb: "255, 210, 184" },
    ]
    const bottomTabs = [
        { name: "Settings", icon: "fa-solid fa-gear", rgb: "190, 190, 190" },
        { name: "Help", icon: "fa-solid fa-circle-question", rgb: "190, 190, 190" }, 
        { name: "Upgrade", icon: "fa-solid fa-bolt", rgb: "255, 226, 153" }
    ]
    const QUOTE_EMOJI_ICONS = [
        "🌿", "🌙", "🌷", "🌱", "⛰️", "🪴", "🌊", "🍉", "🌳", "🐛"
    ]

    let settingsOpen = false
    let lightColor = ""
    let selectColor = tabs[0].rgb
    let selectedTabName = tabs[0].name
    
    let defFgColor = ""
    let defBgColor = ""
    let flavoredColors = false
    let activeTheme = getActiveTheme()
    
    $: isDarkTheme = $themeState.isDarkTheme
    $: updateSelectTab($page.url.pathname)

    $: if (activeTheme != "dark") {
        defFgColor = getThemeStyling("navBtnColor")
        defBgColor = getThemeStyling("navBtnBgColor")

        flavoredColors = true
    }
    else {
        flavoredColors = false
    }

    themeState.subscribe(_ => activeTheme = getActiveTheme())

    function onTabBtnMouseOver(tabIdx: number) {
        lightColor = tabs[tabIdx].rgb
    }
    function handleTabBtnClicked(tabStr: string, tabIdx: number) {
        selectColor = tabIdx >= 4 ? selectColor : tabs[tabIdx].rgb
        selectedTabName = tabIdx >= 4 ? selectedTabName : tabStr
        
        selectTabBtn(tabStr)
    }
    function selectTabBtn(tabStr: string) {
        const option = tabStr.toLowerCase()
        
        if (option === "home") {
            goto("/home")
        }
        else if (option === "goals") {
            toast("default", {
                icon: LogoIcon.GoogleCal,
                message: "some people want it all but i dont want nothing at all if it aint you baby if i aint got you baby some people want",
                action: {
                    label: "Undo",
                    onClick: () => console.log("xx")
                }
            })
            // goto("/home/goals")
        }
        else if (option === "habits") {

        }
        else if (option === "routines") {
            goto("/home/routines")
        }
        else if (option === "workspace") {
            goto("/home/space")
        }
        else if (option === "themes") {
            openModal(ModalType.Themes)
        }
    }

    function _toggleFloatSideBar() {
        settingsOpen = false
    }

    function updateSelectTab(path: string) {
        selectedTabName = getHomeUrlPath(path)
        selectedTabName = capitalize(selectedTabName)

        const tab = tabs.find((tab) => tab.name === selectedTabName)
        if (!tab) return

        selectColor = tab.rgb
    }
</script>

<div 
    class="bar"
    class:bar--dark-theme={isDarkTheme}
    class:bar--light={!isDarkTheme}
    style:--hover-fg-color={`${flavoredColors ? defFgColor : `rgba(${lightColor}, 1)`}`}
    style:--hover-bg-color={`${flavoredColors ? defBgColor : `rgba(${lightColor}, 0.045)`}`}
    style:--select-fg-color={`${flavoredColors ? defFgColor : `rgba(${selectColor}, 1)`}`}
    style:--select-bg-color={`${flavoredColors ? defBgColor : `rgba(${selectColor}, 0.045)`}`}
>

    <div>
        <!-- Profile Section -->
        <div class="bar__profile">
            <img src="https://i.pinimg.com/474x/87/7a/f8/877af84ee302075f969be04f809a0e5f.jpg" alt="">
            <div class="bar__profile-details">
                <span class="bar__profile-name">
                    Kyle Arcilla
                </span>
            </div>
        </div>
    
        <!-- top -->
        <div class="bar__tabs">
            {#each tabs as tab, tabIdx}
                {@const  { name, icon } = tab}
                
                {#if name === "Home"}
                    <div class="bar__tab-section">
                        Menu
                    </div>
                {/if}
                {#if name === "Workspace"}
                    <div 
                        class="bar__tab-section"
                        style:margin={"10px 0px 6px 7px"}
                    >
                        Appearance
                    </div>
                {/if}
                <div class="bar__icon-tab-container">
                    <button 
                        class="bar__tab-btn"
                        class:bar__tab-btn--selected={name === selectedTabName}
                        on:click={(e) => handleTabBtnClicked(name, tabIdx)}
                        on:mouseenter={() => onTabBtnMouseOver(tabIdx)}
                    >
                        <i class={`${icon} bar__tab-btn-icon`}></i>
                        <span>
                            {name}
                        </span>
                    </button>
                </div>
            {/each}
        </div>
    </div>

    <!-- bottom -->
    <div>
        <div class="bar__tabs">
            {#each bottomTabs as tab, tabIdx}
                {@const { name, icon } = tab}
    
                <div class="bar__icon-tab-container">
                    <button 
                        class="bar__tab-btn"
                        class:bar__tab-btn--selected={name === selectedTabName}
                        on:click={() => selectTabBtn(name.toLowerCase())}
                        on:mouseenter={() => {
                            lightColor = bottomTabs[tabIdx].rgb
                        }}
                    >
                        <i class={`${icon} bar__tab-btn-icon`}></i>
                        <span>
                            {name}
                        </span>
                    </button>
                </div>
            {/each}
        </div>


        <!-- App -->
        <div class="bar__app">
            <div class="bar__divider"></div>
            <div class="bar__app-container">
                <div class="bar__app-name">
                    <div class="bar__app-name-icon">
                        <Logo 
                            logo={LogoIcon.Somara}
                            options={{ scale: 1.1 }}
                        />
                    </div>
                    <span>
                        Somara
                    </span>
                </div>
                <button
                    on:click={() => openModal(ModalType.Quote)}
                    title="Get inspired with a wise thought."
                    class="bar__quote-btn"
                >
                    <!-- 1.0.0 -->
                     <span>
                         {randomArrayElem(QUOTE_EMOJI_ICONS)}
                     </span>
                </button>
            </div>
        </div>
    </div>


    <!-- dropdown -->
    <div class="bar__settings-dropdown-container">
        <BounceFade
            id="left-bar--dmenu"
            isHidden={!settingsOpen}
            onClickOutside={() => settingsOpen = false}
        >
            <ul 
                class="bar__settings-dropdown dmenu"
                class:dmenu--dark={isDarkTheme}
            >
                <li class="dmenu__option">
                    <button class="dmenu__option-btn" on:click={() => openModal(ModalType.Shortcuts)}>
                        <span class="dmenu__option-text">
                            Settings
                        </span>
                    </button>
                </li>
                <li class="dmenu__option">
                    <button class="dmenu__option-btn" >
                        <span class="dmenu__option-text">
                            Daily Wisdom
                        </span>
                    </button>
                </li>
                <li class="dmenu__option">
                    <button class="dmenu__option-btn" on:click={() => openModal(ModalType.Shortcuts)}>
                        <span class="dmenu__option-text">
                            Shortcuts
                        </span>
                    </button>
                </li>
                <li class="dmenu__section-divider"></li>
                <li class="dmenu__item">
                    <span class="dmenu__item-text">
                        Sidebar
                    </span>
                    <div class="bar__bar-options">
                        <button 
                            title="Pin bar to edge"
                            class="bar__bar-option-btn"
                            on:click={_toggleFloatSideBar}
                        >
                            <i class="fa-solid fa-compress"></i>
                        </button>
                        <button 
                            title="Float side bar"
                            class="bar__bar-option-btn"
                            on:click={_toggleFloatSideBar}
                        >
                            <i class="fa-solid fa-expand"></i>
                        </button>
                    </div>
                </li>
            </ul>
        </BounceFade>
    </div>
</div>

<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/inputs.scss";

    $bar-width: 62px;

    .bar {
        left: 0px;
        position: relative;
        border-top: 0px solid;
        padding: 3px 0px 10px 0px;
        position: relative;
        height: 100%;
        width: 100%;
        @include flex-col();

        /* light */
        &--light &__tab-btn {
            &-icon {
                opacity: 0.3;
            }
            span {
                opacity: 0.85;
            }
        }
        &--light &__profile-name {
            @include text-style(0.8);
        }
        &--light &__tab-section {
            @include text-style(0.4);
        }
        &--light &__app-name {
            font-weight: 500;
        }
        &--light &__quote-btn {
            background-color: rgba(var(--textColor1), 0.1);
            opacity: 1;
        }      

        &__divider {
            margin: 15px auto;
        }

        &__profile {
            position: relative;
            margin: 10px 0px 12px 14px;
            @include flex(center);

            img {
                @include circle(20px);
                object-fit: cover;
            }
        }
        &__profile-details {
            margin-left: 10.5px;
        }
        &__profile-name {
            @include text-style(0.9, var(--fw-400-500), 1.3rem);
        }

        &__settings-dropdown-container {
            @include abs-top-right(28px, -105px);
            width: 155px;
        }
        &__bar-options {
            @include flex(center);
            margin-right: 8px;
        }
        &__bar-option-btn {
            opacity: 0.2;
            font-size: 1rem;
        }
        &__tab-section {
            @include text-style(0.15, var(--fw-400-500), 1.1rem);
            margin: 0px 0px 2px 7px;
        }
        &__tabs {
            margin: 5px 0px 0px 0px;
            padding-left: 8px;
        }
        &__tab-btn {
            @include flex(center);
            padding: 6px 8px 6px 9px;
            width: calc(100% - 27px);
            border-radius: 6px;
            margin-bottom: 2px;
            border: 0.5px solid transparent;
            transition: 0s;
            border: 2px solid transparent;
        
            &:hover {
                background-color: var(--hover-bg-color) !important;
            }
            &:hover &-icon, &:hover span {
                color: var(--hover-fg-color) !important;
                opacity: 0.7 !important;
            }
            &--selected {
                background-color: var(--select-bg-color) !important;
            }
            &--selected &-icon, 
            &--selected span {
                color: var(--select-fg-color) !important;
                opacity: 0.7 !important;
            }
            &:active {
                transform: scale(0.99);
            }

            &-icon {
                width: 10px;
                height: 10px;
                opacity: 0.2;
                @include center;
                @include text-style(1, _, 1.2rem);
            }
            span {
                opacity: 0.45;
                margin-left: 17px;
                @include text-style(0.8, var(--fw-400-500), 1.3rem);
            }
        }
        &__section-title {
            @include text-style(0.18, var(--fw-500-600), 1rem);
            margin: 12px 0px 7px 8px;
            display: block;
        }
        &__divider {
            width: 100%;
            border-top: var(--side-border);
            margin: 13px 0px 7px 0px;
        }
        &__settings {
            @include flex(center, space-between);
        }
        &__app {
            width: 100%;
        }
        &__app-container {
            margin: 6px 11px 0px 10px;
            @include flex(center, space-between);
        }
        &__app-name {
            @include flex(center);
            @include text-style(1, var(--fw-400-500), 1.35rem, "Geist Mono");
            margin-top: -2px;

            span {
                margin-left: 6px;
            }
        }
        &__quote-btn {
            background-color: rgba(var(--textColor1), 0.1);
            @include circle(25px);
            @include center;
            opacity: 0.5;
            font-size: 1.2rem;
            
            &:hover {
                opacity: 1;
            }
        }

        .dmenu {
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
    }
</style>    