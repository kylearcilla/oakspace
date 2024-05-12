import { get, writable, type Writable } from "svelte/store"
import { TOTAL_DAY_MINS } from "./utils-date"
import { EMPTY_CORES, ViewOption } from "./utils-routines"

import { 
    COLOR_SWATCHES, findAncestor, getDistanceBetweenTwoPoints, getElemById, 
    getElemNumStyle, intContextMenuPos, 
    randomArrayElem, roundUpToNearestFive 
} from "./utils-general"

type RoutineBlockEditContext = "old-stretch" | "lift" | "details" | "new-stretch"

/**
 * Manger class for editing and displaying routines.
 * Used in daily / weekly routine pages.
 */
export class RoutinesManager {
    userRoutines:   Writable<DailyRoutine[] | RoutineBlock[] | null> = writable(null)
    
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
    editingBlock: Writable<RoutineBlockElem & { 
        dropArea?: {
            top: number,
            left: number
            offsetIdx: number
        } 
    } | null> = writable(null)

    editingBlockRef:    HTMLElement | null = null
    blockOnPointerDown: RoutineBlockElem | null = null
    floatingBlock:      HTMLElement | null = null
    
    editBlockTopNbr:    RoutineBlockElem | null = null
    editBlockBottomNbr: RoutineBlockElem | null = null
    
    editingBlockTotalTime     = -1
    editingBlockInitStartTime = -1
    stretchPivotTime = 0
    
    initDragLiftOffsets: OffsetPoint = { left: -1, top: -1 }
    dragStartPoint:      OffsetPoint = { left: -1, top: -1 }
    draggingSourceIdx = -1
    allowLiftEdit     = false
    allowStrechEdit   = false

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
    blocksContainerRef: HTMLElement | null = null
    containerElemHt        = 1200
    earliestBlockHeadPos   = TOTAL_DAY_MINS
    interval: NodeJS.Timer | null = null

    cursorPos: OffsetPoint = { left: 0, top: 0 }
    cursorPosFromWindow: OffsetPoint = { left: 0, top: 0 }

    
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
    TIME_BOX_POINTER_EVENT_OFFSET = 15
    ROUTINE_BLOCKS_CONTAINER_ID = "routine-blocks-container"
    ROUTINE_SCROLL_CONTAINER_ID = "routine-blocks-scroll-container"
    
    BLOCKS_LEFT_OFFSET = 35

    /**
     * Initialize references to parent contains for the routine blocks.
     * @param scrollContainer   Block area's nearest scroll parent container.
     * @param blocksContainer   Block area's nearest parent container
     */
    initContainer(scrollContainer: HTMLElement, blocksContainer: HTMLElement) {
        this.containerElem = scrollContainer
        this.blocksContainerRef = blocksContainer
        this.containerElemHt = scrollContainer.scrollHeight - getElemNumStyle(blocksContainer, "padding-bottom")
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
    processRoutineBlocks(routines: RoutineBlock[] | DailyRoutine) {
        const cores = structuredClone(EMPTY_CORES)
        const blockElems = []
        
        let blocks: RoutineBlock[] = []
        let earliestBlock = Infinity
        let firstAwakeMin = 1441
        let asleepAtMin = -1
        let tagMap = new Map<string, TagBreakDown>()

        if ("id" in routines) {
            blocks = routines.blocks
        }
        else {
            blocks = routines
        }

        for (let i = 0; i < blocks.length; i++) {
            // create block
            const block = blocks[i]
            const blockElem = this.createRoutineBlockElem(block)

            const headOffsetPx = (block.startTime / TOTAL_DAY_MINS) * this.containerElemHt

            earliestBlock = Math.min(earliestBlock, headOffsetPx)
            firstAwakeMin = Math.min(firstAwakeMin, block.startTime)
            asleepAtMin   = Math.max(asleepAtMin, block.endTime)

            blockElems!.push({ ...blockElem, id: `${i}` })

            // tally cores
            this.updateCoresFromBlock(block, cores)
            this.updateTagDataFromBlock(block, tagMap)
        }

        // sort by start times, needed to find open spaces for a moving a block element over
        blockElems.sort((a, b) => a.startTime - b.startTime)

        // count sleeping and awake time
        cores.sleeping.totalTime += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin)
        cores.awake.totalTime    = TOTAL_DAY_MINS - cores.sleeping.totalTime

        // tag breakdown
        const tagBreakdown: TagBreakDown[] = []
        tagMap.forEach((tag)     => tagBreakdown.push(tag))
        tagBreakdown.sort((a, b) => b.data.totalTime - a.data.totalTime)


        return { cores, earliestBlock, blockElems, tagBreakdown }
    }

