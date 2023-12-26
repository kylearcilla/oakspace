import { GoalStatus } from "./enums";

export const YR_CONTAINER_ID = "goals-hist-yr-info-container"
export const YR_DIGIT_CLASS = "goals-history__year-view-yr-digit"
export const YR_DIGIT_ANIMATION = "fade-in-digit 0.32s cubic-bezier(.5,.84,.42,.9) forwards 1"

export const goals: Goal[] = [
    {
        id: "",
        tag: {
            color: "#",
            name: "French",
            symbol: "🇫🇷"
        },
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
        idx: 0
    },
    {
        id: "",
        tag: {
            color: "#",
            name: "French",
            symbol: "🇫🇷"
        },
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
        idx: 0
    },
    {
        id: "",
        tag: {
            color: "#",
            name: "French",
            symbol: "🇫🇷"
        },
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
        idx: 1
    },
    {
        id: "",
        tag: {
            color: "#",
            name: "French",
            symbol: "🇫🇷"
        },
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
        idx: 2
    },
    {
        id: "",
        tag: {
            color: "#",
            name: "French",
            symbol: "🇫🇷"
        },
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
        idx: 1
    },
    {
        id: "",
        tag: {
            color: "#",
            name: "French",
            symbol: "🇫🇷"
        },
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
                endDate: null
            },
            {
                title: "Fart 1",
                id: "",
                idx: 1,
                endDate: null
            },
            {
                title: "Fart 2",
                id: "",
                idx: 2,
                endDate: null
            },
            {
                title: "Fart 3",
                id: "",
                idx: 3,
                endDate: null
            },
            {
                title: "Start Reading 'The Great Gatsby",
                id: "",
                idx: -1,
                endDate: new Date(2022, 7, 8)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                endDate: new Date(2021, 2, 8)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                endDate: new Date(2021, 9, 8)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                endDate: new Date(2021, 5, 2)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                endDate: new Date(2021, 4, 22)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                endDate: new Date(2021, 3, 19)
            },
            {
                title: "Begin Yoga and Meditation Practice",
                id: "",
                idx: -1,
                endDate: new Date(2021, 2, 1)
            },
        ],
        idx: 0
    },
    {
        id: "",
        tag: {
            color: "#",
            name: "French",
            symbol: "🇫🇷"
        },
        title: "Complete \"Atomic Habits\" by James Clear",
        description: "Read and finish the book \"Atomic Habits\" by James Clear to gain insights into building positive habits, breaking bad ones, and mastering the tiny behaviors that lead to remarkable results.",
        dueDate: new Date(),
        creationDate: new Date(),
        imgSrc: "https://cdn.dribbble.com/userupload/11651096/file/original-acf2c0c9527c1c6598b4647be67e9fe1.png?resize=752x",
        isImgHidden: true,
        accomplishedDate: null,
        status: GoalStatus.OnHold,
        milestonesDone: 0,
        milestones: [],
        idx: 2
    },
    {
        id: "",
        tag: {
            color: "#",
            name: "French",
            symbol: "🇫🇷"
        },
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
        idx: 3
    },
]