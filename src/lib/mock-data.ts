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
        color: COLOR_SWATCHES.d[8],
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
        color: COLOR_SWATCHES.d[12],
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

export const TEST_TASKS: Task[] = [
  {
      id: "f82be9cd-8f42-477e-b833-e74feed75a78",
      idx: 0,
      title: "Morning Routine",
      description: "Start the day with a set of activities.",
      isChecked: false,
      parentId: null
  },
  {
      id: "9e2d813a-b7c2-48a5-9e47-87654aebbe7a",
      idx: 0,
      title: "Wake Up",
      description: "Get out of bed and stretch.",
      isChecked: false,
      parentId: "f82be9cd-8f42-477e-b833-e74feed75a78"  // Nested under "Morning Routine"
  },
  {
      id: "2d92e4a5-01ab-4d12-9a3f-4f6f2f0c6f7f",
      idx: 1,
      title: "Make Breakfast",
      description: "Prepare a healthy breakfast.",
      isChecked: false,
      parentId: "f82be9cd-8f42-477e-b833-e74feed75a78"  // Nested under "Morning Routine"
  },
  {
      id: "bf3e3c33-7d8e-4293-937e-67b78d4516b1",
      idx: 1,
      title: "Check Emails",
      description: "Review important emails and respond.",
      isChecked: false,
      parentId: null
  },
  {
      id: "bb746a50-b674-4285-8504-4fada3283243",
      idx: 2,
      title: "Work Tasks",
      description: "",
      isChecked: false,
      parentId: null
  },
  {
      id: "6b5686c0-1676-4e5d-9b33-eeb29de83b3a",
      idx: 0,
      title: "Write Report",
      description: "Write the end-of-day project report.",
      isChecked: false,
      parentId: "bb746a50-b674-4285-8504-4fada3283243"  // Nested under "Work Tasks"
  },
  {
      id: "ca9f636b-2457-47a5-b48a-13c9ed7e4686",
      idx: 0,
      title: "Gather Data",
      description: "Collect and analyze data for the report.",
      isChecked: false,
      parentId: "6b5686c0-1676-4e5d-9b33-eeb29de83b3a"  // Nested under "Write Report"
  },
  {
      id: "397f5f0a-d234-4c61-a17a-d8d9238c2299",
      idx: 3,
      title: "Plan Weekend Trip",
      description: "Research and book a trip for the weekend.",
      isChecked: false,
      parentId: null
  },
  {
      id: "781a5fe3-b855-4ec9-8bc6-49249c82adf7",
      idx: 0,
      title: "Choose Destination",
      description: "Decide on the location for the trip.",
      isChecked: false,
      parentId: "397f5f0a-d234-4c61-a17a-d8d9238c2299"  // Nested under "Plan Weekend Trip"
  },
  {
      id: "c3488a1e-2581-467e-b285-17797a5e0000",
      idx: 0,
      title: "Book Flights",
      description: "Find and book flights to the chosen destination.",
      isChecked: false,
      parentId: "781a5fe3-b855-4ec9-8bc6-49249c82adf7"  // Nested under "Choose Destination"
  },
  {
      id: "1b0a5d31-5059-43f7-b94a-8b7f3b0b6e1f",
      idx: 0,
      title: "Buy Luggage",
      description: "Purchase new luggage for the trip.",
      isChecked: false,
      parentId: "c3488a1e-2581-467e-b285-17797a5e0000"  // Nested under "Book Flights"
  },
  {
      id: "aff3d66d-4d45-4a3d-a02a-df125d4314a9",
      idx: 4,
      title: "Exercise Routine",
      description: "Workout to stay fit and active.",
      isChecked: false,
      parentId: null
  },
  {
      id: "4a6c7296-d313-4879-b5be-55b3e7b404b1",
      idx: 0,
      title: "Warm Up",
      description: "Do a quick warm-up before the workout.",
      isChecked: false,
      parentId: "aff3d66d-4d45-4a3d-a02a-df125d4314a9"  // Nested under "Exercise Routine"
  },
  {
      id: "1f37b056-7329-45a1-9a6a-6b62b7880d58",
      idx: 1,
      title: "Cardio",
      description: "30 minutes of running.",
      isChecked: false,
      parentId: "4a6c7296-d313-4879-b5be-55b3e7b404b1"  // Nested under "Warm Up"
  },
  {
      id: "46e51f5f-1bdb-438f-a378-5d2f20b5126b",
      idx: 2,
      title: "Strength Training",
      description: "Lift weights for muscle building.",
      isChecked: false,
      parentId: "4a6c7296-d313-4879-b5be-55b3e7b404b1"  // Nested under "Warm Up"
  },
  {
      id: "5be6a831-6e0f-4f35-b48b-dc56782057fe",
      idx: 1,
      title: "Cool Down",
      description: "Stretch and cool down after the workout.",
      isChecked: false,
      parentId: "aff3d66d-4d45-4a3d-a02a-df125d4314a9"  // Nested under "Exercise Routine"
  },
  {
      id: "98e64631-1e0f-4f35-b43b-dc56782057fe",
      idx: 0,
      title: "Finish East of Eden",
      description: "Finish the damn book already",
      isChecked: false,
      parentId: "5be6a831-6e0f-4f35-b48b-dc56782057fe"  // Cool Down
  },
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
export const TEST_HABITS = [
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

export const YEAR_THOUGHT_ENTRY = {
  icon: {
        type: "img",
        src: "https://i.pinimg.com/originals/41/bc/b5/41bcb5fba60bb3e1112550c0a7841c70.gif"
  },
  date: new Date(2025, 0),
  styling: "default",
  text: `<strong>Chill</strong>  <code>noun</code>
Chill is the <u>calm in a storm</u> 🌊, the pause that lets us <i>breathe deeply</i>. 
It's the <u>crisp air</u> of a morning walk, the <i>stillness of twilight</i> settling over the world 🌌. 
To chill is to <u>embrace the quiet moments</u>, to let the rush fall away, and to find yourself in <i>peace</i> 🕊️. 
It's the art of <i>being present</i>, savoring simplicity, and knowing that stillness has its own magic ✨.
`
}

export const MONTH_THOUGHT_ENTRY = {
  icon: {
        type: "img",
        src: "https://i.pinimg.com/736x/72/44/08/724408c450ce38a7be258ed489d8c64d.jpg"
  },
  date: new Date(2025, 5),
  styling: "default",
  text: `<strong>Wonder</strong>  <code>noun</code>
Wonder is the spark of curiosity ✨, the moment that makes us <i>pause in awe</i>. 
It's the glow of <i>starlight</i> in a vast night sky, the <u>whisper of possibility</u> in the unknown 🌌. 
To wonder is to embrace the questions, to see magic in the mundane, and to feel alive in discovery, 🌟. 
It's the art of <i>dreaming boldly</i>, seeking the extraordinary, and finding beauty in every moment 💫.
`
}

export const ACTIVITY_DATA = [
  {
      date: new Date(2024, 11, 2),
      focusMins: 12 * 60 + 10,
      habits: 0.7,
      goals: [
          {
              type: "big",
              name: "6 mile run",
              tag: TEST_TAGS[6]
          },
      ],
      thoughtEntry: "",
      highlightImg: {
          src: "https://i.pinimg.com/736x/22/b5/cc/22b5cc185b5942ae772ec5e231f60b39.jpg",
          caption: "",
      }
  },
  {

      habits: 1,
      date: new Date(2024, 11, 3),
      focusMins: 5 * 60 + 11,
  },
  {
      date: new Date(2024, 11, 4),
      thoughtEntry: "",
  },
  {
      habits: 1,
      date: new Date(2024, 11, 5),
      focusMins: 134,
      thoughtEntry: "Today, I climbed Mount Tamalpais and stood above the clouds. The hike was tough, but the view from the summit was breathtaking—a sea of white clouds stretched endlessly, with the golden hues of the setting sun breaking through.",
      highlightImg: {
          src: "https://i.pinimg.com/736x/5e/e0/be/5ee0bedc21c8d2d37ff39dacbda0ef1d.jpg",
          caption: "a little painting",
      }
  },
  {
      habits: 0.4,
      date: new Date(2024, 11, 6),
      focusMins: 563
  },
  {
      habits: 1,
      date: new Date(2024, 11, 9),
      focusMins: 662
  },
  {
      date: new Date(2024, 11, 10),
      focusMins: 52
  },
  {
      date: new Date(2024, 11, 10),
      thoughtEntry: "",
  },
  {
      date: new Date(2024, 11, 13),
      thoughtEntry: "",
      focusMins: 1 * 60 + 41
  },
  {
      habits: 0.9,
      date: new Date(2024, 11, 16),
      focusMins: 271,
      thoughtEntry: "",
  },
  {
      date: new Date(2024, 11, 18),
      focusMins: 5 * 60 + 11,
      thoughtEntry: "",
      highlightImg: {
          src: "https://i.pinimg.com/736x/6f/0b/28/6f0b2851d0f7c5141eb58e6cc7271fc6.jpg",
          caption: "drawing of Maya",
      }
  },
  {
      date: new Date(2024, 11, 20),
      habits: 0.2,
      goals: [
          {
              type: "big",
              name: "learn how to make pizza",
              tag: TEST_TAGS[3]
          },
      ]
  },
  {
      date: new Date(2024, 11, 23),
      focusMins: 5 * 60 + 11,
      thoughtEntry: "",
  },
  {
      date: new Date(2024, 11, 24),
      focusMins: 398,
      highlightImg: {
          src: "https://i.pinimg.com/736x/9b/91/cc/9b91cc7b70d04399c09d33d7ed8d063c.jpg",
          caption: "italian paradise",
      }
  },
  {
      habits: 0.4,
      date: new Date(2024, 11, 26),
      focusMins: 281
  },
  {
      date: new Date(2024, 11, 27),
      focusMins: 84,
      highlightImg: {
          src: "https://i.pinimg.com/736x/d5/ff/09/d5ff09b5043f74591b4ffeb96fc94456.jpg",
          caption: "at the museum 🌷",
      }
  },
  {
      habits: 1,
      date: new Date(2024, 11, 28),
      focusMins: 2 * 60 + 34
  },
  {
      date: new Date(2024, 11, 30),
      focusMins: 5 * 60 + 11,
      thoughtEntry: "",
      highlightImg: {
          src: "https://i.pinimg.com/736x/ef/fb/f3/effbf31760c27673d5add67fa439522d.jpg",
          caption: "atop the mountains 🌤️",
      }
  },
  {
      habits: 0.6,
      date: new Date(2024, 11, 31),
      focusMins: 441
  },
  {
      date: new Date(2024, 11, 14),
      focusMins: 192,
      habits: 0.2,
      goals: [
          {
              type: "big",
              name: "50 pushups",
              tag: TEST_TAGS[1]
          },
          {
              type: "big",
              name: "20 pullups",
              tag: TEST_TAGS[7]
          },
      ]
  },
  {
      date: new Date(2024, 11, 15),
      habits: 0.7,
      goals: [
          {
              type: "big",
              name: "js fundamentals",
              tag: TEST_TAGS[1]
          },
      ]
  },
  {
      date: new Date(2024, 11, 25),
      habits: 0.7,
      thoughtEntry: "wefwefew",
      highlightImg: {
          src: "https://i.pinimg.com/736x/5c/37/a0/5c37a01f26fff8bae726e0a6e527bcae.jpg",
          caption: "getting used to pastels"
      },
      goals: [
          {
              type: "big",
              name: "master sketching the head",
              tag: TEST_TAGS[8]
          },
          {
              type: "big",
              name: "french pronouns",
              tag: TEST_TAGS[2]
          },
          {
              type: "big",
              name: "finish designing portfolio",
              tag: TEST_TAGS[1]
          },
      ]
  },
  {
      date: new Date(2024, 11, 29),
      habits: 0.7,
      goals: [
          {
              type: "big",
              name: "master sketching the head",
              tag: TEST_TAGS[8]
          },
      ]
  }
]