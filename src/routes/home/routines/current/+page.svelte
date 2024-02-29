<script lang="ts">
	import { HrsMinsFormatOption, Icon, RoutineActivityType } from "$lib/enums";
	import { RoutinesManager } from "$lib/routines-manager";
	import { themeState } from "$lib/store";
	import { daysOfWeek, getTimeFromIdx, minsToHHMM } from "$lib/utils-date";
	import { COLOR_SWATCHES, TEST_TAGS, clickOutside, getColorPair } from "$lib/utils-general";
	import { onMount } from "svelte";
    import type { PageData } from "../$types";
    import SVGIcon from "../../../../components/SVGIcon.svelte"

    export let data: PageData;

    const daysData: DayBlocks = {
        Mon: [
            {
                title: "💩 Shit",
                color: COLOR_SWATCHES.d[0],
                startTime: 0,
                endTime: 100,
                activity: null
            },
            {
                title: "💩 Shit",
                color: COLOR_SWATCHES.d[0],
                startTime: 100,
                endTime: 120,
                activity: null
            },
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working"
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working"
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body"
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare"
            },
        ],
        Tue: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working"
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working"
            },
            {
                title: "💪 Gym (Push)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body"
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare"
            },
        ],
        Wed: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working"
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working"
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare"
            },
        ],
        Thu: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working"
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working"
            },
            {
                title: "💪 Gym (Legs)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body"
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare"
            },
        ],
        Fri: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working"
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working"
            },
            {
                title: "🏃‍♂️ Cardio",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body"
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare"
            },
        ],
        Sat: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 480,
                endTime: 540,
                activity: null
            },
            {
                title: "🚴‍♂️ Biking",
                color: COLOR_SWATCHES.d[1],
                startTime: 630,
                endTime: 720,
                activity: "working"
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 800,
                endTime: 830,
                activity: null
            },
            {
                title: "💤 Nap Time",
                color: COLOR_SWATCHES.d[1],
                startTime: 840,
                endTime: 900,
                activity: "sleeping"
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare"
            },
        ],
        Sun: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 480,
                endTime: 540,
                activity: null
            },
            {
                title: "🚴‍♂️ Biking",
                color: COLOR_SWATCHES.d[1],
                startTime: 630,
                endTime: 720,
                activity: "working"
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 800,
                endTime: 830,
                activity: null
            },
            {
                title: "💤 Nap Time",
                color: COLOR_SWATCHES.d[1],
                startTime: 840,
                endTime: 900,
                activity: "sleeping"
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare"
            },
        ]
    }

    const MIN_THRESHOLD = 640

    let containerWidth = 0
    let manager = new RoutinesManager(daysData)
    let scrollableContainer: HTMLElement
    let scrollableContent: HTMLElement
    let hourBlocksElem: HTMLElement
    let weekDaysElem: HTMLElement

    let _dayBlockElems = manager.dayBlockElems
    let _currCores = manager.currCores
    let coreProp: keyof typeof currCores.sleeping = "avgTime"
    let isBreakdownDropdownOpen = false
    
    let isViewingCoreAvg = true
    let selectedTimeFrame = "Weekly"

    $: dayBlockElems = $_dayBlockElems ?? []
    $: currCores     = $_currCores ?? []
    $: isLightTheme  = !$themeState.isDarkTheme

    $: coreProp = isViewingCoreAvg ? "avgTime" : "totalTime"

    function onViewOptionClicked(option: string) {
        if (option === selectedTimeFrame) return

        if (option === "Weekly") {
            isViewingCoreAvg = true
        }
        else {
            isViewingCoreAvg = false
        }

        manager.setBreakdownData(option)
        selectedTimeFrame = option
        isBreakdownDropdownOpen = false
    }
    function getBlockStyling(height: number) {
        const classes: string[] = []

        if (height < 12) {
            classes.push("week-view__time-block--xsm")
        }
        if (height < 20) {
            classes.push("week-view__time-block--sm")
        }
        if (height < 34) {
            classes.push("week-view__time-block--md")
        }
        return classes.join(" ")
    }
    function onBoardScroll(e: Event) {
        const target = e.target as HTMLElement

        hourBlocksElem.scrollTop = target.scrollTop
        hourBlocksElem.style.overflow = "scroll"

        // keep then in sync
        if (hourBlocksElem.scrollTop != target.scrollTop) {
            target.scrollTop = hourBlocksElem.scrollTop
        }

        weekDaysElem.scrollLeft = target.scrollLeft
        weekDaysElem.style.overflow = "scroll"
    }
    function onWeekDaysHover() {
        weekDaysElem.style.overflow = "hidden"
    }
    function onHourBlocksHover() {
        hourBlocksElem.style.overflow = "hidden"
    }
    
    onMount(() => {
        requestAnimationFrame(() => { 
            manager.init(scrollableContainer) 
            
            if (manager.earliestBlockHeadPos != Infinity) {
                scrollableContainer.scrollTop += Math.max(manager.earliestBlockHeadPos - 20, 0)
            }
        })
    })
