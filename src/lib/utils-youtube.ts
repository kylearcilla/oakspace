import { get } from "svelte/store"
import { APIErrorCode, LogoIcon, YTMediaLinkType } from "./enums"
import { ytUserDataStore, ytPlayerStore } from "./store"
import { YoutubeUserData } from "./youtube-user-data"
import { YoutubePlayer } from "./youtube-player"
import type { APIError } from "./errors"
import { getPlaylistDetails, getVidDetails } from "./api-youtube"
import { getElemsByClass } from "./utils-general"
import { toast } from "./utils-toast"

const INIT_PLAYLIST_REQUEST_DELAY = 1000
export const USER_PLS_MAX_PER_REQUEST = 15


/**
 * Attempt to log in Youtube User. Initialize client credentials & user data.
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Show a message if there's an issue.
 */
export async function youtubeLogin() {
    try {
        const hasPrevSession = didInitYtUser()
        const ytData = new YoutubeUserData()
        await ytData.init()

        if (!hasPrevSession) {
            initToast("Log in Successful!")
        }
    }
    catch(error: any) {
        if (error.code != APIErrorCode.AUTH_DENIED) {
            youtubeAPIErrorHandler(error)
        }
    }    
}

/**
 * Initialize Youtube Player using Youtube iFrame Player API.
 */
export async function initYoutubePlayer() {
    const ytPlayer = new YoutubePlayer()
    await ytPlayer.initYtPlayer()
}

/**
 * Log out Youtube User.
 */
export function youtubeLogOut() {
    const ytData = get(ytUserDataStore)

    try {
        ytData!.logOutUser()
        initToast("Logged Out Successfully!")
    }
    catch(error: any) {
        youtubeAPIErrorHandler(error)
    }
}

/**
 * Called after token has expired and user wants to authorize the app again.
 */
export async function refreshToken() {
    await get(ytUserDataStore)!.refreshAccessToken()
    initToast("Token Refreshed!")
}

/**
 * Given Youtube URL, extract the the video or playlist id.
 * If the url is a video in a playlist then the video will be used.
 * @param url  Given url
 * @returns    Link type and media id value if valid and null if not
 */
export async function getYtMediaId(url: string): Promise<YoutubeMediaId | { error: string }> {
    try {
        const urlParams = new URLSearchParams(new URL(url).search)
        const listId = urlParams.get("list")
        const vidId = urlParams.get("v")

        // check if video and pubic
        if (vidId) {
            await getVidDetails(vidId)
            return {
                type: YTMediaLinkType.VIDEO,
                id: vidId
            }
        }
        // check if list and public
        if (listId) {
            await getPlaylistDetails(listId)
            return {
                type: YTMediaLinkType.PLAYLIST,
                id: listId
            }
        }
        return { error: "Resource does not exist or is private." }        
    }
    catch(error: any) {
        return { error: "Resource does not exist or is private." }        
    }
}

/**
 * Play playlist that user clicked on the Settings Modal to play in the Youtube player.
 * Will log in initialize a new Youtube Player if not yet initialized.
 * Will remove current playlist if it's the same that user has clicked on.
 * 
 * @param playlist   Playlist user clicked on.
 */
export async function handleChoosePlaylist (playlist: YoutubePlaylist) {
    let ytPlayer = get(ytPlayerStore)
    const hasInitPlayer = ytPlayer != null

    if (!hasInitPlayer) {
        await initYoutubePlayer()
        ytPlayer = get(ytPlayerStore)!
    }

    // do no not play if self OR clicking self after an invalid media request
    if (playlist.id != ytPlayer?.playlist?.id || ytPlayer.error?.code === APIErrorCode.PLAYER_MEDIA_INVALID) {
        setTimeout(() =>  ytPlayer!.playPlaylist(playlist), hasInitPlayer ? 0 : INIT_PLAYLIST_REQUEST_DELAY)
    }
    else {
        ytPlayer!.removeCurrentPlaylist()
    }
}

