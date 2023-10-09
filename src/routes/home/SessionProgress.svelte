<script lang="ts">
	import { SessionState } from "$lib/enums";
	import { sessionStore, themeState } from "$lib/store"
	import { getThemeStyling } from "$lib/utils-appearance";
	import { createProgressSegments, onMouseLeave, onMouseOver } from "$lib/utils-session";
	import { onMount } from "svelte"

    enum SemgnentType {
        FOCUS, BREAK, CHECKPOINT
    }
    type Segment = {
        type: SemgnentType
        offSetPerc: number,
        widthPerc: number | null, 
        periodIdx: number,
        segmentIdx: number
    }
    type BacklineColorOptions = {
        dotted: {
            default: string,
            active: string
        },
        solid: {
            default: string,
            active: string
        },
    }
    let backLineColorOptions: BacklineColorOptions

    export let isForHeader: boolean = true

    let progressLineElement: HTMLElement | null = null
    let containerElement: HTMLElement | null = null

    let segments: Segment[] = []
    let lastFinishedPeriodIdx = -1

    const GRADIENT_DEFAULT_WIDTH = 40
    const RIGHT_GRADIENT_SHIFT_POINT = 50
    const RIGHT_GRADIENT_DISTANCE_FROM_BALL = 10
    let leftGradientWidth = GRADIENT_DEFAULT_WIDTH
    let rightGradientWidth = GRADIENT_DEFAULT_WIDTH
    let totalSecs = 0
    let totalMins = 0

    $: {
        totalSecs = $sessionStore!.totalSeconds
        totalMins = $sessionStore!.totalMins
        lastFinishedPeriodIdx = $sessionStore!.lastFinishedPeriodIdx

        upateGradientWidth()
    }


    const upateGradientWidth = () => {
        if (!progressLineElement || !containerElement) return

        const progressWidth = progressLineElement.clientWidth
        const containerWidth = containerElement.clientWidth
        const ballDinstanceFromEnd = containerWidth - progressWidth

        // Left Gradient
        leftGradientWidth = Math.min(GRADIENT_DEFAULT_WIDTH, progressWidth + 15)

        // Right Gradient
        if ($sessionStore!.state === SessionState.FINISHED) {
            rightGradientWidth = 0
        }
        else if (ballDinstanceFromEnd <= RIGHT_GRADIENT_SHIFT_POINT) {
            rightGradientWidth = Math.max(ballDinstanceFromEnd - RIGHT_GRADIENT_DISTANCE_FROM_BALL, 0)
        }
        else {
            rightGradientWidth = GRADIENT_DEFAULT_WIDTH
        }
    }

    const _onMouseOver = (event: Event) => onMouseOver(event, backLineColorOptions)
    const _onMouseLeave = (event: Event) => onMouseLeave(event, backLineColorOptions)

    onMount(() => {
        if (!$sessionStore) return

        segments = createProgressSegments($sessionStore!, totalMins)
        upateGradientWidth()

        backLineColorOptions = {
            solid: {
                default: getThemeStyling("headerSessionBaseColor"),
                active: getThemeStyling("headerSessionAccentColor1")
            },
            dotted: {
                default: getThemeStyling("headerSessionAccentColor3"),
                active: getThemeStyling("headerSessionAccentColor2")
            }
        }

    })
</script>

