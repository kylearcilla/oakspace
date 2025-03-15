<script lang="ts"> 
	import { Icon } from "$lib/enums"
	import { getMonthFromIdx, months, sameMonth } from "$lib/utils-date"
	import { kebabToNormal } from "$lib/utils-general"
	import { MONTH_THOUGHT_ENTRY, YEAR_HABITS_DATA, YEAR_THOUGHT_ENTRY } from "$lib/mock-data"
    import { habitTracker, themeState } from "$lib/store"

	import HabitCard from "./HabitCard.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import TextEntry from "../base/TextEntry.svelte"
	import HabitsTable from "../base/HabitsTable.svelte"
    import SettingsBtn from "$components/SettingsBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import HeatMap from "$components/HeatMap.svelte";

    export let showHabitsLeft: boolean
    export let setLeftWidth: (on: boolean) => void

    let store = habitTracker
    let habits: Habit[] = []
    let metrics: HabitMonthMetrics | null = null
    let activeStreak: HabitActiveStreak | null = null

    let monthEntry = true
    let yearEntry = false

    let habitStyle: "card" | "table" = "table"
    let cardStyle: "tall" | "wide" = "wide"
    let cardDotStyle: "default" | "x-mark" = "default"
    
    let now = new Date()
    let monthOptions = false
    let breakdownOptions = false

    let currYear = now.getFullYear()
    let currMonthIdx = now.getMonth()
    let minYear = 2016

    let habitView: HabitTableOptions = {
        view: "time-of-day",
        stats: false,
        emojis: true,
        target: true,
        checkboxStyle: "box",
        bottomDetails: true,
        progress: {
            numbers: true,
            percentage: false
        }
    }

    $: light = !$themeState.isDarkTheme
    
    $: currMonth = new Date(currYear, currMonthIdx)
    $: isMonthCurr = sameMonth(currMonth, now)
    $: isYearCurr = currYear === now.getFullYear()
    
    $: monthName = currMonth.toLocaleString("default", { month: "long" })
    $: monthItems = isYearCurr ? months.slice(0, now.getMonth() + 1) : months

    store.subscribe((data) => {
        habits = data.habits
        activeStreak = data.activeStreak
        metrics = data.monthMetrics
    })

    function onOptionsClicked(optn: string) {
        monthOptions = !monthOptions
    }
    function updateYear(yr: number) {
        const max = now.getFullYear()
        currYear = Math.min(Math.max(yr, minYear), max)
        
        const current = currYear === now.getFullYear()    
        currMonthIdx = current ? now.getMonth() : 0
    }
    function updateMonth(idx: number) {
        const max = isYearCurr ? now.getMonth() : 11
        currMonthIdx = idx < 0 ? max : idx > max ? 0 : idx
    }

    function onHabitStyle(name: string) {
        if (name === "Card") {
            habitStyle = "card"
        }
        else if (name === "Table") {
            habitStyle = "table"
        }
    }
    function onCardStyle(name: string) {
        if (name === "Tall") {
            cardStyle = "tall"
        }
        else if (name === "Wide") {
            cardStyle = "wide"
        }
    }
    function updateHabitView(prop: string) {
        if (prop === "Default") {
            habitView.view = "default"
        }
        else if (prop === "Time of Day") {
            habitView.view = "time-of-day"
        }
        else if (prop === "Emojis") {
            habitView.emojis = !habitView.emojis
        }
        else if (prop === "Target") {
            habitView.target = !habitView.target
        }
        else if (prop === "Bottom Details") {
            habitView.bottomDetails = !habitView.bottomDetails
        }
        else if (prop === "Detailed") {
            habitView.progress.numbers = !habitView.progress.numbers
        }
        else if (prop === "Box") {
            habitView.checkboxStyle = "box"
        }
        else if (prop === "Minimal") {
            habitView.checkboxStyle = "minimal"
        }
        habitView = habitView
    }
</script>

<div 
    class="details" 
    class:details--light={light}
