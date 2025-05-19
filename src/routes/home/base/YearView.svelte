<script lang="ts">
	import { getHabitsYearData } from "$lib/utils-habits"
    import { goalTracker, habitTracker, themeState } from "$lib/store"
	import { getGoalHeatMap, getPeriodData, getPinnedGoals, reorderPinned } from "$lib/utils-goals"
    
    import HeatMap from "$components/HeatMap.svelte"
    import TextEntryElem from "$components/TextEntry.svelte"
	import ProgressBar from "$components/ProgressBar.svelte"
	import PinnedGoals from "$components/PinnedGoals.svelte"

    export let year: number
    export let goalsHeatMap: YearHeatMapData[]
    export let options: YearViewOptions
    export let yearEntry: TextEntry | null

    const SMALL_WIDTH = 700

    let pinnedGoals: Goal[]
    let habits: Habit[]
    let habitsHeatMap: HabitHeatMapData[]
    let habitsMetrics: HabitYearMetrics
    let width = 0
    $: showTextEntry = options.showTextEntry
    $: showYear = options.showYear
    $: isLight = !$themeState.isDarkTheme

    $: onYearUpdate(year)

    $: console.log({ yearEntry })

    habitTracker.subscribe((data) => {
        habits = data.habits
        initHabitData()
    })
    goalTracker.subscribe(() => initGoalData())

    async function onYearUpdate(_: number) {
        initGoalData()
        initHabitData()
    }

    async function initHabitData() {
        const h_data = await getHabitsYearData(year)

        habitsMetrics = h_data.yearMetrics
        habitsHeatMap = h_data.yearHeatMap
    }

    function initGoalData() {
        goalsHeatMap = getGoalHeatMap(year)
        pinnedGoals = getPinnedGoals()

        const data = getPeriodData({ year: year, period: "all" })
    }

    function onPinnedGoalReorder(src: Goal, target: Goal) {
        reorderPinned(src, target)
        pinnedGoals = getPinnedGoals()
    }
</script>

<div 
    class="yr-view"
    class:yr-view--light={isLight}
    class:yr-view--small={width < SMALL_WIDTH}
    bind:clientWidth={width}
>
    {#if showYear}
        <h1>{year}</h1>
    {/if}
    {#if showTextEntry && yearEntry}
        {#key yearEntry}
            <div style:margin="-5px 0px -10px 0px">
                <TextEntryElem zIndex={50} entry={yearEntry}/>
            </div>
        {/key}
    {/if}
    <div class="yr-view__goals">
        <div class="flx-sb" style:display="none">
            <h4>Goals</h4>
            <div class="flx">
                <div class="yr-view__progress">
                    <ProgressBar progress={0.3} />
                    <div class="fraction">
                        {7}<div class="fraction__slash">/</div> {10}
                    </div>
                </div>
            </div>
        </div>
        {#if options.pinnedGoals}
            <div class="divider" class:hidden={!options.showYear && !options.showTextEntry}></div>
            <div style:margin="12px 0px 0px 0px">
                <PinnedGoals 
                    goals={pinnedGoals} 
                    onReorder={(src, target) => {
                        onPinnedGoalReorder(src, target)
                    }}
                />
            </div>
        {/if}
        <div class="yr-view__heat-map" style:margin-top="15px">
            <HeatMap 
                {year} 
                type="goals" 
                data={goalsHeatMap} 
                options={{ emojis: options.emojis }}
            />
        </div>
    </div>
    <div class="yr-view__habits">
        <div class="divider"></div>
        <div class="yr-view__txt">
            {#if year ===  new Date().getFullYear()}
                Your habit performance this year.
            {:else}
                Your habits performance for {year}.
            {/if}
        </div>
        {#if habitsMetrics && habits.length > 0}
            {@const { habitsDone, habitsDue, perfectDays, missed, longestStreak } = habitsMetrics}
            {@const zero = habitsDue === 0}

            <div class="yr-view__stats stats" class:stats--light={isLight}>
                <div class="stat" style:margin-right="35px">
                    <div class="stat__bottom">
                        <div class="flx">
                            <span class="stat__value">
                                {zero ? "--" : Math.floor((habitsDone / habitsDue) * 100)}
                            </span>
                            <span class="stat__unit" style:margin="0px 0px 0px 5px">
                                {zero ? "" : "%"}
                            </span>
                        </div>
                        <span class="stat__label">Consistency</span>
                    </div>                    
                </div>
                {#if longestStreak}
                    <div class="stat" style:margin-right="35px">
                        <div class="stat__bottom">
                            <div class="flx">
                                <span class="stat__value">
                                    {zero ? "--" : longestStreak.count}
                                </span>
                                <span class="stat__unit">
                                    {zero ? "" : longestStreak.count === 1 ? "day" : "days"}
                            </span>
                        </div>
                        <span class="stat__label">Longest Streak</span>
                        </div>                    
                    </div>
                {/if}
                <div class="stat">
                    <div class="stat__bottom">
                        <div class="flx">
                            <span class="stat__value">
                                {zero ? "--" : perfectDays}
                            </span>
                            <span class="stat__unit">
                                {zero ? "" : perfectDays === 1 ? "day" : "days"}
                            </span>
                        </div>
                        <span class="stat__label">100% Days</span>
                    </div>                    
                </div>
                <div class="stat">
                    <div class="stat__bottom">
                        <div class="flx">
                            <span class="stat__value">
                                {zero ? "--" : missed}
                            </span>
                            <span class="stat__unit">
                                {zero ? "" : missed === 1 ? "time" : "times"}
                            </span>
                        </div>
                        <span class="stat__label">Missed</span>
                    </div>
                </div>
            </div>
        {/if}

        <div class="yr-view__heat-map">
            {#if habitsHeatMap  }
                <HeatMap 
                    {year}
                    type="habits"
                    data={habitsHeatMap}
                    options={{
                        single: habits.length === 1
                    }}
                />
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../../scss/stats.scss" as *;

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
            @include text-style(1, var(--fw-400-500), 2.25rem);
            margin: 9px 0px 4px 0px;
        }
        h4 {
            @include text-style(1, var(--fw-400-500), 1.75rem);
        }
        &__header {
            @include flex(center,space-between);
            width: 100%;
        }
        &__progress {
            display: flex;
            float: left;

            span {
                @include text-style(0.35, var(--fw-400-500), 1.3rem);
                margin: -2px 0px 0px 15px;
            }
        }
        &__goals {
            margin-top: 5px;
        }
        &__heat-map {
            width: 100%;
        }
        &__txt {
            @include text-style(0.35, var(--fw-400-500), 1.3rem);
            margin: 14px 0px 14px 0px;
        }
        &__stats {
            margin: 13px 0px 20px 0px;
            @include flex(center);
        }
    }
    .fraction {
        @include text-style(0.35, var(--fw-400-500), 1.25rem);
        margin-left: 14px;

        &__slash { 
            font-size: 1.1rem !important;
            font-weight: 500;
            margin: 0px 6px;
        }
    }

    .divider {
        border-top: var(--divider-border);
        margin: 12px 0px 0px 0px;
    }
</style>