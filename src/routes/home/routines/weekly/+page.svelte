<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import { themeState } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { getColorTrio } from "$lib/utils-general"
	import { InputManager, TextEditorManager } from "$lib/inputs"
	import { getTimeFromIdx, minsFromStartToHHMM, minsToHHMM } from "$lib/utils-date"
	import { WeeklyRoutinesManager } from "$lib/routines-manager"
	import { BreakdownView, EDIT_BLOCK_OPTIONS, ViewOption, getBlockStyling, isDayRoutinedLinked } from "$lib/utils-routines"
    
	import EditBlockModal from "../EditBlockModal.svelte"
	import NewRoutineModal from "../NewRoutineModal.svelte"
	import SvgIcon from "../../../../components/SVGIcon.svelte"
	import BounceFade from "../../../../components/BounceFade.svelte"
	import ColorPicker from "../../../../components/ColorPicker.svelte"
	import DropdownBtn from "../../../../components/DropdownBtn.svelte"
	import DropdownList from "../../../../components/DropdownList.svelte"
	import ConfirmationModal from "../../../../components/ConfirmationModal.svelte"

    export let data: { routines: WeeklyRoutine[] }

    const MIN_VIEW_MAX_WIDTH = 640
    const DAYS_MIN_VIEW_MAX_WIDTH = 1100
    const DAY_DROPDOWN_WIDTH = 255
    const WK_ROUTINES_SETTINGS_DROPDOWN_WIDTH  = 140
    const WK_BOARD_PAD_BOTTOM  = 35
    
    let WEEK_ROUTINES = data.routines
    
    // DOM
    let hourBlocksElem: HTMLElement
    let weekDaysElem: HTMLElement
    let scrollableContainer: HTMLElement
    let scrollableContent: HTMLElement
    let wkRoutinesContainerRef: HTMLElement
    
    let weekViewWidth = 0
    let routineDetailsHeight = 0
    let breakdownHeight = 0
    let containerWidth = 0
    
    // Weekly Routines
    let chosenWeekRoutineIdx = 0
    let clickedWeekRoutineIdx = chosenWeekRoutineIdx
    let editWkRoutineIdx = -1
    let manager = new WeeklyRoutinesManager(WEEK_ROUTINES[chosenWeekRoutineIdx])
    
    let isWkRoutinesOpen = true
    let isWkRoutineSettingsOpen = false
    let isDeleteWkRoutineConfirmOpen = false
    let openNewRoutineModal = false
    let wkRoutineSettingsPos = { left: 0, top: 0 }

    // Focus Routine Breakdown
    let pickedBreakdownView = BreakdownView.Cores
    let isAvg = true
    let isViewingCore = true
    
    // Week View
    let minuteTimeout: NodeJS.Timeout | null = null
    let currTime = getCurrentTime()

    let daysInView = manager.DAYS_WEEK
    let viewOptionOpen = false

    let isContextMenuOpen = false
    let colorsOpen = false
    let colorsPos: OffsetPoint | null = null

    // Day Breakdown
    let dayBreakdownColIdx = -1
    let isDayBreakdownOpen = false
    let dayBreakdownIsCore = true
    let pickedDayBreakdownView = BreakdownView.Cores
    
    let isDayBreakdownViewOptOpen = false
    let isDayBreakdownAvg = false
    let dailyRoutinesListOpen = false
    let breakdownDropdownXOffset = ""
    let isBreakdownDropdownOpen = false
    let hasSetEditPointerCapture = false

    // Stores
    let _currWeekRoutine      = manager.currWeekRoutine
    let _currWeekRoutineElems = manager.currWeekRoutineElems
    let _currCores      = manager.currCores
    let _tagBreakdown   = manager.currTagBreakdown
    let _editingBlock   = manager.editingBlock
    let _editContext    = manager.editContext
    let _contextMenuPos = manager.contextMenuPos
    let _currViewOption = manager.currViewOption
    let _dayBreakdown   = manager.dayBreakdown

    let titleInput:  Writable<InputManager>
    let description: Writable<InputManager>
    
    $: currWeekRoutine      = $_currWeekRoutine
    $: currWeekRoutineElems = $_currWeekRoutineElems as WeekBlockElems ?? []
    $: currCores            = $_currCores
    $: tagBreakdown         = $_tagBreakdown
    $: currViewOption    = $_currViewOption
    $: editContext       = $_editContext
    $: editingBlock      = $_editingBlock
    $: contextMenuPos    = $_contextMenuPos
    $: lockInteraction   = isContextMenuOpen || colorsOpen
    $: selectedTimeFrame = isViewingCore ? "Cores" : "Tags"
    $: dayBreakdown      = $_dayBreakdown
    
    $: initTextEditors(currWeekRoutine)
    $: breakdownOpt    = isAvg ? "avgTime" : "totalTime" as keyof typeof currCores.sleeping
    $: dayBreakdownOpt = isDayBreakdownAvg ? "avgTime" : "totalTime" as keyof typeof currCores.sleeping

    $: isMin        = containerWidth < MIN_VIEW_MAX_WIDTH
    $: isLightTheme = !$themeState.isDarkTheme

    $: detailsMaxHt = `calc(100% - ${routineDetailsHeight + breakdownHeight + 100}px)`
    $: if (isMin) isWkRoutinesOpen = false
    
    _currViewOption.subscribe(() => daysInView = manager.daysInView)
    _dayBreakdown.subscribe((data) => breakdownDropdownXOffset = updateDayBreakdowXOffset(data))


    function initTextEditors(weeklyRoutine: WeeklyRoutine | null) {
        if (!weeklyRoutine) return

        titleInput = (new TextEditorManager({ 
            initValue: weeklyRoutine.name,
            placeholder: "Routine Title",
            maxLength: 100,
            id: "routine-title",
            doAllowEmpty: false,
            handlers: {
                onBlurHandler: (e, val) => manager.updateTitle(val)
            }
        })).state
        
        description = (new TextEditorManager({ 
            initValue: weeklyRoutine.description,
            placeholder: "Type description here...",
            maxLength: 500,
            id: "routine-description",
            handlers: {
                onBlurHandler: (e, val) => manager.updateDescription(val)
            }
        })).state
    }

    /* Week Routines */
    function onWkRoutineContextMenu(e: Event, routineIdx: number) {
        const pe = e as PointerEvent;
        pe.preventDefault();

        const container = wkRoutinesContainerRef

        const rect = container.getBoundingClientRect()
        const top  = pe.clientY - rect.top
        let left = pe.clientX - rect.left

        // if will go out of bounds
        if (isMin) {
            const dropdownWidth = WK_ROUTINES_SETTINGS_DROPDOWN_WIDTH
            const distFromRight = window.innerWidth - pe.clientX
            const cutOff = dropdownWidth - distFromRight

            if (cutOff > 0) {
                left -= cutOff + 10
            }
        }
        
        editWkRoutineIdx        = routineIdx
        isWkRoutineSettingsOpen = true
        wkRoutineSettingsPos    = { top, left }
    }
    function onWkSettingsItemOptnClicked(itemIdx: number, optIdx: number) {
        const isChosen = itemIdx === chosenWeekRoutineIdx

        if (optIdx === 0 && isChosen) {
            editWkRoutineIdx = -1
            chosenWeekRoutineIdx = -1
        }
        else if (optIdx === 0) {
            editWkRoutineIdx = -1
            chosenWeekRoutineIdx = itemIdx
        }
        else {
            isDeleteWkRoutineConfirmOpen = true            
        }

        if (isMin) isWkRoutinesOpen = false

        isWkRoutineSettingsOpen = false
    }
    function onFinishNewWeekRoutineEdit(newRoutine: WeeklyRoutine | null) {
        openNewRoutineModal = false

        if (!newRoutine) return

        WEEK_ROUTINES.push(newRoutine)
        WEEK_ROUTINES = WEEK_ROUTINES
    }
    function onRoutineAdd() {
        openNewRoutineModal = true
    }
    function onDeleteWkEditRoutineItem() {
        isDeleteWkRoutineConfirmOpen = false
        WEEK_ROUTINES = WEEK_ROUTINES.filter((_, routineIdx) => routineIdx != editWkRoutineIdx)

        toast("success", { message: "Weekly routine deleted." })
    }
    function onWkRoutineItemClicked(routineIdx: number) {
        if (routineIdx === clickedWeekRoutineIdx) return
        if (isMin) isWkRoutinesOpen = false
        
        clickedWeekRoutineIdx = routineIdx
        manager.updateCurrentWeekRoutine(WEEK_ROUTINES[routineIdx])
    }

    /* Edit Block */
    function onContextMenuOptClicked(e: Event, idx: number) {
        if (idx === 0) {
            manager.openEditBlockModal()
        }
        else if (idx === 1) {
            colorsPos = manager.getColorPickerPos()
            colorsOpen = true
        }
        else if (idx === 2) {
            manager.duplicateEditBlockElem()
            manager.resetEditState()
        }
        else {
            manager.deleteEditBlockElem()
            manager.resetEditState()
        }
        isContextMenuOpen = false
    }
    
    /* Routine Breakdowns */
    function setWeekBreakdownView(viewOptnIdx: number) {
        pickedBreakdownView = viewOptnIdx
        isViewingCore = viewOptnIdx === BreakdownView.Cores
        isBreakdownDropdownOpen = false
    }
    function setDayBreakdownView(idx: number | null) {
        if (idx === dayBreakdownColIdx) {
            isDayBreakdownOpen = false
        }
        else if (idx != null) {
            dayBreakdownColIdx = idx
            isDayBreakdownOpen = true
            manager.initDayRoutineBreakdown(idx)
        }
    }
    function setDayBreakdownViewOptn(viewOptIdx: number) {
        pickedDayBreakdownView = viewOptIdx
        dayBreakdownIsCore = viewOptIdx === BreakdownView.Cores
        isBreakdownDropdownOpen = false
    }
    function closeDayBreakdown() {
        manager.initDayRoutineBreakdown(null)
        dayBreakdownColIdx = -1
    }
    function onLinkBtnClicked(isLinked: boolean) {
        if (isLinked) {
            manager.unlinkCurrBreakdownDay()
        }
        else {
            dailyRoutinesListOpen = !dailyRoutinesListOpen
        }
    }
    function onDailyRoutinesListOptClicked(idx: number) {
    }
    function updateDayBreakdowXOffset(dayBreakdown: DayBreakdown | null) {
        if (!dayBreakdown) return ""

        return `clamp(10px, calc(((100% / 7) * ${dayBreakdownColIdx}) + 10px), calc(100% - ${DAY_DROPDOWN_WIDTH}px))`;
    }

    /* Editing Blocks */
    function onEditBlockPointerDown(e: PointerEvent) {
        if (!hasSetEditPointerCapture) {
            hasSetEditPointerCapture = true
            const target = e.target as HTMLElement
            target.setPointerCapture(e.pointerId)
        }
    }
    function onBlockContextMenu(e: MouseEvent, id: string) {
        e.preventDefault()
        manager.onBlockContextMenu(id)
        isContextMenuOpen = true
    }

    /* UI Stuff */
    function onBoardScroll(e: Event) {
        const target = e.target as HTMLElement

        hourBlocksElem.scrollTop = target.scrollTop
        hourBlocksElem.style.overflow = "scroll"

        // keep y scroll pos of board and time in sync
        if (hourBlocksElem.scrollTop != target.scrollTop) {
            target.scrollTop = hourBlocksElem.scrollTop
        }

        weekDaysElem.scrollLeft = target.scrollLeft
        weekDaysElem.style.overflow = "scroll"
    }
    function getCurrentTime() {
        const date = new Date()
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const dayIdx = new Date().getDay()
        
        return {
            dayIdx: (dayIdx + 6) % 7,
            minutes: hours * 60 + minutes
        }
    }
    
    onMount(() => {
        requestAnimationFrame(() => { 
            manager.initContainer(scrollableContainer, scrollableContent)
            manager.processWeeklyRoutine()
        })
        minuteTimeout = setTimeout(() => currTime = getCurrentTime(), 1000)
    })

    onDestroy(() => clearTimeout(minuteTimeout!))
