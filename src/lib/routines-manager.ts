import { get, writable, type Writable } from "svelte/store"
import { minsFromStartToHHMM, TOTAL_DAY_MINS } from "./utils-date"
import { COLOR_SWATCHES, extractNum, randomArrayElem, roundUpToNearestFive } from "./utils-general"
import { CoreStatus } from "./enums"

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

/**
 * Manger class for editing routines.
 * Used in daily routines / current routine.
 */
export class RoutinesManager {
    weekCores = structuredClone(EMPTY_CORES)
    weekBlocks:     WeekBlocks | null = null
    weekBlockElems: Writable<WeekBlockElems | null> = writable(null)
    
    userRoutines:   Writable<DailyRoutine[] | null> = writable(null)
    focusedRoutine: Writable<DailyRoutine | null> = writable(null)
    focusedRoutineElems:  Writable<RoutineBlockElem[] | null> = writable(null)
    
    // new block stuff
    newBlock:       Writable<RoutineBlockElem | null> = writable(null)
    newBlockStartTime = -1

    newBlockTopNbr: RoutineBlockElem | null = null
    newBlockBottomNbr: RoutineBlockElem | null = null

    timeBoxPointDownRef = { x: -1, y: -1 }

    // DOM stuff
    containerElem: HTMLElement | null = null
    timeBoxContainer: HTMLElement | null = null
    earliestBlockHeadPos = Infinity

    // current core data in view
    currCores    = writable<RoutineCores>(this.weekCores)
    currTagBreakdown = writable<TagBreakDown[]>([])

    HEAD_OFFSET = 13.5
    BLOCK_GAP = 1
    TIME_BOX_POINTER_EVENT_OFFSET = 15
    TIME_BOX_ID = "time-box"
    
