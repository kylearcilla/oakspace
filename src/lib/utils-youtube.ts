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
 * Play playlist that user clicked on the Settings Modal to play in the Youtube player.
 * Will log in initialize a new Youtube Player if not yet initialized.
 * Will remove current playlist if it's the same that user has clicked on.
 * 
 * @param playlist   Playlist user clicked on.
 */
export async function handleChoosePlaylist(playlist: YoutubePlaylist) {
    let ytPlayer      = get(ytPlayerStore)
    let hasInitPlayer = ytPlayer != null
    
    ytPlayer ??= await initYoutubePlayer()

    if (playlist.id === ytPlayer.playlist?.id)    return
    if (!(await validateYtPlaylist(playlist.id))) return

    setTimeout(() => {
        ytPlayer.playPlaylist(playlist)

    }, hasInitPlayer ? 0 : 2000)
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
 * Ensure that the playlist will be embeddable and playable.
 * It cannot be:
 * 
 *  1. Playlist is private.
 *  2. Playlist is unembeddable.
 *  3. Playlist is public but first video is private
 *  4. Playlist is public but first video is unembeddable.
 * 
 * @param     playlistId 
 * @returns   If playlist is valid
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
        if (firstVidId.startsWith("-")) return true

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

export function saveYtPlayerData(newData: YoutubePlayerData) {
    localStorage.setItem('yt-player-data', JSON.stringify(newData))
}

export function deleteYtPlayerData() {
    localStorage.removeItem('yt-player-data')
}

/* Misc */
export function initTestYTGroups(playlistGroups: YoutubePlaylistGroup[]) {
    const testPlaylists = [ 
        {
            id: "PLDrC2_x2IOG3Wq6caRAmSoZJCKxO81j5G",
            title: "public w invalid first vid",
            description: "",
            vidCount: 2,
            channelId: "UCiFf9w1AjJNfPwvtWkXz-mw",
            channelTitle: "Napoleon Bonaparte",
            thumbnailURL: "https://i.ytimg.com/vi/1ex_bNIFR1A/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLBTS_NLHqGYSPE6R9NIXCdcFHB55A",
            channelImgSrc: "",
            channelURL: "https://www.youtube.com/channel/UCiFf9w1AjJNfPwvtWkXz-mw",
            firstVidId: null
        },
        {
            id: "PLDrC2_x2IOG1l20JgR2LNKhh3nfK2lbQY",
            title: "public w invalid 2nd vid",
            description: "",
            vidCount: 3,
            channelId: "UCiFf9w1AjJNfPwvtWkXz-mw",
            channelTitle: "Napoleon Bonaparte",
            thumbnailURL: "https://i.ytimg.com/vi/heO5wE0UV0A/hqdefault.jpg?sqp=-oaymwExCNACELwBSFryq4qpAyMIARUAAIhCGAHwAQH4Af4JgALQBYoCDAgAEAEYViBlKDwwDw==&rs=AOn4CLAb8WbjgoBturwXonBBULaP_053LA",
            channelImgSrc: "",
            channelURL: "https://www.youtube.com/channel/UCiFf9w1AjJNfPwvtWkXz-mw",
            firstVidId: null
        },
        {
            id: "PLDrC2_x2IOG0HaQiP2jMOWzVk1Mlqvyg5",
            title: "unlisted",
            description: "",
            vidCount: 1,
            channelId: "UCiFf9w1AjJNfPwvtWkXz-mw",
            channelTitle: "Napoleon Bonaparte",
            thumbnailURL: "https://i.ytimg.com/vi/hNleOVGEw60/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLARM_orE_-zR-JsASB2dlm4B4BZKg",
            channelImgSrc: "",
            channelURL: "https://www.youtube.com/channel/UCiFf9w1AjJNfPwvtWkXz-mw",
            firstVidId: null
        },
        {
            id: "PLDrC2_x2IOG0LPe04RiAnxDMVtjzmVvdn",
            title: "private",
            description: "",
            vidCount: 1,
            channelId: "UCiFf9w1AjJNfPwvtWkXz-mw",
            channelTitle: "Napoleon Bonaparte",
            thumbnailURL: "https://i.ytimg.com/vi/kyqpSycLASY/hqdefault.jpg?sqp=-oaymwExCNACELwBSFryq4qpAyMIARUAAIhCGAHwAQH4Af4JgALQBYoCDAgAEAEYSyBlKDkwDw==&rs=AOn4CLCmJhdMZTrxUZ0UeEoPlweKve9tqQ",
            channelImgSrc: "",
            channelURL: "https://www.youtube.com/channel/UCiFf9w1AjJNfPwvtWkXz-mw",
            firstVidId: null
        },
        {
            id: "PLDrC2_x2IOG0DTpP7RuNYe8-vjcHNHp8b",
            title: "empty",
            description: "",
            vidCount: 0,
            channelId: "UCiFf9w1AjJNfPwvtWkXz-mw",
            channelTitle: "Napoleon Bonaparte",
            thumbnailURL: "https://i.ytimg.com/img/no_thumbnail.jpg",
            channelImgSrc: "",
            channelURL: "https://www.youtube.com/channel/UCiFf9w1AjJNfPwvtWkXz-mw",
            firstVidId: null
        }
    ]

    playlistGroups[0].playlists = [...playlistGroups[0].playlists, ...testPlaylists]
    return playlistGroups
}