    /**
     * Creates a block element. All the blocks seen on the calendar / time box are of this type.
     * @param block       Raw block data.
     * @returns           New Day block elem from raw block data.
     */
    createRoutineBlockElem(block: RoutineBlock): RoutineBlockElem {
        const containerHt = this.containerElemHt
        const elapsedTimeMins = block.endTime - block.startTime

        const headOffsetPerc = block.startTime / TOTAL_DAY_MINS
        const height         = Math.ceil((elapsedTimeMins / TOTAL_DAY_MINS) * containerHt)

        return {
            ...block,
            id: "", height,
            yOffset: Math.floor((headOffsetPerc * containerHt) + this.BLOCK_TOP_OFFSET),
            xOffset: 0,
        }
    }

    /**
     * Given a block, update the running tag data of a routine.
     * 
     * @param block    Block in focus
     * @param tagMap   Map to track tag stats
     */
    updateTagDataFromBlock(block: RoutineBlock, tagMap: Map<string, TagBreakDown>) {
        if (!block.tag) return

        const elapsedTimeMins = block.endTime - block.startTime

        // if already in the map then just update
        if (tagMap.has(block.tag.name)) {
            const tagData   = tagMap.get(block.tag.name)!.data
            const totalTime = tagData.totalTime + elapsedTimeMins
            const total   = tagData.total + 1
            const avgTime = totalTime

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

    getRoutineBlockTags(blocks: RoutineBlock[]): TagBreakDown[] {
        let tagMap = new Map<string, TagBreakDown>()

        for (let i = 0; i < blocks.length; i++) {
            // create block
            const block = blocks[i]
            this.updateTagDataFromBlock(block, tagMap)
        }

        // tag breakdown
        const tagBreakdown: TagBreakDown[] = []
        tagMap.forEach((tag) => tagBreakdown.push(tag))
        tagBreakdown.sort((a, b) => b.data.totalTime - a.data.totalTime)

        return tagBreakdown
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
    getRoutineBlockCores(blocks: RoutineBlock[]): RoutineCores {
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

        blocks = blocks.map((block: RoutineBlockElem, idx: number) => { 
            // in week routine: {DAY_IDX}--{BLOCK_IDX}
            const idPair = block.id.split("--")

            return {
                ...block, id: idPair.length === 1 ? `${idx}` : `${idPair[0]}--${idx}`
            }
        })
        
        // update the blocks
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

        // if day routine / column in focus is a set daily routine
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
        const length   = get(this.focusedDayRoutineElems)!.length
        const { 
            startTime: oldStartTime, endTime: oldEndTime 
        } = dupBlock

        let newId = length + ""

        // if using a week block: DAY_IDX--BLOCK_IDX
        if (dupBlock.id.includes("--")) {
            newId = dupBlock.id.split("--")[0] + "--" + newId
        }

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

    onConcludeModalEdit(updatedBlock: RoutineBlockElem | null) {
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
            left, top: top + scrollTop
        }
    }

    openContextMenu() {
        const containerWidth = this.containerElem!.clientWidth - 35
        const containerHeight = this.containerElem!.clientHeight
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: this.cursorPos.left - 20
        }

        const { top, left } = intContextMenuPos(
            { height: 170, width: 150 }, cursorPos, 
            { height: containerHeight, width: containerWidth }
        )

        this.contextMenuPos.set({ left, top: top + scrollTop })
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
     * Pointer event handler for when cursor moves in container that holds all the blocks.
     */
    onBlocksContainerPointerMove = (event: PointerEvent) => {
        const blocksRect = this.blocksContainerRef!.getBoundingClientRect()
        const windowRect = this.containerElem!.getBoundingClientRect()
        
        const blocksLeft = event.clientX - blocksRect.left
        const blocksTop = event.clientY - blocksRect.top

        const windowLeft = event.clientX - windowRect.left
        const windowTop = event.clientY - windowRect.top
        
        this.cursorPos = { left: blocksLeft, top: blocksTop }
        this.cursorPosFromWindow = { left: windowLeft, top: windowTop }
    }

    /**
     * Initaze the data required for editing an existing routine block.
     * 
     * @param e                Mouse move event.
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
            queryStr: "routine-blocks__block", queryBy: "class",
            child: target, strict: true
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
        if (!this.allowLiftEdit) return
        const { safeProps, xOffset, yOffset } = this.getLiftBlockPositions(e)

        // drop area block uses safe positions
        this.editingBlock.update((block) => ({ 
            ...block!, ...safeProps, 
            xOffset, 
            yOffset,
            dropArea: {
                top: safeProps!.yOffset, 
                left: xOffset,
                offsetIdx: 0
            }
        })) 
    }

    /**
     * Handler for when user moves a lifted, editing block.
     * Updates the block's start, end times, and offset.
     * 
     * @returns  Safe area props
     */
    getLiftBlockPositions = (e: PointerEvent) => {
        let editBlock = get(this.editingBlock)!

        // edit block positions
        let dragTopOffset  = this.cursorPos.top - this.initDragLiftOffsets.top
        let dragLeftOffset  = this.cursorPos.left - this.initDragLiftOffsets.left

        // start, end, yOffset
        let { startTime, yOffset } = this.getStartTimeAndOffsetFromTopOffset(dragTopOffset)
        yOffset += this.BLOCK_TOP_OFFSET

        const endTime = startTime + this.editingBlockTotalTime
        
        // prevent end time out of bounds
        if (endTime < TOTAL_DAY_MINS) {
            editBlock = { ...editBlock, startTime, yOffset, endTime }
        }
        else {
            yOffset = editBlock.yOffset
        }
        
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

        const moveDirection = this.isNearBorderAndShouldScroll()
        if (moveDirection) {
            this.scrollToBlockMovement(moveDirection)
        }

        // update positioning and times of drop area and floating
        const safeProps = this.getSafePropsAfterLift({
            startTime: editBlock.startTime, 
            endTime: editBlock.endTime, 
            blockTotalTime: editBlock.endTime - editBlock.startTime
        })

        return { safeProps, xOffset, yOffset }
    }

    /**
     * If cursor is near the borders while a block is being lifted do a scroll to the direction of the border the block is going to.
     */
    scrollToBlockMovement(moveDirection: "up" | "left" | "right" | "down" | null) {
        if (this.interval) return

        console.log("A")
        
        this.interval = setInterval(() => {
            moveDirection = this.isNearBorderAndShouldScroll()
            
            if (moveDirection === "up") {
                this.containerElem!.scrollTop -= 10
            }
           if (moveDirection === "down") {
                this.containerElem!.scrollTop += 10
            }
           if (moveDirection === "right") {
                this.containerElem!.scrollLeft += 10
            }
           if (moveDirection === "left") {
                this.containerElem!.scrollLeft -= 10
            }
           if (!moveDirection) {
               clearInterval(this.interval!)
               this.interval = null
               return
            }
        }, 25)
    }
    
    /**
     * Check if cursor is near a border and should scroll towards the moving block. if there's space left.
     * @returns  Direction the scroll should be to. Null if a scroll is not needed
     */
    isNearBorderAndShouldScroll() {
        const { scrollTop, 
                scrollLeft, 
                scrollHeight, 
                scrollWidth,
                clientHeight: windowHeight, 
                clientWidth: windowWidth
        } = this.containerElem!

        const windowTopOffset   = this.cursorPosFromWindow.top
        const windowLeftOffset  = this.cursorPosFromWindow.left

        const hasReachedBottom   = scrollTop >= scrollHeight - windowHeight
        const hasReachedRightEnd = scrollLeft >= scrollWidth - windowWidth


        if (windowTopOffset < 10 && scrollTop != 0) {
            return "up"
        }
        if (windowHeight - windowTopOffset < 20 && !hasReachedBottom) {
            return "down"
        }
        if (windowLeftOffset < 10 && scrollLeft != 0) {
            return "left"
        }
        if (windowWidth - windowLeftOffset < 20 && !hasReachedRightEnd) {
            return "right"
        }
        return null
    }

    /**
     * Get the startime, endtime, height, and yOffset for a block in column of blocks such that they do not overlap with other blocks.
     * Null if there is no space for the block.
     * 
     * @param times  Start time, end time, and total block time of the move location.
     * @param id     The id of the block lift, if none is provided, will use the edit block by default. 
     * 
     * @returns      Start time, yOffset, end time, height of block after lift edit.
     *               Returns null if there are no possible safe positions.
     */
    getSafePropsAfterLift(times: { startTime: number, endTime: number, blockTotalTime: number }, id?: string) {
        let startTime  = this.getStartTimeFromDragLiftEdit({ 
            startTime: times.startTime, endTime: times.endTime
        }, id)
        let _endTime  = startTime + times.blockTotalTime

        // if no availalbe space, startTIme will be @ 1440
        if (startTime === 1440) return null

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
            const { endTime, startTime, dropArea } = dropAreaBlock
    
            const editedBlockELem = { 
                ...dropAreaBlock, startTime, endTime,
                yOffset: dropArea!.top, xOffset: dropArea!.left
            }

            editedBlockELem.dropArea = undefined
    
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
     * Get the start time after the end of a lift edit based on the top offset position of the floating edit block.
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

        const editId = id ? id : get(this.editingBlock)!.id
        let blocks = get(this.focusedDayRoutineElems)!

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
            const nextIntervalStart = nextInterval ? nextInterval[0] : TOTAL_DAY_MINS

            // see if space is available
            const topSpace = Math.abs(intStart - prevIntervalEnd)
            const bottomSpace = Math.abs(nextIntervalStart - intEnd)

            const canFitTop = totalTime <= topSpace
            let  topStartingPoint = TOTAL_DAY_MINS

            const canFitBottom = totalTime <= bottomSpace
            let  bottomStartingPoint = TOTAL_DAY_MINS

            // find starting point in terms of current interval's top edge or bottom edge
            if (canFitTop) {
                topStartingPoint = intStart - totalTime  // int start is the new end point
            }
            if (canFitBottom) {
                bottomStartingPoint = intEnd
            }

            // calculate the porjected vertical distances between the desired start time and project start time
            const intStartDistance = canFitTop ? Math.abs(topStartingPoint - startTime) : TOTAL_DAY_MINS
            const intEndDistance   = canFitBottom ? Math.abs(bottomStartingPoint - startTime) : TOTAL_DAY_MINS

            // should take top starting point if that dstance is shorter
            const shouldMoveUp     = intStartDistance < intEndDistance

            const _shortedDistanceToDesiredStart = shouldMoveUp ? intStartDistance : intEndDistance
            const _nearestStartTime              = shouldMoveUp ? topStartingPoint : bottomStartingPoint

            if (_shortedDistanceToDesiredStart < shortedDistanceToDesiredStart) {

                nearestStartTime = _nearestStartTime
                shortedDistanceToDesiredStart = _shortedDistanceToDesiredStart
            }

        })

        console.log({ nearestStartTime })
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

        // see if there is a collision with top and bottom nbrs
        let topCollision    = this.editBlockTopNbr && (startTime <= this.editBlockTopNbr.endTime)
        let bottomCollision = this.editBlockBottomNbr && (endTime >= this.editBlockBottomNbr.startTime)

        // new times from lift edits will never overlap other blocks due to the overlapping block check
        // if colliding, then fix start and end times to their max and min values
        if (forStrechEdit) {
            startTime = topCollision ? this.editBlockTopNbr!.endTime : startTime
            endTime   = bottomCollision ? this.editBlockBottomNbr!.startTime : endTime
        }

        let yOffset = Math.ceil((startTime / TOTAL_DAY_MINS) * this.containerElemHt)

        // top position is the position of top nbr's bottom edge position
        if (topCollision) {
            const topNbrTopOffset = this.editBlockTopNbr!.yOffset
            const topNbrHeight = this.editBlockTopNbr!.height

            yOffset = topNbrHeight + topNbrTopOffset
        }

        endTime = Math.min(endTime, 1439)
        
        // if less than min, then use the prev allowed time || don't make at all
        const elapsedTimeMins = endTime - startTime 
        const height  = Math.floor((elapsedTimeMins / TOTAL_DAY_MINS) * containerHt)
        
        return { height, yOffset, endTime, startTime }
    }

    /**
     * Get the start from a top offset cursor position
     * @param topOffset  Y offset cursor position
     * @returns          Start time in minuts from offset cursor position.
     */
    getStartTimeAndOffsetFromTopOffset(topOffset: number) {
        const containerHt   = this.containerElemHt
        
        const topOffsetMins = (topOffset / containerHt) * TOTAL_DAY_MINS
        const startTime     = Math.max(roundUpToNearestFive(topOffsetMins), 0)
        const yOffset       = (startTime / TOTAL_DAY_MINS) * containerHt

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
    }

    getBlockElem(id: string) {
        return get(this.focusedDayRoutineElems)?.find(block => block.id === id)
    }
    getDOMBlockElem(id: string) {
        return getElemById(`daily-routine-block--${id}`) as HTMLElement
    }
}

/**
 * Manager object for daily routines
 */
export class DailyRoutinesManager extends RoutinesManager {
    /**
     * @param data   Daily Routines - All the daily routines that user has made              
     */
    constructor(userRoutines: (DailyRoutine | RoutineBlock)[]) {
        super()

        // @ts-ignore
        this.userRoutines.set(userRoutines)
    }

