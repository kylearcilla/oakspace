<script lang="ts">
	import { onMount } from "svelte";
	import SvgIcon from "../../../components/SVGIcon.svelte";
	import { Icon } from "../../../lib/enums";
	import { capitalize, clickOutside, getElemById, getHozDistanceBetweenTwoElems, kebabToNormal, normalToKebab } from "../../../lib/utils-general"
	import ActivityCalendar from "../../../components/ActivityCalendar.svelte"
	import WeeklyHabits from "./WeeklyHabits.svelte";
	import BounceFade from "../../../components/BounceFade.svelte";
	import ToggleBtn from "../../../components/ToggleBtn.svelte";
    import { getWeekPeriod } from "../../../lib/utils-date"
	import GoalsBoard from "./GoalsBoard.svelte";
	import GoalsList from "./GoalsList.svelte";
	import DropdownBtn from "../../../components/DropdownBtn.svelte";
	import DropdownList from "../../../components/DropdownList.svelte";
	import { themeState } from "../../../lib/store";
	import Todos from "../Todos.svelte";
	import SettingsBtn from "../../../components/SettingsBtn.svelte";

    type MonthDetailsView = "cal" | "goals" | "habits" | "tasks"
    type GoalsView = {
        view: "list" | "board"
        grouping: "status" | "tag"
        showMilestones?: boolean
        progressUi?: "bar" | "circle"
    }

    let currView: MonthDetailsView = "cal"
    let optionsOpen = false
    let weekPeriodIdx = 0
    let weekPeriod = getWeekPeriod(new Date())
    let newTaskFlag = false
    let showHeaderBtnStats = true
    
    let subMenu: "g-view" | "g-group" | "g-progress" | "h-view" | null = null
    
    $: isLight = !$themeState.isDarkTheme

    $: if (currView) {
        newTaskFlag = false
    }
    /* view options */
    let habitView = {
        view: "default",
        progress: {
            detailed: true,
            percentage: false
        }
    }
    let goalsView: GoalsView = {
        view: "list",
        grouping: "status",
        showMilestones: false,
        progressUi: "bar"
    }
    let btnHighlighter = {
        width: 0, left: 0
    }
    function onGoalSubListClicked(context: DropdownItemClickedContext) {
        const { name } = context
        const optn     = normalToKebab(name)

        if (subMenu === "g-view") {
            goalsView.view = optn as "list" | "board"
        }
        else if (subMenu === "g-group") {
            goalsView.grouping = optn as  "status" | "tag"
        }
        else if (subMenu === "g-progress") {
            goalsView.progressUi = optn as  "bar" | "circle"
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
    function onViewBtnClicked(view: MonthDetailsView) {
        currView = view
        const btnElem = getElemById(`month-view--${view}`)

        if (!btnElem) return

        const width = btnElem.clientWidth
        const left = getHozDistanceBetweenTwoElems({ 
            left:  { 
                elem: btnElem.parentElement!,
                edge: "left"
            },
            right: { 
                elem: btnElem,
                edge: "left"
            },
        })

        btnHighlighter.width = width + (view === "cal" ? 2 : 5)
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
    <!-- <div class="month-view__insights"></div> -->
    <!-- <div class="insight-sentence">
        You have completed <strong>60%</strong> of your habits this month with <strong>2</strong> of your <strong>8</strong> monthly goals achieved.
    </div> -->
    <div class="month-view__details">
        <div class="month-view__details-header">
            <div class="month-view__header-btns">
                <button 
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "cal"}
                    on:click={() => onViewBtnClicked("cal")}
                >
                    <span>Overview</span>
                </button>
                <button 
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "habits"}
                    on:click={() => onViewBtnClicked("habits")}
                >
                    <span>Habits</span> 
                    {#if showHeaderBtnStats}
                        <div class="month-view__header-btn-stat">
                            75%
                        </div>
                    {/if}
                </button>
                <button 
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "goals"}
                    on:click={() => onViewBtnClicked("goals")}
                >
                    <span>Goals</span> 
                    {#if showHeaderBtnStats}
                        <div class="month-view__header-btn-stat fraction">
                            1<div class="fraction__slash">/</div>8
                        </div>
                    {/if}
                </button>
                <button 
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "tasks"}
                    on:click={() => onViewBtnClicked("tasks")}
                >
                    <span>Inbox</span> 
                    {#if showHeaderBtnStats}
                        <div class="month-view__header-btn-stat fraction">
                            7<div class="fraction__slash">/</div>12
                        </div>
                    {/if}
                </button>
            </div>
            <div class="month-view__details-header-right">
                <div class="month-view__settings">
                    <div class="month-view__period">
                        {#if currView === "habits"}
                            {#if weekPeriodIdx === 0}
                                This Week
                            {:else}
                                {weekPeriod.start} <span>-</span> {weekPeriod.end}
                            {/if}
                        {/if}
                    </div>
                    <div class="flx" style:margin-right="6px">
                        <button 
                            class="month-view__arrow"
                            style:margin-left={"18px"}
                        >
                            <div style:margin-left={"-2px"}>
                                <SvgIcon
                                    icon={Icon.ChevronLeft}
                                    options={{
                                        scale: 1.8, height: 12, width: 12, strokeWidth: 1.4
                                    }}
                                />
                            </div>
                        </button>
                        <button 
                            class="month-view__arrow"
                        >
                            <div style:margin-right={"-2px"}>
                                <SvgIcon 
                                    icon={Icon.ChevronRight}
                                    options={{
                                        scale: 1.8, height: 12, width: 12, strokeWidth: 1.4
                                    }}
                                />
                            </div>
                        </button>
                    </div>
                    {#if currView === "tasks"}
                        <button 
                            title="Create new task"
                            id="month-view--dbtn"
                            class="month-view__todo-settings-btn"
                            on:click={() => newTaskFlag = !newTaskFlag}
                        >
                            <SvgIcon 
                                icon={Icon.Add} 
                                options={{ 
                                    strokeWidth: 1.9,
                                    scale: 1.09
                                }} 
                            />
                        </button>
                        <button
                            title="Clear completed tasks"
                            id="month-view--dbtn"
                            class="month-view__todo-settings-btn"
                            disabled={true}
                            on:click={() => optionsOpen = !optionsOpen}
                        >
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    {/if}
                    <div class="month-view__settings-btn" style:margin-left="9px">
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
                    style:width={currView === "goals" ? "190px" : "200px"}
                    use:clickOutside on:click_outside={() => optionsOpen = false} 
                >
                    <li class="dmenu__section">
                        <div class="dmenu__section-name">
                            General
                        </div>
                        <div class="dmenu__toggle-optn  dmenu__option--static">
                            <span class="dmenu__option-heading">Show Header Stats</span>
                            <ToggleBtn 
                                active={showHeaderBtnStats}
                                onToggle={() => {
                                    showHeaderBtnStats = !showHeaderBtnStats
                                }}
                            />
                        </div>
                    </li>
                    <li class="dmenu__section-divider"></li>
                    {#if currView === "goals"}
                        {@const board = goalsView.view === "board"}
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Goals Settings
                            </div>
                            <div class="dmenu__option dmenu__option--static">
                                <span class="dmenu__option-heading">View</span>
                                <DropdownBtn 
                                    id={"g-view"}
                                    isActive={subMenu === "g-view"}
                                    options={{
                                        pickedOptionName: capitalize(goalsView.view),
                                        onClick: () => { 
                                            subMenu = subMenu === "g-view" ? null : "g-view"
                                        },
                                    }}
                                />
                            </div>
                            <div class="dmenu__option dmenu__option--static">
                                <span class="dmenu__option-heading">Group By</span>
                                <DropdownBtn 
                                    id={"g-group"}
                                    isActive={subMenu === "g-group"}
                                    options={{
                                        pickedOptionName: capitalize(goalsView.grouping),
                                        onClick: () => {
                                            subMenu = subMenu === "g-group" ? null : "g-group"
                                        },
                                    }}
                                />
                            </div>
                            <div class="dmenu__option dmenu__option--static" class:hidden={board}>
                                <span class="dmenu__option-heading">Progress</span>
                                <DropdownBtn 
                                    id={"g-progress"}
                                    isActive={subMenu === "g-progress"}
                                    options={{
                                        pickedOptionName: capitalize(goalsView.progressUi),
                                        onClick: () => {
                                            subMenu = subMenu === "g-progress" ? null : "g-progress"
                                        },
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn" class:hidden={board}>
                                <span class="dmenu__option-heading">Show Milestones</span>
                                <ToggleBtn 
                                    active={goalsView.showMilestones}
                                    onToggle={() => {
                                        goalsView.showMilestones = !goalsView.showMilestones
                                        goalsView = goalsView
                                    }}
                                />
                            </div>
                            <DropdownList 
                                id="g-view"
                                isHidden={subMenu != "g-view"} 
                                options={{
                                    pickedItem: capitalize(goalsView.view),
                                    listItems: [
                                        { name: "List" }, { name: "Board" }
                                    ],
                                    position: { 
                                        top: "56px", right: "2px" 
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
                                id="g-group"
                                isHidden={subMenu != "g-group"} 
                                options={{
                                    pickedItem: capitalize(goalsView.grouping),
                                    listItems: [
                                        { name: "Status" }, { name: "Tag" }
                                    ],
                                    position: { 
                                        top: "85px", right: "2px" 
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
                                id="g-progress"
                                isHidden={subMenu != "g-progress"} 
                                options={{
                                    pickedItem: capitalize(goalsView.progressUi),
                                    listItems: [
                                        { name: "Bar" }, { name: "Circle" }
                                    ],
                                    position: { 
                                        top: "114px", right: "2px" 
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
                        </li>
                        <li class="dmenu__section-divider"></li>
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Progress
                            </div>
                            <div class="dmenu__toggle-optn  dmenu__option--static">
                                <span class="dmenu__option-heading">Group By</span>
                                <ToggleBtn 
                                    active={habitView.progress.detailed}
                                    onToggle={() => {
                                        habitView.progress.detailed = !habitView.progress.detailed
                                        habitView = habitView
                                    }}
                                />
                            </div>
                            {#if habitView.progress.detailed}
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
            {#if currView === "cal"}
                <ActivityCalendar />
            {:else if currView === "habits"}
                <WeeklyHabits options={habitView} />
                <!-- <MonthlyHabits /> -->
            {:else if currView === "goals"}
                {#if goalsView.view === "list"}
                    <GoalsList 
                        options={{ 
                            grouping: goalsView.grouping,
                            showMilestones: goalsView.showMilestones,
                            progressUi: goalsView.progressUi
                        }} 
                    />
                {:else}
                    <GoalsBoard 
                        options={{ 
                            grouping: goalsView.grouping 
                        }} 
                    />
                {/if}
            {:else}
                <div class="month-view__tasks">
                    <Todos {newTaskFlag}/>
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../scss/dropdown.scss";

    .month-view {
        &--light &__heading {
            font-weight: 500;
        }
        &--light &__header-btn {
            @include text-style(0.5, 500);
            background-color: var(--lightColor2);
            
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
        &--tasks &__details .divider {
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
            margin: 6px 0px 0px 0px;
            padding: 0px 0px 4px 0px;
            position: relative;

            .divider {
                margin: 0px 0px 12px 0px;
            }
        }

        /* month view header */
        &__details-view {
            overflow-x: scroll;
            overflow-y: hidden;
            margin: 0px 0px 0px -35px;
            padding-left: 35px;
        }
        &__details-header {
            position: relative;
            margin-bottom: -px;
            @include flex(center, space-between);
        }
        &__details-header-right {
            margin-top: 14px;
            @include flex(center);
        }
        &__header-btns {
            margin: 0px 10px 0px 0px;
            @include flex(center);
        }
        &__header-btn {
            padding: 5px 15px 7px 15px;
            border-radius: 29px;
            margin-right: 6px;
            background-color: var(--lightColor2);
            white-space: nowrap;
            @include flex(center);
            transition: 0.1s ease-in-out;

            &:active {
                transition: 0.2s cubic-bezier(.4, 0, .2, 1) !important;
            }
            &:hover {
                // transition: 0s;
                background-color: rgba(var(--textColor1), 0.05);
            }
            &--chosen {
                background-color: rgba(var(--textColor1), 0.05);
                box-shadow: rgba(var(--textColor1), 0.09) 0px 0px 0px 1.5px inset, 
                            rgba(var(--textColor1), 0.06) 0px 0px 0px 3px;
            }
            span {
                @include text-style(0.9, 500, 1.48rem);
                margin-right: 3px;
            }
        }
        &__header-btn-stat {
            @include text-style(0.3, 400, 1.4rem, "DM Sans");
            margin-left: 8px;
        }
        &__arrow {
            opacity: 0.2;
            margin-left: 20px;
            height: 29px;
            width: 29px;
            border-radius: 20px;
            
            &:first-child {
                margin-left: 20px;
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.06);
                opacity: 0.45;
            }
        }
        &__period {
            @include text-style(0.4, 400, 1.4em, "DM Mono");
            // display: none;
            margin-right: 0px;

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

        /* tasks */
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
        &__tasks {
            margin: -5px 0px 0px -12px;
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
    }

    .insight-sentence {
        margin: 15px 0px 22px 0px;
        @include text-style(0.3, 400, 1.4rem);
        
        strong {
            @include text-style(0.65, 400, 1.4rem, "DM Sans");
            margin: 0px 2px 2px 2px;
        }
    }
</style>