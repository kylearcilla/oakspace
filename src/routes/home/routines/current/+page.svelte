<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import { themeState } from "$lib/store"

    import type { PageData } from "../$types"
	import { Icon } from "$lib/enums"
	import { ROUTINES } from "$lib/utils-routines"
	import { RoutinesManager, WeeklyRoutinesManager } from "$lib/routines-manager"
	import { InputManager, TextEditorManager } from "$lib/inputs"
	import { daysOfWeek, getTimeFromIdx, minsFromStartToHHMM, minsToHHMM } from "$lib/utils-date"
	import { COLOR_SWATCHES, TEST_TAGS, getColorTrio } from "$lib/utils-general"

	import SvgIcon from "../../../../components/SVGIcon.svelte"
    import SVGIcon from "../../../../components/SVGIcon.svelte"
	import DropdownBtn from "../../../../components/DropdownBtn.svelte"
	import DropdownList from "../../../../components/DropdownList.svelte"

    // export let data: PageData;

    const daysData: WeeklyRoutineBlocks = {
        Mon: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[0],
                startTime: 360,
                endTime: 420,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "Orange",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Yellow",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "Green",
                color: COLOR_SWATCHES.d[3],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Teal",
                color: COLOR_SWATCHES.d[4],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
                description: "",
                tasks: []
            },
            {
                title: "Blue",
                color: COLOR_SWATCHES.d[5],
                startTime: 1140,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3],
                description: "",
                tasks: []
            },
            {
                title: "Purple",
                color: COLOR_SWATCHES.d[6],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null,
                description: "",
                tasks: []
            },
        ],
        Tue: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[7],
                startTime: 360,
                endTime: 420,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "Orange",
                color: COLOR_SWATCHES.d[8],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Yellow",
                color: COLOR_SWATCHES.d[9],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "Green",
                color: COLOR_SWATCHES.d[10],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Teal",
                color: COLOR_SWATCHES.d[11],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
                description: "",
                tasks: []
            },
            {
                title: "Blue",
                color: COLOR_SWATCHES.d[12],
                startTime: 1140,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3],
                description: "",
                tasks: []
            },
            {
                title: "Purple",
                color: COLOR_SWATCHES.d[13],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null,
                description: "",
                tasks: []
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
                description: "",
                tasks: []
            },
            {
                title: "Orange",
                color: COLOR_SWATCHES.d[15],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Yellow",
                color: COLOR_SWATCHES.d[16],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "Green",
                color: COLOR_SWATCHES.d[17],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Teal",
                color: COLOR_SWATCHES.d[18],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
                description: "",
                tasks: []
            },
            {
                title: "Blue",
                color: COLOR_SWATCHES.d[19],
                startTime: 1140,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3],
                description: "",
                tasks: []
            },
            {
                title: "Purple",
                color: COLOR_SWATCHES.d[20],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null,
                description: "",
                tasks: []
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
                description: "",
                tasks: []
            },
            {
                title: "Orange",
                color: COLOR_SWATCHES.d[22],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Yellow",
                color: COLOR_SWATCHES.d[23],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "Green",
                color: COLOR_SWATCHES.d[24],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Teal",
                color: COLOR_SWATCHES.d[25],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
                description: "",
                tasks: []
            },
            {
                title: "Blue",
                color: COLOR_SWATCHES.d[26],
                startTime: 1140,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3],
                description: "",
                tasks: []
            },
            {
                title: "Purple",
                color: COLOR_SWATCHES.d[27],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null,
                description: "",
                tasks: []
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
                description: "",
                tasks: []
            },
            {
                title: "Green",
                color: COLOR_SWATCHES.d[5],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Yellow",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "Green",
                color: COLOR_SWATCHES.d[5],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
                description: "",
                tasks: []
            },
            {
                title: "Teal",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
                description: "",
                tasks: []
            },
            {
                title: "Blue",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3],
                description: "",
                tasks: []
            },
            {
                title: "Purple",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null,
                description: "",
                tasks: []
            },
        ],
        Sat: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[1],
                startTime: 480,
                endTime: 520,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "🏃‍♂️ Running",
                color: COLOR_SWATCHES.d[1],
                startTime: 600,
                endTime: 690,
                activity: "working",
                tag: TEST_TAGS[6],
                description: "",
                tasks: []
            },
            {
                title: "Yellow",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "🌁 Art",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 920,
                activity: "selfCare",
                tag: TEST_TAGS[8],
                description: "",
                tasks: []
            },
            {
                title: "💪 Gym (Push)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1000,
                endTime: 1100,
                activity: "body",
                tag: TEST_TAGS[0],
                description: "",
                tasks: []
            },
            {
                title: "Blue",
                color: COLOR_SWATCHES.d[4],
                startTime: 1130,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3],
                description: "",
                tasks: []
            },
            {
                title: "Purple",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null,
                description: "",
                tasks: []
            },
        ],
        Sun: [
            {
                title: "Red",
                color: COLOR_SWATCHES.d[1],
                startTime: 480,
                endTime: 520,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "🏃‍♂️ Running",
                color: COLOR_SWATCHES.d[1],
                startTime: 600,
                endTime: 690,
                activity: "working",
                tag: TEST_TAGS[6],
                description: "",
                tasks: []
            },
            {
                title: "Yellow",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
                description: "",
                tasks: []
            },
            {
                title: "🌁 Art",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 920,
                activity: "selfCare",
                tag: TEST_TAGS[8],
                description: "",
                tasks: []
            },
            {
                title: "💪 Gym (Push)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1000,
                endTime: 1100,
                activity: "body",
                tag: TEST_TAGS[0],
                description: "",
                tasks: []
            },
            {
                title: "Blue",
                color: COLOR_SWATCHES.d[4],
                startTime: 1130,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3],
                description: "",
                tasks: []
            },
            {
                title: "Purple",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null,
                description: "",
                tasks: []
            },
        ]
    }

    const weeklyRoutine: WeeklyRoutine = {
        id: "x",
        name: "Routine 1.0",
        description: "Normal routine",
        blocks: daysData
    }

    const MIN_VIEW_MAX_WIDTH = 640
    const DAYS_MIN_VIEW_MAX_WIDTH = 1100
    const HOZ_DIVIDER_TOP_OFFSET = 16

    let containerWidth = 0
    let manager = new WeeklyRoutinesManager(weeklyRoutine)

    let scrollableContainer: HTMLElement
    let scrollableContent: HTMLElement
    let weekViewWidth = 0

    let hourBlocksElem: HTMLElement
    let weekDaysElem: HTMLElement
    let hozLinesContainerWidth = 0

    let _currWeekRoutineElems = manager.currWeekRoutineElems
    let _currCores = manager.currCores
    let _tagBreakdown = manager.currTagBreakdown
    let _focusedDayRoutine = manager.focusedDayRoutine
    let _newBlock = manager.newBlock
    let _editingBlock = manager.editingBlock
    let _editContext = manager.editContext
    let _contextMenuPos = manager.contextMenuPos
    let _currWeekRoutine = manager.currWeekRoutine
    
    let breakdownOpt: keyof typeof currCores.sleeping = "avgTime"
    let isBreakdownDropdownOpen = false
    let flag = false
    
    let isAvg = true
    let isViewingCore = true
    let settingsOpen = false
    let breakdownOptnsOpen = false
    let pickedBreakdownOptnIdx = 0
    let isContextMenuOpen = false
    let colorsOpen = false

    let titleInput:  Writable<InputManager>
    let description: Writable<InputManager>

    // current time
    let minuteTimeout: NodeJS.Timeout | null = null
    let currTime = getCurrentTime()

    $: selectedTimeFrame = isViewingCore ? "Cores" : "Tags"
    $: currWeekRoutineElems    = $_currWeekRoutineElems as WeekBlockElems ?? []
    $: currCores         = $_currCores
    $: isLightTheme      = !$themeState.isDarkTheme
    $: tagBreakdown      = $_tagBreakdown
    $: focusedDayRoutine    = $_focusedDayRoutine
    $: newBlock       = $_newBlock
    $: editingBlock   = $_editingBlock
    $: editContext    = $_editContext
    $: contextMenuPos = $_contextMenuPos
    $: disableScroll  = colorsOpen || isContextMenuOpen
    $: currWeekRoutine = $_currWeekRoutine
    $: initTextEditors(currWeekRoutine)
    
    $: breakdownOpt = isAvg ? "avgTime" : "totalTime"

    let editDayIdx = 0
    _editingBlock.subscribe(() => editDayIdx = manager.editDayIdx)

    $: {
        console.log(editDayIdx)
    }

    function onDaySettingsBtnClicked(idx: number) {

    }
    function toggleBreakdownView(idx: number) {
        pickedBreakdownOptnIdx = idx
        isViewingCore = idx === 0
        isBreakdownDropdownOpen = false
    }
    function initTextEditors(weeklyRoutine: WeeklyRoutine | null) {
        if (!weeklyRoutine) return

        titleInput = (new InputManager({ 
            initValue: weeklyRoutine.name,
            placeholder: "Routine Title",
            maxLength: 100,
            id: "routine-title-input",
            doAllowEmpty: false,
            handlers: {
                onInputHandler: manager.updateTitle
            }
        })).state
    
        description = (new TextEditorManager({ 
            initValue: weeklyRoutine.description,
            placeholder: "Type description here...",
            maxLength: 500,
            id: "routine-description",
            handlers: {
                onInputHandler:  manager.updateDescription
            }
        })).state
    }
    function onEditBlockPointerDown(e: PointerEvent) {
        if (!flag) {
            flag = true
            const target = e.target as HTMLElement
            target.setPointerCapture(e.pointerId)
        }
    }

    function getBlockStyling(height: number) {
        const classes: string[] = []

        if (height < 12) {
            classes.push("routine-blocks__block--xsm")
        }
        if (height < 20) {
            classes.push("routine-blocks__block--sm")
        }
        if (height < 34) {
            classes.push("routine-blocks__block--md")
        }
        return classes.join(" ")
    }
    function onBlockContextMenu(e: MouseEvent, id: string) {
        e.preventDefault()
        manager.onBlockContextMenu(id)
        isContextMenuOpen = true
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

    function getCurrentTime() {
        const date = new Date()
        const hours = date.getHours()
        const minutes = date.getMinutes()
        
        return {
            dayIdx: new Date().getDay(),
            minutes: hours * 60 + minutes
        }
    }
    
    onMount(() => {
        requestAnimationFrame(() => { 
            manager.initContainer(scrollableContainer, scrollableContent)
            manager.processWeeklyRoutine()

            if (manager.earliestBlockHeadPos != Infinity) {
                scrollableContainer.scrollTop += Math.max(manager.earliestBlockHeadPos - 20, 0)
            }
        })

        minuteTimeout = setTimeout(() => currTime = getCurrentTime(), 1000)
    })
    onDestroy(() => clearTimeout(minuteTimeout!))
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
                    <!-- Settings Dropdown -->
                    <DropdownList 
                        id={"weekly-routine"}
                        isHidden={!settingsOpen} 
                        options={{
                            listItems: [{ name: "Duplicate " }, { name: "Delete Routine" }],
                            position: { top: "30px", right: "0px" },
                            styling: { width: "140px" },
                            onListItemClicked: (e, idx) => console.log("A"),
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
            <div class="routine__breakdown-header">
                {#if containerWidth < MIN_VIEW_MAX_WIDTH}
                    <div class="routine__breakdown-cores-title">
                        Cores
                    </div>
                {:else}
                    <DropdownBtn 
                        id={"weekly-routine-breakdown"}
                        isActive={isBreakdownDropdownOpen}
                        options={{
                            onClick: () => isBreakdownDropdownOpen = !isBreakdownDropdownOpen,
                            pickedOptionName: selectedTimeFrame,
                            styles: { fontSize: "1.3rem", padding: "4px 12px 4px 11px", margin: "0px 0px 0px -10px" }
                        }} 
                    />
                {/if}
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
                    {#if currCores}
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
                    {/if}
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
            <div class="week-view__header">
                <!-- View Options -->
                <div class="week-view__view-options">
                    <button class="week-view__view-options-dropdown-btn">
                        Weekly
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>

                <!-- Days of Week Header -->
                <div 
                    class="week-view__days-container"
                    class:scroll-bar-hidden={true}
                    on:pointerover={onWeekDaysHover}
                    bind:this={weekDaysElem}
                >
                    <div class="week-view__days">
                        {#each daysOfWeek as day, idx}
                            <div class="week-view__days-day">
                                <div class="week-view__days-header">
                                    <button class="week-view__days-dropdown-btn" on:click={() => onDaySettingsBtnClicked(idx)}>
                                        {#if containerWidth < DAYS_MIN_VIEW_MAX_WIDTH}
                                            {day.substring(0, 3)}
                                        {:else}
                                            {day}s
                                        {/if}
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
            <!-- Blocks Container  -->
            <div class="week-view__board">
                <div 
                    class="routine-blocks-container" 
                    class:routine-blocks-container--no-scroll={false}
                    class:routine-blocks-container--ns-resize={editContext?.includes("stretch")}
                    bind:this={scrollableContainer}
                    on:scroll={onBoardScroll}
                    on:pointermove={manager.timeBoxMouseMove}
                    >
                    <!-- Blocks Wrapper -->
                    <div class="week-view__blocks-wrapper">
                        <div 
                            id={manager.ROUTINE_BLOCKS_CONTAINER_ID}
                            class="routine-blocks"
                            class:routine-blocks--editing={editContext}
                            class:routine-blocks--light={false}
                            bind:this={scrollableContent}
                            bind:clientWidth={weekViewWidth}
                            on:pointerdown={(e) => manager.onTimeBoxMouseDown(e)}
                            on:contextmenu={(e) => {
                                if (editContext === "lift") e.preventDefault()
                            }}
                        >
                            {#each manager.DAYS_WEEK as day, dayIdx}
                                {@const dayKey = manager.getDayIdx(day)}
    
                                {#each currWeekRoutineElems[dayKey] as block, idx (block.id)}
                                    {@const colorTrio = getColorTrio(block.color, false)}
                                    {@const startTimeStr = minsFromStartToHHMM(block.startTime)}
                                    {@const endTimeStr = minsFromStartToHHMM(block.endTime)}
                                    {@const xOffset = `calc(((100% / 7) * ${dayIdx}) + ${2}px)`}
                                    {@const isEditBlock = editingBlock?.id === block.id && (["old-stretch", "lift"].includes(editContext ?? ""))}
    
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <div 
                                        id={block.id}
                                        class={`routine-blocks__block ${getBlockStyling(block.height)}`}
                                        class:hidden={isEditBlock}
                                        style:top={`${block.yOffset}px`}
                                        style:left={xOffset}
                                        style:--block-height={`${block.height}px`}
                                        style:--block-color-1={colorTrio[0]}
                                        style:--block-color-2={colorTrio[1]}
                                        style:--block-color-3={colorTrio[2]}
                                        title={`${block.title} \n${startTimeStr} - ${endTimeStr}`}
                                        on:pointerdown={(e) => manager.onBlockPointerDown(e, block.id)}
                                        on:contextmenu={(e) => onBlockContextMenu(e, block.id)}
                                    >
                                        <div class="routine-blocks__block-content">
                                            <div class="flx flx--algn-center">
                                                <span class="routine-blocks__block-title">
                                                    {block.title}
                                                </span>
                                            </div>
                                            <div class="routine-blocks__block-time-period">
                                                <span>{startTimeStr}</span>
                                                <span>-</span>
                                                <span>{endTimeStr}</span>
                                            </div>
                                        </div>
                                        <div class="routine-blocks__block-spine"></div>
                                    </div>
                                {/each}
                            {/each}
    
                            <!-- Floating Block or New Block  -->
                            {#if editingBlock}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                {@const colorTrio = getColorTrio(editingBlock.color, isLightTheme)}
                                {@const startTimeStr = minsFromStartToHHMM(editingBlock.startTime)}
                                {@const endTimeStr = minsFromStartToHHMM(editingBlock.endTime)}
                                {@const isLift = editContext === "lift"}
            
                                <div 
                                    class={`routine-blocks__block ${getBlockStyling(editingBlock.height)}`}
                                    class:routine-blocks__block--wk-floating={isLift}
                                    style:top={`${editingBlock.yOffset}px`}
                                    style:left={`${editingBlock.xOffset + 2}px`}
                                    style:--block-height={`${editingBlock.height}px`}
                                    style:--block-color-1={colorTrio[0]}
                                    style:--block-color-2={colorTrio[1]}
                                    style:--block-color-3={colorTrio[2]}
                                    style:z-index={2000}
                                    id="edit-block"
                                    on:pointerdown={onEditBlockPointerDown}
                                >
                                    <div class="routine-blocks__block-content">
                                        <div class="flx flx--algn-center">
                                            <span class="routine-blocks__block-title">
                                                {editingBlock.title}
                                            </span>
                                        </div>
                                        <div class="routine-blocks__block-time-period">
                                            <span>{startTimeStr}</span>
                                            <span>-</span>
                                            <span>{endTimeStr}</span>
                                        </div>
                                    </div>
                                    <div class="routine-blocks__block-spine"></div>
                                </div>
                            {/if}
            
                            <!-- Drop Area Block -->
                            {#if editingBlock && editingBlock.dropAreaOffset && editContext === "lift"}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                {@const colorTrio = getColorTrio(editingBlock.color, isLightTheme)}
                                {@const startTimeStr = minsFromStartToHHMM(editingBlock.startTime)}
                                {@const endTimeStr = minsFromStartToHHMM(editingBlock.endTime)}
                                {@const { left, top } = editingBlock.dropAreaOffset}
                                {@const xOffset = `calc(((100% / 7) * ${editDayIdx}) + ${0}px)`}
            
                                <div 
                                    class={`routine-blocks__block ${getBlockStyling(editingBlock.height)}`}
                                    class:routine-blocks__block--drop-area={true}
                                    class:routine-blocks__block--wk-drop-area={true}
                                    id="drop-area-block"
                                    style:top={`${top}px`}
                                    style:left={xOffset}
                                    style:width={"calc((100% / 7) + 1px)"}
                                    style:--block-height={`${editingBlock.height}px`}
                                    style:--block-color-1={colorTrio[0]}
                                    style:--block-color-2={colorTrio[1]}
                                    style:--block-color-3={colorTrio[2]}
                                >
                                    <div class="routine-blocks__block-content">
                                        <div class="flx flx--algn-center">
                                            <span class="routine-blocks__block-title">
                                                {editingBlock.title}
                                            </span>
                                        </div>
                                        <div class="routine-blocks__block-time-period">
                                            <span>{startTimeStr}</span>
                                            <span>-</span>
                                            <span>{endTimeStr}</span>
                                        </div>
                                    </div>
                                    <div class="routine-blocks__block-spine"></div>
                                </div>
                            {/if}

                            <!-- Now Indicator  -->
                            <div 
                                class="now-line"
                                style:top={`calc((${currTime.minutes / 1440} * 100%) + 2px)`}
                                style:left={`calc(((100% / 7) * ${(currTime.dayIdx + 6) % 7}) + 0px)`}
                                style:width={"calc((100% / 7) + 0.5px)"}
                            >
                                <div class="now-line__content"></div>
                            </div>
                        </div>
    
                        <!-- Grid -->
                        <div class="wk-grid">
                            <!-- Hoz Lines -->
                            <div class="wk-grid__hoz-lines">
                                {#if scrollableContent}
                                    {@const width = weekViewWidth}
                                    {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                                        {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                                        {@const height = (60 / 1440) * 100}
                                        <div 
                                            class="wk-grid__hoz-line"
                                            class:hidden={timeIdx === 0}
                                            style:top={`calc(${headOffsetPerc}% + 3px)`}
                                            style:height={`${height}%`}
                                        >
                                            <div class="wk-grid__hoz-line-content">
                                                <svg xmlns="http://www.w3.org/2000/svg" width={width} height="2" viewBox="0" fill="none">
                                                    <path d={`M0 1H ${width}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                                </svg>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                            <!-- Vert Lines -->
                            <div class="wk-grid__vert-lines">
                                {#if scrollableContent}
                                    {@const containerHeight = scrollableContent.scrollHeight}
                                    {#each Array.from({ length: 8 }, (_, i) => i) as dayIdx}
                                        {@const xOffset = `calc(((100% / 7) * ${dayIdx}) + ${0}px)`}
                                        <div 
                                            class="wk-grid__vert-line"
                                            style:top="0px"
                                            style:left={xOffset}
                                            style:height={`${containerHeight}px`}
                                        >
                                            <div class="wk-grid__vert-line-content">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height={containerHeight} viewBox="0" fill="none">
                                                    <path d={`M1 ${containerHeight}L1 1`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                                </svg>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Hour Blocks -->
                <div 
                    class="hour-blocks-container" 
                    class:scroll-bar-hidden={true}
                    on:pointerover={onHourBlocksHover}
                    bind:this={hourBlocksElem} 
                >
                    <div class="hour-blocks">
                        {#if containerWidth > 0}
                            {#each Array.from({ length: 23 }, (_, i) => i + 1) as timeIdx}
                                {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                                {@const height = (60 / 1440) * 100}
                                <div 
                                    class="hour-blocks__block"
                                    style:top={`calc(${headOffsetPerc}% + 0px)`}
                                    style:height={`${height}%`}
                                >
                                    <span>{getTimeFromIdx(timeIdx, true)}</span>
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
</div>



<style lang="scss">
    @import "../../../../scss/dropdown.scss";
    @import "../../../../scss/day-box.scss";
    @import "../../../../scss/inputs.scss";
    @import "../../../../scss/components/routines.scss";

    $days-left-offset: 90px;
    $hour-blocks-top-offset: 45px;
    $days-header-height: 30px;
    $hour-block-height: 50px;

    $board-view-left-offset: 60px;
    $board-view-left-offset--min: 40px;

    $hr-container-head-offset: 14px;
    $days-ht: 30px;
    $week-view-min-width: 600px;

    $hr-container-y-offset: calc($hr-container-head-offset);

    .routine {
        height: 100%;
        display: flex;

        &--narrow {
            display: block;
        }
        &--narrow &__details-container {
            width: 100%;
        }
        &--narrow &__details h2 {
            margin-bottom: 0px;
        }
        &--narrow &__core-breakdown {
            width: 100%;
            margin: 11px 0px 0px 0px;
        }
        &--narrow &__breakdown {
            width: 100%;
            padding-top: 6px;
        }
        &--narrow &__breakdown-header {
            margin-bottom: 5px;
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
                margin: 0px max(18px, 4%);
                margin-top: -10px;
            }
        }
        &--narrow &__week {
            margin-top: 20px;
            height: calc(100% - 265px);
            width: 100%;
            border-color: transparent;
        }
        &--narrow &__tag-breakdown {
            display: none;
        }
        &--narrow .week-view__view-options {
            width: $board-view-left-offset--min;
            padding-left: 0px;
        }
        &--narrow .week-view__days-container {
            width: 100%;
            margin-left: 0px;
        }
        &--narrow .week-view__hour-blocks-container {
            margin-left: -10px;
        }
        &--narrow .hour-blocks {
            width: $board-view-left-offset--min;

            &__block {
                left: -8px;
            }
        }
        &--narrow .routine-blocks-container {
            margin-left: $board-view-left-offset--min;
        }

        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &__details-container {
            padding-top: 16px;
            width: 280px;
        }
        &__details {
            margin-bottom: 10px;
        }
        &__details {
            width: 84%;
        }
        &__breakdown {
            width: 90%;
            margin-left: -6px;
            padding: 7px 20px 8px 15px;
            border-radius: 14px;
            @include txt-color(0.013, "bg");
            border: 1px solid rgba(white, 0.02);
        }
        &__breakdown-cores-title {
            padding: 4px 12px 4px 11px;
            margin: 0px 0px 0px -10px;
            @include text-style(0.85, 400, 1.3rem);
        }
        &__title {
            font-size: 1.7rem;
        }
        &__description {
            margin-top: 2px;
        }
        &__tag-breakdown .tag {
            margin-left: -2px;
        }
        /* Week View */
        &__week {
            height: calc(100% - 55px);
            width: calc(100% - 280px);
            border-left: 1px solid rgba(white, 0.04);
            overflow: hidden;
            position: relative;
        }
    }

    .week-view {
        width: 100%;
        position: relative;
        height: 100%;
        @include pos-abs-top-left-corner;

        &__header {
            width: 100%;
            height: 43px;
            border-bottom: 1px solid rgba(white, 0.04);
            @include flex(center);
        }

        /* View Options */
        &__view-options {
            width: $board-view-left-offset;
            padding-left: 14px;

            &:hover i {
                visibility: visible;
                opacity: 0.5;
            }
        }
        &__view-options-dropdown-btn {
            @include text-style(0.2, 400, 1.04rem, "DM Sans");
            position: relative;
            transition: 0.1s ease-in-out;
            
            &:hover {
                @include text-style(0.4);
            }
            &:active {
                transform: scale(0.99);
            } 
            i {
                @include not-visible;
                @include pos-abs-top-right-corner(50%, -12px);
                font-size: 0.75rem;
            }
        }
        
        /* Days of the Week */
        &__days-container {
            width: calc(100% - $board-view-left-offset);
            padding: 8px 0px 10px 0px;
        }
        &__days {
            @include flex(_, space-between);
            min-width: $week-view-min-width;

            &-day {
                width: calc((100% / 7));
                position: relative;
                @include center;
            }
            &-day:hover &-day-settings-btn {
                @include visible;
            }
        }
        &__days-header {
            height: 25px;
            width: 100%;
            position: relative;
            @include center;

            &:hover i {
                visibility: visible;
            }
        }
        &__days-day-title {
        }
        &__days-dropdown-btn {
            position: relative;
            @include text-style(0.8, 400, 1.2rem, "DM Sans");
            
            i {
                @include pos-abs-top-right-corner(-2px, -20px);
                @include not-visible;
                @include center;
                padding: 6px;
                font-size: 0.8rem;

                &:hover {
                    opacity: 1 !important;
                }
            }
            &:active {
                transform: scale(0.985);
            }
        }

        /* Mint Content */
        &__board {
            position: relative;
            height: 100%;
        }
        &__blocks-wrapper {
            min-width: $week-view-min-width;
            position: relative;
            height: calc(($hour-block-height * 24));
        }
    }
    .routine-blocks-container {
        position: relative;
        margin-left: $board-view-left-offset;
        overflow: scroll;
        height: calc(100% - 50px);
    }
    .routine-blocks {
        @include pos-abs-top-left-corner(-2px, 0px);
        
        &__block {
            width: calc((100% / 7) - 15px);
        }
    }
    .wk-grid {
        margin-top: -1px;
    }
    .hour-blocks {
        height: calc($hour-block-height * 24);
        width: $board-view-left-offset;

        &-container {
            overflow: hidden;
            height: calc(100% - 50px);
            @include pos-abs-top-left-corner(0px, 1px);
        }
        &__blocks {
            height: calc($hour-block-height * 24);
            width: 100%;
        }
        &__block {
            left: 8px;
        }
        &__block span {
            width: 40px;
        }
    }
</style>

