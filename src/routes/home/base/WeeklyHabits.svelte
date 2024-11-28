<script lang="ts">
    import { TEST_HABITS } from "$lib/mock-data";
	import ProgressRing from "../../../components/ProgressRing.svelte";
	import SvgIcon from "../../../components/SVGIcon.svelte";
	import { Icon } from "../../../lib/enums";
	import { themeState } from "../../../lib/store";
	import { DAYS_OF_WEEK } from "../../../lib/utils-date";

    const MIN_SIZE = 620
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

    let habits = TEST_HABITS
    let dayProgress = [0, 0, 0, 0, 0, 0, 0]
    let isDragging = false

    let sortedHabits: any = {}
    let width = 0
    let dragHabitSrc: any
    let dragHabitTarget: any

    $: isLight = !$themeState.isDarkTheme
    $: {
        view = options?.view
        wkProgress = options?.progress

        setViewOptn(view)
    }

    updateDayProgress(habits)

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

        // update regular habits
        updateDayProgress(habits)
    }
    function updateDayProgress(habits: any[]) {
        const n = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]

        for (const habit of habits) {
            const { freqType, frequency } = habit

            for (let i = 0; i < 7; i++) {
                const mandatory = freqType != "day-of-week" || Boolean((frequency >> (6 - i)) & 1)
                const completed = (habit.last7Days >> (6 - i)) & 1

                n[i][0] += completed
                n[i][1] += mandatory ? 1 : 0
            }
        }
        dayProgress = n.map((q) => Math.min(Math.floor((q[0] / q[1]) * 100), 100))
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
        setSortedHabitsToDefault()
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
        
        groupHabitsByTimeOfDay(habits)
    }
</script>

<div 
    class="wk-habits"
    class:wk-habits--min={width < MIN_SIZE}
    class:wk-habits--light={isLight}
    class:wk-habits--default={view === "default"}
    bind:clientWidth={width}
