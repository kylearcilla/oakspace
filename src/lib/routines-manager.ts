import { get, writable, type Writable } from "svelte/store"
import { TOTAL_DAY_MINS } from "./utils-date"
import { CoreStatus } from "./enums"
import { 
            COLOR_SWATCHES, findAncestor, getDistanceBetweenTwoPoints, getElemById, 
            getElemNumStyle, 
            intContextMenuPos, 
            randomArrayElem, removeItemFromArray, roundUpToNearestFive 
} from "./utils-general"

const EMPTY_CORES = {
    sleeping: {
        status: CoreStatus.Healthy,
        totalTime: 0,
        avgTime: 0,
        total: 0
    },
    working: {
        status: CoreStatus.Healthy,
        totalTime: 0,
        avgTime: 0,
        total: 0
    },
    mind: {
        status: CoreStatus.Healthy,
        totalTime: 0,
        avgTime: 0,
        total: 0
    },
    awake: {
        status: CoreStatus.Healthy,
        totalTime: 0,
        avgTime: 0,
        total: 0
    },
    body: {
        status: CoreStatus.Healthy,
        totalTime: 0,
        avgTime: 0,
        total: 0
    },
    selfCare: {
        status: CoreStatus.Healthy,
        totalTime: 0,
        avgTime: 0,
        total: 0
    }
}

type RoutineBlockEditContext = "old-stretch" | "lift" | "details" | "new-stretch"

/**
 * Manger class for editing routines.
 * Used in daily routines / current routine pages.
 * 
 * Used to initialize (both daily and weekly) routine blocks, statistics, and editing (stretch & lifit).
 */
export class RoutinesManager {
    isForDay: boolean
    userRoutines:   Writable<DailyRoutine[] | null> = writable(null)
    
    // daily routines that is subject to being edited
    focusedDayRoutine:      Writable<DailyRoutine | RoutineBlock[] | null> = writable(null)
    focusedDayRoutineElems: Writable<RoutineBlockElem[] | null> = writable(null)

    // breakdown data currently being shows to user
    currCores        = writable<RoutineCores>()
    currTagBreakdown = writable<TagBreakDown[]>([])
    
    // editing state
    newBlock:    Writable<RoutineBlockElem | null> = writable(null)
    editContext: Writable<RoutineBlockEditContext | null> = writable(null)
    
    // editing blocks
    editingBlock:       Writable<RoutineBlockElem & { dropAreaOffset?: OffsetPoint } | null> = writable(null)
    editingBlockRef:    HTMLElement | null = null
    blockOnPointerDown: RoutineBlockElem | null = null
    floatingBlock: HTMLElement | null = null
    
    editBlockTopNbr:    RoutineBlockElem | null = null
    editBlockBottomNbr: RoutineBlockElem | null = null
    
    editingBlockTotalTime     = -1
    editingBlockInitStartTime = -1
    stretchPivotTime = 0
    
    initDragLiftOffsets: OffsetPoint = { left: -1, top: -1 }
    dragStartPoint: OffsetPoint = { left: -1, top: -1 }
    draggingSourceIdx = -1
    allowLiftEdit = false
    allowStrechEdit = false

    contextMenuPos: Writable<OffsetPoint> = writable({ left: -1, top: -1 })
    
    // lift edit
    isDragLiftFromHead: boolean | null = null
    editTargetElem:  HTMLElement | null = null
    // stretch edit
    pivotPointTopOffset = -1

    // floating block
    floatingItemOffset: OffsetPoint | null = null
    floatingElemStyling: {
        height: string,
        padding: string,
        borderWidth: string
    } | null = null

    // DOM stuff    
    containerElem: HTMLElement | null = null
    containerElemHt        = 1200
    blocksContainerRef: HTMLElement | null = null
    earliestBlockHeadPos   = 1440
    cursorPos: OffsetPoint = { left: 0, top: 0 }
    
    // context menu
    hasJustClosedContextMenu = false
    isContextMenuOpen = false
    contextMenuX = -1000
    contextMenuY = -1000

    // top offset comes from the offseted hoz lines to be vertically center aligned with the hours
    BLOCK_TOP_OFFSET = 0
    MIN_BLOCK_DURATION_MINS = 15
    DRAG_DISTANCE_THRESHOLD = 0
    NEW_BLOCK_DRAG_DIST_THRESHOLD = 5
    HEAD_OFFSET = 13.5
    BLOCK_GAP = 1
    TIME_BOX_POINTER_EVENT_OFFSET = 15
    ROUTINE_BLOCKS_CONTAINER_ID = "routine-blocks-container"
    ROUTINE_SCROLL_CONTAINER_ID = "routine-blocks-scroll-container"
    
    BLOCKS_LEFT_OFFSET = 35

    constructor(isForDay: boolean) {
        this.isForDay = isForDay
    }

    /**
     * Initialize references to parent contains for the routine blocks.
     * @param scrollContainer   Block area's nearest scroll parent container.
     * @param blocksContainer   Block area's nearest parent container
     */
    initContainer(scrollContainer: HTMLElement, blocksContainer: HTMLElement) {
        this.containerElem = scrollContainer
        this.blocksContainerRef = blocksContainer
        this.containerElemHt = scrollContainer.scrollHeight - getElemNumStyle(scrollContainer, "padding-top")
    }

    /**
     * Process an array of raw routine blocks and get braekdown data & core and tag breakdowns.
     * 
     * @param blocks        Routine's blocks
     * @param movedHeads    Map that tracks off-setted blocks to avoid collision (block can touch when start and end  @ same time)
     *                      Used to ensure all blocks that start at the same time are horizontally aligned the same.
     * 
     * @returns             Given a routine's blocks, get the core and tag breakdowns, block elems, and earliest block.
     */
    processRoutineBlocks(blocks: RoutineBlock[], movedHeads?: Map<number, number>) {
        const cores = structuredClone(EMPTY_CORES)
        let earliestBlock = Infinity

        const blockElems = []
        const intervals: [number, number][] = []
        
        let firstAwakeMin = 1441
        let asleepAtMin = -1
        let tagMap = new Map<string, TagBreakDown>()

        for (let i = 0; i < blocks.length; i++) {
            // create block
            const block = blocks[i]
            const blockElem = this.createRoutineBlockElem(block, intervals, movedHeads)

            const headOffsetPx = (block.startTime / 1440) * this.containerElemHt

            earliestBlock = Math.min(earliestBlock, headOffsetPx)
            firstAwakeMin = Math.min(firstAwakeMin, block.startTime)
            asleepAtMin   = Math.max(asleepAtMin, block.endTime)

            blockElems!.push({ ...blockElem, id: `${i}` })

            // tally cores
            this.updateCoresFromBlock(block, cores)
            this.updateTagDataFromBlock(block, tagMap)
        }

        // count sleeping and awake time
        cores.sleeping.totalTime += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin)
        cores.awake.totalTime    = TOTAL_DAY_MINS - cores.sleeping.totalTime

        // tag breakdown
        const tagBreakdown: TagBreakDown[] = []
        tagMap.forEach((tag) => tagBreakdown.push(tag))
        tagBreakdown.sort((a, b) => b.data.totalTime - a.data.totalTime)

