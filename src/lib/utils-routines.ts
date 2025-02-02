import { CoreStatus } from "./enums"
import { weekRoutine } from "./store"
import { DAYS_OF_WEEK, getNowMins, minsToHHMM } from "./utils-date"

export const ROUTINE_BLOCKS_CONTAINER_ID = "routine-blocks-container"        // container for blocks
export const ROUTINE_SCROLL_CONTAINER_ID = "routine-blocks-scroll-container" // container of blocks container
export const DAY_DROPDOWN_WIDTH = 255

export enum BreakdownView {
    Cores, Tags
}
export enum ViewOption {
    Today, Weekly, MTWT, FSS
}

export function getCoreStr(core: RoutineActvity | null) {
    if (!core) return core;

    const foundPair = ROUTINE_CORE_KEYS.find(pair => pair[0] === core)
    return foundPair ? foundPair[1] : null
}

export function getCoreActivityIdx(activity: RoutineActvity | null) {
    const coreOptions = ROUTINE_CORE_KEYS.filter((pair) => pair[0] != "awake")

    return coreOptions.findIndex((key) => key[0] === activity)
}

export function getRoutineBlocks(dailyRoutine: RoutineBlock[] | DailyRoutine) {
    return "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine
}

export function getBlockStyling(height: number) {
    const classes: string[] = []

    if (height < 12) {
        classes.push("routine-blocks__block--xsm")
    }
    if (height < 20) {
        classes.push("routine-blocks__block--sm")
    }
    if (height < 34) {
        classes.push("routine-blocks__block--md")
    }
    return classes.join(" ")
}

export function isDayRoutinedLinked(weekRoutine: WeeklyRoutine | null, dayKey: keyof WeeklyRoutineBlocks) {
    if (!weekRoutine) {
        return false
    }
    const dayRoutine = weekRoutine!.blocks[dayKey]

    return "id" in dayRoutine
}

export function formatCoreData(mins: number) {
    if (mins < 0) {
        return "--"
    }
    return minsToHHMM(Math.floor(mins))
}

export function getDayRoutineFromWeek(wkRoutine: WeeklyRoutine | null, dayIdx: number) {
    if (!wkRoutine) return null

    const currDayKey = DAYS_OF_WEEK[dayIdx] as keyof WeeklyRoutineBlocks

    return wkRoutine.blocks[currDayKey]!
}

export function getCurrentBlock(dailyRoutine: RoutineBlock[] | DailyRoutine | null, currMin: number) {
    if (!dailyRoutine) return null

    const blocks = getRoutineBlocks(dailyRoutine)
    blocks.sort((a, b) => a.startTime - b.startTime)

    const blockIdx = blocks.findIndex((block) =>
         block.startTime <= currMin && currMin <= block.endTime)

    if (blockIdx < 0) return null

    return { 
        idx: blockIdx, 
        block: blocks[blockIdx] 
    }
}

export function getBlockFromOrderIdx(orderIdx: number, dailyRoutine: RoutineBlock[] | DailyRoutine) {
    const blocks = getRoutineBlocks(dailyRoutine)
    blocks.sort((a , b) => a.startTime - b.startTime)

    if (orderIdx < 0 || orderIdx >= blocks.length) {
        return null
    }

    return { 
        block: blocks[orderIdx], 
        idx: orderIdx 
    }

}

export function getBlockFromMins(mins: number, dailyRoutine: RoutineBlock[] | DailyRoutine) {
    const blocks = getRoutineBlocks(dailyRoutine)

    return blocks.find((block) =>  block.startTime <= mins && mins <= block.endTime)
}

export function getUpcomingBlock(mins: number, dailyRoutine: RoutineBlock[] | DailyRoutine) {
    const blocks = getRoutineBlocks(dailyRoutine)

    return blocks.reduce((next: { block: RoutineBlock, idx: number } | null, block: RoutineBlock, idx: number) => {
        if (mins < block.startTime && (!next || block.startTime < next.block.startTime)) {
            return { block, idx }
        }
        else {
            return next
        }
    }, null)
}

export function getMostRecentBlock(mins: number, dailyRoutine: RoutineBlock[] | DailyRoutine) {
    const blocks = getRoutineBlocks(dailyRoutine)

    return blocks.reduce((mostRecent: { block: RoutineBlock, idx: number } | null, block: RoutineBlock, idx: number ) => {
        if (mins > block.endTime && (!mostRecent || block.endTime > mostRecent.block.endTime)) {
            return { block, idx }
        } 
        else {
            return mostRecent
        }
    }, null)
}

