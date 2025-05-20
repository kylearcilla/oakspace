
<script lang="ts">
    import { goalTracker, habitTracker, themeState } from "$lib/store"

    import { getSwatchColors } from "$lib/utils-colors"
	import { getMonthOverviewData } from "$lib/utils-habits";
	import { formatDateLong, uptoToday } from "$lib/utils-date"
    import { genMonthCalendar, isSameDay } from "$lib/utils-date"
    import { GOALS_LIST_MAX, PHOTO_OFFSETS } from "$lib/constants"
	import { initFloatElemPos, randomArrayElem } from "$lib/utils-general"
	import { getMonthSessionData, getTotalFocusTimeStr } from "$lib/utils-session"
	import { getIdxFromMo, getMonthGoalsOverview, getPeriodData, moveGoalDueDate, setViewGoal, setViewGoalNew, toggleGoalStatus } from "$lib/utils-goals"

	import ImgModal from "$components/ImgModal.svelte"
	import DailyGoals from "$components/DailyGoals.svelte"
	import BounceFade from "$components/BounceFade.svelte"
	import DailyHabits from "$components/DailyHabits.svelte"
	import TextEntryElem from "$components/TextEntry.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import ProgressRing from "$components/ProgressRing.svelte"
	import DailySessions from "$components/DailySessions.svelte"
	import AccomplishedIcon from "$components/AccomplishedIcon.svelte"
	import { Icon } from "$lib/enums";

    export let timeFrame: GoalViewTimeFrame
    export let options: OverviewOptions
    export let monthEntry: TextEntry | null

    $: isLight = !$themeState.isDarkTheme

    const POP_MENU_ID = "overview-pop-menu"
 
    let imgOpen: string | null = null
    
    let goalClicked: Goal | null = null

    let editEntry: EditEntry | null = null
    let dayView: "habits" | "goals" | "sessions" | null = null
    let dayMenu = false

    let contextMenu = false
    
    let contextMenuPos = { left: 0, top: 0 }
    let dayViewPos = { left: 0, top: 0 }
    let clientPos = { left: 0, top: 0 }
    
    let dragGoal: Goal | null = null
    let dragOverDate: Date | null = null
    
    let weeks: DayEntry[][] = []
    let gridWidth = 0
    let acalRef: HTMLElement | null = null
    
    $: animPhotos = options?.animPhotos ?? true
    $: if (timeFrame) {
        initData()
    }

    goalTracker.subscribe(() => initData())
    habitTracker.subscribe(() => initData())

    async function initData() {
        const { period, year } = timeFrame
        const moIdx = getIdxFromMo(period)
        const month = genMonthCalendar(new Date(year, moIdx, 1))
        const days = month.days

        const goals = getMonthGoalsOverview({ year, moIdx })
        const habits = await getMonthOverviewData(year, moIdx)
        const sessions = getMonthSessionData(year, moIdx)

        const data: DayEntry[] = []
        let dayIdx = 0

        for (let d = 0; d < days.length; d++) {
            const { isInCurrMonth, date } = days[d]
            const habitData = habits ? habits[dayIdx] : null
            const goalsData = goals[dayIdx]?.goals ?? []
            const sessionData = sessions[dayIdx]!

            const goalsWithImages = goalsData.filter(g => g.img?.src)
            const sortedGoals = goalsWithImages.sort((a, b) => a.name.localeCompare(b.name))
            const img = sortedGoals[0]?.img?.src

            const showHabit = habitData && !habitData.noData && uptoToday(habitData.date)

            if (isInCurrMonth) {
                data.push({
                    date,
                    currMonth: true,
                    img: img ?? null,
                    focusMins: 0,
                    habits: showHabit ? { 
                        checked: habitData.trueDone ?? 0,  
                        total: habitData.due ?? 0, 
                        trueChecked: habitData.trueDone ?? 0
                    } : null,
                    goals: goalsData,
                    sessions: sessionData.sessions
                })
                dayIdx++
            }
            else {
                data.push({
                    currMonth: false,
                    date: days[d].date,
                    img: null,
                    focusMins: null,
                    habits: null,
                    goals: null,
                    sessions: null
                })
            }
        }
        for (let w = 0; w < 6; w++) {
            weeks[w] = []
            for (let d = 0; d < 7; d++) {
                weeks[w][d] = data[7 * w + d]!
            }
	    }
        weeks = weeks
    }
    function addGoal(date: Date) {
        setViewGoalNew({ timeFrame, day: date })
    }
    function pointerDown(e: PointerEvent, goal: Goal) {
        const target = e.target as HTMLElement
        if (e.button !== 0) {
            return
        }
        if (target.closest(".acal__goal-checkbox") || target.closest(".acal__goal-done-icon")) {
            e.preventDefault()
            return
        }
        goalClicked = goal
    }
    function pointerUp() {
        if (goalClicked) {
            setViewGoal(goalClicked)
            goalClicked = null
        }
    }

    /* options */
    function initEditEntry({ e, entry, contextMenu = false }: { e: Event, entry: DayEntry, contextMenu?: boolean }) {
        const _data = editEntry?.date
        if (contextMenu && _data && isSameDay(_data, entry.date)) {
            dayMenu = false
            return false
        }
        initClientPos(e)

        const goals = entry.goals ?? []
        const sessions = entry.sessions ?? []
        const habits = entry.habits ?? { checked: 0, total: 0 }

        const upToToday = uptoToday(entry.date)
        const completedGoals = goals.filter(g => g.status === 'accomplished')
        const fractionStr = (num: number, denom: number) => denom ? `${num} / ${denom}` : "0"

        editEntry = {
            ...entry,
            h_context: upToToday ? {
                str: fractionStr(habits.checked, habits.total),
                checked: habits.checked,
                total: habits.total
            } : null,
            g_context: {
                str: fractionStr(completedGoals.length, goals.length),
                checked: completedGoals.length,
                total: goals.length,
                items: goals
            },
            s_context: upToToday && sessions.length > 0 ? {
                str: getTotalFocusTimeStr(sessions),
                focusMins: sessions.reduce((acc, s) => acc + s.focusTime, 0),
                items: sessions
            } : null
        }
        return true
    }
    function onContextMenu({ e, entry }: { e: Event, entry: DayEntry }) {
        initEditEntry({ e, entry, contextMenu: true })
        const { left, top } = acalRef!.getBoundingClientRect()

        contextMenuPos = initFloatElemPos({
            dims: { 
                height: 130,
                width: 140
            }, 
            containerDims: { 
                height: acalRef!.clientHeight, 
                width: acalRef!.clientWidth
            },
            cursorPos: {
                left: clientPos.left - left,
                top: clientPos.top - top
            }
        })
        contextMenu = true
    }

    function getOptnHeight(optn: string, count: number) {
        if (optn === "habits") {
            return count * 40 + 100
        }
        else if (optn === "goals") {
            return count * 30 + 100
        }
        else {
            return count * 50 + 150
        }
    }
    function initClientPos(e: Event) {
        const pe = e as PointerEvent
        clientPos = { left: pe.clientX, top: pe.clientY }
    }
    function onViewOption(optn: string) {
        const { habits, goals, sessions, date } = editEntry!
        let dims = { height: 0, width: 0 }

        if (optn === "Daily Habits") {
            dayView = "habits"
            dims = { 
                height: getOptnHeight("habits", habits!.total), 
                width: 200 
            }
        }
        else if (optn === "Your Goals") {
            dayView = "goals"
            dims = { 
                height: getOptnHeight("goals", goals!.length), 
                width: 200 
            }
        }
        else if (optn === "Focus Time") {
            dayView = "sessions"
            dims = { 
                height: getOptnHeight("sessions", sessions!.length), 
                width: 200 
            }
        }
        else {
            addGoal(date)
        }

        const { left, top } = acalRef!.getBoundingClientRect()
        dims.height = Math.min(dims.height, 400)

        dayViewPos = initFloatElemPos({
            dims, 
            containerDims: { 
                height: acalRef!.clientHeight, 
                width: acalRef!.clientWidth
            },
            cursorPos: {
                left: clientPos.left - left - 30,
                top: clientPos.top - top + 5
            }
        })

        dayMenu = true
        contextMenu = false
    }

    /* drag and drop */
    function onDragStart({ e, goal, date }: { e: DragEvent, goal: Goal, date: Date }) {
        const target = e.target as HTMLElement

        e.dataTransfer?.setData("text", "")
        e.dataTransfer!.effectAllowed = "move"

        dragGoal = goal

        dragOverDate = date
        target.addEventListener("dragend", () => onDragEnd(e))
    }
    function onDragEnd(e: DragEvent) {
        const target = e.target as HTMLElement

        if (dragGoal && dragOverDate) {
            moveGoalDueDate(dragGoal, dragOverDate)
        }

        dragOverDate = null
        goalClicked = null
        dragGoal = null

        target.removeEventListener("dragend", onDragEnd)
    }
    initData()
