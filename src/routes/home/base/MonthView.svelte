<script lang="ts">
	import { onMount } from "svelte"

	import { Icon } from "../../../lib/enums"
	import { themeState } from "../../../lib/store"
	import { ACTIVITY_DATA } from "../../../lib/mock-data"
    import { getWeekPeriod, getWeekPeriodStr } from "../../../lib/utils-date"
	import { capitalize, clickOutside, getElemById, getHozSpace, kebabToNormal, normalToKebab } from "../../../lib/utils-general"

	import YearView from "./YearView.svelte"
	import GoalsList from "./GoalsList.svelte"
	import GoalsView from "./GoalsView.svelte"
	import WeeklyHabits from "./WeeklyHabits.svelte"
	import SvgIcon from "../../../components/SVGIcon.svelte"
	import ToggleBtn from "../../../components/ToggleBtn.svelte"
	import BounceFade from "../../../components/BounceFade.svelte"
	import SettingsBtn from "../../../components/SettingsBtn.svelte"
	import DropdownBtn from "../../../components/DropdownBtn.svelte"
	import DropdownList from "../../../components/DropdownList.svelte"
	import DayView from "./DayView.svelte"
	import ActivityCalendar from "../../../components/ActivityCalendar.svelte"
	import { imageUpload } from "../../../lib/pop-ups";
	import DayEntry from "./DayEntry.svelte";
	import ProgressBar from "../../../components/ProgressBar.svelte";

    type MonthDetailsView = "overview" | "goals" | "habits" | "yr-view"
    type GoalsView = {
        view: "list" | "board"
        listGrouping: "status" | "tag" | "default"
        boardGrouping: "status" | "tag"
        progress: number
    }

    let currView: MonthDetailsView = "yr-view"
    let optionsOpen = false
    let overviewType: "monthly" | "daily" = "monthly"
    let leftArrow: HTMLButtonElement | null = null
    let rightArrow: HTMLButtonElement | null = null

    let weeksAgoIdx = 0
    let monthsAgoIdx = 0
    
    let activityIdx = 2
    let activity = ACTIVITY_DATA[activityIdx]
    let entryModal = false
    
    let subMenu: "g-group" | "g-progress" | "h-view" | "d-view" | null = null
    let goalsView: GoalsView = {
        view: "list",
        listGrouping: "default",
        boardGrouping: "status",
        progress: 0
    }
    
    $: isLight = !$themeState.isDarkTheme

    /* view options */
    let overview = {
        animPhotos: true,
        showHighlight: true,
        fontStyle: "stylish"
    }
    let habitView = {
        view: "default",
        emojis: true,
        target: true,
        progress: {
            numbers: true,
            daily: true,
            percentage: false
        }
    }
    let btnHighlighter = {
        width: 0, left: 0
    }

    $: if (currView != undefined) {
        onArrowBtnClicked()
    }

    function highlightHandler(context: "image" | "entry") {
        const { highlightImg, thoughtEntry } = activity

        if (context === "image" && highlightImg) {
            activity.highlightImg = null
        }
        else if (context === "image") {
            imageUpload.init({
                onSubmit: (src: string | null) => {
                    if (src) {
                        activity.highlightImg = {
                            src, caption: "no caption"
                        }
                        activity = activity
                    }
                }
            })
        }
        if (context === "entry" && thoughtEntry) {
            activity.thoughtEntry = null
        }
        else if (context === "entry") {
            entryModal = true
        }

        subMenu = null
    }
    function onDayEntryUpdate(updatedData: DayEntryUpdatePayload) {
        if (updatedData.img) {
            activity.highlightImg.src     = updatedData.img.src ?? activity.highlightImg.src
            activity.highlightImg.caption = updatedData.img.caption ?? activity.highlightImg.caption
        }
        else {
            activity.highlightImg = undefined
        }

        activity.thoughtEntry = updatedData.thoughtEntry ?? ""
        activity = activity

        entryModal = false
    }
    function onGoalSubListClicked({ name }) {
        const optn     = normalToKebab(name)

        if (subMenu === "g-group") {
            const grouping = optn as "status" | "tag" | "none"

            if (goalsView.view === "list") {
                goalsView.listGrouping = grouping === "none" ? "default" : grouping
            } 
            else {
                goalsView.boardGrouping = grouping as "status" | "tag"
            }
        }
        else if (subMenu === "h-view") {
            habitView.view = optn
        }

        if (subMenu.startsWith("g-")) {
            goalsView = goalsView
        }
        if (subMenu.startsWith("h-")) {
            goalsView = goalsView
        }

        subMenu = null
        optionsOpen = false
    }
    function onArrowBtnClicked(direction?: "left" | "right") {
        if (leftArrow == null || rightArrow == null) return
        let leftArrowDisabled = false
        let rightArrowDisabled = false

        if (currView === "overview") {
            if (direction === "left") {
                activityIdx = Math.max(0, activityIdx - 1)
            }
            else if (direction === "right") {
                activityIdx = Math.min(ACTIVITY_DATA.length - 1, activityIdx + 1)
            }
            activity = ACTIVITY_DATA[activityIdx]
        }
        else if (currView === "habits") {
            if (direction === "left") {
                weeksAgoIdx = Math.min(5, weeksAgoIdx + 1)
            }
            else if (direction === "right") {
                weeksAgoIdx = Math.max(0, weeksAgoIdx - 1)
            }

            leftArrowDisabled = weeksAgoIdx === 5
            rightArrowDisabled = weeksAgoIdx === 0
        }

        leftArrow!.disabled = leftArrowDisabled
        rightArrow!.disabled = rightArrowDisabled
    }
    function onViewBtnClicked(view: MonthDetailsView) {
        currView = view
        const btnElem = getElemById(`month-view--${view}`)

        if (!btnElem) return

        const width = btnElem.clientWidth
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

        btnHighlighter.width = width + (view === "overview" ? 2 : 5)
        btnHighlighter.left  = Math.max(left - 2, 0)
    }

    onMount(() => {
        onViewBtnClicked(currView)
    })
