<script lang="ts">
    export let onNavButtonClicked: any;
    let navButtonClicked = "";

    const handleNavButtonClicked = (event: any) => {
        const srcClassList: string[] = event.srcElement.classList.value;

        if (srcClassList.includes("chart")) {
            onNavButtonClicked("stats")
        }
        else if (srcClassList.includes("youtube")) {
            onNavButtonClicked("youtube")
        }
        else if (srcClassList.includes("music")) {
            onNavButtonClicked("music")
        }
        else {
            onNavButtonClicked("settings")
        }
    }
</script>

<div class="nav-menu">
    <div class="divider"></div>
    <div class="nav-menu__profile-pic">
        <img src="https://lh3.googleusercontent.com/ogw/AOLn63FP_CjxioHdirdPhirZ5iK2JTYhNHJC3vZlXtJw2Q=s64-c-mo" alt="user-profile-pic">
    </div>
    <div class="divider"></div>
    <div class="nav-menu__tabs">
        <button on:click={handleNavButtonClicked} class="nav-menu-tab nav-menu-tab--chart tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Stats</span>
            <i class="fa-solid fa-chart-line nav-menu-tab__icon"></i>
        </button>
        <button on:click={handleNavButtonClicked} class="nav-menu-tab nav-menu-tab--youtube tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Youtube</span>
            <i class="fa-brands fa-youtube nav-menu-tab__icon"></i>
        </button>
        <button on:click={handleNavButtonClicked} class="nav-menu-tab nav-menu-tab--music tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Music</span>
            <i class="fa-solid fa-music"></i>
        </button>
        <button on:click={handleNavButtonClicked} class={"nav-menu-tab nav-menu-tab--gear tool-tip-container"}>
            <span class="tool-tip-text tool-tip-text--left">Sessions</span>
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
            border: 2px solid white;
            img {
                @include circle(33px);
                -webkit-user-drag: none;
            }
        }
        .divider {
            height: 1px;
            background-color: rgb(var(--fgColor1));
            filter: brightness(1.13);
            margin: 14px 0px 18px 0px;
            
            &:first-child {
                margin: 10px 0px 12px 0px;
            }
        }
        &__tabs {
            font-family: "Gordita Medium", system-ui;
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
            background-color: rgb(var(--fgColor1));
            @include flex-container(center, center);
            filter: brightness(1.03);
            
            &:hover {
                border-radius: 100%;
                transition: 0.3s ease-in-out;
                // background-color: rgb(37, 35, 41);
            }

            &--chart {
            }
            &--youtube {
            }
            &--music {
                font-size: 1.2rem;
            }
            &--gear {
            }

            i {
                color: var(--navIconColors);
            }

            &__icon {
                font-size: 1.4rem;
                @include md(max-width) {
                    margin: 0px;
                    font-size: 1.4rem;
                }
            }
            &__text {
                white-space: nowrap;
                display: none;
                @include md(max-width) {
                    display: none;
                }
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