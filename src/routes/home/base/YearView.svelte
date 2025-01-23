<script lang="ts">
    import { onMount } from "svelte"

	import { getMaskedGradientStyle } from "../../../lib/utils-general"

    import TextEntry from "./TextEntry.svelte"
    import HeatMap from "../../../components/HeatMap.svelte"
	import { TEST_GOALS, YEAR_THOUGHT_ENTRY } from "../../../lib/mock-data"

    const SMALL_WIDTH = 700

    let width = 0
    let gradient = ""
    let goalsListRef: HTMLElement | null = null

    function handleScroll(elem: HTMLElement) {
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
    class:yr-view--small={width < SMALL_WIDTH}
    bind:clientWidth={width}
>
    <h1>
        {YEAR_THOUGHT_ENTRY.date.getFullYear()}
    </h1>
    <TextEntry 
        id="yr"
        entry={YEAR_THOUGHT_ENTRY}
    />
    <div class="yr-view__goals">
        <h4>Goals</h4>
        <div class="divider"></div>
        <div class="yr-view__goals-flx">
            <div 
                style={gradient}
                class="yr-view__goals-list"
                bind:this={goalsListRef}
                on:scroll={() => handleScroll(goalsListRef)}
            >
                {#each TEST_GOALS as goal}
                    {@const done = goal.status === "accomplished"}
                    <div class="goal-m">
                        <div class="goal-m__left">
                            {#if done}
                                <div class="goal-m__check">
                                    <i class="fa-solid fa-check"></i>
                                </div>
                            {:else}
                                <div class="goal-m__bullet"></div>
                            {/if}
                        </div>
                        <div class="goal-m__right">
                            <div 
                                class="goal-m__title"
                                class:strike={done}
                                title={goal.name}
                            >
                                {goal.name}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
            <div class="yr-view__goals-right">
                <div class="yr-view__stats" style:margin="0px">
                    <div class="yr-view__stat">
                        <div class="yr-view__stat-title">
                            Progress
                        </div>
                        <div class="yr-view__stat-num">
                            28%
                        </div>
                    </div>
                    <div class="yr-view__stat">
                        <div class="yr-view__stat-title">
                            Accomplished
                        </div>
                        <div class="yr-view__stat-num">
                            5 Done
                        </div>
                    </div>
                    <div class="yr-view__stat">
                        <div class="yr-view__stat-title">
                            Remaining
                        </div>
                        <div class="yr-view__stat-num">
                            15 Left
                        </div>
                    </div>
                </div>
                <div class="yr-view__heat-map">
                    <HeatMap id={"0"} type="goals" />
                </div>
            </div>
        </div>
    </div>
    <div class="yr-view__habits">
        <h4>Habits</h4>
        <div class="divider"></div>
        <div class="yr-view__stats" style:margin-top="10px">
            <div class="yr-view__stat">
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
            <HeatMap id={"0"} type="habits" />
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../scss/goals.scss";

    .yr-view {
        &--small &__goals-flx {
            display: block;
        }
        &--small &__goals-list {
            max-height: 400px;
            margin: 0px 0px 18px 0px;
        }
        &--small &__goals &__stats {
            display: none;
        }
        &--small &__goals-right {
            max-height: 400px;
            height: auto;
            margin: 0px 0px 16px 0px;
        }

        h1 {
            @include text-style(1, 400, 2.5rem, "DM Mono");
            margin-bottom: 5px;
            display: none;
        }
        h4 {
            @include text-style(1, 400, 1.55rem, "Geist Mono");
        }
        &__goals {
            .yr-view__stat {
                margin-right: min(12%, 55px);
            }
        }
        &__goals-flx {
            display: flex;
            margin-top: 11px;
        }
        &__goals-list {
            max-height: 280px;
            overflow-y: scroll;
            margin: 2px 0px 5px -4px;
            padding-right: 65px;
        }
        &__goals-right {
            flex: 1;
            overflow: hidden;
            margin-top: 2px;
            height: 235px;
            @include flex-col(space-between);
        }
        &__habits {
            margin-top: 10px;
        }
        &__heat-map {
            width: 100%;
        }
        &__stats {
            margin: 8px 0px 22px 0px;
            @include flex(center);
        }
        &__stat {
            margin-right: min(5%, 50px);
        }
        &__stat-title {
            @include text-style(0.3, 400, 1.4rem, "Geist Mono");
            margin-bottom: 6.5px;
            white-space: nowrap;            
        }
        &__stat-num {
            @include text-style(0.8, 400, 1.4rem, "Geist Mono");
        }
    }

    .divider {
        background-color: rgba(var(--textColor1), 0.035);
        width: 100%;
        height: 1px;
        margin: 10px 0px 4px 0px;
    }

    .goal-m {
        margin-bottom: 9px;

        &__title {
            @include truncate-lines(1);
        }
        &__left {
            margin-left: 0px;
        }
    }
</style>