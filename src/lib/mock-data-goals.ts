import { TEST_TAGS } from "./mock-data-tags"

type PeriodEntry = {
    entry: TextEntry | null
    pinnedId: string | null

  }
type YearEntry = PeriodEntry & {
    bannerImg: {
        src: string
        center: number
    }
    smallImg: string
}
export const TEST_USER = {
  id: "05867591-38be-4464-82b3-baca0d5c650d",
  name: "Kyle Arcilla",
  profileImg: "https://i.pinimg.com/736x/2a/72/37/2a7237c749f279f29d561f77daf566f7.jpg",
  email: "kylearcilla09@gmail.com",
  description: "Human",
  pro: true,
  created: new Date(2023, 7, 22),
  stats: {
      goalsReached: 18,
      habitsDone: 1832,
      sessions: 43,
      focusTime: 40274,
      routinesMade: 10
  }
}

export const GOALS: Goal[] = [
      {
        id: "0",
        name: "Reach conversational fluency in French",
        due: new Date("2025-01-01T00:00:00"),
        dueType: "month",
        description: "Reach conversational fluency in French by the end of the year.",
        tag: TEST_TAGS[0],
        creationDate: new Date("2025-01-15"),
        tasks: [],
        img: null,
        status: "in-progress",
        y_order: {
         default: 0,
         status: 0,
         tag: 0
        },
        q_order: {
         default: 0,
         status: 0,
         tag: 0
        },
        m_order: {
         default: 0,
         status: 0,
         tag: 0
        }
      },
      {
        id: "1",
        name: "Run a 6 minute mile",
        due: new Date("2025-01-01T00:00:00"),
        dueType: "day",
        description: "Run a 6 minute mile by the end of the year.",
        tag: TEST_TAGS[6],
        creationDate: new Date("2025-02-10"),
        tasks: [],
        status: "not-started",
        img: null,
        y_order: {
         default: 1,
         status: 1,
         tag: 0
        },
        q_order: {
         default: 4,
         status: 0,
         tag: 0
        },
        m_order: {
         default: 1,
         status: 0,
         tag: 0
        }
      },
      {
        id: "3",
        name: "Master 7 recipes",
        description: "Time to up my cooking game ! Want to nail both Asian stir-fries and Italian pasta - gonna master 7 go-to dishes I can actually be proud of. Thinking everything from homemade noodles to the perfect risotto.",
        creationDate: new Date("2025-03-20"),
        due: new Date("2025-02-22"),
        dueType: "day",
        status: "accomplished",
        completedDate: new Date("2025-03-22"),
        tasks: [],
        img: { 
          src: "https://i.pinimg.com/736x/47/b5/9a/47b59ab91d55bff20784f30b12183476.jpg",
          type: "float-left",
          center: 50
        },
        tag: TEST_TAGS[3],
        y_order: {
         default: 11,
         status: 3,
         tag: 0
        },
        q_order: {
         default: 3,
         status: 0,
         tag: 0
        },
        m_order: {
         default: 0,
         status: 0,
         tag: 0
        }
      },
      {
        id: "2",
        name: "Go hiking in Iceland",
        description: "Trek through Iceland's epic landscapes with glaciers, volcanoes, and hidden hot springs.",
        creationDate: new Date("2025-03-01"),
        dueType: "day",
        big: true,
        due: new Date("2025-03-3"),
        status: "not-started",
        tasks: [],
        img: { 
          src: "https://i.pinimg.com/736x/e7/cb/8a/e7cb8a6fd5c308575b3261262e85965d.jpg",
          type: "float-left",
          center: 50
        },
        tag: TEST_TAGS[9],
        y_order: {
         default: 12,
         status: 5,
         tag: 0
        },
        q_order: {
         default: 1,
         status: 1,
         tag: 0
        },
        m_order: {
         default: 1,
         status: 0,
         tag: 0
        }
      },
      {
        id: "4",
        name: "Read 12 Books This Year",
        due: new Date("2025-03-13"),
        dueType: "year",
        description: "Read one book every month and complete all 12 by the end of the year.",
        tag: TEST_TAGS[10],
        creationDate: new Date("2025-01-01"),
        tasks: [],
        status: "in-progress",
        img: { 
          src: "https://i.pinimg.com/736x/49/b5/9d/49b59d5866a63a2fe0bb03ea05ce649d.jpg",
          type: "float-left",
          center: 50
        },
        y_order: {
          default: 2,
          status: 1,
          tag: 0
        },
        q_order: {
          default: 2,
          status: 1,
          tag: 0
        },
        m_order: {
          default: 2,
          status: 0,
          tag: 0
        },
      },
      {
        id: "5",
        name: "Update porfolio website",
        due: new Date("2025-3-10"),
        dueType: "quarter",
        description: "Create the best most beautiful most gorgeous portfolio website oat.",
        tag: TEST_TAGS[1],
        creationDate: new Date("2025-03-01"),
        tasks: [],
        status: "accomplished",
        img: null,
        completedDate: new Date("2025-03-5"),
        y_order: {
          default: 3,
          status: 0,
          tag: 0
        },
        q_order: {
         default: 5,
         status: 1,
         tag: 0
        },
        m_order: {
         default: 0,
         status: 0,
         tag: 0
        }
      },
      {
        id: "99",
        name: "30-Minute Daily Movement",
        due: new Date("2024-04-31"),
        dueType: "day",
        description: "Complete 30 minutes of exercise 5 days a week. Mix between yoga, home workout videos, walking, or simple bodyweight exercises.",
        tag: TEST_TAGS[1],
        creationDate: new Date("2024-04-10"),
        tasks: [],
        status: "not-started",
        img: { 
          src: "https://i.pinimg.com/736x/c4/64/54/c46454bf75c6e3501080f5b448d497e4.jpg",
          type: "float-left",
          center: 50
        },
        y_order: {
         default: 0,
         status: 0,
          tag: 0
        },
        q_order: {
         default: 0,
         status: 0,
         tag: 0
        },
        m_order: {
            default: 0,
            status: 0,
            tag: 0
        }
      },
      {
        id: "7",
        name: "Japan Trip",
        due: new Date("2025-4-11"),
        dueType: "day",
        description: "Tokyo, Kyoto, Osaka. Food, ramen, sushi, fashion, coffee and nature.",
        pinIdx: 0,
        big: true,
        tasks: [],
        img: { 
          src: "https://i.pinimg.com/736x/18/86/7c/18867cb31f36820b8908b1f462ab8b70.jpg",
          type: "float-left",
          center: 50
        },
        tag: TEST_TAGS[9],
        creationDate: new Date("2025-03-01"),
        status: "not-started",
        y_order: {
         default: 4,
         status: 0,
         tag: 1
        },
        q_order: {
         default: 3,
         status: 0,
         tag: 0
        },
        m_order: {
         default: 0,
         status: 0,
         tag: 0
        }
      },
      {
        id: "8",
        name: "Learn Coding",
        pinIdx: 1,
        due: new Date("2025-5-20"),
        dueType: "quarter",
        description: "Learn to code. JavaScript, Python, React, etc.",
        tasks: [],
        img: { 
          src: "https://i.pinimg.com/736x/ea/87/5f/ea875f548c6d1cdabd6335406c55fe28.jpg",
          type: "float-left",
          center: 50
        },
        tag: TEST_TAGS[1],
        creationDate: new Date("2025-03-01"),
        status: "accomplished",
        completedDate: new Date("2025-03-8"),
        y_order: {
          default: 5,
          status: 1,
          tag: 1
        },
        q_order: {
          default: 2,
          status: 0,
          tag: 0
        },
        m_order: {
          default: 0,
          status: 0,
          tag: 0
        }
      },
      {
        id: "9",
        name: "Get MONEY UP 💵",
        pinIdx: 2,
        due: new Date("2025-5-10"),
        dueType: "quarter",
        description: "Create the best most beautiful most gorgeous portfolio website oat.",
        tag: TEST_TAGS[11],
        creationDate: new Date("2025-03-01"),
        tasks: [],
        img: { 
          src: "https://i.pinimg.com/736x/3f/95/7f/3f957fd83772de7c84fd686a9bd447eb.jpg",
          type: "float-left",
          center: 50
        },
        status: "not-started",
        y_order: {
          default: 6,
          status: 6,
          tag: 0
        },
        q_order: {
         default: 1,
         status: 1,
         tag: 0
        },
        m_order: {
         default: 1,
         status: 0,
         tag: 0
        }
      },
      {
        id: "10",
        name: "Get JACKED",
        due: new Date("2025-6-10"),
        dueType: "quarter",
        description: "Chest, arms, legs, back, abs.",
        tag: TEST_TAGS[1],
        creationDate: new Date("2025-03-01"),
        tasks: [],
        img: null,
        status: "not-started",
        y_order: {  
          default: 7,
          status: 2,
          tag: 2
        },
        q_order: {
         default: 0,
         status: 2,
         tag: 1
        },
        m_order: {
         default: 0,
         status: 0,
         tag: 0
        }
      },
      {
        id: "11",
        name: "Create Sustainable Vegetable Garden",
        due: new Date("2025-07-15"),
        dueType: "day",
        description: "Develop a fully functional vegetable garden with at least 10 different types of vegetables. Learn organic gardening techniques and composting.",
        tag: TEST_TAGS[1],
        creationDate: new Date("2024-02-10"),
        tasks: [],
        status: "not-started",
        img: { 
          src: "https://i.pinimg.com/736x/c4/64/54/c46454bf75c6e3501080f5b448d497e4.jpg",
          type: "float-left",
          center: 50
        },
        y_order: {
          default: 8,
          status: 3,
          tag: 3
        },
        q_order: {
          default: 1,
          status: 0,
          tag: 1
        },
        m_order: {
          default: 0,
          status: 0,   
          tag: 0
        }
    },
      {
        id: "12",
        name: "Learn to cook soup.",
        due: new Date("2025-8-10"),
        completedDate: new Date("2025-03-19"),
        dueType: "quarter", 
        description: "Social medias for projects. Find Inspiration, create content, publish.",
        tasks: [],
        img: { 
          src: "https://i.pinimg.com/originals/05/06/36/05063693753ce6f49c6b05fa16b05b93.gif",
          type: "float-left",
          center: 50
        },
        tag: TEST_TAGS[3],
        creationDate: new Date("2025-03-01"),
        status: "accomplished",
        y_order: {
          default: 9,
          status: 2,
          tag: 1
        },
        q_order: {
          default: 0,
          status: 0,
          tag: 0
        },
        m_order: {
         default: 0,
         status: 0,
         tag: 0
        }
      },
      {
        id: "13",
        name: "Become Conversational in Spanish",
        due: new Date("2025-11-15"),
        dueType: "day",
        description: "Achieve B1 level Spanish proficiency. Use language learning apps, take weekly conversation classes, and practice with native speakers.",
        tag: TEST_TAGS[1],
        creationDate: new Date("2024-02-10"),
        tasks: [],
        status: "not-started",
        img: null,
        y_order: {
         default: 10,
         status: 4,
         tag: 4
        },
        q_order: {
         default: 0,
         status: 0,
         tag: 0
        },
        m_order: {
            default: 8,
            status: 0,
            tag: 0
        }
      }
]

