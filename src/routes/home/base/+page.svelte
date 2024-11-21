<script lang="ts">
    import { getMaskedGradientStyle } from "$lib/utils-general"
    
	import MonthView from "./MonthView.svelte";
	import HeatMap from "../../../components/HeatMap.svelte"
	import DailyHabits from "./DailyHabits.svelte";
	import { themeState } from "../../../lib/store";
	import Bulletin from "./Bulletin.svelte";
	import { TEST_TASKS } from "$lib/mock-data"
	import { TasksViewManager } from "$lib/tasks-view-manager"

    const SMALLER_WIDTH = 630
    const SMALL_WIDTH = 860

    let heatMapContainer: HTMLElement
    let heatMapGradient = ""
    let heatMapLeftArrow = false
    let heatMapRightArrow = false
    let width = 0

    $: isLight = !$themeState.isDarkTheme

    let monthBulletinHt = 0
    let leftHt = 0

    let tasks = new TasksViewManager(TEST_TASKS)

    const bannerImg = {
        src: "https://preview.redd.it/ancient-tree-from-mononoke-3840-x-2160-v0-qrghesb0z65c1.png?width=1080&crop=smart&auto=webp&s=c42a4dfc07a2734d3489faaccd1febb56b6859b3",
        opacity: 0.15
    }

    $: if (isLight) {
        bannerImg.opacity = 0
    }

    function heatMapScroll(scrollRef: HTMLElement) {
        const { styling, scrollStatus } = getMaskedGradientStyle(scrollRef, {
           isVertical: false,
           head: {
                end: "30%",
           },
           tail: {
                start: "60%",
           }
        }) as HozScrollMaskedGradient

        heatMapGradient   = styling
        heatMapRightArrow = !scrollStatus.hasReachedEnd
        heatMapLeftArrow  = !scrollStatus.hasReachedStart
    }
</script>

<div 
    bind:clientWidth={width}
    class="base"
    class:base--light={isLight}
    class:base--small={width <= SMALL_WIDTH}
    class:base--right-bar-flex={SMALLER_WIDTH < width && width <= SMALL_WIDTH}
    class:base--smaller={width <= SMALLER_WIDTH}
    style:--month-img-ht={"261px"}
    style:--left-ht={`${leftHt}px`}
