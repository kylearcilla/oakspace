import { GOALS } from "./mock-data-goals"
import { COLOR_SWATCHES } from "./utils-colors"
import { generateHabitData } from "./utils-habits-data"
import { v4 as uuidv4 } from 'uuid'

/* aesthetics */
export const IMG_COLLECTIONS: any = {
  "dark": {
      banner: {
        src: "https://i.imgur.com/MEjZkXW.png",
        center: 50
      },
      headerIcon: "https://i.pinimg.com/originals/09/09/53/09095303ec25e04693b00f0f9d21b962.gif",
      headerTextBlockImg: {
        type: "img",
        src: "https://i.pinimg.com/736x/72/44/08/724408c450ce38a7be258ed489d8c64d.jpg",
        size: "small"
      },
      bulletinImg: "https://i.pinimg.com/564x/81/2d/7b/812d7be9f97ac8a753e6a73997c71fea.jpg",
      overviewTextBlockImg: {
        src: "https://i.pinimg.com/originals/41/bc/b5/41bcb5fba60bb3e1112550c0a7841c70.gif",
        type: "img",
        size: "small"
      },
      headerImg: "https://i.pinimg.com/originals/7d/04/0e/7d040e94931427709008aaeda14db9c8.gif"
  },
  "light": {
    banner: {
      src: "https://pbs.twimg.com/media/EjAg4_zU8AMUZHJ?format=jpg&name=large",
      center: 67.5588
    },
    headerIcon: "https://i.pinimg.com/736x/e2/8c/8d/e28c8d7ec915504ba5f098aa80901972.jpg",
    headerTextBlockImg: {
      type: "img",
      src: "https://i.pinimg.com/originals/74/9b/95/749b9521a2d28907f7b0fc79598cc420.gif",
      size: "small"
    },
    bulletinImg: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/287d3559037917.5a130f45904d5.gif",
    overviewTextBlockImg: {
      src: "https://i.pinimg.com/736x/d1/a6/55/d1a655f28705a9257c58e97b30211ea2.jpg",
      type: "img",
      size: "small"
    },
    headerImg: "",
  },
  "dark-academia": {
      banner: {
        src: "https://images.unsplash.com/photo-1555440186-7f0a5a6a5537?q=80&w=2436&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        center: 50
      },
      headerIcon: "https://i.pinimg.com/736x/60/c0/56/60c056da9584990ab945e946922f5416.jpg",
      headerTextBlockImg: {
        type: "img",
        src: "https://i.pinimg.com/736x/b4/e6/1f/b4e61fd0f678b2164e4ab0c275082367.jpg",
        size: "small"
      },
      bulletinImg: "https://i.pinimg.com/736x/1a/b9/40/1ab940c5b78f82ab8e57d6f263a0bca8.jpg",
      overviewTextBlockImg: {
        src: "https://i.pinimg.com/736x/ed/b9/3d/edb93d9be0ab8783333e9918455d4ae3.jpg",
        type: "img",
        size: "small"
      },
      headerImg: "https://i.pinimg.com/736x/1a/b9/40/1ab940c5b78f82ab8e57d6f263a0bca8.jpg"
  },
  "gotham": {
      banner: {
        src: "https://i.pinimg.com/originals/40/0f/00/400f007bade76022eb839fdbb5acf646.gif",
        center: 77.3329
      },
      headerIcon: "https://i.pinimg.com/originals/a3/49/42/a349425ae32290a0fb222b3990049389.gif",
      headerTextBlockImg: {
        type: "emoji",
        src: "🌉",
        size: "small"
      },
      bulletinImg: "https://i.pinimg.com/originals/b9/3c/aa/b93caa57b98ed62c10eaab665d3f41b9.gif",
      overviewTextBlockImg: {
        src: "https://i.pinimg.com/736x/ae/28/ba/ae28ba3c8dcca80bd2b8b5a632ffa9b6.jpg",
        type: "img",
        size: "small"
      },
      headerImg: "https://i.pinimg.com/originals/f6/5a/a5/f65aa5411e5d4e54b93aabb1bf1ceca4.gif"
  },
  "terracotta": {
      banner: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg/2560px-Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg",
        center: 45.2433
      },
      headerIcon: "https://i.pinimg.com/736x/70/a9/54/70a954ddddb49bbe9b882e18188d96b6.jpg",
      headerTextBlockImg: {
        type: "img",
        src: "https://i.pinimg.com/736x/f0/9a/9c/f09a9c36370c62b82906bffa5f9d090e.jpg",
        size: "small"
      },
      bulletinImg: "https://i.pinimg.com/736x/27/4d/7e/274d7e37c3b311c32d316749ed2d9d4f.jpg",
      overviewTextBlockImg: {
        src: "https://i.pinimg.com/736x/89/74/9d/89749de231686a58bfb692d9ea087273.jpg",
        type: "img",
        size: "small"
      },
      headerImg: "https://i.pinimg.com/originals/f6/5a/a5/f65aa5411e5d4e54b93aabb1bf1ceca4.gif"
  },
  "sand": {
      banner: {
        src: "https://cdn.mos.cms.futurecdn.net/63JGu3actDe5YUGmzpsycA.jpg",
        center: 67
      },
      headerIcon: "https://i.pinimg.com/736x/7d/94/2b/7d942b031af0bc94e87de7fecc85553e.jpg",
      headerTextBlockImg: {
        type: "img",
        src: "https://i.pinimg.com/736x/73/e7/c0/73e7c077da633396fef3a9acebd84987.jpg",
        size: "small"
      },
      bulletinImg: "https://i.pinimg.com/736x/39/81/57/39815794e8a6f0241cf851a2fe82a166.jpg",
      overviewTextBlockImg: {
        src: "https://i.pinimg.com/originals/b9/32/88/b93288ff19c3b3460ab2680b7ffa1666.gif",
        type: "img",
        size: "small"
      },
      headerImg: ""
  },
}

