import { get } from "svelte/store"
import { ytPlayerStore } from "./store"
import { createYtErrorToastMsg } from "./utils-youtube"
import { ResourceNotFoundError } from "./errors"

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

    if (!ytPlayer?.error) return false
    createYtErrorToastMsg(ytPlayer.error)

    if (!isPlaylistPrivate && ytPlayer.error instanceof ResourceNotFoundError) {
        return true
    }
    return isPlaylistPrivate
}

export const didInitYtPlayer = (): boolean => {
    return localStorage.getItem("yt-player-data") != null
}

export const loadYtPlayerData = (): YoutubePlayerData | null => {
    const res = localStorage.getItem('yt-player-data')
    if (!res) return null

    return JSON.parse(res)
}

export const saveYtPlayerData = (newData: YoutubePlayerData) => {
    localStorage.setItem('yt-player-data', JSON.stringify(newData))
}

export const deleteYtPlayerData = () => {
    localStorage.removeItem('yt-player-data')
}