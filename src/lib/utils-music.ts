import { get } from "svelte/store"
import { musicDataStore, musicPlayerStore } from "./store"

import { getAppleMusicUserAlbums, getAppleMusicUserLikedTracks, getAppleMusicUserPlaylists, initAppleMusic } from "./api-apple-music"
import { SpotifyMusicPlayer } from "./music-spotify-player"
import { getLogoIconFromEnum } from "./utils-general"
import { 
    getSpotfifyUserLikedTracks, getSpotfifyUserPlaylists, getSpotifyUserAlbums, getSpotifyUserAudioBooks, getUserPodcastsEps, initSpotifyMusic
} from "./api-spotify"

import type { MusicPlayer } from "./music-player"
import type { AppleMusicUserData } from "./music-apple-user-data"
import type { SpotifyMusicUserData } from "./music-spotify-user-data"
import {  APIErrorCode, MusicMediaType, MusicPlatform } from "./enums"
import { APIError } from "./errors"
import { AppleMusicPlayer } from "./music-apple-player"
import { toast } from "./utils-toast"

export const USER_PLAYLISTS_REQUEST_LIMIT = 10
export const SPOTIFY_IFRAME_ID = "spotify-iframe"
export const LIBRARY_COLLECTION_LIMIT = 25

/**
 * Attempt to log in user to desired music platform. 
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Makes a new music user and player instance.
 * End of error pipeline.
 * 
 * @param platform          Current music streaming platform being used.
 */
export async function musicLogin(platform: MusicPlatform) {
    if (platform === MusicPlatform.AppleMusic) {
        await initAppleMusic()
    }
    else if (platform === MusicPlatform.Spotify) {
        await initSpotifyMusic()
    }
}

/**
 * Called when user logs out of music platform.
 */
export async function musicLogout() {
    const musicStore = get(musicDataStore)
    const playerStore = get(musicPlayerStore)
    const platform = musicStore!.musicPlatform

    try {
        musicStore!.quit()
        playerStore?.quit()

        initMusicToast(platform, "Log out success!")
    }
    catch(error: any) {
        musicAPIErrorHandler(error)
    }
}

/**
 * Called when user wants to log in again after token has expired.
 */
export async function refreshMusicSession() {
    try {
        const musicStore = get(musicDataStore)
        await musicStore!.refreshAccessToken()
    
        initMusicToast(musicStore!.musicPlatform, "Refresh Success!")
    }
    catch(e: any) {
        console.error(e)
        musicAPIErrorHandler(new APIError(APIErrorCode.FAILED_TOKEN_REFRESH))
    }
}

