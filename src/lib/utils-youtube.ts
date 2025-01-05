import { get } from "svelte/store"
import { APIErrorCode, LogoIcon, YTMediaLinkType } from "./enums"
import { ytUserDataStore, ytPlayerStore } from "./store"
import { YoutubeUserData } from "./youtube-user-data"
import { YoutubePlayer } from "./youtube-player"
import { APIError } from "./errors"
import { getPlayListItemsDetails, getPlaylistDetails, getVidDetails } from "./api-youtube"
import { getElemsByClass, toastApiErrorHandler } from "./utils-general"
import { toast } from "./utils-toast"

export const INIT_PLAYLIST_REQUEST_DELAY = 1000
export const USER_PLS_MAX_PER_REQUEST = 15

/* Settings Handlers */
/**
 * Attempt to log in Youtube User. Initialize client credentials & user data.
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Show a message if there's an issue.
 */
export async function youtubeLogin() {
    try {
        const hasPrevSession = didInitYtUser()
        const ytData = new YoutubeUserData(ytUserDataStore)
        await ytData.init()

        if (!hasPrevSession) {
            initToast("Log in Successful!")
        }
    }
    catch(error: any) {
        if (error.code != APIErrorCode.AUTH_DENIED) {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.AUTHORIZATION_ERROR))
        }
    }    
}

/**
 * Initialize Youtube Player using Youtube iFrame Player API.
 */
export async function initYoutubePlayer() {
    const ytPlayer = new YoutubePlayer()
    await ytPlayer.initYtPlayer()

    return ytPlayer
}

/**
 * Log out Youtube User.
 */
export function youtubeLogOut() {
    const store = get(ytUserDataStore)
    if (!store) return

    try {
        store!.logOutUser()
        initToast("Logged Out Successfully!")
    }
    catch(error: any) {
        youtubeAPIErrorHandler(error)
    }
}

export function exitYoutubePlayer() {
    youtubeLogOut()
    get(ytPlayerStore)?.quit()
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
 * @param   id    Playlist or video id to be played
 * @param   type  Type of item to be played
 * 
 * @returns If operation was successful (no error).
 */
export async function handleChooseItem(id: string, type: "video" | "playlist") {
    let ytPlayer      = get(ytPlayerStore)
    let hasInitPlayer = ytPlayer != null
    let item: YoutubeVideo | YoutubePlaylist | null = null
    
    ytPlayer ??= await initYoutubePlayer()

    if (type === "video") {
        item = await validateGetVideo(id)

        if (!item) {
            return false
        }
    }
    else if (type === "playlist") {
        if (await validateYtPlaylist(id)) {
            item = await getPlaylistDetails(id)
        }
        else {
            return false
        }
    }

    setTimeout(() => {
        if (type === "playlist") {
            ytPlayer.playPlaylist(item as YoutubePlaylist)
        }
        else {
            ytPlayer.playVideo(item as YoutubeVideo)
        }

    }, hasInitPlayer ? 0 : 2000)

    return true
}


/**
 * Toggle pointer events for all Youtube iFrames.
 * Done to avoid weird behavior with certain events over an active iFrame
 * 
 * @param isPointerEventsEnabled   Should iframes have pointer events
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

/**
 * Initialize iFrame Player API asynchrnously
 */
export const initIframePlayerAPI = async (options: { 
    initApi: boolean,
    iframeClass: string, 
    playerOptions: any
}) => {
    const { initApi, iframeClass, playerOptions } = options
    
    if (initApi) {
        setYoutubeScript()
        return new Promise<void>((resolve) => (window as any).onYouTubeIframeAPIReady = () => {
            // @ts-ignore
            resolve(new YT.Player(this.IFRAME_ID, this.YT_PLAYER_OPTIONS))
        })
    }
    else {
        // @ts-ignore
        return new YT.Player(iframeClass, playerOptions)
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
 * @returns   Vid details
 */
export async function validateGetVideo(videoId: string) {
    try {
        const vid = await getVidDetails(videoId, false)
            
        if (!vid) {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Video couldn't be played due to privacy restriction."))
            return null
        }
        else if (vid.embeddable != undefined && !vid.embeddable)  {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Video couldn't be played due to embed restriction."))
            return null
        } 

        return vid
    }
    catch(e: any) {
        console.error(e)
        const code = e?.code

        // api will throw 404 if video is private / unembedable / invalid id.
        if (code === APIErrorCode.RESOURCE_NOT_FOUND) {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Video couldn't be played due to embed or privacy restrictions, or because of invalid ID."))
        }
        else {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER, "Video couldn't be played due to privacy restriction."))
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
        const res = await getPlayListItemsDetails({ playlistId, channel: false })

        if (res.playlistLength === 0) {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Cannot play empty playlists."))
            return false
        }

        // vid id that start with a "-" in a playlist are private, but the playlist is still playable
        const firstVidId = res.videos[0].id
        if (firstVidId.startsWith("-")) {
            return true
        }

        const firstVidDetails = await getVidDetails(firstVidId, false)
        
        if (!firstVidDetails) {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Playlist couldn't be played due to privacy restriction."))
            return false
        }
        else if (firstVidDetails.embeddable != undefined && !firstVidDetails.embeddable)  {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Playlist couldn't be played due to embed restriction."))
            return false
        }

        return true
    }
    catch(e: any) {
        console.error(e)
        const code = e?.code

        // api will throw 404 if playlist is private / unembedable / invalid id.
        if (code === APIErrorCode.RESOURCE_NOT_FOUND) {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER_MEDIA_INVALID, "Playlist couldn't be played due to embed or privacy restrictions, or because of invalid ID."))
        }
        else {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.PLAYER, "Video couldn't be played due to privacy restriction."))
        }
        return false
    }
}

/**
 * Load the iFrame Player API to app
 */
export function setYoutubeScript() {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'

    const ytScriptTag = document.getElementsByTagName('script')[0]
    ytScriptTag!.parentNode!.insertBefore(tag, ytScriptTag)
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

export function saveYtPlayerData(newData: Partial<YoutubePlayerData>) {
    localStorage.setItem('yt-player-data', JSON.stringify(newData))
}

export function deleteYtPlayerData() {
    localStorage.removeItem('yt-player-data')
}

/* Misc */