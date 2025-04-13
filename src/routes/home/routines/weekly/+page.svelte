<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import { themeState, timer } from "$lib/store"
    
	import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { colorPicker } from "$lib/pop-ups"
	import { hasModalOpen } from "$lib/utils-home"
	import { isInRange } from "$lib/utils-general"
    import { getColorTrio } from "$lib/utils-colors"
	import { WeeklyRoutinesManager } from "$lib/routines-weekly-manager"
    import { getDayIdxMinutes, getTimeFromIdx, minsFromStartToHHMM } from "$lib/utils-date"
	import { EDIT_BLOCK_OPTIONS, ViewOption, ROUTINE_BLOCKS_CONTAINER_ID} from "$lib/utils-routines"
    
    import Header from './Header.svelte'
	import Details from "./Details.svelte";
	import SvgIcon from "$components/SVGIcon.svelte"
	import EditBlockModal from "../EditBlockModal.svelte"
	import DropdownList from "$components/DropdownList.svelte"

    export let data: { week: WeeklyRoutine[], day: DailyRoutine[] }

    const MIN_VIEW_MAX_WIDTH = 640
    const INIT_SCROLL_TOP = 280

    let routines: WeeklyRoutine[] = data.week

    /* DOM */
    let hourBlocksElem: HTMLElement
    let scrollableContainer: HTMLElement
    let scrollableContent: HTMLElement
    
    let weekViewWidth = 0
    let containerWidth = 0

    let currTime = getDayIdxMinutes()
    
    /* routines */
    let setWeekRoutineIdx = routines.length > 0 ? 0 : -1
    let manager = new WeeklyRoutinesManager(routines[setWeekRoutineIdx] ?? null)
        
    let daysInView = manager.DAYS_WEEK
    let contextMenuOpen = false
    let colorsOpen = false
    let viewOptn: "all" | "mtwt" | "fss" | "today" = "all"

    let breakdownOpen = false
    let pointCaptureSet = false
    let blockMaxWidth = 0

    /* stores */
    let _weekRoutine     = manager.weekRoutine
    let _weekRoutineElems = manager.weekRoutineElems
    let _editBlock   = manager.editBlock
    let _editContext    = manager.editContext
    let _contextMenuPos = manager.contextMenuPos
    let _currViewOption = manager.currViewOption
    
    $: weekRoutine       = $_weekRoutine
    $: weekRoutineElems  = $_weekRoutineElems as WeekBlockElems ?? []
    $: currViewOption    = $_currViewOption
    $: editContext       = $_editContext
    $: editBlock      = $_editBlock
    $: contextMenuPos    = $_contextMenuPos
    $: locked = contextMenuOpen || colorsOpen
    $: dayIdx = currTime.dayIdx

    $: isMin = containerWidth < MIN_VIEW_MAX_WIDTH && routines.length > 0
    $: isLight = !$themeState.isDarkTheme
    $: blockWidth = `${currViewOption === ViewOption.Today ? "50%" : `calc((100% / ${daysInView.length}) - 8px)`}`
    
    _currViewOption.subscribe((view) => updateBlockMaxWidth(view))
    const unsubscribe = timer.subscribe(() => currTime = getDayIdxMinutes())

    /* blocks */
    function updateBlockMaxWidth(newOptn: ViewOption) {
        currViewOption = newOptn
        daysInView = manager.daysInView

        if (newOptn === ViewOption.Today) {
            viewOptn = "today"
            blockMaxWidth = 200
        }
        else if (newOptn === ViewOption.Weekly) {
            viewOptn = "all"
            blockMaxWidth = 170
        }
        else if (newOptn === ViewOption.MTWT) {
            viewOptn = "mtwt"
            blockMaxWidth = 240
        }
        else {
            viewOptn = "fss"
            blockMaxWidth = 240
        }
    }
    function blockOptnClicked(name: string) {
        if (name === "Edit Block") {
            manager.openEditBlockModal()
        }
        else if (name === "Change Color") {
            colorsOpen = true
            colorPicker.init({
                onSubmitColor: (color) => {
                    manager.setEditBlockColor(color)    
                },
                onClose: () => {
                    colorsOpen = false
                    manager.resetEditState()
                },
                picked: editBlock!.color
            })
        }
        else if (name === "Duplicate Block") {
            manager.onDuplicateBlock()
        }
        else {
            deleteBlock()
        }
        contextMenuOpen = false
    }
    function deleteBlock() {
        initUndoToast()
        manager.deleteEditBlock()
    }
    function initUndoToast() {
        const block = editBlock!
        const routineId = weekRoutine!.id
        const dayKey = manager.editDayKey as keyof WeeklyRoutineBlocks

        const onClick = () => {
            if (routineId === weekRoutine!.id) {
                manager.finishEdit(block, "new-stretch")
                manager.updateSingleDayEdit()
            }
            else {
                const routineIdx = routines.findIndex(r => r.id === routineId)
                if (routineIdx >= 0) {
                    const dayRoutine = routines[routineIdx].blocks[dayKey]
                    if ("blocks" in dayRoutine) {
                        dayRoutine.blocks.push(block)
                    }
                    else {
                        dayRoutine.push(block)
                    }
                    routines = routines
                }
            }
        }

        toast("default", {
            message: `"${block.title}" deleted.`,
            contextId: "routines",
            groupExclusive: true,
            action: { 
                label: "Undo", onClick
            }
        })
    }
    function onEditBlockPointerDown(e: PointerEvent) {
        if (!pointCaptureSet && editContext !== "duplicate") {
            pointCaptureSet = true
            const target = e.target as HTMLElement
            target.setPointerCapture(e.pointerId)
        }
    }
    function onBlockContextMenu(e: MouseEvent, id: string) {
        e.preventDefault()
        manager.onBlockContextMenu(id)
        contextMenuOpen = true
    }

    /* board */
    function onBoardScroll(e: Event) {
        const target = e.target as HTMLElement
        const { scrollTop } = target
    
        hourBlocksElem.style.top = `-${scrollTop}px`
    }
    function onKeyUp(e: KeyboardEvent) {
        if (!manager || hasModalOpen() || editBlock) return

        manager.hotkeyHandler(e)
    }
    function showNowLine(dayIdx: number) {
        if (viewOptn === "today" || viewOptn === "all") {
            return true
        }
        else if (viewOptn === "mtwt" && isInRange(1, dayIdx, 5)) {
            return true
        }
        else if (viewOptn === "fss" && (dayIdx === 0 || isInRange(4, dayIdx, 6))) {
            return true
        }
        return false
    }
    
    onMount(() => {
        scrollableContainer.scrollTop += INIT_SCROLL_TOP

        requestAnimationFrame(() => { 
            manager.initContainer(scrollableContainer, scrollableContent)
            manager.processWeeklyRoutine()
        })
    })
    onDestroy(() => unsubscribe())
