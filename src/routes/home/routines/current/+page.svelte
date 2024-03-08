<script lang="ts">
	import { HrsMinsFormatOption, Icon, RoutineActivityType } from "$lib/enums";
	import { RoutinesManager } from "$lib/routines-manager";
	import { themeState } from "$lib/store";
	import { daysOfWeek, getTimeFromIdx, minsToHHMM } from "$lib/utils-date";
	import { COLOR_SWATCHES, TEST_TAGS, clickOutside, getColorTrio } from "$lib/utils-general";
	import { onMount } from "svelte";
    import type { PageData } from "../$types";
    import SVGIcon from "../../../../components/SVGIcon.svelte"

    // export let data: PageData;

    const daysData: WeekBlocks = {
        Mon: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Tue: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Wed: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Thu: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Fri: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Sat: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 480,
                endTime: 520,
                activity: null,
                tag: null
            },
            {
                title: "🏃‍♂️ Running",
                color: COLOR_SWATCHES.d[1],
                startTime: 600,
                endTime: 690,
                activity: "working",
                tag: TEST_TAGS[6]
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null
            },
            {
                title: "🌁 Art",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 920,
                activity: "selfCare",
                tag: TEST_TAGS[8]
            },
            {
                title: "💪 Gym (Push)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1000,
                endTime: 1100,
                activity: "body",
                tag: TEST_TAGS[0]
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1130,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3]
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Sun: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 480,
                endTime: 520,
                activity: null,
                tag: null
            },
            {
                title: "🏃‍♂️ Running",
                color: COLOR_SWATCHES.d[1],
                startTime: 600,
                endTime: 690,
                activity: "working",
                tag: TEST_TAGS[6]
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null
            },
            {
                title: "🌁 Art",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 920,
                activity: "selfCare",
                tag: TEST_TAGS[8]
            },
            {
                title: "💪 Gym (Push)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1000,
                endTime: 1100,
                activity: "body",
                tag: TEST_TAGS[0]
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1130,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3]
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
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

    let _weekBlockElems = manager.weekBlockElems
    let _currCores = manager.currCores
    let coreProp: keyof typeof currCores.sleeping = "avgTime"
    let isBreakdownDropdownOpen = false
    
    let isAvg = true
    let isViewingCore = true

    $: selectedTimeFrame = isViewingCore ? "Cores" : "Tags"
    $: weekBlockElems    = $_weekBlockElems as WeekBlockElems ?? []
    $: currCores         = $_currCores ?? []
    $: isLightTheme      = !$themeState.isDarkTheme

    $: coreProp = isAvg ? "avgTime" : "totalTime"

    function onDaySettingsBtnClicked(idx: number) {

    }
    function toggleBreakdownView(option: string) {
        isViewingCore = option === "Cores" 
        isBreakdownDropdownOpen = false
    }

    function getBlockStyling(height: number) {
        const classes: string[] = []

        if (height < 12) {
            classes.push("routine-time-blocks__block--xsm")
        }
        if (height < 20) {
            classes.push("routine-time-blocks__block--sm")
        }
        if (height < 34) {
            classes.push("routine-time-blocks__block--md")
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
            manager.initWeekBlocks(scrollableContainer) 
            
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
            <h3>Breakdown</h3>
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
                        class:full-opacity={isAvg}
                        on:click={() => isAvg = true}
                    >
                        Avg
                    </button>
                    <button 
                        class="routine__breakdown-options-btn" 
                        class:full-opacity={!isAvg}
                        on:click={() => isAvg = false}
                    >
                        Total
                    </button>
                </div>
                <ul 
                    use:clickOutside on:click_outside={() => isBreakdownDropdownOpen = false} 
                    class="routine__breakdown-options-menu dropdown-menu"
                    class:dropdown-menu--hidden={!isBreakdownDropdownOpen}
                >
                    {#each ["Cores", "Tags"] as option}    
                        <li 
                            class="dropdown-menu__option" 
                            class:dropdown-menu__option--selected={selectedTimeFrame === option}
                        >
                            <button class="dropdown-element" on:click={() => toggleBreakdownView(option)}>
                                <span class="dropdown-menu__option-text">
                                    {option}
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
            <div class="routine__core-breakdown" class:hide={!isViewingCore}>
                <div class="routine__cores">
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Sleeping</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.sleeping[coreProp])}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Awake</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.awake[coreProp])}
                            </div>
                        </div>
                    </div>
                    <div class="routine__cores-col-divider"></div>
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Working</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.working[coreProp])}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Self-Care</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.selfCare[coreProp])}
                            </div>
                        </div>
                    </div>
                    <div class="routine__cores-col-divider"></div>
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Mind</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.mind[coreProp])}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Body</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.body[coreProp])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Tag Breakdown -->
            <div class="routine__tag-breakdown" class:hide={isViewingCore}>
                {#each TEST_TAGS.slice(0, 4) as tag}
                    {@const colorTrio = getColorTrio(tag.symbol.color, isLightTheme)}
                    <div class="tag">
                        <div 
                            class="tag__content"
                            style:--tag-color-primary={tag.symbol.color.primary}
                            style:--tag-color-1={colorTrio[0]}
                            style:--tag-color-2={colorTrio[1]}
                            style:--tag-color-3={colorTrio[2]}
                        >
                            <span class="tag__symbol">
                                {tag.symbol.emoji}
                            </span>
                            <div class="tag__title">
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
                    {#each daysOfWeek as day, idx}
                        <div class="week-view__days-day">
                            <div class="week-view__days-day-header">
                                <h4>{day}s</h4>
                                <button 
                                    class="week-view__days-day-settings-btn settings-btn" 
                                    on:click={() => onDaySettingsBtnClicked(idx)}
                                >
                                    <SVGIcon 
                                        icon={Icon.Settings} 
                                        options={{ opacity: 0.45 }} 
                                    />
                                </button>
                            </div>
                            <!-- <div class="week-view__days-day-divider"></div> -->
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
                    <div class="routine-time-blocks">
                        {#each manager.DAYS_WEEK as day}
                            {@const dayIdx = manager.getDayIdx(day)}
                            {#each weekBlockElems[dayIdx] as block (block.id)}
                                {@const colorTrio = getColorTrio(block.color, isLightTheme)}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <div 
                                    class={`routine-time-blocks__block ${getBlockStyling(block.height)}`}
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
                                    <div class="routine-time-blocks__block-content">
                                        <div class="flx flx--algn-center">
                                            <span class="routine-time-blocks__block-title">
                                                {block.title}
                                            </span>
                                        </div>
                                        <div class="routine-time-blocks__block-time-period">
                                            <span>{block.startTimeStr}</span>
                                            <span>-</span>
                                            <span>{block.endTimeStr}</span>
                                        </div>
                                    </div>
                                    <div class="routine-time-blocks__block-spine"></div>
                                </div>
                            {/each}
                        {/each}
                    </div>
                    <div class="hoz-lines-container">
                        <div class="hoz-lines">
                            {#if scrollableContent}
                                {@const width = scrollableContent.scrollWidth}
                                {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                                    {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                                    {@const height = (60 / 1440) * 100}
                                    <div 
                                        class="hoz-lines__line"
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
                class="hour-blocks-container scroll-bar-hidden" 
                bind:this={hourBlocksElem} on:mouseover={onHourBlocksHover}
            >
                <div class="hour-blocks">
                    {#if containerWidth > 0}
                        {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                            {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                            {@const height = (60 / 1440) * 100}
                            <div 
                                class="hour-blocks__block"
                                style:top={`calc(${headOffsetPerc}% - 0px)`}
                                style:height={`${height}%`}
                            >
                                <span>{getTimeFromIdx(timeIdx)}</span>
                                <div class="hour-blocks__block-vert-divider">
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
    @import "../../../../scss/day-box.scss";
    @import "../../../../scss/components/routines.scss";

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
                @include divider(0.06, 38px, 1px);
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
        &__details, &__breakdown {
            width: 84%;
        }
        &__tag-breakdown {
            margin-left: -5px;
        }
        /* Week View */
        &__week {
            height: calc(100% - 72px);
            overflow: hidden;
            position: relative;
            width: calc(100% - 280px);
        }
    }
    $hour-blocks-top-offset: 35px;
    $hour-block-height: 50px;

    .week-view {
        width: 100%;
        position: relative;
        height: 100%;
        @include pos-abs-top-left-corner;

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
            padding-bottom: 5px;
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
            &-day:hover &-day-settings-btn {
                @include visible;
            }
            &-day-header {
                height: 25px;
                width: 100%;
                padding-right: 10px;
                @include flex(center, space-between);
            }
            &-day-header h4 {
                @include text-style(0.8, 400, 1.2rem, "DM Sans");
            }
            &-day-divider {
                @include divider(0.06, 100%, 0.5px);
                @include pos-abs-top-right-corner(20px, 0px);

                &:last-child {
                    display: none;
                }
            }
            &-day-settings-btn {
                margin-right: -18px;
                @include not-visible;
                background-color: rgba(var(--textColor1), 0) !important;
                
                &:hover {
                    background-color: rgba(var(--textColor1), 0.05) !important;
                }
            }
        }
    }
    .routine-time-blocks {
        margin-left: 10px;
        
        &__block {
            width: calc((100% / 7) - 11px);
        }
    }
    .hour-blocks {
        height: calc(($hour-block-height * 24) + $hour-blocks-top-offset);
        width: 50px;

        &-container {
            overflow: hidden;
            height: calc(100% - 50px);
            @include pos-abs-top-left-corner($hour-blocks-top-offset, 5px);
        }
        &__blocks {
            height: calc(($hour-block-height * 24) + $hour-blocks-top-offset);
            width: 50px;
        }
        &__block {
            width: 40px;
            left: 10px;
        }
        &__block span {
            width: 40px;
        }
    }
    .hoz-lines {
        height: 100%;
        width: 100%;
        position: relative;

        &-container {
            @include pos-abs-top-left-corner(0px, 8px);
        }
        &__line {
            height: 50px;
        }
    }
</style>

