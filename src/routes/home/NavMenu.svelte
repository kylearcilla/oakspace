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
    <!-- <div class={"nav-menu-header"}>
        <h1 class="nav-menu-header__title">Today</h1>
        <p class="nav-menu-header__date">Wed, Feb 02</p>
    </div> -->
    <div class="nav-menu__divider"></div>
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
        padding: 20px 20px 20px 5%;
        margin: 0px 10%;
        left: 0px;
        
        @include md(max-width) {
            margin: 0px 10%;
        }
        
        .nav-menu-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin: 25px 0px 0px 10px;
            padding-bottom: 2px;

            &__title {
                font-size: 1.5rem;
                font-weight: 700;
                color: white;
                margin-right: 7px;
            }
            &__date {
                white-space: nowrap;
                font-weight: 400;
                font-size: 0.9rem;
                color: #7F7F7F;
            }
            &--closed {
                display: none;
            }
            @include md(max-width) {
                display: none;
            }
        }
        &__divider {
            height: 1px;
            width: 93%;
            margin: 10px 5px 15px 10px;
            background-color: #28282E;
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
            background-color: #201f26;
            
            @include flex-container(center, center);
            
            &:hover {
                border-radius: 100%;
                transition: 0.3s ease-in-out;
                background-color: rgb(37, 35, 41);
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
            &--gear {
                color: #7B98FC !important;
            }
            &--chart {
                color: #9997FE !important;
            }
            &--youtube {
                color: #DA7EBA !important;
            }
            &--music {
                color: #9997FE !important;
            }
        }
    }

    // when nav bar is closed, allow the tooltip to be seen when hovered over
    .tool-tip-container:hover,
    .tool-tip-container:hover .tool-tip-text,
    .tool-tip-container:hover .tool-tip-text::after {
        @include tool-tip-shown
    }
</style>