export function getNextBlockInfo(dailyRoutine: RoutineBlock[] | DailyRoutine | null) {
    if (!dailyRoutine) {
        return {
            title: "",
            info: "No Routine"
        }
    }

    const nowMins = getNowMins()
    const nowBlock = getBlockFromMins(nowMins, dailyRoutine)
    const nextBlock = getUpcomingBlock(nowMins, dailyRoutine)
    
    if (nowBlock) {
        const ending = nowBlock.endTime === nowMins
        return {
            title: ending && nextBlock ? nextBlock.block.title : nowBlock.title ?? "",
            info: ending && nextBlock ? "Now" : `${minsToHHMM(Math.max(1, nowBlock.endTime - nowMins))}`
        }
    }
    else if (nextBlock) {
        return {
            title: nextBlock.block.title,
            info: `in ${minsToHHMM(Math.max(1, nextBlock.block.startTime - nowMins))}`
        }
    }
    else {
        return {
            title: "",
            info: "Free"
        }
    }
}

/**
 * Updates the active weekly routine.
 * 
 * @param args.updates   - updates to be incorporated to block to be updated.
 * @param args.startTime - start time of block to be updated.
 * @param args.dayIdx    - index of day of week to be updated.
 */
export function updateActiveRoutine(args: {
    updates:   Partial<RoutineBlock>,
    startTime: number,
    dayIdx:    number
}) {
    const { updates, startTime, dayIdx } = args

    weekRoutine.update((routine) => {
        if (!routine) return routine

        const currDayKey = DAYS_OF_WEEK[dayIdx] as keyof WeeklyRoutineBlocks
        let blocks: RoutineBlock[]
    
        // get blocks
        if ("id" in routine.blocks[currDayKey]) {
            blocks = routine.blocks[currDayKey].blocks
        }
        else {
            blocks = routine.blocks[currDayKey]
        }
    
        blocks = blocks.map((block) => 
            block.startTime === startTime ? { ...block, ...updates } : block
        )
    
        // update blocks in day routine
        if ("id" in routine.blocks[currDayKey]) {
            routine.blocks[currDayKey].blocks = blocks
        }
        else {
            routine.blocks[currDayKey] = blocks
        }

        return routine
    })
}

export function toggleRoutineBlockComplete(blockIdx: number, currTime: { dayIdx: number, minutes: number }) {
    weekRoutine.update((week) => {
        if (!week) return week

        const currDayKey = DAYS_OF_WEEK[currTime.dayIdx] as keyof WeeklyRoutineBlocks
        const dayRoutine = week.blocks[currDayKey]!

        if ("id" in dayRoutine) {
            dayRoutine.blocks[blockIdx].done = !dayRoutine.blocks[blockIdx].done
        }
        else {
            dayRoutine[blockIdx].done = !dayRoutine[blockIdx].done
        }

        return week
    })
}

export function resetDayRoutine() {
    weekRoutine.update((week) => {
        if (!week) return week

        for (const day of DAYS_OF_WEEK) {
            let key = day as keyof WeeklyRoutineBlocks
            let dayRoutine = week.blocks[key]!
            let blocks = "id" in dayRoutine ? dayRoutine.blocks : dayRoutine

            for (const block of blocks) {
                block.done = false
            }
            if ("id" in dayRoutine) {
                (week.blocks[key] as DailyRoutine).blocks = blocks
            }
            else {
                week.blocks[key] = blocks
            }
        }
        return week
    })
}

export function setDayBreakdownXOffset(dayBreakdownColIdx: number, numViewDays: number) {
    if (numViewDays === 1) {
        return `calc(50% - ${(DAY_DROPDOWN_WIDTH / 2) - 30}px)`
    }
    else if (numViewDays === 7) {
        return `clamp(10px, calc(((100% / ${numViewDays}) * ${dayBreakdownColIdx}) + 0px), calc(100% - ${DAY_DROPDOWN_WIDTH + 10}px))`;
    }
    else {
        return `clamp(10px, calc(((100% / ${numViewDays}) * ${dayBreakdownColIdx}) + 40px), calc(100% - ${DAY_DROPDOWN_WIDTH}px))`;
    }
}

export const EDIT_BLOCK_OPTIONS: DropdownListItem[] = [
    { name: "Edit Block" },
    { name: "Change Color" },
    { name: "Duplicate Block", divider: true },
    { name: "Delete Block" }
]

export const ROUTINE_CORE_KEYS: [RoutineActvity, string][] = [
    ["sleeping", "Sleeping"],
    ["working", "Working"],
    ["mind", "Mind"],
    ["awake", "Awake"],
    ["body", "Body"],
    ["selfCare", "Self-Care"]
]
export const CORE_OPTIONS = ROUTINE_CORE_KEYS.filter((pair) => pair[0] != "awake" && pair[0] != "sleeping")

export const EMPTY_CORES: RoutineCores = {
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
    },
    awake: {
        status: CoreStatus.Healthy,
        totalTime: 0,
        avgTime: 0,
        total: 0
    },
}