>
    <div class="wk-habits__header">
        <div class="wk-habits__col one-col header-col">
            <span>
                Habit
            </span>
        </div>
        <div class="wk-habits__col two-col header-col">
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
        <div class="wk-habits__col three-col header-col">
            <span>
                Progress
            </span>
        </div>
    </div>
    {#each Object.keys(TIMES_OF_DAY_MAP) as timeOfDay}
        {@const idx = TIMES_OF_DAY_MAP[timeOfDay]}
        {@const habits = sortedHabits[idx]}
        {@const tod = timeOfDay === "all-day" ? "all day" : timeOfDay}
        {@const empty = habits.length === 0}
        {@const isTodView = view === "time-of-day"}
            <div 
                class="wk-habits__tod-container"
                style:margin-bottom={empty && isTodView ? "30px" : ""}
                style:min-height={isTodView ? "30px" : ""}
            >
                <div 
                    class="wk-habits__tod-header"
                    class:wk-habits__tod-header--morning={timeOfDay === "morning"}
                    class:hidden={view === "default"}
                >
                    <span>
                        {tod}
                    </span>
                </div>
    
                {#each habits as habit, habitIdx}
                    {@const { checked, total } = getProgress(habit)}
                    {@const isDragOver = dragHabitTarget?.name === habit.name}
                    <div    
                        class="wk-habit dg-over-el" 
                        class:dg-over-el--over={isDragOver}
                        draggable="true"
                        on:dragstart={(e) => onHabitDrag(e, habit)}
                        on:dragover={(e) => onHabitDragOver(e, habit)}
                        on:dragleave={onDragLeave}
                        on:dragend={onHabitDragEnd}
                    >
                        <div 
                            class="wk-habit__name one-col cell"
                            class:cell--first-row={habitIdx === 0}
                        >
                            <div class="flx">
                                <span class="wk-habit__symbol">
                                    {habit.symbol}
                                </span>
                                <span>
                                    {habit.name}
                                </span>
                            </div>
                            <div class="wk-habit__target">
                                {habit.target ?? ""}
                            </div>
                        </div>
                        <div 
                            class="wk-habit__streak two-col cell"
                            class:cell--first-row={habitIdx === 0}
                        >
                            <span>
                                {habit.streak}
                            </span>
                        </div>
                        <div class="days-col">
                            {#each DAYS_OF_WEEK as _, dayIdx}
                                {@const num = habit.last7Days}
                                {@const checkable = isBoxCheckable(habit, dayIdx)}
                                {@const checked = ((num >> (6 - dayIdx)) & 1) === 1}
                                <div
                                    title={checkable ? "" : "Check in not required for this day."}
                                    class="day-col day-col cell"
                                    class:cell--first-row={habitIdx === 0}
                                >
                                    <button 
                                        on:click={() => toggleCompleteHabit(habit, dayIdx)}
                                        class="wk-habit__box"
                                        class:wk-habit__box--not-checkable={!checkable}
                                        class:wk-habit__box--checked={checked}
                                    >
                                        {#if checked}
                                            <i class="fa-solid fa-check"></i>
                                        {/if}
                                    </button>
                                </div>
                            {/each}
                        </div>
                        <div 
                            class="wk-habit__progress three-col cell cell--last-col"
                            class:cell--first-row={habitIdx === 0}
                            class:four-col--min={!wkProgress.detailed}
                        >
                            {#if wkProgress.detailed}
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
                            <div class="wk-habit__progress-ring">
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
                    class="wk-habit wk-habit--ghost dg-over-el"
                    class:dg-over-el--over={dragHabitTarget === timeOfDay}
                    class:hidden={timeOfDay != "all-day" && view === "default"}
                    style:bottom={empty ? "-20px" : "-28px"}
                    on:dragover={(e) => onHabitDragOver(e, timeOfDay)}
                    on:dragleave={onDragLeave}
                    on:dragend={onHabitDragEnd}
                >
                    {#if isTodView && habits.length === 0}
                        <span class="wk-habits__empty">
                            Empty
                        </span>
                    {/if}
                </div>

            </div>
    {/each}
    <div class="wk-habits__count-cells">
        <div class="wk-habits__count-cell one-col"></div>
        <div class="wk-habits__count-cell two-col"></div>
        <div class="wk-habits__count-cell days-col">
            {#each dayProgress as progress}
                <div class="wk-habits__count-cell day-col">
                    {`${progress}%`}
                </div>
            {/each}
        </div>
        <div class="wk-habits__count-cell three-col"></div>
    </div>
</div>

<style lang="scss">
    .wk-habits { 
        width: 100%;
        min-width: 560px;

        --border: 0.5px solid rgb(var(--textColor1), 0.065);

        /* light adjustments */
        &--light {
            --border: 1px solid rgb(var(--textColor1), 0.08);
        }
        &--light &__header {
            @include text-style(0.7, 600);
        }
        &--light &__tod-header {
            @include text-style(0.3, 500);
        }
        &--light &__count-cell {
            @include text-style(0.5, 500);
        }
        &--light .wk-habit__name,
        &--light .wk-habit__streak {
            @include text-style(0.88, 600);
        }
        &--light .wk-habit__target {
            @include text-style(0.3, 600);
        }
        &--light .fraction {
            font-weight: 600;
        }
        &--default &__header {
            border: none
        }

        /* narrow view */
        &--min .one-col { 
            min-width: 40px;
            width: 40px;
            @include elipses-overflow;
        }
        &--min .two-col { 
            @include elipses-overflow;
        }
        &--min .wk-habit__name span:last-child { 
            display: none;
        }

        &__header {
            display: flex;
            @include text-style(0.35, 500);
            position: relative;
            border-bottom: var(--border);
            // display: none;

        }
        &__tod-header {
            @include text-style(0.35, 400, 1.35rem, "DM Sans");
            @include flex(center, space-between);
            margin: 13px 0px 9px 2px;
            
            &--morning {
                margin: 5px 0px 9px 2px;
            }
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
            @include text-style(0.145, 400, 1.3rem, "DM Sans");
        }

        &__empty {
            @include text-style(0.145, 400, 1.2rem);
            margin: -5px 0px 0px 6.5px;
        }
    }
    .wk-habit { 
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

        &::before {
            left: 0px;
            width: 100%;
        }

        &__symbol {
            font-size: 1.45rem;
            margin-right: 12px;
            display: none
        }
        &__name {
            @include text-style(1, 500, 1.4rem);
            @include elipses-overflow;
            @include flex(center, space-between);
        }
        &__target {
            padding: 4px 16px 3px 7px;
            @include text-style(0.16, 500, 1.4rem, "Manrope");
            text-align: right;
        }
        &__streak {
            @include text-style(0.6, 400, 1.4rem, "DM Sans");
            padding: 2px 15px 2px 14px;
        }
        &__box {
            background-color: var(--lightColor3);
            color: var(--elemTextColor);
            height: 18px;
            width: 18px;
            border-radius: 0px;
            position: relative;
            font-size: 1.1rem;
            @include center;
            
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
        &__box--not-checkable {
            background-color: var(--lightColor3);

            &:hover {
                background-color: rgb(var(--textColor1), 0.045);
            }
            &:before {
                content: " ";
                height: 1.5px;
                width: 5px;
                background-color: rgba(var(--textColor1), 0.5);
                @include abs-center;
            }
        }
        &__progress {
            @include flex(center, space-between);

            &-ring {
                margin: 1px 38px 0px 0px;
            }
        }
        &__progress .fraction {
            margin: 0px 10px 0px 2px;
        }
    }
    .header-col {
        font-size: 1.34rem;
        padding: 0px 0px 9px 5px;
        // border-bottom: var(--border);
    }
    .one-col {
        width: 230px;
        min-width: 150px;
        padding: 0px 0px 0px 2px;
    }
    .one-col.cell {
        padding-left: 0px !important;
    }
    .two-col {
        width: 70px;
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
    .three-col {
        width: 120px;
        
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
</style>
