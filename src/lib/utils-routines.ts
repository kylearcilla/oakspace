import { CoreStatus } from "./enums"
import { DAYS_OF_WEEK, getNowMins, minsToHHMM } from "./utils-date"
import { getElemById, getElemNumStyle } from "./utils-general"

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
    if (!weekRoutine) return false
    const dayRoutine = weekRoutine!.blocks[dayKey]

    return "id" in dayRoutine
}

export function formatCoreData(mins: number) {
    if (mins < 0) return "--"
    return minsToHHMM(Math.floor(mins))
}

export function initTodayRoutine(wkRoutine: WeeklyRoutine | null, currTime: { dayIdx: number, minutes: number }) {
    if (!wkRoutine) return null

    const { dayIdx } = currTime
    const currDayKey = DAYS_OF_WEEK[dayIdx] as keyof WeeklyRoutineBlocks

    return wkRoutine.blocks[currDayKey]!
}

export function initCurrentBlock(dailyRoutine: RoutineBlock[] | DailyRoutine | null,  currMin: number) {
    if (!dailyRoutine) return null

    const blocks: RoutineBlock[] = "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine
    const blockIdx = blocks.findIndex((block) =>  block.startTime <= currMin && currMin <= block.endTime)

    if (blockIdx < 0) return null

    return { idx: blockIdx, block: blocks[blockIdx] }
}

export function getBlockFromOrderIdx(orderIdx: number, dailyRoutine: RoutineBlock[] | DailyRoutine) {
    const blocks: RoutineBlock[] = "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine
    blocks.sort((a , b) => a.startTime - b.startTime)

    if (orderIdx < 0 || orderIdx >= blocks.length) {
        return null
    }

    return { block: blocks[orderIdx], idx: orderIdx }

}

export function getNowBlock(mins: number, dailyRoutine: RoutineBlock[] | DailyRoutine) {
    const blocks: RoutineBlock[] = "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine

    return blocks.find((block) =>  block.startTime <= mins && mins <= block.endTime)
}

export function getUpcomingBlock(mins: number, dailyRoutine: RoutineBlock[] | DailyRoutine) {
    const blocks: RoutineBlock[] = "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine

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
    const blocks: RoutineBlock[] = "id" in dailyRoutine ? dailyRoutine.blocks : dailyRoutine;

    return blocks.reduce((mostRecent: { block: RoutineBlock, idx: number } | null, block: RoutineBlock, idx: number ) => {
        if (mins > block.endTime && (!mostRecent || block.endTime > mostRecent.block.endTime)) {
            return { block, idx }
        } else {
            return mostRecent
        }
    }, null)
}

export function getMextTimeCheckPointInfo(dailyRoutine: RoutineBlock[] | DailyRoutine | null) {
    if (!dailyRoutine) return

    const nowMins = getNowMins()

    const nowBlock = getNowBlock(nowMins, dailyRoutine)
    if (nowBlock != null) {
        return nowBlock.endTime === nowMins ? "Now" : `${minsToHHMM(nowBlock.endTime - nowMins)}`
    }
    
    const nextBlock = getUpcomingBlock(nowMins, dailyRoutine)
    return nextBlock ? `in ${minsToHHMM(nextBlock.block.startTime - nowMins)}` : ""
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
    {
        options: [
            { name: "Edit Block" },
            { name: "Change Color" },
            { name: "Duplicate Block" }
        ]
    },
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