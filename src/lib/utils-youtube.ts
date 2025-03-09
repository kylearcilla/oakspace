import { get } from "svelte/store"
import { ytUserStore, ytPlayerStore } from "./store"

import { APIError, ResError } from "./errors"
import { toast } from "./utils-toast"
import { YoutubePlayer } from "./youtube-player"
import { APIErrorCode, LogoIcon } from "./enums"
import { YoutubeUserData } from "./youtube-user-data"
import { capitalize, toastApiErrorHandler } from "./utils-general"
import { getPlayListItemsDetails, getPlaylistDetails, getVidDetails } from "./api-youtube"
import { getOAuthRedirectData } from "./utils-home"

class ValidateError extends ResError<ValidateErrorCode> { }

enum ValidateErrorCode {
    UNEMBEDDABLE, EMPTY, PRIVATE,GENERAL
}

export const INIT_PLAYLIST_REQUEST_DELAY = 1000
export const USER_PLS_MAX_PER_REQUEST = 15

export async function initYoutubePlayer() {
    const ytPlayer = new YoutubePlayer()

    await ytPlayer.initYtPlayer()
    return ytPlayer
}

export function logoutYoutubeUser() {
    get(ytUserStore)?.quit()
}

export function exitYoutubePlayer() {
    logoutYoutubeUser()

    get(ytPlayerStore)?.quit()
}

/**
 * Update currently playing item.
 * 
 * @returns If operation was successful (no error and item is playable).
 */
export async function handleChooseItem(id: string, type: "video" | "playlist") {
    let player = get(ytPlayerStore)
    let hasInitPlayer = player != null
    let item: YoutubeVideo | YoutubePlaylist | null = null
    
    player ??= await initYoutubePlayer()

    if (type === "video") {
        item = await validateGetVideo(id)
    }
    else if (type === "playlist" && await validateYtPlaylist(id)) {
        item = await getPlaylistDetails(id)
    }
    if (!item) {
        return false
    }
    setTimeout(() => {
        if (type === "playlist") {
            player.playPlaylist(item as YoutubePlaylist)
        }
        else {
            player.playVideo(item as YoutubeVideo)
        }

    // first time playing after initalized, player takes a bit to start working
    }, hasInitPlayer ? 0 : 2000)

    return true
}

export function youtubeAPIErrorHandler(error: APIError) {
    toastApiErrorHandler({ 
        error, 
        logoIcon: LogoIcon.Youtube,
        title: "Youtube"
    })
}

export function initToast(message: string) {
    toast("default", {
        icon: LogoIcon.Youtube,
        message: "Youtube",
        description: message
    })
}

/**
 * @returns User has initialized a session before
 */
export function initYtUserData() {
    const oauthData = getOAuthRedirectData("yt")
    const data = localStorage.getItem("yt-user-data")
  
    if (oauthData) {
         new YoutubeUserData({ context: "init" })
    }
    else if (data) {
         new YoutubeUserData({ context: "continue" })
    }
}

/**
 * Ensure that the video will be embeddable and playable.
 * It cannot be:
 * 
 *  1. Video is private.
 *  2. Video is unembeddable.
 * 
 * @param     videoId
 * @returns   Video details
 */
export async function validateGetVideo(videoId: string) {
    try {
        const vid = await getVidDetails(videoId)
            
        if (!vid) {
            validateErrorHandler({ code: ValidateErrorCode.PRIVATE, context: "video" })
            return null
        }
        
        if (vid.embeddable != undefined && !vid.embeddable) {
            validateErrorHandler({ code: ValidateErrorCode.UNEMBEDDABLE, context: "video" })
            return null
        } 

        return vid
    }
    catch(e: any) {
        console.error(e)
        const code = e?.code

        // api will throw 404 if video is private / unembedable / invalid id.
        if (code === APIErrorCode.RESOURCE_NOT_FOUND) {
            validateErrorHandler({ code: ValidateErrorCode.GENERAL, context: "video" })
        }
        else {
            validateErrorHandler({ code: ValidateErrorCode.PRIVATE, context: "video" })
        }
        return null
    }
}

