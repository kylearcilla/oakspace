<script lang="ts">
    import { onMount } from 'svelte';
	import { getCurrentDate, getCurrentTime } from "$lib/helper";
	import { colorThemeState } from '$lib/store';

    export let isTaskMenuExpanded: Boolean;

    let isLightTheme = false
    let selectedTabTitle = "Dashboard"

    let isScrollableLeft = false;
    let isScrollableRight = true;
    let groupTabList: HTMLElement;

    const SCROLL_STEP = 50
    const HORIZONTAL_TAB_COROUSEL_RIGHT_OFFSET = 30

    colorThemeState.subscribe((theme) => isLightTheme = !theme.isDarkTheme)

    /* Horizontal Reccomendation Category Tab List */
    const handleShiftTabCategoryRight = () => groupTabList!.scrollLeft += SCROLL_STEP
    const handleShiftTabCategoryLeft = () => groupTabList!.scrollLeft -= SCROLL_STEP

    const handleScroll = (event: any) => {
        const scrollLeft = event.target.scrollLeft;
        const scrollWidth = event.target.scrollWidth;
        const clientWidth = event.target.clientWidth; // container width

        isScrollableLeft = scrollLeft > 0;
        isScrollableRight = scrollLeft + clientWidth < scrollWidth - HORIZONTAL_TAB_COROUSEL_RIGHT_OFFSET;


    }

    // right arrow disappears after a window resize if false even user can scroll right
    const handleResize = () => {
        const scrollLeft = groupTabList.scrollLeft;
        const scrollWidth = groupTabList.scrollWidth;
        const clientWidth = groupTabList.clientWidth;

        isScrollableRight = scrollLeft + clientWidth < scrollWidth;
    }

    onMount(() => {
        const savedYtCreds = localStorage.getItem('yt-credentials');
        const savedUserData = localStorage.getItem('yt-user-data');

        handleResize()
        window.addEventListener("resize", handleResize);
    });
</script>

<div class={`task-view ${!isTaskMenuExpanded ? "task-view--minimize" : ""}`}>
    <div class="task-view__header task-view__header--default"> 
        <img class="task-view__header-img" src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/287d3559037917.5a130f45904d5.gif" alt="">
            <h2>Hey, Kyle!</h2>
        <p class="task-view__header-text">Let's get shit done today!</p>
    </div>
    <!-- Horizontal Tabs Carousel -->
    <!-- <div class="task-view__tab-container">
        {#if isScrollableLeft}
            <div class="gradient-container gradient-container--left">
                <button class="recs__tab-arrow recs__tab-arrow--left icon-btn"
                        on:click={handleShiftTabCategoryLeft}
                >
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
            </div>
        {/if}
        <ul class="task-view__tabs" bind:this={groupTabList} on:scroll={handleScroll}>
            <li><div class="recs__tab-group-padding recs__tab-group-padding--left"></div></li>
            <li>
                <button 
                    on:click={() => {selectedTabTitle = "Active Session"}}
                    class={`tab-btn ${isLightTheme ? "tab-btn--light-mode" : ""} ${selectedTabTitle === "Active Session" ? "tab-btn--selected" : ""}`}
                >
                    Active Session
                </button>
            </li>
            <li>
                <button 
                    on:click={() => {selectedTabTitle = "Dashboard"}}
                    class={`tab-btn ${isLightTheme ? "tab-btn--light-mode" : ""} ${selectedTabTitle === "Dashboard" ? "tab-btn--selected" : ""}`}
                >
                    Dasboard
                </button>
            </li>
            <li><div class="recs__tab-group-padding recs__tab-group-padding--right"></div></li>
        </ul>
        {#if isScrollableRight}
            <div class="gradient-container gradient-container--right">
                <button class="recs__tab-arrow recs__tab-arrow--right icon-btn"
                        on:click={handleShiftTabCategoryRight}
                >
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        {/if}
    </div> -->
</div>

<style lang="scss">
    .task-view {
        width: 100%;
        overflow: hidden;
        color: rgb(var(--textColor1));
        
        &__header {
            width: 100%;
            margin: 0px 0px 15px 0px;
            h2 {
                font-family: "Apercu";
                padding-left: 7%;
                @include elipses-overflow;
                margin: 0px 10px 2px 0px;
                font-weight: 500;
            }
            &--secondary {
                display: block;
                text-align: center;
            }
            &--secondary > p {
                margin: 5px 0px 6px 0px;
            }
        }
        &__header-img {
            width: 100%;
            margin-bottom: 10px;
            height: 60px;
            object-fit: cover;
        }
        &__header-today-time {
            padding-right: 10%;
            cursor: pointer;
            @include flex-container(center, center);
            opacity: 0.84;
            i {
                color: #e4bb93;
                margin-right: 7px;
            }
            span {
                @include elipses-overflow;
            }
        }
        &__header-text {
            margin-top: 6px;
            padding: 0px 7%;
            opacity: 0.6;
        }
        &__tab-container {
            padding-left: 7%;
        }
        &__tabs {
            display: flex;
        }
    }

</style>