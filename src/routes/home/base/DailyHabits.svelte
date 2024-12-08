<script lang="ts">
	import ProgressRing from "../../../components/ProgressRing.svelte";
	import SvgIcon from "../../../components/SVGIcon.svelte"
	import { Icon } from "../../../lib/enums";
	import { TEST_HABITS } from "../../../lib/mock-data"
	import { themeState } from "../../../lib/store";
	import { kebabToNormal } from "../../../lib/utils-general";

    const TIMES_OF_DAY_MAP: { [key: string]: number } = {
        "morning": 0,
        "afternoon": 1,
        "evening": 2,
        "all-day": 3
    }

    type HabitTableView = "default" | "time-of-day"

    export let options: any

    let view = options?.view
    let wkProgress = options?.progress
    let dayIdx = 0

    let habits = TEST_HABITS
    let sortedHabits: any = {}
    let dragHabitTarget: any

    $: isLight = !$themeState.isDarkTheme
    $: {
        view = options?.view
        wkProgress = options?.progress

        setViewOptn(view)
    }

    function setViewOptn(newView: HabitTableView) {
        if (newView === "default") {
            setSortedHabitsToDefault()
        }
        else {
            groupHabitsByTimeOfDay(habits)
        }
    }

    /* completeness */
    function toggleCompleteHabit(habit: any, dayIdx: number) {
        const targetHabitIdx  = habits.findIndex((_habit: any) => habit.name === _habit.name)
        const targetHabit     = habits[targetHabitIdx]
        let num               = targetHabit.last7Days
        targetHabit.last7Days = num ^ (1 << (6 - dayIdx))

        // change in sorted
        const todIdx = TIMES_OF_DAY_MAP[habit.timeOfDay]
        const habitsArray = sortedHabits[todIdx]
        const habitIdx = habitsArray.findIndex((h: any) => h.name === habit.name)
        habitsArray[habitIdx] = targetHabit

        // update progress
        let totalProgress = 0
        habitsArray.forEach((h: any) => {
            const checked = h.last7Days.toString(2).split('').filter((bit: string) => bit === '1').length
            totalProgress += checked / 7
        })

        sortedHabits[todIdx].progress = (totalProgress / habitsArray.length) * 100
    }
    function isBoxCheckable(habit: any, dayIdx: number) {
        const { freqType, frequency } = habit

        if (freqType === "day-of-week") {
            return Boolean((frequency >> (6 - dayIdx)) & 1)
        }
        else {
            return true
        }
    }
    function getProgress(habit: any) {
        const { last7Days, frequency, freqType } = habit
        const last7DaysBinary = last7Days.toString(2).padStart(7, '0').split('')
        let checked = 0
        let total = 0

        if (freqType === 'daily') {
            checked = last7DaysBinary.filter(bit => bit === '1').length
            total = 7
        }
        else if (freqType === 'day-of-week') {
            const frequencyBinary = frequency.toString(2).padStart(7, '0').split('')
            
            for (let i = 0; i < 7; i++) {
                if (frequencyBinary[i] === '1') {
                    total++
                }
                if (last7DaysBinary[i] === '1') {
                    checked++
                }
            }
        }
        else if (freqType === 'per-week') {
            checked = last7DaysBinary.filter(bit => bit === '1').length
            total = Math.min(frequency, 7)
        }

        return { checked, total }
    }

    /* sorting / grouping habits */
    function groupHabitsByTimeOfDay(habits: any[]) {
        sortedHabits = [[], [], [], []]

        habits.forEach(habit => {
            const timeOfDayIndex = TIMES_OF_DAY_MAP[habit.timeOfDay]
            if (timeOfDayIndex !== undefined) {
                sortedHabits[timeOfDayIndex].push(habit)
            }
        })

        // Sort the habits for each time of day
        sortedHabits.forEach(habitGroup => {
            habitGroup.sort((a: any, b: any) => a.order.tod - b.order.tod)
        });
    }

    function setSortedHabitsToDefault() {
        sortedHabits = [[], [], [], []]

        habits.forEach(habit => {
            sortedHabits[0].push(habit)
        })

        sortedHabits[0].sort((a: any, b: any) => a.order.default - b.order.default)
    }
</script>

