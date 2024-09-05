import { sessionManager } from "$lib/store"
import { redirect } from "@sveltejs/kit"
import { get } from "svelte/store"

export function load() {
    const hasSession = get(sessionManager)

    if (!hasSession) {
        throw redirect(301, "/home")
    }
}