/**
 * Toggle pointer events for all Youtube iFrames.
 * Done to avoid weird behavior with certain events over an active iFrame
 * @param isPointerEventsEnabled   Should iframes have pointer events.
 */
export function toggleYTIFramePointerEvents(isPointerEventsEnabled: boolean) {
    const ytPlayers = getElemsByClass("iframe-vid-player") as HTMLElement[]
    ytPlayers.forEach((elem: HTMLElement) => elem.style.pointerEvents = isPointerEventsEnabled ? "auto" : "none")
}

/**
 * Create a an error toast message.
 * @param error  Error raised from interacting with Youtube Data API / IFrame Player API.
 * @returns      Toast message to be disaplyed in a Toast component.
 */
export function youtubeAPIErrorHandler(error: APIError) {
    let toastOptions: ToastInitOptions
    console.error(error)

    const errorMessage = error.message
    const hasNoMsg = errorMessage != undefined && errorMessage

    if (error.code === APIErrorCode.EXPIRED_TOKEN) {
        toastOptions = {
            message: hasNoMsg ? errorMessage : "Token has expired. Log in again to continue.",
            action: {
                label: "Continue session",
                onClick: () => refreshToken()
            }
        }
    }
    else if (error.code === APIErrorCode.PLAYER) {
        toastOptions = {
            message: hasNoMsg ? errorMessage : "Player error. Try again later.",
        }
    }
    else if (error.code === APIErrorCode.FAILED_TOKEN_REFRESH) {
        toastOptions = {
            message: hasNoMsg ? errorMessage : "Token refresh failed.",
        }
    }
    else if (error.code === APIErrorCode.AUTHORIZATION_ERROR) {
        toastOptions = {
            message: hasNoMsg ? errorMessage : `Youtube authorization failed. Please try again.`,
        }
    }
    else if (error.code === APIErrorCode.RATE_LIMIT_HIT) {
        toastOptions = {
            message: "Rate limit exceeded. Try again later.",
        }
    }
    else if (error instanceof TypeError) {
        toastOptions = {
            message: hasNoMsg ? errorMessage : "There was an error. Please try again."
        }
    }
    else {
        toastOptions = {
            message: hasNoMsg ? errorMessage : `There was an error with Youtube Please try again later.` ,
        }
    }

    toast("default", {
        message: "Youtube",
        description: toastOptions.message,
        logoIcon: LogoIcon.Youtube,
        action: toastOptions.action
    })
}

export function initToast(message: string) {
    toast("default", {
        logoIcon: LogoIcon.Youtube,
        message: "Youtube",
        description: message
    })
}

/**
 * @returns User has initialized a session before
 */
export function didInitYtUser() {
    const userData = localStorage.getItem('yt-user-data') != null
    const credsData = loadYtCredentials()

    // these 2 sets of data must be present
    if (!userData || !credsData) {
        deleteYtUserData()
        deleteYtCredentials()
        return false
    }

    return true
}

/* Youtube Creds */
export function loadYtCredentials(): YoutubeUserCreds | null {
    const res = localStorage.getItem('yt-credentials')
    if (!res) return null
  
    return JSON.parse(res)
}
export function saveYtCredentials(ytCredentials: YoutubeUserCreds) {
    localStorage.setItem('yt-credentials', JSON.stringify(ytCredentials))
}
export function deleteYtCredentials() {
    localStorage.removeItem('yt-credentials')
}

/* Youtube User Data */
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

/* Youtube Player Data */
export function loadYtPlayerData(): YoutubePlayerData | null {
    const res = localStorage.getItem('yt-player-data')
    if (!res) return null

    return JSON.parse(res)
}

export function saveYtPlayerData(newData: YoutubePlayerData) {
    localStorage.setItem('yt-player-data', JSON.stringify(newData))
}

export function deleteYtPlayerData() {
    localStorage.removeItem('yt-player-data')
}