        return { cores, earliestBlock, blockElems, tagBreakdown }
    }

    /**
     * Creates a block element. All blocks on a time box are of this type.
     * @param block       Raw block data.
     * 
     * @param intervals   Block intervals use to track potential collisions.
     * 
     * @param movedHeads  Map that tracked off-setted blocks to avoid collision.
     *                    Used to ensure all blocks that start at the same time are aligned the same.
     * 
     * @returns           New Day block elem from raw block data.
     */
    createRoutineBlockElem(block: RoutineBlock, intervals: [number, number][], movedHeads?: Map<number, number>): RoutineBlockElem {
        const containerHt = this.containerElemHt
        const elapsedTimeMins = block.endTime - block.startTime

        const headOffsetPerc = block.startTime / 1440
        const heightPx = (elapsedTimeMins / 1440) * containerHt
        
        // ensure a BLOCK_GAP space between the blocks
        const headOffsetPx = headOffsetPerc * containerHt
        const tailOffsetPx = headOffsetPx + heightPx

        let tailGapOffset = 0

        // blocks that start at the same time should be horizontally aligned for consistency
        if (movedHeads && movedHeads.has(headOffsetPx)) {
            tailGapOffset = movedHeads.get(headOffsetPx)!
        }
        else {
            const overlappingInterval = intervals.find((interval) => headOffsetPx <= interval[1])
            tailGapOffset = overlappingInterval ? (overlappingInterval[1] - headOffsetPx + this.BLOCK_GAP) : 0

            if (movedHeads && overlappingInterval) {
                movedHeads.set(headOffsetPx, tailGapOffset)
            }
        }

        // running amounts
        intervals.push([headOffsetPx, tailOffsetPx + tailGapOffset])

        return {
            ...block,
            id: "",
            height: heightPx,
            yOffset: (headOffsetPerc * containerHt) + tailGapOffset + this.BLOCK_TOP_OFFSET,
            xOffset: 0,
        }
    }

    /**
     * Given a block, update the running tag data of a routine.
     * 
     * @param block    Block in focus
     * @param tagMap   Map to track tag stats
     * @returns 
     */
    updateTagDataFromBlock(block: RoutineBlock, tagMap: Map<string, TagBreakDown>) {
        if (!block.tag) return

        const elapsedTimeMins = block.endTime - block.startTime

        if (tagMap.has(block.tag.name)) {
            const tagData = tagMap.get(block.tag.name)!.data
            const totalTime = tagData.totalTime + elapsedTimeMins
            const total = tagData.total + 1
            const avgTime = totalTime

            const data = { totalTime, avgTime, total }
            tagMap.set(block.tag.name, { tag: block.tag, data })
            return
        }

        tagMap.set(block.tag.name, {
            tag: block.tag,
            data: { 
                totalTime: elapsedTimeMins,
                total: 1,
                avgTime: elapsedTimeMins
            }
        })
    }

    /**
     * Given a block, update the running cores of a routine.
     * @param block   Block in focus
     * @param cores   Cores of a routine
     */
    updateCoresFromBlock(block: RoutineBlock, cores: RoutineCores) {
        if (!block.activity) return

        const elapsedTimeMins = block.endTime - block.startTime
        const strIdx = block.activity as keyof typeof cores

        cores[strIdx].total++
        cores[strIdx].totalTime += elapsedTimeMins
    }

    /**
     * Get cores from a single routine.
     * @param blocks  Blocks of a routine.
     * @returns       Core data of given routine.
     */
    getRoutineBlockCores(blocks: RoutineBlock[]) {
        const cores = structuredClone(EMPTY_CORES)

        let firstAwakeMin = 1441
        let asleepAtMin = -1

        for (let block of blocks) {
            this.updateCoresFromBlock(block, cores)

            firstAwakeMin = Math.min(firstAwakeMin, block.startTime)
            asleepAtMin   = Math.max(asleepAtMin, block.endTime)
        }

        cores.sleeping.totalTime += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin)
        cores.awake.totalTime    =  TOTAL_DAY_MINS - cores.sleeping.totalTime

        return cores
    }

    /**
     * @param id  Id of block
     * @returns   Block
     */
    getDailyRoutineBlock(id: string) {
        return get(this.focusedDayRoutineElems)!.find((block) => block.id === id)
    }

    /**
     * Given a focused routine and its elems add the new block in the routine.
     * @param newBlock   New block to be incorporated into routine.
     */
    makeNewRoutineBlock(newBlock: RoutineBlockElem) {
        let blocks = get(this.focusedDayRoutineElems)!
        blocks.push(newBlock)
        blocks.sort((a, b) => a.startTime - b.startTime)

        this.focusedDayRoutineElems.set(blocks)
        const block = {
            title: newBlock.title,
            color: newBlock.color,
            startTime: newBlock.startTime,
            endTime: newBlock.endTime,
            activity: newBlock.activity,
            description: newBlock.description,
            tag: newBlock.tag,
            tasks: []
        }

        const focusedDayRoutine = get(this.focusedDayRoutine)!

        // is current focused daily routine saved by user 
        const isSetDailyRoutine = "blocks" in focusedDayRoutine

        if (isSetDailyRoutine) {
            this.focusedDayRoutine.update((routine) => ({
                ...routine!, blocks: [...(routine! as DailyRoutine).blocks, block]
            }))
        }
        else {
            this.focusedDayRoutine.update((routine) => ({ ...routine!, block }))
        }

    }

    /* Block Updates Functionality */

    deleteEditBlockElem() {
        const editBlock = get(this.editingBlock)!

        this.focusedDayRoutineElems.update((blocks) => (
            blocks!.filter((block) => block.id !== editBlock.id)
        ))
    }

    changeEditBlockColor(color: Color | null) {
        if (!color) return
        const editBlock = get(this.editingBlock)!
        
        this.focusedDayRoutineElems.update((blocks) => (
            blocks!.map((block) => block.id === editBlock.id ? { ...block, color } : block)
        ))
    }

    duplicateEditBlockElem() {
        const dupBlock = get(this.editingBlock)!
        const length = get(this.focusedDayRoutineElems)!.length
        const { startTime: oldStartTime, endTime: oldEndTime } = dupBlock
        const newId = length + ""

        // move down by total amount
        const totalTime = oldEndTime - oldStartTime

        const { startTime, endTime, height, yOffset } = this.getSafePropsAfterLift({
            startTime: oldStartTime + totalTime, 
            endTime: oldEndTime + totalTime,
            blockTotalTime: totalTime
        }, newId)!

        this.makeNewRoutineBlock({
            ...dupBlock, height, yOffset,
            startTime, endTime,
            id: newId
        })
    }

    /* UI Edits Interaction */

    openEditBlockModal() {
        this.editContext.set("details")
    }

    resetEditState() {
        this.editingBlock.set(null)
    }

    onEditModalClose(updatedBlock: RoutineBlockElem | null) {
        this.editContext.set(null)
        this.editingBlock.set(null)
        this.editingBlockRef = null

        if (!updatedBlock) return

        this.focusedDayRoutineElems.update((blocks) => (
            blocks!.map((block) => block.id === updatedBlock.id ? { ...block, ...updatedBlock } : block)
        ))
    }

    getColorPickerPos() {
        const containerWidth = this.containerElem!.clientWidth - 35
        const containerHeight = this.containerElem!.clientHeight
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: this.cursorPos.left - 80
        }

        const { left, top } = intContextMenuPos(
            { height: 206, width: 175 }, cursorPos, 
            { height: containerHeight, width: containerWidth }
        )

        return {
            left, top: top + scrollTop - 60
        }
    }

    onBlockContextMenu(id: string) {
        const editBlock = this.getDailyRoutineBlock(id)!
        const containerWidth = this.containerElem!.clientWidth - 35
        const containerHeight = this.containerElem!.clientHeight
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: this.cursorPos.left - 20
        }

        const { top, left } = intContextMenuPos(
            { height: 130, width: 130}, cursorPos, 
            { height: containerHeight, width: containerWidth }
        )

        this.editingBlock.set(editBlock)
        this.contextMenuPos.set({
            left, top: top + scrollTop
        })
    }
    
    closeContextMenu(isEditActive: boolean) {
        this.contextMenuPos.set({ left: 0, top: 0 })

        // only close if user is no longer editing
        if (!isEditActive) {
            this.editingBlock.set(null)
            this.editContext.set(null)
        }
    }

    /**
     * On mouse move handler for time box.
     */
    timeBoxMouseMove = (event: PointerEvent) => {
        const rect = this.containerElem!.getBoundingClientRect()
        const scrollLeft = this.containerElem!.scrollLeft
        const scrollTop = this.containerElem!.scrollTop
        
        const left = event.clientX - rect.left + scrollLeft
        const top = event.clientY - rect.top + scrollTop
        
        this.cursorPos = { left, top }
    }

    /**
     * Init old stretch edit
     * Will init an stretch or lift edit state if appropriate.
     * 
     * @param e 
     * @param isDragFromHead   If user is dragging from block's head.
     */
    initOldStretchEdit(e: PointerEvent, isDragFromHead: boolean) {
        this.isDragLiftFromHead = isDragFromHead

        this.initDragStretchEdit(this.blockOnPointerDown! , true)

        requestAnimationFrame(() => {
            const stretchBlock = getElemById("edit-block")!
            stretchBlock.setPointerCapture(e.pointerId)
        })

        // uses the handler directly since there is no drag distance threshold
        this.containerElem!.addEventListener("pointermove", this.onBlockStretchEditHandler)
        this.containerElem!.addEventListener("pointerup", this.onBlockStrechEditEnd)
    }

    /**
     * 
     * @param event  Mouse event from on-block click
     * @returns      If user has clicked on the bottom or top edge of the block.
     */
    isBlockMouseDownOnEdge(event: PointerEvent) {
        const target = event.target as HTMLElement
        const block = findAncestor({ 
            queryStr: "routine-blocks__block",
            child: target,
            strict: true,
            queryBy: "class"
        })

        const { top, bottom } = block!.getBoundingClientRect()
        const edgeThreshold = 4

        const isOnTopEdge    = event.clientY <= top + edgeThreshold
        const isOnBottomEdge = event.clientY >= bottom - edgeThreshold

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
        this.editingBlock.set(block)
        this.editContext.set("lift")
    }

    /**
     * Handler for when the mouse moves after user clicks on a lift move area.
     * Will become call handler for moving a lifted, editing block if a lift edit has been allowed.
     * 
     * @param event 
     */
    onBlockMouseMove = (e: PointerEvent) => {
        e.preventDefault()

        if (!this.allowLiftEdit) { 
            const dragDistance = getDistanceBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (dragDistance > this.DRAG_DISTANCE_THRESHOLD) {
                this.intDragLiftMoveEdit(this.blockOnPointerDown!)
                this.allowLiftEdit = true
            }
        }
        if (this.allowLiftEdit) {
            this.blockLiftMoveHandler(e)
        }
    }

    /**
     * Handler for when user moves a lifted, editing block.
     * Updates the block's start, end times, and offset.
     * 
     */
    blockLiftMoveHandler = (e: PointerEvent) => {
        let editBlock = get(this.editingBlock)!

        // edit block positions
        let dragTopOffset  = this.cursorPos.top - this.initDragLiftOffsets.top
        let dragLeftOffset  = this.cursorPos.left - this.initDragLiftOffsets.left

        // start, end, yOffset
        let { startTime, yOffset } = this.getStartTimeAndOffsetFromTopOffset(dragTopOffset)
        yOffset += this.BLOCK_TOP_OFFSET

        const endTime = startTime + this.editingBlockTotalTime
        
        // prevent end time out of bounds
        if (endTime < 1440) {
            editBlock = { ...editBlock, startTime, yOffset, endTime }
        }
        else {
            yOffset = editBlock.yOffset
        }
        
        // prevent x offset out of bounds
        let xOffset         = Math.max(dragLeftOffset, 0)
        const floatingBlock = getElemById("edit-block")
        const boundWidth    = this.blocksContainerRef!.clientWidth
        const boundBottom   = this.containerElem!.clientHeight

        if (floatingBlock) {
            const floatingToXOffset = floatingBlock!.clientWidth + xOffset

            const diff = boundWidth - floatingToXOffset
            if (diff < 10) {
                xOffset = editBlock.xOffset
            }
        }

        console.log({ xOffset })

        // scroll when near boarder
        const windowTopOffset   = this.cursorPos.top - this.containerElem!.scrollTop
        const windowLeftOffset  = this.cursorPos.top - this.containerElem!.scrollTop

        const isNearTop = windowTopOffset < 10
        const isNearBottom = boundBottom - windowLeftOffset < 20

        if (isNearTop) {
            this.containerElem!.scrollTop -= 5
        }
        if (isNearBottom) {
            this.containerElem!.scrollTop += 5
        }


        // updatte positioning and times of drop area and floating
        const safeProps = this.getSafePropsAfterLift({
            startTime: editBlock.startTime, endTime: editBlock.endTime, 
            blockTotalTime: editBlock.endTime - editBlock.startTime
        })

        // drop area block uses safe positions
        this.editingBlock.update((block) => ({ 
            ...block!, ...safeProps, xOffset, yOffset,
            dropAreaOffset: {
                top: safeProps.yOffset, left: xOffset
            }
        })) 
    }


    /**
     * Get the startime, endtime, height, and yOffset after a lift edit such that they do not overlap with other blocks.
     * And does not physically collid with other blocks.
     * 
     * @param times  Start time, end time, and total block time of the move location.
     * @param id     The id of the block lift, if none is provided, will use the edit block by default. 
     * 
     * @returns      Start time, yOffset, end time, height of block after lift edit.
     */
    getSafePropsAfterLift(times: { startTime: number, endTime: number, blockTotalTime: number }, id?: string) {
        const startTime  = this.getStartTimeFromDragLiftEdit({ 
            startTime: times.startTime, endTime: times.endTime
        }, id)
        
        const _endTime  = startTime + times.blockTotalTime

        // find closest nbrs
        this.editBlockBottomNbr = this.findBlockClosestBottomNbr(_endTime, true)
        this.editBlockTopNbr    = this.findBlockClosestTopNbr(startTime)
        
        // they have to be touching
        this.editBlockBottomNbr = this.editBlockBottomNbr?.startTime === _endTime ? this.editBlockBottomNbr : null
        this.editBlockTopNbr    = this.editBlockTopNbr?.endTime === startTime ? this.editBlockTopNbr : null

        const { height, yOffset, endTime } = this.getEditBlockSafeProps(startTime, _endTime, false)!

        return { startTime, yOffset, endTime, height }
    }

    /**
     * Mouse up for a routine block.
     * 
     * If an edit made was made:
     * Puts the block in the closest allowable start position.
     * Resets the edit state
     * 
     * If there wasn't a lift edit, toggle the edit routine modal.
     * 
     */
    onBlockMouseUp = () => {
        if (this.allowLiftEdit) {

            const dropAreaBlock = get(this.editingBlock)!
            const { endTime, startTime, dropAreaOffset } = dropAreaBlock
    
            const editedBlockELem = { 
                ...dropAreaBlock, startTime, endTime,
                yOffset: dropAreaOffset!.top, xOffset: dropAreaOffset!.left
            }

            editedBlockELem.dropAreaOffset = undefined
    
            this.focusedDayRoutineElems.update((blocks) => (
                blocks!.map((block) => (block.id === dropAreaBlock.id ? editedBlockELem : block))
            ))

            this.editContext.set(null)
            this.editingBlock.set(null)
            this.editingBlockTotalTime     = -1
            this.editingBlockInitStartTime = -1
    
            this.dragStartPoint = { left: -1, top: -1 }
    
            this.allowLiftEdit = false
            this.editTargetElem = null
            this.initDragLiftOffsets = { top: -1, left: -1 }
        }
        else {
            this.editContext.set("details")
        }

        this.containerElem!.removeEventListener("pointermove", this.onBlockMouseMove)
        this.containerElem!.removeEventListener("pointerup", this.onBlockMouseUp)
    }

    /**
     * Get the start time after the end of a lift edit.
     * If the start time is impossible (ovrlapping with other blocks), find the nearest allowable start time.
     * 
     * @param editBlock 
     * @param id         Id of block on the move. Will be the current edit block by default.
     * 
     * @returns          New start time, following life edit.
     */
    getStartTimeFromDragLiftEdit(times: { startTime: number, endTime: number }, id?: string) {
        const { startTime, endTime } = times

        const editId = id ? id : get(this.editingBlock)!.id
        const blocks = get(this.focusedDayRoutineElems)!

        // Check for overlapping intervals
        const overlappingInterval = blocks.find((block) => {
            if (block.id === editId) return false

            const { startTime: intStart, endTime: intEnd } = block

            const startOverlap = intStart  <= startTime && startTime <= intEnd
            const endOverlap   = intStart  <= endTime  && endTime <= intEnd
            const hasIntInside = startTime <= intStart && intEnd <= endTime

            return hasIntInside || startOverlap || endOverlap
        })
 
        if (!overlappingInterval) {
            return startTime
        }

        return this.findNearestClosestTimeOpening(times, id)
    }

    /**
     * Find the nearest allowable space for a block to an impossible desired start time.
     * 
     * @param editBlock  Block currently being edited.
     * @param id         Id of block on the move. Will be the current edit block by default.
     * 
     * @returns          The start time that puts the bock in the nearest allowable space to the desired start time.
     */
    findNearestClosestTimeOpening(times: { startTime: number, endTime: number }, id?: string) {
        // has been edited as user has been moving
        const { startTime, endTime } = times
        const totalTime = endTime - startTime

        let nearestStartTime = this.editingBlockInitStartTime
        let shortedDistanceToDesiredStart = Infinity
        let movedUp = null

        const editId = id ? id : get(this.editingBlock)!.id
        const blocks = get(this.focusedDayRoutineElems)!

        let intervals: { id: string, interval: [number, number] }[] = []

        // create intervals, do not include current block
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i]
            if (block.id === editId) continue

            intervals.push({
                id: block.id, interval: [block.startTime, block.endTime]
            })
        }
    
        // find the closest available space (either very top or bottom of any given interval)
        intervals.forEach((int, idx) => {
            if (int.id === editId) return
            const [intStart, intEnd] = int.interval

            // prev interval
            const prevIntervalIdx   = idx - 1 >= 0 ? idx - 1 : -1
            const prevInterval      = prevIntervalIdx >= 0 ? intervals[prevIntervalIdx].interval : null
            const prevIntervalEnd = prevInterval ? prevInterval[1] : 0

            // next interval
            const nextIntervalIdx   = idx + 1  < intervals.length ? idx + 1 : -1
            const nextInterval      = nextIntervalIdx >= 0 ? intervals[nextIntervalIdx].interval : null
            const nextIntervalStart = nextInterval ? nextInterval[0] : 1440

            // see if space is available
            const topSpace = Math.abs(intStart - prevIntervalEnd)
            const bottomSpace = Math.abs(nextIntervalStart - intEnd)

            const canFitTop = totalTime <= topSpace
            let  topStartingPoint = 1440

            const canFitBottom = totalTime <= bottomSpace
            let  bottomStartingPoint = 1440

            // find starting point in terms of current interval's top edge or bottom edge
            if (canFitTop) {
                topStartingPoint = intStart - totalTime  // int start is the new end point
            }
            if (canFitBottom) {
                bottomStartingPoint = intEnd
            }

            // calculate the porjected vertical distances between the desired start time and project start time
            const intStartDistance = canFitTop ? Math.abs(topStartingPoint - startTime) : 1440
            const intEndDistance   = canFitBottom ? Math.abs(bottomStartingPoint - startTime) : 1440

            // should take top starting point if that dstance is shorter
            const shouldMoveUp     = intStartDistance < intEndDistance

            const _shortedDistanceToDesiredStart = shouldMoveUp ? intStartDistance : intEndDistance
            const _nearestStartTime              = shouldMoveUp ? topStartingPoint : bottomStartingPoint

            if (_shortedDistanceToDesiredStart < shortedDistanceToDesiredStart) {
                nearestStartTime = _nearestStartTime
                shortedDistanceToDesiredStart = _shortedDistanceToDesiredStart

                movedUp = shouldMoveUp
            }

        })
        return nearestStartTime
    }

    /* Stretch Edit Functionality  */

    /**
     * The line where if user crosses on a strech, the start / end itme will switch.
     * 
     * @param editBlock         Block being edited
     * @param isDraggingByTail  Is user stretching from the bottom edge of the block
     * 
     * @returns                 The pivot point y-offset location. 
     */
    getDragPivotPointTopOffset(editBlock: RoutineBlockElem, isDraggingByTail: boolean) {
        const totalHeight = editBlock.height
        return isDraggingByTail ? this.cursorPos.top - totalHeight : this.cursorPos.top + totalHeight
    }

    /**
     * Initialize a strech edit state
     * 
     * @param isEditingExisting  Is user stretch-editing a new block!
     */
    initDragStretchEdit(block: RoutineBlockElem, isEditingExisting = false) {
        const isDraggingByTail = !this.isDragLiftFromHead
        this.pivotPointTopOffset = this.getDragPivotPointTopOffset(block, isDraggingByTail)

        if (isEditingExisting) {
            this.editContext.set("old-stretch")
        }
        else {
            this.editContext.set("new-stretch")
        }

        // the time where if the start / end passes (passed the pivot poimt) the start and end time switches
        this.stretchPivotTime = isDraggingByTail ? block.startTime : block.endTime

        // find closest nbrs
        this.editBlockTopNbr = this.findBlockClosestTopNbr(block.startTime)
        this.editBlockBottomNbr = this.findBlockClosestBottomNbr(block.startTime)
    }

    /**
     * Mouse down event on Time Box (routine blocks container).
     * 
     * @param e 
     */
    onTimeBoxMouseDown(e: PointerEvent) {
    }

    onTimeBoxMouseMove = (e: PointerEvent) => {
        if (!this.allowStrechEdit) {
            const dragDistance = getDistanceBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (dragDistance <= this.NEW_BLOCK_DRAG_DIST_THRESHOLD) return

            // init new block strech edit data
            const containerHt = this.containerElemHt
            const startTime = roundUpToNearestFive((this.dragStartPoint!.top / containerHt) * TOTAL_DAY_MINS)
    
            this.editingBlock.set({
                id: get(this.focusedDayRoutineElems)!.length + "",
                title: "Untitled Block",
                color: randomArrayElem(COLOR_SWATCHES.d),
                startTime, endTime: startTime,
                height: 0, xOffset: 0, yOffset: 0,
                description: "",
                activity: null, tag: null,
                tasks: []
            })

            requestAnimationFrame(() => {
                const stretchBlock = getElemById("edit-block")!
                stretchBlock.setPointerCapture(e.pointerId)
            })
    
            this.initDragStretchEdit(get(this.editingBlock)!, false)
            this.allowStrechEdit = true
        }
        if (this.allowStrechEdit) {
            this.onBlockStretchEditHandler(e)
        }
    }

    /**
     * Handler for when user changes the start / end time when streching an element.
     * Used when editing existing or making new blocks.
     * 
     * @param e   Mouse Event
     */
    onBlockStretchEditHandler = (e: Event) => {
        e.preventDefault()
        if (!this.editTargetElem) {
            this.editTargetElem = e.target as HTMLElement
            this.editTargetElem.style.cursor = "ns-resize"
        }

        const containerHt = this.containerElemHt
        const yOffsetMins = (this.cursorPos.top / containerHt) * TOTAL_DAY_MINS
        const yChange     = this.pivotPointTopOffset - this.cursorPos.top

        if (yChange === 0) return

        const belowPivotLine = yChange < 0
        let { startTime, endTime } = this.getEditBlockTimesFromStrechEdit(belowPivotLine, yOffsetMins)

        startTime = Math.max(roundUpToNearestFive(startTime), 0)
        endTime   = Math.max(roundUpToNearestFive(endTime), 0)

        const { height, yOffset, endTime: _endTime, startTime: _startTime }  = this.getEditBlockSafeProps(startTime, endTime)
        endTime = _endTime
        startTime = _startTime

        if (endTime - startTime < this.MIN_BLOCK_DURATION_MINS) return null

        const updatedProps = {
            startTime, endTime,
            height, yOffset
        }

        this.editingBlock.update((block) => ({ ...block!, ...updatedProps }))
    }

    onEndTimeChangeFromModal(startTime: number, endTime: number, newEndTime: number) {
        this.editBlockBottomNbr = this.findBlockClosestBottomNbr(endTime)
        newEndTime  = Math.max(roundUpToNearestFive(newEndTime), 0)

        const { height, endTime: _endTime }  = this.getEditBlockSafeProps(startTime, newEndTime)
        return { height, endTime: _endTime }
    }

    /* Edit Helpers */

    /**
     * Gets the height, yOffset, endTime of an edit block.
     * Ensures that the props returned will never allow the block to collide with other blocks.
     * Returns null if the block is too short.
     * 
     * @param startTime     Calculated start time after edit.
     * @param endTime       Calculated end time after edit.
     * @param forStrechEdit Is for a strech edit.
     * @returns             Height, end time, top offset OR null if the block will be too short.
     */
    getEditBlockSafeProps(startTime: number, endTime: number, forStrechEdit = true) {
        const containerHt = this.containerElemHt

        // see if there is a collision with top and bottom nbrs
        let topCollision    = this.editBlockTopNbr && (startTime <= this.editBlockTopNbr.endTime)
        let bottomCollision = this.editBlockBottomNbr && (endTime >= this.editBlockBottomNbr.startTime)

        // new times from lift edits will never overlap other blocks due to the overlapping block check
        // if colliding, then fix start and end times to their max and min values
        if (forStrechEdit) {
            startTime = topCollision ? this.editBlockTopNbr!.endTime : startTime
            endTime   = bottomCollision ? this.editBlockBottomNbr!.startTime : endTime
        }

        endTime = Math.min(endTime, 1439)
        
        // if less than min, then use the prev allowed time || don't make at all
        const elapsedTimeMins = endTime - startTime 
        const { yOffset, offset }  = this.getEditBlockTopOffset(startTime)

        let height = (elapsedTimeMins / 1440) * containerHt
        height    -= bottomCollision ? (this.BLOCK_GAP + offset) : 0
        
        return { height, yOffset, endTime, startTime }
    }

    /**
     * Get the top offset from a top offset cursor position
     * @param topOffset  Y offset cursor position
     * @returns          Start time in minuts from offset cursor position.
     */
    getStartTimeAndOffsetFromTopOffset(topOffset: number) {
        const containerHt   = this.containerElemHt
        
        const topOffsetMins = (topOffset / containerHt) * TOTAL_DAY_MINS
        const startTime     = Math.max(roundUpToNearestFive(topOffsetMins), 0)
        const yOffset       = (startTime / 1440) * containerHt

        return { startTime, yOffset }
    }

    /**
     * When stretch editing a block, get the new start and end times.
     * 
     * @param    belowPivotLine   If user is below the stretch pivot line.
     *                            The line where if passed, the start / end itme will switch.
     * @param    changingTime     The calculated time from the change in position.
     * 
     * @returns  New start and end times from strech edit.
     */
    getEditBlockTimesFromStrechEdit(belowPivotLine: boolean, changingTime: number) {
        const pivotTime = this.stretchPivotTime
        const isDraggingByTail = !this.isDragLiftFromHead

        // start time & end time take turns taking on the top offset depending on direction of gesture
        let startTime = 0
        let endTime   = 0
        
        // start and end time switch if there has been a pivot
        if (isDraggingByTail) {
            startTime = !belowPivotLine ? changingTime : pivotTime
            endTime   = !belowPivotLine ? pivotTime : changingTime
        }
        else {
            startTime = belowPivotLine ? pivotTime : changingTime
            endTime   = belowPivotLine ? changingTime : pivotTime
        }
        
        return { startTime, endTime }
    }

    /**
     * Get the edit block's new top offset after positioning has changed.
     * Ensurs that it doesn't collide with top neighbor.
     * 
     * @param   startTime      New calculated start time from a change in position
     * @param   forStrechEdit  Is for stretch edit
     * 
     * @returns Resulting topoffset and the offset if there is a top collision.
     */
    getEditBlockTopOffset(startTime: number) {
        let topOffset = ((startTime / 1440) * this.containerElemHt) + this.BLOCK_TOP_OFFSET

        const topNbr = this.editBlockTopNbr
        if (!topNbr) return { yOffset: topOffset, offset: 0 }
        
        // has top nbr
        const topNbrBottomEdge = topNbr.yOffset + topNbr.height
        const diff = topOffset - topNbrBottomEdge
        let offset = 0

        if (diff >= this.BLOCK_GAP) {
            return { yOffset: topOffset, offset: 0 }
        }
        else if (diff >= 0) {
            offset = this.BLOCK_GAP - diff
            return { yOffset: topOffset + offset, offset }
        }
        else {
            offset = Math.abs(diff) + this.BLOCK_GAP
            return { yOffset: topOffset + offset, offset }
        }
    }

    /**
     * @param blockEndTime    The block's end time
     * @returns               Block's closest bottom nbr
     */
    findBlockClosestBottomNbr(blockEndTime: number, inclusive = false): RoutineBlockElem | null {
        let closestStartTime = 1441
        let closestBottomNbr = null

        get(this.focusedDayRoutineElems)!.forEach(block => {
            // cant be <= as end time will be start time when an edit block is created
            // so disallow selecting self as a neighbor
            const flag = inclusive ? blockEndTime <= block.startTime : blockEndTime < block.startTime 

            if (flag && block.startTime < closestStartTime) {
                closestStartTime = block.startTime
                closestBottomNbr = block
            }
        })

        return closestBottomNbr
    }

    /**
     * @param blockStartTime   The block's start time
     * @returns                Block's closest top nbr
     */
    findBlockClosestTopNbr(blockStartTime: number): RoutineBlockElem | null {
        let closestEndTime = -1
        let closestTopNbr = null

        get(this.focusedDayRoutineElems)!.forEach(block => {
            if (blockStartTime >= block.endTime && block.endTime > closestEndTime) {
                closestEndTime = block.endTime
                closestTopNbr = block
            }
        })

        return closestTopNbr
    }

    onBlockStrechEditEnd = () => this.endBlockStretchEditHandler()

    endBlockStretchEditHandler() {
        if (this.editTargetElem) {
            this.editTargetElem.style.cursor = "default"
            this.editTargetElem = null
        }
        
        const editBlock = get(this.editingBlock)
        const editContext = get(this.editContext)!

        if (editContext === "new-stretch") {
            this.makeNewRoutineBlock(editBlock!)
            // this.editContext.set("details")
        }
        else if (editContext === "old-stretch") {
            this.focusedDayRoutineElems.update(blocks => blocks!.map(block => (editBlock && block.id === editBlock.id ? editBlock : block)))

            // this.editContext.set(null)
        }
        
        this.editingBlock.set(null)
        this.editContext.set(null)
        this.editBlockBottomNbr = null
        this.editBlockTopNbr = null
        this.isDragLiftFromHead = null
        this.pivotPointTopOffset = -1
        this.allowStrechEdit = false
        this.stretchPivotTime = -1

        // end handler removals are hanlded in the children, as they have their own implementations of event listeners
    }

    getBlockElem(id: string) {
        return get(this.focusedDayRoutineElems)?.find(block => block.id === id)
    }
    getDOMBlockElem(id: string) {
        return getElemById(`daily-routine-block--${id}`) as HTMLElement
    }
}

