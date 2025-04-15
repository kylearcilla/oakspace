<script lang="ts">
	import { onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import { goalTracker, themeState } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { PERIODS } from "$lib/utils-goals"
	import { GoalsViewManager } from "$lib/goals-view-manager"
	import { getYearBounds, loadMonthView, saveMonthView } from "$lib/utils-home"
    import { getNextMonth, getPrevMonth, getWeekPeriodStr, months } from "$lib/utils-date"
	import { getElemById, getHozSpace, getMaskedGradientStyle, kebabToNormal, normalToKebab } from "$lib/utils-general"

	import YearView from "./YearView.svelte"
	import Overview from "./Overview.svelte"
	import WeeklyHabits from "./WeeklyHabits.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import GoalsView from "$components/GoalsView.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import ProgressBar from "$components/ProgressBar.svelte"
	import DropdownList from "$components/DropdownList.svelte"

    /* view options */
    let overviewView: OverviewOptions = {
        animPhotos: true,
        textBlock: true,
        showImgs: true,
        habitsMark: true,
        focusTime: false,
    }
    let goalsView: GoalsViewOptions = {
        view: "list",
        progress: 0.5,
        list: {
            grouping: "status",
            showProgress: true,
            due: false,
            dueType: "date"
        },
        board: {
            grouping: "status",
            showProgress: true,
            due: false,
            imgs: false,
            dueType: "date"
        }
    }
    let habitView: HabitTableOptions = {
        view: "default",
        stats: true,
        emojis: true,
        allowCaptions: true,
        checkboxStyle: "box",
        bottomDetails: true,
        progress: {
            numbers: true,
            percentage: false
        }
    }
    let yearView: YearViewOptions = {
        emojis: true,
        showTextEntry: true,
        showYear: false,
        pinnedGoals: true
    }

    let currView: MonthDetailsView = "overview"
    let options: MonthDetailsView | null = null
    let headerBtnsRef: HTMLElement | null = null
    let today = new Date()
    let { minDate, maxDate } = getYearBounds()
    
    let goalsInit = false
    let goalsViewManager: GoalsViewManager | null = null
    let goalsViewState: Writable<GoalsViewState>
    let goalsHeatMap: YearHeatMapData[] = []
    let btnHighlighter = {
        width: 0, left: 0
    }
    
    let width = 0
    let renderFlag = false
    
    let currMonth = today // for overview and goals
    let currYear = today.getFullYear() // for year view
    let weeksAgoIdx = 0 // for habits
    let timeFrame: { year: number, period: string }
    
    let leftArrow: HTMLButtonElement | null = null
    let rightArrow: HTMLButtonElement | null = null
    
    let gradient = ""

    initOptions()
    
    $: isLight = !$themeState.isDarkTheme

    $: currMoStr = months[currMonth.getMonth()]
    $: isMoCurrYr = currMonth.getFullYear() === today.getFullYear()

    $: gm_progress = $goalsViewState?.viewProgress
    
    $: if ($goalTracker.init && !goalsInit) initGoalsView()
    $: saveMonthView({ overviewView, goalsView, habitView, yearView })

    $: if (width && headerBtnsRef && width < 500) {
        requestAnimationFrame(() => handleScroll(headerBtnsRef))
    }
    else {
        gradient = ""
    }

    function updateTimeFrame() {
        timeFrame = { 
            year: currMonth.getFullYear(), 
            period: months[currMonth.getMonth()].slice(0, 3).toLowerCase()
        }
        
        // update goals
        goalsViewManager!.setViewPeriod({ ...timeFrame })
        goalTracker.update(data => ({ ...data, view: goalsViewManager }))
    }
    function initOptions() {
        const { overview, goals, habits, year } = loadMonthView()

        if (overview) overviewView = overview
        if (goals) goalsView = goals
        if (habits) habitView = habits
        if (year) yearView = year
    }
    function initGoalsView() {
        if (goalsInit) return
        const currYear = today.getFullYear()
        const viewPeriod = PERIODS[today.getMonth()]

        goalsViewManager = new GoalsViewManager({ 
            goals: [], 
            grouping: goalsView.list.grouping,
            timeFrame: { year: currYear, period: viewPeriod }
        })

        goalsViewState = goalsViewManager.state
        goalsInit = true
        updateTimeFrame()
    }
    function viewOption(optn: string, val?: string) {
        const type = goalsView.view

        /* overview */
        if (optn === "Text Block") {
            overviewView.textBlock = !overviewView.textBlock
        }
        else if (optn === "Show Images") {
            overviewView.showImgs = !overviewView.showImgs
        }
        else if (optn === "Dynamic Img Spacing") {
            overviewView.animPhotos = !overviewView.animPhotos
        }
        else if (optn === "100% Habits") {
            overviewView.habitsMark = !overviewView.habitsMark
        }
        else if (optn === "Focus Time") {
            overviewView.focusTime = !overviewView.focusTime
        }
        /* goals */
        else if (optn === "View Type") {
            goalsView.view = val as "list" | "board"
            renderFlag = !renderFlag
        }
        else if (optn === "Grouping") {
            goalsView[type].grouping = val as "default" | "status" | "tag"
        }
        else if (optn === "Show Progress") {
            goalsView[type].showProgress = !goalsView[type].showProgress
        }
        else if (optn === "Show Due Date") {
            goalsView[type].due = !goalsView[type].due
        }
        else if (optn === "Due Distance") {
            goalsView[type].dueType = goalsView[type].dueType === "distance" ? "date" : "distance"
        }
        else if (optn === "Show Image") {
            goalsView.board.imgs = !goalsView.board.imgs
        }
        /* habits */
        else if (optn === "Group") {
            habitView.view = val as "default" | "time-of-day"
        }
        else if (optn === "Checkbox") {
            habitView.checkboxStyle = val as "box" | "minimal"
        }
        else if (optn === "Emojis") {
            habitView.emojis = !habitView.emojis
        }
        else if (optn === "Captions") {
            habitView.allowCaptions = !habitView.allowCaptions
        }
        else if (optn === "Bottom Details") {
            habitView.bottomDetails = !habitView.bottomDetails
        }
        else if (optn === "Detailed") {
            habitView.progress.numbers = !habitView.progress.numbers
        }
        /* year view */
        else if (optn === "Goal Emojis") {
            yearView.emojis = !yearView.emojis
        }
        else if (optn === "Year Entry") {
            yearView.showTextEntry = !yearView.showTextEntry
        }
        else if (optn === "Show Year") {
            yearView.showYear = !yearView.showYear
        }
        else if (optn === "Pinned Goals") {
            yearView.pinnedGoals = !yearView.pinnedGoals
        }
    }
    function onArrowBtnClicked(dir?: "left" | "right") {
        if (leftArrow == null || rightArrow == null) return

        if (currView === "yr-view") {
            if (dir === "left") {
                currYear--
            }
            else if (dir === "right") {
                currYear++
            }
            allowArrowHandler("year")
        }
        else if (currView === "habits") {
            if (dir === "left") {
                weeksAgoIdx = Math.min(5, weeksAgoIdx + 1)
            }
            else if (dir === "right") {
                weeksAgoIdx = Math.max(0, weeksAgoIdx - 1)
            }
            allowArrowHandler("weeks")
        }
        else {
            currMonth = dir === "left" ? getPrevMonth(currMonth) : getNextMonth(currMonth)
            updateTimeFrame()
            allowArrowHandler("month")
        }
    }
    function allowArrowHandler(context: "year" | "month" | "weeks") {
        if (context === "year") {
            leftArrow!.disabled = currYear <= minDate.getFullYear()
            rightArrow!.disabled = currYear >= maxDate.getFullYear()
        }
        else if (context === "month") {
            leftArrow!.disabled = currMonth <= minDate
            rightArrow!.disabled = currMonth >= maxDate
        }
        else if (context === "weeks") {
            leftArrow!.disabled = weeksAgoIdx === 5
            rightArrow!.disabled = weeksAgoIdx === 0
        }
    }

    /* listeners */
    function onViewBtnClicked(view: MonthDetailsView) {
        currView = view
        const btnElem = getElemById(`month-view--${view}`)!
        const width = btnElem.clientWidth
        const today = new Date()
        const scrollLeft = headerBtnsRef!.scrollLeft
        const left = getHozSpace({ 
            left:  { 
                elem: btnElem.parentElement!,
                edge: "left"
            },
            right: { 
                elem: btnElem,
                edge: "left"
            },
        })

        btnHighlighter.width = width - 2
        btnHighlighter.left  = Math.max(left, 0) + scrollLeft

        currYear = today.getFullYear()
        currMonth = today
        weeksAgoIdx = 0
        leftArrow!.disabled = false
        rightArrow!.disabled = false

        updateTimeFrame()
    }
    function handleScroll(elem: HTMLElement | null) {
        if (!elem) return

        const { styling } = getMaskedGradientStyle(elem, {
            isVertical: false,
            head: {
                end: "20px"
            },
            tail: {
                start: "20%", end: "100%"
            }
        })
        gradient = styling
    }

    onMount(() => {
        handleScroll(headerBtnsRef!)
        requestAnimationFrame(() => onViewBtnClicked(currView))
    })
</script>

<div 
    class={`month-view month-view--${currView}`}
    class:month-view--light={isLight}
    bind:clientWidth={width}
>
    <div class="month-view__details">
        <div class="month-view__details-header">
            <div 
                on:scroll={() => handleScroll(headerBtnsRef)}
                bind:this={headerBtnsRef}
                class="month-view__header-btns no-scroll-bar"
                style={`${gradient}; ${width < 500 ? `max-width: 230px` : "max-width: none"}`}
            >
                <button 
                    id={"month-view--overview"}
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "overview"}
                    on:click={() => onViewBtnClicked("overview")}
                >
                    <span>Overview</span>
                </button>
                <button 
                    id={"month-view--goals"}
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "goals"}
                    on:click={() => onViewBtnClicked("goals")}
                >
                    <span>Goals</span> 
                </button>
                <button 
                    id={"month-view--habits"}
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "habits"}
                    on:click={() => onViewBtnClicked("habits")}
                >
                    <span>Habits</span> 
                </button>
                <button 
                    id={"month-view--yr-view"}
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "yr-view"}
                    on:click={() => onViewBtnClicked("yr-view")}
                >
                    <span>Year</span> 
                </button>
                <div 
                    style:left={`${btnHighlighter.left}px`}
                    style:width={`${btnHighlighter.width}px`}
                    class="month-view__highlight"
                >
                </div>
            </div>
            <div>
                <div class="month-view__settings">
                    <div class="month-view__period">
                        {#if currView === "overview"}
                            <div 
                                style:margin="4px -1px 0px 12px"
                                style:font-size="1.4rem"
                            >   
                                <span>{currMoStr}</span>
                                <span class:hidden={isMoCurrYr}>{currMonth.getFullYear()}</span>
                            </div>
                        {:else if currView === "habits"}
                            <div 
                                style:font-size="1.4rem" 
                                style:margin="3px 0px 0px 0px"
                            >
                                {#if weeksAgoIdx === 0} 
                                    This Week
                                {:else}
                                    {@const { start, end } = getWeekPeriodStr(new Date(), weeksAgoIdx)}
                                    <span>{start}</span> - <span>{end}</span>
                                {/if}
                            </div>
                        {:else if currView === "goals"}
                            <div 
                                class="flx-center"
                                style:margin="4px -1px 0px 12px"
                                style:font-size="1.4rem"
                                data-month={currMonth}
                            >
                                <div style:margin="1px 12px 0px 0px">
                                    <ProgressBar progress={gm_progress}/>
                                </div>
                                <span>
                                    {currMoStr}
                                </span>
                                <span class:hidden={isMoCurrYr} style:margin-left="9px">
                                    {currMonth.getFullYear()}
                                </span>
                            </div>
                        {:else if currView === "yr-view"}
                            <div 
                                style:font-size="1.5rem"
                                style:margin="3px 0px 0px 0px"
                            >
                                {currYear}
                            </div>
                        {/if}
                    </div>
                    <div class="flx" style:margin="0px 0px -4px 0px">
                        <button 
                            bind:this={leftArrow}
                            on:click={() => onArrowBtnClicked("left")}
                            class="month-view__arrow"
                            style:margin-left="10px"
                        >
                            <div style:margin-left={"-2px"}>
                                <SvgIcon 
                                    icon={Icon.ChevronLeft} 
                                    options={{ scale: 1.4 }}
                                />
                            </div>
                        </button>
                        <button 
                            bind:this={rightArrow}
                            on:click={() => onArrowBtnClicked("right")}
                            disabled={currView === "yr-view" && currYear === today.getFullYear()}
                            class="month-view__arrow"
                            style:margin-left="10px"
                        >
                            <div style:margin-right={"-2px"}>
                                <SvgIcon icon={Icon.ChevronRight} options={{ scale: 1.4 }}/>
                            </div>
                        </button>
                    </div>
                    <div 
                        class="month-view__settings-btn" 
                        style:margin="0px 0px -2px 9px"
                    >
                        <SettingsBtn 
                            id="month-view"
                            onClick={() => options = options ? null : currView}
                        />
                    </div>
                </div>
            </div>
            <!-- overview  -->
            <DropdownList 
                id={"month-view"}
                isHidden={options != "overview"}
                renderFlag={renderFlag}
                options={{
                    listItems: [
                        {
                            sectionName: "Month View",
                        },
                        { 
                            name: "Text Block",
                            active: overviewView.textBlock,
                            divider: true,
                            onToggle: () => viewOption("Text Block")
                        },
                        {
                            sectionName: "Images",
                        },
                        { 
                            name: "Show Images",
                            active: overviewView.showImgs,
                            divider: !overviewView.showImgs,
                            onToggle: () => viewOption("Show Images")
                        },
                        { 
                            name: overviewView.showImgs ? "Dynamic Spacing" : "",
                            active: overviewView.animPhotos,
                            divider: true,
                            onToggle: () => viewOption("Dynamic Img Spacing")
                        },
                        {
                            sectionName: "Day View",
                        },
                        { 
                            name: "100% Habits",
                            active: overviewView.habitsMark,
                            onToggle: () => viewOption("100% Habits")
                        },
                        { 
                            name: "Focus Time",
                            active: overviewView.focusTime,
                            onToggle: () => viewOption("Focus Time")
                        }
                    ],
                    onClickOutside: () => {
                        options = null
                    },
                    styling: { 
                        zIndex: 100,
                        minWidth: "170px",
                    },
                    position: { 
                        top: "28px",
                        right: "0px",
                    }
                }}
            />

            <!-- goals -->
            <DropdownList 
                id={"month-view"}
                isHidden={options != "goals"}
                renderFlag={renderFlag}
                options={{
                    listItems: [
                        { 
                            pickedItem: kebabToNormal(goalsView.view),
                            twinItems: [
                                { name: "List", faIcon: "fa-solid fa-list-check" }, 
                                { name: "Board", faIcon: "fa-solid fa-square-poll-vertical", size: "1.65rem" }
                            ],
                            onListItemClicked: ({ name }) => {
                                viewOption("View Type", normalToKebab(name))
                            }
                        },
                        { 
                            name: "Grouping",
                            pickedItem: kebabToNormal(goalsView[goalsView.view].grouping),
                            divider: true,
                            items: [
                                { name: goalsView.view === "list" ? "Default" : "" },
                                { name: "Status" },
                                { name: "Tag" }
                            ],
                            onListItemClicked: ({ name }) => {
                                viewOption("Grouping", normalToKebab(name))
                            }
                        },
                        { 
                            name: goalsView.view === "board" ? "Show Image" : "",
                            active: goalsView.board.imgs,
                            divider: true,
                            onToggle: () => viewOption("Show Image")
                        },
                        {
                            sectionName: "Details",
                        },
                        { 
                            name: "Show Progress",
                            active: goalsView[goalsView.view].showProgress,
                            onToggle: () => viewOption("Show Progress")
                        },
                        { 
                            name: "Show Due Date",
                            active: goalsView[goalsView.view].due,
                            onToggle: () => viewOption("Show Due Date")
                        },
                        { 
                            name: goalsView[goalsView.view].due ? "Distance" : "",
                            active: goalsView[goalsView.view].dueType === "distance",
                            onToggle: () => viewOption("Due Distance")
                        },
                    ],
                    onClickOutside: () => {
                        options = null
                    },
                    styling: { 
                        zIndex: 100,
                        minWidth: "170px",
                    },
                    position: { 
                        top: "28px",
                        right: "0px",
                    }
                }}
            />

            <!-- habits -->
            <DropdownList 
                id={"month-view"}
                isHidden={options != "habits"}
                options={{
                    listItems: [
                        { 
                            name: "Group",
                            pickedItem: kebabToNormal(habitView.view),
                            items: [
                                { name: "Default" },
                                { name: "Time of Day" }
                            ],
                            onListItemClicked: ({ name }) => viewOption("Group", normalToKebab(name))
                        },
                        { 
                            name: "Checkbox",
                            pickedItem: kebabToNormal(habitView.checkboxStyle),
                            divider: true,
                            items: [
                                { name: "Box" },
                                { name: "Minimal" }
                            ],
                            onListItemClicked: ({ name }) => viewOption("Checkbox", normalToKebab(name))
                        },
                        {
                            sectionName: "Details",
                        },
                        { 
                            name: "Emojis",
                            active: habitView.emojis,
                            onToggle: () => viewOption("Emojis")
                        },
                        { 
                            name: "Captions",
                            active: habitView.allowCaptions,
                            onToggle: () => viewOption("Captions")
                        },
                        { 
                            name: "Bottom Details",
                            active: habitView.bottomDetails,
                            divider: true,
                            onToggle: () => viewOption("Bottom Details") 
                        },
                        {
                            sectionName: "Progress",
                        },
                        { 
                            name: "Detailed",
                            active: habitView.progress.numbers,
                            onToggle: () => viewOption("Detailed")
                        }
                    ],
                    onClickOutside: () => {
                        options = null
                    },
                    styling:  { 
                        zIndex: 200,
                        minWidth: "170px",
                    },
                    position: { 
                        top: "28px",
                        right: "0px",
                    }
                }}
            />

            <!-- year view -->
            <DropdownList 
                id={"month-view"}
                isHidden={options != "yr-view"}
                options={{
                    listItems: [
                        {
                            sectionName: "Overview",
                        },
                        { 
                            name: "Year Entry",
                            active: yearView.showTextEntry,
                            onToggle: () => viewOption("Year Entry")
                        },
                        { 
                            name: "Show Year",
                            active: yearView.showYear,
                            divider: true,
                            onToggle: () => viewOption("Show Year")
                        },
                        {
                            sectionName: "Goals",
                        },
                        { 
                            name: "Pinned Goals",
                            active: yearView.pinnedGoals,
                            onToggle: () => viewOption("Pinned Goals")
                        },
                        { 
                            name: "Emojis",
                            active: yearView.emojis,
                            onToggle: () => viewOption("Goal Emojis")
                        }
                    ],
                    onClickOutside: () => {
                        options = null
                    },
                    styling:  { 
                        zIndex: 200,
                        minWidth: "145px",
                    },
                    position: { 
                        top: "28px",
                        right: "0px",
                    }
                }}
            />
        </div>
        <div class="divider"></div>
        <div class="month-view__details-view">
            {#if currView === "overview" && goalsViewManager}
                <div style:margin-top="10px">
                    <Overview {timeFrame} options={overviewView}/>
                </div>
            {:else if currView === "habits"}
                <WeeklyHabits 
                    weeksAgoIdx={weeksAgoIdx}
                    options={habitView} 
                />
            {:else if currView === "goals" && goalsViewManager}
                <div style:margin-top="15px">
                    <GoalsView 
                        {timeFrame}
                        context="home"
                        options={goalsView} 
                        manager={goalsViewManager}
                    />
                </div>
            {:else if timeFrame}
                <YearView 
                    year={currYear} 
                    goalsHeatMap={goalsHeatMap}
                    options={yearView}
                />
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../scss/dropdown.scss";

    .month-view {
        --arrow-opacity: 0.45;

        &--light {
            --arrow-opacity: 0.55;
        }
        &--light &__header-btn {
            opacity: 0.3;
        }
        &--light &__header-btn span {
            @include text-style(1);
        }
        &--yr-view &__details .divider {
            margin-bottom: 0px;
        }

        .divider {
            margin: 0px 0px 0px 0px;
        }

        /* view options */
        &__btns {
            display: flex;
            margin-bottom: 0px;
            position: relative;
        }
        &__settings {
            @include flex(center);
            float: right;
            margin-bottom: 10px;
        }

        /* DETAILS */
        &__details {
            margin: -9px 0px 0px 0px;
            padding: 0px 0px 4px 0px;
            min-height: 500px;
            position: relative;
        }

        /* month view header */
        &__details-view {
            overflow: visible;
            margin: 0px 0px 100px -35px;
            padding-left: 35px;
        }
        &__details-header {
            position: relative;
            margin-bottom: 2px;
            @include flex(center, space-between);
        }
        &__header-btns {
            margin: 0px 10px -7px -3px;
            padding-bottom: 11px;
            position: relative;
            overflow-x: scroll;
            overflow-y: hidden;
            display: flex;
        }
        &__header-btn {
            padding: 5px 0px 0px 0px;
            margin: 0px 10px 0px 2px;
            white-space: nowrap;
            opacity: 0.2;
            transition: 0.1s ease-in-out;
            @include flex(center);

            &:hover {
                opacity: 0.4;
            }
            &:focus-visible {
                opacity: 0.4;
                box-shadow: none;
            }
            &--chosen {
                opacity: 1 !important;
            }
            span {
                @include text-style(0.85, var(--fw-400-500), 1.65rem);
                margin-right: 3px;
            }
        }
        &__overview-options {
            display: flex;
        }
        &__overview-btn {
            @include text-style(1, 400, 1.3rem, "Geist Mono");
            margin-left: 20px;
            opacity: 0.2;

            &:hover {
                opacity: 0.8 !important;
            }
        }
        &__overview-btn--clicked {
            opacity: 1 !important;
        }
        &__highlight {
            @include abs-bottom-left(-2px);
            height: 3.5px;
            background-color: rgba(var(--textColor1), 0.9);
            transition: 0.18s cubic-bezier(.4, 0, .2, 1);
        }
        &__arrow {
            opacity: var(--arrow-opacity);
            margin-left: 20px;
            height: 29px;
            width: 29px;
            border-radius: 20px;
            
            &:disabled {
                opacity: 0.1 !important;
                background: none !important;
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.05);
                opacity: 0.8;
            }
        }
        &__period {
            @include text-style(0.45, var(--fw-400-500), 1.4rem);
            height: 18px;

            span {
                display: inline-block;
            }
            * {
                font-weight: var(--fw-400-500);
            }
        }
        &__todo-settings-btn {
            @include center;
            @include circle(28px);
            opacity: 0.45;
            margin: 0px 0px 0px 9px;
            background-color: rgba(var(--textColor1), 0.065);

            &:disabled {
                opacity: 0.25 !important;
            }
            &:first-child {
                margin-left: 14px;
            }
            &:hover {
                opacity: 0.25;
            }
            i {
                @include text-style(0.9, _, 1.04rem)
            }
        }

        /* yr-view */
        &__add-task-btn {
            padding: 3px 18px 5px 18px;
            background-color: var(--lightColor2);
            border-radius: 50px;
            margin: 0px -9px 0px 7px;
            @include text-style(0.9, 500, 1.44rem);
            transition: 0.04s ease-in-out;

            &:hover {
                background-color: rgba(var(--textColor1), 0.05);
            }
        }
    }
</style>