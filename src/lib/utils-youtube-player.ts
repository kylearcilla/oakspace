import { get } from "svelte/store"
import { ErrorCode } from "./enums"
import { ytPlayerStore } from "./store"
import { createYtErrorToastMsg, initYtPlayer } from "./utils-youtube"

/**
 * Update options list depening on presence of a logged in user.
 * @param options   Curent options list in Youtube playlist panel (under video details)
 */
export const initYoutubePlayerView = (options: string[]) => {
    options[0] = localStorage.getItem('yt-pl') ? "Log Out" : "Log In"
}

/**
 * Show private playlist message and create a toast when there has been a failed request for a privated playlist.
 * @param isPlaylistPrivate    Current state variable to be changed.
 * @returns                    Check to see if there a private playlist has been selected.
 */
export const ytPlayerErrorHandler = (isPlaylistPrivate: boolean): boolean => {
    const ytPlayer = get(ytPlayerStore)!

    if (!ytPlayer?.error) {
        return false
    }
    if (!isPlaylistPrivate && ytPlayer?.error?.code != null && ytPlayer.error.code === ErrorCode.YT_PRIVATE_PLAYLIST) {
        createYtErrorToastMsg(ytPlayer.error)
        return true
    }

    return isPlaylistPrivate
}