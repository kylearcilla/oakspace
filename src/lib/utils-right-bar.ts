export const TEST_TASKS: Task[] = [
    {
        id: "0",
        idx: 0,
        title: "Finish A Game of Thrones",
        subtasks: [],
        description: "",
        isChecked: false
    },
    {
        id: "1",
        idx: 1,
        title: "Prepare for Math Exam",
        subtasks: [
            {
                title: "Review Lecture Notes",
                isChecked: false,
                id: "a",
                idx: 0,
                parentId: "1"
            },
            {
                title: "Practice Problems",
                isChecked: true,
                id: "aa",
                idx: 1,
                parentId: "1"
            }
        ],
        description: "Study for the upcoming calculus exam.",
        isChecked: false
    },
    {
        id: "2",
        idx: 2,
        title: "Complete History Essay",
        subtasks: [
            {
                title: "Research",
                isChecked: false,
                id: "x",
                idx: 0,
                parentId: "2"
            },
            {
                title: "Draft Outline",
                isChecked: false,
                id: "xx",
                idx: 1,
                parentId: "3"
            },
            {
                title: "Get ball scratcher",
                isChecked: false,
                id: "xxx",
                idx: 2,
                parentId: "4"
            },
        ],
        description: "Write a 1500-word essay on the Industrial Revolution.",
        isChecked: false
    },
    {
        id: "3",
        idx: 3,
        title: "Biology Lab Report",
        subtasks: [
            {
                title: "Get Analyze Data",
                isChecked: false,
                id: "f",
                idx: 0,
                parentId: "3"
            },
            {
                title: "Write Report",
                isChecked: false,
                id: "ff",
                idx: 1,
                parentId: "3"
            },
            {
                title: "Proof Read",
                isChecked: false,
                id: "fff",
                idx: 2,
                parentId: "3"
            },
        ],
        description: "Write a report on the recent biology lab experiment.",
        isChecked: false
    },
    {
        id: "4",
        idx: 4,
        title: "Grocery Shopping",
        subtasks: [
            {
                title: "Snacks",
                isChecked: false,
                id: "t",
                idx: 0,
                parentId: "3"
            },
            {
                title: "Beer",
                isChecked: false,
                id: "tt",
                idx: 1,
                parentId: "3"
            },
            {
                title: "Water",
                isChecked: false,
                id: "ttt",
                idx: 2,
                parentId: "3"
            },
            {
                title: "Paper Towel",
                isChecked: false,
                id: "ttt",
                idx: 3,
                parentId: "3"
            },
            {
                title: "Napkins",
                isChecked: false,
                id: "tttt",
                idx: 4,
                parentId: "3"
            }
        ],
        description: "zzoizoiwjsef",
        isChecked: false
    },
    {
        id: "5",
        idx: 5,
        title: "Workout",
        subtasks: [
            {
                title: "Cario Session",
                isChecked: false,
                id: "ttt",
                idx: 0,
                parentId: "q"
            },
            {
                title: "Stretching",
                isChecked: false,
                id: "ttt",
                idx: 1,
                parentId: "qq"
            },
            {
                title: "Strength Training",
                isChecked: false,
                id: "ttt",
                idx: 2,
                parentId: "qqq"
            },
        ],
        description: "Work out the legzzz.",
        isChecked: false
    },
    {
        id: "6",
        idx: 6,
        title: "Plan Weekend Trip",
        subtasks: [
            {
                title: "Choose Destination",
                isChecked: false,
                id: "ttt",
                idx: 0,
                parentId: "y"
            },
            {
                title: "Book Accommodation",
                isChecked: false,
                id: "ttt",
                idx: 1,
                parentId: "yy"
            },
            {
                title: "Pack Bags",
                isChecked: false,
                id: "ttt",
                idx: 2,
                parentId: "yyy"
            }
        ],
        description: "Organize a short weekend getaway.",
        isChecked: false
    },
    {
        id: "7",
        idx: 7,
        title: "Find a Summer Internship",
        subtasks: [
            {
                title: "Research Potential Companies",
                isChecked: false,
                id: "t",
                idx: 0,
                parentId: "0"
            },
            {
                title: "Narow down Companies",
                isChecked: false,
                id: "tt",
                idx: 1,
                parentId: "1"
            },
            {
                title: "Research desired companies.",
                isChecked: false,
                id: "ttt",
                idx: 2,
                parentId: "2"
            },
            {
                title: "Do mock interviews.",
                isChecked: false,
                id: "tttt",
                idx: 3,
                parentId: "3"
            }
        ],
        description: "Find a marketing internship (ideally tech).",
        isChecked: false
    },
]