<script lang="ts">
	import { onMount } from 'svelte'
	import type { Writable } from 'svelte/store'

	import { Icon } from '$lib/enums';
	import { themeState } from '$lib/store'
	import { toast } from '$lib/utils-toast'
	import { getColorTrio } from '$lib/utils-general'
	import { EDIT_BLOCK_OPTIONS, ROUTINE_BLOCKS_CONTAINER_ID, formatCoreData, getBlockStyling } from '$lib/utils-routines'
	import { InputManager, TextEditorManager } from '$lib/inputs'
	import { getTimeFromIdx, minsFromStartToHHMM, minsToHHMM } from '$lib/utils-date'

	import EditBlockModal from '../EditBlockModal.svelte'
	import NewRoutineModal from "../NewRoutineModal.svelte"
	import ColorPicker from '../../../../components/ColorPicker.svelte'
	import DropdownList from '../../../../components/DropdownList.svelte'
	import ConfirmationModal from '../../../../components/ConfirmationModal.svelte'
	import SvgIcon from '../../../../components/SVGIcon.svelte'
	import { DailyRoutinesManager } from '$lib/routines-daily-manager'

    export let data: { routines: DailyRoutine[] }

    const BLOCKS_CONTAINER_LEFT_OFFSET = 45

    // DOM
    let timeBoxElem: HTMLElement
    let blocksContainerRef: HTMLElement
    let routinesListContainerRef: HTMLElement
    let blocksContainerWidth = 0
    
    let manager = new DailyRoutinesManager(data.routines)

    let isContextMenuOpen = false
    let hasSetPointerCapture = false
    let routineSettingsOpen  = false
    let routineSettingsPos   = { left: 0, top: 0 }

    let colorsOpen = false
    let colorsPos: OffsetPoint | null = null

    // daily routines
    let isDeleteDailyRoutineConfirmOpen = false
    let editDailyRoutineIdx = -1
    let openNewRoutineModal = false
    let rightClickedRoutineItemIdx = -1

    let _dailyRoutines  = manager.dailyRoutines!
    let _editDayRoutineElems = manager.editDayRoutineElems
    let _editDayRoutine = manager.editDayRoutine
    let _coreBreakdown = manager.coreBreakdown
    let _tagBreakdown = manager.tagBreakdown
    let _editingBlock = manager.editingBlock
    let _editContext = manager.editContext
    let _contextMenuPos = manager.contextMenuPos

    $: dailyRoutines   = $_dailyRoutines as DailyRoutine[]
    $: editDayRoutineElems = $_editDayRoutineElems ?? []
    $: editDayRoutine = $_editDayRoutine as DailyRoutine | null
    $: coreBreakdown     = $_coreBreakdown
    $: editingBlock  = $_editingBlock
    $: editContext   = $_editContext
    $: tagBreakdown  = $_tagBreakdown ?? []
    $: isLightTheme  = !$themeState.isDarkTheme
    $: focusedId     = editDayRoutine?.id ?? "0"
    $: lockInteraction   = isContextMenuOpen || colorsOpen

    $: contextMenuPos = $_contextMenuPos

    $: initTextEditors(editDayRoutine)

    $: console.log(editingBlock?.isDragging)

    let titleInput: Writable<InputManager>
    let description: Writable<InputManager>

    /* Daily Routine Edits */

    function onDailyRoutineContextMenu(e: Event, routineIdx: number) {
        const pe = e as PointerEvent
        pe.preventDefault()

        const container = routinesListContainerRef

        const rect = container.getBoundingClientRect()
        const top  = pe.clientY - rect.top
        let left = pe.clientX - rect.left
        
        editDailyRoutineIdx = routineIdx
        rightClickedRoutineItemIdx = routineIdx
        routineSettingsOpen = true
        routineSettingsPos  = { top, left }
    }

    function onDailyRoutineOptnClicked(itemIdx: number, optIdx: number) {
        if (optIdx === 0) {
            editDailyRoutineIdx = -1
            onDailyRoutineClicked(itemIdx)
        }
        else {
            isDeleteDailyRoutineConfirmOpen = true
        }

        rightClickedRoutineItemIdx = -1
        routineSettingsOpen = false
    }

    function onFinishNewDailyRoutineEdit(newRoutine: DailyRoutine | null) {
        openNewRoutineModal = false

        if (!newRoutine) return

        manager.newDailyRoutine(newRoutine)
    }

    function onDailyRoutineClicked(routineIdx: number) {
        if (dailyRoutines[routineIdx].id === focusedId)  return
        
        manager.initEditRoutine(dailyRoutines[routineIdx])
    }

    function removeDailyRoutine(idx: number) {
        manager.removeDailyRoutine(dailyRoutines[idx].id)
        toast("success", { message: "Weekly routine deleted." })

        isDeleteDailyRoutineConfirmOpen = false
        editDailyRoutineIdx = -1
    }

    /* Text Editors */
    function initTextEditors(editDayRoutine: DailyRoutine | null) {
        if (!editDayRoutine) return 

        titleInput = (new TextEditorManager({ 
            initValue: editDayRoutine.name,
            placeholder: "Routine Title",
            maxLength: 100,
            id: "routine-title-input",
            doAllowEmpty: false,
            handlers: {
                onInputHandler: manager.updateTitle
            }
        })).state
    
        description = (new TextEditorManager({ 
            initValue: editDayRoutine.description,
            placeholder: "Type description here...",
            maxLength: 500,
            id: "routine-description",
            handlers: {
                onInputHandler:  manager.updateDescription
            }
        })).state
    }
    
    /* Editing Blocks */
    function onBlockContextMenu(e: MouseEvent, id: string) {
        e.preventDefault()
        manager.onBlockContextMenu(id)
        isContextMenuOpen = true
    }

    function onBlockPointerDown(e: PointerEvent) {
        if (hasSetPointerCapture) return

        hasSetPointerCapture = true
        const target = e.target as HTMLElement
        target.setPointerCapture(e.pointerId)
    }

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
    
    function onContextMenuDismount() {
        const isEditModalOpen = editContext === "details"
        manager.closeContextMenu(isEditModalOpen || colorsOpen)
    }
    
    onMount(() =>{
        requestAnimationFrame(() => {
            manager.initContainer(timeBoxElem, blocksContainerRef)
            manager.initEditRoutine(dailyRoutines[0])
        })
    })