const IMG_COLLECTION_IDX = localStorage.getItem("theme-name") ?? "sand"
// const IMG_COLLECTION_IDX = "sand"

/* tags */
export const TEST_TAGS: Tag[] = [
    {
      id: "0",
      orderIdx: 13,
      name: "Body",
      symbol: {
        color: COLOR_SWATCHES[0],
        emoji: "💪"
      }
    },
    {
      id: "1",
      orderIdx: 1,
      name: "SWE",
      symbol: {

        color: COLOR_SWATCHES[8],
        emoji: "👨‍💻"
      }
    },
    {
      id: "2",
      orderIdx: 2,
      name: "French",
      symbol: {
        color: COLOR_SWATCHES[7],
        emoji: "🇫🇷"
      }
    },
    {
      id: "3",
      orderIdx: 3,
      name: "Cooking",
      symbol: {
        color: COLOR_SWATCHES[1],
        emoji: "🍖"
      }
    },
    {
      id: "4",
      orderIdx: 4,
      name: "English",
      symbol: {
        color: COLOR_SWATCHES[8],
        emoji: "🇺🇸"
      }
    },
    {
      id: "5",
      orderIdx: 5,
      name: "BBall",
      symbol: {
        color: COLOR_SWATCHES[2],
        emoji: "🏀"
      }
    },
    {
      id: "6",
      orderIdx: 6,
      name: "Running",
      symbol: {
        color: COLOR_SWATCHES[2],
        emoji: "🏃‍♂️"
      }
    },
    {
      id: "7",
      orderIdx: 7,
      name: "Meditation",
      symbol: {
        color: COLOR_SWATCHES[5],
        emoji: "🌿"
      }
    },
    {
      id: "8",
      orderIdx: 8,
      name: "Art",
      symbol: {
        color: COLOR_SWATCHES[1],
        emoji: "🌁"
      }
    },
    {
      id: "9",
      orderIdx: 9,
      name: "Travel",
      symbol: {
        color: COLOR_SWATCHES[3],
        emoji: "🏔️"
      }
    },
    {
      id: "10",
      orderIdx: 10,
      name: "Reading",
      symbol: {
        color: COLOR_SWATCHES[7],
        emoji: "📖"
      }
    },
    {
      id: "11",
      orderIdx: 11,
      name: "Finance",
      symbol: {
        color: COLOR_SWATCHES[5],
        emoji: "💵"
      }
    },
    {
      id: "12",
      orderIdx: 12,
      name: "wefowe;ofiwje F;OIwefjw;eoFIJWef;owieFJWE;O FIJWe;o i",
      symbol: {
        color: COLOR_SWATCHES[5],
        emoji: "💵"
      }
    },
    {
      id: "*",
      orderIdx: 0,
      name: "Empty",
      symbol: {
        color: COLOR_SWATCHES[12],
        emoji: ""
      }
    }
]