    /**
     * Initialize all user routines 
     * @param routineId       Current routine in view 
     */
    initFocusRoutine(routine: DailyRoutine | null) {
        if (!routine) {
            this.currCores.set(EMPTY_CORES)
            this.currTagBreakdown.set([])
            this.focusedDayRoutineElems.set(null)

            return
        }

        this.focusedDayRoutine.set(routine)
        const { cores, earliestBlock, blockElems, tagBreakdown } = this.processRoutineBlocks(routine.blocks)

        this.currCores.set(cores)
        this.currTagBreakdown.set(tagBreakdown)

        this.earliestBlockHeadPos = earliestBlock
        this.focusedDayRoutineElems.set(blockElems)

        // ensure that the earliest block is close to the top edge of scrollable
        this.containerElem!.classList.add("hide-scroll-bar")
        this.containerElem!.scrollTop = earliestBlock - 15

        setTimeout(() => this.containerElem!.classList.remove("hide-scroll-bar"), 0)
    }

    removeDailyRoutine(routineId: string) {
        this.userRoutines.update((routines) => (routines!.filter(r => r.id != routineId)))
    }

    newDailyRoutine(newRoutine: DailyRoutine) {
        this.userRoutines.update((routines) => [...routines!, newRoutine])
    }

    /**
     * Updates a selected daily routine's title
     * @param name 
     */
    updateTitle = (name: string) => {
        this.focusedDayRoutine.update((routine) => ({ ...routine!, name }))
    }

