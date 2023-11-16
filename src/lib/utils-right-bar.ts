export let TASK_DESCR_LINE_HT = 15
export let TASK_BOTTOM_PADDING = 7
export let SUBTASK_HEIGHT = 15

export let TASK_HEIGHT_MIN_NO_DESCR = 28
export let TASK_HEIGHT_MIN_HAS_DESCR = TASK_HEIGHT_MIN_NO_DESCR + TASK_DESCR_LINE_HT

export let MAX_TITLE_LENGTH = 25
export let MAX_TAK_GROUP_TITLE_LENGTH = 10
export let MAX_DESCRIPTION_LENGTH = 300
export let MAX_X_CONTEXT_MENU_POS = 70

export let tasks = [
    {
        title: "Balls",
        subtasks: [
            {
                title: "Get ball scratcher",
                isFinished: false
            }
        ],
        description: "Scarth my balls.             Scratch my balls. Scarth my balls. Scratch my balls Scarth my balls.  Scratch my balls Scarth my balls  Scratch my balls Scarth my balls  Scratch my balls Scarth my balls  Scratch my balls Scarth my balls",
        isFinished: false
    },
    {
        title: "Balls",
        subtasks: [
            {
                title: "Get ball scratcher",
                isFinished: false
            },
            {
                title: "Get ball scratcher",
                isFinished: false
            },
            {
                title: "Get ball scratcher",
                isFinished: false
            },
            {
                title: "Get ball scratcher",
                isFinished: false
            },
            {
                title: "Get ball scratcher",
                isFinished: false
            },
            {
                title: "Get ball scratcher",
                isFinished: false
            },
            {
                title: "Get ball scratcher",
                isFinished: false
            },
            {
                title: "Get ball scratcher",
                isFinished: false
            },
        ],
        description: "woweirfjuwoirfweuoewir owieruoweiru weoriwueor wier woeiruwoeiruwr98wyeur we orwiuroweiu",
        isFinished: false
    },
    {
        title: "Fart",
        subtasks: [
            {
                title: "Empty Gas",
                isFinished: true
            },
            {
                title: "Eat more Tac Bell",
                isFinished: false
            },
        ],
        description: "Empty Stomach",
        isFinished: false
    },
    {
        title: "Read War and Peace",
        subtasks: [
            {
                title: "Take Notes",
                isFinished: true
            },
        ],
        description: "Learn things.",
        isFinished: true
    },
    {
        title: "Read War and Peace",
        subtasks: [],
        description: "Learn things.",
        isFinished: false
    },
    {
        title: "Read War and Peace",
        subtasks: [],
        description: "",
        isFinished: false
    },
    {
        title: "Balls Part 2",
        subtasks: [],
        description: "woweirfjuwoirfweuoewir owieruoweiru weoriwueor wier woeiruwoeiruwr98wyeur we orwiuroweiu",
        isFinished: false
    },
    {
        title: "Balls Part 3",
        subtasks: [
            {
                title: "Take Notes",
                isFinished: true
            },
        ],
        description: "",
        isFinished: false
    },
]
export let taskGroups = [
    "SWE", "School", "Art", "Reading"
]