</script>

{#if options.textBlock && monthEntry}
    {#key monthEntry}
        <div style:margin="0px 0px -18px 0px">
            <TextEntryElem zIndex={50} entry={monthEntry}/>
        </div>
    {/key}
{/if}

<div 
    bind:this={acalRef}
    class="acal"
    class:acal--light={isLight}
    style:--GRID_WIDTH={`${gridWidth}px`}
>
    {#if weeks}
        <div class="acal__days">
            <div class="acal__dow">Sun</div>
            <div class="acal__dow">Mon</div>
            <div class="acal__dow">Tue</div>
            <div class="acal__dow">Wed</div>
            <div class="acal__dow">Thu</div>
            <div class="acal__dow">Fri</div>
            <div class="acal__dow">Sat</div>
        </div>
        <div class="acal__month" bind:clientWidth={gridWidth}>
            {#each weeks as week, weekIdx}
                <div class="acal__week">
                    {#each week as entry}
                        {@const { date, img, habits, goals, sessions, currMonth } = entry}
                        {@const { habitsMark, focusTime } = options}
                        {@const day = date.getDate()}
                        {@const dow = date.getDay()}
                        {@const showHabits = habits && habitsMark && currMonth && uptoToday(date)}
                        {@const showFocus = focusTime && currMonth}
            
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div 
                            data-goals={`${goals?.length}`}
                            class="acal__day"
                            class:acal__day--drag-over={dragOverDate && isSameDay(date, dragOverDate)}
                            class:acal__day--edit={editEntry?.date && isSameDay(date, editEntry.date)}
                            class:acal__day--first-col={dow === 0}
                            class:acal__day--last-col={dow === 6}
                            class:acal__day--bottom-row={weekIdx === 5}
                            class:acal__day--not-curr-month={!currMonth}
                            class:acal__day--anim-photos={animPhotos}
                            class:acal__day--today={isSameDay(date, new Date())}
                            on:contextmenu={(e) => {
                                dayView = null
                                e.preventDefault()

                                if (!currMonth) {
                                    return
                                }
                                else if (!editEntry || !isSameDay(date, editEntry?.date)) {
                                    onContextMenu({ e, entry })
                                }
                                else {
                                    dayMenu = false
                                }
                            }}
                            on:dragover={(e) => {
                                e.preventDefault()
                                dragOverDate = currMonth ? date : null
                            }}
                        >
                            <div>
                                <div class="acal__day-header">
                                    <div class="flx-center">
                                        <span class="acal__day-num">{day}</span>
                                        <div style:position="relative">
                                            {#if showHabits}
                                                {@const { trueChecked, total } = habits}
                                                {@const progress = total ? trueChecked / total : 0}
    
                                                {#if trueChecked >= total}
                                                    <span class="acal__star" title="All habits completed.">
                                                        *
                                                    </span>
                                                {/if}
                                                <button 
                                                    data-dmenu-id={POP_MENU_ID}
                                                    class="acal__day-ring" 
                                                    title={total ? `Daily habits: ${trueChecked} / ${total}.` : ""}
                                                    on:click={(e) => {
                                                        if (initEditEntry({ e, entry })) {
                                                            onViewOption("Daily Habits")
                                                        }
                                                    }}
                                                >
                                                    <ProgressRing
                                                        {progress}
                                                        options={{
                                                            size: 12, strokeWidth: 2.9, style: "default"
                                                        }}
                                                    />
                                                </button>  
                                            {/if}
                                        </div>
                                    </div>
                                    {#if showFocus && sessions && sessions.length > 0}
                                        {@const focusTimeStr = getTotalFocusTimeStr(sessions)}
                                        <button 
                                            data-dmenu-id={POP_MENU_ID}
                                            class="acal__focus hov-underline" 
                                            title="Focus Time"
                                            on:click={(e) => {
                                                if (initEditEntry({ e, entry })) {
                                                    onViewOption("Focus Time")
                                                }
                                            }}
                                        >
                                            {focusTimeStr}
                                        </button>
                                    {/if}
                                </div>

                                <!-- goals -->
                                {#if entry && goals}
                                    {@const showAmount  = GOALS_LIST_MAX}
                                    {@const cutoff = goals.length - showAmount}
                                    
                                    <div>
                                        {#each goals.slice(0, showAmount) as goal, _ (goal.id)}
                                            {@const tag = goal.tag}
                                            {@const symbol = tag?.symbol ?? null}
                                            {@const color = symbol?.color ?? null}
                                            {@const colors = getSwatchColors({ color, light: isLight, contrast: false})}
                                            {@const completed = goal.status === "accomplished"}
                                            <!-- svelte-ignore a11y-interactive-supports-focus -->
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <div 
                                                title={goal.name}
                                                role="button"
                                                tabindex={0}
                                                draggable={true}
                                                class="acal__goal"
                                                class:acal__goal--empty={!tag}
                                                class:acal__goal--completed={completed}
                                                class:acal__goal--active={goalClicked === goal}
                                                style:--tag-color-primary={symbol?.color.primary}
                                                style:--tag-color-1={colors[0]}
                                                style:--tag-color-2={colors[1]}
                                                style:--tag-color-3={colors[2]}
                                                style:--tag-bg-opacity={!tag && isLight ? 0.3 : 1}
                                                on:pointerdown={(e) => pointerDown(e, goal)}
                                                on:pointerup={() => pointerUp()}
                                                on:dragover={(e) => {
                                                    e.preventDefault()
                                                }}
                                                on:dragstart={(e) => {
                                                    onDragStart({ e, goal, date })
                                                }}
                                            >
                                                <div class="flx-sb">
                                                    {#if completed}
                                                        <button 
                                                            class="acal__goal-done-icon"
                                                            on:click={() => toggleGoalStatus(goal)}
                                                        >
                                                            <AccomplishedIcon 
                                                                tag={tag ?? undefined} scale={0.65}
                                                            />
                                                        </button>
                                                    {:else}
                                                        <button 
                                                            class="acal__goal-checkbox" 
                                                            on:click={() => toggleGoalStatus(goal)}
                                                        >    
                                                        </button>
                                                    {/if}
                                                    <div class="flx-center">
                                                        {#if symbol}
                                                            <i>{symbol.emoji}</i>
                                                        {/if}
                                                        <span>{goal.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                    {#if cutoff > 0}
                                        <div class="acal__goal-cutoff">
                                            {cutoff} more
                                        </div>
                                    {/if}
                                {/if}
                            </div>
            
                            <!-- icon -->
                            {#if img && entry && goals && goals.length > 0 && options.showImgs}
                                {@const offset = randomArrayElem(PHOTO_OFFSETS)}
                                <div class="acal__img-container">
                                    <button 
                                        class="acal__img-icon"
                                        class:acal__img-icon--photo-anim={animPhotos}
                                        style:--photo-x={`${offset.x}px`}
                                        style:--photo-y={`${offset.y}px`}
                                        style:--photo-tilt={`${offset.tilt}deg`}
                                        on:click={() => imgOpen = img}
                                    >
                                        <img src={img} alt="Day Icon">
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    {/if}

    <DropdownList 
        id={POP_MENU_ID}
        isHidden={!contextMenu}
        options={{
            listItems: [
                {
                    sectionName: editEntry ? formatDateLong(editEntry.date) : "",
                },
                {  
                    name: editEntry?.h_context ? "Daily Habits" : "",
                    rightIcon: { type: "txt", icon: editEntry?.h_context?.str },
                    divider: !editEntry?.s_context
                },
                {  
                    name: editEntry?.s_context ? "Focus Time" : "",
                    rightIcon: { type: "txt", icon: editEntry?.s_context?.str ?? "" },
                    divider: !!editEntry?.h_context
                },
                {  
                    name: "Your Goals",
                    rightIcon: { type: "txt", icon: editEntry?.g_context?.str }
                },
                {  
                    name: "Add a Goal",
                    rightIcon: { type: "svg", icon: Icon.Add }
                }
            ],
            onListItemClicked: ({ name }) => {
                onViewOption(name)
            },
            onClickOutside: () => {
                contextMenu = false
                editEntry = null
            },
            styling: { 
                zIndex: 100,
                minWidth: "150px",
            },
            position: { 
                top: `${contextMenuPos.top}px`,
                left: `${contextMenuPos.left}px`,
            }
        }}
    />

    <BounceFade 
        dmenuId={POP_MENU_ID}
        isHidden={!dayMenu}
        onClickOutside={() => {
            dayMenu = false
        }}
        onDismount={() => {
            dayView = null
            editEntry = null
        }}
        position={{
            top: `${dayViewPos.top}px`,
            left: `${dayViewPos.left}px`,
        }}
    >
        {#if editEntry && dayView}
            {@const date = editEntry?.date ?? new Date()}
            {@const { goals, sessions } = editEntry}

            <div class="acal__day-view">
                <div class="acal__day-view-header">
                    <span>{formatDateLong(date)}</span>
                </div>
                <div class="acal__day-view-content">
                    {#if dayView === "habits"}
                        <DailyHabits {date} context="overview" />
                    {:else if dayView === "goals" && goals}
                        <DailyGoals {goals} {date} />
                    {:else if dayView === "sessions" && sessions}
                        <DailySessions {sessions}/>
                    {/if}
                </div>
            </div>
        {/if}
    </BounceFade>
</div>

{#if imgOpen}
    <ImgModal 
        img={{ src: imgOpen }} 
        onClickOutside={() => imgOpen = null}
    />
{/if}


<style lang="scss">
    .acal {
        margin-top: 15px;
        width: 100%;
        max-width: 1200px;
        position: relative;

        --dark-cell-opac: 0.0115;
        --obscure-cell-opac: 0.1;
        --hover-opacity: 0.02;
        --hover-opacity-dark: 0.035;
        
        &--light {
            --dark-cell-opac: 0.04;
            --obscure-cell-opac: 0.2;
            --hover-opacity: 0.04;
            --hover-opacity-dark: 0.06;
        }
        &--light &__focus {
            @include text-style(0.45);
        }
        &--light &__star {
            @include text-style(0.5);
        }
        &--light &__goal-cutoff {
            @include text-style(0.7);
        }
        &--light &__dow {
            @include text-style(0.65);
        }

        &__dow {
            text-align: center;
            @include text-style(0.35, var(--fw-400-500), 1.1rem);
        }
        &__days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            height: 25px;
            font-weight: bold;
        }
        &__month {
            height: calc(100% - 30px);
            width: 100%;
        }
        &__week {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        &__day {
            padding: 5px 5px 3px 5px;
            background: rgba(var(--textColor1), 0.0025);
            border-top: var(--divider-border);
            border-left: var(--divider-border);
            width: calc(var(--GRID_WIDTH) / 7);
            @include flex-col;
            position: relative;
            height: auto;
            min-height: 100px;

            &:hover {
                background-color: rgba(var(--textColor1), 0.01);
            }
            &--not-curr-month &-num {
                opacity: var(--obscure-cell-opac);
            }
            &--first-col {
                background-color: rgba(var(--textColor1), var(--dark-cell-opac));
            }
            &--last-col {
                border-right: var(--divider-border);
                background-color: rgba(var(--textColor1), var(--dark-cell-opac));
            }
            &--bottom-row {
                border-bottom: var(--divider-border);
            }
            &--today &-num {
                background-color: #FF5151;
                color: white;
                @include circle(20px);
            }
            &--drag-over {
                background-color: rgba(var(--textColor1), 0.035);
                @include border-focus;
            }
            &--edit {
                background-color: rgba(var(--textColor1), 0.02);
            }
        }
        &__day--edit {
            background: rgba(var(--textColor1), 0.035) !important;
        }
        &__day:hover &__day-ring {
            @include visible(0.65);
        }
        &__day:hover &__star {
            display: none;
        }
        &__day-ring {
            transition: 0.1s ease-in-out;
            padding-top: 2px;
            @include not-visible;

            &:hover {
                opacity: 1 !important;
            }
        }
        &__day-header {
            @include flex(center, space-between);
            flex-wrap: wrap;
            margin-bottom: 6px;
        }
        &__day-num {
            @include center;
            @include text-style(1, var(--fw-400-500), 1.05rem);
            margin: 2px 6px 2px 2px;
        }
        &__star {
            @include text-style(0.25, var(--fw-300-400), 1.5rem, "Geist Mono");
            @include abs-top-left(-1px, -3px);
        }
        &__focus {
            margin: 2px 4px 0px 2px;
            @include text-style(0.145, var(--fw-400-500), 1.1rem);
        }
        /* goal activity */
        &__goal {
            overflow: hidden;
            position: relative;
            padding: 4.5px 10px 5.5px 8px;
            background-color: rgba(var(--tag-color-2), var(--tag-bg-opacity)) !important;
            border-radius: 7px;
            white-space: nowrap;
            margin: 2px 0px 2px 2px;
            @include flex(center);
            @include smooth-bounce;
            cursor: pointer;

            &--active {
                transform: scale(0.95);
            }
            &--completed span {
                text-decoration: line-through;
                opacity: 0.55;
            }
            i {
                font-style: normal;
                font-size: 0.85rem;
                margin: 0px 6px 0px 0px;
            }
            span {
                @include text-style(0.9, var(--fw-400-500), 1.1rem);
                @include elipses-overflow;
                color: rgba(var(--tag-color-1), 1);
            }
        }
        &__goal-done-icon {
            margin: 0px 8px 0px -3px;
        }
        &__goal-checkbox {
            @include square(15px, 5px);
            background-color: rgba(var(--tag-color-1), 0.1);
            margin: 0px 7.5px 0px -2px;

            &:hover {
                background-color: rgba(var(--tag-color-1), 0.2);
            }
        }
        &__goal-cutoff {
            @include text-style(0.225, var(--fw-400-500), 1.15rem);
            margin: 4px 3px 6px 4px;
            float: right;
        }

        /* img icon */
        &__img-container {
            @include square(34px);
            margin-top: 10px;
        }
        &__img-icon {
            @include abs-bottom-left(4px, 6px);
            @include smooth-bounce;
            z-index: 1;

            img {
                border: white 2.5px solid;
                transition: 0.15s cubic-bezier(.4, 0, .2, 1);
                @include square(35px, 6px);
                object-fit: cover
            }
        }
        &__img-icon:hover {
            transform: rotate(calc(-1 * var(--photo-tilt)));
            transform: scale(2);
        }
        &__img-icon:hover img {
            border: white 2px solid;
        }
        &__img-icon--photo-anim:hover {
            transform: rotate(calc(-1 * var(--photo-tilt)));
            transform: scale(1.5);
        }
        &__img-icon--photo-anim:hover img {
            border: white 2px solid;
        }
        &__img-icon--photo-anim {
            @include abs-bottom-left(var(--photo-y), var(--photo-x));
            transform: rotate(var(--photo-tilt));
        }
        &__img-icon--photo-anim img {
            @include square(50px, 6px);
            border: white 2.5px solid;
        }
        &__day-activity {
            margin-top: 7px;
        }
        &__day-view {
            @include contrast-bg("bg-3");
            padding: 0px 0px 6px 0px;
            border-radius: 7px;
            min-width: 165px;

            span {
                @include text-style(0.9, var(--fw-400-500), 1.15rem);
                margin-bottom: 4px;
                display: block;
            }
        }
        &__day-view-header {
            @include flex(center, space-between);
            padding: 10px 0px 0px 12px;
        }
        &__day-view-content {
            overflow: scroll;
            max-height: 400px;
            padding: 0px 12px 0px 12px;
        }
    }
</style>