<script lang="ts">
	import { onMount } from "svelte"
    
    import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { habitTracker } from "$lib/store"
	import { kebabToNormal } from "$lib/utils-general"
	import { isDowIdxRequired } from "$lib/utils-habits-data"
	import { DAYS_OF_WEEK, getMonthDayNumbers, isSameMonth } from "$lib/utils-date"
	import { getHabitTableData, toggleCompleteHabit, initData, viewHabit } from "$lib/utils-habits"
	import { getHabitStreak, reorderInTimeOfDayView, reorderInDefaultView, TIMES_OF_DAY_MAP } from "$lib/utils-habits"

	import SvgIcon from "$components/SVGIcon.svelte"
	import ProgressRing from "$components/ProgressRing.svelte"

    const MIN_SIZE = 620
    const X_MIN_SIZE = 480
    const WIDE_SIZE = 1000

    export let timeFrame: "weekly" | "monthly" = "weekly"
    export let month: Date = new Date()
    export let weeksAgoIdx: number = 0
    export let options: HabitTableOptions

    let view = options?.view
    let store = habitTracker
    
    let dayProgress: number[][] = []
    let rowProgress = new Map<string, { complete: number, total: number }>()
    
    let habits: Habit[] = []
    let metrics: HabitMonthMetrics | null = null
    let activeStreak: HabitActiveStreak | null = null
    let sortedHabits: Habit[][] = []
    
    let currMonth = new Date()
    let weekIdx = 0
    let lastHabitItem: Habit | null = null
    
    let isDragging = false
    let dragHabitSrc: any
    let dragHabitTarget: any
    
    let width = 0
    let scrollLeft = 0
    let dayElems: HTMLElement[] = []
    
    $: isLight = !$themeState.isDarkTheme
    $: resetUI(options)
    $: onTimeFrameChange(month, weeksAgoIdx)
    
    $: {
        view = options?.view
        setGrouping()
        habits = habits
    }
    
    store.subscribe((data) => {
        habits = data.habits
        activeStreak = data.activeStreak
        metrics = data.monthMetrics
        
        resetUI()
        setGrouping()
    })

    initCounters()

    function onTimeFrameChange(month: Date, weeksAgoIdx: number) {
        if (timeFrame === "monthly") {
            const monthIdx = month.getMonth()
            const year = month.getFullYear()

            currMonth = new Date(year, monthIdx)
            initData(year, monthIdx)
        }
        else {
            weekIdx = weeksAgoIdx
        }
        resetCounters()
        habits = habits
    }

    /* data */
    function toggleComplete({ habit, date }: { habit: Habit, date: Date }) {
        resetCounters()
        toggleCompleteHabit({ habit, date, currMonth })  
    }
    function getHabitData(habit: Habit): HabitDayData[] {
        const data = getHabitTableData({ 
            habit, timeFrame, weekIdx, currMonth, dayProgress, rowProgress 
        })
        if (lastHabitItem?.id === habit.id) {
            rowProgress = rowProgress
            dayProgress = dayProgress
        }
        return data
    }
    function getHabitProgress(habit: Habit) {
        try {
            const { complete, total } = rowProgress.get(habit.id)!
            return { complete, total }
        }
        catch (e) {
            return { complete: 0, total: 0 }
        }
    }
    function resetCounters() {
        initCounters()
        rowProgress = new Map()
    }
    function initCounters() {
        if (timeFrame === "weekly") {
            dayProgress = new Array(7).fill([0, 0])
        }
        else {
            dayProgress = new Array(getMonthDayNumbers(new Date())).fill([0, 0])
        }
    }

    /* ui */
    function setGrouping() {
        if (view === "default") {
            groupByDefault()
        }
        else {
            groupByTimeOfDay(habits)
        }

        setLastHabitItem()
    }
    function getDaysHeader() {
        if (timeFrame === "weekly") {
            return DAYS_OF_WEEK.map(day => day.substring(0, 1))
        }
        else {
            const length = getMonthDayNumbers(new Date())
            return Array.from({ length }, (_, i) => `${i + 1}`)
        }
    }
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
    function setLastHabitItem() {
        const lastGroup = sortedHabits.findLast(sec => sec.length > 0)
        lastHabitItem = lastGroup ? lastGroup[lastGroup.length - 1] : null
    }
    function resetUI(_?: HabitTableOptions) {
        resetCounters()
        requestAnimationFrame(() => {
            getDaysElems()

            dayElems.forEach(elem => elem.scrollLeft = scrollLeft)
        })
    }

    /* drag */
    function onHabitDrag(e: DragEvent, habit: any) {
        e.dataTransfer!.effectAllowed = "move"

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
            onReorder()
        }
        isDragging = false
        dragHabitSrc = null
        dragHabitTarget = null
    }
    function onReorder() {
        if (view === "default") {
            reorderInDefaultView({ 
                srcHabit: dragHabitSrc, 
                targetHabit: dragHabitTarget, 
                habits 
            })
        } 
        else {
            reorderInTimeOfDayView({ 
                srcHabit: dragHabitSrc, 
                targetHabit: dragHabitTarget, 
                habits
            })
        }
        habitTracker.update((state) => ({ ...state, habits }))
    }

    /* month stuff */
    function daysScrollHandler(event: Event) {
        const target = event.target as HTMLElement
        scrollLeft = target.scrollLeft

        dayElems.forEach(elem => elem.scrollLeft = scrollLeft)
    }
    function getDaysElems() {
        const days = document.querySelectorAll(".days-col")
        days.forEach(day => dayElems.push(day as HTMLElement))
    }
    function dowIdxToday(idx: number, month: Date, weeksAgoIdx: number) {
        if (timeFrame === "weekly" && weeksAgoIdx === 0) {
            return idx === new Date().getDay()
        }
        else {
            return isSameMonth(new Date(), month) && idx === new Date().getDate() - 1
        }
    }

    onMount(() => requestAnimationFrame(() => getDaysElems()))

