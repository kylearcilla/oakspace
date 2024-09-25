<script lang="ts">
	import { Icon } from "$lib/enums";
	import { onMount } from "svelte";
	import HeatMap from "../../components/HeatMap.svelte";
	import LineProgress from "../../components/LineProgress.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte";
	import { getMaskedGradientStyle } from "$lib/utils-general";

    let heatMapContainer: HTMLElement
    let heatMapGradient = ""
    let heatMapRightArrow = true
    let heatMapLeftArrow = false

    const bannerImg = {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg/2560px-Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg",
        opacity: 0.45
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

        heatMapGradient = styling
        heatMapRightArrow = !scrollStatus.hasReachedEnd
        heatMapLeftArrow = !scrollStatus.hasReachedStart
    }

    onMount(() => {
        heatMapScroll(heatMapContainer)  
    })
</script>

<div class="base">
    <!-- Banner -->
    <div 
        class="base__header-img bg-img"
        style:background-image={`linear-gradient(rgba(0, 0, 0, ${bannerImg.opacity}), rgba(0, 0, 0, ${bannerImg.opacity})), url(${bannerImg.src})`}
    >
    </div>
    <div class="base__content">
        <!-- Header -->
        <div class="base__header">
            <div class="base__header-icon">
                <img src="https://i.pinimg.com/originals/22/a2/8e/22a28ec79941e28b8a1a05f5e20e888f.gif" alt="">
            </div>
            <div class="base__header-details">
                <div>
                    <h1>Home</h1>
                    <h4>Good afternoon, Kyle!</h4>
                </div>
                <div class="base__header-quote">
                    <p>"How we spend our days is, of course, how we spend our lives."</p>
                </div>
            </div>
            <div class="base__progress">
                <div class="base__progress-row">
                    <div class="base__progress-item">
                        <span>Week</span>
                        <LineProgress 
                            options={{ progress: 0.2 }}
                        />
                    </div>
                    <div class="base__progress-item">
                        <span>Quarter</span>
                        <LineProgress 
                            options={{ progress: 0.3 }}
                        />
                    </div>
                </div>
                <div class="base__progress-row">
                    <div class="base__progress-item">
                        <span>Month</span>
                        <LineProgress 
                            options={{ progress: 0.65 }}
                        />
                    </div>
                    <div class="base__progress-item">
                        <span>Year</span>
                        <LineProgress 
                            options={{ progress: 0.6 }}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="divider divider--fw"></div>

        <!-- Overview -->
         <div class="base__overview">
            <div class="base__overview-details">
                <div class="base__heading">
                    Overview
                </div>
                <div class="base__text">
                    Your year so far at a glance.
                </div>
                <!-- <div class="base__subheading">
                    Insights
                </div> -->
                <div class="base__overview-row">
                    <div class="base__overview-row-title">
                        Daily Focus Average
                    </div>
                    <div class="base__overview-row-num">
                        2h 33m
                    </div>
                </div>
                <div class="base__overview-row">
                    <div class="base__overview-row-title">
                        Habit Consistency
                    </div>
                    <div class="base__overview-row-num">
                        14%
                    </div>
                </div>
                <div class="base__overview-row">
                    <div class="base__overview-row-title">
                        Goals Accomplished
                    </div>
                    <div class="base__overview-row-num">
                        33 / 47
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
    
         <div class="divider divider--fw"></div>
    
        <!-- Recent Insights -->
        <div class="base__recent">
            <div 
                style:background-image={`linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(https://i.pinimg.com/originals/fc/4e/d6/fc4ed6342861e55fbf362aab8f596e76.gif)`}
                class="base__recent-img bg-img"
            >
                <p>
                    There are some things you learn best in calm, and some in storm.
                </p>
            </div>
            <div class="base__recent-details">
                <div>
                    <div class="base__heading">
                        Insights
                    </div>
                    <div class="base__text">
                        Latest trends for habits and focus sessions.
                    </div>
                </div>
                <div class="base__insights">
                    <div class="base__insight">
                        <div class="base__insight-header">
                            <div>Year Best</div>
                            <div>33 Days</div>
                        </div>
                        <div class="base__insight-details">
                            <div class="base__insight-num">
                                17 Days
                            </div>
                            <div class="base__insight-title">
                                Perfect Habit Streak
                            </div>
                        </div>
                    </div>
                    <div class="base__insight">
                        <div class="base__insight-header">
                            <div>Last Week</div>
                            <div>2h 11m</div>
                        </div>
                        <div class="base__insight-details">
                            <div class="base__insight-num">
                                1h 58m
                            </div>
                            <div class="base__insight-title">
                                Daily Focus Average
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="divider divider--fw"></div>

        <!-- Goals -->
    </div>