/**
 * Manager object for "Daily Routines" page
 */
export class DailyRoutinesManager extends RoutinesManager {
    /**
     * @param data   Daily Routines - All the daily routines that user has made              
     */
    constructor(data: DailyRoutine[], blockTopOffset: number) {
        super(true)
        this.userRoutines.set(data as DailyRoutine[])
        this.BLOCK_TOP_OFFSET = blockTopOffset
    }

    /**
     * Initialize all user routines 
     * @param routineId       Current routine in view 
     */
    initFocusRoutine(focusedDayRoutineId: string) {
        let currFocusedDayRoutine = get(this.focusedDayRoutine) as DailyRoutine | undefined
        if (focusedDayRoutineId === currFocusedDayRoutine?.id) return

        const routine = get(this.userRoutines)!.find((routine) => routine.id === focusedDayRoutineId)!
        this.focusedDayRoutine.set(routine)

        currFocusedDayRoutine = get(this.focusedDayRoutine) as DailyRoutine

        this.currCores.set((this.getRoutineBlockCores(routine.blocks)))

        const { cores, earliestBlock, blockElems, tagBreakdown } = this.processRoutineBlocks(currFocusedDayRoutine.blocks)

        this.currCores.set(cores)
        this.currTagBreakdown.set(tagBreakdown)

        this.earliestBlockHeadPos = earliestBlock
        this.focusedDayRoutineElems.set(blockElems)

        // ensure that the earliest block is close to the top edge of scrollable
        this.containerElem!.classList.add("hide-scroll-bar")
        this.containerElem!.scrollTop = earliestBlock - 15

        setTimeout(() => this.containerElem!.classList.remove("hide-scroll-bar"), 0)
    }

