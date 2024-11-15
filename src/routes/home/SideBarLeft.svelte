<script lang="ts">
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"

	import { getHomeUrlPath, openModal } from "$lib/utils-home"
	import { capitalize, randomArrayElem } from "$lib/utils-general"
    import { LogoIcon, ModalType } from "$lib/enums"
	import { globalContext, themeState } from "$lib/store"
    import { getThemeStyling } from "$lib/utils-appearance"
    
	import Logo from "../../components/Logo.svelte"
	import BounceFade from "../../components/BounceFade.svelte"
	import { page } from "$app/stores";

    const tabs = [
        { name: "Home", icon: "fa-solid fa-house", rgb: "178, 204, 255" }, 
        { name: "Goals", icon: "fa-solid fa-bullseye", rgb: "255, 185, 185" },     
        { name: "Habits", icon: "fa-solid fa-cubes-stacked", rgb: "226, 190, 255" }, 
        { name: "Routines", icon: "fa-solid fa-spa", rgb: "241, 251, 180" },       
        { name: "Appearance", icon: "fa-solid fa-brush", rgb: "255, 210, 184" },
        { name: "Music", icon: "fa-solid fa-record-vinyl", rgb: "148, 159, 255" }, 
        { name: "Youtube", icon: "fa-brands fa-youtube", rgb: "251, 180, 180" }
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
    let useDef = false
    
    $: ambience = $globalContext.ambience
    $: isDarkTheme = $themeState.isDarkTheme
    $: min = $globalContext.leftBar === "min"

    $: {
        updateSelectTab($page.url.pathname)
    }
    $: if ($themeState) {

        defFgColor = getThemeStyling("navBtnColor")
        defBgColor = getThemeStyling("navBtnBgColor")

        useDef = $themeState.title != "Dark" 
  }


    /* Event Listeners */
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
        else if (option === "appearance") {
            openModal(ModalType.Appearance)
        }
        else if (option === "music") {
            openModal(ModalType.Music)   
        }
        else if (option === "youtube") {
            openModal(ModalType.Youtube)   
        }
    }

    /* Util Buttons */
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

    onMount(() => {

    })
</script>

