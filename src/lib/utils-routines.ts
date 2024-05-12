import { CoreStatus } from "./enums";
import { COLOR_SWATCHES, TEST_TAGS } from "./utils-general"

export enum BreakdownView {
    Cores, Tags
}
export enum ViewOption {
    Today, Weekly, MTWT, FSS
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

export function getCoreStr(core: RoutineActvity | null) {
    if (!core) return core;

    const foundPair = ROUTINE_CORE_KEYS.find(pair => pair[0] === core)
    return foundPair ? foundPair[1] : null
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

export function isDayRoutinedLinked(currWeekRoutine: WeeklyRoutine, dayKey: keyof WeeklyRoutineBlocks) {
    const dayRoutine = currWeekRoutine!.blocks[dayKey]
    return "id" in dayRoutine
}

export const ROUTINE_CORE_KEYS: [RoutineActvity, string][] = [
    ["sleeping", "Sleeping"],
    ["working", "Working"],
    ["mind", "Mind"],
    ["awake", "Awake"],
    ["body", "Body"],
    ["selfCare", "Self Care"]
]

export const EMPTY_CORES = {
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