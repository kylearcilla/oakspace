import { get } from "svelte/store"
import { ErrorCode, ToastContext, ToastType } from "./enums"
import { toastMessages, ytUserDataStore, ytPlayerStore } from "./store"
import { YoutubeUserData } from "./youtube-data"
import { YoutubePlayer } from "./youtube-player"
import { ApiError, AuthorizationError, CustomError } from "./errors"

/**
 * Initialize Youtube Player using Youtube iFrame Player API.
 * Initiated for the first time when user clicks on a playlist and subequent page refreshes.
* @returns        AsyncResult object.
 */
export const initYtPlayer = async (): Promise<AsyncResult> => {
    try {
        const ytPlayer = new YoutubePlayer()
        await ytPlayer.initYtPlayer()

        return { sucess: true }
    }
    catch(error: any) {
        createYtErrorToastMsg(error)
        return { sucess: false }
    }
}

/**
 * If the user has been previously logged in, then initialize saved user data to create new youtube data instance.
 * @returns 
 */
export const initYtUser = () => {
    if (!localStorage.getItem("yt-user-data")) return

    const ytData = new YoutubeUserData()
    ytData.loadAndSetUserData()
}

/**
 * Attempt to log in Youtube User. Initialize client credentials & user data.
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Show a message if there's an issue.
 * @returns                 AsyncResult object.
 */
export const loginUser = async (): Promise<AsyncResult> => {
    try {
        const ytData = new YoutubeUserData()
        await ytData.initYtData()

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            type: ToastType.Info,
            context: ToastContext.Youtube,
            message: "Log in Successful!",
            actionFunction: null
        }])

        return { sucess: true }
    }
    catch(error: any) {
        if (!(error instanceof AuthorizationError)) createYtErrorToastMsg(error)
        return { sucess: false }
    }    
}

/**
 * Log out Youtube User.
 * @returns        AsyncResult object.
 */
export const logOutUser = async (): Promise<AsyncResult> => {
    const ytData = get(ytUserDataStore)

    try {
        ytData!.logOutUser()

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            type: ToastType.Expired,
            context: ToastContext.Youtube,
            message: "Logged out successfully!",
            actionFunction: null
        }])

        return { sucess: true }
    }
    catch(error: any) {
        createYtErrorToastMsg(error)
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

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            type: ToastType.Expired,
            context: ToastContext.Youtube,
            message: "Token Refreshed!",
            actionFunction: null
        }])

        return { sucess: true }
    }
    catch(error: any) {
        createYtErrorToastMsg(error)
        return { sucess: false }
    }
}

/**
 * Create a an error toast message.
 * @param errorCode  Error code. "400" is treated as a generic error to the user.
 * @returns          Toast message to be disaplyed in a Toast component.
 */
export const createYtErrorToastMsg = (error: CustomError) => {
    let toastMessage: ToastMsg

    if (error.code === ErrorCode.YT_EXPIRED_TOKEN ) {
        toastMessage = {
            type: ToastType.BasicError,
            context: ToastContext.Youtube,
            message: error.message,
            actionFunction: () => refreshToken()
        }
    }
    else if (error instanceof ApiError) {
        // For errors that is only relevant for developers.
        toastMessage = {
            type: ToastType.BasicError,
            context: ToastContext.Youtube,
            message: "Error has occured. Refresh or log in again to continue.",
            actionFunction: null
        }
    }
    else {
        toastMessage = {
            type: ToastType.Expired,
            context: ToastContext.Youtube,
            message: error.message,
            actionFunction: null
        }    
    }
    toastMessages.update((toasts: ToastMsg[]) => [...toasts, toastMessage])
}

/**
 * Play playlist that user clicked on the Settings Modal to play in the Youtube player.
 * Will log in initialize a new Youtube Player if not yet initialized.
 * Will remove current playlist if it's the same that user has clicked on.
 * @param playlist   Playlist user clicked on.
 */
export const handleChoosePlaylist = async (playlist: YoutubePlaylist) => {
    const ytPlayer = get(ytPlayerStore)!

    if (!ytPlayer) {
        await initYtPlayer()
        return
    }
    
    const doPlayPlaylist = ytPlayer!.playlist === null || playlist.id != ytPlayer!.playlist!.id
    if (doPlayPlaylist) {
        ytPlayer!.playPlaylist(playlist)
    }
    else {
        ytPlayer!.removeCurrentPlaylist()
    }
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
export const loadYtUserData = (): YoutubeUserInfo | null => {
    const res = localStorage.getItem('yt-user-data')
    if (!res) return null

    return JSON.parse(res)
}
export const saveYtUserData = (ytUserData: YoutubeUserInfo) => {
    localStorage.setItem('yt-user-data', JSON.stringify(ytUserData))
}
export const deleteYtUserData = () => {
    localStorage.removeItem('yt-user-data')
}

/* Youtube Playlist Data */
export const loadYtPlaylistData = (): YoutubePlaylist | null => {
    const res = localStorage.getItem('yt-pl')
    if (!res) return null

    return JSON.parse(res)
}
export const saveYoutubePlaylistData = (ytPlaylist: YoutubePlaylist) => {
    localStorage.setItem('yt-pl', JSON.stringify(ytPlaylist))
}
export const deleteYoutubePlaylistData = () => {
    localStorage.removeItem('yt-pl')
}

/* Youtube Video Data */
export const loadYtVidData = (): YoutubeVideo | null => {
    const res = localStorage.getItem('yt-vid')
    if (!res) return null

    return JSON.parse(res)
}
export const saveYoutubeVidData = (ytVid: YoutubeVideo) => {
    localStorage.setItem('yt-vid', JSON.stringify(ytVid))
}
export const deleteYoutubeVidData = () => {
    localStorage.removeItem('yt-vid')
}

/* Youtube Playlist Index */
export const loadVidIdx = (): number | null => {
    const res = localStorage.getItem('yt-vid-idx')
    if (!res) return null

    return JSON.parse(res)
}
export const saveVidIdx = (ytVidIdx: number) => {
    localStorage.setItem('yt-vid-idx', JSON.stringify(ytVidIdx))
}
export const deleteVidIdx = () => {
    localStorage.removeItem('yt-vid-idx')
}
