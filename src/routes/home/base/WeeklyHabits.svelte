<script lang="ts">
    import { TEST_WK_HABITS } from "$lib/mock-data";
	import { DAYS_OF_WEEK } from "../../../lib/utils-date";
	import { formatPlural } from "../../../lib/utils-general";

    let habits = TEST_WK_HABITS
    let view: "default" | "time-of-day" = "default"
    let dayProgress = [0, 0, 0, 0, 0, 0, 0]

    $: updateDayProgress(habits)

    function toggleCompleteHabit(habitIdx: number, dayIdx: number) {
        const newHabits = habits
        const num = habits[habitIdx].last7Days

        newHabits[habitIdx].last7Days = num ^ (1 << (6 - dayIdx))
        habits = newHabits
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

</script>

<div class="wk-habits">
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
                    {day.substring(0, 3)}
                </div>
            {/each}
        </div>
    </div>
    {#each habits as habit, habitIdx}
        <div class="wk-habit">
            <div class="wk-habit__name one-col cell">
                <span>
                    {habit.name}
                </span>
            </div>
            <div class="wk-habit__target two-col cell">
                <span>
                    {habit.target ?? "--"}
                </span>
            </div>
            <div class="wk-habit__streak three-col cell">
                <span>
                    {habit.streak}
                </span>
            </div>
            <div class="days-col">
                {#each DAYS_OF_WEEK as _, dayIdx}
                    {@const num = habit.last7Days}
                    {@const checked = ((num >> (6 - dayIdx)) & 1) === 1}
                    <div class="day-col day-col cell">
                        <button 
                            on:click={() => toggleCompleteHabit(habitIdx, dayIdx)}
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

        &__header {
            display: flex;
            @include text-style(0.35, 500, 1.285rem);

        }
        &__col {

        }
        &__count-cells {
            display: flex;
            margin-top: 12px;
        }
        &__count-cell {
            margin-left: 1px;
            @include text-style(0.145, 400, 1.155rem, "DM Mono");
        }
    }
    .wk-habit { 
        display: flex;
        @include text-style(1, 400, 1.35rem);

        &__name {
            @include text-style(1, 500, 1.365rem);
        }
        &__target {
            @include text-style(0.8, 400, 1.155rem, "DM Mono");

            span {
                background-color: rgb(var(--textColor1), 0.085);
                padding: 3px 8px 2px 8px;
                border-radius: 5px;
            }
        }
        &__streak {
            @include text-style(0.8, _, 1.155rem, "DM Mono");

            span {
                background-color: rgb(var(--textColor1), 0.085);
                padding: 2px 14px 2px 14px;
                border-radius: 5px;
            }
        }
        &__boxes {

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
            height: 17px;
            width: 17px;
            // background-color: rgb(var(--textColor1), 0.065);
            background-color: #6bb0f4 !important;
        }
    }
    .header-col {
        padding: 0px 0px 14px 8px;
        border-bottom: 0.5px solid rgb(var(--textColor1), 0.065);
    }
    .one-col {
        width: 160px;
    }
    .two-col {
        width: 100px;
    }
    .three-col {
        width: 80px;
    }
    .days-col {
        flex: 1;
        display: flex;
    }
    .day-col {
        width: calc(100% / 7);
    }
    .cell {
        padding: 9px 0px 8px 8px;
        border-bottom: 0.5px solid rgb(var(--textColor1), 0.065);
        
        &:not(:last-child) {
            border-right: 0.5px solid rgb(var(--textColor1), 0.065);
        }
    }
</style>