    DAYS_WEEK = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ]

    constructor(data: WeekBlocks | DailyRoutine[]) {
        if ("Mon" in data) {
            this.weekBlocks = data
            this.weekBlockElems.set({
                Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] 
            })
        }
        else {
            this.userRoutines.set(data)
        }
    }

    /* Singular Day Functionality */

    /**
     * Initialize all user routines 
     * @param routineId       Current routine in view 
     * @param containerElem   Time box container element
     */
    initDayRoutines(routineId: string, containerElem: HTMLElement) {
        this.containerElem = containerElem

        this.initCurrentRoutine(routineId)
    }

    /**
     * Initial current routine to be viewed.
     * @param id   Id of curent routine
     */
    initCurrentRoutine(id: string) {
        if (id === get(this.focusedRoutine)?.id) return

        const routine = get(this.userRoutines)!.find((routine) => routine.id === id)!
        this.focusedRoutine.set(routine)

        this.currCores.set((this.getRoutineCores(routine.blocks)))

        const { cores, earliestBlock, blockElems, tagBreakdown } = this.getRoutineData(get(this.focusedRoutine)!.blocks)

        this.currCores.set(cores)
        this.earliestBlockHeadPos = earliestBlock
        this.focusedRoutineElems.set(blockElems)
        this.currTagBreakdown.set(tagBreakdown)
    }


    /**
     * @param blocks        Routine's blocks
     * @param movedHeads    Map that tracked off-setted blocks to avoid collision.
     *                      Used to ensure all blocks that start at the same time are aligned the same.
     * 
     * @returns             Given a routine's blocks, core and tag breakdowns, block elems, and earliest block.
     */
    getRoutineData(blocks: RoutineBlock[], movedHeads?: Map<number, number>) {
        const cores = structuredClone(EMPTY_CORES)
        let earliestBlock = Infinity

        const blockElems = []
        const intervals: [number, number][] = []
        
        let firstAwakeMin = 1441
        let asleepAtMin = -1
        let tagMap = new Map<string, TagBreakDown>()

        for (let j = 0; j < blocks.length; j++) {
            // create block
            const block = blocks[j]
            const blockElem = this.createRoutineBlockElem(block, intervals, movedHeads)

            const dayContainerHt = this.containerElem!.scrollHeight
            const headOffsetPx = (block.startTime / 1440) * dayContainerHt

            earliestBlock = Math.min(earliestBlock, headOffsetPx)
            firstAwakeMin = Math.min(firstAwakeMin, block.startTime)
            asleepAtMin   = Math.max(asleepAtMin, block.endTime)

            blockElems!.push({ ...blockElem, id: j + "" })

            // tally cores
            this.updateCoresFromBlock(block, cores)
            this.updateTagDataFromBlock(block, tagMap)
        }

        // count sleeping and awake time
        cores.sleeping.totalTime += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin)
        cores.awake.totalTime    = TOTAL_DAY_MINS - cores.sleeping.totalTime

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
        const dayContainerHt = this.containerElem!.scrollHeight
        const elapsedTimeMins = block.endTime - block.startTime

        const headOffsetPerc = block.startTime / 1440
        const heightPx = (elapsedTimeMins / 1440) * dayContainerHt
        
        // ensure a BLOCK_GAP space between the blocks
        const headOffsetPx = headOffsetPerc * dayContainerHt
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
            yOffset: `${(headOffsetPerc * dayContainerHt) + tailGapOffset + this.HEAD_OFFSET}px`,
            xOffset: "0px", 
            startTimeStr: minsFromStartToHHMM(block.startTime),
            endTimeStr:   minsFromStartToHHMM(block.endTime)
        }
    }

    /**
     * Given a block, update the running tag data of a routine.
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
     * Initalize day block elements for each day of the week.
     */
    initWeekBlocks(containerElem: HTMLElement) {
        this.containerElem = containerElem

        const routineElems = get(this.weekBlockElems)!
        const movedHeads = new Map<number, number>()
        const weekCores = structuredClone(EMPTY_CORES)

        let i = 0
        
        for (let day of this.DAYS_WEEK) {
            const dayDataList = this.weekBlocks![day as keyof WeekBlocks]
            const { cores, earliestBlock, blockElems } = this.getRoutineData(dayDataList, movedHeads)

            // get elems for each day
            routineElems[day as keyof WeekBlocks]!.push(
                ...blockElems.map((blockElem: RoutineBlockElem, idx: number) => ({
                    ...blockElem, id: `${i}--${idx}`, xOffset: `calc((100% / 7) * ${i})`
                }))
            )

            this.earliestBlockHeadPos = Math.min(earliestBlock, this.earliestBlockHeadPos)

            // tally up the week cores
            for (const key in weekCores) {
                const _key = key as keyof typeof weekCores
                const isActivityCore = key != "sleeping" && key != "awake"

                weekCores[_key].totalTime += cores[_key].totalTime

                if (isActivityCore) {
                    weekCores[_key].total += cores[_key].total
                }
            }
            i++
        }
        
        this.getWeekCoreAvgs(weekCores)
        this.weekBlockElems.set(routineElems)
        this.weekCores = weekCores
        this.currCores.set(weekCores)
    }

    getWeekCoreAvgs(weekCores: RoutineCores) {
        for (const key in weekCores) {
            const core = weekCores[key as keyof typeof weekCores]
            const isActivityCore = key != "sleeping" && key != "awake"

            if (!isActivityCore || core.total) {
                core.avgTime = core.totalTime / 7
            }
        }
    }

    /**
     * Get cores from a single routine.
     * @param blocks  Blocks of a routine.
     * @returns       Core data of given routine.
     */
    getRoutineCores(blocks: RoutineBlock[]) {
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
    getBlockFromId(id: string) {
        const dayPropIdx = +id.split("--")[0]
        const dayProp = this.DAYS_WEEK[dayPropIdx] as keyof WeekBlocks

        return get(this.weekBlockElems)![dayProp].find((block) => block.id === id)
    }

    getDayIdx(key: string) {
        return key as keyof WeekBlocks
    }

    /**
     * Given a focused routine and its elems add the new block in the routine.
     * @param newBlock   New block to be incorporated into routine.
     */
    makeNewRoutineBlock(newBlock: RoutineBlockElem) {
        this.focusedRoutineElems.update((block) => [ ...block!, newBlock ])
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
                        tag: newBlock.tag
                    }
                ]
            }
        })
    }

    /* Block Event Handlers */
    onBlockPointerDown(e: MouseEvent, id: string) {

    }
    onBlockPointerDrag(e: MouseEvent, id: string) {

    }
    onBlockPointerUp(e: MouseEvent, id: string) {

    }
    onBlockClickedAway(e: CustomEvent, id: string) {

    }

    /* Week View Handlers */
    onTimeBoxPointerDown(e: MouseEvent) {
        const target = e.target as HTMLElement
        if (target.id != this.TIME_BOX_ID) return

        this.timeBoxContainer = target

        this.timeBoxPointDownRef = { 
            x: Math.ceil(e.offsetX), 
            y: Math.max(e.offsetY - this.TIME_BOX_POINTER_EVENT_OFFSET, 0)
        }
        
        // get new start time
        const containerHt = this.containerElem!.scrollHeight
        this.newBlockStartTime = roundUpToNearestFive((this.timeBoxPointDownRef.y / containerHt) * TOTAL_DAY_MINS)

        // find closest bottom nbr
        let closestStartTime = 1441
        get(this.focusedRoutineElems)!.forEach(block => {
            if (block.startTime > this.newBlockStartTime && block.startTime < closestStartTime) {
                closestStartTime = block.startTime
                this.newBlockBottomNbr = block
            }
        })

        // find closest top nbr
        let closestEndTime = -1
        get(this.focusedRoutineElems)!.forEach(block => {
            if (block.endTime < this.newBlockStartTime && block.endTime > closestEndTime) {
                closestEndTime = block.endTime
                this.newBlockTopNbr = block
            }
        })

        this.timeBoxContainer!.addEventListener("mousemove", this.onTimeBoxPointerMove);
        this.timeBoxContainer!.addEventListener("pointerup", this.onTmeBoxPointerUp);
    }
    onTimeBoxPointerMove = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        e.preventDefault()
        const containerHt = this.containerElem!.scrollHeight

        const offsetY = e.offsetY - this.TIME_BOX_POINTER_EVENT_OFFSET
        const yOffsetMins = (offsetY / containerHt) * TOTAL_DAY_MINS

        const yChange = this.timeBoxPointDownRef.y - offsetY
        const isMovingDown = yChange < 0
        
        // start time & end time take turns taking on the offsetY depending on direction of gesture
        let startTime = isMovingDown ? this.newBlockStartTime : yOffsetMins
        let endTime   = isMovingDown ? yOffsetMins : this.newBlockStartTime

        startTime = Math.max(roundUpToNearestFive(startTime), 0)
        endTime   = Math.max(roundUpToNearestFive(endTime), 0)

        // if colliding, then fix start and end times to their max and min values
        const topCollision     = !isMovingDown && this.newBlockTopNbr && (startTime < this.newBlockTopNbr.endTime)
        const bottomCollision  = isMovingDown && this.newBlockBottomNbr && (endTime > this.newBlockBottomNbr.startTime)

        startTime = topCollision ? this.newBlockTopNbr!.endTime : startTime
        endTime   = bottomCollision ? this.newBlockBottomNbr!.startTime : endTime

        const headOffsetPerc  = startTime / 1440
        const elapsedTimeMins = endTime - startTime
        const heightPerc      = elapsedTimeMins / 1440
        const heightPx        = (heightPerc * containerHt) - (bottomCollision ? this.BLOCK_GAP : 0)

        let yOffset = headOffsetPerc * containerHt + this.HEAD_OFFSET 
        yOffset     = topCollision ? this.newBlockTopNbr!.height + extractNum(this.newBlockTopNbr!.yOffset)[0] + this.BLOCK_GAP : yOffset
    
        if (!get(this.newBlock)) {
            this.newBlock.set({
                id: get(this.focusedRoutine)!.blocks.length + "",
                title: "Untitled Block",
                color: randomArrayElem(COLOR_SWATCHES.d),
                startTime, endTime,
                startTimeStr: minsFromStartToHHMM(startTime),
                endTimeStr: minsFromStartToHHMM(endTime),
                height: heightPx,
                xOffset: "0px",
                yOffset: `${headOffsetPerc * containerHt + this.HEAD_OFFSET}px`,
                activity: null,
                tag: null
            })
        }
        else {
            this.newBlock.update((block) => ({ 
                ...block!,
                endTime, 
                startTime,
                endTimeStr: minsFromStartToHHMM(endTime),
                startTimeStr: minsFromStartToHHMM(startTime),
                yOffset: `${yOffset}px`,
                height: Math.abs(heightPx)
            }))
        }

        target.style.cursor = "ns-resize"
    }
    onTmeBoxPointerUp = (e: MouseEvent) => {
        this.timeBoxContainer!.style.cursor = "default"

        this.timeBoxPointDownRef = { x: -1, y: -1 }
        this.newBlockBottomNbr = null
        this.newBlockBottomNbr = null

        this.timeBoxContainer!.removeEventListener("mousemove", this.onTimeBoxPointerMove)
        this.timeBoxContainer!.removeEventListener("pointerup", this.onTmeBoxPointerUp)

        this.makeNewRoutineBlock(get(this.newBlock)!)
        this.newBlock.set(null)
    }
}