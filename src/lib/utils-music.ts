import { get } from "svelte/store"
import { musicDataStore, musicPlayerStore, musicSettingsManager } from "./store"
import { getLogoIconFromEnum, toastApiErrorHandler } from "./utils-general"

import type { MusicPlayer } from "./music-player"
import {  APIErrorCode, MusicMediaType, MusicPlatform } from "./enums"
import { APIError } from "./errors"
import { toast } from "./utils-toast"
import { YoutubeMusicPlayer } from "./youtube-music-player"
import { INIT_PLAYLIST_REQUEST_DELAY, didInitYtPlayer, didInitYtUser, initToast, validateYtPlaylist, youtubeAPIErrorHandler } from "./utils-youtube"
import type { YoutubeUserData } from "./youtube-user-data"
import { YoutubeMusicUserData } from "./youtube-music-user-data"

export const USER_PLAYLISTS_REQUEST_LIMIT = 10
export const SPOTIFY_IFRAME_ID            = "spotify-iframe"
export const LIBRARY_COLLECTION_LIMIT     = 25

/**
 * Attempt to log in user to desired music platform. 
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Makes a new music user and player instance.
 * End of error pipeline.
 * 
 */
export async function musicLogin() {
    try {
        const hasPrevSession = didInitMusicUser()
        const ytData         = new YoutubeMusicUserData()
        await ytData.init()

        if (!hasPrevSession) {
            initToast("Log in Successful!")
        }

        get(musicSettingsManager)?.updateLibrary()
    }
    catch(error: any) {
        console.error(error)
        if (error.code != APIErrorCode.AUTH_DENIED) {
            youtubeAPIErrorHandler(new APIError(APIErrorCode.AUTHORIZATION_ERROR))
        }
    }
}

export function musicLogOut() {
    const store = get(musicDataStore)
    if (!store) return

    try {
        store.quit()
        initToast("Logged out successfully!")
    }
    catch(error: any) {
        youtubeAPIErrorHandler(error)
    }
}

/**
 * Called when user logs out of music platform.
 */
export async function exitMusicPlayer() {
    musicLogOut()
    get(musicPlayerStore)?.quit()
}


/**
 * Called when user wants to log in again after token has expired.
 */
export async function refreshMusicSession() {
    try {
        const musicStore = get(musicDataStore)
        await musicStore!.refreshAccessToken()
    
        initMusicToast(MusicPlatform.YoutubeMusic, "Refresh Success!")
    }
    catch(e: any) {
        console.error(e)
        musicAPIErrorHandler(new APIError(APIErrorCode.FAILED_TOKEN_REFRESH))
    }
}

export async function initMusicPlayer(platform: MusicPlatform, initApi: boolean): Promise<MusicPlayer> {
    let player: MusicPlayer

    if (platform === MusicPlatform.YoutubeMusic) {
        player = new YoutubeMusicPlayer()
        await player.init(initApi)
    }

    return get(musicPlayerStore)!
}

/**
 * Handler for the media item click. Will attempt to set current collection / item and play.
 * 
 * @param collection   Media the user has clicked on.
 * @param itemClicked  Media item user has clicked.
 * @param idx          Idx location of clicked
 */
export async function handlePlaylistItemClicked(collection: MediaCollection, idx: number) {
    const selectContext    = { collection, idx }
    let player             = get(musicPlayerStore)
    let hasinitMusicPlayer = player != null
    
    player ??= await initMusicPlayer(MusicPlatform.YoutubeMusic, !didInitYtPlayer())

    if (!(await validateYtPlaylist(collection.id))) {
        return
    }

    setTimeout(async () => {
        await player.updateMediaCollection(selectContext)
        player.playMediaCollection()

    }, hasinitMusicPlayer ? 0 : INIT_PLAYLIST_REQUEST_DELAY)
}


/**
 * Check to see if player has been initialized in a previous session.
 * If so then init the player.
 * 
 * @param platform    Current platform user is using.
 */
export async function verifyForPlayerSession(platform: MusicPlatform) {
    const playerData = loadMusicPlayerData()

    if (playerData && playerData.currentIdx === undefined) {
        removeMusicPlayerData()
        return
    }
    if (playerData) {
        try {
            await initMusicPlayer(platform, false)
        }
        catch(e: any) {
            musicAPIErrorHandler(e)
        }
    }
}

/**
 * Create a toast message in relation to the Music feaeture.
 * @param context   Music Platform
 * @param message 
 */
export function initMusicToast(platform: MusicPlatform, message: string) {
    toast("default", {
        icon: getLogoIconFromEnum(platform, MusicPlatform),
        message: getPlatformString(platform),
        description: message
    })
}