export const EMPTY_TAG = TEST_TAGS[13]

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

/* habits*/
export const TEST_HABITS: Habit[] = [
  {
    id: "0",
    name: "Wake Up",
    createdAt: new Date(2024, 10, 1),
    img: {
      src: "https://i.pinimg.com/736x/14/fb/d0/14fbd05904b53010e04b1476e23c11d1.jpg",
      center: 72
    },
    symbol: "☀️",
    caption: "8:30 AM",
    description: 'Waking up to the morning sun fills you with warmth, clarity, and a quiet sense of renewal for the day ahead.',
    streak: 0,
    freqType: "daily",
    frequency: 1,
    data: "", 
    timeOfDay: "all-day",
    order: {
      default: 0,
      tod: 0
    }
  },
  {
    id: "1",
    name: "Garden",
    createdAt: new Date(2024, 10, 1),
    img: {
      src: "https://i.pinimg.com/736x/1f/f2/7f/1ff27fa52fffeec92d3d39244d96d5f0.jpg",
      center: 67
    },
    symbol: "🌱",
    caption: "Once a day.",
    description: "I garden because nurturing plants connects me to the earth, giving me peace and the satisfaction of watching something grow from my own hands.",
    streak: 2,
    freqType: "daily",
    frequency: 1,
    data: "", 
    timeOfDay: "morning",
    order: {
      default: 1,
      tod: 3
    }
  },
  {
    id: "2",
    name: "Exercise",
    createdAt: new Date(2024, 10, 1),
    img: {
      src: "https://i.pinimg.com/736x/36/33/ae/3633ae0b503718a926480774672698cc.jpg",
      center: 75
    },
    symbol: "💪",
    caption: "45m",
    description: '"What a disgrace it is for a man to grow old without ever seeing the beauty and strength of which his body is capable."',
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b001111,
    data: "", 
    timeOfDay: "afternoon",
    order: {
      default: 2,
      tod: 0
    }
  },
  {
    id: "3",
    name: "Reading",
    createdAt: new Date(2024, 10, 1),
    img: {
      src: "https://images.unsplash.com/photo-1569937301527-9336e27c357c?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      center: 50
    },
    symbol: "📖",
    caption: "30 pages or 30m",
    description: '"A reader lives a thousand lives before he dies. The man who never reads lives only one."',
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b0000001,
    data: "", 
    timeOfDay: "evening",
    order: {
      default: 3,
      tod: 0
    }
  },
  {
    id: "4",
    name: "Meditation",
    createdAt: new Date(2024, 10, 1),
    img: {
      src: "https://images.unsplash.com/photo-1484452330304-377cdeb05340?q=80&w=2342&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      center: 50
    },
    symbol: "🧘🏼‍♂️",
    caption: "15m",
    description: "When meditation is mastered, the mind is unwavering like the flame of a candle in a windless place.",
    streak: 0,
    freqType: "daily",
    frequency: 1,
    data: "", 
    timeOfDay: "morning",
    order: {
      default: 4,
      tod: 1
    }
  },
  {
    id: "5",
    name: "French",
    createdAt: new Date(2024, 10, 1),
    img: {
      src: "https://i.pinimg.com/736x/9b/7c/61/9b7c61308139e3ac35e68499dfb3a2bd.jpg",
      center: 40
    },
    symbol: "🇫🇷",
    caption: "1h",
    description: `"Let's go to Cannes, watch a couple of indie movies that you never heard of!"`,
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b0010100,
    data: "", 
    timeOfDay: "evening",
    order: {
      default: 5,
      tod: 1
    }
  },
  {
    id: "6",
    name: "Run",
    createdAt: new Date(2024, 10, 1),
    img: {
      src: "https://i.pinimg.com/736x/3f/de/dd/3fdedd1ce820c9f6da939269ba0577c2.jpg",
      center: 50
    },
    symbol: "🏃‍♂️",
    caption: "5 km",
    description: "I run because feeling my heart race connects me to my body's potential, knowing each step boosts my immune system and heart health.",
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b0101010,
    data: "", 
    timeOfDay: "morning",
    order: {
      default: 6,
      tod: 2
    }
  },
  {
    id: "7",
    name: "Deep Work",
    createdAt: new Date(2024, 10, 1),
    img: {
      src: "https://images.unsplash.com/photo-1737279721268-a30ca431135b?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      center: 50
    },
    symbol: "👨‍💻",
    caption: "2h",
    description: "I seek deep flow because in that state of complete immersion, time melts away and I connect with the essence of what I'm creating.",
    streak: 0,
    freqType: "day-of-week",
    frequency: 0b1111000,
    data: "",
    timeOfDay: "afternoon",
    order: {
      default: 7,
      tod: 2
    }
  },
  {
    id: "8",
    name: "Water",
    createdAt: new Date(2024, 10, 1),
    img: null,
    symbol: "🌊",
    caption: "8 glasses",
    description: "",
    streak: 0,
    freqType: "daily",
    frequency: 1,
    data: "", 
    timeOfDay: "all-day",
    order: {
      default: 8,
      tod: 0
    }
  },
  {
    id: "9",
    name: "Clean",
    createdAt: new Date(2024, 10, 1),
    img: null,
    symbol: "🧹",
    streak: 0,
    freqType: "per-week",
    frequency: 5,
    data: "", 
    caption: "",
    description: "",
    timeOfDay: "afternoon",
    order: {
      default: 9,
      tod: 1
    }
  }
]

