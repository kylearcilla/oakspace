<script lang="ts">
    import { onMount } from "svelte"
	import { ProgressVisualPartType, SessionState } from "$lib/enums"
	import { sessionStore, themeState } from "$lib/store"
	import { 
            makeProgressVisualParts, onMouseLeaveProgressLine, onMouseOverProgressLine,
            BASE_PROGRESS_COLOR_1, BASE_TRACK_COLOR_1, HEADER_PROGRESS_COLOR_1, HEADER_TRACK_COLOR_1
    } from "$lib/utils-session"

    export let isForHeader: boolean = true

    let currProgressWidth = 0
    let progressLineElement: HTMLElement | null = null
    let containerElement: HTMLElement | null = null

    let segments: ProgressVisualPart[] = []
    let lastFinishedPeriodIdx = -1

    let currTimeSecs = 0
    let sessDurationMins = 0
    let state: SessionState = SessionState.EMPTY
    let startTimeStr = ""
    let endTimeStr = ""

    const HEADER_DEFAULT_GRADIENT_WIDTH = 60
    const BASE_DEFAULT_GRADIENT_WIDTH = 100
    let GRADIENT_DEFAULT_WIDTH = 60

    const RIGHT_GRADIENT_START_PERCCENT = 80
    
    let leftGradientWidth = GRADIENT_DEFAULT_WIDTH
    let rightGradientWidth = GRADIENT_DEFAULT_WIDTH

    $: {
        currTimeSecs = $sessionStore!.currentSessionTimeSecs
        sessDurationMins = $sessionStore!.sessionDurationMins
        lastFinishedPeriodIdx = $sessionStore!.lastFinishedPeriodIdx
        state = $sessionStore!.state

        requestAnimationFrame(() => upateGradientWidth())
    }

    function upateGradientWidth() {
        if (!progressLineElement || !containerElement) return

        const progressWidth = progressLineElement.clientWidth
        const containerWidth = containerElement.clientWidth
        const ballProgressPerc = (progressWidth / containerWidth) * 100

        // Left Gradient
        leftGradientWidth = Math.min(GRADIENT_DEFAULT_WIDTH, progressWidth)
        leftGradientWidth = state === SessionState.FINISHED ? GRADIENT_DEFAULT_WIDTH : leftGradientWidth

        // Right Gradient)
        if (state === SessionState.FINISHED) {
            rightGradientWidth = 100
        }
        else if (ballProgressPerc >= RIGHT_GRADIENT_START_PERCCENT) {
            rightGradientWidth = ballProgressPerc + 1
        }
        else {
            rightGradientWidth = RIGHT_GRADIENT_START_PERCCENT
        }
    }

    onMount(() => {
        if (!$sessionStore) return

        const timePeriod = $sessionStore!.timePeriodString.split(" - ")
        startTimeStr = timePeriod[0]
        endTimeStr = timePeriod[1]

        segments = makeProgressVisualParts($sessionStore!, sessDurationMins)
        requestAnimationFrame(() => upateGradientWidth())

        GRADIENT_DEFAULT_WIDTH = isForHeader ? HEADER_DEFAULT_GRADIENT_WIDTH : BASE_DEFAULT_GRADIENT_WIDTH
    })
</script>