</script>

<div 
    class="routine" 
    class:routine--light={isLightTheme}
    class:routine--dark={!isLightTheme} 
    class:routine--narrow={isMin} 
    style:--days-length={daysInView.length}
    bind:clientWidth={containerWidth}
>
    <!-- Routine Details -->
    <div class="routine__details-container">
        <!-- Title + Description -->
        <div class="routine__details" bind:clientHeight={routineDetailsHeight}>
            {#if chosenWeekRoutineIdx === clickedWeekRoutineIdx}
                <div class="routine__details-chosen-routine">
                    Current
                </div>
            {/if}
            {#if isMin}
                <div class="routine__details-header">
                    <h1 class="routine__title">
                        {currWeekRoutine?.name}
                    </h1>
                </div>
                <h1 class="routine__description">
                    {currWeekRoutine?.description}
                </h1>
            {:else if $titleInput}
                <div class="routine__details-header">
                    <div 
                        class="routine__title text-editor"
                        aria-label="Title"
                        data-unstyled
                        contenteditable
                        data-placeholder={$titleInput.placeholder}
                        bind:innerHTML={$titleInput.value}
                        on:paste={(e) => $titleInput.onPaste(e)}
                        on:input={(e) => $titleInput.onInputHandler(e)}
                        on:focus={(e) => $titleInput.onFocusHandler(e)}
                        on:blur={(e)  => $titleInput.onBlurHandler(e)}
                    >
                    </div>
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
        <!-- Week Breakdown -->
        <div class="routine__breakdown" bind:clientHeight={breakdownHeight}>
            <div class="routine__breakdown-header">
                {#if isMin}
                    <div class="routine__breakdown-cores-title">
                        Cores
                    </div>
                {:else}
                    <DropdownBtn 
                        id={"weekly-routine-breakdown"}
                        isActive={isBreakdownDropdownOpen}
                        options={{
                            noBg: true,
                            pickedOptionName: selectedTimeFrame,
                            styles: { 
                                fontSize: "1.3rem", padding: "4px 12px 4px 11px", margin: "0px 0px 0px -10px" 
                            },
                            onClick: () => { 
                                isBreakdownDropdownOpen = !isBreakdownDropdownOpen
                            },
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
                        pickedItemIdx: pickedBreakdownView,
                        position: { top: "30px", left: "-10px" },
                        styling:  { width: "10px" },
                        onClickOutside:    () => isBreakdownDropdownOpen = false,
                        onListItemClicked: (e, idx) => setWeekBreakdownView(idx)
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
        <!-- User Week Routines -->
        <div 
            class="routine__wk-routines"
            style:--routines-height={`${isMin ? "auto" : detailsMaxHt}`}
            bind:this={wkRoutinesContainerRef}
        >
            <div class="routine__wk-routines-header">
                <div class="routine__wk-routines-left">
                    {#key isMin}
                        <DropdownBtn
                            id="wk-routines"
                            isActive={isWkRoutinesOpen}
                            options={{
                                noBg: true,
                                arrowLeft: !isMin,
                                pickedOptionName: "Routines",
                                onClick: () => { 
                                    isWkRoutinesOpen = !isWkRoutinesOpen
                                },
                                styles: { 
                                    fontSize: "1.34rem", fontFamily: "DM Sans",
                                    padding: "4px 0px 4px 11px", margin: "0px 0px 0px -10px"
                                },
                                arrowStyles: { 
                                    margin: "0px 10px 0px 0px" 
                                }
                            }} 
                        />
                    {/key}
                    <button 
                        class="routine__wk-routines-add-btn"
                        on:click={onRoutineAdd}
                    >
                        <SvgIcon 
                            icon={Icon.Add}
                            options={{ scale: 1, strokeWidth: 1.7 }}
                        />
                    </button>
                </div>
                <span class="routine__wk-routines-count">
                    {WEEK_ROUTINES.length}
                </span>
            </div>
            <!-- Week Routines List  -->
            <BounceFade
                id="wk-routines--dropdown-menu"
                isHidden={!isWkRoutinesOpen}
                styling={{ height: "100%" }}
                isAnim={isMin}
                onClickOutside={() => {
                    if (!isMin) return
                    isWkRoutinesOpen = false
                    isWkRoutineSettingsOpen = false
                }}
            >
                <ul 
                    class="routine__wk-routines-list"
                    class:dropdown-menu={isMin}
                    style:--routines-dropdown-max-height={`${isMin ? "auto" : "calc(100% - 80px)"}`}
                >
                    {#each WEEK_ROUTINES as weekRoutine, idx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li 
                            role="button"
                            tabindex="0"
                            class="routine__wk-routines-item"
                            class:routine__wk-routines-item--clicked={idx === clickedWeekRoutineIdx}
                            class:routine__wk-routines-item--chosen={idx === chosenWeekRoutineIdx}
                            on:click={() => onWkRoutineItemClicked(idx)}
                            on:contextmenu={(e) => onWkRoutineContextMenu(e, idx)}
                        >
                            <span>{weekRoutine.name}</span>
                            <i class="fa-solid fa-check"></i>
                        </li>
                    {/each}
                </ul>
            </BounceFade>
            <!-- Week Routine Settings Dropdown -->
            <DropdownList
                id={"wk-routines"}
                isHidden={!isWkRoutineSettingsOpen}
                options={{
                    listItems: [
                        { 
                            options: [{ 
                                name: editWkRoutineIdx === chosenWeekRoutineIdx ? "Unselect Routine" : "Choose as Current" 
                            }]
                        },
                        {  name: "Delete Routine"  }
                    ],
                    onListItemClicked: (e, optIdx) => {
                        onWkSettingsItemOptnClicked(editWkRoutineIdx, optIdx)
                    },
                    onClickOutside: () => {
                        isWkRoutineSettingsOpen = false
                    },
                    styling: { 
                        width: "140px", zIndex: 2001 
                    },
                    position: {
                        top: wkRoutineSettingsPos.top + "px",
                        left: wkRoutineSettingsPos.left + "px"
                    }
                }}
            />
        </div>
    </div>
    <!-- Week View -->
    <div class="routine__week">
        <div 
            class="week-view"
            class:week-view--light={isLightTheme}
            style:--min-width={
                currViewOption === ViewOption.Weekly ?
                "600px" :
                currViewOption === ViewOption.MTWT ?
                "320px" : "auto"
            }
        >
            <!-- Top Header -->
            <div class="week-view__header">
                <!-- View Options -->
                <div 
                    class="week-view__view-options"
                    class:week-view__view-options--open={viewOptionOpen}
                >
                    <button 
                        id="view-option--dropdown-btn"
                        class="week-view__view-options-dropdown-btn"
                        on:click={() => viewOptionOpen = !viewOptionOpen}
                    >
                        {ViewOption[currViewOption]}
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <DropdownList 
                        id="view-option"
                        isHidden={!viewOptionOpen} 
                        options={{
                            pickedItemIdx: currViewOption,
                            listItems: [{ name: "Today" }, { name: "Weekly" }, { name: "M T W T" }, { name: "F S S" }],
                            position: { 
                                top: "22px", left: containerWidth < MIN_VIEW_MAX_WIDTH ? "0px" : "10px" 
                            },
                            styling: { 
                                width: "88px", zIndex: 2000 
                            },
                            onClickOutside: () => {
                                viewOptionOpen = false
                            },
                            onListItemClicked: (e, idx) => {
                                manager.updateCurrViewOption(idx)
                                viewOptionOpen = false
                            },
                        }}
                    />
                </div>
                <!-- Days of Week Header -->
                <div 
                    class="week-view__days-container"
                    class:scroll-bar-hidden={true}
                    on:pointerover={() => weekDaysElem.style.overflow = "hidden"}
                    bind:this={weekDaysElem}
                >
                    <div class="week-view__days">
                        {#if currWeekRoutine}
                            {#each daysInView as day, idx}
                                {@const dayKey   = manager.getDayIdx(day)}
                                {@const isLinked = isDayRoutinedLinked(currWeekRoutine, dayKey)}
                                <div 
                                    class="week-view__days-day"
                                    class:week-view__days-day--linked={isLinked}
                                >
                                    <div 
                                        class="week-view__days-header"
                                        class:week-view__days-header--active={dayBreakdownColIdx === idx && isDayBreakdownOpen}
                                        title={isLinked ? 
                                            "This routine is linked to a daily routine preset. Any changes to it will be reflected in every routine that is linked to it." : 
                                            ""
                                        }
                                    >
                                        <button 
                                            id={`day-breakdown--${idx}--dropdown-btn`}
                                            class="week-view__days-dropdown-btn" 
                                            on:click={() => setDayBreakdownView(idx)}
                                        >
                                            <div class="week-view__days-day-linked-indicator"></div>
                                            {#if containerWidth < DAYS_MIN_VIEW_MAX_WIDTH}
                                                {day.substring(0, 3)}
                                            {:else}
                                                {day}s
                                            {/if}
                                            <div class="week-view__days-header-arrow">
                                                <SvgIcon 
                                                    icon={Icon.Dropdown}
                                                    options={{
                                                        scale: 1.1, height: 12, width: 12, strokeWidth: 1.4, opacity: 0.3
                                                    }}
                                                />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
            <!-- Scrollable Board -->
            <div 
                class="week-view__board"
                style:--wk-board-pad-bottom={`${WK_BOARD_PAD_BOTTOM}px`}
            >
                <div 
                    on:scroll={onBoardScroll}
                    bind:this={scrollableContainer}
                    class="routine-blocks-container" 
                    class:routine-blocks-container--light={isLightTheme}
                    class:routine-blocks-container--no-scroll={lockInteraction}
                    class:routine-blocks-container--ns-resize={editContext?.includes("stretch")}
                >
                    <!-- Blocks Wrapper -->
                    <div 
                        class="week-view__blocks-wrapper"
                        on:pointermove={(e) => { 
                            if (lockInteraction) return
                            manager.onBlocksContainerPointerMove(e)
                        }}
                        bind:clientWidth={weekViewWidth}
                        bind:this={scrollableContent}
                        >
                        <div 
                            id={manager.ROUTINE_BLOCKS_CONTAINER_ID}    
                            on:contextmenu={(e) => {
                                if (editContext === "lift") e.preventDefault()
                            }}
                            on:pointerdown={manager.onTimeBoxMouseDown}
                            class="routine-blocks"
                            class:routine-blocks--editing={editContext}
                            class:routine-blocks--light={false}
                            class:no-pointer-events={lockInteraction}
                            style:--block-max-width={`${currViewOption === ViewOption.MTWT ? "190px" : "240px"}`}
                            style:--block-width={`${
                                currViewOption === ViewOption.Today ? 
                                "50%" : 
                                `calc((100% / ${daysInView.length}) - 15px)`
                            }`}
                        >
                            <!-- Routine Blocks -->
                            {#each daysInView as day, dayIdx}
                                {@const dayKey = manager.getDayIdx(day)}
    
                                {#each currWeekRoutineElems[dayKey] as block (block.id)}
                                    {@const colorTrio    = getColorTrio(block.color, isLightTheme)}
                                    {@const startTimeStr = minsFromStartToHHMM(block.startTime)}
                                    {@const endTimeStr   = minsFromStartToHHMM(block.endTime)}
                                    {@const xOffset      = `calc(((100% / ${daysInView.length}) * ${dayIdx}) + ${2}px)`}
                                    {@const isEditBlock  = editingBlock?.id === block.id && (["old-stretch", "lift"].includes(editContext ?? ""))}
    
                                    <div 
                                        id={block.id}
                                        class={`routine-blocks__block ${getBlockStyling(block.height)}`}
                                        class:hidden={isEditBlock}
                                        class:no-pointer-events={lockInteraction}
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
                                {@const colorTrio    = getColorTrio(editingBlock.color, isLightTheme)}
                                {@const startTimeStr = minsFromStartToHHMM(editingBlock.startTime)}
                                {@const endTimeStr   = minsFromStartToHHMM(editingBlock.endTime)}
                                {@const isLift       = editContext === "lift"}
            
                                <div 
                                    class={`routine-blocks__block ${getBlockStyling(editingBlock.height)}`}
                                    class:routine-blocks__block--wk-floating={isLift}
                                    class:no-pointer-events={lockInteraction}
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
                            {#if editingBlock && editingBlock.dropArea && editContext === "lift"}
                                {@const colorTrio = getColorTrio(editingBlock.color, isLightTheme)}
                                {@const startTimeStr = minsFromStartToHHMM(editingBlock.startTime)}
                                {@const endTimeStr = minsFromStartToHHMM(editingBlock.endTime)}
                                {@const { top, offsetIdx } = editingBlock.dropArea}
                                {@const xOffset = `calc(((100% / ${daysInView.length}) * ${offsetIdx}))`}
            
                                <div 
                                    class={`routine-blocks__block ${getBlockStyling(editingBlock.height)}`}
                                    class:routine-blocks__block--drop-area={true}
                                    class:routine-blocks__block--wk-drop-area={true}
                                    class:no-pointer-events={lockInteraction}
                                    id="drop-area-block"
                                    style:top={`${top}px`}
                                    style:left={xOffset}
                                    style:width={`calc((100% / ${daysInView.length}))`}
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

                            <!-- Current Day / Time Indicator  -->
                            {#if 
                                currViewOption === ViewOption.Today || currViewOption === ViewOption.Weekly || 
                                currViewOption === ViewOption.MTWT && currTime.dayIdx < 4 ||
                                currViewOption === ViewOption.FSS && currTime.dayIdx >= 4
                            }
                                {@const offsetIdx = 
                                    currViewOption === ViewOption.FSS ? 
                                    currTime.dayIdx - 4 :
                                    currViewOption === ViewOption.Today ? 
                                    0 :
                                    currTime.dayIdx
                                }

                                <div 
                                    class="now-line"
                                    style:top={`calc((${currTime.minutes / 1440} * 100%) + 2px)`}
                                    style:left={`calc(((100% / ${daysInView.length}) * ${offsetIdx} + 0px)`}
                                    style:width={`calc((100% / ${daysInView.length}) + 0.5px)`}
                                >
                                    <div class="now-line__content"></div>
                                </div>
                            {/if}
                        </div>
    
                        <!-- Grid Lines -->
                        <div 
                            class="wk-grid"
                            class:wk-grid--light={isLightTheme}
                        >
                            <div class="wk-grid__hoz-lines">
                                {#if scrollableContent}
                                    {@const width = weekViewWidth}
                                    {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                                        {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                                        {@const height         = (60 / 1440) * 100}
                                        <div 
                                            class="wk-grid__hoz-line"
                                            class:hidden={timeIdx === 0}
                                            style:top={`calc(${headOffsetPerc}% - 2px)`}
                                            style:height={`${height}%`}
                                        >
                                            <div class="wk-grid__hoz-line-content">
                                                <svg xmlns="http://www.w3.org/2000/svg" {width} height="2" viewBox="0" fill="none">
                                                    <path d={`M0 1H ${width}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                                </svg>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                            <div class="wk-grid__vert-lines">
                                {#if scrollableContent}
                                    {@const height = scrollableContent.scrollHeight - WK_BOARD_PAD_BOTTOM }
                                    {@const TOP_OFFSET = 2}
                                    {#each Array.from({ length: daysInView.length }, (_, i) => i) as dayIdx}
                                        <div 
                                            class="wk-grid__vert-line"
                                            style:height={`${height + TOP_OFFSET}px`}
                                            style:top={`-${TOP_OFFSET}px`}
                                            style:left={`calc(((100% / ${daysInView.length}) * ${dayIdx}) + ${0}px)`}
                                            >
                                            <div class="wk-grid__vert-line-content">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="2" {height} viewBox="0" fill="none">
                                                    <path d={`M1 ${height}L1 1`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                                </svg>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>

                        <!-- Block Context Menu -->
                        <DropdownList
                            id={"daily-routines"}
                            isHidden={!isContextMenuOpen}
                            options={{
                                styling: { width: "140px" },
                                listItems: EDIT_BLOCK_OPTIONS,
                                onListItemClicked: onContextMenuOptClicked,
                                onClickOutside:() => { 
                                    isContextMenuOpen = false
                                },
                                onDismount: () => {
                                    const isEditModalOpen = editContext === "details"
                                    manager.closeContextMenu(isEditModalOpen || colorsOpen)
                                },
                                position: { 
                                    top: contextMenuPos.top + "px", 
                                    left: contextMenuPos.left + "px" 
                                }
                            }}
                        />
                        <!-- Color Picker -->
                        <ColorPicker 
                            isActive={colorsOpen}
                            position={{ 
                                top: `${colorsPos?.top}px`, left: `${colorsPos?.left}px` 
                            }}
                            chosenColor={editingBlock?.color}
                            onChoose={(color) => {
                                colorsOpen = false
                                manager.changeEditBlockColor(color)
                                manager.resetEditState()
                            }}
                            onClickOutside={() => {
                                manager.changeEditBlockColor(null)
                                manager.resetEditState()
                                colorsOpen = false
                            }}
                        />
                    </div>
                </div>
                <!-- Hour Blocks -->
                <div 
                    class="hour-blocks-container" 
                    class:scroll-bar-hidden={true}
                    on:pointerover={() => hourBlocksElem.style.overflow = "hidden"}
                    bind:this={hourBlocksElem} 
                    >
                    <div class="hour-blocks-wrapper">
                        <div 
                            class="hour-blocks"
                            class:hour-blocks--light={isLightTheme}
                        >
                            {#if containerWidth > 0}
                                {#each Array.from({ length: 23 }, (_, i) => i + 1) as timeIdx}
                                    {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                                    {@const height         = (60 / 1440) * 100}
                                    <div 
                                        class="hour-blocks__block"
                                        style:top={`calc(${headOffsetPerc}% - 3px)`}
                                        style:height={`${height}%`}
                                    >
                                        <span>{getTimeFromIdx(timeIdx, true)}</span>
                                        <div class="hour-blocks__block-vert-divider">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="2" height=28 viewBox="0 0 2 28" fill="none">
                                                <path d="M1.25684 0.614746V 32.5" stroke-width="0.9" stroke-dasharray="2 2"/>
                                            </svg>
                                        </div>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                    </div>
                </div>
                <!-- Day Breakdown Dropdown  -->
                <BounceFade
                    id="day-breakdown--dropdown-menu"
                    isHidden={!isDayBreakdownOpen}
                    position={{ top: "-6px", left: breakdownDropdownXOffset }}
                    onClickOutside={() => isDayBreakdownOpen = false}
                    onDismount={closeDayBreakdown}
                >
                    {@const isLinked = dayBreakdown?.linkedRoutine != null}
                    <div 
                        class="week-view__day-breakdown dropdown-menu"
                        style:width={`${DAY_DROPDOWN_WIDTH}px`}
                    >
                        <!-- Header -->
                        <div class="week-view__day-breakdown-day">
                            {dayBreakdown?.day}
                        </div>
                        <button 
                            class="week-view__day-breakdown-settings-btn dropdown-btn"
                            class:dropdown-btn--dark={!isLightTheme}
                            id={"day-breakdown--dropdown-btn"}
                            title={`${
                                isLinked ? 
                                "Unlink daily routine preset." : 
                                "Link to a daily preset routine for this day."
                            }`}
                            on:click={() => onLinkBtnClicked(isLinked)}
                        >
                            {#if isLinked}
                                <i class="fa-solid fa-link-slash"></i>
                            {:else}
                                <i class="fa-solid fa-link"></i>
                            {/if}
                        </button>
                        <!-- Title + Description -->
                        {#if dayBreakdown?.linkedRoutine}
                            <div class="routine__details">
                                <h3 class="routine__title">
                                    {dayBreakdown?.linkedRoutine.name}
                                </h3>
                                <p class="routine__description">
                                    {dayBreakdown?.linkedRoutine.description}
                                </p>
                            </div>
                        {/if}
                        <!-- Breakdown -->
                        <div class="routine__breakdown-header">
                            <DropdownBtn 
                                id={"weekly-routine-breakdown"}
                                isActive={isDayBreakdownViewOptOpen}
                                options={{
                                    noBg: true,
                                    onClick: () => isDayBreakdownViewOptOpen = !isDayBreakdownViewOptOpen,
                                    pickedOptionName: selectedTimeFrame,
                                    styles: { fontSize: "1.3rem", padding: "4px 12px 4px 11px", margin: "0px 0px 0px -10px" }
                                }} 
                            />
                            <div class="routine__breakdown-options">
                                <button 
                                    class="routine__breakdown-options-btn" 
                                    class:full-opacity={isDayBreakdownAvg}
                                    on:click={() => isDayBreakdownAvg = true}
                                >
                                    Avg
                                </button>
                                <button 
                                    class="routine__breakdown-options-btn" 
                                    class:full-opacity={!isDayBreakdownAvg}
                                    on:click={() => isDayBreakdownAvg = false}
                                >
                                    Total
                                </button>
                            </div>
                            <DropdownList 
                                id={"weekly-routine-breakdown-option"}
                                isHidden={!isDayBreakdownViewOptOpen} 
                                options={{
                                    listItems: [{ name: "Cores" }, { name: "Tag" }],
                                    pickedItemIdx: pickedDayBreakdownView,
                                    position: { top: "30px", left: "-10px" },
                                    styling: { width: "80px" },
                                    onListItemClicked: (e, idx) => setDayBreakdownViewOptn(idx),
                                    onClickOutside: () => isDayBreakdownViewOptOpen = false
                                }}
                            />
                        </div>
                        <!-- Cores -->
                        <div class="routine__core-breakdown" class:hide={!dayBreakdownIsCore}>
                            <div class="routine__cores">
                                {#if currCores}
                                    <div class="routine__cores-col">
                                        <div class="routine__cores-core">
                                            <div class="routine__cores-title">Sleeping</div>
                                            <div class="routine__cores-value">
                                                {minsToHHMM(currCores.sleeping[dayBreakdownOpt])}
                                            </div>
                                        </div>
                                        <div class="routine__cores-core">
                                            <div class="routine__cores-title">Awake</div>
                                            <div class="routine__cores-value">
                                                {minsToHHMM(currCores.awake[dayBreakdownOpt])}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="routine__cores-col-divider"></div>
                                    <div class="routine__cores-col">
                                        <div class="routine__cores-core">
                                            <div class="routine__cores-title">Working</div>
                                            <div class="routine__cores-value">
                                                {minsToHHMM(currCores.working[dayBreakdownOpt])}
                                            </div>
                                        </div>
                                        <div class="routine__cores-core">
                                            <div class="routine__cores-title">Self-Care</div>
                                            <div class="routine__cores-value">
                                                {minsToHHMM(currCores.selfCare[dayBreakdownOpt])}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="routine__cores-col-divider"></div>
                                    <div class="routine__cores-col">
                                        <div class="routine__cores-core">
                                            <div class="routine__cores-title">Mind</div>
                                            <div class="routine__cores-value">
                                                {minsToHHMM(currCores.mind[dayBreakdownOpt])}
                                            </div>
                                        </div>
                                        <div class="routine__cores-core">
                                            <div class="routine__cores-title">Body</div>
                                            <div class="routine__cores-value">
                                                {minsToHHMM(currCores.body[dayBreakdownOpt])}
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <!-- Tag Breakdown -->
                        <div class="routine__tag-breakdown" class:hide={dayBreakdownIsCore}>
                            {#each tagBreakdown as tagData}
                                {@const colorTrio = getColorTrio(tagData.tag.symbol.color, !isLightTheme)}
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
                                        {#if dayBreakdownOpt === "avgTime"}
                                            {minsToHHMM(tagData.data.avgTime)}
                                        {:else}
                                            {minsToHHMM(tagData.data.totalTime)}
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <!-- Settings Dropdown -->
                        <DropdownList 
                            id={"day-breakdown"}
                            isHidden={!dailyRoutinesListOpen} 
                            options={{
                                listItems: [{ name: "Routine 1.0" }, { name: "Routine 2.0" }],
                                position: { top: "30px", right: "0px" },
                                onListItemClicked: (e, idx) => onDailyRoutinesListOptClicked(idx),
                                onClickOutside: () => dailyRoutinesListOpen = false
                            }}
                        />
                    </div>
                </BounceFade>
            </div>
        </div>
    </div>
</div>

{#if editContext === "details" && editingBlock}
    <EditBlockModal block={editingBlock} routineManager={manager} />
{/if}

{#if isDeleteWkRoutineConfirmOpen} 
    <ConfirmationModal 
        text="Are you sure you want to proceed with deleting this weekly routine?"
        onCancel={() => { 
            isDeleteWkRoutineConfirmOpen = false
            editWkRoutineIdx = -1
        }}
        onOk={onDeleteWkEditRoutineItem}
        options={{ ok: "Delete", caption: "Heads Up!", type: "delete" }}
    /> 
{/if}

{#if openNewRoutineModal}
    <NewRoutineModal 
        onFinishEdit={onFinishNewWeekRoutineEdit}
        isForWeek={true}
        bounds={{ 
            titleMax: 200, descrMax: 300
        }}
    />
{/if}


<style lang="scss">
    @import "../../../../scss/dropdown.scss";
    @import "../../../../scss/day-box.scss";
    @import "../../../../scss/inputs.scss";
    @import "../../../../scss/components/routines.scss";

    $hr-col-height: 50px;
    $hr-col-width: 60px;
    $hr-col-width--min: 40px;

    .routine {
        height: 100%;
        display: flex;

        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        /* Light Mode */
        &--light &__details-chosen-routine {
            @include text-style(0.4, 500);
        }
        &--light &__breakdown {
            @include txt-color(0.028, "bg");
        }
        &--light &__breakdown-cores-title {
            @include text-style(1, 600);
        }
        &--light &__wk-routines-item:hover {
            @include txt-color(0.04, "bg");
        }
        &--light &__wk-routines-item:hover span {
            @include text-style(1);
        }
        &--light &__wk-routines-item span {
            @include text-style(0.55, 500);
        }
        &--light &__wk-routines-item--clicked {
            background-color: rgba(var(--textColor1), 0.04) !important;
        }
        &--light &__wk-routines-item--clicked span {
            color: rgba(var(--textColor1), 1) !important;
        }
        &--light &__wk-routines-item--chosen i {
            opacity: 0.8;
        }
        &--light &__wk-routines-count {
            @include text-style(0.3, 500);
        }
        &--light &__week {
            border-left: 1px solid rgba(var(--textColor1), 0.08);
        }

        /* Narrow View */
        &--narrow {
            display: block;
        }
        &--narrow &__details {
            width: 100%;
            height: auto;
            margin-bottom: 16px;
        }
        &--narrow &__details-container {
            width: calc(100% - 22px);
        }
        &--narrow &__details h2 {
            margin-bottom: 0px;
        }
        &--narrow  &__details-container &__core-breakdown {
            width: 100%;
            margin: 0px 0px 0px 0px;
        }
        &--narrow &__details-container &__breakdown {
            width: 100%;
            width: 100%;
            padding-top: 6px;
        }
        &--narrow &__title {
            max-height: 22px;
            @include multi-line-elipses-overflow(1);
        }
        &--narrow &__description {
            @include multi-line-elipses-overflow(1);
            max-height: 21px;
            margin: 5px 0px 0px 0px;
            overflow: hidden;
        }
        &--narrow &__breakdown {
            margin-left: -10px;
            width: calc(100% + 10px) !important;
            // display: none;
        }
        &--narrow &__breakdown-header {
            margin-bottom: 5px;
        }
        &--narrow &__details-container &__cores {
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
        &--narrow &__details-chosen-routine {
            margin-bottom: 2px;
        }
        &--narrow &__week {
            margin-top: 11px;
            height: calc(100% - 245px);
            width: 100%;
            border-color: transparent;
        }
        &--narrow &__details &__tag-breakdown {
            display: none;
        }
        &--narrow &__wk-routines {
            @include abs-top-right(11px, -12px);
            width: 120px;
            margin: 0px;
            height: auto;
        }
        &--narrow &__wk-routines-count {
            display: none;
        }
        &--narrow &__wk-routines-left {
            flex-direction: row-reverse;

            button {
                margin-right: 10px;
            }
        }
        &--narrow &__wk-routines-header {
            flex-direction: row-reverse;
            padding: 0px;
        }
        &--narrow &__wk-routines-item {
            margin: 0px 0px 2px 0px;
            padding-left: 9px;
        }
        &--narrow &__wk-routines-list {
            width: 180px;
            margin-left: -80px;
            max-height: 300px;
            padding: 8px 8px 5px 6px;
            border-radius: 18px;
            height: auto;
        }
        &--narrow .week-view__view-options {
            width: $hr-col-width--min;
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
            width: $hr-col-width--min;

            &__block {
                left: -8px;
            }
        }
        &--narrow .routine-blocks-container {
            margin-left: $hr-col-width--min;
        }
        &__details-container {
            padding-top: 11px;
            width: 280px;
            position: relative;
        }
        &__details {
            margin-bottom: 10px;
            position: relative;
            width: 90%;
        }
        &__details-chosen-routine {
            @include text-style(0.2, 400, 1.2rem, "DM Sans");
            margin-bottom: 5px;
        }

        /* Title + Description */
        &__title {
            font-size: 2.15rem;
            max-height: 120px;
        }
        &__description {
            margin-top: 2px;
            max-height: 120px;
            padding: 4px 4px 4px 0px;
        }

        /* Tag + Core Breakdowns */
        &__breakdown {
            width: 90%;
            margin-left: -6px;
            padding: 7px 20px 8px 15px;
            border-radius: 14px;
            border: 1px solid rgba(var(--textColor1), 0.02);
            @include txt-color(0.013, "bg");
        }
        &__breakdown-cores-title {
            padding: 4px 12px 4px 11px;
            margin: 0px 0px 0px -10px;
            @include text-style(0.85, 400, 1.3rem);
        }
        &__tag-breakdown .tag {
            margin-left: -2px;
        }

        /* Week Routines List */
        &__wk-routines {
            margin: 22px 0px 0px -7px;
            width: 95%;
            font-family: "DM Sans";
            position: relative;
            height: var(--routines-height);
        }
        &__wk-routines-count {
            @include text-style(0.2, 400, 1.3rem);
        }
        &__wk-routines-left {
            @include flex(center);

            &:hover button {
                visibility: visible;
                opacity: 0.3;
            }
        }
        &__wk-routines-add-btn {
            visibility: hidden;
            transition: 0.1s ease-in-out;
            opacity: 0;

            &:hover {
                opacity: 0.88 !important;
            }
            &:active {
                transform: scale(0.94);
            }
        }
        &__wk-routines-header {
            @include flex(center, space-between);
            margin-bottom: 7px;
            padding-right: 14px;
        }
        &__wk-routines-list {
            z-index: 2000;
            overflow-y: scroll;
            padding-right: 11px;
            max-height: var(--routines-dropdown-max-height);
        }
        &__wk-routines-item {
            padding: 6px 12px 6px 13px;
            border-radius: 10px;
            margin: 0px 0px 4px 9px;
            position: relative;
            outline: none;
            @include flex(center, space-between);
            
            &:hover {
                transition: 0s;
                cursor: pointer;
                @include txt-color(0.01, "bg");
            }
            &:hover span {
                @include text-style(0.75);
            }
            &:active {
                transition: 0.15s cubic-bezier(.4,0,.2,1);
                transform: scale(0.98);
            }
            span {
                @include multi-line-elipses-overflow(1);
                word-wrap: break-word;
                @include text-style(0.2, 300, 1.25rem);
            }
            i {
                display: none;
                font-size: 1rem;
                opacity: 0.8;
                color: rgba(var(--textColor1), 1);
            }
            &--clicked {
                background-color: rgba(var(--textColor1), 0.024) !important;
            }
            &--clicked span {
                color: rgba(var(--textColor1), 0.8) !important;
            }
            &--chosen i {
                opacity: 0.3;
                display: block;
            }
        }

        /* Week View */
        &__week {
            height: calc(100% - 55px);
            width: calc(100% - 280px);
            border-left: 1px solid rgba(var(--textColor1), 0.04);
            overflow: hidden;
            position: relative;
        }
    }

    /* Week View */
    .week-view {
        width: 100%;
        position: relative;
        height: 100%;
        @include abs-top-left;

        &--light &__view-options-dropdown-btn {
            @include text-style(0.4, 500);
        }
        &--light &__view-options-dropdown-btn:hover {
            @include text-style(0.7);
        }
        &--light &__header {
            border-bottom: 1px solid rgba(var(--textColor1), 0.08);
        }
        &--light &__days-dropdown-btn {
            @include text-style(0.82, 500);
        }
        &--light &__day-breakdown-day {
            @include text-style(0.58, 500);
        }
        &--light &__day-breakdown .routine__description {
            @include text-style(0.35, 400);
        }
        &--light &__day-breakdown .routine__breakdown-header {
            margin-bottom: 12px;
        }
        &--light &__day-breakdown .routine__cores-title {
            @include text-style(0.94);
        }

        &__header {
            width: 100%;
            height: 43px;
            border-bottom: 1px solid rgba(var(--textColor1), 0.04);
            position: relative;
            @include flex(center);
        }

        /* View Options */
        &__view-options {
            width: $hr-col-width;
            position: relative;
            @include center;

            &:hover i, &--open i {
                visibility: visible !important;
                opacity: 0.5 !important;
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
                @include abs-top-right(4px, -12px);
                font-size: 0.75rem;
            }
        }
        
        /* Days of the Week */
        &__days-container {
            width: calc(100% - $hr-col-width);
            padding: 8px 0px 10px 0px;
        }
        &__days {
            @include flex(_, space-between);
            min-width: var(--min-width);
        }
        &__days-day {
            width: calc((100% / var(--days-length)));
            position: relative;
            @include center;

            &--linked &-linked-indicator {
                opacity: 1;
            }
            &:hover &-day-settings-btn {
                @include visible;
            }
        }
        &__days-day-linked-indicator {
            @include abs-top-left(7px, -10px);
            @include circle(2.5px);
            @include txt-color(0.2, "bg");
            opacity: 0;
        }
        &__days-header {
            height: 25px;
            width: 100%;
            position: relative;
            @include center;

            &:hover &-arrow, &--active &-arrow {
                opacity: 0.6 !important;
                visibility: visible;
            }
            &--active &-arrow {
                transform: rotate(-180deg);
            }
        }
        &__days-dropdown-btn {
            position: relative;
            @include text-style(0.8, 400, 1.2rem, "DM Sans");
            
            &:active {
                transform: scale(0.985);
            }
        }
        &__days-header-arrow {
            @include abs-top-right(-4px, -23px);
            @include not-visible;
            @include center;
            transition: 0.1s ease-in-out;
            transform-origin: center;
            transform: rotate(0deg);
            transition: 0.15s cubic-bezier(.4,0,.2,1);
            padding: 6px;
            font-size: 0.8rem;

            &:hover {
                opacity: 1 !important;
            }
        }

        /* Day Breakdown */
        &__day-breakdown {
            position: absolute;
            padding: 9px 15px 10px 15px;
            border-radius: 12px;
        }
        &__day-breakdown-settings-btn {
            @include abs-top-right(5px, 8px);
            @include circle(22px);
            @include center;
            padding: 0px;
            opacity: 0.3;

            &:hover {
                opacity: 1;
            }
        }
        &__day-breakdown-day {
            @include text-style(0.2, 300, 1.2rem, "DM Sans");
            margin-bottom: 5px;
        }
        &__day-breakdown .routine__breakdown-header {
            margin-bottom: 9px;
        }
        &__day-breakdown .routine__details {
            width: 100%;
            margin-bottom: 11px;
        }
        &__day-breakdown .routine__title {
            width: 100%;
            font-size: 1.5rem;
            margin-bottom: -2px;
            @include multi-line-elipses-overflow(2);
        }
        &__day-breakdown .routine__description {
            width: 100%;
            font-size: 1.34rem;
            @include multi-line-elipses-overflow(2);
        }

        /* Main Content */
        &__board {
            position: relative;
            height: 100%;
        }
        &__blocks-wrapper {
            min-width: var(--min-width);
            position: relative;
            height: calc(($hr-col-height * 24) + var(--wk-board-pad-bottom));
            padding-bottom: var(--wk-board-pad-bottom);
        }
    }
    .routine-blocks-container {
        position: relative;
        margin-left: $hr-col-width;
        overflow: scroll;
        height: calc(100% - 85px);
    }
    .routine-blocks {
        @include abs-top-left;
        z-index: 0;

        &__block {
            width: var(--block-width);
            max-width: var(--block-max-width);
        }
    }
    .wk-grid {
        margin-top: 0px;  // top hoz line is hidden, hide the space where it's at
        z-index: -1;
    }
    .hour-blocks {
        height: calc($hr-col-height * 24);
        width: $hr-col-width;

        &-container {
            overflow: hidden;
            height: calc(100% - 50px);
            @include abs-top-left(0px, 1px);
        }
        &-wrapper {
            padding-bottom: var(--wk-board-pad-bottom);
        }
        &__blocks {
            height: calc($hr-col-height * 24);
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

