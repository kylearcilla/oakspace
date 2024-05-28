import { CoreStatus } from "./enums"
import { minsToHHMM } from "./utils-date"
import { getElemById, getElemNumStyle } from "./utils-general"

export const ROUTINE_BLOCKS_CONTAINER_ID = "routine-blocks-container"        // container for blocks
export const ROUTINE_SCROLL_CONTAINER_ID = "routine-blocks-scroll-container" // container of blocks container

export enum BreakdownView {
    Cores, Tags
}
export enum ViewOption {
    Today, Weekly, MTWT, FSS
}

export function getTimeForNowBar() {
    const date = new Date()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const dayIdx = new Date().getDay()
    
    return {
        dayIdx: (dayIdx + 6) % 7,
        minutes: (hours * 60) + minutes
    }
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

export function isDayRoutinedLinked(weekRoutine: WeeklyRoutine, dayKey: keyof WeeklyRoutineBlocks) {
    const dayRoutine = weekRoutine!.blocks[dayKey]
    return "id" in dayRoutine
}

export function formatCoreData(mins: number) {
    if (mins < 0) return "--"
    return minsToHHMM(mins)
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
    ["selfCare", "Self Care"]
]
export const CORE_OPTIONS = ROUTINE_CORE_KEYS.filter((pair) => pair[0] != "awake")

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