<div class={`session-progress ${!isForHeader ? "session-progress--home" : ""} ${$themeState?.isDarkTheme ? "" : "session-progress--light"}`}>
    <span class="session-progress__time session-progress__time--start">{startTimeStr}</span>
    <div 
        bind:this={containerElement}
        bind:clientWidth={currProgressWidth}
        class="session-progress__container" 
        style={`
                -webkit-mask-image: linear-gradient(90deg, transparent 0px, black ${leftGradientWidth}px, black ${rightGradientWidth}%, transparent 100%);
                mask-image: linear-gradient(90deg, transparent 0px, black ${leftGradientWidth}px, black ${rightGradientWidth}%, transparent 100%);
        `}
    >
        {#each segments as segment}
            {#if $sessionStore && segment.type === ProgressVisualPartType.CHECKPOINT}
                <div 
                    id={`${segment.segmentIdx}`}
                    class={`session-progress__checkpoint ${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? "session-progress__checkpoint--finished" : ""}`} 
                    style={`
                                left: ${segment.offSetPerc}%;
                                ${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? 
                                        `background-color: var(--${isForHeader ? HEADER_PROGRESS_COLOR_1 : BASE_PROGRESS_COLOR_1 })` : ""
                                }
                          `}
                >
                    <div class="session-progress__checkpoint-container">
                        <div class="session-progress__checkpoint-inside"></div>
                        <div class="session-progress__checkpoint-check-mark">
                            <i class="fa-solid fa-check"></i>
                        </div>
                    </div>
                </div>
            {:else if $sessionStore && segment.widthPerc}
                <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                <div 
                    class={`session-progress__track-line ${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? "session-progress__track-line--finished" : ""}`}
                    id={`${segment.segmentIdx}`}
                    style={`width: ${segment.widthPerc}%; left: ${segment.offSetPerc}%;`}
                    on:mouseover={(e) => onMouseOverProgressLine(e, isForHeader)}
                    on:mouseleave={(e) => onMouseLeaveProgressLine(e, isForHeader)}
                >
                    <svg 
                        class="session-progress__track-line-svg" xmlns="http://www.w3.org/2000/svg" fill="none"
                        width={`${currProgressWidth * (segment.widthPerc / 100)}`} height="1.5" viewBox={`0 0 ${currProgressWidth * (segment.widthPerc / 100)} 1.5`}
                    >
                        <path 
                            d={`M0 1 L${currProgressWidth * (segment.widthPerc / 100)} 1`}
                            stroke={`
                                        ${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? 
                                                `var(--${isForHeader ? HEADER_PROGRESS_COLOR_1 : BASE_PROGRESS_COLOR_1})` :  
                                                `var(--${isForHeader ? HEADER_TRACK_COLOR_1 : BASE_TRACK_COLOR_1})`
                                         }
                                   `}
                            stroke-width={`${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? "2" : "1.2"}`}
                            stroke-dasharray={`${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? "0" : "2 2"}`}
                        />
                    </svg>
                    <div class="session-progress__track-line-tooltip">
                        {#if segment.type === ProgressVisualPartType.FOCUS}
                            <span>{$sessionStore.pomTime}:00</span>
                        {:else}
                            <span>{$sessionStore.breakTime}:00</span>
                        {/if}
                        <div class="session-progress__track-line-tooltip-svg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="24" viewBox="0 0 44 24" fill="none">
                                <path d="M29.3673 6.46283C27.2971 6.39923 21.7796 5.7369 21.3909 0.248535C21.0022 5.7369 15.4847 6.39923 13.4144 6.46283H29.3673Z"/>
                                <path d="M43.2988 14.6236C43.2988 19.2884 39.5173 23.0699 34.8525 23.0699L9.08692 23.0699C4.42216 23.0699 0.640625 19.2884 0.640625 14.6236C0.640625 9.95884 4.42216 6.17731 9.08691 6.17731L34.8525 6.17731C39.5173 6.17731 43.2988 9.95884 43.2988 14.6236Z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            {/if}
        {/each}
        {#if $sessionStore?.currentTime}
            <div 
                class="session-progress__progress-line" 
                style={`width: ${state === SessionState.FINISHED ? "100" : Math.max(((((currTimeSecs / 60) / sessDurationMins) * 100) - 0.4), 0)}%`}
                bind:this={progressLineElement}
            >
            </div>
            <div 
                class="session-progress__progress-ball" 
                style={`left: ${state === SessionState.FINISHED ? "100" : Math.max(((((currTimeSecs / 60) / sessDurationMins) * 100) - 0.4), 0)}%`}>
            </div>
        {/if}
    </div>
    <span class="session-progress__time session-progress__time--end">{endTimeStr}</span>
</div>


<style lang="scss">
    .session-progress {
        width: 100%;
        position: relative;
        height: 10px;
        @include flex(center, center);
        z-index: 2;

        &--home &__container {
            height: 65px;
        }
        &--home &__time {
            opacity: 1;
            visibility: visible;
        }
        &--home &__track-line-tooltip {
            top: 30px;
            font-size: 1.15rem;
        }
        &--home &__checkpoint {
            border: 1px solid var(--baseTrackColor1);
            background-color: var(--bg-1);
            
            &--finished {
                margin-bottom: 0px;
                @include circle(5px);
                background-color: var(--baseProgressColor1);
            }
            &-inside {
                background-color: var(--baseTrackColor1);
            }
            &-check-mark {
                top: -18px;

                color: var(--baseProgressColor1);
            }
            i {
                font-size: 1rem;
            }
        }
        &--home &__progress-line {
            background-color: var(--baseProgressColor1);
            height: 2px;
        }
        &--home &__progress-ball {
            margin-top: 1px;
            background-color: var(--baseProgressColor1);
            top: 28.5px;
        }
        &--home &__checkpoint {
            background-color: var(--bg-1);
            border: 1px solid var(--baseTrackColor1);
        }
        &--light &__progress-line {
            height: 2px;
        }
        &--light &__track-line-tooltip span {
            font-weight: 500;
        }
        &--light &__time {
            font-weight: 500;
            @include txt-color(0.4);
        }

        &__time {
            opacity: 0;
            visibility: hidden;
            @include text-style(0.45, 400, 1.2rem, "DM Sans");

            &--start {
                @include abs-top-left(22px, 7px);
            }
            &--end {
                @include abs-top-right(22px, 7px);
            }
        }
        &__container {
            width: 100%;
            position: relative;
            display: flex;
            align-items: center;
            height: 55px;
        }
        &__track-line {
            height: 20px;
            position: absolute;
            z-index: 1;
            cursor: pointer;

            svg {
                @include abs-top-left(50%, 0px);
                transform: translateY(-50%);
            }
            &:hover &-tooltip {
                opacity: 1;
                visibility: visible;
            }
            &--finished {
                z-index: 4;
            }
        }

        &__track-line-tooltip {
            opacity: 0;
            visibility: hidden;
            transition: 0.12s ease-in-out;
            text-align: center;
            @include flex(center, center);
            @include abs-center;
            white-space: nowrap;
            width: auto;
            font-size: 0.9rem;
            top: 25px;
            z-index: 100;
            
            &-svg {
                position: relative;
            }
            svg {
                @include abs-center;
                fill: var(--pomToolTipBgColor);
            }
            path {
                fill: var(--pomToolTipBgColor);
            z-index: 99999999;

            }
            span {
                display: block;
                z-index: 100;
                font-family: "DM Sans";
                @include abs-center;
                @include text-style(_, 300, 1.05rem);
                color: var(--pomToolTipTextColor);
                top: 3px;
                cursor: text;
            }
            i {
                display: none;
                font-size: 0.8rem;
                margin-right: 4px;
                z-index: 100;
            }
        }
        &__progress-line {
            background-color: var(--headerProgressColor1);
            width: 20%;
            height: 1px;
            z-index: 2;
            @include abs-top-left(50%, 0px);
            transform: translateY(-50%);
        }
        &__progress-ball {
            @include circle(6px);
            position: absolute;
            top: 24px;
            z-index: 200;
            box-shadow: var(--progressBallGlow);
            background-color: var(--headerProgressColor1);
        }
        &__checkpoint {
            @include circle(7px);
            border: 1px solid var(--headerTrackColor1);
            background-color: var(--headerBgColor);
            position: absolute;
            transition: 0.1s ease-in-out;
            z-index: 7;
            margin: 0px 0px 0px -1px;
            
            &-container {
                @include flex(center, center);
                width: 100%;
                height: 100%;
                border-radius: 100%;
            }
            &-inside {
                @include circle(2px);   
                background-color: var(--headerTrackColor1);
            }
            &-check-mark {
                visibility: hidden;
                color: var(--headerProgressColor1);
                opacity: 0;
                z-index: 0;
                position: absolute;
                top: -14.5px;

                i {
                    font-size: 0.6rem;
                }
            }
            &--finished {
                @include circle(4px);
                background-color: var(--headerProgressColor1);
                border: 0 !important;
            }
            &--finished &-container {
                background-color: transparent;
            }
            &--finished &-check-mark {
                visibility: visible;
                opacity: 1;
            }
            &--finished &-inside {
                opacity: 0;
                visibility: hidden;
            }
        }
    }
</style>