    /**
     * Updates a selected daily routine's description
     * @param title 
     */
    updateDescription = (description: string) => {
        this.focusedDayRoutine.update((routine) => ({ ...routine!, description } ))
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
        const wasNewBlockEdit = get(this.editContext) === "new-stretch"
        super.endBlockStretchEditHandler()

        if (wasNewBlockEdit) {
            this.containerElem!.removeEventListener("pointermove", this.onTimeBoxMouseMove)
        }
        else {
            this.containerElem!.removeEventListener("pointermove", this.onBlockStretchEditHandler)
        }

        this.containerElem!.removeEventListener("pointerup", this.onBlockStrechEditEnd)
        this.dragStartPoint = { left: -1, top: -1 }
    }

    onBlockContextMenu(id: string) {
        const editBlock = this.getDailyRoutineBlock(id)!
        this.editingBlock.set(editBlock)
        this.openContextMenu()
    }
}

/**
 * Manager object for weekly routines
 */
export class WeeklyRoutinesManager extends RoutinesManager {
    currViewOption = writable(ViewOption.Weekly)
    chosenRoutine: WeeklyRoutine | null = null

    // current routine in view
    currWeekRoutine:      Writable<WeeklyRoutine | null> = writable(null)
    currWeekRoutineElems: Writable<WeekBlockElems | null> = writable(null)
    dayBreakdown:         Writable<DayBreakdown| null> = writable(null)