</script>

<div 
    class="habits"
    class:habits--x-min={width < X_MIN_SIZE}
    class:habits--min={width < MIN_SIZE}
    class:habits--wide={width > WIDE_SIZE}
    class:habits--light={isLight}
    class:habits--default={view === "default"}
    class:habits--ring-only={!options.progress.numbers}
    class:habits--monthly={timeFrame === "monthly"}
    class:habits--dotted={options.checkboxStyle === "minimal"}
    style:--day-col-size={timeFrame === "weekly" ? "1.34rem" : "1.15rem"}
    style:border-top={!options.stats ? "none" : "var(--divider-border)"}
    bind:clientWidth={width}
>

    {#if habits && metrics}
        {@const todView = view === "time-of-day"}
        {@const days = getDaysHeader()}
        {@const { emojis, progress, checkboxStyle, bottomDetails, allowCaptions } = options}
        {@const { habitsDone, habitsDue } = metrics}
        {@const lastSectionEmpty = (todView && sortedHabits[3].length === 0) || habits.length === 0}

        <div class="habits__table">
            <div class="habits__table-header">
                <div 
                    class="habits__col one-col header-col"
                    style:height="auto"
                >
                    <span>Habit</span>
                </div>
                <div class="habits__col two-col header-col">
                    <span>Streak</span>
                </div>
                <div 
                    class="days-col no-scroll-bar" 
                    on:scroll={daysScrollHandler}
                >
                    {#each days as day, idx}
                        {@const today = dowIdxToday(idx, month, weeksAgoIdx)}

                        <div class="habits__col day-col header-col">
                            <div class="dow" class:dow--today={today} >
                                <span>
                                    {day}
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="habits__col three-col header-col">
                    <span 
                        class:hidden={!progress.numbers}
                        style:margin-left="12px"
                    >
                        Progress
                    </span>
                    <div 
                        style:margin="1px 25px -10px 10px"
                        class:hidden={progress.numbers}
                    >
                        <ProgressRing 
                            progress={habitsDone / habitsDue} 
                            options={{  size: 15, strokeWidth: 3 }}
                        />
                    </div>
                </div>
            </div>
            {#each Object.keys(TIMES_OF_DAY_MAP) as timeOfDay}
                {@const idx = TIMES_OF_DAY_MAP[timeOfDay]}
                {@const habits = sortedHabits[idx]}
                {@const empty = habits.length === 0}
                <div 
                    class="habits__tod-container"
                    style:margin-bottom={empty && todView ? "30px" : ""}
                    style:min-height={todView ? "30px" : ""}
                >
                    <div 
                        class="habits__tod-header"
                        style:margin={timeOfDay === "morning" ? "8px 0px 9px 0px" : ""}
                        class:hidden={view === "default"}
                    >
                        <span>
                            {kebabToNormal(timeOfDay)}
                        </span>
                    </div>
        
                    {#each habits as habit, habitIdx}
                        {@const { name, symbol, caption, freqType } = habit}
                        {@const isDragOver = dragHabitTarget?.name === habit.name}
                        {@const streak = getHabitStreak(habit)}
                        {@const completions = getHabitData(habit)}
                        {@const { complete, total } = getHabitProgress(habit)}

                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div    
                            data-default-idx={habit.order.default}
                            data-tod-idx={habit.order.tod}
                            class="habit drop-top-border" 
                            class:drop-top-border--over={isDragOver}
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
                                    {#if emojis}
                                        <i class="habit__symbol">
                                            {symbol}
                                        </i>
                                    {/if}
                                    <button 
                                        style:margin-right="20px"
                                        on:click={() => viewHabit(habit)}
                                    >
                                        {name}
                                    </button>
                                </div>
                                {#if caption && allowCaptions}
                                    <span class="habit__caption">
                                        {habit.caption}
                                    </span>
                                {/if}
                            </div>
                            <div 
                                class="habit__streak two-col cell"
                                class:cell--first-row={habitIdx === 0}
                            >
                                <span>
                                    {streak}×
                                </span>
                            </div>
                            <div 
                                class="days-col no-scroll-bar"
                                on:scroll={daysScrollHandler}
                            >
                                {#each completions as completion}
                                    {@const { date, complete, noData, beyondBounds, required } = completion}
                                    {@const startOfWeek = date.getDay() === 6}
                                    {@const future = date > new Date()}
                                    {@const dowRequired = freqType === "day-of-week" ? isDowIdxRequired(habit.frequency, date.getDay()) : true}
                                    {@const title = noData ? "No data for this day." : dowRequired ? "" : "Check in not required for this day."}
                                    {@const show = !future && !noData}
                                    {@const disabled = noData || beyondBounds || future}
                                    {@const lofi = noData || future}
                                    {@const dateStr = date?.toLocaleDateString()}
                                    {@const notReqStyle = freqType === "day-of-week" && !dowRequired && !noData}

                                    <div
                                        title={title}
                                        class="habit__box-cell day-col day-col cell"
                                        class:habit__box-cell--lofi={lofi}
                                        class:habit__box-cell--disabled={disabled}
                                        class:cell--first-row={habitIdx === 0}
                                        class:day-col--div={startOfWeek && timeFrame === "monthly"}
                                    >
                                        {#if checkboxStyle === "box"}
                                            <button 
                                                {disabled}
                                                title={dateStr}
                                                class="habit__box"
                                                class:habit__box--not-required={notReqStyle}
                                                class:habit__box--checked={complete}
                                                on:click={() => toggleComplete({ habit, date })}
                                            >
                                                {#if complete && show}
                                                    <i class="fa-solid fa-check"></i>
                                                {/if}
                                            </button>
                                        {:else if checkboxStyle === "minimal"}
                                            <button 
                                                {disabled}
                                                title={dateStr}
                                                class="habit__dot"
                                                class:habit__dot--checked={complete}
                                                class:habit__dot--not-required={notReqStyle && !noData}
                                                class:habit__dot--missed={!complete && required && !noData}
                                                class:habit__dot--lofi={lofi}
                                                class:habit__dot--no-data={noData}
                                                on:click={() => toggleComplete({ habit, date })}
                                            >
                                                {#if complete && show}
                                                    <i class="fa-solid fa-check"></i>
                                                {:else if !complete && required && show}
                                                    <i class="fa-solid fa-xmark"></i>
                                                {/if}
                                            </button>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                            <div 
                                class="habit__progress three-col cell cell--last-col"
                                class:cell--first-row={habitIdx === 0}
                                class:four-col--min={!progress.numbers}
                            >
                                {#if progress.numbers}
                                    {#if total === 0}
                                        <div class="fraction" style:opacity="0.25">
                                            --
                                        </div>
                                    {:else if progress.percentage}
                                        <div class="fraction">
                                            {Math.min(Math.floor((complete / total) * 100), 100)}%
                                        </div>
                                    {:else}
                                        <div class="fraction">
                                            {complete}<span class="fraction__slash">/</span>{total}
                                        </div>
                                    {/if}
                                {/if}
                                <div style:margin="1px 25px 0px 0px">
                                    <ProgressRing 
                                        progress={total === 0 ? 0 : complete / total} 
                                        options={{ 
                                            style: "colored", size: 15, strokeWidth: 3
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

                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div    
                        class="habit habit--ghost drop-top-border"
                        class:drop-top-border--over={dragHabitTarget === timeOfDay}
                        class:hidden={timeOfDay != "all-day" && view === "default"}
                        style:bottom={empty ? "-20px" : "-28px"}
                        on:dragleave={onDragLeave}
                        on:dragend={onHabitDragEnd}
                        on:dragover={(e) => {
                            onHabitDragOver(e, timeOfDay)
                        }}
                    >
                        {#if todView && habits.length === 0}
                            <span class="habits__empty">
                                --
                            </span>
                        {/if}
                    </div>
                </div>
            {/each}
            <div 
                class="habits__count-cells" 
                class:habits__count-cells--empty={lastSectionEmpty}
                class:hidden={!bottomDetails}
            >
                <div class="habits__count-cell one-col">
                    {habits.length} Total
                </div>
                <div class="habits__count-cell two-col">
                    {activeStreak?.count}×
                </div>
                <div class="habits__count-cell days-col" on:scroll={daysScrollHandler}>
                    {#each dayProgress as progress}
                        {@const [required, complete] = progress}
                        {@const percent = Math.min(Math.floor((complete / required) * 100), 100) ?? 0}
                        {@const val = required ? (percent < 0 ? "" : `${percent}%`) : ""}
                        {@const filled = val.length > 0}

                        <div 
                            class="habits__count-cell day-col"
                            class:habits__count-cell--filled={filled}
                            style:padding-left="4px"
                        >
                            <span>{val}</span>
                        </div>
                    {/each}
                </div>
                <div class="habits__count-cell three-col">
                    {habitsDue === 0 ? "" : Math.floor((habitsDone / habitsDue) * 100) + "%"}
                </div>
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    .habits { 
        width: 100%;
        max-width: 100%;
        border-top: var(--divider-border);
        padding-top: 5px;

        button:disabled {
            opacity: 1;
        }

        --dot-opacity: 0.16;
        --x-mark-color: rgb(136, 89, 89);
        --dash-div: 1.5px dashed rgba(var(--textColor1), 0.07);
        --month-width: 55%;
        
        &--light {
            --dash-div: 1.5px dashed rgba(var(--textColor1), 0.185);
            --x-mark-color: rgb(182, 109, 109);
        }
        &--light &__table-header {
            @include text-style(0.45);
        }
        &--light &__tod-header {
            @include text-style(0.45);
        }
        &--light .fraction {
            @include text-style(0.8);
        }
        &--light &__count-cell {
            @include text-style(0.55);
        }
        &--light .fraction {
            @include text-style(0.8);
        }
        &--light .habit__name {
            @include text-style(1);
        }
        &--light .habit__streak {
            @include text-style(0.8);
            font-weight: 500;
        }
        &--light .habit__caption {
            @include text-style(0.385);
        }
        &--light .habit__box:hover {
            background-color: rgba(var(--textColor1), 0.15);
            opacity: 1;
        }
        &--default &__table-header {
            border: none
        }
        
        /* narrow view */
        &--x-min .two-col { 
            display: none;
        }
        &--x-min .three-col { 
            display: none;
        }
        &--x-min .days-col { 
            width: 60%;
        }
        &--min .habit__caption { 
            display: none;
        }
        &--min .two-col { 
            width: 50px;
        }
        &--min {
            --month-width: 200px;
        }
        &--wide {
            --month-width: 65%;
        }
        &--ring-only .three-col {
            width: 50px;
        }

        /* monthly view */
        &--monthly .days-col {
            width: var(--month-width);
            max-width: unset;
        }
        &--monthly .day-col {
            min-width: 38px;
            width: 38px;
            padding: 0px;
        }
        &--monthly .habit .day-col {
            @include center;
        }
        &--monthly .dow {
            width: 32px;
            padding: 0px 7px 0px 7px; 
            @include center;
        }
        &--monthly .habit__box {
            @include square(16px);
        }
        &--dotted .dow {
            width: 26px;
        }
        &--dotted .day-col {
            min-width: 30px;
        }
        &--dotted .day-col {
            border-right: none;
        }

        &__header {
            margin: 0px 0px 0px 0px;
            position: relative;
        }
        &__table-header {
            display: flex;
            @include text-style(0.35, var(--fw-400-500), 1.4rem);
            position: relative;
            border-bottom: var(--divider-border);
            height: 30px;
        }
        &__table-header--border {
            border-top: var(--divider-border) !important;
        }
        &__tod-header {
            @include text-style(0.35, var(--fw-400-500), 1.35rem);
            @include flex(center, space-between);
            margin: 8px 0px 9px 0px;
        }
        &__tod-container {
            position: relative;
        }
        &__count-cells {
            display: flex;
            padding-top: 10px;
            
            &--empty {
                border-top: var(--divider-border);
            }
        }
        &__count-cell {
            @include text-style(0.145, var(--fw-400-500), 1.25rem);
            position: relative;
            height: 25px;

            &--filled {
                margin-right: 0px;
            }
            span {
                top: 0px;
                left: 0px;
            }
        }
        &__empty {
            @include text-style(0.145, var(--fw-400-500), 1.35rem);
            margin: -5px 0px 0px -1px;
        }
        .fa-xmark {
            color: var(--x-mark-color);
        }
    }
    .habit { 
        display: flex;
        padding: 0px 0px 0px 1px;
        @include text-style(1, 400, 1.35rem);
        white-space: nowrap;
        height: 35px;
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
            font-size: 1.35rem;
            margin-right: 12px;
            text-decoration: none;
            font-style: normal;
        }
        &__name {
            @include elipses-overflow;
            @include flex(center, space-between);
            
            button {
                @include text-style(1, var(--fw-400-500), 1.425rem);

                &:hover {
                    text-decoration: underline;
                }
            }
        }
        &__caption {
            @include text-style(0.16, var(--fw-400-500), 1.25rem);
            transition: 0.1s ease-in-out;
            text-align: right;
            padding-right: 15px;
        }
        &__streak {
            @include text-style(0.6, var(--fw-500-600), 1.3rem);
        }
        &__streak-times {
            font-size: 1.6rem;
            margin: 0px 0px 0px 2px;
        }
        &__box-cell {
            @include center;

            button {
                transition-property: transform, opacity;
            }
            &--lofi button {
                opacity: 0.3 !important;
                transform: scale(1);
            }
            &--disabled button {
                pointer-events: none;
                transform: scale(1);
            }
        }
        &__box {
            background-color: var(--lightColor2);
            @include square(18px);
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
            color: white;

            &:hover {
                opacity: 1 !important;
            }
            &:before {
                display: none;
            }
        }
        &__box--not-required {
            background-color: var(--lightColor2);

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
        &__dot {
            @include circle(4px);
            position: relative;
            font-size: 1.3rem;
            @include center;
            background-color: rgba(var(--textColor1), var(--dot-opacity));

            &--missed {
                --dot-opacity: 0;
            }
            &--checked {
                --dot-opacity: 0;
            }
            &--lofi {
                --dot-opacity: 0.16;
                opacity: 0.15 !important;
            }
        }
        &__progress {
            @include flex(center, space-between);
            border-left: var(--divider-border);
            padding-left: 10px !important;
        }
    }
    .header-col {
        font-size: 1.34rem;
        padding: 4px 0px 0px 0px !important;
    }
    .one-col {
        padding: 0px 0px 0px 2px;
        flex: 1;
        overflow: hidden;
    }
    .one-col.cell {
        padding-left: 0px !important;
    }
    .two-col {
        width: 60px;
        overflow: hidden;
        padding: 0px 15px 0px 9px;
    }
    .days-col {
        display: flex;
        overflow: auto;
        width: 50%;
        min-width: 240px;
        max-width: 420px;

        font-size: var(--day-col-size);
    }
    .day-col {
        width: calc(100% / 7);
        
        &:last-child {
            border-right: none;
        }
        &--div {
            border-right: var(--dash-div) !important;
        }
    }
    .dow {
        display: block;
        @include center;
        border-radius: 10px;
        margin: 1px 0px 0px 1px;
    }
    .dow--today {
        background-color: var(--calMarkColor);
        color: white;
        @include square(20px, 20px);
        width: 20px !important;
        margin: 0 auto;
        margin-top: -2px;

        span {
            font-size: 1.2rem;
        }
    }
    .three-col {
        width: 105px;
        
        &--min {
            width: 50px;
        }
        &--min span {
            display: none;
        }
    }
    .cell {
        @include flex(center);
        border-bottom: var(--divider-border);
        border-right: var(--divider-border);
        
        &--first-row {
            border-top: var(--divider-border);
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
    .drop-top-border::before {
        width: calc(100% - 0px);
        @include abs-top-left(0px, 0px);
    }
</style>
