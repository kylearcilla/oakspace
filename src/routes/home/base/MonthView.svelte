<script lang="ts">
	import { onMount } from "svelte"

	import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { ACTIVITY_DATA } from "$lib/mock-data"
    import { formatDatetoStr, getWeekPeriodStr, months } from "$lib/utils-date"
	import { capitalize, clickOutside, getElemById, getHozSpace, getMaskedGradientStyle, kebabToNormal, normalToKebab } from "$lib/utils-general"

	import YearView from "./YearView.svelte"
	import GoalsView from "./GoalsView.svelte"
	import WeeklyHabits from "./WeeklyHabits.svelte"
	import ActivityCalendar from "./Overview.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import ToggleBtn from "$components/ToggleBtn.svelte"
	import BounceFade from "$components/BounceFade.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import DropdownBtn from "$components/DropdownBtn.svelte"
	import ProgressBar from "$components/ProgressBar.svelte"
	import DropdownList from "$components/DropdownList.svelte"

    type MonthDetailsView = "overview" | "goals" | "habits" | "yr-view"
    type GoalsView = {
        view: "list" | "board"
        progress: number
        list: {
            grouping: "status" | "tag" | "default"
            showProgress: boolean
            due: boolean
            dueType: "date" | "distance"
        }
        board: {
            grouping: "status" | "tag"
            showProgress: boolean
            due: boolean
            dueType: "date" | "distance"
        }
    }

    let currView: MonthDetailsView = "overview"
    let optionsOpen = false
    let overviewType: "monthly" | "daily" = "monthly"
    let leftArrow: HTMLButtonElement | null = null
    let rightArrow: HTMLButtonElement | null = null
    let headerBtnsRef: HTMLElement | null = null
    let today = new Date()

    let weeksAgoIdx = 0
    let monthsAgoIdx = 0
    let width = 0
    
    let activityIdx = 2
    let activity = ACTIVITY_DATA[activityIdx]
    let entryModal = false
    let gradient = ""
    
    let subMenu: "g-group" | "g-progress" | "h-view" | "d-view" | "g-due" | null = null
    
    $: isLight = !$themeState.isDarkTheme

    /* view options */
    let overview = {
        animPhotos: true,
        textBlock: true,
        habitsMark: true,
        focusTime: false,
        heading: false
    }
    let goalsView: GoalsView = {
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
            dueType: "date"
        }
    }
    let habitView = {
        view: "default",
        stats: true,
        emojis: true,
        target: true,
        progress: {
            numbers: false,
            daily: true,
            percentage: false
        }
    }
    let yearView = {
        yearsAgoIdx: 0,
        emojis: true,
        showTextEntry: true,
        showYear: false
    }

    let btnHighlighter = {
        width: 0, left: 0
    }

    $: if (currView != undefined) {
        onArrowBtnClicked()
    }
    $: if (width && headerBtnsRef && width < 500) {
        requestAnimationFrame(() => handleScroll(headerBtnsRef))
    }
    else {
        gradient = ""
    }

    function onGoalSubListClicked({ name }) {
        const optn = normalToKebab(name)

        if (subMenu === "g-group") {
            const grouping = optn as "status" | "tag" | "none"

            if (goalsView.view === "list") {
                goalsView.list.grouping = grouping === "none" ? "default" : grouping
            } 
            else {
                goalsView.board.grouping = grouping as "status" | "tag"
            }
        }
        else if (subMenu === "g-due") {
            const viewType = goalsView.view
            goalsView[viewType].dueType = optn as "date" | "distance"
        }
        else if (subMenu === "h-view") {
            habitView.view = optn
        }

        goalsView = goalsView
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
        const width = btnElem.clientWidth
        const scrollLeft = headerBtnsRef.scrollLeft
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
    }
    function handleScroll(elem: HTMLElement) {
        const { styling } = getMaskedGradientStyle(elem, {
            isVertical: false,
            head: {
                end: "20px"
            },
            tail: {
                start: "20%",
                end: "100%"
            }
        })
        gradient = styling
    }

    onMount(() => {
        handleScroll(headerBtnsRef)
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
            <div class="month-view__details-header-right">
                <div class="month-view__settings">
                    <div class="month-view__period">
                        {#if currView === "overview"}
                            <div 
                                style:margin="4px -1px 0px 12px"
                                style:font-size="1.4rem"
                            >
                                {formatDatetoStr(today, { month: "long" })}
                            </div>
                        {:else if currView === "habits"}
                            <div 
                                style:font-size="1.4rem" 
                                style:margin="5px 0px 0px 0px"
                            >
                                {#if weeksAgoIdx === 0} 
                                    This Week
                                {:else}
                                    {@const { start, end } = getWeekPeriodStr(new Date(), weeksAgoIdx)}
                                    <span>{start}</span> - <span>{end}</span>
                                {/if}
                            </div>
                        {:else if currView === "goals"}
                            {@const progress = goalsView.progress}
                            <div class="flx-algn-center" style:margin="0px 0px -2px 0px">
                                <div style:margin-top="5px">
                                    <ProgressBar {progress}/>
                                </div>
                                <span 
                                    style:margin="4px -1px 0px 12px"
                                    style:font-size="1.4rem"
                                >
                                    {formatDatetoStr(today, { month: "short" })}
                                </span>
                            </div>
                        {:else if currView === "yr-view"}
                            <div 
                                style:font-size="1.4rem"
                                style:margin="5px 0px 0px 0px"
                            >
                                {today.getFullYear()}
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
                            style:margin-left="10px"
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
                position={{ top: "42px", right: "5px" }}
            >
                <div 
                    id="month-view--dmenu"
                    class="day-settings dmenu" 
                    class:dmenu--light={isLight}
                    use:clickOutside on:outClick={() => optionsOpen = false} 
                >
                    <!-- month view -->
                    {#if currView === "overview" && overviewType === "monthly"}
                        <li class="dmenu__section-name">
                            Monthly View
                        </li>
                        <li class="dmenu__section">
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Show Month</span>
                                <ToggleBtn 
                                    active={overview.heading}
                                    onToggle={() => {
                                        overview.heading = !overview.heading
                                        overview = overview
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Text Block</span>
                                <ToggleBtn 
                                    active={overview.textBlock}
                                    onToggle={() => {
                                        overview.textBlock = !overview.textBlock
                                        overview = overview
                                    }}
                                />
                            </div>
                        </li>
                        <div class="dmenu__section-name" style:margin-top="4px">
                            Calendar
                        </div>
                        <li class="dmenu__section-divider"></li>
                        <li class="dmenu__section">
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Animate Photos</span>
                                <ToggleBtn 
                                    active={overview.animPhotos}
                                    onToggle={() => {
                                        overview.animPhotos = !overview.animPhotos
                                        overview = overview
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Incomplete Habits</span>
                                <ToggleBtn 
                                    active={overview.habitsMark}
                                    onToggle={() => {
                                        overview.habitsMark = !overview.habitsMark
                                        overview = overview
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Focus Time</span>
                                <ToggleBtn 
                                    active={overview.focusTime}
                                    onToggle={() => {
                                        overview.focusTime = !overview.focusTime
                                        overview = overview
                                    }}
                                />
                            </div>
                        </li>
                    {/if}
                    {#if currView === "goals"}
                        {@const viewType = goalsView.view}
                        {@const options = goalsView[viewType]}
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Goals Settings
                            </div>
                            <div style:display="flex" style:margin="5px 0px 10px 7px">
                                <button 
                                    class="dmenu__box" 
                                    class:dmenu__box--selected={viewType === "list"}
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
                                    class:dmenu__box--selected={viewType === "board"}
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
                            {#if viewType === "list"}
                            <div class="dmenu__option dmenu__option--static">
                                <span class="dmenu__option-heading">Group By</span>
                                <DropdownBtn 
                                    id={"g-group"}
                                    isActive={subMenu === "g-group"}
                                    options={{
                                        pickedOptionName: capitalize(options.grouping),
                                        onClick: () => {
                                            subMenu = subMenu === "g-group" ? null : "g-group"
                                        },
                                    }}
                                />
                            </div>
                            {/if}
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Progress</span>
                                <ToggleBtn 
                                    active={options.showProgress}
                                    onToggle={() => {
                                        goalsView[viewType].showProgress = !options.showProgress
                                        goalsView = goalsView
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-heading">Due Date</span>
                                <ToggleBtn 
                                    active={options.due}
                                    onToggle={() => {
                                        goalsView[viewType].due = !options.due
                                        goalsView = goalsView
                                    }}
                                />
                            </div>
                            {#if options.due}
                                <div class="dmenu__option dmenu__option--static">
                                    <span class="dmenu__option-heading">Due Format</span>
                                    <DropdownBtn 
                                        id={"g-due"}
                                        isActive={subMenu === "g-due"}
                                        options={{
                                            pickedOptionName: capitalize(options.dueType),
                                            onClick: () => {
                                                subMenu = subMenu === "g-due" ? null : "g-due"
                                            },
                                        }}
                                    />
                                </div>
                            {/if}
                        </li>

                        <DropdownList 
                            id="g-group"
                            isHidden={subMenu != "g-group"} 
                            options={{
                                pickedItem: capitalize(options.grouping),
                                listItems: [
                                    ...(viewType === "list" ? [{ name: "Default" }] : []),
                                    { name: "Status" }, 
                                    { name: "Tag" }
                                ],
                                position: { 
                                    top: "135px", right: "2px" 
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
                        <DropdownList 
                            id="g-due"
                            isHidden={subMenu != "g-due"} 
                            options={{
                                pickedItem: capitalize(options.dueType),
                                listItems: [
                                    { name: "Date" }, 
                                    { name: "Distance" }
                                ],
                                position: { 
                                    top: "220px", right: "2px" 
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
                                <span class="dmenu__option-heading">
                                    {months[today.getMonth()].substring(0, 3)} Metrics
                                </span>
                                <ToggleBtn 
                                    active={habitView.stats}
                                    onToggle={() => {
                                        habitView.stats = !habitView.stats
                                        habitView = habitView
                                    }}
                                />
                            </div>
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
                    {#if currView === "yr-view"}
                        <div class="dmenu__toggle-optn dmenu__option--static">
                            <span class="dmenu__option-heading">Show Year</span>
                            <ToggleBtn 
                                active={yearView.showYear}
                                onToggle={() => {
                                    yearView.showYear = !yearView.showYear
                                    yearView = yearView
                                }}
                            />
                        </div>
                        <div class="dmenu__toggle-optn dmenu__option--static">
                            <span class="dmenu__option-heading">Text Block</span>
                            <ToggleBtn 
                                active={yearView.showTextEntry}
                                onToggle={() => {
                                    yearView.showTextEntry = !yearView.showTextEntry
                                    yearView = yearView
                                }}
                            />
                        </div>
                        <div class="dmenu__toggle-optn dmenu__option--static">
                            <span class="dmenu__option-heading">Emojis as Goals</span>
                            <ToggleBtn 
                                active={yearView.emojis}
                                onToggle={() => {
                                    yearView.emojis = !yearView.emojis
                                    yearView = yearView
                                }}
                            />
                        </div>
                    {/if}
                </div>
            </BounceFade>
        </div>
        <div class="divider"></div>
        <div class="month-view__details-view">
            {#if currView === "overview"}
                <ActivityCalendar 
                    options={overview}
                    onDayClicked={(dayIdx) => {
                        overviewType = "daily"

                        activityIdx  = dayIdx
                        activity = ACTIVITY_DATA[activityIdx]
                    }} 
                />
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
                <YearView options={yearView}/>
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

            .divider {
                margin: 0px 0px 12px 0px;
            }
        }

        /* month view header */
        &__details-view {
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
            flex: 1;
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
                margin: 0px 8px;
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

    .dmenu {
        overflow: visible;
        min-width: 170px;

        &__option {
            overflow: visible;
        }
        &__option-heading {
            margin-right: 14px;
        }
        &__box {
            width: calc(50% - 7px);
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