    /**
     * Updates a selected daily routine's title
     * @param title 
     */
    updateTitle = (title: string) => {
        this.focusedDayRoutine.update((routine) => {
            if (!routine) return routine
            
            return { ...routine, title }
        })
    }

    /**
     * Updates a selected daily routine's description
     * @param title 
     */
    updateDescription = (description: string) => {
        this.focusedDayRoutine.update((routine) => {
            if (!routine) return routine

            return { ...routine, description }
        })
    }

    onBlockPointerDown(e: PointerEvent, id: string) {
        if (e.button === 2) return

        this.blockOnPointerDown = this.getDailyRoutineBlock(id)!
        this.editingBlockRef = this.getDOMBlockElem(id)
        this.editingBlock.set(this.blockOnPointerDown)

        const { isOnTopEdge, isOnBottomEdge } = this.isBlockMouseDownOnEdge(e)

        if (isOnTopEdge || isOnBottomEdge) {
            this.initOldStretchEdit(e, isOnTopEdge)
        }
        else {
            this.dragStartPoint = this.cursorPos

            requestAnimationFrame(() => {
                const floatingBlock = getElemById("edit-block")!
                floatingBlock.setPointerCapture(e.pointerId)
            })

            this.containerElem!.addEventListener("pointermove", this.onBlockMouseMove)
            this.containerElem!.addEventListener("pointerup", this.onBlockMouseUp)
        }
    }