export const YEAR_HABITS_DATA: HabitYearData[] = [
   {
      name: "Wake Up",
      data: generateHabitData()
   },
   {
      name: "Garden",
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
      name: "French",
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
      name: "Clean",
      data: generateHabitData()
   },
]

/* home base */
export const BASE_BANNER = IMG_COLLECTIONS[IMG_COLLECTION_IDX].banner

export const BASE_HEADER = {
  icon: {
    src: IMG_COLLECTIONS[IMG_COLLECTION_IDX].headerIcon,
    type: "img",
    show: true
  },
  showText: true,
  pos: "top"
}

export const YEAR_THOUGHT_ENTRY: TextEntryOptions = {
  icon: {
      type: "img",
      src: "https://i.pinimg.com/736x/c0/e3/4d/c0e34d53f0d0c134ebbdc7dbca8d2a43.jpg",
      size: "small"
  },
  date: new Date(2025, 1),
  truncate: true,
  styling: "has-marker",
  entry: `<strong>Chill</strong>  <code>noun</code>
Chill is the <u>calm in a storm</u> 🌊, the pause that lets us <i>breathe deeply</i>. 
It's the <u>crisp air</u> of a morning walk, the <i>stillness of twilight</i> settling over the world 🌌. 
To chill is to <u>embrace the quiet moments</u>, to let the rush fall away, and to find yourself in <i>peace</i> 🕊️.
It's finding comfort in solitude, turning down the noise, and letting your mind float free like clouds in a gentle breeze ☁️.
`
}