<div class="dh" class:dh--light={isLight}>
    {#each Object.keys(TIMES_OF_DAY_MAP) as timeOfDay}
        {@const idx = TIMES_OF_DAY_MAP[timeOfDay]}
        {@const habits = sortedHabits[idx]}
        {@const tod = kebabToNormal(timeOfDay)}
        {@const empty = habits.length === 0}
        {@const isTodView = view === "time-of-day"}
        <div 
            class="dh__tod-container"
            style:margin-bottom={empty && isTodView ? "30px" : ""}
            style:min-height={isTodView ? "30px" : ""}
        >
            <div 
                class="dh__tod-header"
                class:dh__tod-header--morning={timeOfDay === "morning"}
                class:hidden={view === "default"}
            >
                <span>
                    {tod}
                </span>
            </div>
            {#each habits as habit, habitIdx}
                {@const isDragOver = dragHabitTarget?.name === habit.name}
                {@const num = habit.last7Days}
                {@const checkable = isBoxCheckable(habit, dayIdx)}
                {@const hChecked = ((num >> (6 - dayIdx)) & 1) === 1}
                <div    
                    class="dh__habit dg-over-el" 
                    class:dg-over-el--over={isDragOver}
                >
                    <div 
                        class="one-col cell"
                        class:cell--first-row={habitIdx === 0}
                    >
                        <div
                            title={checkable ? "" : "Check in not required for this day."}
                            class="day-col day-col cell"
                            class:cell--first-row={habitIdx === 0}
                        >
                            <button 
                                on:click={() => toggleCompleteHabit(habit, dayIdx)}
                                class="dh__habit-box"
                                class:dh__habit-box--not-checkable={!checkable}
                                class:dh__habit-box--checked={hChecked}
                            >
                                {#if hChecked}
                                    <i class="fa-solid fa-check"></i>
                                {/if}
                            </button>
                        </div>
                    </div>
                    <div 
                        class="two-col"
                        class:cell--first-row={habitIdx === 0}
                    >
                        <div class="flx">
                            <span class="dh__habit-symbol">
                                {habit.symbol}
                            </span>
                            <span 
                                class="dh__habit-name"
                                class:strike={hChecked}
                                class:strike--lt={hChecked}
                            >
                                {habit.name}
                            </span>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
{/each}
</div>

<style lang="scss">
    .dh {
        margin-top: 5px;

        &--light &__habit-name {
            @include text-style(1, 600);
        }
        &--light &__tod-header {
            @include text-style(0.7, 600);
        }

        &__header {
            display: flex;
            @include text-style(0.35, 500, 1.285rem);
            position: relative;

        }
        &__tod-header {
            @include text-style(0.35, 500, 1.2rem);
            @include flex(center, space-between);
            margin: 13px 0px 11px 2px;
            padding: 0px 0px px 0px;
            
            &--morning {
                margin: 5px 0px 9px 2px;
            }
        }
        &__tod-container {
            position: relative;
            margin-bottom: 20px;
        }
        &__habit {
            @include flex(center);
            padding: 0px 0px 0px 1px;
            white-space: nowrap;
            position: relative;
            margin-bottom: 13px;
        }
        &__habit-name {
            @include text-style(1, 500, 1.5rem);
            @include elipses-overflow;
            @include flex(center, space-between);
        }
        &__habit-symbol {
            margin-right: 10px;
            display: none;
        }
        &__habit-box {
            background-color: var(--lightColor3);
            height: 18.5px;
            width: 18.5px;
            border-radius: 0px;
            position: relative;
            margin: 0px 15px 0px 1px;
            @include center;
            
            &:hover {
                opacity: 0.55;
            }
        }
        &__habit-box--checked {
            background-color: var(--elemColor1) !important;
            color: var(--elemTextColor);

            &:hover {
                opacity: 1 !important;
            }
            &:before {
                display: none;
            }
        }
        &__habit-box--not-checkable {
            &:hover {
                background-color: rgb(var(--textColor1), 0.045);
            }
            &:before {
                content: " ";
                height: 1px;
                width: 5px;
                background-color: rgba(var(--textColor1), 0.4);
                @include abs-center;
            }
        }
    }
    .grip {
        @include abs-top-left(0px, -18px);
        cursor: grab;
        height: 34px;
        @include center;
        
        &__icon {
            transition: 0.1s ease-in-out;
            @include not-visible;
            padding: 5px 3px;
        }
        &:hover &__icon {
            background: rgba(var(--textColor1), 0.15);
            border-radius: 3px;
            @include visible(0.6);
        }
        &:active {
            cursor: grabbing;
        }
    }
</style>