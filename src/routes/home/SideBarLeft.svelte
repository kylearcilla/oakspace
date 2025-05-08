<script lang="ts">
	import { page } from "$app/stores"
    import { goto } from "$app/navigation"
	import { globalContext, themeState } from "$lib/store"

    import { ModalType } from "$lib/enums"
	import { getActiveTheme } from "$lib/utils-appearance"
    import { getThemeStyling } from "$lib/utils-appearance"
	import { getHomeUrlPath, openModal } from "$lib/utils-home"
	import { capitalize, clickOutside, randomArrayElem } from "$lib/utils-general"
    
	import BounceFade from "$components/BounceFade.svelte"

    const TABS = [
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
        "🌿", "🌙", "🌷", "🌱", "⛰️", "🌊", "🍉", "🌳", "🔖"
    ]

    let helpOpen = false
    let lightColor = ""
    let selectColor = TABS[0].rgb
    let selectedTabName = TABS[0].name
    
    let defFgColor = ""
    let defBgColor = ""
    let flavoredColors = false
    let activeTheme = getActiveTheme()
    
    $: isDarkTheme = $themeState.isDarkTheme
    $: open = $globalContext.leftBarOpen
    $: user = $globalContext.user
    $: updateSelectTab($page.url.pathname)

    $: if (activeTheme != "dark") {
        defFgColor = getThemeStyling("navBtnColor")
        defBgColor = getThemeStyling("navBtnBgColor")
        flavoredColors = true
    }
    else {
        flavoredColors = false
    }
    $: if (!open) {
        helpOpen = false
    }

    themeState.subscribe(_ => activeTheme = getActiveTheme())

    function onTabBtnMouseOver(tabIdx: number) {
        lightColor = TABS[tabIdx].rgb
    }
    function handleTabBtnClicked(tabStr: string, tabIdx: number) {
        selectColor = tabIdx >= 4 ? selectColor : TABS[tabIdx].rgb
        selectedTabName = tabIdx >= 4 ? selectedTabName : tabStr
        
        selectTabBtn(tabStr)
    }
    function selectTabBtn(tabStr: string) {
        const option = tabStr.toLowerCase()

        console.log(option)
        
        if (option === "themes") {
            openModal(ModalType.Themes)
        }
        else if (option === "settings") {
            openModal(ModalType.Settings)
        }
        else if (option === "help") {
            helpOpen = !helpOpen
        }
        else if (option === "upgrade") {
            // openModal(ModalType.Upgrade)
        }
    }
    function updateSelectTab(path: string) {
        selectedTabName = getHomeUrlPath(path)
        selectedTabName = capitalize(selectedTabName)

        const tab = TABS.find((tab) => tab.name === selectedTabName)
        if (!tab) return

        selectColor = tab.rgb
    }
    function settingsSelect(optn: string) {
        if (optn === "shortcuts") {
            openModal(ModalType.Shortcuts)
        }
        else if (optn === "bugs") {
            // openModal(ModalType.Shortcuts)
        }
        else if (optn === "email") {
            // openModal(ModalType.Shortcuts)
        }
        else if (optn === "blog") {
            // openModal(ModalType.Shortcuts)
        }
        else if (optn === "landing-page") {
            // openModal(ModalType.Shortcuts)
        }

        helpOpen = false
    }
    function getTabHref(option: string) {
        switch(option) {
            case "home": return "/home"
            case "goals": return "/home/goals"
            case "habits": return "/home/habits" 
            case "routines": return "/home/routines"
            case "workspace": return "/home/space"
            default: return null
        }
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
        <div class="bar__profile">
            <img src={user.profileImg} alt="">
            <div class="bar__profile-details">
                <div class="bar__profile-name">
                    {user.name}
                </div>
            </div>
        </div>
    
        <div class="bar__tabs">
            {#each TABS as tab, tabIdx}
                {@const  { name, icon } = tab}
                
                {#if name === "Home"}
                    <div class="bar__tab-section">
                        Menu
                    </div>
                {/if}
                {#if name === "Workspace"}
                    <div class="bar__tab-section" style:margin="10px 0px 6px 7px">
                        Appearance
                    </div>
                {/if}
                <div style:width="100%">
                    <a 
                        href={getTabHref(name.toLowerCase())}
                        class="bar__tab-btn"
                        class:bar__tab-btn--selected={name === selectedTabName}
                        style:width="calc(100% - 9px)"
                        on:click={() => {
                            handleTabBtnClicked(name, tabIdx)
                        }}
                        on:pointerenter={() => {
                            onTabBtnMouseOver(tabIdx)
                        }}
                    >
                        <i class={`${icon} bar__tab-btn-icon`}></i>
                        <span>{name}</span>
                    </a>
                </div>
            {/each}
        </div>
    </div>

    <div>
        <div class="bar__tabs">
            {#each bottomTabs as tab, tabIdx}
                {@const { name, icon } = tab}
                <div style:width="100%">
                    <button 
                        data-dmenu-id={name === "Help" ? "left-bar" : ""}
                        class="bar__tab-btn"
                        class:bar__tab-btn--selected={name === selectedTabName}
                        on:click={() => {
                            selectTabBtn(name.toLowerCase())
                        }}
                        on:pointerenter={() => {
                            lightColor = bottomTabs[tabIdx].rgb
                        }}
                    >
                        <i class={`${icon} bar__tab-btn-icon`}></i>
                        <span>
                            {name === "Upgrade" ? "Get Premium" : name}
                        </span>
                    </button>
                </div>
            {/each}
        </div>

        <div class="bar__app">
            <div class="bar__divider"></div>
            <div class="bar__app-container">
                <div class="bar__app-name">
                    <div style:font-size={"1.25rem"} style:margin-left="4px">
                        🔖
                    </div>
                    
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <a href="/home">
                        oakspace
                    </a>
                </div>
                <button
                    on:click={() => openModal(ModalType.Quote)}
                    title="Get inspired with a wise thought."
                    class="bar__quote-btn"
                >
                     <span>
                         {randomArrayElem(QUOTE_EMOJI_ICONS)}
                     </span>
                </button>
            </div>
        </div>
    </div>

    <BounceFade 
        isHidden={!helpOpen}
        zIndex={200}
        position={{ 
            bottom: "60px", right: "-40px" 
        }}
    >
        <div 
            id="left-bar-menu"
            data-dmenu-id="left-bar"
            class="day-settings dmenu" 
            class:dmenu--light={!isDarkTheme}
            style:--font-size="1.3rem"
            use:clickOutside on:outClick={() => helpOpen = false} 
        >
            <div class="dmenu__option">
                <button 
                    class="dmenu__option-btn"
                    on:click={() => settingsSelect("shortcuts")}
                >
                    <span class="dmenu__option-text">
                        Shortcuts
                    </span>
                    <div class="dmenu__option-icon">
                        <i class="fa-solid fa-keyboard"></i>
                    </div>
                </button>
            </div>
            <div class="dmenu__section-divider"></div>
            <div class="dmenu__option">
                <button 
                    class="dmenu__option-btn"
                    on:click={() => settingsSelect("bugs")}
                >
                    <span class="dmenu__option-text">
                        Report A Bug
                    </span>
                    <div class="dmenu__option-icon">
                        <i class="fa-solid fa-bug"></i>
                    </div>
                </button>
            </div>
            <div class="dmenu__option">
                <button 
                    class="dmenu__option-btn"
                    on:click={() => settingsSelect("email")}
                >
                    <span class="dmenu__option-text">
                        Email Us
                    </span>
                    <div class="dmenu__option-icon">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                </button>
            </div>
            <div class="dmenu__section-divider"></div>
            <div class="dmenu__option">
                <button 
                    class="dmenu__option-btn"
                    on:click={() => settingsSelect("blog")}
                >
                    <span class="dmenu__option-text">
                        Blog
                    </span>
                </button>
            </div>
            <div class="dmenu__option">
                <button 
                    class="dmenu__option-btn"
                    on:click={() => settingsSelect("landing-page")}
                >
                    <span class="dmenu__option-text">
                        Landing Page
                    </span>
                </button>
            </div>
            <div class="dmenu__section-divider"></div>
            <div 
                class="dmenu__section-name" 
                style:font-family={"Geist Mono"}
                style:margin-top="6px"
            >
                oakspace v1.0.0
            </div>
        </div>
    </BounceFade>
</div>

<style lang="scss">
    @use "../../scss/dropdown.scss" as *;
    @use "../../scss/inputs.scss" as *;

    $bar-width: 62px;

    .bar {
        position: relative;
        border-top: 0px solid;
        padding: 3px 0px 10px 0px;
        position: relative;
        height: 100%;
        @include flex-col();

        --quote-btn-opacity: 0.05;

        &--light {
            --quote-btn-opacity: 0.05;
        }
        &--light &__tab-section {
            @include text-style(0.4);
        }
        &--light &__tab-btn {
            &-icon {
                opacity: 0.3;
            }
            span {
                opacity: 0.85;
            }
        }
        a {
            text-decoration: unset;
        }
        &__divider {
            margin: 15px auto;
        }
        &__profile {
            position: relative;
            margin: 10px 0px 12px 14px;
            width: 100%;
            @include flex(center);
            
            img {
                @include circle(20px);
                object-fit: cover;
            }
        }
        &__profile-details {
            margin-left: 10.5px;
            width: 100%;
        }
        &__profile-name {
            @include text-style(0.9, var(--fw-400-500), 1.3rem);
            @include elipses-overflow;
            max-width: 80%;
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
            order: 0.5px solid transparent;
            transition: 0s;
            order: 2px solid transparent;
        
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
                margin-left: 14px;
                @include text-style(0.8, var(--fw-400-500), 1.35rem);
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
            margin: 6px 0px 7px 0px;
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

            a {
                margin-left: 7px;
                display: inline-block;
            }
            a:hover {
                text-decoration: underline;
                cursor: pointer;
            }
        }
        &__quote-btn {
            background-color: rgba(var(--textColor1), var(--quote-btn-opacity));
            @include circle(23px);
            @include center;
            font-size: 1.1rem;
            transition-duration: 0.1s;
            
            &:hover {
                background-color: rgba(var(--textColor1), calc(var(--quote-btn-opacity) + 0.05));
            }
        }
    }
    .dmenu {
        width: 140px;
    }
</style>    