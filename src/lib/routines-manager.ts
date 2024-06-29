import { get, writable, type Writable } from "svelte/store"
import { TOTAL_DAY_MINS } from "./utils-date"
import { EMPTY_CORES } from "./utils-routines"

import { 
    COLOR_SWATCHES, findAncestor, getDistBetweenTwoPoints, getElemById, 
    getElemNumStyle, initFloatElemPos, 
    isNearBorderAndShouldScroll, 
    randomArrayElem, roundUpFive 
} from "./utils-general"

/**
 * Parent manger class for editing and displaying routines.
 * Used as the parent of managers for daily / weekly routine pages.
 */
export class RoutinesManager {    
    // daily routines that is currently being edited
    editDayRoutine:      Writable<DailyRoutine | RoutineBlock[] | null> = writable(null)
    editDayRoutineElems: Writable<RoutineBlockElem[] | null> = writable(null)

    // breakdown data currently being shown to user
    coreBreakdown = writable<RoutineCores>()
    tagBreakdown  = writable<RoutineTags[]>([])
    
    // editing state
    editingBlock: Writable<RoutineEditBlock | null> = writable(null)
    editContext: Writable<RoutineBlockEditContext | null> = writable(null)
    newBlock:    Writable<RoutineBlockElem | null> = writable(null)
    isMakingNewBlock = false

    editingBlockRef:    HTMLElement | null = null
    floatingBlock:      HTMLElement | null = null
    blockOnPointerDown: RoutineBlockElem | null = null
    
    editBlockTopNbr:    RoutineBlockElem | null = null
    editBlockBottomNbr: RoutineBlockElem | null = null
    editTargetElem:     HTMLElement | null = null
    
    editingBlockTotalTime     = -1
    editingBlockInitStartTime = -1
    
    // isDragging: Writable<boolean> = writable(false)
    initDragLiftOffsets: OffsetPoint = { left: -1, top: -1 }
    dragStartPoint:      OffsetPoint = { left: -1, top: -1 }
    allowLiftEdit     = false
    allowStrechEdit   = false
    isLiftOnLinkedSibling = false
    
    // edit gesture context
    isDragLiftFromHead: boolean | null = null
    stretchPivotPointTopOffset = -1
    stretchPivotTime = 0

    // DOM stuff    
    containerElem: HTMLElement | null = null
    blocksContainerRef: HTMLElement | null = null
    containerElemHt        = 1200
    cursorPos: OffsetPoint = { left: 0, top: 0 }
    cursorPosFromWindow: OffsetPoint = { left: 0, top: 0 }
    allowAutoScroll = true

    earliestBlockHeadPos = TOTAL_DAY_MINS
    scrollInterval: any = null
    
    // context menu
    contextMenuPos: Writable<OffsetPoint> = writable({ left: -1, top: -1 })
    isContextMenuOpen = false

    // top offset comes from the offseted hoz lines to be vertically center aligned with the hours
    static MIN_BLOCK_DURATION_MINS = 15
    static STRETCH_DRAG_DISTANCE_THRESHOLD = 5
    static NEW_STRETCH_DRAG_DIST_THRESHOLD = 12.5
    static LIFT_DRAG_DIST_THRESHOLD = 5
    static BLOCK_EDGE_THRESHOLD = 4

    // constants
    static MAX_TITLE = 200
    static MAX_DESCRIPTION = 300

    static MAX_BLOCK_TITLE = 200
    static MAX_BLOCK_DESCRIPTION = 300

    static MAX_ACTION_ITEMS = 25

    /**
     * Initialize references to parent containers. Called after mounted.
     * @param scrollContainer   Block area's nearest scroll parent container.
     * @param blocksContainer   Block area's nearest parent container
     */
    initContainer(scrollContainer: HTMLElement, blocksContainer: HTMLElement) {
        this.containerElem = scrollContainer
        this.blocksContainerRef = blocksContainer
        this.containerElemHt = scrollContainer.scrollHeight - getElemNumStyle(blocksContainer, "padding-bottom")
    }

    /**
     * Process an array of raw routine blocks extracts block elems, earliest block, and breakdown data (core and tag).
     * This will usually be used to preocess a day's daily routine.
     * 
     * @param blocks        Daily routiune blocks. Could be a linked Daily Routine object or just an array of routine blocks.
     * @returns             Given a routine's blocks, get the core and tag breakdowns, block elems, and earliest block.
     */
    processRoutineBlocks(routine: RoutineBlock[] | DailyRoutine) {
        let coreBreakdown = structuredClone(EMPTY_CORES)
        let tagBreakdown: RoutineTags[] = []
        let blockElems = []
        
        let blocks: RoutineBlock[] = "id" in routine ? routine.blocks : routine
        let earliestBlock = Infinity
        let tagMap = new Map<string, RoutineTags>()
        let firstBlock, lastBlock

        blocks.sort((a, b) => a.startTime - b.startTime)

        // process each block
        for (let i = 0; i < blocks.length; i++) {
            const block        = blocks[i]
            const blockElem    = this.createRoutineBlockElem(block)
            const headOffsetPx = this.getTopOffsetFromTime(block.startTime)

            earliestBlock = Math.min(earliestBlock, headOffsetPx)
            blockElems!.push({ ...blockElem, id: `${i}` })

            // tally breakdown data
            this.tallyBlockForCoreBreakdown(block, coreBreakdown)
            this.tallyBlockForTagBreakdown(block, tagMap)

            if (i === 0) firstBlock = block
            if (i === blocks.length - 1) lastBlock = block
        }

        // get the sleeping and awake data
        coreBreakdown = this.initSleepAwakeData(coreBreakdown, blocks)
        tagBreakdown  = [...tagMap.values()].sort((a, b) => b.data.totalTime - a.data.totalTime)

        return { coreBreakdown, earliestBlock, blockElems, tagBreakdown }
    }