<div 
    class="bar"
    class:bar--dark-theme={isDarkTheme}
    class:bar--light={!isDarkTheme}
    class:bar--ambience={ambience?.styling === "blur" || ambience?.styling === "clear"}
    class:bar--ambience-solid={ambience?.styling === "solid"}
    class:bar--ambience-clear={ambience?.styling === "clear"}
    class:bar--min={min}
    style:--hover-fg-color={`${useDef ? defFgColor : `rgba(${lightColor}, 1)`}`}
    style:--hover-bg-color={`${useDef ? defBgColor : `rgba(${lightColor}, 0.045)`}`}
    style:--select-fg-color={`${useDef ? defFgColor : `rgba(${selectColor}, 1)`}`}
    style:--select-bg-color={`${useDef ? defBgColor : `rgba(${selectColor}, 0.045)`}`}
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
    
        <!-- Tabs -->
        <div class="bar__tabs">
            {#each tabs as tab, tabIdx}
                {@const name = tab.name}
                {@const icon = tab.icon}
                
                {#if name === "Home"}
                    <div class="bar__tab-section">
                        Menu
                    </div>
                {/if}
                {#if name === "Appearance"}
                    {#if min}
                        <div class="bar__divider bar__divider--tabs">
                        </div>
                    {/if}
                    <div class="bar__tab-section bar__tab-section--utils">
                        Utility
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
                        <span>{name}</span>
                    </button>
                </div>
            {/each}
        </div>
    </div>

    <div>
        <div class="bar__tabs">
            {#each bottomTabs as tab, tabIdx}
                {@const name = tab.name}
                {@const icon = tab.icon}
                
                {#if name === "Home"}
                    <div class="bar__tab-section">
                        Menu
                    </div>
                {/if}
                {#if name === "Appearance"}
                    <div class="bar__tab-section bar__tab-section--utils">
                        Utility
                    </div>
                {/if}
    
                <div class="bar__icon-tab-container">
                    <button 
                        class="bar__tab-btn"
                        class:bar__tab-btn--selected={name === selectedTabName}
                        on:click={(e) => selectTabBtn(name.toLowerCase())}
                        on:mouseenter={() => {
                            lightColor = bottomTabs[tabIdx].rgb
                        }}
                    >
                        <i class={`${icon} bar__tab-btn-icon`}></i>
                        <span>{name}</span>
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
                        {#key min}
                            <Logo 
                                logo={LogoIcon.Somara}
                                options={{ scale: min ? 1.6 : 1.1 }}
                            />
                        {/key}
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


    <!-- Settings Dropdown -->
    <div class="bar__settings-dropdown-container">
        <BounceFade
            id="left-bar--dmenu"
            styling={{ }}
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
                opacity: 0.7;
                font-weight: 600;
            }
        }
        &--light &__profile-name {
            @include text-style(0.8, 500);
        }
        &--light &__tab-section {
            @include text-style(0.4, 700);
        }
        &--light &__app-name {
            font-weight: 500;
        }
        &--light &__quote-btn {
            background-color: rgba(var(--textColor1), 0.04);
            opacity: 1;
        }

        /* appearance */
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

        /* left bar width */
        &--min {
            align-items: center;
        }
        &--min &__tabs {
            padding: 0px;
        }
        &--min &__divider {
            width: 28px !important;
            margin-left: auto;
            margin-right: auto;
        }
        &--min &__profile {
            margin: 10px 0px 14px 0px;
            @include center;

            img {
                @include circle(23px);
            }
        }
        &--min &__profile-details,
        &--min &__tab-section {
            display: none;
        }
        &--min &__app-container {
            flex-direction: column-reverse;
            margin: 0px;
        }
        &--min &__app-name {
            &-icon {
                margin-bottom: 5px;
            }
            span {
                display: none;
            }
        }
        &--min &__quote-btn {
            margin: 6px 0px 13px 0px;
            @include circle(34px);
            font-size: 1.4rem;

            &:hover {
                background-color: rgba(var(--textColor1), 0.0185);
            }
        }
        &--min &__tab-btn {
            @include circle(38px);
            position: relative;
            font-size: 1rem;
            margin-bottom: 11px;
            padding: 0px;
            background-color: var(--minNavBtnBgColor);
            @include center;

            span {
                display: none;
                opacity: 1;
            }
            i {
                opacity: 0.9;
                font-size: 1.3rem;
                @include text-style(0.45);
            }
        }
        &--min &__tab-btn--selected {
            border: 2px solid rgba(var(--textColor1), 0.05);
        }        

        &__divider {
            @include divider(0.1, 1px, 25px);
            border-top: var(--navMenuBorder);
            margin: 15px auto;

            &--tabs {
                margin: 15px auto 15px auto;
            }
        }

        /* User Info */
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
            @include text-style(0.9, 400, 1.3rem, "Apercu");
        }

        /* Settings */
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

        /* Tabs */
        &__tab-section {
            @include text-style(0.2, 500, 1rem);
            margin: 0px 0px 7px 7px;

            &--utils {
                margin: 15px 0px 6px 7px;
            }
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
                @include text-style(0.8, 500, 1.3rem);
            }
        }
        &__section-title {
            @include text-style(0.18, 500, 1rem);
            margin: 12px 0px 7px 8px;
            display: block;
        }
        &__divider {
            width: 100%;
            @include divider(0.05, 1px);
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
            @include text-style(1, 400, 1.35rem, "DM Mono");
            margin-top: -2px;

            span {
                margin-left: 6px;
            }
        }
        &__quote-btn {
            background-color: rgba(var(--textColor1), 0.05);
            @include circle(25px);
            @include center;
            opacity: 0.5;
            font-size: 1.2rem;
            
            &:hover {
                opacity: 1;
                // transition: 0s ease-in-out;
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