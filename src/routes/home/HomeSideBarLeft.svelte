<script lang="ts">
    import { lightColorThemes, darkColorThemes, defaultThemes } from "$lib/data-themes";
	import { setRootColors } from "$lib/utils-general";
	import { colorThemeState, musicPlayerStore } from "$lib/store"

    enum Modal { Settings, Youtube, Music, Stats, Appearance }
    export let onNavButtonClicked: (modal: Modal | null) => void

    let isMusicPlayerActive = false

    let currentTheme: ThemeState = { 
        title: "Dark Mode", 
        isDarkTheme: true, 
        themeToggleBtnIconColor: "#3F3F3F",
        sectionTitle: "default",
        headerTimeColor: "",
        twinTheme: {
            sectionName: "defaultThemes",
            index: 1
        }
    }

    musicPlayerStore.subscribe((data: any) => {
        isMusicPlayerActive = data != null && data.doShowPlayer
    })
    colorThemeState.subscribe((data) => {
        if (currentTheme.title === data.title) return
        currentTheme = {
            title: data.title,
            isDarkTheme: data.isDarkTheme,
            themeToggleBtnIconColor: data.themeToggleBtnIconColor,
            sectionTitle: data.sectionTitle,
            headerTimeColor: data.headerTimeColor,
            twinTheme: data.twinTheme
        }
    })

    const handleNavButtonClicked = (btnName: string) => {
        if (btnName === "stats") {
            onNavButtonClicked(Modal.Stats)
        }
        else if (btnName === "youtube") {
            onNavButtonClicked(Modal.Youtube)
        }
        else if (btnName === "music") {
            onNavButtonClicked(Modal.Music)
        }
        else if (btnName === "settings") {
            onNavButtonClicked(Modal.Settings)
        }
        else if (btnName === "appearance") {
            onNavButtonClicked(Modal.Appearance)
        }
    }
    
    const handleToggleThemeMode = () => {
        const themeSections: any = {
            defaultThemes: defaultThemes,
            lightColorThemes: lightColorThemes,
            darkColorThemes: darkColorThemes,
        };

        let selectedTheme = themeSections[currentTheme!.twinTheme!.sectionName][currentTheme!.twinTheme!.index]
        setRootColors(selectedTheme!.properties)
        localStorage.setItem("theme", JSON.stringify(selectedTheme))

        colorThemeState.set({
            title: selectedTheme!.title,
            isDarkTheme: selectedTheme!.properties.isDark,
            themeToggleBtnIconColor: selectedTheme!.properties.iconToggleBtnBgColor,
            sectionTitle: selectedTheme.sectionDetails.title,
            twinTheme: selectedTheme!.twinTheme,
            headerTimeColor: selectedTheme!.twinTheme
        })
    }
</script>

