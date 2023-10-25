<script lang="ts">
    import { onMount } from "svelte"
	import { ProgressVisualPartType, SessionState } from "$lib/enums"
	import { sessionStore, themeState } from "$lib/store"
	import { 
            makeProgressVisualParts, onMouseLeaveProgressLine, onMouseOverProgressLine,
            BASE_PROGRESS_COLOR_1, BASE_TRACK_COLOR_1, HEADER_PROGRESS_COLOR_1, HEADER_TRACK_COLOR_1
    } from "$lib/utils-session"

    export let isForHeader: boolean = true

    let progressLineElement: HTMLElement | null = null
    let containerElement: HTMLElement | null = null

    let segments: ProgressVisualPart[] = []
    let lastFinishedPeriodIdx = -1

    let GRADIENT_DEFAULT_WIDTH = 0
    const HEADER_DEFAULT_GRADIENT_WIDTH = 40
    const BASE_DEFAULT_GRADIENT_WIDTH = 100
    const RIGHT_GRADIENT_SHIFT_POINT = GRADIENT_DEFAULT_WIDTH + 10
    const RIGHT_GRADIENT_DISTANCE_FROM_BALL = 10
    
    let leftGradientWidth = GRADIENT_DEFAULT_WIDTH
    let rightGradientWidth = GRADIENT_DEFAULT_WIDTH

    let currTimeSecs = 0
    let sessDurationMins = 0
    let state: SessionState = SessionState.EMPTY
    let startTimeStr = ""
    let endTimeStr = ""

    $: {
        currTimeSecs = $sessionStore!.currentSessionTimeSecs
        sessDurationMins = $sessionStore!.sessionDurationMins
        lastFinishedPeriodIdx = $sessionStore!.lastFinishedPeriodIdx
        state = $sessionStore!.state

        requestAnimationFrame(upateGradientWidth)
    }

    const upateGradientWidth = () => {
        if (!progressLineElement || !containerElement) return

        const progressWidth = progressLineElement.clientWidth
        const containerWidth = containerElement.clientWidth
        const ballDinstanceFromEnd = containerWidth - progressWidth

        // Left Gradient
        leftGradientWidth = Math.min(GRADIENT_DEFAULT_WIDTH, progressWidth + 15)
        leftGradientWidth = state === SessionState.FINISHED ? GRADIENT_DEFAULT_WIDTH : leftGradientWidth

        // Right Gradient
        if (state === SessionState.FINISHED) {
            rightGradientWidth = 0
        }
        else if (ballDinstanceFromEnd <= RIGHT_GRADIENT_SHIFT_POINT) {
            rightGradientWidth = Math.max(ballDinstanceFromEnd - RIGHT_GRADIENT_DISTANCE_FROM_BALL, 0)
        }
        else {
            rightGradientWidth = GRADIENT_DEFAULT_WIDTH
        }
    }

    const _onMouseOverProgressLine = (event: Event) => onMouseOverProgressLine(event, isForHeader)
    const _onMouseLeaveProgressLine = (event: Event) => onMouseLeaveProgressLine(event, isForHeader)

    onMount(() => {
        if (!$sessionStore) return

        const timePeriod = $sessionStore!.timePeriodString.split(" - ")
        startTimeStr = timePeriod[0]
        endTimeStr = timePeriod[1]

        segments = makeProgressVisualParts($sessionStore!, sessDurationMins)
        upateGradientWidth()

        GRADIENT_DEFAULT_WIDTH = isForHeader ? HEADER_DEFAULT_GRADIENT_WIDTH : BASE_DEFAULT_GRADIENT_WIDTH
    })
</script>

