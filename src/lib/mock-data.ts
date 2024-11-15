import { GoalStatus } from "./enums"
import { COLOR_SWATCHES } from "./utils-colors"

/* Tags */
export const TEST_TAGS: Tag[] = [
    {
      id: "",
      orderIdx: 0,
      name: "Body",
      symbol: {
        color: COLOR_SWATCHES.d[0],
        emoji: "💪"
      }
    },
    {
      id: "",
      orderIdx: 1,
      name: "SWE",
      symbol: {

        color: COLOR_SWATCHES.d[1],
        emoji: "👨‍💻"
      }
    },
    {
      id: "",
      orderIdx: 2,
      name: "French",
      symbol: {
        color: COLOR_SWATCHES.d[4],
        emoji: "🇫🇷"
      }
    },
    {
      id: "",
      orderIdx: 3,
      name: "Cooking",
      symbol: {
        color: COLOR_SWATCHES.d[2],
        emoji: "🍖"
      }
    },
    {
      id: "",
      orderIdx: 4,
      name: "SWE",
      symbol: {
        color: COLOR_SWATCHES.d[4],
        emoji: "👨‍💻"
      }
    },
    {
      id: "",
      orderIdx: 5,
      name: "BBall",
      symbol: {
        color: COLOR_SWATCHES.d[2],
        emoji: "🏀"
      }
    },
    {
      id: "",
      orderIdx: 6,
      name: "Running",
      symbol: {
        color: COLOR_SWATCHES.d[2],
        emoji: "🏃‍♂️"
      }
    },
    {
      id: "",
      orderIdx: 7,
      name: "Meditation",
      symbol: {
        color: COLOR_SWATCHES.d[3],
        emoji: "🌿"
      }
    },
    {
      id: "",
      orderIdx: 8,
      name: "Art",
      symbol: {
        color: COLOR_SWATCHES.d[0],
        emoji: "🌁"
      }
    },
]

/* Sessions */
export const TEST_SESSIONS: Session[] = [
  {
      id: "session-001",
      name: "Morning Study Session",
      mode: "pom",
      focusTime: 1500, // 25 minutes
      breakTime: 300,  // 5 minutes
      startTime: new Date(2024, 8, 5, 9, 0), // September 5, 2024, 9:00 AM
      todos: [],
      allowChime: true,
      allowSfx: true,
      result: {
          endTime: new Date(2024, 8, 5, 10, 30), // September 5, 2024, 10:30 AM
          focusCount: 3,
          breakCount: 2,
          pauseCount: 1,
          elapsedSecs: 5400,    // 1.5h in seconds
          totalFocusTime: 4500, // 1.25h in seconds
          totalBreakTime: 900,  // 15 minutes in seconds
          periods: 3
      }
  }
]

/* Goals */
export const TEST_GOALS: Goal[] = [
  {
    name: "Finish French Level 2",
    due: new Date("2024-11-10"),
    dueType: "month",
    description: "Finish all lessons and exercises in the Level 2 French course.",
    tag: TEST_TAGS[0],
    creationDate: new Date("2024-01-15"),
    status: "in-progress",
    bOrder: {
     status: 0,
     tag: 0
    },
    milestones: [
      {
        name: "Complete Module 1",
        done: true,
        idx: 0
      },
      {
        name: "Memorize all vocab",
        done: false,
        idx: 1
      },
      {
        name: "Master listening exercises",
        done: false,
        idx: 2
      },
      {
        name: "Listen and master one episode of Dix Pour Cent",
        done: false,
        idx: 4
      },
    ]
  },
  {
    name: "Run a Half Marathon",
    due: new Date("2024-11-10"),
    dueType: "day",
    description: "Train and complete a half marathon race.",
    tag: TEST_TAGS[1],
    creationDate: new Date("2024-02-10"),
    status: "in-progress",
    imgSrc: "https://i.pinimg.com/564x/85/3a/9d/853a9dff815bfa3c458d2f60c2dd929f.jpg",
    bOrder: {
     status: 1,
     tag: 0
    },
    milestones: [
      {
        name: "Run 5K without stoppping",
        done: true,
        idx: 0
      },
      {
        name: "Complete a 10k practice run",
        done: true,
        idx: 1
      },
      {
        name: "Do 10 hill runs",
        done: true,
        idx: 2
      },
      {
        name: "Reach 15l distance",
        done: false,
        idx: 3
      },
      {
        name: "Run 18k in under 2  hoursw",
        done: false,
        idx: 4
      },
      {
        name: "Final practice: 20k",
        done: false,
        idx: 5
      },
    ]
  },
  {
    name: "Read 12 Books This Year",
    due: new Date("2024-12-31"),
    dueType: "year",
    description: "Read one book every month and complete all 12 by the end of the year.",
    tag: TEST_TAGS[2],
    creationDate: new Date("2024-01-01"),
    status: "not-started",
    imgSrc: "https://i.pinimg.com/enabled/564x/34/84/0a/34840a5cb9734c02dc1aa919c99afe31.jpg",
    bOrder: {
     status: 0,
     tag: 0
    },
    milestones: [
      {
        name: "The Hobbit",
        done: false,
        idx: 0
      },
      {
        name: "Eleanor Oliphant Is Completely Fine",
        done: false,
        idx: 1
      },
      {
        name: "Where the Crawdads Sing",
        done: false,
        idx: 2
      },
      {
        name: "Pride and Prejudice",
        done: false,
        idx: 3
      },
      {
        name: "The Night Circus",
        done: false,
        idx: 4
      },
      {
        name: "A Man Called Ove",
        done: false,
        idx: 5
      },
      {
        name: "Little Fires Everywhere",
        done: false,
        idx: 6
      },
      {
        name: "The Great Gatsby",
        done: false,
        idx: 7
      },
      {
        name: "Normal People",
        done: false,
        idx: 8
      },
      {
        name: "Big Little Lies",
        done: false,
        idx: 9
      },
      {
        name: "The Fellowship of the Ring",
        done: false,
        idx: 10
      },
      {
        name: "The Rosie Project",
        done: false,
        idx: 11
      }
    ]
  },
  {
    name: "Launch Personal Blog",
    due: new Date("2024-11-10"),
    dueType: "quarter",
    description: "Create and launch a personal blog by the end of Q3 with 5 initial articles.",
    tag: TEST_TAGS[3],
    creationDate: new Date("2024-03-01"),
    status: "accomplished",
    bOrder: {
     status: 0,
     tag: 0
    }
  },
  {
    name: "Get that dream house",
    description: "",
    creationDate: new Date("2024-01-01"),
    status: "not-started",
    tag: TEST_TAGS[8],
    bOrder: {
     status: 1,
     tag: 0
    }
  },
]