    onTimeBoxMouseDown(e: PointerEvent) {
        const target = e.target as HTMLElement

        if (target.id != this.ROUTINE_BLOCKS_CONTAINER_ID || e.button === 2) {
            return
        }

        this.dragStartPoint = this.cursorPos

        this.containerElem!.addEventListener("pointermove", this.onTimeBoxMouseMove)
        this.containerElem!.addEventListener("pointerup", this.onBlockStrechEditEnd)
    }

    onBlockStrechEditEnd = () => {
        super.endBlockStretchEditHandler()

        // drag start point was made if a new block was made 
        // as a drag threshold exists for a new block strech edit
        const wasNewBlockEdit = this.dragStartPoint!.top != -1

        if (wasNewBlockEdit) {
            this.containerElem!.removeEventListener("pointermove", this.onTimeBoxMouseMove)
        }
        else {
            this.containerElem!.removeEventListener("pointermove", this.onBlockStretchEditHandler)
        }

        this.containerElem!.removeEventListener("pointerup", this.onBlockStrechEditEnd)
        this.dragStartPoint = { left: -1, top: -1 }
    }
}

/**
 * Manager object for "Current" page
 */
export class WeeklyRoutinesManager extends RoutinesManager {
    currWeekRoutine:      Writable<WeeklyRoutine | null> = writable(null)
    currWeekRoutineElems: Writable<WeekBlockElems | null> = writable(null)