<div class={`session-progress ${!isForHeader ? "session-progress--home" : ""} ${$themeState?.isDarkTheme ? "" : "session-progress--light"}`}>
    <span class="session-progress__time session-progress__time--start">{startTimeStr}</span>
    <div class="session-progress__container" bind:this={containerElement}>
        <div 
            class="gradient-container gradient-container--left"
            style={`width: ${leftGradientWidth}px;`}
        >
        </div>
        {#each segments as segment}
            {#if $sessionStore && segment.type === ProgressVisualPartType.CHECKPOINT}
                <div 
                    id={`${segment.segmentIdx}`}
                    class={`session-progress__checkpoint ${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? "session-progress__checkpoint--finished" : ""}`} 
                    style={`
                                left: ${segment.offSetPerc}%;
                                ${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? 
                                        `background-color: var(--${isForHeader ? HEADER_PROGRESS_COLOR_1 : BASE_PROGRESS_COLOR_1 })` : 
                                        ""
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
            {:else if $sessionStore}
                <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                <div 
                    class={`session-progress__track-line ${state === SessionState.FINISHED || segment.periodIdx <= lastFinishedPeriodIdx ? "session-progress__track-line--finished" : ""}`}
                    id={`${segment.segmentIdx}`}
                    style={`width: ${segment.widthPerc}%; left: ${segment.offSetPerc}%;`}
                    on:mouseover={(e) => _onMouseOverProgressLine(e)}
                    on:mouseleave={(e) => _onMouseLeaveProgressLine(e)}
                >
                    <svg class="session-progress__track-line-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="1.5" fill="none">
                        <path 
                            d="M0 1 L300 1"
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
                    <div class="session-progress__track-line-icon">
                        {#if segment.type === ProgressVisualPartType.FOCUS}
                            <i class="fa-brands fa-readme"></i>
                            <span>{$sessionStore.pomTime}:00</span>
                        {:else}
                            <i class="fa-solid fa-seedling"></i>
                            <span>{$sessionStore.breakTime}:00</span>
                        {/if}
                    </div>
                </div>
            {/if}
        {/each}
        {#if $sessionStore?.currentTime}
            <div 
                class="session-progress__progress-line" 
                style={`width: ${state === SessionState.FINISHED ? "100" : ((((currTimeSecs / 60) / sessDurationMins) * 100) + 0.4)}%`}
                bind:this={progressLineElement}
            >
            </div>
            <div 
                class="session-progress__progress-ball" 
                style={`left: ${state === SessionState.FINISHED ? "100" : ((((currTimeSecs / 60) / sessDurationMins) * 100) + 0.4)}%`}>
            </div>
        {/if}
        <div 
            class="gradient-container gradient-container--right"
            style={`width: ${rightGradientWidth}px;`}
        >
        </div>
    </div>
    <span class="session-progress__time session-progress__time--end">{endTimeStr}</span>
</div>


<style lang="scss">
    .session-progress {
        width: 100%;
        @include flex-container(center, center);
        position: relative;
        height: 10px;

        .gradient-container {
            visibility: visible;
            opacity: 1;
            height: 5px;
            z-index: 5;
            top: 40%;
            
            &--left {
                background: linear-gradient(90deg, var(--headerElementBgColor) 0%, transparent);
            }
            &--right {
                width: 40px;
                background: linear-gradient(270deg, var(--headerElementBgColor) 20%, transparent);
            }
        }

        &--home {
            .gradient-container {
                &--left {
                    background: linear-gradient(90deg, var(--primaryBgColor) 0%, transparent);
                }
                &--right {
                    width: 40px;
                    background: linear-gradient(270deg, var(--primaryBgColor) 20%, transparent);
                }
            }
        }
        &--home &__time {
            opacity: 1;
            visibility: visible;
        }
        &--home &__track-line-icon {
            top: -7px;
            font-size: 1.15rem;
        }
        &--home &__checkpoint {
            @include circle(8px);
            border: 1px solid var(--baseTrackColor1);
            background-color: var(--primaryBgColor);
            
            &--finished {
                margin-bottom: -1px;
                @include circle(5px);
                background-color: var(--baseProgressColor1);
            }
            &-inside {
                background-color: var(--baseTrackColor1);
                @include circle(2px);
            }
            &-check-mark {
                top: -18px;
            }
            i {
                font-size: 1.2rem;
            }
        }
        &--home &__progress-line {
            background-color: var(--baseProgressColor1);
        }
        &--home &__progress-ball {
            margin-top: 1px;
            background-color: var(--baseProgressColor1);
        }
        &--home &__checkpoint {
            background-color: var(--primaryBgColor);
            border: 1px solid var(--baseTrackColor1);
        }
        &--light &__track-line-icon span {
            font-weight: 600;
        }
        &--light &__time {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.4);
        }

        &__time {
            opacity: 0;
            visibility: hidden;
            font-weight: 400;
            font-size: 1.2rem;
            color: rgba(var(--textColor1), 0.3);

            &--start {
                @include pos-abs-top-left-corner(22px, 7px);
            }
            &--end {
                @include pos-abs-top-right-corner(22px, 7px);
            }
        }
        &__container {
            width: 100%;
            height: 20px;
            position: relative;
            display: flex;
            align-items: center;
        }
        &__track-line {
            height: 20px;
            position: absolute;
            z-index: 1;
            cursor: pointer;

            svg {
                @include pos-abs-top-left-corner(50%, 0px);
            }

            &:hover &-icon {
                opacity: 1;
                visibility: visible;
            }
            &--finished {
                z-index: 4;
            }
        }

        &__track-line-icon {
            opacity: 0;
            transition: 0.12s ease-in-out;
            visibility: hidden;
            text-align: center;
            @include flex-container(center, center);
            @include abs-center;
            white-space: nowrap;
            width: auto;
            top: 0.5px;
            color: rgba(var(--textColor1), 0.3);
            font-size: 0.9rem;
            z-index: 100;
            
            span {
                display: block;
                z-index: 100;
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
            height: 1.5px;
            @include pos-abs-top-left-corner(50%, 0px);
            z-index: 2;
        }
        &__progress-ball {
            background-color: var(--headerProgressColor1);
            @include circle(6px);
            @include abs-center;
            box-shadow: var(--progressBallGlow);
            z-index: 200;
        }
        &__checkpoint {
            @include circle(7px);
            border: 1px solid var(--headerTrackColor1);
            background-color: var(--headerElementBgColor);
            position: absolute;
            transition: 0.1s ease-in-out;
            z-index: 7;
            margin: 1px 0px 0px -1px;
            
            &-container {
                @include flex-container(center, center);
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
                top: -15px;

                i {
                    font-size: 0.8rem;
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