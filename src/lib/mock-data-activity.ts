import { GOALS } from "./mock-data-goals"

const nowMonth = new Date().getMonth()

export const ACTIVITY_DATA: DayEntry[] = [
    {
        date: new Date(2025, nowMonth, 2),
        focusMins: 145,
        habits: 0,
        goals: [
            GOALS[3],
        ],
        highlightImg: {
            src: "https://i.pinimg.com/736x/d5/ff/09/d5ff09b5043f74591b4ffeb96fc94456.jpg",
            caption: "",
        }
    },
    {
        date: new Date(2025, nowMonth, 3),
        highlightImg: null,
        focusMins: 95,
        habits: 0
    },
    {
        date: new Date(2025, nowMonth, 4),
        focusMins: 120,
        habits: 0,
        highlightImg: {
          src: "https://i.pinimg.com/736x/e1/39/43/e13943596410e71ea2f14baedb442d1d.jpg",
          caption: "",
        }
    },
    {
        date: new Date(2025, nowMonth, 5),
        habits: 3,
        focusMins: 0,
        highlightImg: {
            src: "https://i.pinimg.com/736x/5e/e0/be/5ee0bedc21c8d2d37ff39dacbda0ef1d.jpg",
            caption: "a little painting",
        }
    },
    {
        date: new Date(2025, nowMonth, 6),
        habits: 0,
        focusMins: 0,
        highlightImg: null
    },
    {
        date: new Date(2025, nowMonth, 9),
        habits: 0,
        focusMins: 0,
        highlightImg: null
    },
    {
        date: new Date(2025, nowMonth, 10),
        habits: 0,
        focusMins: 0,
        highlightImg: null,
    },
    {
        date: new Date(2025, nowMonth, 10),
        habits: 6,
        focusMins: 0,
        highlightImg: null
    },
    {
        date: new Date(2025, nowMonth, 13),
        habits: 2,
        focusMins: 0,
        highlightImg: null,
    },
    {
        date: new Date(2025, nowMonth, 16),
        habits: 0,
        focusMins: 0,
        highlightImg: null,
    },
    {
        date: new Date(2025, nowMonth, 18),
        habits: 3,
        focusMins: 0,
        highlightImg: {
            src: "https://i.pinimg.com/736x/f8/4b/f3/f84bf38f9462d6a70d8c8c1b77a1a64a.jpg",
            caption: "coding shit",
        }
    },
    {
        date: new Date(2025, nowMonth, 20),
        habits: 1,
        focusMins: 0,
        highlightImg: null
    },
    {
        date: new Date(2025, nowMonth, 23),
        habits: 4,
        focusMins: 40,
        highlightImg: null
    },
    {
        date: new Date(2025, nowMonth, 24),
        habits: 2,
        focusMins: 0,
        highlightImg: {
            src: "https://i.pinimg.com/736x/9b/91/cc/9b91cc7b70d04399c09d33d7ed8d063c.jpg",
            caption: "italian paradise",
        }
    },
    {
        date: new Date(2025, nowMonth, 26),
        habits: 5,
        focusMins: 120,
        highlightImg: null,
    },
    {
        date: new Date(2025, nowMonth, 27),
        habits: 4,
        focusMins: 0,
        highlightImg: {
            src: "https://i.pinimg.com/736x/d5/ff/09/d5ff09b5043f74591b4ffeb96fc94456.jpg",
            caption: "at the museum 🌷",
        }
    },
    {
        date: new Date(2025, nowMonth, 28),
        habits: 1,
        focusMins: 0,
        highlightImg: null,
    },
    {
        date: new Date(2025, nowMonth, 30),
        habits: 2,
        focusMins: 95,
        highlightImg: {
            src: "https://i.pinimg.com/736x/ef/fb/f3/effbf31760c27673d5add67fa439522d.jpg",
            caption: "atop the mountains 🌤️",
        }
    },
    {
        date: new Date(2025, nowMonth, 31),
        habits: 2,
        focusMins: 0,
        highlightImg: null
    },
    {
        date: new Date(2025, nowMonth, 14),
        habits: 4,
        focusMins: 0,
        highlightImg: null,
        goals: [
          GOALS[0],
        ]
    },
    {
        date: new Date(2025, nowMonth, 15),
        habits: 5,
        focusMins: 0,
        highlightImg: null,
        goals: [
          GOALS[2],
        ]
    },
    {
        date: new Date(2025, nowMonth, 25),
        habits: 3,
        focusMins: 120,
        highlightImg: {
            src: "https://i.pinimg.com/736x/5c/37/a0/5c37a01f26fff8bae726e0a6e527bcae.jpg",
            caption: "getting used to pastels"
        },
        goals: [
          GOALS[7],
          GOALS[4],
          GOALS[2],
        ]
    },
    {
        date: new Date(2025, nowMonth, 29),
        habits: 1,
        focusMins: 30,
        highlightImg: null,
        goals: [
        GOALS[1],
        ]
    }
  ]