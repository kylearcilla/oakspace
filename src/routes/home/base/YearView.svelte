<script lang="ts">
    import { onMount } from "svelte"

	import { getMaskedGradientStyle } from "../../../lib/utils-general"

    import TextEntry from "./TextEntry.svelte"
    import HeatMap from "../../../components/HeatMap.svelte"
	import { TEST_GOALS, YEAR_THOUGHT_ENTRY } from "../../../lib/mock-data"
	import ProgressBar from "../../../components/ProgressBar.svelte";
	import { themeState } from "../../../lib/store";

    export let options: {
        yearsAgoIdx: number
        showTextEntry: boolean
        showYear: boolean
        emojis: boolean
    }
    $: showTextEntry = options.showTextEntry
    $: showYear = options.showYear
    $: isLight = !$themeState.isDarkTheme

    const SMALL_WIDTH = 700
    let date = new Date(2025, 0, 1)
    let width = 0
    let gradient = ""
    let goalsListRef: HTMLElement | null = null

    function handleScroll(elem: HTMLElement | null) {
        if (!elem) return

        const { styling } = getMaskedGradientStyle(elem, {
            head: {
                end: "50px"
            },
            tail: {
                start: "50%",
                end: "100%"
            }
        })
        gradient = styling
    }

    onMount(() => handleScroll(goalsListRef))
</script>

<div 
    class="yr-view"
    class:yr-view--light={isLight}
    class:yr-view--small={width < SMALL_WIDTH}
    bind:clientWidth={width}
>
    {#if showYear}
        <h1>
            {YEAR_THOUGHT_ENTRY.date.getFullYear()}
        </h1>
    {/if}
    {#if showTextEntry}
        <div style:margin="0px 0px 0px 0px">
            <TextEntry 
                id="yr"
                zIndex={50}
                entry={YEAR_THOUGHT_ENTRY}
            />
        </div>
    {/if}
    <div class="yr-view__goals">
        <div class="yr-view__header">
            <h4>Goals</h4>
            <div class="yr-view__progress">
                <ProgressBar progress={0.3} />
                <span>3 of 10</span>
            </div>
        </div>
        <div class="divider"></div>
        <div class="yr-view__heat-map" style:margin-top="15px">
            <HeatMap 
                id={"0"} 
                type="goals" 
                options={{
                    startDate: date, from: "next", emojis: options.emojis
                }}
            />
        </div>
    </div>
    <div class="yr-view__habits">
        <h4>Habits</h4>
        <div class="divider"></div>
        <div class="yr-view__stats" style:margin-top="10px">
            <div class="yr-view__stat" style:margin-right="40px">
                <div class="yr-view__stat-title">
                    Consistency
                </div>
                <div class="yr-view__stat-num">
                    28%
                </div>
            </div>
            <div class="yr-view__stat">
                <div class="yr-view__stat-title">
                    Perfect Days
                </div>
                <div class="yr-view__stat-num">
                    26
                </div>
            </div>
            <div class="yr-view__stat">
                <div class="yr-view__stat-title">
                    Longest Streak
                </div>
                <div class="yr-view__stat-num">
                    11
                </div>
            </div>
            <div class="yr-view__stat">
                <div class="yr-view__stat-title">
                    Skipped Days
                </div>
                <div class="yr-view__stat-num">
                    4
                </div>
            </div>
        </div>
        <div class="yr-view__heat-map">
            <HeatMap 
                id={"0"} 
                type="habits" 
                options={{ startDate: date, from: "next" }}
            />
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../scss/goals.scss";

    .yr-view {
        margin-top: 8px;

        &--light &__progress span {
            @include text-style(0.55);
        }
        &--light &__stat-title {
            @include text-style(0.45);
        }
        &--small &__goals-flx {
            display: block;
            margin-top: 13px;
        }
        &--small &__goals-list {
            max-height: 400px;
            margin: 0px 0px 18px 0px;
        }
        &--small &__goals-right {
            max-height: 400px;
            height: auto;
            margin: 0px 0px 0px 0px;
            width: 100%;
        }
        &--small &__habits {
            margin-top: 20px;
        }

        h1 {
            @include text-style(1, var(--fw-400-500), 2.25rem, "Geist Mono");
            margin: 11px 0px 4px 0px;
        }
        h4 {
            @include text-style(1, var(--fw-400-500), 1.65rem, "Geist Mono");
        }
        &__header {
            @include flex(center,space-between);
            width: 100%;
        }
        &__progress {
            display: flex;

            span {
                @include text-style(0.35, var(--fw-400-500), 1.25rem);
                margin: -2px 0px 0px 15px;
            }
        }
        &__goals {
            margin-top: 10px;
        }
        &__habits {
            margin-top: 30px;
        }
        &__heat-map {
            width: 100%;
        }
        &__stats {
            margin: 8px 0px 25px 0px;
            @include flex(center);
        }
        &__stat {
            margin-right: min(5%, 30px);
        }
        &__stat-title {
            @include text-style(0.35, var(--fw-300-400), 1.4rem, "Geist Mono");
            margin-bottom: 6.5px;
            white-space: nowrap;            
        }
        &__stat-num {
            @include text-style(0.8, var(--fw-400-500), 1.4rem, "Geist Mono");
        }
    }

    .divider {
        border-top: var(--divider-border);
        margin: 12px 0px 0px 0px;
    }

    .goal-m {
        margin-bottom: 6px;

        &__title {
            @include truncate-lines(1);
        }
        &__left {
            margin-left: 0px;
        }
    }
</style>