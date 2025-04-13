<script lang="ts">
    import { formatDateLong } from "$lib/utils-date"
	import { STATUS_COLORS } from "$lib/utils-colors"
	import { getHabitStreak, getHabitMonthData, viewHabit } from "$lib/utils-habits"

    export let habit: Habit
    export let monthIdx: number
    export let year: number
    export let light: boolean
    export let style: "wide" | "tall" = "wide"
    export let dotStyle: "default" | "x-mark" = "default"

    const { RED, YELLOW, GREEN } = STATUS_COLORS

    let weeklyHeatMap: HabitHeatMapDay[][] = []
    let checked = 0
    let due = 0

    let statusColor1 = "0, 0, 0"
    let statusColor2 = "0, 0, 0"

    let streak = getHabitStreak(habit)
    let monthData: any[] = []

    $: initData(monthIdx)

    function initData(monthIdx: number) {
        monthData = getHabitMonthData({ habit, monthIdx, year })
        weeklyHeatMap = []
    
        for (let i = 0; i < monthData.length; i += 7) {
            weeklyHeatMap.push(monthData.slice(i, i + 7))
        }
        for (let i = 0; i < monthData.length; i++) {
            const day = monthData[i]
            
            if (day.isInCurrMonth && day.date <= new Date()) {
                if (day.due) {
                    checked += day.done
                    due += day.due
                }
            }
        }
        weeklyHeatMap = weeklyHeatMap
        getStatusColors()
    }


    function getStatusColors() {
        const percent = Math.round((checked / due) * 100)
        const key = light ? "light" : "dark"

        if (percent >= 80) {
            statusColor1 = GREEN[key].color1
            statusColor2 = GREEN[key].color2
        }
        else if (percent >= 50) {
            statusColor1 = YELLOW[key].color1
            statusColor2 = YELLOW[key].color2
        }
        else {
            statusColor1 = RED[key].color1
            statusColor2 = RED[key].color2
        }
    }
</script>   

<div 
    class="habit-card"
    class:habit-card--x-mark={dotStyle === "x-mark"}
    class:habit-card--tall={style === "tall"}
    class:habit-card--light={light}
    style:--status-color-1={statusColor1}
    style:--status-color-2={statusColor2}
>
    <div class="habit-card__left">
        <div class="habit-card__header">
            <div class="habit-card__symbol">
                {habit.symbol}
            </div>
            <button 
                class="habit-card__name"
                on:click={() => viewHabit(habit)}
            >
                {habit.name}
            </button>
        </div>
        <div>
            <div class="habit-card__detail">
                <span>Checked</span>
                <div class="habit-card__detail-percent"> 
                    {Math.round(checked / due * 100)}%
                </div>
            </div>
            <div class="habit-card__detail" style:margin-top="-2px">
                <span>Streak</span>
                <span style:font-size="1.3rem">{streak}×</span>
            </div>
        </div>
    </div>
    <div class="habit-card__right">
        <div class="cal" class:cal--light={light}>
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
                            {@const sameMonth = day.isInCurrMonth}
                            {@const { done, due, date } = day}
                            {@const beyond = date > new Date() && sameMonth}
                            {@const missed = sameMonth && due && !done && !beyond}
                            {@const checked = done && !beyond}

                            <div 
                                class="cal__day"
                                title={formatDateLong(date)}
                            >
                                <div 
                                    class="cal__day-content"
                                    class:cal__day-content--x-mark={dotStyle === "x-mark"}
                                    class:cal__day-content--obscured={!sameMonth}
                                    class:cal__day-content--missed={missed}
                                    class:cal__day-content--checked={checked && sameMonth}
                                    class:cal__day-content--beyond={beyond}
                                >
                                    {#if sameMonth && ((dotStyle === "default" && missed) || (dotStyle === "x-mark" && done))}
                                        <i class="fa-solid fa-xmark"></i>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .habit-card {
        display: flex;
        background-color: rgba(var(--textColor1), 0.014);
        padding: 10px;
        border-radius: 12px;
        padding: 12px 18px 12px 14px;
        position: relative;
        width: 330px;

        --dot-opacity: 0.16;
        --dot-opacity-beyond: 0.05;

        
        --missed-color: rgb(136, 89, 89);
        --checked-color: rgb(255, 255, 255, 0.45);
        
        --x-mark-color: var(--missed-color);

        &--light {
            background-color: rgba(var(--textColor1), 0.0185);
            border: 1.5px dashed rgba(var(--textColor1), 0.12);

            --missed-color: rgb(182, 109, 109);
            --checked-color: rgba(26, 23, 23, 0.45);

            --dot-opacity: 0.4;
            --dot-opacity-beyond: 0.1;
        }
        &--light &__detail span {
            color: rgb(var(--textColor1), 0.7);
        }
        &--light .cal__dow {
            @include text-style(1);
            font-weight: 600;
        }
        
        &--x-mark {
            --x-mark-color: var(--checked-color);
        }
        &--tall {
            display: block;
            width: 200px;
            padding: 8px 18px 12px 14px;
        }
        &--tall &__right {
            width: 100%;
            margin-top: 20px;
        }
        &--tall &__detail {
            margin: 0px 5px 8px 0px;
        }
        &--tall &__header {
            margin: 0px 5px 6px 0px;
        }
        &--tall &__name {
            max-width: 140px;
        }

        span {
            display: block;
        }
        &__left {
            flex: 1;
        }
        &__right {
            width: 150px;
        }
        &__header {
            @include flex(center);
            margin: -2.5px 0px 9px 0px;
        }
        &__symbol {
            font-size: 1.45rem;
            width: 22px;
        }
        &__name {
            @include text-style(1, var(--fw-400-500), 1.38rem);
            @include elipses-overflow;
            max-width: 100px;

            &:hover {
                text-decoration: underline;
            }
        }
        &__detail {
            margin: 0px 32px 8px 0px;
            @include flex(center, space-between);

            span {
                @include text-style(0.3, var(--fw-400-500), 1.31rem);
            }
            span:last-child {
                @include text-style(1);
            }
        }
        &__detail-percent {
            margin: 0px -10px 0px 0px;
            @include text-style(_, var(--fw-400-500), 1.15rem, "Geist Mono");
            background-color: rgba(var(--status-color-2), 0.2);
            color: rgba(var(--status-color-1), 1);
            border-radius: 12px;
            padding: 2.5px 11px 3.5px 11px;
        }
    }
    .cal {
        width: 100%;

        &__days {
            @include flex(center, space-between);
            margin: -2px 0px 4px 0px;
        }
        &__dow {
            height: 15px;
            margin-left: 2px;
            @include text-style(0.5, 400, 1rem);
            @include center;
        }
        &__week {
            @include flex(center, space-between);
            width: 100%;
        }
        &__day {
            height: 21px;
            width: 10px;
            @include center;
        }
        &__day-content {
            background-color: rgba(var(--textColor1), var(--dot-opacity));
            @include circle(3.5px);
            position: relative;
            transition: background-color 0.2s ease-in-out;

            &--checked {
                --dot-opacity: 1;
            }
            &--obscured, &--beyond {
                --dot-opacity: var(--dot-opacity-beyond) !important;
            }   
            &--missed {
                background-color: transparent;
            }
            &--x-mark#{&}--missed {
                @include circle(6px);
                border: 2px solid rgba(var(--textColor1), var(--dot-opacity)) !important;
            }
            &--x-mark#{&}--checked {
                background-color: transparent;
            }
            i {
                @include abs-center;
                font-size: 1.25rem;
                color: var(--x-mark-color);
            }
        }
    }
</style>