<script lang="ts">
    import { onMount } from "svelte"
    
	import { getMaskedGradientStyle } from "../../../lib/utils-general"

	import HeatMap from "../../../components/HeatMap.svelte"
	import LineProgress from "../../../components/LineProgress.svelte"

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
                <img src="https://i.pinimg.com/originals/d5/be/0e/d5be0e8053cc298e9aa4383c99058ba5.gif" alt="">
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

        <div class="divider divider--fw divider--1"></div>

        <!-- Overview -->
         <div class="base__overview">
            <div class="base__overview-details">
                <div>
                    <div class="base__heading">
                        Overview
                    </div>
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
    
         <div class="divider divider--fw divider--2"></div>
    
        <!-- month Insights -->
        <div class="base__month">
            <div class="base__month-details">
                <div>
                    <div class="base__month-heading">
                        September
                    </div>
                    <div class="base__month-word" title="Word of the month">
                        <div class="flx">
                            <span>Unwind</span>
                            <i>verb</i>
                        </div>
                        <p>
                            Refers to the process of letting go of stress and allowing yourself to feel calm and at ease.
                        </p>
                    </div>
                </div>
                <div class="base__insights">
                    <!-- <div class="base__insight-header">
                        Insights
                    </div>
                    <div class="base__insight-row">
                        Daily Focus Time <span>2h 33m</span>
                    </div>
                    <div class="base__insight-row">
                        Habit Adherance <span>14%</span>
                    </div>
                    <div class="base__insight-row">
                        Goals Accomplished <span>4/15</span>
                    </div> -->
                    <div class="flx">
                        <div class="base__insight-box">
                            <div class="base__insight-box-header">
                                <div>Habit Consistency</div>
                            </div>
                            <div class="base__insight-box-details">
                                <div class="base__insight-box-num">
                                    18%
                                </div>
                                <div class="base__insight-box-title">
                                    over 11 Days
                                </div>
                            </div>
                        </div>
                        <div class="base__insight-box">
                            <div class="base__insight-box-header">
                                <div>Goals This Month</div>
                            </div>
                            <div class="base__insight-box-details">
                                <div class="base__insight-box-num">
                                    12/38
                                </div>
                                <div class="base__insight-box-title">
                                    Accomplished
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                <div 
                    style:background-image={`linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(https://i.pinimg.com/originals/fc/4e/d6/fc4ed6342861e55fbf362aab8f596e76.gif)`}
                    class="base__month-img bg-img"
                >
                <p>
                    There are some things you learn best in calm, and some in storm.
                </p>
            </div>
        </div>

        <div class="divider divider--fw"></div>
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
                margin: 20px 0px 18px 25px;
            }
            &--1 {
                display: none;
                margin-bottom: 15px;
            }
            &--2 {
                margin-bottom: 15px;
            }
        }

        &__content {
            max-width: 1000px;
            margin: 0 auto;
        }

        /* text */
        &__heading {
            @include text-style(0.95, 400, 1.7rem, "DM Mono");
            margin-bottom: 8px;
        }
        &__subheading {
            @include text-style(1, 400, 1.525rem);
            margin: 18px 0px 10px 0px;
        }
        &__text {
            @include text-style(0.45, 400, 1.475rem);
        }

        /* insights */
        &__insight-row {
            @include flex(center, space-between);
            @include text-style(0.3, 500, 1.345rem);

            span {
                @include text-style(0.525, 500, 1.345rem);
            }

            &:not(:last-child) {
                margin-bottom: 9px;
            }
        }
        &__insight-box {
            background-color: rgba(var(--textColor1), 0.02);
            margin-right: 10px;
            padding: 10px 18px 12px 14px;
            border-radius: 12px;
            height: 118px;
            width: 160px;
            @include flex-col;
        }
        &__insight-box-header {
            @include text-style(0.2, 400, 1.25rem, "DM Sans");
            margin-bottom: 14px;
            @include flex(center, space-between);
        }
        &__insight-box-num {
            @include text-style(1, 400, 2.2rem, "DM Mono");
            margin-bottom: 5px;
        }
        &__insight-box-title {
            @include text-style(0.245, 400, 1.35rem, "DM Sans");
        }

        /* Header */
        &__header-img {
            height: 180px;
            width: 100%;
        }
        &__header {
            @include flex(flex-start);
            padding: 20px 30px 0px 30px;
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
            // display: none;

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
                @include text-style(1, 400, 2rem, "DM Mono");
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

        /* Progress */
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
            height: 132px;
            display: none;

            .base__text {
                margin-bottom: 30px;
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
        &__month {
            padding: 0px 30px 0px 30px;
            height: 260px;
            @include flex(center, space-between);
        }
        &__month-heading {
            @include text-style(1, 400, 1.7rem, "DM Mono");
            margin: -5px 0px 12px 0px;
        }
        &__month-word {
            @include text-style(1, 400, 1.35rem, "DM Mono");
            position: relative;
            margin-bottom: 18px;
            padding-left: 15px;

            span {
                margin-right: 15px;
                opacity: 0.55;
            }
            i {
                opacity: 0.12;
            }
            p {
                margin-top: 7px;
                @include text-style(0.235, 400, 1.4rem, "DM Sans");
            }

            &:before {
                content: " ";
                // display: none;
                @include abs-top-left(3px);
                height: calc(100% - 4px);
                width: 2px;
                background: rgba(var(--textColor1), 0.085);
                border-radius: 2px;
            }
        }
        &__month-details {
            @include flex-col;
            height: 100%;
            max-width: 450px;
            margin-right: 10px;
        }
        &__month-img {
            flex: 1;
            height: 100%;
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
    }
</style>