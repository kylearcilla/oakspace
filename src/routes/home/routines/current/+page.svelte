<script lang="ts">
	import { onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import { themeState } from "$lib/store"

    import type { PageData } from "../$types"
	import { Icon } from "$lib/enums"
	import { ROUTINES } from "$lib/utils-routines"
	import { RoutinesManager } from "$lib/routines-manager"
	import { InputManager, TextEditorManager } from "$lib/inputs"
	import { daysOfWeek, getTimeFromIdx, minsToHHMM } from "$lib/utils-date"
	import { COLOR_SWATCHES, TEST_TAGS, getColorTrio } from "$lib/utils-general"

	import SvgIcon from "../../../../components/SVGIcon.svelte"
    import SVGIcon from "../../../../components/SVGIcon.svelte"
	import DropdownBtn from "../../../../components/DropdownBtn.svelte"
	import DropdownList from "../../../../components/DropdownList.svelte"

    // export let data: PageData;

    const daysData: WeeklyRoutine = {
        Mon: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[0],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "Orange",
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
                color: COLOR_SWATCHES.d[3],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[4],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[5],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[6],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Tue: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[7],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "Orange",
                color: COLOR_SWATCHES.d[8],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[9],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[10],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[11],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[12],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[13],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Wed: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[14],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "Orange",
                color: COLOR_SWATCHES.d[15],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[16],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[17],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[18],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[19],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[20],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Thu: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[21],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "Orange",
                color: COLOR_SWATCHES.d[22],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[23],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[24],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[25],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[26],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[27],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ],
        Fri: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[1],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[5],
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
                color: COLOR_SWATCHES.d[5],
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
                title: "Red",
                color: COLOR_SWATCHES.d[1],
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
                title: "Red",
                color: COLOR_SWATCHES.d[1],
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

    const MIN_VIEW_MAX_WIDTH = 640

    let containerWidth = 0
    let manager = new RoutinesManager({
        weeklyRoutine: daysData,
        currentRoutine: ROUTINES[0]
    })

    let scrollableContainer: HTMLElement
    let scrollableContent: HTMLElement
    let hourBlocksElem: HTMLElement
    let weekDaysElem: HTMLElement

    let _weekBlockElems = manager.weekBlockElems
    let _currCores = manager.currCores
    let _tagBreakdown = manager.currTagBreakdown
    let _focusedRoutine = manager.focusedRoutine
    
    let breakdownOpt: keyof typeof currCores.sleeping = "avgTime"
    let isBreakdownDropdownOpen = false
    
    let isAvg = true
    let isViewingCore = true
    let settingsOpen = false
    let breakdownOptnsOpen = false
    let pickedBreakdownOptnIdx = 0

    let titleInput:  Writable<InputManager>
    let description: Writable<InputManager>

    $: selectedTimeFrame = isViewingCore ? "Cores" : "Tags"
    $: weekBlockElems    = $_weekBlockElems as WeekBlockElems ?? []
    $: currCores         = $_currCores ?? []
    $: isLightTheme      = !$themeState.isDarkTheme
    $: tagBreakdown      = $_tagBreakdown ?? []
    $: focusedRoutine    = $_focusedRoutine
    $: initTextEditors(focusedRoutine)

    $: breakdownOpt = isAvg ? "avgTime" : "totalTime"

    function onDaySettingsBtnClicked(idx: number) {

    }
    function toggleBreakdownView(idx: number) {
        pickedBreakdownOptnIdx = idx
        isViewingCore = idx === 0
        isBreakdownDropdownOpen = false
    }
    function initTextEditors(focusedRoutine: DailyRoutine | null) {
        if (!focusedRoutine) return

        titleInput = (new InputManager({ 
            initValue: focusedRoutine.name,
            placeholder: "Routine Title",
            maxLength: 100,
            id: "routine-title-input",
            doAllowEmpty: false,
            handlers: {
                onInputHandler: manager.updateTitle
            }
        })).state
    
        description = (new TextEditorManager({ 
            initValue: focusedRoutine.description,
            placeholder: "Type description here...",
            maxLength: 500,
            id: "routine-description",
            handlers: {
                onInputHandler:  manager.updateDescription
            }
        })).state
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
            manager.initWeeklyRoutine(scrollableContainer) 
            
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
    class:routine--narrow={containerWidth < MIN_VIEW_MAX_WIDTH} 
    bind:clientWidth={containerWidth}
>
    <!-- Routine Details -->
    <div class="routine__details-container">
        <div class="routine__details">
            {#if $titleInput}
                <div class="routine__details-header">
                    <input 
                        type="text"
                        name="routine-title-input" 
                        id="routine-title-input"
                        class="routine__title"
                        aria-label="Title"
                        spellcheck="false"
                        value={$titleInput.value}
                        placeholder={$titleInput.placeholder}
                        maxlength={$titleInput.maxLength}
                        on:blur={(e) => $titleInput.onBlurHandler(e)}
                        on:input={(e) => $titleInput.onInputHandler(e)}
                    >
                    <button 
                        class="routine__settings-btn dropdown-btn dropdown-btn--settings"
                        id={"routine-settings--dropdown-btn"}
                        on:click={() => settingsOpen = !settingsOpen}
                    >
                        <SvgIcon icon={Icon.Settings} options={{ opacity: 0.4}}/>
                    </button>
                    <!-- Settings Dropdown -->
                    <DropdownList 
                        id={"weekly-routine"}
                        isHidden={!settingsOpen} 
                        options={{
                            listItems: [{ name: "Duplicate " }, { name: "Delete Routine" }],
                            position: { top: "30px", right: "0px" },
                            styling: { width: "140px" },
                            onListItemClicked: (e, idx) => manager.onSettingsOptionClicked(idx),
                            onClickOutside: () => settingsOpen = false
                        }}
                    />
                </div>
                <div 
                    class="routine__description text-editor"
                    aria-label="Description"
                    data-placeholder={$description.placeholder}
                    contenteditable
                    bind:innerHTML={$description.value}
                    on:paste={(e) => $description.onPaste(e)}
                    on:input={(e) => $description.onInputHandler(e)}
                    on:focus={(e) => $description.onFocusHandler(e)}
                    on:blur={(e)  => $description.onBlurHandler(e)}
                >
                </div>
            {/if}
        </div>
        <!-- Breakdown -->
        <div class="routine__breakdown">
            <h3>Breakdown</h3>
            <div class="routine__breakdown-header">
                <DropdownBtn 
                    id={"weekly-routine-breakdown"}
                    isActive={isBreakdownDropdownOpen}
                    options={{
                        onClick: () => isBreakdownDropdownOpen = !isBreakdownDropdownOpen,
                        pickedOptionName: selectedTimeFrame,
                        styles: { fontSize: "1.3rem", padding: "4px 12px 4px 11px", margin: "0px 0px 0px -10px" }
                    }} 
                />
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
                   <DropdownList 
                        id={"weekly-routine-breakdown-option"}
                        isHidden={!isBreakdownDropdownOpen} 
                        options={{
                            listItems: [{ name: "Cores" }, { name: "Tag" }],
                            onListItemClicked: (e, idx) => toggleBreakdownView(idx),
                            pickedItemIdx: pickedBreakdownOptnIdx,
                            position: { top: "30px", left: "-10px" },
                            styling: { width: "80px" },
                            onClickOutside: () => isBreakdownDropdownOpen = false
                        }}
                    />
            </div>
            <!-- Cores -->
            <div class="routine__core-breakdown" class:hide={!isViewingCore}>
                <div class="routine__cores">
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Sleeping</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.sleeping[breakdownOpt])}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Awake</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.awake[breakdownOpt])}
                            </div>
                        </div>
                    </div>
                    <div class="routine__cores-col-divider"></div>
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Working</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.working[breakdownOpt])}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Self-Care</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.selfCare[breakdownOpt])}
                            </div>
                        </div>
                    </div>
                    <div class="routine__cores-col-divider"></div>
                    <div class="routine__cores-col">
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Mind</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.mind[breakdownOpt])}
                            </div>
                        </div>
                        <div class="routine__cores-core">
                            <div class="routine__cores-title">Body</div>
                            <div class="routine__cores-value">
                                {minsToHHMM(currCores.body[breakdownOpt])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Tag Breakdown -->
            <div class="routine__tag-breakdown" class:hide={isViewingCore}>
                {#each tagBreakdown as tagData}
                    {@const colorTrio = getColorTrio(tagData.tag.symbol.color, isLightTheme)}
                    <div class="routine__tag-row">
                        <div 
                            class="tag"
                            style:--tag-color-primary={tagData.tag.symbol.color.primary}
                            style:--tag-color-1={colorTrio[0]}
                            style:--tag-color-2={colorTrio[1]}
                            style:--tag-color-3={colorTrio[2]}
                        >
                            <span class="tag__symbol">
                                {tagData.tag.symbol.emoji}
                            </span>
                            <div class="tag__title">
                                {tagData.tag.name}
                            </div>
                        </div>
                        <div class="routine__tag-stat">
                            {#if breakdownOpt === "avgTime"}
                                {minsToHHMM(tagData.data.avgTime)}
                            {:else}
                                {minsToHHMM(tagData.data.totalTime)}
                            {/if}
                        </div>
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
            <!-- Day View -->
            <div 
                class="week-view__scrollable scroll-bar-hidden" 
                bind:this={scrollableContainer}
                on:scroll={onBoardScroll}
            >
                <div class="week-view__scrollable-content" bind:this={scrollableContent}>
                    <!-- Routine Blocks -->
                    <div class="routine-time-blocks">
                        {#each manager.DAYS_WEEK as day}
                            {@const dayIdx = manager.getDayIdx(day)}
                            {#each weekBlockElems[dayIdx] as block (block.id)}
                                {@const colorTrio = getColorTrio(block.color, false)}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <div 
                                    class={`routine-time-blocks__block ${getBlockStyling(block.height)}`}
                                    style:top={`${block.yOffset}px`}
                                    style:left={`${block.xOffset}px`}
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
    @import "../../../../scss/inputs.scss";
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
        &__tag-breakdown .tag {
            margin-left: -2px;
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
    $board-view-left-offset: 60px;
    $days-left-offset: 90px;

    .week-view {
        width: 100%;
        position: relative;
        height: 100%;
        @include pos-abs-top-left-corner;
    

        &__scrollable {
            position: relative;
            height: calc(100% - $board-view-left-offset);
            margin-left: calc($board-view-left-offset);
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
            margin-left: $days-left-offset;

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
            width: calc((100% / 7) - 30px);
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