</div>

<style lang="scss">
    .base {
        margin-top: 15px;
        width: 100%;
        height: calc(100% - 15px);
        overflow-x: scroll;
        padding-bottom: 600px;

        .divider {
            background-color: rgba(var(--textColor1), 0.025);

            &--fw {
                height: 1px;
                width: calc(100% - 50px);
                margin: 20px 0px 15px 25px;
            }
        }

        &__content {
            max-width: 900px;
            margin: 0 auto;
        }

        /* text */
        &__heading {
            @include text-style(1, 400, 1.725rem,);
            margin-bottom: 5px;
        }
        &__subheading {
            @include text-style(1, 400, 1.525rem);
            margin: 18px 0px 10px 0px;
        }
        &__text {
            @include text-style(0.3, 400, 1.485rem);
        }

        /* Header */
        &__header-img {
            height: 180px;
            width: 100%;
        }
        &__header {
            @include flex(flex-start);
            padding: 16px 30px 0px 30px;
            width: 100%;
            // height: 140px;

            .divider {
                height: 100%;
                width: 1px;
                margin: 0px 25px 0px 20px;
            }
        }
        &__header-icon {
            height: 90px;
            width: 90px;
            margin-right: 20px;
            display: none;

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
                margin: 0px 0px 5px 0px;
            }
            h4 {
                @include text-style(0.45, 500, 1.485rem);
            }
        }
        &__header-quote {
            @include text-style(0.25, 500, 1.4rem);
            position: relative;
            padding: 0px 0px 0px 12px;
            margin: 14px 0px 0px 0px;
            // padding: 8px 5px 10px 14px;
            // border-radius: 9px;
            // background: rgba(var(--textColor1), 0.0145);
            @include multi-line-elipses-overflow(2);

            &:before {
                content: " ";
                // display: none;
                @include abs-top-left(5px);
                height: calc(100% - 8px);
                width: 2px;
                background: rgba(var(--textColor1), 0.35);
                border-radius: 2px;
            }
        }
        &__progress {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: start;
            padding: 4px 0px 0px 15px;
        }
        &__progress-row {
            display: flex;

            &:first-child {
                margin-bottom: 15px;
            }
        }
        &__progress-item {
            &:first-child {
                margin-right: 18px;
            }
            span {
                display: block;
                margin-bottom: 12px;
                @include text-style(0.55, 400, 1.2rem, "DM Mono");
            }
        }

        /* Overview */
        &__overview {
            padding: 0px 30px 0px 30px;
            margin-bottom: 20px;
            @include flex(flex-end);
            height: 160px;

            .base__text {
                margin-bottom: 35px;
            }
        }
        &__overview-details {
            width: 290px;
            margin-right: 30px;
        }
        &__overview-row {
            width: 100%;
            @include flex(center, space-between);
            
            &:not(:last-child) {
                margin-bottom: 10px;
            }
        }
        &__overview-row-title {
            @include text-style(0.4, 400, 1.445rem);
        }
        &__overview-row-num {
            @include text-style(1, 500, 1.4rem, "Manrope");
        }
        &__heat-map {
            flex: 1;
            padding: 0px 80px 0px 60px;
            overflow-x: scroll;
        }

        /* Recent Insights */
        &__recent {
            padding: 5px 30px 0px 30px;
            height: 250px;
            @include flex(center);
        }
        &__recent-img {
            flex: 1;
            height: 100%;
            margin-right: 30px;
            border-radius: 2px;
            min-width: 300px;
            max-width: 400px;
            @include center;

            p {
                @include text-style(0.75, 400, 1.35rem, "DM Mono");
                text-align: center;
                max-width: 70%;
            }
        }
        &__recent-details {
            @include flex-col;
            height: 100%;
        }
        &__insights {
            display: flex;
        }
        &__insight {
            background-color: rgba(var(--textColor1), 0.015);
            margin-right: 10px;
            padding: 10px 18px 14px 14px;
            border-radius: 12px;
            @include flex-col;
            height: 145px;
            width: 180px;
        }
        &__insight-header {
            @include flex(center, space-between);
            @include text-style(0.125, 500, 1.2rem);
        }
        &__insight-num {
            @include text-style(1, 500, 1.85rem);
            margin-bottom: 5px;
        }
        &__insight-title {
            @include text-style(0.245, 500, 1.35rem);
        }
    }
</style>