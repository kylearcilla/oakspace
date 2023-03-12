<script lang="ts">
    console.log("render")
</script>

<div class="nav-menu">
    <!-- <div class={"nav-menu-header"}>
        <h1 class="nav-menu-header__title">Today</h1>
        <p class="nav-menu-header__date">Wed, Feb 02</p>
    </div> -->
    <div class="nav-menu__divider"></div>
    <div class="nav-menu__tabs">
        <button class={"nav-menu-tab nav-menu-tab--sessions tool-tip-container"}>
            <span class="tool-tip-text tool-tip-text--left">Sessions</span>
            <i class="fa-solid fa-book nav-menu-tab__icon"></i>
        </button>
        <button class="nav-menu-tab nav-menu-tab--stats tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Stats</span>
            <i class="fa-solid fa-calendar-days nav-menu-tab__icon"></i>
        </button>
        <button class="nav-menu-tab nav-menu-tab--youtube tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Youtube</span>
            <i class="fa-brands fa-youtube nav-menu-tab__icon"></i>
        </button>
        <button class="nav-menu-tab nav-menu-tab--spotify tool-tip-container">
            <span class="tool-tip-text tool-tip-text--left">Spotify</span>
            <i class="fa-brands fa-spotify nav-menu-tab__icon"></i>
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

            .nav-menu-tab {
                width: 100%;
                display: flex;
                position: relative;
                padding: 8px 0px 8px 10px;
                margin-bottom: 4px;
                border-radius: 8px;
                font-size: 1rem;
                transition: 0.2s ease-in-out;

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
                &:hover {
                    background-color: #1E1E22;
                    cursor: pointer;
                }
                &--sessions {
                    color: #7B98FC !important;
                }
                &--stats {
                    color: #9997FE !important;
                }
                &--youtube {
                    color: #DA7EBA !important;
                }
                &--spotify {
                    color: #89F6A7 !important;
                }
                @mixin minimize-nav-menu-style {
                    height: 40px;
                    width: 40px;
                    display: flex;
                    margin-bottom: 10px;
                    padding: 0px;
                    justify-content: center;
                    align-items: center;
                    border-radius: 35%;
                    background-color: #1a1a1f;
                    &:hover {
                        border-radius: 100%;
                        transition: 0.3s ease-in-out;
                        background-color: #2a2830;
                    }
                }
                @include minimize-nav-menu-style;
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