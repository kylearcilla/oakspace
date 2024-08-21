<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import { themeState, weekRoutine as setWeekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { getColorTrio, getElemById, getHozDistanceBetweenTwoElems, preventScroll } from "$lib/utils-general"
	import { InputManager, TextEditorManager } from "$lib/inputs"
	import { getDayIdxMinutes, getTimeFromIdx, minsFromStartToHHMM, minsToHHMM } from "$lib/utils-date"
	import { WeeklyRoutinesManager } from "$lib/routines-weekly-manager"
	import { 
            BreakdownView, EDIT_BLOCK_OPTIONS, ViewOption, formatCoreData, 
            getBlockStyling, isDayRoutinedLinked, ROUTINE_BLOCKS_CONTAINER_ID, 
			DAY_DROPDOWN_WIDTH,
			setDayBreakdownXOffset
    } from "$lib/utils-routines"
    
	import EditBlockModal from "../EditBlockModal.svelte"
	import NewRoutineModal from "../NewRoutineModal.svelte"
	import SvgIcon from "../../../../components/SVGIcon.svelte"
	import BounceFade from "../../../../components/BounceFade.svelte"
	import ColorPicker from "../../../../components/ColorPicker.svelte"
	import DropdownBtn from "../../../../components/DropdownBtn.svelte"
	import DropdownList from "../../../../components/DropdownList.svelte"
	import ConfirmationModal from "../../../../components/ConfirmationModal.svelte"
	import { SET_DAILY_ROUTINES } from "../../../../tests/routines/routines.data"
	import { RoutinesManager } from "$lib/routines-manager"

    export let data: { routines: WeeklyRoutine[] }

    const MIN_VIEW_MAX_WIDTH = 640
    const DAYS_MIN_VIEW_MAX_WIDTH = 1100
    const WK_ROUTINES_SETTINGS_DROPDOWN_WIDTH  = 140
    const INIT_SCROLL_TOP = 280
    
    const DAILY_ROUTINES: DailyRoutine[] = SET_DAILY_ROUTINES
    let WEEK_ROUTINES: WeeklyRoutine[] = data.routines

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
    let dailyRoutinestXOffset = -1

    let confirmOptions: {
        text: string,
        onCancel: FunctionParam,
        onOk: FunctionParam,
        options: ConfirmOptions,
    } | null = null
    
    // Weekly Routines
    let editWkRoutineIdx = -1
    let rightClickedWkRoutineItemIdx = -1
    let setWeekRoutineIdx = WEEK_ROUTINES.length > 0 ? 0 : -1
    let viewWkRoutineIdx = setWeekRoutineIdx

    let manager = new WeeklyRoutinesManager(WEEK_ROUTINES[setWeekRoutineIdx] ?? null)
    
    let isWkRoutinesOpen = true
    let isWkRoutineSettingsOpen = false
    let openNewRoutineModal = false
    let wkRoutineSettingsPos = { left: 0, top: 0 }

    // Focus Routine Breakdown
    let pickedBreakdownView = BreakdownView.Cores
    let isViewingCore = true
    let dayBreakdownDropdownOptions: DropdownOption[] = []
    let dailyRoutinesOpen = false
    let wkBreakdownVal: "avg" | "sum" = "avg"
    let dayBreakdownVal: "avg" | "sum" = "sum"
    
    // Week View
    let minuteInterval: NodeJS.Timeout | null = null
    let currTime = getDayIdxMinutes()

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
    let dayBreakdownSettingsOpen = false
    let breakdownDropdownXOffset = ""
    let isBreakdownDropdownOpen = false
    let hasSetEditPointerCapture = false

    // Stores
    let _weekRoutine      = manager.weekRoutine
    let _weekRoutineElems = manager.weekRoutineElems
    let _coreBreakdown    = manager.coreBreakdown
    let _tagBreakdown   = manager.tagBreakdown
    let _editingBlock   = manager.editingBlock
    let _editContext    = manager.editContext
    let _contextMenuPos = manager.contextMenuPos
    let _currViewOption = manager.currViewOption
    let _dayBreakdown   = manager.dayBreakdown

    let titleInput:  Writable<InputManager>
    let description: Writable<InputManager>
    
    $: weekRoutine       = $_weekRoutine
    $: weekRoutineElems  = $_weekRoutineElems as WeekBlockElems ?? []
    $: coreBreakdown     = $_coreBreakdown
    $: tagBreakdown      = $_tagBreakdown
    $: currViewOption    = $_currViewOption
    $: editContext       = $_editContext
    $: editingBlock      = $_editingBlock
    $: contextMenuPos    = $_contextMenuPos
    $: lockInteraction   = isContextMenuOpen || colorsOpen
    $: selectedTimeFrame = isViewingCore ? "Cores" : "Tags"
    $: dayBreakdown      = $_dayBreakdown
    
    $: initTextEditors(weekRoutine)

    $: isMin        = containerWidth < MIN_VIEW_MAX_WIDTH && containerWidth != 0
    $: isLightTheme = !$themeState.isDarkTheme

    $: detailsMaxHt = `calc(100% - ${routineDetailsHeight + breakdownHeight + 100}px)`
    $: blockWidth   = `${currViewOption === ViewOption.Today ? "50%" : `calc((100% / ${daysInView.length}) - 15px)`}`
    $: if (isMin) isWkRoutinesOpen = false
    
    _dayBreakdown.subscribe((data) => {
        if (!data) return
        
        breakdownDropdownXOffset = setDayBreakdownXOffset(dayBreakdownColIdx, daysInView.length)
    })
    _currViewOption.subscribe((newOptn) => {
        currViewOption = newOptn
        daysInView = manager.daysInView
    })

    function initTextEditors(weeklyRoutine: WeeklyRoutine | null) {
        if (!weeklyRoutine) return

        titleInput = (new TextEditorManager({ 
            initValue: weeklyRoutine.name,
            placeholder: "Routine Title",
            maxLength: RoutinesManager.MAX_TITLE,
            id: "routine-title",
            doAllowEmpty: false,
            handlers: {
                onBlurHandler: (e, val) => {
                    manager.updateTitle(val)
                    WEEK_ROUTINES = WEEK_ROUTINES.map((routine, idx) => idx != viewWkRoutineIdx ? routine : { ...routine!, name: val })
                }
            }
        })).state
        
        description = (new TextEditorManager({ 
            initValue: weeklyRoutine.description,
            placeholder: "Type description here...",
            maxLength: RoutinesManager.MAX_DESCRIPTION,
            id: "routine-description",
            handlers: {
                onBlurHandler: (e, val) => {
                    manager.updateDescription(val)
                    WEEK_ROUTINES = WEEK_ROUTINES.map((routine, idx) => idx != viewWkRoutineIdx ? routine : { ...routine!, description: val })
                }
            }
        })).state
    }

    /* User Week Routines */
    function setWkBreakdownView(viewOptnIdx: number) {
        pickedBreakdownView = viewOptnIdx
        isViewingCore = viewOptnIdx === BreakdownView.Cores
        isBreakdownDropdownOpen = false
    }
    function onWkRoutineContextMenu(e: Event, routineIdx: number) {
        if (editContext === "duplicate") manager.closeDuplicateEdit()

        const pe = e as PointerEvent
        pe.preventDefault()

        const container = wkRoutinesContainerRef
        const rect = container.getBoundingClientRect()
        const top  = pe.clientY - rect.top

        rightClickedWkRoutineItemIdx = routineIdx

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
        const isChosen = itemIdx === setWeekRoutineIdx

        if (optIdx === 0 && isChosen) {
            editWkRoutineIdx = -1
            setWeekRoutineIdx = -1

            setWeekRoutine.set(null)
        }
        else if (optIdx === 0) {
            editWkRoutineIdx = -1
            setWeekRoutineIdx = itemIdx

            setWeekRoutine.set(WEEK_ROUTINES[itemIdx])
        }
        else {
            confirmOptions = {
                text: "Are you sure you want to proceed with deleting this weekly routine?",
                onOk: onDeleteWkEditRoutineItem,
                onCancel: () => {
                    confirmOptions = null
                    editWkRoutineIdx = -1
                },
                options: { 
                    ok: "Delete", caption: "Heads Up!", type: "delete"  
                }
            }
        }

        isWkRoutinesOpen = !isMin
        isWkRoutineSettingsOpen = false
    }
    function onFinishNewWeekRoutineEdit(newRoutine: WeeklyRoutine | null) {
        openNewRoutineModal = false

        if (!newRoutine) return
        
        WEEK_ROUTINES.push(newRoutine)
        WEEK_ROUTINES = WEEK_ROUTINES

        if (WEEK_ROUTINES.length === 1) {
            onWkRoutineItemClicked(0)
        }
    }
    function onDeleteWkEditRoutineItem() {
        confirmOptions = null
        WEEK_ROUTINES = WEEK_ROUTINES.filter((_, routineIdx) => routineIdx != editWkRoutineIdx)

        if (setWeekRoutineIdx === editWkRoutineIdx) {
            setWeekRoutineIdx = -1
        }
        if (editWkRoutineIdx === viewWkRoutineIdx) {
            editWkRoutineIdx = -1
            viewWkRoutineIdx = -1

            manager.updateCurrentWeekRoutine(null)
            setWeekRoutine.set(null)
        }

        toast("success", { message: "Weekly routine deleted." })
    }
    function onWkRoutineItemClicked(routineIdx: number) {
        if (editContext === "duplicate")     manager.closeDuplicateEdit()
        if (routineIdx === viewWkRoutineIdx) return
        if (isMin) isWkRoutinesOpen = false
        
        viewWkRoutineIdx = routineIdx
        manager.updateCurrentWeekRoutine(WEEK_ROUTINES[routineIdx])
    }

    /* Edit Block */
    function onContextMenuOptClicked(idx: number) {
        if (idx === 0) {
            manager.openEditBlockModal()
        }
        else if (idx === 1) {
            colorsPos = manager.getColorPickerPos()
            colorsOpen = true
        }
        else if (idx === 2) {
            manager.onDuplicateBlock()
        }
        else {
            manager.deleteEditBlock()
            manager.resetEditState()
        }
        isContextMenuOpen = false
    }
    
    /* Daily Routines */
    function onDailyRoutinesListOptClicked(e: Event) {
        const target = e.target as HTMLElement
        const optnText = target.innerText.trim()

        const close = () => {
            dayBreakdownSettingsOpen = false
            confirmOptions = null
            isDayBreakdownOpen = false
            dailyRoutinesOpen = false
            manager.initDayRoutineBreakdown(null)
        }

        if (optnText === "Unlink routine") {
            confirmOptions = {
                text: "Are you sure?",
                onCancel: close,
                options: { 
                    ok: "Unlink", caption: "Heads Up!"
                },
                onOk: () => {
                    manager.unlinkSetDailyRoutine()
                    close()
                },
            }
        }
        else if (optnText === "Link Routine" || optnText === "Replace Routine") {
        }
        else if (optnText === "Clear routine") {
            confirmOptions = {
                text: "Are you sure?",
                onCancel: close,
                options: {  
                    ok: "Clear", caption: "Heads Up!"
                },
                onOk: () => {
                    manager.clearDayRoutine()
                    close()
                }
            }
        }
        else if (optnText === "Use template") {
        }
    }
    function onNewDayRoutineClicked(chooseContext: DropdownItemClickedContext) {
        const { parentName, idx } = chooseContext
        const close = () => {
            dayBreakdownSettingsOpen = false
            confirmOptions = null
            isDayBreakdownOpen = false
            dailyRoutinesOpen = false
            manager.initDayRoutineBreakdown(null)
        }

        const isEmpty = dayBreakdown!.blocksLength
        const chosenDayRoutine = DAILY_ROUTINES[idx]

        if (parentName === "Link a Routine" && isEmpty) {
            manager.linkDayRoutine(chosenDayRoutine)
            close()
        }
        else if (parentName === "Link a Routine") {
            confirmOptions = {
                text: "Are you sure? Doing this will replace your current routine.",
                onOk: () => {
                    manager.linkDayRoutine(chosenDayRoutine)
                    close()
                },
                onCancel: close,
                options: { 
                    ok: "Link a Routine", caption: "Heads Up!"  
                }
            }
        }
        else {
            confirmOptions = {
                text: "Are you sure? Doing this will replace your current routine.",
                onOk: () => {
                    manager.linkDayRoutine(chosenDayRoutine)
                    close()
                },
                onCancel: close,
                options: { 
                    ok: "Replace", caption: "Heads Up!"  
                }
            }
        }
    }

    /* Breakdowns */
    function setBreakdownForDay(dayIdx: number | null) {
        dayBreakdownSettingsOpen = false

        if (dayIdx === dayBreakdownColIdx) {
            isDayBreakdownOpen = false
        }
        else if (dayIdx != null) {
            dayBreakdownColIdx = dayIdx
            isDayBreakdownOpen = true
            manager.initDayRoutineBreakdown(dayIdx)
        }
    }

    function closeDayBreakdown() {
        manager.initDayRoutineBreakdown(null)
        dayBreakdownColIdx = -1
    }

    function setDayBreakdownOption(viewOptIdx: number) {
        pickedDayBreakdownView = viewOptIdx
        dayBreakdownIsCore = viewOptIdx === BreakdownView.Cores
        isDayBreakdownViewOptOpen = false
    }

    function onOpenDailyRoutinesList() {
        const settingsRef = getElemById("day-breakdown-settings--dropdown-menu")
        if (!settingsRef) return
        
        dailyRoutinesOpen = true
        const dist = getHozDistanceBetweenTwoElems({
            left: { elem: settingsRef, edge: "right" },
            right: { elem: scrollableContainer, edge: "right" },
        })
        
        if (dist >= 130) {
            dailyRoutinestXOffset = -120
        }
        else {
            dailyRoutinestXOffset = 145
        }
    }

    function onDayBreakdownSettingsClicked(isLinked: boolean) {
        if (isLinked) {
            dayBreakdownDropdownOptions = [
                { 
                    name: "Replace routine",
                    rightIcon: { type: "fa", icon: "fa-solid fa-chevron-right" },
                    onPointerOver: onOpenDailyRoutinesList,
                    onPointerLeave: () => dailyRoutinesOpen = false
                },
                { 
                    name: "Unlink routine", 
                } 
            ]
        }
        else {
            dayBreakdownDropdownOptions = [
                { 
                    name: "Link a routine", 
                    rightIcon: { type: "fa", icon: "fa-solid fa-chevron-right" },
                    onPointerOver: onOpenDailyRoutinesList,
                    onPointerLeave: () => dailyRoutinesOpen = false
                }
            ]
        }

        if (dayBreakdown!.blocksLength > 0)  {
            dayBreakdownDropdownOptions.push({ name: "Clear routine" })
        }
        else {
            dayBreakdownDropdownOptions = dayBreakdownDropdownOptions.filter((optn) => optn.name != "Clear routine")
        }

        dayBreakdownSettingsOpen = !dayBreakdownSettingsOpen
    }

    /* Edit Blocks */
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

    /* DOM Stuff */
    function onBoardScroll(e: Event) {
        const target = e.target as HTMLElement
        const { scrollTop, scrollLeft } = target
    
        hourBlocksElem.style.top = `-${scrollTop}px`
        weekDaysElem.style.left = `-${scrollLeft}px`
    }
    function onKeyPress(e: KeyboardEvent) {
        if (!manager) return

        viewOptionOpen = false
        manager.hotkeyHandler(e)
    }
    function initTestConfig() {
        const TEST_CONFIG = (window as any).LUCIOLE
        
        TEST_CONFIG.initTestData = (data: any[]) => {
            WEEK_ROUTINES = data
            setWeekRoutineIdx = data.length === 0 ? -1 : 0
            viewWkRoutineIdx  = data.length === 0 ? -1 : 0
            manager.updateCurrentWeekRoutine(WEEK_ROUTINES[0])
        }

        TEST_CONFIG.allowScroll = (allow: any) => {
            manager.toggleAutoScroll(allow)
        }
    }
    
    onMount(() => {
        scrollableContainer.scrollTop += INIT_SCROLL_TOP

        requestAnimationFrame(() => { 
            manager.initContainer(scrollableContainer, scrollableContent)
            manager.processWeeklyRoutine()
        })

        minuteInterval = setInterval(() => currTime = getDayIdxMinutes(), 1000)

        if (import.meta.env.MODE === "development") initTestConfig()
    })

    onDestroy(() => clearInterval(minuteInterval!))
</script>

<svelte:window on:keypress={onKeyPress} />

<div 
    class="routine" 
    class:routine--light={isLightTheme}
    class:routine--dark={!isLightTheme} 
    class:routine--narrow={isMin} 
    class:routine--empty={!weekRoutine} 
    style:--days-length={daysInView.length}
    bind:clientWidth={containerWidth}
>
    <!-- Routine Details -->
    <div class="routine__details-container">
        {#if weekRoutine}
            <!-- Title + Description -->
            <div class="routine__details" bind:clientHeight={routineDetailsHeight}>
                {#if setWeekRoutineIdx === viewWkRoutineIdx}
                    <div class="routine__details-chosen-routine">
                        Current
                    </div>
                {/if}
                {#if isMin}
                    <div class="routine__details-header">
                        <h1 class="routine__title">
                            {weekRoutine?.name}
                        </h1>
                    </div>
                    <h1 class="routine__description">
                        {weekRoutine?.description}
                    </h1>
                {:else}
                    <div class="routine__details-header">
                        <div 
                            id={$titleInput.id}
                            class="routine__title text-editor"
                            aria-label="Title"
                            data-unstyled
                            contenteditable
                            spellcheck="false"
                            data-placeholder={$titleInput.placeholder}
                            bind:textContent={$titleInput.value}
                            on:paste={(e) => $titleInput.onPaste(e)}
                            on:input={(e) => $titleInput.onInputHandler(e)}
                            on:focus={(e) => $titleInput.onFocusHandler(e)}
                            on:blur={(e)  => $titleInput.onBlurHandler(e)}
                        >
                        </div>
                    </div>
                    <div 
                        id={$description.id}
                        class="routine__description text-editor"
                        aria-label="Description"
                        data-unstyled
                        contenteditable
                        spellcheck="false"
                        data-placeholder={$description.placeholder}
                        bind:textContent={$description.value}
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
                <DropdownBtn 
                    id={"breakdown-option"}
                    isActive={isBreakdownDropdownOpen}
                    options={{
                        noBg: true,
                        pickedOptionName: selectedTimeFrame,
                        styles: { 
                            fontSize: "1.2rem", 
                            padding: "4px 12px 4px 11px", 
                            margin: "0px 0px 0px -10px",
                            borderRadius: "4px",
                            opacity: 1, 
                            fontFamily: "DM Mono"
                        },
                        onClick: () => { 
                            isBreakdownDropdownOpen = !isBreakdownDropdownOpen
                        },
                    }}
                />
                <div class="routine__breakdown-options">
                    <button 
                        class="routine__breakdown-options-btn" 
                        class:full-opacity={wkBreakdownVal === "avg"}
                        on:click={() => wkBreakdownVal = "avg"}
                    >
                        Avg
                    </button>
                    <button 
                        class="routine__breakdown-options-btn" 
                        class:full-opacity={wkBreakdownVal === "sum"}
                        on:click={() => wkBreakdownVal = "sum"}
                    >
                        Sum
                    </button>
                </div>
                <DropdownList 
                    id={"breakdown-option"}
                    isHidden={!isBreakdownDropdownOpen} 
                    options={{
                        listItems: [{ name: "Cores" }, { name: "Tags" }],
                        pickedItem: pickedBreakdownView,
                        position: { top: "26px", left: "-10px" },
                        styling:  { width: "80px" },
                        onClickOutside: () => { 
                            isBreakdownDropdownOpen = false
                        },
                        onListItemClicked: (context) => setWkBreakdownView(context.idx)
                    }}
                />
            </div>
            <!-- Cores -->
            {#if isViewingCore}
                <div class="routine__core-breakdown">
                    <div class="routine__cores">
                        {#if coreBreakdown}
                            {@const prop = wkBreakdownVal === "avg" ? "avgTime" : "totalTime"}
                            <div class="routine__cores-col">
                                <div class="routine__cores-core">
                                    <div class="routine__cores-title">Sleeping</div>
                                    <div class="routine__cores-value">
                                        {formatCoreData(coreBreakdown.sleeping[prop])}
                                    </div>
                                </div>
                                <div class="routine__cores-core">
                                    <div class="routine__cores-title">Awake</div>
                                    <div class="routine__cores-value">
                                        {formatCoreData(coreBreakdown.awake[prop])}
                                    </div>
                                </div>
                            </div>
                            <div class="routine__cores-col-divider"></div>
                            <div class="routine__cores-col">
                                <div class="routine__cores-core">
                                    <div class="routine__cores-title">Working</div>
                                    <div class="routine__cores-value">
                                        {formatCoreData(coreBreakdown.working[prop])}
                                    </div>
                                </div>
                                <div class="routine__cores-core">
                                    <div class="routine__cores-title">Self-Care</div>
                                    <div class="routine__cores-value">
                                        {formatCoreData(coreBreakdown.selfCare[prop])}
                                    </div>
                                </div>
                            </div>
                            <div class="routine__cores-col-divider"></div>
                            <div class="routine__cores-col">
                                <div class="routine__cores-core">
                                    <div class="routine__cores-title">Mind</div>
                                    <div class="routine__cores-value">
                                        {formatCoreData(coreBreakdown.mind[prop])}
                                    </div>
                                </div>
                                <div class="routine__cores-core">
                                    <div class="routine__cores-title">Body</div>
                                    <div class="routine__cores-value">
                                        {formatCoreData(coreBreakdown.body[prop])}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
            <!-- Tag Breakdown -->
            {#if !isViewingCore}
                <div class="routine__tag-breakdown">
                    {#if tagBreakdown.length > 0}
                        {#each tagBreakdown as tagData}
                            {@const data = tagData.data}
                            {@const colorTrio = getColorTrio(tagData.tag.symbol.color, isLightTheme)}
                            <div class="routine__tag-row">
                                <div 
                                    class="tag"
                                    class:tag--light={isLightTheme}
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
                                    {minsToHHMM(wkBreakdownVal === "avg" ? data.avgTime : data.totalTime)}
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <div class="routine__tag-breakdown-empty">
                            No Tags
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
        {/if}
        <!-- User Week Routines -->
        <div 
            class="routine__wk-routines"
            style:--routines-height={`${isMin || WEEK_ROUTINES.length === 0 ? "auto" : detailsMaxHt}`}
            bind:this={wkRoutinesContainerRef}
        >
            <div class="routine__wk-routines-header">
                <div class="routine__wk-routines-left">
                    {#key isMin}
                        <DropdownBtn
                            id="wk-routines-list"
                            isActive={isWkRoutinesOpen}
                            options={{
                                noBg: true,
                                arrowLeft: !isMin,
                                pickedOptionName: "Routines",
                                onClick: () => { 
                                    isWkRoutinesOpen = !isWkRoutinesOpen
                                    isWkRoutineSettingsOpen = false
                                },
                                styles: { 
                                    fontSize: "1.34rem", 
                                    fontFamily: "DM Sans",
                                    padding: "4px 2px 4px 11px", 
                                    margin: "0px 0px 0px -10px"
                                },
                                arrowStyles: { 
                                    margin: "0px 10px 0px 0px" 
                                }
                            }} 
                        />
                    {/key}
                    <button 
                        class="routine__wk-routines-add-btn"
                        on:click={() => openNewRoutineModal = true}
                    >
                        <SvgIcon icon={Icon.Add} options={{ scale: 1, strokeWidth: 1.7 }} />
                    </button>
                </div>
                <span class="routine__wk-routines-count">
                    {WEEK_ROUTINES.length}
                </span>
            </div>
            <!-- Week Routines List  -->
            <BounceFade
                id="wk-routines-list--dropdown-menu"
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
                            class:routine__wk-routines-item--clicked={idx === viewWkRoutineIdx}
                            class:routine__wk-routines-item--chosen={idx === setWeekRoutineIdx}
                            class:routine__wk-routines-item--active={idx === rightClickedWkRoutineItemIdx}
                            on:click={() => onWkRoutineItemClicked(idx)}
                            on:contextmenu={(e) => onWkRoutineContextMenu(e, idx)}
                            on:keydown={(e) => {
                                if (e.key === 'Enter' || e.code == "Space") {
                                    e.preventDefault()
                                    onWkRoutineItemClicked(idx);
                                }
                            }}
                        >
                            <span>{weekRoutine.name}</span>
                            <i class="fa-solid fa-check"></i>
                        </li>
                    {/each}
                    {#if WEEK_ROUTINES.length === 0}
                        <span class="routine__collection-empty">
                            Empty
                        </span>
                    {/if}
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
                                name: editWkRoutineIdx === setWeekRoutineIdx ? "Unselect Routine" : "Choose as Current" 
                            }]
                        },
                        {  name: "Delete Routine"  }
                    ],
                    onListItemClicked: (context) => {
                        onWkSettingsItemOptnClicked(editWkRoutineIdx, context.idx)
                        rightClickedWkRoutineItemIdx = -1
                    },
                    onClickOutside: () => {
                        isWkRoutineSettingsOpen = false
                        rightClickedWkRoutineItemIdx = -1
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
                        disabled={editContext === "duplicate" || editContext === "lift"}
                        on:click={() => viewOptionOpen = !viewOptionOpen}
                    >
                        <span>
                            {ViewOption[currViewOption]}
                        </span>
                    </button>
                    <DropdownList 
                        id="view-option"
                        isHidden={!viewOptionOpen} 
                        options={{
                            pickedItem: currViewOption,
                            listItems: [
                                { name: "Today", rightIcon: { type: "hotkey", icon: ["1"] } }, 
                                { name: "Weekly", rightIcon: { type: "hotkey", icon: ["2"] } }, 
                                { name: "M T W T", rightIcon: { type: "hotkey", icon: ["3"] } }, 
                                { name: "F S S", rightIcon: { type: "hotkey", icon: ["4"] } }
                            ],
                            position: { 
                                top: "22px", left: containerWidth < MIN_VIEW_MAX_WIDTH ? "0px" : "10px" 
                            },
                            styling: { 
                                width: "94px", zIndex: 2000 
                            },
                            onClickOutside: () => {
                                viewOptionOpen = false
                            },
                            onListItemClicked: (context) => {
                                manager.updateCurrViewOption(context.idx)
                                viewOptionOpen = false
                            },
                        }}
                    />
                </div>
                <!-- Days of Week Header -->
                <div 
                    class="week-view__days-container" 
                    on:scroll|preventDefault={preventScroll}
                >
                    <div class="week-view__days" bind:this={weekDaysElem}>
                        {#each daysInView as day, idx}
                            {@const dayKey   = manager.getDayKey(day)}
                            {@const isLinked = isDayRoutinedLinked(weekRoutine, dayKey)}
                            <div 
                                class="week-view__days-day"
                                class:week-view__days-day--linked={isLinked}
                            >
                                <div 
                                    class="week-view__days-header"
                                    class:week-view__days-header--active={dayBreakdownColIdx === idx && isDayBreakdownOpen}
                                    title={isLinked ? 
                                        "This routine is linked to a daily routine preset. Any changes to it will be reflected in every other routine that is linked to it." : 
                                        ""
                                    }
                                >
                                    <button 
                                        id={`day-breakdown--${idx}--dropdown-btn`}
                                        class="week-view__days-dropdown-btn" 
                                        disabled={!weekRoutine}
                                        on:click={() => setBreakdownForDay(idx)}
                                    >
                                        <div class="week-view__days-day-linked-indicator"></div>
                                            {#if containerWidth < DAYS_MIN_VIEW_MAX_WIDTH}
                                                {day.substring(0, 3)}
                                            {:else}
                                                {day}s
                                            {/if}
                                        {#if weekRoutine}
                                            <div class="week-view__days-header-arrow">
                                                <SvgIcon 
                                                    icon={Icon.Dropdown}
                                                    options={{
                                                        scale: 1.1, height: 12, width: 12, strokeWidth: 1.4, opacity: 0.3
                                                    }}
                                                />
                                            </div>
                                        {/if}
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
            <!-- Scrollable Board -->
            <div class="week-view__board">
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
                            id={ROUTINE_BLOCKS_CONTAINER_ID}    
                            on:pointerdown={manager.onScrollContainerPointerDown}
                            on:contextmenu={(e) => {
                                if (editContext === "lift") e.preventDefault()
                            }}
                            class="routine-blocks"
                            class:routine-blocks--editing={editContext}
                            class:routine-blocks--light={false}
                            class:no-pointer-events={lockInteraction || !weekRoutine}
                            style:--block-max-width={`${currViewOption === ViewOption.MTWT ? "190px" : "240px"}`}
                        >
                            <!-- Routine Blocks -->
                            {#each daysInView as day, dayIdx}
                                {@const dayKey = manager.getDayKey(day)}
    
                                {#each weekRoutineElems[dayKey] as block (block.id)}
                                    {@const colorTrio    = getColorTrio(block.color, isLightTheme)}
                                    {@const startTimeStr = minsFromStartToHHMM(block.startTime)}
                                    {@const endTimeStr   = minsFromStartToHHMM(block.endTime)}
                                    {@const xOffset      = `calc(((100% / ${daysInView.length}) * ${dayIdx}) + 2px)`}
                                    {@const isEditBlock  = editingBlock?.id === block.id && (["old-stretch", "lift"].includes(editContext ?? ""))}
                                    {@const isFirstLast  = ["first", "last"].includes(block.order ?? "")}
                                    {@const isFirst      = block.order === "first"}
    
                                    <div 
                                        id={block.id}
                                        role="button"
                                        tabIndex={0}
                                        class={`routine-blocks__block ${getBlockStyling(block.height)}`}
                                        class:hidden={isEditBlock}
                                        class:no-pointer-events={lockInteraction}
                                        style:top={`${block.yOffset}px`}
                                        style:left={xOffset}
                                        style:--block-height={`${block.height}px`}
                                        style:--block-color-1={colorTrio[0]}
                                        style:--block-color-2={colorTrio[1]}
                                        style:--block-color-3={colorTrio[2]}
                                        style:width={blockWidth}
                                        title={`${block.title} \n${startTimeStr} - ${endTimeStr}`}
                                        on:contextmenu={(e) => onBlockContextMenu(e, block.id)}
                                        on:pointerdown={(e) => {
                                            if (!isDayBreakdownOpen) {
                                                manager.onBlockPointerDown(e, block.id)
                                            }
                                        }}
                                        on:keydown={(e) => {
                                            if (e.key === 'Enter' || e.code === 'Space') {
                                                e.preventDefault()
                                                manager.toggleEditModal(block.id)
                                            }
                                        }}
                                    >
                                        <div class="routine-blocks__block-content">
                                            <div class="flx flx--algn-center">
                                                {#if isFirstLast}
                                                    {@const opacity = isLightTheme ? 0.8 : 0.5}
                                                    <div 
                                                        class="routine-blocks__block-order-icon"
                                                        title={`${isFirst ? "First routine of the day." : "Last routine of the day."}`}
                                                    >
                                                        <SvgIcon 
                                                            icon={isFirst ? Icon.Sun : Icon.Moon} 
                                                            options={{
                                                                height: 16, width: 16, opacity: 0.4, scale: 0.58, color: `rgba(${colorTrio[0]}, ${opacity})`
                                                            }}
                                                        />
                                                    </div>
                                                {/if}
                                                <span class="routine-blocks__block-title">
                                                    {block.title}
                                                </span>
                                            </div>
                                            <div class="routine-blocks__block-time-period">
                                                <span>{startTimeStr}</span>
                                                <span>-</span>
                                                <span>{endTimeStr}</span>
                                            </div>
                                            <div class="routine-blocks__block-spine"></div>
                                        </div>
                                    </div>
                                {/each}
                            {/each}

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
                                {@const TOP_OFFSET = -2}

                                <div 
                                    class="now-line"
                                    style:top={`calc(${(currTime.minutes / 1440) * 100}% - ${TOP_OFFSET}px)`}
                                    style:left={`calc(((100% / ${daysInView.length}) * ${offsetIdx} + 0px)`}
                                    style:width={`calc((100% / ${daysInView.length}) + 0.5px)`}
                                >
                                    <div class="now-line__content"></div>
                                </div>
                            {/if}
    
                            <!-- Floating Block or New Block  -->
                            {#if editingBlock}
                                {@const colorTrio    = getColorTrio(editingBlock.color, isLightTheme)}
                                {@const startTimeStr = minsFromStartToHHMM(editingBlock.startTime)}
                                {@const endTimeStr   = minsFromStartToHHMM(editingBlock.endTime)}
                                {@const xOffset      = manager.getEditBlockXOffset(editingBlock)}
                                {@const dropArea     = editingBlock.dropArea}
                                {@const isDragging   = editingBlock.isDragging}
                                {@const isFirstLast  = ["first", "last"].includes(editingBlock.order ?? "")}
                                {@const isFirst = editingBlock.order === "first"}
            
                                <div 
                                    class={`routine-blocks__block ${getBlockStyling(editingBlock.height)}`}
                                    class:routine-blocks__block--wk-floating={editContext === "lift"}
                                    class:routine-blocks__block--dup-floating={editContext === "duplicate"}
                                    class:no-pointer-events={lockInteraction}
                                    style:top={`${editingBlock.yOffset}px`}
                                    style:left={xOffset}
                                    style:--block-height={`${editingBlock.height}px`}
                                    style:--block-color-1={colorTrio[0]}
                                    style:--block-color-2={colorTrio[1]}
                                    style:--block-color-3={colorTrio[2]}
                                    style:width={blockWidth}
                                    style:z-index={2000}
                                    id="edit-block"
                                    on:pointerdown={onEditBlockPointerDown}
                                    on:contextmenu|preventDefault={() => {}}
                                >
                                    <div class="routine-blocks__block-content">
                                        <div class="flx flx--algn-center">
                                            {#if isFirstLast}
                                                {@const opacity = isLightTheme ? 0.8 : 0.5}
                                                <div 
                                                    class="routine-blocks__block-order-icon"
                                                    title={`${isFirst ? "First routine of the day." : "Last routine of the day."}`}
                                                >
                                                    <SvgIcon 
                                                        icon={isFirst ? Icon.Sun : Icon.Moon} 
                                                        options={{
                                                            height: 16, width: 16, opacity: 0.4, scale: 0.58, color: `rgba(${colorTrio[0]}, ${opacity})`
                                                        }}
                                                    />
                                                </div>
                                            {/if}
                                            <span class="routine-blocks__block-title">
                                                {editingBlock.title}
                                            </span>
                                        </div>
                                        <div class="routine-blocks__block-time-period">
                                            <span>{startTimeStr}</span>
                                            <span>-</span>
                                            <span>{endTimeStr}</span>
                                        </div>
                                        <div class="routine-blocks__block-spine"></div>
                                    </div>

                                    <!-- Confirm Buttons for Duplicate Edit -->
                                    {#if editContext === "duplicate" && !isDragging}
                                        {@const placement = manager.findDupBtnPlacement()}

                                        <div 
                                            class="routine-blocks__block-buttons"
                                            class:routine-blocks__block-buttons--left={placement === "left"}
                                            class:routine-blocks__block-buttons--right={placement === "right"}
                                            class:routine-blocks__block-buttons--top={placement === "top"}
                                            class:routine-blocks__block-buttons--bottom={placement === "bottom"}
                                        >
                                            {#if (dropArea?.offsetIdx ?? -1) >= 0}
                                                <button 
                                                    class="routine-blocks__dup-add"
                                                    on:click={() => manager.confirmDuplicate()}
                                                >
                                                    <i class="fa-solid fa-check"></i>
                                                </button>
                                            {/if}
                                            <button
                                                class="routine-blocks__dup-cancel"
                                                on:click={() => manager.closeDuplicateEdit()}
                                            >
                                                <SvgIcon 
                                                    icon={Icon.Close} 
                                                    options={{ scale: 0.84, strokeWidth: 1.8, width: 10, height: 10 }}
                                                />
                                            </button>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
            
                            <!-- Drop Area Block -->
                            {#if editingBlock?.dropArea?.doShow && (editContext === "lift" || editContext === "duplicate")}
                                {@const colorTrio = getColorTrio(editingBlock.color, isLightTheme)}
                                {@const startTimeStr = minsFromStartToHHMM(editingBlock.startTime)}
                                {@const endTimeStr = minsFromStartToHHMM(editingBlock.endTime)}
                                {@const { top, offsetIdx } = editingBlock.dropArea}
                                {@const xOffset = `calc(((100% / ${daysInView.length}) * ${offsetIdx}))`}
                                {@const width = `${currViewOption === ViewOption.Today ? "50%" : `calc((100% / ${daysInView.length}))`}`}
            
                                <div 
                                    class={`routine-blocks__block ${getBlockStyling(editingBlock.height)}`}
                                    class:routine-blocks__block--drop-area={true}
                                    class:routine-blocks__block--wk-drop-area={true}
                                    class:routine-blocks__block--wk-drop-area-light={isLightTheme}
                                    class:no-pointer-events={lockInteraction}
                                    id="drop-area-block"
                                    style:top={`${top}px`}
                                    style:left={xOffset}
                                    style:width={width}
                                    style:--block-max-width={`${currViewOption === ViewOption.Today ? "290px" : "none"}`}
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
                                            style:top={`calc(${headOffsetPerc}% - 1px)`}
                                            style:height={`${height}%`}
                                        >
                                            <div class="wk-grid__hoz-line-content">
                                                <svg xmlns="http://www.w3.org/2000/svg" {width} height="2" fill="none">
                                                    <path d={`M0 1H ${width}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                                </svg>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                            <div class="wk-grid__vert-lines">
                                {#if scrollableContent}
                                    {@const height = scrollableContent.scrollHeight}
                                    {#each Array.from({ length: daysInView.length }, (_, i) => i) as dayIdx}
                                        <div 
                                            class="wk-grid__vert-line"
                                            style:height={`${height + 2}px`}
                                            style:top={`-${2}px`}
                                            style:left={`calc(((100% / ${daysInView.length}) * ${dayIdx}) + ${0}px)`}
                                            >
                                            <div class="wk-grid__vert-line-content">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="2" {height} fill="none">
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
                                onListItemClicked: (context) => onContextMenuOptClicked(context.idx),
                                onClickOutside:() => { 
                                    isContextMenuOpen = false
                                },
                                onDismount: () => {
                                    manager.closeContextMenu(editContext === "details" || colorsOpen)
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
                                manager.setEditBlockColor(color)
                                manager.resetEditState()
                            }}
                            onClickOutside={() => {
                                manager.setEditBlockColor(null)
                                manager.resetEditState()
                                colorsOpen = false
                            }}
                        />
                    </div>
                </div>
                <!-- Hour Blocks -->
                <div class="hour-blocks-container" >
                    <div class="hour-blocks-wrapper">
                        <div 
                            class="hour-blocks"
                            bind:this={hourBlocksElem} 
                            class:hour-blocks--light={isLightTheme}
                        >
                            {#if containerWidth > 0}
                                {#each Array.from({ length: 23 }, (_, i) => i + 1) as timeIdx}
                                    {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                                    {@const height         = (60 / 1440) * 100}
                                    <div 
                                        class="hour-blocks__block"
                                        style:top={`calc(${headOffsetPerc}% - 1px)`}
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
                    onDismount={closeDayBreakdown}
                    position={{ 
                        top: "-6px", left: breakdownDropdownXOffset 
                    }}
                    onClickOutside={() => {
                        if (!confirmOptions) {
                            isDayBreakdownOpen = false
                        }
                    }}
                >
                    {@const isLinked = dayBreakdown?.linkedRoutine != null}
                    <div 
                        class="week-view__day-breakdown dropdown-menu"
                        class:week-view__day-breakdown--unlinked={!isLinked}
                        style:width={`${DAY_DROPDOWN_WIDTH}px`}
                    >
                        <!-- Header -->
                        <button 
                            class="week-view__day-breakdown-settings-btn"
                            id={"day-breakdown-settings--dropdown-btn"}
                            on:click={() => onDayBreakdownSettingsClicked(isLinked)}
                        >
                            <SvgIcon icon={Icon.Settings} options={{ scale: 0.88 }} />
                        </button>
                        <!-- Title + Description -->
                        {#if dayBreakdown?.linkedRoutine}
                            {@const { name, description } = dayBreakdown.linkedRoutine}
                            <div class="routine__details">
                                <h3 class="routine__title" title={name}>
                                    {name}
                                </h3>
                                <p class="routine__description" title={description}>
                                    {description}
                                </p>
                            </div>
                        {:else}
                            <span class="week-view__day-breakdown-unlinked">
                                Unlinked
                            </span>
                        {/if}
                        <!-- Breakdown -->
                        <div class="routine__breakdown-header">
                            <DropdownBtn 
                                id={"day-breakdown"}
                                isActive={isDayBreakdownViewOptOpen}
                                options={{
                                    noBg: true,
                                    pickedOptionName: BreakdownView[pickedDayBreakdownView],
                                    onClick: () => {
                                        isDayBreakdownViewOptOpen = !isDayBreakdownViewOptOpen
                                    },
                                    styles: { 
                                        fontSize: "1.2rem", 
                                        fontFamily: "DM Mono", 
                                        padding: "4px 12px 4px 11px", 
                                        margin: "0px 0px 0px -10px",
                                        borderRadius: "4px",
                                        opacity: 0.8
                                    }
                                }} 
                            />
                            <div class="routine__breakdown-options">
                                <button 
                                    class="routine__breakdown-options-btn" 
                                    class:full-opacity={dayBreakdownVal === "sum"}
                                    on:click={() => dayBreakdownVal = "sum"}
                                >
                                    Sum
                                </button>
                                <button 
                                    class="routine__breakdown-options-btn" 
                                    class:full-opacity={dayBreakdownVal === "avg"}
                                    on:click={() => dayBreakdownVal = "avg"}
                                >
                                    Avg
                                </button>
                            </div>
                            <DropdownList 
                                id={"day-breakdown"}
                                isHidden={!isDayBreakdownViewOptOpen} 
                                options={{
                                    listItems: [{ name: "Cores" }, { name: "Tags" }],
                                    pickedItem: pickedDayBreakdownView,
                                    position: { top: "26px", left: "-10px" },
                                    styling:  { width: "80px" },
                                    onClickOutside: () => {
                                        isDayBreakdownViewOptOpen = false
                                    },
                                    onListItemClicked: (context) => setDayBreakdownOption(context.idx),
                                }}
                            />
                        </div>

                        <!-- Settings Dropdown -->
                        <DropdownList 
                            id={"day-breakdown-settings"}
                            isHidden={!dayBreakdownSettingsOpen} 
                            options={{
                                listItems: dayBreakdownDropdownOptions,
                                position: { top: "35px", right: "10px"},
                                styling:  { width: "130px" },
                                childId: "daily-routine",
                                onListItemClicked: (context) => onDailyRoutinesListOptClicked(context.event),
                                onClickOutside: () => dayBreakdownSettingsOpen = false
                            }}
                        />

                        <!-- Daily Routines Dropdown -->
                        <DropdownList 
                            id={"daily-routine"}
                            isHidden={!dailyRoutinesOpen}
                            options={{
                                pickedItem: dayBreakdown?.linkedRoutine?.name,
                                listItems: DAILY_ROUTINES.map((dr) => ({ name: dr.name })),
                                styling:  { width: "125px", maxHeight: "300px" },
                                scroll:   { bar: true },
                                onListItemClicked: onNewDayRoutineClicked,
                                position: { 
                                    top: "35px", right: `${dailyRoutinestXOffset}px` 
                                },
                                parent: {
                                    id: "day-breakdown-settings",
                                    optnIdx: 0,
                                    optnName: isLinked ? "Replace Routine" : "Link a Routine"
                                },
                                onPointerLeave: () => dailyRoutinesOpen = false
                            }}
                        />

                        <!-- Cores -->
                        {#if dayBreakdownIsCore}
                            <div class="routine__core-breakdown">
                                <div class="routine__cores">
                                    {#if dayBreakdown}
                                        {@const cores = dayBreakdown.cores}
                                        {@const prop = dayBreakdownVal === "avg" ? "avgTime" : "totalTime"}

                                        <div class="routine__cores-col">
                                            <div class="routine__cores-core">
                                                <div class="routine__cores-title">Sleeping</div>
                                                <div class="routine__cores-value">
                                                    {formatCoreData(cores.sleeping[prop])}
                                                </div>
                                            </div>
                                            <div class="routine__cores-core">
                                                <div class="routine__cores-title">Awake</div>
                                                <div class="routine__cores-value">
                                                    {formatCoreData(cores.awake[prop])}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="routine__cores-col-divider"></div>
                                        <div class="routine__cores-col">
                                            <div class="routine__cores-core">
                                                <div class="routine__cores-title">Working</div>
                                                <div class="routine__cores-value">
                                                    {formatCoreData(cores.working[prop])}
                                                </div>
                                            </div>
                                            <div class="routine__cores-core">
                                                <div class="routine__cores-title">Self-Care</div>
                                                <div class="routine__cores-value">
                                                    {formatCoreData(cores.selfCare[prop])}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="routine__cores-col-divider"></div>
                                        <div class="routine__cores-col">
                                            <div class="routine__cores-core">
                                                <div class="routine__cores-title">Mind</div>
                                                <div class="routine__cores-value">
                                                    {formatCoreData(cores.mind[prop])}
                                                </div>
                                            </div>
                                            <div class="routine__cores-core">
                                                <div class="routine__cores-title">Body</div>
                                                <div class="routine__cores-value">
                                                    {formatCoreData(cores.body[prop])}
                                                </div>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                        <!-- Tag Breakdown -->
                        {#if !dayBreakdownIsCore}
                            <div class="routine__tag-breakdown">
                                {#if dayBreakdown}
                                    {#if dayBreakdown.tags.length > 0}
                                        {#each dayBreakdown.tags as tagData}
                                            {@const data = tagData.data}
                                            {@const colorTrio = getColorTrio(tagData.tag.symbol.color, isLightTheme)}
                                            <div class="routine__tag-row">
                                                <div 
                                                    class="tag"
                                                    class:tag--light={isLightTheme}
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
                                                    {minsToHHMM(dayBreakdownVal === "avg" ? data.avgTime : data.totalTime)}
                                                </div>
                                            </div>
                                        {/each}
                                    {:else}
                                        <div class="routine__tag-breakdown-empty">
                                            No Tags
                                        </div>
                                    {/if}
                                {/if}
                            </div>
                        {/if}
                    </div>
                </BounceFade>
            </div>
        </div>
    </div>
</div>

{#if editContext === "details" && editingBlock}
    <EditBlockModal block={editingBlock} routineManager={manager} />
{/if}

{#if confirmOptions} 
    <ConfirmationModal 
        text={confirmOptions.text}
        onCancel={confirmOptions.onCancel}
        onOk={confirmOptions.onOk}
        options={confirmOptions.options}
    /> 
{/if}

{#if openNewRoutineModal}
    <NewRoutineModal 
        onFinishEdit={onFinishNewWeekRoutineEdit}
        isForWeek={true}
        bounds={{ 
            titleMax: RoutinesManager.MAX_TITLE, descrMax: RoutinesManager.MAX_DESCRIPTION
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
        &--narrow &__details h2 {
            margin-bottom: 0px;
        }
        &--narrow  &__details-container {
            width: calc(100% - 20px) !important;
            margin: 0px 0px 0px 0px;
        }
        &--narrow &__details-container {
            width: 100%;
            width: 100%;
            padding-top: 6px;
        }
        &--narrow &__title {
            max-height: 30px;
            max-width: calc(100% - 60px);
            @include multi-line-elipses-overflow(1);
        }
        &--narrow &__description {
            @include multi-line-elipses-overflow(2);
            max-height: 40px;
            margin: 5px 0px 0px 0px;
            overflow: hidden;
        }
        &--narrow &__breakdown {
            display: none;
        }
        &--narrow &__details-chosen-routine {
            margin-bottom: 2px;
        }
        &--narrow &__week {
            margin-top: 8px;
            height: calc(100% - 150px);
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

            &-container {
                max-height: calc(100% - 75px);
            }
            &__block {
                left: -6.5px;
            }
        }
        &--narrow .routine-blocks-container {
            margin-left: $hr-col-width--min;
        }

        /* Empty */
        &--narrow#{&}--empty &__week {
            height: calc(100% - 100px);
            margin-top: 35px;
        }
        &--empty &__wk-routine-empty {
            padding: 4px 0px 7px 0px;
            // margin-left: 15px;
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
        .routine__breakdown {
            margin-bottom: 22px;
        }

        /* Title + Description */
        &__title {
            font-size: 1.6rem;
            max-height: 120px;
        }
        &__description {
            margin-top: 2px;
            max-height: 120px;
            padding: 4px 4px 4px 0px;
        }

        /* Week Routines List */
        &__wk-routines {
            margin: 0px 0px 0px -7px;
            width: 95%;
            font-family: "DM Sans";
            position: relative;
            height: var(--routines-height);
        }
        &__wk-routines-count {
            @include text-style(0.2, 400, 1.2rem);
        }
        &__wk-routines-left {
            @include flex(center);

            &:hover button {
                visibility: visible;
                opacity: 0.3;
            }
        }
        &__wk-routines-add-btn {
            opacity: 0;
            transition: 0.1s ease-in-out;
            padding: 3px;
            border-radius: 10px;

            &:hover {
                opacity: 0.88 !important;
            }
            &:focus {
                visibility: visible !important;
                opacity: 1 !important;
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
                cursor: pointer;
            }
            &:hover span {
                transition: 0.035s ease-in-out;
                @include text-style(0.5);
            }
            &:focus-visible {
                @include border-focus;
            }
            &:focus-visible span {
                @include text-style(0.5);
            }
            &:active {
                transition: 0.15s cubic-bezier(.4,0,.2,1);
                transform: scale(0.98);
            }
            &--active span {
                color: rgba(var(--textColor1), 0.5) !important;
            }
            span {
                @include text-style(0.2, 400, 1.25rem);
                @include multi-line-elipses-overflow(1);
                word-wrap: break-word;
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
        &__collection-empty {
            margin-left: 23px;
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
            @include text-style(1, 500);
        }
        &--light &__day-breakdown-unlinked {
            @include text-style(0.4);
        }
        &--light &__day-breakdown-settings-btn {
            background-color: rgba(var(--textColor1), 0.08);
        }
        &--light &__day-breakdown .routine__description {
            @include text-style(0.5, 500);
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
            transition: 0.01s ease-in-out;
            @include flex(center);
            padding: 2px 4px;
            
            span {
                display: block;
                margin-right: 2px;
            }
            &:disabled {
                opacity: 1;
            }
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
            margin-top: 8px;
            height: 35px;
            position: relative;
            overflow: hidden;
        }
        &__days {
            @include flex(_, space-between);
            min-width: var(--min-width);
            width: 100%;
            position: absolute;
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
            @include abs-top-left(11px, -10px);
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
            padding: 4px 4px;
            @include text-style(0.8, 400, 1.2rem, "DM Sans");

            &:disabled {
                opacity: 1;
                cursor: default;
            }
            &:disabled:active {
                transform: scale(1) !important;
            }
            &:active {
                transform: scale(0.985);
            }
        }
        &__days-header-arrow {
            @include abs-top-right(-1px, -23px);
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
            padding: 11px 18px 12px 18px;
            border-radius: 18px;
        }
        &__day-breakdown--unlinked .routine__breakdown-header {
            margin-top: 3px !important;
        }
        &__day-breakdown-settings-btn {
            @include abs-top-right(8px, 14px);
            @include circle(19px);
            @include center;
            z-index: 1;
            padding: 0px;
            opacity: 0.5;
            background-color: rgba(var(--textColor1), 0.05);

            &:hover {
                opacity: 1;
            }
        }
        &__day-breakdown-unlinked {
            @include text-style(0.2, 600, 1.1rem);
            margin: 1px 0px 0px 0px;
            display: block;
        }
        &__day-breakdown .routine__details {
            width: 100%;
            margin-bottom: 4px;
        }
        &__day-breakdown .routine__title {
            max-width: calc(100% - 20px);
            font-size: 1.5rem;
            @include multi-line-elipses-overflow(2);
        }
        &__day-breakdown .routine__description {
            width: 100%;
            font-size: 1.3rem;
            margin-top: 0px;
            padding-top: 4px;
            @include multi-line-elipses-overflow(2);
        }
        &__day-breakdown {
            overflow: visible;
        }
        &__day-breakdown .routine__breakdown-header {
            margin-top: 6px;
        }
        &__day-breakdown .routine__tag-breakdown {
            min-height: 200px;
        }

        /* Main Content */
        &__board {
            position: relative;
            height: 100%;
        }
        &__blocks-wrapper {
            min-width: var(--min-width);
            position: relative;
            height: calc($hr-col-height * 24);
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
            @include abs-top-left(0px, 1px);
            max-height: calc(100% - 84px);
        }
        &__blocks {
            height: calc($hr-col-height * 24);
            overflow: hidden;
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