<div class="nav-menu">
    <div class="divider"></div>
    <div class="divider"></div>
    <div class={`nav-menu__tabs ${currentTheme.isDarkTheme ? "nav-menu__tabs--dark-theme" : ""} nav-menu__tabs--${currentTheme.title === "Dark Mode" ? "dark-mode" : (currentTheme.title === "Light Mode" ? "light-mode" : "simple-styling")}`}>
        <button on:click={() => handleNavButtonClicked("stats")} class="nav-menu-tab nav-menu-tab--stats tool-tip-container">
            <!-- <span class="tool-tip-text tool-tip-text--left">Stats</span> -->
            <i class="fa-solid fa-chart-line nav-menu-tab__icon"></i>
        </button>
        <button on:click={() => handleNavButtonClicked("youtube")} class="nav-menu-tab nav-menu-tab--vid tool-tip-container">
            <!-- <span class="tool-tip-text tool-tip-text--left">Youtube</span> -->
            <i class="fa-brands fa-youtube nav-menu-tab__icon"></i>
        </button>
        <button on:click={() => handleNavButtonClicked("music")} class="nav-menu-tab nav-menu-tab--music tool-tip-container">
            <!-- <span class="tool-tip-text tool-tip-text--left">Music</span> -->
            <i class="fa-solid fa-music"></i>
        </button>
        <button on:click={() => handleNavButtonClicked("appearance")} class={"nav-menu-tab nav-menu-tab--appearance tool-tip-container"}>
            <!-- <span class="tool-tip-text tool-tip-text--left">Appearance</span> -->
            <i class="fa-solid fa-paint-roller"></i>
        </button>
        <button on:click={() => handleNavButtonClicked("settings")} class={"nav-menu-tab nav-menu-tab--settings tool-tip-container"}>
            <!-- <span class="tool-tip-text tool-tip-text--left">Settings</span> -->
            <i class="fa-solid fa-gear nav-menu-tab__icon"></i>
        </button>
    </div>
    {#if currentTheme.twinTheme != null}
        <button 
            on:click={handleToggleThemeMode}
            class={`theme-mode-toggle 
                    ${currentTheme.isDarkTheme ? "theme-mode-toggle--dark" : "theme-mode-toggle--light"}
                    ${isMusicPlayerActive ? "theme-mode-toggle--music-player-active" : ""}
                  `}
        >
            <div class="theme-mode-toggle__sun">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g filter="url(#filter0_d_2609_23316)">
                        <path d="M17.297 20.5476C19.3712 20.5476 21.0527 18.8661 21.0527 16.7919C21.0527 14.7177 19.3712 13.0362 17.297 13.0362C15.2229 13.0362 13.5414 14.7177 13.5414 16.7919C13.5414 18.8661 15.2229 20.5476 17.297 20.5476Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M17.297 21.1618C14.8876 21.1618 12.9273 19.2015 12.9273 16.792C12.9273 14.3825 14.8876 12.4222 17.297 12.4222C19.7065 12.4222 21.6668 14.3825 21.6668 16.792C21.6668 19.2015 19.7065 21.1618 17.297 21.1618ZM17.297 13.6503C15.5648 13.6503 14.1555 15.0596 14.1555 16.7919C14.1555 18.5242 15.5648 19.9335 17.297 19.9335C19.0293 19.9335 20.4386 18.5242 20.4386 16.7919C20.4386 15.0596 19.0293 13.6503 17.297 13.6503Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M17.297 11.5164C16.9579 11.5164 16.683 11.2414 16.683 10.9023V8.90561C16.683 8.56646 16.9579 8.2915 17.297 8.2915C17.6362 8.2915 17.9111 8.56646 17.9111 8.90561V10.9023C17.9111 11.2414 17.6362 11.5164 17.297 11.5164Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M17.2969 25.2915C16.9577 25.2915 16.6828 25.0165 16.6828 24.6774V22.6807C16.6828 22.3416 16.9577 22.0666 17.2969 22.0666C17.636 22.0666 17.911 22.3416 17.911 22.6807V24.6774C17.911 25.0166 17.636 25.2915 17.2969 25.2915Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M25.1828 17.4058H23.1862C22.847 17.4058 22.5721 17.1309 22.5721 16.7917C22.5721 16.4526 22.847 16.1776 23.1862 16.1776H25.1828C25.5219 16.1776 25.7969 16.4526 25.7969 16.7917C25.7969 17.1309 25.522 17.4058 25.1828 17.4058Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M11.4076 17.4057H9.41097C9.07182 17.4057 8.79688 17.1307 8.79688 16.7916C8.79688 16.4524 9.07182 16.1775 9.41097 16.1775H11.4076C11.7467 16.1775 12.0217 16.4524 12.0217 16.7916C12.0217 17.1307 11.7467 17.4057 11.4076 17.4057Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M21.4613 13.241C21.3042 13.241 21.147 13.1811 21.0271 13.0611C20.7873 12.8213 20.7873 12.4324 21.0271 12.1927L22.4389 10.7809C22.6788 10.541 23.0676 10.541 23.3073 10.7809C23.5472 11.0207 23.5472 11.4096 23.3073 11.6493L21.8955 13.0611C21.7756 13.1811 21.6184 13.241 21.4613 13.241Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M11.7204 22.9818C11.5632 22.9818 11.406 22.9219 11.2862 22.8019C11.0463 22.5621 11.0463 22.1732 11.2862 21.9335L12.698 20.5216C12.9378 20.2818 13.3267 20.2818 13.5664 20.5216C13.8062 20.7615 13.8062 21.1503 13.5664 21.3901L12.1546 22.8019C12.0347 22.9219 11.8776 22.9818 11.7204 22.9818Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M22.8731 22.9818C22.716 22.9818 22.5588 22.9219 22.4389 22.8019L21.0271 21.3901C20.7873 21.1502 20.7873 20.7614 21.0271 20.5216C21.2669 20.2818 21.6558 20.2818 21.8955 20.5216L23.3073 21.9335C23.5472 22.1733 23.5472 22.5622 23.3073 22.8019C23.1875 22.9219 23.0303 22.9818 22.8731 22.9818Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        <path d="M13.1322 13.241C12.9751 13.241 12.8179 13.1811 12.698 13.0611L11.2862 11.6493C11.0463 11.4095 11.0463 11.0207 11.2862 10.7809C11.526 10.541 11.9148 10.541 12.1546 10.7809L13.5664 12.1927C13.8062 12.4325 13.8062 12.8213 13.5664 13.0611C13.4465 13.1811 13.2894 13.241 13.1322 13.241Z" fill={`${!currentTheme.isDarkTheme ? "#F6EBAF" : currentTheme.themeToggleBtnIconColor}`}/>
                        </g>
                        <defs>
                            <stop stop-color="#F7F8D0"/>
                            <stop offset="0.966295" stop-color="#F2DA9C"/>
                        </defs>
                    </svg>
            </div>
            <div class="theme-mode-toggle__moon">
                <svg width="36" height="37" viewBox="0 0 36 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_d_2572_18359)">
                    <path 
                        fill={`${currentTheme.isDarkTheme ? "url(#paint0_linear_2572_18359)" : currentTheme.themeToggleBtnIconColor}`}
                        d="M18.2197 12.3918C14.7036 12.7697 12.1435 15.7469 12.4976 19.0413C12.8516 22.3358 15.9858 24.701 19.502 24.3231C21.2273 24.1377 22.7211 23.3252 23.7563 22.1579C23.8847 22.0121 23.8999 21.8057 23.7911 21.6504C23.6822 21.4951 23.4758 21.423 23.2827 21.476C23.0086 21.5513 22.7264 21.6059 22.4332 21.6374C19.6743 21.9339 17.211 20.0757 16.9328 17.4871C16.7444 15.7347 17.6054 14.0985 19.0365 13.1311C19.2001 13.0192 19.2684 12.8233 19.2062 12.6468C19.144 12.4703 18.9643 12.3522 18.7633 12.3577C18.5825 12.3636 18.4022 12.3749 18.22 12.3945L18.2197 12.3918Z"
                    />
                    </g>
                    {#if currentTheme.isDarkTheme}
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
        </button>
    {/if}
</div>

<style lang="scss">
    .nav-menu {
        height: 100%;
        font-family: "Manrope", system-ui;
        padding: 20px 10px;
        margin: 0px 10%;
        left: 0px;
        text-align: center;
        @include flex-container(center, _);
        flex-direction: column;
        
        @include md(max-width) {
            margin: 0px 10%;
        }
        .divider {
            height: 1px;
            filter: brightness(1.13);
            margin: 14px 0px 18px 0px;
            background-color: rgba(var(--textColor1), 0.15);
            
            &:first-child {
                margin: 10px 0px 12px 0px;
            }
        }
        &__tabs {
            font-family: "Gordita Medium", system-ui;

            &--dark-theme .nav-menu-tab {
                &:focus {
                    filter: brightness(1.3) !important;
                }
            }
            &--dark-mode, &--light-mode {
                .fa-chart-line {
                    color: #a3ceff !important;
                }
                .fa-youtube {
                    color: #9994ff !important;
                }
                .fa-music {
                    color: #caa0fd !important;
                }
                .fa-paint-roller {
                    color: #E9A6D4 !important;
                }
                .fa-gear  {
                    color: #F8B1BB !important;
                }
            }
            &--light-mode {
                .nav-menu-tab--stats {
                    background-color: #F5F9FF !important;
                }
                .nav-menu-tab--vid {
                    background-color: #F3F5FF !important;
                }
                .nav-menu-tab--music {
                    background-color: #F6F2FF !important;
                }
                .nav-menu-tab--appearance {
                    background-color: #FFF2FB !important;
                }
                .nav-menu-tab--settings {
                    background-color: #fff4f7 !important;
                }
            }
            &--simple-styling {
                i {
                    color: var(--navIconColor) !important; // overide default styling
                }
            }
        }
    }
    .nav-menu-tab {
        height: 40px;
        width: 40px;
        position: relative;
        font-size: 1rem;
        margin-bottom: 10px;
        padding: 0px;
        border-radius: 35%;
        transition: 0.1s ease-in-out;
        background-color: var(--navIconBgColor);
        @include flex-container(center, center);
        
        &:hover {
            border-radius: 100%;
            transition: 0.3s ease-in-out;
        }
        &:focus {
            border-radius: 100%;
            filter: brightness(0.98);
        }
        .fa-music {
            font-size: 1.2rem;
        }
        .fa-paint-roller {
            font-size: 1.4rem;
        }
        &__icon {
            font-size: 1.4rem;
        }
        &__text {
            white-space: nowrap;
            display: none;
        }
    }
    .theme-mode-toggle {
        height: 85px;
        border-radius: 20px;
        width: 40px;
        background-color: var(--themeToggleBtnBgColor);
        border: var(--borderVal2);
        transition: 0.15s ease-in-out;
        @include pos-abs-bottom-left-corner(14px, 9px);
        
        &--light &__highlighter {
            background-color: var(--highlighterToggleBtnBgColor);
            @include pos-abs-bottom-left-corner(46px, 3.5px);
        }
        &--dark &__highlighter {
            background-color: var(--highlighterToggleBtnBgColor);
            @include pos-abs-bottom-left-corner(5px, 3.5px);
        }
        &--music-player-active {
            @include sm(max-width) {
                bottom: 60px;
            }
        }
        
        &__sun {
            @include pos-abs-top-left-corner(5px, 3px);
            z-index: 2;
        }
        &__moon {
            @include pos-abs-bottom-left-corner(0px, 2px);
            z-index: 2;
        }
        &__highlighter {
            transition: 0.1s ease-in-out;
            position: absolute;
            @include circle(33px);
            z-index: 1;
        }

        &:active {
            transform: scale(0.99);
        }
    }
</style>    