import { get } from "svelte/store"
import type { MusicPlayer } from "./music-player"
import { initAppleMusic } from "./api-apple-music"
import { AppleMusicPlayer } from "./music-apple-player"
import { musicDataStore, musicPlayerStore, toastMessages } from "./store"

import { APIErrorCode, MusicMediaType, MusicMoodCategory, MusicPlatform, ToastContext, UserLibraryMedia } from "./enums"

import { 
    sereneCollections, acousticCollections, classicalCollections, 
    lofiCollections, soundtrackCollections, summerCollections, 
    upbeatCollections, zenCollections  
} from "$lib/data-music-collections"
import { findEnumIdxFromDiffEnum } from "./utils-general"
import { handleSpotifyMediaItemClicked, initSpotifyMusic, requestSpotifyUserAuth } from "./api-spotify"
import type { AppleMusicUserData } from "./music-apple-user-data"
import type { SpotifyMusicUserData } from "./music-spotify-user-data"
import { APIError } from "./errors"
import type { SpotifyMusicPlayer } from "./music-spotify-player"

export const USER_PLAYLISTS_REQUEST_LIMIT = 10
export const didInitMusicUser = () => loadMusicUserData() != null

/**
 * Called after every refresh. If user has signed up cntinue music session.
 */
export const continueMusicSession = (musicPlatform: MusicPlatform) => {
    musicLogin(musicPlatform, true)
}

/**
 * Attempt to log in user to desired music platform. 
 * Goes through an auth flow process. Called when logging for the first time or after a refresh after a log in.
 * Makes a new music user and player instance.
 * End of error pipeline.
 * 
 * @param platform          Current music streaming platform being used.
 * @param hasUserSignedIn   Has user already logged in before. 
 * @returns                 AsyncResult object.
 */
export const musicLogin = async (platform: MusicPlatform, hasUserSignedIn: boolean = false) => {
    try {
        if (platform === MusicPlatform.AppleMusic) {
            await initAppleMusic(hasUserSignedIn)
        }
        else if (platform === MusicPlatform.Spotify) {
            initSpotifyMusic()
        }

        if (hasUserSignedIn) return

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            context: get(musicDataStore)!.musicPlatform,
            message: "Log in Successful!",
        }])
    }
    catch(error: any) {
        const isSpotifyAuth = platform === MusicPlatform.Spotify && !hasUserSignedIn && error instanceof TypeError
        if  (isSpotifyAuth) return

        if (error instanceof TypeError) {
            alert(error)
            musicAPIErrorHandler(new APIError(APIErrorCode.GENERAL, "There was an en error with the login. Please try again."), platform)
        }
        else {
            musicAPIErrorHandler(error, platform)
        }
    }    
}

/**
 * Called when user logs out of music platform.
 * @returns        AsyncResult object.
 */
export const musicLogout = async (): Promise<AsyncResult> => {
    const musicStore = get(musicDataStore)
    const playerStore = get(musicPlayerStore)

    try {
        musicStore!.quit()
        playerStore!.quitPlayer()
        return { sucess: false }
    }
    catch(error: any) {
        musicAPIErrorHandler(error)
        return { sucess: false }
    }
}

/**
 * Called when user wants to log in again after token has expired.
 * @returns     AsyncResult object.
 */
