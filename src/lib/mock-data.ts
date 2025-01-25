import { GoalStatus } from "./enums"
import { COLOR_SWATCHES } from "./utils-colors"
import { generateHabitData } from "./utils-habits"
import { v4 as uuidv4 } from 'uuid'


/* tags */
export const TEST_TAGS: Tag[] = [
    {
      id: "",
      orderIdx: 0,
      name: "Body",
      symbol: {
        color: COLOR_SWATCHES[0],
        emoji: "💪"
      }
    },
    {
      id: "",
      orderIdx: 1,
      name: "SWE",
      symbol: {

        color: COLOR_SWATCHES[8],
        emoji: "👨‍💻"
      }
    },
    {
      id: "",
      orderIdx: 2,
      name: "French",
      symbol: {
        color: COLOR_SWATCHES[7],
        emoji: "🇫🇷"
      }
    },
    {
      id: "",
      orderIdx: 3,
      name: "Cooking",
      symbol: {
        color: COLOR_SWATCHES[1],
        emoji: "🍖"
      }
    },
    {
      id: "",
      orderIdx: 4,
      name: "SWE",
      symbol: {
        color: COLOR_SWATCHES[8],
        emoji: "👨‍💻"
      }
    },
    {
      id: "",
      orderIdx: 5,
      name: "BBall",
      symbol: {
        color: COLOR_SWATCHES[2],
        emoji: "🏀"
      }
    },
    {
      id: "",
      orderIdx: 6,
      name: "Running",
      symbol: {
        color: COLOR_SWATCHES[2],
        emoji: "🏃‍♂️"
      }
    },
    {
      id: "",
      orderIdx: 7,
      name: "Meditation",
      symbol: {
        color: COLOR_SWATCHES[5],
        emoji: "🌿"
      }
    },
    {
      id: "",
      orderIdx: 8,
      name: "Art",
      symbol: {
        color: COLOR_SWATCHES[1],
        emoji: "🌁"
      }
    },
    {
      id: "",
      orderIdx: 9,
      name: "Travel",
      symbol: {
        color: COLOR_SWATCHES[4],
        emoji: "🏔️"
      }
    },
    {
      id: "",
      orderIdx: 10,
      name: "Reading",
      symbol: {
        color: COLOR_SWATCHES[7],
        emoji: "📖"
      }
    }
]

