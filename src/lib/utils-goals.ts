import { getTimeDistanceStr } from "./utils-date"
import { formatDatetoStr } from "./utils-date"

export function getDueDateDistStr(goal: Goal, type: "distance" | "date" = "distance") {
    const { due, status, dueType } = goal
    
    if (!due || status === "accomplished") {
        return { dueStr: "🤞", isLate: false }
    }

    if (type === "date") {
        if (dueType === "day") {
            return { dueStr: formatDatetoStr(due, { month: "short", day: "numeric" }), isLate: false }
        } else {
            return { dueStr: formatDatetoStr(due, { month: "short" }), isLate: false }
        }
    }

    // Distance type (default)
    const str = getTimeDistanceStr({ date: due, enforce: "d" })
    const isLate = str.includes("ago")

    if (isLate) {
        return { dueStr: "-" + str.split("ago")[0], isLate: true }
    } 
    else {
        return { dueStr: str, isLate: false }
    }
}