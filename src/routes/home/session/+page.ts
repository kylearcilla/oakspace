import { sessionManager } from "$lib/store"
import { redirect } from "@sveltejs/kit"
import { get } from "svelte/store"

export function load() {
    const session = get(sessionManager)
    const notAllow = !session || session.state === "done"

    if (notAllow) {
        throw redirect(301, "/home")
    }
}