    editDayKey: keyof WeeklyRoutineBlocks | null = null
    editDayKeyStore: Writable<keyof WeeklyRoutineBlocks | null> = writable(null)

    editDayIdx = -1
    dayColXOffset = 0
    weekCores = structuredClone(EMPTY_CORES)

    DAYS_WEEK = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ]

    /**
     * @param data   User's currently chosen routine 
     */
    constructor(weekRoutine: WeeklyRoutine) {
        super(false)

        this.currWeekRoutine.set(weekRoutine)
        this.currWeekRoutineElems.set({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] })
    }


    /**
     * Updates a selected daily routine's title
     * @param title 
     */
    updateTitle = (title: string) => {
        this.currWeekRoutine.update((routine) => {
            if (!routine) return routine
            
            return { ...routine, title }
        })
    }

    /**
     * Updates a selected daily routine's description
     * @param title 
     */
    updateDescription = (description: string) => {
        this.currWeekRoutine.update((routine) => {
            if (!routine) return routine

            return { ...routine, description }
        })
    }

    /**
     * Proceses weekly routine by extracting breakdown data and create routine element blocks to be displayed.
     */
    processWeeklyRoutine() {
        const routineElems = get(this.currWeekRoutineElems)!
        const movedHeads = new Map<number, number>()

        // analytics
        const weekCores = structuredClone(EMPTY_CORES)
        const weekTagData: TagBreakDown[] = []
        
        let i = 0
        
        for (let day of this.DAYS_WEEK) {
            const   dayDataList = get(this.currWeekRoutine)!.blocks[day as keyof WeeklyRoutineBlocks]
            const { cores, earliestBlock, blockElems, tagBreakdown } = this.processRoutineBlocks(dayDataList, movedHeads)

            // get elems for each day
            routineElems[day as keyof WeeklyRoutineBlocks]!.push(
                ...blockElems.map((blockElem: RoutineBlockElem, idx: number) => ({
                    ...blockElem, xOffset: 0, id: `${i}--${idx}`,
                }))
            )

            this.earliestBlockHeadPos = Math.min(earliestBlock, this.earliestBlockHeadPos)

            // tally up the stats
            this.tallyWeeklyCores(cores, weekCores)
            this.tallyWeekTagData(tagBreakdown, weekTagData)

            i++
        }
        
        this.weekCores = this.getWeekCoreAvgs(weekCores)
        this.currCores.set(weekCores)
        this.currTagBreakdown.set(weekTagData)

        this.currWeekRoutineElems.set(routineElems)
    }

    tallyWeekTagData(dayTagData: TagBreakDown[], weekTagData: TagBreakDown[]) {
        for (const tagBreakdown of dayTagData) {
            const tagIdx = weekTagData.findIndex(_tagBreakdown => _tagBreakdown.tag.name === tagBreakdown.tag.name)
    
            // If the tag doesn't exist in the weekly total data, add it
            if (tagIdx === -1) {
                weekTagData.push(tagBreakdown)
            } 
            else {
                const prevTag = weekTagData[tagIdx]
                prevTag.data.totalTime += tagBreakdown.data.totalTime
                prevTag.data.total     += tagBreakdown.data.total
                prevTag.data.avgTime    = (prevTag.data.totalTime / 7)

                weekTagData[tagIdx] = prevTag
            }
        }
    }

    tallyWeeklyCores(dayCores: RoutineCores, weekCores: RoutineCores) {
        for (const key in weekCores) {
            const _key = key as keyof typeof weekCores
            const isActivityCore = key != "sleeping" && key != "awake"

            weekCores[_key].totalTime += dayCores[_key].totalTime

            if (isActivityCore) {
                weekCores[_key].total += dayCores[_key].total
            }
        }
    }

    getWeekCoreAvgs(weekCores: RoutineCores) {
        for (const key in weekCores) {
            const core = weekCores[key as keyof typeof weekCores]

            // if there is at least one core activity
            if (core.totalTime) {
                core.avgTime = core.totalTime / 7
            }
        }
        return weekCores
    }

    /* Editing */

    onBlockPointerDown(e: PointerEvent, id: string) {
        if (e.button === 2) return

        this.initFocusColContextFromGesture({ leftOffset: this.cursorPos.left })
        this.initFocusColFromContext()

        this.blockOnPointerDown = this.getWeekBlockFromId(id)!
        
        const { isOnTopEdge, isOnBottomEdge } = this.isBlockMouseDownOnEdge(e)
        this.editingBlockRef = this.getDOMBlockElem(id)
        this.editingBlock.set({ ...this.blockOnPointerDown, xOffset: this.dayColXOffset })

        if (isOnTopEdge || isOnBottomEdge) {
            this.initOldStretchEdit(e, isOnTopEdge)
        }
        else {
            this.dragStartPoint = this.cursorPos

            requestAnimationFrame(() => {
                const floatingBlock = getElemById("edit-block")!
                floatingBlock.setPointerCapture(e.pointerId)
            })

            this.containerElem!.addEventListener("pointermove", this.onBlockMouseMove)
            this.containerElem!.addEventListener("pointerup", this.onBlockMouseUp)
        }
    }

    intWeekDragLiftMoveEdit(block: RoutineBlockElem) {
        this.intDragLiftMoveEdit(block)
    }

    /**
     * Handler for when the mouse moves after user clicks on a lift move area.
     * Will become call handler for moving a lifted, editing block if a lift edit has been allowed.
     * 
     * @param event 
     */
    onBlockMouseMove = (e: PointerEvent) => {
        e.preventDefault()

        if (!this.allowLiftEdit) { 
            const dragDistance = getDistanceBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (dragDistance > this.DRAG_DISTANCE_THRESHOLD) {
                this.intWeekDragLiftMoveEdit(this.blockOnPointerDown!)
                this.allowLiftEdit = true
            }
        }
        if (!this.allowLiftEdit) return

        const prevDay = this.editDayKey

        this.initFocusColContextFromGesture({ leftOffset: this.cursorPos.left })

        if (prevDay != this.editDayKey) {
            this.initFocusColFromContext()
        }

        this.blockLiftMoveHandler(e)
    }

    onBlockMouseUp = () => {
        if (this.allowLiftEdit) {

            // extract needed props
            const dropAreaBlock = get(this.editingBlock)!
            const { endTime, startTime, dropAreaOffset } = dropAreaBlock
    
            const editedBlockELem = { 
                ...dropAreaBlock, startTime, endTime,
                yOffset: dropAreaOffset!.top, xOffset: dropAreaOffset!.left,
            }

            // update elems
            const weekElems = get(this.currWeekRoutineElems)!
            
            const oldColIdx = +editedBlockELem.id.split("--")[0]
            const oldColDayKey = this.DAYS_WEEK[oldColIdx] as keyof WeekBlockElems
            const isSameCol = this.editDayKey! === oldColDayKey
            
            // remove from old col
            let oldCol = weekElems[oldColDayKey]
            oldCol     = oldCol.filter((block) => (block.id != editedBlockELem.id))

            if (!isSameCol) {
                oldCol = oldCol.map((block, idx) => ({ ...block, id: `${oldColIdx}--${idx}`}))
            }
            
            // add to from old col
            let newCol = isSameCol ? oldCol : weekElems[this.editDayKey!]

            newCol     = [...newCol, { ...editedBlockELem }]
            newCol     = newCol.sort((a, b) => a.startTime - b.startTime)
            newCol     = newCol.map((block, idx) => ({ ...block, id: `${this.editDayIdx}--${idx}`}))


            this.currWeekRoutineElems.update((week) => {
                if (!week) return null

                week[oldColDayKey] = oldCol
                week[this.editDayKey!] = newCol

                return week
            })

            this.focusedDayRoutine.set(null)
            this.focusedDayRoutineElems.set(null)
            this.editContext.set(null)
            this.editingBlock.set(null)
            this.editingBlockTotalTime     = -1
            this.editingBlockInitStartTime = -1
            this.editDayKey = null
            this.dayColXOffset = 0
            this.editDayIdx = -1
    
            this.dragStartPoint = { left: -1, top: -1 }
    
            this.allowLiftEdit = false
            this.editTargetElem = null
            this.initDragLiftOffsets = { top: -1, left: -1 }
        }
        else {
            this.editContext.set("details")
        }

        this.containerElem!.removeEventListener("pointermove", this.onBlockMouseMove)
        this.containerElem!.removeEventListener("pointerup", this.onBlockMouseUp)
    }

    /* Making a New Block */

    onTimeBoxMouseDown(e: PointerEvent) {
        const target = e.target as HTMLElement
        if (target.id != this.ROUTINE_BLOCKS_CONTAINER_ID || e.button === 2) {
            return
        }

        this.initFocusColContextFromGesture({ leftOffset: this.cursorPos.left })
        this.initFocusColFromContext()

        this.dragStartPoint = this.cursorPos

        // doesn't use handler directly as drag distance must surpass the drag distance threshold
        this.containerElem!.addEventListener("pointermove", this.onTimeBoxMouseMove)
        this.containerElem!.addEventListener("pointerup", this.onBlockStrechEditEnd)
    }

    onTimeBoxMouseMove = (e: PointerEvent) => {
        if (!this.allowStrechEdit) {
            const dragDistance = getDistanceBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (dragDistance <= this.NEW_BLOCK_DRAG_DIST_THRESHOLD) return

            // init new block strech edit data
            const containerHt = this.containerElemHt
            const startTime = roundUpToNearestFive((this.dragStartPoint!.top / containerHt) * TOTAL_DAY_MINS)
    
            this.editingBlock.set({
                id: `${this.editDayIdx}--${get(this.focusedDayRoutineElems)!.length}`,
                title: "Untitled Block",
                color: randomArrayElem(COLOR_SWATCHES.d),
                startTime, endTime: startTime,
                height: 0, xOffset: this.dayColXOffset, yOffset: 0,
                description: "",
                activity: null, tag: null,
                tasks: []
            })

            requestAnimationFrame(() => {
                const stretchBlock = getElemById("edit-block")!
                stretchBlock.setPointerCapture(e.pointerId)
            })
    
            this.initDragStretchEdit(get(this.editingBlock)!, false)
            this.allowStrechEdit = true
        }
        if (this.allowStrechEdit) {
            this.onBlockStretchEditHandler(e)
        }
    }

    onBlockStrechEditEnd = () => {
        super.endBlockStretchEditHandler()

        const wasNewBlockEdit = this.dragStartPoint!.top != -1

        if (wasNewBlockEdit) {
            this.containerElem!.removeEventListener("pointermove", this.onTimeBoxMouseMove)
        }
        else {
            this.containerElem!.removeEventListener("pointermove", this.onBlockStretchEditHandler)
        }

        this.containerElem!.removeEventListener("pointerup", this.onBlockStrechEditEnd)
        const updatedDayRoutineElems = get(this.focusedDayRoutineElems)! as RoutineBlockElem[]

        this.currWeekRoutineElems.update((weekRoutine) => {
            if (!weekRoutine) return null

            const key = this.editDayKey! as keyof WeekBlockElems

            weekRoutine[key] = updatedDayRoutineElems
            return weekRoutine
        })

        this.focusedDayRoutine.set(null)
        this.focusedDayRoutineElems.set(null)
        this.editingBlock.set(null)

        this.dragStartPoint = { left: -1, top: -1 }
        this.editDayKey = null
        this.dayColXOffset = 0
        this.editDayIdx = -1
    }

    initFocusColContextFromGesture(gestureContext: { id?: string, leftOffset?: number}) {
        const containerWidth = this.blocksContainerRef!.clientWidth
        const colWidth = containerWidth / 7

        if (gestureContext.id) {
            this.editDayIdx  = +gestureContext.id.split("--")[0]
        }
        else {
            const leftPos = gestureContext.leftOffset! - (2 + 7)
            this.editDayIdx  = Math.floor(leftPos / colWidth)
        }

        this.editDayKey = this.DAYS_WEEK[this.editDayIdx] as keyof WeeklyRoutineBlocks
        this.dayColXOffset = (colWidth * this.editDayIdx)

        console.log(this.dayColXOffset)
    }

    initFocusColFromContext() {
        const editDayRoutine      = get(this.currWeekRoutine)!.blocks[this.editDayKey!]
        const editDayRoutineElems = get(this.currWeekRoutineElems)![this.editDayKey!]

        this.focusedDayRoutine.set(editDayRoutine)
        this.focusedDayRoutineElems.set(editDayRoutineElems)
    }

    /**
     * @param id  Id of block
     * @returns   Block
     */
    getWeekBlockFromId(id: string) {
        const dayPropIdx = +id.split("--")[0]
        const dayProp = this.DAYS_WEEK[dayPropIdx] as keyof WeeklyRoutineBlocks

        return get(this.currWeekRoutineElems)![dayProp].find((block) => block.id === id)
    }

    getDOMBlockElem(id: string) {
        return getElemById(id) as HTMLElement
    }

    getDayIdx(key: string) {
        return key as keyof WeeklyRoutineBlocks
    }
}