export const refreshMusicSession = async () => {
    const musicStore = get(musicDataStore)
    try {
        await musicStore!.refreshAccessToken()
        musicStore!.setTokenHasExpired(false)

        toastMessages.update((toasts: ToastMsg[]) => [...toasts, {
            context: musicStore!.musicPlatform,
            message: "Refresh Success!"
        }])
    }
    catch(error: any) {
        musicAPIErrorHandler(error)
    }
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
export const musicAPIErrorHandler = (error: APIError, musicPlatform?: MusicPlatform) => {
    let toastMessage: ToastMsg

    const platform = musicPlatform === undefined ? get(musicDataStore)!.musicPlatform! : musicPlatform
    const toastContext = findEnumIdxFromDiffEnum(platform!, MusicPlatform, ToastContext)!

    console.error(error)

    if (error.code === APIErrorCode.EXPIRED_TOKEN) {
        toastMessage = {
            context: toastContext,
            message: "Token has expired. Log in again to continue.",
            action: {
                msg: "Continue session",
                func: () => refreshMusicSession()
            }
        }
    }
    else if (error.code === APIErrorCode.FAILED_TOKEN_REFRESH) {
        toastMessage = {
            context: toastContext,
            message: "There was an error continuing session. Log in again to continue.",
            action: {
                msg: "Continue session",
                func: () => requestSpotifyUserAuth()
            }
        }
    }
    else if (error instanceof TypeError) {
        toastMessage = {
            context: toastContext,
            message: "There was an error with Spotify. Please try again."
        }
    }
    else {
        toastMessage = {
            context: toastContext,
            message: error.message
        }
    }

    toastMessages.update(() => [toastMessage])
}

/**
 * Set collection as current collection & lay the first track of the collection item clicked.
 * 
 * @param collection      Media the user has clicked on.
 * @returns               AsyncResult object
 */
export const handlePlaylistItemClicked = async (media: Media) => {
    const musicData = get(musicDataStore)
    const musicPlayer = get(musicPlayerStore)

    if (musicData!.musicPlatform === MusicPlatform.Spotify) {
        handleSpotifyMediaItemClicked(media)
        return
    }

    if (media.id === musicPlayer!.mediaCollection?.id) {
        musicPlayer!.removeCurrentMedia()
    }

    try {
        musicPlayer!.updateCurrentMediaAndPlay(media)
    }
    catch(error: any) {
        musicAPIErrorHandler(error)
    }
}

/**
 * Scroll handler for user playlists list component that has pagination.
 * Requests for more user playlists once scrolled down far enough.
 * @param event 
 */
export const userPlsPaginationScrollHandler = async (event: Event) => {
    const list = event.target as HTMLElement
    const scrollTop = list.scrollTop
    const scrollHeight = list!.scrollHeight 
    const clientHeight = list!.clientHeight 
    const hasReachedEnd = scrollTop >= scrollHeight - clientHeight
    
    if (!hasReachedEnd) return

    try {
        await requestMoreLibraryItemsHandler()
    }
    catch(error: any) {
        musicAPIErrorHandler(error)
    }
}

async function requestMoreLibraryItemsHandler() {
    const music = get(musicDataStore)!
    const musicPlatform = music.musicPlatform

    if (musicPlatform === MusicPlatform.AppleMusic) {
        const appleMusicData = music as AppleMusicUserData
        if (appleMusicData!.hasFetchedAllUserPls) {
            return
        }
        
        await appleMusicData!.fetchMoreUserPlaylists()
    }
    else if (musicPlatform === MusicPlatform.Spotify) {
        const spotifyMusicData = music as SpotifyMusicUserData
        await spotifyMusicData.getMoreLibraryItems()
    }
}

/**
 * Scroll handler for discover media lists list component that has pagination.
 * Requests for more discover media lists once scrolled down far enough.
 * @param event 
 */
export const discoverPlsPaginationScrollHandler = async (event: Event) => {
    const list = event.target as HTMLElement
    const scrollTop = list.scrollTop
    const scrollHeight = list!.scrollHeight 
    const clientHeight = list!.clientHeight 
    const hasReachedEnd = scrollTop >= scrollHeight - clientHeight
    
    if (!hasReachedEnd) return

    try {
        // hasCollectionItemsLoaded = false
        // await: fetch more discover media lists
        // hasCollectionItemsLoaded = true
    }
    catch(error: any) {
        musicAPIErrorHandler(error)
    }
}

export function getMediaDescription(media: Media): string {
    const _media: any = media

    if ("description" in media) {
        return _media.description ?? ""
    }

    return "-"
}

export function getMediaLength(media: Media): string {
    const _media: any = media

    if ("length" in media) {
        const length = _media.length
        return length > 100 ? "100+" : length
    }

    return "-"
}

/**
 * Returns the music media items under a discover / mood category based on the current platform.
 * 
 * @param moodTitle     Current collection title
 * @param platformProp  To string index platform property name from DiscoverCollection
 * @returns             Music media items under given mood category.
 */
export const getDiscoverCollectionList = (discoverCategory: MusicMoodCategory, platformProp: MusicPlatformPropNames): Media[] => {
    switch (discoverCategory) {
        case MusicMoodCategory.Serene:
            return sereneCollections[platformProp]
        case MusicMoodCategory.Lofi:
            return lofiCollections[platformProp]
        case MusicMoodCategory.Upbeat:
            return upbeatCollections[platformProp]
        case MusicMoodCategory.Soundtracks:
            return soundtrackCollections[platformProp]
        case MusicMoodCategory.Acoustic:
            return acousticCollections[platformProp]
        case MusicMoodCategory.Classical:
            return classicalCollections[platformProp]
        case MusicMoodCategory.Zen:
            return zenCollections[platformProp]
        case MusicMoodCategory.Summer:
            return summerCollections[platformProp]
    }
}

export function getLibraryItemDescription(mediaItem: Media) {
    const _mediaItem = mediaItem as any

    if ("description" in mediaItem) {
        return _mediaItem.description
    }

    return ""
}

export function getLibraryMediaItemInfo(media: Media, type: UserLibraryMedia): any {
    const _media = media as any

    if (type === UserLibraryMedia.LikedTracks) {
        return { artist: media.author, album: _media.album }
    }
    else if (type === UserLibraryMedia.Audiobooks) {
        return { author: media.author }
    }
    else if (type === UserLibraryMedia.PodcastEps) {
        return { show: media.author, description: _media.description }
    }
    else if (type === UserLibraryMedia.Playlists) {
        return { owner: media.author, length: _media.length, description: _media.description }
    }
    else if (type === UserLibraryMedia.Albums) {
        return { artist: media.author }
    }

    return null
}

export function getLibraryMediaTitle(media: Media, type: UserLibraryMedia) {
    const _media = media as any

    if (type === UserLibraryMedia.LikedTracks) {
        return `"${media.name}" by ${media.author} from "${_media.album}"`
    }
    else if (type === UserLibraryMedia.Audiobooks) {
        return `"${media.name}" written by ${media.author}`
    }
    else if (type === UserLibraryMedia.PodcastEps) {
        return `"${media.name}" from show: "${_media.show}" ${_media.description != "" ? `. Description: ${_media.description}` : ""}`
    }
    else if (type === UserLibraryMedia.Playlists) {
        return `"${media.name}" by ${media.author} ${_media.description != "" ? `. Description: ${_media.description}` : ""}`
    }
    else if (type === UserLibraryMedia.Albums) {
        return `"${media.name}" by ${_media.author}`
    }

    return ""
}

/**
 * Based on current platform being used, get the proper platform 
 * ...property of the discover collection object item.
 * 
 * @param platFormIdx  Enum platform index
 * @returns            Music Discover Property name of current platform
 */
export const getPlatformNameForDiscoverObj = (platFormIdx: MusicPlatform): MusicPlatformPropNames => {
    let platform = MusicPlatform[platFormIdx].toLowerCase()
    platform = platform === "applemusic" ? "appleMusic" : platform

    return platform as MusicPlatformPropNames
}

export function hasUserSignedIn() {
    return localStorage.getItem("music-user-data") != null
}

/* Load */
export const loadMusicUserData = (): Partial<AppleMusicUserData | SpotifyMusicUserData> | null => {
    if (!localStorage.getItem("music-user-data")) return null
    
    return JSON.parse(localStorage.getItem("music-user-data")!)
} 
export const loadMusicPlayerState = (): MusicPlayer | null => {
    if (!localStorage.getItem("music-player-data")) return null
    
    return JSON.parse(localStorage.getItem("music-player-data")!)
} 
export const loadMusicShuffleData = (): MusicShufflerData => {
    return JSON.parse(localStorage.getItem("music-shuffle-data")!)
}

/* Updates */

/**
 * Incorporates changes to currently-saved user data
 * @param userData   New data changes.
 */
export const saveMusicUserData = (userData: Partial<AppleMusicUserData | SpotifyMusicUserData>) => {
    const prevData = loadMusicUserData()

    if (prevData) {
        localStorage.setItem("music-user-data", JSON.stringify({ ...prevData, ...userData }))
    }
    else {
        localStorage.setItem("music-user-data", JSON.stringify(userData))
    }
}
export const saveMusicPlayerData = (playerState: Partial<MusicPlayer | SpotifyMusicPlayer>) => {
    localStorage.setItem("music-player-data", JSON.stringify(playerState))
}
export const saveMusicShuffleData = (shuffleData: MusicShufflerData) => {
    return localStorage.setItem("music-shuffle-data", JSON.stringify(shuffleData))
}

/* Removals */
export const deleteMusicUserData = (): void => {
    localStorage.removeItem("music-user-data")
}
export const removeAppleMusicTokens = () => {
    localStorage.removeItem("music.y5xn9fm7bj.itua")
    localStorage.removeItem("music.y5xn9fm7bj.itre")
    localStorage.removeItem("music.y5xn9fm7bj.media-user-token")
    localStorage.removeItem("mk-player-tsid")
}
export const removeMusicPlayerData = (): void => {
    localStorage.removeItem("music-player-data")
}
export const removeMusicShuffleData = (): void => {
    localStorage.removeItem("music-shuffle-data")
}