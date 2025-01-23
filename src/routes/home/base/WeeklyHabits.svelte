<script lang="ts">
	import { onMount } from "svelte";
    
    import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { DAYS_OF_WEEK, getDayIdxMinutes } from "$lib/utils-date"
	import { getHabitWeekProgress, getHabitStreak } from "$lib/utils-habits"
    
	import SvgIcon from "../../../components/SVGIcon.svelte"
	import ProgressRing from "../../../components/ProgressRing.svelte"
	import { getDaysProgress, getFreqDaysStr, isBoxRequired, isDayComplete, toggleCompleteHabit } from "../../../lib/utils-habits";
	import { habitTracker } from "../../../lib/store";

    const MIN_SIZE = 620
    const X_MIN_SIZE = 480
    const TIMES_OF_DAY_MAP: { [key: string]: number } = {
        "morning": 0,
        "afternoon": 1,
        "evening": 2,
        "all-day": 3
    }

    export let options: any
    export let weeksAgoIdx = 5

    let store = habitTracker
    let view = options?.view
    let wkProgress = options?.progress

    let dayProgress = [0, 0, 0, 0, 0, 0, 0]
    let isDragging = false
    let width = 0
    
    let dragHabitSrc: any
    let dragHabitTarget: any
    let currTime = getDayIdxMinutes()
    
    let habits: Habit[] = []
    let metrics: HabitMetrics | null = null
    let sortedHabits: Habit[][] = []
    
    $: isLight = !$themeState.isDarkTheme
    $: {
        view = options?.view
        wkProgress = options?.progress
        
        setGrouping()
    }
    $: if (weeksAgoIdx != undefined) {
        dayProgress = getDaysProgress(habits, weeksAgoIdx)
    }
    store.subscribe((data) => {
        habits = data.habits
        metrics = data.metrics

        setGrouping()
        dayProgress = getDaysProgress(habits, weeksAgoIdx)
    })

    function setGrouping() {
        if (view === "default") {
            groupByDefault()
        }
        else {
            groupByTimeOfDay(habits)
        }
    }

    /* sorting / grouping habits */
    function groupByTimeOfDay(habits: any[]) {
        sortedHabits = [[], [], [], []]

        habits.forEach(habit => {
            const timeOfDayIndex = TIMES_OF_DAY_MAP[habit.timeOfDay]
            if (timeOfDayIndex !== undefined) {
                sortedHabits[timeOfDayIndex].push(habit)
            }
        })

        sortedHabits.forEach(habitGroup => {
            habitGroup.sort((a: any, b: any) => a.order.tod - b.order.tod)
        })
    }
    function groupByDefault() {
        sortedHabits = [[], [], [], []]

        habits.forEach(habit => {
            sortedHabits[0].push(habit)
        })

        sortedHabits[0].sort((a: any, b: any) => a.order.default - b.order.default)
    }

    /* habit drag */
    function onHabitDrag(e: DragEvent, habit: any) {
        e.dataTransfer.effectAllowed = "move"

        if (!isDragging) {
            e.preventDefault()
            return
        }

        dragHabitSrc = habit
    }
    function onHabitDragOver(e: DragEvent, target: any) {
        e.preventDefault()

        if (typeof target == "string") {
            dragHabitTarget = target
        }
        if (target?.name != dragHabitSrc.name) {
            dragHabitTarget = target
        }
    }
    function onDragLeave() {
        dragHabitTarget = null
    }
    function onHabitDragEnd() {
        if (dragHabitTarget) {
            onHabitReorder()
        }
        isDragging = false
        dragHabitSrc = null
        dragHabitTarget = null
    }
    function onHabitReorder() {
        if (view === "default") {
            reorderInDefaultView(dragHabitSrc, dragHabitTarget)
        } else {
            reorderInTimeOfDayView(dragHabitSrc, dragHabitTarget)
        }
    }
    function reorderInDefaultView(srcHabit: any, targetHabit: any) {
        const srcOrder    = srcHabit.order.default
        const lastOrder   = Math.max(...habits.map((habit: any) => habit.order.default)) + 1
        const toIdx       = targetHabit === "all-day" ? lastOrder : targetHabit.order.default
        const direction   = srcOrder < toIdx ? "up" : "down"
        const targetOrder = toIdx + (direction === "up" ? -1 : 0)

        habits.forEach((habit: any) => {
            if (direction === "up" && habit.order.default > srcOrder && habit.order.default <= targetOrder) {
                habit.order.default--
            } 
            else if (direction === "down" && habit.order.default >= targetOrder && habit.order.default < srcOrder) {
                habit.order.default++
            }
        })

        srcHabit.order.default = targetOrder
        groupByDefault()
    }
    function reorderInTimeOfDayView(srcHabit: any, targetHabit: any) {
        const toLast  = typeof targetHabit === "string"

        const srcTod = srcHabit.timeOfDay
        const targetTod  = toLast ? targetHabit : targetHabit.timeOfDay

        const srcSecIdx = TIMES_OF_DAY_MAP[srcTod]
        const toSecIdx = TIMES_OF_DAY_MAP[targetTod]
        const sameSec = srcSecIdx === toSecIdx

        const srcOrder = srcHabit.order.tod
        const lastOrder = habits.filter((habit: any) => habit.timeOfDay === targetTod).length 
    
        const toIdx       = toLast ? lastOrder : targetHabit.order.tod
        const betweenSec  = srcTod != targetTod
        const direction   = (betweenSec ? srcSecIdx < toSecIdx : srcOrder < toIdx) ? "up" : "down"

        const targetOrder = Math.max(toIdx + (direction === "up" && sameSec ? -1 : 0), 0)

        habits
            .filter((habit: any) => habit.timeOfDay === srcTod)
            .forEach((habit: any) => {
                if (direction === "up" && habit.order.tod > srcOrder) {
                    habit.order.tod--
                } 
                else if (!sameSec && direction === "down" && habit.order.tod > srcOrder) {
                    habit.order.tod--
                }
                else if (sameSec && direction === "down" && habit.order.tod < srcOrder) {
                    habit.order.tod++
                }
            })
        habits
            .filter((habit: any) => habit.timeOfDay === targetTod)
            .forEach((habit: any) => {
                if (direction === "up" && habit.order.tod >= targetOrder) {
                    habit.order.tod++
                } 
                else if (!sameSec && direction === "down" && habit.order.tod >= targetOrder) {
                    habit.order.tod++
                }
                else if (sameSec && direction === "down" && habit.order.tod <= targetOrder) {
                    habit.order.tod--
                }
            })

        srcHabit.order.tod = targetOrder
        srcHabit.timeOfDay = targetTod 
        
        groupByTimeOfDay(habits)
    }

    onMount(() => {
    })
