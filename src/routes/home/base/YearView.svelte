<script lang="ts">
	import { getMaskedGradientStyle } from "../../../lib/utils-general";
	import HeatMap from "../../../components/HeatMap.svelte"

    let heatMapContainer: HTMLElement
    let heatMapGradient = ""
    let heatMapLeftArrow = false
    let heatMapRightArrow = false

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

<div class="yr-view">
    <div class="yr-view__goals">
        <h4>Goals</h4>
        <div class="divider"></div>
        <div class="yr-view__stats">
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
    <div class="yr-view__habits">
        <h4>Habits</h4>
        <div class="divider"></div>
        <div class="yr-view__stats">
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
                    Longest Perfect Streak
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
    .yr-view {
        margin-top: 5px;
        h4 {
            @include text-style(1, 500, 1.65rem);
        }
        &__goals {
            margin-bottom: 20px;
            overflow: hidden;
        }
        &__habits {
            overflow: hidden;
            margin-top: 28px;
        }
        &__heat-map {
            width: 100%;
            overflow: scroll;
        }
        &__stats {
            margin: 8px 0px 22px 0px;
            @include flex(center);
        }
        &__stat {
            margin-right: min(5%, 50px);
        }
        &__stat-title {
            @include text-style(0.3, 500, 1.5rem);
            margin-bottom: 6.5px;
            white-space: nowrap;            
        }
        &__stat-num {
            @include text-style(0.8, 400, 1.5rem, "DM Sans");
        }
    }

    .divider {
        background-color: rgba(var(--textColor1), 0.035);
        width: 100%;
        height: 1px;
        margin: 6.5px 0px 10px 0px;
        // display: none;
    }
</style>