async function initPlayer(platform: MusicPlatform, selectContext?: MusicMediaSelectContext): Promise<MusicPlayer> {
    let playerStore: MusicPlayer

    if (platform === MusicPlatform.Spotify) {
        playerStore = new SpotifyMusicPlayer()
        await playerStore.init(selectContext)
    }
    else {
        playerStore = new AppleMusicPlayer()
        await playerStore.init()
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
export async function handlePlaylistItemClicked (collection: MediaCollection, itemClicked: Media, idx: number) {
    const musicData = get(musicDataStore)
    const selectContext = { collection, itemClicked, idx }

    let player = get(musicPlayerStore)
    player ??= await initPlayer(musicData!.musicPlatform, selectContext)

    await player.updateMediaCollection(selectContext)
    player.loadCurrentItem(true)
}

/**
 * Check to see if player has been initialized in a previous session.
 * If so then init the player.
 * @param platform    Current platform user is using.
 */
export async function verifyForPlayerSession(platform: MusicPlatform) {
    const playerData = loadMusicPlayerData()

    if (playerData && playerData.currentIdx === undefined) {
        removeMusicPlayerData()
        return
    }
    if (playerData) {
        await initPlayer(platform)
    }
}


/**
 * Get the collection associated with the lib media clicked.
 * There must always be a collection in the player.
 * If not a collection (clicked on a track from saved tracks for example), then create a collection for it.
 * 
 * Ensure that the media user clicks is consistent with the actual media located in that index (make sure it hasn't been deleted or moved).
 * This is crucial in cases where the player requires an idx-based media id parameter or special lib id for certain media.
 * 
 * @param mediaClicked  Clicked media
 * @returns             Media associated collection
 */ 
export async function getLibMediaCollection(mediaClicked: Media, itemIdx: number): Promise<MediaCollection> {
    const musicStore = get(musicDataStore)!
    const accessToken = await musicStore.verifyAccessToken()
    const platform = musicStore.musicPlatform

    if (mediaClicked.type === MusicMediaType.Playlist) {
        const details = (await getUserPlaylist(platform, itemIdx, 1))!
        const item = details.items[0]

        if (!details || details.total === 0 || !item || item.id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }
        else {
            return item as MediaCollection
        }
    }
    else if (mediaClicked.type === MusicMediaType.Album) {
        const details = (await getUserAlbums(platform, itemIdx, 1))!
        const item = details.items[0]

        if (!details || details.total === 0 || !item || item.id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }
        else {
            return item as MediaCollection
        }
    }
    else if (mediaClicked.type === MusicMediaType.PodcastEpisode) {
        const details = await getUserPodcastsEps(accessToken, itemIdx, 1)
        const item = details.items[0]

        if (!details || details.total === 0 || !item || item.id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }

        const artwork = musicStore.userDetails?.profileImgBig ?? item.artworkImgSrc

        return {
            id: "",
            name: "My Library",
            description: "Your saved podcast episodes.",
            artworkImgSrc: artwork ?? item.artworkImgSrc,
            author: musicStore.userDetails!.username,
            authorUrl: musicStore.userDetails!.url,
            genre: "",
            type: MusicMediaType.SavedEpisodes,
            length: details.total,
            fromLib: true,
            url: ""
        }
    }
    else if (mediaClicked.type === MusicMediaType.Track) {
        const details = (await getUserLikedTracks(platform, itemIdx, 1))!
        const item = details.items[0]

        if (!details || details.total === 0 || !item || item.id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }
        
        const artwork = musicStore.userDetails?.profileImgBig ?? item.artworkImgSrc

        return {
            id: "",
            name: "My Library",
            description: "Your saved tracks.",
            artworkImgSrc: artwork ?? item.artworkImgSrc,
            author: musicStore.userDetails?.username ?? "",
            authorUrl: musicStore.userDetails?.url ?? "",
            genre: "",
            type: MusicMediaType.SavedTracks,
            length: details.total,
            fromLib: true,
            url: ""
        } 
    }
    else {
        const details = await getSpotifyUserAudioBooks(accessToken, itemIdx, 1)!
        const item = details.items[0]

        if (!details || details.total === 0 || !item || item.id != mediaClicked.id) {
            throw new APIError(APIErrorCode.RESOURCE_NOT_FOUND, "Outdated library. Please refresh.")
        }

        const artwork = musicStore.userDetails?.profileImgBig ?? item.artworkImgSrc

        return {
            id: "",
            name: "My Library",
            description: "Your saved audiobooks. (These are preview-only.)",
            artworkImgSrc: artwork ?? item.artworkImgSrc,
            author: musicStore.userDetails!.username,
            authorUrl: musicStore.userDetails!?.url,
            genre: "",
            type: MusicMediaType.SavedAudioBooks,
            length: details.total,
            url: "",
            fromLib: true
        }
    }
}

async function getUserAlbums(platform: MusicPlatform, offset: number,limit: number) {
    const accessToken = await get(musicDataStore)!.verifyAccessToken()

    if (platform === MusicPlatform.AppleMusic) {
        return await getAppleMusicUserAlbums(limit, offset)
    }

    return await getSpotifyUserAlbums(accessToken, offset, limit)
}

async function getUserPlaylist(platform: MusicPlatform, offset: number,limit: number) {
    const accessToken = await get(musicDataStore)!.verifyAccessToken()

    if (platform === MusicPlatform.AppleMusic) {
        return await getAppleMusicUserPlaylists(limit, offset)
    }

    return await getSpotfifyUserPlaylists(accessToken, offset, limit)
}

async function getUserLikedTracks(platform: MusicPlatform, offset: number,limit: number) {
    const accessToken = await get(musicDataStore)!.verifyAccessToken()

    if (platform === MusicPlatform.AppleMusic) {
        return await getAppleMusicUserLikedTracks(limit, offset)
    }

    return await getSpotfifyUserLikedTracks(accessToken, offset, limit)
}

/**
 * Create a toast message in relation to the Music feaeture.
 * @param context   Music Platform
 * @param message 
 */
export function initMusicToast(context: MusicPlatform, message: string) {
    toast("default", {
        logoIcon: getLogoIconFromEnum(context, MusicPlatform),
        message: MusicPlatform[context],
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
    let toastOptions: ToastInitOptions

    const platform = musicPlatform === undefined ? get(musicDataStore)!.musicPlatform! : musicPlatform
    const platformStr = getPlatformString(platform)

    const errorMessage = error.message 
    const hasNoMsg = errorMessage != undefined && errorMessage

    if (error.code === APIErrorCode.EXPIRED_TOKEN) {
        toastOptions = {
            message: hasNoMsg ? errorMessage : "Token has expired. Log in again to continue.",
            action: {
                label: "Continue session",
                onClick: () => refreshMusicSession()
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
            message: hasNoMsg ? errorMessage : "Token refresh failed. Please try again.",
        }
    }
    else if (error.code === APIErrorCode.AUTHORIZATION_ERROR) {
        toastOptions = {
            message: hasNoMsg ? errorMessage : `${platformStr} authorization failed.`,
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
            message: hasNoMsg ? errorMessage : `There was an error with ${platformStr} Please try again later.` ,
        }
    }

    toast("default", {
        message: platformStr,
        description: toastOptions.message,
        logoIcon: getLogoIconFromEnum(platform, MusicPlatform),
        action: toastOptions.action
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
        propName = "youtubeMusic"
    }
    else {
        propName = MusicPlatform[platFormIdx].toLowerCase() as MusicPlatformPropNames
    }

    return propName as MusicPlatformPropNames
}

/**
 * Check to see if there is an existing music session.
 * Removes additional music-related not previously removed if there wasn't a session.
 * @returns 
 */
export function didInitMusicUser() { 
    const hasData = localStorage.getItem("music-user-data") != null

    //  if no user data, no music-related data must be stored
    if (!hasData) {
        removeAppleMusicTokens()
        removeMusicPlayerData() 
        removeMusicShuffleData() 
    }
    return hasData
}

/* Load */

export function loadMusicUserData(): Partial<AppleMusicUserData | SpotifyMusicUserData> | null {
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

export function saveMusicUserData(newState: AppleMusicUserData | SpotifyMusicUserData) {
    localStorage.setItem("music-user-data", JSON.stringify(newState))
}
export function saveMusicPlayerData(newState: MusicPlayer | SpotifyMusicPlayer) {
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