/**
 * Ensure that the playlist will be embeddable and playable.
 * It cannot be:
 * 
 *  1. Playlist is private.
 *  2. Playlist is unembeddable.
 *  3. Playlist is public but first video is private
 *  4. Playlist is public but first video is unembeddable.
 * 
 * @param     playlistId 
 * @returns   If playlist is valid to play via iFrame API
 */
export async function validateYtPlaylist(playlistId: string) {
    try {
        const res = await getPlayListItemsDetails({ playlistId })

        if (res.playlistLength === 0) {
            validateErrorHandler({ code: ValidateErrorCode.EMPTY })
            return false
        }

        // vid id that start with a "-" in a playlist are private, but the playlist is still playable
        // allow iframe to show error
        const firstVidId = res.videos[0].id
        if (firstVidId.startsWith("-")) {
            return true
        }

        const firstVidDetails = await getVidDetails(firstVidId)
        
        if (!firstVidDetails) {
            validateErrorHandler({ code: ValidateErrorCode.PRIVATE })
            return false
        }
        
        if (firstVidDetails.embeddable != undefined && !firstVidDetails.embeddable) {
            validateErrorHandler({ code: ValidateErrorCode.UNEMBEDDABLE })
            return false
        }

        return true
    }
    catch(e: any) {
        console.error(e)
        const code = e?.code

        // api will throw 404 if playlist is private / unembedable / invalid id.
        if (code === APIErrorCode.RESOURCE_NOT_FOUND) {
            validateErrorHandler({ code: ValidateErrorCode.GENERAL })
        }
        else {
            validateErrorHandler({ code: ValidateErrorCode.PRIVATE })
        }
        return false
    }
}

function validateErrorHandler({ code, context = "playlist" }: { code: ValidateErrorCode, context?: "playlist" | "video" }) {
    const error = new ValidateError(code)
    const err = new APIError(APIErrorCode.GENERAL)
    const item = capitalize(context)

    if (error.code === ValidateErrorCode.UNEMBEDDABLE) {
        err.message = `${item} couldn't be played due to embed restriction.`
    }
    else if (error.code === ValidateErrorCode.EMPTY) {
        err.message = "Playlist couldn't be played due to empty playlist."
    }
    else if (error.code === ValidateErrorCode.PRIVATE) {
        err.message = `${item} couldn't be played due to privacy restriction.`
    }
    else {
        err.message = `${item} couldn't be played due to embed or privacy restrictions.`
    }

    youtubeAPIErrorHandler(err)
}

export function setYoutubeScript() {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'

    const ytScriptTag = document.getElementsByTagName('script')[0]
    ytScriptTag!.parentNode!.insertBefore(tag, ytScriptTag)
}
 
/* user  */

export function loadYtUserData(): YoutubeUserData | null {
    const res = localStorage.getItem('yt-user-data')
    if (!res) return null

    return JSON.parse(res)
}

export function saveYtUserData(ytUserData: Partial<YoutubeUserData>) {
    localStorage.setItem('yt-user-data', JSON.stringify(ytUserData))
}

export function deleteYtUserData() {
    localStorage.removeItem('yt-user-data')
}

export function didInitYtPlayer(): boolean {
    return localStorage.getItem("yt-player-data") != null
}

/* player */

export function loadYtPlayerData(): YoutubePlayerData | null {
    const res = localStorage.getItem('yt-player-data')
    if (!res) return null

    return JSON.parse(res)
}

export function saveYtPlayerData(newData: Partial<YoutubePlayerData>) {
    localStorage.setItem('yt-player-data', JSON.stringify(newData))
}

export function deleteYtPlayerData() {
    localStorage.removeItem('yt-player-data')
}