/* sessions */
export const TEST_SESSIONS: Session[] = [
  {
      id: "session-001",
      name: "Morning Study Session",
      mode: "pom",
      focusTime: 1500, // 25 minutes
      breakTime: 300,  // 5 minutes
      startTime: new Date(2025, 8, 5, 9, 0), // September 5, 2024, 9:00 AM
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

/* goals */
export const TEST_GOALS: Goal[] = [
  {
    id: uuidv4(),
    name: "Reach conversational fluency in French",
    due: new Date("2025-1-31"),
    dueType: "month",
    description: "Reach conversational fluency in French by the end of the year.",
    tag: TEST_TAGS[0],
    creationDate: new Date("2025-01-15"),
    status: "in-progress",
    bOrder: {
     default: 0,
     status: 0,
     tag: 0
    },
    milestones: [
      {
        id: uuidv4(),
        name: "Complete Module 1",
        done: true,
        idx: 0
      },
      {
        id: uuidv4(),
        name: "Memorize all vocab",
        done: false,
        idx: 1
      },
      {
        id: uuidv4(),
        name: "Master listening exercises",
        done: false,
        idx: 2
      },
      {
        id: uuidv4(),
        name: "Listen and master one episode of Dix Pour Cent",
        done: false,
        idx: 3
      },
    ]
  },
  {
    id: uuidv4(),
    name: "Run a 6 minute mile",
    due: new Date("2025-1-10"),
    dueType: "day",
    description: "Run a 6 minute mile by the end of the year.",
    tag: TEST_TAGS[6],
    creationDate: new Date("2025-02-10"),
    status: "not-started",
    imgSrc: "",
    bOrder: {
     default: 1,
     status: 0,
     tag: 0
    },
    milestones: [
      {
        id: uuidv4(),
        name: "Run 5K without stoppping",
        done: true,
        idx: 0
      },
      {
        id: uuidv4(),
        name: "Complete a 10k practice run",
        done: true,
        idx: 1
      },
      {
        id: uuidv4(),
        name: "Do 10 hill runs",
        done: true,
        idx: 2
      },
      {
        id: uuidv4(),
        name: "Reach 15l distance",
        done: false,
        idx: 3
      },
      {
        id: uuidv4(),
        name: "Run 18k in under 2  hoursw",
        done: false,
        idx: 4
      },
      {
        id: uuidv4(),
        name: "Final practice: 20k",
        done: false,
        idx: 5
      },
    ]
  },
  {
    id: uuidv4(),
    name: "Go hiking in Iceland",
    description: "Trek through Iceland's epic landscapes with glaciers, volcanoes, and hidden hot springs.",
    creationDate: new Date("2025-01-01"),
    due: new Date("2025-1-31"),
    status: "not-started",
    imgSrc: "https://i.pinimg.com/736x/e7/cb/8a/e7cb8a6fd5c308575b3261262e85965d.jpg",
    tag: TEST_TAGS[9],
    bOrder: {
     default: 2,
     status: 1,
     tag: 0
    }
  },
  {
    id: uuidv4(),
    name: "Master 7 recipes",
    description: "Time to up my cooking game ! Want to nail both Asian stir-fries and Italian pasta - gonna master 7 go-to dishes I can actually be proud of. Thinking everything from homemade noodles to the perfect risotto.",
    creationDate: new Date("2025-01-31"),
    status: "accomplished",
    imgSrc: "https://i.pinimg.com/736x/47/b5/9a/47b59ab91d55bff20784f30b12183476.jpg",
    tag: TEST_TAGS[3],
    milestones: [
      {
        id: uuidv4(),
        name: "Ramen",
        done: true,
        idx: 0
      },
      {
        id: uuidv4(),
        name: "Spaghetti",
        done: true,
        idx: 1
      },
      {
        id: uuidv4(),
        name: "Sushi Rolls",
        done: false,
        idx: 2
      },
      {
        id: uuidv4(),
        name: "Risotto",
        done: true,
        idx: 3
      },
      {
        id: uuidv4(),
        name: "Beef Pho",
        done: false,
        idx: 4
      },
      {
        id: uuidv4(),
        name: "Butter Chicken",
        done: true,
        idx: 5
      },
      {
        id: uuidv4(),
        name: "Dim Sum",
        done: true,
        idx: 6
      }
    ],
    bOrder: {
     default: 3,
     status: 1,
     tag: 0
    }
  },
  {
    id: uuidv4(),
    name: "Read 12 Books This Year",
    due: new Date("2025-12-31"),
    dueType: "year",
    description: "Read one book every month and complete all 12 by the end of the year.",
    tag: TEST_TAGS[10],
    creationDate: new Date("2025-01-01"),
    status: "in-progress",
    imgSrc: "https://i.pinimg.com/736x/49/b5/9d/49b59d5866a63a2fe0bb03ea05ce649d.jpg",
    bOrder: {
     default: 4,
     status: 1,
     tag: 0
    },
    milestones: [
      {
        id: uuidv4(),
        name: "The Hobbit",
        done: false,
        idx: 0
      },
      {
        id: uuidv4(),
        name: "Eleanor Oliphant Is Completely Fine",
        done: true,
        idx: 1
      },
      {
        id: uuidv4(),
        name: "Where the Crawdads Sing",
        done: true,
        idx: 2
      },
      {
        id: uuidv4(),
        name: "Pride and Prejudice",
        done: true,
        idx: 3
      },
      {
        id: uuidv4(),
        name: "The Night Circus",
        done: true,
        idx: 4
      },
      {
        id: uuidv4(),
        name: "A Man Called Ove",
        done: false,
        idx: 5
      },
      {
        id: uuidv4(),
        name: "Little Fires Everywhere",
        done: false,
        idx: 6
      },
      {
        id: uuidv4(),
        name: "The Great Gatsby",
        done: false,
        idx: 7
      },
      {
        id: uuidv4(),
        name: "Normal People",
        done: false,
        idx: 8
      },
      {
        id: uuidv4(),
        name: "Big Little Lies",
        done: false,
        idx: 9
      },
      {
        id: uuidv4(),
        name: "The Fellowship of the Ring",
        done: false,
        idx: 10
      },
      {
        id: uuidv4(),
        name: "The Rosie Project",
        done: false,
        idx: 11
      }
    ]
  },
  {
    id: uuidv4(),
    name: "Finish porfolio website",
    due: new Date("2025-1-10"),
    dueType: "quarter",
    description: "Create the best most beautiful most gorgeous portfolio website oat.",
    tag: TEST_TAGS[1],
    creationDate: new Date("2025-03-01"),
    status: "accomplished",
    bOrder: {
     default: 5,
     status: 0,
     tag: 0
    }
  }
]

/* habits*/
export const TEST_HABITS: Habit[] = [
  {
    name: "Wake Up",
    symbol: "☀️",
    target: "8:30 AM",
    streak: 0,
    freqType: "daily",
    frequency: 1,
    data: "", 
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
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b0011110,
    data: "", 
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
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b0000001,
    data: "", 
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
    streak: 0,
    freqType: "daily",
    frequency: 1,
    data: "", 
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
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b0010100,
    data: "", 
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
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b0101010,
    data: "", 
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
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b1111000,
    data: "",
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
    streak: 0,
    freqType: "daily",
    frequency: 1,
    data: "", 
    timeOfDay: "all-day",
    order: {
      default: 7,
      tod: 0
    }
  },
  {
    name: "Clean House",
    symbol: "🧹",
    streak: 0,
    freqType: "per-week",
    frequency: 5,
    data: "", 
    target: null,
    timeOfDay: "afternoon",
    order: {
      default: 8,
      tod: 1
    }
  },
]

export const YEAR_HABITS_DATA: HabitYearData[] = [
   {
      name: "Wake Up",
      data: generateHabitData()
   },
   {
      name: "Exercise",
      data: generateHabitData()
   },
   {
      name: "Reading",
      data: generateHabitData()
   },
   {
      name: "Meditation",
      data: generateHabitData()
   },
   {
      name: "Study French",
      data: generateHabitData()
   },
   {
      name: "Run",
      data: generateHabitData()
   },
   {
      name: "Deep Work",
      data: generateHabitData()
   },
   {
      name: "Water",
      data: generateHabitData()
   },
   {
      name: "Clean House",
      data: generateHabitData()
   },
]

/* home base */
export const YEAR_THOUGHT_ENTRY: TextEntryOptions = {
  icon: {
      type: "img",
      src: "https://i.pinimg.com/originals/41/bc/b5/41bcb5fba60bb3e1112550c0a7841c70.gif",
      size: "big"
  },
  date: new Date(2025, 0),
  styling: "default",
  entry: `<strong>Chill</strong>  <code>noun</code>
Chill is the <u>calm in a storm</u> 🌊, the pause that lets us <i>breathe deeply</i>. 
It's the <u>crisp air</u> of a morning walk, the <i>stillness of twilight</i> settling over the world 🌌. 
To chill is to <u>embrace the quiet moments</u>, to let the rush fall away, and to find yourself in <i>peace</i> 🕊️. 
It's the art of <i>being present</i>, savoring simplicity, and knowing that stillness has its own magic ✨.
`
}

export const MONTH_THOUGHT_ENTRY: TextEntryOptions = {
  icon: {
      type: "img",
      src: "https://i.pinimg.com/736x/72/44/08/724408c450ce38a7be258ed489d8c64d.jpg",
      size: "small"
  },
  date: new Date(2025, 5),
  styling: "default",
  entry: `<strong>Wonder</strong>  <code>noun</code>
Wonder is the spark of curiosity ✨, the moment that makes us <i>pause in awe</i>. 
It's the glow of <i>starlight</i> in a vast night sky, the <u>whisper of possibility</u> in the unknown 🌌. 
To wonder is to embrace the questions, to see magic in the mundane, and to feel alive in discovery, 🌟. 
It's the art of <i>dreaming boldly</i>, seeking the extraordinary, and finding beauty in every moment 💫.
`
}

export const ACTIVITY_DATA = [
  {
      date: new Date(2025, 0, 2),
      text: "",
      focusMins: 12 * 60 + 10,
      habits: 0.7,
      thoughtEntry: null,
      goals: [
          {
              type: "big",
              name: "6 mile run",
              tag: TEST_TAGS[6]
          },
      ],
      highlightImg: {
          src: "https://i.pinimg.com/736x/22/b5/cc/22b5cc185b5942ae772ec5e231f60b39.jpg",
          caption: "",
      },
      tasks: [
        {
          id: "f82be9cd-8f42-477e-b833-e74feed75a78",
          idx: 0,
          title: "gym 7am",
          description: "100 pushups, 100 situps, 100 squats",
          isChecked: false,
          parentId: null
        },
      ]
  },
  {

      habits: 1,
      date: new Date(2025, 0, 3),
      text: "Three meetings, two deadlines, one surprise cake in the break room. Today had its moments.",
      focusMins: 5 * 60 + 11,
      highlightImg: null,
      thoughtEntry: null,
      tasks: [
        {
          id: "f82be9cd-8f42-477e-b833-e74feed75a78",
          idx: 0,
          title: "gym 7am",
          description: "100 pushups, 100 situps, 100 squats",
          isChecked: false,
          parentId: null
      },
      {
          id: "9e2d813a-b7c2-48a5-9e47-87654aebbe7a",
          idx: 1,
          title: "review presentation slides",
          description: "",
          isChecked: false,
          parentId: null
      },
      {
          id: "2d92e4a5-01ab-4d12-9a3f-4f6f2f0c6f7f",
          idx: 2,
          title: "write q4 report draft",
          description: "",
          isChecked: false,
          parentId: null
      },
      {
          id: "bf3e3c33-7d8e-4293-937e-67b78d4516b1",
          idx: 3,
          title: "buy ingredients for ratatouille",
          description: "tomatoes, zucchini, onions, garlic, olive oil, salt, pepper",
          isChecked: false,
          parentId: null
      },
      {
          id: "bb746a50-b674-4285-8504-4fada3283243",
          idx: 4,
          title: "write journal entry",
          description: "",
          isChecked: false,
          parentId: null
      },
    ]
  },
  {
      date: new Date(2025, 0, 4),
      text: "new yooooooork, concrete jungle where dreams are made of...",
      thoughtEntry: {
        width: 580,
        fontStyle: "fancy",
        title: "NYC Trip",
        text:  `City lights reflecting off rain-slicked streets tonight. Found this tiny pizza place in Brooklyn - the kind with checkered tablecloths and photos from 1950s Italy. Met some locals who showed us their favorite coffee spot tucked away in an old bookstore.

Descending was bittersweet, leaving behind that peaceful, dreamlike scene. Now, by the campfire in the cool night air, I can still see it so clearly—a moment of pure magic etched in my memory.
        `
      },
      highlightImg: {
        src: "https://i.pinimg.com/736x/e1/39/43/e13943596410e71ea2f14baedb442d1d.jpg",
        caption: "",
      },
      tasks: [
          {
            id: "f82be9cd-8f42-477e-b833-e74feed75a78",
            idx: 0,
            title: "Walk the High Line",
            description: "Elevated park with art installations and city views",
            isChecked: false,
            parentId: null
          },
          {
              id: "9e2d813a-b7c2-48a5-9e47-87654aebbe7a",
              idx: 1,
              title: "Visit Times Square",
              isChecked: false,
              parentId: null
          },
          {
              id: "2d92e4a5-01ab-4d12-9a3f-4f6f2f0c6f7f",
              idx: 2,
              title: "Explore Central Park",
              description: "Bethesda Fountain, Bow Bridge, Belvedere Castle",
              isChecked: false,
              parentId: null
          },
          {
              id: "bf3e3c33-7d8e-4293-937e-67b78d4516b1",
              idx: 3,
              title: "Metropolitan Museum",
              description: "",
              isChecked: false,
              parentId: null
          },
          {
              id: "bb746a50-b674-4285-8504-4fada3283243",
              idx: 4,
              title: "Brooklyn Bridge Walk",
              description: "Historic bridge with Manhattan skyline views",
              isChecked: false,
              parentId: null
          }
      ]
  },
  {
      habits: 1,
      date: new Date(2025, 0, 5),
      text: "",
      focusMins: 134,
      thoughtEntry: {
        width: 580,
        fontStyle: "stylish",
        title: "Painting Calm",
        text: `First time working with pastels today. There's something magical about how the colors blend and layer. Started with simple still life - a bowl of fruit, but ended up experimenting with abstract patterns.

The studio was quiet except for the sound of chalk on paper. These peaceful moments of creation are becoming my favorite part of the week.
        `
      },
      highlightImg: {
          src: "https://i.pinimg.com/736x/5e/e0/be/5ee0bedc21c8d2d37ff39dacbda0ef1d.jpg",
          caption: "a little painting",
      },
      tasks: []
  },
  {
      habits: 0.4,
      date: new Date(2025, 0, 6),
      text: "",
      focusMins: 563,
      highlightImg: null,
      thoughtEntry: null,
      tasks: []
  },
  {
      habits: 1,
      date: new Date(2025, 0, 9),
      text: "",
      focusMins: 662,
      highlightImg: null,
      thoughtEntry: null,
      tasks: []
  },
  {
      date: new Date(2025, 0, 10),
      text: "",
      focusMins: 52,
      highlightImg: null,
      thoughtEntry: null,
      tasks: []
  },
  {
      date: new Date(2025, 0, 10),
      text: "",
      highlightImg: null,
      thoughtEntry: {
        width: 580,
        fontStyle: "basic",
        title: "Finding Balance",
        text: `Started my morning with meditation and a new book. There's something powerful about these quiet moments before the world wakes up. The stillness helps me think clearly about what matters most.

Been reflecting on how to better balance work and personal growth. Maybe it's not about perfect balance, but about being present in whatever I'm doing. Small steps, mindful choices.`
      },
      tasks: []
  },
  {
      date: new Date(2025, 0, 13),
      text: "",
      highlightImg: null,
      thoughtEntry: {
        width: 580,
        fontStyle: "cute",
        title: "Creative Spark",
        text: `Finally picked up my brushes again after weeks. The canvas was intimidating at first, but once I started mixing colors, everything else faded away. Created something completely different from my usual style - abstract, bold, messy.

It's liberating to create without judgment, to let intuition guide the process. Sometimes the best art comes from letting go of expectations.`
      },
      focusMins: 1 * 60 + 41,
      tasks: []
  },
  {
      habits: 0.9,
      date: new Date(2025, 0, 16),
      text: "",
      focusMins: 271,
      highlightImg: null,
      thoughtEntry: {
        width: 580,
        fontStyle: "basic",
        title: "City Wanderings",
        text: `Explored the old part of town today, camera in hand. Found this amazing little bookstore tucked between modern buildings - shelves reaching the ceiling, that perfect old book smell, and a cat sleeping in the window.

Sometimes the best discoveries happen when you're not looking for anything in particular. Made friends with the bookstore owner, Maria, who recommended some fascinating local history books.`
      },
      tasks: []
  },
  {
      date: new Date(2025, 0, 18),
      text: "",
      focusMins: 5 * 60 + 11,
      thoughtEntry: {
        width: 580,
        fontStyle: "basic",
        title: "Learning to Code",
        text: `Finally cracked that programming problem I've been stuck on for days! The solution was simpler than I thought - isn't it always? Spent hours diving deep into algorithms and actually enjoyed the process.

It's amazing how coding is teaching me patience and persistence. Every bug is a puzzle waiting to be solved, every error message a clue leading to better understanding.`
      },
      highlightImg: {
          src: "https://i.pinimg.com/736x/f8/4b/f3/f84bf38f9462d6a70d8c8c1b77a1a64a.jpg",
          caption: "coding shit",
      },
      tasks: []
  },
  {
      date: new Date(2025, 0, 20),
      text: "",
      habits: 0.2,
      thoughtEntry: null,
      highlightImg: null,
      goals: [
          {
              type: "big",
              name: "learn how to make pizza",
              tag: TEST_TAGS[3]
          },
      ],
      tasks: []
  },
  {
      date: new Date(2025, 0, 23),
      text: "",
      focusMins: 5 * 60 + 11,
      highlightImg: null,
      thoughtEntry: {
        width: 580,
        fontStyle: "stylish",
        title: "Garden Reflections",
        text: `Spent the morning in my tiny balcony garden. The tomato plants are finally showing fruit, and the herbs are thriving. There's something deeply satisfying about nurturing these small green lives.
Gardening teaches patience in ways nothing else can. You can't rush growth, can't force a seed to sprout before its time. Nature moves at its own pace, and that's perfectly okay.`
      },
      tasks: []
  },
  {
      date: new Date(2025, 0, 24),
      text: "",
      focusMins: 398,
      thoughtEntry: null,
      highlightImg: {
          src: "https://i.pinimg.com/736x/9b/91/cc/9b91cc7b70d04399c09d33d7ed8d063c.jpg",
          caption: "italian paradise",
      },
      tasks: []
  },
  {
      habits: 0.4,
      date: new Date(2025, 0, 26),
      text: "",
      thoughtEntry: null,
      highlightImg: null,
      focusMins: 281,
      tasks: []
  },
  {
      date: new Date(2025, 0, 27),
      text: "",
      focusMins: 84,
      thoughtEntry: null,
      highlightImg: {
          src: "https://i.pinimg.com/736x/d5/ff/09/d5ff09b5043f74591b4ffeb96fc94456.jpg",
          caption: "at the museum 🌷",
      },
      tasks: []
  },
  {
      habits: 1,
      date: new Date(2025, 0, 28),
      text: "",
      thoughtEntry: null,
      highlightImg: null,
      focusMins: 2 * 60 + 34,
      tasks: []
  },
  {
      date: new Date(2025, 0, 30),
      text: "",
      focusMins: 5 * 60 + 11,
      thoughtEntry: {
        width: 580,
        fontStyle: "cute",
        title: "Mountain Memories",
        text: `The sunrise from the summit was worth every step of the climb. Watching the world slowly illuminate, colors painting the sky in gentle strokes - these are the moments that make you feel truly alive.

Met a fellow hiker at the top, shared hot coffee and stories. It's amazing how strangers can become friends when you're sharing a view above the clouds.`
      },
      highlightImg: {
          src: "https://i.pinimg.com/736x/ef/fb/f3/effbf31760c27673d5add67fa439522d.jpg",
          caption: "atop the mountains 🌤️",
      },
      tasks: []
  },
  {
      habits: 0.6,
      date: new Date(2025, 0, 31),
      text: "",
      focusMins: 441,
      thoughtEntry: null,
      highlightImg: null,
      tasks: []
  },
  {
      date: new Date(2025, 0, 14),
      text: "",
      focusMins: 192,
      habits: 0.2,
      thoughtEntry: null,
      highlightImg: null,
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
      ],
      tasks: []
  },
  {
      date: new Date(2025, 0, 15),
      text: "",
      habits: 0.7,
      thoughtEntry: null,
      highlightImg: null,
      goals: [
          {
              type: "big",
              name: "js fundamentals",
              tag: TEST_TAGS[1]
          },
      ],
      tasks: []
  },
  {
      date: new Date(2025, 0, 25),
      text: "",
      habits: 0.7,
      thoughtEntry: {
        width: 580,
        fontStyle: "stylish",
        title: "Art Studio Day",
        text: `First time working with pastels today. There's something magical about how the colors blend and layer. Started with simple still life - a bowl of fruit, but ended up experimenting with abstract patterns.

The studio was quiet except for the sound of chalk on paper. These peaceful moments of creation are becoming my favorite part of the week.`
      },
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
      ],
      tasks: []
  },
  {
      date: new Date(2025, 0, 29),
      text: "",
      habits: 0.7,
      thoughtEntry: null,
      highlightImg: null,
      goals: [
          {
              type: "big",
              name: "master sketching the head",
              tag: TEST_TAGS[8]
          },
      ],
      tasks: []
  }
]