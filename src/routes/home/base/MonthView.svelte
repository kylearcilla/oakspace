<script lang="ts">
	import { onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import { goalTracker, themeState } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { getTextEntry } from "$lib/utils-entries"
	import { GoalsViewManager } from "$lib/goals-view-manager"
    import { getIsoDateFromTimeFrame, getWeekPeriodStr, months } from "$lib/utils-date"
	import { getYearBounds, loadMonthView, saveMonthView } from "$lib/utils-home"
	import { getElemById, getHozSpace, getMaskedGradientStyle, kebabToNormal, normalToKebab } from "$lib/utils-general"
	import { getCurrentPeriod, getMoFromIdx, getPeriodDate, getPeriodIdx, getPeriodStr, switchMoQuPeriod } from "$lib/utils-goals"

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
        period: "month",
        list: {
            grouping: "status",
            showProgress: true,
            due: false,
            dueType: "date",
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
    let { minYear, maxYear } = getYearBounds()
    
    let goalsInit = false
    let goalsViewManager: GoalsViewManager | null = null
    let goalsViewState: Writable<GoalsViewState>
    let goalsHeatMap: YearHeatMapData[] = []
    let btnHighlighter = {
        width: 0, left: 0
    }
    
    let width = 0
    let renderFlag = false
    
    let periodIdx = today.getMonth()
    let periodYearCurrent = true
    let periodStr = months[today.getMonth()]
    let periodDate = new Date()

    // for goals & overview
    let timeFrame = getCurrentPeriod("month")
    let currYear = today.getFullYear() // for year view
    let weeksAgoIdx = 0 // for habits

    let monthEntry: TextEntry | null = null 
    let yearEntry: TextEntry | null = null 
    
    let leftArrow: HTMLButtonElement | null = null
    let rightArrow: HTMLButtonElement | null = null
    let gradient = ""

    initOptions()
    
    $: isLight = !$themeState.isDarkTheme
    $: gm_progress = $goalsViewState?.viewProgress
    
    $: if ($goalTracker.init && !goalsInit) initGoalsView()
    $: saveMonthView({ overviewView, goalsView, habitView, yearView })

    $: if (width && headerBtnsRef && width < 500) {
        requestAnimationFrame(() => handleScroll(headerBtnsRef))
    }
    else {
        gradient = ""
    }

    /* time frame */
    function initGoalsView() {
        if (goalsInit) return

        goalsViewManager = new GoalsViewManager({ 
            goals: [], 
            grouping: goalsView.list.grouping,
            timeFrame
        })

        goalsViewState = goalsViewManager.state
        goalsInit = true
        updateGoalData()
    }
    function updateGoalData() {
        goalsViewManager!.setViewPeriod(timeFrame!)
        goalTracker.update(data => ({ ...data, view: goalsViewManager }))
    }
    function updatePeriodStrs() {
        periodYearCurrent = timeFrame.year === today.getFullYear()

        periodIdx = getPeriodIdx(timeFrame)
        periodDate = getPeriodDate(timeFrame)
        periodStr = getPeriodStr(timeFrame)
    }
    function toggleGoalViewPeriod() {
        const newPeriod = switchMoQuPeriod(timeFrame)
        periodYearCurrent = newPeriod.year === today.getFullYear()
        timeFrame = newPeriod
        
        updateGoalData()
        updatePeriodStrs()
    }
    async function setMonthEntry(dir?: "left" | "right") {
        const isoDate = getIsoDateFromTimeFrame(timeFrame)
        monthEntry = await getTextEntry({ isoDate, period: "month", dir })
    }
    function updatePeriodIdx(dir: "left" | "right") {
        let newIdx = dir === "left" ? periodIdx - 1 : periodIdx + 1
        let periodYr = timeFrame.year
        let updateMo = currView === "overview" || (currView === "goals" && goalsView.period === "month")

        if (updateMo) {
            if (newIdx < 0) {
                periodIdx = 11
                periodYr--
            }
            else if (newIdx >= 12) {
                periodIdx = 0
                periodYr++
            }
            else {
                periodIdx = newIdx
            }
            timeFrame = { year: periodYr, period: getMoFromIdx(periodIdx) }
        }
        else {
            if (newIdx < 0) {
                periodIdx = 3
                periodYr--
            }
            else if (newIdx >= 4) {
                periodIdx = 0
                periodYr++
            }
            else {
                periodIdx = newIdx
            }
            timeFrame = { year: periodYr, period: `q${periodIdx + 1}` }
        }
        if (currView === "goals") {
            updateGoalData()
        }
        if (currView === "overview") {
            setMonthEntry(dir)
        }

        updatePeriodStrs()
    }
    function resetTimeFrame() {
        // switch to current time period when switching to overview / goals view
        if (currView === "goals" && goalsView.period === "quarter") {
            timeFrame = getCurrentPeriod("quarter")
        }
        else {
            timeFrame = getCurrentPeriod("month")
        }
        updateGoalData()
        updatePeriodStrs()
        setMonthEntry()
    }
    async function onArrowBtnClicked(dir?: "left" | "right") {
        if (leftArrow == null || rightArrow == null) return

        if (currView === "yr-view") {
            if (dir === "left") {
                currYear--
            }
            else if (dir === "right") {
                currYear++
            }
            yearEntry = await getTextEntry({ 
                isoDate: `${currYear}-01-01`, period: "year", dir
            })
        }
        else if (currView === "habits") {
            if (dir === "left") {
                weeksAgoIdx = Math.min(5, weeksAgoIdx + 1)
            }
            else if (dir === "right") {
                weeksAgoIdx = Math.max(0, weeksAgoIdx - 1)
            }
        }
        else {
            updatePeriodIdx(dir!)
        }
        allowArrowHandler(currView)

    }
    function allowArrowHandler(context: "overview" | "goals" | "habits" | "yr-view") {
        if (context === "yr-view") {
            leftArrow!.disabled = currYear <= minYear
            rightArrow!.disabled = currYear >= maxYear
        }
        else if (context === "habits") {
            leftArrow!.disabled = weeksAgoIdx === 5
            rightArrow!.disabled = weeksAgoIdx === 0
        }
        else {
            leftArrow!.disabled = periodDate.getFullYear() <= minYear
            rightArrow!.disabled = periodDate.getFullYear() >= maxYear
        }
    }
    /* options*/
    function initOptions() {
        const { overview, goals, habits, year } = loadMonthView()

        if (overview) overviewView = overview
        if (goals) goalsView = goals
        if (habits) habitView = habits
        if (year) yearView = year
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
        else if (optn === "Time Period") {
            const newView = val as "month" | "quarter"

            if (newView !== goalsView.period) {
                goalsView.period = newView
                toggleGoalViewPeriod()
            }
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

    /* listeners */
    async function onViewBtnClicked(view: MonthDetailsView) {
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

        // reset
        currYear = today.getFullYear()
        weeksAgoIdx = 0

        leftArrow!.disabled = false
        rightArrow!.disabled = false

        if (currView === "overview" || currView === "goals") {
            resetTimeFrame()
        }
        if (currView === "yr-view") {
            yearEntry = await getTextEntry({ 
                isoDate: `${currYear}-01-01`, period: "year", dir: "left"
            })
        }
        allowArrowHandler(currView)
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
                                style:font-size="1.25rem"
                            >   
                                <span>{periodStr}</span>
                                <span class:hidden={periodYearCurrent}>
                                    {timeFrame.year}
                                </span>
                            </div>
                        {:else if currView === "habits"}
                            <div 
                                style:font-size="1.25rem" 
                                style:margin="4px 0px 0px 0px"
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
                                style:font-size="1.25rem"
                            >
                                <div style:margin="1px 12px 0px 0px">
                                    <ProgressBar progress={gm_progress}/>
                                </div>
                                <span>
                                    {periodStr}
                                </span>
                                <span class:hidden={periodYearCurrent} style:margin-left="9px">
                                    {timeFrame.year}
                                </span>
                            </div>
                        {:else if currView === "yr-view"}
                            <div 
                                style:font-size="1.3rem"
                                style:margin="5px 0px 0px 0px"
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
                        minWidth: "160px",
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
                            name: "View By",
                            pickedItem: kebabToNormal(goalsView.period || "month"),
                            divider: true,
                            items: [
                                { name: "Month" },
                                { name: "Quarter" }
                            ],
                            onListItemClicked: ({ name }) => {
                                viewOption("Time Period", normalToKebab(name))
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
                        minWidth: "160px",
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
                <div style:margin-top="2px">
                    <Overview {timeFrame} {monthEntry} options={overviewView}/>
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
                    {yearEntry}
                />
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../../scss/dropdown.scss" as *;

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
            margin: 0px 6px 0px 2px;
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
                @include text-style(0.85, var(--fw-400-500), 1.365rem);
                margin-right: 2px;
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
            @include abs-bottom-left(0px);
            height: 1.5px;
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
            @include text-style(0.45, var(--fw-400-500), 1.25rem);
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
    }
</style>