    /**
     * Given a raw routine block, create an object that represents how it would get displayed in the DOM.
     * Add offset values, height, elem idex.
     * All the blocks seen on the calendar / time box are of this type.
     * 
     * @param block Raw block data.
     * @returns     New day block elem from raw block data.
     */
    createRoutineBlockElem(block: RoutineBlock): RoutineBlockElem {
        const containerHt = this.containerElemHt
        const elapsedTimeMins = block.endTime - block.startTime

        const headOffsetPerc = block.startTime / TOTAL_DAY_MINS
        const height         = Math.ceil((elapsedTimeMins / TOTAL_DAY_MINS) * containerHt)

        return {
            ...block,
            id: "", height,
            yOffset: Math.floor(headOffsetPerc * containerHt),
            xOffset: 0
        }
    }


    /* Breakdown Data */

    /**
     * Given a block, update the running tag data of a routine.
     * Called when an array of block elemens is being processed.
     * 
     * @param block    Raw block in quesiton.
     * @param tagMap   Running map.
     */
    tallyBlockForTagBreakdown(block: RoutineBlock, tagMap: Map<string, RoutineTags>) {
        if (!block.tag) return

        const elapsedTimeMins = block.endTime - block.startTime

        if (tagMap.has(block.tag.name)) {
            const tagData   = tagMap.get(block.tag.name)!.data
            const totalTime = tagData.totalTime + elapsedTimeMins
            const total     = tagData.total + 1
            const avgTime   = Math.floor(totalTime / total)

            const data = { totalTime, avgTime, total }
            tagMap.set(block.tag.name, { tag: block.tag, data })
        }
        else {
            tagMap.set(block.tag.name, {
                tag: block.tag,
                data: { 
                    totalTime: elapsedTimeMins,
                    total: 1,
                    avgTime: elapsedTimeMins
                }
            })
        }
    }

    /**
     * Get the tag breakdown for any given array of routine blocks.
     * 
     * @param blocks  Array of routine blocks whose tags need to be processed.
     * @returns       Tag brakdown data.
     */
    getRoutineTagBreakdown(blocks: RoutineBlock[]): RoutineTags[] {
        const tagMap = new Map<string, RoutineTags>()

        for (let i = 0; i < blocks.length; i++) {
            this.tallyBlockForTagBreakdown(blocks[i], tagMap)
        }

        // tag breakdown
        const tagBreakdown: RoutineTags[] = []
        tagMap.forEach((tag) => tagBreakdown.push(tag))
        tagBreakdown.sort((a, b) => b.data.totalTime - a.data.totalTime)

        return tagBreakdown
    }

    /**
     * Given a block, update the running core breakdown data of a routine.
     * Called when an array of block elemens is being processed.
     * 
     * @param block   Raw block in quesiton.
     * @param cores   Running core breakdown data
     */
    tallyBlockForCoreBreakdown(block: RoutineBlock, cores: RoutineCores) {
        if (!block.activity) return

        const elapsedTimeMins = block.endTime - block.startTime
        const strIdx = block.activity as keyof typeof cores

        cores[strIdx].total++
        cores[strIdx].totalTime += elapsedTimeMins
        cores[strIdx].avgTime = Math.floor(cores[strIdx].totalTime / cores[strIdx].total)
    }

    /**
     * Get the core breakdown for any given array of routine blocks.
     * 
     * @param blocks  Blocks of a routine.
     * @returns       Core breakdown data
     */
    getRoutineCoreBreakdown(blocks: RoutineBlock[]): RoutineCores {
        const cores      = structuredClone(EMPTY_CORES)

        const firstBlock      = blocks.find((block) => block.order === "first")
        const lastBlock       = blocks.find((block) => block.order === "last")
        const doGetSleepAwake = this.doGetSleepAwakeData(blocks)

        for (let block of blocks) {
            this.tallyBlockForCoreBreakdown(block, cores)
        }

        if (doGetSleepAwake) {
            const firstAwakeMin  = firstBlock!.startTime
            const asleepAtMin  = lastBlock!.endTime

            cores.sleeping.totalTime += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin) - 1
            cores.sleeping.avgTime   += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin) - 1