    editDayKey: keyof WeeklyRoutineBlocks | null = null
    editDayKeyStore: Writable<keyof WeeklyRoutineBlocks | null> = writable(null)

    editDayIdx = -1
    editOffsetIdx = -1
    dayColXOffset = 0
    weekCores = structuredClone(EMPTY_CORES)

    DAYS_WEEK = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ]
    daysInView = this.DAYS_WEEK

    /**
     * @param weekRoutine   User's currently chosen routine which should be in view
     */
    constructor(weekRoutine: WeeklyRoutine) {
        super()
        this.updateCurrentWeekRoutine(weekRoutine, false)
    }

    /**
     * Updates current weekly routine in view.
     */
    updateCurrentWeekRoutine(weekRoutine: WeeklyRoutine | null, doProcessBlocks = true) {
        this.chosenRoutine = weekRoutine
        
        this.currWeekRoutine.set(weekRoutine)
        this.currWeekRoutineElems.set({ 
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] 
        })
        
        if (!weekRoutine) {
            this.dayBreakdown.set(null)
            this.resetEditState()
        }
        if (weekRoutine && doProcessBlocks) {
            this.processWeeklyRoutine()
        }
    }

    /**
     * Updates a selected daily routine's title
     * @param name 
     */
    updateTitle = (name: string) => {
        this.currWeekRoutine.update((routine) => ({ ...routine!, name }))
    }
    
    /**
     * Updates a selected daily routine's description
     * @param description 
    */
   updateDescription = (description: string) => {
        this.currWeekRoutine.update((routine) => ({ ...routine!, description }))
    }

    /**
     * Proceses weekly routine by extracting breakdown data and create routine element blocks to be displayed from initialized weekly routine data.
     */
    processWeeklyRoutine() {
        const routineElems = get(this.currWeekRoutineElems)!

        // analytics
        const weekCores = structuredClone(EMPTY_CORES)
        const weekTagData: TagBreakDown[] = []
        
        let i = 0
        
        for (let day of this.DAYS_WEEK) {
            const dayKey = day as keyof WeeklyRoutineBlocks
            const dayDataList = get(this.currWeekRoutine)!.blocks[dayKey]
            const { cores, earliestBlock, blockElems, tagBreakdown } = this.processRoutineBlocks(dayDataList)

            // create block elements array + set up ids
            routineElems[dayKey]!.push(
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
                prevTag.data.avgTime    = (prevTag.data.totalTime / this.daysInView.length)

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
                core.avgTime = core.totalTime / this.daysInView.length
            }
        }
        return weekCores
    }

    /* Lift Edits */

    onBlockPointerDown(e: PointerEvent, id: string) {
        if (e.button === 2) return

        this.initFocusColContextFromLeftOffset(this.cursorPos.left)
        this.initFocusColFromContext()

        this.blockOnPointerDown = this.getWeekBlockFromId(id)!
        
        const { isOnTopEdge, isOnBottomEdge } = this.isBlockMouseDownOnEdge(e)
        this.editingBlockRef = this.getDOMBlockElem(id)
        this.editingBlock.set({ ...this.blockOnPointerDown, xOffset: this.dayColXOffset })

        // do a strech or lift edit
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

    /**
     * Handler for when the mouse moves after user clicks on a lift move area.
     * 
     * @param event 
     */
    onBlockMouseMove = (e: PointerEvent) => {
        e.preventDefault()

        // only allow the edit if the user has moved he cursor far enough
        if (!this.allowLiftEdit) { 
            const dragDistance = getDistanceBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (dragDistance > this.DRAG_DISTANCE_THRESHOLD) {
                this.intDragLiftMoveEdit(this.blockOnPointerDown!)
                this.allowLiftEdit = true
            }
        }
        if (!this.allowLiftEdit) return

        const prevDay = this.editDayKey

        // when mouse moves, know in which day column the cursor is currently at
        this.initFocusColContextFromLeftOffset(this.cursorPos.left)

        // if a new column and init the new col
        if (prevDay != this.editDayKey) {
            this.initFocusColFromContext()
        }

        const { safeProps, xOffset, yOffset } = this.getLiftBlockPositions(e)

        // safeProps will be null if there was no space in current day col the cursos is in
        if (safeProps) {
            this.editingBlock.update((block) => ({ 
                ...block!, ...safeProps, 
                xOffset, 
                yOffset,
                dropArea: {
                    top: safeProps.yOffset, 
                    left: xOffset,
                    offsetIdx: this.editOffsetIdx
                }
            }))
        }
        else {
            this.editingBlock.update((block) => ({ ...block!, xOffset, yOffset })) 
        }
    }

    onBlockMouseUp = () => {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }

        if (this.allowLiftEdit) {
            // extract needed props
            const dropAreaBlock = get(this.editingBlock)!
            const { endTime, startTime, dropArea } = dropAreaBlock
    
            const editedBlockELem = { 
                ...dropAreaBlock, startTime, endTime,
                yOffset: dropArea!.top, xOffset: dropArea!.left,
            }

            // current set editDayIdx might not be the same as drop area
            // occurs when current day col has no space for editing block
            this.initFocusColContextFromIdx(dropArea!.offsetIdx)

            // update elems
            const weekElems = get(this.currWeekRoutineElems)!
            const oldColIdx    = +editedBlockELem.id.split("--")[0]
            const oldColDayKey = this.DAYS_WEEK[oldColIdx] as keyof WeekBlockElems
            const isSameCol    = this.editDayKey! === oldColDayKey
            
            // remove from old col
            let oldCol = weekElems[oldColDayKey]
            oldCol     = oldCol.filter((block) => (block.id != editedBlockELem.id))

            if (!isSameCol) {
                oldCol = oldCol.map((block, idx) => ({ ...block, id: `${oldColIdx}--${idx}`}))
            }
            
            // add to from old col
            let newCol = isSameCol ? oldCol : weekElems[this.editDayKey!]

            newCol = [...newCol, { ...editedBlockELem }]
            newCol = newCol.sort((a, b) => a.startTime - b.startTime)
            newCol = newCol.map((block, idx) => ({ ...block, id: `${this.editDayIdx}--${idx}`}))

            this.currWeekRoutineElems.update((week) => {
                week![oldColDayKey] = oldCol
                week![this.editDayKey!] = newCol

                return week
            })
            this.resetEditState()
        }
        else {
            this.editContext.set("details")
        }

        this.removeLiftEventListeners()
    }
    
    /**
     * After a lift edit, update the current weekly routine.
     */
    updateOnLiftEdit() {
        // extract needed props
        const dropAreaBlock = get(this.editingBlock)!
        const { endTime, startTime, dropArea } = dropAreaBlock

        const editedBlockELem = { 
            ...dropAreaBlock, startTime, endTime,
            yOffset: dropArea!.top, xOffset: dropArea!.left,
        }

        // update elems
        const weekElems = get(this.currWeekRoutineElems)!
        
        const oldColIdx = +editedBlockELem.id.split("--")[0]
        const oldColDayKey = this.DAYS_WEEK[oldColIdx] as keyof WeekBlockElems
        const isSameCol = this.editDayKey! === oldColDayKey
        
        // remove from old col
        let oldCol = weekElems[oldColDayKey].filter((block) => (block.id != editedBlockELem.id))
        oldCol = oldCol.filter((block) => (block.id != editedBlockELem.id))

        if (!isSameCol) {
            oldCol = oldCol.map((block, idx) => ({ ...block, id: `${oldColIdx}--${idx}`}))
        }
        
        // add to from old col
        let newCol = isSameCol ? oldCol : weekElems[this.editDayKey!]
        newCol = [...newCol, { ...editedBlockELem }]
        newCol = newCol.sort((a, b) => a.startTime - b.startTime)
        newCol = newCol.map((block, idx) => ({ ...block, id: `${this.editDayIdx}--${idx}`}))

        this.currWeekRoutineElems.update((week) => {
            week![oldColDayKey] = oldCol
            week![this.editDayKey!] = newCol

            return week
        })

        this.resetEditState()
        this.removeLiftEventListeners()
    }

    removeLiftEventListeners() {
        this.containerElem!.removeEventListener("pointermove", this.onBlockMouseMove)
        this.containerElem!.removeEventListener("pointerup", this.onBlockMouseUp)
    }

    /* Stretch Edits */

    onTimeBoxMouseDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement
        if (target.id != this.ROUTINE_BLOCKS_CONTAINER_ID || e.button === 2) {
            return
        }

        this.initFocusColContextFromLeftOffset(this.cursorPos.left)
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

            const startTime = roundUpToNearestFive((this.dragStartPoint!.top / this.containerElemHt) * TOTAL_DAY_MINS)
    
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
        const wasNewBlockEdit = get(this.editContext) === "new-stretch"
        super.endBlockStretchEditHandler()
        
        this.containerElem!.removeEventListener("pointerup", this.onBlockStrechEditEnd)
        this.updateWeekElemsFromColUpdate()
        
        this.resetEditState()
        this.removeStretchEventListeners(wasNewBlockEdit)
    }

    removeStretchEventListeners(wasNewBlockEdit: boolean) {
        if (wasNewBlockEdit) {
            this.containerElem!.removeEventListener("pointermove", this.onTimeBoxMouseMove)
        }
        else {
            this.containerElem!.removeEventListener("pointermove", this.onBlockStretchEditHandler)
        }
        this.containerElem!.removeEventListener("pointerup", this.onBlockStrechEditEnd)
    }

    /**
     * 
     * Initialize the day column being edited / focused by a user as user interacts with a block / board to make some edits.
     * @param leftOffset  The positioning of the cursor at the time of interaction
     */
    initFocusColContextFromLeftOffset(leftOffset: number) {
        const containerWidth = this.blocksContainerRef!.clientWidth
        const colWidth = containerWidth / this.daysInView.length

        const leftPos = leftOffset! - (2 + 7)
        this.editDayIdx  = Math.floor(leftPos / colWidth)

        this.initFocusColContextFromIdx(this.editDayIdx)
    }

    initFocusColContextFromIdx(idx: number) {
        const viewOpt = get(this.currViewOption)
        const containerWidth = this.blocksContainerRef!.clientWidth
        const colWidth = containerWidth / this.daysInView.length

        this.editDayIdx = idx

        if (viewOpt === ViewOption.Today) {
            const todayIdx = (new Date().getDay() + 6) % 7

            this.editDayIdx = todayIdx
            this.editDayKey = this.DAYS_WEEK[todayIdx] as keyof WeeklyRoutineBlocks
            this.editOffsetIdx = 0
            this.dayColXOffset = 0
        }
        else {
            this.editOffsetIdx = this.editDayIdx
            this.editDayIdx += viewOpt === ViewOption.FSS ? 4 : 0
            this.editDayKey  = this.DAYS_WEEK[this.editDayIdx] as keyof WeeklyRoutineBlocks

            this.dayColXOffset = (colWidth * this.editOffsetIdx)
        }
    }

    /**
     * Afte getting the day key of the day column being edited, set that column as the day being edited / focused on.
     */
    initFocusColFromContext() {
        const editDayRoutine      = get(this.currWeekRoutine)!.blocks[this.editDayKey!]
        const editDayRoutineElems = get(this.currWeekRoutineElems)![this.editDayKey!]

        this.focusedDayRoutine.set(editDayRoutine)
        this.focusedDayRoutineElems.set(editDayRoutineElems)
    }

    /* Context Menu */
    onBlockContextMenu(id: string) {
        this.initFocusColContextFromLeftOffset(this.cursorPos.left)
        this.initFocusColFromContext()

        const editBlock = this.getWeekBlockFromId(id)!
        this.editingBlock.set({ ...editBlock, xOffset: this.dayColXOffset })

        this.openContextMenu()
    }

    openContextMenu() {
        const containerWidth = this.containerElem!.clientWidth
        const containerHeight = this.containerElem!.clientHeight
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: this.cursorPos.left
        }

        const { top, left } = intContextMenuPos(
            { height: 170, width: 150 }, cursorPos, 
            { height: containerHeight, width: containerWidth }
        )

        this.contextMenuPos.set({ left, top: top + scrollTop })
    }

    getColorPickerPos() {
        const containerWidth = this.containerElem!.clientWidth 
        const containerHeight = this.containerElem!.clientHeight
        const scrollTop = this.containerElem!.scrollTop

        const cursorPos = { 
            top: this.cursorPos.top - scrollTop - 5,
            left: Math.max(this.cursorPos.left - 10, 0)
        }

        const { left, top } = intContextMenuPos(
            { height: 206, width: 175 }, cursorPos, 
            { height: containerHeight, width: containerWidth }
        )

        return {
            left, top: top + scrollTop
        }
    }

    duplicateEditBlockElem() {
        super.duplicateEditBlockElem()
        this.updateWeekElemsFromColUpdate()
        this.resetEditState()
    }

    changeEditBlockColor(color: Color | null) {
        if (!color) return

        super.changeEditBlockColor(color)
        this.updateWeekElemsFromColUpdate()
    }

    deleteEditBlockElem() {
        super.deleteEditBlockElem()
        this.updateWeekElemsFromColUpdate()
    }

    onConcludeModalEdit(updatedBlock: RoutineBlockElem | null) {
        super.onConcludeModalEdit(updatedBlock)
        this.updateWeekElemsFromColUpdate()
    }

    resetEditState(): void {
        this.focusedDayRoutine.set(null)
        this.focusedDayRoutineElems.set(null)

        this.editingBlock.set(null)
        this.editContext.set(null)

        this.editingBlockTotalTime     = -1
        this.editingBlockInitStartTime = -1

        this.dragStartPoint = { left: -1, top: -1 }
        this.editDayKey = null
        this.dayColXOffset = 0
        this.editDayIdx = -1

        this.allowLiftEdit = false
        this.editTargetElem = null
        this.initDragLiftOffsets = { top: -1, left: -1 }
    }

    /**
     * Update week block elems if an any edit was made on any column.
     */
    updateWeekElemsFromColUpdate() {
        const updatedDayRoutineElems = get(this.focusedDayRoutineElems) as RoutineBlockElem[]

        if (!updatedDayRoutineElems) return

        this.currWeekRoutineElems.update((weekRoutine) => {
            const key = this.editDayKey! as keyof WeekBlockElems

            weekRoutine![key] = updatedDayRoutineElems
            return weekRoutine
        })
    }

    /**
     * Find a week routine block using an id
     * 
     * @param id  Id of block
     * @returns   Block
     */
    getWeekBlockFromId(id: string) {
        const dayPropIdx = +id.split("--")[0]
        const dayProp = this.DAYS_WEEK[dayPropIdx] as keyof WeeklyRoutineBlocks

        return get(this.currWeekRoutineElems)![dayProp].find((block) => block.id === id)
    }

    /**
     * Update the current view option for week view.
     * @param newOptn   Chosen view option
     */
    updateCurrViewOption(newOptn: ViewOption) {
        const todayIdx = (new Date().getDay() + 6) % 7

        if (newOptn === ViewOption.Today) {
            this.daysInView = [this.DAYS_WEEK[todayIdx]]
        }
        else if (newOptn === ViewOption.MTWT) {
            this.daysInView = this.DAYS_WEEK.slice(0, 4)
        }
        else if (newOptn === ViewOption.FSS) {
            this.daysInView = this.DAYS_WEEK.slice(4, 7)
        }
        else {
            this.daysInView = this.DAYS_WEEK
        }
        this.currViewOption.set(newOptn)
    }

    /**
     * See if a day routine is linked to a daily routine
     * @param   _dayKey  Day key ie "Monday"
     * @returns  
     */
    isDayRoutineLinked(day: string) {
        const dayKey = day as keyof WeeklyRoutineBlocks
        const dayRoutine = get(this.currWeekRoutine)!.blocks[dayKey]

        return "id" in dayRoutine
    }

    /**
     * Initialize a day routine's tag and core breakdown
     * @param dayIdx   Idx of day (0 -> Monday)
     */
    initDayRoutineBreakdown(dayIdx: number | null) {
        if (dayIdx === null) {
            this.dayBreakdown.set(null)
            return 
        }

        const _dayKey    = this.DAYS_WEEK[dayIdx]
        const dayKey     = _dayKey as keyof WeeklyRoutineBlocks
        const dayRoutine = get(this.currWeekRoutine)!.blocks[dayKey]
        
        const isLinked = "id" in dayRoutine
        const blocks   = isLinked ? dayRoutine.blocks : dayRoutine

        const linkedRoutine = isLinked ? {
            name: dayRoutine.name,
            description: dayRoutine.description,
        } : null
        
        this.dayBreakdown.set({
            cores: this.getRoutineBlockCores(blocks),
            tags: this.getRoutineBlockTags(blocks),
            day: _dayKey,
            dayIdx,
            linkedRoutine
        })
    }

    /**
     * Sever the link to a daily routine from a given day routine
     */
    unlinkCurrBreakdownDay() {
        const dayIdx = get(this.dayBreakdown)!.dayIdx
        const dayKey = this.DAYS_WEEK[dayIdx] as keyof WeeklyRoutineBlocks
        const weekRoutine      = get(this.currWeekRoutine)!
        const linkedDayRoutine = weekRoutine.blocks[dayKey] as DailyRoutine

        weekRoutine.blocks[dayKey] = linkedDayRoutine.blocks
        this.currWeekRoutine.set(weekRoutine)

        this.dayBreakdown.update((routine) => ({
            ...routine!,
            linkedRoutine: null
        }))
    }

    getDOMBlockElem(id: string) {
        return getElemById(id) as HTMLElement
    }

    getDayIdx(key: string) {
        return key as keyof WeeklyRoutineBlocks
    }

    getDayKeyFromIdx(idx: number) {
        return this.DAYS_WEEK[idx] as keyof WeeklyRoutineBlocks
    }
}