</script>

<div 
    class="habits"
    class:habits--min={width < MIN_SIZE}
    class:habits--x-min={width < X_MIN_SIZE}
    class:habits--light={isLight}
    class:habits--default={view === "default"}
    class:habits--ring-only={!options.progress.numbers}
    bind:clientWidth={width}
>
    {#if metrics}
        {@const { habitsDone, habitsDue, perfectDays, missed, activeStreak } = metrics}
        <div class="habits__header">
            <div class="habits__stats">
                <div class="habits__stat" style:margin-right="0px">
                    <span class="habits__stat-label">Completion</span>
                    <div class="habits__stat-bottom">
                        <span class="habits__stat-value">
                            {Math.floor((habitsDone / habitsDue) * 100)}
                        </span>
                        <span class="habits__stat-unit">
                            %
                        </span>
                    </div>
                </div>
                <div class="habits__stat" style:margin-right="30px">
                    <span class="habits__stat-label">Active Streak</span>
                    <div class="habits__stat-bottom">
                        <span class="habits__stat-value">
                            {activeStreak.streak}
                        </span>
                        <span class="habits__stat-unit">
                            {activeStreak.streak === 1 ? "day" : "days"}
                        </span>
                    </div>
                </div>
                <div class="habits__stat" style:margin-right="5px">
                    <span class="habits__stat-label">100% Days</span>
                    <div class="habits__stat-bottom">
                        <span class="habits__stat-value">
                            {perfectDays}
                        </span>
                        <span class="habits__stat-unit">
                            {perfectDays === 1 ? "day" : "days"}
                        </span>
                    </div>
                </div>
                <div class="habits__stat" style:width="auto">
                    <span class="habits__stat-label">Missed</span>
                    <div class="habits__stat-bottom">
                        <span class="habits__stat-value">
                            {missed}
                        </span>
                        <span class="habits__stat-unit habits__stat-unit--times">
                            ×
                        </span>
                    </div>
                </div>
            </div>

            <div class="habits__subtext">Metrics for June*</div>
        </div>
    {/if}

    {#if habits}
        <div class="habits__table">
            <div class="habits__table-header">
                <div 
                    class="habits__col one-col header-col"
                    style:height="auto"
                >
                    <span>
                        Habit
                    </span>
                </div>
                <div class="habits__col two-col header-col">
                    <span>
                        Streak
                    </span>
                </div>
                <div class="days-col">
                    {#each DAYS_OF_WEEK as day, idx}
                        <div class="habits__col day-col header-col">
                            <div
                                class="dow"
                                class:dow--today={currTime.dayIdx === idx && weeksAgoIdx === 0}
                            >
                                <span>
                                    {day.substring(0, 1)}
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="habits__col three-col header-col">
                    <span 
                        class:hidden={!options.progress.numbers}
                    >
                        Progress
                    </span>
                    <div 
                        style:margin="3px 25px -10px 3px"
                        class:hidden={options.progress.numbers}
                    >
                        <ProgressRing 
                            progress={0.69} 
                            options={{ 
                                style: "light",
                                size: 15,
                                strokeWidth: 3
                            }}
                        />
                    </div>
                </div>
            </div>
            {#each Object.keys(TIMES_OF_DAY_MAP) as timeOfDay}
                {@const idx = TIMES_OF_DAY_MAP[timeOfDay]}
                {@const habits = sortedHabits[idx]}
                {@const tod = timeOfDay === "all-day" ? "all day" : timeOfDay}
                {@const empty = habits.length === 0}
                {@const isTodView = view === "time-of-day"}
                <div 
                    class="habits__tod-container"
                    style:margin-bottom={empty && isTodView ? "30px" : ""}
                    style:min-height={isTodView ? "30px" : ""}
                >
                    <div 
                        class="habits__tod-header"
                        style:margin={timeOfDay === "morning" ? "8px 0px 9px 2px" : ""}
                        class:hidden={view === "default"}
                    >
                        <span>
                            {tod}
                        </span>
                    </div>
        
                    {#each habits as habit, habitIdx}
                        {@const { checked, total } = getHabitWeekProgress(habit, weeksAgoIdx)}
                        {@const isDragOver = dragHabitTarget?.name === habit.name}
                        {@const streak = getHabitStreak(habit)}

                        <div    
                            class="habit dg-over-el" 
                            class:dg-over-el--over={isDragOver}
                            draggable="true"
                            on:dragstart={(e) => onHabitDrag(e, habit)}
                            on:dragover={(e) => onHabitDragOver(e, habit)}
                            on:dragleave={onDragLeave}
                            on:dragend={onHabitDragEnd}
                        >
                            <div 
                                class="habit__name one-col cell"
                                class:cell--first-row={habitIdx === 0}
                            >
                                <div class="flx">
                                    {#if options.emojis}
                                        <i class="habit__symbol">
                                            {habit.symbol}
                                        </i>
                                    {/if}
                                    <span style:margin-right="20px">
                                        {habit.name}
                                    </span>
                                </div>
                                {#if options.target}
                                <!-- {#if true} -->
                                    <span class="habit__target">
                                        {habit.target ?? ""}
                                        <!-- {getFreqDaysStr(habit, true)} -->
                                    </span>
                                {/if}
                            </div>
                            <div 
                                class="habit__streak two-col cell"
                                class:cell--first-row={habitIdx === 0}
                            >
                                <span>
                                    {streak}
                                </span>
                                <span class="habit__streak-times">
                                    ×
                                </span>
                            </div>
                            <div class="days-col">
                                {#each DAYS_OF_WEEK as _, dayIdx}
                                    {@const disabled = weeksAgoIdx === 0 ? dayIdx > currTime.dayIdx : false}
                                    {@const required = isBoxRequired(habit, dayIdx)}
                                    {@const complete = isDayComplete({ habit, dayIdx, weeksAgoIdx })}
                                    <div
                                        title={required ? "" : "Check in not required for this day."}
                                        class="day-col day-col cell"
                                        class:cell--first-row={habitIdx === 0}
                                    >
                                        <button 
                                            on:click={() => toggleCompleteHabit({ habit, dayIdx, weeksAgoIdx })}
                                            disabled={disabled}
                                            class="habit__box"
                                            class:habit__box--not-required={!required}
                                            class:habit__box--checked={complete}
                                        >
                                            {#if complete}
                                                <i class="fa-solid fa-check"></i>
                                            {/if}
                                        </button>
                                    </div>
                                {/each}
                            </div>
                            <div 
                                class="habit__progress three-col cell cell--last-col"
                                class:cell--first-row={habitIdx === 0}
                                class:four-col--min={!wkProgress.numbers}
                            >
                                {#if wkProgress.numbers}
                                    {#if wkProgress.percentage}
                                        <div class="fraction">
                                            {Math.min(Math.floor((checked / total) * 100), 100)}%
                                        </div>
                                    {:else}
                                        <div class="fraction">
                                            {checked}<span class="fraction__slash">/</span>{total}
                                        </div>
                                    {/if}
                                {/if}
                                <div style:margin="1px 25px 0px 0px">
                                    <ProgressRing 
                                        progress={checked / total} 
                                        options={{ 
                                            style: "rich-colored",
                                            size: 15,
                                            strokeWidth: 3
                                        }}
                                    />
                                </div>
                            </div>
                            <div 
                                class="grip"
                                on:pointerdown={() => isDragging = true}
                                on:pointerup={() => isDragging = false}
                            >
                                <div class="grip__icon">
                                    <SvgIcon 
                                        icon={Icon.DragDots} 
                                        options={{ scale: 1.15 }} 
                                    />
                                </div>
                            </div>
                        </div>
                    {/each}

                    <div    
                        class="habit habit--ghost dg-over-el"
                        class:dg-over-el--over={dragHabitTarget === timeOfDay}
                        class:hidden={timeOfDay != "all-day" && view === "default"}
                        style:bottom={empty ? "-20px" : "-28px"}
                        on:dragover={(e) => onHabitDragOver(e, timeOfDay)}
                        on:dragleave={onDragLeave}
                        on:dragend={onHabitDragEnd}
                    >
                        {#if isTodView && habits.length === 0}
                            <span class="habits__empty">
                                Empty
                            </span>
                        {/if}
                    </div>

                </div>
            {/each}
            {#if options.progress.daily}
                <div class="habits__count-cells">
                    <div class="habits__count-cell one-col"></div>
                    <div class="habits__count-cell two-col"></div>
                    <div class="habits__count-cell days-col">
                        {#each dayProgress as progress}
                            <div class="habits__count-cell day-col">
                                {progress < 0 ? "--" : `${progress}%`}
                            </div>
                        {/each}
                    </div>
                    <div class="habits__count-cell three-col"></div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style lang="scss">
    .habits { 
        width: 100%;
        --border: 0.5px solid rgb(var(--textColor1), 0.055);

        /* light adjustments */
        &--light {
            --border: 1px solid rgb(var(--textColor1), 0.08);
        }
        &--light &__table-header {
            @include text-style(0.7, 600);
        }
        &--light &__tod-header {
            @include text-style(0.3, 500);
        }
        &--light &__count-cell {
            @include text-style(0.5, 500);
        }
        &--light .habit__name,
        &--light .habit__streak {
            @include text-style(0.88, 600);
        }
        &--light .habit__target {
            @include text-style(0.3, 600);
        }
        &--light .fraction {
            font-weight: 600;
        }
        &--default &__table-header {
            border: none
        }
        
        /* narrow view */
        &--min .habit__target { 
            display: none;
        }
        &--min .two-col { 
            width: 50px;
        }
        &--x-min .two-col { 
            display: none;
        }
        &--x-min .three-col { 
            display: none;
        }
        &--x-min .days-col { 
            width: 60%;
        }
        &--x-min &__stat { 
            margin: 0px 0px 14px 0px !important;
            width: 120px;
        }
        &--x-min &__stats { 
            margin-bottom: 15px !important;
        }
        &--ring-only .three-col {
            width: 50px;
        }
        /* haeder */
        &__header {
            margin: 0px 0px 0px 0px;
        }
        &__subtext {
            @include text-style(0.1, 300, 1.2rem, "DM Sans");
            white-space: nowrap;
            margin-bottom: 9px;
        }
        &__stats {
            display: flex;
            flex-wrap: wrap;
            margin: -2px 0px 6px 0px;
        }
        &__stat {
            width: 120px;
            margin: 0px 8px 9px 0px;
            @include text-style(0.885, 400, 1.6rem, "Geist Mono");


            span {
                display: block;
            }
            i { 
                font-style: unset;
                margin-left: -8px;
                @include text-style(1, 300, 2rem, "Geist Mono");
            }
        }
        &__stat-bottom {
            @include flex(flex-end);
        }
        &__stat-label {
            margin-bottom: 5px;
            @include text-style(0.285, 400, 1.42rem);
        }
        &__stat-unit {
            margin: 0px 0px 0px 6px;
        }
        &__stat-unit--times {
            @include text-style(1, 300, 1.35rem);
            transform: scale(1.5);
            margin-left: 4px;
        }

        /* table */
        &__wk-period {
            @include text-style(0.25, 400, 1.4rem, "Geist Mono");
            margin-left: 14px;
        }
        &__table-header {
            display: flex;
            @include text-style(0.35, 400, 1.35rem, "Geist Mono");
            position: relative;
            padding-top: 11px;
            border-bottom: var(--border);
            border-top: var(--border) !important;
        }
        &__tod-header {
            @include text-style(0.35, 400, 1.35rem, "Geist Mono");
            @include flex(center, space-between);
            margin: 13px 0px 9px 2px;
        }
        &__tod-container {
            position: relative;
        }
        &__count-cells {
            display: flex;
            margin-top: 12px;
            // display: none;
        }
        &__count-cell {
            margin-left: 1px;
            @include text-style(0.145, 400, 1.3rem, "Geist Mono");
        }

        &__empty {
            @include text-style(0.145, 400, 1.2rem);
            margin: -5px 0px 0px 6.5px;
        }
    }
    .habit { 
        display: flex;
        padding: 0px 0px 0px 1px;
        @include text-style(1, 400, 1.35rem);
        white-space: nowrap;
        position: relative;

        &--ghost {
            height: 28px;
            width: 100%;
            @include abs-bottom-left(-28px);
            opacity: 1;
            z-index: 100;
            align-items: center;
        }
        &__symbol {
            font-size: 1.5rem;
            margin-right: 12px;
            text-decoration: none;
            font-style: normal;
        }
        &__name {
            @include text-style(1, 500, 1.45rem);
            @include elipses-overflow;
            @include flex(center, space-between);
        }
        &__target {
            @include text-style(0.16, 400, 1.35rem, "Geist Mono");
            text-align: right;
            padding-right: 15px;
        }
        &__streak {
            @include text-style(0.6, 300, 1.4rem, "Geist Mono");
            padding: 2px 15px 2px 14px;
        }
        &__streak-times {
            font-size: 1.6rem;
            margin: 0px 0px 0px 2px;
        }
        &__box {
            background-color: var(--lightColor3);
            height: 18px;
            width: 18px;
            border-radius: 0px;
            position: relative;
            font-size: 1.1rem;
            @include center;
            
            &:disabled {
                opacity: 0.4 !important;
            }
            &:hover {
                opacity: 0.55;
            }
        }
        &__box--checked {
            background-color: var(--elemColor1) !important;

            &:hover {
                opacity: 1 !important;
            }
            &:before {
                display: none;
            }
        }
        &__box--not-required {
            background-color: var(--lightColor3);

            &:hover {
                background-color: rgb(var(--textColor1), 0.045);
            }
            &:before {
                content: " ";
                @include circle(3px);
                background-color: rgba(var(--textColor1), 0.5);
                @include abs-center;
            }
        }
        &__progress {
            @include flex(center, space-between);
        }
        &__progress .fraction {
            font-family: "Geist Mono";
            font-weight: 300;
            margin: 0px 10px 0px 2px;
        }
    }
    .header-col {
        font-size: 1.34rem;
        padding: 0px 0px 9px 5px;
        // border-bottom: var(--border);
    }
    .one-col {
        padding: 0px 0px 0px 2px;
        flex: 1;
        height: 40px;
        overflow: hidden;
    }
    .one-col.cell {
        padding-left: 0px !important;
    }
    .two-col {
        width: 70px;
        overflow: hidden;
    }
    .days-col {
        display: flex;
        width: 50%;
        min-width: 240px;
    }
    .day-col {
        width: calc(100% / 7);
    }
    .dow {
        display: block;
        @include circle(20px);
        @include center;
        border-radius: 10px;
    }
    .dow--today {
        background-color: #FF5151;
        color: white;

        span {
            margin-top: -1.4px;
        }
    }
    .three-col {
        width: 100px;
        
        &--min {
            width: 50px;
        }
        &--min span {
            display: none;
        }
    }
    .cell {
        padding: 7px 0px 7px 8px;
        @include flex(center);
        border-bottom: var(--border);
        border-right: var(--border);
        
        &--first-row {
            border-top: var(--border);
        }
        &--last-col {
            border-right: none;
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
    .dg-over-el::before {
        width: calc(100% - 0px);
        @include abs-top-left(0px, 0px);
    }
</style>
