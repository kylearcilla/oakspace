<script lang="ts">
	import { habitTracker } from "../lib/store";
	import ProgressRing from "./ProgressRing.svelte"
	import { formatDatetoStr } from "../lib/utils-date"
	import { getMonthHeatMap } from "../lib/utils-habits"

    let heatMap: HabitHeatMapDay[] = []

    habitTracker.subscribe(() => {
        heatMap = getMonthHeatMap({ monthIdx: 0, year: 2025 })
    })
</script>

<div class="cal">
    <div class="cal__days">
        <div class="cal__dow">S</div>
        <div class="cal__dow">M</div>
        <div class="cal__dow">T</div>
        <div class="cal__dow">W</div>
        <div class="cal__dow">T</div>
        <div class="cal__dow">F</div>
        <div class="cal__dow">S</div>
    </div>
    <div class="cal__grid">
        {#each heatMap as day}
            {@const date   = day.date.getDate()}
            {@const sameMonth = day.isInCurrMonth}
            <div
                title={formatDatetoStr(day.date)}
                class="cal__day"
                class:cal__day--beyond={!sameMonth}
            >
                {#if sameMonth}
                    {@const { done, due } = day}
                    <div style:margin="0px 0px 0px 3px">
                        <ProgressRing
                            progress={done / due} 
                            options={{
                                size: 14, strokeWidth: 3.2, style: "light"
                            }}
                        />
                    </div>
                {:else}
                    <div class="cal__day-num">
                        {date}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .cal {
        width: 100%;

        &__days {
            @include flex(center, space-between);
            @include text-style(0.65, 400, 1.3rem, "Geist Mono");
            margin: 0px 2px 10px 0px;
        }
        &__dow {
            height: 25px;
            margin-left: 2px;
            @include center;
        }
        &__grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(6, 1fr);
        }
        &__day {
            height: 35px;
            width: 34px;
            margin: 0px 0px 0px 0px;
        }
        &__day--beyond {
            opacity: 0.095 !important;
        }
        &__day-num {
            @include text-style(1, 400, 1.3rem, "DM Sans");
            margin-left: 4px;
        }
    }
</style>