/* Week Habits */
export const TEST_WK_HABITS = [
  {
    name: "Wake Up",
    symbol: "☀️",
    target: "8:30 AM",
    streak: 3,
    freqType: "daily",
    frequency: 1, 
    lastCheck: new Date("2024-10-12"),
    last7Days: 0b0101101, 
    timeOfDay: "morning",
    order: {
      default: 0,
      tod: 0
    }
  },
  {
    name: "Exercise",
    symbol: "💪",
    target: "45m",
    streak: 3,
    freqType: "day-of-week",
    frequency: 0b0111100, 
    lastCheck: new Date("2024-10-21"),
    last7Days: 0b0100100, 
    timeOfDay: "afternoon",
    order: {
      default: 1,
      tod: 0
    }
  },
  {
    name: "Reading",
    symbol: "📖",
    target: "30 pages",
    streak: 5,
    freqType: "day-of-week",
    frequency: 0b0111111, 
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b0010100, 
    timeOfDay: "evening",
    order: {
      default: 2,
      tod: 0
    }
  },
  {
    name: "Meditation",
    symbol: "🧘🏼‍♂️",
    target: "15m",
    streak: 2,
    freqType: "daily",
    frequency: 1, 
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b1000101, 
    timeOfDay: "morning",
    order: {
      default: 3,
      tod: 1
    }
  },
  {
    name: "Study French",
    symbol: "🇫🇷",
    target: "1h",
    streak: 4,
    freqType: "day-of-week",
    frequency: 0b0010100, 
    lastCheck: new Date("2024-10-11"),
    last7Days: 0b1010000, 
    timeOfDay: "evening",
    order: {
      default: 4,
      tod: 1
    }
  },
  {
    name: "Run",
    symbol: "🏃‍♂️",
    target: "5 km",
    streak: 6,
    freqType: "day-of-week",
    frequency: 0b0101010, 
    lastCheck: new Date("2024-10-13"),
    last7Days: 0b1011010, 
    timeOfDay: "morning",
    order: {
      default: 5,
      tod: 2
    }
  },
  {
    name: "Deep Work",
    symbol: "👨‍💻",
    target: "2h",
    streak: 7,
    freqType: "day-of-week",
    frequency: 0b0111100,
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b0000010,
    timeOfDay: "morning",
    order: {
      default: 6,
      tod: 3
    }
  },
  {
    name: "Water",
    symbol: "🌊",
    target: "8 glasses",
    streak: 7,
    freqType: "daily",
    frequency: 1, 
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b0001010, 
    timeOfDay: "all-day",
    order: {
      default: 7,
      tod: 0
    }
  },
  {
    name: "Clean House",
    symbol: "🧹",
    streak: 7,
    freqType: "per-week",
    frequency: 3, 
    lastCheck: new Date("2024-10-21"),
    last7Days: 0b0100101, 
    timeOfDay: "afternoon",
    order: {
      default: 8,
      tod: 1
    }
  },
]