</script>

<svelte:window on:keyup={onKeyUp} />

<div 
    class="routine" 
    class:routine--light={isLight}
    class:routine--dark={!isLight} 
    class:routine--min={isMin} 
    class:routine--empty={!weekRoutine} 
    bind:clientWidth={containerWidth}
    style:--days-length={daysInView.length}
    style:--block-max-width={`${blockMaxWidth}px`}
>
    <div class="routine__details-container">
        <Details 
            bind:routines={routines}
            {isMin} 
            {manager} 
        />
    </div>
    <div class="routine__week">
        <Header
            {isMin}
            {viewOptn}
            {containerWidth}
            {daysInView}
            {weekRoutine}
            {manager}
            {locked}
        />
        <div class="week-view__board">
            <div 
                on:scroll={onBoardScroll}
                bind:this={scrollableContainer}
                class="routine-blocks-container" 
                class:routine-blocks-container--no-scroll={locked}
                class:routine-blocks-container--ns-resize={editContext?.includes("stretch")}
            >
                <div 
                    bind:clientWidth={weekViewWidth}
                    bind:this={scrollableContent}
                    class="week-view__blocks-wrapper"
                    on:pointermove={(e) => { 
                        if (!locked) {
                            manager.onPointerMove(e)
                        }
                    }}
                >
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div 
                        id={ROUTINE_BLOCKS_CONTAINER_ID}    
                        class="routine-blocks"
                        class:routine-blocks--editing={editContext}
                        class:no-pointer-events-all={locked || !weekRoutine}
                        on:pointerdown={(e) => {
                            manager.onBoardPointerDown(e)
                        }}
                        on:contextmenu={(e) => {
                            if (editContext === "lift") {
                                e.preventDefault()
                            }
                        }}
                    >
                        {#each daysInView as day, dayIdx}
                            {@const dayKey = manager.getDayKey(day)}
    
                            {#each weekRoutineElems[dayKey] as block (block.id)}
                                {@const colorTrio    = getColorTrio(block.color, isLight)}
                                {@const startTimeStr = minsFromStartToHHMM(block.startTime)}
                                {@const endTimeStr   = minsFromStartToHHMM(block.endTime)}
                                {@const xOffset      = `calc(((100% / ${daysInView.length}) * ${dayIdx}) + 2px)`}
                                {@const editId       = editBlock?.id}
                                {@const isEditBlock  = editId === block.id && (editContext === "old-stretch" || editContext === "lift")}
                                {@const isFirstLast  = ["first", "last"].includes(block.order ?? "")}
                                {@const isFirst      = block.order === "first"}
    
                                <!-- svelte-ignore a11y-interactive-supports-focus -->
                                <div 
                                    id={block.id}
                                    role="button"
                                    tabIndex={0}
                                    class="routine-block"
                                    class:routine-block--editing={editId === block.id && !editContext}
                                    class:no-pointer-events-all={locked || editContext === "duplicate"}
                                    class:hidden={isEditBlock}
                                    style:top={`${block.yOffset}px`}
                                    style:left={xOffset}
                                    style:--block-height={`${block.height}px`}
                                    style:--block-color-1={colorTrio[0]}
                                    style:--block-color-2={colorTrio[1]}
                                    style:--block-color-3={colorTrio[2]}
                                    style:width={blockWidth}
                                    title={`${block.title} \n${startTimeStr} - ${endTimeStr}`}
                                    on:selectstart|preventDefault
                                    on:contextmenu={(e) => {
                                        onBlockContextMenu(e, block.id)
                                    }}
                                    on:click={() => {
                                        manager.onBlockClicked(block.id)
                                    }}
                                    on:pointerdown={(e) => {
                                        if (!breakdownOpen) {
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
                                    <div class="routine-block__content">
                                        <div class="flx-center">
                                            {#if isFirstLast}
                                                {@const opacity = isLight ? 0.8 : 0.5}
                                                <div 
                                                    class="routine-block__order-icon"
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
                                            <span class="routine-block__title">
                                                {block.title}
                                            </span>
                                        </div>
                                        <div class="routine-block__time-period">
                                            <span>{startTimeStr}</span>
                                            <span>-</span>
                                            <span>{endTimeStr}</span>
                                        </div>
                                        <div class="routine-block__spine"></div>
                                    </div>
                                </div>
                            {/each}
                        {/each}

                        <!-- now line -->
                        {#if showNowLine(dayIdx)}
                            {@const offsetIdx = viewOptn === "today" ? 0 : dayIdx}
                            <div 
                                class="now-line"
                                style:top={`calc(${(currTime.minutes / 1440) * 100}% - 0px)`}
                                style:left={`calc(((100% / ${daysInView.length}) * ${offsetIdx} + 0px)`}
                                style:width={`calc((100% / ${daysInView.length}) + 0.5px)`}
                            >
                                <div class="now-line__content"></div>
                            </div>
                        {/if}
    
                        <!-- floating or new block-->
                        {#if editBlock && editContext && editContext !== "details"}
                            {@const colorTrio    = getColorTrio(editBlock.color, isLight)}
                            {@const startTimeStr = minsFromStartToHHMM(editBlock.startTime)}
                            {@const endTimeStr   = minsFromStartToHHMM(editBlock.endTime)}
                            {@const xOffset      = manager.getEditBlockXOffset(editBlock)}
                            {@const dropArea     = editBlock.dropArea}
                            {@const isDragging   = editBlock.isDragging}
                            {@const isFirstLast  = ["first", "last"].includes(editBlock.order ?? "")}
                            {@const isFirst = editBlock.order === "first"}
            
                            <div 
                                class="routine-block"
                                class:routine-block--wk-floating={editContext === "lift"}
                                class:routine-block--dup-floating={editContext === "duplicate"}
                                class:no-pointer-events-all={locked}
                                style:top={`${editBlock.yOffset}px`}
                                style:left={xOffset}
                                style:--block-height={`${editBlock.height}px`}
                                style:--block-color-1={colorTrio[0]}
                                style:--block-color-2={colorTrio[1]}
                                style:--block-color-3={colorTrio[2]}
                                style:width={blockWidth}
                                style:z-index={2000}
                                id="edit-block"
                                on:pointerdown={(e) => {
                                    onEditBlockPointerDown(e)
                                }}
                                on:contextmenu|preventDefault
                            >
                                <div class="routine-block__content">
                                    <div class="flx-center">
                                        {#if isFirstLast}
                                            {@const opacity = isLight ? 0.8 : 0.5}
                                            <div 
                                                class="routine-block__order-icon"
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
                                        <span class="routine-block__title">
                                            {editBlock.title || "Untitled"}
                                        </span>
                                    </div>
                                    <div class="routine-block__time-period">
                                        <span>{startTimeStr}</span>
                                        <span>-</span>
                                        <span>{endTimeStr}</span>
                                    </div>
                                    <div class="routine-block__spine"></div>
                                </div>

                                <!-- confirm buttons for duplicate edit -->
                                {#if editContext === "duplicate" && !isDragging}
                                    {@const placement = manager.findDupBtnPlacement()}
                                    <div 
                                        data-placement={placement}
                                        class="routine-block__buttons"
                                        class:routine-block__buttons--left={placement === "left"}
                                        class:routine-block__buttons--right={placement === "right"}
                                        class:routine-block__buttons--top={placement === "top"}
                                        class:routine-block__buttons--bottom={placement === "bottom"}
                                    >
                                        {#if (dropArea?.offsetIdx ?? -1) >= 0}
                                            <button     
                                                on:click={() => manager.confirmDuplicate()}
                                            >
                                                <i class="fa-solid fa-check"></i>
                                            </button>
                                        {/if}
                                        <button
                                            on:click={() => manager.closeDuplicateEdit()}
                                        >
                                            <SvgIcon 
                                                icon={Icon.Close} 
                                                options={{ scale: 0.95, strokeWidth: 1.8, width: 10, height: 10 }}
                                            />
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        {/if}
            
                        <!-- drop area block -->
                        {#if editBlock?.dropArea?.doShow && (editContext === "lift" || editContext === "duplicate")}
                            {@const colorTrio = getColorTrio(editBlock.color, isLight)}
                            {@const startTimeStr = minsFromStartToHHMM(editBlock.startTime)}
                            {@const endTimeStr = minsFromStartToHHMM(editBlock.endTime)}
                            {@const { top, offsetIdx } = editBlock.dropArea}
                            {@const xOffset = `calc(((100% / ${daysInView.length}) * ${offsetIdx}))`}
                            {@const width = `${currViewOption === ViewOption.Today ? "50%" : `calc((100% / ${daysInView.length}))`}`}
            
                            <div 
                                class="routine-block"
                                class:routine-block--drop-area={true}
                                class:routine-block--wk-drop-area={true}
                                class:routine-block--wk-drop-area-light={isLight}
                                class:no-pointer-events-all={locked}
                                id="drop-area-block"
                                style:top={`${top}px`}
                                style:left={xOffset}
                                style:width={width}
                                style:--block-height={`${editBlock.height}px`}
                                style:--block-color-1={colorTrio[0]}
                                style:--block-color-2={colorTrio[1]}
                                style:--block-color-3={colorTrio[2]}
                            >
                                <div class="routine-block__content">
                                    <div class="flx-center">
                                        <span class="routine-block__title">
                                            {editBlock.title}
                                        </span>
                                    </div>
                                    <div class="routine-block__time-period">
                                        <span>{startTimeStr}</span>
                                        <span>-</span>
                                        <span>{endTimeStr}</span>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
    
                    <div class="wk-grid" class:wk-grid--light={isLight}>
                        <div class="wk-grid__hoz-lines">
                            {#if scrollableContent}
                                {@const width = weekViewWidth}
                                {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                                    {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                                    {@const height  = (60 / 1440) * 100}
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
                                {@const length = daysInView.length}
                                {@const height = scrollableContent.scrollHeight}
                                {#each Array.from({ length }, (_, i) => i) as dayIdx}
                                    <div 
                                        class="wk-grid__vert-line"
                                        style:height={`${height + 2}px`}
                                        style:top={`-${2}px`}
                                        style:left={`calc(((100% / ${length}) * ${dayIdx}))`}
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

                    <!-- block context menu -->
                    <DropdownList
                        id={"daily-routines"}
                        isHidden={!contextMenuOpen}
                        options={{
                            listItems: EDIT_BLOCK_OPTIONS,
                            styling: { 
                                minWidth: "130px",
                                zIndex: 100
                            },
                            onClickOutside:() => { 
                                contextMenuOpen = false
                            },
                            onListItemClicked: ({ name }) => {
                                blockOptnClicked(name)
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
                </div>
            </div>
            <!-- hour blocks -->
            <div class="hour-blocks-container" >
                <div class="hour-blocks-wrapper">
                    <div 
                        bind:this={hourBlocksElem} 
                        class="hour-blocks"
                        class:hour-blocks--light={isLight}
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
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{#if editContext === "details" && editBlock}
    <EditBlockModal 
        block={editBlock} 
        routines={manager} 
        onDeleteBlock={() => deleteBlock()}
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

        &--min {
            display: block;
        }
        &--min &__week {
            width: 100%;
            height: calc(100% - 130px);
            border-left: none;
        }
        &--min .hour-blocks {
            width: $hr-col-width--min;

            &__block {
                left: -5px;
            }
        }
        &--min .routine-blocks-container {
            margin-left: $hr-col-width--min;
        }
        &__week {
            height: calc(100% - 55px);
            flex: 1;
            border-left: var(--divider-border);
            overflow: hidden;
            position: relative;
        }
    }
    .week-view {
        width: 100%;
        position: relative;
        height: 100%;
        @include abs-top-left;

        &--light &__view-options-dbtn {
            @include text-style(0.4, 500);
        }
        &--light &__view-options-dbtn:hover {
            @include text-style(0.7);
        }
        &--light &__header {
            border-bottom: 1px solid rgba(var(--textColor1), 0.08);
        }
        &--light &__days-dbtn {
            @include text-style(1, 500);
        }
        &--light &__day-settings-btn {
            background-color: rgba(var(--textColor1), 0.08);
        }

        &__header {
            width: 100%;
            height: 43px;
            border-bottom: 1px solid rgba(var(--textColor1), 0.04);
            position: relative;
            @include flex(center);
        }
        &__view-options {
            width: $hr-col-width;
            position: relative;
            @include center;

            &:hover i, &--open i {
                visibility: visible !important;
                opacity: 0.5 !important;
            }
        }
        &__view-options-dbtn {
            @include text-style(0.2, 400, 1.04rem);
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
        // z-index: 1;
    }
    .routine-block {
        max-width: var(--block-max-width);
    }
    .wk-grid {
        margin-top: 0px;
        z-index: 0;
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