</script>

<div 
    class="routines"
    class:routines--light={isLightTheme}
    class:routines--dark={!isLightTheme}
>
    <!-- Routines List -->
    <div class="routines__collection" bind:this={routinesListContainerRef}>
        <ul>
            <button 
                class="routines__add-new-routine"
                on:click={() => openNewRoutineModal = true}
            >
                <span>New Routine</span>
                <SvgIcon 
                    icon={Icon.Add}
                    options={{ scale: 0.89, strokeWidth: 2 }}
                />
            </button>
            {#each dailyRoutines as routine, routineIdx}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li 
                    class="routines__routine-item" 
                    class:routines__routine-item--clicked={routine.id === focusedId}
                    class:routines__routine-item--active={routineIdx === rightClickedRoutineItemIdx}
                    on:click={() => onDailyRoutineClicked(routineIdx)}
                    on:contextmenu={(e) => onDailyRoutineContextMenu(e, routineIdx)}
                >
                    <span>
                        {routine.name}
                    </span>
                </li>
            {/each}
        </ul>
        <DropdownList
            id={"daily-routines"}
            isHidden={!routineSettingsOpen}
            options={{
                listItems: [
                    { options: [{ name: "View Routine" }] },
                    { name: "Delete Routine" }
                ],
                onListItemClicked: (context) => {
                    onDailyRoutineOptnClicked(editDailyRoutineIdx, context.idx)
                },
                onClickOutside: () => {
                    routineSettingsOpen = false
                    rightClickedRoutineItemIdx = -1
                },
                styling: { 
                    width: "140px", zIndex: 2001 
                },
                position: {
                    top: routineSettingsPos.top + "px",
                    left: routineSettingsPos.left + "px"
                }
            }}
        />
    </div>
    <div class="routines__divider routines__divider--first"></div>
    <!-- Picked Routine Details -->
    <div 
        class="routine"
        class:routine--light={isLightTheme}
    >
        <div class="routine__details">
            {#if $titleInput}
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
        <!-- Breakdown -->
        <div class="routine__breakdown">
            <!-- Cores -->
            <div class="routine__core-breakdown">
                <h3>Cores</h3>
                {#if coreBreakdown}
                    <div class="routine__cores">
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Sleeping</div>
                                <div class="routine__cores-value">
                                    {formatCoreData(coreBreakdown.sleeping.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Awake</div>
                                <div class="routine__cores-value">
                                    {formatCoreData(coreBreakdown.awake.totalTime)}
                                </div>
                            </div>
                        </div>
                        <div class="routine__cores-col-divider"></div>
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Working</div>
                                <div class="routine__cores-value">
                                    {formatCoreData(coreBreakdown.working.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Self-Care</div>
                                <div class="routine__cores-value">
                                    {formatCoreData(coreBreakdown.selfCare.totalTime)}
                                </div>
                            </div>
                        </div>
                        <div class="routine__cores-col-divider"></div>
                        <div class="routine__cores-col">
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Mind</div>
                                <div class="routine__cores-value">
                                    {formatCoreData(coreBreakdown.mind.totalTime)}
                                </div>
                            </div>
                            <div class="routine__cores-core">
                                <div class="routine__cores-title">Body</div>
                                <div class="routine__cores-value">
                                    {formatCoreData(coreBreakdown.body.totalTime)}
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
            {#if tagBreakdown.length > 0}
                <!-- Tag Breakdown -->
                <div class="routine__tag-breakdown">
                    <h3>Tags</h3>
                    {#each tagBreakdown as tagData}
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
                                {minsToHHMM(tagData.data.totalTime)}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
    <div class="routines__divider routines__divider--last"></div>
    <!-- Picked Routine Time Blocks -->
    <div 
        class="routine-blocks-container" 
        class:routine-blocks-container--light={isLightTheme}
        class:routine-blocks-container--no-scroll={lockInteraction}
        class:routine-blocks-container--ns-resize={editContext?.includes("stretch")}
        bind:this={timeBoxElem}
        on:pointermove={manager.onBlocksContainerPointerMove}
    >
        <!-- Time Box Content -->
        <div 
            bind:this={blocksContainerRef}
            bind:clientWidth={blocksContainerWidth}
            class="routines__blocks-wrapper"
            class:no-pointer-events={lockInteraction}
        >
            <div 
                on:pointerdown={(e) => manager.onScrollContainerPointerDown(e)}
                on:contextmenu={(e) => {
                    if (editContext === "lift") e.preventDefault()
                }}
                id={ROUTINE_BLOCKS_CONTAINER_ID}
                class="routine-blocks"
                class:routine-blocks--editing={editContext}
                class:routine-blocks--light={false}
                style:--left-offset={`${BLOCKS_CONTAINER_LEFT_OFFSET}px`}
            >
                {#each editDayRoutineElems as block (block.id)}
                    {@const colorTrio    = getColorTrio(block.color, isLightTheme)}
                    {@const isEditBlock  = editingBlock?.id === block.id && (["old-stretch", "lift"].includes(editContext ?? ""))}
                    {@const startTimeStr = minsFromStartToHHMM(block.startTime)}
                    {@const endTimeStr   = minsFromStartToHHMM(block.endTime)}
                    {@const isFirstLast  = ["first", "last"].includes(block.orderContext ?? "")}
                    {@const isFirst      = block.orderContext === "first"}

                    <!-- Routine Block -->
                    <div 
                        id={`daily-routine-block--${block.id}`}
                        class={`routine-blocks__block ${getBlockStyling(block.height)}`}
                        class:hidden={isEditBlock}
                        style:top={`calc(${block.yOffset}px`}
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
                                {#if isFirstLast}
                                    <div 
                                        class="routine-blocks__block-order-icon"
                                        title={`${isFirst ? "First routine of the day." : "Last routine of the day."}`}
                                    >
                                        <SvgIcon 
                                            icon={isFirst ? Icon.Sun : Icon.Moon} 
                                            options={{
                                                height: 16, width: 16, opacity: 0.4, scale: 0.58, color: `rgba(${colorTrio[0]}, 0.5)`
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

                <!-- Floating Block or New Block  -->
                {#if editingBlock}
                    {@const colorTrio = getColorTrio(editingBlock.color, isLightTheme)}
                    {@const startTimeStr = minsFromStartToHHMM(editingBlock.startTime)}
                    {@const endTimeStr = minsFromStartToHHMM(editingBlock.endTime)}
                    {@const isLift = editContext === "lift"}
                    {@const isStretch = editContext === "old-stretch"}
                    {@const isDragging   = editingBlock.isDragging}
                    {@const dropArea     = editingBlock.dropArea}
                    {@const isFirstLast  = ["first", "last"].includes(editingBlock.orderContext ?? "")}
                    {@const isFirst = editingBlock.orderContext === "first"}

                    <div 
                        class={`routine-blocks__block ${getBlockStyling(editingBlock.height)}`}
                        class:routine-blocks__block--day-floating={isLift}
                        class:routine-blocks__block--dup-floating={editContext === "duplicate"}
                        class:routine-blocks__block--old-stretch={isStretch}
                        class:routine-blocks__block--use-x-offset={isLift || (editContext === "duplicate" && isDragging)}
                        style:top={`${editingBlock.yOffset}px`}
                        style:--left-x-offset={`${editingBlock.xOffset}px`}
                        style:--block-height={`${editingBlock.height}px`}
                        style:--block-color-1={colorTrio[0]}
                        style:--block-color-2={colorTrio[1]}
                        style:--block-color-3={colorTrio[2]}
                        style:z-index={2000}
                        id="edit-block"
                        on:pointerdown={onBlockPointerDown}
                    >
                        <div class="routine-blocks__block-content">
                            <div class="flx flx--algn-center">
                                {#if isFirstLast}
                                    <div 
                                        class="routine-blocks__block-order-icon"
                                        title={`${isFirst ? "First routine of the day." : "Last routine of the day."}`}
                                    >
                                        <SvgIcon 
                                            icon={isFirst ? Icon.Sun : Icon.Moon} 
                                            options={{
                                                height: 16, width: 16, opacity: 0.4, scale: 0.58, color: `rgba(${colorTrio[0]}, 0.5)`
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
                                    <button on:click={() => manager.confirmDuplicate()}>
                                        <i class="fa-solid fa-check"></i>
                                    </button>
                                {/if}
                                <button on:click={() => manager.closeDuplicateEdit()}>
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
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    {@const colorTrio = getColorTrio(editingBlock.color, isLightTheme)}
                    {@const startTimeStr = minsFromStartToHHMM(editingBlock.startTime)}
                    {@const endTimeStr = minsFromStartToHHMM(editingBlock.endTime)}
                    {@const { top } = editingBlock.dropArea}

                    <div 
                        class={`routine-blocks__block ${getBlockStyling(editingBlock.height)}`}
                        class:routine-blocks__block--drop-area={true}
                        id="drop-area-block"
                        style:top={`${top}px`}
                        style:--block-height={`${editingBlock.height}px`}
                        style:--block-color-1={colorTrio[0]}
                        style:--block-color-2={colorTrio[1]}
                        style:--block-color-3={colorTrio[2]}
                        title="Untitled Block"
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
            
           <!-- Hour Blocks -->
            <div class="hour-blocks-container" class:scroll-bar-hidden={true}>
                <div 
                    class="hour-blocks"
                    class:hour-blocks--light={isLightTheme}
                >
                    {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                        {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                        {@const height         = (60 / 1440) * 100}
                        <div 
                            class="hour-blocks__block"
                            class:hidden={timeIdx === 0}
                            style:height={`${height}%`}
                            style:top={`calc(${headOffsetPerc}% - 1.5px)`}
                        >
                            <span>
                                {getTimeFromIdx(timeIdx).toLowerCase()}
                            </span>
                            <div class="hour-blocks__block-vert-divider">
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" height="27" viewBox="0 0 0 0" fill="none">
                                    <path d="M1.25684 0.614746V 28" stroke-width="1" stroke-dasharray="2 2"/>
                                </svg>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Grid -->
            <div class="wk-grid" class:wk-grid--light={isLightTheme}>
                <div class="wk-grid__hoz-lines">
                    {#if timeBoxElem}
                        {@const width = blocksContainerWidth}
                        {#each Array.from({ length: 24 }, (_, i) => i) as timeIdx}
                            {@const headOffsetPerc = ((timeIdx * 60) / 1440) * 100}
                            {@const height = (60 / 1440) * 100}
                            <div 
                                class="wk-grid__hoz-line"
                                class:hidden={timeIdx === 0}
                                style:top={`calc(${headOffsetPerc}% - 2px)`}
                                style:height={`${height}%`}
                            >
                                <div class="wk-grid__hoz-line-content">
                                    <svg xmlns="http://www.w3.org/2000/svg" {width} height="2" viewBox={`0 0 ${width} 2`} fill="none">
                                        <path d={`M0 1H ${width}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                    </svg>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                <div class="wk-grid__vert-lines">
                    {#if timeBoxElem}
                        {@const height = blocksContainerRef.clientHeight}
                        <div 
                            class="wk-grid__vert-line"
                            style:top="-1px"
                            style:left="0px"
                            style:height={`${height}px`}
                        >
                            <div class="wk-grid__vert-line-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="2" {height} viewBox="0" fill="none">
                                    <path d={`M1 ${height}L1 1`} stroke-width="0.7" stroke-dasharray="3 3"/>
                                </svg>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        <!-- Context Menu -->
        <DropdownList
            id={"daily-routines"}
            isHidden={!isContextMenuOpen}
            options={{
                styling: { width: "140px" },
                listItems: EDIT_BLOCK_OPTIONS,
                onListItemClicked: (context) => onContextMenuOptClicked(context.idx),
                onDismount: onContextMenuDismount,
                onClickOutside:() => {
                    isContextMenuOpen = false
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

{#if editContext === "details" && editingBlock}
    <EditBlockModal block={editingBlock} routineManager={manager} />
{/if}

{#if isDeleteDailyRoutineConfirmOpen} 
    <ConfirmationModal 
        text="Are you sure you want to proceed with deleting this weekly routine?"
        onCancel={() => { 
            isDeleteDailyRoutineConfirmOpen = false
            editDailyRoutineIdx = -1
        }}
        onOk={() => removeDailyRoutine(editDailyRoutineIdx)}
        options={{ ok: "Delete", caption: "Heads Up!", type: "delete" }}
    /> 
{/if}

{#if openNewRoutineModal}
    <NewRoutineModal 
        onFinishEdit={onFinishNewDailyRoutineEdit}
        isForWeek={false}
        bounds={{ 
            titleMax: 200, descrMax: 300
        }}
    />
{/if}



<style lang="scss">
    @import "../../../../scss/day-box.scss";
    @import "../../../../scss/dropdown.scss";
    @import "../../../../scss/inputs.scss";
    @import "../../../../scss/components/routines.scss";

    $hour-blocks-top-offset: 55px;
    $hour-block-height: 50px;
    
    $xlg-blocks-left-offset: 30px;
    $lg-blocks-left-offset: 12px;
    $md-blocks-left-offset: 30px;
    $sm-blocks-left-offset: 8px;

    .routines {
        display: flex;
        width: 100%;
        height: calc(100% - 58px);

        &--light &__divider {
            @include divider(0.064, _, 1px);
        }
        &--light &__routine-item span {
            @include text-style(1, 500);
        }
        &--light &__add-new-routine {
            @include text-style(_, 500);
            opacity: 0.4;
            
            &:hover {
                opacity: 0.85;
            }
        }
        &--dark .dropdown-menu {
            @include dropdown-menu-dark;
        }
        &--dark .dropdown-btn {
            @include dropdown-btn-dark;
        }

        &__collection {
            padding-top: 16px;
            width: clamp(170px, 20%, 195px);
            position: relative;

            h3 {
                @include text-style(1, 400, 1.7rem);
                margin-bottom: 12px;
            }
            ul {
                width: 100%;
            }
        }
        &__routine-item {
            margin: 0px 0px 3px -12px;
            padding: 5.5px 12px;
            border-radius: 8px;
            transition: 0.03s ease-in-out;
            opacity: 0.8;
            cursor: pointer;
            @include flex(center, space-between);
            @include elipses-overflow;

            &--clicked {
                opacity: 1;
                @include txt-color(0.03, "bg");
            }
            &--clicked span {
                opacity: 0.9 !important;
            }
            &--active span {
                opacity: 0.7 !important;
            }
            
            &:active {
                transform: scale(0.995);
            }
            &:hover span {
                opacity: 0.7;
            }
            span {
                @include text-style(1, 300, 1.28rem, "DM Sans");
                transition: 0.08s ease-in-out;
                opacity: 0.4;
            }
        }
        &__add-new-routine {
            @include text-style(1, 300, 1.28rem, "DM Sans");
            @include flex(center);
            // @include txt-color(0.4, "bg");
            margin-bottom: 14px;
            opacity: 0.2;
            
            &:hover {
                opacity: 0.5;
            }
            span {
                margin-right: 7px;
            }
        }
        &__divider {
            @include divider(0.04, calc(100% - 20px), 0.5px);
            margin: 0px min(27px, 4%) 0px min(25px, 4%);

            &--first {
                margin-left: min(20px, 4%);
            }
        }
        &__blocks-wrapper {
            width: 100%;
            display: flex;
            height: calc(($hour-block-height * 24));
            padding-right: 20px;
        }
        .routine {
            width: clamp(270px, 30%, 320px);
            position: relative;
        }
    }

    /* Customizization from Resuable Stylings */
    .routine {
        padding-top: 16px;

        &--light &__description {
            @include text-style(0.55);
        }
        &--light &__cores-title {
            opacity: 1;
            @include text-style(0.8, 500);
        }
        &--light &__cores-value {
            @include text-style(0.54, 500);
        }

        &__title {
            font-size: 2.2rem;
            max-height: 70px;
        }
        &__description {
            margin-top: 1px;
            max-height: 190px;
        }
        &__details {
            margin-bottom: 0px;
        }
        &__breakdown h3 {
            @include text-style(0.72, 400, 1.32rem);
            margin-bottom: 12px;
        }
        &__core-breakdown, &__tag-breakdown {
            padding: 12px 8px 8px 6px;
            border-radius: 14px;
            background: none;
            border: none;
        }
        &__core-breakdown {
            margin: 0px 0px 2px -6px;
        }
        &__cores-title {
            opacity: 0.7;
        }
        &__tag-breakdown {
            margin: 12px 0px 0px -6px;
        }
        &__tag-breakdown h3 {
            margin-bottom: 15px;
        }
        &__tag-stat, &__cores-value {
            @include text-style(0.34);
        }
    }

    .wk-grid {
        height: calc(($hour-block-height * 24));
    }
    
    .routine-blocks-container {
        flex: 1;
        position: relative;
        height: calc(100% - 37px);
        overflow-y: scroll;
        overflow-x: hidden;
    }

    .routine-blocks {
        @include abs-top-left(-2px, var(--left-offset));
        width: calc(100% - var(--left-offset));
        height: calc(($hour-block-height * 24));
        
        &__block {
            width: 80%;
            max-width: 240px;
        }
    }

    /* Media Queries */
    @media (min-width: 1000px) {
        .routine-blocks__block {
            left: $xlg-blocks-left-offset;
        }
    }
    @media (max-width: 1000px) {
        .routine-blocks__block {
            left: $lg-blocks-left-offset;
        }
    }
    @media (max-width: 860px) {
        .routine {
            display: none;
        }
        .routines__divider--last {
            display: none;
        }
        .routine-blocks__block {
            left: $md-blocks-left-offset;
        }
    }
    @media (max-width: 600px) {
        .routine-blocks__block {
            left: $sm-blocks-left-offset;
        }
    }
</style>