<div class={`session-progress ${isForHeader ? "session-progress--header" : ""} ${$themeState?.isDarkTheme ? "" : "session-progress--light"}`}>
    <span class="session-progress__time session-progress__time--start">1:34 PM</span>
    <div class="session-progress__container" bind:this={containerElement}>
        <div 
            class="gradient-container gradient-container--left"
            style={`width: ${leftGradientWidth}px;`}
        >
        </div>
        {#each segments as segment}
            {#if $sessionStore && segment.type === SemgnentType.CHECKPOINT}
                <div 
                    id={`${segment.segmentIdx}`}
                    class={`session-progress__checkpoint ${lastFinishedPeriodIdx >= 0 && segment.periodIdx <= lastFinishedPeriodIdx ? "session-progress__checkpoint--finished" : ""}`} 
                    style={`left: ${segment.offSetPerc}%;`}
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
                    class={`session-progress__back-line ${lastFinishedPeriodIdx >= 0 && segment.periodIdx <= lastFinishedPeriodIdx ? "session-progress__back-line--finished" : ""}`}
                    id={`${segment.segmentIdx}`}
                    style={`width: ${segment.widthPerc}%; left: ${segment.offSetPerc}%;`}
                    on:mouseover={(e) => _onMouseOver(e)}
                    on:mouseleave={(e) => _onMouseLeave(e)}
                >
                    <svg class="session-progress__back-line-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="1.5" fill="none">
                        <path 
                            d="M0 1.1 L300 0"
                            stroke={`${lastFinishedPeriodIdx >= 0 && segment.periodIdx <= lastFinishedPeriodIdx ? backLineColorOptions.solid.default :  backLineColorOptions.dotted.default}`}
                            stroke-width={`${lastFinishedPeriodIdx >= 0 && segment.periodIdx <= lastFinishedPeriodIdx ? "2" : "1.2"}`}
                            stroke-dasharray={`${lastFinishedPeriodIdx >= 0 && segment.periodIdx <= lastFinishedPeriodIdx ? "0" : "2 2"}`}
                        />
                    </svg>
                    <div class="session-progress__back-line-icon">
                        {#if segment.type === SemgnentType.FOCUS}
                            <i class="fa-brands fa-readme"></i>
                            <span>{$sessionStore.pomTime} m</span>
                        {:else}
                            <i class="fa-solid fa-seedling"></i>
                            <span>{$sessionStore.breakTime} m</span>
                        {/if}
                    </div>
                </div>
            {/if}
        {/each}
        {#if $sessionStore?.currentTime}
            <div 
                class="session-progress__progress-line" 
                style={`width: ${(((totalSecs / 60) / totalMins) * 100) + 0.7}%`}
                bind:this={progressLineElement}
            >
            </div>
            <div 
                class="session-progress__progress-ball" 
                style={`left: ${(((totalSecs / 60) / totalMins) * 100) + 0.7}%`}>
            </div>
        {/if}
        <div 
            class="gradient-container gradient-container--right"
            style={`width: ${rightGradientWidth}px;`}
        >
        </div>
    </div>
    <span class="session-progress__time session-progress__time--end">2:34 PM</span>
</div>


<style lang="scss">
    .session-progress {
        width: 100%;
        @include flex-container(center, center);
        position: relative;
        height: 10px;

        &--light {

        }
        // &:hover &__time {
        //     opacity: 1;
        //     visibility: visible;
        // }

        &__time {
            opacity: 0;
            visibility: hidden;
            font-weight: 300;
            font-size: 0.85rem;
            color: rgba(var(--textColor1), 0.17);

            &--start {
                @include pos-abs-top-left-corner(11px, 0px);
            }
            &--end {
                @include pos-abs-top-right-corner(11px, 0px);
            }
        }
        &__container {
            width: 100%;
            height: 20px;
            position: relative;
            display: flex;
            align-items: center;
        }
        &__back-line {
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

        &__back-line-icon {
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
            background-color: var(--headerSessionBaseColor);
            width: 20%;
            height: 1.5px;
            @include pos-abs-top-left-corner(50%, 0px);
            z-index: 2;
        }
        &__progress-ball {
            background-color: var(--headerSessionBaseColor);
            @include circle(6px);
            @include abs-center;
            box-shadow: 0px 0px 9px 2px rgba(255, 255, 255, 0.18);
            z-index: 200;
        }
        &__checkpoint {
            @include circle(7px);
            border: 1px solid var(--headerSessionAccentColor3);
            position: absolute;
            transition: 0.1s ease-in-out;
            z-index: 7;
            margin-left: -1px;
            
            &-container {
                @include flex-container(center, center);
                background-color: var(--headerElementBgColor);
                width: 100%;
                height: 100%;
                border-radius: 100%;
            }
            &-inside {
                @include circle(2px);   
                background-color: var(--headerSessionAccentColor3);
            }
            &-check-mark {
                visibility: hidden;
                opacity: 0;
                z-index: 0;
                position: absolute;
                top: -15px;

                i {
                    font-size: 0.8rem;
                }
            }
            &--finished {
                @include circle(5px);
                background-color: white;
                border: 0;
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
    }
</style>