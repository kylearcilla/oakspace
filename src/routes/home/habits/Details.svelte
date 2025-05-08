<script lang="ts"> 
	import { Icon } from "$lib/enums"
    import { v4 as uuidv4 } from 'uuid'

	import { months, sameMonth } from "$lib/utils-date"
    import { goalTracker, habitTracker, themeState } from "$lib/store"
	import { kebabToNormal, randomArrayElem } from "$lib/utils-general"
	import { getMonthEntryData, getYearEntryData } from "$lib/utils-goals"
	import { getMinYear, loadViewOptions, saveViewOptions } from "$lib/utils-habits"
	import { DEFAULT_SYMBOLS, EXAMPLE_HABITS, MAX_HABITS_COUNT } from "$lib/utils-habits-data"

	import HabitCard from "./HabitCard.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import HeatMap from "$components/HeatMap.svelte"
	import TextEntry from "$components/TextEntry.svelte"
	import EmptyList from "$components/EmptyList.svelte"
	import HabitsTable from "$components/HabitsTable.svelte"
    import SettingsBtn from "$components/SettingsBtn.svelte"
	import BannerHeader from "$components/BannerHeader.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import HabitViewModal from "$components/HabitViewModal.svelte"

    export let showHabitsLeft: boolean
    export let setLeftWidth: (on: boolean) => void
    export let setBannerLinked: (on: boolean) => void
    let store = habitTracker
    let habits: Habit[] = []

    let monthMetrics: HabitMonthMetrics | null = null
    let yearMetrics: HabitYearMetrics | null = null
    let yearHeatMap: HabitHeatMapData[] | null = null
    let activeStreak: HabitActiveStreak | null = null

    let newHabitModal = false
    let now = new Date()
    let monthOptions = false
    let breakdownOptions = false
    let initEntries = false

    let minYear = getMinYear()
    let currYear = now.getFullYear()
    let currMonthIdx = now.getMonth()
    let yearTextEntry: TextEntryOptions | null = null
    let monthTextEntry: TextEntryOptions | null = null

    let pageView: HabitPageOptions = {
        leftMargin: true,
        showIcon: true,
        heatmap: true,
        yearEntry: true,
        monthEntry: true,
        linkImgBanner: true,
        viewStyling: "table"
    }

    let tableView: HabitTableOptions = {
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
    let cardView: HabitCardOptions = {
        style: "wide",
        xAsChecked: false
    }

    init()

    $: light = !$themeState.isDarkTheme
    $: saveViewOptions({ pageView, tableView, cardView })
    
    $: sidePadding = showHabitsLeft || pageView.linkImgBanner ? 20 : 0
    $: currMonth = new Date(currYear, currMonthIdx)
    $: isMonthCurr = sameMonth(currMonth, now)
    $: isYearCurr = currYear === now.getFullYear()
    
    $: monthName = currMonth.toLocaleString("default", { month: "long" })
    $: monthItems = isYearCurr ? months.slice(0, now.getMonth() + 1) : months

    $: g_store = goalTracker
    $: if ($g_store.init && !initEntries) initTextEntries()

    store.subscribe((data) => {
        habits = data.habits
        activeStreak = data.activeStreak
        monthMetrics = data.monthMetrics
        yearMetrics = data.yearMetrics
        yearHeatMap = data.yearHeatMap
    })
    function init() {
        const { page, table, card} = loadViewOptions()

        if (page) pageView = page
        if (table) tableView = table
        if (card) cardView = card

        setBannerLinked(pageView.linkImgBanner)
        setLeftWidth(showHabitsLeft)
    }
    function initTextEntries() {
        yearTextEntry = getYearEntryData(currYear).entry
        monthTextEntry = getMonthEntryData(currYear, currMonthIdx)

        initEntries = true
    }
    function updateYear(yr: number) {
        const max = now.getFullYear()
        currYear = Math.min(Math.max(yr, minYear), max)
        
        const current = currYear === now.getFullYear()    
        currMonthIdx = current ? now.getMonth() : 0

        initTextEntries()
    }
    function updateMonth(idx: number) {
        const max = isYearCurr ? now.getMonth() : 11
        currMonthIdx = idx < 0 ? max : idx > max ? 0 : idx

        monthTextEntry = getMonthEntryData(currYear, currMonthIdx)
    }
    function updateView(prop: string, val?: string) {
        val = val ? val.toLowerCase() : ""

        /* page view */
        if (prop === "Heat Map") {
            pageView.heatmap = !pageView.heatmap
        }
        else if (prop === "Left Margin") {
            showHabitsLeft = !showHabitsLeft
            setLeftWidth(showHabitsLeft)
        }
        else if (prop === "Year Entry") {
            pageView.yearEntry = !pageView.yearEntry
        }
        else if (prop === "Month Entry") {
            pageView.monthEntry = !pageView.monthEntry
        }
        else if (prop === "View Styling") {
            pageView.viewStyling = val as "table" | "card"
        }
        else if (prop === "Link Img Banner") {
            pageView.linkImgBanner = !pageView.linkImgBanner
            setBannerLinked(pageView.linkImgBanner)
        }
        else if (prop === "Show Icon") {
            pageView.showIcon = !pageView.showIcon
        }
        /* table view */
        else if (prop === "Default") {
            tableView.view = "default"
        }
        else if (prop === "Time of Day") {
            tableView.view = "time-of-day"
        }
        else if (prop === "Emojis") {
            tableView.emojis = !tableView.emojis
        }
        else if (prop === "Captions") {
            tableView.allowCaptions = !tableView.allowCaptions
        }
        else if (prop === "Bottom Details") {
            tableView.bottomDetails = !tableView.bottomDetails
        }
        else if (prop === "Detailed") {
            tableView.progress.numbers = !tableView.progress.numbers
        }
        else if (prop === "Box") {
            tableView.checkboxStyle = "box"
        }
        else if (prop === "Minimal") {
            tableView.checkboxStyle = "minimal"
        }
        /* card style */
        else if (prop === "Card Style") {
            cardView.style = val as "tall" | "wide"
        }
        else if (prop === "X as checked") {
            cardView.xAsChecked = !cardView.xAsChecked
        }
        tableView = tableView
    }
</script>

<div 
    class="details" 
    class:details--light={light}
    class:details--icon={pageView.showIcon}
    style:--side-padding={`${sidePadding}px`}
    style:--icon-offset={!pageView.linkImgBanner ? "0px" : pageView.showIcon ? "35px" : "0px"}
>
    <div class="details__top">
        {#if pageView.linkImgBanner}
            <div style:margin-bottom="20px">
                <BannerHeader 
                    year={currYear}
                    showIcon={pageView.showIcon}
                />
            </div>
        {/if}
        <div class="details__header">
            <h1 class="details__header-title">
                Habits
            </h1>
            <div class="flx">
                <div class="flx" style:margin="0px 0px -4px 0px">
                    <div class="details__year">
                        {currYear}
                    </div>
                    <button 
                        on:click={() => updateYear(currYear - 1)}
                        disabled={currYear === minYear}
                        class="details__arrow"
                        style:margin-left="10px"
                    >
                        <div style:margin-left={"-2px"}>
                            <SvgIcon 
                                icon={Icon.ChevronLeft} options={{ scale: 1.4 }}
                            />
                        </div>
                    </button>
                    <button 
                        on:click={() => updateYear(currYear + 1)}
                        class="details__arrow"
                        style:margin-left="5px" 
                        disabled={isYearCurr}
                    >
                        <div style:margin-right={"-2px"}>
                            <SvgIcon icon={Icon.ChevronRight} options={{ scale: 1.4 }}/>
                        </div>
                    </button>
                </div>
                <div class="details__settings-btn">
                    <SettingsBtn 
                        id={"habits"}
                        onClick={() => monthOptions = !monthOptions}
                    />
                </div>
            </div>
            <DropdownList 
                id={"habits"}
                isHidden={!monthOptions}
                options={{
                    listItems: [
                        { 
                            name: "Left Margin",
                            active: showHabitsLeft,
                            onToggle: () => updateView("Left Margin")
                        },
                        {
                            name: "Heat Map",
                            divider: true,
                            active: pageView.heatmap,
                            onToggle: () => updateView("Heat Map")
                        },
                        {
                            sectionName: "Goal Image Banners"
                        },
                        { 
                            name: "Link Banner",
                            active: pageView.linkImgBanner,
                            divider: !pageView.linkImgBanner,
                            onToggle: () => updateView("Link Img Banner")
                        },
                        { 
                            name: pageView.linkImgBanner ? "Show Icon" : "",
                            active: pageView.showIcon,
                            divider: true,
                            onToggle: () => updateView("Show Icon")
                        },
                        {
                            sectionName: "Period Entries"
                        },
                        { 
                            name: "Year Entry",
                            active: pageView.yearEntry,
                            onToggle: () => updateView("Year Entry")
                        },
                        { 
                            name: "Month Entry",
                            active: pageView.monthEntry,
                            divider: true,
                            onToggle: () => updateView("Month Entry")
                        },
                        {
                            sectionName: "Habits",
                        },
                        { 
                            name: "View Styling",
                            pickedItem: kebabToNormal(pageView.viewStyling),
                            items: [
                                { name: "Card" },
                                { name: "Table" }
                            ],
                            onListItemClicked: ({ name }) => updateView("View Styling", name)
                        },
                        { 
                            name: habits.length < MAX_HABITS_COUNT ? "Add New Habit" : ""

                        },
                    ],
                    onClickOutside: () => {
                        monthOptions = false
                    },
                    onListItemClicked: ({ name }) => {
                        if (name === "Add New Habit") {
                            newHabitModal = true
                        }
                    },
                    styling:  { 
                        zIndex: 100,
                        minWidth: "150px",
                    },
                    position: { 
                        top: "40px",
                        right: "0px",
                    }
                }}
            />
        </div>
    </div>

    {#if pageView.yearEntry && yearTextEntry}
        <div 
            class="details__thought" 
            style:padding-left={`${sidePadding}px`}
        >
            {#key yearTextEntry}
                <TextEntry 
                    id="yr"
                    zIndex={50}
                    entry={yearTextEntry}
                />
            {/key}
        </div>
    {/if}

    <p  
        class:hidden={pageView.yearEntry} 
        style:margin={`0px 0px 20px ${sidePadding}px`}
    >
        {#if currYear != new Date().getFullYear()}
            Overview of your habits for the year of {currYear}.
        {:else}
            Overview of your habits this year.
        {/if}
    </p>

    {#if yearMetrics && activeStreak}
        {@const { habitsDone, habitsDue, perfectDays, missed, longestStreak, year } = yearMetrics}
        {@const zero = habitsDue === 0}
        {@const now = year === new Date().getFullYear()}
        {@const streak = now && zero ? "--" : activeStreak.count}

        <div 
            class="details__year-stats stats"
            class:stats--light={light}
        >
            <div 
                class="stat" 
                class:hidden={!isYearCurr}
                style:margin-right="32px"
            >
                <div class="stat__bottom">
                    <div class="flx">
                        <span class="stat__value">
                            {streak}
                        </span>
                        <span class="stat__unit">
                            {streak === "--" ? "" : streak === 1 ? "day" : "days"}
                        </span>
                    </div>
                    <span class="stat__label">Active Streak</span>
                </div>     
            </div>
            <div class="stat" style:margin-right="35px">
                <div class="stat__bottom">
                    <div class="flx">
                        <span class="stat__value">
                            {zero ? "--" : Math.floor((habitsDone / habitsDue) * 100)}
                        </span>
                        <span class="stat__unit" style:margin="0px 0px 0px 5px">
                            {zero ? "" : "%"}
                        </span>
                    </div>
                    <span class="stat__label">Consistency</span>
                </div>                    
            </div>
            {#if longestStreak}
                <div class="stat" style:margin-right="35px">
                    <div class="stat__bottom">
                        <div class="flx">
                            <span class="stat__value">
                                {zero ? "--" : longestStreak.count}
                            </span>
                            <span class="stat__unit">
                                {zero ? "" : longestStreak.count === 1 ? "day" : "days"}
                        </span>
                    </div>
                    <span class="stat__label">Longest Streak</span>
                    </div>                    
                </div>
            {/if}
            <div class="stat">
                <div class="stat__bottom">
                    <div class="flx">
                        <span class="stat__value">
                            {zero ? "--" : perfectDays}
                        </span>
                        <span class="stat__unit">
                            {zero ? "" : perfectDays === 1 ? "day" : "days"}
                        </span>
                    </div>
                    <span class="stat__label">100% Days</span>
                </div>                    
            </div>
            <div class="stat">
                <div class="stat__bottom">
                    <div class="flx">
                        <span class="stat__value">
                            {zero ? "--" : missed}
                        </span>
                        <span class="stat__unit">
                            {zero ? "" : missed === 1 ? "time" : "times"}
                        </span>
                    </div>
                    <span class="stat__label">Missed</span>
                </div>
            </div>
        </div>
    {/if}

    {#if yearHeatMap && pageView.heatmap}
        <div 
            style:margin="18px 0px 0px 0px" 
            style:padding-left={`${sidePadding}px`}
        >
            <HeatMap 
                type="habits"
                data={yearHeatMap}
                year={currYear}
                options={{
                    single: habits.length === 1
                }}
            />
        </div>
    {/if}

    <div class="details__month">
        <div class="details__month-header">
            <div class="flx">
                {#each monthItems as month, idx}
                    <button 
                        class="details__month-item"
                        class:details__month-item--active={idx === currMonthIdx}
                        on:click={() => currMonthIdx = idx}
                    >
                        {month.slice(0, 3)}
                    </button>
                {/each}
            </div>
            <div class="flx">
                <div class="flx" style:margin="0px 0px -4px 0px">
                    <button 
                        on:click={() => updateMonth(currMonthIdx - 1)}
                        class="details__arrow"
                        style:margin-left="10px"
                    >
                        <div style:margin-left={"-2px"}>
                            <SvgIcon 
                                icon={Icon.ChevronLeft} options={{ scale: 1.4 }}
                            />
                        </div>
                    </button>
                    <button 
                        on:click={() => updateMonth(currMonthIdx + 1)}
                        class="details__arrow"
                        class:details__arrow--opaque={isMonthCurr} 
                        style:margin-left="5px"
                    >
                        <div style:margin-right={"-2px"}>
                            <SvgIcon icon={Icon.ChevronRight} options={{ scale: 1.4 }}/>
                        </div>
                    </button>
                </div>
                <div class="details__settings-btn" >
                    <SettingsBtn 
                        id={"breakdown"}
                        onClick={() => breakdownOptions = !breakdownOptions}
                    />
                </div>
                <DropdownList 
                    id={"breakdown"}
                    isHidden={!breakdownOptions || pageView.viewStyling === "table"}
                    options={{
                        listItems: [
                            { 
                                name: "Card Style",
                                pickedItem: kebabToNormal(cardView.style),
                                items: [
                                    { name: "Tall" },
                                    { name: "Wide" }
                                ],
                                onListItemClicked: ({ name }) => updateView("Card Style", name)
                            },
                            { 
                                name: `"×" as Checked`,
                                active: cardView.xAsChecked,
                                onToggle: () => updateView("X as checked")
                            }
                        ],
                        onClickOutside: () => {
                            breakdownOptions = false
                        },
                        styling:  { 
                            zIndex: 100,
                            minWidth: "180px"
                        },
                        position: { 
                            top: "40px",
                            right: "0px"
                        }
                    }}
                />     
                <DropdownList 
                    id={"breakdown"}
                    isHidden={!breakdownOptions || pageView.viewStyling === "card"}
                    options={{
                        listItems: [
                            { 
                                name: "Group",
                                pickedItem: kebabToNormal(tableView.view),
                                items: [
                                    { name: "Default" },
                                    { name: "Time of Day" }
                                ],
                                onListItemClicked: ({ name }) => updateView(name)
                            },
                            { 
                                name: "Checkbox",
                                pickedItem: kebabToNormal(tableView.checkboxStyle),
                                divider: true,
                                items: [
                                    { name: "Box" },
                                    { name: "Minimal" }
                                ],
                                onListItemClicked: ({ name }) => updateView(name)
                            },
                            { 
                                name: "Emojis",
                                active: tableView.emojis,
                                onToggle: () => updateView("Emojis")
                            },
                            { 
                                name: "Captions",
                                active: tableView.allowCaptions,
                                onToggle: () => updateView("Captions")
                            },
                            { 
                                name: "Bottom Details",
                                active: tableView.bottomDetails,
                                divider: true,
                                onToggle: () => updateView("Bottom Details") 
                            },
                            {
                                sectionName: "Progress",
                            },
                            { 
                                name: "Detailed",
                                active: tableView.progress.numbers,
                                onToggle: () => updateView("Detailed")
                            }
                        ],
                        onClickOutside: () => {
                            breakdownOptions = false
                        },
                        styling:  { 
                            zIndex: 200,
                            minWidth: "160px"
                        },
                        position: { 
                            top: "40px",
                            right: "0px"
                        }
                    }}
                />
            </div>
        </div>
    
        <p class:hidden={pageView.monthEntry}>
            Your habits for the month of {monthName}{currYear === new Date().getFullYear() ? "" : ` ${currYear}`}.
        </p>
        {#if pageView.monthEntry && monthTextEntry}
            <div class="details__thought">
                {#key monthTextEntry}
                    <TextEntry 
                        id="month"
                        zIndex={50}
                        entry={monthTextEntry}
                    />
                {/key}
            </div>
        {/if}

        {#if monthMetrics && activeStreak && habits.length > 0}
            {@const { habitsDone, habitsDue, perfectDays, missed, longestStreak } = monthMetrics}
            {@const zero = habitsDue === 0}

            <div 
                class="details__month-stats stats"
                class:stats--light={light}
                class:border-none={!pageView.monthEntry}
                style:padding-top={pageView.monthEntry ? "12px" : "0px"}
            >
                <div class="stat" style:margin-right="35px">
                    <div class="stat__bottom">
                        <div class="flx">
                            <span class="stat__value">
                                {zero ? "--" : Math.floor((habitsDone / habitsDue) * 100)}
                            </span>
                            <span class="stat__unit" style:margin="0px 0px 0px 5px">
                                {zero ? "" : "%"}
                            </span>
                        </div>
                        <span class="stat__label">Consistency</span>
                    </div>                    
                </div>
                {#if longestStreak}
                    <div class="stat" style:margin-right="35px">
                        <div class="stat__bottom">
                            <div class="flx">
                                <span class="stat__value">
                                    {zero ? "--" : longestStreak.count}
                                </span>
                                <span class="stat__unit">
                                    {zero ? "" : longestStreak.count === 1 ? "day" : "days"}
                            </span>
                        </div>
                        <span class="stat__label">Longest Streak</span>
                        </div>                    
                    </div>
                {/if}
                <div class="stat">
                    <div class="stat__bottom">
                        <div class="flx">
                            <span class="stat__value">
                                {zero ? "--" : perfectDays}
                            </span>
                            <span class="stat__unit">
                                {zero ? "" : perfectDays === 1 ? "day" : "days"}
                            </span>
                        </div>
                        <span class="stat__label">100% Days</span>
                    </div>                    
                </div>
                <div class="stat">
                    <div class="stat__bottom">
                        <div class="flx">
                            <span class="stat__value">
                                {zero ? "--" : missed}
                            </span>
                            <span class="stat__unit">
                                {zero ? "" : missed === 1 ? "time" : "times"}
                            </span>
                        </div>
                        <span class="stat__label">Missed</span>
                    </div>
                </div>
            </div>
        {/if}
    
        <div class="details__breakdown">
            <div class="details__habits">
                {#if pageView.viewStyling === "card"}
                    <ul style:margin-top="14px">
                        {#each habits.sort((a, b) => a.order.default - b.order.default) as habit}
                            <li>
                                <HabitCard
                                    style={cardView.style}
                                    dotStyle={cardView.xAsChecked ? "x-mark" : "default"}
                                    monthIdx={currMonthIdx}
                                    year={currYear}
                                    {habit}
                                    {light}
                                />
                            </li>
                        {:else}
                            <li style:margin="30px auto 0px auto">
                                <EmptyList 
                                    emptyText="No habits"
                                    buttonText="Add a habit"
                                    subtitle={randomArrayElem(EXAMPLE_HABITS)}
                                    onButtonClick={() => {
                                        newHabitModal = true
                                    }}
                                />
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <div style:margin="5px 0px 0px 0px" style:width="100%">
                        <HabitsTable 
                            month={currMonth}
                            timeFrame="monthly"
                            options={tableView} 
                        />
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

{#if newHabitModal}
    <HabitViewModal 
        type="new"
        habit={{
            name: "",
            symbol: randomArrayElem(DEFAULT_SYMBOLS),
            img: null,
            freqType: "daily",
            frequency: 1,
            timeOfDay: "all-day",
            description: "",
            caption: "",
            createdAt: new Date(),
            id: uuidv4(),
            streak: 0,
            order: {
                default: 0,
                tod: 0
            }
        }}
        onNewFinish={() => newHabitModal = false}
    />
{/if}

<style lang="scss">
    @use "../../../scss/stats.scss" as *;

    .details {
        height: calc(100% - 50px);
        width: 100%;
        padding: 0px 20px 0px 0px;
        overflow: auto;
        font-weight: var(--fw-400-500);
        --month-item-opacity: 0.1;
        
        &--light {
            --month-item-opacity: 0.25;
        }
        &--text-block &__section-header {
            margin-top: 2px;
        }
        &--icon &__header {
            margin-top: var(--icon-offset);
        }
        &--icon &__header-settings {
            top: calc(-1 * var(--icon-offset) + 15px);
        }
        p {
            @include text-style(0.5, var(--fw-400-500), 1.45rem);
            margin: -3px 0px 15px 0px;
        }
        &__year {
            @include text-style(0.35, var(--fw-400-500), 1.5rem);
            margin: 4px 0px 20px 0px;
        }
        &__header {
            @include flex(center, space-between);
            position: relative;
        }
        &__header-title {
            @include text-style(1, var(--fw-400-500), 2.2rem, "Geist Mono");
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            padding-left: var(--side-padding);
            @include flex(flex-start);

            &--past-yr::after {
                display: block !important;
            }
        }
        &__top {
            position: relative;

            button:disabled {
                opacity: 0.065;
            }
        }
        &__month {
            position: relative;
            padding: 9px 0px 0px var(--side-padding);
            margin-top: 13px;
            border-top: var(--divider-border);
        }
        &__month-header {
            @include flex(center, space-between);
            margin: 0px 0px 11px 0px;
        }
        &__month-item {
            @include text-style(1, var(--fw-400-500), 1.4rem);
            opacity: var(--month-item-opacity);
            padding: 0px 8px;
            position: relative;
            
            &:first-child {
                padding-left: 0px;
            }
            &:hover {
                opacity: 0.7;
            }
            &--active {
                opacity: 1;
            }
        }
        &__section-header {
            @include text-style(0.7, _, 1.55rem);
            margin: 0px 0px 8px 0px;
            padding: 10px 0px 10px 0px;
            position: relative;
            border-top: var(--divider-border);
            @include flex(flex-start, space-between);
        }
        &__arrow {
            opacity: 0.45;
            @include center;
            @include circle(25px);
            
            &--opaque {
                opacity: 0.15;
            }
            &:hover {
                opacity: 1;
                background-color: rgba(var(--textColor1), 0.06);
            }
        }
        &__settings-btn {
            margin: 0px 0px 0px 9px;
        }
        &__thought {
            width: calc(100% - var(--side-padding));
            margin: -8px 0px 7px 0px;
        }
        &__year-stats {
            margin: 0px 0px 5px 0px;
            padding: 0px 0px 4px var(--side-padding);;
        }
        &__month-stats {
            margin: 0px 0px 5px 0px;
            border-top: var(--divider-border);
            padding: 0px 0px 12px 0px;;
        }
        &__breakdown {
            margin-top: 6px;

            h1 {
                @include text-style(0.35, _, 1.5rem, "system");
            }
        }
        &__habits {
            padding-bottom: 80px;
            ul {
                overflow: auto;
                display: flex;
                flex-wrap: wrap;
                row-gap: 9px;
                column-gap: 10px;
                align-content: flex-start;
                height: 100%;
            }
        }
    }
</style>