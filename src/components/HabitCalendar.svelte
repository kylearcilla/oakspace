<script lang="ts">
    import ProgressRing from "./ProgressRing.svelte"

    import { formatDatetoStr } from "$lib/utils-date"
	import { getHabitsMonthData } from "$lib/utils-habits"
	import { habitTracker, themeState } from "$lib/store"

    let heatMap: HabitHeatMapDay[] = []
    let weeklyHeatMap: HabitHeatMapDay[][] = []

    $: isLight = !$themeState.isDarkTheme

    habitTracker.subscribe(() => {
        const date = new Date()
        heatMap = getHabitsMonthData({ 
            monthIdx: date.getMonth(), year: date.getFullYear() 
        })
        weeklyHeatMap = []
        for (let i = 0; i < heatMap.length; i += 7) {
            weeklyHeatMap.push(heatMap.slice(i, i + 7))
        }
    })
</script>

<div class="cal" class:cal--light={isLight}>
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
        {#each weeklyHeatMap as week}
            <div class="cal__week">
                {#each week as day}
                    {@const date = day.date.getDate()}
                    {@const sameMonth = day.isInCurrMonth}
                    <div
                        title={formatDatetoStr(day.date)}
                        class="cal__day"
                        class:cal__day--beyond={!sameMonth}
                    >
                        {#if sameMonth}
                            {@const { done, due } = day}
                            <ProgressRing
                                progress={done / due}
                                options={{
                                    size: 15, strokeWidth: 3.5, style: "default"
                                }}
                            />
                        {:else}
                            <div class="cal__day-num">
                                {date}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .cal {
        width: 100%;
        --obscure-opacity: 0.135;

        &--light {
            --obscure-opacity: 0.45;
        }
        &--light &__days {
            @include text-style(0.9);
        }

        &__days {
            @include flex(center, space-between);
            @include text-style(0.65, var(--fw-400-500), 1.3rem);
            margin: 0px 4px 10px 0px;
        }
        &__dow {
            height: 25px;
            margin-left: 2px;
            @include center;
        }
        &__week {
            @include flex(center, space-between);
            width: 100%;
        }
        &__day {
            height: 35px;
            width: 15px;
        }
        &__day--beyond {
            opacity: var(--obscure-opacity) !important;
        }
        &__day-num {
            @include text-style(1, var(--fw-400-500), 1.3rem);
            text-align: center;
        }
    }
</style>