</script>


<div 
    class={`month-view month-view--${currView}`}
    class:month-view--light={isLight}
>
    <div class="month-view__details">
        <div class="month-view__details-header">
            <div class="month-view__header-btns">
                <button 
                    id={"month-view--overview"}
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "overview"}
                    on:click={(e) => onViewBtnClicked("overview")}
                >
                    <span>Overview</span>
                </button>
                <button 
                    id={"month-view--habits"}
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "habits"}
                    on:click={(e) => onViewBtnClicked("habits")}
                >
                    <span>Habits</span> 
                </button>
                <button 
                    id={"month-view--goals"}
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "goals"}
                    on:click={(e) => onViewBtnClicked("goals")}
                >
                    <span>Goals</span> 
                </button>
                <button 
                    id={"month-view--yr-view"}
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "yr-view"}
                    on:click={(e) => onViewBtnClicked("yr-view")}
                >
                    <span>Year</span> 
                </button>
                <div 
                    style:left={`${btnHighlighter.left}px`}
                    style:width={`${btnHighlighter.width}px`}
                    class="month-view__btn-highlight"
                >
                </div>
            </div>
            <div class="month-view__details-header-right">
                <div class="month-view__settings">
                    {#if currView === "overview"}
                        <div 
                            class="month-view__overview-options"
                            style:margin="0px 2px -5.5px 0px"
                        >
                            <!-- <button
                                class="month-view__overview-btn"
                                class:month-view__overview-btn--clicked={overviewType === "monthly"}
                                on:click={() => overviewType = "monthly"}
                            >
                                Monthly
                            </button>
                            <button
                                class="month-view__overview-btn"
                                class:month-view__overview-btn--clicked={overviewType === "daily"}
                                on:click={() => overviewType = "daily"}
                            >
                                Daily
                            </button> -->
                        </div>
                    {/if}
                    <div class="month-view__period">
                        {#if currView === "habits"}
                            {#if weeksAgoIdx === 0} 
                                This Week
                            {:else}
                                {@const { start, end } = getWeekPeriodStr(new Date(), weeksAgoIdx)}
                                <span>{start}</span> - <span>{end}</span>
                            {/if}
                        {:else if currView === "goals"}
                            <div class="flx-algn-center">
                                <ProgressBar 
                                    progress={goalsView.progress}
                                />
                                <span style:margin="0px -1px 0px 12px">
                                    June
                                </span>
                            </div>
                        {:else if currView === "yr-view"}
                            <div style:font-size="1.6rem">
                                {2025}
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
                                <SvgIcon icon={Icon.ChevronLeft}/>
                            </div>
                        </button>
                        <button 
                            bind:this={rightArrow}
                            on:click={() => onArrowBtnClicked("right")}
                            class="month-view__arrow"
                        >
                            <div style:margin-right={"-2px"}>
                                <SvgIcon icon={Icon.ChevronRight}/>
                            </div>
                        </button>
                    </div>
                    <div 
                        class="month-view__settings-btn" 
                        style:margin="0px 0px -2px 9px"
                    >
                        <SettingsBtn 
                            id={"month-view--dbtn"}
                            onClick={() => optionsOpen = !optionsOpen}
                        />
                    </div>
                </div>
            </div>
            <!-- settings menu -->
            <BounceFade 
                isHidden={!optionsOpen}
                zIndex={200}
                position={{ 
                    top: "44px", right: "5px"
                }}
            >
                <div 
                    id="month-view--dmenu"
                    class="day-settings dmenu" 
                    class:dmenu--light={isLight}
                    style:width={currView === "goals" ? "175px" : "200px"}
                    use:clickOutside on:click_outside={() => optionsOpen = false} 
                >
                    <!-- month view -->
                    {#if currView === "overview" && overviewType === "monthly"}
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Monthly View
                            </div>
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Animate Photo Wall</span>
                                <ToggleBtn 
                                    active={overview.animPhotos}
                                    onToggle={() => {
                                        overview.animPhotos = !overview.animPhotos
                                        overview = overview
                                    }}
                                />
                            </div>
                        </li>
                    {/if}
                    <!-- day view -->
                    {#if currView === "overview" && overviewType === "daily"}
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Day View
                            </div>
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Show Highlights</span>
                                <ToggleBtn 
                                    active={overview.showHighlight}
                                    onToggle={() => {
                                        overview.showHighlight = !overview.showHighlight
                                        overview = overview
                                    }}
                                />
                            </div>
                            <div class="dmenu__option dmenu__option--static">
                                <span class="dmenu__option-heading">Heading Style</span>
                                <DropdownBtn 
                                    id={"d-view"}
                                    isActive={subMenu === "d-view"}
                                    options={{
                                        pickedOptionName: capitalize(overview.fontStyle),
                                        onClick: () => { 
                                            subMenu = subMenu === "d-view" ? null : "d-view"
                                        },
                                    }}
                                />
                            </div>
                            <DropdownList 
                                id="d-view"
                                isHidden={subMenu != "d-view"} 
                                options={{
                                    pickedItem: capitalize(overview.fontStyle),
                                    listItems: [
                                        { name: "Basic" }, { name: "Stylish" }, { name: "Fancy" }
                                    ],
                                    position: { 
                                        top: "120px", right: "2px" 
                                    },
                                    styling: { 
                                        width: "100px" 
                                    },
                                    onClickOutside: () => { 
                                        subMenu = null 
                                    },
                                    onListItemClicked: ({ name }) => {
                                        overview.fontStyle = name.toLowerCase()
                                        overview = overview

                                        subMenu = null
                                    }
                                }}
                            />
                        </li>
                        <li class="dmenu__section-divider"></li>
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Day Highlight
                            </div>
                            <div class="dmenu__option">
                                <button
                                    class="dmenu__option-btn"
                                    on:click={() => highlightHandler("entry")}
                                >
                                    <span class="dmenu__option-text">
                                        {activity.thoughtEntry ? "Remove Entry" : "Add Entry"}
                                    </span>
                                </button>
                            </div>
                            <div class="dmenu__option">
                                <button
                                    class="dmenu__option-btn"
                                    on:click={() => highlightHandler("image")}
                                >
                                    <span class="dmenu__option-text">
                                        {activity.highlightImg ? "Remove Photo" : "Add Photo"}
                                    </span>
                                </button>
                            </div>
                        </li>
                    {/if}
                    {#if currView === "goals"}
                        {@const { listGrouping, boardGrouping, view } = goalsView}
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Goals Settings
                            </div>
                            <div style:display="flex" style:margin="5px 0px 10px 7px">
                                <button 
                                    class="dmenu__box" 
                                    class:dmenu__box--selected={view === "list"}
                                    on:click={() => {
                                        goalsView.view = "list"
                                        goalsView = goalsView

                                        optionsOpen = false
                                    }}
                                >
                                    <div class="dmenu__box-icon">
                                        <i class="fa-solid fa-list-check"></i>
                                    </div>
                                    <span>List</span>
                                </button>
                                <button 
                                    class="dmenu__box" 
                                    class:dmenu__box--selected={view === "board"}
                                    on:click={() => {
                                        goalsView.view = "board"
                                        goalsView = goalsView

                                        optionsOpen = false
                                    }}
                                >
                                    <div class="dmenu__box-icon">
                                        <i 
                                            class="fa-solid fa-square-poll-vertical"
                                            style:font-size="2rem"
                                            style:transform="scaleY(-1)"
                                        >
                                        </i>
                                    </div>
                                    <span>Board</span>
                                </button>
                            </div>
                            <div 
                                class="dmenu__option dmenu__option--static"
                                style:pointer-events={view === "board" ? "none" : "auto"}
                                style:opacity={view === "board" ? "0.35" : "1"}
                            >
                                <span class="dmenu__option-heading">Group By</span>
                                <DropdownBtn 
                                    id={"g-group"}
                                    isActive={subMenu === "g-group"}
                                    options={{
                                        pickedOptionName: capitalize(view === "list" ? listGrouping : boardGrouping),
                                        onClick: () => {
                                            subMenu = subMenu === "g-group" ? null : "g-group"
                                        },
                                    }}
                                />
                            </div>
                            <DropdownList 
                                id="g-group"
                                isHidden={subMenu != "g-group"} 
                                options={{
                                    pickedItem: capitalize(view === "list" ? listGrouping : boardGrouping),
                                    listItems: [
                                        ...(view === "list" ? [{ name: "Default" }] : []),
                                        { name: "Status" }, 
                                        { name: "Tag" }
                                    ],
                                    position: { 
                                        top: "125px", right: "2px" 
                                    },
                                    styling: { 
                                        width: "100px" 
                                    },
                                    onClickOutside: () => { 
                                        subMenu = null 
                                    },
                                    onListItemClicked: onGoalSubListClicked
                                }}
                            />
                        </li>
                    {/if}
                    {#if currView === "habits"}
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Habits Settings
                            </div>
                            <div class="dmenu__option dmenu__option--static">
                                <span class="dmenu__option-heading">Group By</span>
                                <DropdownBtn 
                                    id={"habits-view"}
                                    options={{
                                        pickedOptionName: kebabToNormal(habitView.view),
                                        onClick: () => {
                                            subMenu = subMenu === "h-view" ? null : "h-view"
                                        },
                                    }}
                                />
                            </div>
                            <DropdownList 
                                id="habits-view"
                                isHidden={subMenu != "h-view"} 
                                options={{
                                    pickedItem: kebabToNormal(habitView.view),
                                    listItems: [
                                        { name: "Default" }, { name: "Time of Day" }
                                    ],
                                    position: { 
                                        top: "58px", right: "2px" 
                                    },
                                    styling: { 
                                        width: "120px" 
                                    },
                                    onClickOutside: () => { 
                                        subMenu = null 
                                    },
                                    onListItemClicked: onGoalSubListClicked
                                }}
                            />
                            <div class="dmenu__toggle-optn  dmenu__option--static">
                                <span class="dmenu__option-heading">Emojis</span>
                                <ToggleBtn 
                                    active={habitView.emojis}
                                    onToggle={() => {
                                        habitView.emojis = !habitView.emojis
                                        habitView = habitView
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn  dmenu__option--static">
                                <span class="dmenu__option-heading">Target</span>
                                <ToggleBtn 
                                    active={habitView.target}
                                    onToggle={() => {
                                        habitView.target = !habitView.target
                                        habitView = habitView
                                    }}
                                />
                            </div>
                        </li>
                        <li class="dmenu__section-divider"></li>
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Progress
                            </div>
                            <div class="dmenu__toggle-optn dmenu__option--static">
                                <span class="dmenu__option-heading">Daily Progress</span>
                                <ToggleBtn 
                                    active={habitView.progress.daily}
                                    onToggle={() => {
                                        habitView.progress.daily = !habitView.progress.daily
                                        habitView = habitView
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn  dmenu__option--static">
                                <span class="dmenu__option-heading">Detailed</span>
                                <ToggleBtn 
                                    active={habitView.progress.numbers}
                                    onToggle={() => {
                                        habitView.progress.numbers = !habitView.progress.numbers
                                        habitView = habitView
                                    }}
                                />
                            </div>
                            {#if habitView.progress.numbers}
                                <div class="dmenu__toggle-optn dmenu__option--static">
                                    <span class="dmenu__option-heading">Percentage</span>
                                    <ToggleBtn 
                                        active={habitView.progress.percentage}
                                        onToggle={() => {
                                            habitView.progress.percentage = !habitView.progress.percentage
                                            habitView = habitView
                                        }}
                                    />
                                </div>
                            {/if}
                        </li>
                    {/if}
                </div>
            </BounceFade>
        </div>
        <div class="divider"></div>
        <div class="month-view__details-view">
            {#if currView === "overview"}
                {#if overviewType === "monthly"}    
                    <ActivityCalendar 
                        options={overview}
                        onDayClicked={(dayIdx) => {
                            overviewType = "daily"

                            activityIdx  = dayIdx
                            activity = ACTIVITY_DATA[activityIdx]
                        }} 
                    />
                {:else}
                    <DayView 
                        options={overview} 
                        activity={activity} 
                    />
                {/if}
            {:else if currView === "habits"}
                <WeeklyHabits 
                    weeksAgoIdx={weeksAgoIdx}
                    options={habitView} 
                />
            {:else if currView === "goals"}
               <GoalsView 
                    goalsView={goalsView} 
                    onProgressChange={(progress) => {
                        goalsView.progress = progress
                        goalsView = goalsView
                    }}
                />
            {:else}
                <div class="month-view__yr-view">
                    <YearView/>
                </div>
            {/if}
        </div>
    </div>
</div>

{#if entryModal} 
    {@const { highlightImg, thoughtEntry, date } = activity }
    <DayEntry 
        data={{
            img: highlightImg,
            date,
            thoughtEntry
        }}
        onUpdate={onDayEntryUpdate}
    />
{/if}

<style lang="scss">
    @import "../../../scss/dropdown.scss";

    .month-view {
        &--light &__heading {
            font-weight: 500;
        }
        &--light &__header-btn {
            @include text-style(0.5, 500);
            
            span {
                @include text-style(1, 600);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.0355);
            }
        }
        &--light &__todo-settings-btn {
            opacity: 0.6;
            background-color: rgba(var(--textColor1), 0.1);
        }
        &--light &__todo-settings-btn:hover {
            background-color: rgba(var(--textColor1), 0.2) !important;
        }
        &--light &__wom:before {
            background-color: rgba(var(--textColor1), 0.145);
        }
        &--light &__word {
            @include text-style(1, 600);
        }
        &--light &__word-type {
            @include text-style(0.4, 500);
        }
        &--light &__word-def {
            @include text-style(0.8, 500);
        }
        &--light &__period {
            font-weight: 600;
        }
        &--light .divider {
            @include l-div
        }
        &--yr-view &__details .divider {
            margin-bottom: 0px;
        }

        .divider {
            background-color: rgba(var(--textColor1), 0.035);
            height: 0.5px;
            width: 100%;
            margin: 1px 0px 0px 0px;
        }

        /* view options */
        &__btns {
            display: flex;
            margin-bottom: 0px;
            position: relative;
        }
        &__settings {
            @include flex(center);
            margin-bottom: 10px;
        }

        /* DETAILS */
        &__details {
            margin: 0px 0px 0px 0px;
            padding: 0px 0px 4px 0px;
            min-height: 500px;
            position: relative;

            .divider {
                margin: 0px 0px 12px 0px;
            }
        }

        /* month view header */
        &__details-view {
            // overflow-x: scroll;
            // overflow-y: hidden;
            overflow: visible;
            margin: 0px 0px 0px -35px;
            padding-left: 35px;
        }
        &__details-header {
            position: relative;
            margin-bottom: 2px;
            @include flex(center, space-between);
        }
        &__details-header-right {
            margin-top: 0px;
            @include flex(center);
        }
        &__header-btns {
            margin: -8px 10px 0px 0px;
            position: relative;
            @include flex(center);
        }
        &__header-btn {
            padding: 5px 0px 0px 0px;
            border-radius: 29px;
            margin: 0px 14px 0px 2px;
            white-space: nowrap;
            opacity: 0.2;
            transition: 0.1s ease-in-out;
            @include flex(center);

            &:hover {
                opacity: 0.4;
            }
            &--chosen {
                opacity: 1 !important;
            }
            span {
                @include text-style(0.85, 400, 1.6rem, "Geist Mono");
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
        &__btn-highlight {
            @include abs-bottom-left(-10px);
            height: 1.5px;
            background-color: rgba(var(--textColor1), 0.9);
            transition: 0.18s cubic-bezier(.4, 0, .2, 1);
            border-radius: 2px;
        }
        &__arrow {
            opacity: 0.45;
            margin-left: 20px;
            height: 29px;
            width: 29px;
            border-radius: 20px;
            
            &:disabled {
                opacity: 0.1 !important;
                background: none !important;
            }
            &:first-child {
                margin-left: 20px;
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.03);
                opacity: 0.8;
            }
        }
        &__period {
            @include text-style(0.4, 400, 1.3rem, "Geist Mono");
            margin: 7px 0px 0px 0px;

            span {
                margin: 0px 8px;
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
        &__yr-view {
            margin: 10px 0px 0px 0px;
        }
    }

    .dmenu {
        overflow: visible;
        &__option {
            overflow: visible;
        }
        &__toggle-optn {
            padding: 6px 7px 7px 7px;
            width: 100%;
            @include flex(center, space-between);
        }
        &__section-divider:last-child {
            display: none;
        }
        &__option-btn {
            border-radius: 7px;
        }
    }
</style>