            cores.awake.totalTime =  TOTAL_DAY_MINS - cores.sleeping.totalTime
            cores.awake.avgTime   =  TOTAL_DAY_MINS - cores.sleeping.totalTime
        }
        else {
            cores.sleeping.totalTime = -1
            cores.sleeping.avgTime   = -1
            cores.sleeping.total     = -1

            cores.awake.totalTime = -1
            cores.awake.avgTime   = -1
            cores.awake.total     = -1
        }

        return cores
    }

    /* Updates */

    /**
     * Update breakdown data after a routine has changed.
     */
    updateBreakdownData() {
        const dayRoutine = get(this.editDayRoutine)!
        let blocks = "id" in dayRoutine ? dayRoutine.blocks : dayRoutine
 
        this.coreBreakdown.set(this.getRoutineCoreBreakdown(blocks))
        this.tagBreakdown.set(this.getRoutineTagBreakdown(blocks))
    }
    
    /**
     * Incorporate changes made to  the currently-being-edit routine.
     * How the update is handled depedns on the edit that was made.
     * 
     * @param editBlock  The edited block elem.
     * @param edtt       Edit that was made.
     */
    updateRoutineAfterBlockUpdate(editBlock: RoutineBlockElem, edit: RoutineBlockEditContext | "delete" | "color") {
        if (edit === "new-stretch" || edit === "duplicate") {
            this.addNewBlockToEditRoutine(editBlock)
        }
        else if (edit === "delete") {
            this.removeBlockFromEditRoutine(editBlock.id)
        }
        else {
            const { height, yOffset } = this.getEditBlockSafeProps(editBlock.startTime, editBlock.endTime)!
            editBlock.height = height
            editBlock.yOffset = yOffset

            // remove old edit block and completely replace with new one
            this.removeBlockFromEditRoutine(editBlock.id)
            this.addNewBlockToEditRoutine(editBlock)
        }

        const rawBlocks = get(this.editDayRoutineElems)!.map((block) => {
            const { id, height, xOffset, yOffset, ...rest } = block
            return rest
        })

        this.editDayRoutine.update((routine) => {
            if ("id" in routine!) {
                (routine as DailyRoutine).blocks = rawBlocks
            }
            else {
                routine = rawBlocks
            }
            return routine
        })
    }

    removeBlockFromEditRoutine(id: string) {
        this.editDayRoutineElems.update((blocks) =>blocks!.filter((block) => block.id !== id))
    }

    /* Routine Edits */

    openEditBlockModal() {
        this.editContext.set("details")
    }

    onConcludeModalEdit(updatedBlock: RoutineBlockElem | null) {
        this.editingBlock.set(null)
        this.editContext.set(null)
        this.editingBlockRef = null
        this.isMakingNewBlock = false

        if (!updatedBlock) return
        this.updateRoutineAfterBlockUpdate(updatedBlock, "details")
    }

    /**
     * Add a new block to currently-being-edit routine.
     * @param newBlock   New block elemebt to be incorporated into the editroutine.
     */
    addNewBlockToEditRoutine(newBlockElem: RoutineBlockElem) {
        let blocks = get(this.editDayRoutineElems)!

        // must only be one first and last block each
        const newOrderContext = newBlockElem.order

        if (newOrderContext === "first") {
            const oldFirstIdx = blocks.findIndex((block) => block.order === "first")

            if (oldFirstIdx >= 0) blocks[oldFirstIdx].order = null
        }
        else if (newOrderContext === "last") {
            const oldLastIdx = blocks.findIndex((block) => block.order === "last")

            if (oldLastIdx >= 0) blocks[oldLastIdx].order = null
        }

        blocks.push(newBlockElem)
        blocks.sort((a, b) => a.startTime - b.startTime)

        // id in week routine: {DAY_IDX}--{BLOCK_IDX}
        // id in day routine:  {BLOCK_IDX}
        blocks = blocks.map((block: RoutineBlockElem, idx: number) => { 
            const idPair = block.id.split("--")
            const isDay  = idPair.length === 1

            return { ...block, id: isDay ? `${idx}` : `${idPair[0]}--${idx}` }
        })

        this.editDayRoutineElems.set(blocks)

        console.log(get(this.editDayRoutineElems))
    }

    /* Block Edits */

    /**
     * Change the color of the current edit block.
     * @param color   New color
     */
    setEditBlockColor(color: Color | null) {
        if (!color) return

        const editBlock = get(this.editingBlock)!
        this.updateRoutineAfterBlockUpdate({ ...editBlock, color }, "color")
    }

    /**
     * Delete the current block being edited
     */
    deleteEditBlock() {
        const editBlock = get(this.editingBlock)!
        this.updateRoutineAfterBlockUpdate(editBlock, "delete")
        this.updateBreakdownData()
    }

    /* Blocks Container | Block Event Handlers  */

    /**
     * Pointer event handler for when cursor moves in container that holds all the blocks.
     * 
     * @param  event Pointer Event
     */
    onBlocksContainerPointerMove = (event: PointerEvent) => {
        if (!this.blocksContainerRef) return

        const blocksRect = this.blocksContainerRef.getBoundingClientRect()
        const windowRect = this.containerElem!.getBoundingClientRect()
        
        const blocksLeft = event.clientX - blocksRect.left
        const blocksTop = event.clientY - blocksRect.top

        const windowLeft = event.clientX - windowRect.left
        const windowTop = event.clientY - windowRect.top
        
        this.cursorPos = { left: blocksLeft, top: blocksTop }
        this.cursorPosFromWindow = { left: windowLeft, top: windowTop }
    }

    /**
     * Did user click on a block edge.
     * 
     * @param event  Pointer event from on-block click
     * @returns      If user has clicked on the bottom or top edge of the block.
     */
    isBlockPointerDownOnEdge(event: PointerEvent) {
        const target = event.target as HTMLElement
        const block = findAncestor({ 
            queryStr: "routine-blocks__block", queryBy: "class",
            child: target, strict: true
        })

        const { top, bottom } = block!.getBoundingClientRect()
        const edgeThreshold = RoutinesManager.BLOCK_EDGE_THRESHOLD

        const isOnTopEdge    = event.clientY < top + edgeThreshold
        const isOnBottomEdge = event.clientY > bottom - edgeThreshold

        return { isOnTopEdge, isOnBottomEdge }
    }
    
    /* Lift Block Edit */

    /**
     * Initialize editing state for a lift edit.
     * 
     * @param block  Block being edited
     */
    intDragLiftMoveEdit(block: RoutineBlockElem) {
        const editBlock           =  get(this.editingBlock)!
        const editBlockLeftOffset =  getElemNumStyle(this.editingBlockRef!, "left")

        this.editingBlockTotalTime     = editBlock.endTime - editBlock.startTime
        this.editingBlockInitStartTime = editBlock.startTime

        // left and top offsets differences between cursor and top / left edges of block
        // allows drag point to be not just be the very top left corner of block
        this.initDragLiftOffsets = {
            top: this.cursorPos.top   - editBlock.yOffset,
            left: this.cursorPos.left - editBlockLeftOffset
        }

        // set edit state
        this.editingBlock.set({ ...block, isDragging: true })
        this.editContext.set("lift")
    }

    /**
     * Handler for when user moves a lifted, editing block.
     * Updates the block's start, end times, and offset.
     * 
     * @returns  Safe area props
     */
    getLiftBlockPosition = () => {
        let editBlock      = get(this.editingBlock)!
        let dragTopOffset  = this.cursorPos.top - this.initDragLiftOffsets.top
        let dragLeftOffset = this.cursorPos.left - this.initDragLiftOffsets.left
        
        let offsetData = this.getTimeAndOffsetFromTopPos(dragTopOffset)
        
        // normalize start / end times
        const maxStartTime = TOTAL_DAY_MINS - this.editingBlockTotalTime - 1
        let startTime      = Math.min(offsetData.time, maxStartTime)
        let endTime        = startTime + this.editingBlockTotalTime
        let yOffset        = this.getTopOffsetFromTime(startTime)
        
        // prevent x offset out of bounds
        let xOffset         = Math.max(dragLeftOffset, 0)
        const floatingBlock = getElemById("edit-block")
        const boundWidth    = this.blocksContainerRef!.clientWidth

        if (floatingBlock) {
            const floatingToXOffset = floatingBlock!.clientWidth + xOffset
            const diff = boundWidth - floatingToXOffset
            
            if (diff < 10) {
                xOffset = editBlock.xOffset
            }
        }

        // prevent y from out of bounds
        
        this.scrollWhenNearContainerBounds()

        // update positioning and times of drop area and floating
        const safeProps = this.getPropsAfterLift({
            startTime, 
            endTime, 
            blockTotalTime: endTime - startTime
        })

        return { safeProps, xOffset, yOffset }
    }

    /**
     * Get the startime, endtime, height, and yOffset for a block in column of blocks such that they do not overlap with other blocks after lifting block.
     * Null if there is no space for the block.
     * 
     * @param times  Start time, end time, and total block time of the move location.
     * @param id     The id of the block lift, if none is provided, will use the edit block by default. 
     * 
     * @returns      Start time, yOffset, end time, height of block after lift edit.
     *               Returns null if there are no possible safe positions.
     */
    getPropsAfterLift(times: { startTime: number, endTime: number, blockTotalTime: number }) {
        const blockElems = get(this.editDayRoutineElems)!
        const isDupEdit = get(this.editContext) === "duplicate"

        let startTime = this.getStartTimeFromDragLiftEdit({ 
            blocks: get(this.editDayRoutineElems)!,
            editId: isDupEdit ? "" : get(this.editingBlock)!.id,
            newStartTime: times.startTime,
            newEndTime: times.endTime,
        })
        
        let _endTime  = startTime + times.blockTotalTime

        // if no availalbe space, startTime will be @ 1440
        if (startTime === 1440) return null

        // find closest nbrs
        this.editBlockBottomNbr = this.findBlockClosestBottomNbr(blockElems, startTime, _endTime)
        this.editBlockTopNbr    = this.findBlockClosestTopNbr(blockElems, startTime, _endTime)
        
        // they have to be touching
        this.editBlockBottomNbr = this.editBlockBottomNbr?.startTime === _endTime ? this.editBlockBottomNbr : null
        this.editBlockTopNbr    = this.editBlockTopNbr?.endTime === startTime ? this.editBlockTopNbr : null

        const { height, yOffset, endTime } = this.getEditBlockSafeProps(startTime, _endTime, false)!

        return { startTime, yOffset, endTime, height }
    }

    /**
     * Get the start time after the end of a lift edit based on the top offset position of the floating edit block.
     * If the start time is impossible (ovrlapping with other blocks), find the nearest allowable start time.
     * 
     * @param editBlock 
     * @param id         Id of block on the move. Will be the current edit block by default.
     * 
     * @returns          New start time, following life edit.
     */
    getStartTimeFromDragLiftEdit(context: {
        blocks: RoutineBlockElem[],
        editId: string
        newStartTime: number,
        newEndTime: number
    }) {
        const { editId, newStartTime, newEndTime, blocks } = context
        const blockingBlock = this.getOverlappingBlock({
            blocks, 
            startTime: newStartTime, 
            endTime: newEndTime, 
            excludeId: editId, 
            excludeDayCompare: this.isLiftOnLinkedSibling
        })

        // Check for overlapping intervals
        if (!blockingBlock) {
            return newStartTime
        }

        return this.findNearestClosestTimeOpening(context)
    }

    /* Stretch Edit Functionality  */

    /**
     * Initialize a strech edit state
     * 
     * @param isEditingExisting  Is user stretch-editing a new block!
     */
    initDragStretchEdit(block: RoutineBlockElem, isEditingExisting = false) {
        let isDraggingByTail = false

        if (isEditingExisting) {
            this.editContext.set("old-stretch")

            // set by block pointer down handler
            isDraggingByTail = !this.isDragLiftFromHead
        }
        else {
            this.editContext.set("new-stretch")

            // calculated from where user first touched the board to where user is now as a strech state is initialized
            isDraggingByTail = this.cursorPos.top > this.dragStartPoint.top
        }

        const pivotTime = isDraggingByTail ? block.startTime : block.endTime

        this.stretchPivotPointTopOffset = this.getTopOffsetFromTime(pivotTime)
        this.stretchPivotTime = pivotTime

        // find closest nbrs
        this.editBlockTopNbr = this.findBlockClosestTopNbr(get(this.editDayRoutineElems)!, block.startTime, block.endTime)
        this.editBlockBottomNbr = this.findBlockClosestBottomNbr(get(this.editDayRoutineElems)!, block.startTime, block.endTime)
    }

    /**
     * When a drag has been initiated, attempt to make a block if the right conditions are met.
     * 
     * @returns  Edit block from the edit. Will be null if too small or overlapping.
     */
    createBlockFromStretchEdit(): RoutineEditBlock | null {
        const stretchPivotTime     = this.getTimeAndOffsetFromTopPos(this.stretchPivotPointTopOffset, false).time
        let { startTime, endTime } = this.getTimesFromStretch({
            pivotPointOffset:  this.stretchPivotPointTopOffset, 
            topOffset:         this.cursorPos!.top, 
            stretchPivotTime:  stretchPivotTime,
            isDraggingByTail:  true
        })
        startTime = Math.max(roundUpFive(startTime), 0)
        endTime   = Math.min(Math.max(roundUpFive(endTime), 0), 1439)

        const elapsedTime = endTime - startTime
        const blocks      = get(this.editDayRoutineElems)!

        if (elapsedTime < RoutinesManager.MIN_BLOCK_DURATION_MINS || this.getOverlappingBlock({
            blocks, startTime, endTime
        })) {
            return null
        }

        // create valid block
        return {
            id: blocks.length + "",
            title: "Untitled Block",
            color: randomArrayElem(COLOR_SWATCHES.d),
            startTime, 
            endTime,
            height: 0, xOffset: 0, yOffset: this.getTopOffsetFromTime(startTime),
            description: "",
            order: null,
            activity: null, tag: null,
            isDragging: true,
            tasks: []
        }
    }

    /**
     * When stretch editing a block, get the start and end times from the positioning of the gesture.
     * 
     * @param gestureContext  Contextual data pertaining to user drag gesture.
     *                 - pivotPointOffset:  Top offset position where if user crosses with a drag, start and end time will switch.
     *                 - topOffset:         Current cursor top offset position.
     *                 - stretchPivotTime:  Calculated time from pivotPointOffset
     *                 - isDraggingByTail:  Is user dragging block by the bottom part.
     * 
     * @returns  Calculated start and end times from gesture context.
     */
    getTimesFromStretch(gestureContext: {
        pivotPointOffset: number, topOffset: number, stretchPivotTime: number, isDraggingByTail: boolean
    }) {

        const {
            pivotPointOffset, topOffset, stretchPivotTime, isDraggingByTail
        } = gestureContext

        const containerHt    = this.containerElemHt
        const yOffsetMins    = Math.floor((topOffset / containerHt) * TOTAL_DAY_MINS)
        const yChange        = pivotPointOffset - topOffset
        const belowPivotLine = yChange < 0

        // start time & end time take turns taking on the top offset depending on direction of gesture
        let startTime = 0
        let endTime   = 0
        
        // start and end time switch if there has been a pivot
        if (isDraggingByTail) {
            startTime = !belowPivotLine ? yOffsetMins : stretchPivotTime
            endTime   = !belowPivotLine ? stretchPivotTime : yOffsetMins
        }
        else {
            startTime = belowPivotLine ? stretchPivotTime : yOffsetMins
            endTime   = belowPivotLine ? yOffsetMins : stretchPivotTime
        }
        
        return { startTime, endTime }
    }

    /**
     * Handler for when user changes the start / end time when streching an element.
     * Used when editing existing or making new blocks.
     * 
     * @param e   Pointer Event
     */
    onBlockStretchMove = (e: Event) => {
        e.preventDefault()

        // only allow the edit if the user has moved he cursor far enough
        if (!this.allowStrechEdit) { 
            const threshold = RoutinesManager.STRETCH_DRAG_DISTANCE_THRESHOLD

            if (this.isHozDragWithinStretchThreshold(threshold)) {
                this.initDragStretchEdit(this.blockOnPointerDown! , true)
                this.allowStrechEdit = true
            }
        }
        if (!this.allowStrechEdit) {
            return
        }

        if (!this.editTargetElem) {
            this.editTargetElem = e.target as HTMLElement
            this.editTargetElem.style.cursor = "ns-resize"
        }

        let { startTime, endTime } = this.getTimesFromStretch({
            pivotPointOffset:  this.stretchPivotPointTopOffset, 
            topOffset:         this.cursorPos.top, 
            stretchPivotTime:  this.stretchPivotTime,
            isDraggingByTail: !this.isDragLiftFromHead
        })
        
        startTime = Math.max(roundUpFive(startTime), 0)
        endTime   = Math.max(roundUpFive(endTime), 0)
        
        const { height, yOffset, endTime: _endTime, startTime: _startTime }  = this.getEditBlockSafeProps(startTime, endTime)
        endTime = _endTime
        startTime = _startTime

        if (endTime - startTime < RoutinesManager.MIN_BLOCK_DURATION_MINS) return null

        const updatedProps = {
            startTime, endTime,
            height, yOffset
        }

        this.editingBlock.update((block) => ({ ...block!, ...updatedProps }))
    }

    /**
     * End the stretch and lift edit states.
     */
    onBlockStretchEditEnd() {
        if (this.editTargetElem) {
            this.editTargetElem.style.cursor = "default"
            this.editTargetElem = null
        }
        
        const editBlock = get(this.editingBlock)
        const editContext = get(this.editContext)!
        let doUpdate = editBlock != null
        
        if (editBlock) {
            doUpdate = editBlock!.endTime - editBlock!.startTime >= RoutinesManager.MIN_BLOCK_DURATION_MINS
        }
        if (editContext === "new-stretch" && doUpdate) {
            this.isMakingNewBlock = true
            this.editContext.set("details")
        }
        else if (editContext === "old-stretch" && doUpdate) {
            this.updateRoutineAfterBlockUpdate(editBlock!, "old-stretch")
            this.editContext.set(null)
            this.editingBlock.set(null)
        }
        
        this.editBlockBottomNbr = null
        this.editBlockTopNbr = null
        this.isDragLiftFromHead = null
        this.stretchPivotPointTopOffset = -1
        this.allowStrechEdit = false
        this.stretchPivotTime = -1
    }

    /* Context Menu Stuff */

    openContextMenu() {
        const containerWidth = this.containerElem!.clientWidth
        const containerHeight = this.containerElem!.clientHeight + 20
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: this.cursorPos.left - 20
        }

        const { top, left } = initFloatElemPos({
            dims: { height: 160, width: 150 }, 
            cursorPos, 
            containerDims: { height: containerHeight, width: containerWidth }
        })

        this.contextMenuPos.set({ left, top: top + scrollTop })
    }

    closeContextMenu(isEditActive: boolean) {
        this.contextMenuPos.set({ left: 0, top: 0 })

        // only close if user is no longer editing
        if (!isEditActive && get(this.editContext) != "duplicate") {
            this.editingBlock.set(null)
            this.editContext.set(null)
        }
    }

    getColorPickerPos() {
        const containerWidth = this.containerElem!.clientWidth
        const containerHeight = this.containerElem!.clientHeight + 20
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: this.cursorPos.left - 80
        }

        const { top, left } = initFloatElemPos({
            dims: { height: 206, width: 190 }, 
            cursorPos, 
            containerDims: { height: containerHeight, width: containerWidth }
        })

        return {
            left, top: top + scrollTop
        }
    }

    /* Edit Helpers */

    getTopOffsetFromTime(time: number) {
        return ((time / TOTAL_DAY_MINS) * this.containerElemHt)
    }

    /**
     * Get time and normalized offset from a top offset cursor position
     * 
     * @param topOffset  Y offset cursor position
     * @returns          Start time in minuts from offset cursor position and the corresponding offset form from it.
     */
    getTimeAndOffsetFromTopPos(topOffset: number, roundToFive = true) {
        const containerHt   = this.containerElemHt
        const topOffsetMins = (topOffset / containerHt) * TOTAL_DAY_MINS

        let time = roundToFive ? Math.max(roundUpFive(topOffsetMins), 0) : Math.floor(topOffsetMins)
        time     = Math.min(1439, time)

        const yOffset       = this.getTopOffsetFromTime(time)

        return { time, yOffset }
    }

    /**
     * Get the height, yOffset, endTime of an edit block.
     * Ensures that the props returned will never allow the block to overlap with neighboring blocks.
     * Returns null if the block is too short.
     * 
     * @param startTime     Calculated start time after edit.
     * @param endTime       Calculated end time after edit.
     * @param forStrechEdit Is for a strech edit.
     * @returns             Height, end time, top offset OR null if the block will be too short.
     */
    getEditBlockSafeProps(startTime: number, endTime: number, forStrechEdit = true) {
        const containerHt = this.containerElemHt
        const topCollision    = this.editBlockTopNbr && (startTime <= this.editBlockTopNbr.endTime)
        const bottomCollision = this.editBlockBottomNbr && (endTime >= this.editBlockBottomNbr.startTime)

        if (forStrechEdit) {
            startTime = topCollision ? this.editBlockTopNbr!.endTime : startTime
            endTime   = bottomCollision ? this.editBlockBottomNbr!.startTime : endTime
        }

        endTime = Math.min(1439, endTime)

        let yOffset = this.getTopOffsetFromTime(startTime)

        // top position is the position of top nbr's bottom edge positiond
        if (topCollision) {
            const topNbrTopOffset = this.editBlockTopNbr!.yOffset
            const topNbrHeight = this.editBlockTopNbr!.height

            yOffset = topNbrHeight + topNbrTopOffset
        }
        
        const elapsedTimeMins = endTime - startTime 
        const height  = Math.floor((elapsedTimeMins / TOTAL_DAY_MINS) * containerHt)

        return { height, yOffset, endTime, startTime }
    }

    /* Block Helpers  */

    /**
     * @param blocks          Collection of routine elements in question.
     * @param blockStartTime  The block's start time
     * @param blockEndTime    The block's end time
     * 
     * @returns               Block's closest bottom nbr
     */
    findBlockClosestBottomNbr(blocks: RoutineBlock[] | RoutineBlockElem[], blockStartTime: number, blockEndTime: number): RoutineBlockElem | null {
        let closestStartTime = 1441
        let closestBottomNbr = null

        blocks.forEach(block => {
            if (blockEndTime <= block.startTime && blockStartTime < block.startTime && block.startTime < closestStartTime) {
                closestStartTime = block.startTime
                closestBottomNbr = block
            }
        })

        return closestBottomNbr
    }

    /**
     * @param blocks          Collection of routine elements in question.
     * @param blockStartTime  The block's start time
     * @param blockEndTime    The block's end time
     * 
     * @returns               Block's closest bottom nbr
     */
    findBlockClosestTopNbr(blocks: RoutineBlock[] | RoutineBlockElem[], blockStartTime: number, blockEndTime: number): RoutineBlockElem | null {
        let closestEndTime = -1
        let closestTopNbr = null

        blocks.forEach(block => {
            if (blockStartTime >= block.endTime && blockEndTime > block.endTime && block.endTime > closestEndTime) {
                closestEndTime = block.endTime
                closestTopNbr = block
            }
        })

        return closestTopNbr
    }

    /**
     * Find the order of the block within a list of routine blocks given its start time
     * @param startTime   - Block start time to be searched or inserted.
     * @param blocks      - List of routine blocks to be searched through.
     * @param doesExist   - If the block already exists in the list
     * 
     * @returns             The order index of the block if found, -1 otherwise
     */
    getBlockOrderFromStartTime(startTime: number, blocks: RoutineBlock[] | RoutineBlockElem[], doesExist = true) {
        let orderIdx = 0

        for (let i = 0; i < blocks.length; i++) {
            const blockStartTime = blocks[i].startTime
            const foundOrder = doesExist ? blockStartTime === startTime : startTime < blockStartTime 

            if (foundOrder) return orderIdx

            orderIdx++
        }

        return -1
    }

   /**
     * Given a start and end time, see if it overlaps with any of the blocks in the given blocks list.
     * If so return it, otherwise return null
     * 
     * @param blocks     The list of blocks to check for overlap.
     * @param startTime  Start time of the block in question.
     * @param endTime    End time of the block in question.
     * @param id         Id of the block in question. Used to exclude the block itself it exists insde the blocks list.
     * 
     * @returns          The overlapping block, null otherwise
     */
    getOverlappingBlock(options: {
        blocks: RoutineBlockElem[], 
        startTime: number, 
        endTime: number, 
        excludeId?: string,
        excludeDayCompare?: boolean
    }) { 
        const { blocks, startTime, endTime, excludeId, excludeDayCompare  = false }= options

        const overlappingInterval = blocks.find((block) => {
            // if lifting to a daily routine that has the same likned routine, the block can overlap itself
            if (excludeDayCompare && excludeId && this.samePosSameRoutine(block.id, excludeId!)) {
                return false
            }
            else if (block.id === excludeId) {
                return false
            }

            const { startTime: intStart, endTime: intEnd } = block

            const startOverlap = startTime < intEnd && startTime >= intStart
            const endOverlap   = endTime > intStart && endTime <= intEnd
            const isInsideInt  = startTime >= intStart && endTime <= intEnd
            const hasIntInside = intStart >= startTime && intEnd <= endTime

            return isInsideInt || hasIntInside || startOverlap || endOverlap
        })

        return overlappingInterval
    }

    /**
     * @param id  Id of block
     * @returns   Block
     */
    getBlockElem(id: string) {
        return get(this.editDayRoutineElems)!.find((block) => block.id === id)
    }

    /* Routine Helpers  */

    doesRoutineHaveSetFirstDay(routine: RoutineBlock[] | RoutineBlockElem[]) {
        return routine.findIndex((routine) => routine.order === "first")
    }

    doesRoutineHaveSetLastDay(routine: RoutineBlock[] | RoutineBlockElem[]) {
        return routine.findIndex((routine) => routine.order === "last")
    }

    doGetSleepAwakeData(blocks: RoutineBlock[]) {
        const firstBlock = blocks.find((block) => block.order === "first")
        const lastBlock = blocks.find((block) => block.order === "last")

        return Boolean(firstBlock && lastBlock && firstBlock.endTime <= lastBlock.startTime)
    }

    /**
     * Initialize the sleep and awake data when processing core breakdown data.
     * @param cores       - Core breakdown data for a routine.
     * @param firstBlock  - First block of a routine.
     * @param lastBlock   - Last block of a routine.
     * @returns           - Update core breakdown data with sleep and awake data.
     */
    initSleepAwakeData(cores: RoutineCores, blocks: RoutineBlock[]) {
        if (this.doGetSleepAwakeData(blocks)) {
            const firstBlock = blocks.find((block) => block.order === "first")
            const lastBlock = blocks.find((block) => block.order === "last")

            const firstAwakeMin = firstBlock!.startTime
            const asleepAtMin   = lastBlock!.endTime

            cores.sleeping.totalTime += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin) - 1
            cores.awake.totalTime    =  TOTAL_DAY_MINS - cores.sleeping.totalTime

            cores.awake.avgTime    =  cores.awake.totalTime
            cores.sleeping.avgTime =  cores.sleeping.totalTime
        }
        else {
            cores.sleeping.totalTime = -1
            cores.awake.totalTime    = -1
            cores.sleeping.avgTime = -1
            cores.awake.avgTime    = -1
        }

        return cores
    }

    /**
     * Find the nearest allowable space for a block to an impossible desired start time.
     * 
     * @param editBlock  Block currently being edited.
     * @param id         Id of block on the move. Will be the current edit block by default.
     * 
     * @returns          The start time that puts the bock in the nearest allowable space to the desired start time.
     */
    findNearestClosestTimeOpening(context: {
        blocks: RoutineBlockElem[],
        editId: string
        newStartTime: number,
        newEndTime: number
    }) {
        const { blocks, editId, newStartTime, newEndTime } = context
        const timeLength = newEndTime - newStartTime

        let nearestStartTime = 1440
        let shortestDistanceToDesiredStart = Infinity

        const isValidCandidate = (id: string, idx: number) => {
            const isValid = blocks[idx].id != editId
            const isSame  = this.isLiftOnLinkedSibling && this.samePosSameRoutine(id, editId)

            return isValid && !isSame
        }
        const isValidNbrCandidate = (idx: number) => {
            if (idx < 0) return false

            const isValid = blocks[idx].id != editId
            const isSame  = this.isLiftOnLinkedSibling && this.samePosSameRoutine(blocks[idx].id, editId)

            if (isSame) {
                return false
            }
            else {
                return isValid
            }
        }
    
        // find the closest available space (either very top or bottom of any given interval)
        blocks.forEach((block, idx) => {
            if (!isValidCandidate(block.id, idx)) return

            const int = [block.startTime, block.endTime]
            const [intStart, intEnd] = int

            // prev interval
            const prevIdx     = idx - 1 >= 0 ? idx - 1 : -1
            const isPrevValid = isValidNbrCandidate(prevIdx)
            let prevInterval  = isPrevValid ? [blocks[prevIdx].startTime, blocks[prevIdx].endTime] : null

            const prevIntervalEnd = prevInterval ? prevInterval[1] : 0

            // next interval
            const nextIdx     = idx + 1  < blocks.length ? idx + 1 : -1
            const isNextValid = isValidNbrCandidate(nextIdx)
            let nextInterval  = isNextValid ? [blocks[nextIdx].startTime, blocks[nextIdx].endTime]  : null

            const nextIntervalStart = nextInterval ? nextInterval[0] : TOTAL_DAY_MINS

            // see if space is available
            const topSpace = Math.abs(intStart - prevIntervalEnd)
            const bottomSpace = Math.abs(nextIntervalStart - intEnd)

            let  topStartingPoint = TOTAL_DAY_MINS
            let  bottomStartingPoint = TOTAL_DAY_MINS

            const canFitTop = timeLength <= topSpace
            const canFitBottom = timeLength <= bottomSpace

            // find starting point in terms of current interval's top edge or bottom edge
            if (canFitTop) {
                // interval start - time length is the new end point for edit interval
                topStartingPoint = intStart - timeLength 
            }
            if (canFitBottom) {
                // interval end is the new start point for edit interval
                bottomStartingPoint = intEnd 
            }

            // find if its shorter to move right above or below an overlapping block
            const movedUpDistance    = canFitTop ? Math.abs(topStartingPoint - newStartTime) : TOTAL_DAY_MINS        // dinstance when moved above interval
            const movedDownDistance  = canFitBottom ? Math.abs(bottomStartingPoint - newStartTime) : TOTAL_DAY_MINS  // dist when moved below interval

            // should take top starting point if that dstance is shorter
            const shouldMoveUp     = movedUpDistance < movedDownDistance

            // keep track of the distance to start for each valid interval to narrow down nearset start time
            const _shortestDistanceToDesiredStart = shouldMoveUp ? movedUpDistance : movedDownDistance
            const _nearestStartTime               = shouldMoveUp ? topStartingPoint : bottomStartingPoint

            
            if (_shortestDistanceToDesiredStart < shortestDistanceToDesiredStart) {
                if (newStartTime === 865) {
                }
                nearestStartTime = _nearestStartTime
                shortestDistanceToDesiredStart = _shortestDistanceToDesiredStart
            }
        })

        return nearestStartTime
    }

    samePosSameRoutine(xId: string, yId: string) {
        if (xId.includes("--") && yId.includes("--")) {
            return xId.split("--")[1] === yId.split("--")[1]
        }
    }

    /* DOM Helpers */

    findDupBtnPlacement() {
        const editBlockRef = getElemById("edit-block")
        if (!editBlockRef) return

        const containerHeight = this.containerElemHt
        const containerWidth = this.blocksContainerRef!.clientWidth
        const editBlock = get(this.editingBlock)!.yOffset

        const blockHeight = editBlockRef.clientHeight

        const blockLeft       = getElemNumStyle(editBlockRef, "left")
        const blockTop        = editBlock
        const blockBottomEdge = blockTop + blockHeight
        const blockRightEdge  = blockLeft + editBlockRef.clientWidth

        const minGap = 25
        const noBottomSpace = containerHeight - blockBottomEdge < minGap
        const noRightSpace  = containerWidth - blockRightEdge < minGap
        const noLeftSpace   = blockLeft < minGap
        const noTopSpace    = blockTop < minGap
        
        let placement = "top"

        if (noBottomSpace) {
            placement = blockHeight < 45 ? "top" : noLeftSpace ? "right" : "left"
        }
        else if (noTopSpace) {
            placement = blockHeight < 120 ? "bottom" : noLeftSpace ? "right" : "left"
        }
        else if (noLeftSpace) {
            placement = "top"
        }
        else if (noRightSpace) {
            placement = "top"
        }
        else {
            placement = "top"
        }

        return placement
    }
    
    /**
    * Checks if the drag distance is within the threshold for a stretch edit.
    * 
    * @returns  True if the drag distance is within the stretch edit threshold, otherwise false.
    */
    isHozDragWithinStretchThreshold(threshold: number) {
        const dragDistance = Math.abs(this.cursorPos.top - this.dragStartPoint.top)

        return dragDistance >= threshold
    }

    /**
    * Checks if the drag distance is within the threshold for a stretch edit.
    * 
    * @returns  True if the drag distance is within the stretch edit threshold, otherwise false.
    */
    isAbsDragWithinStretchThreshold(threshold: number) {
        const dragDistance = getDistBetweenTwoPoints(this.cursorPos, this.dragStartPoint)

        return dragDistance >= threshold
    }

    /**
     * If cursor is near the borders while a block is being lifted do a scroll to the direction of the border the block is going to.
     * If far from the borders, avoid scrolling.
     */
    scrollWhenNearContainerBounds() {
        if (!this.allowAutoScroll) return
        if (this.scrollInterval) return
        
        this.scrollInterval = setInterval(() => {
            let moveDirection = isNearBorderAndShouldScroll(this.containerElem!, this.cursorPosFromWindow)
            
            if (moveDirection === "up") {
                this.containerElem!.scrollTop -= 10
            }
            else if (moveDirection === "down") {
                this.containerElem!.scrollTop += 10
            }
            else if (moveDirection === "right") {
                this.containerElem!.scrollLeft += 10
            }
            else if (moveDirection === "left") {
                this.containerElem!.scrollLeft -= 10
            }
            else if (!moveDirection) {
                clearInterval(this.scrollInterval as any)
                this.scrollInterval = null
            }
        }, 25)
    }

    /**
     * Get the y-offset position where if user crosses on a strech, the start / end itme will switch.
     * 
     * @param editBlock         Block being edited
     * @param isDraggingByTail  Is user stretching from the bottom edge of the block
     * 
     * @returns                 The pivot point y-offset location. 
     */
    getDragPivotPointTopOffset(height: number, cursorTop: number,  isDraggingByTail: boolean) {
        return isDraggingByTail ? cursorTop - height : cursorTop + height
    }

    toggleAutoScroll(allow: boolean) {
        this.allowAutoScroll = allow
    }
}