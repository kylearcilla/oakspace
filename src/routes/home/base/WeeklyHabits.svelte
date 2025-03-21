<script lang="ts">
    import { v4 as uuidv4 } from 'uuid'

	import { randomArrayElem } from "$lib/utils-general"
    import { habitTracker, themeState } from "$lib/store"
	import { DEFAULT_SYMBOLS, EXAMPLE_HABITS } from "$lib/utils-habits-data"
    
	import HabitsTable from "./HabitsTable.svelte"
	import EmptyList from "$components/EmptyList.svelte"
	import HabitViewModal from "$components/HabitViewModal.svelte"

    export let weeksAgoIdx: number  
    export let options: HabitTableOptions

    let monthMetrics: HabitMonthMetrics | null = null
    let activeStreak: HabitActiveStreak | null = null
    let empty = false
    let newHabitModal = false

    $: light = !$themeState.isDarkTheme

    habitTracker.subscribe((data) => {
        monthMetrics = data.monthMetrics
        activeStreak = data.activeStreak
        empty = data.habits.length === 0
    })
</script>

<div class="weekly">
    {#if monthMetrics && activeStreak && options.stats && !empty}
        {@const { habitsDone, habitsDue, perfectDays, missed, longestStreak } = monthMetrics}
        {@const zero = habitsDue === 0}
        {@const streak = zero ? "--" : activeStreak.count}

        <div class="stats" class:stats--light={light}>
            <div class="stat" style:margin-right="32px">
                <div class="stat__bottom">
                    <div class="flx">
                        <span class="stat__value">
                            {streak}
                        </span>
                        <span class="stat__unit">
                            {streak === "--" ? "" : streak === 1 ? "day" : "days"}
                        </span>
                    </div>
                    <span class="stat__label">Active Streak</span>
                </div>     
            </div>
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

    {#if empty}
        <div class="empty">
            <EmptyList 
                emptyText="No habits"
                subtitle={randomArrayElem(EXAMPLE_HABITS)}
                buttonText="Add Habit"
                onButtonClick={() => newHabitModal = true}
            />
        </div>
    {:else}
        <HabitsTable 
            {options} 
            {weeksAgoIdx}
            timeFrame="weekly"
        />
    {/if}
</div>

{#if newHabitModal}
    <HabitViewModal 
        type="new"
        habit={{
            name: "",
            symbol: randomArrayElem(DEFAULT_SYMBOLS),
            img: null,
            freqType: "daily",
            frequency: 1,
            timeOfDay: "all-day",
            description: "",
            caption: "",
            createdAt: new Date(),
            id: uuidv4(),
            streak: 0,
            data: "000000000000000000000000000000000000000000",
            order: {
                default: 0,
                tod: 0
            }
        }}
        onNewFinish={() => newHabitModal = false}
    />
{/if}

<style lang="scss">
    @import "../../../scss/stats.scss";

    .weekly {
        min-height: 200px;
        position: relative;
    }
    .empty {
        @include abs-center;
    }
    .stats {
        margin: 12px 0px 18px 0px;
    }
</style>

