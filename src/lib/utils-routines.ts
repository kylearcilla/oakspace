import { COLOR_SWATCHES, TEST_TAGS } from "./utils-general";

export function getCoreStr(core: RoutineActvity | null) {
    if (!core) return core;

    const foundPair = ROUTINE_CORE_KEYS.find(pair => pair[0] === core)
    return foundPair ? foundPair[1] : null
}

export const ROUTINE_CORE_KEYS: [RoutineActvity, string][] = [
    ["sleeping", "Sleeping"],
    ["working", "Working"],
    ["mind", "Mind"],
    ["awake", "Awake"],
    ["body", "Body"],
    ["selfCare", "Self Care"]
]

export const ROUTINES: DailyRoutine[] = [
    { 
        id: "0",
        name: "Workday 1.0",
        description: "Regular work day",
        blocks: [
            {
                title: "Fruit 🍑",
                color: COLOR_SWATCHES.d[1],
                startTime: 370,
                endTime: 420,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,
                endTime: 720,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null,
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 1080,
                activity: "working",
                tag: TEST_TAGS[1],
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,
                endTime: 1140,
                activity: "body",
                tag: TEST_TAGS[0],
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,
                endTime: 1170,
                activity: null,
                tag: TEST_TAGS[3],
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ]
    },
    { 
        id: "zz",
        name: "Weekend",
        description: "Ideal Weekend",
        blocks: [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[0],
                startTime: 480,
                endTime: 520,
                activity: null,
                tag: null
            },
            {
                title: "🏃‍♂️ Running",
                color: COLOR_SWATCHES.d[1],
                startTime: 600,
                endTime: 690,
                activity: "working",
                tag: TEST_TAGS[6]
            },
            {
                title: "🍖 Lunch Break",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,
                endTime: 800,
                activity: null,
                tag: null
            },
            {
                title: "🌁 Art",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,
                endTime: 920,
                activity: "selfCare",
                tag: TEST_TAGS[8]
            },
            {
                title: "💪 Gym (Push)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1000,
                endTime: 1100,
                activity: "body",
                tag: TEST_TAGS[0]
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1130,
                endTime: 1200,
                activity: null,
                tag: TEST_TAGS[3]
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[1],
                startTime: 1380,
                endTime: 1410,
                activity: "selfCare",
                tag: null
            },
        ]
    }
]

export const TEST_ROUTINE = {
    
}