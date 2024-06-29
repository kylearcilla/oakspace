import YT_PLAYLIST_GROUPS from "$lib/data-yt-playlists"
import { initTestYTGroups } from "$lib/utils-youtube"
import type { PageLoad } from "../$types"

export const ssr = false

export const load = (async () => {
    (window as any).LUCIOLE = {}

    const isDev = import.meta.env.MODE === "development"

    if (isDev) {
        return { 
            ytPlaylists: initTestYTGroups(YT_PLAYLIST_GROUPS) 
        }
    }
    else {
        return { 
            ytPlaylists: YT_PLAYLIST_GROUPS 
        }
    }
}) satisfies PageLoad