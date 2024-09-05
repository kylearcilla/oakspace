import { get } from "svelte/store"
import { globalContext } from "./store"

import { updateGlobalContext } from "./utils-home"
import { SessionManager } from "./session-manager"

export const MAX_SESSION_NAME_LENGTH = 200

/**
 * Continue work session after a refresh.
 */
export function conintueWorkSession() {
    new SessionManager()
}

export function updateTotalFocusTime(focus: number) {
    const total = get(globalContext)!.focusTime + focus
    updateGlobalContext({ focusTime: total })
}

export function didInitSession() {
    return localStorage.getItem("session") != null
}