>
    <div class="details__header">
        <h1 class="details__header-title">
            {currYear}
        </h1>
        <div class="flx">
            <div class="flx" style:margin="0px 0px -4px 0px">
                <button 
                    class="details__now"
                    class:hidden={isYearCurr}
                    on:click={() => updateYear(now.getFullYear())}                        
                >
                    {new Date().getFullYear()}
                </button>
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
                    style:margin-left="10px" 
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
                        name: "Add Year Entry",
                        active: yearEntry,
                        onToggle: () => yearEntry = !yearEntry
                    },
                    { 
                        name: "Add Month Entry",
                        active: monthEntry,
                        onToggle: () => monthEntry = !monthEntry
                    },
                    { 
                        name: "Left Habits List",
                        active: showHabitsLeft,
                        divider: true,
                        onToggle: () => {
                            showHabitsLeft = !showHabitsLeft
                            setLeftWidth(showHabitsLeft)
                        }
                    },
                    {
                        sectionName: "Habit Style",
                    },
                    { 
                        name: "Styling",
                        pickedItem: kebabToNormal(habitStyle),
                        items: [
                            { name: "Card" },
                            { name: "Table" }
                        ],
                        onListItemClicked: ({ name }) => onHabitStyle(name)
                    },
                ],
                onClickOutside: () => {
                    monthOptions = false
                },
                styling:  { 
                    zIndex: 100,
                    width: "190px",
                },
                position: { 
                    top: "25px",
                    right: "0px",
                }
            }}
        />
    </div>

    {#if yearEntry}
        <div class="details__thought">
            <TextEntry 
                id="yr"
                zIndex={50}
                entry={MONTH_THOUGHT_ENTRY}
            />
        </div>
    {/if}

    <p class:hidden={yearEntry} style:margin-bottom="9px">
        {#if currYear != new Date().getFullYear()}
            Overview of your habits for the year of {currYear}.
        {:else}
            Overview of your habits this year.
        {/if}
    </p>

    {#if metrics && activeStreak}
        {@const { habitsDone, habitsDue, perfectDays, missed, longestStreak } = metrics}
        {@const zero = habitsDue === 0}

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
                            {activeStreak.count}
                        </span>
                        <span class="stat__unit">
                            {activeStreak.count === 1 ? "day" : "days"}
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

    <div style:margin="20px 0px 13px 0px" style:padding-left="20px">
        <HeatMap 
            id="0"
            type="habits" 
            options={{ startDate: new Date(currYear, 0, 1), from: "next" }}
        />
    </div>

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
                        class="details__now"
                        class:hidden={isMonthCurr || !isYearCurr}
                        on:click={() => updateYear(now.getFullYear())}                        
                    >
                        Go Back
                    </button>
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
                        style:margin-left="10px"
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
                    isHidden={!breakdownOptions || habitStyle === "table"}
                    options={{
                        listItems: [
                            { 
                                name: "Card Style",
                                pickedItem: kebabToNormal(cardStyle),
                                items: [
                                    { name: "Tall" },
                                    { name: "Wide" }
                                ],
                                onListItemClicked: ({ name }) => onCardStyle(name)
                            },
                            { 
                                name: `"×" as Checked`,
                                active: cardDotStyle === "x-mark",
                                onToggle: () => {
                                    cardDotStyle = cardDotStyle === "x-mark" ? "default" : "x-mark"
                                }
                            }
                        ],
                        onListItemClicked: ({ name }) => {
                            onOptionsClicked(name)
                        },
                        onClickOutside: () => {
                            breakdownOptions = false
                        },
                        styling:  { 
                            zIndex: 100,
                            width: "170px",
                        },
                        position: { 
                            top: "40px",
                            right: "0px"
                        }
                    }}
                />     
                <DropdownList 
                    id={"breakdown"}
                    isHidden={!breakdownOptions || habitStyle === "card"}
                    options={{
                        listItems: [
                            { 
                                name: "Group",
                                pickedItem: kebabToNormal(habitView.view),
                                items: [
                                    { name: "Default" },
                                    { name: "Time of Day" }
                                ],
                                onListItemClicked: ({ name }) => updateHabitView(name)
                            },
                            { 
                                name: "Checkbox",
                                pickedItem: kebabToNormal(habitView.checkboxStyle),
                                divider: true,
                                items: [
                                    { name: "Box" },
                                    { name: "Minimal" }
                                ],
                                onListItemClicked: ({ name }) => updateHabitView(name)
                            },
                            { 
                                name: "Emojis",
                                active: habitView.emojis,
                                onToggle: () => updateHabitView("Emojis")
                            },
                            { 
                                name: "Target",
                                active: habitView.target,
                                onToggle: () => updateHabitView("Target")
                            },
                            { 
                                name: "Bottom Details",
                                active: habitView.bottomDetails,
                                divider: true,
                                onToggle: () => updateHabitView("Bottom Details") 
                            },
                            {
                                sectionName: "Progress",
                            },
                            { 
                                name: "Detailed",
                                active: habitView.progress.numbers,
                                onToggle: () => updateHabitView("Detailed")
                            }
                        ],
                        onListItemClicked: ({ name }) => {
                            onOptionsClicked(name)
                        },
                        onClickOutside: () => {
                            breakdownOptions = false
                        },
                        styling:  { 
                            zIndex: 200,
                            width: "170px",
                        },
                        position: { 
                            top: "40px",
                            right: "0px"
                        }
                    }}
                />
            </div>
        </div>
    
        <p class:hidden={monthEntry}>
            Your habits for the month of {monthName}{currYear === new Date().getFullYear() ? "" : ` ${currYear}`}.
        </p>
        {#if monthEntry}
            <div class="details__thought">
                <TextEntry 
                    id="month"
                    zIndex={50}
                    entry={YEAR_THOUGHT_ENTRY}
                />
            </div>
        {/if}

        {#if metrics && activeStreak}
            {@const { habitsDone, habitsDue, perfectDays, missed, longestStreak } = metrics}
            {@const zero = habitsDue === 0}

            <div 
                class="details__month-stats stats"
                class:stats--light={light}
                class:border-none={!monthEntry}
                style:padding-top={monthEntry ? "12px" : "0px"}
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
                {#if habitStyle === "card"}
                    <ul style:margin-top="14px">
                        {#each habits.sort((a, b) => a.order.default - b.order.default) as habit}
                            <li>
                                <HabitCard
                                    style={cardStyle}
                                    dotStyle={cardDotStyle}
                                    monthIdx={currMonthIdx}
                                    year={currYear}
                                    {habit}
                                    {light}
                                />
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <div style:margin="5px 0px 0px 0px" style:width="100%">
                        <HabitsTable 
                            month={currMonth}
                            timeFrame="monthly"
                            options={habitView} 
                        />
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../scss/stats.scss";

    .details {
        height: calc(100% - 70px);
        width: 100%;
        padding: 11px 0px 0px 0px;
        overflow: auto;
        font-weight: var(--fw-400-500);
        --month-item-opacity: 0.1;
        
        &--light {
            --month-item-opacity: 0.25;
        }
        &--text-block &__section-header {
            margin-top: 2px;
        }
        p {
            @include text-style(0.5, var(--fw-400-500), 1.45rem);
            margin: 1px 0px 12px 0px;
            padding-left: 20px;
        }
        &__header-title {
            @include text-style(1, var(--fw-400-500), 2.55rem, "Geist Mono");
            margin-bottom: 6px;
            display: flex;
            align-items: flex-start;
            padding-left: 20px;
            @include flex(flex-start);

            &--past-yr::after {
                display: block !important;
            }
        }
        &__header {
            @include flex(flex-start, space-between);
            position: relative;

            button:disabled {
                opacity: 0.065;
            }
        }
        &__month {
            position: relative;
            border-top: var(--divider-border);
            padding: 10px 0px 0px 20px;
        }
        &__month-header {
            @include flex(center, space-between);
            margin: 0px 0px 11px 0px;
        }
        &__month-item {
            @include text-style(1, var(--fw-400-500), 1.4rem, "Geist Mono");
            opacity: var(--month-item-opacity);
            margin-right: 16px;

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
        &__now {
            @include text-style(_, var(--fw-400-500), 1.4rem);
            margin-top: -3px;
            opacity: 0.2;
            &:hover {
                opacity: 0.75;
            }
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
            width: calc(100% - 20px);
            margin: -8px 0px 7px 0px;
        }
        &__year-stats {
            margin: 0px 0px 5px 0px;
            padding: 0px 0px 4px 20px;
        }
        &__month-stats {
            margin: 0px 0px 5px 0px;
            border-top: var(--divider-border);
            padding: 0px 0px 16px 0px;
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