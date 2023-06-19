<script lang="ts">
	import { colorThemeState } from "$lib/store";
	import { onMount } from "svelte";

    export let onNavButtonClicked: any;
    let navButtonClicked = "";
    let isDefaultDarkMode = false

    colorThemeState.subscribe((data) => {
        isDefaultDarkMode = data.title === "Dark Mode"
    })

    const handleNavButtonClicked = (btnName: string) => {

        if (btnName === "stats") {
            onNavButtonClicked("stats")
        }
        else if (btnName === "youtube") {
            onNavButtonClicked("youtube")
        }
        else if (btnName === "music") {
            onNavButtonClicked("music")
        }
        else if (btnName === "settings") {
            onNavButtonClicked("settings")
        }
        else {
            onNavButtonClicked("appearance")
        }
    }
</script>

<div class="nav-menu">
    <div class="divider"></div>
    <div class="nav-menu__profile-pic">
        <img src="https://i.pinimg.com/564x/43/86/bb/4386bb3d57ddcb0c6ee1ba7a7f171689.jpg" alt="user-profile-pic">
    </div>
    <div class="divider"></div>
    <div class={`nav-menu__tabs ${isDefaultDarkMode ? "nav-menu__tabs--dark-mode" : "nav-menu__tabs--not-dark-mode"} `}>
        <button on:click={() => handleNavButtonClicked("chart")} class="nav-menu-tab tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Stats</span>
            <i class="fa-solid fa-chart-line nav-menu-tab__icon"></i>
        </button>
        <button on:click={() => handleNavButtonClicked("youtube")} class="nav-menu-tab tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Youtube</span>
            <i class="fa-brands fa-youtube nav-menu-tab__icon"></i>
        </button>
        <button on:click={() => handleNavButtonClicked("music")} class="nav-menu-tab tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Music</span>
            <i class="fa-solid fa-music"></i>
        </button>
        <button on:click={() => handleNavButtonClicked("apperance")} class={"nav-menu-tab tool-tip-container"}>
            <span class="tool-tip-text tool-tip-text--left">Appearance</span>
            <i class="fa-solid fa-image nav-menu-tab__icon"></i>
        </button>
        <button on:click={() => handleNavButtonClicked("settings")} class={"nav-menu-tab tool-tip-container"}>
            <span class="tool-tip-text tool-tip-text--left">Settings</span>
            <i class="fa-solid fa-gear nav-menu-tab__icon"></i>
        </button>
    </div>
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
        &__profile-pic {
            overflow: hidden;
            @include circle(33px);
            // border: 2px solid white;
            img {
                @include circle(33px);
                -webkit-user-drag: none;
                object-fit: cover;
            }
        }
        .divider {
            height: 1px;
            filter: brightness(1.13);
            margin: 14px 0px 18px 0px;
            
            &:first-child {
                margin: 10px 0px 12px 0px;
            }
        }
        &__tabs {
            font-family: "Gordita Medium", system-ui;

            &--dark-mode {
                .fa-chart-line {
                    color: #a3ceff !important;
                }
                .fa-youtube {
                    color: #9994ff !important;
                }
                .fa-music {
                    color: #caa0fd !important;
                }
                .fa-image {
                    color: #E9A6D4 !important;
                }
                .fa-gear  {
                    color: #F8B1BB !important;
                }
            }
            &--not-dark-mode {
                i {
                    color: var(--navIconColor) !important; // overide default styling
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
            .fa-music {
                font-size: 1.2rem;
            }
            &__icon {
                font-size: 1.4rem;
            }
            &__text {
                white-space: nowrap;
                display: none;
            }
        }
    }

    .tool-tip-text {
        &::after {
            background-color: rgb(var(--fgColor1));
        }
    }
    
    // when nav bar is closed, allow the tooltip to be seen when hovered over
    .tool-tip-container:hover .tool-tip-text,
    .tool-tip-container:hover .tool-tip-text::after {
        @include tool-tip-shown(rgb(var(--fgColor1)));
    }
</style>    