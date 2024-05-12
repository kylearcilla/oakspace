import { CoreStatus } from "$lib/enums"
import { COLOR_SWATCHES, TEST_TAGS } from "$lib/utils-general"

const TEST_CONTAINER_HT = 750

// test
export const TEST_ROUTINE_BLOCK_ELEMS = [
    {
        testIdx: 0,
        rawBlock: {
            title: "A",
            color: COLOR_SWATCHES.d[0],
            startTime: 0,
            endTime: 10,
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height:  TEST_CONTAINER_HT * (10 / 1440), 
            yOffset: TEST_CONTAINER_HT * (0 / 1440)
        }
    },
    {
        testIdx: 1,
        rawBlock: {
            title: "B",
            color: COLOR_SWATCHES.d[1],
            startTime: 120,   // 2:00 AM
            endTime: 130,     // 2:10 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, 
            yOffset: 0
        }
    },
    {
        testIdx: 2,
        rawBlock: {
            title: "C",
            color: COLOR_SWATCHES.d[2],
            startTime: 130,   // 2:10 AM
            endTime: 140,     // 2:20 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 3,
        rawBlock: {
            title: "D",
            color: COLOR_SWATCHES.d[3],
            startTime: 140,   // 2:20 AM
            endTime: 150,     // 2:30 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 4,
        rawBlock: {
            title: "E",
            color: COLOR_SWATCHES.d[4],
            startTime: 150,   // 2:30 AM
            endTime: 160,     // 2:40 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 5,
        rawBlock: {
            title: "F",
            color: COLOR_SWATCHES.d[0],
            startTime: 160,   // 2:40 AM
            endTime: 170,     // 2:50 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 6,
        rawBlock: {
            title: "G",
            color: COLOR_SWATCHES.d[0],
            startTime: 170,   // 2:50 AM
            endTime: 180,     // 3:00 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 7,
        rawBlock: {
            title: "H",
            color: COLOR_SWATCHES.d[0],
            startTime: 180,   // 3:00 AM
            endTime: 200,     // 3:10 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 8,
        rawBlock: {
            title: "I",
            color: COLOR_SWATCHES.d[0],
            startTime: 200,   // 3:10 AM
            endTime: 210,     // 3:20 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 9,
        rawBlock: {
            title: "J",
            color: COLOR_SWATCHES.d[0],
            startTime: 210,   // 3:30 AM
            endTime: 220,     // 3:40 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 10,
        rawBlock: {
            title: "K",
            color: COLOR_SWATCHES.d[0],
            startTime: 220,   // 3:40 AM
            endTime: 230,     // 3:50 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 11,
        rawBlock: {
            title: "L",
            color: COLOR_SWATCHES.d[0],
            startTime: 230,   // 3:50 AM
            endTime: 240,     // 4:00 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 12,
        rawBlock: {
            title: "L",
            color: COLOR_SWATCHES.d[0],
            startTime: 230,   // 3:50 AM
            endTime: 240,     // 4:00 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 13,
        rawBlock: {
            title: "M",
            color: COLOR_SWATCHES.d[0],
            startTime: 240, // 4:00 AM
            endTime: 435,   // 7:15 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 14,
        rawBlock: {
            title: "M",
            color: COLOR_SWATCHES.d[0],
            startTime: 443, // 7:23 AM
            endTime: 484,   // 8:04 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 15,
        rawBlock: {
            title: "M",
            color: COLOR_SWATCHES.d[0],
            startTime: 719, // 11:59 AM
            endTime: 729,   // 12:09 PM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 16,
        rawBlock: {
            title: "M",
            color: COLOR_SWATCHES.d[0],
            startTime: 0,   // 12:00 AM
            endTime: 1439,  // 11:59 AM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 17,
        rawBlock: {
            title: "M",
            color: COLOR_SWATCHES.d[0],
            startTime: 750, // 12:30 PM
            endTime: 1019,  // 4:59 PM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 18,
        rawBlock: {
            title: "M",
            color: COLOR_SWATCHES.d[0],
            startTime: 1019, // 4:59 PM
            endTime: 1271,   // 9:11 PM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 19,
        rawBlock: {
            title: "M",
            color: COLOR_SWATCHES.d[0],
            startTime: 1272, // 9:12 PM
            endTime: 1331,   // 10:11 PM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
    {
        testIdx: 20,
        rawBlock: {
            title: "M",
            color: COLOR_SWATCHES.d[0],
            startTime: 1429, // 11
            endTime: 1439,   // 11:59 PM
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        elemProps: {
            height: 0, yOffset: 0
        }
    },
]
export const WEEKLY_TEST_1: WeeklyRoutineBlocks = {
    Monday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[0],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[1],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[3],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[4],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[5],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Monday: DAILY_ROUTINES[0],
    // Tuesday: DAILY_ROUTINES[1],
    Tuesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[7],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[8],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[10],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[11],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[12],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Wednesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[14],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[15],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[16],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[17],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[18],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[19],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[20],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Thursday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[21],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[22],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[23],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[24],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[25],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[26],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[27],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Friday: DAILY_ROUTINES[1],
    Friday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[1],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[3],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[4],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[1],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Saturday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[0],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[1],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[3],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[4],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[5],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Sunday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[7],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[8],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[10],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[11],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[12],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ]
}

export const PRESET_ROUTINES = {
    hs: [
        [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[2],
                startTime: 360,  // 6:00 AM
                endTime: 405,    // 6:45 AM
                activity: null,
                tag: null,
                description: "Wake up, stretches, brush teeth, shower, get dressed.",
                tasks: []
            },
            {
                title: "🎒 School",
                color: COLOR_SWATCHES.d[1],
                startTime: 420,  // 7:00 AM
                endTime: 900,    // 3:00 PM
                activity: null,
                tag: null,
                description: "Attend classes, study breaks, lunch",
                tasks: []
            },
            {
                title: "🎾 Tennis Practice",
                color: COLOR_SWATCHES.d[3],
                startTime: 915,  // 3:15 PM
                endTime: 990,   // 4:30 PM
                activity: null,
                tag: null,
                description: "Tennis grind shit.",
                tasks: []
            },
            {
                title: "👨‍💻 HW and Study",
                color: COLOR_SWATCHES.d[0],
                startTime: 1000,  // 4:40 PM
                endTime: 1065,    // 5:45 PM
                activity: null,
                tag: null,
                description: "Tennis grind shit.",
                tasks: []
            },
            {
                title: "🌿 Relaxation Time",
                color: COLOR_SWATCHES.d[17],
                startTime: 1080,  // 6:00 PM
                endTime: 1140,    // 7:00 PM
                activity: null,
                tag: null,
                description: "After-school relax. Nap time. Snack. Walk outisde.",
                tasks: []
            },
            {
                title: "Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1170,  // 7:30 AM
                endTime: 1200,    // 8:00 AM
                activity: null,
                tag: null,
                description: "Enjoy dinner with family, discuss day's events",
                tasks: []
            },
            {
                title: "👨‍💻 HW and Study",
                color: COLOR_SWATCHES.d[0],
                startTime: 1220,   // 8:20 PM
                endTime: 1320,     // 9:00 PM
                activity: null,
                tag: null,
                description: "More studying if needed. Project. 🏫 College research",
                tasks: []
            },
            {
                title: "🌿 Chill",
                color: COLOR_SWATCHES.d[13],
                startTime: 1325,   // 9:05 PM
                endTime: 1360,     // 10:40 PM
                activity: null,
                tag: null,
                description: "Relax, watch TV, play video games, read",
                tasks: []
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[19],
                startTime: 1365,   // 10:45 PM
                endTime: 1395,     // 11:30 PM
                activity: null,
                tag: null,
                description: "Skincare. Music. Light Reading. Shower. Sleep. White Noise. Plan for the next day.",
                tasks: []
            },
        ],
        [
            {
                title: "🌤️ Morning Routine",
                color: COLOR_SWATCHES.d[2],
                startTime: 480, // 8:00 AM
                endTime: 540,    // 9:00 AM
                activity: null,
                tag: null,
                description: "Wake up, stretches, brush teeth, shower, get dressed.",
                tasks: []
            },
            {
                title: "🏃‍♂️ Morning Runing",
                color: COLOR_SWATCHES.d[9],
                startTime: 555,  // 9:15 AM
                endTime: 630,    // 10:30 PM
                activity: null,
                tag: null,
                description: "Morning run.",
                tasks: []
            },
            {
                title: "Lunch",
                color: COLOR_SWATCHES.d[14],
                startTime: 720, // 12:00 AM
                endTime: 750,   // 12:30 PM
                activity: null,
                tag: null,
                description: "Tennis grind shit.",
                tasks: []
            },
            {
                title: "💵 Work",
                color: COLOR_SWATCHES.d[21],
                startTime: 810,  // 1:30 PM
                endTime: 1110,    // 6:30 PM
                activity: null,
                tag: null,
                description: "Get the fucking bread bitch.",
                tasks: []
            },
            {
                title: "Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1170,  // 7:30 AM
                endTime: 1200,    // 8:00 AM
                activity: null,
                tag: null,
                description: "Enjoy dinner with family, discuss day's events",
                tasks: []
            },
            {
                title: "🌿 Chill",
                color: COLOR_SWATCHES.d[13],
                startTime: 1215,   // 8:15 PM
                endTime: 1360,     // 10:40 PM
                activity: null,
                tag: null,
                description: "Relax, watch TV, play video games, read",
                tasks: []
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[19],
                startTime: 1365,   // 10:45 PM
                endTime: 1395,     // 11:30 PM
                activity: null,
                tag: null,
                description: "Skincare. Music. Light Reading. Shower. Sleep. White Noise. Plan for the next day.",
                tasks: []
            },
        ]
    ],
    uni: [
            [
                {
                    title: "🌤️ Morning Routine",
                    color: COLOR_SWATCHES.d[2],
                    startTime: 420, // 7:00 AM
                    endTime: 450,   // 7:30 AM
                    activity: null,
                    tag: null,
                    description: "Wake up, stretches, brush teeth, shower, get dressed.",
                    tasks: []
                },
                {
                    title: "📝 Day Planning",
                    color: COLOR_SWATCHES.d[12],
                    startTime: 450,  // 7:30 AM
                    endTime: 470,    // 7:50 AM
                    activity: null,
                    tag: null,
                    description: "Plan the day. Study Plan. Free time plan.",
                    tasks: []
                },
                {
                    title: "💪 Gym (Push)",
                    color: COLOR_SWATCHES.d[8],
                    startTime: 480, // 8:00 AM
                    endTime: 540,   // 9:00 PM
                    activity: null,
                    tag: null,
                    description: "Tennis grind shit.",
                    tasks: []
                },
                {
                    title: "📖 Morning Lecture",
                    color: COLOR_SWATCHES.d[5],
                    startTime: 570,  // 9:30 PM
                    endTime: 690,    // 11:30 PM
                    activity: null,
                    tag: null,
                    description: "Attend morning lecture.",
                    tasks: []
                },
                {
                    title: "Lunch",
                    color: COLOR_SWATCHES.d[0],
                    startTime: 705, // 11:45 AM
                    endTime: 765,   // 12:45 PM
                    activity: null,
                    tag: null,
                    description: "Lunch",
                    tasks: []
                },
                {
                    title: "👨‍💻 Deep Work Session",
                    color: COLOR_SWATCHES.d[26],
                    startTime: 840, // 2:00 PM
                    endTime: 960,   // 4:00 PM
                    activity: null,
                    tag: null,
                    description: "Relax, watch TV, play video games, read",
                    tasks: []
                },
                {
                    title: "🌿 Relaxation",
                    color: COLOR_SWATCHES.d[17],
                    startTime: 960, // 4:00 PM
                    endTime: 990,   // 4:30 PM
                    activity: null,
                    tag: null,
                    description: "Relax, watch TV, play video games, read",
                    tasks: []
                },
                {
                    title: "👨‍💻 Deep Work Session",
                    color: COLOR_SWATCHES.d[26],
                    startTime: 990,  // 4:30 PM
                    endTime: 1110,   // 6:30 PM
                    activity: null,
                    tag: null,
                    description: "Skincare. Music. Light Reading. Shower. Sleep. White Noise. Plan for the next day.",
                    tasks: []
                },
                {
                    title: "🌿 Relaxation",
                    color: COLOR_SWATCHES.d[17],
                    startTime: 1110,   // 6:30 PM
                    endTime: 1140,     // 7:30 PM
                    activity: null,
                    tag: null,
                    description: "Relax, watch TV, play video games, read",
                    tasks: []
                },
                {
                    title: "Dinner",
                    color: COLOR_SWATCHES.d[11],
                    startTime: 1200,   // 8:00 PM
                    endTime: 1245,     // 8:45 PM
                    activity: null,
                    tag: null,
                    description: "Cook or order or go out with a friend/friends.",
                    tasks: []
                },
                {
                    title: "Internship / Research Grind",
                    color: COLOR_SWATCHES.d[20],
                    startTime: 1275,   // 9:15 PM
                    endTime: 1335,     // 10:15 PM
                    activity: null,
                    tag: null,
                    description: "Work on resume, look for opportunities, interview practice.",
                    tasks: []
                },
                {
                    title: "🌿 Relaxation",
                    color: COLOR_SWATCHES.d[17],
                    startTime: 1335,   // 10:15 PM
                    endTime: 1380,     // 11:00 PM
                    activity: null,
                    tag: null,
                    description: "Gaming / Books / Movies / Shows",
                    tasks: []
                },
                {
                    title: "🌙 Evening Routine",
                    color: COLOR_SWATCHES.d[19],
                    startTime: 1380,   // 11:05 PM
                    endTime: 1410,     // 11:30 PM
                    activity: null,
                    tag: null,
                    description: "Skincare. Music. Light Reading. Shower. Sleep. White Noise. Plan for the next day.",
                    tasks: []
                },
            ],
            [
                {
                    title: "🌤️ Morning Routine",
                    color: COLOR_SWATCHES.d[2],
                    startTime: 480, // 8:00 AM
                    endTime: 510,   // 8:30 AM
                    activity: null,
                    tag: null,
                    description: "Wake up, stretches, brush teeth, shower, get dressed.",
                    tasks: []
                },
                {
                    title: "📝 Day Planning",
                    color: COLOR_SWATCHES.d[12],
                    startTime: 510,  // 8:30 AM
                    endTime: 530,    // 8:50 AM
                    activity: null,
                    tag: null,
                    description: "Plan the day. Study Plan. Free time plan.",
                    tasks: []
                },
                {
                    title: "🏃‍♂️ Morning Run",
                    color: COLOR_SWATCHES.d[8],
                    startTime: 540, // 9:30 AM
                    endTime: 630,   // 11:00 AM
                    activity: null,
                    tag: null,
                    description: "Morning Cardio",
                    tasks: []
                },
                {
                    title: "👨‍💻 Deep Work Session",
                    color: COLOR_SWATCHES.d[26],
                    startTime: 645, // 10:45 PM
                    endTime: 750,   // 4:00 PM
                    activity: null,
                    tag: null,
                    description: "Relax, watch TV, play video games, read",
                    tasks: []
                },
                {
                    title: "Lunch",
                    color: COLOR_SWATCHES.d[0],
                    startTime: 760, endTime: 620,
                    activity: null,
                    tag: null,
                    description: "Lunch",
                    tasks: []
                },
                {
                    title: "Tutoring",
                    color: COLOR_SWATCHES.d[26],
                    startTime: 900,  // 3 PM
                    endTime: 1140,   // 7 PM
                    activity: null,
                    tag: null,
                    description: "Get that bread.",
                    tasks: []
                },
                {
                    title: "Dinner",
                    color: COLOR_SWATCHES.d[11],
                    startTime: 1200,   // 8:00 PM
                    endTime: 1245,     // 8:45 PM
                    activity: null,
                    tag: null,
                    description: "Cook or order or go out with a friend/friends.",
                    tasks: []
                },
                {
                    title: "🍊 Life Stuff",
                    color: COLOR_SWATCHES.d[8],
                    startTime: 1260,   // 9:00 PM
                    endTime: 1320,     // 10:00 PM
                    activity: null,
                    tag: null,
                    description: "Finance. Health. Productivity. Career. Travel. Relationships. Side Hustle. GOal Settings. Etc.",
                    tasks: []
                },
                {
                    title: "🌿 Relaxation",
                    color: COLOR_SWATCHES.d[17],
                    startTime: 1320,   // 10:00 PM
                    endTime: 1380,     // 11:00 PM
                    activity: null,
                    tag: null,
                    description: "Gaming / Books / Movies / Shows",
                    tasks: []
                },
                {
                    title: "🌙 Evening Routine",
                    color: COLOR_SWATCHES.d[19],
                    startTime: 1380,   // 11:05 PM
                    endTime: 1410,     // 11:30 PM
                    activity: null,
                    tag: null,
                    description: "Skincare. Music. Light Reading. Shower. Sleep. White Noise. Plan for the next day.",
                    tasks: []
                },
            ],
            [
                {
                    title: "🌤️ Morning Routine",
                    color: COLOR_SWATCHES.d[2],
                    startTime: 420, // 7:00 AM
                    endTime: 450,   // 7:30 AM
                    activity: null,
                    tag: null,
                    description: "Wake up, stretches, brush teeth, shower, get dressed.",
                    tasks: []
                },
                {
                    title: "📝 Day Planning",
                    color: COLOR_SWATCHES.d[12],
                    startTime: 450,  // 7:30 AM
                    endTime: 470,    // 7:50 AM
                    activity: null,
                    tag: null,
                    description: "Plan the day. Study Plan. Free time plan.",
                    tasks: []
                },
                {
                    title: "👨‍💻 Deep Work Session",
                    color: COLOR_SWATCHES.d[26], tag: null,
                    startTime: 480, endTime: 600,
                    activity: null, description: "", tasks: [],
                },
                {
                    title: "🌿 Relaxation",
                    startTime: 600, endTime: 630,
                    activity: null, description: "", tasks: [],
                    color: COLOR_SWATCHES.d[17], tag: null,
                },
                {
                    title: "👨‍💻 Deep Work Session",
                    startTime: 630, endTime: 750,
                    activity: null, description: "", tasks: [],
                    color: COLOR_SWATCHES.d[26], tag: null,
                },
                {
                    title: "Lunch",
                    startTime: 760, endTime: 620,
                    activity: null, description: "", tasks: [],
                    color: COLOR_SWATCHES.d[0], tag: null,
                },
                {
                    title: "Afternoon Lecture",
                    color: COLOR_SWATCHES.d[5],
                    startTime: 800, // 1:20 PM
                    endTime: 950,   // 3:50 PM
                    activity: null,
                    tag: null,
                    description: "Relax, watch TV, play video games, read",
                    tasks: []
                },
                {
                    title: "🌿 Relaxation",
                    color: COLOR_SWATCHES.d[17],
                    startTime: 950, // 3:50 PM
                    endTime: 1000,   // 4:50 PM
                    activity: null,
                    tag: null,
                    description: "Relax, watch TV, play video games, read",
                    tasks: []
                },
                {
                    title: "Afternoon Lecture",
                    color: COLOR_SWATCHES.d[5],
                    startTime: 1000,  // 4:50 PM
                    endTime: 1150,    // 7:20 PM
                    activity: null,
                    tag: null,
                    description: "Skincare. Music. Light Reading. Shower. Sleep. White Noise. Plan for the next day.",
                    tasks: []
                },
                {
                    title: "Dinner",
                    color: COLOR_SWATCHES.d[11],
                    startTime: 1200,   // 8:00 PM
                    endTime: 1245,     // 8:45 PM
                    activity: null,
                    tag: null,
                    description: "Cook or order or go out with a friend/friends.",
                    tasks: []
                },
                {
                    title: "👨‍💻 Late Night Grind",
                    startTime: 1260, endTime: 1380,
                    activity: null, description: "", tasks: [],
                    color: COLOR_SWATCHES.d[26], tag: null,
                },
                {
                    title: "🌙 Evening Routine",
                    color: COLOR_SWATCHES.d[19],
                    startTime: 1380,   // 11:05 PM
                    endTime: 1410,     // 11:30 PM
                    activity: null,
                    tag: null,
                    description: "Skincare. Music. Light Reading. Shower. Sleep. White Noise. Plan for the next day.",
                    tasks: []
                },
            ],
    ]
}

// daily routines
export const DAILY_ROUTINES: (DailyRoutine | RoutineBlock[])[] = [
    { 
        id: "0",
        name: "Workday 1.0",
        description: "Regular work day",
        blocks: [
            {
                title: "First",
                color: COLOR_SWATCHES.d[0],
                startTime: 0,   // 12:00 AM
                endTime: 10,    // 12:10 AM
                activity: null,
                tag: null,
                tasks: [],
                description: ""
            },
            {
                title: "Second",
                color: COLOR_SWATCHES.d[0],
                startTime: 10,  // 12:10 AM
                endTime: 15,    // 12:15 AM
                activity: null,
                tag: null,
                tasks: [],
                description: ""
            },
            {
                title: "Fruit 🍑",
                color: COLOR_SWATCHES.d[1],
                startTime: 370,  // 6:10 AM
                endTime: 420,    // 7:00 AM
                activity: null,
                tag: null,
                tasks: [],
                description: ""
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 525,  // 8:45 AM
                endTime: 720,    // 12:00 PM
                activity: "working",
                tag: TEST_TAGS[1],
                tasks: [],
                description: ""
            },
            {
                title: "🍖 Lunch",
                color: COLOR_SWATCHES.d[2],
                startTime: 730,  // 12:10 PM
                endTime: 800,    // 1:20 PM
                activity: null,
                tag: null,
                tasks: [],
                description: ""
            },
            {
                title: "👨‍💻 SWE Deep Work",
                color: COLOR_SWATCHES.d[1],
                startTime: 885,  // 2:45 PM
                endTime: 1080,   // 6:00  PM
                activity: "working",
                tag: TEST_TAGS[1],
                tasks: [],
                description: ""
            },
            {
                title: "💪 Gym (Pull)",
                color: COLOR_SWATCHES.d[3],
                startTime: 1080,  // 6:00 PM
                endTime: 1140,    // 7:00 PM
                activity: "body",
                tag: TEST_TAGS[0],
                tasks: [],
                description: ""
            },
            {
                title: "🍖 Dinner",
                color: COLOR_SWATCHES.d[4],
                startTime: 1140,  // 7:00 PM
                endTime: 1170,    // 7:30 PM
                activity: null,
                tag: TEST_TAGS[3],
                tasks: [],
                description: ""
            },
            {
                title: "🌙 Evening Routine",
                color: COLOR_SWATCHES.d[19],
                startTime: 1380,   // 11:00 PM
                endTime: 1415,     // 11:45 PM
                activity: "selfCare",
                tag: null,
                tasks: [],
                description: ""
            },
            {
                title: "Last",
                color: COLOR_SWATCHES.d[1],
                startTime: 1425,   // 11:45 PM
                endTime: 1439,     // 11:59 PM
                activity: "selfCare",
                tag: null,
                tasks: [],
                description: ""
            },
        ]
    },
    /* HS Student */
    { 
        id: "1",
        name: "Schoolday 1.0",
        description: "Regular schoolday routine",
        blocks: PRESET_ROUTINES.hs[0]
    },
    [
        {
            title: "🍒 STEM Club Meeting",
            color: COLOR_SWATCHES.d[15],
            startTime: 915,  // 3:15 PM
            endTime: 990,   // 4:30 PM
            activity: null,
            tag: null,
            description: "Tennis grind shit.",
            tasks: []
        },
        {
            title: "💵 Work",
            color: COLOR_SWATCHES.d[21],
            startTime: 1000,  // 4:40 PM
            endTime: 1155,    // 7:15 PM
            activity: null,
            tag: null,
            description: "Get the fucking bread bitch.",
            tasks: []
        },
        ...PRESET_ROUTINES.hs[0].filter((block, idx) => ![2, 3, 4].includes(idx))
    ],
    [
        {
            title: "🍕 Italian Culture Club",
            color: COLOR_SWATCHES.d[9],
            startTime: 915,  // 3:15 PM
            endTime: 975,    // 4:15 PM
            activity: null,
            tag: null,
            description: "Tennis grind shit.",
            tasks: []
        },
        {
            title: "💵 Work",
            color: COLOR_SWATCHES.d[21],
            startTime: 1000,  // 4:40 PM
            endTime: 1155,    // 7:15 PM
            activity: null,
            tag: null,
            description: "Get the fucking bread bitch.",
            tasks: []
        },
        ...PRESET_ROUTINES.hs[0].filter((block, idx) => ![2, 3, 4].includes(idx))
    ],
    [
        {
            title: "💵 Work",
            color: COLOR_SWATCHES.d[21],
            startTime: 1000,  // 4:40 PM
            endTime: 1155,    // 7:15 PM
            activity: null,
            tag: null,
            description: "Get the fucking bread bitch.",
            tasks: []
        },
        {
            title: "🌿 Chill",
            color: COLOR_SWATCHES.d[13],
            startTime: 1215,   // 8:15 PM
            endTime: 1360,     // 10:40 PM
            activity: null,
            tag: null,
            description: "Relax, watch TV, play video games, read",
            tasks: []
        },
        ...PRESET_ROUTINES.hs[0].filter((block, idx) => ![3, 4, 6, 7].includes(idx))
    ],
    PRESET_ROUTINES.hs[1],
    [
        {
            title: "🌤️ Morning Routine",
            color: COLOR_SWATCHES.d[2],
            startTime: 480, // 8:00 AM
            endTime: 540,    // 9:00 AM
            activity: null,
            tag: null,
            description: "Wake up, stretches, brush teeth, shower, get dressed.",
            tasks: []
        },
        {
            title: "💪 Gym",
            color: COLOR_SWATCHES.d[12],
            startTime: 810,  // 1:30 PM
            endTime: 900,    // 3:00 PM
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "📌 College Prep",
            color: COLOR_SWATCHES.d[1],
            startTime: 910,  // 3:10 PM
            endTime: 1080,   // 6:00 PM
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        ...PRESET_ROUTINES.hs[1].filter((block, idx) => ![1, 3].includes(idx))
    ],
    /* College Student */
    PRESET_ROUTINES.uni[0],
    [
        {
            ...PRESET_ROUTINES.uni[0][2],
            title: "💪 Gym (Pull)",
        },
        ...PRESET_ROUTINES.uni[0].filter((block, idx) => idx != 2)
    ],
    [
        {
            ...PRESET_ROUTINES.uni[0][2],
            title: "💪 Gym (Legs)",
        },
        ...PRESET_ROUTINES.uni[0].filter((block, idx) => idx != 2)
    ],
    PRESET_ROUTINES.uni[2],
    PRESET_ROUTINES.uni[1],
    [
        {
            ...PRESET_ROUTINES.uni[0][5],
            startTime: 540, endTime: 620,
        },
        {
            ...PRESET_ROUTINES.uni[0][6],
            startTime: 620, endTime: 650,
        },
        {
            ...PRESET_ROUTINES.uni[0][5],
            startTime: 650, endTime: 750,
        },
        {
            title: "💵 Side Hustle",
            color: COLOR_SWATCHES.d[15],
            startTime: 800, endTime: 900,
            activity: null,
            tag: null,
            tasks: [],
            description: ""
        },
        {
            ...PRESET_ROUTINES.uni[1][8],
            startTime: 1260, endTime: 1380,
        },
        ...PRESET_ROUTINES.uni[1].filter((block, idx) => ![2, 3, 5, 7, 8].includes(idx))
    ]
    /* Full Time */

    /* All Around */
]

// weekly routines
export const WEEKLY_FULL_COLORS: WeeklyRoutineBlocks = {
    Monday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[0],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[1],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[3],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[4],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[5],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Monday: DAILY_ROUTINES[0],
    // Tuesday: DAILY_ROUTINES[1],
    Tuesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[7],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[8],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[10],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[11],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[12],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Wednesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[14],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[15],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[16],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[17],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[18],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[19],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[20],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Thursday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[21],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[22],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[23],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[24],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[25],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[26],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[27],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Friday: DAILY_ROUTINES[1],
    Friday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[1],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[3],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[4],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[1],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Saturday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[0],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[1],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[3],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[4],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[5],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Sunday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[7],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[8],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[10],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[11],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[12],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ]
}
export const WEEKLY_HS_STUDENT: WeeklyRoutineBlocks = {
    Monday: DAILY_ROUTINES[1],
    Tuesday: DAILY_ROUTINES[2],
    Wednesday: DAILY_ROUTINES[1],
    Thursday: DAILY_ROUTINES[3],
    Friday: DAILY_ROUTINES[4],
    Saturday: DAILY_ROUTINES[5],
    Sunday: DAILY_ROUTINES[6]
}
export const WEEKLY_UNI_STUDENT: WeeklyRoutineBlocks = {
    Monday: DAILY_ROUTINES[7],
    Tuesday: DAILY_ROUTINES[8],
    Wednesday: DAILY_ROUTINES[9],
    Thursday: DAILY_ROUTINES[10],
    Friday: DAILY_ROUTINES[10],
    Saturday: DAILY_ROUTINES[11],
    Sunday: DAILY_ROUTINES[12]
}
export const WEEKLY_FULL_TIME: WeeklyRoutineBlocks = {
    Monday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[0],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[1],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[3],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[4],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[5],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Monday: DAILY_ROUTINES[0],
    // Tuesday: DAILY_ROUTINES[1],
    Tuesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[7],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[8],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[10],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[11],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[12],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Wednesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[14],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[15],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[16],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[17],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[18],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[19],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[20],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Thursday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[21],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[22],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[23],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[24],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[25],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[26],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[27],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Friday: DAILY_ROUTINES[1],
    Friday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[1],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[3],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[4],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[1],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Saturday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[0],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[1],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[3],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[4],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[5],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Sunday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[7],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[8],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[10],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[11],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[12],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ]
}
export const WEEKLY_ALL_AROUND: WeeklyRoutineBlocks = {
    Monday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[0],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[1],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[3],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[4],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[5],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Monday: DAILY_ROUTINES[0],
    // Tuesday: DAILY_ROUTINES[1],
    Tuesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[7],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[8],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[10],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[11],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[12],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Wednesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[14],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[15],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[16],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[17],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[18],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[19],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[20],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Thursday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[21],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[22],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[23],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[24],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[25],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[26],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[27],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Friday: DAILY_ROUTINES[1],
    Friday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[1],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[3],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[4],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[1],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Saturday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[0],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[1],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[3],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[4],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[5],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Sunday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[7],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[8],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[10],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[11],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[12],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ]
}

export const WEEKLY_ROUTINES_BLOCKS: WeeklyRoutineBlocks = {
    // Monday: [
    //     {
    //         title: "Red",
    //         color: COLOR_SWATCHES.d[0],
    //         startTime: 360,
    //         endTime: 420,
    //         activity: null,
    //         tag: null,
    //         description: "",
    //         tasks: []
    //     },
    //     {
    //         title: "Orange",
    //         color: COLOR_SWATCHES.d[1],
    //         startTime: 525,
    //         endTime: 720,
    //         activity: "working",
    //         tag: TEST_TAGS[1],
    //         description: "",
    //         tasks: []
    //     },
    //     {
    //         title: "Yellow",
    //         color: COLOR_SWATCHES.d[2],
    //         startTime: 730,
    //         endTime: 800,
    //         activity: null,
    //         tag: null,
    //         description: "",
    //         tasks: []
    //     },
    //     {
    //         title: "Green",
    //         color: COLOR_SWATCHES.d[3],
    //         startTime: 885,
    //         endTime: 1080,
    //         activity: "working",
    //         tag: TEST_TAGS[1],
    //         description: "",
    //         tasks: []
    //     },
    //     {
    //         title: "Teal",
    //         color: COLOR_SWATCHES.d[4],
    //         startTime: 1080,
    //         endTime: 1140,
    //         activity: "body",
    //         tag: TEST_TAGS[0],
    //         description: "",
    //         tasks: []
    //     },
    //     {
    //         title: "Blue",
    //         color: COLOR_SWATCHES.d[5],
    //         startTime: 1140,
    //         endTime: 1200,
    //         activity: null,
    //         tag: TEST_TAGS[3],
    //         description: "",
    //         tasks: []
    //     },
    //     {
    //         title: "Purple",
    //         color: COLOR_SWATCHES.d[6],
    //         startTime: 1310,
    //         endTime: 1395,
    //         activity: "selfCare",
    //         tag: null,
    //         description: "",
    //         tasks: []
    //     },
    // ],
    Monday: DAILY_ROUTINES[1],
    // Tuesday: DAILY_ROUTINES[1],
    Tuesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[7],
            startTime: 360,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[8],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[10],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[11],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[12],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Wednesday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[14],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[15],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[16],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[17],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[18],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[19],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[20],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Thursday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[21],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Orange",
            color: COLOR_SWATCHES.d[22],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[23],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[24],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[25],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[26],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[27],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    // Friday: DAILY_ROUTINES[1],
    Friday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.d[1],
            startTime: 370,
            endTime: 420,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 525,
            endTime: 720,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.d[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "Green",
            color: COLOR_SWATCHES.d[5],
            startTime: 885,
            endTime: 1080,
            activity: "working",
            tag: TEST_TAGS[1],
            description: "",
            tasks: []
        },
        {
            title: "Teal",
            color: COLOR_SWATCHES.d[3],
            startTime: 1080,
            endTime: 1140,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.d[4],
            startTime: 1140,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.d[1],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Saturday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[0],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[1],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[2],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[3],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[4],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[5],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[6],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ],
    Sunday: [
        {
            title: "Red",
            color: COLOR_SWATCHES.p[7],
            startTime: 480,
            endTime: 520,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🏃‍♂️ Running",
            color: COLOR_SWATCHES.p[8],
            startTime: 600,
            endTime: 690,
            activity: "working",
            tag: TEST_TAGS[6],
            description: "",
            tasks: []
        },
        {
            title: "Yellow",
            color: COLOR_SWATCHES.p[9],
            startTime: 730,
            endTime: 800,
            activity: null,
            tag: null,
            description: "",
            tasks: []
        },
        {
            title: "🌁 Art",
            color: COLOR_SWATCHES.p[10],
            startTime: 885,
            endTime: 920,
            activity: "selfCare",
            tag: TEST_TAGS[8],
            description: "",
            tasks: []
        },
        {
            title: "💪 Gym (Push)",
            color: COLOR_SWATCHES.p[11],
            startTime: 1000,
            endTime: 1100,
            activity: "body",
            tag: TEST_TAGS[0],
            description: "",
            tasks: []
        },
        {
            title: "Blue",
            color: COLOR_SWATCHES.p[12],
            startTime: 1130,
            endTime: 1200,
            activity: null,
            tag: TEST_TAGS[3],
            description: "",
            tasks: []
        },
        {
            title: "Purple",
            color: COLOR_SWATCHES.p[13],
            startTime: 1310,
            endTime: 1395,
            activity: "selfCare",
            tag: null,
            description: "",
            tasks: []
        },
    ]
}
export const WEEKLY_ROUTINES: WeeklyRoutine[] = [
    {
        id: "0",
        name: "High School Student",
        description: "Rounte for a high school student.",
        blocks: WEEKLY_HS_STUDENT
    },
    {
        id: "1",
        name: "College Student",
        description: "Normal routine 2",
        blocks: WEEKLY_UNI_STUDENT
    },
    {
        id: "2",
        name: "Full Time",
        description: "Grind shit",
        blocks: {
            ...WEEKLY_ROUTINES_BLOCKS,
            Saturday: WEEKLY_ROUTINES_BLOCKS.Monday,
            Sunday: WEEKLY_ROUTINES_BLOCKS.Monday
        }
    },
    {
        id: "3",
        name: "All Around",
        description: "Relax & Unwind",
        blocks: {
            ...WEEKLY_ROUTINES_BLOCKS,
            Monday: WEEKLY_ROUTINES_BLOCKS.Saturday,
            Tuesday: WEEKLY_ROUTINES_BLOCKS.Saturday,
            Wednesday: WEEKLY_ROUTINES_BLOCKS.Saturday,
            Thursday: WEEKLY_ROUTINES_BLOCKS.Saturday,
            Friday: WEEKLY_ROUTINES_BLOCKS.Saturday,
        }
    },
]