export const HOME_THOUGHT_ENTRY: TextEntryOptions = {
  icon: IMG_COLLECTIONS[IMG_COLLECTION_IDX].headerTextBlockImg,
  date: new Date(2025, 5),
  truncate: true,
  styling: "has-marker",
  entry: `<strong>Wonder</strong>  <code>noun</code>
Wonder is the spark of curiosity ✨, the moment that makes us <i>pause in awe</i>. 
It's the glow of <i>starlight</i> in a vast night sky, the <u>whisper of possibility</u> in the unknown 🌌. 
To wonder is to embrace the questions, to see magic in the mundane, and to feel alive in discovery, 🌟.
It's the art of <i>dreaming boldly</i>, seeking the extraordinary, and finding beauty in every moment 💫.
`
}

export const MONTH_THOUGHT_ENTRY: TextEntryOptions = {
  icon: IMG_COLLECTIONS[IMG_COLLECTION_IDX].overviewTextBlockImg,
  date: new Date(2025, 6),
  truncate: true,
  styling: "has-marker",
  entry: `<strong>Serenity</strong>  <code>noun</code>
Serenity is the gentle stillness 🌊, the calm that <i>flows within</i>.
It's the soft glow of <i>dawn</i> breaking over quiet waters, the <u>peace that settles</u> in solitude 🌅.
To be serene is to find balance in chaos, to breathe deeply, and to rest in the present, 🍃.
It's the art of <i>letting go</i>, embracing tranquility, and finding clarity in stillness ✨.
`
}

export const BULLETIN_CONTENT = {
  img: IMG_COLLECTIONS[IMG_COLLECTION_IDX].bulletinImg,
  hasNotes: true,
  contentsOnHover: false,
  notes: [
    "you can literally have a whole new life in a year",
    "outgrowing my own bullshit. love to see it.",
    "real growth starts when you're tired of your own shit",
    "Inner peace over everything else.",
    "Can't approach new energy and new life with the same attitude u was using to maintain ya old shit!",
    "How would the most relaxed version of you approach it? The most confident version? Your best version?",
    "Life begins at the end of your comfort.",
    "Everything in life starts with your mindset first and your actions second. <br><br>Your actions follow your thoughts, your beliefs and ideas.",
    "Be yourself so the people looking for you can find you.",
    "You gotta learn how to move from things that don't serve you well.",
    "Decide what kind of life you actually want. And then say no to everything that isn't that.",
    "Self love is the highest frequency that attracts everything you desire.",
    "Do not rely on transient feelings, rely on who you desire to be on this day, in this lifetime. <br><br>What would they do. Don't ask yourself if you want to do it. <br><br>Ask your future self if they want you to do it. <br><br>You do it for that person.",
    "If you only listen to yourself, all you will do is recreate the same reality that you've always been living in. <br><br>If you keep reframing your everyday from within your future, idealized best-self, you will inch closer and closer to be that person",
    "What a disgrace it is for a man to grow old without ever seeing the beauty and strength of which his body is capable.",
    "I'm in love with my future.",
    "It's the small habits. How you spend your mornings. <br><br> How you talk to yourself. Your first instinct when boredom arises. <br><br>What you choose to spend enery on. Who you share your energy with. That will change your life.",
    "The past is just a story we tell ourselves.",
    "You need 3 daily wins: <br><br>A physical win. <br>A mental win. <br>A spiritual win.",
    "I love ppl with good energy. It makes me so happy.",
    "If the mind wanders 100 times, simply invite it back 100 times.<br><br> Each time you bring your mind back without judgement, it is like a bicep curl for your brain.",
    "Spoiler: it absolutely does workout for you, and even better than you anticipated.",
    "Develop a strong opinion of yourself so you don't end up internalizing the beliefs others have of you.",
    "Wheresoever you go, go with all your heart.",
    "Someone could be more successful than you and still envy you because your character carries more weight than their status.",
    "You have to get so confident in who you are that no one's opinion, rejection, or behavior can fucking rock you.",
  ],
  noteIdx: 0
}

export const HEADER_IMG = IMG_COLLECTIONS[IMG_COLLECTION_IDX].headerImg