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

/* Goals */
export const TEST_GOALS: Goal[] = [
    {
        id: "",
        tag: TEST_TAGS[0],
        title: "Secure Admission to Medical School",
        description: "Pursue the goal of gaining admission to a reputable medical school by diligently preparing for and completing all necessary prerequisites, achieving a competitive GPA, excelling in standardized exams (such as the MCAT), participating in meaningful extracurricular activities, and submitting a compelling application. Seek guidance from mentors, gather strong letters of recommendation, and craft a personal statement that reflects dedication to the medical profession. Stay informed about the application process, deadlines, and requirements of various medical schools, and approach interviews with confidence and authenticity. This goal reflects the commitment to academic excellence, personal growth, and the pursuit of a lifelong career in medicine.",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "",
        isImgHidden: true,
        accomplishedDate: null,
        status: GoalStatus.Accomplished,
        milestonesDone: 0,
        milestones: [],
        idx: 0,
        globalIdx: 0,
        sectionId: 0,
        sectionIdx: 0,
        isArchived: false,
        isPinned: true
    },
    {
        id: "",
        tag: TEST_TAGS[0],
        title: "Complete Clinical Clerkships with Honors",
        description: "Excel in clinical clerkships by consistently earning honors, showcasing a strong understanding of clinical skills, patient care, and medical knowledge.",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "",
        isImgHidden: true,
        accomplishedDate: null,
        status: GoalStatus.InProgress,
        milestonesDone: 0,
        milestones: [],
        idx: 0,
        globalIdx: 0,
        sectionId: 0,
        sectionIdx: 1,
        isArchived: false,
        isPinned: true,
    },
    {
        id: "",
        tag: TEST_TAGS[0],
        title: "Complete ACLS Certification",
        description: "Obtain and successfully complete the Advanced Cardiac Life Support (ACLS) certification, enhancing skills in managing cardiovascular emergencies and critical care situations.",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "",
        isImgHidden: true,
        accomplishedDate: null,
        status: GoalStatus.InProgress,
        milestonesDone: 0,
        milestones: [],
        idx: 1,
        globalIdx: 0,
        sectionId: 1,
        sectionIdx: 0,
        isArchived: false,
        isPinned: true,
    },
    {
        id: "",
        tag: TEST_TAGS[0],
        title: "Secure Residency Placement",
        description: "Successfully secure a residency position in the desired specialty to further specialize and gain practical experience.",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "",
        isImgHidden: true,
        accomplishedDate: null,
        status: GoalStatus.InProgress,
        milestonesDone: 0,
        milestones: [],
        idx: 2,
        globalIdx: 0,
        sectionId: 1,
        sectionIdx: 1,
        isArchived: false,
        isPinned: true,
    },
    {
        id: "",
        tag: TEST_TAGS[0],
        title: "Achieve 30 Consecutive Days of Meditation",
        description: "Establish a daily meditation practice and strive to achieve a continuous streak of 30 days, focusing on mindfulness, relaxation, and mental clarity.",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "",
        isImgHidden: true,
        accomplishedDate: null,
        status: GoalStatus.OnHold,
        milestonesDone: 0,
        milestones: [],
        idx: 1,
        globalIdx: 0,
        sectionId: 0,
        sectionIdx: 2,
        isArchived: false,
        isPinned: true,
    },
    {
        id: "",
        tag: TEST_TAGS[0],
        title: "High on USMLE Step 2",
        description: "Prepare rigorously and achieve a high score in the USMLE Step 2 to demonstrate clinical knowledge and readiness for residency.",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "https://i.pinimg.com/564x/a0/46/8c/a0468c8e70e483370acc91542be90808.jpg",
        isImgHidden: false,
        accomplishedDate: null,
        status: GoalStatus.OnHold,
        milestonesDone: 7,
        milestones: [
            {
                title: "Complete Introduction to JavaScript Course",
                id: "",
                idx: 0,
                description: "",
                isChecked: false,
                date: null
            },
            {
                title: "Fart 1",
                id: "",
                idx: 1,
                description: "",
                isChecked: false,
                date: null
            },
            {
                title: "Fart 2",
                id: "",
                idx: 2,
                description: "",
                isChecked: false,
                date: null
            },
            {
                title: "Fart 3",
                id: "",
                idx: 3,
                description: "",
                isChecked: false,
                date: null
            },
            {
                title: "Start Reading 'The Great Gatsby",
                id: "",
                idx: -1,
                description: "",
                isChecked: false,
                date: new Date(2022, 7, 8)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                description: "",
                isChecked: false,
                date: new Date(2021, 2, 8)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                description: "",
                isChecked: false,
                date: new Date(2021, 9, 8)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                description: "",
                isChecked: false,
                date: new Date(2021, 5, 2)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                description: "",
                isChecked: false,
                date: new Date(2021, 4, 22)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                description: "",
                isChecked: false,
                date: new Date(2021, 3, 19)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                description: "",
                isChecked: false,
                date: new Date(2021, 2, 1)
            },
        ],
        idx: 0,
        globalIdx: 0,
        sectionId: 2,
        sectionIdx: 1,
        isArchived: false,
        isPinned: true,
    },
    {
        id: "",
        tag: TEST_TAGS[0],
        title: "Complete \"Atomic Habits\" by James Clear",
        description: "Read and finish the book \"Atomic Habits\" by James Clear to gain insights into building positive habits, breaking bad ones, and mastering the tiny behaviors that lead to remarkable results.",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "https://i.pinimg.com/564x/ea/9d/b2/ea9db2d3d08731c07802c37cbe4c2930.jpg",
        isImgHidden: true,
        accomplishedDate: null,
        status: GoalStatus.OnHold,
        milestonesDone: 0,
        milestones: [],
        idx: 2,
        globalIdx: 0,
        sectionId: 0,
        sectionIdx: 3,
        isArchived: false,
        isPinned: true,
    },
    {
        id: "",
        tag: TEST_TAGS[0],
        title: "Run a 5K in Under 25 Minutes",
        description: "Train regularly to improve running speed and endurance, with the specific goal of completing a 5K run in under 25 minutes",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "",
        isImgHidden: true,
        accomplishedDate: null,
        status: GoalStatus.InProgress,
        milestonesDone: 0,
        milestones: [],
        idx: 3,
        globalIdx: 0,
        sectionId: 2,
        sectionIdx: 0,
        isArchived: false,
        isPinned: true,
    },
]

/* Sessions */
export const TEST_SESSIONS: Session[] = []