export const YEARS: Record<string, YearEntry> = {
    "2025": {
        entry: {
          id: "0",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/originals/42/f3/e6/42f3e6dd32467736bdc85dc8a6038e35.gif",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Growth</strong> noun
Growth is the steady development 🌱, the progress that <i>builds gradually</i>.
It's embracing <i>challenges</i> that stretch your capabilities, the <u>transformation that happens</u> with persistence 📈.
To grow is to step outside comfort zones, to learn from setbacks, and to celebrate small victories, 💪.
It's about <i>becoming more</i>, investing in potential, and finding strength in the journey of improvement ✨.`
        },
        pinnedId: null,
        bannerImg: {
            src: "https://i.imgur.com/m2x5URb.png",
            center: 82
        },
        smallImg: "https://i.pinimg.com/736x/87/7a/f8/877af84ee302075f969be04f809a0e5f.jpg"
    },
    "2024": {
        entry: {
          id: "1",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/ef/fb/f3/effbf31760c27673d5add67fa439522d.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Exploration</strong> noun
Exploration is the curious discovery 🧭, the adventure that <i>expands horizons</i>.
It's pursuing <i>new paths</i> and unexpected opportunities, the <u>experiences that broaden</u> perspectives 🌍.
To explore is to ask deeper questions, to try unfamiliar approaches, and to welcome diverse encounters, 🔍.
It's about <i>venturing beyond</i>, embracing the unknown, and finding excitement in discovering what's possible ✨`
        },
        pinnedId: "5",
        bannerImg: {
            src: "https://i.imgur.com/mmSRFZj.png",
            center: 47
        },
        smallImg: "https://i.pinimg.com/originals/a5/cd/69/a5cd69932e2ec8fdec5cfcf063d6b3da.gif"
    },
}

export const QUARTER_ENTRIES: Record<string, PeriodEntry> = {
    "2025-Q3": {
        entry: null,
        pinnedId: "5"
    }
}

export const MONTH_ENTIRES: Record<string, PeriodEntry> = {
    "2024-12": {
        entry: {
          id: "2",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/72/44/08/724408c450ce38a7be258ed489d8c64d.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Comfort</strong> noun
Comfort is the gentle exhale 🧣, the relaxation that <i>finally arrives</i>.
It's sinking into <i>home couches</i> after months away, the <u>warmth that wraps</u> around familiar places 🏠.
To find comfort is to share family meals, to slow your pace, and to shed academic pressure, 🔥.
It's about <i>winding down</i>, reconnecting with loved ones, and finding ease in holiday rhythms ✨.
`
        },
        pinnedId: ""
    },
    "2025-1": {
        entry: {
          id: "3",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/94/c9/dc/94c9dc78c021d0e11535beca257262c9.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Fresh</strong> noun
Renewal is the fresh start 📚, the opportunity that <i>begins now</i>.
It's the blank <i>planner</i> waiting to be filled, the <u>clean slate</u> of a new semester 📅.
To renew is to set achievable goals, to approach classes with energy, and to implement better habits, 🌱.
It's about <i>starting strong</i>, meeting new classmates, and finding excitement in learning again ✨.
      `
        },
        pinnedId: "0"
    },
    "2025-2": {
        entry: {
          id: "4",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/81/3f/2d/813f2d5902d825cc520ef0f790d3a69d.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Renewal</strong> noun
Renewal is the gentle awakening 🌱, the hope that <i>blossoms softly</i>.
It's watching <i>flowers</i> emerge from dormant ground, the <u>promise that unfolds</u> in tender green 🌷.
To renew is to breathe in fresh air, to feel possibility returning, and to shed winter's heaviness, 🍃.
It's about <i>starting again</i>, embracing change, and finding joy in nature's quiet resurrection ✨.
      `
        },
        pinnedId: "3"
    },
    "2025-3": {
        entry: {
          id: "5",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/b7/d1/10/b7d11030947b7bd4d9cb619a50d654da.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Focus</strong> noun
Focus is the productive flow 🎯, the concentration that <i>gets results</i>.
It's the <i>study routine</i> that finally works, the <u>clarity of purpose</u> during midterms 📝.
To focus is to minimize distractions, to work efficiently, and to make progress toward goals, 💪.
It's about <i>being intentional</i>, prioritizing what matters, and finding satisfaction in completed work ✨
      `
        },
        pinnedId: "2"
    },
    "2025-4": {
        entry: {
          id: "6",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/72/44/08/724408c450ce38a7be258ed489d8c64d.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Growth</strong> noun
Growth is the measurable progress 📈, the improvement that <i>builds confidence</i>.
It's seeing <i>concepts</i> connect across subjects, the <u>skills developing</u> with practice 🧠.
To grow is to push beyond comfort zones, to ask questions, and to seek out challenges, 🌱.
It's about <i>embracing feedback</i>, implementing new methods, and finding yourself becoming more capable ✨.
      `
        },
        pinnedId: "9"
    },
    "2025-5": {
        entry: {
          id: "7",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/44/48/fc/4448fc485d48145e44f9abe522bb5aa0.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Freedom</strong> noun
Freedom is the well-earned break 🎉, the possibility that <i>summer brings</i>.
It's the chance to <i>explore</i> interests outside class, the <u>time to recharge</u> and reset 🌞.
To be free is to read for pleasure, to sleep without alarms, and to reconnect with hobbies, 😎.
It's about <i>finding balance</i>, enjoying downtime, and finding joy in simple pleasures ✨.
      `
        },
        pinnedId: "7"
    },
    "2025-6": {
        entry: {
          id: "8",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/7b/ce/49/7bce49a5ea4ea6e11f39de0b58976993.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Adventure</strong> noun
Adventure is the summer experience 🧭, the exploration that <i>broadens horizons</i>.
It's trying <i>new activities</i> and visiting new places, the <u>memories created</u> with friends 🚗.
To adventure is to say yes to opportunities, to step outside comfort zones, and to collect experiences, 🌍.
It's about <i>being spontaneous</i>, discovering new passions, and finding excitement in the unexpected ✨.
      `
        },
        pinnedId: null
    },
    "2025-7": {
        entry: {
          id: "9",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/72/44/08/724408c450ce38a7be258ed489d8c64d.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Serenity</strong>  noun
Serenity is the gentle stillness 🌊, the calm that <i>flows within</i>.
It's the soft glow of <i>dawn</i> breaking over quiet waters, the <u>peace that settles</u> in solitude 🌅.
To be serene is to find balance in chaos, to breathe deeply, and to rest in the present, 🍃.
It's the art of <i>letting go</i>, embracing tranquility, and finding clarity in stillness ✨.
      `
        },
        pinnedId: "4"
    },
    "2025-8": {
        entry: {
          id: "10",
            icon: {
                type: "img",
                src: "https://i.pinimg.com/736x/72/44/08/724408c450ce38a7be258ed489d8c64d.jpg",
                size: "small"
            },
            truncate: true,
            styling: "has-marker",
            text: `<strong>Preparation</strong> noun
Preparation is the excited planning 🎒, the organization that <i>creates confidence</i>.
It's setting up <i>systems</i> for success, the <u>foundation being built</u> for achievements 📋.
To prepare is to gather resources, to set semester goals, and to visualize success, 📝.
It's about <i>starting organized</i>, approaching challenges proactively, and finding calm in readiness ✨.
      `
        },
        pinnedId: "9"
    },
}
