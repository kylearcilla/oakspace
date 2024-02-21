import { get } from "svelte/store"
import { ToastContext, YTMediaLinkType } from "./enums"
import { toaster, ytUserDataStore, ytPlayerStore } from "./store"
import { YoutubeUserData } from "./youtube-user-data"
import { YoutubePlayer } from "./youtube-player"
import { CustomError, ExpiredTokenError, ResourceNotFoundError } from "./errors"
import { getPlayListItemsDetails, getPlaylistDetails, getVidDetails } from "./api-youtube"
import { getElemsByClass } from "./utils-general"

const INIT_PLAYLIST_REQUEST_DELAY = 500
export const USER_PLS_MAX_PER_REQUEST = 15

/**
 * Continue Youtube player session after a refresh.
 * @returns  AsyncResult object.
 */
export const continueYtPlayerSession = async (): Promise<AsyncResult> => {
    return await initYtPlayer(true)
}

/**
 * Continue Youtube user session after a refresh.
 * @returns  AsyncResult object.
 */
export const continueYtUserSession = async (): Promise<AsyncResult> => {
    return await loginUser(true)
}

/**
 * Initialize Youtube Player using Youtube iFrame Player API.
* @returns    AsyncResult object.
 */
export const initYtPlayer = async (didInitYtPlayer: boolean = false): Promise<AsyncResult> => {
    try {
        const ytPlayer = new YoutubePlayer(didInitYtPlayer)
        await ytPlayer.initYtPlayer()

        return { sucess: true }
    }
    catch(error: any) {
        createYtErrorToastItem(error)
        return { sucess: false }
    }
}

/**
 * Attempt to log in Youtube User. Initialize client credentials & user data.
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Show a message if there's an issue.
 * @returns                 AsyncResult object.
 */
export const loginUser = async (didUserSignIn: boolean = false): Promise<AsyncResult> => {
    try {
        const ytData = new YoutubeUserData(didUserSignIn)
        await ytData.initYtData()

        if (!didUserSignIn) {
            toaster.update((toaster: ToastItem[]) => [...toaster, {
                context: ToastContext.Youtube,
                message: "Log in Successful!"
            }])
        }

        return { sucess: true }
    }
    catch(error: any) {
        createYtErrorToastItem(error)
        return { sucess: false }
    }    
}

/**
 * Log out Youtube User.
 * @returns      AsyncResult object.
 */
export const logOutUser = async (): Promise<AsyncResult> => {
    const ytData = get(ytUserDataStore)

    try {
        ytData!.logOutUser()

        toaster.update((toaster: ToastItem[]) => [...toaster, {
            context: ToastContext.Youtube,
            message: "Logged out successfully!",
            actionFunction: null
        }])

        return { sucess: true }
    }
    catch(error: any) {
        createYtErrorToastItem(error)
        return { sucess: false }
    }
}

/**
 * Called after token has expired and user wants to authorize the app again.
 * @returns     AsyncResult object.
 */
export const refreshToken = async (): Promise<AsyncResult> => {
    const playerStore = get(ytUserDataStore)

    try {
        await playerStore!.getFreshToken()

        toaster.update((toaster: ToastItem[]) => [...toaster, {
            context: ToastContext.Youtube,
            message: "Token Refreshed!",
            actionFunction: null
        }])

        return { sucess: true }
    }
    catch(error: any) {
        createYtErrorToastItem(error)
        return { sucess: false }
    }
}

/**
 * Given Youtube URL, extract the the video or playlist id.
 * If the url is a video in a playlist then the video will be used.
 * @param url  Given url
 * @returns    Link type and media id value if valid and null if not
 */
export const getYtMediaId = async (url: string): Promise<YoutubeMediaId | { error: string }>=> {
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
export const handleChoosePlaylist = async (playlist: YoutubePlaylist) => {
    let ytPlayer = get(ytPlayerStore)

    const hasInitPlayer = ytPlayer != null

    if (!hasInitPlayer) {
        await initYtPlayer()
        ytPlayer = get(ytPlayerStore)!
    }

    const doPlayPlaylist = ytPlayer!.playlist === null || playlist.id != ytPlayer!.playlist.id

    if (doPlayPlaylist) {
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
export const toggleYTIFramePointerEvents = (isPointerEventsEnabled: boolean) => {
    const ytPlayers = getElemsByClass("iframe-vid-player") as HTMLElement[]
    ytPlayers.forEach((elem: HTMLElement) => elem.style.pointerEvents = isPointerEventsEnabled ? "auto" : "none")
}

/**
 * Create a an error toast message.
 * @param error  Error raised from interacting with Youtube Data API / IFrame Player API.
 * @returns      Toast message to be disaplyed in a Toast component.
 */
export const createYtErrorToastItem = (error: Error) => {
    let toastMessage: ToastItem

    // put action function
    if (error instanceof ExpiredTokenError) {
        toastMessage = {
            context: ToastContext.Youtube,
            message: error.message,
            action: {
                msg: "Log in",
                func: () => refreshToken()
            }
        }
    }
    else if (!(error instanceof CustomError)) {
        toastMessage = {
            context: ToastContext.Youtube,
            message: "Error has occured try again.",
        }    
    }
    else {
        toastMessage = {
            context: ToastContext.Youtube,
            message: error.message,
        }    
    }
    toaster.update(() => [toastMessage])
}

/**
 * @returns User has initialized a session before
 */
export const didInitYtUser = () => {
    return localStorage.getItem('yt-user-data') != null
}

/* Youtube Creds */
export const loadYtCredentials = (): YoutubeUserCreds | null => {
    const res = localStorage.getItem('yt-credentials')
    if (!res) return null
  
    return JSON.parse(res)
}
export const saveYtCredentials = (ytCredentials: YoutubeUserCreds) => {
    localStorage.setItem('yt-credentials', JSON.stringify(ytCredentials))
}
export const deleteYtCredentials = () => {
    localStorage.removeItem('yt-credentials')
}

/* Youtube User Data */
export const loadYtUserData = (): Partial<YoutubeUserData> | null => {
    const res = localStorage.getItem('yt-user-data')
    if (!res) return null

    return JSON.parse(res)
}
export const saveYtUserData = (ytUserData: Partial<YoutubeUserData>) => {
    localStorage.setItem('yt-user-data', JSON.stringify(ytUserData))
}
export const deleteYtUserData = () => {
    localStorage.removeItem('yt-user-data')
}