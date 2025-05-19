<script lang="ts">
    import { getDayHabitsData } from "$lib/utils-habits"
	import { habitTracker, themeState } from "$lib/store"
    import { formatDatetoStr, genMonthCalendar, uptoToday } from "$lib/utils-date"

    import ProgressRing from "./ProgressRing.svelte"

    let weeklyHeatMap: { date: Date; isInCurrMonth: boolean }[][] = []

    $: isLight = !$themeState.isDarkTheme

    habitTracker.subscribe(() => {
        const date = new Date()
        const calMonth = genMonthCalendar(date).days

        weeklyHeatMap = []
        for (let i = 0; i < calMonth.length; i += 7) {
            weeklyHeatMap.push(calMonth.slice(i, i + 7))
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
                    {@const data = getDayHabitsData(day.date)}
                    {@const date = day.date.getDate()}
                    {@const inBounds = day.isInCurrMonth && uptoToday(day.date)}
                    <div
                        title={formatDatetoStr(day.date)}
                        class="cal__day"
                        class:cal__day--beyond={!inBounds}
                    >
                        {#if inBounds && data && data.due > 0}
                            {@const { due, done } = data}
                            <ProgressRing
                                progress={done / due}
                                options={{
                                    size: 15, strokeWidth: 3.5, style: "default"
                                }}
                            />
                        {:else if inBounds && $habitTracker.habits.length === 0}
                            <ProgressRing
                                progress={0}
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
            @include text-style(0.65, var(--fw-400-500), 1.2rem);
            margin: 0px 4px 10px 0px;
        }
        &__dow {
            height: 20px;
            margin-left: 2px;
            @include center;
        }
        &__week {
            @include flex(center, space-between);
            width: 100%;
        }
        &__day {
            height: 30px;
            width: 15px;
        }
        &__day--beyond {
            opacity: var(--obscure-opacity) !important;
        }
        &__day-num {
            @include text-style(1, var(--fw-400-500), 1.2rem);
            text-align: center;
        }
    }
</style>