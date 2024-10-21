<script lang="ts">
    import { TEST_WK_HABITS } from "$lib/mock-data";
	import { DAYS_OF_WEEK } from "../../../lib/utils-date";
	import { capitalize, formatPlural } from "../../../lib/utils-general"

    type HabitTableView = "default" | "time-of-day"

    const MIN_SIZE = 620
    let habits = TEST_WK_HABITS
    let view: HabitTableView = "time-of-day"
    let dayProgress = [0, 0, 0, 0, 0, 0, 0]

    let sortedHabits: any = {}
    let width = 0

    updateDayProgress(habits)
    setViewOptn(view)

    function toggleCompleteHabit(habit: any, dayIdx: number) {
        const targetHabitIdx  = habits.findIndex((_habit: any) => habit.name === _habit.name)
        const targetHabit     = habits[targetHabitIdx]
        let num               = targetHabit.last7Days
        targetHabit.last7Days = num ^ (1 << (6 - dayIdx))

        // change in sorted
        const timeOfDay   = habit.timeOfDay
        const habitsArray = sortedHabits[timeOfDay].habits
        const habitIdx = habitsArray.findIndex((h: any) => h.name === habit.name)
        habitsArray[habitIdx] = targetHabit

        // update progress
        let totalProgress = 0
        habitsArray.forEach((h: any) => {
            const checked = h.last7Days.toString(2).split('').filter((bit: string) => bit === '1').length
            totalProgress += checked / 7
        })

        sortedHabits[timeOfDay].progress = (totalProgress / habitsArray.length) * 100

        // update regular habits
        updateDayProgress(habits)
    }
    function updateDayProgress(habits: any[]) {
        dayProgress = [0, 0, 0, 0, 0, 0, 0]

        for (const habit of habits) {
            for (let i = 0; i < 7; i++) {
                const completed = (habit.last7Days >> (6 - i)) & 1
                dayProgress[i] += completed
            }
        }

        return dayProgress
    }
    function setViewOptn(newView: HabitTableView) {
        view = newView

        if (view === "default") {
            setSortedHabitsToDefault()
        }
        else {
            groupHabitsByTimeOfDay(habits)
        }
    }
    function groupHabitsByTimeOfDay(habits: any[]) {
        sortedHabits = { 
            "morning": { habits: [], progress: 0 },
            "afternoon": { habits: [], progress: 0 },
            "evening": { habits: [], progress: 0 },
            "all-day": { habits: [], progress: 0 }
        }

        habits.forEach(habit => {
            sortedHabits[habit.timeOfDay].habits.push(habit);

            const checkedDays = habit.last7Days.toString(2).split('').filter(bit => bit === '1').length;
            const totalDays = 7;
            const progress = checkedDays / totalDays;
            
            sortedHabits[habit.timeOfDay].progress += progress;
        })
        
        Object.keys(sortedHabits).forEach(timeOfDay => {
            const habitsArray = sortedHabits[timeOfDay].habits;
            if (habitsArray.length > 0) {
                sortedHabits[timeOfDay].progress = (sortedHabits[timeOfDay].progress / habitsArray.length) * 100;
            }
        })
    }
    function setSortedHabitsToDefault() {
        sortedHabits = { 
            "morning": { habits: [], progress: 0 },
            "afternoon": { habits: [], progress: 0 },
            "evening": { habits: [], progress: 0 },
            "all-day": { habits: [], progress: 0 }
        }

        habits.forEach(habit => sortedHabits.morning.habits.push(habit))
    }

</script>

<div 
    class="wk-habits"
    class:wk-habits--min={width < MIN_SIZE}
    bind:clientWidth={width}