/**
 * Create a an error toast message. 
 * Error code used to add context to error. 
 * Used to determine how to handle the error.
 * 
 * @param error         Error thrown from interacting with music user data / player stores.
 * @param musicPlatform Context music platform error occured in.
 * @returns             Toast message to be disaplyed in a Toast component.
 */
export function musicAPIErrorHandler(error: APIError, musicPlatform?: MusicPlatform) {
    const musicData = get(musicDataStore)
    const platform  = musicPlatform === undefined ? musicData?.musicPlatform : musicPlatform

    if (!platform) return

    toastApiErrorHandler({
         error,
         title:    getPlatformString(platform),
         logoIcon: getLogoIconFromEnum(platform, MusicPlatform),
         action:   error.code === APIErrorCode.EXPIRED_TOKEN ? {
            label: "Continue session",
            onClick: () => refreshMusicSession()
        } : undefined
    })
}

/**
 * Check if media is a collection time (hold items).
 * @param type 
 */
export function isMediaTypeACollection(type: MusicMediaType): boolean {
    return [
        MusicMediaType.Playlist, 
        MusicMediaType.Album,
        MusicMediaType.SavedTracks,
        MusicMediaType.SavedAudioBooks,
        MusicMediaType.SavedEpisodes
    ].includes(type)
}

/**
 * @param platform  
 * @returns          Get string name of platform.
 */
export function getPlatformString(platform: MusicPlatform): string {
    if (platform === MusicPlatform.AppleMusic) {
        return "Apple Music"
    }
    else if (platform === MusicPlatform.YoutubeMusic) {
        return "Youtube Music"
    }
    else{
        return MusicPlatform[platform]
    }
}

/**
 * Get the object property from of platform's name
 * i.e. (AppleMuisc -> appleMusic)
 * 
 * @param platFormIdx  Enum platform index
 * @returns            Music Discover Property name of current platform
 */
export function getPlatfromPropName(platFormIdx: MusicPlatform): MusicPlatformPropNames {
    let propName = ""

    if (platFormIdx === MusicPlatform.AppleMusic) {
        propName = "appleMusic"
    }
    else if (platFormIdx === MusicPlatform.YoutubeMusic) {
        propName = "youtube"
    }
    else {
        propName = MusicPlatform[platFormIdx].toLowerCase() as MusicPlatformPropNames
    }

    return "youtube" as MusicPlatformPropNames
}

export function didInitMusicUser() { 
    const hasData = localStorage.getItem("music-user-data") != null

    if (!hasData) {
        removeAppleMusicTokens()
        removeMusicShuffleData() 
    }
    return hasData
}

export function didInitMusicPlayer() { 
    const hasData = localStorage.getItem("music-player-data") != null

    if (!hasData) {
        removeMusicPlayerData()
    }

    return hasData
}

/* Load */

export function loadMusicUserData(): YoutubeUserData | null {
    const userData = localStorage.getItem("music-user-data")
    
    return userData ? JSON.parse(userData!) : null
} 
export function loadMusicPlayerData(): MusicPlayer | null {
    const playerData = localStorage.getItem("music-player-data")
    
    return playerData ? JSON.parse(playerData!) : null
} 
export function loadMusicShuffleData(): MusicShufflerData | null {
    const shuffleData = localStorage.getItem("music-shuffle-data")
    
    return shuffleData ? JSON.parse(shuffleData!) : null
}

/* Updates */

export function saveMusicUserData(newState: Partial<YoutubeUserData>) {
    localStorage.setItem("music-user-data", JSON.stringify(newState))
}
export function saveMusicPlayerData(newState: MusicPlayer) {
    localStorage.setItem("music-player-data", JSON.stringify(newState))
}
export function saveMusicShuffleData(shuffleData: MusicShufflerData) {
    localStorage.setItem("music-shuffle-data", JSON.stringify(shuffleData))
}

/* Removals */

export function deleteMusicUserData(): void {
    localStorage.removeItem("music-user-data")
}
export function removeAppleMusicTokens() {
    localStorage.removeItem("music.y5xn9fm7bj.itua")
    localStorage.removeItem("music.y5xn9fm7bj.itre")
    localStorage.removeItem("music.y5xn9fm7bj.media-user-token")
    localStorage.removeItem("mk-player-tsid")
}
export function removeMusicPlayerData(): void {
    localStorage.removeItem("music-player-data")

}
export function removeMusicShuffleData(): void {
    localStorage.removeItem("music-shuffle-data")
}