>   
    <div 
        class="base__header-img bg-img"
        style:background-image={`linear-gradient(rgba(0, 0, 0, ${bannerImg.opacity}), rgba(0, 0, 0, ${bannerImg.opacity})), url(${bannerImg.src})`}
    >
    </div>
    <div class="base__content">
        <div class="base__header">
            <div 
                class="base__header-icon bg-img"
                style:background-image={`linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url(https://i.pinimg.com/564x/a7/27/df/a727dfcc29381d933b295b036c9239d5.jpg)`}
            >
            </div>
            <div class="base__header-details">
                <h1>Home</h1>
                <div class="base__header-callout insight-sentence">
                    <div class="base__header-callout-icon">🌙</div>
                    <div>
                        <!-- <p>Good <strong>evening</strong> Kyle.</p> -->
                        <p>
                            <!-- You have completed <strong>2</strong> of <strong>3</strong> of your habits today with <strong>1</strong> of <strong>2</strong> goals achieved. -->
                            "How we spend our days is, of course, how we spend our lives." – Annie Dillard
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div class="divider"></div>
        <div class="base__content-flx">
            <div class="base__left" bind:clientHeight={leftHt}>
                <!-- Overview -->
                <div class="base__overview">
                    <div class="base__overview-details">
                        <div>
                            <!-- <div class="base__heading">
                                Overview
                            </div> -->
                            <div class="base__text">
                                Your year at a glance.
                            </div>
                        </div>
                        <!-- <div class="base__subheading">
                            Insights
                        </div> -->
                        <div class="base__insights">
                            <div class="base__insight-row">
                                Habit Consistency <span>11%</span>
                            </div>
                            <div class="base__insight-row">
                                Goals Accomplished <span>2/48</span>
                            </div>
                        </div>
                    </div>
                    <div 
                        bind:this={heatMapContainer}
                        on:scroll={() => heatMapScroll(heatMapContainer)}
                        class="base__heat-map no-scroll-bar"
                        style={heatMapGradient}
                    >
                        <HeatMap />
                    </div>
                    </div>
        
                <!-- month insights -->
                 <div class="base__month-insight">
                     <MonthView/>
                 </div>
            </div>
            <div class="base__right">
                <div class="base__bulletin">
                    <Bulletin />
                </div>
                <div class="base__context">
                    <div class="divider"></div>
                    <div class="base__context-header">
                        <span>Habits</span>
                        <!-- <span 
                            class="base__context-count" 
                            style:opacity={0.2}
                            style:font-size={"1.3rem"}
                        >
                            Habits
                        </span> -->
                        <!-- <span class="base__context-count">
                            {TEST_GOALS.length}
                        </span> -->
                    </div>
                    <DailyHabits 
                        options={{
                            view: "default"
                        }}
                    />
                    <!-- <Tasks manager={tasks} /> -->
                    <!-- <div class="base__context-list">
                        {#each TEST_GOALS as goal}
                            <GoalCard 
                                {goal} 
                                options={{
                                    // type: "simple",
                                    due: false, 
                                    progress: "default"
                                }}   
                                onClick={(goal) => console.log(goal)}
                            />
                        {/each}
                    </div> -->
                </div>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .base {
        width: 100%;
        margin-top: 0px;
        overflow: scroll;
        height: calc(100% - 20px);

        /* light */
        &--light h1 {
            font-weight: 600 !important;
        }
        &--light &__header-callout {
            @include text-style(1, 500);
        }
        &--light &__context-header {
            @include text-style(0.95, 600);
        }
        &--light .divider {
            @include l-div
        }

        /* small */
        &--small &__month-insight {
            min-height: 0px;
        }
        &--small &__content-flx {
            display: block;
        }
        &--small &__left {
            width: 100%;
            padding-right: 0px;
        }
        &--right-bar-flex &__right {
            width: 100%;
            display: flex;
        }
        &--right-bar-flex &__goals {
            height: 600px;
            padding-left: 30px;
            width: calc(100% - 300px);

            .divider {
                display: none;
            }
        }
        &--smaller &__right {
            width: 100%;
        }
        &--smaller &__goals {
            width: 100%;
        }

        .divider {
            background-color: rgba(var(--textColor1), 0.035);
            width: 100%;
            height: 1px;
            margin: 6px 0px 10px 0px;
        }

        &__content {
            max-width: 1560px;
            margin: 0 auto;
            padding: 0px 30px 20px 30px;
        }
        &__content-flx {
            display: flex;
            flex-direction: row-reverse;
        }
        &__left {
            width: calc(100% - 250px);
        }
        &__right {
            padding: 10px 40px 0px 0px;
            width: 250px;
        }

        /* text */
        &__heading {
            @include text-style(0.95, 400, 1.7rem, "DM Mono");
            margin-bottom: 0px;
        }
        &__subheading {
            @include text-style(1, 400, 1.525rem);
            margin: 18px 0px 10px 0px;
        }
        &__text {
            @include text-style(0.45, 400, 1.475rem);
        }

        /* header */
        &__header-img {
            height: 185px;
            width: 100%;
        }
        &__header {
            padding: 40px 0px 0px 0px;
            // padding: 20px 0px 0px 0px;
            width: 100%;
            position: relative;

            .divider {
                height: 100%;
                width: 1px;
                margin: 0px 25px 0px 20px;
            }
        }
        &__header-icon {
            height: 90px;
            width: 90px;
            margin-right: 25px;
            @include abs-top-left(-65px, 0px);

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 0px;
            }
        }
        &__header-details {
            flex: 1;
            position: relative;
            @include flex-col;

            h1 {
                @include text-style(1, 500, 2.125rem);
                margin: -3px 0px 10px 0px;
            }
            h4 {
                @include text-style(0.25, 400, 1.45rem);
                margin: 0px 0px 10px 0px;
            }
        }
        &__header-callout {
            position: relative;
            padding: 8px 25px 13px 13px;
            background-color: var(--lightColor);
            border-radius: 10px;
            display: flex;
            width: fit-content;

            p:first-of-type {
                margin-top: 2px;
            }
            p:not(:first-of-type) {
                margin-top: 3px;
            }
        }
        &__header-callout-icon {
            margin: 1px 12px 0px 0px;
            font-size: 1.5rem;
            color: white !important;
        }

        /* overview */
        &__overview {
            padding: 0px 30px 0px 0px;
            margin-bottom: 10px;
            @include flex(flex-end);
            display: none;

            .base__text {
                margin-bottom: 20px;
            }
        }
        &__overview-details {
            width: clamp(250px, 35%, 350px);
            margin: 0px 30px 0px 0px;
            height: 100%;
        }
        &__heat-map {
            flex: 1;
            padding: 2px 80px 0px 40px;
            overflow-x: scroll;
        }

        /* month insights */
        &__month-insight {
            margin-top: 7px;
            min-height: 700px;
        }
        &__bulletin {
        }

        /* goals */
        &__context {
            height: calc(var(--left-ht) - var(--month-img-ht) - 40px);
            max-height: 200px;


            .divider {
                width: 100%;
                margin: 13px 0px 10px 0px !important;
            }
        }
        &__context-header {
            @include text-style(0.95, 500, 1.6rem);
            @include flex(center, space-between);
            margin: 0px 0px 14px 2px;
        }
        &__context-count {
            opacity: 0.2;
            font-family: "DM MOno";
            font-weight: 400;
        }
        &__context-list {
            padding: 5px 15px 0px 6px;
            max-height: calc(100% - 35px);
            overflow-y: scroll;
            width: calc(100% + 15px);
            margin-left: -6px;
        }
    }

    .insight-sentence {
        @include text-style(0.6, 400, 1.45rem);
        margin: 2px 0px 8px 0px;
        
        strong {
            @include text-style(0.75, 400, 1.4rem, "DM Sans");
            margin: 0px 2px 2px 2px;
        }
    }


</style>