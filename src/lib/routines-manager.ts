import { get, writable, type Writable } from "svelte/store"
import { minsFromStartToHHMM, TOTAL_DAY_MINS } from "./utils-date"
import { CoreStatus } from "./enums"
import { 
            COLOR_SWATCHES, findAncestor, getDistanceBetweenTwoPoints, getElemById, 
            getElemNumStyle, 
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

type RoutineBlockEditContext = "stretch" | "lift" | "details"

/**
 * Manger class for editing routines.
 * Used in daily routines / current routine pages.
 * 
 * Used to initialize (both daily and weekly) routine blocks, statistics, and editing (stretch & lifit).
 */
export class RoutinesManager {
    weekCores = structuredClone(EMPTY_CORES)
    weekBlocks:     WeeklyRoutine | null = null
    weekBlockElems: Writable<WeekBlockElems | null> = writable(null)

    inDailyPage = false

    userRoutines:   Writable<DailyRoutine[] | null> = writable(null)
    
    // current user routine in "current" page or selected viewing routine in "daily" page
    focusedRoutine:      Writable<DailyRoutine | null> = writable(null)
    focusedRoutineElems: Writable<RoutineBlockElem[] | null> = writable(null)

    // current core data in view
    currCores        = writable<RoutineCores>(this.weekCores)
    currTagBreakdown = writable<TagBreakDown[]>([])
    
    // editing state
    newBlock:  Writable<RoutineBlockElem | null> = writable(null)
    
    editContext: Writable<RoutineBlockEditContext | null> = writable(null)
    
    // editing blocks
    editingBlock:       Writable<RoutineBlockElem | null> = writable(null)
    editingBlockRef:    HTMLElement | null = null

    editBlockTopNbr:    RoutineBlockElem | null = null
    editBlockBottomNbr: RoutineBlockElem | null = null
    
    editingBlockTotalTime     = -1
    editingBlockInitStartTime = -1
    
    initDragLiftOffsets: OffsetPoint = { left: -1, top: -1 }
    dragStartPoint: OffsetPoint = { left: -1, top: -1 }
    draggingSourceIdx = -1
    allowLiftEdit = false
    allowStrechEdit = false
    
    // lift edit
    isDragLiftFromHead: boolean | null = null
    editTargetElem:  HTMLElement | null = null
    blockTimesIntervals: { 
        id: string, interval: [number, number]
    } [] = []
    
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
    earliestBlockHeadPos   = Infinity
    cursorPos: OffsetPoint = { left: 0, top: 0 }
    
    // context menu
    hasJustClosedContextMenu = false
    isContextMenuOpen = false
    contextMenuX = -1000
    contextMenuY = -1000

    BLOCK_TOP_OFFSET = 6
    MIN_BLOCK_DURATION_MINS = 15
    DRAG_DISTANCE_THRESHOLD = 0
    NEW_BLOCK_DRAG_DIST_THRESHOLD = 5
    HEAD_OFFSET = 13.5
    BLOCK_GAP = 1
    TIME_BOX_POINTER_EVENT_OFFSET = 15
    ROUTINE_BLOCKS_CONTAINER_ID = "routine-blocks-container"
    
    DAYS_WEEK = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ]
    BLOCKS_LEFT_OFFSET = 35

    /**
     * Constructs for daily routines instance or currrent weekly routine instance.
     * 
     * @param data   Weekly Routine - Weekly Routine + Current selected routine 
     *               Daily Routines - All the daily routines that user has made
     */
    constructor(_data: WeeklyRoutineSetUp | DailyRoutine[]) {
        let data: any = _data

        if ("weeklyRoutine" in _data) {
            data = data as WeeklyRoutineSetUp

            this.inDailyPage = false

            this.focusedRoutine.set(data.currentRoutine)
            this.weekBlocks = data.weeklyRoutine
            this.weekBlockElems.set({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] })
        }
        else {
            this.inDailyPage = true
            this.userRoutines.set(data as DailyRoutine[])
        }
    }

    initContainer(container: HTMLElement) {
        this.containerElem = container
        this.containerElemHt = container.scrollHeight - getElemNumStyle(container, "padding-bottom")
    }

    /* Routine Updates */

    updateTitle = (title: string) => {
        this.focusedRoutine.update((routine: DailyRoutine | null) => {
            if (!routine) return routine
            
            return { ...routine, title }
        })
    }
    updateDescription = (description: string) => {
        this.focusedRoutine.update((routine: DailyRoutine | null) => {
            if (!routine) return routine

            return { ...routine, description }
        })
    }
    onSettingsOptionClicked(idx: number) {

    }

    /* Initializations */

    /**
     * Initialize all user routines 
     * @param routineId       Current routine in view 
     */
    initDailyRoutines(routineId: string) {
        this.initCurrentDailyRoutine(routineId)
    }

    /**
     * Initial current routine to be viewed.
     * @param id   Id of curent routine
     */
    initCurrentDailyRoutine(id: string) {
        if (id === get(this.focusedRoutine)?.id) return

        const routine = get(this.userRoutines)!.find((routine) => routine.id === id)!
        this.focusedRoutine.set(routine)

        this.currCores.set((this.getRoutineBlockCores(routine.blocks)))

        const { cores, earliestBlock, blockElems, tagBreakdown } = this.getDailyRoutineData(get(this.focusedRoutine)!.blocks)

        this.currCores.set(cores)
        this.currTagBreakdown.set(tagBreakdown)

        this.earliestBlockHeadPos = earliestBlock
        this.focusedRoutineElems.set(blockElems)

        this.initBlockElemIntervals(blockElems)
    }

    /**
     * @param blocks        Routine's blocks
     * @param movedHeads    Map that tracks off-setted blocks to avoid collision (block can touch when start and end  @ same time)
     *                      Used to ensure all blocks that start at the same time are horizontally aligned the same.
     * 
     * @returns             Given a routine's blocks, core and tag breakdowns, block elems, and earliest block.
     */
    getDailyRoutineData(blocks: RoutineBlock[], movedHeads?: Map<number, number>) {
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
        const headGapSpace = headOffsetPx - this.BLOCK_GAP

        let tailGapOffset = 0

        // blocks that start at the same time should be horizontally aligned for consistency
        if (movedHeads && movedHeads.has(headOffsetPx)) {
            tailGapOffset = movedHeads.get(headOffsetPx)!
        }
        else {
            const overlappingInterval = intervals.find((interval) => headGapSpace <= interval[1])
            tailGapOffset = overlappingInterval ? (overlappingInterval[1] - headGapSpace + this.BLOCK_GAP) : 0

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
            startTimeStr: minsFromStartToHHMM(block.startTime),
            endTimeStr:   minsFromStartToHHMM(block.endTime)
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

    /* Week Functionality */

    initWeekRoutines() {

    }

    /**
     * Initalize daily routines for a weekly routine.
     */
    initWeeklyRoutine(containerElem: HTMLElement) {
        this.containerElem = containerElem

        const routineElems = get(this.weekBlockElems)!
        const movedHeads = new Map<number, number>()

        // analytics
        const weekCores = structuredClone(EMPTY_CORES)
        const weekTagData: TagBreakDown[] = []
        
        let i = 0
        
        for (let day of this.DAYS_WEEK) {
            const dayDataList = this.weekBlocks![day as keyof WeeklyRoutine]
            const { cores, earliestBlock, blockElems, tagBreakdown } = this.getDailyRoutineData(dayDataList, movedHeads)

            // get elems for each day
            routineElems[day as keyof WeeklyRoutine]!.push(
                ...blockElems.map((blockElem: RoutineBlockElem, idx: number) => ({
                    ...blockElem, 
                    id: `${i}--${idx}`, 
                    xOffset: 0
                    // xOffset: `calc(((100% / 7) * ${i}) + ${this.BLOCKS_LEFT_OFFSET}px)`
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

        this.weekBlockElems.set(routineElems)
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
    getWeekBlockFromId(id: string) {
        const dayPropIdx = +id.split("--")[0]
        const dayProp = this.DAYS_WEEK[dayPropIdx] as keyof WeeklyRoutine

        return get(this.weekBlockElems)![dayProp].find((block) => block.id === id)
    }

    /**
     * @param id  Id of block
     * @returns   Block
     */
    getDailyRoutineBlock(id: string) {
        const dayPropIdx = +id.split("--")[0]
        const dayProp = this.DAYS_WEEK[dayPropIdx] as keyof WeeklyRoutine

        return get(this.focusedRoutineElems)!.find((block) => block.id === id)
    }

    getDayIdx(key: string) {
        return key as keyof WeeklyRoutine
    }

    /**
     * Given a focused routine and its elems add the new block in the routine.
     * @param newBlock   New block to be incorporated into routine.
     */
    makeNewRoutineBlock(newBlock: RoutineBlockElem) {
        this.focusedRoutineElems.update((block) => [ ...block!, newBlock ])
        this.addToBlockIntervals(newBlock)

        this.focusedRoutine.update((routine) => {
            return {
                ...routine!,
                blocks: [...routine!.blocks, 
                    {
                        title: newBlock.title,
                        color: newBlock.color,
                        startTime: newBlock.startTime,
                        endTime: newBlock.endTime,
                        activity: newBlock.activity,
                        description: newBlock.description,
                        tag: newBlock.tag
                    }
                ]
            }
        })
    }

    /**
     * Initialize a routine's blocks' intervals.
     */
    initBlockElemIntervals(blocks: RoutineBlockElem[]) {
        this.blockTimesIntervals = blocks.map((block: RoutineBlockElem) => ({ 
            id: block.id, interval: [block.startTime, block.endTime] 
        }))
        this.blockTimesIntervals = this.blockTimesIntervals.sort((a, b) => a.interval[0] - b.interval[0])
    }

    /**
     * Update a routine's blocks' intervals
     * @param editBlock  Edit block to be incorprated (new or just an edited existing block.)
     */
    addToBlockIntervals(editBlock: RoutineBlockElem) {
        this.blockTimesIntervals.push({ 
            id: editBlock.id, interval: [editBlock.startTime, editBlock.endTime] 
        })
        this.blockTimesIntervals = this.blockTimesIntervals.sort((a, b) => a.interval[0] - b.interval[0])
    }

    /**
     * Remove a block's interval.
     * 
     * @param removeBlock The corresponding block whose interval is to be removed
     */
    removeBlockInterval(removeBlock: RoutineBlockElem) {
        const intervalToRemoveIdx = this.blockTimesIntervals.findIndex(int => int.id === removeBlock.id)
        this.blockTimesIntervals = removeItemFromArray(intervalToRemoveIdx, this.blockTimesIntervals)
    }

    /* Block Updates Functionality */
    

    onEditModalClose(editedBlock: RoutineBlockElem | null) {
        this.editContext.set(null)
        this.editingBlock.set(null)

        this.editingBlockRef = null

        if (!editedBlock) return

        this.focusedRoutineElems.update((blocks) => (
            blocks!.map((block) => block.id === editedBlock.id ? { ...block, ...editedBlock } : block)
        ))
    }

    /* Block Edit Interaction Functionality */

    /**
     * On mouse move handler for time box.
     */
    timeBoxMouseMove = (event: MouseEvent) => {
        const rect = this.containerElem!.getBoundingClientRect()
        const scrollLeft = this.containerElem!.scrollLeft
        const scrollTop = this.containerElem!.scrollTop
        
        const left = event.clientX - rect.left + scrollLeft
        const top = event.clientY - rect.top + scrollTop
        
        this.cursorPos = { left, top }
    }

    /**
     * Mouse down handler on routine blocks.
     * Will init an stretch or lift edit state if appropriate.
     * 
     * @param e 
     * @param id   Id of the block clicked.
     */
    onBlockPointerDown(e: MouseEvent, id: string) {
        const { isOnTopEdge, isOnBottomEdge } = this.isBlockMouseDownOnEdge(e)
        const editBlock = this.getDailyRoutineBlock(id)!

        this.editingBlock.set(editBlock)
        this.editingBlockRef = this.getDOMBlockElem(id)

        // strech edit
        if (isOnTopEdge || isOnBottomEdge) {
            this.isDragLiftFromHead = isOnTopEdge

            this.initDragStretchEdit(true)

            // uses the handler directly since there is no drag distance threshold
            this.containerElem!.addEventListener("mousemove", this.onBlockStretchEditHandler)
            this.containerElem!.addEventListener("pointerup", this.onBlockStrechEditEnd)
        }
        // lift edit
        else {
            this.dragStartPoint = this.cursorPos

            this.containerElem!.addEventListener("mousemove", this.onBlockMouseMove)
            this.containerElem!.addEventListener("pointerup", this.onBlockMouseUp)
        }
    }

    /**
     * 
     * @param event  Mouse event from on-block click
     * @returns      If user has clicked on the bottom or top edge of the block.
     */
    isBlockMouseDownOnEdge(event: MouseEvent) {
        const target = event.target as HTMLElement
        const block = findAncestor({ 
            queryStr: "daily-routine-block",
            child: target,
            strict: false,
            queryBy: "id"
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

        // ensures that the grabbing point isn't always at the top left of block
        // offsets the block using the diff in drag point and block's offsets so it stays in its original position
        this.editingBlockTotalTime     = editBlock.endTime - editBlock.startTime
        this.editingBlockInitStartTime = editBlock.startTime

        this.initDragLiftOffsets = {
            top: this.cursorPos.top   - editBlock.yOffset,
            left: this.cursorPos.left - editBlockLeftOffset
        }

        // set edit state
        this.editingBlock.set(block)
        this.editContext.set("lift")

        // remove its interval
        this.removeBlockInterval(block)
    }

    /**
     * Handler for when the mouse moves after user clicks on a lift move area.
     * Will become call handler for moving a lifted, editing block if a lift edit has been allowed.
     * 
     * @param event 
     */
    onBlockMouseMove = () => {
        // allow lift edit only if the drag distance from the initial touch down has surpassed the threshold
        if (!this.allowLiftEdit) { 
            const dragDistance = getDistanceBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (dragDistance > this.DRAG_DISTANCE_THRESHOLD) {
                this.allowLiftEdit = true
            }
        }
        if (this.allowLiftEdit) {
            this.blockLiftMoveHandler()
        }
    }

    /**
     * Handler for when user moves a lifted, editing block.
     * Updates the block's start, end times, and offset.
     * 
     */
    blockLiftMoveHandler() {
        const editBlock = get(this.editingBlock)!
        this.containerElem!.classList.add("routine-time-blocks--grabbing")

        // initalize edit state
        if (!get(this.editContext)) {
            this.intDragLiftMoveEdit(editBlock)
        }

        const topOffset              = this.cursorPos.top - this.initDragLiftOffsets.top
        const { startTime, yOffset } = this.getStartTimeOffsetFromTopOffset(topOffset)
        const xOffset = this.cursorPos.left
        const endTime = startTime + this.editingBlockTotalTime
        const willGoOver = endTime >= 1440

        // update the focused focused array & the positioning of the drop area block
        this.focusedRoutineElems.update((blocks) => {
            return blocks!.map((block) => {
                if (block.id !== editBlock.id) return block

                let newBlock: RoutineBlockElem = {
                    ...block, 
                    yOffset: yOffset + this.BLOCK_TOP_OFFSET,
                    xOffset: Math.max(xOffset - this.initDragLiftOffsets.left, 0)
                }

                // if surpasses the max end time, keep the old times
                if (!willGoOver) {
                    newBlock = {
                        ...newBlock, endTime, endTimeStr: minsFromStartToHHMM(endTime),
                        startTime, startTimeStr: minsFromStartToHHMM(startTime)
                    }
                }

                // update the nearest drop area block
                this.updateDropAreaBlock(newBlock!)

                return newBlock
            })
        })
    }

    /**
     * Update the positioning of the drop area block.
     * This shows user where block will be placed after the edit ends.
     * Will always be positioning to the nearest allowable position.
     *  
     * @param editBlock  Block being edited.
     */
    updateDropAreaBlock(editBlock: RoutineBlockElem) {
        const { startTime, nbr }  = this.getStartTimeFromDragLiftEdit(editBlock)
        const _endTime = startTime + this.editingBlockTotalTime

        if (_endTime >= 1440) return

        // find closest nbr
        if (nbr?.movedUp) {
            this.editBlockBottomNbr = this.getBlockElem(nbr.id)!
        }
        else if (nbr?.movedUp === false) {
            this.editBlockTopNbr = this.getBlockElem(nbr.id)!
        }
        else {
            this.editBlockTopNbr = null
            this.editBlockBottomNbr = null
        }
        
        const { height, yOffset, endTime } = this.getEditBlockSafeProps(startTime, _endTime, false)!
        
        this.editingBlock.update((block) => ({
            ...block!,
            startTime, startTimeStr: minsFromStartToHHMM(startTime),
            endTime, endTimeStr: minsFromStartToHHMM(endTime),
            height,
            yOffset
        }))
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
        this.containerElem!.classList.remove("routine-time-blocks--grabbing")

        if (this.allowLiftEdit) {
            const editBlock     = get(this.editingBlock)!
            const { endTime, startTime, height, yOffset } = editBlock
    
            const editedBlockELem = {
                ...editBlock, 
                startTime, startTimeStr: minsFromStartToHHMM(startTime),
                endTime, endTimeStr: minsFromStartToHHMM(endTime),
                height,
                yOffset
            }
    
            this.addToBlockIntervals(editedBlockELem)
    
            this.focusedRoutineElems.update((blocks) => (
                blocks!.map((block) => (block.id === editBlock.id ? editedBlockELem : block))
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

        this.containerElem!.removeEventListener("mousemove", this.onBlockMouseMove)
        this.containerElem!.removeEventListener("pointerup", this.onBlockMouseUp)
    }

    /**
     * Get the start time after the end of a lift edit.
     * If the start time is impossible (ovrlapping with other blocks), find the nearest allowable start time.
     * @param editBlock 
     * @returns 
     */
    getStartTimeFromDragLiftEdit(editBlock: RoutineBlockElem): { 
        startTime: number, 
        nbr: { id: string, movedUp: boolean } | null 
    } {
        const { startTime, endTime } = editBlock

        // Check for overlapping intervals
        const overlappingInterval = this.blockTimesIntervals.find((int) => {
            const [intStart, intEnd] = int.interval

            const startOverlap = intStart < startTime && startTime < intEnd
            const endOverlap   = intStart < endTime && endTime < intEnd
            const hasIntInside = startTime <= intStart && intEnd <= endTime

            return hasIntInside || startOverlap || endOverlap
        })
 
        if (!overlappingInterval) {
            return { startTime, nbr: null }
        }

        return this.findNearestClosestTimeOpening(editBlock)
    }

    /**
     * Find the nearest allowable space for a block to an impossible desired start time.
     * 
     * @param editBlock  Block currently being edited.
     * @returns          The start time that puts the bock in the nearest allowable space to the desired start time.
     */
    findNearestClosestTimeOpening(editBlock: RoutineBlockElem) {
        // has been edited as user has been moving
        const { startTime, endTime } = editBlock
        const totalTime = endTime - startTime

        let nearestStartTime = this.editingBlockInitStartTime
        let shortedDistanceToDesiredStart = Infinity
        let nbr: { id: string, movedUp: boolean } | null = null 

        // find the closest available space (either very top or bottom of any given interval)
        this.blockTimesIntervals.forEach((int, idx) => {
            const [intStart, intEnd] = int.interval

            // prev interval
            const prevIntervalIdx   = idx - 1 >= 0 ? idx - 1 : -1
            const prevInterval      = prevIntervalIdx >= 0 ? this.blockTimesIntervals[prevIntervalIdx].interval : null
            const prevIntervalEnd = prevInterval ? prevInterval[1] : 0

            // next interval
            const nextIntervalIdx   = idx + 1  < this.blockTimesIntervals.length ? idx + 1 : -1
            const nextInterval      = nextIntervalIdx >= 0 ? this.blockTimesIntervals[nextIntervalIdx].interval : null
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

                nbr = { id: int.id, movedUp: shouldMoveUp }
            }

        })
        return { startTime: nearestStartTime, nbr }
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
    initDragStretchEdit(isEditingExisting = false) {
        const isDraggingByTail = !this.isDragLiftFromHead
        const block = get(this.editingBlock)!

        if (isEditingExisting) {
            this.removeBlockInterval(block)
        }

        this.pivotPointTopOffset = this.getDragPivotPointTopOffset(block, isDraggingByTail)
        this.editContext.set("stretch")

        // find closest nbrs
        this.editBlockTopNbr = this.findBlockClosestTopNbr(block.startTime)
        this.editBlockBottomNbr = this.findBlockClosestBottomNbr(block.startTime)
    }

    /**
     * Mouse down event on Time Box (routine blocks container).
     * 
     * @param e 
     */
    onTimeBoxPointerDown(e: MouseEvent) {
        const target = e.target as HTMLElement

        if (target.id != this.ROUTINE_BLOCKS_CONTAINER_ID) {
            return
        }

        this.dragStartPoint = this.cursorPos

        // doesn't use handler directly as drag distance must surpass the drag distance threshold
        this.containerElem!.addEventListener("mousemove", this.onTimeBoxMouseMove)
        this.containerElem!.addEventListener("pointerup", this.onBlockStrechEditEnd)
    }

    onTimeBoxMouseMove = (e: MouseEvent) => {
        if (!this.allowStrechEdit) {
            const dragDistance = getDistanceBetweenTwoPoints(this.dragStartPoint!, this.cursorPos!)

            if (dragDistance > this.NEW_BLOCK_DRAG_DIST_THRESHOLD) {

                // init new block strech edit data
                const containerHt = this.containerElemHt
                const startTime = roundUpToNearestFive((this.dragStartPoint!.top / containerHt) * TOTAL_DAY_MINS)
        
                // for new block, editing block will be used to make the new block object
                this.editingBlock.set({
                    id: get(this.focusedRoutine)!.blocks.length + "",
                    title: "Untitled Block",
                    color: randomArrayElem(COLOR_SWATCHES.d),
                    startTime, endTime: startTime,
                    startTimeStr: minsFromStartToHHMM(startTime),
                    endTimeStr:   minsFromStartToHHMM(startTime),
                    height: 0, xOffset: 0, yOffset: 0,
                    description: "",
                    activity: null, tag: null
                })
        
                this.initDragStretchEdit()
                this.allowStrechEdit = true
            }
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

        const editBlock   = get(this.editingBlock)!
        const containerHt = this.containerElemHt
        const yOffsetMins = (this.cursorPos.top / containerHt) * TOTAL_DAY_MINS
        const yChange     = this.pivotPointTopOffset - this.cursorPos.top

        if (yChange === 0) return

        const belowPivotLine = yChange < 0
        let { startTime, endTime } = this.getEditBlockTimesFromStrechEdit(belowPivotLine, yOffsetMins)

        startTime = Math.max(roundUpToNearestFive(startTime), 0)
        endTime   = Math.max(roundUpToNearestFive(endTime), 0)

        const { height, yOffset, endTime: _endTime }  = this.getEditBlockSafeProps(startTime, endTime)
        endTime = _endTime

        if (endTime - startTime < this.MIN_BLOCK_DURATION_MINS) return null

        const updatedProps: Partial<RoutineBlockElem> = {
            startTime, endTime,
            startTimeStr: minsFromStartToHHMM(startTime),
            endTimeStr: minsFromStartToHHMM(endTime),
            height, yOffset
        }

        // existing edit
        if (this.isDragLiftFromHead != null) {
            this.focusedRoutineElems.update((blocks) => (
                blocks!.map((block) => block.id === editBlock.id ? { ...block, ...updatedProps } : block)
            ))
        }
        // new block edit
        else if (!get(this.newBlock)) {
            this.newBlock.set({ ...editBlock, ...updatedProps })
        }
        else {
            this.newBlock.update((block) => ({ ...block!, ...updatedProps }))
        }
    }

    /* Edit Helpers */

    /**
     * Gets the height, yOffset, endTime of an edit block.
     * Ensures that the props return will never allow edit block to collide with other blocks.
     * Returns null if the block is too short.
     * 
     * @param startTime     Calculated start time after edit.
     * @param endTime       Calculated end time after edit.
     * @param forStrechEdit Is for a strech edit.
     * @returns             Height and top offset, null if the block will be too short.
     */
    getEditBlockSafeProps(startTime: number, endTime: number, forStrechEdit = true) {
        const containerHt = this.containerElemHt

        // see if there is a collision with top and bottom nbrs
        const topCollision    = this.editBlockTopNbr && (startTime <= this.editBlockTopNbr.endTime)
        const bottomCollision = this.editBlockBottomNbr && (endTime >= this.editBlockBottomNbr.startTime)

        // new times will never overlap other blocks in lift edits due to the overlapping block check
        if (forStrechEdit) {
            // if colliding, then fix start and end times to their max and min values
            startTime = topCollision ? this.editBlockTopNbr!.endTime : startTime
            endTime   = bottomCollision ? this.editBlockBottomNbr!.startTime : endTime
        }

        endTime = Math.min(endTime, 1439)
        
        // if less than min, then use the prev allowed time || don't make at all
        const elapsedTimeMins = endTime - startTime 
        const yOffset  = this.getEditBlockTopOffset(startTime)

        let height = (elapsedTimeMins / 1440) * containerHt
        height    -= bottomCollision ? this.BLOCK_GAP : 0
        
        return { height, yOffset, endTime }
    }

    /**
     * Get the top offset from a top offset cursor position
     * @param topOffset  Y offset cursor position
     * @returns          Start time in minuts from offset cursor position.
     */
    getStartTimeOffsetFromTopOffset(topOffset: number) {
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
        const { startTime: _startTime, endTime: _endTime } = get(this.editingBlock)!
        const isDraggingByTail = !this.isDragLiftFromHead

        // start time & end time take turns taking on the top offset depending on direction of gesture
        let startTime = 0
        let endTime   = 0
        
        // start and end time switch if there has been a pivot
        if (isDraggingByTail) {
            startTime = !belowPivotLine ? changingTime : _startTime
            endTime   = !belowPivotLine ? _startTime : changingTime
        }
        else {
            startTime = belowPivotLine ? _endTime : changingTime
            endTime   = belowPivotLine ? changingTime : _endTime
        }
        
        return { startTime, endTime }
    }

    /**
     * Get the edit block's new top offset after positioning has changed.
     * Ensurs that it doesn't collide with top neighbor.
     * 
     * @param   startTime  New calculated start time from a change in position
     * @returns topOffset  New top offset, calculated from new start time
     */
    getEditBlockTopOffset(startTime: number) {
        let topOffset = ((startTime / 1440) * this.containerElemHt) + this.BLOCK_TOP_OFFSET

        if (!this.editBlockTopNbr) return topOffset

        // has top nbr
        const topNbrBottomEdge = this.editBlockTopNbr!.yOffset + this.editBlockTopNbr.height
        const diff = topOffset - topNbrBottomEdge

        if (diff >= this.BLOCK_GAP) {
            return topOffset
        }
        else if (diff >= 0) {
            return topOffset + this.BLOCK_GAP - diff
        }
        else  {
            return topOffset + Math.abs(diff) + this.BLOCK_GAP
        }
    }

    /**
     * @param blockEndTime    The block's end time
     * @returns               Block's closest bottom nbr
     */
    findBlockClosestBottomNbr(blockEndTime: number, inclusive = false) {
        let closestStartTime = 1441
        let closestBottomNbr = null

        get(this.focusedRoutineElems)!.forEach(block => {
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
    findBlockClosestTopNbr(blockStartTime: number) {
        let closestEndTime = -1
        let closestTopNbr = null

        get(this.focusedRoutineElems)!.forEach(block => {
            if (blockStartTime >= block.endTime && block.endTime > closestEndTime) {
                closestEndTime = block.endTime
                closestTopNbr = block
            }
        })

        return closestTopNbr
    }

    onBlockStrechEditEnd = () => {
        this.editContext.set(null)

        if (this.editTargetElem) {
            this.editTargetElem.style.cursor = "default"
            this.editTargetElem = null
        }
        
        const newBlock = get(this.newBlock)
        const editBlock = get(this.editingBlock)

        if (newBlock) {
            this.makeNewRoutineBlock(newBlock)
            this.newBlock.set(null)

            this.editingBlock.set(newBlock)
            this.editContext.set("details")
        }
        else if (editBlock) {
            this.addToBlockIntervals(editBlock)
            this.editingBlock.set(null)
            this.editContext.set(null)
        }

        // drag start point has been init if a new block was made 
        // this is because a drag threshold exists for a new block strech edit
        // while there is no limit for an old block strech edit
        const wasNewBlockEdit = this.dragStartPoint!.top != -1

        if (wasNewBlockEdit) {
            this.containerElem!.removeEventListener("mousemove", this.onTimeBoxMouseMove)
        }
        else {
            this.containerElem!.removeEventListener("mousemove", this.onBlockStretchEditHandler)
        }

        this.containerElem!.removeEventListener("pointerup", this.onBlockStrechEditEnd)

        this.dragStartPoint = { left: -1, top: -1 }
        this.editBlockBottomNbr = null
        this.editBlockBottomNbr = null
        this.isDragLiftFromHead = null
        this.pivotPointTopOffset = -1
        this.allowStrechEdit = false
    }

    getBlockElem(id: string) {
        return get(this.focusedRoutineElems)?.find(block => block.id === id)
    }
    getDOMBlockElem(id: string) {
        return getElemById(`daily-routine-block--${id}`) as HTMLElement
    }
}