>

    <div class="wk-habits__header">
        <div class="wk-habits__col one-col header-col">
            <span>
                Name
            </span>
        </div>
        <div class="wk-habits__col two-col header-col">
            <span>
                Target
            </span>
        </div>
        <div class="wk-habits__col three-col header-col">
            <span>
                Streak
            </span>
        </div>
        <div class="days-col">
            {#each DAYS_OF_WEEK as day}
                <div class="wk-habits__col day-col header-col">
                    {day.substring(0, 1)}
                </div>
            {/each}
        </div>
    </div>
    {#if view === "time-of-day"}
        <div class="divider"></div>
    {/if}
    {#each ["morning", "afternoon", "evening", "all-day"] as timeOfDay}
        {@const { habits, progress } = sortedHabits[timeOfDay]}
        {@const tod = timeOfDay === "all-day" ? "All Day" : timeOfDay}
            <div 
                class="wk-habits__tod-header"
                class:wk-habits__tod-header--morning={timeOfDay === "morning"}
                class:hidden={view === "default"}
            >
                <span>
                    {capitalize(tod)}
                </span>
                <span class="wk-habits__tod-progress">
                    {Math.floor(progress)}%
                </span>
            </div>

        {#each habits as habit, habitIdx}
            <div class="wk-habit">
                <div 
                    class="wk-habit__name one-col cell"
                    class:cell--first={habitIdx === 0}
                >
                    <span class="wk-habit__symbol">
                        {habit.symbol}
                    </span>
                    <span>
                        {habit.name}
                    </span>
                </div>
                <div 
                    class="wk-habit__target two-col cell"
                    class:cell--first={habitIdx === 0}
                >
                    <span>
                        {habit.target ?? "--"}
                    </span>
                </div>
                <div 
                    class="wk-habit__streak three-col cell"
                    class:cell--first={habitIdx === 0}
                >
                    <span>
                        {habit.streak}
                    </span>
                </div>
                <div class="days-col">
                    {#each DAYS_OF_WEEK as _, dayIdx}
                        {@const num = habit.last7Days}
                        {@const checked = ((num >> (6 - dayIdx)) & 1) === 1}
                        <div 
                            class="day-col day-col cell"
                            class:cell--first={habitIdx === 0}
                        >
                            <button 
                                on:click={() => toggleCompleteHabit(habit, dayIdx)}
                                class="wk-habit__box"
                                class:wk-habit__box--checked={checked}
                            >
                                {#if checked}
                                    <i class="fa-solid fa-check"></i>
                                {/if}
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    {/each}
    <div class="wk-habits__count-cells">
        <div class="wk-habits__count-cell one-col">
            {formatPlural("habit", habits.length)}
        </div>
        <div class="wk-habits__count-cell two-col">

        </div>
        <div class="wk-habits__count-cell three-col">
            4 days
        </div>
        <div class="wk-habits__count-cell days-col">
            {#each dayProgress as progress}
                <div class="wk-habits__count-cell day-col">
                    {`${Math.floor((progress / habits.length) * 100)}%`}
                </div>
            {/each}
        </div>
    </div>
</div>

<style lang="scss">
    .wk-habits { 
        width: 100%;
        min-width: 560px;

        &--min .one-col { 
            min-width: 40px;
            width: 40px;
            @include elipses-overflow;
        }
        &--min .three-col { 
            @include elipses-overflow;
        }
        &--min .wk-habit__name span:last-child { 
            display: none;
        }

        &__header {
            display: flex;
            @include text-style(0.35, 500, 1.285rem);
            position: relative;
            // display: none;

        }
        &__col {

        }
        &__tod-header {
            @include text-style(0.35, 500, 1.245rem);
            @include flex(center, space-between);
            margin: 13px 0px 11px 8px;
            
            &--morning {
                margin: 5px 0px 11px 8px;
            }
        }
        &__tod-progress {
            @include text-style(0.2, 400, 1.25rem, "DM Mono");
        }
        &__count-cells {
            display: flex;
            margin-top: 12px;
            // display: none;
        }
        &__count-cell {
            margin-left: 1px;
            @include text-style(0.145, 400, 1.325rem, "DM Mono");
        }

        .divider {
            background-color: rgba(var(--textColor1), 0.065);
            width: 100%;
            height: 0.5px;
            margin: 0px 0px 8px 0px;
        }
    }
    .wk-habit { 
        display: flex;
        // background-color: rgba(var(--textColor1), 0.0155);
        // border-radius: 8px;
        // border: 1px solid rgba(var(--textColor1), 0.0185);
        // margin-bottom: 5px;
        padding: 0px 0px 0px 1px;
        @include text-style(1, 400, 1.35rem);
        white-space: nowrap;
        
        &__symbol {
            font-size: 1.55rem;
            margin-right: 14px;
        }
        &__name {
            @include text-style(1, 500, 1.325rem);
            @include elipses-overflow;
        }
        &__target {
            @include text-style(0.7, 300, 1.12rem, "DM Mono");
            
            span {
                background-color: rgb(var(--textColor1), 0.065);
                padding: 3px 8px 2px 8px;
                border-radius: 5px;
            }
        }
        &__streak {
            @include text-style(0.7, _, 1.125rem, "DM Mono");

            span {
                background-color: rgb(var(--textColor1), 0.065);
                padding: 2px 14px 2px 14px;
                border-radius: 5px;
            }
        }
        &__box {
            background-color: rgb(var(--textColor1), 0.045);
            height: 18px;
            width: 18px;
            border-radius: 0px;
            @include center;
            
            &:hover {
                background-color: rgb(var(--textColor1), 0.085);
            }
        }
        &__box--checked {
            // height: 17px;
            // width: 17px;
            // background-color: rgb(var(--textColor1), 0.065);
            background-color: #6bb0f4 !important;
        }
    }
    .header-col {
        padding: 0px 0px 9px 8px;
        // border-bottom: 0.5px solid rgb(var(--textColor1), 0.065);
    }
    .one-col {
        width: 180px;
    }
    .two-col {
        width: 120px;
    }
    .three-col {
        width: 80px;
    }
    .days-col {
        flex: 1;
        display: flex;
        // margin-left: 20px;
    }
    .day-col {
        width: calc(100% / 7);
        min-width: 50px;
    }
    .cell {
        padding: 7px 0px 7px 8px;
        @include flex(center);
        border-bottom: 0.5px solid rgb(var(--textColor1), 0.065);
        
        &--first {
            border-top: 0.5px solid rgb(var(--textColor1), 0.065);
        }
        
        &:not(:last-child) {
            border-right: 0.5px solid rgb(var(--textColor1), 0.065);
        }
    }
</style>
