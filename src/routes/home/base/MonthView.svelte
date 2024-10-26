<script lang="ts">
	import { onMount } from "svelte";
	import SvgIcon from "../../../components/SVGIcon.svelte";
	import { Icon } from "../../../lib/enums";
	import { capitalize, clickOutside, getElemById, getHozDistanceBetweenTwoElems } from "../../../lib/utils-general"
	import ActivityCalendar from "../../../components/ActivityCalendar.svelte"
	import WeeklyHabits from "./WeeklyHabits.svelte";
	import BounceFade from "../../../components/BounceFade.svelte";
	import ToggleBtn from "../../../components/ToggleBtn.svelte";
    import { getWeekPeriod } from "../../../lib/utils-date"
	import YoutubeView from "../YoutubeView.svelte";
	import GoalsBoard from "./GoalsBoard.svelte";
	import GoalsList from "./GoalsList.svelte";
	import DropdownBtn from "../../../components/DropdownBtn.svelte";
	import DropdownList from "../../../components/DropdownList.svelte";

    type MonthDetailsView = "cal" | "goals" | "habits" | "video"

    let currView: MonthDetailsView = "goals"
    let optionsOpen = false

    let weekPeriodIdx = 0
    let weekPeriod = getWeekPeriod(new Date())

    let subMenu: "g-view" | "g-group" | null = null

    /* view options */
    let habitView = {
        view: "time-of-day",
        progress: {
            detailed: true,
            percentage: false
        }
    }
    let goalsView = {
        view: "list",
        grouping: "status"
    }

    let btnHighlighter = {
        width: 0, left: 0
    }
    function onGoalSubListClicked(context: DropdownItemClickedContext) {
        const { name } = context
        const optn     = name.toLowerCase()

        if (subMenu === "g-view") {
            goalsView.view = optn
        }
        else if (subMenu === "g-group") {
            goalsView.grouping = optn
        }
        if (subMenu.startsWith("g-")) {
            goalsView = goalsView
        }

        subMenu = null
        optionsOpen = false
    }
    function onViewBtnClicked(view: MonthDetailsView) {
        currView = view
        const btnElem = getElemById(`month-view--${view}`)!
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


<div class="month-view">
    <div class="month-view__heading">
        September
    </div>
    <div class="month-view__insights">
        <div class="insight-sentence">
            You have completed <strong>60%</strong> of your habits this month with <strong>2</strong> of your <strong>8</strong> monthly goals achieved.
        </div>
    </div>
    <div class="month-view__details">
        <div class="month-view__details-header">
            <div class="month-view__btns">
                <button 
                    id="month-view--cal"
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "cal"}
                    on:click={() => onViewBtnClicked("cal")}
                >
                    <span>Overview</span>
                </button>
                <button 
                    id="month-view--habits"
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "habits"}
                    class:month-view__header-btn--indicator={false}
                    title="You have some incomplete habits!"
                    on:click={() => onViewBtnClicked("habits")}
                >
                    <span>Habits</span>
                    <!-- <div class="month-view__header-btn-subtxt">
                        60%
                    </div> -->
                </button>
                <button 
                    id="month-view--goals"
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "goals"}
                    class:month-view__header-btn--indicator={false}
                    title="You have some goals due today!"
                    on:click={() => onViewBtnClicked("goals")}
                >
                    <span>Goals</span>
                    <!-- <div class="month-view__header-btn-subtxt">
                        12%
                    </div> -->
                </button>
                <!-- <button 
                    id="month-view--video"
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "video"}
                    title="Play embed Youtube videos."
                    on:click={() => onViewBtnClicked("video")}
                >
                    <span>Youtube</span>
                </button> -->
            </div>
            <div class="month-view__settings">
                {#if currView === "habits"}
                    <div class="month-view__week">
                        {#if weekPeriodIdx === 0}
                            This Week
                        {:else}
                            {weekPeriod.start} <span>-</span> {weekPeriod.end}
                        {/if}
                    </div>
                {/if}
                <button 
                    class="month-view__arrow"
                    style:margin-left={"18px"}
                >
                    <SvgIcon 
                        icon={Icon.ChevronLeft}
                        options={{
                            scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                        }}
                    />
                </button>
                <button 
                    class="month-view__arrow"
                >
                    <SvgIcon 
                        icon={Icon.ChevronRight}
                        options={{
                            scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                        }}
                    />
                </button>
                <button 
                    id="month-view--dropdown-btn"
                    class="month-view__settings-btn"
                    on:click={() => optionsOpen = !optionsOpen}
                >
                    <SvgIcon icon={Icon.Settings} options={{ scale: 1.1 }}/>
                </button>
            </div>
            <div 
                class="month-view__details-header-highlight smooth-bounce"
                style:left={`${btnHighlighter.left}px`}
                style:width={`${btnHighlighter.width}px`}
            >
            </div>
        </div>
        <div class="divider"></div>
        <div class="month-view__details-view">
            {#if currView === "cal"}
                <ActivityCalendar />
            {:else if currView === "habits"}
                <WeeklyHabits options={habitView} />
            {:else if currView === "goals"}
                {#if goalsView.view === "list"}
                    <GoalsList options={{ grouping: goalsView.grouping }} />
                {:else}
                    <GoalsBoard />
                {/if}
            {:else}
                <YoutubeView />
            {/if}
        </div>

        <!-- habit view settings -->
        <BounceFade 
            isHidden={!optionsOpen}
            zIndex={200}
            position={{ 
                top: "25px", right: "0px"
            }}
        >
            <div 
                id="month-view--dropdown-menu"
                class="day-settings dropdown-menu" 
                use:clickOutside on:click_outside={() => optionsOpen = false} 
            >
                {#if currView === "goals"}
                    <li class="dropdown-menu__section">
                        <div class="dropdown-menu__section-name">
                            Goals View
                        </div>
                        <div class="dropdown-menu__option dropdown-menu__option--static">
                            <span class="dropdown-menu__option-heading">View</span>
                            <DropdownBtn 
                                id={"goals-view"}
                                options={{
                                    pickedOptionName: capitalize(goalsView.view),
                                    onClick: () => { 
                                        subMenu = subMenu === "g-view" ? null : "g-view"
                                    },
                                }}
                            />
                        </div>
                        <div 
                            class="dropdown-menu__option dropdown-menu__option--static"
                            class:hidden={goalsView.view != "list"}
                        >
                            <span class="dropdown-menu__option-heading">Group By</span>
                            <DropdownBtn 
                                id={"goals-group"}
                                options={{
                                    pickedOptionName: capitalize(goalsView.grouping),
                                    onClick: () => {
                                        subMenu = subMenu === "g-group" ? null : "g-group"
                                    },
                                }}
                            />
                        </div>
                        <DropdownList 
                            id="goals-view"
                            isHidden={subMenu != "g-view"} 
                            options={{
                                pickedItem: capitalize(goalsView.view),
                                listItems: [
                                    { name: "List" }, { name: "Board" }
                                ],
                                position: { 
                                    top: "52px", right: "0px" 
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
                            id="goals-group"
                            isHidden={subMenu != "g-group"} 
                            options={{
                                pickedItem: capitalize(goalsView.grouping),
                                listItems: [
                                    { name: "Status" }, { name: "Tag" }
                                ],
                                position: { 
                                    top: "80px", right: "0px" 
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
                    <li class="dropdown-menu__section">
                        <div class="dropdown-menu__section-name">
                            Grouping
                        </div>
                        <div 
                            class="dropdown-menu__option"
                            class:dropdown-menu__option--selected={habitView.view === "default"}
                        >
                            <button 
                                class="dropdown-menu__option-btn"
                                on:click={() => {
                                    habitView.view = "default"
                                    habitView = habitView
                                    optionsOpen = false
                                }}
                            >
                                <span class="dropdown-menu__option-text">
                                    Default
                                </span>
                                <div class="dropdown-menu__option-right-icon-container">
                                    <div 
                                        class="dropdown-menu__option-icon"
                                        class:dropdown-menu__option-icon--check={true}
                                    >
                                        <i class="fa-solid fa-check"></i> 
                                    </div>
                                </div>
                            </button>
                        </div>
                        <div 
                            class="dropdown-menu__option"
                            class:dropdown-menu__option--selected={habitView.view === "time-of-day"}
                        >
                            <button 
                                class="dropdown-menu__option-btn"
                                on:click={() => {
                                    habitView.view = "time-of-day"
                                    habitView = habitView
                                    optionsOpen = false
                                }}
                            >
                                <span class="dropdown-menu__option-text">
                                    Time of Day
                                </span>
                                <div class="dropdown-menu__option-right-icon-container">
                                    <div 
                                        class="dropdown-menu__option-icon"
                                        class:dropdown-menu__option-icon--check={true}
                                    >
                                        <i class="fa-solid fa-check"></i> 
                                    </div>
                                </div>
                            </button>
                        </div>
                    </li>
                    <li class="dropdown-menu__section-divider"></li>
                    <li class="dropdown-menu__section">
                        <div class="dropdown-menu__section-name">
                            Progress
                        </div>
                        <div class="dropdown-menu__toggle-optn">
                            <span class="dropdown-menu__option-text">
                                Detailed
                            </span>
                            <ToggleBtn 
                                active={habitView.progress.detailed}
                                onToggle={() => {
                                    habitView.progress.detailed = !habitView.progress.detailed
                                    habitView = habitView
                                }}
                            />
                        </div>
                        {#if habitView.progress.detailed}
                            <div class="dropdown-menu__toggle-optn">
                                <span class="dropdown-menu__option-text">
                                    Percentage
                                </span>
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
</div>

<style lang="scss">
    @import "../../../scss/dropdown.scss";

    .month-view {
        .divider {
            background-color: rgba(var(--textColor1), 0.035);
            height: 1px;
            width: 100%;
            margin: 1px 0px 0px 0px;
        }

        /* view options */
        &__details {
            padding: 0px 0px 4px 0px;
            margin: 24px 0px 0px 0px;
            position: relative;
        }
        &__details-view {
            overflow-x: scroll;
            overflow-y: hidden;
            margin-left: -30px;
            padding-left: 30px;
        }
        &__details-header {
            @include flex(center, space-between);
            position: relative;
            margin-bottom: 6px;
        }
        &__btns {
            display: flex;
            margin-bottom: 0px;
            position: relative;
        }
        &__settings {
            @include flex(center);
        }
        &__heading {
            @include text-style(1, 500, 2.125rem);
            margin: -2.5px 0px 8px 0px;
        }
        &__week {
            @include text-style(0.4, 400, 1.2rem, "DM Mono");

            span {
                margin: 0px 5px;
            }
        }
        &__header-btn {
            @include text-style(1, 500, 1.44rem);
            margin: 0px 24px 0px 0px;
            display: flex;
            position: relative;

            &--indicator {
                margin-left: 18px;
            }
            &--indicator::before {
                display: block !important;
            }
            &:active {
                transform: scale(0.995);
            }
            &:hover * {
                opacity: 0.55;
            }
            &::before {
                content: " ";
                display: none;
                background-color: #FDD97D;
                @include abs-top-left(7px, -13px);
                @include circle(4px);
            }
            &--chosen * {
                opacity: 1 !important; 
            }
            span {
                opacity: 0.3;
            }
        }
        &__header-btn-subtxt {
            @include text-style(0.5, 400, 1.35rem, "DM Mono");
            background-color: rgba(var(--textColor1), 0);
            margin: 1px -8px 0px 5px;
            padding: 0px 9px 7px 6px;
            border-radius: 6px;
            opacity: 0.3;
        }
        &__details-header-highlight {
            position: absolute;
            bottom: -7px;
            height: 1.5px;
            background-color: rgba(var(--textColor1), 0.95);
        }
        &__arrow {
            opacity: 0.2;
            margin-left: 25px;
            padding: 1px 6px 1px 6px;
            height: 20px;
            border-radius: 5px;
            
            &:first-child {
                margin-left: 20px;
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.1);
                opacity: 0.45;
            }
        }
        &__settings-btn {
            @include center;
            @include circle(25px);
            opacity: 0.2;
            margin-left: 14px;
            
            &:hover {
                background-color: rgba(var(--textColor1), 0.1);
                opacity: 0.35;
            }
        }
    }

    .dropdown-menu {
        width: 160px;
        border: 1px solid rgba(white, 0.02);
        overflow: visible;

        &__option {
            overflow: visible;
        }
        &__option-text {
            @include text-style(0.78, 500, 1.2rem);
        }
        &__option-heading {
            @include text-style(0.6, 500, 1.2rem);
        }
        &__toggle-optn {
            padding: 6px 7px 7px 7px;
            width: 100%;
            @include flex(center, space-between);

            span {
                opacity: 0.65;
            }
        }
        &__section-name {
            margin-bottom: 2px;
        }
        &__section-divider:last-child {
            display: none;
        }
    }

    .insight-sentence {
        @include text-style(0.3, 400, 1.4rem);
        
        strong {
            @include text-style(0.65, 400, 1.4rem, "DM Mono");
            margin: 0px 2px 2px 2px;
        }
    }
</style>