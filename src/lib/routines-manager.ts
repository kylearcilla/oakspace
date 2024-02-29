import { get, writable, type Writable } from "svelte/store"
import { getDifferenceInSecs, getTotalSecondsFromStartOfDay, formatTimeToHHMM, minsFromStartToHHMM, TOTAL_DAY_MINS, minsToHHMM } from "./utils-date"

enum CoreStatus {
    Healthy, Normal, Lacking
}

/**
 * Manger class for editing weekly routines.
 */
export class RoutinesManager {
    dayBlocks: DayBlocks
    dayBlockElems: Writable<DayBlockElems>

    containerElem: HTMLElement | null = null
    earliestBlockHeadPos = Infinity

    HEAD_OFFSET = 7.5
    BLOCK_GAP = 1

    weekCores = {
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
    currCores = writable<RoutineCores>(this.weekCores)
    
    days: (keyof typeof this.dayBlocks)[] = [
        "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    ]

    constructor(blocks: DayBlocks) {
        this.dayBlocks = blocks
        this.dayBlockElems = writable({  
            Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] 
        })
    }

    /**
     * Initalize day block elements from a routine's day block data.
     */
    init(containerElem: HTMLElement) {
        this.containerElem = containerElem

        const dayBlockElems = get(this.dayBlockElems)
        const movedHeads = new Map<number, number>()
        const weekCores = get(this.currCores)

        let earliestBlock = Infinity
        
        // init block elements
        for (let i = 0; i < this.days.length; i++) {
            const day = this.days[i]
            const dayDataList = this.dayBlocks[day]
            const dayBlocksList = dayBlockElems[day]
            
            const intervals: [number, number][] = []
            let firstAwakeMin = 1441
            let asleepAtMin = -1
            let totalNapTime = 0

            for (let j = 0; j < dayDataList.length; j++) {
                const block = dayDataList[j]
                const dayContainerHt = containerElem.scrollHeight
                const elapsedTimeMins = block.endTime - block.startTime

                const headOffsetPerc = block.startTime / 1440
                const xOffset = `calc((100% / 7) * ${i})`
                
                const heightPerc = elapsedTimeMins / 1440
                const heightPx = heightPerc * dayContainerHt
                
                // ensure a BLOCK_GAP space between the blocks
                const headOffsetPx = headOffsetPerc * dayContainerHt
                const tailOffsetPx = headOffsetPx + heightPx
                const headGapSpace = headOffsetPx - this.BLOCK_GAP 

                let tailGapOffset = 0

                // blocks that start at the same time should be horizontally aligned for consistency
                if (movedHeads.has(headOffsetPx)) {
                    tailGapOffset = movedHeads.get(headOffsetPx)!
                }
                else {
                    const overlappingInterval = intervals.find((interval) => headGapSpace <= interval[1])
                    tailGapOffset = overlappingInterval ? (overlappingInterval[1] - headGapSpace + this.BLOCK_GAP) : 0

                    if (overlappingInterval) {
                        movedHeads.set(headOffsetPx, tailGapOffset)
                    }
                }

                // tally up core data
                if (block.activity) {
                    const strIdx = block.activity as keyof typeof weekCores
                    weekCores[strIdx].total++
                    weekCores[strIdx].totalTime += elapsedTimeMins

                    if (block.activity === "sleeping") totalNapTime += elapsedTimeMins
                }

                // running amounts
                intervals.push([headOffsetPx, tailOffsetPx + tailGapOffset])
                earliestBlock = Math.min(earliestBlock, headOffsetPx)
                firstAwakeMin = Math.min(firstAwakeMin, block.startTime)
                asleepAtMin   = Math.max(asleepAtMin, block.endTime)

                dayBlocksList!.push({
                    ...block,
                    id: `${i}--${j}`,
                    height: heightPx,
                    yOffset: `${(headOffsetPerc * dayContainerHt) + 6 + tailGapOffset + this.HEAD_OFFSET}px`,
                    xOffset, 
                    startTimeStr: minsFromStartToHHMM(block.startTime),
                    endTimeStr:   minsFromStartToHHMM(block.endTime),
                })
            }

            // count sleeping and awake time
            weekCores.sleeping.totalTime += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin) + totalNapTime
            weekCores.awake.totalTime    += (asleepAtMin - firstAwakeMin) - totalNapTime
        }

        // calculate avgs
        for (const key in weekCores) {
            const core = weekCores[key as keyof typeof weekCores]

            if (key === "sleeping" || key === "awake") {
                core.avgTime = core.totalTime / 7
            }
            else if (core.total) {
                core.avgTime = core.totalTime / core.total
            }
        }

        this.dayBlockElems.set(dayBlockElems)
        this.weekCores = weekCores
        this.currCores.set(weekCores)
        this.earliestBlockHeadPos = earliestBlock
    }
    getDayCores(dayProp: keyof typeof this.dayBlocks) {
        const dayBlocks = this.dayBlocks[dayProp]
        const cores = {
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

        let firstAwakeMin = 1441
        let asleepAtMin = -1
        let totalNapTime = 0

        for (let block of dayBlocks) {
            if (block.activity) {
                const strIdx = block.activity as keyof typeof cores
                const elapsedTimeMins = block.endTime - block.startTime

                cores[strIdx].total++
                cores[strIdx].totalTime += elapsedTimeMins

                if (block.activity === "sleeping") totalNapTime += elapsedTimeMins
            }

            firstAwakeMin = Math.min(firstAwakeMin, block.startTime)
            asleepAtMin   = Math.max(asleepAtMin, block.endTime)
        }

        // count sleeping and awake time
        cores.sleeping.totalTime += firstAwakeMin + (TOTAL_DAY_MINS - asleepAtMin) + totalNapTime
        cores.awake.totalTime    += (asleepAtMin - firstAwakeMin) - totalNapTime

        return cores
    }
    getBlockFromId(id: string) {
        const dayPropIdx = +id.split("--")[0]
        const dayProp = this.days[dayPropIdx]

        return get(this.dayBlockElems)[dayProp].find((block) => block.id === id)
    }
    setBreakdownData(option: string) {
        if (option === "Weekly") {
            this.currCores.set(this.weekCores)
            return
        }

        const dayProp = option.substring(0, 3) as keyof typeof this.dayBlocks
        const dayCores = this.getDayCores(dayProp)
        this.currCores.set(dayCores)
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
    onWeekViewBoardPointerDown(e: MouseEvent) {

    }
    onWeekViewBoardPointerDrag(e: MouseEvent) {

    }
    onWeekViewBoardPointerUp(e: MouseEvent) {

    }
}