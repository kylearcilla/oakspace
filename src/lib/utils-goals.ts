import { GoalStatus } from "./enums"

export const MAX_GOAL_TITLE_LENGTH = 100
export const MAX_GOAL_DESCRIPTION_LENGTH = 450

export function getStatusString(status: GoalStatus) {
    if (status === GoalStatus.InProgress) {
        return "In Progress"
    }
    else if (status === GoalStatus.OnHold) {
        return "On Hold"
    }
    else {
        return "Accomplished"
    }
}

export const TEST_MILESTONES: Milestone[] = [
    {
        title: "Complete Introduction to JavaScript Course",
        id: "0",
        idx: 0,
        date: null,
        description: "",
        isChecked: false
    },
    {
        title: "Fart 1",
        id: "1",
        idx: 1,
        date: null,
        description: "",
        isChecked: false
    },
    {
        title: "Fart 2",
        id: "2",
        idx: 2,
        date: null,
        description: "",
        isChecked: false
    },
]

export const accomplishments2021: YrAccomplishmentsOverview = {
    newGoals: 4,
    milestonesReached: 4,
    goalsAccomplished: 4,
    accomplishments: [
        {
            title: "Complete Introduction to JavaScript Course",
            date: new Date(2021, 0, 15),
            tagRef: {
                id: "",
                title: "Web Dev",
                symbol: "🌐",
                color: "#FBDB67",
            },
            goalRef: {
                id: "",
                title: "JS"
            },
            isMilestone: true
        },
        {
            title: "Start Reading 'The Great Gatsby",
            date: new Date(2021, 2, 8),
            tagRef: {
                id: "",
                title: "Reading",
                symbol: "📖",
                color: "#FFC4A3",
            },
            goalRef: {
                id: "",
                title: "Great Gatsby"
            },
            isMilestone: true
        },
        {
            title: "Pass the LSAT",
            date: new Date(2021, 5, 21),
            tagRef: {
                id: "",
                title: "Law Career",
                symbol: "⚖️",
                color: "#C4D1D3",
            },
            goalRef: {
                id: "",
                title: "Pass the LSAT"
            },
            isMilestone: false
        },
        {
            title: "Begin Yoga and Meditation Practice",
            date: new Date(2021, 8, 5),
            tagRef: {
                id: "",
                title: "Meditation",
                symbol: "🧘🏼‍♂️",
                color: "#CD8075",
            },
            goalRef: {
                id: "",
                title: "Yoga"
            },
            isMilestone: true
        },
        {
            title: "Complete 50% of Web Development Project",
            date: new Date(2021, 11, 10),
            tagRef: {
                id: "",
                title: "Web Dev",
                symbol: "🌐",
                color: "#FBDB67",
            },
            goalRef: {
                id: "",
                title: "JS"
            },
            isMilestone: true
        },
        {
            title: "Complete ACLS Certification",
            date: new Date(2021, 6, 22),
            tagRef: {
                id: "",
                title: "Med Career",
                symbol: "😷",
                color: "#C5D7F9",
            },
            goalRef: {
                id: "",
                title: "Complete ACLS Certification"
            },
            isMilestone: false
        },
        {
            title: "Secure Residency Placement",
            date: new Date(2021, 11, 25),
            tagRef: {
                id: "",
                title: "Med Career",
                symbol: "😷",
                color: "#C5D7F9",
            },
            goalRef: {
                id: "",
                title: "Secure Residency Placement"
            },
            isMilestone: false
        },
        {
            title: "Run a 5K in Under 25 Minutes",
            date: new Date(2023, 2, 18),
            tagRef: {
                id: "",
                title: "Fitness",
                symbol: "🏃‍♂️",
                color: "#D7C0A5",
            },
            goalRef: {
                id: "",
                title: "Complete my First Marathon"
            },
            isMilestone: true
        },
        {
            title: "Complete \"Atomic Habits\" by James Clear",
            date: new Date(2023, 6, 10),
            tagRef: {
                id: "",
                title: "Reading",
                symbol: "📖",
                color: "#C8C3B1",
            },
            goalRef: {
                id: "",
                title: "Complete \"Atomic Habits\" by James Clear"
            },
            isMilestone: false
        },
        {
            title: "Complete Online Course on Graphic Design",
            date: new Date(2023, 10, 3),
            tagRef: {
                id: "",
                title: "Web Dev",
                symbol: "🌐",
                color: "#FBDB67",
            },
            goalRef: {
                id: "",
                title: "Graphic Design"
            },
            isMilestone: true
        },
        {
            title: "Participate in a Coding Hackathon",
            date: new Date(2021, 2, 19),
            tagRef: {
                id: "",
                title: "SWE",
                symbol: "👨‍💻",
                color: "#FFA06A",
            },
            goalRef: {
                id: "",
                title: "Participate in a Coding Hackathon"
            },
            isMilestone: false
        },
        {
            title: "Explore Healthy Cooking Recipes",
            date: new Date(2021, 7, 12),
            tagRef: {
                id: "",
                title: "Cooking",
                symbol: "🥘",
                color: "#FFA3AE",
            },
            goalRef: {
                id: "",
                title: "Cook Healthy Food"
            },
            isMilestone: true
        },
        {
            title: "Read a Book on Artificial Intelligence",
            date: new Date(2021, 10, 30),
            tagRef: {
                id: "",
                title: "SWE",
                symbol: "👨‍💻",
                color: "#FFA06A",
            },
            goalRef: {
                id: "",
                title: "Learn About AI"
            },
            isMilestone: true
        }
    ]
}
export const accomplishments2022: YrAccomplishmentsOverview = {
    newGoals: 4,
    milestonesReached: 0,
    goalsAccomplished: 0,
    accomplishments: []
}
export const accomplishments2023: YrAccomplishmentsOverview = {
    newGoals: 4,
    milestonesReached: 4,
    goalsAccomplished: 4,
    accomplishments: [
        {
            title: "Run a 5K in Under 25 Minutes",
            date: new Date(2023, 2, 18),
            tagRef: {
                id: "",
                title: "Fitness",
                symbol: "🏃‍♂️",
                color: "#D7C0A5",
            },
            goalRef: {
                id: "",
                title: "Complete my First Marathon"
            },
            isMilestone: true
        },
        {
            title: "Complete \"Atomic Habits\" by James Clear",
            date: new Date(2023, 6, 10),
            tagRef: {
                id: "",
                title: "Reading",
                symbol: "📖",
                color: "#C8C3B1",
            },
            goalRef: {
                id: "",
                title: "Complete \"Atomic Habits\" by James Clear"
            },
            isMilestone: false
        },
        {
            title: "Complete Online Course on Graphic Design",
            date: new Date(2023, 10, 3),
            tagRef: {
                id: "",
                title: "Web Dev",
                symbol: "🌐",
                color: "#FBDB67",
            },
            goalRef: {
                id: "",
                title: "Graphic Design"
            },
            isMilestone: true
        },
        {
            title: "Participate in a Coding Hackathon",
            date: new Date(2023, 2, 19),
            tagRef: {
                id: "",
                title: "SWE",
                symbol: "👨‍💻",
                color: "#FFA06A",
            },
            goalRef: {
                id: "",
                title: "Participate in a Coding Hackathon"
            },
            isMilestone: false
        },
        {
            title: "Explore Healthy Cooking Recipes",
            date: new Date(2023, 7, 12),
            tagRef: {
                id: "",
                title: "Cooking",
                symbol: "🥘",
                color: "#FFA3AE",
            },
            goalRef: {
                id: "",
                title: "Cook Healthy Food"
            },
            isMilestone: true
        },
        {
            title: "Read a Book on Artificial Intelligence",
            date: new Date(2023, 10, 30),
            tagRef: {
                id: "",
                title: "SWE",
                symbol: "👨‍💻",
                color: "#FFA06A",
            },
            goalRef: {
                id: "",
                title: "Learn About AI"
            },
            isMilestone: true
        },
        {
            title: "Complete Home Workout Challenge",
            date: new Date(2023, 1, 9),
            tagRef: {
                id: "",
                title: "Fitness",
                symbol: "🏃‍♂️",
                color: "#D7C0A5",
            },
            goalRef: {
                id: "",
                title: "Complete Home Workout Challenge"
            },
            isMilestone: false
        },
        {
            title: "Start a Blog on Personal Development",
            date: new Date(2023, 5, 5),
            tagRef: {
                id: "",
                title: "Fitness",
                symbol: "🏃‍♂️",
                color: "#D7C0A5",
            },
            goalRef: {
                id: "",
                title: "Start a Blog on Personal Development"
            },
            isMilestone: false
        },
        {
            title: "Achieve 30 Days of Continuous Coding Practice",
            date: new Date(2023, 9, 20),
            tagRef: {
                id: "",
                title: "SWE",
                symbol: "👨‍💻",
                color: "#FFA06A",
            },
            goalRef: {
                id: "",
                title: "Make Coding a Hoby"
            },
            isMilestone: true
        },
        {
            title: "Cook and Master a Signature Dish",
            date: new Date(2021, 1, 3),
            tagRef: {
                id: "",
                title: "Cooking",
                symbol: "🥘",
                color: "#FFA3AE",
            },
            goalRef: {
                id: "",
                title: "Cook and Master a Signature Dish"
            },
            isMilestone: false
        },
        {
            title: "Learn Spanish Pronouns",
            date: new Date(2021, 5, 29),
            tagRef: {
                id: "",
                title: "Spanish",
                symbol: "🇪🇸",
                color: "#FFA06A",
            },
            goalRef: {
                id: "",
                title: "Master Spanish Basics"
            },
            isMilestone: true
        },
        {
            title: "Learn French Pronouns",
            date: new Date(2023, 3, 8),
            tagRef: {
                id: "",
                title: "French",
                symbol: "🇫🇷",
                color: "#A3C2FF",
            },
            goalRef: {
                id: "",
                title: "Master French Basics"
            },
            isMilestone: true
        },
        {
            title: "Learn German Pronouns",
            date: new Date(2023, 7, 18),
            tagRef: {
                id: "",
                title: "German",
                symbol: "🇩🇪",
                color: "#D6FFAE",
            },
            goalRef: {
                id: "",
                title: "Master German Basics"
            },
            isMilestone: true
        },
    ]
}