</script>

<div 
    class="routine" 
    class:routine--light={isLightTheme} 
    class:routine--dark={!isLightTheme} 
    class:routine--narrow={containerWidth < MIN_THRESHOLD} 
    bind:clientWidth={containerWidth}
>
    <!-- Routine Details -->
    <div class="routine__details-container">
        <div class="routine__details">
            <h2>Routine 2.0</h2>
            <p>Regular work week routine with a light weekend.</p>
        </div>
        <!-- Breakdown -->
        <div class="routine__breakdown">
            <div class="routine__breakdown-header">
                <button 
                    class="routine__breakdown-dropdown-btn dropdown-btn"
                    class:dropdown-btn--active={isBreakdownDropdownOpen}
                    on:click={() => isBreakdownDropdownOpen = !isBreakdownDropdownOpen}
                >
                    <span class="routine__breakdown-dropdown-btn-title dropdown-btn__title">
                        {selectedTimeFrame}
                    </span>
                    <div class="routine__breakdown-dropdown-btn-icon dropdown-btn__icon--arrow">
                        <SVGIcon icon={Icon.Dropdown}/>
                    </div>
                </button>
                <div class="routine__breakdown-options">
                    <button 
                        class="routine__breakdown-options-btn" 
                        class:hidden={selectedTimeFrame != "Weekly"}
                        class:full-opacity={isViewingCoreAvg}
                        on:click={() => isViewingCoreAvg = true}
                    >
                        Avg
                    </button>
                    <button 
                        class="routine__breakdown-options-btn" 
                        class:full-opacity={!isViewingCoreAvg}
                        on:click={() => isViewingCoreAvg = false}
                    >
                        Total
                    </button>
                </div>
                <ul 
                    use:clickOutside on:click_outside={() => isBreakdownDropdownOpen = false} 
                    class="routine__breakdown-options-menu dropdown-menu"
                    class:dropdown-menu--hidden={!isBreakdownDropdownOpen}
                >
                    {#each ["Weekly", ...daysOfWeek] as timeFrame}    
                        <li 
                            class="dropdown-menu__option" 
                            class:dropdown-menu__option--selected={selectedTimeFrame === timeFrame}
                        >
                            <button class="dropdown-element" on:click={() => onViewOptionClicked(timeFrame)}>
                                <span class="dropdown-menu__option-text">
                                    {timeFrame}
                                </span>
                                <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                    <i class="fa-solid fa-check"></i>
                                </div>
                            </button>
                        </li>
                    {/each}
                </ul>
            </div>
            <!-- Cores -->
            <div class="routine__core-breakdown">
                <h3>Cores</h3>
                <div class="routine__cores">
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Sleeping</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.sleeping[coreProp], HrsMinsFormatOption.MIN_LETTERS)}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Awake</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.awake[coreProp], HrsMinsFormatOption.MIN_LETTERS)}
                            </div>
                        </div>
                    </div>
                    <div class="routine__cores-col-divider"></div>
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Working</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.working[coreProp], HrsMinsFormatOption.MIN_LETTERS)}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Self-Care</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.selfCare[coreProp], HrsMinsFormatOption.MIN_LETTERS)}
                            </div>
                        </div>
                    </div>
                    <div class="routine__cores-col-divider"></div>
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Mind</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.mind[coreProp], HrsMinsFormatOption.MIN_LETTERS)}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Body</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.body[coreProp], HrsMinsFormatOption.MIN_LETTERS)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Tag Breakdown -->
            <div class="routine__tag-breakdown">
                <h3>Tags</h3>
                {#each TEST_TAGS.slice(0, 4) as tag}
                    <div class="routine__tag">
                        <div class="flx flx--algn-center">
                            <div 
                                class="routine__tag-symbol"
                                style:background-color={`rgb(${tag.symbol.color.primary})`}
                            >
                                {tag.symbol.emoji}
                            </div>
                            <div class="routine__tag-title">
                                {tag.name}
                            </div>
                        </div>
                        <div class="routine__tag-stat">1h 3m</div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
    <!-- Week View -->
    <div class="routine__week">
        <div class="week-view">
            <!-- Days of Week -->
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <div 
                class="week-view__days-container scroll-bar-hidden"
                bind:this={weekDaysElem}
                on:mouseover={onWeekDaysHover}
            >
                <div class="week-view__days">
                    {#each daysOfWeek as day}
                        <div class="week-view__days-day">
                            <div class="week-view__days-day-header">
                                <h4>{day}s</h4>
                            </div>
                            <div class="week-view__days-day-divider"></div>
                        </div>
                    {/each}
                </div>
            </div>
            <!-- Time Blocks -->
            <div 
                class="week-view__scrollable scroll-bar-hidden" 
                bind:this={scrollableContainer}
                on:scroll={onBoardScroll}
            >
                <div 
                    class="week-view__scrollable-content" 
                    bind:this={scrollableContent}
                >
                    <div class="week-view__time-blocks">
                        {#each manager.days as day}
                            {#each dayBlockElems[day] as block (block.id)}
                                {@const colorTrio = getColorPair(block.color, isLightTheme)}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <div 
                                    class={`week-view__time-block ${getBlockStyling(block.height)}`}
                                    style:top={block.yOffset}
                                    style:left={block.xOffset}
                                    style:--block-height={`${block.height}px`}
                                    style:--block-color-1={colorTrio[0]}
                                    style:--block-color-2={colorTrio[1]}
                                    style:--block-color-3={colorTrio[2]}
                                    title={`${block.title} \n${block.startTimeStr} - ${block.endTimeStr}`}
                                    on:click={
                                        (e) => manager.onBlockPointerDown(e, block.id)
                                    }
                                >
                                    <div class="week-view__time-block-content">
                                        <div class="flx flx--algn-center">
                                            <span class="week-view__time-block-title">
                                                {block.title}
                                            </span>
                                        </div>
                                        <div class="week-view__time-block-time-period">
                                            <span>{block.startTimeStr}</span>
                                            <span>-</span>
                                            <span>{block.endTimeStr}</span>
                                        </div>
                                    </div>
                                    <div class="week-view__time-block-spine"></div>
                                </div>
                            {/each}
                        {/each}
                    </div>
                    <div class="week-view__hoz-lines-container">
                        <div class="week-view__hoz-lines">
                            {#if scrollableContent}
                                {@const width = scrollableContent.scrollWidth}
                                {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                                    {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                                    {@const height = (60 / 1440) * 100}
                                    <div 
                                        class="week-view__hoz-line"
                                        style:top={`calc(${headOffsetPerc}% + 5px)`}
                                        style:height={`${height}%`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width={width} height="2" viewBox={`0 0 ${width} 2`} fill="none">
                                            <path d={`M0 1H ${width}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                        </svg>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
            <!-- Hour Blocks -->
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <div 
                class="week-view__hour-blocks-container scroll-bar-hidden" 
                bind:this={hourBlocksElem} on:mouseover={onHourBlocksHover}
            >
                <div class="week-view__hour-blocks">
                    {#if containerWidth > 0}
                        {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                            {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                            {@const height = (60 / 1440) * 100}
                            <div 
                                class="week-view__hour-block"
                                style:top={`calc(${headOffsetPerc}% - 0px)`}
                                style:height={`${height}%`}
                            >
                                <span>{getTimeFromIdx(timeIdx)}</span>
                                <div class="week-view__hour-block-vert-divider">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2" height=28 viewBox={`0 0 2 28`} fill="none">
                                        <path d="M1.25684 0.614746V 32.5" stroke-width="0.9" stroke-dasharray="2 2"/>
                                    </svg>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../../scss/dropdown.scss";

    .routine {
        height: 100%;
        display: flex;

        &--narrow {
            display: block;
        }
        &--narrow &__details-container {
            width: 100%;
            margin-bottom: 30px;
        }
        &--narrow &__details h2 {
            margin-bottom: 0px;
        }
        &--narrow &__core-breakdown {
            width: 100%;
            margin: 22px 0px 0px 0px;
        }
        &--narrow &__breakdown {
            width: 100%;
        }
        &--narrow &__cores {
            @include flex(center);
            width: 100%;

            &-col {
                width: 30%;
                align-items: center;
            }
            &-col-divider {
                @include divider(rgba(white, 0.06), 38px, 1px);
                margin: -10px 5% 0px 5%;
            }
        }
        &--narrow &__week {
            margin-top: 20px;
            height: calc(100% - 320px);
            width: 100%;
        }
        &--narrow &__tag-breakdown {
            display: none;
        }
        &--narrow .week-view__days-container {
            width: calc(100% - 0px);
            margin-left: 0px;
        }
        &--narrow .week-view__hour-blocks-container {
            margin-left: -10px;
        }
        &--narrow .week-view__time-blocks {
            margin-left: 0px;
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &__details-container {
            width: 280px;
        }
        &__details {
            max-width: 80%;
            margin-bottom: 30px;
            h2 {
                @include text-style(1, 400, 2rem, "DM Mono");
                margin-bottom: 13px;
            }
            p {
                margin-top: 6px;
                @include text-style(0.5, 200, 1.4rem);
            }
        }
        /* Breakdown */
        &__breakdown {
            width: 80%;

            h3 {
                margin-bottom: 14px;
                @include text-style(0.95, 400, 1.4rem);
            }

            &-header {
                @include flex(center, space-between);
                margin-bottom: 14px;
                position: relative;
            }
            &-options {
                @include flex(center);
            }
            &-options-menu {
                @include pos-abs-top-left-corner(30px, -10px);
            }
            &-options-btn {
                opacity: 0.4;
                @include text-style(_, 300, 1.35rem);

                &:hover {
                    opacity: 1;
                }
                &:first-child {
                    margin-right: 12px;
                }
            }
        }
        &__breakdown-dropdown-btn {
            padding: 3.5px 12px;
            margin-left: -10px;
            @include text-color(0.03, "background");
            
            &:hover {
                @include text-color(0.06, "background");
            }
            &-title {
                @include text-style(1, 300, 1.35rem);
            }
            &-icon {
                // margin-left: 12px;
            }
        }
        /* Core Breakdown */
        &__core-breakdown {
            margin-bottom: 30px;
        }
        &__cores {
            @include text-style(0.4, 400, 1.3rem);
            width: 100%;

            &-value {
                @include text-style(0.25, 300, _, "DM Sans");
            }
        }
        &__cores-col {
            position: relative;
        }
        &__cores-col-divider {
            @include divider(rgba(white, 0.06), 0.5px, 100%);
            width: 100%;
            margin: 11px 0px;
        }
        &__cores-core {
            @include flex(center, space-between);
            margin-bottom: 10px;
        }
        /* Tag Breakdown */
        &__tag-breakdown {

        }
        &__tag {
            @include flex(center, space-between);
            margin-bottom: 10px;
        }
        &__tag-symbol {
            font-size: 1rem;
            @include circle(16px);
            @include center;
            margin-right: 10px;
        }
        &__tag-title {
            @include text-style(0.8, 300, 1.3rem);
        }
        &__tag-stat {
            @include text-style(0.25, 300, 1.3rem, "DM Sans");
        }
        /* Week View */
        &__week {
            height: calc(100% - 72px);
            overflow: hidden;
            position: relative;
            width: calc(100% - 280px);
        }
    }
    .week-view {
        width: 100%;
        position: relative;
        height: 100%;
        @include pos-abs-top-left-corner;

        $hour-blocks-top-offset: 30px;
        $hour-block-height: 50px;

        &__scrollable {
            position: relative;
            height: calc(100% - 50px);
            margin-left: calc(50px);
            overflow: scroll;
        }
        &__scrollable-content {
            min-width: 1000px;
            max-width: 1000px;
            position: relative;
            height: 100%;
            height: calc(($hour-block-height * 24) + $hour-blocks-top-offset);
        }
        /* Days of the Week */
        &__days-container {
            width: calc(100% - 13px);
            margin-left: 13px;
            overflow: hidden;
            border-bottom: 1px solid rgba(white, 0.04);
        }
        &__days {
            @include flex(_, space-between);
            min-width: 1000px;
            max-width: 1000px;
            margin-left: 50px;

            &-day {
                width: calc((100% / 7));
                position: relative;
                margin-right: 20px;
            }
            &-day-header {
                height: 25px;
                width: 100%;
                padding-right: 10px;
            }
            &-day-header h4 {
                @include text-style(0.8, 400, 1.2rem, "DM Sans");
            }
            &-day-divider {
                @include divider(rgba(white, 0.06), 100%, 0.5px);
                @include pos-abs-top-right-corner(20px, 0px);

                &:last-child {
                    display: none;
                }
            }   
        }
        /* Time Blocks */
        &__time-blocks {
            width: calc(100% - 0px);
            position: relative;
            @include pos-abs-top-left-corner;
            z-index: 1;
            height: 100%;
            margin-left: 10px;
        }
        &__time-block {
            position: absolute;
            width: calc((100% / 7) - 11px);
            overflow: hidden;
            background-color: rgba(var(--block-color-2), 0.75);
            height: var(--block-height);
            max-height: var(--block-height);
            transition: 0.1s ease-in-out;
            cursor: pointer;
            border: 1px solid rgba(var(--block-color-1), 0.04);
            border-radius: 4px;

            &--md &-content {
                @include flex(center);
            }
            &--md &-title {
                margin: 0px 7px 0px 0px;
            }

            &:hover {
                background-color: rgba(var(--block-color-2), 1);
                transition: 0.04s ease-in-out;
            }
            &:active {
                transform: scale(0.998);
            }
        }
        &__time-block-content {
            padding: 3px 8px 4px 8px;
            overflow: hidden;
            white-space: nowrap;
            position: relative;
            height: 100%;
            border-left: none;
        }
        &__time-block-title {
            color: rgb(var(--block-color-1));
            @include text-style(_,  300, 1.2rem, "DM Sans");
            margin-bottom: 2px;
            cursor: text;
        }
        &__time-block-time-period {
            color: rgb(var(--block-color-1));
            opacity: 0.5;
            @include text-style(_, 300, 1.05rem, "DM Sans");
            cursor: text;
            display: inline-block;
        }
        &__time-block-spine {
            @include pos-abs-top-left-corner(-1px, -1px);
            height: calc(100% + 1px);
            width: 2.5px;
            background-color: rgb(var(--block-color-3));
        }

        /* Hour Block */
        &__hour-blocks-container {
            overflow: hidden;
            height: calc(100% - 50px);
            position: relative;
            @include pos-abs-top-left-corner($hour-blocks-top-offset, 5px);
            margin-top: 3px;
        }
        &__hour-blocks {
            height: calc(($hour-block-height * 24) + $hour-blocks-top-offset);
            position: relative;
            width: 50px;
        }
        &__hour-block {
            position: relative;
            @include flex(center, center);
            text-align: center;
            flex-direction: column;
            width: 40px;
            position: absolute;
            left: 10px;

            span {
                @include text-style(0.3, 300, 0.94rem, "DM Sans");
                margin-bottom: 4px;
                width: 40px;
                white-space: nowrap;
            }
        }

        /* Hoz Lines */
        &__hoz-lines-container {
            @include pos-abs-top-left-corner(0px, 8px);
            width: 100%;
            height: 100%;
        }
        &__hoz-lines {
            height: 100%;
            width: 100%;
            position: relative;
        }
        &__hoz-line {
            height: 50px;
            position: absolute;

            path {
                stroke: rgba(var(--textColor1), 0.05);
            }
        }
        &__hour-block-vert-divider {
            path {
                stroke: rgba(var(--textColor1), 0.17);
            }
        }
    }
</style>

