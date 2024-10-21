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
          elapsedSecs: 5400,    // 1.5 hours in seconds
          totalFocusTime: 4500, // 1.25 hours in seconds
          totalBreakTime: 900,  // 15 minutes in seconds
          periods: 3
      }
  }
]

/* Goals */
export const TEST_GOALS: Goal[] = [
  {
    name: "Complete French Level 2",
    due: new Date("2024-11-10"),
    dueType: "month",
    description: "Finish all lessons and exercises in the Level 2 French course.",
    tag: TEST_TAGS[0],
    creationDate: new Date("2024-01-15"),
    status: "in-progress"
  },
  {
    name: "Run a Half Marathon",
    due: new Date("2024-11-10"),
    dueType: "day",
    description: "Train and complete a half marathon race.",
    tag: TEST_TAGS[1],
    creationDate: new Date("2024-02-10"),
    status: "in-progress"
  },
  {
    name: "Read 12 Books This Year",
    due: new Date("2024-12-31"),
    dueType: "year",
    description: "Read one book every month and complete all 12 by the end of the year.",
    tag: TEST_TAGS[2],
    creationDate: new Date("2024-01-01"),
    status: "on-hold"
  },
  {
    name: "Launch Personal Blog",
    due: new Date("2024-11-10"),
    dueType: "quarter",
    description: "Create and launch a personal blog by the end of Q3 with 5 initial articles.",
    tag: TEST_TAGS[3],
    creationDate: new Date("2024-03-01"),
    status: "done"
  },
  {
    name: "Get that dream house",
    dueType: "someday",
    description: "Design and build my own dream home.",
    tag: TEST_TAGS[4],
    creationDate: new Date("2024-01-01"),
    status: "on-hold"
  },
  {
    name: "Get that dream house",
    description: "",
    creationDate: new Date("2024-01-01"),
    status: "on-hold"
  },
]

/* Week Habits */
export const TEST_WK_HABITS = [
  {
    name: "Wake Up",
    symbol: "☀️",
    target: "8:30 AM",
    streak: 3,
    frequency: 3, 
    lastCheck: new Date("2024-10-12"),
    last7Days: 0b0101101, 
    timeOfDay: "morning"
  },
  {
    name: "Exercise",
    symbol: "💪",
    target: "45m",
    streak: 3,
    frequency: "MTWT", 
    lastCheck: new Date("2024-10-13"),
    last7Days: 0b0101101, 
    timeOfDay: "afternoon"
  },
  {
    name: "Reading",
    symbol: "📖",
    target: "30 pages",
    streak: 5,
    frequency: "MTWFS", 
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b1110100, 
    timeOfDay: "evening"
  },
  {
    name: "Meditation",
    symbol: "🧘🏼‍♂️",
    target: "15m",
    streak: 2,
    frequency: 1, 
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b1010101, 
    timeOfDay: "morning"
  },
  {
    name: "Study French",
    symbol: "🇫🇷",
    target: "1 hour",
    streak: 4,
    frequency: "MWS", 
    lastCheck: new Date("2024-10-11"),
    last7Days: 0b1010001, 
    timeOfDay: "evening"
  },
  {
    name: "Run",
    symbol: "🏃‍♂️",
    target: "5 km",
    streak: 6,
    frequency: "MWF", 
    lastCheck: new Date("2024-10-13"),
    last7Days: 0b1011010, 
    timeOfDay: "morning"
  },
  {
    name: "Deep Work",
    symbol: "👨‍💻",
    target: "2 hours",
    streak: 7,
    frequency: "MTWTFS",
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b1111110,
    timeOfDay: "morning"
  },
  {
    name: "Water",
    symbol: "🌊",
    target: "8 glasses",
    streak: 7,
    frequency: 1, 
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b1111111, 
    timeOfDay: "all-day"
  },
  {
    name: "Clean House",
    symbol: "🧹",
    streak: 7,
    frequency: 1, 
    lastCheck: new Date("2024-10-14"),
    last7Days: 0b1111111, 
    timeOfDay: "afternoon"
  },
]